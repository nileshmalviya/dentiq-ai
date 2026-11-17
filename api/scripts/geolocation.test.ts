import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import { models } from '../src/models/resource.model.js';
import { repositories } from '../src/container/repositories.js';
import { ClinicSearchRepository, clinicSearchPipeline } from '../src/repositories/clinic-search.repository.js';
import { DoctorSearchService } from '../src/services/doctor-search.service.js';
import { ClinicLocationService, confirmedClinicPoint } from '../src/services/clinic-location.service.js';
import { DoctorRegistrationService } from '../src/services/doctorRegistration.service.js';
import { DoctorRegistrationRepository } from '../src/repositories/doctorRegistration.repository.js';
import type { EmailVerificationService } from '../src/services/emailVerification.service.js';
import type { RegistrationEmailSender } from '../src/interfaces/registration/contracts.js';
import { doctorSearchQuerySchema, geoPointSchema, confirmedClinicLocationSchema } from '../src/validations/location.validation.js';
import { createApp } from '../src/app.js';
import { readEnv } from '../src/config/env.js';
import { AppointmentService } from '../src/services/appointment.service.js';
import { work } from '../src/container/repositories.js';

test('Coordinate validation, confirmation and geoNear stage placement', () => {
  assert.deepEqual(confirmedClinicPoint({latitude:22.7196,longitude:75.8577,confirmed:true}),{type:'Point',coordinates:[75.8577,22.7196]});
  for(const bad of [{latitude:91,longitude:0,confirmed:true},{latitude:0,longitude:181,confirmed:true},{latitude:0,longitude:0,confirmed:false}])assert.equal(confirmedClinicLocationSchema.safeParse(bad).success,false);
  assert.equal(geoPointSchema.safeParse({type:'Point',coordinates:[0,0]}).success,true);
  assert.equal(geoPointSchema.safeParse({type:'Point',coordinates:[0,0,0]}).success,false);
  assert.equal(geoPointSchema.safeParse({type:'Point',coordinates:[0,100]}).success,false);
  for(const bad of [{latitude:'',longitude:'0'},{latitude:'Infinity',longitude:'0'},{latitude:'1'}, {latitude:'1',longitude:'2',city:'Indore'}, {latitude:'1',longitude:'2',page:'1.5'}, {latitude:['1'],longitude:'2'}, {latitude:'1',longitude:'2',radiusKm:'501'}])assert.equal(doctorSearchQuerySchema.safeParse(bad).success,false);
  const query=doctorSearchQuerySchema.parse({latitude:'22.7196',longitude:'75.8577'});
  const pipeline=clinicSearchPipeline({...query,doctorFilter:{status:'Active'}});
  assert.ok('$geoNear' in pipeline[0]);assert.ok(pipeline.some(stage=>'$facet' in stage));assert.ok(pipeline.some(stage=>'$group' in stage));
});

test('Real MongoDB geospatial search, persistence, ownership and privacy', {timeout:300000}, async t => {
  const mongo=await MongoMemoryReplSet.create({binary:{downloadDir:fileURLToPath(new URL('../../artifacts/mongodb-binaries',import.meta.url))},instanceOpts:[{launchTimeout:60000}],replSet:{count:1}});
  let server: ReturnType<ReturnType<typeof createApp>['listen']> | undefined;
  try {
    await mongoose.connect(mongo.getUri(),{dbName:'dentiq_geolocation_test',autoIndex:false});
    for(const model of Object.values(models))await model.createIndexes();
    const point=(longitude:number,latitude=22.7196)=>({type:'Point',coordinates:[longitude,latitude]});
    await models.clinics.create([
      {id:'c0',name:'Central Clinic',city:'Indore',address:'Central Road',state:'MP',postalCode:'452001',status:'Active',location:point(75.8577)},
      {id:'c1',name:'Nearby Clinic',city:'Indore',address:'Near Road',state:'MP',postalCode:'452001',status:'Active',location:point(75.8677)},
      {id:'c2',name:'Far Clinic',city:'Indore',address:'Far Road',status:'Active',location:point(75.9577)},
      {id:'c-inactive',name:'Inactive Clinic',city:'Indore',status:'Inactive',location:point(75.8577)},
      {id:'c-no-location',name:'Existing Clinic',city:'Indore',address:'Old Road',status:'Active'},
    ]);
    const doctor=(id:string,clinicId:string,extra:Record<string,unknown>={})=>({id,userId:'u-'+id,name:'Dr. '+id,email:id+'@example.com',specialty:'General Dentist',qualification:'BDS',experience:10,fee:500,rating:4.5,clinicId,clinic:clinicId,status:'Active',approvalStatus:'APPROVED',availability:Array.from({length:7},(_,i)=>({day:i+1,times:['10:00','10:30']})),...extra});
    await models.doctors.create([
      doctor('d0','c0'),doctor('d1','c1'),doctor('d2','c2'),doctor('multi','c2'),doctor('ortho','c1',{specialty:'Orthodontist'}),
      doctor('inactive','c-inactive'),doctor('pending','c0',{approvalStatus:'PENDING'}),doctor('unverified','c0',{registrationManaged:true,emailVerificationStatus:'UNVERIFIED'}),
      doctor('disabled','c0',{clinicalServicesEnabled:false}),doctor('legacy','c0',{approvalStatus:undefined}),doctor('unlocated','c-no-location'),
    ]);
    await models['doctor-clinics'].create({id:'multi-nearby',doctorId:'multi',clinicId:'c1',isPrimary:false,status:'ACTIVE'});
    const service=new DoctorSearchService(new ClinicSearchRepository(repositories.clinics),repositories,100);
    const query={latitude:'22.7196',longitude:'75.8577',radiusKm:'20',page:'1',limit:'50'};
    await t.test('Sparse index keeps old clinics valid; nearest matches are sorted and deduplicated',async()=>{
      assert.equal((await models.clinics.findOne({id:'c-no-location'}).lean<Record<string, any>>())!.location,undefined);
      const indexes=await models.clinics.collection.indexes();assert.ok(indexes.some(index=>index.key.location==='2dsphere'));
      const result=await service.search(query), ids=result.data.map(row=>row.id);
      assert.equal(ids[0],'d0');assert.equal(new Set(ids).size,ids.length);assert.equal(ids.length,6);
      for(let i=1;i<result.data.length;i++)assert.ok(result.data[i].distanceKm! >= result.data[i-1].distanceKm!);
      assert.equal(result.data.find(row=>row.id==='multi')!.clinicId,'c1');
      assert.ok(Math.abs(result.data.find(row=>row.id==='d1')!.distanceKm!-1.03)<0.03);
      assert.ok(ids.includes('legacy')); // Existing active imported doctors remain approved by project policy.
      for(const excluded of ['inactive','pending','unverified','disabled','unlocated'])assert.ok(!ids.includes(excluded));
      assert.ok(!JSON.stringify(result).includes('coordinates'));
    });
    await t.test('Radius, specialty, search, pagination and alternative sorting work in MongoDB',async()=>{
      assert.deepEqual((await service.search({...query,radiusKm:'0.5'})).data.map(row=>row.id),['d0','legacy']);
      assert.deepEqual((await service.search({...query,specialization:'Orthodont'})).data.map(row=>row.id),['ortho']);
      assert.equal((await service.search({...query,search:'.*'})).data.length,0);
      const one=await service.search({...query,limit:'2'}), two=await service.search({...query,limit:'2',page:'2'});
      assert.equal(one.pagination.totalRecords,6);assert.equal(one.pagination.totalPages,3);assert.equal(one.data.length,2);
      assert.equal(two.data.length,2);assert.ok(one.data.every(a=>two.data.every(b=>a.id!==b.id)));
      assert.equal((await service.search({...query,page:'999'})).data.length,0);
      assert.equal((await service.search({...query,sort:'rating'})).data.length,6);
      await assert.rejects(service.search({...query,radiusKm:'101'}),/allowed maximum/);
    });
    await t.test('Manual city fallback works without coordinates and search has no persistence',async()=>{
      const result=await service.search({city:'Indore',limit:'50'});
      assert.ok(result.data.some(row=>row.id==='unlocated'));assert.ok(result.data.every(row=>row.distanceKm===undefined));
      assert.equal(await models.recommendations.countDocuments(),0);assert.equal(await models.messages.countDocuments(),0);assert.equal(await models.conversations.countDocuments(),0);
    });
    await t.test('Clinic edits require approval, ownership and explicit confirmation',async()=>{
      const locations=new ClinicLocationService(repositories),actor={id:'u-d0',role:'DOCTOR' as const,doctorId:'d0'};
      const data={latitude:22.7196,longitude:75.8577,confirmed:true,address:'Confirmed Clinic Address',city:'Indore',state:'MP',postalCode:'452001'};
      await assert.rejects(locations.update({...actor,role:'PATIENT'},'c0',data),/Doctor access/);
      await assert.rejects(locations.update({...actor,id:'u-pending',doctorId:'pending'},'c0',data),/approved doctor/);
      await assert.rejects(locations.update(actor,'c1',data),/cannot update/);
      await assert.rejects(locations.update(actor,'c0',{...data,confirmed:false}));
      await locations.update(actor,'c0',data);
      assert.deepEqual((await models.clinics.findOne({id:'c0'}).lean<Record<string, any>>())!.location.coordinates,[75.8577,22.7196]);
      assert.equal((await models.doctors.findOne({id:'d0'}).lean<Record<string, any>>())!.location,undefined);
      assert.equal((await locations.list({id:'u-multi',role:'DOCTOR',doctorId:'multi'})).length,2);
    });
    await t.test('Registration saves one confirmed clinic point while retaining OTP and approval state',async()=>{
      const registrations=new DoctorRegistrationService(repositories,new DoctorRegistrationRepository(),{send:async()=>({})} as unknown as EmailVerificationService,{assertConfigured:()=>{}} as RegistrationEmailSender);
      const data={personal:{firstName:'Geo',lastName:'Test',email:'geo-test@example.com',phone:'9000000001',country:'India',state:'MP',city:'Indore',postalCode:'452001',address:'Test Address'},professional:{registrationNumber:'GEO-TEST-123',registrationCouncil:'Test Council',registrationState:'MP',registrationDate:'2020-01-01',doctorCategory:'Dentist',specialization:'General Dentist',primaryQualification:'BDS',institution:'Test College',graduationYear:2010,experience:10,bio:'Test dentist',languages:['English'],consultationTypes:['In Person'],consultationFee:500,treatments:['Consultation']},clinic:{name:'Registered Geo Clinic',type:'Private Clinic',email:'geo-clinic@example.com',phone:'9000000002',address:'Registered Address',city:'Indore',state:'MP',country:'India',postalCode:'452001',openingTime:'09:00',closingTime:'18:00',workingDays:['Monday'],slotDuration:'30',consultationFee:500},password:'GeoTestPassword123!',confirmPassword:'GeoTestPassword123!',clinicLocation:{latitude:22.7196,longitude:75.8577,confirmed:true}};
      const result=await registrations.register(data),application=await models['doctor-registrations'].findOne({id:result.registrationId}).lean<Record<string, any>>();
      const clinic=await models.clinics.findOne({id:application!.clinicId}).lean<Record<string, any>>();
      assert.deepEqual(clinic!.location.coordinates,[75.8577,22.7196]);assert.equal(application!.clinicLocation,undefined);assert.equal(application!.clinic.location,undefined);
      const registered=await models.doctors.findOne({id:application!.doctorId}).lean<Record<string, any>>();assert.equal(registered!.approvalStatus,'DRAFT');assert.equal(registered!.status,'Under Review');
      assert.ok(!(await service.search(query)).data.some(row=>row.id===registered!.id));
    });
    await t.test('Secondary-clinic availability preserves the requested clinic and rejects unrelated clinics',async()=>{
      const appointments=new AppointmentService('appointments',repositories,work);
      const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
      assert.equal((await appointments.availability('multi',tomorrow,'c1')).doctor.clinicId,'c1');
      assert.equal((await appointments.availability('multi',tomorrow)).doctor.clinicId,'c2');
      await assert.rejects(appointments.availability('d0',tomorrow,'c2'),/Clinic not available/);
    });
    await t.test('Public route is mounted correctly, validates without echoing location, and disables caching',async()=>{
      const env=readEnv({MONGODB_URI:mongo.getUri(),JWT_ACCESS_SECRET:'a'.repeat(40),JWT_REFRESH_SECRET:'b'.repeat(40),CLIENT_URL:'http://localhost:5173'});
      server=createApp(env).listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}/api/v1`;
      const response=await fetch(`${base}/public/doctors/nearby?${new URLSearchParams(query)}`),body=await response.json();
      assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(body.success,true);assert.ok(body.pagination);
      const invalid=await fetch(`${base}/public/doctors/nearby?latitude=999&longitude=75.8577`),error=await invalid.text();assert.equal(invalid.status,400);assert.ok(!error.includes('999'));assert.ok(!error.includes('75.8577'));
      assert.equal((await fetch(`${base}/doctor/clinic-locations`)).status,401);
      await models.users.create({id:'u-d0',name:'Test Doctor',email:'owner@example.com',passwordHash:'test',role:'DOCTOR',status:'Active',doctorId:'d0',clinicId:'c0'});
      const token=jwt.sign({},env.JWT_ACCESS_SECRET,{subject:'u-d0',issuer:'dentiq',audience:'dentiq-api',expiresIn:'5m'});
      const update=await fetch(`${base}/doctor/clinic-locations/c0`,{method:'PATCH',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({latitude:22.7196,longitude:75.8577,confirmed:true,address:'HTTP Clinic',city:'Indore',state:'MP',postalCode:'452001'})});
      assert.equal(update.status,200);
    });
  } finally { if(server)await new Promise<void>(resolve=>server!.close(()=>resolve()));await mongoose.disconnect();await mongo.stop(); }
});

const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const en=require('../src/i18n/locales/en.json'),hi=require('../src/i18n/locales/hi.json');
const base=process.env.PATIENT_TEST_URL||'http://localhost:5173';
const doctor={id:'geo-doctor',doctorId:'geo-doctor',name:'Dr. Nearby Dentist',specialty:'General Dentist',specialization:'General Dentist',clinicId:'near-clinic',clinic:'Nearby Dental Clinic',clinicName:'Nearby Dental Clinic',clinicAddress:'Clinic Road, Indore',distanceKm:1.03,rating:4.8,reviews:25,experience:12,fee:500,photo:'/assets/doctor-arjun.png',nextAvailable:'No slots in the next 7 days',qualification:'BDS',languages:'English, Hindi',about:'Test dentist',treatments:['Consultation'],doctorReviews:[]};
async function apiMocks(page,{role=null}={}) {
 const calls=[],writes=[];
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1','');
  calls.push({path,query:Object.fromEntries(url.searchParams),method:req.method()});
  const reply=(data,status=200,pagination)=>route.fulfill({status,json:{success:status<400,message:status<400?'OK':'Not signed in',data,...(pagination?{pagination}:{})}});
  if(path==='/auth/refresh')return reply(role?{accessToken:'test-token'}:null,role?200:401);
  if(path==='/auth/me'||path==='/doctor/settings')return reply({id:'test-user',name:'Test Doctor',email:'doctor@example.com',role:role||'PATIENT',doctorId:doctor.id,approvalStatus:'APPROVED',registrationManaged:false});
  if(path==='/public/doctors/nearby')return reply([{...doctor,...(url.searchParams.has('city')?{distanceKm:undefined}:{})}],200,{page:Number(url.searchParams.get('page')||1),limit:10,totalRecords:11,totalPages:2,hasNextPage:!url.searchParams.has('page')||url.searchParams.get('page')==='1',hasPreviousPage:url.searchParams.get('page')==='2'});
  if(path==='/recommendations/doctors')return reply({doctors:[doctor],guidance:{emergency:false,specializations:['General'],summaryKey:'guidance.general',summary:en['guidance.general'],doctorIds:[doctor.id]}});
  if(path==='/public/doctors/'+doctor.id)return reply(doctor);
  if(path.endsWith('/availability')){const date=url.searchParams.get('date');return reply({timezone:'Asia/Kolkata',slots:[{startTime:`${date}T10:00:00.000Z`,endTime:`${date}T10:30:00.000Z`,label:'3:30 PM'}]});}
  if(path==='/public/appointments'){writes.push({path,data:req.postDataJSON()});return reply({id:'test-booking'});}
  if(path==='/doctor/clinic-locations')return reply([{id:'near-clinic',name:'Nearby Dental Clinic',address:'Clinic Road',city:'Indore',state:'MP',postalCode:'452001'}]);
  if(path==='/doctor/clinic-locations/near-clinic'){writes.push({path,data:req.postDataJSON()});return reply({id:'near-clinic',name:'Nearby Dental Clinic',...req.postDataJSON()});}
  return reply([]);
 });
 return {calls,writes};
}
async function storageHasNoCoordinates(page) {
 const data=await page.evaluate(()=>JSON.stringify({local:Object.entries(localStorage),session:Object.entries(sessionStorage),cookies:document.cookie,url:location.href}));
 assert.ok(!/22\.7196|75\.8577|latitude|longitude|coordinates/.test(data));
}
async function run() {
 const browser=await chromium.launch({headless:true});let checks=0;
 try {
  for(const language of ['en','hi']) {
   const catalog=language==='hi'?hi:en;
   const context=await browser.newContext({viewport:{width:390,height:844},geolocation:{latitude:22.7196,longitude:75.8577},permissions:['geolocation']});
   await context.addInitScript(language=>{localStorage.setItem('dentiq-patient-language',language);window.locationRequests=0;const request=navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);navigator.geolocation.getCurrentPosition=(...args)=>{window.locationRequests++;return request(...args);};navigator.geolocation.watchPosition=()=>{throw new Error('Continuous tracking is forbidden');};},language);
   const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));const {calls,writes}=await apiMocks(page);
   await page.goto(base+'/patient/recommendations?nearby=1');
   await page.getByRole('heading',{name:catalog['Find Doctors Near Me'],exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>window.locationRequests),0);assert.equal(calls.filter(c=>c.path.endsWith('/nearby')).length,0);
   await page.getByRole('button',{name:catalog['Use My Current Location'],exact:true}).click();
   await page.getByRole('link',{name:catalog['View Profile'],exact:true}).waitFor();
   const request=calls.find(c=>c.path.endsWith('/nearby'));assert.equal(request.query.latitude,'22.7196');assert.equal(request.query.longitude,'75.8577');assert.equal(request.query.sort,'distance');assert.equal(await page.evaluate(()=>window.locationRequests),1);
   await storageHasNoCoordinates(page);
   await page.getByLabel(catalog.Specialization,{exact:true}).selectOption('Orthodont');
   await page.waitForResponse(response=>response.url().includes('specialization=Orthodont'));
   await page.getByLabel(catalog.Specialization,{exact:true}).selectOption('');
   await page.getByRole('link',{name:catalog['View Profile'],exact:true}).waitFor();
   await page.getByRole('button',{name:catalog['Next page'],exact:true}).click();
   await page.waitForResponse(response=>response.url().includes('page=2'));
   await page.getByRole('link',{name:catalog['View Profile'],exact:true}).waitFor();
   for(const width of [390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${language} ${width}`);}
   fs.mkdirSync('artifacts/geolocation',{recursive:true});await page.screenshot({path:`artifacts/geolocation/nearby-${language}.png`,fullPage:true});
   await page.getByRole('link',{name:catalog['View Profile'],exact:true}).click();assert.ok(page.url().includes('clinic=near-clinic'));
   await page.getByRole('link',{name:catalog['Book Appointment'],exact:true}).click();assert.ok(page.url().includes('clinic=near-clinic'));
   await page.locator('.time-options button').first().click();await page.getByRole('button',{name:catalog['Confirm Booking'],exact:true}).click();
   const modal=page.getByRole('dialog');await modal.locator('[name=name]').fill('Test Patient');await modal.locator('[name=email]').fill('patient@example.com');await modal.locator('[name=phone]').fill('9000000001');await modal.getByRole('button',{name:catalog['Confirm booking'],exact:true}).click();await page.getByText(catalog['Booking confirmed!'],{exact:true}).waitFor();
   assert.equal(writes[0].data.clinicId,'near-clinic');assert.ok(!/latitude|longitude|coordinates/.test(JSON.stringify(writes)));
   await page.goto(base+'/patient/recommendations?nearby=1');await page.getByRole('heading',{name:catalog['Find Doctors Near Me'],exact:true}).waitFor();assert.equal(await page.locator('.doctor-results .doctor-card').count(),0);
   await page.getByRole('button',{name:catalog['Use My Current Location'],exact:true}).click();await page.getByRole('link',{name:catalog['View Profile'],exact:true}).waitFor();
   await page.getByRole('button',{name:catalog['Clear location and results'],exact:true}).click();assert.equal(await page.locator('.doctor-results .doctor-card').count(),0);await storageHasNoCoordinates(page);
   assert.deepEqual(errors,[]);await context.close();checks++;console.log(`PASS ${language}: explicit geolocation, filters, pagination, selected-clinic booking, cleanup, privacy and responsive layout`);
  }
  for(const code of [1,2,3,'unsupported']) {
   const context=await browser.newContext({viewport:{width:390,height:844}});
   await context.addInitScript(code=>{if(code==='unsupported')Object.defineProperty(navigator,'geolocation',{value:undefined,configurable:true});else navigator.geolocation.getCurrentPosition=(_ok,error)=>error({code});},code);
   const page=await context.newPage();page.setDefaultTimeout(15000);const {calls}=await apiMocks(page);await page.goto(base+'/patient/recommendations?nearby=1');
   await page.getByRole('button',{name:'Use My Current Location',exact:true}).click();await page.getByRole('alert').first().waitFor();assert.equal(calls.filter(c=>c.path.endsWith('/nearby')).length,0);
   await page.getByLabel('City or locality',{exact:true}).fill('Indore');await page.getByRole('button',{name:'Search by city',exact:true}).click();await page.getByRole('link',{name:'View Profile',exact:true}).waitFor();
   const cityCall=calls.find(c=>c.path.endsWith('/nearby'));assert.equal(cityCall.query.city,'Indore');assert.equal(cityCall.query.latitude,undefined);assert.equal(cityCall.query.longitude,undefined);
   // Repeating a manual search must refetch instead of clearing the results indefinitely.
   const before=calls.filter(c=>c.path.endsWith('/nearby')).length;await page.getByRole('button',{name:'Search by city',exact:true}).click();await page.getByRole('link',{name:'View Profile',exact:true}).waitFor();assert.ok(calls.filter(c=>c.path.endsWith('/nearby')).length>before);
   await storageHasNoCoordinates(page);await page.getByRole('button',{name:'Continue without location',exact:true}).click();await page.getByRole('link',{name:'View & book',exact:true}).waitFor();
   await context.close();checks++;console.log(`PASS geolocation ${code}: manual city fallback and existing recommendations`);
  }
  const context=await browser.newContext({geolocation:{latitude:22.7196,longitude:75.8577},permissions:['geolocation']});
  const page=await context.newPage();page.setDefaultTimeout(15000);const {writes}=await apiMocks(page,{role:'DOCTOR'});await page.goto(base+'/doctor/settings');
  await page.getByRole('button',{name:'Use My Current Location',exact:true}).click();await page.getByLabel('Latitude',{exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('input[type=number][min="-90"]')?.value==='22.7196');
  const confirmation=page.getByLabel('I confirm these coordinates represent the actual clinic location.',{exact:true});assert.equal(await confirmation.isChecked(),false);
  await page.getByRole('button',{name:'Save clinic location',exact:true}).click();await page.getByText('Confirm that these coordinates represent the actual clinic.',{exact:true}).waitFor();assert.equal(writes.length,0);
  await page.getByLabel('Latitude',{exact:true}).fill('22.72');await confirmation.check();await page.getByLabel('Longitude',{exact:true}).fill('75.86');assert.equal(await confirmation.isChecked(),false);await confirmation.check();await page.getByRole('button',{name:'Save clinic location',exact:true}).click();await page.getByText('Clinic location saved.',{exact:true}).waitFor();
  assert.equal(writes[0].data.latitude,22.72);assert.equal(writes[0].data.longitude,75.86);assert.equal(writes[0].data.confirmed,true);assert.equal(await page.locator('.patient-language-switcher').count(),0);await context.close();checks++;console.log('PASS doctor settings: explicit capture, correction, required reconfirmation, clinic update');
  const {registrationCatalog}=await import('../../api/dist/src/constants/doctorRegistration.js');
  const registrationContext=await browser.newContext({geolocation:{latitude:22.7196,longitude:75.8577},permissions:['geolocation']});
  const registrationPage=await registrationContext.newPage();registrationPage.setDefaultTimeout(15000);let application;
  await registrationPage.route('**/api/v1/**',async route=>{
   const request=route.request(),path=new URL(request.url()).pathname.replace('/api/v1','');
   const reply=(data,status=200)=>route.fulfill({status,json:{success:status<400,data,message:'OK'}});
   if(path==='/auth/refresh')return reply(null,401);
   if(path==='/doctor-registration/config')return reply(registrationCatalog);
   if(path==='/doctor-registration'&&request.method()==='POST'){application=request.postDataJSON();return reply({registrationId:'test-registration',message:'Account created. Verify your email to continue.'});}
   if(path==='/auth/login')return reply({accessToken:'test-token',user:{id:'new-doctor',name:'Test Doctor',email:'doctor@example.com',role:'DOCTOR',registrationManaged:true,doctorAccess:false,emailVerified:false,approvalStatus:'DRAFT'}});
   if(path==='/doctor-registration/me')return reply({emailVerified:false,application:{},documents:[],missingDocuments:[],audit:[],otp:null});
   return reply({});
  });
  await registrationPage.goto(base+'/doctor/register');
  await registrationPage.locator('#file-PROFILE_PHOTO').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.from('test-photo')});
  await registrationPage.getByRole('button',{name:'Continue',exact:true}).click();
  await registrationPage.getByRole('button',{name:'Continue',exact:true}).click();
  await registrationPage.getByRole('heading',{name:'Clinic Location',exact:true}).waitFor();
  await registrationPage.getByRole('button',{name:'Use My Current Location',exact:true}).click();
  await registrationPage.waitForFunction(()=>document.querySelector('input[type=number][min="-90"]')?.value==='22.7196');
  await registrationPage.getByRole('button',{name:'Continue',exact:true}).click();
  await registrationPage.getByText('Confirm that these coordinates represent the actual clinic.',{exact:true}).waitFor();
  await registrationPage.getByLabel('I confirm these coordinates represent the actual clinic location.',{exact:true}).check();
  await registrationPage.getByRole('button',{name:'Continue',exact:true}).click();
  for(const id of ['COUNCIL_CERTIFICATE','DEGREE_CERTIFICATE'])await registrationPage.locator('#file-'+id).setInputFiles({name:'certificate.pdf',mimeType:'application/pdf',buffer:Buffer.from('test-certificate')});
  await registrationPage.getByRole('button',{name:'Continue',exact:true}).click();await registrationPage.getByRole('button',{name:'Create doctor account',exact:true}).click();
  await registrationPage.getByRole('heading',{name:'Verify your email',exact:true}).waitFor();
  assert.deepEqual(application.clinicLocation,{latitude:22.7196,longitude:75.8577,confirmed:true});assert.equal(application.clinic.latitude,undefined);
  await registrationContext.close();checks++;console.log('PASS doctor registration: GPS capture, required confirmation, existing signup payload and OTP handoff');
  console.log(`${checks} geolocation browser scenarios passed. API writes mocked; no Atlas records changed.`);
 } finally {await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});

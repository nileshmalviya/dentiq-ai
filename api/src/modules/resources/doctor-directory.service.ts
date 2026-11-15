import { DateTime } from 'luxon';
import type { Row } from '../../common/types/index.js';
import type { Repositories } from './resource.service.js';
import { publicDoctor } from './resource.validation.js';
// Derive public availability in one bounded aggregation for the displayed doctors.
export async function presentDoctors(repos:Repositories,doctors:Row[]){
 if(!doctors.length)return [];
 const now=DateTime.utc(),until=now.plus({days:8});
 const [clinics,occupied]=await Promise.all([repos.clinics.findMany({filter:{id:{$in:[...new Set(doctors.map(d=>d.clinicId))]}},sort:{id:1},skip:0,limit:100}),repos.appointments.aggregate([{$match:{doctorId:{$in:doctors.map(d=>d.id)},startTime:{$gte:now.toISO(),$lt:until.toISO()},status:{$ne:'Cancelled'}}},{$group:{_id:'$doctorId',starts:{$addToSet:'$startTime'}}}])]);
 return doctors.map(doctor=>{const clinic=clinics.find(c=>c.id===doctor.clinicId),zone=clinic?.timezone||'Asia/Kolkata',local=now.setZone(zone),taken=new Set(occupied.find(row=>row._id===doctor.id)?.starts||[]);let nextAvailable='No slots in the next 7 days';
 for(let index=0;index<7;index++){const day=local.plus({days:index});const times=(doctor.availability||[]).find((entry:{day:number})=>entry.day===day.weekday)?.times||[];const slots=times.map((time:string)=>DateTime.fromISO(`${day.toISODate()}T${time}`,{zone})).filter((time:DateTime)=>time.isValid&&time>now&&!taken.has(time.toUTC().toISO())).sort((a:DateTime,b:DateTime)=>a.toMillis()-b.toMillis());if(slots.length){nextAvailable=`${index===0?'Today':slots[0].toFormat('ccc d LLL')}, ${slots[0].toFormat('h:mm a')}`;break;}}
 return {...publicDoctor(doctor),nextAvailable};});
}

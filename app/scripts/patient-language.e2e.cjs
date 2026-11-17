const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.PATIENT_TEST_URL || 'http://localhost:5173';
const en = require('../src/i18n/locales/en.json'), hi = require('../src/i18n/locales/hi.json');
const doctor = { id:'test-dentist',name:'Dr. Test Dentist',specialty:'General & Restorative Dentistry',rating:4.9,reviews:10,distance:'2 km',nextAvailable:'Today',experience:12,fee:800,photo:'',clinic:'Test Clinic',qualification:'BDS, MDS (Conservative Dentistry)',languages:'English, Hindi',about:'Experienced dentist with a focus on preventive and restorative dental care.',treatments:['Consultation','Root Canal'],doctorReviews:[] };
async function run() {
 const browser = await chromium.launch({headless:true});
 let count=0;
 try {
  for(const language of ['en','hi']) {
   const context=await browser.newContext({viewport:{width:390,height:844}}), page=await context.newPage(), errors=[], sent=[],bookings=[];
   page.setDefaultTimeout(15000);
   page.on('pageerror',error=>errors.push(error.message));
   console.log(`Testing ${language}: loading chat`);
   await page.route('**/api/v1/**',async route=>{
    const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1','');
    const payload=req.postDataJSON?.();
    const json=(data,status=200)=>route.fulfill({status,json:{success:status<400,message:status<400?'OK':'Incorrect email or password',data}});
    if(path==='/auth/refresh')return json(null,401);
    if(path==='/ai-chat/message'){sent.push(payload);return json({conversationId:'test-conversation',message:{id:String(sent.length),text:(payload.language==='hi'?hi:en)['guidance.general']},guidance:{emergency:false,specializations:['General','Endodontics'],summaryKey:'guidance.general',summary:(payload.language==='hi'?hi:en)['guidance.general'],doctorIds:[doctor.id]}});}
    if(path==='/recommendations/doctors')return json({doctors:[doctor],guidance:{emergency:false,specializations:['General','Endodontics'],summaryKey:'guidance.general',summary:en['guidance.general'],doctorIds:[doctor.id]}});
    if(path.includes('/availability')){const day=url.searchParams.get('date');return json({timezone:'Asia/Kolkata',slots:[{startTime:`${day}T10:00:00+05:30`,endTime:`${day}T10:30:00+05:30`,label:'10:00 AM'}]});}
    if(path==='/public/doctors/'+doctor.id)return json(doctor);
    if(path==='/public/appointments'){bookings.push(payload);return json({id:'test-booking'});}
    if(path==='/public/services')return json([{id:'cleaning',name:'Teeth Cleaning',icon:'tooth'}]);
    return json([]);
   });
   await page.goto(base+'/patient/chat');
   const switcher=page.locator('.patient-language-switcher');
   await switcher.getByRole('button',{name:language==='hi'?'हिन्दी':'English',exact:true}).click();
   const catalog=language==='hi'?hi:en;
   await page.getByText(catalog['chat.greeting'],{exact:true}).waitFor();
   console.log(`Testing ${language}: sending symptom and switching language`);
   const input=language==='hi'?'मेरे दाँत में दर्द है':'I have a toothache';
   await page.locator('.chat-composer input:not([type=file])').fill(input);
   await page.getByRole('button',{name:catalog['Send message'],exact:true}).click();
   await page.locator('.chat-row.user').getByText(input,{exact:true}).waitFor();
   assert.equal(sent[0].message,input);assert.equal(sent[0].language,language);
   await page.getByLabel(catalog['Chewing or biting'],{exact:true}).check();
   await switcher.getByRole('button',{name:language==='hi'?'English':'हिन्दी',exact:true}).click();
   await page.locator('.chat-row.user').getByText(input,{exact:true}).waitFor();
   await page.locator('.chat-row.assistant').getByText((language==='hi'?en:hi)['guidance.general'],{exact:true}).waitFor();
   assert.equal(await page.locator('.symptom-card input').first().isChecked(),true);
   await switcher.getByRole('button',{name:language==='hi'?'हिन्दी':'English',exact:true}).click();
   console.log(`Testing ${language}: recommendations and booking`);
   await page.getByRole('button',{name:catalog['Suggest a dental specialization'],exact:true}).click();
   await page.getByRole('link',{name:catalog['View recommended doctors']}).click();
   await page.getByRole('link',{name:catalog['View & book']}).click();
   await page.getByRole('link',{name:catalog['Book Appointment'],exact:true}).click();
   await page.locator('.time-options button').first().click();
   const selectedTime=await page.locator('.time-options button[aria-pressed=true]').textContent();
   await page.locator('.patient-language-switcher').getByRole('button',{name:language==='hi'?'English':'हिन्दी',exact:true}).click();
   assert.equal(await page.locator('.time-options button[aria-pressed=true]').count(),1);
   await page.locator('.patient-language-switcher').getByRole('button',{name:language==='hi'?'हिन्दी':'English',exact:true}).click();
   assert.equal(await page.locator('.time-options button[aria-pressed=true]').textContent(),selectedTime);
   await page.getByRole('button',{name:catalog['Confirm Booking'],exact:true}).click();
   const modal=page.getByRole('dialog');
   await modal.locator('[name=name]').fill('Test Patient');await modal.locator('[name=email]').fill('test@example.com');await modal.locator('[name=phone]').fill('9876543210');
   await modal.getByRole('button',{name:catalog['Confirm booking'],exact:true}).click();
   await page.getByText(catalog['Booking confirmed!'],{exact:true}).waitFor();
   fs.mkdirSync('artifacts/patient-language',{recursive:true});
   await page.screenshot({path:`artifacts/patient-language/booking-${language}.png`,fullPage:true});
   assert.equal(bookings.length,1);assert.equal(bookings[0].doctorId,doctor.id);assert.match(bookings[0].startTime,/T10:00:00\+05:30$/);
   await page.reload();await page.getByText(catalog['Select Date'],{exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>localStorage.getItem('dentiq-patient-language')),language);
   // Check the same patient layout at phone, tablet and desktop widths.
   for(const width of [390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);}
   await page.goto(base+'/login');await page.getByRole('button',{name:catalog.Login,exact:true}).click();await page.getByText(catalog['Enter a valid email address.'],{exact:true}).waitFor();
   await page.goto(base+'/register');await page.getByRole('heading',{name:catalog['Personal information'],exact:true}).waitFor();
   await page.goto(base+'/doctor/register');assert.equal(await page.locator('.patient-language-switcher').count(),0);await page.getByText('BUILT FOR BETTER DENTAL CARE',{exact:true}).waitFor();
   assert.deepEqual(errors,[]);count++;await context.close();console.log(`PASS ${language}: chat → symptoms → recommendations → profile → booking → confirmation; persistence, validation, responsive layout, doctor isolation`);
  }
  for(const role of ['PATIENT','DOCTOR','SUPER_ADMIN']) {
   const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
   page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(()=>localStorage.setItem('dentiq-patient-language','hi'));
   await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname.replace('/api/v1','');
    let data=[];
    if(path==='/auth/refresh')data={accessToken:'test-token'};
    if(path==='/auth/me')data={id:'test-user',role,name:'Test User',email:'test@example.com',registrationManaged:false};
    if(path==='/patient/profile')data={name:'Test User',email:'test@example.com',phone:'9876543210'};
    await route.fulfill({json:{success:true,data,message:'OK'}});
   });
   const path=role==='PATIENT'?'/patient/records':role==='DOCTOR'?'/doctor/settings':'/super-admin/settings';
   await page.goto(base+path);
   if(role==='PATIENT'){
    await page.getByRole('heading',{name:hi['My Dental Records'],exact:true}).waitFor();
    await page.getByRole('heading',{name:hi['My Appointment History'],exact:true}).waitFor();
    await page.getByRole('link',{name:hi.Profile,exact:true}).click();
    await page.getByRole('heading',{name:hi['My Profile'],exact:true}).waitFor();
   } else {
    await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();
    assert.equal(await page.locator('.patient-language-switcher').count(),0);
    assert.equal(await page.locator('[lang=hi]').count(),0);
   }
   assert.deepEqual(errors,[]);await context.close();console.log(`PASS signed-in ${role}: ${role==='PATIENT'?'Hindi records and profile':'English portal isolation'}`);
  }
  console.log(`${count} patient journeys and 3 signed-in portal checks passed. API responses mocked; no database records created.`);
 } finally {await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});

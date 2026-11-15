import { useEffect } from "react";
import { useResource, useResourceRows } from "../../hooks/useResource";
import {recommendationService} from '../../services/recommendation.service';
import {patientService} from '../../services/patient.service';
import {appointmentService} from '../../services/appointment.service';
import {reportError,invalidate} from '../../utils/apiEvents';
import type { services as ServiceRows } from "../../data/services";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Check, CheckCircle2, ChevronRight, ClipboardList, FileHeart, Heart, MapPin, MoreHorizontal, PlayCircle, Search, ShieldCheck, Sparkles, Stethoscope, UserRound } from "lucide-react";
import { Avatar, EmptyState, LocalNotice, Modal, PatientHeader, Rating, SearchField, ToothMark, VerifiedBadge } from "../../components/platform/PlatformUI";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { money } from "../../components/platform/utils";

import type { Doctor } from "../../data/doctors";

import { usePatientFlow } from "../../components/patient/usePatientFlow";
import { EmergencyGuidance } from "../../components/patient/EmergencyGuidance";
import type { DentalGuidance } from "../../data/patientGuidance";
import { useAuth } from "../../auth/useAuth";
export { AIChat as PatientChat } from "../../pages/patient/AIChat";


function ServiceIcon({ icon }: { icon: string }) {
  if (icon === "sparkles") return <Sparkles size={25} />;
  if (icon === "extraction") return <ClipboardList size={25} />;
  if (icon === "implant") return <svg width="27" height="29" viewBox="0 0 32 36" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M8 5h16l-1 9H9L8 5Zm2 9h12M12 15l2 15h4l2-15M12 20h8m-7 5h6m-5 5h4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (icon === "braces") return <svg width="29" height="27" viewBox="0 0 36 30" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 12c2-7 28-7 30 0l-2 10c-7 5-19 5-26 0L3 12ZM2 16h32M11 10v13m14-13v13" strokeLinejoin="round"/><path d="M8 13h6v6H8zm14 0h6v6h-6" fill="var(--surface)"/></svg>;
  return <ToothMark />;
}

export function PatientHome() {
  const [more, setMore] = useState(false); const [services]=useResourceRows<(typeof ServiceRows)[number]>("/public/services");
  const shortcuts = [{ label: "Search", to: "/patient/recommendations?search=1", icon: Search }, { label: "Book Now", to: "/patient/booking", icon: CalendarDays }, { label: "AI Consult", to: "/patient/chat", icon: PlayCircle }, { label: "My Dental", to: "/patient/records", icon: Heart }];
  return <><PatientHeader home /><main className="patient-home-body"><section className="patient-hero"><div><span>Your AI Dental Assistant</span><h1>Find the right<br />dentist for you</h1></div><img src="/assets/tooth-assistant.png" alt="" className="hero-tooth" /><Sparkles className="hero-sparkle" size={14} /><div className="patient-shortcuts">{shortcuts.map(({ label, to, icon: Icon }) => <Link to={to} key={label}><Icon size={27} /><span>{label}</span></Link>)}</div></section>
    <Link to="/patient/chat" className="ask-ai-banner"><span className="assistant-mascot"><ToothMark /><i /></span><div><h2>Ask Dentiq AI</h2><p>Get instant dental guidance<br />and treatment suggestions.</p></div><span className="ask-arrow"><ArrowRight size={20} /></span></Link>
    <section className="popular-services"><h2>Popular Services</h2><div className="service-grid">{services.slice(0, more ? services.length : 7).map(service => <Link to={`/patient/recommendations?service=${encodeURIComponent(service.name)}`} key={service.id}><ServiceIcon icon={service.icon} /><span>{service.name}</span></Link>)}<button type="button" onClick={() => setMore(!more)} aria-expanded={more}><MoreHorizontal size={26} /><span>{more ? "Less" : "More"}</span></button></div></section>
    <div className="home-care-note"><ShieldCheck size={15} /><span>Your next step to a healthier smile.</span></div>
  </main></>;
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return <article className="doctor-card"><div className="doctor-card-main"><Link to={`/patient/doctor/${doctor.id}`}><Avatar name={doctor.name} src={doctor.photo} size="large" /></Link><div><Link to={`/patient/doctor/${doctor.id}`} className="doctor-name">{doctor.name} <VerifiedBadge /></Link><p>{doctor.specialty}</p><div className="doctor-card-meta"><Rating value={doctor.rating} reviews={doctor.reviews} /><span><MapPin size={12} />{doctor.distance}</span></div></div></div><div className="doctor-card-bottom"><span className="availability-label">Next Available: {doctor.nextAvailable}</span><Link className="p-button p-button-small" to={`/patient/doctor/${doctor.id}`}>View & book</Link></div></article>;
}

export function PatientRecommendations() {
  const [params] = useSearchParams(); const [query, setQuery] = useState("");
  const { concern: flowConcern, symptoms, guidance } = usePatientFlow();
  const service = params.get("service"); const concern = flowConcern || params.get("concern") || service || "Dental care";
  const [assessment,setAssessment] = useState<DentalGuidance|null>(guidance);
  const [visible,setVisible]=useState<Doctor[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;setLoading(true);const timer=setTimeout(()=>{void recommendationService.getDoctors<{doctors:Doctor[];guidance:DentalGuidance}>({concern:[concern,...symptoms].join(" "),search:query}).then(result=>{if(active){setVisible(result.data.doctors);setAssessment(result.data.guidance);setError("");}}).catch(error=>{if(active)setError(error.message);}).finally(()=>{if(active)setLoading(false);});},200);return()=>{active=false;clearTimeout(timer);};},[concern,query,symptoms.join(" ")]);
  if (assessment?.emergency) return <><PatientHeader title="Dental care guidance" back="/patient/chat" /><main className="patient-page-body"><EmergencyGuidance urgent /><Link className="p-text-link" to="/patient/chat">Return to chat</Link></main></>;
  return <><PatientHeader title="Recommended Dentists" back="/patient/chat" subtitle="General guidance, not a diagnosis" /><main className="patient-page-body"><div className="matching-banner"><Sparkles size={28} /><div><h2>Suggested dental care</h2><p>{assessment?.specializations.join(" or ") || service || "Explore dentists"}</p><small>{visible.length} {visible.length === 1 ? "doctor" : "doctors"}. A dentist must examine you to determine appropriate care.</small></div></div>{assessment && <p className="matching-guidance">{assessment.summary}</p>}<SearchField value={query} onChange={setQuery} placeholder="Search dentists or specialty" />{loading && <p role="status">Finding dentists...</p>}{error && <p role="alert">{error}</p>}<div className="doctor-results">{visible.length ? visible.map(doctor => <DoctorCard doctor={doctor} key={doctor.id} />) : <EmptyState description="No dentist matches this combination. Try another search or return to chat." />}</div><EmergencyGuidance /></main></>;
}

export function PatientDoctorProfile() {
  const { id } = useParams();
  const {data:doctor,loading,error}=useResource<(Doctor & {doctorReviews:{name:string;rating:number;date:string;text:string}[]})|null>(id?`/public/doctors/${id}`:null,null); const doctorReviews=doctor?.doctorReviews||[];
  const [tab, setTab] = useState("About");
  const {user}=useAuth(); const {data:favorites}=useResource<string[]>(user?.role === 'patient'?'/patient/favorites':null,[]); const saved=Boolean(id&&favorites.includes(id));
  function setSaved(value:boolean){if(!user){location.assign('/login');return;}void patientService.saveDoctor(id,value).then(invalidate).catch(reportError);}
  if(loading)return <p role="status">Loading doctor...</p>; if(error)return <p role="alert">{error}</p>;
  if (!doctor) return <><PatientHeader title="Doctor profile" /><EmptyState title="Doctor not found" description="Return to recommendations to choose a dentist." /><Link to="/patient/recommendations" className="p-button patient-inset">View dentists</Link></>;
  return <div className="doctor-profile"><div className="doctor-hero"><img src={doctor.id === "arjun-mehta" ? "/assets/doctor-arjun-hero.png" : doctor.photo} alt={doctor.name} /><Link className="p-icon-button" to="/patient/recommendations" aria-label="Back to dentists"><ArrowLeft size={20} /></Link><button type="button" className={`p-icon-button favorite-button${saved ? " is-saved" : ""}`} aria-label={saved ? "Remove saved doctor" : "Save doctor"} aria-pressed={saved} onClick={() => setSaved(!saved)}><Heart size={21} fill={saved ? "currentColor" : "none"} /></button></div><div className="doctor-profile-info"><h1>{doctor.name} <BadgeCheck size={20} className="profile-verified" fill="currentColor" /></h1><p>{doctor.specialty}</p><div><Rating value={doctor.rating} reviews={doctor.reviews} /><span className="experience-label"><UserRound size={16} /> {doctor.experience}+ years</span></div></div>
    <div className="patient-tabs" role="tablist" aria-label="Doctor profile sections">{["About", "Treatments", "Reviews"].map(label => <button key={label} type="button" role="tab" id={`doctor-tab-${label}`} aria-controls="doctor-tab-panel" aria-selected={tab === label} className={tab === label ? "active" : ""} onClick={() => setTab(label)}>{label}</button>)}</div>
    <section className="profile-tab-content" role="tabpanel" id="doctor-tab-panel" aria-labelledby={`doctor-tab-${tab}`}>{tab === "About" ? <><h2>About</h2><p>{doctor.about}</p><div className="doctor-credentials"><div><span><BadgeCheck size={22} /></span><p>BDS<br />{doctor.qualification.replace("BDS, ", "")}</p></div><div><span><Stethoscope size={22} /></span><p>Clinical Experience: {doctor.experience}+ years</p></div><div><span><ClipboardList size={22} /></span><p>{doctor.languages}</p></div></div><div className="clinic-location"><MapPin size={16} /><span>{doctor.clinic} · {doctor.distance} away</span></div></> : tab === "Treatments" ? <><h2>Treatments & services</h2><div className="treatments-list">{doctor.treatments.map(treatment => <Link key={treatment} to={`/patient/booking?doctor=${doctor.id}`}><ToothMark /><span>{treatment}</span><ChevronRight size={17} /></Link>)}</div></> : <><h2>Patient reviews <span className="muted"></span></h2><div className="review-list">{doctorReviews.map(review => <article key={review.name}><div><Avatar name={review.name} size="small" /><strong>{review.name}</strong><span>{review.date}</span></div><Rating value={review.rating} /><p>{review.text}</p></article>)}</div></>}</section>
    <div className="patient-bottom-action"><Link className="p-button" to={`/patient/booking?doctor=${doctor.id}`}><CalendarDays size={19} />Book Appointment</Link></div>
  </div>;
}

export function PatientBooking() {
  const {concern,guidance}=usePatientFlow();const {user}=useAuth();const [params]=useSearchParams();const doctorId=params.get("doctor");
  const {data:doctor,loading,error}=useResource<Doctor|null>(doctorId?`/public/doctors/${doctorId}`:null,null);
  const bookingDates=Array.from({length:7},(_,index)=>{const day=new Date(Date.now()+index*86400000);const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(day);return {date,day:day.toLocaleDateString('en-IN',{weekday:'short',timeZone:'Asia/Kolkata'})};});
  const [date,setDate]=useState(bookingDates[0].date),[time,setTime]=useState("");const [confirming,setConfirming]=useState(false),[confirmed,setConfirmed]=useState(false),[pending,setPending]=useState(false),[bookingError,setBookingError]=useState("");
  const {data:availability,loading:slotsLoading,error:slotsError,reload}=useResource<{timezone:string;slots:{startTime:string;endTime:string;label:string}[]}>(doctorId?`/public/doctors/${doctorId}/availability?date=${date}`:null,{timezone:'Asia/Kolkata',slots:[]});
  async function book(event:FormEvent<HTMLFormElement>){event.preventDefault();if(pending)return;const values=new FormData(event.currentTarget);setPending(true);setBookingError("");try{await appointmentService.book({doctorId,date,startTime:time,reason:concern||'Consultation',...(user?.role==='patient'?{}:{patient:{name:String(values.get('name')),email:String(values.get('email')),phone:String(values.get('phone'))}})});invalidate();setConfirmed(true);setConfirming(false);}catch(error){setBookingError(error instanceof Error?error.message:'Unable to book');reload();}finally{setPending(false);}}
  if(guidance?.emergency)return <><PatientHeader title="Emergency care guidance"/><EmergencyGuidance urgent/></>;
  if(loading)return <p role="status">Loading doctor...</p>;if(error)return <p role="alert">{error}</p>;
  if(!doctor)return <><PatientHeader title="Book Appointment"/><EmptyState title="Please select a dentist"/><Link to="/patient/recommendations" className="p-button patient-inset">Browse dentists</Link></>;
  return <><PatientHeader title="Book Appointment" back={`/patient/doctor/${doctor.id}`}/><main className="patient-page-body booking-page"><div className="booking-doctor"><Avatar name={doctor.name} src={doctor.photo} size="large"/><div><h2>{doctor.name}</h2><p>{doctor.specialty}</p></div></div>{confirmed?<div className="booking-success" role="status"><CheckCircle2 size={51}/><h2>Booking confirmed!</h2><p>{doctor.name}<br/>{date} at {new Date(time).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit',timeZone:availability.timezone})}</p><Link className="p-button" to={user?'/patient/records':'/patient/chat'}>Continue</Link></div>:<><section className="booking-section"><h2>Select Date</h2><div className="date-options">{bookingDates.map(option=><button type="button" key={option.date} aria-pressed={date===option.date} className={date===option.date?'selected':''} onClick={()=>{setDate(option.date);setTime('');}}><span>{option.day}</span><strong>{option.date.slice(5)}</strong></button>)}</div></section><section className="booking-section"><h2>Select Time <small>{availability.timezone}</small></h2>{slotsLoading?<p role="status">Loading available slots...</p>:slotsError?<p role="alert">{slotsError}</p>:!availability.slots.length?<p>No slots available on this date.</p>:<div className="time-options">{availability.slots.map(slot=><button key={slot.startTime} type="button" aria-pressed={time===slot.startTime} className={time===slot.startTime?'selected':''} onClick={()=>setTime(slot.startTime)}>{slot.label}</button>)}</div>}</section><section className="booking-section"><h2>Appointment Details</h2><div className="consultation-fee"><span>Consultation</span><strong>{money(doctor.fee)}</strong></div></section><div className="booking-confirm-action"><button type="button" className="p-button" disabled={!availability.slots.some(s=>s.startTime===time)} onClick={()=>setConfirming(true)}><CheckCircle2 size={19}/>Confirm Booking</button></div></>}</main><Modal title="Confirm your booking" open={confirming} onClose={()=>{if(!pending)setConfirming(false);}}><form className="p-form" onSubmit={book}><div className="confirmation-summary"><Avatar name={doctor.name} src={doctor.photo} size="large"/><h3>{doctor.name}</h3><p>{date} ... {availability.slots.find(s=>s.startTime===time)?.label}</p><strong>{money(doctor.fee)}</strong></div>{user?.role!=='patient'&&<><label>Full name<input name="name" required minLength={2} maxLength={120}/></label><label>Email<input name="email" type="email" required/></label><label>Phone<input name="phone" type="tel" required pattern="[+0-9 ()-]{7,30}"/></label></>}{bookingError&&<p role="alert">{bookingError}</p>}<button className="p-button" type="submit" disabled={pending}>{pending?'Booking...':'Confirm booking'}<Check size={18}/></button></form></Modal></>;
}

export { PatientRecords } from "./RecordsListing";


export function PatientProfile() {
  const navigate = useNavigate(); const { user, logout } = useAuth();
  const {data:stored}=useResource<{name:string;email:string;phone:string}>("/patient/profile",{name:user?.name||"",email:user?.email||"",phone:""}); const [profile,setProfile]=useState(stored); useEffect(()=>setProfile(stored),[stored]);
  const [editing, setEditing] = useState(false); const [notice, setNotice] = useState("");
  function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void patientService.updateProfile({ name: String(data.get("name")).trim(), email: String(data.get("email")).trim(), phone: String(data.get("phone")).trim() }).then(()=>{invalidate();setEditing(false);setNotice("Profile saved.");}).catch(reportError); }
  return <><PatientHeader title="My Profile" back="/patient/chat" /><main className="patient-page-body"><section className="patient-profile-card"><Avatar name={profile.name} size="large" /><h2>{profile.name}</h2><p>{profile.email}</p><span>Patient account</span><button type="button" className="p-button p-button-outline" onClick={() => setEditing(true)}>Edit profile</button></section><LocalNotice message={notice} /><div className="profile-options"><button onClick={() => navigate("/patient/records")} type="button"><FileHeart size={20} /><span>My dental records</span><ChevronRight size={18} /></button><button onClick={() => navigate("/patient/chat")} type="button"><Sparkles size={20} /><span>Ask the dental assistant</span><ChevronRight size={18} /></button><button onClick={() => navigate("/patient/recommendations")} type="button"><CalendarDays size={20} /><span>Find a dentist</span><ChevronRight size={18} /></button><div><Sparkles size={20} /><span>Appearance</span><ThemeToggle /></div></div><section className="patient-account-note"><ShieldCheck size={20} /><p>Your profile and care history are restricted to your account.</p><button className="p-button p-button-outline" type="button" onClick={() => { logout(); navigate("/", { replace: true }); }}>Sign out</button></section></main><Modal title="Edit your profile" open={editing} onClose={() => setEditing(false)}><form className="p-form" onSubmit={save}><label>Full name<input name="name" required defaultValue={profile.name} maxLength={100} /></label><label>Email address<input name="email" type="email" required defaultValue={profile.email} /></label><label>Mobile number<input name="phone" type="tel" required defaultValue={profile.phone} /></label><button type="submit" className="p-button">Save changes</button></form></Modal></>;
}

import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Avatar, Rating, VerifiedBadge } from '../platform/PlatformUI';
import { usePatientTranslation } from '../../i18n/PatientLanguage';
import type { Doctor } from '../../data/doctors';
export function DoctorCard({ doctor, nearby = false }: { doctor: Doctor; nearby?: boolean }) {
  const { tr, locale } = usePatientTranslation();
  const clinicQuery = nearby && doctor.clinicId ? `?clinic=${encodeURIComponent(doctor.clinicId)}` : '';
  const profile = `/patient/doctor/${encodeURIComponent(doctor.id)}${clinicQuery}`;
  return <article className="doctor-card"><div className="doctor-card-main"><Link to={profile}><Avatar name={doctor.name} src={doctor.photo} size="large" /></Link><div><Link to={profile} className="doctor-name">{doctor.name} <VerifiedBadge /></Link><p>{tr(doctor.specialty)}</p>{nearby && <><p>{doctor.clinic}</p><p>{doctor.clinicAddress}</p><small>{new Intl.NumberFormat(locale).format(doctor.experience)}{tr('+ years')}</small></>}<div className="doctor-card-meta"><Rating value={doctor.rating} reviews={doctor.reviews} />{nearby ? typeof doctor.distanceKm === 'number' && <span><MapPin size={12} />{new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(doctor.distanceKm)} {tr('km')} · {tr('Straight-line distance')}</span> : <span><MapPin size={12} />{doctor.distance}</span>}</div></div></div><div className="doctor-card-bottom"><span className="availability-label">{tr('Next Available:')} {doctor.nextAvailableAt ? new Date(doctor.nextAvailableAt).toLocaleString(locale, {timeZone:doctor.timezone || 'Asia/Kolkata',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}) : tr(doctor.nextAvailable)}</span><Link className="p-button p-button-small" to={profile}>{tr(nearby ? 'View Profile' : 'View & book')}</Link>{nearby && <Link className="p-button p-button-small" to={`/patient/booking?doctor=${encodeURIComponent(doctor.id)}&clinic=${encodeURIComponent(doctor.clinicId || '')}`}>{tr('Book Appointment')}</Link>}</div></article>;
}

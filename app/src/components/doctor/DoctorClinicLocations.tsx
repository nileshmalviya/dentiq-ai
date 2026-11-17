import '../../styles/doctorRegistration.css';
import { useState, type FormEvent } from 'react';
import { useClinicLocations } from '../../hooks/useClinicLocations';
import type { ClinicLocation, ConfirmedClinicLocation } from '../../services/doctor.service';
import { ClinicLocationFields, clinicLocationValue, type ClinicLocationDraft } from './ClinicLocationFields';
export function DoctorClinicLocations() {
  const locations = useClinicLocations();
  return <section className="p-panel doctor-clinic-locations"><h2>Clinic Locations</h2><p>Update locations only for your linked clinics. A shared clinic update applies to all doctors at that clinic.</p>{locations.loading && <p role="status">Loading clinic locations...</p>}{locations.error && <p role="alert">{locations.error}</p>}{locations.notice && <p role="status">{locations.notice}</p>}{!locations.loading && !locations.error && !locations.clinics.length && <p>No active clinics are linked to your account.</p>}{locations.clinics.map(clinic => <ClinicLocationEditor key={clinic.id} clinic={clinic} saving={locations.saving} save={locations.save} />)}</section>;
}
function ClinicLocationEditor({ clinic, saving, save }: { clinic: ClinicLocation; saving: boolean; save: (id: string, data: ConfirmedClinicLocation & Pick<ClinicLocation,'address'|'city'|'state'|'postalCode'>) => Promise<void> }) {
  const [draft, setDraft] = useState<ClinicLocationDraft>({ latitude: clinic.location ? String(clinic.location.coordinates[1]) : '', longitude: clinic.location ? String(clinic.location.coordinates[0]) : '', confirmed: false });
  const [address, setAddress] = useState({ address: clinic.address, city: clinic.city, state: clinic.state, postalCode: clinic.postalCode });
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();setError('');
    try { const location = clinicLocationValue(draft); if (!location) throw new Error('Enter and confirm the clinic coordinates.'); await save(clinic.id, { ...address, ...location }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save clinic location.'); }
  }
  return <form className="p-form" onSubmit={event => void submit(event)}><fieldset disabled={saving}><legend>{clinic.name}</legend><div className="p-form-grid">{([{name:'address',label:'Full Clinic Address'},{name:'city',label:'City'},{name:'state',label:'State'},{name:'postalCode',label:'Postal Code'}] as const).map(field => <label key={field.name}>{field.label}<input required maxLength={field.name === 'address' ? 4000 : field.name === 'postalCode' ? 30 : 200} value={address[field.name]} onChange={event => { setAddress({ ...address, [field.name]: event.target.value }); setDraft({ ...draft, confirmed: false }); }} /></label>)}</div><ClinicLocationFields value={draft} onChange={setDraft} />{error && <p role="alert">{error}</p>}<button type="submit" className="p-button" disabled={saving}>{saving ? 'Saving...' : 'Save clinic location'}</button></fieldset></form>;
}

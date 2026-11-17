import { useCallback, useEffect, useState } from 'react';
import { doctorService, type ClinicLocation, type ConfirmedClinicLocation } from '../services/doctor.service';
export function useClinicLocations() {
  const [clinics, setClinics] = useState<ClinicLocation[]>([]), [loading, setLoading] = useState(true);
  const [error, setError] = useState(''), [saving, setSaving] = useState(false), [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setLoading(true);setError('');
    try { const result = await doctorService.getClinicLocations(); setClinics(result.data); }
    catch { setError('Clinic locations are available to approved doctors only.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function save(id: string, data: ConfirmedClinicLocation & Pick<ClinicLocation,'address'|'city'|'state'|'postalCode'>) {
    setSaving(true);setError('');setNotice('');
    try { const result = await doctorService.updateClinicLocation(id,data); setClinics(previous => previous.map(clinic => clinic.id === id ? result.data : clinic)); setNotice('Clinic location saved.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save clinic location.'); }
    finally { setSaving(false); }
  }
  return { clinics, loading, error, saving, notice, save };
}

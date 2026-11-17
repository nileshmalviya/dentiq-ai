import { useId } from 'react';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
export interface ClinicLocationDraft { latitude: string; longitude: string; confirmed: boolean; }
export const emptyClinicLocation: ClinicLocationDraft = { latitude: '', longitude: '', confirmed: false };
export function clinicLocationValue(draft: ClinicLocationDraft) {
  if (!draft.latitude.trim() && !draft.longitude.trim() && !draft.confirmed) return undefined;
  const latitude = Number(draft.latitude), longitude = Number(draft.longitude);
  if (!draft.latitude.trim() || !draft.longitude.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error('Enter a valid latitude (-90 to 90) and longitude (-180 to 180).');
  if (!draft.confirmed) throw new Error('Confirm that these coordinates represent the actual clinic.');
  return { latitude, longitude, confirmed: true };
}
export function ClinicLocationFields({ value, onChange }: { value: ClinicLocationDraft; onChange: (value: ClinicLocationDraft) => void }) {
  const id = useId(), location = useCurrentLocation();
  async function capture() {
    onChange({ ...value, confirmed: false });
    const point = await location.requestLocation();
    if (point) onChange({ latitude: String(point.latitude), longitude: String(point.longitude), confirmed: false });
  }
  const hasPoint = Boolean(value.latitude.trim() && value.longitude.trim());
  return <section className="clinic-location-fields"><h3>Clinic Location</h3><p className="registration-help">Capture your position while at the clinic, or enter its coordinates manually. Confirm the point before saving. Your current position is not automatically your clinic.</p><button className="p-button p-button-outline" type="button" onClick={() => void capture()} disabled={location.locating}>{location.locating ? 'Getting location...' : 'Use My Current Location'}</button>{location.error && <p role="alert">{location.error}</p>}<div className="registration-fields"><div className="registration-field"><label htmlFor={`${id}-latitude`}>Latitude</label><input id={`${id}-latitude`} type="number" inputMode="decimal" step="any" min={-90} max={90} value={value.latitude} onChange={event => { location.cancel(); onChange({ ...value, latitude: event.target.value, confirmed: false }); }} /></div><div className="registration-field"><label htmlFor={`${id}-longitude`}>Longitude</label><input id={`${id}-longitude`} type="number" inputMode="decimal" step="any" min={-180} max={180} value={value.longitude} onChange={event => { location.cancel(); onChange({ ...value, longitude: event.target.value, confirmed: false }); }} /></div></div><label className="clinic-location-confirmation"><input type="checkbox" checked={value.confirmed} disabled={!hasPoint} onChange={event => onChange({ ...value, confirmed: event.target.checked })} />I confirm these coordinates represent the actual clinic location.</label><p className="registration-help">Location is captured only when you click the button. No continuous tracking. You may leave coordinates empty and add them later.</p></section>;
}

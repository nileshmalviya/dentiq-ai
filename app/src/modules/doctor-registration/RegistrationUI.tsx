import { Link } from 'react-router-dom';
import type {
  DoctorApplication,
  RegistrationDetails,
} from '../../services/doctorRegistration.service';
export const documentLabels: Record<string, string> = {
  COUNCIL_CERTIFICATE: 'Council registration certificate',
  DEGREE_CERTIFICATE: 'Degree certificate',
  ADDITIONAL_QUALIFICATION: 'Additional qualification certificates',
  CLINIC_CERTIFICATE: 'Clinic registration certificate',
  PROFILE_PHOTO: 'Professional photo',
  CLINIC_LOGO: 'Clinic logo',
};
export function RegistrationNotice({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return message ? (
    <div
      className={'registration-notice' + (error ? ' is-error' : '')}
      role={error ? 'alert' : 'status'}
    >
      {message}
    </div>
  ) : null;
}
export function RegistrationFooter() {
  return (
    <p className="registration-footer">
      <Link to="/">Back to home</Link>
      <Link to="/login">Go to login</Link>
    </p>
  );
}
export function DocumentInputs({
  types,
  onChange,
  files = {},
  required = [],
}: {
  types: string[];
  onChange: (type: string, files: File[]) => void;
  files?: Record<string, File[]>;
  required?: string[];
}) {
  return (
    <div className="registration-fields">
      {types.map((type) => (
        <div className="registration-field full-field" key={type}>
          <label htmlFor={'file-' + type}>
            {documentLabels[type] || type}
            {required.includes(type) ? ' *' : ''}
          </label>
          <input
            type="file"
            id={'file-' + type}
            accept={
              ['PROFILE_PHOTO', 'CLINIC_LOGO'].includes(type)
                ? '.jpg,.jpeg,.png'
                : '.pdf,.jpg,.jpeg,.png'
            }
            multiple={type === 'ADDITIONAL_QUALIFICATION'}
            onChange={(e) => onChange(type, Array.from(e.target.files || []))}
          />
          <small>
            {files[type]?.map((f) => f.name).join(', ') ||
              'PDF, JPG or PNG. Maximum 10 MB per file.'}
          </small>
        </div>
      ))}
    </div>
  );
}
const label = (key: string) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
export function ApplicationSummary({ data }: { data: DoctorApplication }) {
  return (
    <div className="application-summary">
      {(['personal', 'professional', 'clinic'] as const).map((section) => (
        <section key={section}>
          <h3>{label(section)} information</h3>
          <dl className="registration-detail-grid">
            {Object.entries(data[section]).map(([key, value]) => (
              <div key={key}>
                <dt>{label(key)}</dt>
                <dd>
                  {Array.isArray(value)
                    ? value.join(', ') || '?'
                    : typeof value === 'boolean'
                      ? value
                        ? 'Yes'
                        : 'No'
                      : String(value || '?')}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
export function ApplicationHistory({
  details,
}: {
  details: RegistrationDetails;
}) {
  return (
    <section>
      <h3>Registration & approval history</h3>
      <ol className="registration-history">
        {details.audit.map((a) => (
          <li key={a.id}>
            <strong>{a.action.replaceAll('_', ' ')}</strong>
            <span>{new Date(a.createdAt).toLocaleString()}</span>
            {a.reason && <p>{a.reason}</p>}
            <small>By {a.performedBy}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}

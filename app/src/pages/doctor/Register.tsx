import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { accountHome } from '../../auth/permissions';
import { useResource } from '../../hooks/useResource';
import { useDoctorRegistrationActions } from '../../hooks/useDoctorRegistration';
import type {
  DoctorApplication,
  RegistrationCatalog,
} from '../../services/doctorRegistration.service';
import {
  RegistrationFields,
  normalizeApplication,
} from '../../modules/doctor-registration/RegistrationFields';
import {
  sampleApplication,
  sampleRegistrationPassword,
} from '../../modules/doctor-registration/sampleApplication';
import {
  DocumentInputs,
  RegistrationFooter,
  RegistrationNotice,
} from '../../modules/doctor-registration/RegistrationUI';
import '../../styles/doctorRegistration.css';
const steps = ['Personal', 'Professional', 'Clinic', 'Documents', 'Account'];
export default function DoctorRegister() {
  const config = useResource<RegistrationCatalog | null>(
    '/doctor-registration/config',
    null,
  );
  return config.data ? (
    <RegistrationForm catalog={config.data} />
  ) : (
    <div>
      <RegistrationNotice
        message={config.error || 'Loading registration form...'}
        error={Boolean(config.error)}
      />
      <RegistrationFooter />
    </div>
  );
}
function RegistrationForm({ catalog }: { catalog: RegistrationCatalog }) {
  const [step, setStep] = useState(0),
    [data, setData] = useState<DoctorApplication>(() =>
      sampleApplication(catalog),
    ),
    [files, setFiles] = useState<Record<string, File[]>>({}),
    [password, setPassword] = useState(sampleRegistrationPassword),
    [confirmPassword, setConfirmPassword] = useState(sampleRegistrationPassword);
  const actions = useDoctorRegistrationActions(),
    { user, login, logout } = useAuth(),
    navigate = useNavigate();
  function selectFiles(type: string, selected: File[]) {
    actions.setError('');
    if (selected.some((f) => f.size > catalog.uploadLimitBytes || !f.size)) {
      actions.setError('Choose non-empty files of at most 10 MB.');
      return;
    }
    setFiles((previous) => ({ ...previous, [type]: selected }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (actions.busy) return;
    if (step < 4) {
      if (step === 0 && !files.PROFILE_PHOTO?.length) {
        actions.setError('Choose your professional profile photo.');
        return;
      }
      if (step === 3) {
        const required = [
          'COUNCIL_CERTIFICATE',
          'DEGREE_CERTIFICATE',
          ...(data.clinic.registrationNumber ? ['CLINIC_CERTIFICATE'] : []),
          ...(Array.isArray(data.professional.additionalQualifications) &&
          data.professional.additionalQualifications.filter(Boolean).length
            ? ['ADDITIONAL_QUALIFICATION']
            : []),
        ];
        if (required.some((type) => !files[type]?.length)) {
          actions.setError('Upload all required professional certificates.');
          return;
        }
      }
      actions.setError('');
      setStep(step + 1);
      return;
    }
    if (password !== confirmPassword) {
      actions.setError('Passwords must match.');
      return;
    }
    if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,72}/.test(password)
    ) {
      actions.setError(
        'Use 12-72 characters with an uppercase letter, lowercase letter, number and symbol.',
      );
      return;
    }
    await actions.run(async () => {
      const created = await actions.register({
        ...normalizeApplication(data),
        password,
        confirmPassword,
      });
      try {await login(String(data.personal.email), password, false);} catch {setPassword('');setConfirmPassword('');navigate('/login',{replace:true,state:{notice:'Account created. Sign in to continue your doctor registration.'}});return;}
      setPassword('');
      setConfirmPassword('');
      try {
        for (const [type, list] of Object.entries(files))
          for (const file of list) await actions.upload(type, file);
      } catch (e) {
        navigate('/doctor/registration-status', {
          replace: true,
          state: {
            notice:
              'Account created. ' +
              (e instanceof Error
                ? e.message
                : 'Some documents need to be uploaded again.'),
          },
        });
        return;
      }
      navigate('/doctor/verify-email', {
        replace: true,
        state: { notice: created.data.message },
      });
    });
  }
  if (user && !actions.busy)
    return (
      <div className="doctor-registration">
        <h2>You are signed in</h2>
        <p>
          Continue your current account or sign out to register a new practice.
        </p>
        <Link className="auth-primary" to={accountHome(user)}>
          Continue
        </Link>
        <button className="text-link" onClick={logout}>
          Sign out
        </button>
        <RegistrationFooter />
      </div>
    );
  return (
    <div className="doctor-registration">
      <div className="form-intro">
        <span className="form-kicker">JOIN DENTIQ AI</span>
        <h2>Register your practice</h2>
        <p>
          Create your doctor account. Verify your email and submit your
          application for Super Admin review.
        </p>
      </div>
      <ol className="registration-steps" aria-label="Registration steps">
        {steps.map((label, i) => (
          <li
            key={label}
            className={i === step ? 'current' : i < step ? 'complete' : ''}
            aria-current={i === step ? 'step' : undefined}
          >
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <h3>{steps[step]} information</h3>
      <p className="registration-help">
        Sample values are prefilled. Replace them with your own details before
        creating an account. Select your own photo and certificates.
      </p>
      <form onSubmit={submit}>
        <fieldset className="registration-form-body" disabled={actions.busy}>
          {step < 3 && (
            <RegistrationFields
              key={step}
              section={(['personal', 'professional', 'clinic'] as const)[step]}
              values={
                data[(['personal', 'professional', 'clinic'] as const)[step]]
              }
              catalog={catalog}
              onChange={(values) =>
                setData((prev) => ({
                  ...prev,
                  [(['personal', 'professional', 'clinic'] as const)[step]]:
                    values,
                }))
              }
            />
          )}
          {step === 0 && (
            <DocumentInputs
              types={['PROFILE_PHOTO']}
              files={files}
              required={['PROFILE_PHOTO']}
              onChange={selectFiles}
            />
          )}
          {step === 2 && (
            <DocumentInputs
              types={['CLINIC_LOGO']}
              files={files}
              onChange={selectFiles}
            />
          )}
          {step === 3 && (
            <>
              <p className="registration-help">
                Your certificates are private and accessible to authorized
                verification administrators.
              </p>
              <DocumentInputs
                types={[
                  'COUNCIL_CERTIFICATE',
                  'DEGREE_CERTIFICATE',
                  'ADDITIONAL_QUALIFICATION',
                  'CLINIC_CERTIFICATE',
                ]}
                files={files}
                required={[
                  'COUNCIL_CERTIFICATE',
                  'DEGREE_CERTIFICATE',
                  ...(data.clinic.registrationNumber
                    ? ['CLINIC_CERTIFICATE']
                    : []),
                ]}
                onChange={selectFiles}
              />
            </>
          )}
          {step === 4 && (
            <div className="registration-fields">
              <div className="registration-field full-field">
                <label htmlFor="credentials-email">Email address</label>
                <input
                  id="credentials-email"
                  type="email"
                  value={String(data.personal.email)}
                  readOnly
                  autoComplete="username"
                />
              </div>
              <div className="registration-field full-field">
                <label htmlFor="doctor-password">Password *</label>
                <input
                  id="doctor-password"
                  type="password"
                  minLength={12}
                  maxLength={72}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <small>
                  12-72 characters; uppercase, lowercase, number and symbol.
                </small>
              </div>
              <div className="registration-field full-field">
                <label htmlFor="doctor-confirm-password">
                  Confirm password *
                </label>
                <input
                  id="doctor-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <p className="registration-help full-field">
                After registration, we will email a six-digit verification code.
                Your dashboard becomes available after administrative approval.
              </p>
            </div>
          )}
          <RegistrationNotice message={actions.error} error />
          <div className="registration-actions">
            {step > 0 && (
              <button
                type="button"
                className="p-button p-button-outline"
                onClick={() => {
                  actions.setError('');
                  setStep(step - 1);
                }}
              >
                Back
              </button>
            )}
            <button className="auth-primary" type="submit">
              {actions.busy
                ? 'Creating your account...'
                : step === 4
                  ? 'Create doctor account'
                  : 'Continue'}
            </button>
          </div>
        </fieldset>
      </form>
      <p className="registration-footer">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
      <RegistrationFooter />
    </div>
  );
}

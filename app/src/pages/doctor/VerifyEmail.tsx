import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useResource } from '../../hooks/useResource';
import { useDoctorRegistrationActions } from '../../hooks/useDoctorRegistration';
import type { RegistrationDetails } from '../../services/doctorRegistration.service';
import {
  RegistrationFooter,
  RegistrationNotice,
} from '../../modules/doctor-registration/RegistrationUI';
import '../../styles/doctorRegistration.css';
export default function VerifyEmail() {
  const { user, reloadUser, logout } = useAuth(),
    status = useResource<RegistrationDetails | null>(
      '/doctor-registration/me',
      null,
    ),
    actions = useDoctorRegistrationActions(),
    [code, setCode] = useState(''),
    [now, setNow] = useState(Date.now()),
    [notice, setNotice] = useState(String(useLocation().state?.notice || '')),
    navigate = useNavigate();
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const wait = Math.max(
    0,
    Math.ceil(
      (new Date(status.data?.otp?.nextSendAt || 0).getTime() - now) / 1000,
    ),
  );
  return (
    <div className="doctor-registration">
      <div className="form-intro">
        <span className="form-kicker">EMAIL VERIFICATION</span>
        <h2>Verify your email</h2>
        <p>
          Enter the six-digit code sent to <strong>{user?.email}</strong>. The
          code expires after five minutes.
        </p>
      </div>
      <RegistrationNotice message={notice} />
      <RegistrationNotice message={actions.error || status.error} error />
      {status.data?.emailVerified ? (
        <Link className="auth-primary" to="/doctor/verification-request">
          Continue to verification request
        </Link>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void actions.run(async () => {
              await actions.verify(code);
              await reloadUser();
              navigate('/doctor/verification-request', { replace: true });
            });
          }}
        >
          <fieldset className="registration-form-body" disabled={actions.busy}>
            <div className="registration-field">
              <label htmlFor="doctor-otp">Verification code</label>
              <input
                className="otp-input"
                id="doctor-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <button className="auth-primary" type="submit">
              {actions.busy ? 'Please wait...' : 'Verify email'}
            </button>
            <button
              className="text-link"
              type="button"
              disabled={wait > 0}
              onClick={() =>
                void actions.run(async () => {
                  await actions.resend();
                  setNotice('A new verification code has been sent.');
                  setCode('');
                  status.reload();
                })
              }
            >
              {wait > 0
                ? 'Resend code in ' + wait + 's'
                : 'Resend verification code'}
            </button>
            <small>
              Maximum five incorrect attempts per code. Check your spam folder
              if the email has not arrived.
            </small>
          </fieldset>
        </form>
      )}
      <p className="registration-footer">
        <Link to="/doctor/registration-status">
          Review your application or upload documents
        </Link>
        <button className="text-link" onClick={logout}>
          Sign out
        </button>
      </p>
      <RegistrationFooter />
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useResource } from '../../hooks/useResource';
import { useDoctorRegistrationActions } from '../../hooks/useDoctorRegistration';
import type {
  RegistrationCatalog,
  RegistrationDetails,
} from '../../services/doctorRegistration.service';
import {
  RegistrationFooter,
  RegistrationNotice,
  documentLabels,
} from '../../modules/doctor-registration/RegistrationUI';
import '../../styles/doctorRegistration.css';
export default function VerificationRequest() {
  const config = useResource<RegistrationCatalog | null>(
      '/doctor-registration/config',
      null,
    ),
    status = useResource<RegistrationDetails | null>(
      '/doctor-registration/me',
      null,
    ),
    [option, setOption] = useState(''),
    actions = useDoctorRegistrationActions(),
    { reloadUser } = useAuth(),
    navigate = useNavigate();
  return (
    <div className="doctor-registration">
      <div className="form-intro">
        <span className="form-kicker">VERIFICATION REQUEST</span>
        <h2>Complete Your Doctor Verification Request</h2>
        <p>
          Select your preferred option for administrative review. These are
          request options only; no payment is collected.
        </p>
      </div>
      <RegistrationNotice
        message={actions.error || status.error || config.error}
        error
      />
      {status.data && !status.data.emailVerified ? (
        <Link className="auth-primary" to="/doctor/verify-email">
          Verify your email first
        </Link>
      ) : status.data &&
        !['DRAFT', 'REJECTED'].includes(
          status.data.application.requestStatus,
        ) ? (
        <Link className="auth-primary" to="/doctor/registration-status">
          View registration status
        </Link>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void actions.run(async () => {
              const result = await actions.submit(option);
              await reloadUser();
              navigate('/doctor/registration-status', {
                replace: true,
                state: { notice: result.data.message },
              });
            });
          }}
        >
          <fieldset
            className="registration-form-body"
            disabled={actions.busy || !status.data}
          >
            <div className="verification-options">
              {config.data?.verificationOptions.map((label, index) => (
                <label
                  key={label}
                  className={option === label ? 'selected' : ''}
                >
                  <input
                    type="radio"
                    name="verification-option"
                    value={label}
                    checked={option === label}
                    onChange={() => setOption(label)}
                    required
                  />
                  <span className="verification-option-mark" aria-hidden="true">
                    {index === 3 ? 'ID' : label[0]}
                  </span>
                  <strong>{label}</strong>
                  <small>
                    {index === 3
                      ? 'Administrative identity review'
                      : 'Preferred future payment channel'}
                  </small>
                </label>
              ))}
            </div>
            {Boolean(status.data?.missingDocuments.length) && (
              <RegistrationNotice
                message={
                  'Upload required documents before submission: ' +
                  status.data?.missingDocuments
                    .map((type) => documentLabels[type] || type)
                    .join(', ')
                }
              />
            )}
            <Link className="text-link" to="/doctor/registration-status">
              Review application & documents
            </Link>
            <button
              className="auth-primary"
              type="submit"
              disabled={
                !option || Boolean(status.data?.missingDocuments.length)
              }
            >
              {actions.busy ? 'Submitting...' : 'Submit request'}
            </button>
          </fieldset>
        </form>
      )}
      <RegistrationFooter />
    </div>
  );
}

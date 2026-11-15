import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useResource } from '../../hooks/useResource';
import { useDoctorRegistrationActions } from '../../hooks/useDoctorRegistration';
import type {
  DoctorApplication,
  RegistrationCatalog,
  RegistrationDetails,
} from '../../services/doctorRegistration.service';
import {
  RegistrationFields,
  normalizeApplication,
} from '../../modules/doctor-registration/RegistrationFields';
import {
  ApplicationSummary,
  ApplicationHistory,
  DocumentInputs,
  documentLabels,
  RegistrationFooter,
  RegistrationNotice,
} from '../../modules/doctor-registration/RegistrationUI';
import '../../styles/doctorRegistration.css';
export default function RegistrationStatus() {
  const navigate=useNavigate();
  const status = useResource<RegistrationDetails | null>(
      '/doctor-registration/me',
      null,
    ),
    config = useResource<RegistrationCatalog | null>(
      '/doctor-registration/config',
      null,
    ),
    actions = useDoctorRegistrationActions(),
    { reloadUser, logout } = useAuth(),
    [editing, setEditing] = useState<DoctorApplication | null>(null),
    [files, setFiles] = useState<Record<string, File[]>>({}),
    [notice, setNotice] = useState(String(useLocation().state?.notice || ''));
  const details = status.data,
    state = details?.application.requestStatus,
    editable = state === 'DRAFT' || state === 'REJECTED';
  const headings: Record<string, string> = {
    DRAFT: 'Complete your registration',
    PENDING: 'Your registration is under review.',
    APPROVED: 'Your registration is approved.',
    REJECTED: 'Your registration request was not approved.',
    SUSPENDED: 'Your account is suspended.',
  };
  return (
    <div className="doctor-registration">
      <div className="form-intro">
        <span className="form-kicker">DOCTOR REGISTRATION</span>
        <h2>{headings[state || ''] || 'Registration status'}</h2>
        <p>
          Email: {details?.emailVerified ? 'Verified' : 'Unverified'} ?
          Approval: {state || 'Loading...'}
        </p>
      </div>
      <RegistrationNotice message={notice} />
      <RegistrationNotice
        message={actions.error || status.error || config.error}
        error
      />
      {details && (
        <>
          <RegistrationNotice
            message={details.application.rejectionReason || ''}
            error={state === 'REJECTED'}
          />
          <p className="registration-help">
            Preferred verification option:{' '}
            {details.application.selectedVerificationOption || 'Not selected'}
          </p>
          <div className="registration-actions">
            <button
              className="p-button p-button-outline"
              disabled={actions.busy}
              onClick={() =>
                void actions.run(async () => {
                  await reloadUser();
                  status.reload();
                  setNotice('Registration status refreshed.');
                })
              }
            >
              Refresh status
            </button>
            {!details.emailVerified && (
              <Link className="p-button" to="/doctor/verify-email">
                Verify email
              </Link>
            )}
            {editable && details.emailVerified && (
              <Link className="p-button" to="/doctor/verification-request">
                {state === 'REJECTED'
                  ? 'Resubmit corrected application'
                  : 'Submit verification request'}
              </Link>
            )}
            {state === 'APPROVED' && (
              <Link
                className="p-button"
                to="/doctor/dashboard"
                onClick={event => {event.preventDefault();void actions.run(async()=>{await reloadUser();navigate('/doctor/dashboard');});}}
              >
                Open Doctor Portal
              </Link>
            )}
          </div>
          {editing && config.data ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void actions.run(async () => {
                  const next = normalizeApplication(editing),
                    { email, ...personal } = next.personal;
                  void email;
                  await actions.correct({ ...next, personal });
                  setEditing(null);
                  setNotice('Application corrections saved.');
                  status.reload();
                });
              }}
            >
              <fieldset
                className="registration-form-body"
                disabled={actions.busy}
              >
                {(['personal', 'professional', 'clinic'] as const).map(
                  (section) => (
                    <section key={section}>
                      <h3>{section} information</h3>
                      <RegistrationFields
                        section={section}
                        values={editing[section]}
                        onChange={(values) =>
                          setEditing((prev) =>
                            prev ? { ...prev, [section]: values } : prev,
                          )
                        }
                        catalog={config.data!}
                        readOnlyEmail
                        category={String(editing.professional.doctorCategory)}
                      />
                    </section>
                  ),
                )}
                <div className="registration-actions">
                  <button className="p-button" type="submit">
                    Save corrections
                  </button>
                  <button
                    className="p-button p-button-outline"
                    type="button"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </button>
                </div>
              </fieldset>
            </form>
          ) : (
            <>
              <ApplicationSummary data={details.application} />
              {editable && (
                <button
                  className="p-button p-button-outline"
                  onClick={() =>
                    setEditing({
                      personal: { ...details.application.personal },
                      professional: { ...details.application.professional },
                      clinic: { ...details.application.clinic },
                    })
                  }
                >
                  Edit application
                </button>
              )}
            </>
          )}
          <section>
            <h3>Uploaded documents</h3>
            <ul className="registration-documents">
              {details.documents.map((doc) => (
                <li key={doc.id}>
                  <strong>{documentLabels[doc.documentType]}</strong>
                  <span>
                    {doc.originalName} ? {Math.ceil(doc.size / 1024)} KB
                  </span>
                </li>
              ))}
            </ul>
            {Boolean(details.missingDocuments.length) && (
              <RegistrationNotice
                message={
                  'Required: ' +
                  details.missingDocuments
                    .map((type) => documentLabels[type] || type)
                    .join(', ')
                }
              />
            )}
            {editable && config.data && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void actions.run(async () => {
                    if (!Object.values(files).some((list) => list.length))
                      throw new Error('Choose documents to upload.');
                    for (const [type, list] of Object.entries(files))
                      for (const file of list) await actions.upload(type, file);
                    setFiles({});
                    status.reload();
                    setNotice('Documents uploaded.');
                  });
                }}
              >
                <fieldset
                  className="registration-form-body"
                  disabled={actions.busy}
                >
                  <DocumentInputs
                    types={config.data.documentTypes}
                    files={files}
                    required={details.missingDocuments}
                    onChange={(type, list) => {
                      if (list.some((file) => file.size > 10 * 1024 * 1024)) {
                        actions.setError('Each file must be at most 10 MB.');
                        return;
                      }
                      setFiles((prev) => ({ ...prev, [type]: list }));
                    }}
                  />
                  <button className="p-button" type="submit">
                    Upload documents
                  </button>
                </fieldset>
              </form>
            )}
          </section>
          <ApplicationHistory details={details} />
        </>
      )}
      <button className="text-link" onClick={logout}>
        Sign out
      </button>
      <RegistrationFooter />
    </div>
  );
}

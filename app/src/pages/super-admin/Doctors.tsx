import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useResourceRows } from '../../hooks/useResource';
import { useDoctorReviewActions } from '../../hooks/useDoctorRegistration';
import { useTableData } from '../../components/common/table/useTableData';
import { DataTable } from '../../components/common/table/DataTable';
import type { TableColumn } from '../../components/common/table/types';
import {
  Avatar,
  PageHeading,
  Panel,
  Modal,
} from '../../components/platform/PlatformUI';
import type { RegistrationDetails } from '../../services/doctorRegistration.service';
import {
  ApplicationSummary,
  ApplicationHistory,
  documentLabels,
  RegistrationNotice,
} from '../../modules/doctor-registration/RegistrationUI';
import '../../styles/doctorRegistration.css';
interface DoctorRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  qualification: string;
  experience: number;
  clinic: string;
  city?: string;
  photo?: string;
  status: string;
  registrationNumber?: string;
  registrationManaged?: boolean;
  registrationId?: string;
  approvalStatus?: string;
  emailVerificationStatus?: string;
  verificationOption?: string;
  registrationDate?: string;
  createdAt?: string;
}
const approval = (row: DoctorRow) =>
  row.approvalStatus ||
  (row.status === 'Active'
    ? 'APPROVED'
    : row.status === 'Inactive'
      ? 'INACTIVE'
      : 'UNDER REVIEW');
export default function Doctors() {
  const [rows] = useResourceRows<DoctorRow>('/admin/doctors'),
    [selected, setSelected] = useState<DoctorRow | null>(null),
    [details, setDetails] = useState<RegistrationDetails | null>(null),
    [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | null>(null),
    [reason, setReason] = useState(''),
    [notice, setNotice] = useState(''),
    [params] = useSearchParams(),
    actions = useDoctorReviewActions();
  async function open(row: DoctorRow) {
    setSelected(row);
    setDetails(null);
    setNotice('');
    actions.setError('');
    if (row.registrationId)
      await actions.run(async () =>
        setDetails((await actions.details(row.registrationId!)).data),
      );
  }
  const columns: TableColumn<DoctorRow>[] = [
    {
      id: 'name',
      label: 'Doctor',
      value: (r) => r.name,
      render: (r) => (
        <div className="table-person">
          <Avatar name={r.name} src={r.photo} />
          <strong>{r.name}</strong>
        </div>
      ),
    },
    { id: 'email', label: 'Email', value: (r) => r.email },
    { id: 'phone', label: 'Phone', value: (r) => r.phone },
    {
      id: 'registrationNumber',
      label: 'Registration number',
      value: (r) => r.registrationNumber || '?',
    },
    {
      id: 'qualification',
      label: 'Qualification',
      value: (r) => r.qualification,
    },
    { id: 'specialty', label: 'Specialization', value: (r) => r.specialty },
    {
      id: 'experience',
      label: 'Experience',
      value: (r) => r.experience,
      render: (r) => r.experience + ' years',
    },
    { id: 'clinic', label: 'Clinic', value: (r) => r.clinic },
    { id: 'city', label: 'City', value: (r) => r.city || '?' },
    {
      id: 'emailVerificationStatus',
      label: 'Email verification',
      value: (r) => r.emailVerificationStatus,
      render: (r) => (
        <span
          className={'registration-status status-' + r.emailVerificationStatus}
        >
          {r.registrationManaged ? r.emailVerificationStatus : 'Legacy account'}
        </span>
      ),
    },
    {
      id: 'approvalStatus',
      label: 'Approval',
      value: approval,
      render: (r) => (
        <span className={'registration-status status-' + approval(r)}>
          {approval(r)}
        </span>
      ),
    },
    {
      id: 'verificationOption',
      label: 'Preferred option',
      value: (r) => r.verificationOption || '?',
    },
    {
      id: 'createdAt',
      label: 'Registered',
      value: (r) => r.createdAt,
      render: (r) =>
        r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '?',
    },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      className: 'sticky-actions',
      render: (r) => (
        <div className="registration-row-actions">
          <button
            className="p-button p-button-outline"
            disabled={actions.busy}
            onClick={() => void open(r)}
          >
            View details{r.registrationId ? ' / Documents' : ''}
          </button>
          {r.approvalStatus === 'PENDING' && (
            <>
              <button
                className="p-button"
                disabled={actions.busy}
                onClick={() => void open(r).then(() => setDecision('APPROVED'))}
              >
                Approve
              </button>
              <button
                className="p-button p-button-outline"
                disabled={actions.busy}
                onClick={() => {
                  void open(r).then(() => setDecision('REJECTED'));
                  setReason('');
                }}
              >
                Reject
              </button>
            </>
          )}
        </div>
      ),
    },
  ];
  const table = useTableData(rows, {
    columns,
    initialQuery: params.get('q') || '',
    searchText: (r) => Object.values(r).join(' '),
    filters: [
      {
        id: 'approvalStatus',
        label: 'Approval status',
        options: [
          { value: '', label: 'All doctors' },
          ...['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(
            (value) => ({ value, label: value }),
          ),
        ],
        matches: (r, v) => approval(r) === v,
      },
      {
        id: 'emailVerificationStatus',
        label: 'Email verification',
        options: [
          { value: '', label: 'All email statuses' },
          ...['UNVERIFIED', 'VERIFIED'].map((value) => ({
            value,
            label: value,
          })),
        ],
        matches: (r, v) => r.emailVerificationStatus === v,
      },
      {
        id: 'specialty',
        label: 'Specialization',
        matches: (r, v) => r.specialty === v,
      },
    ],
  });
  async function review() {
    if (!selected?.registrationId || !decision) return;
    await actions.run(async () => {
      const result =
        decision === 'APPROVED'
          ? await actions.approve(selected.registrationId!)
          : await actions.reject(selected.registrationId!, reason);
      setDetails(result.data);
      setSelected((previous) =>
        previous
          ? {
              ...previous,
              approvalStatus: result.data.application.requestStatus,
            }
          : previous,
      );
      setNotice(
        'Application ' +
          result.data.application.requestStatus.toLowerCase() +
          '.',
      );
      setDecision(null);
    });
  }
  return (
    <>
      <PageHeading
        title="Doctors Management"
        description="Review registrations, private certificates and approval history."
      />
      <RegistrationNotice message={notice} />
      <RegistrationNotice message={actions.error || table.error || ''} error />
      <Panel>
        <DataTable table={table} rowKey={(r) => r.id} label="doctors" />
      </Panel>
      <Modal
        title={selected?.name || 'Doctor details'}
        open={Boolean(selected) && !decision}
        onClose={() => {
          if (!actions.busy) {
            setSelected(null);
            setDetails(null);
          }
        }}
      >
        {selected && (
          <div className="doctor-review">
            <div className="review-status">
              <span>
                Email: {selected.emailVerificationStatus || 'Legacy account'}
              </span>
              <span>
                Approval:{' '}
                {details?.application.requestStatus || approval(selected)}
              </span>
            </div>
            {details ? (
              <>
                <p>
                  Preferred verification option:{' '}
                  <strong>
                    {details.application.selectedVerificationOption ||
                      'Not selected'}
                  </strong>
                </p>
                <RegistrationNotice
                  message={details.application.rejectionReason || ''}
                  error={details.application.requestStatus === 'REJECTED'}
                />
                <ApplicationSummary data={details.application} />
                <h3>Private verification documents</h3>
                <ul className="registration-documents">
                  {details.documents.map((doc) => (
                    <li key={doc.id}>
                      <strong>{documentLabels[doc.documentType]}</strong>
                      <span>
                        {doc.originalName} ? {Math.ceil(doc.size / 1024)} KB
                      </span>
                      <button
                        className="p-button p-button-outline"
                        disabled={actions.busy}
                        onClick={() =>
                          void actions.run(() =>
                            actions.download(
                              details.application.id,
                              doc.id,
                              doc.originalName,
                            ),
                          )
                        }
                      >
                        Download for review
                      </button>
                    </li>
                  ))}
                </ul>
                {Boolean(details.missingDocuments.length) && (
                  <RegistrationNotice
                    message={
                      'Missing: ' +
                      details.missingDocuments
                        .map((type) => documentLabels[type])
                        .join(', ')
                    }
                    error
                  />
                )}
                <p>
                  Email notification:{' '}
                  {details.application.notificationStatus || 'Not requested'}
                </p>
                {details.application.notificationStatus === 'FAILED' && (
                  <button
                    className="p-button p-button-outline"
                    disabled={actions.busy}
                    onClick={() =>
                      void actions.run(async () =>
                        setDetails(
                          (
                            await actions.retryNotification(
                              details.application.id,
                            )
                          ).data,
                        ),
                      )
                    }
                  >
                    Retry notification
                  </button>
                )}
                <ApplicationHistory details={details} />
                {details.application.requestStatus === 'PENDING' && (
                  <div className="registration-actions">
                    <button
                      className="p-button"
                      disabled={
                        actions.busy ||
                        !details.emailVerified ||
                        Boolean(details.missingDocuments.length)
                      }
                      onClick={() => setDecision('APPROVED')}
                    >
                      Approve doctor
                    </button>
                    <button
                      className="p-button p-button-outline"
                      disabled={actions.busy}
                      onClick={() => {
                        setReason('');
                        setDecision('REJECTED');
                      }}
                    >
                      Reject application
                    </button>
                  </div>
                )}
              </>
            ) : selected.registrationId ? (
              <p role="status">
                {actions.busy
                  ? 'Loading application...'
                  : 'Application could not be loaded. Close and retry.'}
              </p>
            ) : (
              <>
                <dl className="registration-detail-grid">
                  {[
                    ['Email', selected.email],
                    ['Phone', selected.phone],
                    ['Qualification', selected.qualification],
                    ['Specialization', selected.specialty],
                    ['Clinic', selected.clinic],
                    ['Experience', selected.experience + ' years'],
                  ].map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <form
                  className="p-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    void actions.run(async () => {
                      await actions.updateLegacy(selected.id, {
                        name: String(form.get('name')),
                        status: String(form.get('status')),
                      });
                      setNotice('Doctor record updated.');
                      setSelected(null);
                    });
                  }}
                >
                  <h3>Manage existing record</h3>
                  <label>
                    Display name
                    <input name="name" required defaultValue={selected.name} />
                  </label>
                  <label>
                    Status
                    <select name="status" defaultValue={selected.status}>
                      {['Active', 'Inactive', 'Under Review'].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <button className="p-button" disabled={actions.busy}>
                    Save changes
                  </button>
                </form>
                <Link
                  className="p-button p-button-outline"
                  to={'/patient/doctor/' + selected.id}
                >
                  View patient-facing profile
                </Link>
              </>
            )}
            <RegistrationNotice message={actions.error} error />
          </div>
        )}
      </Modal>
      <Modal
        title={
          decision === 'APPROVED' ? 'Approve doctor?' : 'Reject registration'
        }
        open={Boolean(decision)}
        onClose={() => {
          if (!actions.busy) setDecision(null);
        }}
      >
        <form
          className="registration-form-body"
          onSubmit={(e) => {
            e.preventDefault();
            void review();
          }}
        >
          <p>
            {decision === 'APPROVED'
              ? 'Confirm that you have reviewed the doctor qualifications and documents. Approval activates the Doctor Portal.'
              : 'Give a clear reason so the doctor can correct and resubmit the application.'}
          </p>
          {decision === 'REJECTED' && (
            <div className="registration-field">
              <label htmlFor="doctor-rejection">Rejection reason *</label>
              <textarea
                id="doctor-rejection"
                rows={4}
                minLength={10}
                maxLength={2000}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
          <RegistrationNotice message={actions.error} error />
          <div className="registration-actions">
            <button
              type="button"
              className="p-button p-button-outline"
              disabled={actions.busy}
              onClick={() => setDecision(null)}
            >
              Cancel
            </button>
            <button type="submit" className="p-button" disabled={actions.busy}>
              {actions.busy
                ? 'Saving...'
                : decision === 'APPROVED'
                  ? 'Confirm approval'
                  : 'Reject application'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

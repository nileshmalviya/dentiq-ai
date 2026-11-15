# Doctor registration and review

The existing doctor signup is /doctor/register. All onboarding screens include Back to home. The existing /super-admin/doctors table handles applications alongside legacy doctor accounts.

DRAFT + UNVERIFIED -> email OTP -> VERIFIED -> request selection and submission -> PENDING -> APPROVED or REJECTED. Rejected doctors can correct and resubmit. Email verification, approval and verification option are separate states. PhonePe, Paytm, UPI and Identity Verification are selections only; the flow never initiates or confirms payments.

## Architecture and data

Route -> Controller -> Service -> Repository -> MongoDB is preserved. Frontend screens use hooks, feature services and the shared API client for JSON, multipart uploads and authenticated downloads.

Registration creates users, doctors, clinics, doctor-registrations and a primary doctor-clinics relationship in a transaction. Corrections, document replacement, email verification and decisions use conditional transactions with status/version guards. Concurrent opposite decisions cannot both succeed. Approval records the reviewer, timestamp and audit while activating the user, doctor, clinic and primary membership together.

Only newly self-registered doctors have registrationManaged=true. Existing active doctor accounts retain access. Pending/rejected doctors can sign in to finish their own application, while backend RBAC blocks clinical and inventory routes. Public dental discovery, recommendations and booking exclude unapproved and unsupported clinical categories. Only Dentist / In Person registrations enter the current dental booking flow.

## OTP and documents

OTP generation uses crypto.randomInt and HMAC hashes, with five-minute expiry, 60-second resend cooldown, five wrong attempts, single-use consumption and IP rate limits. Resending invalidates the previous challenge. Passwords use bcrypt cost 12 and a maximum of 72 UTF-8 bytes. OTPs, passwords and private storage references are never returned or logged.

Uploads accept matching PDF/JPEG/PNG signatures, MIME types and extensions up to 10 MB. Photos require JPEG/PNG. Council certificate, degree certificate and professional photo are required; clinic and additional qualification certificates are conditional. Files remain on private disk with metadata in MongoDB. Only SUPER_ADMIN can download attachments. Storage keys and hashes are omitted from responses. Generic doctor updates cannot bypass the registration review process.

## Configuration and delivery

Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and SMTP_FROM in api/.env. Gmail uses smtp.gmail.com, port 465, secure=true and an app password. Credentials never belong in frontend settings or version control.

Private files default to api/storage/private. PRIVATE_UPLOAD_DIR can select an absolute persistent API-only directory. Retain this directory and private backups with deployment; no static file route serves these documents.

A failed initial OTP delivery leaves a restricted account that can sign in and resend. Review delivery failure does not undo an administrative decision: notificationStatus records PENDING, SENT or FAILED and administrators can retry failed review notifications. SMTP acceptance is not an inbox-delivery guarantee.

## API

All paths use /api/v1.

Public: GET /doctor-registration/config; POST /doctor-registration.

Managed doctor: GET/PATCH /doctor-registration/me; GET /doctor-registration/status; POST /doctor-registration/send-otp, /resend-otp, /verify-otp, /documents, /submit, /verification-request.

SUPER_ADMIN: GET /admin/doctor-registrations and /:id; GET /:id/audit-history and /:id/documents; GET /:id/documents/:documentId; POST /:id/approve, /:id/reject and /:id/retry-notification.

The generated OpenAPI describes request bodies, response formats, role checks and multipart/binary transfers.

## Verification

75 workflow assertions passed against an isolated temporary Atlas database with injected mail/storage interfaces. They covered registration rollback and duplicate licenses, OTP expiry/cooldown/attempt caps/single use, file type and size restrictions, own-account access, clinical RBAC before approval, read-only pending applications, rejection/correction/resubmission, concurrent decisions, idempotent approval, booking slots, non-dental exclusions, legacy access and email failure/retry. The temporary database was removed afterward. SMTP authentication was separately verified with the configured real sender.

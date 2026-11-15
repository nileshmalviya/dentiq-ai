import type { Router, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import type { Dependencies } from '../container/dependencies.js';
import { identity, authorize, validate } from '../middleware/index.js';
import { AppError } from '../errors/AppError.js';
import {
  registerDoctorSchema,
  correctApplicationSchema,
  requestVerificationSchema,
  verifyOtpSchema,
  uploadDocumentSchema,
  rejectDoctorSchema,
} from '../validations/doctorRegistration.validation.js';
const limit = (windowMs: number, attempts: number) =>
  rateLimit({
    windowMs,
    limit: attempts,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many attempts; please try again later',
      errors: [],
    },
  });
export function registerDoctorRegistrationRoutes(
  router: Router,
  d: Dependencies,
) {
  const c = d.controllers,
    onboarding: RequestHandler = (req, _res, next) =>
      req.actor?.role === 'DOCTOR' && req.actor.registrationManaged
        ? next()
        : next(new AppError(403, 'Doctor registration access required'));
  const own = [identity(d.auth), onboarding],
    admin = [identity(d.auth), authorize('SUPER_ADMIN')];
  const signupLimit = limit(3600000, 10),
    sendLimit = limit(900000, 10),
    verifyLimit = limit(900000, 30),
    uploadLimit = limit(60000, 20),
    reviewLimit = limit(60000, 30);
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1,
      fields: 1,
      fieldSize: 100,
      parts: 2,
    },
  }).single('file');
  router.get('/doctor-registration/config', c.registration.config);
  router.post(
    '/doctor-registration',
    signupLimit,
    validate(registerDoctorSchema),
    c.registration.register,
  );
  router.get('/doctor-registration/me', ...own, c.registration.me);
  router.get('/doctor-registration/status', ...own, c.registration.me);
  router.patch(
    '/doctor-registration/me',
    ...own,
    validate(correctApplicationSchema),
    c.registration.correct,
  );
  router.post(
    '/doctor-registration/send-otp',
    ...own,
    sendLimit,
    c.emailVerification.send,
  );
  router.post(
    '/doctor-registration/resend-otp',
    ...own,
    sendLimit,
    c.emailVerification.send,
  );
  router.post(
    '/doctor-registration/verify-otp',
    ...own,
    verifyLimit,
    validate(verifyOtpSchema),
    c.emailVerification.verify,
  );
  router.post(
    '/doctor-registration/submit',
    ...own,
    validate(requestVerificationSchema),
    c.registration.submit,
  );
  router.post(
    '/doctor-registration/verification-request',
    ...own,
    validate(requestVerificationSchema),
    c.registration.submit,
  );
  router.post(
    '/doctor-registration/documents',
    ...own,
    uploadLimit,
    upload,
    validate(uploadDocumentSchema),
    c.documents.upload,
  );
  router.get('/admin/doctor-registrations', ...admin, c.approval.list);
  router.get('/admin/doctor-registrations/:id', ...admin, c.approval.details);
  router.get(
    '/admin/doctor-registrations/:id/audit-history',
    ...admin,
    c.approval.audit,
  );
  router.get(
    '/admin/doctor-registrations/:id/documents',
    ...admin,
    c.documents.list,
  );
  router.get(
    '/admin/doctor-registrations/:id/documents/:documentId',
    ...admin,
    c.documents.download,
  );
  router.post(
    '/admin/doctor-registrations/:id/approve',
    ...admin,
    reviewLimit,
    c.approval.approve,
  );
  router.post(
    '/admin/doctor-registrations/:id/reject',
    ...admin,
    reviewLimit,
    validate(rejectDoctorSchema),
    c.approval.reject,
  );
  router.post(
    '/admin/doctor-registrations/:id/retry-notification',
    ...admin,
    reviewLimit,
    c.approval.retry,
  );
}

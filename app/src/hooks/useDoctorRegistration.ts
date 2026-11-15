import { doctorService } from '../services/doctor.service';
import { useState } from 'react';
import { doctorRegistrationService } from '../services/doctorRegistration.service';
import { emailVerificationService } from '../services/emailVerification.service';
import { doctorApprovalService } from '../services/doctorApproval.service';
import { documentService } from '../services/document.service';
import { invalidate } from '../utils/apiEvents';
export function useDoctorRegistrationActions() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError('');
    try {
      return await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed');
      return undefined;
    } finally {
      setBusy(false);
      invalidate();
    }
  }
  return {
    busy,
    error,
    setError,
    run,
    register: doctorRegistrationService.register,
    correct: doctorRegistrationService.correct,
    submit: doctorRegistrationService.submit,
    resend: emailVerificationService.resend,
    verify: emailVerificationService.verify,
    upload: documentService.upload,
  };
}
export function useDoctorReviewActions() {
  const actions = useDoctorRegistrationActions();
  return {
    ...actions,
    updateLegacy: (id: string, data: unknown) =>
      doctorService.update('/admin/doctors/' + encodeURIComponent(id), data),
    details: doctorApprovalService.details,
    approve: doctorApprovalService.approve,
    reject: doctorApprovalService.reject,
    retryNotification: doctorApprovalService.retryNotification,
    download: documentService.download,
  };
}

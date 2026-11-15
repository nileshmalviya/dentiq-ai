const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
export function doctorEmail(
  name: string,
  event: string,
  reason = '',
  code?: string,
) {
  const titles: Record<string, string> = {
    OTP: 'Verify Your Dentiq AI Doctor Registration',
    CREATED: 'Doctor Registration Created',
    SUBMITTED: 'Doctor Verification Request Submitted',
    RESUBMITTED: 'Doctor Resubmission Received',
    APPROVED: 'Your Dentiq AI Doctor Registration Is Approved',
    REJECTED: 'Update on Your Dentiq AI Doctor Registration',
  };
  const messages: Record<string, string> = {
    OTP: 'Thank you for registering with Dentiq AI. Your email verification code is below. It is valid for 5 minutes. After verification, submit your request for administrative review.',
    CREATED:
      'Your registration account has been created. Verify your email and submit the required documents for review.',
    SUBMITTED:
      'Your verification request has been submitted to the Dentiq AI Support Team. Your account will be reviewed by our Super Admin. This is an administrative request, not a payment confirmation.',
    RESUBMITTED:
      'Your corrected registration has been submitted for another administrative review.',
    APPROVED:
      'Your doctor registration has been approved. You can now sign in to your authorized Doctor Portal.',
    REJECTED:
      'Your registration request was not approved. Sign in to view the reason and correct your application before resubmitting.',
  };
  const text = `Hello Dr. ${name},\n\n${messages[event] || event}${code ? '\n\n' + code : ''}${reason ? '\n\nReason: ' + reason : ''}\n\nRegards,\nDentiq AI Support Team`;
  return {
    subject: titles[event] || 'Dentiq AI Doctor Registration',
    text,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#183b3b"><main style="max-width:600px;margin:auto;padding:30px;border-top:5px solid #0d9488"><h1>Dentiq AI</h1><p>Hello Dr. ${escape(name)},</p><p>${escape(messages[event] || event)}</p>${code ? `<p style="font-size:30px;letter-spacing:8px;font-weight:bold">${escape(code)}</p>` : ''}${reason ? `<p><strong>Reason:</strong> ${escape(reason)}</p>` : ''}<p>Regards,<br>Dentiq AI Support Team</p></main></body></html>`,
  };
}

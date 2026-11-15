import nodemailer from 'nodemailer';
import type { Env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { doctorEmail } from '../templates/doctorEmails.js';
import type { RegistrationEmailSender } from '../interfaces/registration/contracts.js';
export class EmailService implements RegistrationEmailSender {
  constructor(private env: Env) {}
  assertConfigured() {
    if (
      !this.env.SMTP_HOST ||
      !this.env.SMTP_USER ||
      !this.env.SMTP_PASS ||
      !this.env.SMTP_FROM
    )
      throw new AppError(
        503,
        'Email delivery is not configured. Contact support.',
      );
  }
  private transport() {
    this.assertConfigured();
    return nodemailer.createTransport({
      host: this.env.SMTP_HOST,
      port: this.env.SMTP_PORT,
      secure: this.env.SMTP_SECURE === 'true',
      auth: { user: this.env.SMTP_USER, pass: this.env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      logger: false,
      debug: false,
    });
  }
  async verify() {
    await this.transport().verify();
  }
  private async send(
    to: string,
    name: string,
    event: string,
    reason = '',
    code?: string,
  ) {
    try {
      const result = await this.transport().sendMail({
        from: { name: 'Dentiq AI Support', address: this.env.SMTP_FROM! },
        to,
        ...doctorEmail(name, event, reason, code),
      });
      if (!result.accepted?.length) throw new Error('Recipient not accepted');
    } catch {
      throw new AppError(
        503,
        'Email could not be delivered. Please retry or contact support.',
      );
    }
  }
  otp(to: string, name: string, code: string) {
    return this.send(to, name, 'OTP', '', code);
  }
  notification(to: string, name: string, event: string, reason = '') {
    return this.send(to, name, event, reason);
  }
}

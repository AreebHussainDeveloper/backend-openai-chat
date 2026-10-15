// mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

interface WelcomeMailOptions {
  to: string;
  name: string;
  email: string;
  password?: string;
  loginUrl?: string;
}

@Injectable()
export class AppMailService {
  constructor(private readonly mailer: MailerService) {}

  async sendWelcome(opts: WelcomeMailOptions) {
    return this.mailer.sendMail({
      to: opts.to,
      subject: 'Welcome to Our Platform',
      template: 'welcome', // uses mail/templates/welcome.hbs
      context: {
        name: opts.name,
        email: opts.email,
        password: opts.password,
        loginUrl: opts.loginUrl,
        brandTitle: 'My Platform',
        theme: {
          bodyBg: '#f4f6f8',
          cardBg: '#ffffff',
          shadow: '#dddddd',
          brandBg: '#2563eb',
          brandText: '#ffffff',
          headingColor: '#111827',
          textColor: '#374151',
          boxBg: '#f9fafb',
          borderColor: '#e5e7eb',
          buttonBg: '#2563eb',
          buttonText: '#ffffff',
          mutedColor: '#6b7280',
        },
      },
    });
  }
  async resetPassword(opts: {
    to: string;
    email: string;
    verificationLink: string;
  }) {
    return this.mailer.sendMail({
      to: opts.to,
      subject: 'Your Account Credentials',
      template: 'reset-password', // uses mail/templates/reset-password.hbs
      context: {
        email: opts.email,
        verificationLink: opts.verificationLink,
      },
    });
  }
}

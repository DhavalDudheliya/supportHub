/**
 * Email Service
 *
 * Handles sending transactional emails using Nodemailer.
 * Configured via environment variables:
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — SMTP server credentials
 * - SMTP_FROM — Sender address shown in emails
 * - APP_URL — Base URL for building verification links
 *
 * For development, uses Ethereal (https://ethereal.email) as a fake SMTP
 * service, and logs a preview URL to the console for each sent email.
 */

import nodemailer from "nodemailer";
import logger from "../lib/logger.js";

/**
 * Nodemailer transporter configured from environment variables.
 * Defaults to Ethereal's SMTP server for development/testing.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // Use STARTTLS (port 587), not implicit TLS (port 465)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email verification link to a newly registered user.
 *
 * The email contains a styled HTML template with:
 * - A welcome message mentioning their workspace slug
 * - A "Verify Email Address" button linking to the verification endpoint
 * - A fallback plain-text URL for email clients that block buttons
 * - A note that the link expires in 24 hours
 *
 * @param to - Recipient email address
 * @param token - The unique verification token (stored in the User record)
 * @param subdomain - The workspace subdomain to display in the email
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
  subdomain: string,
): Promise<void> {
  // Build the full verification URL pointing to the backend endpoint
  const appUrl = process.env.APP_URL || "http://localhost:5000";
  const verifyLink = `${appUrl}/api/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"SupportHub" <noreply@supporthub.com>',
    to,
    subject: "Verify your SupportHub account",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">SupportHub</h1>
        </div>
        <div style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <h2 style="color: #1a1a2e; margin-top: 0;">Welcome aboard! 🎉</h2>
          <p style="color: #4a4a68; font-size: 16px; line-height: 1.6;">
            Thank you for registering your workspace <strong>${subdomain}</strong> on SupportHub.
            Please verify your email address to get started.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyLink}"
               style="background: #6366f1; color: #ffffff; padding: 14px 32px; border-radius: 8px;
                      text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #8888a0; font-size: 13px; line-height: 1.5;">
            This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #b0b0c0; font-size: 12px;">
            If the button above doesn't work, copy and paste this URL into your browser:<br/>
            <a href="${verifyLink}" style="color: #6366f1; word-break: break-all;">${verifyLink}</a>
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  // In development (Ethereal), log the preview URL so devs can view the email
  if (
    process.env.SMTP_HOST === "smtp.ethereal.email" ||
    !process.env.SMTP_HOST
  ) {
    logger.info(
      { previewUrl: nodemailer.getTestMessageUrl(info) },
      "Email preview URL (Ethereal)",
    );
  }
}

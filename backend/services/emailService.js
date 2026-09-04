const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Path to official project seal logo
const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');

function getLogoAttachments() {
  if (fs.existsSync(logoPath)) {
    return [
      {
        filename: 'logo.png',
        path: logoPath,
        cid: 'project_logo',
      },
    ];
  }
  return [];
}

let cachedTransporter = null;

/**
 * Creates and returns a configured Nodemailer transporter.
 * Uses connection pooling to keep SMTP connections warm and ultra-fast.
 */
function createTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');

  if (user && pass) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
    return cachedTransporter;
  }

  return null;
}

/**
 * Sends an official PWD ID Approval email to the recipient.
 */
async function sendPwdApprovalEmail({
  recipientEmail,
  recipientName,
  pwdIdNumber,
  referenceNumber,
  disabilityType,
  bloodType,
  approvedDate,
  contactNumber,
  address,
}) {
  if (!recipientEmail || !recipientEmail.includes('@')) {
    console.warn(`[Mailer] Invalid recipient email: "${recipientEmail}". Skipped.`);
    return { success: false, message: 'Invalid recipient email' };
  }

  const dateStr = approvedDate
    ? new Date(approvedDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Quezon City Government - Official PWD ID Approval</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 24px; color: #1e293b; }
        .badge { display: inline-block; background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 9999px; border: 1px solid #a7f3d0; margin-bottom: 20px; }
        .card { background: #f8fafc; border: 2px dashed #93c5fd; border-radius: 14px; padding: 24px; margin: 20px 0; }
        .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 14px; margin-bottom: 16px; }
        .id-number-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; margin: 12px 0; text-align: center; }
        .id-number-label { font-size: 11px; text-transform: uppercase; color: #1e40af; font-weight: 700; letter-spacing: 0.5px; }
        .id-number-val { font-size: 22px; font-family: monospace; font-weight: 800; color: #1d4ed8; letter-spacing: 2px; margin-top: 4px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
        .info-label { color: #64748b; font-weight: 600; }
        .info-val { color: #0f172a; font-weight: 700; text-align: right; }
        .button { display: block; width: 100%; text-align: center; background: #2563eb; color: #ffffff !important; padding: 14px 0; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; margin-top: 24px; box-shadow: 0 2px 6px rgba(37,99,235,0.3); }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:project_logo" alt="Quezon City Seal" width="60" height="60" style="margin-bottom: 10px; display: inline-block;" />
          <h1>QUEZON CITY GOVERNMENT</h1>
          <p>Social Services &amp; Development Department (SSDD) — Persons with Disability Affairs Division</p>
        </div>

        <div class="content">
          <div style="text-align: center;">
            <span class="badge">✓ APPLICATION APPROVED</span>
          </div>

          <h2 style="font-size: 18px; margin: 0 0 8px; color: #0f172a;">Greetings, ${recipientName || 'Applicant'}!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-top: 0;">
            Your application for the <strong>Persons with Disability (PWD) ID</strong> has been officially <strong>APPROVED</strong> by the Quezon City Social Services &amp; Development Department (SSDD).
          </p>

          <div class="card">
            <div class="id-number-box">
              <div class="id-number-label">Official PWD ID / QCID Number</div>
              <div class="id-number-val">${pwdIdNumber || referenceNumber || '110000116932100'}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Beneficiary Name:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${recipientName || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Disability Category:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${disabilityType || 'Physical / Visual Disability'}</td>
              </tr>
              ${bloodType ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Blood Type:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${bloodType}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Date of Approval:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${dateStr}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Status:</td>
                <td style="padding: 6px 0; color: #047857; font-weight: 700; text-align: right;">ACTIVE / VALID</td>
              </tr>
            </table>
          </div>

          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #166534; line-height: 1.5;">
            <strong>Notice:</strong> You can now access and view your <strong>Digital PWD ID</strong> via the GovServe User Portal to avail of the 20% statutory discount and city benefits in Quezon City.
          </div>

          <a href="https://frontend-production-1c51.up.railway.app/portal" class="button" target="_blank">
            OPEN MY DIGITAL PWD ID PORTAL
          </a>
        </div>

        <div class="footer">
          <p style="margin: 0 0 4px;">This is an official automated notification from the Quezon City SSDD Social Services Management System.</p>
          <p style="margin: 0;">Quezon City Hall Compound, Elliptical Road, Diliman, Quezon City | Helpline: 122</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. PRIMARY: Direct Gmail SMTP
  const transporter = createTransporter();
  const senderEmail = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');
  const attachments = getLogoAttachments();

  const mailOptions = {
    from: `"Quezon City SSDD (PWD Affairs)" <${senderEmail}>`,
    to: recipientEmail.trim(),
    subject: `[QC SSDD] Approved: Official PWD ID Record (${pwdIdNumber || referenceNumber})`,
    text: `Greetings ${recipientName}! Your PWD ID Application has been approved. Official ID: ${pwdIdNumber || referenceNumber}.`,
    html: htmlContent,
    attachments,
  };

  if (transporter) {
    try {
      console.log(`[Gmail SMTP 465] Dispatching official email to: ${recipientEmail}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Gmail SMTP 465] Successfully delivered to ${recipientEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, delivered: true, recipient: recipientEmail, provider: 'gmail-smtp-465' };
    } catch (primaryErr) {
      console.warn(`[Gmail SMTP 465 Failed] ${primaryErr.message}, attempting Port 587 STARTTLS...`);
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // STARTTLS
          auth: {
            user: senderEmail,
            pass: emailPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        });
        const info = await fallbackTransporter.sendMail(mailOptions);
        console.log(`[Gmail SMTP 587] Successfully delivered to ${recipientEmail}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId, delivered: true, recipient: recipientEmail, provider: 'gmail-smtp-587' };
      } catch (fallbackErr) {
        console.warn(`[Gmail SMTP 587 Failed] ${fallbackErr.message}, attempting Brevo REST API fallback...`);
      }
    }
  }

  // 2. SECONDARY FALLBACK: Brevo HTTPS REST API
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  if (brevoApiKey) {
    try {
      console.log(`[Brevo HTTPS API Fallback] Dispatching email to: ${recipientEmail}...`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Quezon City SSDD (PWD Affairs)', email: senderEmail },
          to: [{ email: recipientEmail.trim(), name: recipientName || 'Applicant' }],
          subject: `[QC SSDD] Approved: Official PWD ID Record (${pwdIdNumber || referenceNumber})`,
          htmlContent: htmlContent,
        }),
      });
      const data = await res.json();
      if (res.ok && data.messageId) {
        console.log(`[Brevo HTTPS API] Successfully delivered to ${recipientEmail}. MessageId: ${data.messageId}`);
        return { success: true, messageId: data.messageId, delivered: true, recipient: recipientEmail, provider: 'brevo' };
      } else {
        console.warn(`[Brevo API Error] ${JSON.stringify(data)}, attempting Resend fallback...`);
      }
    } catch (err) {
      console.warn(`[Brevo API Exception] ${err.message}, attempting Resend fallback...`);
    }
  }

  // 3. TERTIARY FALLBACK: Resend HTTPS API
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendApiKey) {
    try {
      console.log(`[Resend HTTPS API Fallback] Sending email to: ${recipientEmail}...`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Quezon City SSDD <onboarding@resend.dev>',
          to: [recipientEmail.trim()],
          subject: `[QC SSDD] Approved: Official PWD ID Record (${pwdIdNumber || referenceNumber})`,
          text: `Greetings ${recipientName}! Your PWD ID Application has been approved. Official ID: ${pwdIdNumber || referenceNumber}.`,
          html: htmlContent,
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        console.log(`[Resend HTTPS API] Email successfully delivered to ${recipientEmail}. MessageId: ${data.id}`);
        return { success: true, messageId: data.id, delivered: true, recipient: recipientEmail, provider: 'resend' };
      } else {
        console.warn(`[Resend API Error] ${JSON.stringify(data)}`);
      }
    } catch (apiErr) {
      console.warn(`[Resend API Exception] ${apiErr.message}`);
    }
  }

  return {
    success: false,
    message: `Failed to deliver email to ${recipientEmail}. All SMTP and REST providers failed.`,
  };
}

/**
 * Sends a 6-digit OTP verification email to the recipient.
 */
async function sendOtpEmail({ recipientEmail, otpCode, recipientName = 'Resident' }) {
  if (!recipientEmail || !recipientEmail.includes('@')) {
    console.warn(`[Mailer] Invalid recipient email for OTP: "${recipientEmail}". Skipped.`);
    return { success: false, message: 'Invalid recipient email' };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Quezon City Government - Account Verification OTP</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 24px; color: #1e293b; text-align: center; }
        .badge { display: inline-block; background-color: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 9999px; border: 1px solid #bfdbfe; margin-bottom: 20px; }
        .otp-box { background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
        .otp-code { font-size: 36px; font-weight: 800; font-family: 'Courier New', monospace; letter-spacing: 8px; color: #1e3a8a; margin: 8px 0; }
        .otp-note { font-size: 12px; color: #64748b; margin-top: 6px; }
        .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #991b1b; line-height: 1.5; text-align: left; margin-top: 20px; }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:project_logo" alt="Quezon City Seal" width="60" height="60" style="margin-bottom: 10px; display: inline-block;" />
          <h1>QUEZON CITY GOVERNMENT</h1>
          <p>Social Services Management System (GovServe Portal)</p>
        </div>

        <div class="content">
          <div>
            <span class="badge">EMAIL VERIFICATION CODE</span>
          </div>

          <h2 style="font-size: 18px; margin: 0 0 8px; color: #0f172a;">Hello!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-top: 0;">
            Please use the 6-digit One-Time Password (OTP) verification code below to complete your registration for your GovServe Resident Account:
          </p>

          <div class="otp-box">
            <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px;">YOUR VERIFICATION CODE</div>
            <div class="otp-code">${otpCode}</div>
            <div class="otp-note">Valid for <strong>10 minutes</strong>.</div>
          </div>

          <div class="warning-box">
            <strong>Security Notice:</strong> Do not share this OTP verification code with anyone. Quezon City SSDD personnel and administrators will never ask for your code.
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 4px;">This is an official automated security notification from the Quezon City GovServe Portal.</p>
          <p style="margin: 0;">Quezon City Hall Compound, Elliptical Road, Diliman, Quezon City</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. PRIMARY: Direct Gmail SMTP
  const transporter = createTransporter();
  const senderEmail = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');
  const attachments = getLogoAttachments();

  const mailOptions = {
    from: `"Quezon City GovServe" <${senderEmail}>`,
    to: recipientEmail.trim(),
    subject: `[QC GovServe] Your OTP Verification Code: ${otpCode}`,
    text: `Your Quezon City GovServe OTP Verification Code is: ${otpCode}. This code is valid for 10 minutes. Do not share this code with anyone.`,
    html: htmlContent,
    attachments,
  };

  if (transporter) {
    try {
      console.log(`[Gmail SMTP 465] Dispatching OTP to: ${recipientEmail}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Gmail SMTP 465] OTP delivered to ${recipientEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, delivered: true, recipient: recipientEmail, provider: 'gmail-smtp-465' };
    } catch (primaryErr) {
      console.warn(`[Gmail SMTP 465 Failed for OTP] ${primaryErr.message}, trying port 587...`);
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: { user: senderEmail, pass: emailPass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        });
        const info = await fallbackTransporter.sendMail(mailOptions);
        console.log(`[Gmail SMTP 587] OTP delivered to ${recipientEmail}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId, delivered: true, recipient: recipientEmail, provider: 'gmail-smtp-587' };
      } catch (fallbackErr) {
        console.warn(`[Gmail SMTP 587 Failed for OTP] ${fallbackErr.message}, attempting Brevo fallback...`);
      }
    }
  }

  // 2. FALLBACK: Brevo API
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  if (brevoApiKey) {
    try {
      console.log(`[Brevo API Fallback] Sending OTP to: ${recipientEmail}...`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Quezon City GovServe', email: senderEmail },
          to: [{ email: recipientEmail.trim(), name: recipientName }],
          subject: `[QC GovServe] Your OTP Verification Code: ${otpCode}`,
          htmlContent: htmlContent,
        }),
      });
      const data = await res.json();
      if (res.ok && data.messageId) {
        console.log(`[Brevo API] OTP delivered to ${recipientEmail}. MessageId: ${data.messageId}`);
        return { success: true, messageId: data.messageId, delivered: true, recipient: recipientEmail, provider: 'brevo' };
      }
    } catch (err) {
      console.warn(`[Brevo OTP Exception] ${err.message}`);
    }
  }

  return {
    success: false,
    message: `Failed to deliver OTP to ${recipientEmail}.`,
  };
}

module.exports = {
  sendPwdApprovalEmail,
  sendOtpEmail,
};

const nodemailer = require('nodemailer');

/**
 * Creates and returns a configured Nodemailer transporter.
 * Supports Gmail, custom SMTP, or fallback to console simulation.
 */
function createTransporter() {
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || 'clarencemillares159@gmail.com').trim();
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || 'xztmfarkbkammfpl').trim().replace(/\s+/g, '');

  if (user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
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
          <img src="https://quezoncity.gov.ph/wp-content/uploads/2021/01/QC-Logo-2021.png" alt="QC Seal" width="60" style="margin-bottom: 10px; display: inline-block;" onerror="this.style.display='none'" />
          <h1>LUNGSOD QUEZON</h1>
          <p>Social Services &amp; Development Department (SSDD) — Persons with Disability Affairs Division</p>
        </div>

        <div class="content">
          <div style="text-align: center;">
            <span class="badge">✓ APPLICATION APPROVED</span>
          </div>

          <h2 style="font-size: 18px; margin: 0 0 8px; color: #0f172a;">Mabuhay, ${recipientName || 'Aplikante'}!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-top: 0;">
            Ang iyong aplikasyon para sa <strong>Persons with Disability (PWD) ID</strong> ay opisyal nang <strong>NAAPRUBAHAN</strong> ng Quezon City SSDD.
          </p>

          <div class="card">
            <div class="id-number-box">
              <div class="id-number-label">Official PWD ID / QCID Number</div>
              <div class="id-number-val">${pwdIdNumber || referenceNumber || '110000116932100'}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Pangalan ng Benepisyaryo:</td>
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
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Petsa ng Pag-apruba:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${dateStr}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Status:</td>
                <td style="padding: 6px 0; color: #047857; font-weight: 700; text-align: right;">ACTIVE / VALID</td>
              </tr>
            </table>
          </div>

          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #166534; line-height: 1.5;">
            <strong>Paalala:</strong> Maaari mo nang gamitin ang iyong <strong>Digital PWD ID</strong> sa User Portal para sa pag-avail ng 20% statutory discount at mga benepisyo sa Quezon City.
          </div>

          <a href="https://frontend-production-1c51.up.railway.app/portal" class="button" target="_blank">
            BUKSAN ANG AKING DIGITAL PWD ID PORTAL
          </a>
        </div>

        <div class="footer">
          <p style="margin: 0 0 4px;">Ito ay opisyal na automated email mula sa Quezon City SSDD Social Service Management System.</p>
          <p style="margin: 0;">Quezon City Hall Compound, Elliptical Road, Diliman, Quezon City | Helpline: 122</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      console.log(`[Resend HTTPS API] Sending official PWD ID email to: ${recipientEmail}...`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Quezon City SSDD <onboarding@resend.dev>',
          to: [recipientEmail.trim()],
          subject: `[QC SSDD] Approved: Official PWD ID Record (${pwdIdNumber || referenceNumber})`,
          text: `Mabuhay ${recipientName}! Ang iyong PWD ID Application ay Aprubado na. Official ID: ${pwdIdNumber || referenceNumber}.`,
          html: htmlContent,
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        console.log(`[Resend HTTPS API] Email successfully delivered to ${recipientEmail}. MessageId: ${data.id}`);
        return { success: true, messageId: data.id, delivered: true, recipient: recipientEmail, provider: 'resend' };
      } else {
        console.warn(`[Resend API Error] ${JSON.stringify(data)}, falling back to SMTP...`);
      }
    } catch (apiErr) {
      console.warn(`[Resend API Exception] ${apiErr.message}, falling back to SMTP...`);
    }
  }

  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    try {
      console.log(`[Brevo HTTPS API] Sending email to: ${recipientEmail}...`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Quezon City SSDD (PWD Affairs)', email: 'clarencemillares159@gmail.com' },
          to: [{ email: recipientEmail.trim(), name: recipientName }],
          subject: `[QC SSDD] Approved: Official PWD ID Record (${pwdIdNumber || referenceNumber})`,
          htmlContent: htmlContent,
        }),
      });
      const data = await res.json();
      if (res.ok && data.messageId) {
        console.log(`[Brevo HTTPS API] Successfully delivered to ${recipientEmail}. MessageId: ${data.messageId}`);
        return { success: true, messageId: data.messageId, delivered: true, recipient: recipientEmail, provider: 'brevo' };
      } else {
        console.warn(`[Brevo API Error] ${JSON.stringify(data)}, falling back to other providers...`);
      }
    } catch (err) {
      console.warn(`[Brevo API Exception] ${err.message}`);
    }
  }

  const transporter = createTransporter();
  const senderEmail = (process.env.SMTP_USER || process.env.EMAIL_USER || 'clarencemillares159@gmail.com').trim();

  if (transporter) {
    const mailOptions = {
      from: `"Quezon City SSDD (PWD Affairs)" <${senderEmail}>`,
      to: recipientEmail.trim(),
      subject: `[QC SSDD] Approved: Official PWD ID Record (${pwdIdNumber || referenceNumber})`,
      text: `Mabuhay ${recipientName}! Ang iyong PWD ID Application ay Aprubado na. Official ID: ${pwdIdNumber || referenceNumber}.`,
      html: htmlContent,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Mailer] Real email successfully delivered to ${recipientEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, delivered: true, recipient: recipientEmail };
    } catch (primaryErr) {
      console.warn(`[Mailer] Primary transport failed (${primaryErr.message}), attempting fallback on port 587 STARTTLS...`);
      try {
        const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || 'xztmfarkbkammfpl').trim().replace(/\s+/g, '');
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // STARTTLS
          auth: {
            user: senderEmail,
            pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        });
        const info = await fallbackTransporter.sendMail(mailOptions);
        console.log(`[Mailer - Fallback 587] Real email successfully delivered to ${recipientEmail}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId, delivered: true, recipient: recipientEmail, channel: '587' };
      } catch (fallbackErr) {
        console.error(`[Mailer] All SMTP attempts failed for ${recipientEmail}:`, fallbackErr);
        return { success: false, error: fallbackErr.message, details: fallbackErr.stack };
      }
    }
  } else {
    console.log(`[Mailer - Simulation] Real SMTP not configured yet. Prepared email payload for: ${recipientEmail}`);
    console.log(`[Mailer - Details] Recipient: ${recipientName}, PWD ID: ${pwdIdNumber || referenceNumber}`);
    return {
      success: true,
      simulated: true,
      message: `Email prepared for ${recipientEmail}. To deliver via real Gmail/SMTP, configure SMTP_USER and SMTP_PASS in environment variables.`,
    };
  }
}

module.exports = {
  sendPwdApprovalEmail,
};

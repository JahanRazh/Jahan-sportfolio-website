import nodemailer from 'nodemailer';

/**
 * Check the status and available delivery channels for email notifications
 */
export function getEmailServiceStatus() {
  const hasSmtpUser = Boolean(process.env.SMTP_USER);
  const hasSmtpPass = Boolean(process.env.SMTP_PASS);
  const hasSmtp = hasSmtpUser && hasSmtpPass;

  const hasEmailJs = Boolean(
    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID &&
    process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
  );

  return {
    isConfigured: hasSmtp || hasEmailJs,
    primaryChannel: hasSmtp ? 'smtp' : (hasEmailJs ? 'emailjs' : 'none'),
    smtp: {
      configured: hasSmtp,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '465',
      user: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***@***` : null,
    },
    emailjs: {
      configured: hasEmailJs,
      serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || null,
    },
  };
}

/**
 * Create a reusable nodemailer transporter with optimal fallback defaults
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = port === 465 || port === 8443;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Generate rich, responsive HTML email for a new project announcement
 */
export function generateProjectNotificationHtml({
  project,
  recipientEmail = '',
  recipientName = '',
  siteUrl = 'https://jahanrazh.vercel.app',
}) {
  const {
    name = 'Exciting New Project',
    category = 'Web Application',
    shortDescription = '',
    description = '',
    technologies = [],
    imageUrl = '',
    liveUrl = '',
    githubUrl = '',
  } = project || {};

  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const unsubUrl = `${cleanSiteUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
  const displayDesc = shortDescription || description || 'A new full-stack project has just been deployed to the portfolio!';
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';

  // Build tech badges HTML
  const techPillsHtml = Array.isArray(technologies) && technologies.length > 0
    ? technologies.slice(0, 8).map(
        (t) => `<span style="display:inline-block;background-color:#1e293b;color:#38bdf8;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:600;margin-right:6px;margin-bottom:6px;border:1px solid #334155;">${escapeHtml(t)}</span>`
      ).join('')
    : '';

  // Build action buttons HTML
  let actionButtonsHtml = '';
  if (liveUrl) {
    actionButtonsHtml += `
      <a href="${escapeHtml(liveUrl)}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#06b6d4 100%);color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:10px;margin-right:10px;margin-bottom:10px;box-shadow:0 4px 14px rgba(99,102,241,0.4);text-align:center;">
        🚀 View Live Demo &rarr;
      </a>
    `;
  }
  if (githubUrl) {
    actionButtonsHtml += `
      <a href="${escapeHtml(githubUrl)}" target="_blank" style="display:inline-block;background-color:#0f172a;color:#f8fafc;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;margin-right:10px;margin-bottom:10px;border:1px solid #334155;text-align:center;">
        💻 View Source Code &rarr;
      </a>
    `;
  }
  actionButtonsHtml += `
    <a href="${escapeHtml(cleanSiteUrl)}#projects" target="_blank" style="display:inline-block;background-color:#1e293b;color:#94a3b8;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px;margin-bottom:10px;border:1px solid #334155;text-align:center;">
      ✨ Explore Portfolio
    </a>
  `;

  // Image section
  const imageBannerHtml = imageUrl
    ? `
      <div style="border-radius:16px;overflow:hidden;margin-bottom:24px;background-color:#090d16;border:1px solid #1e293b;max-height:360px;">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" style="width:100%;max-height:360px;object-fit:cover;display:block;" />
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project Launched: ${escapeHtml(name)}</title>
</head>
<body style="margin:0;padding:0;background-color:#070a13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#070a13;padding:30px 15px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table role="presentation" width="100%" style="max-width:620px;background-color:#0f172a;border-radius:24px;border:1px solid #1e293b;box-shadow:0 20px 40px rgba(0,0,0,0.6);overflow:hidden;" cellspacing="0" cellpadding="0">
          
          <!-- Top Header Accent Bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#6366f1 0%,#06b6d4 50%,#3b82f6 100%);height:4px;"></td>
          </tr>

          <!-- Brand & Tagline Header -->
          <tr>
            <td style="padding:32px 36px 20px 36px;text-align:center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <span style="display:inline-block;padding:6px 14px;border-radius:9999px;background:rgba(6,182,212,0.12);border:1px solid rgba(6,182,212,0.3);color:#22d3ee;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                      🚀 NEW PROJECT LAUNCHED
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:14px;">
                    <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">
                      Ramesh Jahan Jayalath
                    </h1>
                    <p style="margin:4px 0 0 0;font-size:13px;color:#94a3b8;font-weight:500;">
                      Software Developer &bull; IT Professional Portfolio Update
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding:10px 36px 32px 36px;">
              
              <p style="font-size:15px;color:#cbd5e1;margin-bottom:20px;">
                ${greeting} I am excited to share a brand-new project that was just added to my portfolio! Here is a quick look at what I built:
              </p>

              <!-- Project Highlight Box -->
              <table role="presentation" width="100%" style="background-color:#162032;border-radius:18px;border:1px solid #334155;padding:24px;margin-bottom:24px;" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <!-- Image Banner (if available) -->
                    ${imageBannerHtml}

                    <!-- Category badge -->
                    <div style="margin-bottom:8px;">
                      <span style="display:inline-block;background:rgba(99,102,241,0.2);color:#a5b4fc;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;">
                        ${escapeHtml(category)}
                      </span>
                    </div>

                    <!-- Project Title -->
                    <h2 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">
                      ${escapeHtml(name)}
                    </h2>

                    <!-- Project Description -->
                    <p style="margin:0 0 18px 0;font-size:14px;color:#94a3b8;line-height:1.6;">
                      ${escapeHtml(displayDesc)}
                    </p>

                    <!-- Tech stack pills -->
                    ${techPillsHtml ? `
                      <div style="margin-bottom:20px;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:700;margin-bottom:8px;">Tech Stack:</div>
                        ${techPillsHtml}
                      </div>
                    ` : ''}

                    <!-- Action buttons -->
                    <div style="padding-top:8px;">
                      ${actionButtonsHtml}
                    </div>

                  </td>
                </tr>
              </table>

              <p style="font-size:14px;color:#94a3b8;margin:0 0 8px 0;">
                Have feedback, ideas, or interested in collaborating? Reply directly to this email or reach out on my portfolio!
              </p>

            </td>
          </tr>

          <!-- Footer with Unsubscribe -->
          <tr>
            <td style="padding:24px 36px 32px 36px;background-color:#0b1120;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#64748b;">
                You received this email because you subscribed to project launch updates at <a href="${escapeHtml(cleanSiteUrl)}" style="color:#38bdf8;text-decoration:none;">jahanjayalath.com</a>.
              </p>
              <p style="margin:0;font-size:12px;color:#64748b;">
                No longer wish to receive project updates? 
                <a href="${escapeHtml(unsubUrl)}" style="color:#ef4444;text-decoration:underline;margin-left:4px;">
                  Unsubscribe here
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate rich, responsive HTML email for a new subscriber welcome email
 */
export function generateWelcomeSubscriberHtml({
  recipientEmail = '',
  recipientName = '',
  siteUrl = 'https://jahanrazh.vercel.app',
}) {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const unsubUrl = `${cleanSiteUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello!';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Jahan's Project Updates</title>
</head>
<body style="margin:0;padding:0;background-color:#070a13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#070a13;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:580px;background-color:#0f172a;border-radius:24px;border:1px solid #1e293b;box-shadow:0 20px 40px rgba(0,0,0,0.6);overflow:hidden;" cellspacing="0" cellpadding="0">
          
          <tr>
            <td style="background:linear-gradient(90deg,#06b6d4 0%,#6366f1 100%);height:4px;"></td>
          </tr>

          <tr>
            <td style="padding:36px 36px 16px 36px;text-align:center;">
              <span style="display:inline-block;padding:6px 14px;border-radius:9999px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);color:#4ade80;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                🎉 SUBSCRIPTION CONFIRMED
              </span>
              <h1 style="margin:16px 0 0 0;font-size:24px;font-weight:800;color:#ffffff;">
                Welcome to My Inner Circle!
              </h1>
              <p style="margin:6px 0 0 0;font-size:14px;color:#94a3b8;">
                Ramesh Jahan Jayalath &bull; Software &amp; IT Updates
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 36px 32px 36px;">
              <p style="font-size:15px;color:#cbd5e1;margin-bottom:16px;">
                ${greeting} Thank you so much for subscribing to my portfolio updates!
              </p>
              
              <div style="background-color:#162032;border-radius:16px;border:1px solid #334155;padding:20px;margin-bottom:24px;">
                <h3 style="margin:0 0 10px 0;font-size:15px;color:#38bdf8;font-weight:700;">
                  Here is what you can look forward to:
                </h3>
                <ul style="margin:0;padding-left:20px;color:#94a3b8;font-size:14px;line-height:1.8;">
                  <li><strong style="color:#ffffff;">New Projects:</strong> Instant notifications whenever I launch a new full-stack app, AI system, or open-source tool.</li>
                  <li><strong style="color:#ffffff;">Live Demos &amp; Code:</strong> Direct links to live interactive demos and GitHub repositories.</li>
                  <li><strong style="color:#ffffff;">Zero Spam:</strong> You will only receive curated, high-value release announcements.</li>
                </ul>
              </div>

              <div style="text-align:center;padding:10px 0 20px 0;">
                <a href="${escapeHtml(cleanSiteUrl)}#projects" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#06b6d4 100%);color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:10px;box-shadow:0 4px 14px rgba(99,102,241,0.4);">
                  Explore Current Projects &rarr;
                </a>
              </div>

              <p style="font-size:13px;color:#64748b;margin:0;text-align:center;">
                Cheers,<br />
                <strong style="color:#cbd5e1;">Ramesh Jahan Jayalath (Jahan Razh)</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 36px 24px 36px;background-color:#0b1120;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;font-size:11px;color:#64748b;">
                Change your mind? You can <a href="${escapeHtml(unsubUrl)}" style="color:#ef4444;text-decoration:underline;">unsubscribe anytime</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send an email using Nodemailer SMTP
 */
export async function sendEmailViaSmtp({
  to,
  subject,
  html,
  text,
}) {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env');
  }

  const senderUser = process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'Ramesh Jahan Jayalath';
  const from = `"${fromName}" <${senderUser}>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: text || subject,
    html,
  });

  return info;
}

/**
 * Broadcast new project notification to a list of subscribers
 */
export async function broadcastProjectNotification({
  project,
  subscribers = [],
  siteUrl = 'https://jahanrazh.vercel.app',
}) {
  if (!subscribers || subscribers.length === 0) {
    return {
      success: true,
      sentCount: 0,
      failedCount: 0,
      message: 'No active subscribers to notify.',
    };
  }

  const transporter = createTransporter();
  if (!transporter) {
    return {
      success: false,
      reason: 'smtp_not_configured',
      message: 'SMTP credentials (SMTP_USER and SMTP_PASS) are not configured in .env. Email broadcast skipped.',
      subscribersCount: subscribers.length,
    };
  }

  const results = {
    sentCount: 0,
    failedCount: 0,
    errors: [],
  };

  const subject = `🚀 New Project Launched: ${project.name || 'Check out my latest build!'}`;

  for (const sub of subscribers) {
    const email = typeof sub === 'string' ? sub : sub.email;
    const name = typeof sub === 'object' ? sub.name : '';

    if (!email) continue;

    try {
      const html = generateProjectNotificationHtml({
        project,
        recipientEmail: email,
        recipientName: name,
        siteUrl,
      });

      await sendEmailViaSmtp({
        to: email,
        subject,
        html,
        text: `New Project: ${project.name}\n\n${project.shortDescription || project.description || ''}\n\nView live at: ${project.liveUrl || siteUrl}`,
      });

      results.sentCount += 1;
    } catch (err) {
      results.failedCount += 1;
      results.errors.push({ email, error: err.message });
      console.error(`Failed to notify ${email}:`, err);
    }
  }

  return {
    success: results.sentCount > 0 || results.failedCount === 0,
    sentCount: results.sentCount,
    failedCount: results.failedCount,
    totalSubscribers: subscribers.length,
    errors: results.errors,
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

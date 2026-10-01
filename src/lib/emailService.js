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
 * Safely resolves a project image URL to an absolute, email-client-accessible URL.
 * Handles relative paths (/assets/...), localhost rewriting, and fallbacks.
 */
export function resolveProjectImageUrl(rawImage, siteUrl = 'https://jahanrazh.vercel.app') {
  if (!rawImage || typeof rawImage !== 'string') return '';
  const trimmed = rawImage.trim();
  if (!trimmed) return '';

  const fallbackProductionUrl = 'https://jahanrazh.vercel.app';
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
      : fallbackProductionUrl;

  // 1. If absolute URL
  if (/^https?:\/\//i.test(trimmed)) {
    // If it points to localhost (e.g. during local testing), Gmail/Outlook cannot access localhost.
    // Rewrite localhost origin to the public production URL so email clients can load the image!
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
      const pathAndQuery = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
      return `${configuredSiteUrl}${pathAndQuery.startsWith('/') ? '' : '/'}${pathAndQuery}`;
    }
    return trimmed;
  }

  // 2. If it's a data URI (e.g. data:image/...)
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  // 3. If relative URL (e.g., '/assets/images/card1.gif' or 'assets/images/card1.gif')
  let cleanBase = siteUrl ? siteUrl.replace(/\/+$/, '') : configuredSiteUrl;
  if (/localhost|127\.0\.0\.1/i.test(cleanBase)) {
    cleanBase = configuredSiteUrl;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanBase}${normalizedPath}`;
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
    liveUrl = '',
    githubUrl = '',
  } = project || {};

  // Extract raw image from any common project attribute
  const rawImage =
    (project && (project.imageUrl || project.image || project.thumbnailUrl || project.fileUrl || project.photoUrl)) || '';

  const cleanSiteUrl = siteUrl ? siteUrl.replace(/\/+$/, '') : 'https://jahanrazh.vercel.app';
  // Ensure public links in email don't point to unreachable localhost
  const publicSiteUrl = (/localhost|127\.0\.0\.1/i.test(cleanSiteUrl))
    ? ((process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost'))
        ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
        : 'https://jahanrazh.vercel.app')
    : cleanSiteUrl;

  const unsubUrl = `${publicSiteUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
  const displayDesc = shortDescription || description || 'A new full-stack project has just been deployed to the portfolio!';
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';
  const primaryLink = liveUrl || githubUrl || `${publicSiteUrl}#projects`;

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
    <a href="${escapeHtml(publicSiteUrl)}#projects" target="_blank" style="display:inline-block;background-color:#1e293b;color:#94a3b8;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px;margin-bottom:10px;border:1px solid #334155;text-align:center;">
      ✨ Explore Portfolio
    </a>
  `;

  // Safe image resolution: handles relative paths (/assets/...), localhost rewriting, and fallbacks
  const resolvedImageUrl = resolveProjectImageUrl(rawImage, siteUrl);

  // Email client compatible photo banner: table-wrapped with width and inline styles for Outlook & Gmail
  let imageBannerHtml = '';
  if (resolvedImageUrl && !resolvedImageUrl.startsWith('data:')) {
    imageBannerHtml = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:22px;border-radius:16px;overflow:hidden;background-color:#090d16;border:1px solid #1e293b;">
        <tr>
          <td align="center" style="padding:0;line-height:0;background-color:#090d16;">
            <a href="${escapeHtml(primaryLink)}" target="_blank" style="text-decoration:none;display:block;">
              <img
                src="${escapeHtml(resolvedImageUrl)}"
                alt="${escapeHtml(name)}"
                width="548"
                border="0"
                style="display:block;width:100%;max-width:100%;height:auto;max-height:360px;object-fit:cover;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;border-radius:14px;"
              />
            </a>
          </td>
        </tr>
      </table>
    `;
  } else {
    // Stylized high-impact fallback banner when no photo is provided
    imageBannerHtml = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:22px;border-radius:16px;overflow:hidden;background:linear-gradient(135deg,#090d16 0%,#1e1b4b 60%,#0f172a 100%);border:1px solid #1e293b;">
        <tr>
          <td align="center" style="padding:34px 20px;text-align:center;">
            <div style="display:inline-block;width:54px;height:54px;line-height:54px;border-radius:16px;background:rgba(99,102,241,0.22);border:1px solid rgba(99,102,241,0.45);font-size:24px;font-weight:800;color:#22d3ee;text-align:center;margin-bottom:12px;">
              ${escapeHtml((name || 'P').charAt(0).toUpperCase())}
            </div>
            <div style="font-size:18px;font-weight:800;color:#ffffff;margin-bottom:6px;">
              ${escapeHtml(name)}
            </div>
            <span style="display:inline-block;padding:3px 12px;border-radius:9999px;background:rgba(6,182,212,0.15);border:1px solid rgba(6,182,212,0.3);color:#38bdf8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
              ${escapeHtml(category || 'Featured Project')}
            </span>
          </td>
        </tr>
      </table>
    `;
  }

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

/**
 * Generate responsive HTML email for replying to a visitor's contact inquiry
 */
export function generateContactReplyHtml({
  recipientName = '',
  recipientEmail = '',
  replyText = '',
  originalSubject = '',
  originalMessage = '',
  siteUrl = 'https://jahanrazh.vercel.app',
}) {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hello,';
  const paragraphs = (replyText || '')
    .split('\n')
    .filter((p) => p.trim())
    .map((p) => `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#cbd5e1;">${escapeHtml(p)}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Response to your message</title>
</head>
<body style="margin:0;padding:0;background-color:#070a13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#070a13;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background-color:#0f172a;border-radius:24px;border:1px solid #1e293b;box-shadow:0 20px 40px rgba(0,0,0,0.6);overflow:hidden;" cellspacing="0" cellpadding="0">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#06b6d4 0%,#6366f1 100%);height:4px;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 20px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display:inline-block;padding:4px 12px;border-radius:9999px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);color:#a5b4fc;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                      DIRECT MESSAGE REPLY
                    </span>
                    <h1 style="margin:12px 0 2px 0;font-size:22px;font-weight:800;color:#ffffff;">
                      Ramesh Jahan Jayalath
                    </h1>
                    <p style="margin:0;font-size:13px;color:#94a3b8;">
                      Software Developer &bull; IT Professional
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Reply Content -->
          <tr>
            <td style="padding:10px 36px 28px 36px;">
              <p style="font-size:15px;color:#cbd5e1;font-weight:600;margin-bottom:16px;">
                ${greeting}
              </p>

              <div style="margin-bottom:24px;">
                ${paragraphs || '<p style="color:#cbd5e1;font-size:15px;">Thank you for getting in touch!</p>'}
              </div>

              <!-- Quoted Visitor Message Box -->
              ${originalMessage ? `
                <table role="presentation" width="100%" style="background-color:#162032;border-radius:14px;border-left:4px solid #06b6d4;border-top:1px solid #1e293b;border-right:1px solid #1e293b;border-bottom:1px solid #1e293b;padding:16px 20px;margin-bottom:24px;" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <div style="font-size:11px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
                        Regarding your message${originalSubject ? `: "${escapeHtml(originalSubject)}"` : ''}
                      </div>
                      <div style="font-size:13px;color:#94a3b8;font-style:italic;line-height:1.6;">
                        &ldquo;${escapeHtml(originalMessage)}&rdquo;
                      </div>
                    </td>
                  </tr>
                </table>
              ` : ''}

              <div style="padding-top:10px;border-top:1px solid #1e293b;margin-top:20px;">
                <p style="margin:0 0 4px 0;font-size:14px;color:#94a3b8;">
                  Best regards,
                </p>
                <p style="margin:0 0 2px 0;font-size:15px;font-weight:700;color:#ffffff;">
                  Ramesh Jahan Jayalath (Jahan Razh)
                </p>
                <p style="margin:0;font-size:12px;color:#64748b;">
                  Email: <a href="mailto:jahanrazh@gmail.com" style="color:#38bdf8;text-decoration:none;">jahanrazh@gmail.com</a> &bull; Web: <a href="${escapeHtml(cleanSiteUrl)}" style="color:#38bdf8;text-decoration:none;">jahanjayalath.com</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 36px 24px 36px;background-color:#0b1120;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;font-size:11px;color:#64748b;">
                This email was sent in direct reply to an inquiry submitted on <a href="${escapeHtml(cleanSiteUrl)}" style="color:#64748b;text-decoration:underline;">jahanjayalath.com</a>.
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
 * Send an email reply to a visitor
 */
export async function sendContactReplyEmail({
  to,
  recipientName = '',
  subject = '',
  replyText = '',
  originalSubject = '',
  originalMessage = '',
  siteUrl = 'https://jahanrazh.vercel.app',
}) {
  const html = generateContactReplyHtml({
    recipientName,
    recipientEmail: to,
    replyText,
    originalSubject,
    originalMessage,
    siteUrl,
  });

  const replySubject = subject || (originalSubject ? `Re: ${originalSubject}` : 'Re: Your inquiry on my portfolio');

  return await sendEmailViaSmtp({
    to,
    subject: replySubject,
    html,
    text: `${replyText}\n\n---\nRegarding your message:\n${originalMessage}\n\nBest regards,\nRamesh Jahan Jayalath`,
  });
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


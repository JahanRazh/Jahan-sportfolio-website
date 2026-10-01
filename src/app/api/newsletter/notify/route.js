import { NextResponse } from 'next/server';
import { getAllActiveSubscribers } from '../../../../lib/firestore';
import {
  broadcastProjectNotification,
  sendEmailViaSmtp,
  generateProjectNotificationHtml,
  getEmailServiceStatus,
} from '../../../../lib/emailService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { project, targetEmail, sendToAll = false } = body || {};

    if (!project || !project.name) {
      return NextResponse.json(
        { success: false, error: 'Project data with at least a project name is required.' },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://jahanrazh.vercel.app';

    const status = getEmailServiceStatus();

    // Check if SMTP is configured
    if (!status.smtp.configured) {
      return NextResponse.json({
        success: false,
        reason: 'smtp_not_configured',
        error:
          'SMTP credentials are not configured in your .env file. Add SMTP_USER and SMTP_PASS to enable real email sending.',
        smtpStatus: status.smtp,
      });
    }

    // 1. Single Test Email Mode
    if (targetEmail) {
      const cleanTarget = targetEmail.trim().toLowerCase();
      const html = generateProjectNotificationHtml({
        project,
        recipientEmail: cleanTarget,
        recipientName: 'Developer / Admin',
        siteUrl: origin,
      });

      await sendEmailViaSmtp({
        to: cleanTarget,
        subject: `[TEST] 🚀 New Project Launched: ${project.name}`,
        html,
        text: `New Project: ${project.name}\n${project.shortDescription || ''}\nView at: ${project.liveUrl || origin}`,
      });

      return NextResponse.json({
        success: true,
        mode: 'test',
        recipient: cleanTarget,
        message: `Test email successfully sent to ${cleanTarget}!`,
      });
    }

    // 2. Broadcast to All Active Subscribers
    if (sendToAll) {
      const activeSubscribers = await getAllActiveSubscribers();

      if (!activeSubscribers || activeSubscribers.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No active subscribers found in database to notify.',
          sentCount: 0,
          totalSubscribers: 0,
        });
      }

      const broadcastResult = await broadcastProjectNotification({
        project,
        subscribers: activeSubscribers,
        siteUrl: origin,
      });

      return NextResponse.json({
        success: broadcastResult.success,
        mode: 'broadcast',
        sentCount: broadcastResult.sentCount,
        failedCount: broadcastResult.failedCount,
        totalSubscribers: broadcastResult.totalSubscribers,
        message: `Successfully notified ${broadcastResult.sentCount} out of ${broadcastResult.totalSubscribers} subscribers!`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Please specify targetEmail or set sendToAll: true.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Project notification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send notification email.' },
      { status: 500 }
    );
  }
}

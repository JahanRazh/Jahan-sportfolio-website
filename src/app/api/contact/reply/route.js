import { NextResponse } from 'next/server';
import { recordMessageReply } from '../../../../lib/firestore';
import { sendContactReplyEmail, getEmailServiceStatus } from '../../../../lib/emailService';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      messageId,
      toEmail,
      recipientName = '',
      subject = '',
      replyText = '',
      originalSubject = '',
      originalMessage = '',
    } = body || {};

    if (!toEmail || !toEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Recipient email address is invalid.' },
        { status: 400 }
      );
    }

    if (!replyText || !replyText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Reply message text cannot be empty.' },
        { status: 400 }
      );
    }

    const emailStatus = getEmailServiceStatus();
    if (!emailStatus.smtp.configured) {
      return NextResponse.json({
        success: false,
        reason: 'smtp_not_configured',
        error:
          'SMTP credentials are not configured in your .env file. Please add SMTP_USER and SMTP_PASS to send email replies directly.',
      });
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://jahanrazh.vercel.app';

    // Send email to visitor
    await sendContactReplyEmail({
      to: toEmail.trim(),
      recipientName: recipientName.trim(),
      subject: subject.trim(),
      replyText: replyText.trim(),
      originalSubject,
      originalMessage,
      siteUrl: origin,
    });

    // Record reply status in Firestore if messageId is provided
    if (messageId) {
      try {
        await recordMessageReply(messageId, {
          replyText: replyText.trim(),
          replySubject: subject.trim(),
        });
      } catch (dbErr) {
        console.warn('Failed to update replied status in Firestore:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Email reply successfully delivered to ${toEmail}!`,
    });
  } catch (error) {
    console.error('Contact reply error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send reply email.' },
      { status: 500 }
    );
  }
}

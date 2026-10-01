import { NextResponse } from 'next/server';
import { subscribeVisitorEmail } from '../../../../lib/firestore';
import { generateWelcomeSubscriberHtml, sendEmailViaSmtp, getEmailServiceStatus } from '../../../../lib/emailService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name = '', source = 'portfolio' } = body || {};

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // Save or reactivate in Firestore
    const result = await subscribeVisitorEmail({
      email: cleanEmail,
      name,
      source,
    });

    // If new or reactivated, try to send a welcome email if SMTP is configured
    const status = getEmailServiceStatus();
    let welcomeEmailSent = false;

    if (status.smtp.configured && (result.isNew || result.reactivated)) {
      try {
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://jahanrazh.vercel.app';
        const welcomeHtml = generateWelcomeSubscriberHtml({
          recipientEmail: cleanEmail,
          recipientName: name,
          siteUrl: origin,
        });

        await sendEmailViaSmtp({
          to: cleanEmail,
          subject: '🎉 Welcome to Ramesh Jahan Jayalath’s Project Updates!',
          html: welcomeHtml,
          text: `Welcome! Thank you for subscribing to my portfolio updates. You will be notified whenever I release a new project.`,
        });
        welcomeEmailSent = true;
      } catch (emailErr) {
        console.warn('Welcome email delivery failed (subscriber still recorded):', emailErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Thank you for subscribing!',
      isNew: result.isNew,
      alreadySubscribed: result.alreadySubscribed,
      reactivated: result.reactivated,
      welcomeEmailSent,
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Subscription failed. Please try again.' },
      { status: 500 }
    );
  }
}

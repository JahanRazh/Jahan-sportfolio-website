import { NextResponse } from 'next/server';
import { unsubscribeVisitorEmail, subscribeVisitorEmail } from '../../../../lib/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body || {};

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required.' },
        { status: 400 }
      );
    }

    const result = await unsubscribeVisitorEmail(email);
    return NextResponse.json({
      success: true,
      message: result.message || 'You have been unsubscribed successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to unsubscribe.' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Email parameter missing.' },
      { status: 400 }
    );
  }

  try {
    await unsubscribeVisitorEmail(email);
    return NextResponse.redirect(
      new URL(`/unsubscribe?email=${encodeURIComponent(email)}&status=success`, request.url)
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL(`/unsubscribe?email=${encodeURIComponent(email)}&status=error`, request.url)
    );
  }
}

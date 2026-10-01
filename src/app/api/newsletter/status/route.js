import { NextResponse } from 'next/server';
import { getEmailServiceStatus } from '../../../../lib/emailService';
import { getAllActiveSubscribers } from '../../../../lib/firestore';

export async function GET() {
  try {
    const status = getEmailServiceStatus();
    const activeSubscribers = await getAllActiveSubscribers();

    return NextResponse.json({
      success: true,
      emailStatus: status,
      activeSubscribersCount: activeSubscribers.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

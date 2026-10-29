import { NextResponse } from 'next/server';
import { 
  sendWaitlistEmail, 
  sendBetaInviteEmail, 
  sendTrialWelcomeEmail, 
  sendTrialReminderEmail, 
  sendProWelcomeEmail 
} from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email, stage, firstName } = await req.json();
    const name = firstName || 'Sync-Pioneer';

    if (!email || !stage) {
      return NextResponse.json({ error: 'Email and stage are required' }, { status: 400 });
    }

    switch (stage) {
      case 'waitlist':
        await sendWaitlistEmail(email, name);
        break;
      case 'invite':
        await sendBetaInviteEmail(email, `${process.env.NEXT_PUBLIC_SITE_URL}/signup`);
        break;
      case 'trial':
        await sendTrialWelcomeEmail(email, name);
        break;
      case 'reminder':
        await sendTrialReminderEmail(email, name);
        break;
      case 'pro':
        await sendProWelcomeEmail(email, name);
        break;
      default:
        return NextResponse.json({ error: 'Invalid funnel stage' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Successfully sent ${stage} email to ${email}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
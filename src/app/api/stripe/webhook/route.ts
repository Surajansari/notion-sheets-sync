import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // Service role client
import { sendProWelcomeEmail } from '@/lib/email';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const email = session.customer_details?.email || session.customer_email;

    if (email) {
      // 1. Update user profile status in Supabase
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('email', email);

      // 2. Send celebratory Pro Welcome Email with emojis
      await sendProWelcomeEmail(email, session.customer_details?.name || 'Sync-Pro');
    }
  }

  return NextResponse.json({ received: true });
}
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build";
    const stripe = new Stripe(stripeKey);

    const { email, userId } = await req.json();

    let rawUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usesyncflow.com";
    rawUrl = rawUrl.replace(/\[|\]|\(https?:\/\/[^\)]+\)/g, "").trim();
    if (!rawUrl.startsWith("http")) rawUrl = "https://usesyncflow.com";

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      client_reference_id: userId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${rawUrl}/dashboard?status=pro_active`,
      cancel_url: `${rawUrl}/dashboard?status=checkout_cancelled`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
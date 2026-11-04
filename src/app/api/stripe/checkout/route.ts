import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePriceId = process.env.STRIPE_PRICE_ID;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY is missing in environment variables." },
        { status: 500 }
      );
    }

    if (!stripePriceId) {
      return NextResponse.json(
        { error: "STRIPE_PRICE_ID is missing in environment variables." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const body = await req.json().catch(() => ({}));
    const { email, userId } = body;

    let rawUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usesyncflow.com";
    rawUrl = rawUrl.replace(/\[|\]|\(https?:\/\/[^\)]+\)/g, "").trim();
    if (!rawUrl.startsWith("http")) rawUrl = "https://usesyncflow.com";

    const session = await stripe.checkout.sessions.create({
      customer_email: email || undefined,
      client_reference_id: userId || undefined,
      line_items: [
        {
          price: stripePriceId,
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
    return NextResponse.json(
      { error: err.message || "Failed to create Stripe session" },
      { status: 500 }
    );
  }
}
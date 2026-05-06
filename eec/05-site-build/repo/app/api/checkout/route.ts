// Stub Stripe checkout. Returns 501 until STRIPE_SECRET_KEY is set.
// Real impl: build Stripe Checkout Session from cart lines and return { url }.

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey === 'TBD') {
    return NextResponse.json(
      {
        error: 'stripe_not_configured',
        message:
          'STRIPE_SECRET_KEY is not set. Front-end falls back to stub checkout. Set the key in .env.local to enable real Stripe Checkout.'
      },
      { status: 501 }
    );
  }

  const body = await req.json();
  // Real implementation outline (not run):
  //   import Stripe from 'stripe';
  //   const stripe = new Stripe(stripeKey);
  //   const session = await stripe.checkout.sessions.create({
  //     mode: 'payment',
  //     line_items: body.lines.map((l) => ({
  //       price_data: {
  //         currency: l.sku.price.currency,
  //         unit_amount: Math.round(l.sku.price.amount * 100),
  //         product_data: { name: l.sku.name }
  //       },
  //       quantity: l.quantity
  //     })),
  //     customer_email: body.email,
  //     success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?status=success&id={CHECKOUT_SESSION_ID}`,
  //     cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart?status=canceled`
  //   });
  //   return NextResponse.json({ url: session.url });

  return NextResponse.json({ error: 'unreachable_stub_branch', received: body }, { status: 501 });
}

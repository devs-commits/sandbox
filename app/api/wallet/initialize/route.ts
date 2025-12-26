import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const { amount, email, callbackUrl } = await request.json();

    if (!amount || !email) {
      return NextResponse.json(
        { error: 'Amount and email are required' },
        { status: 400 }
      );
    }

    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is missing');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to kobo
        email,
        callback_url: callbackUrl,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      console.error('Paystack initialization failed:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to initialize payment' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    });

  } catch (error) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

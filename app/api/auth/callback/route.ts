import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  
  // 1. Check if we have the necessary verification tokens from the email link
  if (token_hash && type) {
    
    // 2. Initialize a basic Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 3. Verify the token with Supabase to mark the email as "Confirmed"
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // ✅ Verification Successful! Redirect them straight to your login page.
      // (If your login page is at /student/login instead, update the string below)
      return NextResponse.redirect(`${requestUrl.origin}/login?verified=true`);
    } else {
      console.error("Verification Error:", error.message);
    }
  }

  // ❌ If verification fails or the link is broken, still send them to login but with an error flag
  return NextResponse.redirect(`${requestUrl.origin}/login?error=verification_failed`);
}
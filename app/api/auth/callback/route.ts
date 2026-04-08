import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  
  // 🔥 THE FIX: Stop using requestUrl.origin! 
  // We explicitly grab the live AWS domain from the proxy headers.
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "labs.wdc.ng";
  const originUrl = `${protocol}://${host}`;
  
  if (token_hash && type) {
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // ✅ Now it will securely redirect to https://labs.wdc.ng/login
      return NextResponse.redirect(`${originUrl}/login?verified=true`);
    } else {
      console.error("Verification Error:", error.message);
    }
  }

  // ❌ Fallback error route to the live domain
  return NextResponse.redirect(`${originUrl}/login?error=verification_failed`);
}
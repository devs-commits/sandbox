import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {

  try {

    const { userId, nin, bvn } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { error } = await supabase
      .from("users")
      .update({
        nin,
        bvn
      })
      .eq("auth_id", userId);

    if (error) {
      return NextResponse.json({ error: "Failed to save identity" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {

    return NextResponse.json({ error: "Server error" }, { status: 500 });

  }

}
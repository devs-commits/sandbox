import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST: Sending an invite from the Discover Feed
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, receiverId, squadId } = body;

    // 1. Specific error tracking so we know EXACTLY what is missing
    if (!senderId) return NextResponse.json({ error: "Missing senderId: Your session might be out of sync." }, { status: 400 });
    if (!receiverId) return NextResponse.json({ error: "Missing receiverId: Cannot identify target user." }, { status: 400 });
    if (!squadId) return NextResponse.json({ error: "Missing squadId: You don't appear to be in a squad." }, { status: 400 });

    // 2. 🔥 THE FIX: Catch dummy/test accounts securely
    if (String(receiverId).startsWith("dummy-")) {
        return NextResponse.json({ error: "This learner has not fully set up their account yet." }, { status: 400 });
    }

    // 3. Check for existing invites
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", receiverId)
      .eq("squad_id", squadId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) return NextResponse.json({ error: "An invite is already pending for this user." }, { status: 400 });

    // 4. Send the invite
    const { error } = await supabase.from("notifications").insert({
      user_id: receiverId,
      sender_id: senderId,
      squad_id: squadId,
      type: "squad_invite"
    });

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Accepting or Declining an invite from the Header Bell
export async function PATCH(request: Request) {
  try {
    const { notificationId, action, squadId, userId } = await request.json();

    // Mark notification as resolved
    await supabase.from("notifications").update({ status: action }).eq("id", notificationId);

    // If accepted, add them to the squad (if there is space)
    if (action === "accepted") {
      const { data: roster } = await supabase.from("squad_members").select("id").eq("squad_id", squadId);
      
      if (roster && roster.length >= 4) {
        return NextResponse.json({ error: "This squad is already full!" }, { status: 400 });
      }

      const { error: joinError } = await supabase.from("squad_members").insert({
        squad_id: squadId,
        user_id: userId,
        status: "active"
      });

      if (joinError) throw joinError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST: Sending an invite from the Discover Feed
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, receiverId, squadId } = body;

    console.log("INVITE PAYLOAD RECEIVED:", { senderId, receiverId, squadId });

    if (!senderId) return NextResponse.json({ error: "Missing senderId: Your session might be out of sync." }, { status: 400 });
    if (!receiverId) return NextResponse.json({ error: "Missing receiverId: Cannot identify the target learner." }, { status: 400 });
    if (squadId === undefined || squadId === null) return NextResponse.json({ error: "Missing squadId: You don't appear to be in a squad." }, { status: 400 });

    if (String(receiverId).startsWith("dummy-") || String(receiverId).trim() === "") {
        return NextResponse.json({ error: "This learner has not fully set up their account yet." }, { status: 400 });
    }

    // 🔥 THE FIX: Calculate 3 hours ago to prevent sending duplicates within the window
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    const { data: existing } = await supabase
      .from("notifications")
      .select("id, created_at")
      .eq("user_id", receiverId)
      .eq("squad_id", squadId)
      .eq("status", "pending")
      .gte("created_at", threeHoursAgo) // Only check unexpired invites
      .maybeSingle();

    if (existing) return NextResponse.json({ error: "An active invite is already pending for this user." }, { status: 400 });

    const { error } = await supabase.from("notifications").insert({
      user_id: receiverId,
      sender_id: senderId,
      squad_id: squadId,
      type: "squad_invite"
    });

    if (error) throw error;
    
    // 📧 NOTE FOR LATER: We will add the email function call here!
    // await sendZeptoMailInvite(receiverId, squadId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("INVITE API ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Accepting or Declining an invite from the Header Bell
export async function PATCH(request: Request) {
  try {
    const { notificationId, action, squadId, userId } = await request.json();

    // 🔥 THE FIX: Ensure the invite hasn't expired before letting them accept it
    const { data: notif } = await supabase
      .from("notifications")
      .select("created_at")
      .eq("id", notificationId)
      .single();
      
    if (notif) {
       const inviteTime = new Date(notif.created_at).getTime();
       const now = Date.now();
       if (now - inviteTime > 3 * 60 * 60 * 1000) { // 3 Hours in milliseconds
          await supabase.from("notifications").update({ status: 'expired' }).eq("id", notificationId);
          return NextResponse.json({ error: "This invite has expired. (Over 3 hours old)" }, { status: 400 });
       }
    }

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
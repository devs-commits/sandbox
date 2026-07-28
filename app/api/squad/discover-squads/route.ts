import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: squadsRaw, error: squadErr } = await supabase
      .from("squads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100); 

    if (squadErr) throw squadErr;

    // 🔥 THE FIX: Use select("*") to avoid crashing on missing columns like 'status'
    const { data: membersRaw, error: memErr } = await supabase
      .from("squad_members")
      .select("*");

    if (memErr) throw memErr;

    const availableSquads = [];

    for (const squad of squadsRaw || []) {
      const squadMembers = (membersRaw || []).filter((m: any) => m.squad_id === squad.id);
      
      if (squadMembers.length > 0 && squadMembers.length < 4) {
         availableSquads.push({
            id: squad.id,
            name: squad.name,
            slug: squad.slug,
            memberCount: squadMembers.length,
            // Fallback securely in case 'status' doesn't exist
            activeCount: squadMembers.filter((m: any) => m.status === 'active' || !m.status).length,
         });
      }
    }

    return NextResponse.json({ success: true, squads: availableSquads.slice(0, 20) });
  } catch (error: any) {
    console.error("Discover Squads API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
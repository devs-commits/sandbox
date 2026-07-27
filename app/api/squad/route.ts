import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  try {
    const { data: memberData } = await supabase.from("squad_members").select("squad_id").eq("user_id", userId).maybeSingle();
    if (!memberData) return NextResponse.json({ inSquad: false });

    const { data: squadData } = await supabase.from("squads").select("*").eq("id", memberData.squad_id).single();
    const { data: rosterRaw } = await supabase.from("squad_members").select("*").eq("squad_id", memberData.squad_id);

    if (!rosterRaw) return NextResponse.json({ inSquad: true, squad: { ...squadData, roster: [] } });

    const userIds = rosterRaw.map((m: any) => m.user_id);
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("auth_id, full_name, track, referral_code, tasks_completed, email, phone, country") 
      .in("auth_id", userIds);

    if (usersError) throw usersError;

    let totalSquadProgress = 0;
    let validMembersCount = 0;

    const roster = rosterRaw.map((m: any) => {
      const u = usersData?.find((user: any) => user.auth_id === m.user_id);
      
      const tasksCompleted = u?.tasks_completed || 0;
      const currentWeek = Math.min(tasksCompleted + 1, 24);
      const individualPercentage = Math.round(Math.min((currentWeek / 24) * 100, 100));
      
      totalSquadProgress += individualPercentage;
      validMembersCount++;

      return {
        userId: m.user_id,
        name: u?.full_name || "Squad Member",
        track: u?.track || "Unassigned",
        identity: "Member",
        status: m.status || "active",
        isLead: m.user_id === squadData.lead_user_id,
        referralCode: u?.referral_code || `ref-${m.user_id.split("-")[0]}`,
        individualProgress: individualPercentage,
        email: u?.email || "", 
        phone: u?.phone || "",
        country: u?.country || ""
      };
    });

    const collectiveProgress = validMembersCount > 0 ? Math.round(totalSquadProgress / validMembersCount) : 0;

    return NextResponse.json({
      inSquad: true,
      squad: { id: squadData.id, name: squadData.name, slug: squadData.slug, collectiveProgress, roster }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, name } = await request.json();
    if (!userId || !name) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000);
    const { data: squad, error: squadError } = await supabase.from("squads").insert({ name, lead_user_id: userId, slug }).select().single();
    if (squadError) throw squadError;

    const { error: memberError } = await supabase.from("squad_members").insert({ squad_id: squad.id, user_id: userId, status: "active" });
    if (memberError) throw memberError;

    return NextResponse.json({ success: true, squad });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  try {
    const { data: memberData } = await supabase.from("squad_members").select("squad_id").eq("user_id", userId).maybeSingle();
    if (!memberData) return NextResponse.json({ success: true });

    const squadId = memberData.squad_id;

    // 🔥 THE FIX: Safely pull all members without depending on a joined_at column
    const { data: currentMembers } = await supabase.from("squad_members").select("*").eq("squad_id", squadId);
    
    const isOnlyMember = currentMembers?.length === 1;

    if (isOnlyMember) {
      await supabase.from("squad_members").delete().eq("squad_id", squadId);
      const { error: squadDelErr } = await supabase.from("squads").delete().eq("id", squadId);
      if (squadDelErr) throw squadDelErr;
    } else {
      const { error: memDelErr } = await supabase.from("squad_members").delete().eq("user_id", userId).eq("squad_id", squadId);
      if (memDelErr) throw memDelErr;

      const { data: squad } = await supabase.from("squads").select("lead_user_id").eq("id", squadId).single();
      
      if (squad?.lead_user_id === userId) {
        const remaining = (currentMembers || []).filter(m => m.user_id !== userId);
        if (remaining.length > 0) {
          await supabase.from("squads").update({ lead_user_id: remaining[0].user_id }).eq("id", squadId);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
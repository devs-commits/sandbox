import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  try {
    // 1. Fetch everyone safely without strict SQL filters
    const { data: peers, error: peersError } = await supabase
      .from("users")
      .select("auth_id, full_name, current_identity, tasks_completed, track")
      .neq("auth_id", userId) 
      .order("tasks_completed", { ascending: false })
      .limit(50);

    if (peersError) throw peersError;

    if (!peers || peers.length === 0) {
        return NextResponse.json({ success: true, learners: [] });
    }

    // 2. THE FIX: Assign a safe ID in JavaScript to any dummy users missing one
    const formattedPeers = peers.map((p, index) => ({
        ...p,
        safe_id: p.auth_id && p.auth_id.trim() !== "" ? p.auth_id : `dummy-${index}-${Date.now()}`
    }));

    const peerIds = formattedPeers.map(p => p.safe_id);
    
    // 3. Fetch Squad Status
    const { data: squadMemberships } = await supabase.from("squad_members").select("user_id").in("user_id", peerIds);
    const usersInSquads = new Set(squadMemberships?.map(sm => sm.user_id) || []);

    // 4. Fetch Badges
    const { data: badges } = await supabase.from("user_badges").select("user_id").in("user_id", peerIds);
    const badgeCounts: Record<string, number> = {};
    badges?.forEach(b => { badgeCounts[b.user_id] = (badgeCounts[b.user_id] || 0) + 1; });

    // 5. Format for the UI
    const formattedLearners = formattedPeers.map(peer => {
        const tasksCompleted = peer.tasks_completed || 0;
        const currentWeek = Math.min(tasksCompleted + 1, 24);
        const progress = Math.round(Math.min((currentWeek / 24) * 100, 100));

        return {
          id: peer.safe_id, // We use the safe ID here so the Invite button works!
          name: peer.full_name || "Anonymous Learner",
          identity: peer.current_identity || "Intern",
          track: peer.track || "Unassigned", 
          progress: progress,
          badgeCount: badgeCounts[peer.safe_id] || 0,
          inSquad: usersInSquads.has(peer.safe_id)
        };
    });

    return NextResponse.json({ success: true, learners: formattedLearners });
  } catch (error: any) {
    console.error("Discover API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
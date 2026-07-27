import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 

export async function POST(request: Request) {
  try {
    const { userId, slug } = await request.json();
    
    // Check for the slug instead of invite code!
    if (!userId || !slug) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    // 1. Find the squad by its slug
    const { data: squad, error: squadError } = await supabase
      .from("squads")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!squad) return NextResponse.json({ error: "Invalid Squad Link or Slug." }, { status: 404 });

    // 2. Check if the squad is full (max 4)
    const { count } = await supabase
      .from("squad_members")
      .select("*", { count: "exact", head: true })
      .eq("squad_id", squad.id);

    if (count !== null && count >= 4) {
      return NextResponse.json({ error: "This squad is already full!" }, { status: 403 });
    }

    // 3. Add the user to the squad
    const { error: joinError } = await supabase
      .from("squad_members")
      .insert({ squad_id: squad.id, user_id: userId, status: "active" });

    if (joinError) throw joinError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Catch unique constraint error if they try to join a squad they are already in
    if (error.code === '23505') {
        return NextResponse.json({ error: "You are already in a squad." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
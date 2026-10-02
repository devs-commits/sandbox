import { NextResponse } from "next/server";
import { createSupabaseClientFromRequest } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SessionStatus = "in_progress" | "completed" | "skipped";
type FirstShiftMode = "off" | "everyone";

type AuthenticatedUser = {
  id: string;
};

type FirstShiftSession = {
  id: string;
  user_id: string;
  version: number;
  status: SessionStatus;
  current_step: number;
  replay_count: number;
  started_at: string;
  completed_at: string | null;
  skipped_at: string | null;
  last_exited_at: string | null;
  updated_at: string;
};

const FLAG_KEY = "first_shift_enabled";
const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

function json(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...NO_STORE_HEADERS, ...init?.headers },
  });
}

async function getAuthenticatedUser(request: Request) {
  const client = createSupabaseClientFromRequest(request);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user as AuthenticatedUser;
}

async function getFirstShiftFlag() {
  const { data, error } = await supabaseAdmin
    .from("feature_flags")
    .select("mode")
    .eq("key", FLAG_KEY)
    .maybeSingle();

  if (error) throw error;
  return (data?.mode ?? "off") as FirstShiftMode;
}

function isFirstShiftEnabled(mode: FirstShiftMode) {
  return mode === "everyone";
}

async function getSession(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("first_shift_sessions")
    .select("id, user_id, version, status, current_step, replay_count, started_at, completed_at, skipped_at, last_exited_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as FirstShiftSession | null;
}

async function isEligibleNewUser(userId: string) {
  const [{ data: user, error: userError }, { count, error: taskError }] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("has_completed_onboarding, has_completed_tour, has_completed_headquarters_tour")
      .eq("auth_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user", userId),
  ]);

  if (userError) throw userError;
  if (taskError) throw taskError;
  if (!user) return false;

  return count === 0
    && !user.has_completed_onboarding
    && !user.has_completed_tour
    && !user.has_completed_headquarters_tour;
}

async function recordEvent(input: {
  sessionId: string;
  userId: string;
  eventType: string;
  step?: number | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("first_shift_events").insert({
    session_id: input.sessionId,
    user_id: input.userId,
    event_type: input.eventType,
    step: input.step ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) throw error;
}

async function getState(user: AuthenticatedUser) {
  // These independent reads share the same user/session request. Running them
  // together avoids serial Supabase round trips on the first-login path.
  const [flag, session] = await Promise.all([
    getFirstShiftFlag(),
    getSession(user.id),
  ]);
  if (!isFirstShiftEnabled(flag)) {
    return { enabled: false, eligible: false, suppressHeadquartersTour: false, session: null, canReplay: false };
  }

  if (session) {
    const inProgress = session.status === "in_progress";
    return {
      enabled: true,
      eligible: inProgress || await isEligibleNewUser(user.id),
      suppressHeadquartersTour: inProgress,
      session,
      canReplay: !inProgress,
    };
  }

  return {
    enabled: true,
    eligible: await isEligibleNewUser(user.id),
    suppressHeadquartersTour: false,
    session: null,
    canReplay: false,
  };
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return json({ error: "Unauthorized" }, { status: 401 });

    return json(await getState(user));
  } catch (error) {
    console.error("First Shift state lookup failed:", error);
    return json({ error: "First Shift is unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return json({ error: "Unauthorized" }, { status: 401 });

    const flag = await getFirstShiftFlag();
    if (!isFirstShiftEnabled(flag)) {
      return json({ error: "First Shift is disabled" }, { status: 409 });
    }

    const body = await request.json();
    const action = body?.action as string | undefined;
    const existingSession = await getSession(user.id);

    if (action === "start") {
      if (existingSession?.status === "in_progress") {
        return json({ session: existingSession });
      }

      if (existingSession || !await isEligibleNewUser(user.id)) {
        return json({ error: "User is not eligible for First Shift" }, { status: 409 });
      }

      const session = {
        id: crypto.randomUUID(),
        user_id: user.id,
        version: 1,
        status: "in_progress" as const,
        current_step: 0,
        replay_count: 0,
      };
      const { data, error } = await supabaseAdmin
        .from("first_shift_sessions")
        .insert(session)
        .select("id, user_id, version, status, current_step, replay_count, started_at, completed_at, skipped_at, last_exited_at, updated_at")
        .single();
      if (error) {
        // Two tabs (or React's development remount) can both pass the
        // eligibility check before either insert commits. A session is unique
        // per user, so the losing request must reuse the winner's session.
        if (error.code === "23505") {
          const concurrentSession = await getSession(user.id);
          if (concurrentSession?.status === "in_progress") {
            return json({ session: concurrentSession });
          }
        }
        throw error;
      }

      await recordEvent({ sessionId: data.id, userId: user.id, eventType: "tour_started", step: 0 });
      return json({ session: data });
    }

    if (!existingSession) {
      return json({ error: "First Shift session not found" }, { status: 404 });
    }

    if (action === "replay") {
      const { data, error } = await supabaseAdmin
        .from("first_shift_sessions")
        .update({
          status: "in_progress",
          current_step: 0,
          replay_count: existingSession.replay_count + 1,
          last_exited_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSession.id)
        .select("id, user_id, version, status, current_step, replay_count, started_at, completed_at, skipped_at, last_exited_at, updated_at")
        .single();
      if (error) {
        // Concurrent first loads can both observe no session. Reuse the row
        // created by the winning request instead of failing the other request.
        if (error.code === "23505") {
          const concurrentSession = await getSession(user.id);
          if (concurrentSession?.status === "in_progress") {
            return json({ session: concurrentSession });
          }
        }
        throw error;
      }

      await recordEvent({ sessionId: data.id, userId: user.id, eventType: "tour_replayed", step: 0 });
      await recordEvent({ sessionId: data.id, userId: user.id, eventType: "tour_started", step: 0, metadata: { replay: true } });
      return json({ session: data });
    }

    if (existingSession.status !== "in_progress") {
      return json({ error: "First Shift has already finished" }, { status: 409 });
    }

    if (action === "step_completed") {
      const step = Number(body?.step);
      if (!Number.isInteger(step) || step < 0 || step > 20) {
        return json({ error: "Invalid First Shift step" }, { status: 400 });
      }

      const nextStep = Math.max(existingSession.current_step, step);
      const { data, error } = await supabaseAdmin
        .from("first_shift_sessions")
        .update({ current_step: nextStep, updated_at: new Date().toISOString() })
        .eq("id", existingSession.id)
        .select("id, user_id, version, status, current_step, replay_count, started_at, completed_at, skipped_at, last_exited_at, updated_at")
        .single();
      if (error) throw error;

      await recordEvent({ sessionId: data.id, userId: user.id, eventType: "tour_step_completed", step: nextStep });
      return json({ session: data });
    }

    if (action === "exit") {
      const { data, error } = await supabaseAdmin
        .from("first_shift_sessions")
        .update({ last_exited_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", existingSession.id)
        .select("id, user_id, version, status, current_step, replay_count, started_at, completed_at, skipped_at, last_exited_at, updated_at")
        .single();
      if (error) throw error;

      await recordEvent({ sessionId: data.id, userId: user.id, eventType: "tour_exited", step: data.current_step });
      return json({ session: data });
    }

    if (action === "complete" || action === "skip") {
      const isSkipped = action === "skip";
      const now = new Date().toISOString();

      // This is the shared handoff for completion and skipping. It retires both
      // legacy tours before the Office transitions to the existing profile step.
      const { error: userError } = await supabaseAdmin
        .from("users")
        .update({
          has_completed_onboarding: true,
          has_completed_tour: true,
          has_completed_headquarters_tour: true,
        })
        .eq("auth_id", user.id);
      if (userError) throw userError;

      const { data, error } = await supabaseAdmin
        .from("first_shift_sessions")
        .update({
          status: isSkipped ? "skipped" : "completed",
          completed_at: isSkipped ? existingSession.completed_at : now,
          skipped_at: isSkipped ? now : existingSession.skipped_at,
          updated_at: now,
        })
        .eq("id", existingSession.id)
        .select("id, user_id, version, status, current_step, replay_count, started_at, completed_at, skipped_at, last_exited_at, updated_at")
        .single();
      if (error) throw error;

      await recordEvent({
        sessionId: data.id,
        userId: user.id,
        eventType: isSkipped ? "tour_skipped" : "tour_completed",
        step: data.current_step,
      });
      if (!isSkipped) {
        await recordEvent({
          sessionId: data.id,
          userId: user.id,
          eventType: "first_task_started",
          step: data.current_step,
          metadata: { stage: "career_profile_handoff" },
        });
      }

      return json({ session: data, handoff: true });
    }

    return json({ error: "Unknown First Shift action" }, { status: 400 });
  } catch (error) {
    console.error("First Shift action failed:", error);
    return json({ error: "First Shift is unavailable" }, { status: 503 });
  }
}

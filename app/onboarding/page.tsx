"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingCarousel } from "@/app/components/students/office/onboarding/OnboardingCarousel";
import { useAuth } from "@/app/contexts/AuthContexts";
import { supabase } from "@/lib/supabase";

type FirstShiftSession = {
  status: "in_progress" | "completed" | "skipped";
  current_step: number;
};

type FirstShiftState = {
  enabled?: boolean;
  eligible?: boolean;
  session?: FirstShiftSession | null;
};

type FirstShiftAction = "start" | "complete" | "skip" | "step_completed";

async function requestFirstShift(accessToken: string, action?: FirstShiftAction, step?: number) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("/api/onboarding/first-shift", {
      method: action ? "POST" : "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(action ? { "Content-Type": "application/json" } : {}),
      },
      ...(action ? { body: JSON.stringify({ action, ...(step === undefined ? {} : { step }) }) } : {}),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      throw new Error(data?.error || "First Shift is unavailable");
    }
    return data as FirstShiftState;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [track, setTrack] = useState("Data Analytics");
  const [initialStep, setInitialStep] = useState(0);
  const accessTokenRef = useRef<string | null>(null);
  const sessionRef = useRef<FirstShiftSession | null>(null);
  const currentStepRef = useRef(0);
  const furthestStepRef = useRef(0);
  const pendingActionRef = useRef<"complete" | "skip" | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const finishOnboarding = useCallback(async (action: "complete" | "skip", accessToken: string) => {
    await saveQueueRef.current;
    try {
      await requestFirstShift(accessToken, action);
    } catch (error) {
      console.warn("First Shift handoff could not be saved; continuing to Office.", error);
    }
    router.replace("/student/office");
  }, [router]);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== "student") {
      router.replace(user ? "/student/office" : "/login");
      return;
    }

    let cancelled = false;
    const loadSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          router.replace("/login");
          return;
        }
        accessTokenRef.current = accessToken;
        void (async () => {
          try {
            const { data: profile } = await supabase
              .from("users")
              .select("track")
              .eq("auth_id", user.id)
              .maybeSingle();
            if (!cancelled && profile?.track) setTrack(profile.track);
          } catch (error) {
            console.warn("Unable to load onboarding track; using the default track.", error);
          }
        })();

        const state = await requestFirstShift(accessToken);
        if (cancelled) return;
        if (!state.enabled) {
          router.replace("/student/office");
          return;
        }

        let session = state.session ?? null;
        if (!session && state.eligible) {
          const started = await requestFirstShift(accessToken, "start");
          session = started.session ?? null;
        }
        if (cancelled) return;
        if (!session || session.status !== "in_progress") {
          router.replace("/student/office");
          return;
        }

        sessionRef.current = session;
        const resumeStep = Math.max(session.current_step, furthestStepRef.current);
        setInitialStep(resumeStep);
        if (resumeStep > session.current_step) {
          saveQueueRef.current = saveQueueRef.current.then(async () => {
            await requestFirstShift(accessToken, "step_completed", resumeStep);
          }).catch((error) => {
            console.warn("First Shift progress could not be saved; continuing to Office.", error);
            router.replace("/student/office");
          });
        }

        const pendingAction = pendingActionRef.current;
        if (pendingAction) await finishOnboarding(pendingAction, accessToken);
      } catch (error) {
        if (!cancelled) {
          console.warn("First Shift could not be initialized; continuing to Office.", error);
          router.replace("/student/office");
        }
      }
    };

    void loadSession();
    return () => { cancelled = true; };
  }, [finishOnboarding, isLoading, router, user]);

  const saveStep = (step: number) => {
    currentStepRef.current = step;
    furthestStepRef.current = Math.max(furthestStepRef.current, step);
    const accessToken = accessTokenRef.current;
    if (!accessToken || !sessionRef.current || pendingActionRef.current) return;

    saveQueueRef.current = saveQueueRef.current.then(async () => {
      await requestFirstShift(accessToken, "step_completed", step);
    }).catch((error) => {
      console.warn("First Shift progress could not be saved; continuing to Office.", error);
      router.replace("/student/office");
    });
  };

  const handoff = (action: "complete" | "skip") => {
    if (pendingActionRef.current) return;
    pendingActionRef.current = action;
    const accessToken = accessTokenRef.current;
    if (accessToken && sessionRef.current) void finishOnboarding(action, accessToken);
  };

  return (
    <OnboardingCarousel
      key={initialStep}
      track={track}
      initialStep={initialStep}
      onStep={saveStep}
      onClose={() => handoff("skip")}
      onComplete={() => handoff("complete")}
    />
  );
}
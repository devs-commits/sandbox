"use client";

import { useRouter } from "next/navigation";
import { OnboardingCarousel } from "./onboarding/OnboardingCarousel";
import { useOffice } from "@/app/contexts/OfficeContext";

export function FirstShift() {
  const router = useRouter();
  const { firstShift, phase, trackName, recordFirstShiftStep, completeFirstShift } = useOffice();

  if (phase !== "first_shift" || !firstShift.session) return null;

  const handoff = async (mode: "complete" | "skip") => {
    await completeFirstShift(mode);
    router.replace("/student/office");
  };

  return <OnboardingCarousel
    track={trackName || "Data Analytics"}
    initialStep={firstShift.session.current_step}
    onStep={(step) => void recordFirstShiftStep(step)}
    onClose={() => void handoff("skip")}
    onComplete={() => void handoff("complete")}
  />;
}

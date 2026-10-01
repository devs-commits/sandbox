"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, MessageSquareText, Play, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useOffice } from "@/app/contexts/OfficeContext";
import { FIRST_SHIFT_BRIEFS, formatFirstShiftTrack, resolveFirstShiftTrack } from "@/lib/first-shift";
import { PROGRAM_MILESTONES } from "@/lib/program-milestones";

const STEP_COUNT = 7;

export function FirstShift() {
  const {
    firstShift,
    phase,
    trackName,
    userLevel,
    setActiveView,
    recordFirstShiftStep,
    exitFirstShift,
    completeFirstShift,
  } = useOffice();
  const [step, setStep] = useState(firstShift.session?.current_step ?? 0);
  const [choice, setChoice] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const brief = useMemo(
    () => FIRST_SHIFT_BRIEFS[resolveFirstShiftTrack(trackName)],
    [trackName],
  );

  useEffect(() => {
    if (!isPaused && firstShift.session) {
      setStep(firstShift.session.current_step);
    }
  }, [firstShift.session, isPaused]);

  if (phase !== "first_shift" || !firstShift.session) return null;

  const advance = async (nextStep: number) => {
    setIsSaving(true);
    await recordFirstShiftStep(nextStep);
    setStep(nextStep);
    setIsSaving(false);
  };

  const visit = async (view: "desk" | "meeting" | "archives", nextStep: number) => {
    setActiveView(view);
    await advance(nextStep);
  };

  const pause = async () => {
    setIsSaving(true);
    await exitFirstShift();
    setIsPaused(true);
    setIsSaving(false);
  };

  const handoff = async (mode: "complete" | "skip") => {
    setIsSaving(true);
    await completeFirstShift(mode);
    setIsSaving(false);
  };

  if (isPaused) {
    return (
      <aside className="fixed inset-x-3 bottom-24 z-[100] mx-auto max-w-xl rounded-2xl border border-primary/30 bg-card p-4 shadow-2xl lg:bottom-5" aria-label="First Shift paused">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/15 p-2 text-primary"><BriefcaseBusiness size={20} /></div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">First Shift is paused</p>
            <p className="mt-1 text-sm text-muted-foreground">Your place is saved. Resume when you are ready, or continue to your career profile.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => setIsPaused(false)} className="flex-1"><Play size={16} className="mr-2" />Resume First Shift</Button>
          <Button variant="outline" onClick={() => void handoff("skip")} disabled={isSaving} className="flex-1">Skip to career profile</Button>
        </div>
      </aside>
    );
  }

  const selectedOption = choice === null ? null : brief.options[choice];
  const stepLabel = `Step ${Math.min(step + 1, STEP_COUNT)} of ${STEP_COUNT}`;

  return (
    <aside className="fixed inset-x-3 bottom-24 z-[100] mx-auto max-w-xl rounded-2xl border border-primary/30 bg-card p-4 shadow-2xl lg:bottom-5" role="region" aria-label="First Shift guided experience">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">First Shift · {stepLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">{formatFirstShiftTrack(trackName)}{userLevel ? ` · ${userLevel}` : ""}</p>
        </div>
        <button type="button" onClick={() => void pause()} disabled={isSaving} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Pause First Shift">
          <X size={18} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {step === 0 && <Intro onContinue={() => void advance(1)} disabled={isSaving} />}
          {step === 1 && <Roadmap onContinue={() => void advance(2)} disabled={isSaving} />}
          {step === 2 && (
            <SampleBrief
              brief={brief}
              selected={choice}
              onSelect={setChoice}
              onContinue={() => void advance(3)}
              disabled={isSaving || choice === null}
              feedback={selectedOption?.feedback}
              isCorrect={selectedOption?.correct}
            />
          )}
          {step === 3 && <NavigationStep icon={<BriefcaseBusiness size={20} />} title="Visit your Desk" body="This is where your live task appears when it is ready." action="Open Desk" onContinue={() => void visit("desk", 4)} disabled={isSaving} />}
          {step === 4 && <NavigationStep icon={<MessageSquareText size={20} />} title="Visit the Meeting Room" body="This is where you can communicate with your AI team." action="Open Meeting Room" onContinue={() => void visit("meeting", 5)} disabled={isSaving} />}
          {step === 5 && <NavigationStep icon={<Archive size={20} />} title="Visit the Archives" body="Use the Archives for guidance and references before asking for help." action="Open Archives" onContinue={() => void visit("archives", 6)} disabled={isSaving} />}
          {step >= 6 && <Finish onComplete={() => void handoff("complete")} onSkip={() => void handoff("skip")} disabled={isSaving} />}
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}

function Intro({ onContinue, disabled }: { onContinue: () => void; disabled: boolean }) {
  return <Panel icon={<Building2 size={20} />} title="Welcome to your virtual workplace" body="This is a realistic practice space: your Desk holds work, the Meeting Room is your AI team, and the Archives help you work independently." action="Start First Shift" onContinue={onContinue} disabled={disabled} />;
}

function Roadmap({ onContinue, disabled }: { onContinue: () => void; disabled: boolean }) {
  return <Panel icon={<CheckCircle2 size={20} />} title="Build evidence as you work" body={`Complete ${PROGRAM_MILESTONES.workLetterTasks} tasks to unlock your work reference letter. Complete ${PROGRAM_MILESTONES.visaLetterTasks} tasks to unlock your visa reference letter.`} action="Try a sample brief" onContinue={onContinue} disabled={disabled} />;
}

function SampleBrief({ brief, selected, onSelect, feedback, isCorrect, onContinue, disabled }: { brief: (typeof FIRST_SHIFT_BRIEFS)[keyof typeof FIRST_SHIFT_BRIEFS]; selected: number | null; onSelect: (index: number) => void; feedback?: string; isCorrect?: boolean; onContinue: () => void; disabled: boolean }) {
  return <div>
    <div className="flex gap-3"><div className="rounded-xl bg-primary/15 p-2 text-primary"><BriefcaseBusiness size={20} /></div><div><h2 className="font-semibold">Sample brief: {brief.title}</h2><p className="text-sm text-muted-foreground">{brief.company}</p></div></div>
    <p className="mt-3 text-sm text-muted-foreground">{brief.context}</p>
    <p className="mt-3 text-sm font-medium">{brief.actionPrompt}</p>
    <div className="mt-3 space-y-2">
      {brief.options.map((option, index) => <button key={option.label} type="button" onClick={() => onSelect(index)} className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${selected === index ? (option.correct ? "border-emerald-500 bg-emerald-500/10" : "border-orange-400 bg-orange-400/10") : "border-border hover:border-primary/50 hover:bg-muted/60"}`} aria-pressed={selected === index}>{option.label}</button>)}
    </div>
    {feedback && <p className={`mt-3 rounded-lg p-3 text-sm ${isCorrect ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-orange-500/10 text-orange-700 dark:text-orange-300"}`} aria-live="polite">{feedback}</p>}
    <Button onClick={onContinue} disabled={disabled} className="mt-4 w-full">Continue <ArrowRight size={16} className="ml-2" /></Button>
  </div>;
}

function NavigationStep({ icon, title, body, action, onContinue, disabled }: { icon: ReactNode; title: string; body: string; action: string; onContinue: () => void; disabled: boolean }) {
  return <Panel icon={icon} title={title} body={body} action={action} onContinue={onContinue} disabled={disabled} />;
}

function Finish({ onComplete, onSkip, disabled }: { onComplete: () => void; onSkip: () => void; disabled: boolean }) {
  return <div><div className="flex gap-3"><div className="rounded-xl bg-primary/15 p-2 text-primary"><CheckCircle2 size={20} /></div><div><h2 className="font-semibold">You are ready for your first real brief</h2><p className="mt-1 text-sm text-muted-foreground">Next, tell us about your background so we can prepare your workspace.</p></div></div><Button onClick={onComplete} disabled={disabled} className="mt-4 w-full">Continue to career profile <ArrowRight size={16} className="ml-2" /></Button><button type="button" onClick={onSkip} disabled={disabled} className="mt-3 w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">Skip tour and continue to career profile</button></div>;
}

function Panel({ icon, title, body, action, onContinue, disabled }: { icon: ReactNode; title: string; body: string; action: string; onContinue: () => void; disabled: boolean }) {
  return <div><div className="flex gap-3"><div className="rounded-xl bg-primary/15 p-2 text-primary">{icon}</div><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{body}</p></div></div><Button onClick={onContinue} disabled={disabled} className="mt-4 w-full">{action} <ArrowRight size={16} className="ml-2" /></Button></div>;
}

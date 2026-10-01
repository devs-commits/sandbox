"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, FileText, MessageSquareText, Play, SkipForward, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useOffice } from "@/app/contexts/OfficeContext";
import { AgentAvatar } from "@/app/components/students/office/AgentAvatar";
import { AGENTS } from "@/app/components/students/office/types";
import { FIRST_SHIFT_BRIEFS, formatFirstShiftTrack, resolveFirstShiftTrack } from "@/lib/first-shift";
import { PROGRAM_MILESTONES } from "@/lib/program-milestones";

const STEP_COUNT = 7;

export function FirstShift() {
  const { firstShift, phase, trackName, userLevel, setActiveView, recordFirstShiftStep, exitFirstShift, completeFirstShift } = useOffice();
  const [step, setStep] = useState(firstShift.session?.current_step ?? 0);
  const [choice, setChoice] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const brief = useMemo(() => FIRST_SHIFT_BRIEFS[resolveFirstShiftTrack(trackName)], [trackName]);

  useEffect(() => {
    if (phase !== "first_shift" || !firstShift.session) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => dialogRef.current?.querySelector<HTMLElement>("button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    focusable()?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const container = dialogRef.current;
      if (!container) return;
      const items = Array.from(container.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); previousFocus.current?.focus(); };
  }, [phase, firstShift.session]);

  if (phase !== "first_shift" || !firstShift.session) return null;

  const advance = async (nextStep: number) => { setIsSaving(true); await recordFirstShiftStep(nextStep); setStep(nextStep); setIsSaving(false); };
  const visit = async (view: "desk" | "meeting" | "archives", nextStep: number) => { setActiveView(view); await advance(nextStep); };
  const pause = async () => { setIsSaving(true); await exitFirstShift(); setIsPaused(true); setIsSaving(false); };
  const handoff = async (mode: "complete" | "skip") => { setIsSaving(true); await completeFirstShift(mode); setIsSaving(false); };
  const selectedOption = choice === null ? null : brief.options[choice];
  const stepLabel = `Step ${Math.min(step + 1, STEP_COUNT)} of ${STEP_COUNT}`;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background/95 backdrop-blur-sm" role="presentation">
      <aside ref={dialogRef} className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-4 py-4 sm:px-6 sm:py-6" role="dialog" aria-modal="true" aria-labelledby="first-shift-title">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><BriefcaseBusiness /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">First Shift</p><h1 id="first-shift-title" className="text-sm font-semibold text-foreground">Your first day at work</h1></div></div>
          <div className="flex items-center gap-2"><span className="hidden text-xs text-muted-foreground sm:inline">{formatFirstShiftTrack(trackName)}{userLevel ? ` · ${userLevel}` : ""}</span><Button variant="ghost" size="sm" onClick={() => void pause()} disabled={isSaving}><X data-icon="inline-start" />Pause</Button><Button variant="outline" size="sm" onClick={() => void handoff("skip")} disabled={isSaving}><SkipForward data-icon="inline-start" />Skip</Button></div>
        </header>

        {isPaused ? <Paused onResume={() => setIsPaused(false)} onSkip={() => void handoff("skip")} disabled={isSaving} /> : <main className="flex flex-1 items-center justify-center py-8"><div className="grid w-full max-w-4xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><Guide /><section className="rounded-3xl border border-border bg-card p-5 shadow-2xl shadow-primary/5 sm:p-8"><div className="mb-6 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-primary">{stepLabel}</span><div className="flex gap-1" aria-label={`${step + 1} of ${STEP_COUNT} steps`}>{Array.from({ length: STEP_COUNT }, (_, index) => <span key={index} className={`h-1.5 rounded-full ${index <= step ? "w-6 bg-primary" : "w-2 bg-muted"}`} />)}</div></div><AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>{step === 0 && <Panel icon={<Building2 />} title="Welcome to your virtual workplace" body="This is a realistic practice space: your Desk holds work, the Meeting Room is your AI team, and the Archives help you work independently." action="Start First Shift" onContinue={() => void advance(1)} disabled={isSaving} />}{step === 1 && <Roadmap onContinue={() => void advance(2)} disabled={isSaving} />}{step === 2 && <SampleBrief brief={brief} selected={choice} onSelect={setChoice} onContinue={() => void advance(3)} disabled={isSaving || choice === null} feedback={selectedOption?.feedback} isCorrect={selectedOption?.correct} />}{step === 3 && <WorkplacePreview icon={<BriefcaseBusiness />} title="Your Desk" body="Your live task appears here when it is ready." action="Open Desk" onContinue={() => void visit("desk", 4)} disabled={isSaving} preview={<div className="rounded-xl border border-primary/20 bg-background p-4"><div className="flex items-center gap-2"><FileText className="text-primary" /> <span className="font-medium">Next task</span></div><p className="mt-3 text-sm text-muted-foreground">Your first generated brief will appear here.</p></div>} />}{step === 4 && <WorkplacePreview icon={<MessageSquareText />} title="The Meeting Room" body="Communicate with your AI team when you need a sounding board." action="Open Meeting Room" onContinue={() => void visit("meeting", 5)} disabled={isSaving} preview={<div className="rounded-xl border border-primary/20 bg-background p-4"><div className="flex items-center gap-3"><AgentAvatar agentName="Tolu" size="sm" /><div><p className="text-sm font-medium">{AGENTS.Tolu.name}</p><p className="text-xs text-muted-foreground">Ask for context, feedback, or direction.</p></div></div></div>} />}{step === 5 && <WorkplacePreview icon={<Archive />} title="The Archives" body="Use references and guidance to work independently before asking for help." action="Open Archives" onContinue={() => void visit("archives", 6)} disabled={isSaving} preview={<div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-border bg-background p-3 text-sm">Playbooks</div><div className="rounded-xl border border-border bg-background p-3 text-sm">Templates</div></div>} />}{step >= 6 && <Finish onComplete={() => void handoff("complete")} onSkip={() => void handoff("skip")} disabled={isSaving} />}</motion.div></AnimatePresence></section></div></main>}
        <p className="pb-[env(safe-area-inset-bottom)] text-center text-xs text-muted-foreground">Your progress saves automatically.</p>
      </aside>
    </div>
  );
}

function Guide() { return <div className="hidden lg:block"><div className="mb-4 flex items-center gap-3"><AgentAvatar agentName="Tolu" size="lg" /><div><p className="font-semibold">{AGENTS.Tolu.name}</p><p className="text-sm text-muted-foreground">{AGENTS.Tolu.role}</p></div></div><p className="max-w-sm text-3xl font-semibold leading-tight tracking-tight">A calm first day is a productive first day.</p><p className="mt-4 max-w-sm text-muted-foreground">I&apos;ll show you where everything lives, then you&apos;ll be ready for your first real brief.</p></div>; }
function Paused({ onResume, onSkip, disabled }: { onResume: () => void; onSkip: () => void; disabled: boolean }) { return <main className="flex flex-1 items-center justify-center"><section className="w-full max-w-lg rounded-3xl border border-primary/30 bg-card p-6 text-center shadow-2xl shadow-primary/10"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Play /></div><h2 className="mt-5 text-xl font-semibold">First Shift is paused</h2><p className="mt-2 text-sm text-muted-foreground">Your place is saved. Resume when you are ready, or continue to your career profile.</p><div className="mt-6 flex flex-col gap-2 sm:flex-row"><Button onClick={onResume} className="flex-1">Resume First Shift</Button><Button variant="outline" onClick={onSkip} disabled={disabled} className="flex-1">Skip to career profile</Button></div></section></main>; }
function Roadmap({ onContinue, disabled }: { onContinue: () => void; disabled: boolean }) { return <Panel icon={<CheckCircle2 />} title="Build evidence as you work" body={`Complete ${PROGRAM_MILESTONES.workLetterTasks} tasks to unlock your work reference letter. Complete ${PROGRAM_MILESTONES.visaLetterTasks} tasks to unlock your visa reference letter.`} action="Try a sample brief" onContinue={onContinue} disabled={disabled} />; }
function SampleBrief({ brief, selected, onSelect, feedback, isCorrect, onContinue, disabled }: { brief: (typeof FIRST_SHIFT_BRIEFS)[keyof typeof FIRST_SHIFT_BRIEFS]; selected: number | null; onSelect: (index: number) => void; feedback?: string; isCorrect?: boolean; onContinue: () => void; disabled: boolean }) { return <div><div className="flex gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><BriefcaseBusiness /></div><div><h2 className="font-semibold">Sample brief: {brief.title}</h2><p className="text-sm text-muted-foreground">{brief.company}</p></div></div><p className="mt-4 text-sm text-muted-foreground">{brief.context}</p><p className="mt-4 text-sm font-medium">{brief.actionPrompt}</p><div className="mt-4 flex flex-col gap-2">{brief.options.map((option, index) => <button key={option.label} type="button" onClick={() => onSelect(index)} className={`rounded-xl border p-3 text-left text-sm transition-colors ${selected === index ? (option.correct ? "border-primary bg-primary/10" : "border-destructive bg-destructive/10") : "border-border hover:border-primary/50 hover:bg-muted/60"}`} aria-pressed={selected === index}>{option.label}</button>)}</div>{feedback && <p className={`mt-4 rounded-xl p-3 text-sm ${isCorrect ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`} aria-live="polite">{feedback}</p>}<Button onClick={onContinue} disabled={disabled} className="mt-5 w-full">Continue <ArrowRight data-icon="inline-end" /></Button></div>; }
function WorkplacePreview({ icon, title, body, action, preview, onContinue, disabled }: { icon: ReactNode; title: string; body: string; action: string; preview: ReactNode; onContinue: () => void; disabled: boolean }) { return <div><div className="flex gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">{icon}</div><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{body}</p></div></div><div className="mt-6">{preview}</div><Button onClick={onContinue} disabled={disabled} className="mt-6 w-full">{action} <ArrowRight data-icon="inline-end" /></Button></div>; }
function Finish({ onComplete, onSkip, disabled }: { onComplete: () => void; onSkip: () => void; disabled: boolean }) { return <div><div className="flex gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><CheckCircle2 /></div><div><h2 className="font-semibold">You are ready for your first real brief</h2><p className="mt-1 text-sm text-muted-foreground">Your career profile comes next. Once it is complete, your first task will be generated for you.</p></div></div><Button onClick={onComplete} disabled={disabled} className="mt-6 w-full">Continue to career profile <ArrowRight data-icon="inline-end" /></Button><button type="button" onClick={onSkip} disabled={disabled} className="mt-3 w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">Skip tour and continue to career profile</button></div>; }
function Panel({ icon, title, body, action, onContinue, disabled }: { icon: ReactNode; title: string; body: string; action: string; onContinue: () => void; disabled: boolean }) { return <div><div className="flex gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">{icon}</div><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{body}</p></div></div><Button onClick={onContinue} disabled={disabled} className="mt-6 w-full">{action} <ArrowRight data-icon="inline-end" /></Button></div>; }


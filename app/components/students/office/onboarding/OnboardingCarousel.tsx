"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { CarouselButton as Button } from "./CarouselButton";
import { FeaturePreview, TaskSubmissionPreview } from "./FeaturePreview";
import { Tolu, type ToluState } from "./Tolu";

type Slide =
  | { kind: "story"; badge: string; title: string; state: ToluState; copy: string; cta: string; screenshot: number }
  | { kind: "task"; badge: string; title: string; state: ToluState; copy: string; cta: string }
  | { kind: "quiz"; badge: string; title: string; options: string[]; cta: string };

const buildSlides = (track: string): Slide[] => [
  {
    kind: "story",
    screenshot: 0,
    badge: `${track.toUpperCase()} TRACK`,
    title: "Yo, welcome in.",
    state: "welcome",
    cta: "Let's go →",
    copy: `I'm Tolu. You picked ${track}, so you clearly don't play small. Same. Let's build something real.`,
  },
  {
    kind: "story",
    screenshot: 1,
    badge: "COGNITIVE BASELINE REQUIRED",
    title: "Read the Room First",
    state: "scanning",
    cta: "I'm ready →",
    copy: `Real talk: this isn't a beginner school. You need the ${track} fundamentals locked in. We drop you straight into raw, advanced client briefs.`,
  },
  {
    kind: "quiz",
    badge: "QUICK CHECK · 1 OF 2",
    title: "What's your main goal at WDC Labs?",
    cta: "Next →",
    options: [`📊 Build a killer ${track} portfolio`, "📜 Lock down my global Visa Reference Letter", "💼 Land a full-time role"],
  },
  {
    kind: "story",
    badge: "SYSTEM INDUCTION HUB",
    title: "This is HQ",
    state: "welcome",
    cta: "Next →",
    screenshot: 2,
    copy: "Here's your 24-week learning roadmap. Start with Week 1 and work through each task from Headquarters.",
  },
  {
    kind: "story",
    badge: "WORK TERMINAL OPERATIONAL",
    title: "Your Office",
    state: "scanning",
    cta: "Next →",
    screenshot: 3,
    copy: "Your assigned client brief is at Your Desk, with reference materials ready when you need them.",
  },
  {
    kind: "task",
    badge: "FROM BRIEF TO SUBMISSION",
    title: "Submit Your Work",
    state: "scanning",
    cta: "Next →",
    copy: "Open My Office and select your task. View the full details and resources first. When you're ready, choose Submit Work, upload your file, and send it to Sola.",
  },
  {
    kind: "quiz",
    badge: "QUICK CHECK · 2 OF 2",
    title: "How do you work best?",
    cta: "Next →",
    options: ["⚡ Fast sprints, ship daily", "🧠 Deep focus, big drops", "🤝 Sync often, iterate"],
  },
  {
    kind: "story",
    badge: "FINANCIAL INFRASTRUCTURE",
    title: "Global Wallet",
    state: "scanning",
    cta: "Next →",
    screenshot: 4,
    copy: "To set up withdrawals, go to Profile Settings → KYC & Security. Add your bank details and a withdrawal PIN to provision your settlement wallet.",
  },
  {
    kind: "story",
    badge: "AFFILIATE GROWTH CORE",
    title: "Earn Money",
    state: "welcome",
    cta: "Next →",
    screenshot: 5,
    copy: "Find your general referral link in Earn Money. Copy it or share it directly with your network.",
  },
  {
    kind: "story",
    badge: "MILESTONE GOALS UNLOCKED",
    title: "Reference Letters",
    state: "celebrating",
    cta: "Step Up To My Desk",
    screenshot: 6,
    copy: "Complete 12 tasks to unlock the Work Reference Letter, or 24 for the Visa Reference Letter. Track both milestones in Headquarters.",
  },
];

function useTypewriter(text: string, speed = 22) {
  const [n, setN] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setN(0);
    const id = setInterval(() => setN((value) => (value >= text.length ? (clearInterval(id), value) : value + 1)), speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { shown: text.slice(0, n), done: n >= text.length };
}

function useLockBodyScroll() {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);
}

export function OnboardingCarousel({
  onClose,
  onComplete,
  onStep,
  track = "Data Analytics",
  initialStep = 0,
}: {
  onClose: () => void;
  onComplete: () => void;
  onStep?: (step: number) => void;
  track?: string;
  initialStep?: number;
}) {
  useLockBodyScroll();
  const slides = buildSlides(track);
  const [i, setI] = useState(() => Math.max(0, Math.min(initialStep, slides.length - 1)));
  const [picked, setPicked] = useState<Record<number, number>>({});
  const s = slides[i] ?? {
    kind: "story" as const,
    screenshot: 0,
    badge: "WELCOME",
    title: "Welcome",
    state: "welcome" as const,
    copy: "Welcome to WDC Labs.",
    cta: "Next →",
  };
  const last = i === slides.length - 1;
  const goTo = (nextIndex: number) => {
    setI(nextIndex);
    onStep?.(nextIndex);
  };
  const next = () => (last ? onComplete() : goTo(i + 1));
  const quizPick = s.kind === "quiz" ? picked[i] : undefined;
  const state: ToluState = s.kind === "quiz" ? (quizPick !== undefined ? "celebrating" : "welcome") : s.state;
  const typed = useTypewriter(s.kind === "quiz" ? "" : s.copy);
  const accent = state === "celebrating" ? "text-emerald border-emerald/40 bg-emerald/10" : "text-cyan border-cyan/40 bg-cyan/10";
  const blocked = s.kind === "quiz" && quizPick === undefined;

  return (
    <div className="onboarding-lovable fixed inset-0 z-[100] flex flex-col overflow-hidden bg-navy/95 text-soft backdrop-blur-md" role="dialog" aria-modal="true" aria-label="WDC Labs onboarding">
      <header className="flex shrink-0 items-center justify-between px-5 py-4 md:px-10 md:py-6">
        <Image src="/wdc_labs_logo.png" alt="WDC Labs" width={180} height={40} priority className="h-5 w-auto object-contain contrast-50 brightness-200" />
        <Button type="button" variant="ghost" onClick={onClose} className="flex items-center gap-1.5 text-sm text-soft/60 transition-colors hover:bg-slate-line/40 hover:text-soft">
          Skip Journey <X className="h-4 w-4" />
        </Button>
      </header>

      <main className="onboarding-scroll-region min-h-0 flex-1 overflow-y-auto px-5 lg:px-10">
        <div className={`mx-auto flex min-h-full w-full flex-col items-center justify-center py-4 ${s.kind === "task" ? "md:py-4" : "md:py-10"} ${s.kind === "story" ? "flex-col-reverse md:flex-col" : ""}`}>
          <section className={`flex shrink-0 flex-col items-center gap-4 py-2 ${s.kind === "task" ? "md:gap-5 md:py-2" : "md:gap-8 md:py-4"} ${s.kind !== "quiz" ? "md:w-full md:flex-row md:justify-center" : ""}`}>
            <div className="hidden md:block"><Tolu state={state} size={180} /></div>
            <div className="md:hidden"><Tolu state={state} size={96} /></div>

            {s.kind !== "quiz" ? (
              <div key={i} className="speech speech-side relative w-full max-w-xl animate-rise rounded-3xl border border-slate-line/50 bg-panel p-5 shadow-2xl md:p-7">
                <span className={`inline-block rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.2em] md:text-xs ${accent}`}>{s.badge}</span>
                <h1 className="mt-3 font-display text-2xl font-bold leading-tight md:text-4xl">{s.title}</h1>
                <p className="mt-3 min-h-[4.5rem] text-base leading-relaxed text-soft/80 md:text-lg">
                  {typed.shown}
                  {!typed.done && <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 animate-pulse bg-cyan" />}
                </p>
              </div>
            ) : (
              <div key={i} className="w-full max-w-xl animate-rise text-center">
                <div className="speech speech-up relative rounded-3xl border border-slate-line/50 bg-panel p-5 md:p-6">
                  <span className={`inline-block rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.2em] md:text-xs ${accent}`}>{s.badge}</span>
                  <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">{s.title}</h1>
                </div>
                <div className="mt-6 grid gap-3">
                  {s.options.map((option, index) => (
                    <Button
                      key={option}
                      type="button"
                      variant="outline"
                      onClick={() => setPicked({ ...picked, [i]: index })}
                      aria-pressed={quizPick === index}
                      className={`h-auto min-h-14 whitespace-normal rounded-2xl border px-5 py-4 text-left font-semibold text-soft backdrop-blur-xl transition-all hover:scale-[1.02] hover:text-soft active:scale-95 ${quizPick === index ? "border-emerald bg-emerald/15 shadow-[0_0_30px_-8px_var(--emerald)] hover:bg-emerald/20" : "border-soft/15 bg-soft/5 hover:border-cyan/50 hover:bg-cyan/10"}`}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
                {quizPick !== undefined && <p className="mt-4 animate-rise font-semibold text-emerald">Love that. Noted ✨</p>}
              </div>
            )}
          </section>

          {s.kind !== "quiz" && (
            <section className={`flex w-full items-center justify-center py-2 ${s.kind === "task" ? "md:pb-2 md:pt-0" : "md:pb-6 md:pt-0"}`}>
              <div key={i} className={`w-full animate-rise ${s.kind === "task" ? "max-w-[900px]" : "max-w-[680px]"}`}>
                {s.kind === "task" ? <TaskSubmissionPreview /> : <FeaturePreview index={s.screenshot} />}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 px-5 py-3 sm:flex sm:justify-between md:px-10 md:py-5">
        <Button type="button" variant="ghost" onClick={() => goTo(Math.max(0, i - 1))} disabled={i === 0} className="col-start-1 row-start-2 text-sm text-soft/70 hover:bg-slate-line/40 hover:text-soft disabled:opacity-30">← Back</Button>
        <div className="col-span-2 row-start-1 flex items-center justify-center gap-1 sm:gap-2">
          {slides.map((_, index) => (
            <Button key={index} type="button" variant="ghost" aria-label={`Go to step ${index + 1}`} onClick={() => goTo(index)} className={`h-8 min-w-5 p-0 hover:bg-transparent ${index === i ? "text-cyan" : "text-slate-line"}`}>
              <span className={`block h-2 rounded-sm transition-all duration-500 ${index === i ? `w-8 ${last ? "onboarding-emerald-indicator" : "onboarding-cyan-indicator"}` : "w-2 onboarding-inactive-indicator"}`} />
            </Button>
          ))}
        </div>
        <Button type="button" onClick={next} disabled={blocked} className={`onboarding-next-button col-start-2 row-start-2 w-full rounded-2xl px-7 py-3.5 font-display font-semibold transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 sm:w-auto ${last ? "onboarding-emerald-button shadow-[0_10px_40px_-10px_var(--emerald)]" : "onboarding-cyan-button shadow-[0_10px_40px_-10px_var(--cyan)]"}`}>
          {blocked ? "Pick one ↑" : s.cta}
        </Button>
      </footer>
    </div>
  );
}
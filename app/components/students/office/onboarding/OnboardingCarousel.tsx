import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Tolu, type ToluState } from "./Tolu";
import { features } from "./FeaturePreview";

type Slide =
  | { kind: "story"; badge: string; title: string; state: ToluState; copy: string; cta: string; feature?: number; full?: boolean }
  | { kind: "quiz"; badge: string; title: string; options: string[]; cta: string };

const buildSlides = (track: string): Slide[] => [
  { kind: "story", full: true, badge: `${track.toUpperCase()} TRACK`, title: "Yo, welcome in.", state: "welcome", cta: "Let's go →", copy: `I'm Tolu. You picked ${track}, so you clearly don't play small. Same. Let's build something real.` },
  { kind: "story", full: true, badge: "COGNITIVE BASELINE REQUIRED", title: "Read the Room First", state: "scanning", cta: "I'm ready →", copy: `Real talk: this isn't a beginner school. You need the ${track} fundamentals locked in. We drop you straight into raw, advanced client briefs.` },
  { kind: "quiz", badge: "QUICK CHECK · 1 OF 2", title: "What's your main goal at WDC Labs?", cta: "Next →", options: [`📊 Build a killer ${track} portfolio`, "📜 Lock down my global Visa Reference Letter", "💼 Land a full-time role"] },
  { kind: "story", badge: "SYSTEM INDUCTION HUB", title: "This is HQ", state: "welcome", cta: "Next →", feature: 0, copy: "Your command hub. 24 weeks. Intern to Expert. You run it all from here." },
  { kind: "story", badge: "WORK TERMINAL OPERATIONAL", title: "Your Office", state: "scanning", cta: "Next →", feature: 1, copy: "Real client briefs at your Desk. Stuck? Hit the Meeting Room. Need assets? Archives." },
  { kind: "quiz", badge: "QUICK CHECK · 2 OF 2", title: "How do you work best?", cta: "Next →", options: ["⚡ Fast sprints, ship daily", "🧠 Deep focus, big drops", "🤝 Sync often, iterate"] },
  { kind: "story", badge: "FINANCIAL INFRASTRUCTURE", title: "Global Wallet", state: "scanning", cta: "Next →", feature: 2, copy: "Balance, subscription, payouts to your local bank. Clean and quick." },
  { kind: "story", badge: "AFFILIATE GROWTH CORE", title: "Earn Money", state: "welcome", cta: "Next →", feature: 3, copy: "Grab your link, share it, stack referrals. Cash out anytime." },
  { kind: "story", badge: "MILESTONE GOALS UNLOCKED", title: "Reference Letters", state: "celebrating", cta: "Step Up To My Desk", feature: 4, copy: "12 briefs = Work Reference Letter. 24 = Visa Reference Letter. Output, not attendance. Let's work." },
];

function useTypewriter(text: string, speed = 22) {
  const [n, setN] = useState(0);
  useEffect(() => {
    // The reset is intentional: each Lovable slide begins typing from its first character.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setN(0);
    const id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { shown: text.slice(0, n), done: n >= text.length };
}
function useLockBodyScroll() { useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = "unset"; }; }, []); }

export function OnboardingCarousel({ onClose, onComplete, onStep, track = "Data Analytics", initialStep = 0 }: { onClose: () => void; onComplete: () => void; onStep?: (step: number) => void; track?: string; initialStep?: number }) {
  useLockBodyScroll();
  const slides = buildSlides(track);
  const [i, setI] = useState(() => Math.max(0, Math.min(initialStep, slides.length - 1)));
  const [picked, setPicked] = useState<Record<number, number>>({});
  const s = slides[i]!;
  const last = i === slides.length - 1;
  const goTo = (nextIndex: number) => { setI(nextIndex); onStep?.(nextIndex); };
  const next = () => (last ? onComplete() : goTo(i + 1));
  const quizPick = s.kind === "quiz" ? picked[i] : undefined;
  const state: ToluState = s.kind === "story" ? s.state : quizPick !== undefined ? "celebrating" : "welcome";
  const full = s.kind === "quiz" || s.full;
  const Feature = s.kind === "story" && s.feature !== undefined ? features[s.feature] : null;
  const typed = useTypewriter(s.kind === "story" ? s.copy : "");
  const accent = state === "celebrating" ? "text-emerald border-emerald/40 bg-emerald/10" : "text-cyan border-cyan/40 bg-cyan/10";
  const blocked = s.kind === "quiz" && quizPick === undefined;

  return <div className="onboarding-lovable fixed inset-0 z-[100] flex flex-col bg-navy/95 backdrop-blur-md text-soft overflow-hidden" role="dialog" aria-modal="true" aria-label="WDC Labs onboarding">
    <header className="flex items-center justify-between px-5 md:px-10 py-4 md:py-6 shrink-0"><div className="font-display font-bold tracking-tight text-lg">WDC<span className="text-cyan">Labs</span></div><button onClick={onClose} className="flex items-center gap-1.5 text-sm text-soft/60 hover:text-soft transition-colors">Skip Journey <X className="h-4 w-4" /></button></header>
    <main className={`flex-1 min-h-0 overflow-y-auto px-5 lg:px-10 ${full ? "flex flex-col items-center justify-center gap-8" : "flex flex-col-reverse lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:items-center"}`}><section className={`flex flex-col items-center gap-6 lg:gap-8 py-4 ${full ? "" : "lg:flex-row"}`}><div className="hidden md:block"><Tolu state={state} size={full ? 200 : 180} /></div><div className="md:hidden"><Tolu state={state} size={96} /></div>{s.kind === "story" ? <div key={i} className={`relative animate-rise speech w-full max-w-xl rounded-3xl border border-slate-line/50 bg-panel p-5 md:p-7 shadow-2xl ${full ? "speech-up text-center" : "speech-side"}`}><span className={`inline-block rounded-full border px-3 py-1 text-[10px] md:text-xs font-semibold tracking-[0.2em] ${accent}`}>{s.badge}</span><h1 className="mt-3 font-display text-2xl md:text-4xl font-bold leading-tight">{s.title}</h1><p className="mt-3 min-h-[4.5rem] text-base md:text-lg leading-relaxed text-soft/80">{typed.shown}{!typed.done && <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 bg-cyan animate-pulse" />}</p></div> : <div key={i} className="animate-rise w-full max-w-xl text-center"><div className="relative speech speech-up rounded-3xl border border-slate-line/50 bg-panel p-5 md:p-6"><span className={`inline-block rounded-full border px-3 py-1 text-[10px] md:text-xs font-semibold tracking-[0.2em] ${accent}`}>{s.badge}</span><h1 className="mt-3 font-display text-2xl md:text-3xl font-bold">{s.title}</h1></div><div className="mt-6 grid gap-3">{s.options.map((o, k) => <button key={o} onClick={() => setPicked({ ...picked, [i]: k })} className={`rounded-2xl border px-5 py-4 text-left font-semibold backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-95 ${quizPick === k ? "border-emerald bg-emerald/15 shadow-[0_0_30px_-8px_var(--emerald)]" : "border-soft/15 bg-soft/5 hover:border-cyan/50"}`}>{o}</button>)}</div>{quizPick !== undefined && <p className="mt-4 animate-rise text-emerald font-semibold">Love that. Noted ✨</p>}</div>}</section>{Feature && <section className="flex items-center justify-center py-4"><div key={i} className="animate-rise w-full max-w-md scale-[0.85] sm:scale-100"><Feature /></div></section>}</main>
    <footer className="shrink-0 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 px-5 md:px-10 py-4 md:py-6"><button onClick={() => goTo(Math.max(0, i - 1))} disabled={i === 0} className="hidden sm:block text-sm text-soft/60 disabled:opacity-0 hover:text-soft">← Back</button><div className="flex items-center gap-2">{slides.map((_, d) => <button key={d} aria-label={`Go to step ${d + 1}`} onClick={() => goTo(d)} className={`h-2 rounded-sm transition-all duration-500 ${d === i ? `w-8 ${last ? "bg-emerald" : "bg-cyan"}` : "w-2 bg-slate-line"}`} />)}</div><button onClick={next} disabled={blocked} className={`w-full sm:w-auto rounded-2xl px-7 py-3.5 font-display font-semibold text-navy transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 ${last ? "bg-emerald shadow-[0_10px_40px_-10px_var(--emerald)]" : "bg-cyan shadow-[0_10px_40px_-10px_var(--cyan)]"}`}>{blocked ? "Pick one ↑" : s.cta}</button></footer>
  </div>;
}

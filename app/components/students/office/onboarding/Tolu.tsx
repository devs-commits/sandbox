import type { CSSProperties } from "react";

export type ToluState = "welcome" | "scanning" | "celebrating";

const auras: Record<ToluState, string> = {
  welcome: "bg-[radial-gradient(circle,var(--violet)_0%,transparent_68%)]",
  scanning: "bg-[radial-gradient(circle,var(--cyan)_0%,transparent_65%)]",
  celebrating: "bg-[radial-gradient(circle,var(--emerald)_0%,transparent_68%)]",
};
const faces: Record<ToluState, string> = { welcome: "🤖", scanning: "👁️‍🗨️", celebrating: "✨" };

export function Tolu({ state, size = 200 }: { state: ToluState; size?: number }) {
  return <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Tolu, ${state}`}>
    <div className={`absolute -inset-1/4 rounded-full opacity-70 blur-2xl transition-all duration-700 ${auras[state]}`} />
    {state === "scanning" && <><div className="absolute -inset-3 rounded-full border-2 border-cyan/70 animate-ping" /><div className="absolute -inset-6 rounded-full animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0deg,color-mix(in_oklab,var(--cyan)_55%,transparent)_40deg,transparent_70deg)]" /></>}
    {state === "celebrating" && Array.from({ length: 14 }).map((_, i) => { const a = (i / 14) * Math.PI * 2; return <span key={i} className="absolute left-1/2 top-1/2 text-emerald animate-burst" style={{ "--dx": `${Math.cos(a) * size * 0.75}px`, "--dy": `${Math.sin(a) * size * 0.75}px`, animationDelay: `${(i % 4) * 0.3}s` } as CSSProperties}>{i % 2 ? "✨" : "●"}</span>; })}
    <div className="relative h-full w-full animate-float"><div className="tolu-sphere absolute inset-0 rounded-full" /><div className="absolute left-[18%] top-[10%] h-[22%] w-[34%] rounded-full bg-soft/20 blur-md" /><div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: size * 0.42 }}><span key={state} className="animate-rise drop-shadow-[0_0_12px_var(--cyan)]">{faces[state]}</span></div></div>
  </div>;
}

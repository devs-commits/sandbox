import type { CSSProperties } from "react";

export type ToluState = "welcome" | "scanning" | "celebrating";

const auras: Record<ToluState, string> = {
  welcome: "tolu-aura-welcome",
  scanning: "tolu-aura-scanning",
  celebrating: "bg-[radial-gradient(circle,var(--emerald)_0%,transparent_68%)]",
};

export function Tolu({ state, size = 200 }: { state: ToluState; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Tolu, ${state}`}>
      <div className={`absolute -inset-1/4 rounded-full opacity-60 blur-2xl transition-all duration-700 ${auras[state]}`} aria-hidden="true" />
      {state === "scanning" && (
        <>
          <div className="absolute -inset-4 rounded-full border-2 border-cyan/60 animate-ping" aria-hidden="true" />
          <div className="absolute -inset-6 rounded-full border border-dashed border-cyan/50 animate-spin-slow" aria-hidden="true" />
          <div className="tolu-scan-sweep absolute -inset-6 rounded-full animate-spin-slow" aria-hidden="true" />
        </>
      )}
      {state === "celebrating" && Array.from({ length: 14 }).map((_, index) => {
        const angle = (index / 14) * Math.PI * 2;
        const style = {
          "--dx": `${Math.cos(angle) * size * 0.75}px`,
          "--dy": `${Math.sin(angle) * size * 0.75}px`,
          animationDelay: `${(index % 4) * 0.35}s`,
        } as CSSProperties & { "--dx": string; "--dy": string };

        return (
          <span key={index} className="absolute left-1/2 top-1/2 text-emerald animate-burst" style={style} aria-hidden="true">
            {index % 2 ? "✨" : "●"}
          </span>
        );
      })}
      <div className="relative h-full w-full animate-float" aria-hidden="true">
        <div className="orb-shell absolute inset-0 rounded-full" />
        <div className="orb-shell absolute left-[-6%] top-[42%] h-[18%] w-[12%] rounded-full" />
        <div className="orb-shell absolute right-[-6%] top-[42%] h-[18%] w-[12%] rounded-full" />
        <div className="absolute left-1/2 top-[-10%] h-[14%] w-[3%] -translate-x-1/2 rounded-full bg-violet" />
        <div className={`tolu-antenna-tip absolute left-1/2 top-[-16%] h-[8%] w-[8%] -translate-x-1/2 rounded-full transition-colors duration-700 ${state}`} />
        <div className="orb-visor absolute left-[16%] right-[16%] top-[30%] bottom-[30%] flex items-center justify-center gap-[14%] rounded-[40%]">
          {state === "celebrating" ? (
            <>
              <Arc />
              <Arc />
            </>
          ) : state === "scanning" ? (
            <>
              <span className="eye h-[38%] w-[22%] rounded-sm" />
              <span className="eye h-[38%] w-[22%] rounded-sm" />
              <span className="absolute inset-x-[10%] top-1/2 h-px bg-cyan/70 animate-pulse" />
            </>
          ) : (
            <>
              <span className="eye h-[50%] w-[18%] rounded-full" />
              <span className="eye h-[50%] w-[18%] rounded-full" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Arc() {
  return <span className="tolu-celebration-eye h-[28%] w-[24%]" aria-hidden="true" />;
}

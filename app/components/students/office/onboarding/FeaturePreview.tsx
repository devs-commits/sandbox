import { Search, Briefcase, Users, Archive, Wallet, ArrowDownToLine, Link2, Copy, Award, Globe2 } from "lucide-react";

const Halo = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-3xl ring-4 ring-cyan/70 animate-pulse shadow-[0_0_60px_-10px_var(--cyan)] bg-panel border border-slate-line p-5 md:p-7 w-full">
    {children}
  </div>
);

function Hub() {
  return <Halo><div className="flex items-center gap-3 rounded-2xl border border-slate-line bg-navy px-4 py-3"><Search className="h-5 w-5 text-cyan" /><span className="text-soft/60 text-sm">Search briefs, rooms, archives…</span></div><div className="mt-5 grid grid-cols-3 gap-3">{["Intern", "Associate", "Expert"].map((r, i) => <div key={r} className={`rounded-xl border p-3 text-center ${i === 0 ? "border-cyan bg-cyan/10" : "border-slate-line"}`}><div className="text-[10px] uppercase tracking-widest text-soft/50">Rank {i + 1}</div><div className="font-display text-soft font-semibold mt-1 text-sm">{r}</div></div>)}</div><div className="mt-5"><div className="flex justify-between text-xs text-soft/60"><span>Week 1 of 24</span><span>4%</span></div><div className="mt-2 h-2 rounded-full bg-slate-line"><div className="h-full w-[4%] rounded-full bg-cyan" /></div></div></Halo>;
}

function Office() {
  const items = [{ icon: Briefcase, t: "My Desk", s: "3 client briefs waiting" }, { icon: Users, t: "Meeting Room", s: "Tolu + AI support online" }, { icon: Archive, t: "Archives", s: "Data sheets & past assets" }];
  return <Halo><div className="space-y-3">{items.map(({ icon: I, t, s }, i) => <div key={t} className={`flex items-center gap-4 rounded-2xl border p-4 ${i === 0 ? "border-cyan bg-cyan/10" : "border-slate-line bg-navy"}`}><div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-line"><I className="h-5 w-5 text-cyan" /></div><div><div className="font-display font-semibold text-soft">{t}</div><div className="text-sm text-soft/60">{s}</div></div></div>)}</div></Halo>;
}

function WalletCard() {
  return <Halo><div className="flex items-center justify-between"><span className="text-xs uppercase tracking-widest text-soft/50">Global Wallet</span><Wallet className="h-5 w-5 text-cyan" /></div><div className="mt-3 font-display text-4xl md:text-5xl font-bold text-soft">₦1,240<span className="text-soft/40">.50</span></div><div className="mt-1 text-sm text-emerald">+ ₦180 referral payouts this month</div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl border border-slate-line bg-navy p-3"><div className="text-xs text-soft/50">Subscription</div><div className="text-soft font-semibold">Pro · Active</div></div><button className="flex items-center justify-center gap-2 rounded-xl bg-cyan font-semibold text-navy"><ArrowDownToLine className="h-4 w-4" />Withdraw</button></div></Halo>;
}

function Earn() {
  return <Halo><div className="text-xs uppercase tracking-widest text-soft/50">Your affiliate link</div><div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-line bg-navy px-3 py-3"><Link2 className="h-4 w-4 text-cyan" /><span className="flex-1 truncate text-sm text-soft">wdclabs.com/r/abdulquadri</span><Copy className="h-4 w-4 text-soft/60" /></div><div className="mt-5 grid grid-cols-3 gap-3 text-center">{[["24", "Clicks"], ["7", "Referrals"], ["₦180", "Earned"]].map(([v, l]) => <div key={l} className="rounded-xl border border-slate-line p-3"><div className="font-display text-xl font-bold text-soft">{v}</div><div className="text-xs text-soft/50">{l}</div></div>)}</div></Halo>;
}

function Letters() {
  return <div className="w-full rounded-3xl ring-4 ring-emerald/70 animate-pulse shadow-[0_0_60px_-10px_var(--emerald)] bg-panel border border-slate-line p-5 md:p-7">{[{ icon: Award, t: "Work Reference Letter", n: 12, d: 9 }, { icon: Globe2, t: "Visa Reference Letter", n: 24, d: 9 }].map(({ icon: I, t, n, d }) => <div key={t} className="mb-4 last:mb-0 rounded-2xl border border-slate-line bg-navy p-4"><div className="flex items-center gap-3"><I className="h-6 w-6 text-emerald" /><div className="flex-1 font-display font-semibold text-soft">{t}</div><span className="text-sm text-soft/60">{d}/{n}</span></div><div className="mt-3 h-2 rounded-full bg-slate-line"><div className="h-full rounded-full bg-emerald" style={{ width: `${(d / n) * 100}%` }} /></div></div>)}</div>;
}

export const features = [Hub, Office, WalletCard, Earn, Letters];

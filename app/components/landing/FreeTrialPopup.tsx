"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, Gift, Sparkles, Timer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

const promoCode = "WDCLABS14";
const popupDelayMs = 10000;
const dismissedStorageKey = "wdc_free_trial_popup_dismissed_at";
const sessionSeenKey = "wdc_free_trial_popup_seen";

export default function FreeTrialPopup() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(window.localStorage.getItem(dismissedStorageKey) || 0);
    const dismissedDate = new Date(dismissedAt).toDateString();
    const today = new Date().toDateString();
    const dismissedToday = dismissedDate === today;
    const seenThisSession = window.sessionStorage.getItem(sessionSeenKey) === "true";

    if (dismissedToday || seenThisSession) return;

    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(sessionSeenKey, "true");
      setOpen(true);
    }, popupDelayMs);

    return () => window.clearTimeout(timer);
  }, []);

  const dismissPopup = () => {
    window.localStorage.setItem(dismissedStorageKey, String(Date.now()));
    setOpen(false);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) dismissPopup();
        else setOpen(true);
      }}
    >
      <DialogContent className="max-h-[92vh] w-[calc(100%-2rem)] max-w-[560px] overflow-hidden rounded-2xl border-0 bg-white p-0 text-slate-950 shadow-2xl sm:rounded-3xl [&>button]:text-white [&>button]:opacity-80 [&>button]:transition [&>button]:hover:opacity-100">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.35),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.32),transparent_34%),linear-gradient(135deg,#0f172a,#172554_55%,#312e81)] px-5 pb-5 pt-10 text-white sm:px-7 sm:pb-7">
          <div className="absolute right-14 top-5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
            14 days free
          </div>

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-cyan-100 shadow-lg">
            <Gift className="h-7 w-7" />
          </div>

          <DialogTitle className="max-w-[430px] text-3xl font-black leading-tight tracking-normal text-white sm:text-4xl">
            Try WDC Labs free for 14 days.
          </DialogTitle>
          <DialogDescription className="mt-3 max-w-[440px] text-sm leading-6 text-cyan-50/85 sm:text-base">
            Use the code below to unlock your free trial and start building real work experience before choosing a paid plan.
          </DialogDescription>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              onClick={copyCode}
              className="flex min-h-14 items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 text-left transition hover:bg-white/15"
            >
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/70">
                  Trial code
                </span>
                <span className="text-xl font-black tracking-normal text-white">{promoCode}</span>
              </span>
              {copied ? <Check className="h-5 w-5 text-emerald-300" /> : <Copy className="h-5 w-5 text-cyan-100" />}
            </button>

            <Button asChild className="h-14 rounded-2xl bg-cyan-300 px-6 font-black text-slate-950 hover:bg-cyan-200">
              <Link href={`/signup?promo=${promoCode}`} onClick={dismissPopup}>
                Start free trial
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-slate-50 px-5 py-5 sm:px-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <Sparkles className="mb-2 h-4 w-4 text-violet-600" />
            <p className="text-xs font-bold text-slate-900">Real task practice</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <Timer className="mb-2 h-4 w-4 text-cyan-600" />
            <p className="text-xs font-bold text-slate-900">No payment today</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

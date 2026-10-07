"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { CarouselButton as Button } from "./CarouselButton";
import { ScreenshotLightbox, ScreenshotThumbnail, type Screenshot } from "./ScreenshotLightbox";

const screenshots: Screenshot[] = [
  { url: "/welcome-final.png", alt: "Headquarters welcome panel with the first task button highlighted", label: "Headquarters · Welcome" },
  { url: "/desk-guided3.png", width: 1485, alt: "My Office sidebar tab and advanced cybersecurity client task highlighted", label: "My Office · Client brief" },
  { url: "/hub-guided2.png", width: 1650, alt: "Headquarters sidebar tab and first week of the learning roadmap highlighted", label: "Headquarters · Learning roadmap" },
  { url: "/desk-guided3.png", width: 1485, alt: "My Office sidebar tab and cybersecurity task brief highlighted on Your Desk", label: "My Office · Your Desk" },
  { url: "/wallet-guided2.png", width: 1720, alt: "Profile Settings sidebar tab, KYC & Security tab and bank and withdrawal security setup highlighted", label: "Profile Settings · KYC & Security" },
  { url: "/earn-guided2.png", width: 1250, alt: "Earn Money sidebar tab and referral link sharing controls highlighted", label: "Earn Money · Referral link" },
  { url: "/letters-guided2.png", width: 1920, alt: "Headquarters sidebar tab and work and visa reference letter milestones highlighted", label: "Headquarters · Reference letters" },
];

const taskScreenshots: Screenshot[] = [
  { url: "/task-desk.png", width: 1920, alt: "My Office sidebar tab and assigned task highlighted on Your Desk", label: "Your Desk" },
  { url: "/task-actions.png", width: 855, alt: "Task popup with View Full Details and Submit Work buttons highlighted", label: "Task actions" },
  { url: "/task-details.png", width: 862, alt: "Full task details showing the deadline, attached resources, and task brief", label: "Full details" },
  { url: "/task-submit.png", width: 640, alt: "Submit Work popup with upload area and Submit to Sola button highlighted", label: "Submit work" },
];

export function TaskSubmissionPreview() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const active = expanded === null ? null : taskScreenshots[expanded] ?? null;

  return (
    <>
      <div className="mx-auto grid w-full max-w-[900px] gap-3 sm:grid-cols-2" role="group" aria-label="Task submission walkthrough">
        {taskScreenshots.map((shot, index) => (
          <figure key={shot.label} className="min-w-0 overflow-hidden rounded-md border border-slate-line bg-panel">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-slate-line px-3 py-1.5">
              <figcaption className="min-w-0 truncate text-xs font-semibold text-soft/80">{index + 1} / 4 · {shot.label}</figcaption>
              <Button type="button" variant="ghost" size="icon" onClick={() => setExpanded(index)} aria-label={`Enlarge ${shot.label} screenshot`} title="View screenshot at full size" className="h-7 w-7 shrink-0 text-cyan hover:bg-cyan/10 hover:text-cyan"><Maximize2 /></Button>
            </div>
            <ScreenshotThumbnail shot={shot} onOpen={() => setExpanded(index)} className="mx-auto block h-auto w-full max-h-[37vh] object-contain sm:max-h-[17vh]" />
          </figure>
        ))}
      </div>
      <ScreenshotLightbox shot={active} onClose={() => setExpanded(null)} />
    </>
  );
}

export function FeaturePreview({ index }: { index: number }) {
  const [expanded, setExpanded] = useState(false);
  const shot = screenshots[index];
  if (!shot) return null;

  return (
    <>
      <figure className="w-full overflow-hidden rounded-md border border-slate-line bg-panel shadow-[0_12px_40px_-20px_var(--cyan)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-line px-3 py-2 sm:px-4">
          <figcaption className="min-w-0 truncate text-xs font-semibold text-soft/80">{shot.label}</figcaption>
          <Button type="button" variant="ghost" size="icon" onClick={() => setExpanded(true)} aria-label={`Enlarge ${shot.label} screenshot`} title="View screenshot at full size" className="h-7 w-7 shrink-0 text-cyan hover:bg-cyan/10 hover:text-cyan">
            <Maximize2 />
          </Button>
        </div>
        <ScreenshotThumbnail shot={shot} onOpen={() => setExpanded(true)} className="mx-auto block h-auto max-h-[32vh] w-auto max-w-full object-contain md:max-h-[36vh]" />
      </figure>
      <ScreenshotLightbox shot={expanded ? shot : null} onClose={() => setExpanded(false)} />
    </>
  );
}

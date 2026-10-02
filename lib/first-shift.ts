export type FirstShiftTrack = "data-analytics" | "digital-marketing" | "cyber-security";

export type FirstShiftBrief = {
  title: string;
  company: string;
  context: string;
  deliverable: string;
  actionPrompt: string;
  options: Array<{ label: string; feedback: string; correct: boolean }>;
};

export const FIRST_SHIFT_BRIEFS: Record<FirstShiftTrack, FirstShiftBrief> = {
  "data-analytics": {
    title: "Weekly sales snapshot",
    company: "Northstar Retail",
    context: "The sales lead needs a quick view of last week's performance before Monday's planning meeting.",
    deliverable: "Choose the first action that makes the report trustworthy.",
    actionPrompt: "What should you do before drawing a conclusion from the spreadsheet?",
    options: [
      { label: "Check for missing values and duplicate rows", feedback: "Correct. Validate the data before you interpret it.", correct: true },
      { label: "Pick the most attractive chart first", feedback: "A chart helps later, but data quality comes first.", correct: false },
      { label: "Write the recommendation from the headline number", feedback: "A single number can mislead without validation and context.", correct: false },
    ],
  },
  "digital-marketing": {
    title: "Launch-week social campaign",
    company: "Northstar Retail",
    context: "A new product line launches this Friday and the client wants a focused Instagram campaign.",
    deliverable: "Choose the first action that makes the campaign relevant.",
    actionPrompt: "What should you establish before writing the first post?",
    options: [
      { label: "The audience, their need, and the campaign objective", feedback: "Correct. The audience and objective guide every later creative choice.", correct: true },
      { label: "A list of trending hashtags", feedback: "Hashtags can support distribution, but they are not the campaign strategy.", correct: false },
      { label: "The final colour palette", feedback: "Visual direction matters, but it follows the audience and objective.", correct: false },
    ],
  },
  "cyber-security": {
    title: "Suspicious login review",
    company: "Northstar Retail",
    context: "A team member reports repeated login alerts from an unfamiliar location.",
    deliverable: "Choose the first action that preserves evidence and reduces risk.",
    actionPrompt: "What should you do first?",
    options: [
      { label: "Verify the alert details and preserve the relevant logs", feedback: "Correct. Confirm the signal and preserve evidence before acting further.", correct: true },
      { label: "Delete the account immediately", feedback: "That may disrupt the business and destroy useful investigation context.", correct: false },
      { label: "Share the alert screenshot in a public channel", feedback: "Security incidents should be handled through the appropriate, limited-access channel.", correct: false },
    ],
  },
};

export function resolveFirstShiftTrack(track?: string | null): FirstShiftTrack {
  const normalized = (track || "").toLowerCase();
  if (normalized.includes("market") || normalized.includes("digital")) return "digital-marketing";
  if (normalized.includes("cyber") || normalized.includes("security")) return "cyber-security";
  return "data-analytics";
}

export function formatFirstShiftTrack(track?: string | null) {
  return resolveFirstShiftTrack(track)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

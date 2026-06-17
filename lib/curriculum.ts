// lib/curriculum.ts

export function getIdentityForWeek(track: string, week: number): string {
  const trackKey = track.toLowerCase().replace(/ |-/, "_");

  if (trackKey === "data_analytics") {
    if (week <= 4) return "Data Intern";
    if (week <= 8) return "Junior Data Analyst";
    if (week <= 12) return "Data Analyst";
    if (week <= 16) return "Business Intelligence Analyst";
    if (week <= 20) return "Analytics Strategist";
    return "Director of Analytics";
  } else if (trackKey === "digital_marketing") {
    if (week <= 4) return "Marketing Intern";
    if (week <= 8) return "Campaign Operator";
    if (week <= 12) return "Digital Marketing Associate";
    if (week <= 16) return "Performance Marketer";
    if (week <= 20) return "Growth Strategist";
    return "Marketing Director";
  } else if (trackKey === "cyber_security") {
    if (week <= 4) return "Security Intern";
    if (week <= 8) return "Security Associate";
    if (week <= 12) return "Security Analyst";
    if (week <= 16) return "Threat Defender";
    if (week <= 20) return "Incident Commander";
    return "Chief Security Strategist";
  }
  return "Intern";
}

// A simplified map just for the Email generation
export const CURRICULUM_MAP: Record<string, Record<number, { topic: string, objective: string }>> = {
  "digital_marketing": {
    1: { topic: "Intro to Digital Marketing", objective: "Understand the digital marketing ecosystem." },
    2: { topic: "Customer Journey & Psychology", objective: "Learn buyer behavior, personas, funnels." },
    // Add the rest of your weeks here based on your Python dictionary...
  },
  "data_analytics": {
    1: { topic: "Intro to Data Analytics", objective: "Understand what data analysts do." },
    2: { topic: "Excel Basics", objective: "Learn spreadsheets, formatting, sorting." },
    // Add the rest of your weeks here based on your Python dictionary...
  }
};

export function getCurriculumStep(track: string, week: number) {
  const trackKey = track.toLowerCase().replace(/ |-/, "_");
  const trackData = CURRICULUM_MAP[trackKey] || {};
  return trackData[week] || { topic: `Week ${week} Challenge`, objective: "Advance your skills in a real workplace simulation." };
}
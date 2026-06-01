import {
  Terminal,
  Shield,
  Radar,
  Lock,
  Flame,
  Crown,
  Database,
  Sigma,
  BarChart3,
  Eye,
  Cog,
  TrendingUp,
  AlertTriangle,
  Users,
  PenTool,
  Search,
  Megaphone,
  Filter,
  Gauge,
  Rocket,
  Siren,
  LineChart,
  Presentation,
} from "lucide-react";

export const BADGE_CONFIG: Record<string, any> = {
  // --- CYBER SECURITY ---
  "Linux Operator": { 
    icon: Terminal, 
    rarity: "common",
    description: "Complete Linux navigation challenge"
  },
  "Network Defender": { 
    icon: Shield, 
    rarity: "rare",
    description: "Configure firewall rules successfully"
  },
  "Threat Hunter": { 
    icon: Radar, 
    rarity: "epic",
    description: "Detect simulated attack activity"
  },
  "Encryption Specialist": { 
    icon: Lock, 
    rarity: "rare",
    description: "Secure sensitive business data"
  },
  "Incident Responder": { 
    icon: Siren, 
    rarity: "epic",
    description: "Handle ransomware simulation"
  },
  "Vulnerability Analyst": { 
    icon: AlertTriangle, 
    rarity: "rare",
    description: "Complete penetration testing task"
  },
  "SOC Operator": { 
    icon: Radar, 
    rarity: "epic",
    description: "Manage security monitoring workflows"
  },
  "Compliance Guardian": { 
    icon: Shield, 
    rarity: "legendary",
    description: "Draft security governance policies"
  },
  "Crisis Commander": { 
    icon: Flame, 
    rarity: "legendary",
    description: "Coordinate breach response"
  },
  "Cyber Defense Certified": { 
    icon: Crown, 
    rarity: "mythic",
    description: "Pass executive defense simulation"
  },

  // --- DATA ANALYTICS ---
  "Spreadsheet Survivor": { 
    icon: BarChart3, 
    rarity: "common",
    description: "Complete Excel cleaning challenge"
  },
  "Formula Operator": { 
    icon: Sigma, 
    rarity: "rare",
    description: "Pass formula optimization task"
  },
  "SQL Investigator": { 
    icon: Database, 
    rarity: "epic",
    description: "Solve SQL business problem"
  },
  "Dashboard Specialist": { 
    icon: BarChart3, 
    rarity: "rare",
    description: "Build Power BI dashboard"
  },
  "Insight Hunter": { 
    icon: Eye, 
    rarity: "epic",
    description: "Deliver actionable recommendations"
  },
  "Data Storyteller": { 
    icon: Presentation, 
    rarity: "epic",
    description: "Present executive-ready insights"
  },
  "Automation Specialist": { 
    icon: Cog, 
    rarity: "legendary",
    description: "Automate reporting workflows"
  },
  "Predictive Analyst": { 
    icon: TrendingUp, 
    rarity: "epic",
    description: "Complete forecasting challenge"
  },
  "Crisis Analyst": { 
    icon: AlertTriangle, 
    rarity: "legendary",
    description: "Resolve broken reporting simulation"
  },
  "Executive Analyst": { 
    icon: Crown, 
    rarity: "mythic",
    description: "Defend strategy before leadership"
  },

  // --- DIGITAL MARKETING ---
  "Audience Analyst": { 
    icon: Users, 
    rarity: "common",
    description: "Complete customer journey mapping"
  },
  "Content Operator": { 
    icon: PenTool, 
    rarity: "rare",
    description: "Submit viral content task"
  },
  "SEO Explorer": { 
    icon: Search, 
    rarity: "epic",
    description: "Successfully optimize website audit"
  },
  "Paid Media Operator": { 
    icon: Megaphone, 
    rarity: "rare",
    description: "Launch first campaign simulation"
  },
  "Funnel Builder": { 
    icon: Filter, 
    rarity: "epic",
    description: "Complete retargeting funnel"
  },
  "Optimization Expert": { 
    icon: Gauge, 
    rarity: "legendary",
    description: "Improve campaign ROAS"
  },
  "Analytics Specialist": { 
    icon: LineChart, 
    rarity: "epic",
    description: "Solve attribution challenge"
  },
  "Growth Strategist": { 
    icon: Rocket, 
    rarity: "legendary",
    description: "Complete growth experiment"
  },
  "Crisis Manager": { 
    icon: Flame, 
    rarity: "legendary",
    description: "Handle PR simulation"
  },
  "Boardroom Certified": { 
    icon: Crown, 
    rarity: "mythic",
    description: "Pass final executive defense"
  },
};

export const rarityStyles: Record<string, string> = {
  common:
    "border-slate-600 bg-slate-800/80",
  rare:
    "border-blue-500/40 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]",
  epic:
    "border-rose-500/40 bg-rose-500/10 shadow-[0_0_25px_rgba(244,63,94,0.25)]",
  legendary:
    "border-yellow-500/40 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.35)]",
  mythic:
    "border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.35)]",
};
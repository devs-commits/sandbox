"use client";
import { useState, useEffect, useRef } from "react";
import { StudentHeader } from "../../components/students/StudentHeader";
import { SubscriptionLineCounter } from "../../components/dashboard/SubscriptionLineCounter";
import { Button } from "../../components/ui/button";
import { 
  FileText, Eye, User, Download, Loader2, CheckCircle, 
  Lock, PlayCircle, GraduationCap, AlertCircle, CreditCard, Briefcase
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContexts";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WhatsAppSupport } from "@/app/components/students/whatAppSupport";
import { buildLetterFileName, downloadLetterFromElement, type LetterType } from "../../../lib/generateReferenceLetter";
import { ReferenceLetterTemplate, type LetterData } from "../../components/letters/ReferenceLetterTemplate";
import { HeadquartersProvider } from "../../contexts/HeadquartersContext";
import { HeadquartersTour } from "../../components/students/headquarters/HeadquartersTour";
import { PROGRAM_MILESTONES } from "@/lib/program-milestones";

// 🔥 Import the new Subscribe Modal
import { SubscribeModal } from "@/app/components/students/SubscribeModal"; 

type ModuleDef = { topic: string; days: string[]; };

const TRACK_SYLLABUS: Record<string, ModuleDef[]> = {
  "data-analytics": [
    { topic: "Intro to Data Analytics", days: ["What is Data Analytics?", "The Data Life Cycle", "Key Metrics & KPIs", "Data Privacy & Ethics", "Dataset Exploration", "Reality Task: Analyze sales records"] },
    { topic: "Excel Basics", days: ["Interface & Navigation", "Data Entry & Cleanup", "Sorting & Multi-level Filtering", "Cell Referencing", "Data Validation", "Reality Task: Clean employee records"] },
    { topic: "Excel Functions & Formulas", days: ["Basic Aggregations", "Text Functions", "Logical Functions", "Conditional Sums", "Lookup Functions", "Reality Task: Fix customer data"] },
    { topic: "Data Visualization in Excel", days: ["Chart Principles", "Chart Formatting", "Pivot Tables Basics", "Pivot Charts & Slicers", "Dashboard Layout", "Reality Task: Create sales dashboard"] },
    { topic: "Power Query & Data Cleaning", days: ["Intro to Power Query", "Connecting Data", "Transformations", "Merging & Appending", "Data Types & Errors", "Reality Task: Import messy sales files"] },
    { topic: "Excel Business Project", days: ["Project Scoping", "Data Cleaning & Audit", "Data Analysis", "Dashboard Build", "Insight Generation", "Reality Task: Analyze retail data"] },
    { topic: "SQL Basics", days: ["Intro to RDBMS & SQL", "Data Retrieval", "Filtering Data", "Sorting Results", "SQL Practice", "Reality Task: Retrieve customer orders"] },
    { topic: "SQL Joins & Aggregation", days: ["Aggregation Functions", "Grouping Data", "SQL Joins 1 (Inner/Left)", "SQL Joins 2 (Right/Full)", "Multi-Table Joins", "Reality Task: Top-performing products"] },
    { topic: "Intermediate SQL Analysis", days: ["Subqueries", "Common Table Expressions (CTEs)", "String & Date Functions", "Conditional Logic (CASE)", "Performance Optimization", "Reality Task: Declining sales trends"] },
    { topic: "Power BI Fundamentals", days: ["Intro to Power BI Desktop", "Data Ingestion", "Star Schema Data Modeling", "Basic Visuals", "Visual Interactivity", "Reality Task: Build KPI cards"] },
    { topic: "Power BI Dashboards & DAX", days: ["Intro to DAX", "Essential DAX Functions", "The CALCULATE Function", "Time Intelligence in DAX", "Executive Dashboard Formatting", "Reality Task: MoM growth trends"] },
    { topic: "Portfolio + Analyst Defense", days: ["Portfolio Setup", "Executive Summaries", "Presentation Deck Creation", "Q&A Prep", "Final Rehearsal", "Reality Task: Present business insights"] },
    { topic: "Python for Data Analytics", days: ["Intro to Python & Jupyter", "Python Control Structures", "Intro to Pandas", "Loading Datasets", "Data Inspection", "Reality Task: Load and clean CSV files"] },
    { topic: "Data Manipulation with Pandas", days: ["Filtering Data", "Data Cleaning", "Aggregations", "Merging Data", "Feature Engineering", "Reality Task: Regional sales performance"] },
    { topic: "Python Visualization", days: ["Intro to Matplotlib", "Intro to Seaborn", "Customizing Visuals", "Visualizing Distributions", "Multi-plot Grids", "Reality Task: Ad spend vs sales"] },
    { topic: "Working with Big Data Files", days: ["Memory Management", "Optimized File Formats", "Vectorization", "Large Dataset Filtering", "Out-of-Memory Workflows", "Reality Task: Analyze 2GB transaction file"] },
    { topic: "Statistical Analysis", days: ["Central Tendency & Dispersion", "Probability Distributions", "Correlation vs Causation", "Hypothesis Testing", "Churn Analysis Drivers", "Reality Task: Factor influencing churn"] },
    { topic: "Advanced Power BI & DAX", days: ["Dynamic Parameters", "Advanced DAX", "Row-Level Security (RLS)", "Performance Analyzer", "Dashboard UX/UI", "Reality Task: Dynamic executive dashboard"] },
    { topic: "Business Reporting & Communication", days: ["Storytelling Frameworks", "Eliminating Noise", "Writing for C-Suite", "Slide Deck Design", "Presenting Uncertainties", "Reality Task: Boardroom-ready report"] },
    { topic: "Analytics Automation", days: ["Automation Architecture", "Python Scripting", "Power BI Gateway", "Email Alerts", "Workflow Debugging", "Reality Task: Automate weekly reporting"] },
    { topic: "Predictive Analytics Foundations", days: ["Time Series Basics", "Moving Averages", "Linear Regression Intro", "Evaluating Forecasts", "Scenario Analysis", "Reality Task: Predict sales performance"] },
    { topic: "Cross-Department Data Analysis", days: ["Multi-Department Metrics", "Customer Journey Mapping", "Data Reconciliation", "Cohort Analysis", "Cross-Department Dashboards", "Reality Task: Identify revenue leakage"] },
    { topic: "Real-World Data Crisis Simulation", days: ["Diagnostic Analytics", "Finding Broken Pipelines", "Fast Data Patching", "Stakeholder Management", "Root Cause Analysis", "Reality Task: Fix broken reports"] },
    { topic: "Boardroom Defense & Strategic Analytics", days: ["12-Month Analytics Roadmap", "Estimating Analytics ROI", "Final Executive Presentation", "Mock Defense", "Final Polish", "Reality Task: Present 12-month strategy"] }
  ],
  "digital-marketing": [
    { topic: "Intro to Digital Marketing", days: ["The Digital Ecosystem", "Business Growth Models", "Key Digital Metrics", "Competitor Research", "Marketing Audit Setup", "Reality Task: Analyze local business"] },
    { topic: "Customer Journey & Psychology", days: ["Consumer Psychology", "The Marketing Funnel", "The 3i Principles", "Buyer Personas", "Touchpoint Mapping", "Reality Task: Map fintech journey"] },
    { topic: "Content & Social Media Basics", days: ["Platform Mechanics", "Hook Writing", "Content Pillars", "Content Scheduling", "Community Engagement", "Reality Task: 1-week Instagram plan"] },
    { topic: "SEO & Search Fundamentals", days: ["How Search Engines Work", "Keyword Research", "On-Page SEO 1", "On-Page SEO 2", "SEO Audit Tools", "Reality Task: Audit website and optimize"] },
    { topic: "Meta Ads Fundamentals", days: ["Meta Business Suite Setup", "Campaign Hierarchy", "Audience Targeting", "Budgeting & Scheduling", "Ad Setup", "Reality Task: Meta Ads campaign"] },
    { topic: "Google Ads & PPC", days: ["Intro to PPC & Search Ads", "Match Types", "Ad Copywriting", "Ad Extensions (Assets)", "Bidding Strategies", "Reality Task: Launch Google Ads"] },
    { topic: "Creatives & Landing Pages", days: ["Direct Response Copywriting", "Visual Design Principles", "Landing Page Essentials", "Call to Actions (CTAs)", "Landing Page Wireframing", "Reality Task: Redesign ad creatives"] },
    { topic: "Email & Mobile Marketing", days: ["Lifecycle Marketing", "Email Copywriting", "Onboarding Sequences", "Mobile Marketing", "Email Deliverability", "Reality Task: 5-email onboarding flow"] },
    { topic: "Analytics & Tracking", days: ["Web Analytics Intro", "Pixel & Conversion Setup", "UTM Parameters", "Attribution Models", "Diagnostic Analytics", "Reality Task: Diagnose GA4 report"] },
    { topic: "Media Planning & Strategy", days: ["Budget Allocation", "Forecasting KPIs", "Channel Mix Strategy", "Campaign Timelines", "Media Plan Assembly", "Reality Task: 6-month media plan"] },
    { topic: "Campaign Optimization", days: ["Performance Auditing", "A/B Testing Framework", "Fixing ROAS", "Bidding Adjustments", "Emergency Rescue Tactics", "Reality Task: Fix underperforming campaigns"] },
    { topic: "Portfolio + Boardroom Defense", days: ["Portfolio Structuring", "Reporting Frameworks", "Case Study Writing", "Objections & Defense", "Mock Pitch", "Reality Task: Present campaign results"] },
    { topic: "Advanced Meta Ads", days: ["Campaign Budget Optimization", "High-Budget Scaling", "Advanced Retargeting", "Dynamic Product Ads", "Creative Fatigue System", "Reality Task: Scale winning campaign"] },
    { topic: "Advanced Google Ads", days: ["Performance Max (PMAX)", "YouTube Ads", "Display & Remarketing", "Search Term Cleanups", "Smart Bidding", "Reality Task: Fix wasting spend"] },
    { topic: "Conversion Rate Optimization (CRO)", days: ["Heatmap Analysis", "User Friction Audits", "Copy & Value Proposition Testing", "Checkout Optimization", "A/B Test Execution", "Reality Task: Increase conversion rate"] },
    { topic: "Full Funnel Systems", days: ["Multi-Touch Funnels", "Cross-Channel Synchronization", "Offer Architecture", "Measurement Architecture", "Funnel Mapping", "Reality Task: Build acquisition funnel"] },
    { topic: "Advanced Analytics", days: ["Cohort Analysis", "CAC & LTV Economics", "Multi-Touch Attribution", "Unit Economics Debugging", "Strategic Analytics Reporting", "Reality Task: Identify CAC increase"] },
    { topic: "Marketing Automation", days: ["CRM Architectures", "Lead Scoring", "Automated Workflows", "Webhook Integrations", "Automation Testing", "Reality Task: Automated lead nurturing"] },
    { topic: "Growth Marketing Systems", days: ["Pirate Metrics (AARRR)", "Experimentation Frameworks", "Activation Rate Optimization", "Viral Loops & Referral Systems", "Growth Sprints", "Reality Task: Improve activation by 25%"] },
    { topic: "AI in Marketing", days: ["Generative AI for Copy", "AI Visual Generation", "Audience Research with AI", "Automated Reporting", "AI Workflow Integration", "Reality Task: AI-assisted workflows"] },
    { topic: "Crisis & Reputation Management", days: ["Social Listening Setup", "Crisis Classification", "Statement Drafting", "De-escalation Frameworks", "24-Hour Recovery Playbook", "Reality Task: 24-hour response strategy"] },
    { topic: "Client & Stakeholder Management", days: ["Managing Expectations", "Difficult Conversations", "Value-Based Upselling", "Client Reporting Meetings", "SLA & Scope Defense", "Reality Task: Defend delayed results"] },
    { topic: "Agency Simulation", days: ["Multi-Client Management", "Resource Allocation", "Emergency Priority Shifts", "Team Workflows", "Account Health Checks", "Reality Task: Manage 3 campaigns"] },
    { topic: "Executive Boardroom Defense", days: ["12-Month Growth Roadmap", "Executive Financial Modeling", "Presentation Mastery", "Live Board Defense Prep", "Strategy Polish", "Reality Task: Defend growth strategy"] }
  ],
  "cyber-security": [
    { topic: "Intro to Cybersecurity", days: ["Core Pillars (CIA Triad)", "Threat Landscape", "Threat Actors", "Attack Vectors", "Business Risk", "Reality Task: Phishing compromise"] },
    { topic: "Linux & Command Line Basics", days: ["Intro to Linux OS", "File Operations", "Text Processing", "Permissions & Ownership", "System Management", "Reality Task: Navigate server directories"] },
    { topic: "Networking Fundamentals", days: ["Networking Models (OSI)", "IP Addressing & Subnetting", "Core Protocols", "Network Traffic Analysis", "Network Tools", "Reality Task: Trace suspicious activity"] },
    { topic: "Security Fundamentals", days: ["Authentication vs Authorization", "Access Control Models", "Principle of Least Privilege", "Identity Auditing", "Password Security", "Reality Task: Audit permissions"] },
    { topic: "Firewalls & Network Security", days: ["Firewall Architecture", "Network Segmentation", "Firewall Rule Writing", "NACLs & Security Groups", "Traffic Auditing", "Reality Task: Block insecure traffic"] },
    { topic: "Threats & Vulnerabilities", days: ["Attack Tactics", "Denial of Service (DoS)", "Vulnerability Management", "Log Analysis Basics", "Attack Identification", "Reality Task: Analyze brute-force logs"] },
    { topic: "Authentication & MFA", days: ["Authentication Factors", "Multi-Factor Authentication", "SSO & Identity Protocols", "MFA Vulnerabilities", "Policy Enforcement", "Reality Task: Implement MFA rules"] },
    { topic: "Encryption & Cryptography", days: ["Cryptography Concepts", "Hashing Functions", "Data States", "PKI & Certificates", "Integrity Verification", "Reality Task: Encrypt confidential files"] },
    { topic: "Monitoring & Incident Response", days: ["Vulnerability Scanning", "Incident Response Lifecycle", "Log Aggregation", "Security Reporting", "Risk Prioritization", "Reality Task: Prepare security risk report"] },
    { topic: "Disaster Recovery Fundamentals", days: ["BCP & Disaster Recovery", "Recovery Metrics", "Ransomware Mechanics", "Backup Strategies", "Incident Containment", "Reality Task: Respond to ransomware"] },
    { topic: "Security Reporting & Documentation", days: ["Technical Documentation", "SOPs", "Executive Summaries", "Evidence Handling", "Portfolio Assembly", "Reality Task: Compile vulnerability report"] },
    { topic: "Boardroom Defense & Risk Communication", days: ["Security ROI", "Presenting Risk Matrices", "Handling Pushback", "Slide Deck Design", "Defense Practice", "Reality Task: Present risk mitigation plan"] },
    { topic: "Advanced Network Security", days: ["Intrusion Detection (IDS/IPS)", "Packet Capture Analysis", "Network Microsegmentation", "VPNs & Secure Proxies", "Suspicious Pattern Detection", "Reality Task: Isolate suspicious traffic"] },
    { topic: "Ethical Hacking Fundamentals", days: ["Penetration Testing Phases", "Reconnaissance (OSINT)", "Web App Recon", "Exploitation Mechanics", "Remediation Verification", "Reality Task: Identify vulnerabilities"] },
    { topic: "Web Application Security", days: ["OWASP Top 10 Intro", "Injection Attacks", "Cross-Site Scripting (XSS)", "Authentication Weaknesses", "Web App Patching", "Reality Task: Patch vulnerabilities"] },
    { topic: "Device & Endpoint Protection", days: ["EDR vs Antivirus", "Malware Types", "Host Logs Auditing", "Persistence Mechanisms", "Malware Containment", "Reality Task: Investigate malware infection"] },
    { topic: "Cloud & Infrastructure Security", days: ["Shared Responsibility Model", "Cloud Identity (IAM)", "Cloud Storage Security", "IaC Auditing", "Cloud Logging & Auditing", "Reality Task: Secure misconfigured bucket"] },
    { topic: "SOC Workflows & Threat Hunting", days: ["SOC Operations", "Threat Hunting Basics", "SIEM Querying", "Correlation Rules", "False Positive Reduction", "Reality Task: Investigate suspicious logins"] },
    { topic: "Security Policies & Compliance", days: ["Compliance Frameworks", "Data Privacy Regulations", "Security Policy Drafting", "Vendor Risk Management", "Compliance Incident Auditing", "Reality Task: Draft compliance response"] },
    { topic: "Security Automation & AI Risks", days: ["SOAR principles", "Python Scripting for Defense", "Automated Alert Workflows", "AI Security Risks", "AI in Cyber Defense", "Reality Task: Automated alert workflow"] },
    { topic: "Enterprise Incident Management", days: ["Major Incident Command", "Enterprise Breach Scenarios", "Multi-System Isolation", "External Escalation", "Root Cause Analysis", "Reality Task: Coordinate breach response"] },
    { topic: "Attack & Defense Simulation", days: ["Red Team Tactics", "Blue Team Defenses", "Purple Team Collaboration", "Live Attack Mitigation", "Post-Simulation Debrief", "Reality Task: Defend infrastructure"] },
    { topic: "Security Operations Management", days: ["Incident Prioritization", "Resource Management", "Operational Metrics", "Crisis Escalations", "Team Playbook Updates", "Reality Task: Manage simultaneous incidents"] },
    { topic: "Executive Boardroom Defense", days: ["12-Month Security Roadmap", "Justifying Security Investments", "Executive Deck Preparation", "Mock Board Defense", "Final Review", "Reality Task: Present cybersecurity strategy"] }
  ]
};

const getSyllabus = (track: string) => {
  const t = track.toLowerCase();
  if (t.includes("data") || t.includes("analytics")) return TRACK_SYLLABUS["data-analytics"];
  if (t.includes("market") || t.includes("digital")) return TRACK_SYLLABUS["digital-marketing"];
  if (t.includes("cyber") || t.includes("security")) return TRACK_SYLLABUS["cyber-security"];
  return TRACK_SYLLABUS["data-analytics"]; 
};

const buildCandidateId = (fullName: string) => {
  const initials = fullName.split(" ").map((part) => part[0]).filter(Boolean).join("").toUpperCase();
  return `WDC-${new Date().getFullYear()}-${initials || "WDC"}${Math.floor(1000 + Math.random() * 9000)}`;
};

function HeadquartersContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [userTrack, setUserTrack] = useState("");
  const [subStatus, setSubStatus] = useState("inactive");

  const [downloadingWork, setDownloadingWork] = useState(false);
  const [downloadingVisa, setDownloadingVisa] = useState(false);
  const [letterData, setLetterData] = useState<LetterData | null>(null);
  const [downloadRequest, setDownloadRequest] = useState<{ fileName: string } | null>(null);
  const letterRef = useRef<HTMLDivElement>(null);

  const [showSubModal, setShowSubModal] = useState(false);
  
  const { workLetterTasks, visaLetterTasks } = PROGRAM_MILESTONES;
  const tasksRemaining12 = Math.max(workLetterTasks - tasksCompleted, 0);
  const tasksRemaining24 = Math.max(visaLetterTasks - tasksCompleted, 0);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("tasks_completed, track, subscription_status")
        .eq("auth_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      if (userData) {
        setTasksCompleted(userData.tasks_completed || 0);
        setUserTrack(userData.track || "data-analytics");
        setSubStatus(userData.subscription_status || "inactive");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!downloadRequest || !letterData) return;
    let cancelled = false;

    const performDownload = async () => {
      try {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (!letterRef.current) throw new Error("Letter template did not render");
        
        await downloadLetterFromElement(letterRef.current, downloadRequest.fileName);
        toast.success("Letter downloaded successfully!");
      } catch (error) {
        toast.error("Failed to generate letter");
      } finally {
        if (!cancelled) {
          setDownloadingWork(false);
          setDownloadingVisa(false);
          setDownloadRequest(null);
        }
      }
    };
    performDownload();
    return () => { cancelled = true; };
  }, [downloadRequest, letterData]);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const handleDownloadLetter = async (type: "work" | "visa") => {
    const letterType: LetterType = type === "work" ? "12week" : "24week";
    const requiredTasks = type === "work" ? 12 : 24;
    
    if (tasksCompleted < requiredTasks) {
      toast.error("Requirements not met", { description: `You need ${requiredTasks} tasks to unlock this letter.` });
      return;
    }
    
    try {
      if (type === "work") setDownloadingWork(true);
      else setDownloadingVisa(true);
      
      const { data: userData } = await supabase.from("users").select("full_name, track").eq("auth_id", user?.id).single();
      if (!userData?.full_name) throw new Error("User not found");

      const newLetterData: LetterData = {
        fullName: userData.full_name,
        track: userData.track || "digital-marketing",
        type: letterType,
        candidateId: buildCandidateId(userData.full_name),
      };
      
      const fileName = buildLetterFileName(newLetterData.fullName, newLetterData.track || "digital-marketing", letterType);
      setLetterData(newLetterData);
      setDownloadRequest({ fileName });
    } catch (error) {
      toast.error("Failed to generate letter");
      setDownloadingWork(false);
      setDownloadingVisa(false);
    }
  };

  const syllabus = getSyllabus(userTrack);
  const currentWeek = tasksCompleted + 1;

  // Define payment barrier logic
  const isPaidActive = subStatus === "active";
  const hasFinishedWeek1 = tasksCompleted >= 1; // Assuming 1 reality task = week 1 is done
  const needsToPay = !isPaidActive && hasFinishedWeek1;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <StudentHeader title="Headquarters" />
      
      <div className="p-4 lg:p-6 space-y-8">
        <SubscriptionLineCounter user={user} />

        {/* Banners for Free Week & Payment Gate */}
        {needsToPay && (
          <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-transparent border border-red-500/20 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <AlertCircle size={100} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertCircle size={20} />
                <h3 className="font-bold text-lg">Free Week Completed!</h3>
              </div>
              <p className="text-muted-foreground max-w-2xl mb-6">
                You've successfully completed your free introductory week. Subscribe now to unlock Week 2, your AI Assistant, and continue your progression pathway.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => setShowSubModal(true)} className="bg-primary text-white font-bold px-6">
                  <CreditCard className="w-4 h-4 mr-2" /> Pay & Unlock Full Access
                </Button>
                <Button onClick={() => router.push("/student/wallet")} variant="outline" className="border-border">
                  Go to Global Wallet
                </Button>
              </div>
            </div>
          </div>
        )}

        {!needsToPay && tasksCompleted === 0 && !isPaidActive && (
          <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
             <div className="relative z-10">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Briefcase size={20} />
                <h3 className="font-bold text-lg">Welcome to the Team!</h3>
              </div>
              <p className="text-muted-foreground mb-4">Your workspace is ready. <strong>Your first week is completely free.</strong> Jump in and start executing your first set of tasks.</p>
              <Button onClick={() => router.push("/student/office")} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                <PlayCircle className="w-4 h-4 mr-2" /> Start Week 1 For Free
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3" data-tour="hq-stats">
          <div className="bg-muted-foreground/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <FileText size={18} className="text-blue-400" />
            <div>
              <span className="text-sm">Tasks completed: </span>
              <span className="text-sm font-semibold">{tasksCompleted}</span>
            </div>
          </div>
          <div className="bg-red-500/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse">
            <Eye size={18} className="text-red-400" />
            <span className="text-sm font-semibold">3 Recruiters viewing</span>
          </div>
          <div className="bg-purple-500/20 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <User size={18} className="text-purple-400" />
            <div>
              <span className="text-sm">Profile Stats: </span>
              <span className="text-sm font-semibold">32 Views</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap className="text-primary" /> Learning Roadmap
              </h2>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                Your 24-week path for {userTrack.replace("-", " ")}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium bg-muted px-3 py-1.5 rounded-full">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Passed
               <span className="w-2 h-2 rounded-full bg-primary ml-2"></span> Current
               <span className="w-2 h-2 rounded-full bg-border ml-2"></span> Locked
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {syllabus.map((module, index) => {
              const weekNum = index + 1;
              const isCompleted = weekNum < currentWeek;
              const isCurrent = weekNum === currentWeek;
              
              // Only visually lock weeks > 1 if user hasn't paid
              const isVisuallyLocked = weekNum > 1 && !isPaidActive && !isCompleted && !isCurrent;

              return (
                <div 
                  key={weekNum}
                  className={`group flex flex-col p-5 rounded-2xl border transition-all duration-300 min-h-[160px] ${
                    isCompleted ? "bg-emerald-950/10 border-emerald-500/20 opacity-80 hover:opacity-100" :
                    isCurrent ? "bg-card border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.1)] relative overflow-hidden" :
                    "bg-secondary/10 border-border/40 hover:bg-secondary/20"
                  }`}
                >
                  {isCurrent && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />}

                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md ${
                      isCompleted ? "bg-emerald-500/10 text-emerald-500" :
                      isCurrent ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      Week {weekNum}
                    </span>
                    {isCompleted ? <CheckCircle size={16} className="text-emerald-500" /> :
                     isCurrent ? <div className="h-2 w-2 rounded-full bg-primary animate-ping" /> :
                     <Lock size={14} className={isVisuallyLocked ? "text-red-400/50" : "text-muted-foreground/50"} />}
                  </div>
                  
                  <h3 className={`text-base font-bold leading-snug mb-2 ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                    {module.topic}
                  </h3>

                  <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider mb-1.5 text-muted-foreground/80">
                      <span>5 Modules</span>
                      <span className={isCompleted || isCurrent ? "text-amber-500/80" : "text-muted-foreground/50"}>Reality Task</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 w-full mb-3">
                       {[...Array(5)].map((_, i) => (
                         <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                           isCompleted ? "bg-emerald-500/80" :
                           isCurrent ? (i === 0 ? "bg-primary" : "bg-primary/20") :
                           "bg-border/60"
                         }`} />
                       ))}
                       {module.days.length >= 6 && (
                         <div className={`h-1.5 w-4 rounded-full transition-colors ml-1 ${
                           isCompleted ? "bg-amber-500/80" :
                           isCurrent ? "bg-amber-500/30" :
                           "bg-border/60"
                         }`} />
                       )}
                    </div>

                    {isCurrent && !needsToPay ? (
                      <Button onClick={() => router.push("/student/office")} className="w-full mt-3 h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                        <PlayCircle size={14} /> Enter Pathway
                      </Button>
                    ) : isCurrent && needsToPay ? (
                       <Button onClick={() => setShowSubModal(true)} className="w-full mt-3 h-9 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                        <Lock size={14} /> Subscribe to Unlock
                      </Button>
                    ) : (
                      <p className="truncate text-[11px] text-muted-foreground/60 font-medium">
                        {module.days.slice(0, 5).join(" • ")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <FileText className="text-purple-400" size={24} />
              <div>
                <h2 className="text-lg font-semibold">Work and Visa Reference Letters</h2>
                <p className="text-sm text-muted-foreground">Complete tasks to unlock verified immigration references.</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative w-full bg-muted rounded-full h-3 overflow-hidden border border-border">
              <div className="bg-purple-600 h-full rounded-full transition-all duration-700 relative" style={{ width: `${Math.min((tasksCompleted / visaLetterTasks) * 100, 100)}%` }} />
              
              <div className={`absolute top-1/2 w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                tasksCompleted >= workLetterTasks ? "bg-emerald-500 border-white shadow-lg" : "bg-muted-foreground border-border"
              }`} style={{ left: "50%", transform: "translate(-50%, -50%)" }} />
            </div>
            <div className="relative mt-3 text-xs font-medium text-muted-foreground flex justify-between">
              <span>{tasksCompleted} Tasks Done</span>
              <span className={`absolute left-1/2 -translate-x-1/2 ${tasksCompleted >= workLetterTasks ? "text-emerald-400" : ""}`}>{workLetterTasks} Tasks (Work)</span>
              <span>{visaLetterTasks} Tasks (Visa)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4" data-tour="hq-letters">
            <div className="bg-muted/30 border border-border rounded-xl p-5 flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tasksCompleted >= workLetterTasks ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">WORK REFERENCE</p>
                  <p className={`text-xs mt-0.5 ${tasksRemaining12 > 0 ? "text-orange-400" : "text-emerald-400"}`}>
                    {tasksRemaining12 > 0 ? `Unlocks in ${tasksRemaining12} task${tasksRemaining12 > 1 ? "s" : ""}` : "Ready to Download"}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => handleDownloadLetter("work")} disabled={tasksRemaining12 > 0 || downloadingWork} className={tasksRemaining12 > 0 ? "opacity-50" : "bg-purple-600 hover:bg-purple-500"}>
                {downloadingWork ? <Loader2 size={14} className="animate-spin mr-1"/> : <Download size={14} className="mr-1"/>}
                Get Letter
              </Button>
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-5 flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tasksCompleted >= visaLetterTasks ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">VISA REFERENCE</p>
                  <p className={`text-xs mt-0.5 ${tasksRemaining24 > 0 ? "text-orange-400" : "text-emerald-400"}`}>
                    {tasksRemaining24 > 0 ? `Unlocks in ${tasksRemaining24} task${tasksRemaining24 > 1 ? "s" : ""}` : "Ready to Download"}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => handleDownloadLetter("visa")} disabled={tasksRemaining24 > 0 || downloadingVisa} className={tasksRemaining24 > 0 ? "opacity-50" : "bg-purple-600 hover:bg-purple-500"}>
                {downloadingVisa ? <Loader2 size={14} className="animate-spin mr-1"/> : <Download size={14} className="mr-1"/>}
                Get Letter
              </Button>
            </div>
          </div>
        </div>
      </div>

      <HeadquartersTour />
      <WhatsAppSupport />

      <SubscribeModal 
        open={showSubModal} 
        onClose={() => setShowSubModal(false)} 
        userId={user?.id || ""} 
        userEmail={user?.email || ""} 
      />
      
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {letterData && <ReferenceLetterTemplate ref={letterRef} data={letterData} />}
      </div>
    </div>
  );
}

export default function page() {
  return (
    <HeadquartersProvider>
      <HeadquartersContent />
    </HeadquartersProvider>
  );
}
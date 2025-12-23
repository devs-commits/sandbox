"use client";
import {RecruiterHeader} from "../../components/recruiter/RecruiterHeader";
import { useState, useMemo } from "react";
import { Search, ChevronDown, Menu } from "lucide-react";
import { Input } from "../../components/ui/input";
import { CandidateCard } from "../../components/recruiter/talent-market/CandidateCard";
import { CandidateProfileModal } from "../../components/recruiter/talent-market/CandidateProfileModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

interface Candidate {
  id: number;
  name: string;
  role: string;
  category: string;
  score: number;
  skills: string[];
  lastActive: string;
  tasks: number;
  weeks: number;
  isHot?: boolean;
  realName?: string;
  location?: string;
  email?: string;
  linkedIn?: string;
  taskAnalysis?: {
    title: string;
    description: string;
    grading: string;
    file: string;
  };
}

const candidates: Candidate[] = [
  {
    id: 324,
    name: "Candidate 324",
    role: "SEO Specialist",
    category: "Digital Marketing",
    score: 92,
    skills: ["SEO", "COPY"],
    lastActive: "2h ago",
    tasks: 14,
    weeks: 4,
    isHot: true,
    realName: "Amara Kalu",
    location: "Lagos, Nigeria",
    email: "amara.kalu@email.com",
    linkedIn: "linkedin.com/in/amarakalu",
    taskAnalysis: {
      title: "Setup: Google Ads Search",
      description:
        "Structured the campaign into SKAGs (Single Keyword Ad Groups) to maximize Quality Score. Negative keyword list updated to exclude 'free' and 'cheap'.",
      grading: "EXCELLENT",
      file: "GOOGLE_ADS_STRUCTURE.XLSX",
    },
  },
  {
    id: 441,
    name: "Candidate 441",
    role: "PPC Manager",
    category: "Digital Marketing",
    score: 88,
    skills: ["SEM", "ANALYTICS"],
    lastActive: "2h ago",
    tasks: 12,
    weeks: 3,
    isHot: true,
    realName: "Chidi Okonkwo",
    location: "Abuja, Nigeria",
    taskAnalysis: {
      title: "Campaign Optimization",
      description: "Optimized ad spend by 35% while maintaining conversion rate.",
      grading: "GOOD",
      file: "CAMPAIGN_REPORT.PDF",
    },
  },
  {
    id: 902,
    name: "Candidate 902",
    role: "Data Analyst",
    category: "Data Analytics",
    score: 95,
    skills: ["SEM", "ANALYTICS"],
    lastActive: "2h ago",
    tasks: 18,
    weeks: 5,
    isHot: true,
    realName: "Ngozi Eze",
    location: "Port Harcourt, Nigeria",
    taskAnalysis: {
      title: "Data Pipeline Setup",
      description: "Built automated data pipeline reducing manual work by 60%.",
      grading: "EXCELLENT",
      file: "PIPELINE_DOCS.PDF",
    },
  },
];

const categoryNames = ["All", "Digital Marketing", "Data Analytics", "Cybersecurity", "Growth"];

type FilterOption = "score-high" | "score-low" | "recent" | "tasks" | null;

interface TalentMarketsProps {
  onOpenSidebar: () => void;
}

export default function TalentMarkets({ onOpenSidebar }: TalentMarketsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unlockedTasks, setUnlockedTasks] = useState<number[]>([]);
  const [unlockedProfiles, setUnlockedProfiles] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterOption>(null);

  // Calculate dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: candidates.length };
    categoryNames.forEach((cat) => {
      if (cat !== "All") {
        counts[cat] = candidates.filter((c) => c.category === cat).length;
      }
    });
    return counts;
  }, []);

  const filteredCandidates = useMemo(() => {
    let result = candidates.filter((candidate) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        candidate.name.toLowerCase().includes(query) ||
        candidate.role.toLowerCase().includes(query) ||
        candidate.category.toLowerCase().includes(query) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(query)) ||
        candidate.score.toString().includes(query);
      const matchesCategory =
        activeCategory === "All" || candidate.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    // Apply sorting based on filter
    if (activeFilter === "score-high") {
      result = [...result].sort((a, b) => b.score - a.score);
    } else if (activeFilter === "score-low") {
      result = [...result].sort((a, b) => a.score - b.score);
    } else if (activeFilter === "tasks") {
      result = [...result].sort((a, b) => b.tasks - a.tasks);
    }

    return result;
  }, [searchQuery, activeCategory, activeFilter]);

  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const handleUnlockTasks = () => {
    if (selectedCandidate) {
      setUnlockedTasks([...unlockedTasks, selectedCandidate.id]);
    }
  };

  const handleUnlockProfile = () => {
    if (selectedCandidate) {
      setUnlockedProfiles([...unlockedProfiles, selectedCandidate.id]);
    }
  };

  const getFilterLabel = () => {
    switch (activeFilter) {
      case "score-high":
        return "Score: High to Low";
      case "score-low":
        return "Score: Low to High";
      case "tasks":
        return "Most Tasks";
      default:
        return "Filter by";
    }
  };

  return (
    <div>
      {/* Mobile Menu Button */}
      <button
        onClick={onOpenSidebar}
        className="lg:hidden mb-4 p-2 text-foreground"
      >
        <Menu className="w-6 h-6" />
      </button>
      <RecruiterHeader title="Talent Directory"/>

      {/* Wallet, Search, Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-cyan-400 uppercase font-medium mb-1">
            Wallet Balance
          </p>
          <p className="text-2xl font-bold text-primary">₦ 150,000</p>
        </div>
        <div className="relative">
          <p className="text-xs text-muted-foreground mb-2">Search</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by skills, role, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Filter by</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-2 bg-muted/50 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                <span>{getFilterLabel()}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setActiveFilter(null)}>
                None
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter("score-high")}>
                Score: High to Low
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter("score-low")}>
                Score: Low to High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter("tasks")}>
                Most Tasks
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categoryNames.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === category
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {category} ({categoryCounts[category] || 0})
          </button>
        ))}
      </div>

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCandidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onViewProfile={() => handleViewProfile(candidate)}
          />
        ))}
      </div>

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tasksUnlocked={
          selectedCandidate ? unlockedTasks.includes(selectedCandidate.id) : false
        }
        profileUnlocked={
          selectedCandidate ? unlockedProfiles.includes(selectedCandidate.id) : false
        }
        onUnlockTasks={handleUnlockTasks}
        onUnlockProfile={handleUnlockProfile}
      />
    </div>
  );
}
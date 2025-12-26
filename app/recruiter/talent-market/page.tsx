"use client";
import {RecruiterHeader} from "../../components/recruiter/RecruiterHeader";
import { useState, useMemo, useEffect } from "react";
import { Search, ChevronDown, Menu } from "lucide-react";
import { Input } from "../../components/ui/input";
import { CandidateCard } from "../../components/recruiter/talent-market/CandidateCard";
import { CandidateProfileModal } from "../../components/recruiter/talent-market/CandidateProfileModal";
import { supabase } from "../../../lib/supabase";import { useAuth } from "../../contexts/AuthContexts";import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

interface Candidate {
  id: number | string;
  name: string;
  role: string;
  category: string;
  score?: number | null;
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





type FilterOption = "score-high" | "score-low" | "recent" | "tasks" | null;

interface TalentMarketsProps {
  onOpenSidebar: () => void;
}

export default function TalentMarkets({ onOpenSidebar }: TalentMarketsProps) {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unlockedTasks, setUnlockedTasks] = useState<(string | number)[]>([]);
  const [unlockedProfiles, setUnlockedProfiles] = useState<(string | number)[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterOption>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const fetchRecruiterData = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('recruiters')
          .select('wallet_balance')
          .eq('auth_id', user.id)
          .single();
          
        if (data) {
          setWalletBalance(data.wallet_balance || 0);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    };

    fetchRecruiterData();
  }, [user?.id]);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'student');
        console.log('Fetched candidates:', data, error);
        if (error) throw error;

        const formattedCandidates = data.map(user => ({
          id: user.auth_id,
          name: `Candidate ${user.auth_id.slice(0, 4)}`,
          role: formatTrack(user.track),
          category: formatTrack(user.track),
          score: user.average_score,
          skills: user.skills || [],
          lastActive: formatTimeAgo(user.last_active_at),
          tasks: 0, // TODO: Fetch actual count
          weeks: calculateWeeks(user.created_at),
          isHot: (user.average_score || 0) > 90,
          realName: user.full_name,
          location: user.country,
          email: user.email,
          taskAnalysis: {
            title: "Recent Task Analysis",
            description: "Task analysis data not yet available from backend.",
            grading: "PENDING",
            file: "REPORT.PDF",
          }
        }));
        setCandidates(formattedCandidates);
      } catch (error) {
        console.error('Error fetching candidates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  // Helper functions
  function formatTrack(track: string | null) {
    if (!track) return "General";
    return track
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatTimeAgo(dateString: string | null) {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  function calculateWeeks(dateString: string | null) {
      if (!dateString) return 0;
      const date = new Date(dateString);
      const now = new Date();
      const diffInTime = now.getTime() - date.getTime();
      return Math.floor(diffInTime / (1000 * 3600 * 24 * 7));
  }

  const categoryNames = useMemo(() => {
    const tracks = new Set(candidates.map(c => c.category));
    // Ensure we have some default categories if no candidates or just to keep UI consistent
    const defaults = ["Digital Marketing", "Data Analytics", "Cyber Security", "Growth Marketing"];
    defaults.forEach(d => tracks.add(d));
    return ["All", ...Array.from(tracks)];
  }, [candidates]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: candidates.length };
    categoryNames.forEach((cat) => {
      if (cat !== "All") {
        counts[cat] = candidates.filter((c) => c.category === cat).length;
      }
    });
    return counts;
  }, [candidates, categoryNames]);

  const filteredCandidates = useMemo(() => {
    let result = candidates.filter((candidate) => {
      const query = searchQuery.toLowerCase();
      const scoreStr = (candidate.score ?? 50).toString();
      const matchesSearch =
        candidate.name.toLowerCase().includes(query) ||
        candidate.role.toLowerCase().includes(query) ||
        candidate.category.toLowerCase().includes(query) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(query)) ||
        scoreStr.includes(query);
      const matchesCategory =
        activeCategory === "All" || candidate.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    // Apply sorting based on filter
    if (activeFilter === "score-high") {
      result = [...result].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    } else if (activeFilter === "score-low") {
      result = [...result].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    } else if (activeFilter === "tasks") {
      result = [...result].sort((a, b) => b.tasks - a.tasks);
    }

    return result;
  }, [searchQuery, activeCategory, activeFilter, candidates]);

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
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={onOpenSidebar}
        className="lg:hidden mb-4 p-2 text-foreground"
      >
        <Menu className="w-6 h-6" />
      </button>
      <RecruiterHeader title="Talent Directory" subtitle="Search and filter 3+ verified candidates"/>

      {/* Wallet, Search, Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 py-4 lg:py-6 space-y-6">
        <div className="bg-[linear-gradient(135deg,hsla(197,70%,22%,1)_50%,hsla(216,50%,13%,1)_100%)] rounded-xl p-4 border border-border">
          <p className="text-xs text-foreground uppercase font-medium mb-1">
            Wallet Balance
          </p>
          <p className="text-2xl font-bold text-green-500">₦ {walletBalance.toLocaleString()}</p>
        </div>
        <div className="relative">
          <p className="text-xs text-muted-foreground mb-2">Search</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by skills, role, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[hsla(216,38%,22%,1)] border-border h-14"
            />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Filter by</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full h-14 flex items-center justify-between px-4 py-2 bg-[hsla(216,38%,22%,1)] border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
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
      <div className="flex gap-2 mb-6 overflow-x-auto py-1 bg-[hsla(216,38%,22%,1)] justify-between px-4 lg:px-6 rounded-lg">
        {categoryNames.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`min-w-[10rem] mx-2 w-full py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === category
                ? "bg-[hsla(0,0%,100%,0.19)] text-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {category} ({categoryCounts[category] || 0})
          </button>
        ))}
      </div>

      {/* Candidate Grid */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading candidates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onViewProfile={() => handleViewProfile(candidate)}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredCandidates.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          No candidates found matching your criteria.
        </div>
      )}

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
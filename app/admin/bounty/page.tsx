"use client";
import {AdminHeader} from "../../components/admin/AdminHeader";
import { useState, useMemo } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Search, Eye, Target, Activity, CheckCircle, XCircle } from "lucide-react";
import { CreateBountyModal, BountyFormData } from "../../components/admin/bounty/CreateBountyModal";
import { BountyDetailsModal, BountyDetails } from "../../components/admin/bounty/BountyDetailsModal";
import { toast } from "sonner";

interface BountyManagementProps {
  onMenuClick: () => void;
}

// Mock data
const initialBounties: BountyDetails[] = [
  {
    id: 1,
    title: "App Testing: Kuda Beta",
    category: "QA Testing",
    audience: "Both",
    reward: "₦5,000",
    status: "Live",
    createdAt: "12th December 2025",
    participants: [
      { name: "Chris", role: "Student", score: 78, status: "Approved", reward: "Paid" },
      { name: "Chris", role: "Recruiter", score: 78, status: "Approved", reward: "Paid" },
      { name: "Tunde", role: "Student", score: 78, status: "Rejected", reward: "Not Paid" },
      { name: "Chris", role: "Recruiter", score: 78, status: "Approved", reward: "Paid" },
    ],
  },
  {
    id: 2,
    title: "Copy Review",
    category: "Content Creation",
    audience: "Student",
    reward: "₦8,000",
    status: "Closed",
    createdAt: "10th December 2025",
    participants: [
      { name: "Ada", role: "Student", score: 85, status: "Approved", reward: "Paid" },
      { name: "John", role: "Student", score: 72, status: "Approved", reward: "Paid" },
    ],
  },
  {
    id: 3,
    title: "Voice Recording: Yoruba",
    category: "Voice Recording",
    audience: "Student",
    reward: "₦6,500",
    status: "Live",
    createdAt: "8th December 2025",
    participants: [
      { name: "Femi", role: "Student", score: 90, status: "Approved", reward: "Paid" },
      { name: "Kemi", role: "Student", score: 88, status: "Pending", reward: "Pending" },
    ],
  },
  {
    id: 4,
    title: "Lead Gen: Fintech CEOs",
    category: "Lead Generation",
    audience: "Recruiters",
    reward: "₦8,000",
    status: "Live",
    createdAt: "5th December 2025",
    participants: [
      { name: "Peter", role: "Recruiter", score: 82, status: "Approved", reward: "Paid" },
      { name: "Mary", role: "Recruiter", score: 79, status: "Approved", reward: "Paid" },
    ],
  },
  {
    id: 5,
    title: "Opay Advert",
    category: "Digital Marketing",
    audience: "Both",
    reward: "₦4,000",
    status: "Unpublish",
    createdAt: "3rd December 2025",
    participants: [],
  },
];

export default function BountyManagement({ onMenuClick }: BountyManagementProps) {
  const [bounties, setBounties] = useState<BountyDetails[]>(initialBounties);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBounty, setSelectedBounty] = useState<BountyDetails | null>(null);

  // Filtered bounties based on search and filter
  const filteredBounties = useMemo(() => {
    return bounties.filter((bounty) => {
      const matchesSearch =
        bounty.title.toLowerCase().includes(search.toLowerCase()) ||
        bounty.reward.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter =
        filterBy === "all" ||
        (filterBy === "live" && bounty.status === "Live") ||
        (filterBy === "closed" && bounty.status === "Closed") ||
        (filterBy === "unpublish" && bounty.status === "Unpublish");
      
      return matchesSearch && matchesFilter;
    });
  }, [bounties, search, filterBy]);

  // Pagination
  const itemsPerPage = 6;
  const totalItems = filteredBounties.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginatedBounties = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBounties.slice(start, start + itemsPerPage);
  }, [filteredBounties, currentPage]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Stats
  const stats = useMemo(() => {
    const total = bounties.length;
    const active = bounties.filter((b) => b.status === "Live").length;
    const completed = bounties.filter((b) => b.status === "Closed").length;
    const unpublished = bounties.filter((b) => b.status === "Unpublish").length;
    return { total, active, completed, unpublished };
  }, [bounties]);

  // Get slots left (mock calculation based on participants)
  const getSlotsLeft = (bounty: BountyDetails) => {
    const maxSlots = 50; // Mock max slots
    return maxSlots - bounty.participants.length;
  };

  // Handle create bounty
  const handleCreateBounty = (formData: BountyFormData, publish: boolean) => {
    const newBounty: BountyDetails = {
      id: bounties.length + 1,
      title: formData.title || "New Bounty",
      category: formData.category || "QA Testing",
      audience: formData.audience,
      reward: `₦${formData.reward || "0"}`,
      status: publish ? "Live" : "Unpublish",
      createdAt: new Date().toLocaleDateString("en-GB", { 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      }),
      participants: [],
    };
    
    setBounties([newBounty, ...bounties]);
    setCreateModalOpen(false);
    toast.success(publish ? "Bounty published successfully!" : "Bounty saved as draft.");
  };

  // Handle view bounty
  const handleViewBounty = (bounty: BountyDetails) => {
    setSelectedBounty(bounty);
    setDetailsModalOpen(true);
  };

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilterBy(value);
    setCurrentPage(1);
  };

  // Page numbers
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 3;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 2) {
        pages.push(1, 2, 3);
      } else if (currentPage >= totalPages - 1) {
        pages.push(totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(currentPage - 1, currentPage, currentPage + 1);
      }
    }
    
    return pages;
  };

  return (
    <>
      <AdminHeader title="Bounty Management" subtitle="Create and keep monitoring active published bounty hunter." />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* Overview Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-foreground">Overview</h2>
          <Button 
            className="bg-primary hover:bg-primary/90 text-foreground"
            onClick={() => setCreateModalOpen(true)}
          >
            Create Bounty Hunter
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[hsla(216,36%,18%,1)] border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Target className="h-4 w-4" />
                <span>TOTAL BOUNTY HUNTER</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-[hsla(216,36%,18%,1)] border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Activity className="h-4 w-4" />
                <span>ACTIVE BOUNTY HUNTER</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-primary">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className="bg-[hsla(216,36%,18%,1)] border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <CheckCircle className="h-4 w-4" />
                <span>COMPLETED BOUNTY HUNTER</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card className="bg-[hsla(216,36%,18%,1)] border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <XCircle className="h-4 w-4" />
                <span>UNPUBLISH BOUNTY HUNTER</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.unpublished}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-3">
            <p className="text-sm text-muted-foreground mb-2">Search</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, amount"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 bg-[#0F2137] border-border/30"
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Filter by</p>
            <Select value={filterBy} onValueChange={handleFilterChange}>
              <SelectTrigger className="bg-[#0F2137] border-border/30">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="unpublish">Unpublish</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bounties Table */}
        <div className="rounded-lg overflow-hidden border border-border/30">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/20 hover:bg-primary/20">
                <TableHead className="text-foreground font-semibold">Bounty Name</TableHead>
                <TableHead className="text-foreground font-semibold hidden sm:table-cell">Audience</TableHead>
                <TableHead className="text-foreground font-semibold">Reward</TableHead>
                <TableHead className="text-foreground font-semibold hidden md:table-cell">Slots Left</TableHead>
                <TableHead className="text-foreground font-semibold hidden lg:table-cell">Submissions</TableHead>
                <TableHead className="text-foreground font-semibold">Status</TableHead>
                <TableHead className="text-foreground font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBounties.map((bounty) => (
                <TableRow key={bounty.id} className="border-border/30">
                  <TableCell className="text-foreground">{bounty.title}</TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">{bounty.audience}</TableCell>
                  <TableCell className="text-foreground font-medium">{bounty.reward}</TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">{getSlotsLeft(bounty)}</TableCell>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">{bounty.participants.length}</TableCell>
                  <TableCell>
                    <span className={`${
                      bounty.status === "Live" 
                        ? "text-emerald-400" 
                        : bounty.status === "Closed"
                        ? "text-red-400"
                        : "text-muted-foreground"
                    }`}>
                      {bounty.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button 
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => handleViewBounty(bounty)}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {startItem}-{endItem} of {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {getPageNumbers().map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                className={currentPage === page ? "bg-primary" : ""}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateBountyModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSave={handleCreateBounty}
      />
      <BountyDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        bounty={selectedBounty}
      />
    </>
  );
}

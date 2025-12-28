"use client";
import {AdminHeader} from "../../components/admin/AdminHeader";
import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Search, Users, Eye } from "lucide-react";
import StudentTab from "../../components/admin/userbase/StudentTab";
import RecruiterTab from "@/app/components/admin/userbase/RecruiterTab";
import EnterpriseTab from "@/app/components/admin/userbase/EnterpriseTab";

// Mock data for Enterprise (as requested)
const enterpriseData = [
  { company: "Wild Fusion", plan: "Monthly", status: "Active", expiresOn: "Apr 30, 2025", daysLeft: "18 days" },
  { company: "Access Bank", plan: "Yearly", status: "Active", expiresOn: "Apr 30, 2025", daysLeft: "18 days" },
  { company: "University of Lagos", plan: "Quartile", status: "Active", expiresOn: "Apr 30, 2025", daysLeft: "18 days" },
  { company: "GTBank", plan: "Monthly", status: "Expired", expiresOn: "Mar 15, 2025", daysLeft: "0 days" },
  { company: "Dangote Group", plan: "Yearly", status: "Active", expiresOn: "Dec 31, 2025", daysLeft: "280 days" },
];

export default function UserBase() {
  const [activeTab, setActiveTab] = useState("students");
  const [search, setSearch] = useState("");
  const [rowsToShow, setRowsToShow] = useState("6");
  const [filterBy, setFilterBy] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [students, setStudents] = useState<any[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Students
        const studentsRes = await fetch('/api/admin/users?type=student');
        const studentsJson = await studentsRes.json();
        if (studentsJson.success) {
            const mappedStudents = studentsJson.data.map((s: any) => ({
                name: s.full_name || "Unknown",
                email: s.email,
                course: s.track || "N/A",
                expiration: "N/A", 
                phone: s.phone_number || "N/A"
            }));
            setStudents(mappedStudents);
        }

        // Fetch Recruiters
        const recruitersRes = await fetch('/api/admin/users?type=recruiter');
        const recruitersJson = await recruitersRes.json();
        if (recruitersJson.success) {
             const mappedRecruiters = recruitersJson.data.map((r: any) => {
                let daysLeft = "N/A";
                if (r.subscription_expires_at) {
                    const diffTime = new Date(r.subscription_expires_at).getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    daysLeft = diffDays > 0 ? `${diffDays} days` : "0 days";
                }

                return {
                    name: r.full_name || r.company_name || "Unknown",
                    email: r.email,
                    status: r.subscription_status || "Active",
                    expiresOn: r.subscription_expires_at ? new Date(r.subscription_expires_at).toLocaleDateString() : "N/A",
                    daysLeft: daysLeft
                };
            });
            setRecruiters(mappedRecruiters);
        }

      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get filtered data based on active tab, search, and filter
  const filteredData = useMemo(() => {
    let data: any[] = [];
    
    if (activeTab === "students") {
      data = students.filter((student) =>
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()) ||
        student.course.toLowerCase().includes(search.toLowerCase())
      );
    } else if (activeTab === "recruiters") {
      data = recruiters.filter((recruiter) => {
        const matchesSearch =
          recruiter.name.toLowerCase().includes(search.toLowerCase()) ||
          recruiter.email.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
          filterBy === "all" || recruiter.status.toLowerCase() === filterBy;
        return matchesSearch && matchesFilter;
      });
    } else {
      data = enterpriseData.filter((enterprise) => {
        const matchesSearch =
          enterprise.company.toLowerCase().includes(search.toLowerCase()) ||
          enterprise.plan.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
          filterBy === "all" || enterprise.status.toLowerCase() === filterBy;
        return matchesSearch && matchesFilter;
      });
    }
    
    return data;
  }, [activeTab, search, filterBy, students, recruiters]);

  const itemsPerPage = parseInt(rowsToShow);
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Get paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, itemsPerPage]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Reset page when filters change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    setSearch("");
    setFilterBy("all");
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterBy(value);
    setCurrentPage(1);
  };

  const handleRowsChange = (value: string) => {
    setRowsToShow(value);
    setCurrentPage(1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 3;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
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
      <AdminHeader title="User Base" subtitle="Monitor user activities and track performance across all cohorts"/>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-[#0F2137] border border-border/30 h-12 mb-6">
            <TabsTrigger
              value="students"
              className="gap-2 data-[state=active]:bg-foreground/30 data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger
              value="recruiters"
              className="gap-2 data-[state=active]:bg-foreground/30 data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4" />
              Recruiters
            </TabsTrigger>
            <TabsTrigger
              value="enterprise"
              className="gap-2 data-[state=active]:bg-foreground/30 data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4" />
              Enterprise
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-1">
              <p className="text-sm text-muted-foreground mb-2">Search</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or user ID"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-[#0F2137] border-border/30"
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Show</p>
              <Select value={rowsToShow} onValueChange={handleRowsChange}>
                <SelectTrigger className="bg-[#0F2137] border-border/30">
                  <SelectValue placeholder="6 rows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 rows</SelectItem>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeTab !== "students" && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Filter by</p>
                <Select value={filterBy} onValueChange={handleFilterChange}>
                  <SelectTrigger className="bg-[#0F2137] border-border/30">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {loading ? (
             <div className="flex justify-center items-center h-64">
                <p className="text-muted-foreground">Loading users...</p>
             </div>
          ) : (
            <>
                <StudentTab paginatedData={paginatedData} />
                <RecruiterTab paginatedData={paginatedData} />
                <EnterpriseTab paginatedData={paginatedData} />
            </>
          )}
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
        </Tabs>
      </main>
    </>
  );
}

"use client";
import {AdminHeader} from "../../components/admin/AdminHeader";
import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
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
import { Button } from "../../components/ui/button";
import { Search, Users, Eye } from "lucide-react";
// Mock data
const studentsData = [
  { name: "John Snow", email: "johnsnow@gmail.com", course: "Digital Marketing", expiration: "28 days left", phone: "+234 012345678" },
  { name: "Ade Odunola", email: "adeodunola@gmail.com", course: "Web Dev", expiration: "28 days left", phone: "+234 012345678" },
  { name: "Mary Johnson", email: "mary.j@gmail.com", course: "Product Design", expiration: "6 days left", phone: "+234 012345678" },
  { name: "David Chen", email: "david.chen@gmail.com", course: "Backend Dev", expiration: "6 days left", phone: "+234 012345678" },
  { name: "Sarah Williams", email: "sarah.w@gmail.com", course: "Digital Marketing", expiration: "12 days left", phone: "+234 012345678" },
  { name: "Mike Brown", email: "mike.b@gmail.com", course: "Data Analytics", expiration: "12 days left", phone: "+234 012345678" },
  { name: "Emma Davis", email: "emma.d@gmail.com", course: "Product Design", expiration: "22 days left", phone: "+234 012345678" },
  { name: "James Wilson", email: "james.w@gmail.com", course: "Product Design", expiration: "22 days left", phone: "+234 012345678" },
];

const recruitersData = [
  { name: "John Snow", email: "johnsnow@gmail.com", status: "Active", expiresOn: "Apr 30, 2025", daysLeft: "18 days" },
  { name: "Ade Odunola", email: "adeodunola@gmail.com", status: "Active", expiresOn: "Apr 30, 2025", daysLeft: "18 days" },
  { name: "Linda Parker", email: "linda.p@gmail.com", status: "Active", expiresOn: "Apr 30, 2025", daysLeft: "18 days" },
  { name: "Chris Martin", email: "chris.m@gmail.com", status: "Active", expiresOn: "Apr 30, 2025", daysLeft: "18 days" },
  { name: "Robert Lee", email: "robert.l@gmail.com", status: "Expired", expiresOn: "Apr 30, 2025", daysLeft: "0 days" },
  { name: "Nancy Taylor", email: "nancy.t@gmail.com", status: "Active", expiresOn: "Apr 30, 2025", daysLeft: "64 days" },
  { name: "Kevin Adams", email: "kevin.a@gmail.com", status: "Active", expiresOn: "Apr 30, 2025", daysLeft: "64 days" },
  { name: "Grace Thompson", email: "grace.t@gmail.com", status: "Expired", expiresOn: "Apr 30, 2025", daysLeft: "0 days" },
];

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

  // Get filtered data based on active tab, search, and filter
  const filteredData = useMemo(() => {
    let data: any[] = [];
    
    if (activeTab === "students") {
      data = studentsData.filter((student) =>
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()) ||
        student.course.toLowerCase().includes(search.toLowerCase())
      );
    } else if (activeTab === "recruiters") {
      data = recruitersData.filter((recruiter) => {
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
  }, [activeTab, search, filterBy]);

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
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger
              value="recruiters"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4" />
              Recruiters
            </TabsTrigger>
            <TabsTrigger
              value="enterprise"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
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

          {/* Students Tab */}
          <TabsContent value="students" className="mt-0">
            <div className="rounded-lg overflow-hidden border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/20 hover:bg-primary/20">
                    <TableHead className="text-foreground font-semibold">Name</TableHead>
                    <TableHead className="text-foreground font-semibold">Email</TableHead>
                    <TableHead className="text-foreground font-semibold hidden md:table-cell">Course</TableHead>
                    <TableHead className="text-foreground font-semibold hidden lg:table-cell">Subscription Expiration</TableHead>
                    <TableHead className="text-foreground font-semibold hidden lg:table-cell">Phone Number</TableHead>
                    <TableHead className="text-foreground font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((student: any, index) => (
                    <TableRow key={index} className="border-border/30">
                      <TableCell className="text-foreground">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground">{student.email}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{student.course}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">{student.expiration}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">{student.phone}</TableCell>
                      <TableCell>
                        <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Recruiters Tab */}
          <TabsContent value="recruiters" className="mt-0">
            <div className="rounded-lg overflow-hidden border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[hsla(273,96%,64%,0.3)] hover:bg-[hsla(273,96%,64%,0.3)]/20">
                    <TableHead className="text-foreground font-semibold">Recruiters Name</TableHead>
                    <TableHead className="text-foreground font-semibold">Email</TableHead>
                    <TableHead className="text-foreground font-semibold">Subscription Status</TableHead>
                    <TableHead className="text-foreground font-semibold hidden md:table-cell">Expires On</TableHead>
                    <TableHead className="text-foreground font-semibold hidden lg:table-cell">Days Left</TableHead>
                    <TableHead className="text-foreground font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((recruiter: any, index) => (
                    <TableRow key={index} className="border-border/30">
                      <TableCell className="text-foreground">{recruiter.name}</TableCell>
                      <TableCell className="text-muted-foreground">{recruiter.email}</TableCell>
                      <TableCell>
                        <span
                          className={`${
                            recruiter.status === "Active"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {recruiter.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{recruiter.expiresOn}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">{recruiter.daysLeft}</TableCell>
                      <TableCell>
                        <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Enterprise Tab */}
          <TabsContent value="enterprise" className="mt-0">
            <div className="rounded-lg overflow-hidden border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[hsla(273,96%,64%,0.3)] hover:bg-[hsla(273,96%,64%,0.3)]/20">
                    <TableHead className="text-foreground font-semibold">Company Name</TableHead>
                    <TableHead className="text-foreground font-semibold hidden md:table-cell">Subscription Plan</TableHead>
                    <TableHead className="text-foreground font-semibold">Subscription Status</TableHead>
                    <TableHead className="text-foreground font-semibold hidden md:table-cell">Expires On</TableHead>
                    <TableHead className="text-foreground font-semibold hidden lg:table-cell">Days Left</TableHead>
                    <TableHead className="text-foreground font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((enterprise: any, index) => (
                    <TableRow key={index} className="border-border/30">
                      <TableCell className="text-foreground">{enterprise.company}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{enterprise.plan}</TableCell>
                      <TableCell>
                        <span className={enterprise.status === "Active" ? "text-emerald-400" : "text-red-400"}>
                          {enterprise.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{enterprise.expiresOn}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">{enterprise.daysLeft}</TableCell>
                      <TableCell>
                        <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

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
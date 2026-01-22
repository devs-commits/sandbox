"use client"
import {AdminHeader} from "../../components/admin/AdminHeader";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface RevenueProps {
  onMenuClick: () => void;
}

// Extended mock data for different date ranges
const allRevenueData = [
  // Last 7 days (Dec 23 - Dec 29)
  { date: "DEC 23", subscription: 2000000, recruiterUnlocks: 300000, total: 2300000, daysAgo: 6 },
  { date: "DEC 24", subscription: 3500000, recruiterUnlocks: 400000, total: 3900000, daysAgo: 5 },
  { date: "DEC 25", subscription: 4200000, recruiterUnlocks: 350000, total: 4550000, daysAgo: 4 },
  { date: "DEC 26", subscription: 2500000, recruiterUnlocks: 350000, total: 2850000, daysAgo: 3 },
  { date: "DEC 27", subscription: 3800000, recruiterUnlocks: 380000, total: 4180000, daysAgo: 2 },
  { date: "DEC 28", subscription: 3200000, recruiterUnlocks: 320000, total: 3520000, daysAgo: 1 },
  { date: "DEC 29", subscription: 2800000, recruiterUnlocks: 280000, total: 3080000, daysAgo: 0 },
  // Additional data for 30 days
  { date: "DEC 15", subscription: 2100000, recruiterUnlocks: 250000, total: 2350000, daysAgo: 14 },
  { date: "DEC 16", subscription: 2300000, recruiterUnlocks: 270000, total: 2570000, daysAgo: 13 },
  { date: "DEC 17", subscription: 2700000, recruiterUnlocks: 310000, total: 3010000, daysAgo: 12 },
  { date: "DEC 18", subscription: 1900000, recruiterUnlocks: 220000, total: 2120000, daysAgo: 11 },
  { date: "DEC 19", subscription: 3100000, recruiterUnlocks: 340000, total: 3440000, daysAgo: 10 },
  { date: "DEC 20", subscription: 2800000, recruiterUnlocks: 290000, total: 3090000, daysAgo: 9 },
  { date: "DEC 21", subscription: 2400000, recruiterUnlocks: 260000, total: 2660000, daysAgo: 8 },
  { date: "DEC 22", subscription: 2600000, recruiterUnlocks: 280000, total: 2880000, daysAgo: 7 },
  // Additional monthly data
  { date: "NOV 29", subscription: 1800000, recruiterUnlocks: 200000, total: 2000000, daysAgo: 30 },
  { date: "DEC 01", subscription: 1950000, recruiterUnlocks: 210000, total: 2160000, daysAgo: 28 },
  { date: "DEC 05", subscription: 2200000, recruiterUnlocks: 240000, total: 2440000, daysAgo: 24 },
  { date: "DEC 08", subscription: 2450000, recruiterUnlocks: 265000, total: 2715000, daysAgo: 21 },
  { date: "DEC 10", subscription: 2050000, recruiterUnlocks: 230000, total: 2280000, daysAgo: 19 },
  { date: "DEC 12", subscription: 2350000, recruiterUnlocks: 255000, total: 2605000, daysAgo: 17 },
  // 90 days / yearly data
  { date: "OCT 01", subscription: 1500000, recruiterUnlocks: 150000, total: 1650000, daysAgo: 89 },
  { date: "OCT 15", subscription: 1650000, recruiterUnlocks: 170000, total: 1820000, daysAgo: 75 },
  { date: "NOV 01", subscription: 1700000, recruiterUnlocks: 180000, total: 1880000, daysAgo: 58 },
  { date: "NOV 15", subscription: 1850000, recruiterUnlocks: 195000, total: 2045000, daysAgo: 44 },
];

const statsCards = [
  {
    label: "TOTAL REVENUE",
    value: "₦ 42.5M",
    change: "+15%",
    isPositive: true,
    subtitle: null,
  },
  {
    label: "MONTHLY RECURRING REVENUE (MRR)",
    value: "₦ 10.5M",
    change: "-12% vs last month",
    isPositive: false,
    subtitle: null,
  },
  {
    label: "CHURN RATE",
    value: "2.4%",
    change: "-0.5%",
    isPositive: true,
    subtitle: null,
  },
  {
    label: "SQUAD VIRALITY (K-FACTOR)",
    value: "1.8",
    change: null,
    isPositive: null,
    subtitle: "Tracks user invitations to squads.",
  },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `₦${(value / 1000000).toFixed(1)}M`;
  }
  return `₦${value.toLocaleString()}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateLabel = `Dec ${label.split(" ")[1]}, 2025`;
    
    return (
      <div className="bg-[#0F2137] border border-border/30 rounded-lg p-3 shadow-lg">
        <p className="text-cyan-500 text-sm font-medium mb-2">{dateLabel}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-8">
            <span className="text-muted-foreground">Subscription:</span>
            <span className="text-foreground font-medium">₦{data.subscription.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-muted-foreground">Recruiter Unlocks:</span>
            <span className="text-green font-medium">₦{data.recruiterUnlocks.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-muted-foreground">Total Revenue:</span>
            <span className="text-cyan font-medium">₦{data.total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function Revenue({ onMenuClick }: RevenueProps) {
  const [dateRange, setDateRange] = useState("Last 7 days");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Filter data based on selected date range
  const filteredData = useMemo(() => {
    let maxDaysAgo = 7;
    switch (dateRange) {
      case "Last 7 days":
        maxDaysAgo = 7;
        break;
      case "Last 30 days":
        maxDaysAgo = 30;
        break;
      case "Last 90 days":
        maxDaysAgo = 90;
        break;
      case "This year":
        maxDaysAgo = 365;
        break;
    }
    return allRevenueData
      .filter(item => item.daysAgo < maxDaysAgo)
      .sort((a, b) => b.daysAgo - a.daysAgo);
  }, [dateRange]);

  return (
    <>
      <AdminHeader title="Revenue Analytics" subtitle="High-level view of revenue-related activity" />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="bg-[#0F2137] border-border/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {stat.label}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </p>
                {stat.change && (
                  <div className="flex items-center gap-1">
                    {stat.isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className={`text-xs ${stat.isPositive ? 'text-green' : 'text-destructive'}`}>
                      {stat.change}
                    </span>
                  </div>
                )}
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Over Time Chart */}
        <Card className="bg-[#0F2137] border-border/30">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Revenue Over Time</h3>
                <p className="text-sm text-muted-foreground">
                  View platform revenue trends across your selected date range.
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-[#0A1628] border-border/30 text-foreground w-full sm:w-auto">
                    {dateRange}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0F2137] border-border/30">
                  <DropdownMenuItem onClick={() => setDateRange("Last 7 days")}>
                    Last 7 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateRange("Last 30 days")}>
                    Last 30 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateRange("Last 90 days")}>
                    Last 90 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateRange("This year")}>
                    This year
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="h-[300px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={filteredData} 
                  margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                  onMouseMove={(state) => {
                    if (state.activeTooltipIndex !== undefined && typeof state.activeTooltipIndex === 'number') {
                      setHoveredBar(state.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `₦ ${value / 1000000}M`}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar 
                    dataKey="total" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  >
                    {filteredData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={hoveredBar === index ? 'hsl(var(--cyan))' : 'hsl(var(--cyan) / 0.7)'}
                        className="transition-all duration-200"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { AdminHeader } from "../../components/admin/AdminHeader";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Share2, AlertCircle } from "lucide-react";

interface ActivityItem {
  type: string;
  user: string;
  action: string;
  time: string;
}

const StatCard = ({
  title,
  value,
  change,
  changeType,
  chartType,
  data = [],
}: {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  chartType: "bar-green" | "bar-purple" | "bar-blue" | "donut";
  data?: number[];
}) => {
  const renderChart = () => {
    if (chartType === "donut") {
      const percentage = parseFloat(value.replace('%', '')) || 0;
      return (
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="white"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">{value}</span>
          </div>
        </div>
      );
    }

    const barColor =
      chartType === "bar-green"
        ? "bg-[hsla(151,74%,46%,1)]"
        : chartType === "bar-blue"
        ? "bg-[hsla(189,96%,44%,1)]"
        : "bg-[hsla(275,96%,52%,1)]";
    
    // Use provided data or default fallback, normalize to 100% max height
    const hasData = data.length > 0 && data.some(val => val > 0);
    const chartData = hasData ? data : [40, 60, 45, 80, 55, 70, 90];
    const maxVal = Math.max(...chartData, 1); // avoid division by zero
    const normalizedData = chartData.map(val => (val / maxVal) * 100);

    return (
      <div className="flex items-end gap-1 h-16">
        {normalizedData.map((height, i) => (
          <div
            key={i}
            className={`w-3 ${barColor} ${!hasData ? 'opacity-30' : ''} rounded-sm`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-[hsla(216,36%,18%,1)] border-border/30">
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
          {title}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p
              className={`text-sm mt-1 ${
                changeType === "positive" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {changeType === "positive" ? "↗" : "↘"} {change}
            </p>
          </div>
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
};

export default function AdminDashboard() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [newInterns, setNewInterns] = useState(0);
  const [unlockFees, setUnlockFees] = useState(0);
  const [churnRate, setChurnRate] = useState("0%");
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<number[]>([]);
  const [internsChartData, setInternsChartData] = useState<number[]>([]);
  const [unlocksChartData, setUnlocksChartData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7days");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current session token to pass to API
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`/api/admin/dashboard/stats?timeRange=${timeRange}`, {
            headers: token ? {
                'Authorization': `Bearer ${token}`
            } : {}
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to fetch stats:", response.status, errorText);
            throw new Error('Failed to fetch stats');
        }
        
        const data = await response.json();
        console.log("Dashboard Data:", data);
        
        setTotalRevenue(data.totalRevenue);
        setNewInterns(data.newInterns);
        setUnlockFees(data.unlockFees);
        setChurnRate(data.churnRate || "0%");
        setRevenueChartData(data.revenueChartData);
        setInternsChartData(data.internsChartData);
        setUnlocksChartData(data.unlocksChartData);
        setActivityItems(data.activityItems);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  };

  const handleExport = () => {
    // 1. Define CSV Headers
    const summaryHeaders = ["Metric", "Value"];
    const activityHeaders = ["Type", "User", "Action", "Time"];

    // 2. Prepare Data Rows
    const summaryRows = [
      ["Total Revenue", totalRevenue],
      ["New Interns", newInterns],
      ["Churn Rate", churnRate],
      ["Unlock Fees", unlockFees],
    ];

    const activityRows = activityItems.map(item => [
      item.type,
      item.user,
      item.action,
      item.time
    ]);

    // 3. Construct CSV Content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add Summary Section
    csvContent += "SUMMARY STATS\n";
    csvContent += summaryHeaders.join(",") + "\n";
    summaryRows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    csvContent += "\n"; // Empty line separator

    // Add Activity Section
    csvContent += "RECENT ACTIVITY\n";
    csvContent += activityHeaders.join(",") + "\n";
    activityRows.forEach(row => {
      // Escape commas in fields if necessary
      const safeRow = row.map(field => `"${field}"`); 
      csvContent += safeRow.join(",") + "\n";
    });

    // 4. Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin_dashboard_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <AdminHeader title="Admin Dashboard" subtitle="System-wide performance monitoring" />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">

        {/* Overview Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-foreground">Overview</h2>
          <div className="flex items-center gap-3">
            <Select defaultValue="7days" onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px] bg-[#0F2137] border-border/30">
                <SelectValue placeholder="Last 7 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Share2 className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            change="+15%" // Calculate this if historical data available
            changeType="positive"
            chartType="bar-green"
            data={revenueChartData}
          />
          <StatCard
            title="New Interns"
            value={newInterns.toString()}
            change="+120" // Calculate this
            changeType="positive"
            chartType="bar-blue"
            data={internsChartData}
          />
          <StatCard
            title="Churn Rate"
            value={churnRate}
            change="-0.5%" // This would need historical comparison to be dynamic
            changeType="negative"
            chartType="donut"
          />
          <StatCard
            title="Unlock Fees"
            value={formatCurrency(unlockFees)}
            change="+40%"
            changeType="positive"
            chartType="bar-purple"
            data={unlocksChartData}
          />
        </div>

        {/* Activity and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live System Activity */}
          <Card className="lg:col-span-2 bg-[#0F2137] border-border/30">
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Live System Activity
              </h3>
              <div className="space-y-4">
                {activityItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-4 pb-3 border-b border-border/20 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <p className="text-sm text-muted-foreground">
                        <span className="text-foreground font-medium">
                          {item.user}
                        </span>{" "}
                        {item.action}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.time}
                    </span>
                  </div>
                ))}
                {activityItems.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Churn Alerts */}
          <Card className="bg-[#0F2137] border-border/30">
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Churn Alerts
              </h3>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-foreground font-medium">
                      Square "426" Risks
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      1 member payment failed. Squad discount at risk.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
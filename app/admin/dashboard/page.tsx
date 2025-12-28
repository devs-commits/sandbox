import {AdminHeader} from "../../components/admin/AdminHeader";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Share2, Eye, AlertCircle } from "lucide-react";

interface AdminDashboardProps {
  onMenuClick: () => void;
}

const activityItems = [
  {
    type: "unlock",
    user: "Recruiter@AccessBank",
    action: "unlocked Full Profile of Candidate-892",
    time: "2m ago",
  },
  {
    type: "complete",
    user: "John Snow",
    action: "completed 'Crisis Comms' simulation",
    time: "5m ago",
  },
  {
    type: "squad",
    user: "New Squad",
    action: "formed by Amara + 3 others",
    time: "12m ago",
  },
  {
    type: "subscription",
    user: "Tola B.",
    action: "renewed subscription (Month 3)",
    time: "26m ago",
  },
  {
    type: "unlock",
    user: "Recruiter@AccessBank",
    action: "unlocked Full Profile of Candidate-892",
    time: "1h ago",
  },
];

const StatCard = ({
  title,
  value,
  change,
  changeType,
  chartType,
}: {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  chartType: "bar-green" | "bar-purple" | "donut";
}) => {
  const renderChart = () => {
    if (chartType === "donut") {
      return (
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeDasharray="2.4, 100"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">2.4%</span>
          </div>
        </div>
      );
    }

    const barColor = chartType === "bar-green" ? "bg-emerald-500" : "bg-purple-500";
    const bars = [40, 60, 45, 80, 55, 70, 90];

    return (
      <div className="flex items-end gap-1 h-16">
        {bars.map((height, i) => (
          <div
            key={i}
            className={`w-3 ${barColor} rounded-sm`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-[#0F2137] border-border/30">
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

export default function AdminDashboard({}: AdminDashboardProps) {
  return (
    <>
      <AdminHeader title="Admin Dashboard" />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <p className="text-muted-foreground mb-6">
          System-wide performance monitoring.
        </p>

        {/* Overview Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-foreground">Overview</h2>
          <div className="flex items-center gap-3">
            <Select defaultValue="7days">
              <SelectTrigger className="w-[140px] bg-[#0F2137] border-border/30">
                <SelectValue placeholder="Last 7 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Revenue"
            value="₦42.5M"
            change="+15%"
            changeType="positive"
            chartType="bar-green"
          />
          <StatCard
            title="New Interns"
            value="2430"
            change="+120"
            changeType="positive"
            chartType="bar-green"
          />
          <StatCard
            title="Churn Rate"
            value="2.4%"
            change="-0.5%"
            changeType="negative"
            chartType="donut"
          />
          <StatCard
            title="Unlock Fees"
            value="₦8.2M"
            change="+40%"
            changeType="positive"
            chartType="bar-purple"
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
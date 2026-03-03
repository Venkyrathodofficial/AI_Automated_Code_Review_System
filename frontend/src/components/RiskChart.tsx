import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useStats, useReviews } from "@/hooks/useReviews";
import { Loader2 } from "lucide-react";

export function RiskChart() {
  const { data: stats, isLoading } = useStats();

  const pieData = [
    { name: "Critical", value: stats?.critical ?? 0, color: "hsl(0, 72%, 51%)" },
    { name: "Medium", value: stats?.medium ?? 0, color: "hsl(38, 92%, 50%)" },
    { name: "Low", value: stats?.low ?? 0, color: "hsl(152, 60%, 42%)" },
  ];

  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 rounded-xl border border-border bg-card shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-card-foreground">Risk Overview</h3>
      <p className="mt-1 text-xs text-muted-foreground">Severity distribution across all issues</p>

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div className="h-36 w-36 sm:h-44 sm:w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={72}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 15%, 91%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(220, 30%, 12%)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.value} issues · {((item.value / total) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

type TimeRange = "daily" | "weekly" | "monthly";

function getDateKey(dateStr: string, range: TimeRange): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Unknown";

  if (range === "daily") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (range === "weekly") {
    // ISO week: get Monday of that week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return `W${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  // monthly
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function getSortKey(dateStr: string, range: TimeRange): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;

  if (range === "daily") return d.getTime();
  if (range === "weekly") {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return monday.getTime();
  }
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function getMaxBuckets(range: TimeRange): number {
  if (range === "daily") return 14;
  if (range === "weekly") return 8;
  return 6;
}

export function TrendChart() {
  const [range, setRange] = useState<TimeRange>("daily");
  const { data: issues, isLoading } = useReviews();

  const trendData = useMemo(() => {
    if (!issues || issues.length === 0) return [];

    const buckets = new Map<string, { label: string; sortKey: number; critical: number; medium: number; low: number }>();

    for (const issue of issues) {
      if (!issue.date) continue;
      const label = getDateKey(issue.date, range);
      const sortKey = getSortKey(issue.date, range);

      if (!buckets.has(label)) {
        buckets.set(label, { label, sortKey, critical: 0, medium: 0, low: 0 });
      }
      const bucket = buckets.get(label)!;
      const sev = issue.severity?.toLowerCase();
      if (sev === "critical") bucket.critical++;
      else if (sev === "medium") bucket.medium++;
      else bucket.low++;
    }

    const sorted = Array.from(buckets.values()).sort((a, b) => a.sortKey - b.sortKey);
    const maxBuckets = getMaxBuckets(range);
    return sorted.slice(-maxBuckets);
  }, [issues, range]);

  const rangeLabel = range === "daily" ? "Daily" : range === "weekly" ? "Weekly" : "Monthly";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Issue Trends</h3>
          <p className="mt-1 text-xs text-muted-foreground">{rangeLabel} issue count by severity</p>
        </div>

        {/* Toggle buttons */}
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          {(["daily", "weekly", "monthly"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                range === r
                  ? "bg-white text-card-foreground shadow-sm dark:bg-card"
                  : "text-muted-foreground hover:text-card-foreground"
              }`}
            >
              {r === "daily" ? "Daily" : r === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-44">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : trendData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No issue data yet — connect a repo and run a scan
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 91%)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={range === "daily" ? -35 : 0}
                textAnchor={range === "daily" ? "end" : "middle"}
                height={range === "daily" ? 40 : 28}
              />
              <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 15%, 91%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="critical" name="Critical" fill="hsl(0, 72%, 51%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="medium" name="Medium" fill="hsl(38, 92%, 50%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="low" name="Low" fill="hsl(152, 60%, 42%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

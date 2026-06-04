import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { useStats, useReviews, useScanHistory } from "@/hooks/useReviews";
import { Loader2 } from "lucide-react";

const PIE_COLORS = ["#dc2626", "#f97316", "#f59e0b", "#16a34a"];

export function RiskChart() {
  const { data: stats, isLoading } = useStats();

  const pieData = [
    { name: "Critical", value: stats?.critical ?? 0, color: PIE_COLORS[0] },
    { name: "High", value: stats?.high ?? 0, color: PIE_COLORS[1] },
    { name: "Medium", value: stats?.medium ?? 0, color: PIE_COLORS[2] },
    { name: "Low", value: stats?.low ?? 0, color: PIE_COLORS[3] },
  ];

  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 rounded-2xl border border-border bg-card shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h3 className="text-sm font-bold text-card-foreground">Risk Overview</h3>
      <p className="mt-1 text-xs text-muted-foreground">Severity distribution across all issues</p>

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div className="h-40 w-40 sm:h-44 sm:w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={76}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid hsl(140, 10%, 90%)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3.5">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-md" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-sm font-semibold text-card-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.value} issues {total > 0 ? `· ${((item.value / total) * 100).toFixed(0)}%` : ""}
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
  if (range === "daily") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (range === "weekly") {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return `W${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
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
  const { data: scanHistory, isLoading } = useScanHistory();

  const trendData = useMemo(() => {
    if (!scanHistory || scanHistory.length === 0) return [];
    const buckets = new Map<string, { label: string; sortKey: number; securityScore: number; count: number }>();
    for (const scan of scanHistory) {
      if (!scan.scan_date) continue;
      const date = new Date(scan.scan_date);
      if (Number.isNaN(date.getTime())) continue;
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const sortKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const key = date.toISOString().slice(0, 10);
      if (!buckets.has(key)) {
        buckets.set(key, { label, sortKey, securityScore: 0, count: 0 });
      }
      const bucket = buckets.get(key)!;
      bucket.securityScore += Number(scan.security_score || 0);
      bucket.count += 1;
    }
    return Array.from(buckets.values())
      .map((bucket) => ({
        label: bucket.label,
        sortKey: bucket.sortKey,
        securityScore: Math.round(bucket.securityScore / Math.max(bucket.count, 1)),
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-8);
  }, [scanHistory]);

  const latest = trendData.at(-1);
  const previous = trendData.at(-2);
  const improvement = latest && previous ? latest.securityScore - previous.securityScore : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-card-foreground">Security Trends</h3>
          <p className="mt-1 text-xs text-muted-foreground">Historical security score progression across recent scans</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current Score</p>
          <p className="mt-1 text-xl font-extrabold text-card-foreground">{latest ? `${latest.securityScore}/100` : "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Previous Scan</p>
          <p className="mt-1 text-xl font-extrabold text-card-foreground">{previous ? `${previous.securityScore}/100` : "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Improvement</p>
          <p className={`mt-1 text-xl font-extrabold ${improvement >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {previous ? `${improvement >= 0 ? "+" : ""}${improvement}` : "—"}
          </p>
        </div>
      </div>

      <div className="mt-6 h-48">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : trendData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No scan history yet — connect a repo and run a security scan
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 10%, 90%)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(160, 8%, 46%)" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={40}
              />
              <YAxis tick={{ fontSize: 11, fill: "hsl(160, 8%, 46%)" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid hsl(140, 10%, 90%)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              />
              <Line type="monotone" dataKey="securityScore" name="Security Score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

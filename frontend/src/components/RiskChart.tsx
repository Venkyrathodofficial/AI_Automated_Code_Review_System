import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useStats } from "@/hooks/useReviews";
import { Loader2 } from "lucide-react";

const trendData = [
  { week: "W1", critical: 4, medium: 8, low: 12 },
  { week: "W2", critical: 3, medium: 10, low: 15 },
  { week: "W3", critical: 2, medium: 6, low: 18 },
  { week: "W4", critical: 3, medium: 10, low: 22 },
];

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

      <div className="mt-6 flex items-center gap-8">
        <div className="h-44 w-44 shrink-0">
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

export function TrendChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2"
    >
      <h3 className="text-sm font-semibold text-card-foreground">Issue Trends</h3>
      <p className="mt-1 text-xs text-muted-foreground">Weekly issue count by severity</p>

      <div className="mt-6 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trendData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 91%)" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 15%, 91%)",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Bar dataKey="critical" fill="hsl(0, 72%, 51%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="medium" fill="hsl(38, 92%, 50%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="low" fill="hsl(152, 60%, 42%)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { FileSearch, AlertTriangle, AlertCircle, Info, ArrowUpRight, LucideIcon, Loader2 } from "lucide-react";
import { useStats } from "@/hooks/useReviews";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: "primary" | "critical" | "warning" | "success";
  subtitle: string;
  delay?: number;
}

function StatCard({ title, value, icon: Icon, variant, subtitle, delay = 0 }: StatCardProps) {
  const isPrimary = variant === "primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 ${
        isPrimary
          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0"
          : "bg-card border border-border"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium ${isPrimary ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{title}</p>
          <p className={`mt-3 text-3xl font-extrabold ${isPrimary ? "text-primary-foreground" : "text-card-foreground"}`}>
            {value.toLocaleString()}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
              isPrimary ? "bg-primary-foreground/20" : "bg-primary/10"
            }`}>
              <ArrowUpRight className={`h-3 w-3 ${isPrimary ? "text-primary-foreground" : "text-primary"}`} />
            </div>
            <span className={`text-[11px] font-medium ${isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              {subtitle}
            </span>
          </div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          isPrimary ? "bg-primary-foreground/15" : variant === "critical" ? "bg-critical/10" : variant === "warning" ? "bg-warning/10" : "bg-success/10"
        }`}>
          <Icon className={`h-5 w-5 ${
            isPrimary ? "text-primary-foreground" : variant === "critical" ? "text-critical" : variant === "warning" ? "text-warning" : "text-success"
          }`} />
        </div>
      </div>
    </motion.div>
  );
}

export function StatsGrid() {
  const { data, isLoading } = useStats();

  const stats: StatCardProps[] = [
    { title: "Total Reviews", value: data?.totalReviews ?? 0, icon: FileSearch, variant: "primary", subtitle: "Live from connected repos" },
    { title: "Critical Issues", value: data?.critical ?? 0, icon: AlertTriangle, variant: "critical", subtitle: "Requires immediate fix" },
    { title: "Medium Issues", value: data?.medium ?? 0, icon: AlertCircle, variant: "warning", subtitle: "Should be addressed" },
    { title: "Low Issues", value: data?.low ?? 0, icon: Info, variant: "success", subtitle: "Minor improvements" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.title} {...stat} delay={i * 0.08} />
      ))}
    </div>
  );
}

export { StatCard };

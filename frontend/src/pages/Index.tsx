import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { StatsGrid } from "@/components/StatsGrid";
import { RiskChart, TrendChart } from "@/components/RiskChart";
import { IssuesTable } from "@/components/IssuesTable";
import { OnboardingTour } from "@/components/OnboardingTour";
import { motion } from "framer-motion";
import { GitCommit, Loader2, Activity } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { formatDistanceToNow } from "date-fns";

const Index = () => {
  const { data: issues = [], isLoading } = useReviews();
  const recentActivity = issues.slice(0, 5);
  return (
    <SidebarProvider>
      <OnboardingTour />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav title="Dashboard" subtitle="Overview of your code review pipeline" />
          <main className="flex-1 overflow-auto p-3 sm:p-6 space-y-5 sm:space-y-6 bg-background">
            <StatsGrid />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <RiskChart />
              <TrendChart />
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 }}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-card-foreground">Recent Activity</h3>
                  <p className="text-xs text-muted-foreground">Latest events in your pipeline</p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No activity yet. Push a commit to get started!</p>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl p-3 hover:bg-primary/[0.03] transition-colors">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                        <GitCommit className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.repository}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {item.date ? formatDistanceToNow(new Date(item.date), { addSuffix: true }) : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <IssuesTable />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;

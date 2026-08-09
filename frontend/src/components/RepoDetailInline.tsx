import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GitFork,
  ExternalLink,
  RefreshCw,
  Trash2,
  Loader2,
  Shield,
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  FileCode2,
  Sparkles,
  CheckCircle2,
  Lock,
  GitBranch,
  History,
  ChevronRight,
  ArrowUpRight,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useReviews, useScanRepo, useDisconnectRepo, useSubmitFeedback } from "@/hooks/useReviews";
import { useQuery } from "@tanstack/react-query";
import { fetchScanHistory, type Repository } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Issue } from "@/data/mockData";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { motion, AnimatePresence } from "framer-motion";

interface RepoDetailInlineProps {
  repo: Repository | null;
}

const getHealthColor = (score: number) => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const getGradeColor = (grade: string) => {
  if (grade === "A" || grade === "A+") return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
  if (grade === "B" || grade === "B+") return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
  if (grade === "C") return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800";
  return "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
};

const severityVariant: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-0 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 border-0 dark:bg-orange-900/30 dark:text-orange-400",
  medium: "bg-amber-100 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const statusVariant: Record<string, string> = {
  open: "bg-red-50 text-red-600 border-0 dark:bg-red-900/20 dark:text-red-400",
  resolved: "bg-emerald-50 text-emerald-600 border-0 dark:bg-emerald-900/20 dark:text-emerald-400",
};

const AI_RECOMMENDATIONS = [
  {
    icon: Lock,
    title: "Enable Branch Protection",
    description: "Protect your main branch with required reviews, status checks, and signed commits.",
    color: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/30",
  },
  {
    icon: Shield,
    title: "Enable Secret Scanning",
    description: "Automatically detect and prevent leaked API keys, tokens, and credentials in your code.",
    color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30",
  },
  {
    icon: GitBranch,
    title: "Enable PR Reviews",
    description: "Require peer code review before merging. CodeAurora Sentinel auto-reviews every PR.",
    color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30",
  },
  {
    icon: AlertTriangle,
    title: "Update Dependencies",
    description: "Run npm audit or Snyk to find and fix vulnerable packages in your dependency tree.",
    color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30",
  },
];

export function RepoDetailInline({ repo }: RepoDetailInlineProps) {
  const navigate = useNavigate();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "up"|"down">>({});

  const feedbackMutation = useSubmitFeedback();

  const handleFeedback = (e: React.MouseEvent, id: string, rating: "up"|"down") => {
    e.stopPropagation();
    feedbackMutation.mutate({ id, rating });
    setFeedbackGiven(prev => ({ ...prev, [id]: rating }));
    toast.success("Thanks for your feedback!");
  };

  const { data: issues = [] } = useReviews(repo?.name);
  const { data: scanHistory = [], isLoading: scanHistoryLoading } = useQuery({
    queryKey: ["scan-history", repo?.name],
    queryFn: () => fetchScanHistory(repo?.name),
    enabled: !!repo?.name,
  });

  const openIssues = useMemo(() => issues.filter(i => i.status === "open"), [issues]);
  const resolvedIssues = useMemo(() => issues.filter(i => i.status === "resolved"), [issues]);

  const severityCounts = useMemo(() => ({
    critical: issues.filter(i => i.severity === "critical").length,
    high: issues.filter(i => i.severity === "high").length,
    medium: issues.filter(i => i.severity === "medium").length,
    low: issues.filter(i => i.severity === "low").length,
  }), [issues]);

  if (!repo) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden border-t border-border bg-card/50"
    >
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        
        {/* Main Content Area */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
            <div className="border-b border-border mb-4">
              <TabsList className="bg-transparent h-auto p-0 gap-4 w-full justify-start rounded-none">
                <TabsTrigger value="overview" className="px-0 pb-2.5 pt-1 rounded-none data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="issues" className="px-0 pb-2.5 pt-1 rounded-none data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary text-xs font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                  Issues ({issues.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="px-0 pb-2.5 pt-1 rounded-none data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary text-xs font-semibold">
                  <History className="h-3.5 w-3.5 mr-1.5" />
                  Scan History
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-5 mt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-4 bg-background">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Open Issues</p>
                  <p className="text-2xl font-extrabold text-red-600 dark:text-red-400">{openIssues.length}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-background">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Resolved</p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{resolvedIssues.length}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-card-foreground mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  AI Security Recommendations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AI_RECOMMENDATIONS.map((rec) => (
                    <div key={rec.title} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background hover:bg-secondary/20 transition-colors">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${rec.color}`}>
                        <rec.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-card-foreground">{rec.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-10 rounded-xl text-xs font-semibold gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab("issues");
                }}
              >
                View All Issues in Details
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </TabsContent>

            {/* Issues Tab */}
            <TabsContent value="issues" className="mt-0">
              {issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-background rounded-xl border border-border">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-card-foreground">No issues found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">This repository is clean. Great work!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(showAllIssues ? issues : issues.slice(0, 10)).map((issue) => (
                    <button
                      key={issue.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedIssue(issue); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-primary/[0.03] hover:border-primary/20 transition-all text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-card-foreground truncate group-hover:text-primary transition-colors">
                          {issue.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                          {issue.fileName}
                          {issue.lineNumber ? `:L${issue.lineNumber}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Telemetry Actions */}
                        <div className="hidden sm:flex items-center mr-2 border-r border-border pr-2">
                          <button
                            onClick={(e) => handleFeedback(e, issue.id, "up")}
                            className={`p-1.5 rounded-lg transition-colors ${feedbackGiven[issue.id] === "up" ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"}`}
                            title="Helpful (True Positive)"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleFeedback(e, issue.id, "down")}
                            className={`p-1.5 rounded-lg transition-colors ${feedbackGiven[issue.id] === "down" ? "text-red-500 bg-red-50 dark:bg-red-950/30" : "text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"}`}
                            title="Unhelpful (False Positive)"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                        </div>

                        <Badge className={`text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5 ${severityVariant[issue.severity]}`}>
                          {issue.severity}
                        </Badge>
                        <Badge className={`text-[9px] font-bold capitalize rounded-md px-1.5 py-0.5 ${statusVariant[issue.status]}`}>
                          {issue.status}
                        </Badge>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                      </div>
                    </button>
                  ))}
                  {issues.length > 10 && !showAllIssues && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Showing 10 of {issues.length} issues.{" "}
                      <button
                        onClick={() => setShowAllIssues(true)}
                        className="text-primary font-semibold hover:underline"
                      >
                        View all →
                      </button>
                    </p>
                  )}
                  {showAllIssues && issues.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      <button
                        onClick={() => setShowAllIssues(false)}
                        className="text-primary font-semibold hover:underline"
                      >
                        Show less ↑
                      </button>
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Scan History Tab */}
            <TabsContent value="history" className="mt-0">
              {scanHistoryLoading ? (
                <div className="flex items-center justify-center py-10 bg-background rounded-xl border border-border">
                  <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                </div>
              ) : scanHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-background rounded-xl border border-border">
                  <History className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-bold text-card-foreground">No scan history</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Run your first scan to see results here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map((scan) => (
                    <div key={scan.id} className="rounded-xl border border-border bg-background p-4 hover:bg-secondary/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getGradeColor(scan.security_grade)}`}>
                            {scan.security_grade}
                          </span>
                          <span className={`text-sm font-extrabold ${getHealthColor(scan.security_score)}`}>
                            {scan.security_score}%
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(scan.scan_date), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="font-mono bg-secondary/40 px-1.5 py-0.5 rounded text-[10px]">
                          #{scan.commit_id?.substring(0, 7) || "—"}
                        </span>
                        <span className="truncate">{scan.commit_message}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50 text-[10px]">
                        <span className="text-red-600 dark:text-red-400 font-semibold">{scan.critical_issues} crit</span>
                        <span className="text-orange-600 dark:text-orange-400 font-semibold">{scan.high_issues} high</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{scan.medium_issues} med</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{scan.low_issues} low</span>
                        <span className="text-muted-foreground ml-auto">{scan.files_scanned} files</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Side Summary Area (Right Column) */}
        <div className="flex flex-col gap-4">
           {/* Severity Breakdown */}
           <div className="bg-background rounded-xl p-4 border border-border">
             <h4 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Vulnerability Profile</h4>
             <div className="space-y-2.5">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <AlertOctagon className="h-3.5 w-3.5 text-red-500" />
                   <span className="text-xs text-muted-foreground">Critical</span>
                 </div>
                 <span className="text-xs font-bold text-foreground">{severityCounts.critical}</span>
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                   <span className="text-xs text-muted-foreground">High</span>
                 </div>
                 <span className="text-xs font-bold text-foreground">{severityCounts.high}</span>
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                   <span className="text-xs text-muted-foreground">Medium</span>
                 </div>
                 <span className="text-xs font-bold text-foreground">{severityCounts.medium}</span>
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Info className="h-3.5 w-3.5 text-emerald-500" />
                   <span className="text-xs text-muted-foreground">Low</span>
                 </div>
                 <span className="text-xs font-bold text-foreground">{severityCounts.low}</span>
               </div>
             </div>
           </div>
        </div>

      </div>

      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

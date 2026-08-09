import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  Eye,
  Sparkles,
  CheckCircle2,
  Lock,
  GitBranch,
  History,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { useReviews, useScanRepo, useDisconnectRepo } from "@/hooks/useReviews";
import { useQuery } from "@tanstack/react-query";
import { fetchScanHistory, type ScanHistory, type Repository } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Issue } from "@/data/mockData";
import { IssueDetailModal } from "@/components/IssueDetailModal";

interface RepoDetailModalProps {
  repo: Repository | null;
  open: boolean;
  onClose: () => void;
}

const getHealthColor = (score: number) => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const getHealthBg = (score: number) => {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
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

export function RepoDetailModal({ repo, open, onClose }: RepoDetailModalProps) {
  const navigate = useNavigate();
  const scanMutation = useScanRepo();
  const disconnectMutation = useDisconnectRepo();
  const [scanning, setScanning] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const { data: issues = [] } = useReviews(repo?.name);
  const { data: scanHistory = [], isLoading: scanHistoryLoading } = useQuery({
    queryKey: ["scan-history", repo?.name],
    queryFn: () => fetchScanHistory(repo?.name),
    enabled: !!repo?.name && open,
  });

  const openIssues = useMemo(() => issues.filter(i => i.status === "open"), [issues]);
  const resolvedIssues = useMemo(() => issues.filter(i => i.status === "resolved"), [issues]);

  const severityCounts = useMemo(() => ({
    critical: issues.filter(i => i.severity === "critical").length,
    high: issues.filter(i => i.severity === "high").length,
    medium: issues.filter(i => i.severity === "medium").length,
    low: issues.filter(i => i.severity === "low").length,
  }), [issues]);

  const handleScan = async () => {
    if (!repo) return;
    setScanning(true);
    try {
      await scanMutation.mutateAsync(repo.name);
      toast.success(`Scan started for ${repo.name}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to start scan");
    } finally {
      setTimeout(() => setScanning(false), 3000);
    }
  };

  const handleDisconnect = async () => {
    if (!repo) return;
    if (!window.confirm(`Disconnect ${repo.name}? This will remove all scan data.`)) return;
    try {
      await disconnectMutation.mutateAsync(repo.name);
      toast.success(`Disconnected ${repo.name}`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect");
    }
  };

  if (!repo) return null;

  const repoShort = repo.name.includes("/") ? repo.name.split("/").pop()! : repo.name;
  const lastReview = repo.lastReviewDate
    ? formatDistanceToNow(new Date(repo.lastReviewDate), { addSuffix: true })
    : "never";

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-[540px] overflow-y-auto p-0">
          {/* Header */}
          <div className="p-5 pb-4 border-b border-border">
            <SheetHeader className="space-y-0 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <GitFork className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-base font-bold truncate">{repoShort}</SheetTitle>
                  <SheetDescription className="font-mono text-xs truncate">{repo.name}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Health Score Hero */}
            <div className="flex items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className={`text-3xl font-extrabold tracking-tight ${getHealthColor(repo.healthScore)}`}>
                    {repo.healthScore}%
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Health Score</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileCode2 className="h-3.5 w-3.5" />
                    <span>{repo.filesReviewed} files reviewed</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Last reviewed {lastReview}</span>
                  </div>
                </div>
              </div>
              <Progress
                value={repo.healthScore}
                className="h-2 w-20 rounded-full"
              />
            </div>

            {/* Severity Breakdown Pills */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/15">
                <AlertOctagon className="h-3 w-3 text-red-600 dark:text-red-400" />
                <span className="font-bold text-red-600 dark:text-red-400">{severityCounts.critical}</span>
                <span className="text-red-500/70 dark:text-red-400/70">critical</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/15">
                <AlertTriangle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                <span className="font-bold text-orange-600 dark:text-orange-400">{severityCounts.high}</span>
                <span className="text-orange-500/70 dark:text-orange-400/70">high</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/15">
                <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span className="font-bold text-amber-600 dark:text-amber-400">{severityCounts.medium}</span>
                <span className="text-amber-500/70 dark:text-amber-400/70">medium</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/15">
                <Info className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{severityCounts.low}</span>
                <span className="text-emerald-500/70 dark:text-emerald-400/70">low</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4">
              <Button
                size="sm"
                className="h-8 rounded-xl gap-1.5 text-xs flex-1"
                onClick={handleScan}
                disabled={scanning}
              >
                {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {scanning ? "Scanning..." : "Re-Scan"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl gap-1.5 text-xs"
                onClick={() => window.open(`https://github.com/${repo.name}`, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                GitHub
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDisconnect}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="overview" className="flex flex-col">
            <div className="px-5 pt-3 border-b border-border">
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
            <TabsContent value="overview" className="px-5 py-4 space-y-5 mt-0">
              {/* Status Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3.5 bg-card">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Open Issues</p>
                  <p className="text-xl font-extrabold text-red-600 dark:text-red-400">{openIssues.length}</p>
                </div>
                <div className="rounded-xl border border-border p-3.5 bg-card">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Resolved</p>
                  <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{resolvedIssues.length}</p>
                </div>
              </div>

              {/* AI Recommendations */}
              <div>
                <h4 className="text-xs font-bold text-card-foreground mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  AI Security Recommendations
                </h4>
                <div className="space-y-2.5">
                  {AI_RECOMMENDATIONS.map((rec) => (
                    <div key={rec.title} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-secondary/20 transition-colors">
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

              {/* View All Issues Button */}
              <Button
                variant="outline"
                className="w-full h-9 rounded-xl text-xs font-semibold gap-1.5"
                onClick={() => {
                  onClose();
                  navigate("/issues");
                }}
              >
                View All Issues in Issues Page
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </TabsContent>

            {/* Issues Tab */}
            <TabsContent value="issues" className="px-5 py-4 mt-0">
              {issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-card-foreground">No issues found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">This repository is clean. Great work!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {issues.slice(0, 20).map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-primary/[0.03] hover:border-primary/20 transition-all text-left group"
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
                  {issues.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Showing 20 of {issues.length} issues.{" "}
                      <button
                        onClick={() => { onClose(); navigate("/issues"); }}
                        className="text-primary font-semibold hover:underline"
                      >
                        View all →
                      </button>
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Scan History Tab */}
            <TabsContent value="history" className="px-5 py-4 mt-0">
              {scanHistoryLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                </div>
              ) : scanHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <History className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-bold text-card-foreground">No scan history</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Run your first scan to see results here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map((scan) => (
                    <div key={scan.id} className="rounded-xl border border-border bg-card p-3.5 hover:bg-secondary/10 transition-colors">
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
                      <div className="flex items-center gap-3 mt-2 text-[10px]">
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
        </SheetContent>
      </Sheet>

      <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </>
  );
}

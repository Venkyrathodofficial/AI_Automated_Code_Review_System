import { useState, useEffect, useMemo } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { motion } from "framer-motion";
import {
  Eye,
  Loader2,
  AlertCircle,
  Search,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  XCircle,
  FileCode2,
  GitCommitHorizontal,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Issue } from "@/data/mockData";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { useReviews, useToggleStatus, useRepositories } from "@/hooks/useReviews";
import { toast } from "sonner";

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

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

type SortKey = "severity" | "date" | "repository" | "title" | "status";
type SortDir = "asc" | "desc";

const Issues = () => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const { data: issues = [], isLoading } = useReviews();
  const { data: repositories = [] } = useRepositories();
  const toggleMutation = useToggleStatus();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [repoFilter, setRepoFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Quick filter pill
  const [quickFilter, setQuickFilter] = useState<string>("all");

  // Extract unique categories and repos from data
  const uniqueRepos = useMemo(() => {
    const repos = new Set(issues.map((i) => i.repository));
    return Array.from(repos).sort();
  }, [issues]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(issues.map((i) => i.category).filter(Boolean));
    return Array.from(cats).sort() as string[];
  }, [issues]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, severityFilter, statusFilter, repoFilter, categoryFilter, quickFilter, itemsPerPage]);

  // Count helpers
  const counts = useMemo(() => ({
    total: issues.length,
    open: issues.filter((i) => i.status === "open").length,
    resolved: issues.filter((i) => i.status === "resolved").length,
    critical: issues.filter((i) => i.severity === "critical").length,
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
  }), [issues]);

  // Derive effective severity/status from quickFilter
  const effectiveSeverity = useMemo(() => {
    if (["critical", "high", "medium", "low"].includes(quickFilter)) return quickFilter;
    return severityFilter;
  }, [quickFilter, severityFilter]);

  const effectiveStatus = useMemo(() => {
    if (quickFilter === "open") return "open";
    if (quickFilter === "resolved") return "resolved";
    return statusFilter;
  }, [quickFilter, statusFilter]);

  const readiness = useMemo(() => {
    let criticalCount = counts.critical;
    let highCount = counts.high;
    let mediumCount = counts.medium;
    
    let deduction = (criticalCount * 15) + (highCount * 10) + (mediumCount * 5);
    let score = Math.max(0, 100 - deduction);
    
    let verdict = "PASS";
    if (criticalCount > 0 || highCount > 0) verdict = "BLOCK";
    else if (mediumCount > 0 || score < 80) verdict = "WARN";
    
    return { score, verdict };
  }, [counts]);

  // Filtered and sorted
  const filteredIssues = useMemo(() => {
    let result = [...issues];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.fileName.toLowerCase().includes(q) ||
          i.repository.toLowerCase().includes(q) ||
          (i.commitId && i.commitId.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q))
      );
    }

    // Severity
    if (effectiveSeverity !== "all") {
      result = result.filter((i) => i.severity === effectiveSeverity);
    }

    // Status
    if (effectiveStatus !== "all") {
      result = result.filter((i) => i.status === effectiveStatus);
    }

    // Repo
    if (repoFilter !== "all") {
      result = result.filter((i) => i.repository === repoFilter);
    }

    // Category
    if (categoryFilter !== "all") {
      result = result.filter((i) => i.category === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "severity":
          cmp = (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
          break;
        case "date":
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "repository":
          cmp = a.repository.localeCompare(b.repository);
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [issues, searchQuery, effectiveSeverity, effectiveStatus, repoFilter, categoryFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentIssues = filteredIssues.slice(indexOfFirstItem, indexOfLastItem);

  const toggleStatus = (id: string) => {
    const issue = issues.find((i) => i.id === id);
    if (!issue) return;
    const newStatus = issue.status === "open" ? "Resolved" : "Open";
    toggleMutation.mutate({ id, status: newStatus });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Bulk actions
  const allOnPageSelected = currentIssues.length > 0 && currentIssues.every(i => selectedIds.has(i.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      const newSet = new Set(selectedIds);
      currentIssues.forEach(i => newSet.delete(i.id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      currentIssues.forEach(i => newSet.add(i.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const bulkResolve = () => {
    selectedIds.forEach(id => {
      const issue = issues.find(i => i.id === id);
      if (issue && issue.status === "open") {
        toggleMutation.mutate({ id, status: "Resolved" });
      }
    });
    toast.success(`Marked ${selectedIds.size} issue(s) as resolved`);
    setSelectedIds(new Set());
  };

  const bulkReopen = () => {
    selectedIds.forEach(id => {
      const issue = issues.find(i => i.id === id);
      if (issue && issue.status === "resolved") {
        toggleMutation.mutate({ id, status: "Open" });
      }
    });
    toast.success(`Reopened ${selectedIds.size} issue(s)`);
    setSelectedIds(new Set());
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSeverityFilter("all");
    setStatusFilter("all");
    setRepoFilter("all");
    setCategoryFilter("all");
    setQuickFilter("all");
  };

  const hasActiveFilters = searchQuery || severityFilter !== "all" || statusFilter !== "all" || repoFilter !== "all" || categoryFilter !== "all" || quickFilter !== "all";

  // Pagination helpers
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const quickFilterPills = [
    { key: "all", label: "All", count: counts.total, icon: null, color: "text-foreground" },
    { key: "open", label: "Open", count: counts.open, icon: null, color: "text-red-600 dark:text-red-400" },
    { key: "critical", label: "Critical", count: counts.critical, icon: AlertOctagon, color: "text-red-600 dark:text-red-400" },
    { key: "high", label: "High", count: counts.high, icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400" },
    { key: "medium", label: "Medium", count: counts.medium, icon: AlertCircle, color: "text-amber-600 dark:text-amber-400" },
    { key: "low", label: "Low", count: counts.low, icon: Info, color: "text-emerald-600 dark:text-emerald-400" },
    { key: "resolved", label: "Resolved", count: counts.resolved, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav title="Issues" subtitle="All code review findings" />
          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background space-y-5 sm:space-y-6">
            
            {/* Overall Readiness & Verdict Banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
                readiness.verdict === "PASS" ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900" :
                readiness.verdict === "WARN" ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900" :
                "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl font-black text-2xl ${
                  readiness.verdict === "PASS" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" :
                  readiness.verdict === "WARN" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" :
                  "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                }`}>
                  {readiness.score}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Global Readiness Score</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Calculated across all connected repositories.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">Verdict</p>
                  <div className={`px-4 py-1.5 rounded-lg text-sm font-black tracking-widest ${
                    readiness.verdict === "PASS" ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" :
                    readiness.verdict === "WARN" ? "bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]" :
                    "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  }`}>
                    {readiness.verdict}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {quickFilterPills.map(pill => (
                <button
                  key={pill.key}
                  onClick={() => {
                    setQuickFilter(pill.key);
                    // Reset dropdown filters when quick filter is used
                    if (["critical", "high", "medium", "low"].includes(pill.key)) {
                      setSeverityFilter("all");
                      setStatusFilter("all");
                    } else if (pill.key === "open" || pill.key === "resolved") {
                      setSeverityFilter("all");
                      setStatusFilter("all");
                    } else {
                      setSeverityFilter("all");
                      setStatusFilter("all");
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0 ${
                    quickFilter === pill.key
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card hover:bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  {pill.icon && <pill.icon className={`h-3 w-3 ${quickFilter === pill.key ? "text-primary" : pill.color}`} />}
                  {pill.label}
                  <span className={`tabular-nums font-bold ml-0.5 ${quickFilter === pill.key ? "text-primary" : "text-muted-foreground/70"}`}>
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search & Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search issues by title, file, repo, commit ID..."
                  className="h-9 pl-9 text-xs rounded-xl border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={repoFilter} onValueChange={setRepoFilter}>
                  <SelectTrigger className="h-9 w-[140px] text-xs border-border rounded-xl">
                    <SelectValue placeholder="Repository" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    <SelectItem value="all">All Repos</SelectItem>
                    {uniqueRepos.map(r => (
                      <SelectItem key={r} value={r}>{r.includes("/") ? r.split("/").pop() : r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {uniqueCategories.length > 0 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 w-[130px] text-xs border-border rounded-xl">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      <SelectItem value="all">All Categories</SelectItem>
                      {uniqueCategories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setQuickFilter("all"); }}>
                  <SelectTrigger className="h-9 w-[120px] text-xs border-border rounded-xl">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setQuickFilter("all"); }}>
                  <SelectTrigger className="h-9 w-[110px] text-xs border-border rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="h-9 text-xs rounded-xl gap-1 text-muted-foreground hover:text-foreground" onClick={resetFilters}>
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Active filter info + Bulk Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {filteredIssues.length === issues.length
                  ? `${issues.length} total issue${issues.length !== 1 ? "s" : ""}`
                  : `Showing ${filteredIssues.length} of ${issues.length} issues`}
              </p>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-1.5">
                  <span className="text-xs font-bold text-primary">{selectedIds.size} selected</span>
                  <div className="h-4 w-px bg-primary/20" />
                  <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 gap-1 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={bulkResolve}>
                    <Check className="h-3 w-3" />
                    Resolve
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 gap-1 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={bulkReopen}>
                    <XCircle className="h-3 w-3" />
                    Reopen
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 rounded-lg text-muted-foreground" onClick={() => setSelectedIds(new Set())}>
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
              </div>
            ) : (
              /* Table */
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent bg-secondary/30">
                        <TableHead className="w-10">
                          <Checkbox
                            checked={allOnPageSelected}
                            onCheckedChange={toggleSelectAll}
                            className="ml-1"
                          />
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <button onClick={() => handleSort("repository")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Repository
                            {sortKey === "repository" && <ArrowUpDown className="h-3 w-3" />}
                          </button>
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">File</TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <button onClick={() => handleSort("title")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Issue
                            {sortKey === "title" && <ArrowUpDown className="h-3 w-3" />}
                          </button>
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <button onClick={() => handleSort("severity")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Severity
                            {sortKey === "severity" && <ArrowUpDown className="h-3 w-3" />}
                          </button>
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                          <button onClick={() => handleSort("status")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Status
                            {sortKey === "status" && <ArrowUpDown className="h-3 w-3" />}
                          </button>
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                          <button onClick={() => handleSort("date")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Date
                            {sortKey === "date" && <ArrowUpDown className="h-3 w-3" />}
                          </button>
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentIssues.map((issue) => (
                        <TableRow
                          key={issue.id}
                          className={`border-border hover:bg-primary/[0.03] transition-colors cursor-pointer ${selectedIds.has(issue.id) ? "bg-primary/5" : ""}`}
                          onClick={() => setSelectedIssue(issue)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(issue.id)}
                              onCheckedChange={() => toggleSelectOne(issue.id)}
                              className="ml-1"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium text-card-foreground">
                            {issue.repository.includes("/") ? issue.repository.split("/").pop() : issue.repository}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1.5 max-w-[180px]">
                              <FileCode2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="font-mono text-xs text-muted-foreground truncate">{issue.fileName}</span>
                              {issue.lineNumber && (
                                <span className="inline-flex items-center text-[9px] font-mono text-primary/80 bg-primary/5 px-1 py-0.5 rounded flex-shrink-0">
                                  L{issue.lineNumber}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] sm:max-w-[280px]">
                            <p className="text-xs font-semibold text-card-foreground truncate max-w-[250px]">{issue.title}</p>
                            {issue.commitId && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <GitCommitHorizontal className="h-2.5 w-2.5 text-muted-foreground/60" />
                                  <span className="text-[10px] font-mono text-muted-foreground/80">{issue.commitId.substring(0, 7)}</span>
                                </div>
                                {issue.validationStatus === "ai_verified" && (
                                  <Badge variant="outline" className="text-[8px] h-4 uppercase tracking-wider bg-violet-50 text-violet-600 border-violet-200 py-0 px-1 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800">
                                    AI Verified
                                  </Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] font-semibold uppercase rounded-lg px-2 py-0.5 ${severityVariant[issue.severity]}`}>
                              {issue.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => toggleStatus(issue.id)} className="transition-transform hover:scale-105">
                              <Badge className={`text-[10px] font-semibold capitalize cursor-pointer rounded-lg px-2 py-0.5 ${statusVariant[issue.status]}`}>
                                {issue.status}
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">{issue.date}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl"
                              onClick={() => setSelectedIssue(issue)}
                            >
                              <Eye className="h-3 w-3" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredIssues.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <p className="text-sm font-medium text-card-foreground">No issues match the selected filters.</p>
                              <p className="text-xs text-muted-foreground">Try adjusting your search or filter criteria.</p>
                              {hasActiveFilters && (
                                <Button variant="outline" size="sm" className="mt-2 h-8 text-xs rounded-xl gap-1" onClick={resetFilters}>
                                  <RotateCcw className="h-3 w-3" />
                                  Reset Filters
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Enhanced Pagination Footer */}
                {filteredIssues.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between border-t border-border px-4 py-3 bg-secondary/10 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{indexOfFirstItem + 1}</span> to{" "}
                        <span className="font-medium text-foreground">
                          {Math.min(indexOfLastItem, filteredIssues.length)}
                        </span>{" "}
                        of <span className="font-medium text-foreground">{filteredIssues.length}</span> issues
                      </span>
                      <div className="h-4 w-px bg-border hidden sm:block" />
                      <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                        <SelectTrigger className="h-7 w-[70px] text-[11px] border-border rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">per page</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 rounded-lg"
                      >
                        <ChevronsLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 rounded-lg"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-center gap-1 mx-1">
                        {getPageNumbers().map((page, idx) =>
                          page === "..." ? (
                            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page as number)}
                              className={`h-8 w-8 rounded-lg text-xs p-0 ${
                                currentPage === page ? "" : "hover:bg-accent hover:text-accent-foreground"
                              }`}
                            >
                              {page}
                            </Button>
                          )
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0 rounded-lg"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0 rounded-lg"
                      >
                        <ChevronsRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </main>
        </div>
      </div>

      <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </SidebarProvider>
  );
};

export default Issues;

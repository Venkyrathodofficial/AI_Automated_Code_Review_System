import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { motion } from "framer-motion";
import { Eye, Filter, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Issue } from "@/data/mockData";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { useReviews, useToggleStatus } from "@/hooks/useReviews";

const severityVariant: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-0 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const statusVariant: Record<string, string> = {
  open: "bg-red-50 text-red-600 border-0 dark:bg-red-900/20 dark:text-red-400",
  resolved: "bg-emerald-50 text-emerald-600 border-0 dark:bg-emerald-900/20 dark:text-emerald-400",
};

const Issues = () => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const { data: issues = [], isLoading } = useReviews();
  const toggleMutation = useToggleStatus();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredIssues = issues.filter((issue) => {
    if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
    if (statusFilter !== "all" && issue.status !== statusFilter) return false;
    return true;
  });

  const toggleStatus = (id: string) => {
    const issue = issues.find((i) => i.id === id);
    if (!issue) return;
    const newStatus = issue.status === "open" ? "Resolved" : "Open";
    toggleMutation.mutate({ id, status: newStatus });
  };

  const openCount = issues.filter((i) => i.status === "open").length;
  const resolvedCount = issues.filter((i) => i.status === "resolved").length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav title="Issues" subtitle="All code review findings" />
          <main className="flex-1 overflow-auto p-3 sm:p-6 bg-background">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
              <div className="flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="font-medium text-card-foreground">{openCount}</span>
                  <span className="text-muted-foreground">Open</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="font-medium text-card-foreground">{resolvedCount}</span>
                  <span className="text-muted-foreground">Resolved</span>
                </div>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="h-9 w-[110px] sm:w-[130px] text-xs border-border rounded-xl">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[100px] sm:w-[120px] text-xs border-border rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Repository</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">File</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Issue</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Severity</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow key={issue.id} className="border-border hover:bg-primary/[0.03] transition-colors">
                      <TableCell className="font-mono text-xs font-medium text-card-foreground">{issue.repository}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[160px] truncate hidden md:table-cell">{issue.fileName}</TableCell>
                      <TableCell className="text-sm text-card-foreground max-w-[180px] sm:max-w-[260px] truncate">{issue.title}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] font-semibold uppercase rounded-lg px-2 py-0.5 ${severityVariant[issue.severity]}`}>
                          {issue.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <button onClick={() => toggleStatus(issue.id)} className="transition-transform hover:scale-105">
                          <Badge className={`text-[10px] font-semibold capitalize cursor-pointer rounded-lg px-2 py-0.5 ${statusVariant[issue.status]}`}>
                            {issue.status}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{issue.date}</TableCell>
                      <TableCell>
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
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                            <AlertCircle className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">No issues match the selected filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
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

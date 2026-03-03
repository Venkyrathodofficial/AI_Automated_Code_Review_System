import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { motion } from "framer-motion";
import { Eye, Filter, Loader2 } from "lucide-react";
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
  critical: "bg-critical/10 text-critical border-0 hover:bg-critical/15",
  medium: "bg-warning/10 text-warning border-0 hover:bg-warning/15",
  low: "bg-success/10 text-success border-0 hover:bg-success/15",
};

const statusVariant: Record<string, string> = {
  open: "bg-critical/8 text-critical border-0",
  resolved: "bg-success/8 text-success border-0",
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
          <main className="flex-1 overflow-auto p-6 bg-background">
            {/* Summary */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-critical" />
                <span className="text-muted-foreground">{openCount} Open</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-muted-foreground">{resolvedCount} Resolved</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="h-8 w-[130px] text-xs border-border">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-[120px] text-xs border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-xl border border-border bg-card shadow-sm"
            >
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Repository</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">File</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Issue</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Severity</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow key={issue.id} className="border-border hover:bg-secondary/40 transition-colors">
                      <TableCell className="font-mono text-xs text-card-foreground">{issue.repository}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[160px] truncate">{issue.fileName}</TableCell>
                      <TableCell className="text-sm text-card-foreground max-w-[260px] truncate">{issue.title}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] font-semibold uppercase ${severityVariant[issue.severity]}`}>
                          {issue.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button onClick={() => toggleStatus(issue.id)}>
                          <Badge className={`text-[10px] font-semibold capitalize cursor-pointer ${statusVariant[issue.status]}`}>
                            {issue.status}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{issue.date}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedIssue(issue)}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredIssues.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                        No issues match the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </motion.div>
          </main>
        </div>
      </div>

      <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </SidebarProvider>
  );
};

export default Issues;

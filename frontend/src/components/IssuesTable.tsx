import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Loader2, AlertCircle } from "lucide-react";
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
import { Issue } from "@/data/mockData";
import { IssueDetailModal } from "./IssueDetailModal";
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

export function IssuesTable() {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const { data: issues = [], isLoading } = useReviews();
  const toggleMutation = useToggleStatus();

  const toggleStatus = (id: string) => {
    const issue = issues.find((i) => i.id === id);
    if (!issue) return;
    const newStatus = issue.status === "open" ? "Resolved" : "Open";
    toggleMutation.mutate({ id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
      >
        <div className="p-5 sm:p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <AlertCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground">Recent Issues</h3>
              <p className="text-xs text-muted-foreground">Latest code review findings across repositories</p>
            </div>
          </div>
        </div>

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
            {issues.map((issue) => (
              <TableRow key={issue.id} className="border-border hover:bg-primary/[0.03] transition-colors">
                <TableCell className="font-mono text-xs font-medium text-card-foreground">{issue.repository}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground max-w-[160px] truncate hidden md:table-cell">{issue.fileName}</TableCell>
                <TableCell className="text-sm text-card-foreground max-w-[180px] sm:max-w-[240px] truncate">{issue.title}</TableCell>
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
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </motion.div>

      <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </>
  );
}

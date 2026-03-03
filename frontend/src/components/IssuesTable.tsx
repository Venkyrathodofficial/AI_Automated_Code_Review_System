import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Loader2 } from "lucide-react";
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
  critical: "bg-critical/15 text-critical border-0",
  medium: "bg-warning/15 text-warning border-0",
  low: "bg-success/15 text-success border-0",
};

const statusVariant: Record<string, string> = {
  open: "bg-critical/10 text-critical border-0",
  resolved: "bg-success/10 text-success border-0",
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="rounded-xl border border-border bg-card shadow-sm"
      >
        <div className="p-6 pb-4">
          <h3 className="text-sm font-semibold text-card-foreground">Recent Issues</h3>
          <p className="mt-1 text-xs text-muted-foreground">Latest code review findings across repositories</p>
        </div>

        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Repository</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">File</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Issue</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Severity</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Date</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id} className="border-border hover:bg-secondary/50 transition-colors">
                <TableCell className="font-mono text-xs text-card-foreground">{issue.repository}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground max-w-[160px] truncate hidden md:table-cell">{issue.fileName}</TableCell>
                <TableCell className="text-sm text-card-foreground max-w-[180px] sm:max-w-[240px] truncate">{issue.title}</TableCell>
                <TableCell>
                  <Badge className={`text-[10px] font-semibold uppercase ${severityVariant[issue.severity]}`}>
                    {issue.severity}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <button onClick={() => toggleStatus(issue.id)}>
                    <Badge className={`text-[10px] font-semibold capitalize cursor-pointer ${statusVariant[issue.status]}`}>
                      {issue.status}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{issue.date}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
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

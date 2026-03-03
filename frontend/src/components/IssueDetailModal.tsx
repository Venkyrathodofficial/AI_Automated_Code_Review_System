import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Issue } from "@/data/mockData";
import { GitCommit, Lightbulb, Wrench } from "lucide-react";

interface Props {
  issue: Issue | null;
  onClose: () => void;
}

const severityColor: Record<string, string> = {
  critical: "bg-critical/15 text-critical border-0",
  medium: "bg-warning/15 text-warning border-0",
  low: "bg-success/15 text-success border-0",
};

export function IssueDetailModal({ issue, onClose }: Props) {
  if (!issue) return null;

  return (
    <Dialog open={!!issue} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className={`text-[10px] font-semibold uppercase ${severityColor[issue.severity]}`}>
              {issue.severity}
            </Badge>
            <Badge className={`text-[10px] font-semibold capitalize ${issue.status === "open" ? "bg-critical/10 text-critical border-0" : "bg-success/10 text-success border-0"}`}>
              {issue.status}
            </Badge>
          </div>
          <DialogTitle className="text-base font-semibold text-card-foreground mt-2">
            {issue.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Description</p>
            <p className="text-sm text-card-foreground leading-relaxed">{issue.description}</p>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-secondary p-4">
            <Wrench className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-card-foreground mb-1">Suggested Fix</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{issue.suggestedFix}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-secondary p-4">
            <Lightbulb className="h-4 w-4 mt-0.5 text-warning shrink-0" />
            <div>
              <p className="text-xs font-semibold text-card-foreground mb-1">Optimization Tip</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{issue.optimizationTip}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-secondary p-4">
            <GitCommit className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-semibold text-card-foreground mb-1">Commit Info</p>
              <p className="text-sm text-muted-foreground">{issue.commitMessage}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">ID: {issue.commitId}</p>
            </div>
          </div>

          <div className="flex gap-4 text-xs text-muted-foreground pt-1">
            <span><span className="font-medium text-card-foreground">Repo:</span> {issue.repository}</span>
            <span><span className="font-medium text-card-foreground">File:</span> {issue.fileName}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

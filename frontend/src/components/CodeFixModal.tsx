import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onClose: () => void;
  fileName: string;
  originalCode: string;
  issueDescription: string;
}

export function CodeFixModal({ open, onClose, fileName, originalCode, issueDescription }: Props) {
  const [improvedCode, setImprovedCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFix = async () => {
    setLoading(true);
    setError("");
    setImprovedCode("");
    setExplanation("");
    try {
      const res = await fetch("/api/fix-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: originalCode, issueDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fix code");
      setImprovedCode(data.improved_code);
      setExplanation(data.explanation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(improvedCode);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Code Fix for {fileName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="font-semibold mb-1">Original Code</p>
            <Textarea value={originalCode} readOnly rows={6} className="font-mono text-xs" />
          </div>
          <Button onClick={handleFix} disabled={loading} className="w-full">
            {loading ? "Fixing..." : "Fix Code with AI"}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {improvedCode && (
            <>
              <div>
                <p className="font-semibold mb-1">Improved Code</p>
                <Textarea value={improvedCode} readOnly rows={6} className="font-mono text-xs" />
                <Button onClick={handleCopy} className="mt-2">Copy Code</Button>
              </div>
              <div>
                <p className="font-semibold mb-1">AI Explanation</p>
                <Textarea value={explanation} readOnly rows={3} className="font-mono text-xs" />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { CodeFixModal } from "./CodeFixModal";
import { Button } from "@/components/ui/button";

interface Props {
  fileName: string;
  originalCode: string;
  issueDescription: string;
}

export function FixCodeButton({ fileName, originalCode, issueDescription }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Fix Code
      </Button>
      <CodeFixModal
        open={open}
        onClose={() => setOpen(false)}
        fileName={fileName}
        originalCode={originalCode}
        issueDescription={issueDescription}
      />
    </>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { submitMilestone, type SubmitState } from "@/app/actions/submissions";

const initialState: SubmitState = {};

export function SubmissionUploader({ milestoneId, milestoneName }: { milestoneId: string; milestoneName: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitMilestone, initialState);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success(`"${milestoneName}" submitted. Your supervisor has been notified.`);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a server action result, not mirroring props
      setFile(null);
      router.refresh();
    }
  }, [state.success, milestoneName, router]);

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (f) setFile(f);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="milestoneId" value={milestoneId} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
          if (inputRef.current) inputRef.current.files = e.dataTransfer.files;
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragActive ? "border-brand/60 bg-brand/10" : "border-border-strong bg-black/[0.02] hover:bg-black/[0.04]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {file ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-3">
            <FileText className="size-6 text-brand-700" />
            <div className="text-left">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-full p-1 text-muted-foreground hover:bg-black/10"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ) : (
          <>
            <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand/25 to-brand-300/15">
              <UploadCloud className="size-5 text-brand-700" />
            </div>
            <div>
              <p className="text-sm font-medium">Drop your file here, or click to browse</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF, DOC, or DOCX · up to 25MB</p>
            </div>
          </>
        )}
      </div>

      {state.error && (
        <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending || !file}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Submit for review
      </Button>
    </form>
  );
}

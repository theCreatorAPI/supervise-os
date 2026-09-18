"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { requestSubmissionUpload, finalizeSubmission } from "@/app/actions/submissions";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Uploads straight to storage with XHR rather than fetch: only XHR reports
 * progress events, and a 25MB submission on a slow connection with no feedback
 * looks indistinguishable from a hung page.
 */
function uploadWithProgress(url: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    xhr.addEventListener("load", () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed with status ${xhr.status}`))
    );
    xhr.addEventListener("error", () => reject(new Error("Upload failed.")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled.")));

    xhr.send(file);
  });
}

export function SubmissionUploader({ milestoneId, milestoneName }: { milestoneId: string; milestoneName: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!succeeded) return;
    toast.success(`"${milestoneName}" submitted. Your supervisor has been notified.`);
    router.refresh();
  }, [succeeded, milestoneName, router]);

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setError(null);
    setFile(f);
  }

  function reset() {
    setFile(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || pending) return;

    // Checked here for a fast, clear message; the server re-checks both, since
    // the actions are reachable without going through this form.
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PDF, DOC, and DOCX files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large — max 25MB.");
      return;
    }

    setPending(true);
    setError(null);
    setProgress(0);

    try {
      const ticket = await requestSubmissionUpload({
        milestoneId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      if (!ticket.ok) {
        setError(ticket.error);
        return;
      }

      await uploadWithProgress(ticket.signedUrl, file, setProgress);

      const result = await finalizeSubmission({
        milestoneId,
        storedName: ticket.storedName,
        signature: ticket.signature,
        fileName: file.name,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      reset();
      setSucceeded(true);
    } catch (err) {
      console.error(err);
      setError("The upload didn't complete. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        }}
        onClick={() => !pending && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragActive ? "border-brand/60 bg-brand/10" : "border-border-strong bg-black/[0.02] hover:bg-black/[0.04]"
        } ${pending ? "pointer-events-none opacity-70" : ""}`}
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
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="rounded-full p-1 text-muted-foreground hover:bg-black/10 disabled:opacity-40"
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

      {pending && (
        <div aria-live="polite">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-brand-700 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {progress < 100 ? `Uploading — ${progress}%` : "Finishing up…"}
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending || !file}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Submit for review
      </Button>
    </form>
  );
}

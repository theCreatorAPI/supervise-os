"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createProject, type CreateProjectState } from "@/app/actions/projects";

const initialState: CreateProjectState = {};

export function CreateProjectForm({ supervisorName }: { supervisorName: string }) {
  const [state, formAction, pending] = useActionState(createProject, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="rounded-lg border border-border-strong bg-background-elevated px-3 py-2 text-xs text-muted-foreground">
        Supervised by <span className="font-medium text-foreground">{supervisorName}</span>
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Project title</Label>
        <Input id="title" name="title" placeholder="e.g. Federated Learning for Low-Bandwidth Clinics" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" placeholder="A sentence or two on what this project covers." rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="programme">Programme</Label>
          <Input id="programme" name="programme" placeholder="B.Sc. Computer Science" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="session">Session</Label>
          <Input id="session" name="session" placeholder="2025/2026" />
        </div>
      </div>
      {state.error && (
        <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Create project
      </Button>
    </form>
  );
}

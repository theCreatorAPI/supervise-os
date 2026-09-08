"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { registerLecturer, type RegisterState } from "@/app/actions/auth";

const initialState: RegisterState = {};

export function LecturerSignUpForm({ departments }: { departments: { id: string; name: string }[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registerLecturer, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Account created. Time to sign in and add your first student.");
      router.push("/sign-in");
    }
  }, [state.success, router]);

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      action={formAction}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name" className="text-[13px] font-semibold">
          Full name
        </Label>
        <Input id="name" name="name" placeholder="Dr. Ada Lovelace" className="border-border-strong bg-white" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-[13px] font-semibold">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@university.edu"
          className="border-border-strong bg-white"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="staffId" className="text-[13px] font-semibold">
          Staff ID
        </Label>
        <Input id="staffId" name="staffId" placeholder="STF-00231" className="border-border-strong bg-white" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="departmentId" className="text-[13px] font-semibold">
          Department
        </Label>
        <Select name="departmentId" required>
          <SelectTrigger id="departmentId" className="border-border-strong bg-white">
            <SelectValue placeholder="Choose a department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" className="text-[13px] font-semibold">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 6 characters"
          className="border-border-strong bg-white"
          required
        />
      </div>

      {state.error && (
        <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        variant="secondary"
        size="lg"
        disabled={pending}
        className="mt-2 w-full rounded-xl border-transparent bg-foreground text-white hover:bg-foreground/90"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Create account
        {!pending && <ArrowRight className="size-4" />}
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        A student? Ask your supervising lecturer to add you — you&apos;ll get an activation link.
      </p>
    </motion.form>
  );
}

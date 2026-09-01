"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/supervise/auth-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Those credentials don't match our records. Double-check and try again.");
      return;
    }
    router.push(params.get("callbackUrl") || "/");
    router.refresh();
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={onSubmit}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@university.edu" required autoFocus />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
      </div>
      {error && (
        <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={loading} className="mt-2">
        {loading && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/sign-up" className="text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
      <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.03] p-3 text-[11px] leading-relaxed text-muted-foreground">
        Demo accounts — see <span className="text-foreground/80">DEMO_ACCOUNTS.md</span>. Try{" "}
        <span className="text-foreground/80">student1@demo.io</span> or{" "}
        <span className="text-foreground/80">lecturer1@demo.io</span>, password{" "}
        <span className="text-foreground/80">password123</span>.
      </div>
    </motion.form>
  );
}

export default function SignInPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to pick up exactly where you left off.">
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </AuthLayout>
  );
}

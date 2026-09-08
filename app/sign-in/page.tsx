"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, GraduationCap, UserCog } from "lucide-react";
import { AuthLayout } from "@/components/supervise/auth-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/** Seeded demo logins, also listed in DEMO_ACCOUNTS.md. */
const DEMO_ACCOUNTS = [
  { label: "Continue as a student", email: "student1@demo.io", icon: GraduationCap },
  { label: "Continue as a lecturer", email: "lecturer1@demo.io", icon: UserCog },
];
const DEMO_PASSWORD = "password123";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(withEmail: string, withPassword: string) {
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email: withEmail,
      password: withPassword,
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
      onSubmit={(e) => {
        e.preventDefault();
        void submit(email, password);
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-[13px] font-semibold">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.edu"
          className="border-border-strong bg-white"
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" className="text-[13px] font-semibold">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="border-border-strong bg-white"
          required
        />
      </div>

      {error && (
        <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="secondary"
        size="lg"
        disabled={loading}
        className="mt-2 w-full rounded-xl border-transparent bg-foreground text-white hover:bg-foreground/90"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        Sign in
        {!loading && <ArrowRight className="size-4" />}
      </Button>

      <div className="my-2 flex items-center gap-3">
        <span className="h-px flex-1 bg-border-strong" />
        <span className="text-xs text-muted-foreground">or explore with a demo account</span>
        <span className="h-px flex-1 bg-border-strong" />
      </div>

      {DEMO_ACCOUNTS.map((account) => (
        <Button
          key={account.email}
          type="button"
          variant="secondary"
          size="lg"
          disabled={loading}
          onClick={() => {
            setEmail(account.email);
            setPassword(DEMO_PASSWORD);
            void submit(account.email, DEMO_PASSWORD);
          }}
          className="w-full rounded-xl border-transparent bg-black/[0.06] shadow-none hover:bg-black/[0.09]"
        >
          {account.label}
          <account.icon className="size-4" />
        </Button>
      ))}
    </motion.form>
  );
}

export default function SignInPage() {
  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Enter your email to pick up exactly where you left off."
      footer={
        <>
          <span>Don&apos;t have an account?</span>
          <Link href="/sign-up" className="flex items-center gap-1 font-semibold text-foreground hover:underline">
            Sign up <ArrowRight className="size-3.5" />
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </AuthLayout>
  );
}

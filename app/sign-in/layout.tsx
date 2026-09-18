import type { Metadata } from "next";

/**
 * The page itself is a Client Component (it calls `signIn`), and those can't
 * export metadata — so the route's title and canonical live here instead.
 */
export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Supervise OS to pick up your milestones, submissions and supervision meetings where you left off.",
  alternates: { canonical: "/sign-in" },
  openGraph: {
    title: "Sign in · Supervise OS",
    description: "Sign in to Supervise OS.",
    url: "/sign-in",
  },
};

export default function SignInLayout({ children }: LayoutProps<"/sign-in">) {
  return children;
}

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type NavLink = { label: string; href: string };

export function MobileNavDrawer({
  links,
  dashboardHref,
  userName,
}: {
  links: NavLink[];
  dashboardHref: string | null;
  userName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard client-only-mount guard so createPortal has a real document.body
    setMounted(true);
  }, []);

  const drawer = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            key="panel"
            className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col gap-6 bg-white p-6 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold">Menu</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex size-9 items-center justify-center rounded-full hover:bg-black/[0.04]"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-black/[0.04]"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-2">
              {dashboardHref ? (
                <Button asChild onClick={() => setOpen(false)}>
                  <Link href={dashboardHref}>
                    {userName ? `Continue as ${userName.split(" ")[0]}` : "Dashboard"} <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="secondary" asChild onClick={() => setOpen(false)}>
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link href="/sign-up">Get started</Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex size-10 items-center justify-center rounded-full border border-border-strong bg-white"
      >
        <Menu className="size-5" />
      </button>

      {mounted ? createPortal(drawer, document.body) : null}
    </div>
  );
}

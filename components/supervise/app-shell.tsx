"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Radar, MoreHorizontal } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { NAV, SECONDARY_NAV, MOBILE_NAV_LIMIT } from "./nav-config";
import { NotificationBell } from "./notification-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function AppShell({
  role,
  userName,
  children,
}: {
  role: "STUDENT" | "LECTURER" | "MANAGEMENT";
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = NAV[role];
  const secondaryItems = SECONDARY_NAV[role];
  const allMobileItems = [...items, ...secondaryItems];
  const primaryItems = allMobileItems.slice(0, MOBILE_NAV_LIMIT - 1);
  const overflowItems = allMobileItems.slice(MOBILE_NAV_LIMIT - 1);

  function isActive(href: string) {
    return pathname === href || (href !== `/${role.toLowerCase()}` && pathname.startsWith(href));
  }

  function NavLink({ item }: { item: (typeof items)[number] }) {
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
          isActive(item.href)
            ? "bg-brand-50 text-foreground shadow-[inset_0_0_0_1px_rgba(79,95,49,0.3)]"
            : "text-muted-foreground hover:bg-black/[0.05] hover:text-foreground"
        )}
      >
        <Icon className="size-4.5" />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background-elevated/50 md:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-500">
            <Radar className="size-4.5 text-white" />
          </div>
          <div>
            <p className="font-display text-sm font-bold leading-none">Supervise OS</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{role.charAt(0) + role.slice(1).toLowerCase()} view</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {items.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {secondaryItems.length > 0 && (
          <nav className="flex flex-col gap-1 border-t border-border px-3 py-3">
            {secondaryItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        )}

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar>
              <AvatarFallback>{initials(userName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-black/10 hover:text-critical-700"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/70 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl backdrop-saturate-150 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-500">
              <Radar className="size-4 text-white" />
            </div>
            <span className="font-display text-sm font-bold">Supervise OS</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex md:hidden" aria-label="Account menu">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">{initials(userName)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <p className="truncate px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">{userName}</p>
                <DropdownMenuSeparator />
                {secondaryItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="size-4" /> {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {secondaryItems.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-critical-700">
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-background-elevated/80 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl backdrop-saturate-150 md:hidden">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium",
                isActive(item.href) ? "text-brand-700" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        {overflowItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium",
                  overflowItems.some((i) => isActive(i.href)) ? "text-brand-700" : "text-muted-foreground"
                )}
              >
                <MoreHorizontal className="size-5" />
                More
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              {overflowItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="flex items-center gap-2">
                    <item.icon className="size-4" /> {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>
    </div>
  );
}

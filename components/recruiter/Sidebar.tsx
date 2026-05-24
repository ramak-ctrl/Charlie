"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Briefcase, Settings, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <aside className="w-60 sidebar-bg border-r border-border/40 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-none stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2l2-5 3 10 2-7 2 4 2-2h3" />
            </svg>
          </div>
          <span className="font-semibold text-foreground tracking-tight text-base">Charlie</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 leading-none pl-0.5">AI Recruitment Screening</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border/30">
        <div className="px-3 py-2 mb-1">
          <p className="text-[11px] text-muted-foreground/70 truncate">{userEmail}</p>
        </div>
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-transparent transition-all duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

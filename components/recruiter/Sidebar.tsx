"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Briefcase, Settings, LogOut } from "lucide-react";
import CharlieLogo from "@/components/CharlieLogo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs",      label: "Jobs",      icon: Briefcase },
  { href: "/settings",  label: "Settings",  icon: Settings },
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
    <aside className="w-60 sidebar-bg flex flex-col h-full shrink-0">
      {/* Logo */}
      <div style={{
        padding: "22px 20px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "linear-gradient(180deg, rgba(124,58,237,0.06) 0%, transparent 100%)",
      }}>
        <CharlieLogo size="xl" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              style={active ? {
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                color: "#A78BFA",
                background: "linear-gradient(90deg, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.04) 100%)",
                borderLeft: "2px solid rgba(167,139,250,0.8)",
                textDecoration: "none",
              } : {
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                color: "rgba(255,255,255,0.4)",
                textDecoration: "none",
                transition: "color 0.15s, background 0.15s",
              }}
              className={!active ? "hover:bg-white/5 hover:!text-white/70 transition-all" : ""}
            >
              <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ padding: "8px 12px", marginBottom: 4 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userEmail}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "10px 12px", borderRadius: 10, fontSize: 14, fontWeight: 500,
            color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer",
            transition: "color 0.15s, background 0.15s",
          }}
          className="hover:bg-red-500/10 hover:!text-red-400 transition-all"
        >
          <LogOut style={{ width: 16, height: 16, flexShrink: 0 }} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

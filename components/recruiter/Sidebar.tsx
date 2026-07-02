"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Briefcase, Users, Settings, LogOut } from "lucide-react";
import CharlieLogo from "@/components/CharlieLogo";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/jobs",       label: "Jobs",        icon: Briefcase       },
  { href: "/candidates", label: "Candidates",  icon: Users           },
  { href: "/settings",   label: "Settings",    icon: Settings        },
];

const LIME = "#B8E04A";

export default function Sidebar({
  userEmail,
  mobileOpen = false,
  onClose = () => {},
}: {
  userEmail: string;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile backdrop — tap to dismiss */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-60 sidebar-bg flex flex-col h-full shrink-0 transform transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >

      {/* Logo */}
      <div style={{ padding: "22px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
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
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              style={active ? {
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px 10px 10px", borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                color: LIME,
                background: "rgba(184,224,74,0.12)",
                borderLeft: `2.5px solid ${LIME}`,
                textDecoration: "none",
              } : {
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 10,
                fontSize: 14, fontWeight: 500,
                color: "rgba(255,255,255,0.45)",
                textDecoration: "none",
              }}
              className={!active ? "hover:bg-white/5 hover:!text-white/70 transition-all duration-150" : ""}
            >
              <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ padding: "8px 12px", marginBottom: 4 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userEmail}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "10px 12px", borderRadius: 10,
            fontSize: 14, fontWeight: 500,
            color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer",
          }}
          className="hover:bg-red-500/15 hover:!text-red-300 transition-all duration-150"
        >
          <LogOut style={{ width: 16, height: 16, flexShrink: 0 }} />
          Sign out
        </button>
      </div>
      </aside>
    </>
  );
}

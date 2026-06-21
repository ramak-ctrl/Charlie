"use client";
import { usePathname } from "next/navigation";
import { Bell, Search, ChevronRight } from "lucide-react";
import { useState } from "react";

const LIME = "#B8E04A";

type Crumb = { label: string };

function resolveCrumbs(pathname: string): Crumb[] {
  const MAP: Record<string, string> = {
    dashboard:  "Dashboard",
    jobs:       "Jobs",
    candidates: "Candidates",
    settings:   "Settings",
    new:        "New Job",
    edit:       "Edit Job",
  };

  return pathname
    .split("/")
    .filter(Boolean)
    .reduce<Crumb[]>((acc, seg) => {
      const label = MAP[seg];
      if (label) acc.push({ label });
      else if (seg.length === 36 && seg.includes("-")) acc.push({ label: "Detail" });
      return acc;
    }, []);
}

function getInitial(email: string) {
  return email ? email[0].toUpperCase() : "U";
}

export default function TopBar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const crumbs   = resolveCrumbs(pathname);
  const initial  = getInitial(userEmail);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 32px",
      height: 56,
      background: "#172F22",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      flexShrink: 0,
      position: "sticky", top: 0, zIndex: 40,
    }}>

      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* "Charlie" root label */}
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500, letterSpacing: "0.01em" }}>
          Charlie
        </span>

        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ChevronRight style={{ width: 13, height: 13, color: "rgba(255,255,255,0.3)" }} />
              <span style={{
                fontSize: 13,
                fontWeight: isLast ? 700 : 500,
                /* last crumb gets lime so it pops; parents are bright white */
                color: isLast ? LIME : "rgba(255,255,255,0.75)",
                letterSpacing: isLast ? "-0.2px" : "0",
              }}>
                {c.label}
              </span>
            </span>
          );
        })}
      </nav>

      {/* ── Right controls ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {/* Search pill */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: searchOpen ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)",
            border: `1px solid ${searchOpen ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 99,
            padding: searchOpen ? "6px 14px" : "6px 14px",
            transition: "all 0.2s ease",
            minWidth: searchOpen ? 230 : "auto",
            cursor: "text",
          }}
          onClick={() => setSearchOpen(true)}
        >
          <Search style={{ width: 13, height: 13, color: "rgba(255,255,255,0.6)", flexShrink: 0 }} />
          {searchOpen ? (
            <input
              autoFocus
              type="text"
              placeholder="Search jobs, candidates…"
              onBlur={() => setSearchOpen(false)}
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                fontSize: 13, color: "#fff",
              }}
            />
          ) : (
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>Search</span>
          )}
        </div>

        {/* Bell */}
        <button
          aria-label="Notifications"
          style={{
            position: "relative", width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.15s",
          }}
          className="hover:!bg-white/15 transition-all"
        >
          <Bell style={{ width: 15, height: 15, color: "rgba(255,255,255,0.75)" }} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.12)", margin: "0 2px" }} />

        {/* User email (truncated) */}
        <span style={{
          fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500,
          maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {userEmail}
        </span>

        {/* Avatar */}
        <div
          title={userEmail}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: LIME, color: "#1C3829",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 900,
            cursor: "default", flexShrink: 0,
            boxShadow: "0 2px 8px rgba(184,224,74,0.35)",
          }}
        >
          {initial}
        </div>
      </div>
    </header>
  );
}

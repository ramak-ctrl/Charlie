"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";

const C = {
  bg:     "#FFFFFF",
  dark:   "#1C3829",
  mid:    "#3D6B54",
  muted:  "#7A9E8E",
  lime:   "#B8E04A",
  border: "rgba(28,56,41,0.09)",
  borderMd: "rgba(28,56,41,0.18)",
};

function getInitial(email: string) { return email ? email[0].toUpperCase() : "U"; }

function resolveCrumbs(pathname: string): string[] {
  const MAP: Record<string, string> = {
    dashboard: "Dashboard", jobs: "Jobs", candidates: "Candidates",
    settings: "Settings", new: "New Job", edit: "Edit Job",
  };
  return pathname.split("/").filter(Boolean).reduce<string[]>((acc, seg) => {
    const label = MAP[seg];
    if (label) acc.push(label);
    else if (seg.length === 36 && seg.includes("-")) acc.push("Detail");
    return acc;
  }, []);
}

export default function TopBar({ userEmail, onMenu }: { userEmail: string; onMenu?: () => void }) {
  const pathname = usePathname();
  const crumbs   = resolveCrumbs(pathname);
  const initial  = getInitial(userEmail);

  return (
    <header className="topbar-pad" style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", height: 52,
      background: C.bg,
      borderBottom: `1px solid ${C.border}`,
      flexShrink: 0, position: "sticky", top: 0, zIndex: 40,
    }}>

      {/* Breadcrumb (with mobile hamburger) */}
      <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          className="inline-flex md:hidden items-center justify-center"
          style={{
            width: 34, height: 34, marginRight: 6, marginLeft: -6,
            borderRadius: 9, border: "none", background: "transparent",
            color: C.dark, cursor: "pointer", flexShrink: 0,
          }}
        >
          <Menu style={{ width: 20, height: 20 }} />
        </button>
        <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>Charlie</span>
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <ChevronRight style={{ width: 13, height: 13, color: "rgba(28,56,41,0.2)" }} />
              <span style={{ fontSize: 13, fontWeight: isLast ? 700 : 500, color: isLast ? C.dark : C.mid }}>{c}</span>
            </span>
          );
        })}
      </nav>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, color: C.muted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {userEmail}
        </span>
        <div style={{ width: 1, height: 20, background: C.border }} />
        <div title={userEmail} style={{
          width: 30, height: 30, borderRadius: "50%",
          background: C.dark, color: C.lime,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 900, flexShrink: 0,
        }}>
          {initial}
        </div>
      </div>
    </header>
  );
}

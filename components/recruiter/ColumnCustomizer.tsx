"use client";
import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

const DARK = "#1C3829";
const MUTED = "#7A9E8E";
const BORDER = "rgba(28,56,41,0.12)";

export type ColumnDef = { key: string; label: string };

/** Persisted (localStorage) column-visibility state for a table. */
export function useColumnVisibility(storageKey: string, columns: ColumnDef[]) {
  const [visible, setVisible] = useState<Record<string, boolean>>(
    () => Object.fromEntries(columns.map((c) => [c.key, true]))
  );

  // Load saved prefs after mount (avoids SSR/hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, boolean>;
      setVisible((v) => {
        const next = { ...v };
        for (const c of columns) if (typeof saved[c.key] === "boolean") next[c.key] = saved[c.key];
        return next;
      });
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const toggle = (key: string) =>
    setVisible((v) => {
      const next = { ...v, [key]: !v[key] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });

  return { visible, toggle };
}

export function ColumnCustomizer({
  columns,
  visible,
  onToggle,
}: {
  columns: ColumnDef[];
  visible: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const shown = columns.filter((c) => visible[c.key]).length;

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: "11px 16px", fontSize: 13, fontWeight: 600, color: DARK,
          cursor: "pointer", boxShadow: "0 1px 4px rgba(28,56,41,0.05)", whiteSpace: "nowrap",
        }}
      >
        <SlidersHorizontal style={{ width: 14, height: 14, color: MUTED }} />
        Customise
        <span style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>· {shown}/{columns.length}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
            background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10,
            boxShadow: "0 12px 32px rgba(16,28,22,0.18)", padding: 8, width: 210, maxHeight: 340, overflowY: "auto",
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 8px 6px" }}>
            Show columns
          </p>
          {columns.map((c) => (
            <label
              key={c.key}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", borderRadius: 7, cursor: "pointer", fontSize: 13, color: DARK }}
              className="hover:bg-[#B8E04A]/10"
            >
              <input
                type="checkbox"
                checked={!!visible[c.key]}
                onChange={() => onToggle(c.key)}
                style={{ accentColor: DARK, width: 15, height: 15, cursor: "pointer" }}
              />
              {c.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

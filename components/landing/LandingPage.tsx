"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CharlieLogo from "@/components/CharlieLogo";

/* ── tokens ───────────────────────────────────────────────── */
const C = {
  bg:      "#F8F5EE",
  bgAlt:   "#F0EDE4",
  bgDeep:  "#EAE6DC",
  dark:    "#1C3829",
  mid:     "#3D6B54",
  muted:   "#7A9E8E",
  lime:    "#B8E04A",
  limeDk:  "#8AAD30",
  sidebar: "#172F22",
  white:   "#FFFFFF",
  border:  "rgba(28,56,41,0.1)",
  borderMd:"rgba(28,56,41,0.18)",
};

/* ── scroll reveal ────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("is-visible"); }),
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── nav ──────────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(248,245,238,0.92)" : C.bg,
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
      transition: "all 0.25s ease",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 60,
      }}>
        <CharlieLogo size="xl" color={C.dark} />

        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {[["Features", "#features"], ["How it works", "#how-it-works"], ["Pricing", "#pricing"]].map(([l, h]) => (
            <a key={l} href={h} style={{
              padding: "8px 16px", fontSize: 13.5, fontWeight: 500,
              color: C.mid, textDecoration: "none", borderRadius: 8,
              transition: "color 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = C.dark)}
              onMouseLeave={e => (e.currentTarget.style.color = C.mid)}>
              {l}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/auth/login" style={{
            padding: "8px 18px", fontSize: 13.5, fontWeight: 500,
            color: C.mid, textDecoration: "none", borderRadius: 8,
          }}>
            Sign in
          </Link>
          <Link href="/auth/login" style={{
            padding: "9px 22px", fontSize: 13.5, fontWeight: 700,
            background: C.dark, color: "#fff", textDecoration: "none",
            borderRadius: 100, display: "inline-flex", alignItems: "center", gap: 6,
            transition: "background 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = C.mid)}
            onMouseLeave={e => (e.currentTarget.style.background = C.dark)}>
            Get started
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ── hero ─────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ background: C.bg, paddingTop: 60 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 40px 0" }}>

        {/* Pill */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 100, padding: "5px 16px 5px 6px",
            boxShadow: "0 2px 12px rgba(28,56,41,0.07)",
          }}>
            <span style={{
              background: C.lime, color: C.dark,
              fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
              textTransform: "uppercase", borderRadius: 100, padding: "3px 10px",
            }}>New</span>
            <span style={{ fontSize: 13, color: C.mid, fontWeight: 500 }}>Role fit criteria · smarter candidate ranking</span>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(46px, 7.5vw, 84px)",
          fontWeight: 900, letterSpacing: "-4px",
          lineHeight: 1.0, textAlign: "center",
          color: C.dark, marginBottom: 24,
        }}>
          First round interviews,<br />
          <span style={{ position: "relative", display: "inline-block" }}>
            handled for you.
            <svg viewBox="0 0 520 20" style={{ position: "absolute", bottom: -4, left: 0, width: "100%", overflow: "visible", pointerEvents: "none" }} preserveAspectRatio="none">
              <path d="M5 14 Q85 5 175 12 Q285 19 390 11 Q450 7 515 14" stroke={C.lime} strokeWidth="5" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
        </h1>

        <p style={{
          fontSize: 17, color: C.mid, lineHeight: 1.85,
          textAlign: "center", maxWidth: 520, margin: "0 auto 40px",
        }}>
          Charlie talks to every candidate, scores how they did across five areas, checks them against what the role really needs, and hands you a ranked list. You never have to sit through another first screening call.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
          <Link href="/auth/login" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: C.dark, color: "#fff",
            padding: "14px 32px", borderRadius: 100,
            fontWeight: 700, fontSize: 15, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(28,56,41,0.22)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(28,56,41,0.28)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(28,56,41,0.22)"; }}>
            Get started free
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <a href="#how-it-works" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "transparent", color: C.dark,
            padding: "14px 28px", borderRadius: 100,
            fontWeight: 600, fontSize: 15, textDecoration: "none",
            border: `1.5px solid ${C.borderMd}`,
          }}>
            See how it works
          </a>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          background: C.sidebar, borderRadius: "20px 20px 0 0",
          overflow: "hidden",
        }}>
          {[
            { n: "24/7",  l: "Always available",   sub: "Works in every time zone" },
            { n: "< 60s", l: "Report after call",  sub: "Average analysis time"    },
            { n: "5",     l: "Scoring areas",      sub: "Communication and 4 more" },
            { n: "3+",    l: "Role fit criteria",  sub: "Checked and verified"     },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "28px 24px",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-1.5px", color: C.lime, lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginTop: 6 }}>{s.l}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── product preview ──────────────────────────────────────── */
function ProductPreview() {
  return (
    <section style={{ background: C.sidebar, paddingBottom: 72 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>

        <div style={{ padding: "60px 0 40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <div>
            <span style={{ display: "inline-block", background: `${C.lime}22`, border: `1px solid ${C.lime}44`, color: C.lime, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 100, padding: "3px 14px", marginBottom: 14 }}>The output</span>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 800, letterSpacing: "-1.5px", color: "#fff", lineHeight: 1.1 }}>
              Every interview turns into<br />a report you can act on
            </h2>
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.8, maxWidth: 300 }}>
            Transcribed, scored, and ranked automatically. By the time you open the report, the work is already done.
          </p>
        </div>

        {/* Mock window */}
        <div style={{
          background: "#0E1F16", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}>
          <div style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 18px", display: "flex", alignItems: "center", gap: 7 }}>
            {["#EF4444", "#F59E0B", "#10B981"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.7 }} />)}
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 5, padding: "3px 18px", fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                charlie.app / jobs / sales-head
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {/* Rankings */}
            <div style={{ padding: "24px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                Candidates · Sales Head · Ranked by criteria met
              </div>
              {[
                { rank: 1, name: "Priya Sharma", score: 8.6, met: "5/5", probe: null,                    sc: C.lime,    rc: "#B45309", rb: "rgba(180,83,9,0.12)"   },
                { rank: 2, name: "Arjun Mehta",  score: 7.4, met: "4/5", probe: "SaaS background",        sc: "#60A5FA", rc: "#1D4ED8", rb: "rgba(59,130,246,0.1)"  },
                { rank: 3, name: "Sneha Iyer",   score: 6.1, met: "3/5", probe: "Team size, CRM",          sc: "#FBBF24", rc: "#92400E", rb: "rgba(245,158,11,0.08)" },
                { rank: 4, name: "Rahul Kapoor", score: 5.2, met: "2/5", probe: "Quota, enterprise deals", sc: "#F87171", rc: "#991B1B", rb: "rgba(239,68,68,0.06)"  },
              ].map((c) => (
                <div key={c.rank} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, marginBottom: 6,
                  background: c.rank === 1 ? "rgba(184,224,74,0.07)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${c.rank === 1 ? "rgba(184,224,74,0.15)" : "rgba(255,255,255,0.05)"}`,
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: c.rb, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: c.rc }}>#{c.rank}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Criteria: {c.met}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: c.sc }}>{c.score}</div>
                    {c.probe
                      ? <div style={{ fontSize: 10, color: "#FBBF24" }}>Probe: {c.probe}</div>
                      : <div style={{ fontSize: 10, color: "#4ADE80" }}>All criteria met</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Role Fit */}
            <div style={{ padding: "24px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                Role Fit · Priya Sharma · Met 5 of 5
              </div>
              {[
                { t: "Has carried a revenue quota",       s: "met", q: "₹2.4Cr target for 3 years running"  },
                { t: "Comfortable with enterprise deals", s: "met", q: "Closed 8 accounts above ₹50L"       },
                { t: "Managed a team of 5+",              s: "met", q: "Led a team of 7 AEs at Infosys"     },
                { t: "CRM proficiency (Salesforce)",      s: "met", q: "Salesforce power user, 4 years"     },
                { t: "SaaS sales background",             s: "met", q: "Worked at 2 SaaS companies"         },
              ].map((item, i) => {
                const ic = { met: { sym: "✓", col: "#4ADE80", bg: "rgba(74,222,128,0.08)", bdr: "rgba(74,222,128,0.18)" }, unmet: { sym: "✗", col: "#F87171", bg: "rgba(248,113,113,0.08)", bdr: "rgba(248,113,113,0.18)" }, unconfirmed: { sym: "?", col: "#FBBF24", bg: "rgba(251,191,36,0.08)", bdr: "rgba(251,191,36,0.18)" } }[item.s as "met" | "unmet" | "unconfirmed"] ?? { sym: "?", col: "#FBBF24", bg: "rgba(251,191,36,0.08)", bdr: "rgba(251,191,36,0.18)" };
                return (
                  <div key={i} style={{ background: ic.bg, border: `1px solid ${ic.bdr}`, borderRadius: 9, padding: "8px 11px", marginBottom: 6 }}>
                    <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                      <span style={{ color: ic.col, fontWeight: 800, fontSize: 11, flexShrink: 0, marginTop: 1 }}>{ic.sym}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{item.t}</div>
                        {item.q && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 2, fontStyle: "italic" }}>&ldquo;{item.q}&rdquo;</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── how it works ─────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Create a job",     desc: "Set up the role, add a few role fit criteria (like \"has carried a quota\"), list the key skills, and write the questions you want Charlie to ask.", icon: "📋" },
    { n: "02", title: "Invite candidates", desc: "Add your candidates and send each one a private link. They take the interview whenever it suits them, on any device.",                            icon: "🔗" },
    { n: "03", title: "Get your shortlist", desc: "Get scored reports with full transcripts, a verdict on every criterion, and a ranked shortlist of everyone. Usually in under a minute.",           icon: "🏆" },
  ];
  return (
    <section id="how-it-works" style={{ background: C.bgAlt, padding: "80px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div data-reveal style={{ textAlign: "center", marginBottom: 52 }}>
          <span style={{ display: "inline-block", background: `${C.lime}35`, border: `1px solid ${C.lime}70`, color: C.dark, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 100, padding: "3px 14px", marginBottom: 14 }}>How it works</span>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-1.5px", color: C.dark, lineHeight: 1.1 }}>
            From job post to ranked shortlist<br />in three steps
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, position: "relative" }}>
          <div style={{ position: "absolute", top: 46, left: "18%", right: "18%", height: 1, background: `linear-gradient(90deg, transparent, ${C.borderMd} 20%, ${C.borderMd} 80%, transparent)`, zIndex: 0 }} />
          {steps.map((s, i) => (
            <div key={i} data-reveal data-delay={String(i * 150)} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 18, padding: "32px 28px", position: "relative", zIndex: 1, boxShadow: "0 2px 16px rgba(28,56,41,0.05)" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: i === 0 ? C.dark : C.bgAlt, border: `2px solid ${i === 0 ? C.dark : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: i === 0 ? C.lime : C.muted, marginBottom: 24, marginLeft: "auto", marginRight: "auto", boxShadow: i === 0 ? `0 0 0 6px ${C.lime}20` : "none" }}>{s.n}</div>
              <div style={{ textAlign: "center", fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 10, textAlign: "center" }}>{s.title}</h3>
              <p style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.8, textAlign: "center" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── features ─────────────────────────────────────────────── */
function Features() {
  return (
    <section id="features" style={{ background: C.bg, padding: "80px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div data-reveal style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 44, flexWrap: "wrap", gap: 24 }}>
          <div>
            <span style={{ display: "inline-block", background: `${C.lime}35`, border: `1px solid ${C.lime}70`, color: C.dark, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 100, padding: "3px 14px", marginBottom: 14 }}>Features</span>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-1.5px", color: C.dark, lineHeight: 1.1 }}>Everything in one place</h2>
          </div>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, maxWidth: 360 }}>From the first invite to your final shortlist, Charlie runs the whole first round of screening for you.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Big card */}
          <div data-reveal style={{ gridRow: "span 2", background: C.dark, borderRadius: 18, padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 340 }}>
            <div>
              <div style={{ fontSize: 32, marginBottom: 20 }}>🎙️</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 12, letterSpacing: "-0.5px" }}>AI Voice Interviews</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.85, maxWidth: 320 }}>
                Charlie runs the interview itself, and it feels natural and conversational. Every candidate gets the same fair conversation, even when you have a hundred of them to get through.
              </p>
            </div>
            <div style={{ marginTop: 32, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Voice AI", "Auto-transcript", "24/7 available", "Any device"].map(t => (
                <span key={t} style={{ fontSize: 11, fontWeight: 600, color: C.lime, background: `${C.lime}15`, border: `1px solid ${C.lime}30`, borderRadius: 100, padding: "3px 10px" }}>{t}</span>
              ))}
            </div>
          </div>

          {[
            { icon: "✓",  title: "Role Fit Criteria",   desc: "List the facts that matter for the role. Charlie checks each one against what the candidate actually said, so there is no guessing.", color: "#60A5FA" },
            { icon: "#",  title: "Candidate Ranking",   desc: "When several people apply for the same role, Charlie ranks them for you, in an order that stays consistent and is easy to explain.", color: "#A78BFA" },
            { icon: "📊", title: "Scored on five things", desc: "Communication, composure, professionalism, seriousness, and reliability, each backed by real quotes from the interview.", color: "#34D399" },
            { icon: "⚡", title: "Screen at Scale",     desc: "Run ten interviews or two hundred at once. Charlie never gets tired, never plays favourites, and never has an off day.", color: "#FBBF24" },
          ].map((f, i) => (
            <div key={i} data-reveal data-delay={String((i + 1) * 100)} className="bento-card" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 18, padding: "26px 28px", boxShadow: "0 2px 12px rgba(28,56,41,0.05)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, marginBottom: 14, background: `${f.color}15`, border: `1px solid ${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: f.color }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: C.mid, lineHeight: 1.8 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div data-reveal data-delay="100" style={{ marginTop: 14, background: C.bgDeep, border: `1px solid ${C.border}`, borderRadius: 18, padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 24 }}>🔒</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>Private and secure by design</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Your candidate data stays in your own Supabase database, protected by row level security. Nothing ever leaves for anywhere else.</div>
            </div>
          </div>
          <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: C.dark, background: C.lime, borderRadius: 100, padding: "9px 22px", textDecoration: "none" }}>
            Start for free →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── testimonials ─────────────────────────────────────────── */
function Testimonials() {
  const quotes = [
    { text: "What stood out the most was how conversational and human it felt. Rather than feeling automated, Charlie held meaningful screening conversations that helped us gather the candidate insights we needed.", author: "Mechispike", role: "Recruiting Team" },
    { text: "One challenge we kept running into during onboarding and volunteer screening was finding a process that felt structured without losing the human side of a real conversation. Charlie fixes exactly that.", author: "Dhara", role: "Operations Lead" },
  ];
  return (
    <section style={{ background: C.bgAlt, padding: "80px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div data-reveal style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ display: "inline-block", background: `${C.lime}35`, border: `1px solid ${C.lime}70`, color: C.dark, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 100, padding: "3px 14px", marginBottom: 14 }}>What people say</span>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-1.2px", color: C.dark, lineHeight: 1.2 }}>Real recruiters, real results</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {quotes.map((q, i) => (
            <div key={i} data-reveal data-delay={String(i * 150)} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 18, padding: "36px 32px", boxShadow: "0 4px 24px rgba(28,56,41,0.06)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: C.lime, borderRadius: "18px 0 0 18px" }} />
              <div style={{ fontSize: 52, lineHeight: 1, color: `${C.lime}60`, fontFamily: "Georgia, serif", fontWeight: 900, marginBottom: 4, marginLeft: -2 }}>&ldquo;</div>
              <p style={{ fontSize: 15, color: C.dark, lineHeight: 1.8, marginBottom: 28, fontStyle: "italic" }}>{q.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: C.lime, flexShrink: 0 }}>{q.author[0]}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{q.author}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{q.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── pricing ──────────────────────────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: "Pilot", price: "₹16,000", mins: "1,200 min", interviews: "~100 interviews",
      desc: "For teams just getting started with AI screening.",
      features: ["Voice AI interviews", "Scoring reports across five areas", "Role fit criteria for every job", "Candidate ranking", "Full transcripts", "Email support"],
      highlight: false,
    },
    {
      name: "Growth", price: "₹32,000", mins: "2,500 min", interviews: "~208 interviews",
      desc: "For teams actively hiring across multiple roles.",
      features: ["Everything in Pilot", "Priority support", "Custom screening questions", "Bulk invite tools", "Export reports (PDF)", "Dedicated onboarding call"],
      highlight: true,
    },
    {
      name: "Scale", price: "₹60,000", mins: "4,000 min", interviews: "~333 interviews",
      desc: "For high volume teams that need to move fast.",
      features: ["Everything in Growth", "Dedicated account manager", "Custom integrations", "Advanced analytics", "SLA guarantee", "Personal setup help"],
      highlight: false,
    },
  ];

  return (
    <section id="pricing" style={{ background: C.bg, padding: "80px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div data-reveal style={{ textAlign: "center", marginBottom: 52 }}>
          <span style={{ display: "inline-block", background: `${C.lime}35`, border: `1px solid ${C.lime}70`, color: C.dark, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 100, padding: "3px 14px", marginBottom: 14 }}>Pricing</span>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-1.5px", color: C.dark, lineHeight: 1.1 }}>Pay for minutes, not seats</h2>
          <p style={{ fontSize: 15, color: C.muted, marginTop: 12, lineHeight: 1.8 }}>Each plan includes a monthly bank of interview minutes. All prices in INR.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, alignItems: "start" }}>
          {plans.map((p, i) => (
            <div key={i} data-reveal data-delay={String(i * 120)} style={{
              background: p.highlight ? C.dark : C.white,
              border: `2px solid ${p.highlight ? C.dark : C.border}`,
              borderRadius: 20, padding: "36px 30px",
              position: "relative", overflow: "hidden",
              boxShadow: p.highlight ? "0 16px 48px rgba(28,56,41,0.2)" : "0 2px 16px rgba(28,56,41,0.05)",
              transform: p.highlight ? "scale(1.025)" : "scale(1)",
            }}>
              {p.highlight && (
                <div style={{ position: "absolute", top: 18, right: 18 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, background: C.lime, color: C.dark, borderRadius: 100, padding: "3px 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Most popular</span>
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 700, color: p.highlight ? "rgba(255,255,255,0.55)" : C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 10 }}>
                <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-2px", color: p.highlight ? "#fff" : C.dark }}>{p.price}</span>
                <span style={{ fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.45)" : C.muted }}>/month</span>
              </div>

              <div style={{ background: p.highlight ? "rgba(255,255,255,0.08)" : C.bgAlt, borderRadius: 10, padding: "10px 14px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: p.highlight ? "#fff" : C.dark }}>{p.mins}</span>
                <span style={{ fontSize: 12, color: p.highlight ? "rgba(255,255,255,0.5)" : C.muted }}>{p.interviews}</span>
              </div>

              <p style={{ fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.5)" : C.mid, lineHeight: 1.7, marginBottom: 20 }}>{p.desc}</p>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 9 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.75)" : C.mid }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, background: p.highlight ? `${C.lime}25` : `${C.lime}30`, border: `1px solid ${p.highlight ? `${C.lime}45` : `${C.lime}50`}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: p.highlight ? C.lime : C.limeDk }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/auth/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, fontSize: 14, textDecoration: "none", borderRadius: 100, padding: "12px 0", background: p.highlight ? C.lime : C.dark, color: p.highlight ? C.dark : "#fff", transition: "opacity 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                Get started →
              </Link>
            </div>
          ))}
        </div>

        <div data-reveal style={{ textAlign: "center", marginTop: 32 }}>
          <p style={{ fontSize: 13, color: C.muted }}>
            Not sure which plan fits? Email us at{" "}
            <a href="mailto:getcharlie.ai@gmail.com" style={{ color: C.mid, fontWeight: 600, textDecoration: "none", borderBottom: `1px solid ${C.border}` }}>getcharlie.ai@gmail.com</a>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── cta ──────────────────────────────────────────────────── */
function CTA() {
  return (
    <section style={{ background: C.bgAlt, padding: "72px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div data-reveal style={{ background: C.dark, borderRadius: 24, padding: "64px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 32 }}>
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, letterSpacing: "-2px", color: "#fff", lineHeight: 1.1, marginBottom: 14 }}>Ready to screen smarter?</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>
              Free to start. No credit card required. Have questions?{" "}
              <a href="mailto:getcharlie.ai@gmail.com" style={{ color: C.lime, textDecoration: "none" }}>getcharlie.ai@gmail.com</a>
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.lime, color: C.dark, padding: "15px 36px", borderRadius: 100, fontWeight: 800, fontSize: 15, textDecoration: "none" }}>
              Start for free →
            </Link>
            <a href="mailto:getcharlie.ai@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", padding: "15px 28px", borderRadius: 100, fontWeight: 600, fontSize: 15, textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)" }}>
              Contact us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── footer ───────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: C.bg, borderTop: `1px solid ${C.border}`, padding: "32px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <CharlieLogo size="md" color={C.dark} />
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[["Features", "#features"], ["How it works", "#how-it-works"], ["Pricing", "#pricing"], ["Contact", "mailto:getcharlie.ai@gmail.com"]].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 12.5, color: C.muted, textDecoration: "none" }}>{l}</a>
          ))}
        </div>
        <span style={{ fontSize: 12, color: C.muted }}>© 2026 Charlie · AI Recruitment Screening</span>
      </div>
    </footer>
  );
}

/* ── export ───────────────────────────────────────────────── */
export default function LandingPage() {
  useScrollReveal();
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Nav />
      <Hero />
      <ProductPreview />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

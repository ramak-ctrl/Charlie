"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Send, Plus, Trash2, Loader2, CheckCircle2, Search } from "lucide-react";
import { DEFAULT_COVERAGE } from "@/lib/voicePrompt";

interface CandidateRow {
  name: string;
  email: string;
  phone: string;
}

interface Props {
  jobId: string;
  jobTitle: string;
  jobCoverage?: string[];
}

const COVERAGE_OPTIONS: { key: string; label: string }[] = [
  { key: "screening_questions", label: "Screening Questions" },
  { key: "technical", label: "Technical Screening" },
  { key: "behavioural", label: "Behavioural Screening" },
  { key: "company_briefing", label: "Briefing on the Company" },
];

export default function SendInviteModal({ jobId, jobTitle, jobCoverage }: Props) {
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<CandidateRow[]>([{ name: "", email: "", phone: "" }]);
  const [coverage, setCoverage] = useState<string[]>(jobCoverage?.length ? jobCoverage : DEFAULT_COVERAGE);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ email: string; success: boolean; error?: string; interviewLink?: string; emailSent?: boolean; emailError?: string }[] | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // ── Candidate search (existing candidates) ──
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ name: string; email: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch matches (or recent candidates when the query is empty) whenever the
  // dropdown is open.
  useEffect(() => {
    if (!searchOpen) return;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/candidates/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSearchResults(data.results ?? []);
      } catch { /* ignore */ } finally { setSearching(false); }
    }, 200);
    return () => clearTimeout(t);
  }, [query, searchOpen]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function addRow() {
    setCandidates([...candidates, { name: "", email: "", phone: "" }]);
  }

  function addFromSearch(r: { name: string; email: string }) {
    setCandidates((rows) => {
      if (rows.some((c) => c.email.toLowerCase() === r.email.toLowerCase())) return rows; // already added
      // Fill the first empty row, else append.
      const emptyIdx = rows.findIndex((c) => !c.name && !c.email);
      const next = [...rows];
      if (emptyIdx >= 0) next[emptyIdx] = { name: r.name, email: r.email, phone: "" };
      else next.push({ name: r.name, email: r.email, phone: "" });
      return next;
    });
    setQuery("");
    setSearchOpen(false);
  }

  function updateRow(i: number, field: keyof CandidateRow, value: string) {
    setCandidates(candidates.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }

  function removeRow(i: number) {
    if (candidates.length === 1) return;
    setCandidates(candidates.filter((_, idx) => idx !== i));
  }

  function toggleCoverage(key: string) {
    setCoverage((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]));
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text");
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length <= 1) return;
    e.preventDefault();
    const parsed = lines.map((line) => {
      const parts = line.split(/[\t,]/).map((s) => s.trim());
      return { name: parts[0] ?? "", email: parts[1] ?? "", phone: parts[2] ?? "" };
    });
    setCandidates(parsed);
  }

  async function handleSend() {
    const valid = candidates.filter((c) => c.name && c.email);
    if (valid.length === 0) {
      toast({ title: "Add at least one candidate", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: valid, coverage }),
      });
      const data = await res.json();
      setResults(data.results);
      router.refresh();
    } catch (err) {
      toast({ title: "Failed to send invites", description: String(err), variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setCandidates([{ name: "", email: "", phone: "" }]);
      setCoverage(jobCoverage?.length ? jobCoverage : DEFAULT_COVERAGE);
      setQuery("");
      setResults(null);
    }, 300);
  }

  const successCount = results?.filter((r) => r.success).length ?? 0;

  return (
    <>
      <Button onClick={() => setOpen(true)} aria-label="Invite candidates">
        <Send className="h-4 w-4 mr-2" />
        Invite Candidates
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invite Candidates</DialogTitle>
            <DialogDescription>
              Send interview links for <strong>{jobTitle}</strong>. Search existing candidates, paste a CSV (name, email, phone), or enter manually.
            </DialogDescription>
          </DialogHeader>

          {results ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-4 py-3">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{successCount} of {results.length} candidates added successfully</span>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {results.map((r) => (
                  <div key={r.email} className={`rounded-lg border px-4 py-3 ${r.success ? "bg-muted/40 border-border/60" : "bg-rose-500/10 border-rose-500/20"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${r.success ? "text-foreground" : "text-rose-400"}`}>{r.email}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        !r.success ? "text-rose-400 bg-rose-500/10 border-rose-500/20" :
                        r.emailSent ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                        "text-amber-400 bg-amber-500/10 border-amber-500/20"
                      }`}>
                        {r.success ? (r.emailSent ? "✓ Email sent" : "Link ready") : r.error ?? "Failed"}
                      </span>
                    </div>
                    {r.success && r.interviewLink && (
                      <div className="mt-1">
                        {!r.emailSent && (
                          <p className="text-xs text-amber-500 mb-1.5">Share this interview link with the candidate:</p>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            value={r.interviewLink}
                            className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 text-muted-foreground font-mono truncate"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            aria-label="Interview link"
                          />
                          <button
                            onClick={() => navigator.clipboard.writeText(r.interviewLink!)}
                            className="text-xs px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary/20 shrink-0 font-medium"
                            aria-label="Copy link"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4" onPaste={handlePaste}>
              {/* Candidate search */}
              <div ref={searchRef} className="relative">
                <div className="flex items-center gap-2 rounded-lg border border-[#1C3829]/12 px-3 bg-white">
                  <Search className="h-4 w-4 text-[#7A9E8E] shrink-0" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search candidates to add…"
                    className="flex-1 py-2.5 text-sm bg-transparent outline-none text-[#1C3829] placeholder:text-[#7A9E8E]/70"
                    aria-label="Search existing candidates"
                  />
                </div>
                {searchOpen && (() => {
                  const added = new Set(candidates.map((c) => c.email.toLowerCase()));
                  const available = searchResults.filter((r) => !added.has(r.email.toLowerCase()));
                  return (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-lg border border-[#1C3829]/12 bg-white shadow-lg max-h-60 overflow-y-auto py-1">
                      {searching ? (
                        <div className="px-3 py-3 text-sm text-[#7A9E8E]">Searching…</div>
                      ) : available.length > 0 ? (
                        available.map((r) => (
                          <button
                            key={r.email}
                            type="button"
                            onClick={() => addFromSearch(r)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[#B8E04A]/10"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-[#1C3829] truncate">{r.name}</span>
                              <span className="block text-xs text-[#7A9E8E] truncate">{r.email}</span>
                            </span>
                            <Plus className="h-4 w-4 text-[#3D6B54] shrink-0" />
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm text-[#7A9E8E]">
                          {query.trim() ? "No matching candidates — add manually below." : "No saved candidates yet — add manually below."}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Rows — one per candidate */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#1C3829] px-1">
                  Candidates to invite ({candidates.filter((c) => c.name || c.email).length})
                </p>
                <div className="grid grid-cols-[1fr_1fr_130px_32px] gap-2 text-xs text-gray-500 font-medium px-1">
                  <span>Name *</span><span>Email *</span><span>Phone</span><span></span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {candidates.map((c, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_130px_32px] gap-2 items-center">
                      <Input value={c.name} onChange={(e) => updateRow(i, "name", e.target.value)} placeholder="Full name" aria-label={`Candidate ${i + 1} name`} />
                      <Input type="email" value={c.email} onChange={(e) => updateRow(i, "email", e.target.value)} placeholder="email@example.com" aria-label={`Candidate ${i + 1} email`} />
                      <Input value={c.phone} onChange={(e) => updateRow(i, "phone", e.target.value)} placeholder="+91 ..." aria-label={`Candidate ${i + 1} phone`} />
                      <button type="button" onClick={() => removeRow(i)} disabled={candidates.length === 1} aria-label={`Remove candidate ${i + 1}`} className="text-gray-300 hover:text-rose-500 disabled:opacity-30 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={addRow} aria-label="Add another candidate">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add row
                </Button>
              </div>

              {/* Interview coverage */}
              <div className="rounded-lg border border-[#1C3829]/12 p-3">
                <p className="text-xs font-semibold text-[#1C3829] mb-1">Voice interview coverage</p>
                <p className="text-xs text-[#7A9E8E] mb-2.5">What Charlie covers in these interviews.</p>
                <div className="grid grid-cols-2 gap-2">
                  {COVERAGE_OPTIONS.map((opt) => {
                    const checked = coverage.includes(opt.key);
                    return (
                      <label key={opt.key} className={`flex items-center gap-2 rounded-md border px-2.5 py-2 cursor-pointer text-sm ${checked ? "border-[#3D6B54] bg-[#B8E04A]/10 text-[#1C3829]" : "border-[#1C3829]/12 text-[#3D6B54]"}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCoverage(opt.key)} className="h-4 w-4" style={{ accentColor: "#1C3829" }} />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {results ? "Close" : "Cancel"}
            </Button>
            {!results && (
              <Button onClick={handleSend} disabled={sending}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invites
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

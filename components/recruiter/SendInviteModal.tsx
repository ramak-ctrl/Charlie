"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Send, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";

interface CandidateRow {
  name: string;
  email: string;
  phone: string;
}

interface Props {
  jobId: string;
  jobTitle: string;
}

export default function SendInviteModal({ jobId, jobTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<CandidateRow[]>([{ name: "", email: "", phone: "" }]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ email: string; success: boolean; error?: string; interviewLink?: string; emailSent?: boolean }[] | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  function addRow() {
    setCandidates([...candidates, { name: "", email: "", phone: "" }]);
  }

  function updateRow(i: number, field: keyof CandidateRow, value: string) {
    setCandidates(candidates.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }

  function removeRow(i: number) {
    if (candidates.length === 1) return;
    setCandidates(candidates.filter((_, idx) => idx !== i));
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
        body: JSON.stringify({ candidates: valid }),
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite Candidates</DialogTitle>
            <DialogDescription>
              Send interview links for <strong>{jobTitle}</strong>. Paste a CSV (name, email, phone) or enter manually.
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
                        {r.success ? (r.emailSent ? "✓ Email sent" : "⚠ Email failed") : r.error ?? "Failed"}
                      </span>
                    </div>
                    {r.success && r.interviewLink && (
                      <div className="mt-1">
                        {!r.emailSent && (
                          <p className="text-xs text-amber-400 mb-1.5">Email could not be sent — share this link manually:</p>
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
            <div className="space-y-3" onPaste={handlePaste}>
              <div className="grid grid-cols-[1fr_1fr_130px_32px] gap-2 text-xs text-gray-500 font-medium px-1">
                <span>Name *</span><span>Email *</span><span>Phone</span><span></span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {candidates.map((c, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_130px_32px] gap-2 items-center">
                    <Input
                      value={c.name}
                      onChange={(e) => updateRow(i, "name", e.target.value)}
                      placeholder="Full name"
                      aria-label={`Candidate ${i + 1} name`}
                    />
                    <Input
                      type="email"
                      value={c.email}
                      onChange={(e) => updateRow(i, "email", e.target.value)}
                      placeholder="email@example.com"
                      aria-label={`Candidate ${i + 1} email`}
                    />
                    <Input
                      value={c.phone}
                      onChange={(e) => updateRow(i, "phone", e.target.value)}
                      placeholder="+91 ..."
                      aria-label={`Candidate ${i + 1} phone`}
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      disabled={candidates.length === 1}
                      aria-label={`Remove candidate ${i + 1}`}
                      className="text-gray-300 hover:text-rose-500 disabled:opacity-30 transition-colors"
                    >
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

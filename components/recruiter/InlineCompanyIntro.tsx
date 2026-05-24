"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  jobId: string;
  initial: string;
}

export default function InlineCompanyIntro({ jobId, initial }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(value);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_intro: draft }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setValue(draft);
      setEditing(false);
      router.refresh();
      toast({ title: "Company introduction updated" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Introduction</h3>
        {!editing && (
          <button
            onClick={startEdit}
            aria-label="Edit company introduction"
            className="text-muted-foreground/50 hover:text-primary transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder="Describe your company — mission, culture, what makes it a great place to work. Charlie reads this aloud during the interview opening."
            className="w-full text-sm rounded-lg border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md font-medium disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startEdit}
          className="w-full text-left"
          aria-label="Click to edit company introduction"
        >
          {value ? (
            <p className="text-sm text-muted-foreground leading-relaxed">{value}</p>
          ) : (
            <p className="text-sm text-muted-foreground/40 italic">
              Click to add a company introduction — Charlie reads this aloud at the start of every interview.
            </p>
          )}
        </button>
      )}
    </div>
  );
}

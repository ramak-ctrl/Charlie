"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import ScreeningQuestionsEditor from "./ScreeningQuestionsEditor";
import { ChevronDown, ChevronRight, Plus, X, Loader2 } from "lucide-react";
import { DEFAULT_SCREENING_QUESTIONS } from "@/lib/utils";
import type { Job, ScreeningQuestion } from "@/lib/types";

const DARK   = "#1C3829";
const MID    = "#3D6B54";
const MUTED  = "#7A9E8E";
const LIME   = "#B8E04A";
const BORDER = "rgba(28,56,41,0.1)";

const schema = z.object({
  title:          z.string().min(1, "Job title is required").max(200),
  job_type:       z.enum(["C2H", "FTE", "D2H"]).default("FTE"),
  status:         z.enum(["draft", "active", "paused", "closed"]).default("draft"),
  experience_min: z.number({ invalid_type_error: "Enter a number" }).int().min(0).max(30).optional(),
  experience_max: z.number({ invalid_type_error: "Enter a number" }).int().min(0).max(30).optional(),
  notice_period:  z.string().optional(),
  positions:      z.number().int().min(1).max(999).default(1),
  location:       z.string().optional(),
  priority:       z.enum(["P0", "P1", "P2", "P3"]).default("P2"),
  expiry_date:    z.string().optional(),
  description:    z.string().optional(),
  company_intro:  z.string().optional(),
  key_skills:     z.array(z.string()).default([]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  job?: Job & { screening_questions?: ScreeningQuestion[] };
}

const NOTICE_OPTS = ["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "90 Days"];
const PRIORITY_OPTS = [
  { value: "P0", label: "P0 — Critical" },
  { value: "P1", label: "P1 — High" },
  { value: "P2", label: "P2 — Medium" },
  { value: "P3", label: "P3 — Low" },
];
const PRIORITY_COLORS: Record<string, string> = {
  P0: "#DC2626", P1: "#D97706", P2: "#6366F1", P3: "#7A9E8E",
};

export default function JobForm({ job }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!job;

  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(job?.key_skills ?? []);
  const [questions, setQuestions] = useState<Omit<ScreeningQuestion, "id" | "job_id" | "created_at">[]>(
    job?.screening_questions
      ? job.screening_questions
          .sort((a, b) => a.order_index - b.order_index)
          .map(({ id: _id, job_id: _jid, created_at: _ca, ...q }) => q)
      : DEFAULT_SCREENING_QUESTIONS
  );
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState([0, 1, 2, 3]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:          job?.title ?? "",
      job_type:       (job?.job_type as FormData["job_type"]) ?? "FTE",
      status:         (job?.status as FormData["status"]) ?? "draft",
      experience_min: job?.experience_min ?? undefined,
      experience_max: job?.experience_max ?? undefined,
      notice_period:  job?.notice_period ?? "",
      positions:      job?.positions ?? 1,
      location:       job?.location ?? "",
      priority:       (job?.priority as FormData["priority"]) ?? "P2",
      expiry_date:    job?.expiry_date?.slice(0, 10) ?? "",
      description:    job?.description ?? "",
      company_intro:  job?.company_intro ?? "",
    },
  });

  const priority = watch("priority");

  function toggleSection(i: number) {
    setOpen(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillInput("");
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        key_skills: skills,
        screening_questions: questions,
        expiry_date: data.expiry_date || null,
        notice_period: data.notice_period || null,
        location: data.location || null,
      };
      const url    = isEditing ? `/api/jobs/${job!.id}` : "/api/jobs";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save job");
      }

      const saved = await res.json();
      toast({ title: isEditing ? "Job updated" : "Job created", description: saved.title });
      router.push(`/jobs/${saved.id}`);
      router.refresh();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Section 1: Job Details ── */}
      <Section title="Job Details" index={0} open={open.includes(0)} onToggle={toggleSection}>
        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <Label text="Job Title" required />
          <input
            {...register("title")}
            placeholder="e.g. Senior Software Engineer"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = DARK)}
            onBlur={e => (e.target.style.borderColor = BORDER)}
          />
          {errors.title && <Err msg={errors.title.message!} />}
        </div>

        {/* Row: Job Type + Status */}
        <div style={grid2}>
          <div>
            <Label text="Job Type" required />
            <select {...register("job_type")} style={selectStyle}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}>
              <option value="FTE">FTE — Full Time</option>
              <option value="C2H">C2H — Contract to Hire</option>
              <option value="D2H">D2H — Direct Hire</option>
            </select>
          </div>
          <div>
            <Label text="Status" required />
            <select {...register("status")} style={selectStyle}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Row: Experience */}
        <div style={grid2}>
          <div>
            <Label text="Experience Min (yrs)" />
            <input
              type="number" min={0} max={30}
              {...register("experience_min", { valueAsNumber: true })}
              placeholder="0"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>
          <div>
            <Label text="Experience Max (yrs)" />
            <input
              type="number" min={0} max={30}
              {...register("experience_max", { valueAsNumber: true })}
              placeholder="5"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>
        </div>

        {/* Row: Notice Period + Positions */}
        <div style={grid2}>
          <div>
            <Label text="Expected Notice Period" />
            <select {...register("notice_period")} style={selectStyle}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}>
              <option value="">— Select —</option>
              {NOTICE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <Label text="No. of Positions" required />
            <input
              type="number" min={1} max={999}
              {...register("positions", { valueAsNumber: true })}
              placeholder="1"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
            {errors.positions && <Err msg={errors.positions.message!} />}
          </div>
        </div>

        {/* Row: Location + Priority */}
        <div style={grid2}>
          <div>
            <Label text="Location" />
            <input
              {...register("location")}
              placeholder="e.g. Bengaluru, Remote"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>
          <div>
            <Label text="Priority" required />
            <div style={{ position: "relative" }}>
              <select {...register("priority")} style={{ ...selectStyle, paddingLeft: 36 }}
                onFocus={e => (e.target.style.borderColor = DARK)}
                onBlur={e => (e.target.style.borderColor = BORDER)}>
                {PRIORITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                width: 10, height: 10, borderRadius: "50%",
                background: PRIORITY_COLORS[priority] ?? "#7A9E8E",
                pointerEvents: "none",
              }} />
            </div>
          </div>
        </div>

        {/* Expiry Date */}
        <div style={{ maxWidth: "50%", paddingRight: 8 }}>
          <Label text="Expiry Date" />
          <input
            type="date"
            {...register("expiry_date")}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = DARK)}
            onBlur={e => (e.target.style.borderColor = BORDER)}
          />
        </div>
      </Section>

      {/* ── Section 2: Description & Company ── */}
      <Section title="Description & Company" index={1} open={open.includes(1)} onToggle={toggleSection}>
        <div style={{ marginBottom: 14 }}>
          <Label text="Job Description" />
          <textarea
            {...register("description")}
            rows={5}
            placeholder="Describe the role, responsibilities, and requirements..."
            style={{ ...inputStyle, height: "auto", resize: "vertical" }}
            onFocus={e => (e.target.style.borderColor = DARK)}
            onBlur={e => (e.target.style.borderColor = BORDER)}
          />
        </div>
        <div>
          <Label text="Company Introduction" />
          <textarea
            {...register("company_intro")}
            rows={3}
            placeholder="What Charlie will tell candidates at the start of the interview..."
            style={{ ...inputStyle, height: "auto", resize: "vertical" }}
            onFocus={e => (e.target.style.borderColor = DARK)}
            onBlur={e => (e.target.style.borderColor = BORDER)}
          />
          <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
            Read aloud by Charlie at interview start.
          </p>
        </div>
      </Section>

      {/* ── Section 3: Key Skills ── */}
      <Section title="Key Skills" index={2} open={open.includes(2)} onToggle={toggleSection}>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>
          Candidates self-rate each skill on a 1–5 scale during the interview.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            placeholder="e.g. React, TypeScript, Node.js"
            style={{ ...inputStyle, flex: 1 }}
            onFocus={e => (e.target.style.borderColor = DARK)}
            onBlur={e => (e.target.style.borderColor = BORDER)}
            aria-label="Add skill"
          />
          <button
            type="button"
            onClick={addSkill}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 42, height: 42, borderRadius: 10,
              background: DARK, color: "#fff",
              border: "none", cursor: "pointer", flexShrink: 0,
            }}
            aria-label="Add skill"
          >
            <Plus style={{ width: 16, height: 16 }} />
          </button>
        </div>
        {skills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {skills.map(s => (
              <div key={s} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(28,56,41,0.07)", color: MID,
                padding: "5px 12px", borderRadius: 99,
                border: "1px solid rgba(28,56,41,0.14)",
                fontSize: 13, fontWeight: 500,
              }}>
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => setSkills(skills.filter(x => x !== s))}
                  aria-label={`Remove ${s}`}
                  style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 0, display: "flex" }}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Section 4: Screening Questions ── */}
      <Section title="Screening Questions" index={3} open={open.includes(3)} onToggle={toggleSection}>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 14 }}>
          Questions asked by Charlie during the screening call. Reorder, edit, add, or remove as needed.
        </p>
        <ScreeningQuestionsEditor questions={questions} onChange={setQuestions} />
      </Section>

      {/* ── Actions ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: "10px 20px", borderRadius: 100, border: `1px solid ${BORDER}`,
            background: "#fff", color: MID, fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 24px", borderRadius: 100,
            background: submitting ? MID : DARK, color: "#fff",
            fontWeight: 700, fontSize: 14, border: "none", cursor: submitting ? "not-allowed" : "pointer",
            boxShadow: "0 4px 16px rgba(28,56,41,0.25)",
          }}
        >
          {submitting && <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />}
          {isEditing ? "Save Changes" : "Create Job"}
        </button>
      </div>
    </form>
  );
}

/* ── Sub-components ── */

function Section({
  title, index, open, onToggle, children,
}: {
  title: string; index: number; open: boolean;
  onToggle: (i: number) => void; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${BORDER}`,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 1px 6px rgba(28,56,41,0.05)",
    }}>
      <button
        type="button"
        onClick={() => onToggle(index)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "14px 20px",
          background: "none", border: "none", cursor: "pointer",
          borderBottom: open ? `1px solid ${BORDER}` : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6,
            background: "rgba(28,56,41,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: DARK,
          }}>
            {index + 1}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{title}</span>
        </div>
        {open
          ? <ChevronDown style={{ width: 16, height: 16, color: MUTED }} />
          : <ChevronRight style={{ width: 16, height: 16, color: MUTED }} />
        }
      </button>
      {open && (
        <div style={{ padding: "20px 20px 16px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: DARK, marginBottom: 6, opacity: 0.8 }}>
      {text}
      {required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
    </label>
  );
}

function Err({ msg }: { msg: string }) {
  return <p style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>{msg}</p>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "#fff",
  border: `1px solid ${BORDER}`,
  borderRadius: 10, fontSize: 14, color: DARK,
  outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A9E8E' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 32,
};

const grid2: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14,
};

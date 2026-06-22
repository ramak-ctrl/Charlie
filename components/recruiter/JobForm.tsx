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
const BORDER = "rgba(28,56,41,0.1)";

const schema = z.object({
  title:                z.string().min(1, "Job title is required").max(200),
  job_type:             z.enum(["C2H", "FTE", "D2H"]).default("FTE"),
  status:               z.enum(["draft", "active", "paused", "closed"]).default("draft"),
  client:               z.string().optional(),
  category:             z.string().optional(),
  experience_min:       z.number({ invalid_type_error: "Enter a number" }).int().min(0).max(30).optional(),
  experience_max:       z.number({ invalid_type_error: "Enter a number" }).int().min(0).max(30).optional(),
  notice_period:        z.string().optional(),
  positions:            z.number().int().min(1).max(999).default(1),
  expiry_date:          z.string().optional(),
  expected_start_date:  z.string().optional(),
  priority:             z.enum(["P0", "P1", "P2", "P3"]).default("P2"),
  publish_on_careers:   z.boolean().default(false),
  location:             z.string().optional(),
  account_manager:      z.string().optional(),
  must_have_skills:     z.string().optional(),
  nice_to_have_skills:  z.string().optional(),
  description:          z.string().optional(),
  company_intro:        z.string().optional(),
  key_skills:           z.array(z.string()).default([]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  job?: Job & { screening_questions?: ScreeningQuestion[] };
  userFullName?: string;
}

const NOTICE_OPTS = ["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "90 Days"];
const CATEGORY_OPTS = [
  "IT / Technology", "Engineering", "Finance / Accounting",
  "Sales", "Marketing", "Operations", "Human Resources",
  "Legal", "Healthcare", "Other",
];
const PRIORITY_OPTS = [
  { value: "P0", label: "P0 — Critical" },
  { value: "P1", label: "P1 — High" },
  { value: "P2", label: "P2 — Medium" },
  { value: "P3", label: "P3 — Low" },
];
const PRIORITY_COLORS: Record<string, string> = {
  P0: "#DC2626", P1: "#D97706", P2: "#6366F1", P3: "#7A9E8E",
};

export default function JobForm({ job, userFullName = "" }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!job;

  const [criterionInput, setCriterionInput] = useState("");
  const [criteria, setCriteria] = useState<string[]>(job?.role_criteria ?? []);
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
  const [open, setOpen] = useState([0, 1, 2, 3, 4]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:               job?.title ?? "",
      job_type:            (job?.job_type as FormData["job_type"]) ?? "FTE",
      status:              (job?.status as FormData["status"]) ?? "draft",
      client:              job?.client ?? "",
      category:            job?.category ?? "",
      experience_min:      job?.experience_min ?? undefined,
      experience_max:      job?.experience_max ?? undefined,
      notice_period:       job?.notice_period ?? "",
      positions:           job?.positions ?? 1,
      expiry_date:         job?.expiry_date?.slice(0, 10) ?? "",
      expected_start_date: job?.expected_start_date?.slice(0, 10) ?? "",
      priority:            (job?.priority as FormData["priority"]) ?? "P2",
      publish_on_careers:  job?.publish_on_careers ?? false,
      location:            job?.location ?? "",
      account_manager:     job?.account_manager ?? userFullName,
      must_have_skills:    job?.must_have_skills ?? "",
      nice_to_have_skills: job?.nice_to_have_skills ?? "",
      description:         job?.description ?? "",
      company_intro:       job?.company_intro ?? "",
    },
  });

  const priority = watch("priority");
  const publishValue = watch("publish_on_careers");

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
        role_criteria: criteria,
        screening_questions: questions,
        expiry_date:         data.expiry_date         || null,
        expected_start_date: data.expected_start_date || null,
        notice_period:       data.notice_period       || null,
        location:            data.location            || null,
        client:              data.client              || null,
        category:            data.category            || null,
        account_manager:     data.account_manager     || null,
        must_have_skills:    data.must_have_skills    || null,
        nice_to_have_skills: data.nice_to_have_skills || null,
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

        {/* JOB TITLE (full width) */}
        <div style={{ marginBottom: 16 }}>
          <Label text="JOB TITLE" required />
          <input
            {...register("title")}
            placeholder="e.g. Senior Software Engineer"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = DARK)}
            onBlur={e => (e.target.style.borderColor = BORDER)}
          />
          {errors.title && <Err msg={errors.title.message!} />}
        </div>

        {/* Row: JOB TYPE | STATUS | CLIENT */}
        <div style={{ ...grid3, marginBottom: 14 }}>
          <div>
            <Label text="JOB TYPE" required />
            <Select name="job_type" register={register}>
              <option value="C2H">C2H — Contract to Hire</option>
              <option value="FTE">FTE — Full Time</option>
              <option value="D2H">D2H — Direct Hire</option>
            </Select>
          </div>
          <div>
            <Label text="STATUS" required />
            <Select name="status" register={register}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </Select>
          </div>
          <div>
            <Label text="CLIENT" />
            <input
              {...register("client")}
              placeholder="Client / Company name"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>
        </div>

        {/* Row: CATEGORY | EXPERIENCE (Min–Max) | NOTICE PERIOD | POSITIONS */}
        <div style={{ ...grid4, marginBottom: 14 }}>
          <div>
            <Label text="CATEGORY" />
            <Select name="category" register={register}>
              <option value="">— Select —</option>
              {CATEGORY_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>
          <div>
            <Label text="EXPERIENCE (YEARS)" />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="number" min={0} max={30}
                {...register("experience_min", { valueAsNumber: true })}
                placeholder="Min"
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                onFocus={e => (e.target.style.borderColor = DARK)}
                onBlur={e => (e.target.style.borderColor = BORDER)}
              />
              <span style={{ fontSize: 12, color: MUTED, flexShrink: 0 }}>to</span>
              <input
                type="number" min={0} max={30}
                {...register("experience_max", { valueAsNumber: true })}
                placeholder="Max"
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                onFocus={e => (e.target.style.borderColor = DARK)}
                onBlur={e => (e.target.style.borderColor = BORDER)}
              />
            </div>
          </div>
          <div>
            <Label text="EXPECTED NOTICE PERIOD" />
            <Select name="notice_period" register={register}>
              <option value="">— Select —</option>
              {NOTICE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>
          <div>
            <Label text="POSITIONS" required />
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

        {/* Row: EXPIRY DATE | EXPECTED START DATE | PRIORITY | PUBLISH ON CAREERS */}
        <div style={{ ...grid4, marginBottom: 14 }}>
          <div>
            <Label text="EXPIRY DATE" />
            <input
              type="date"
              {...register("expiry_date")}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>
          <div>
            <Label text="EXPECTED START DATE" />
            <input
              type="date"
              {...register("expected_start_date")}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>
          <div>
            <Label text="PRIORITY" required />
            <div style={{ position: "relative" }}>
              <Select name="priority" register={register} style={{ paddingLeft: 36 }}>
                {PRIORITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                width: 10, height: 10, borderRadius: "50%",
                background: PRIORITY_COLORS[priority] ?? "#7A9E8E",
                pointerEvents: "none",
              }} />
            </div>
          </div>
          <div>
            <Label text="PUBLISH ON CAREERS WEBSITE" />
            <Select name="publish_on_careers" register={register} valueAsBoolean>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
          </div>
        </div>

        {/* Row: LOCATION | ACCOUNT MANAGER */}
        <div style={grid2}>
          <div>
            <Label text="JOB LOCATION" />
            <input
              {...register("location")}
              placeholder="e.g. Bengaluru, Remote, Pan India"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>
          <div>
            <Label text="ACCOUNT MANAGER" />
            <input
              {...register("account_manager")}
              placeholder="Account manager name"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>
        </div>
      </Section>

      {/* ── Section 2: Skills & JD ── */}
      <Section title="Skills & JD" index={1} open={open.includes(1)} onToggle={toggleSection}>

        {/* MUST HAVE SKILLS | NICE TO HAVE SKILLS */}
        <div style={{ ...grid2, marginBottom: 14 }}>
          <div>
            <Label text="MUST HAVE SKILLS" />
            <textarea
              {...register("must_have_skills")}
              rows={4}
              placeholder="e.g. React, Node.js, 5+ years experience..."
              style={{ ...inputStyle, height: "auto", resize: "vertical" }}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>
          <div>
            <Label text="NICE TO HAVE SKILLS" />
            <textarea
              {...register("nice_to_have_skills")}
              rows={4}
              placeholder="e.g. AWS, Docker, GraphQL..."
              style={{ ...inputStyle, height: "auto", resize: "vertical" }}
              onFocus={e => (e.target.style.borderColor = DARK)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>
        </div>

        {/* JOB DESCRIPTION */}
        <div style={{ marginBottom: 14 }}>
          <Label text="JOB DESCRIPTION" />
          <textarea
            {...register("description")}
            rows={6}
            placeholder="Describe the role, responsibilities, and requirements..."
            style={{ ...inputStyle, height: "auto", resize: "vertical" }}
            onFocus={e => (e.target.style.borderColor = DARK)}
            onBlur={e => (e.target.style.borderColor = BORDER)}
          />
        </div>

        {/* COMPANY INFO */}
        <div>
          <Label text="COMPANY INFO" />
          <textarea
            {...register("company_intro")}
            rows={3}
            placeholder="Company / about text — read aloud by Charlie at interview start"
            style={{ ...inputStyle, height: "auto", resize: "vertical" }}
            onFocus={e => (e.target.style.borderColor = DARK)}
            onBlur={e => (e.target.style.borderColor = BORDER)}
          />
        </div>
      </Section>

      {/* ── Section 3: Role Fit Criteria ── */}
      <Section title="Role Fit Criteria" index={2} open={open.includes(2)} onToggle={toggleSection}>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>
          Add 3–5 checkable facts Charlie will verify against the transcript. Write testable statements, not personality traits.
        </p>
        <p style={{ fontSize: 12, color: "rgba(28,56,41,0.4)", marginBottom: 14, fontStyle: "italic" }}>
          e.g. "Has carried a revenue quota", "Managed a team of 3+", "Handled enterprise deals over ₹50L"
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={criterionInput}
            onChange={e => setCriterionInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                const s = criterionInput.trim();
                if (s && !criteria.includes(s)) setCriteria([...criteria, s]);
                setCriterionInput("");
              }
            }}
            placeholder="e.g. Has carried a sales quota before"
            style={{ ...inputStyle, flex: 1 }}
            onFocus={e => (e.target.style.borderColor = DARK)}
            onBlur={e => (e.target.style.borderColor = BORDER)}
            aria-label="Add criterion"
          />
          <button
            type="button"
            onClick={() => {
              const s = criterionInput.trim();
              if (s && !criteria.includes(s)) setCriteria([...criteria, s]);
              setCriterionInput("");
            }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 42, height: 42, borderRadius: 10,
              background: DARK, color: "#fff",
              border: "none", cursor: "pointer", flexShrink: 0,
            }}
            aria-label="Add criterion"
          >
            <Plus style={{ width: 16, height: 16 }} />
          </button>
        </div>
        {criteria.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {criteria.map((c, i) => (
              <div key={c} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(28,56,41,0.04)", color: MID,
                padding: "10px 14px", borderRadius: 10,
                border: "1px solid rgba(28,56,41,0.1)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 6,
                    background: "rgba(28,56,41,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: DARK, flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: DARK }}>{c}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCriteria(criteria.filter(x => x !== c))}
                  aria-label={`Remove criterion: ${c}`}
                  style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4, display: "flex" }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Section 4: Interview Skills (for candidate self-rating) ── */}
      <Section title="Interview Skills" index={3} open={open.includes(3)} onToggle={toggleSection}>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>
          Candidates self-rate each skill on a 1–5 scale during the Charlie interview.
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

      {/* ── Section 5: Screening Questions ── */}
      <Section title="Screening Questions" index={4} open={open.includes(4)} onToggle={toggleSection}>
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
            fontWeight: 700, fontSize: 14, border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
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
          background: "rgba(28,56,41,0.02)", border: "none", cursor: "pointer",
          borderBottom: open ? `1px solid ${BORDER}` : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6,
            background: "rgba(28,56,41,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#1C3829",
          }}>
            {index + 1}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1C3829" }}>{title}</span>
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
    <label style={{
      display: "block", fontSize: 11, fontWeight: 700,
      color: "#3D6B54", marginBottom: 6,
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      {text}
      {required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
    </label>
  );
}

function Err({ msg }: { msg: string }) {
  return <p style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>{msg}</p>;
}

function Select({
  name, register, children, style, valueAsBoolean,
}: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  children: React.ReactNode;
  style?: React.CSSProperties;
  valueAsBoolean?: boolean;
}) {
  const regOpts = valueAsBoolean ? { setValueAs: (v: string) => v === "true" } : {};
  return (
    <select
      {...register(name, regOpts)}
      style={{ ...selectStyle, ...style }}
      onFocus={(e: React.FocusEvent<HTMLSelectElement>) => (e.target.style.borderColor = DARK)}
      onBlur={(e: React.FocusEvent<HTMLSelectElement>) => (e.target.style.borderColor = BORDER)}
    >
      {children}
    </select>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "#fff",
  border: `1px solid ${BORDER}`,
  borderRadius: 10, fontSize: 13, color: DARK,
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

const grid3: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
};

const grid4: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12,
};

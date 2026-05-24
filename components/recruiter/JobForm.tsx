"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import ScreeningQuestionsEditor from "./ScreeningQuestionsEditor";
import { Loader2, Plus, X } from "lucide-react";
import { DEFAULT_SCREENING_QUESTIONS } from "@/lib/utils";
import type { Job, ScreeningQuestion } from "@/lib/types";

const schema = z.object({
  title: z.string().min(1, "Job title is required").max(200),
  description: z.string().optional(),
  company_intro: z.string().optional(),
  key_skills: z.array(z.string()).default([]),
  status: z.enum(["draft", "active"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  job?: Job & { screening_questions?: ScreeningQuestion[] };
}

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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: job?.title ?? "",
      description: job?.description ?? "",
      company_intro: job?.company_intro ?? "",
      status: (job?.status as "draft" | "active") ?? "draft",
    },
  });

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillInput("");
  }

  function removeSkill(s: string) {
    setSkills(skills.filter((x) => x !== s));
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const payload = { ...data, key_skills: skills, screening_questions: questions };
      const url = isEditing ? `/api/jobs/${job!.id}` : "/api/jobs";
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input id="title" placeholder="e.g. Senior Software Engineer" {...register("title")} />
            {errors.title && <p className="text-sm text-rose-600">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the role, responsibilities, and requirements..."
              rows={4}
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_intro">Company Introduction</Label>
            <Textarea
              id="company_intro"
              placeholder="What Charlie will tell candidates about your company at the start of the interview..."
              rows={3}
              {...register("company_intro")}
            />
            <p className="text-xs text-gray-400">This text is read aloud by Charlie during the interview opening.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              {...register("status")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Key Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">
            Candidates will self-rate each skill on a 1–5 scale during the interview.
          </p>
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              placeholder="e.g. React, TypeScript, Node.js"
              aria-label="Add skill"
            />
            <Button type="button" variant="outline" onClick={addSkill} aria-label="Add skill button">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <div key={s} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full border border-indigo-100">
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    aria-label={`Remove ${s}`}
                    className="hover:text-indigo-900 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screening Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Screening Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            These questions are asked by Charlie during the screening phase. Reorder, edit, add, or remove as needed.
          </p>
          <ScreeningQuestionsEditor questions={questions} onChange={setQuestions} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Create Job"}
        </Button>
      </div>
    </form>
  );
}

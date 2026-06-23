"use client";
import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { ScreeningQuestion } from "@/lib/types";

type Q = Omit<ScreeningQuestion, "id" | "job_id" | "created_at">;

interface Props {
  questions: Q[];
  onChange: (questions: Q[]) => void;
}

export default function ScreeningQuestionsEditor({ questions, onChange }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  function addQuestion() {
    onChange([
      ...questions,
      { question: "", question_type: "open", order_index: questions.length, is_default: false },
    ]);
  }

  function updateQuestion(idx: number, field: keyof Q, value: string | number | boolean) {
    onChange(questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  }

  function removeQuestion(idx: number) {
    onChange(questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order_index: i })));
  }

  function handleDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const reordered = [...questions];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    onChange(reordered.map((q, i) => ({ ...q, order_index: i })));
    setDragIdx(null);
    setOverIdx(null);
  }

  const typeLabels: Record<string, string> = {
    open: "Text",
    numeric: "Number",
    boolean: "Yes/No",
    scale: "Scale",
  };

  return (
    <div className="space-y-2.5">
      {questions.map((q, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => setDragIdx(i)}
          onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
          onDrop={() => handleDrop(i)}
          onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
          className={`group flex items-center gap-2.5 rounded-xl border bg-white px-2.5 py-2 transition-all ${
            overIdx === i ? "border-[#3D6B54] bg-[#B8E04A]/10" : "border-[#1C3829]/10"
          } ${dragIdx === i ? "opacity-50" : "hover:border-[#1C3829]/20"}`}
        >
          <button
            type="button"
            aria-label="Drag to reorder"
            className="cursor-grab text-[#1C3829]/25 transition-colors hover:text-[#1C3829]/60 touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <span className="w-5 shrink-0 text-right text-xs font-semibold text-[#7A9E8E]">{i + 1}</span>

          <input
            value={q.question}
            onChange={(e) => updateQuestion(i, "question", e.target.value)}
            placeholder="Enter a screening question…"
            aria-label={`Question ${i + 1}`}
            className="flex-1 rounded-lg border border-transparent bg-[#F4F7F4] px-3 py-2 text-sm text-[#1C3829] transition-colors placeholder:text-[#7A9E8E]/70 focus:border-[#3D6B54]/50 focus:bg-white focus:outline-none"
          />

          <select
            value={q.question_type}
            onChange={(e) => updateQuestion(i, "question_type", e.target.value)}
            aria-label="Question type"
            className="shrink-0 cursor-pointer rounded-lg border border-[#1C3829]/12 bg-white px-2.5 py-2 text-xs font-medium text-[#3D6B54] focus:border-[#3D6B54] focus:outline-none"
          >
            {Object.entries(typeLabels).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => removeQuestion(i)}
            aria-label={`Remove question ${i + 1}`}
            className="shrink-0 rounded-md p-1.5 text-[#1C3829]/25 transition-colors hover:bg-rose-50 hover:text-rose-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {questions.length === 0 && (
        <p className="rounded-xl border border-dashed border-[#1C3829]/15 px-4 py-6 text-center text-sm text-[#7A9E8E]">
          No screening questions yet. Add the first one below.
        </p>
      )}

      <button
        type="button"
        onClick={addQuestion}
        aria-label="Add screening question"
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#1C3829]/30 px-3.5 py-2 text-sm font-semibold text-[#1C3829] transition-colors hover:border-[#3D6B54] hover:bg-[#B8E04A]/10"
      >
        <Plus className="h-4 w-4" />
        Add Question
      </button>
    </div>
  );
}

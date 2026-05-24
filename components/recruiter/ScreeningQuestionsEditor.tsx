"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, Trash2, ToggleLeft } from "lucide-react";
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
      {
        question: "",
        question_type: "open",
        order_index: questions.length,
        is_default: false,
      },
    ]);
  }

  function updateQuestion(idx: number, field: keyof Q, value: string | number | boolean) {
    onChange(questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  }

  function removeQuestion(idx: number) {
    onChange(questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order_index: i })));
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
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
    <div className="space-y-2">
      {questions.map((q, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
          onDrop={() => handleDrop(i)}
          onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
          className={`flex items-center gap-2 p-3 rounded-lg border bg-white transition-all ${
            overIdx === i ? "border-indigo-400 bg-indigo-50" : "border-gray-200"
          } ${dragIdx === i ? "opacity-50" : ""}`}
        >
          <button
            type="button"
            aria-label="Drag to reorder"
            className="cursor-grab text-gray-300 hover:text-gray-500 touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <span className="text-xs text-gray-400 font-mono w-5 shrink-0">{i + 1}.</span>

          <Input
            value={q.question}
            onChange={(e) => updateQuestion(i, "question", e.target.value)}
            placeholder="Enter screening question..."
            className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
            aria-label={`Question ${i + 1}`}
          />

          <select
            value={q.question_type}
            onChange={(e) => updateQuestion(i, "question_type", e.target.value)}
            aria-label="Question type"
            className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-500 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            {Object.entries(typeLabels).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => removeQuestion(i)}
            aria-label={`Remove question ${i + 1}`}
            className="text-gray-300 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addQuestion} aria-label="Add screening question">
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Question
      </Button>
    </div>
  );
}

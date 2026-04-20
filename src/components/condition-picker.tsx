"use client";

import { CONDITION_OPTIONS, isValidRegex, optionFor, type ConditionType } from "@/lib/condition";
import { Field } from "./field";

export function ConditionPicker({
  type,
  value,
  onTypeChange,
  onValueChange,
  layout = "grid",
}: {
  type: ConditionType;
  value: string;
  onTypeChange: (t: ConditionType) => void;
  onValueChange: (v: string) => void;
  layout?: "grid" | "stack";
}) {
  const opt = optionFor(type);
  const regexError =
    type === "regex" && value.trim() && !isValidRegex(value.trim())
      ? "Invalid regex"
      : null;
  const numberError =
    opt.valueKind === "number" && value.trim() && !Number.isFinite(Number(value))
      ? "Must be a number"
      : null;
  const error = regexError ?? numberError;

  const containerClass =
    layout === "grid" ? "grid sm:grid-cols-2 gap-3" : "space-y-3";

  return (
    <div className={containerClass}>
      <Field label="Notify when">
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as ConditionType)}
          className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
        >
          {CONDITION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      {opt.needsValue && (
        <Field label={opt.valueKind === "number" ? "Threshold" : "Value"}>
          <input
            type={opt.valueKind === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={opt.placeholder}
            step={opt.valueKind === "number" ? "any" : undefined}
            className={
              "w-full rounded-md border bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand " +
              (error
                ? "border-red-400"
                : "border-neutral-300 dark:border-neutral-700")
            }
          />
          {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
        </Field>
      )}
    </div>
  );
}

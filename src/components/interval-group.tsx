import { INTERVAL_OPTIONS } from "@/lib/format";

export function IntervalGroup({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1">
      {INTERVAL_OPTIONS.map((o) => {
        const active = o.value === value;
        return (
          <button
            type="button"
            key={o.value}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={
              "px-3 py-1.5 text-xs rounded-md transition disabled:opacity-50 " +
              (active
                ? "bg-brand text-black font-medium"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

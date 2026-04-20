export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

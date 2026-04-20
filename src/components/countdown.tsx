"use client";

import { useEffect, useState } from "react";

export function Countdown({
  targetMs,
  prefix = "in",
  overdue = "due now",
}: {
  targetMs: number;
  prefix?: string;
  overdue?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return <span className="tabular-nums">—</span>;
  const diff = targetMs - now;
  if (diff <= 0) return <span className="tabular-nums">{overdue}</span>;
  return <span className="tabular-nums">{prefix} {format(diff)}</span>;
}

function format(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) return `${m}m ${pad(sec)}s`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h < 24) return `${h}h ${pad(min)}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

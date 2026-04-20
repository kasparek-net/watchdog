"use client";

import { useEffect, useState } from "react";

const COOKIE = "pd_theme";

type Theme = "light" | "dark" | "system";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
}

function readCookie(): Theme {
  const m = document.cookie.match(/pd_theme=(light|dark|system)/);
  return (m?.[1] as Theme) ?? "system";
}

function writeCookie(t: Theme) {
  const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE}=${t}; path=/; expires=${exp}; SameSite=Lax`;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const initial = readCookie();
    setTheme(initial);
    applyTheme(initial);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readCookie() === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    writeCookie(next);
    applyTheme(next);
  }

  const icon = theme === "light" ? <SunIcon /> : theme === "dark" ? <MoonIcon /> : <SystemIcon />;
  const label = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${label} (click to cycle)`}
      aria-label={`Toggle theme (currently ${label})`}
      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      {icon}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

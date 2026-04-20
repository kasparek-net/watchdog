"use client";

import { useState } from "react";

type State =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent" }
  | { status: "error"; error: string };

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Failed" }));
        setState({ status: "error", error: j.error ?? `HTTP ${res.status}` });
        return;
      }
      setState({ status: "sent" });
    } catch (err) {
      setState({ status: "error", error: err instanceof Error ? err.message : "Failed" });
    }
  }

  if (state.status === "sent") {
    return (
      <div className="rounded-xl border-2 border-brand bg-brand/10 p-4 text-sm">
        Check your inbox at <strong>{email}</strong> — we sent a sign-in link.
        It expires in 15 minutes.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="email"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
      />
      <button
        type="submit"
        disabled={state.status === "sending" || !email}
        className="w-full rounded-md bg-brand text-black px-4 py-2 text-sm font-medium hover:bg-brand-dark disabled:opacity-50"
      >
        {state.status === "sending" ? "Sending…" : "Email me a link"}
      </button>
      {state.status === "error" && (
        <div className="text-sm text-red-600">{state.error}</div>
      )}
    </form>
  );
}

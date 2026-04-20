import type { Metadata } from "next";
import Link from "next/link";
import { getSessionEmail } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pagedog",
  description: "Watches web pages for changes and emails you when they happen.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const email = await getSessionEmail();
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight">
              Pagedog
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              {email ? (
                <>
                  <Link
                    href="/watches/new"
                    className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-1.5 hover:opacity-90"
                  >
                    New watch
                  </Link>
                  <span className="text-xs text-neutral-500 hidden sm:inline">
                    {email}
                  </span>
                  <form action="/api/auth/signout" method="post">
                    <button
                      type="submit"
                      className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:underline"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/sign-in" className="hover:underline">
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}

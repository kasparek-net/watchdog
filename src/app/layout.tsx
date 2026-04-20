import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider, Show, UserButton } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pagedog",
  description: "Hlídá změny na webových stránkách a posílá ti email.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="cs" className="h-full antialiased">
        <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
          <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="font-semibold tracking-tight">
                Pagedog
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Show when="signed-in">
                  <Link
                    href="/watches/new"
                    className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-1.5 hover:opacity-90"
                  >
                    Nové hlídání
                  </Link>
                  <UserButton />
                </Show>
                <Show when="signed-out">
                  <Link href="/sign-in" className="hover:underline">
                    Přihlásit
                  </Link>
                </Show>
              </nav>
            </div>
          </header>
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}

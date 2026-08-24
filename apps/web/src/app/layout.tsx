import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Email Blast Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <nav className="border-b bg-white px-6 py-3">
          <div className="mx-auto flex max-w-5xl items-center gap-6">
            <span className="font-semibold">Email Blast Dashboard</span>
            <Link href="/campaigns" className="text-sm text-slate-600 hover:text-slate-900">
              Campaigns
            </Link>
            <Link href="/admin/queue" className="text-sm text-slate-600 hover:text-slate-900">
              Queue Admin
            </Link>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}

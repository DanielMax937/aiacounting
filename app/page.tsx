import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Accounting - AI Expense Tracker",
  description:
    "A public landing page for Free Accounting, an AI-assisted expense and income tracker for mobile-first personal finance.",
  alternates: {
    canonical: "/",
  },
};

const features = [
  {
    title: "Expense and income tracking",
    body: "Record daily spending, income, categories, and notes in a focused mobile-first interface.",
  },
  {
    title: "AI-assisted summaries",
    body: "Use structured records to review spending patterns and understand where money is moving.",
  },
  {
    title: "Tags and statistics",
    body: "Organize transactions with tags, then scan simple statistics for recurring habits.",
  },
];

export default function RootPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Free Accounting
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              AI-assisted personal accounting for everyday records.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Free Accounting helps you keep expenses, income, tags, and finance notes in
              one clean workspace. The public landing page is crawlable, while the app
              dashboard stays protected behind login.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-blue-700 px-5 py-3 text-sm font-medium text-white"
                href="/zh/login"
              >
                登录使用
              </Link>
              <Link
                className="rounded-md border border-slate-300 px-5 py-3 text-sm font-medium text-slate-900"
                href="/en/login"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-6">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Today", "$42.60"],
                ["Income", "$3,200"],
                ["Food", "$18.40"],
                ["Transport", "$6.20"],
              ].map(([label, value]) => (
                <div className="rounded-md bg-white p-4" key={label}>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article className="rounded-md border border-slate-200 p-5" key={feature.title}>
              <h2 className="text-base font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://free-accounting.vercel.app")
    .trim()
    .replace(/\/+$/, "");
}

export function GET() {
  const siteUrl = getSiteUrl();

  return new Response(
    [
      "# AI Accounting",
      "",
      "AI Accounting is a public marketing site for an AI-assisted personal finance and expense tracking app. It introduces mobile accounting, receipt analysis, budgeting, tags, statistics, and goal tracking.",
      "",
      "## Public Pages",
      `- English: ${siteUrl}/en`,
      `- Chinese: ${siteUrl}/zh`,
      `- Privacy: ${siteUrl}/en/privacy`,
      `- Terms: ${siteUrl}/en/terms`,
      "",
      "Search engines and AI crawlers may crawl public marketing, privacy, and terms pages. Login, settings, record entry, and authenticated app pages are excluded from the sitemap.",
      "",
    ].join("\n"),
    {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    },
  );
}


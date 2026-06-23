function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://free-accounting.vercel.app")
    .trim()
    .replace(/\/+$/, "");
}

export function GET() {
  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /api/",
      "Disallow: /auth/",
      "Disallow: /admin/",
      "Disallow: /en/login",
      "Disallow: /zh/login",
      "Disallow: /en/settings",
      "Disallow: /zh/settings",
      "Disallow: /en/records/",
      "Disallow: /zh/records/",
      "",
      `Sitemap: ${getSiteUrl()}/sitemap.xml`,
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


const routes = [
  ["/", "weekly", "1.0"],
  ["/serkon", "monthly", "0.9"],
  ["/life", "weekly", "0.8"],
  ["/play", "monthly", "0.8"],
  ["/notes", "monthly", "0.7"],
  ["/lobby", "daily", "0.8"],
  ["/cosmos", "monthly", "0.8"],
  ["/games/doudizhu", "monthly", "0.6"],
  ["/privacy", "yearly", "0.4"],
  ["/updates", "monthly", "0.6"],
  ["/system", "monthly", "0.6"],
  ["/accessibility", "yearly", "0.4"],
  ["/lite", "weekly", "0.5"],
  ["/provenance", "monthly", "0.4"],
  ["/zero-cost", "monthly", "0.4"],
] as const;

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const nodes = routes.map(([path, changefreq, priority]) => `<url><loc>${escapeXml(`${origin}${path}`)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${nodes}</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

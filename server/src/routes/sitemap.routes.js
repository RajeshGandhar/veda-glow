import { Router } from "express";

const router = Router();

// All public frontend routes — add new pages here as the site grows
const SITE_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/privacy-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/cookie-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/terms-and-conditions", changefreq: "monthly", priority: "0.4" },
  { path: "/return-and-refund-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/shipping-policy", changefreq: "monthly", priority: "0.4" },
];

const BASE_URL = "https://vedaglows.com";

const HOMEPAGE_IMAGE = {
  loc: `${BASE_URL}/og-image.png`,
  title: "VedaGlow 28-Day Ayurvedic Skin Kit",
  caption: "Clear acne, control oil, and restore glow with VedaGlow's 3-step herbal routine.",
};

function buildSitemapXml() {
  const lastmod = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const urlEntries = SITE_ROUTES.map(({ path, changefreq, priority }) => {
    const imageBlock =
      path === "/"
        ? `
    <image:image>
      <image:loc>${HOMEPAGE_IMAGE.loc}</image:loc>
      <image:title>${HOMEPAGE_IMAGE.title}</image:title>
      <image:caption>${HOMEPAGE_IMAGE.caption}</image:caption>
    </image:image>`
        : "";

    return `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageBlock}
  </url>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${urlEntries}
</urlset>`;
}

router.get("/sitemap.xml", (req, res) => {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600"); // cache 1 hour
  res.status(200).send(buildSitemapXml());
});

export default router;

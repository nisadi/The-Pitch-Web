import { PUBLIC_ROUTES, SITE_URL } from "@/lib/seo/siteConfig";

export default function sitemap() {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}

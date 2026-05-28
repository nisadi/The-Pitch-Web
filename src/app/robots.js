import { SITE_URL } from "@/lib/seo/siteConfig";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/checkout",
          "/profile/",
          "/login",
          "/signup",
          "/booking/confirm",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

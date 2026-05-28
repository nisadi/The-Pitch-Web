import { organizationJsonLd } from "@/lib/seo/siteConfig";

export default function JsonLdScripts() {
  const schema = organizationJsonLd();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

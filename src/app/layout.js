import "./globals.css";
import AppShell from "@/components/AppShell";
import JsonLdScripts from "@/components/seo/JsonLdScripts";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo/siteConfig";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Futsal, Cricket Nets & Indoor Sports Sri Lanka`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} | Futsal, Cricket Nets & Indoor Sports Sri Lanka`,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_LK",
    type: "website",
    images: [
      {
        url: absoluteUrl("/images/hero-stadium.png"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — indoor futsal and cricket courts in Colombo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [absoluteUrl("/images/hero-stadium.png")],
  },
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="has-navbar"
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <JsonLdScripts />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

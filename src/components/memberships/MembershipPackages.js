"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { usePackages } from "@/lib/packages/packagesContext";
import { getTemplateById } from "@/lib/packages/packagesDefaults";
import styles from "@/app/memberships/memberships.module.css";

function formatPrice(amount, priceLabel) {
  return {
    main: `LKR ${Number(amount).toLocaleString("en-LK")}`,
    sub: priceLabel,
  };
}

export default function MembershipPackages() {
  const { ready, publishedPackages } = usePackages();

  if (!ready) {
    return (
      <div className={styles.empty}>
        <p>Loading packages…</p>
      </div>
    );
  }

  if (publishedPackages.length === 0) {
    return (
      <div className={styles.empty}>
        <p>
          Membership packages are being updated. Please check back soon or
          contact us for custom plans.
        </p>
        <Link href="/contact" className={styles.cta} style={{ marginTop: "1.5rem", maxWidth: 220 }}>
          Contact us
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {publishedPackages.map((pkg) => {
        const template = getTemplateById(pkg.templateId);
        const price = formatPrice(pkg.price, pkg.priceLabel);

        return (
          <article
            key={pkg.id}
            className={`${styles.card} ${pkg.highlighted ? styles.cardFeatured : ""}`}
          >
            <div className={styles.cardHead}>
              <div>
                {template && (
                  <p className={styles.templateLabel}>{template.name}</p>
                )}
                <h2>{pkg.name}</h2>
              </div>
              {pkg.highlighted && (
                <span className={styles.featuredBadge}>Popular</span>
              )}
            </div>

            <p className={styles.desc}>{pkg.shortDescription}</p>

            <div className={styles.meta}>
              <span className={styles.metaTag}>{pkg.location}</span>
              <span className={styles.metaTag}>{pkg.sport}</span>
            </div>

            <p className={styles.price}>{price.main}</p>
            <p className={styles.priceLabel}>{price.sub}</p>

            <ul className={styles.features}>
              {pkg.features.map((feature) => (
                <li key={feature}>
                  <Check className={styles.check} size={16} />
                  {feature}
                </li>
              ))}
            </ul>

            <Link href={pkg.ctaHref || "/booking"} className={styles.cta}>
              {pkg.ctaLabel || "Book now"}
            </Link>
          </article>
        );
      })}
    </div>
  );
}

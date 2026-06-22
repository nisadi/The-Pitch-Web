"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  Pencil,
  Sun,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { usePackages } from "@/lib/packages/packagesContext";
import {
  getTemplateById,
  PACKAGE_TEMPLATES,
  slugifyPackageId,
} from "@/lib/packages/packagesDefaults";
import { useAdminLocation } from "./adminLocationContext";
import { useAdminSettings } from "./settings/adminSettingsContext";
import PackageFormModal from "./PackageFormModal";
import EventCardsManagement from "./EventCardsManagement";
import styles from "./PackageManagement.module.css";

const TEMPLATE_ICONS = {
  CalendarDays,
  Ticket,
  Sun,
  Building2,
  Users,
  GraduationCap,
};

function formatPrice(amount, priceLabel) {
  return `LKR ${Number(amount).toLocaleString("en-LK")} ${priceLabel}`;
}

export default function PackageManagement() {
  const { filterValue: locationFilter } = useAdminLocation();
  const { locations, sports } = useAdminSettings();
  const { packages, addPackage, updatePackage, removePackage } = usePackages();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const activeLocations = useMemo(
    () => locations.filter((l) => l.status === "active"),
    [locations]
  );

  const filteredPackages = useMemo(() => {
    const sorted = [...packages].sort((a, b) => a.sortOrder - b.sortOrder);
    if (locationFilter === "all") return sorted;
    return sorted.filter((pkg) => pkg.location === locationFilter);
  }, [packages, locationFilter]);

  const publishedCount = packages.filter((p) => p.status === "published").length;

  const openCreate = (template) => {
    setSelectedTemplate(template);
    setEditingPackage(null);
    setModalOpen(true);
  };

  const openEdit = (pkg) => {
    setSelectedTemplate(getTemplateById(pkg.templateId));
    setEditingPackage(pkg);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTemplate(null);
    setEditingPackage(null);
  };

  const handleSave = (payload) => {
    if (editingPackage) {
      updatePackage(editingPackage.id, payload);
    } else {
      const id = slugifyPackageId(payload.name);
      if (packages.some((p) => p.id === id)) {
        window.alert("A package with this name already exists.");
        return;
      }
      addPackage({
        ...payload,
        id,
        sortOrder: packages.length,
      });
    }
    closeModal();
  };

  const handleDelete = (pkg) => {
    if (window.confirm(`Remove package "${pkg.name}"?`)) {
      removePackage(pkg.id);
    }
  };

  const togglePublish = (pkg) => {
    updatePackage(pkg.id, {
      status: pkg.status === "published" ? "draft" : "published",
    });
  };

  return (
    <div className={styles.page}>
      <EventCardsManagement />
{/*
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Package templates</h3>
          <p>
            Choose a template, customise it, and publish to the memberships page
            on the website.
          </p>
          <Link href="/memberships" className={styles.previewLink} target="_blank">
            <ExternalLink size={14} />
            Preview on website
          </Link>
        </div>

        <div className={styles.templateGrid}>
          {PACKAGE_TEMPLATES.map((template) => {
            const Icon = TEMPLATE_ICONS[template.icon] ?? CalendarDays;
            return (
              <button
                key={template.id}
                type="button"
                className={styles.templateCard}
                onClick={() => openCreate(template)}
              >
                <span className={styles.templateIcon}>
                  <Icon size={20} />
                </span>
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <span className={styles.useTemplate}>Use template →</span>
              </button>
            );
          })}
        </div>
      </section>*/}

 {/* <section className={styles.section}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Your packages</h3>
            <p>
              {filteredPackages.length} package
              {filteredPackages.length === 1 ? "" : "s"}
              {` · ${publishedCount} published`}
              {locationFilter !== "all" ? ` · ${locationFilter}` : ""}
            </p>
          </div>
        </div>

        {filteredPackages.length === 0 ? (
          <p className={styles.empty}>
            No packages yet. Select a template above to create your first
            package.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Template</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map((pkg) => {
                  const template = getTemplateById(pkg.templateId);
                  return (
                    <tr key={pkg.id}>
                      <td>
                        {pkg.name}
                        <span className={styles.meta}>{pkg.sport}</span>
                      </td>
                      <td>{template?.name ?? pkg.templateId}</td>
                      <td>{pkg.location}</td>
                      <td className={styles.amount}>
                        {formatPrice(pkg.price, pkg.priceLabel)}
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            pkg.status === "published"
                              ? styles.badgePublished
                              : styles.badgeDraft
                          }`}
                        >
                          {pkg.status === "published" ? "Published" : "Draft"}
                        </span>
                        {pkg.highlighted && (
                          <span className={styles.badgeFeatured}>Featured</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => openEdit(pkg)}
                            aria-label="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => togglePublish(pkg)}
                            aria-label={
                              pkg.status === "published"
                                ? "Unpublish"
                                : "Publish"
                            }
                            title={
                              pkg.status === "published"
                                ? "Unpublish"
                                : "Publish"
                            }
                          >
                            <ExternalLink size={15} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => handleDelete(pkg)}
                            aria-label="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section> */}

      <PackageFormModal
        open={modalOpen}
        template={selectedTemplate}
        initialPackage={editingPackage}
        locations={activeLocations}
        sports={sports}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  );
}

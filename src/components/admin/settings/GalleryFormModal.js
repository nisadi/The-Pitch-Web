"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CloudUpload, Info, Save } from "lucide-react";
import {
  GALLERY_CATEGORIES,
  GALLERY_POSITIONS,
} from "@/lib/gallery/galleryMapper";
import { uploadGalleryImage } from "@/lib/storage/uploadGalleryImage";
import styles from "./LocationFormModal.module.css";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function GalleryFormModal({
  open,
  mode = "create",
  galleryDbId = null,
  form,
  onChange,
  onClose,
  onSubmit,
}) {
  const fileInputId = useId();
  const fileRef = useRef(null);
  const previewUrlRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl("");
      setUploadingImage(false);
      return;
    }

    if (form.imageUrl && !form.imageUrl.startsWith("data:")) {
      setPreviewUrl(form.imageUrl);
    }
  }, [open, form.imageUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  if (!open) return null;

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      window.alert("Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      window.alert("Image must be 5MB or smaller.");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    const localPreview = URL.createObjectURL(file);
    previewUrlRef.current = localPreview;
    setPreviewUrl(localPreview);
    setUploadingImage(true);

    try {
      const publicUrl = await uploadGalleryImage(file, {
        galleryId: galleryDbId,
        title: form.title,
      });
      onChange({ imageUrl: publicUrl });
      setPreviewUrl(publicUrl);
    } catch (err) {
      console.error(err);
      window.alert(err?.message ?? "Could not upload image.");
      onChange({ imageUrl: "" });
      setPreviewUrl("");
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    onChange({ imageUrl: "" });
    setPreviewUrl("");
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  const canSave =
    form.title.trim() && form.imageUrl.trim() && !uploadingImage;
  const showImage = Boolean(previewUrl || form.imageUrl);

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <ArrowLeft size={20} />
          </button>
          <div className={styles.headerText}>
            <h2 id="gallery-modal-title">
              {isEdit ? "Edit gallery photo" : "Add gallery photo"}
            </h2>
            <p>
              Active photos appear on the public Gallery page (/gallery).
            </p>
          </div>
        </header>

        <form
          id="gallery-modal-form"
          className={styles.body}
          onSubmit={handleSubmit}
        >
          <div className={styles.infoBanner}>
            <Info size={18} />
            <span>
              Uploads go to Supabase Storage. Choose category for filter tabs and
              layout position for the main masonry grid.
            </span>
          </div>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Photo details</h3>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="gallery-modal-title-input">
                Title <span className={styles.required}>*</span>
              </label>
              <input
                id="gallery-modal-title-input"
                className={styles.input}
                value={form.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="e.g. Main Arena Pitch A"
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="gallery-modal-category">
                  Category
                </label>
                <select
                  id="gallery-modal-category"
                  className={styles.input}
                  value={form.category}
                  onChange={(e) => onChange({ category: e.target.value })}
                >
                  {GALLERY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="gallery-modal-position">
                  Layout position
                </label>
                <select
                  id="gallery-modal-position"
                  className={styles.input}
                  value={form.position}
                  onChange={(e) => onChange({ position: e.target.value })}
                >
                  {GALLERY_POSITIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="gallery-modal-sort">
                  Sort order
                </label>
                <input
                  id="gallery-modal-sort"
                  type="number"
                  className={styles.input}
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) =>
                    onChange({ sortOrder: Number(e.target.value) || 0 })
                  }
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="gallery-modal-status">
                  Status
                </label>
                <select
                  id="gallery-modal-status"
                  className={styles.input}
                  value={form.status}
                  onChange={(e) => onChange({ status: e.target.value })}
                >
                  <option value="active">Active (visible on site)</option>
                  <option value="inactive">Hidden</option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>
                Image <span className={styles.required}>*</span>
              </span>
              <input
                id={fileInputId}
                ref={fileRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className={styles.hiddenInput}
                onChange={handleImageChange}
              />
              {showImage ? (
                <div
                  className={`${styles.uploadZone} ${styles.uploadZoneHasImage}`}
                >
                  <img
                    src={previewUrl || form.imageUrl}
                    alt=""
                    className={styles.uploadPreview}
                  />
                  <div className={styles.uploadActions}>
                    <button
                      type="button"
                      className={styles.changeBtn}
                      onClick={() => fileRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? "Uploading…" : "Change image"}
                    </button>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={handleRemoveImage}
                      disabled={uploadingImage}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.uploadZone}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingImage}
                  aria-busy={uploadingImage}
                >
                  <CloudUpload size={28} className={styles.uploadIcon} />
                  <span className={styles.uploadTitle}>
                    {uploadingImage ? "Uploading…" : "Upload gallery image"}
                  </span>
                  <span className={styles.uploadHint}>
                    JPG, PNG or WEBP (max 5MB)
                  </span>
                </button>
              )}
            </div>
          </section>
        </form>

        <footer className={styles.footer}>
          <button
            type="submit"
            className={styles.saveBtn}
            form="gallery-modal-form"
            disabled={!canSave}
          >
            <Save size={18} />
            {uploadingImage
              ? "Uploading image…"
              : isEdit
                ? "Save changes"
                : "Save photo"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CloudUpload,
  Info,
  Lightbulb,
  Save,
} from "lucide-react";
import { slugFromSportName } from "@/lib/sports/sportMapper";
import { uploadSportImage } from "@/lib/storage/uploadSportImage";
import styles from "./LocationFormModal.module.css";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function SportFormModal({
  open,
  mode = "create",
  sportDbId = null,
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

    if (form.image && !form.image.startsWith("data:")) {
      setPreviewUrl(form.image);
    }
  }, [open, form.image]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  if (!open) return null;

  const handleNameChange = (name) => {
    const nextSlug = slugFromSportName(name);
    const patch = { name };
    if (!isEdit || !form.slug || form.slug === slugFromSportName(form.name)) {
      patch.slug = nextSlug;
      if (!form.icon || form.icon === slugFromSportName(form.name)) {
        patch.icon = nextSlug;
      }
    }
    onChange(patch);
  };

  const handleSlugChange = (slug) => {
    const patch = { slug };
    if (!form.icon || form.icon === form.slug) {
      patch.icon = slug;
    }
    onChange(patch);
  };

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
    }
    const localPreview = URL.createObjectURL(file);
    previewUrlRef.current = localPreview;
    setPreviewUrl(localPreview);

    setUploadingImage(true);
    try {
      const publicUrl = await uploadSportImage(file, {
        sportId: sportDbId,
        sportName: form.name,
      });
      onChange({ image: publicUrl });
      setPreviewUrl(publicUrl);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    } catch (err) {
      window.alert(err?.message ?? "Could not upload image.");
      onChange({ image: "" });
      setPreviewUrl("");
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    onChange({ image: "" });
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
    form.name.trim() &&
    (form.slug.trim() || slugFromSportName(form.name)) &&
    !uploadingImage;
  const showImage = Boolean(previewUrl || form.image);

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
        aria-labelledby="sport-modal-title"
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
            <h2 id="sport-modal-title">
              {isEdit ? "Edit sport" : "Add sport"}
            </h2>
            <p>
              {isEdit
                ? "Update sport details, image, and availability."
                : "Add a sport customers can book at your venues."}
            </p>
          </div>
        </header>

        <form
          id="sport-modal-form"
          className={styles.body}
          onSubmit={handleSubmit}
        >
          <div className={styles.infoBanner}>
            <Info size={18} />
            <span>
              Image uploads go to Supabase Storage; the public URL is saved as
              image_url. Slug and icon are used across the app.
            </span>
          </div>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Sport details</h3>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="sport-modal-name">
                Sport name <span className={styles.required}>*</span>
              </label>
              <input
                id="sport-modal-name"
                className={styles.input}
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Football"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="sport-modal-slug">
                Slug <span className={styles.required}>*</span>
              </label>
              <p className={styles.hint}>
                URL-friendly identifier (e.g. football). Auto-filled from the name.
              </p>
              <input
                id="sport-modal-slug"
                className={styles.input}
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="football"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="sport-modal-icon">
                Icon
              </label>
              <p className={styles.hint}>
                Icon key for UI (e.g. football). Defaults to the slug.
              </p>
              <input
                id="sport-modal-icon"
                className={styles.input}
                value={form.icon}
                onChange={(e) => onChange({ icon: e.target.value })}
                placeholder="football"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="sport-modal-desc">
                Description
              </label>
              <textarea
                id="sport-modal-desc"
                className={styles.textarea}
                value={form.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Popular team sport played with a football."
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Sport image</span>
              <p className={styles.hint}>
                JPG, PNG or WEBP (max 5MB). Saved to storage automatically.
              </p>
              <input
                id={fileInputId}
                ref={fileRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className={styles.hiddenInput}
                onChange={handleImageChange}
                disabled={uploadingImage}
              />
              {showImage ? (
                <div
                  className={`${styles.uploadZone} ${styles.uploadZoneHasImage}`}
                >
                  <img
                    src={previewUrl || form.image}
                    alt="Sport preview"
                    className={styles.previewImage}
                  />
                  <div className={styles.previewActions}>
                    <button
                      type="button"
                      className={styles.textLink}
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
                <label
                  htmlFor={fileInputId}
                  className={styles.uploadZone}
                  style={
                    uploadingImage
                      ? { opacity: 0.6, pointerEvents: "none" }
                      : undefined
                  }
                >
                  <CloudUpload size={28} className={styles.uploadIcon} />
                  <span className={styles.uploadTitle}>
                    {uploadingImage ? "Uploading…" : "Upload sport image"}
                  </span>
                  <span className={styles.uploadHint}>
                    JPG, PNG or WEBP (Max. 5MB) — optional
                  </span>
                </label>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="sport-modal-status">
                Status
              </label>
              <select
                id="sport-modal-status"
                className={styles.select}
                value={form.status}
                onChange={(e) => onChange({ status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </section>

          <div className={styles.tips}>
            <Lightbulb size={18} />
            <div>
              <p className={styles.tipsTitle}>Tips</p>
              <p>
                Inactive sports are hidden from new location assignments. Keep
                slugs unique and stable — they are stored in the database.
              </p>
            </div>
          </div>
        </form>

        <footer className={styles.footer}>
          <button
            type="submit"
            className={styles.saveBtn}
            form="sport-modal-form"
            disabled={!canSave}
          >
            <Save size={18} />
            {uploadingImage
              ? "Uploading image…"
              : isEdit
                ? "Save changes"
                : "Save sport"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

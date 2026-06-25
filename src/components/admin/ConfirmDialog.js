"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./ConfirmDialog.module.css";

export default function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Continue",
  onClose,
  onConfirm,
  variant = "default", // 'default' | 'destructive'
  hideCancel = false,
}) {
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

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="confirm-dialog-title" className={styles.title}>
            {title}
          </h2>
          <p id="confirm-dialog-description" className={styles.description}>
            {description}
          </p>
        </div>
        <div className={styles.footer}>
          {!hideCancel && (
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {cancelLabel}
            </button>
          )}
          <button 
            type="button" 
            className={variant === "destructive" ? styles.destructiveBtn : styles.confirmBtn} 
            onClick={() => { if (onConfirm) onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

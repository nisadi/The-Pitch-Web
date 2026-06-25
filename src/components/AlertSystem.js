"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "./admin/ConfirmDialog";

export default function AlertSystem() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState({ message: "", title: "" });

  useEffect(() => {
    const originalAlert = window.alert;

    // Override the global window.alert to use our React modal
    window.alert = (message) => {
      setContent({ message: String(message), title: "Alert" });
      setOpen(true);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <ConfirmDialog
      open={open}
      title={content.title}
      description={content.message}
      hideCancel={true}
      confirmLabel="OK"
      onClose={() => setOpen(false)}
      onConfirm={() => setOpen(false)}
    />
  );
}

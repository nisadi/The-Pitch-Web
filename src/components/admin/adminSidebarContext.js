"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "admin_sidebar_collapsed";
const MOBILE_BREAKPOINT = 768;

const AdminSidebarContext = createContext(null);

export function AdminSidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  const openMobileMenu = () => setMobileOpen(true);
  const closeMobileMenu = () => setMobileOpen(false);
  const toggleMobileMenu = () => setMobileOpen((prev) => !prev);

  return (
    <AdminSidebarContext.Provider
      value={{
        collapsed: ready && collapsed,
        mobileOpen,
        toggle,
        openMobileMenu,
        closeMobileMenu,
        toggleMobileMenu,
      }}
    >
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext);
  if (!context) {
    throw new Error("useAdminSidebar must be used within AdminSidebarProvider");
  }
  return context;
}

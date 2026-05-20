"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PackagesProvider } from "@/lib/packages/packagesContext";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isLogin = pathname === "/login";

  useEffect(() => {
    document.body.style.paddingTop = isAdmin || isLogin ? "0" : "80px";
  }, [isAdmin, isLogin]);

  return (
    <PackagesProvider>
      {isAdmin || isLogin ? (
        children
      ) : (
        <>
          <Navbar />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </>
      )}
    </PackagesProvider>
  );
}

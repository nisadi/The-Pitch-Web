"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PackagesProvider } from "@/lib/packages/packagesContext";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    document.body.style.paddingTop = isAdmin ? "0" : "80px";
  }, [isAdmin]);

  return (
    <PackagesProvider>
      {isAdmin ? (
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

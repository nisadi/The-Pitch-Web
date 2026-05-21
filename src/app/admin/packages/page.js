import PackageManagement from "@/components/admin/PackageManagement";

export const metadata = {
  title: "Packages | Admin",
  description: "Create and publish membership packages for the customer website.",
};

export default function AdminPackagesPage() {
  return <PackageManagement />;
}

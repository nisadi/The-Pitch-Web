import AdminPanel from "@/components/admin/AdminPanel";
import styles from "@/components/admin/Admin.module.css";

export const metadata = {
  title: "Manage Packages | Admin",
};

export default function AdminPackagesPage() {
  return (
    <AdminPanel>
      <p className={styles.placeholder}>Package management coming soon.</p>
    </AdminPanel>
  );
}

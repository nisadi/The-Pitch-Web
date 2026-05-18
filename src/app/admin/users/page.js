import AdminPanel from "@/components/admin/AdminPanel";
import styles from "@/components/admin/Admin.module.css";

export const metadata = {
  title: "Manage Users | Admin",
};

export default function AdminUsersPage() {
  return (
    <AdminPanel>
      <p className={styles.placeholder}>User management coming soon.</p>
    </AdminPanel>
  );
}

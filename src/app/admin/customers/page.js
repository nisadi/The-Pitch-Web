import AdminPanel from "@/components/admin/AdminPanel";
import styles from "@/components/admin/Admin.module.css";

export const metadata = {
  title: "Manage Customers | Admin",
};

export default function AdminCustomersPage() {
  return (
    <AdminPanel>
      <p className={styles.placeholder}>Customer management coming soon.</p>
    </AdminPanel>
  );
}

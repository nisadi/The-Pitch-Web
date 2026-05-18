import AdminPanel from "@/components/admin/AdminPanel";
import styles from "@/components/admin/Admin.module.css";

export const metadata = {
  title: "Payments | Admin",
};

export default function AdminPaymentsPage() {
  return (
    <AdminPanel>
      <p className={styles.placeholder}>Payment management coming soon.</p>
    </AdminPanel>
  );
}

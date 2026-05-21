import AdminSalesChart from "@/components/admin/AdminSalesChart";
import AdminStatsGrid from "@/components/admin/AdminStatsGrid";

export const metadata = {
  title: "Admin Dashboard | The Pitch",
  description: "Manage bookings, events, and memberships for The Pitch Indoor Stadium.",
};

export default function AdminDashboardPage() {
  const stats = [
    { label: "Today's Bookings", value: "3" },
    { label: "Sales", value: "LKR 7,300.00" },
    { label: "Upcoming Events", value: "3" },
    { label: "Average ticket size", value: "LKR 2,433.33" },
  ];

  return (
    <>
      <AdminStatsGrid stats={stats} />

      <AdminSalesChart />
    </>
  );
}

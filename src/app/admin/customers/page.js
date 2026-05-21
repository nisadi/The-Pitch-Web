import CustomerManagement from "@/components/admin/CustomerManagement";

export const metadata = {
  title: "Customer | Admin",
  description: "Manage customer records and enquiries.",
};

export default function AdminCustomersPage() {
  return <CustomerManagement />;
}

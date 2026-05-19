import PaymentSummary from "@/components/admin/PaymentSummary";

export const metadata = {
  title: "Payments | Admin",
  description: "Monitor transactions, filter by date, and export payment summaries.",
};

export default function AdminPaymentsPage() {
  return <PaymentSummary />;
}

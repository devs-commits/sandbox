import { AdminPaymentsDashboard } from "../../components/admin/AdminPaymentsDashboard"; 

export const metadata = {
  title: "Payments & Subscriptions | Admin",
};

export default function PaymentsPage() {
  return (
    <main>
      <AdminPaymentsDashboard />
    </main>
  );
}
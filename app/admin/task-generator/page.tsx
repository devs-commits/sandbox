import { AdminTaskGenerator } from "../../components/admin/AdminTaskGenerator";

export default function TaskGeneratorPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0D14] min-h-screen p-6 sm:p-10">
      <div className="max-w-5xl mx-auto">
        <AdminTaskGenerator adminId="admin-master-id" />
      </div>
    </div>
  );
}
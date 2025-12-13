import { StudentHeader } from "@/app/components/students/StudentHeader";
export default function Page() {
  return (
    <div className="min-h-screen bg-background">
        <StudentHeader title="Squad" />
        <div className="p-4 lg:p-6">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">Squad Members</h2>
            <p>Manage your squad members here</p>
          </div>
        </div>
    </div>
  );
}
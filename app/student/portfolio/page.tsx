import { StudentHeader } from "@/app/components/students/StudentHeader";
export default function Page() {
  return (
    <div className="min-h-screen bg-background">
        <StudentHeader title="Portfolio" />
        <div className="p-4 lg:p-6">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">My Portfolio</h2>
            <p className="text-muted-foreground">Checkout your portfolio and see your progree so far</p>
          </div>
        </div>
    </div>
  );
}
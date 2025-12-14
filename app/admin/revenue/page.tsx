import {AdminHeader} from "../../components/admin/AdminHeader";

export default function page(){
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="Revenue" subtitle="Manage funds for unlocking talents insights"/>
      <div className="p-4 lg:p-6">
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Revenue</h2>
          <p className="text-muted-foreground">Revenue page is in progres...</p>
        </div>
      </div>
    </div>
  );
};

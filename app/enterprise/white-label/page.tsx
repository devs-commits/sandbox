import {EnterpriseHeader} from "../../components/enterprise/EnterpriseHeader";

export default function page(){
  return (
    <div className="min-h-screen bg-background">
      <EnterpriseHeader title="White-Label Academy Protocol" subtitle="Deploy your own branded Virtual Experience Lab in minutes. Powered by WDC infrastructure "/>
      <div className="p-4 lg:p-6">
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Live Preview</h2>
          <p className="text-muted-foreground">virtual lab is in progress.......</p>
        </div>
      </div>
    </div>
  );
};
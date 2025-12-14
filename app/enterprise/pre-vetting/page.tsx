import {EnterpriseHeader} from "../../components/enterprise/EnterpriseHeader";

export default function page(){
  return (
    <div className="min-h-screen bg-background">
      <EnterpriseHeader title="Automated Pre-Vetting Sandbox" subtitle="Screen 1000+ candidates in 24 hours using Ai simulated trials"/>
      <div className="p-4 lg:p-6">
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Bounty Hunter</h2>
          <p className="text-muted-foreground">Complete bounties to earn rewards.</p>
        </div>
      </div>
    </div>
  );
};
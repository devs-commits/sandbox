import {RecruiterHeader} from "../../components/recruiter/RecruiterHeader";

export default function page(){
  return (
    <div className="min-h-screen bg-background">
      <RecruiterHeader title="Bounty Hunter" />
      <div className="p-4 lg:p-6">
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Wallet Balance</h2>
          <p className="text-muted-foreground">Wallet balance would be avalable soon..</p>
        </div>
      </div>
    </div>
  );
};

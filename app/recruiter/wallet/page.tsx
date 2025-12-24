"use client";
import {RecruiterHeader} from "../../components/recruiter/RecruiterHeader";
import { useState } from "react";
import { Menu, Lock, Download } from "lucide-react";
import { Button } from "../../components/ui/button";

interface Transaction {
  id: number;
  description: string;
  date: string;
  amount: number;
  type: "debit" | "credit";
}

const transactions: Transaction[] = [
  {
    id: 1,
    description: "Unlocked Candidate-892 Report",
    date: "Today, 10:30 AM",
    amount: 25000,
    type: "debit",
  },
  {
    id: 2,
    description: "Wallet Funding (Paystack)",
    date: "Yesterday, 2:15 PM",
    amount: 150000,
    type: "credit",
  },
  {
    id: 3,
    description: "Unlocked Candidate-892 Report",
    date: "Dec 4, 9:00 PM",
    amount: 25000,
    type: "debit",
  },
];

interface RecruiterWalletProps {
  onOpenSidebar: () => void;
}

export default function RecruiterWallet({ onOpenSidebar }: RecruiterWalletProps) {
  const [balance] = useState(150000);

  const handleFundWallet = () => {
    console.log("Fund wallet clicked");
  };

  const handleDownloadStatement = () => {
    console.log("Download statement clicked");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={onOpenSidebar}
        className="lg:hidden mb-4 p-2 text-foreground"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Header */}
      <RecruiterHeader title="Recruiter Wallet" subtitle="Manage funds for unlocking talents insights" />

      {/* Balance Card */}
      <div className="bg-[linear-gradient(135deg,hsla(197,70%,22%,1)_50%,hsla(216,50%,13%,1)_100%)] rounded-xl p-6 border border-border mb-8 max-w-2xl mx-auto my-10">
        <p className="text-xs text-cyan-400 uppercase font-medium mb-2 tracking-wider">
          Available Balance
        </p>
        <p className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          ₦{balance.toLocaleString()}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleFundWallet}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Lock className="w-4 h-4 mr-2" />
            Fund with Paystack
          </Button>
          <Button
            onClick={handleDownloadStatement}
            variant="outline"
            className="flex-1 border-border text-foreground hover:bg-muted"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Statement
          </Button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-card rounded-xl p-6 border border-border max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-foreground mb-6">
          Transaction History
        </h2>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <div>
                <p className="text-foreground font-medium">
                  {transaction.description}
                </p>
                <p className="text-muted-foreground text-sm">
                  {transaction.date}
                </p>
              </div>
              <p
                className={`font-semibold text-lg ${
                  transaction.type === "credit"
                    ? "text-primary"
                    : "text-foreground"
                }`}
              >
                {transaction.type === "credit" ? "+" : "-"} ₦
                {transaction.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
"use client";
import { RecruiterHeader } from "../../components/recruiter/RecruiterHeader";
import { useState, useEffect, Suspense } from "react";
import { Menu, Lock, Download, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../contexts/AuthContexts";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

interface Transaction {
  id: number;
  description: string;
  created_at: string;
  amount: number;
  type: "debit" | "credit";
  reference?: string;
}

interface RecruiterWalletProps {
  onOpenSidebar: () => void;
}

function RecruiterWalletContent({ onOpenSidebar }: RecruiterWalletProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [fundingAmount, setFundingAmount] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch Wallet Data
  const fetchWalletData = async () => {
    if (!user?.id) return;
    
    try {
      // Get Balance
      const { data: recruiterData, error: recruiterError } = await supabase
        .from('recruiters')
        .select('wallet_balance')
        .eq('auth_id', user.id)
        .single();
        
      if (recruiterData) {
        setBalance(recruiterData.wallet_balance || 0);
      }

      // Get Transactions
      // First get recruiter ID
      const { data: recruiterIdData } = await supabase
        .from('recruiters')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (recruiterIdData) {
        const { data: txData, error: txError } = await supabase
          .from('recruiter_transactions')
          .select('*')
          .eq('recruiter_id', recruiterIdData.id)
          .order('created_at', { ascending: false });
          
        if (txData) {
          setTransactions(txData);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user?.id]);

  const handleDownloadStatement = () => {
    console.log("Download statement clicked");
    toast.info("Statement download coming soon");
  };

  const handleFundWalletClick = async () => {
    if (!user?.email) {
      toast.error("User email not found. Please log in again.");
      return;
    }

    if (!fundingAmount || Number(fundingAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsProcessingPayment(true);

    try {
      const callbackUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/recruiter/wallet/verify` 
        : '';

      const response = await fetch('/api/wallet/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(fundingAmount),
          email: user.email,
          callbackUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      if (data.authorization_url) {
        // Redirect to Paystack
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL returned');
      }

    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast.error(error.message || "Failed to start payment");
      setIsProcessingPayment(false);
    }
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
        <p className="text-2xl md:text-2xl font-bold text-foreground mb-6">
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            `₦${balance.toLocaleString()}`
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setIsFundingModalOpen(true)}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Lock className="w-4 h-4 mr-2" />
            Fund with Paystack
          </Button>
          <Button
            onClick={handleDownloadStatement}
            variant="outline"
            className="flex-1 border-border bg-foreground/20 text-foreground hover:bg-muted"
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
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No transactions yet</div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold ${
                    transaction.type === "credit"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {transaction.type === "credit" ? "+" : "-"}₦
                  {transaction.amount.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Funding Modal */}
      <Dialog open={isFundingModalOpen} onOpenChange={setIsFundingModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Fund Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount to fund"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFundingModalOpen(false)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFundWalletClick}
              disabled={!fundingAmount || isProcessingPayment}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RecruiterWallet(props: RecruiterWalletProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading wallet...</div>}>
      <RecruiterWalletContent {...props} />
    </Suspense>
  );
}
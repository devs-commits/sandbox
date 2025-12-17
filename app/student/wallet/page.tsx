import { useState } from "react";
import { StudentHeader } from "../../components/students/StudentHeader";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Shield, Gift, CheckCircle, Lock, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock data - replace with backend integration
const walletData = {
  balance: 42000,
  bankName: "Parallex Bank",
  accountNumber: "0079484763",
  accountName: "John Snow",
  earnedTotal: 42000,
  loanTarget: 100000,
  loanAmount: 50000,
  interestRate: "2.5%/Month",
  duration: "30 Days",
  repayment: "Bounty Hunter Earning",
};

type ModalType = "locked" | "eligible" | "granted" | null;

export default function GlobalWallet() {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loanProgress = (walletData.earnedTotal / walletData.loanTarget) * 100;
  const isEligible = walletData.earnedTotal >= walletData.loanTarget;

  const handleRequestLoan = () => {
    if (isEligible) {
      setModalType("eligible");
    } else {
      setModalType("locked");
    }
  };

  const handleAcceptLoan = () => {
    setModalType("granted");
  };

  return (
    <>
      <Header
        title="Global Payroll Wallet"
        subtitle="The smartest way for African talent to receive, hold, and spend global income."
        onMenuClick={() => setSidebarOpen(true)}
      />
      <main className="flex-1 p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Wallet Card */}
          <div className="bg-gradient-to-br from-[#0A3D3D] to-[#0D2F2F] rounded-xl p-6 border border-primary/30">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-primary text-xs font-medium uppercase tracking-wider mb-2">
                  TOTAL BALANCE (NGN EQUIV)
                </p>
                <h2 className="text-4xl font-bold text-foreground">
                  ₦{walletData.balance.toLocaleString()}
                </h2>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-card/30 rounded-lg mb-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  BANK NAME
                </p>
                <p className="font-medium text-foreground text-sm">{walletData.bankName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  ACCOUNT NUMBER
                </p>
                <p className="font-medium text-foreground text-sm">
                  {walletData.accountNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  ACCOUNT NAME
                </p>
                <p className="font-medium text-foreground text-sm">
                  {walletData.accountName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <p className="text-sm text-muted-foreground">
                Powered by Parallex Bank licensed by CBN
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">₦</span>
                </div>
                <div className="w-6 h-6 bg-purple rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">P</span>
                </div>
                <div className="w-6 h-6 bg-cyan rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            <Button className="w-full bg-green hover:bg-green/90 text-white">
              Withdraw
            </Button>
          </div>

          {/* Side Cards */}
          <div className="space-y-4">
            {/* Inflation Hedge */}
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-cyan/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-cyan" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Inflation Hedge</h3>
                  <p className="text-sm text-muted-foreground">
                    Don't let devaluation eat your salary. Hold funds in USD/GBP.
                  </p>
                </div>
              </div>
            </div>

            {/* Career Support Loan */}
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-purple/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-purple" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Career Support Loan</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn a total of ₦100,000 to unlock access to low-interest loans for accessories, laptops, and tools that support your career growth.
                  </p>
                </div>
              </div>

              <div className="mb-2">
                <Progress value={loanProgress} className="h-2" />
              </div>
              <p className="text-right text-sm text-muted-foreground mb-4">
                You've earned: ₦{walletData.earnedTotal.toLocaleString()} / ₦{walletData.loanTarget.toLocaleString()}
              </p>

              <Button
                variant="outline"
                className="w-full border-coral/50 text-coral hover:bg-coral/10 hover:text-coral"
                onClick={handleRequestLoan}
              >
                <Lock className="w-4 h-4 mr-2" />
                Request Loan (Locked)
              </Button>
            </div>
          </div>
        </div>

        {/* Loan Locked Modal */}
        <Dialog open={modalType === "locked"} onOpenChange={() => setModalType(null)}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader className="text-center">
              <button 
                onClick={() => setModalType(null)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <DialogTitle className="text-xl font-semibold text-foreground text-center pt-4">
                Loan Feature Locked
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                You need to earn a minimum of ₦100,000 on the platform to access Career Support Loans. This helps us verify your activity, performance, and repayment reliability.
              </p>
              <p className="text-muted-foreground mb-6">
                Once unlocked, you'll be able to request loans to purchase: Laptops, Accessories, Learning tools, Work essentials.
              </p>
              <Button 
                className="bg-coral hover:bg-coral/90 text-white px-8"
                onClick={() => setModalType(null)}
              >
                Okay, Got It
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Loan Eligible Modal */}
        <Dialog open={modalType === "eligible"} onOpenChange={() => setModalType(null)}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader className="text-center">
              <button 
                onClick={() => setModalType(null)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <DialogTitle className="text-xl font-semibold text-foreground text-center pt-4">
                Career Support Loan
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-green mb-4">
                ₦{walletData.loanAmount.toLocaleString()}
              </p>
              <p className="text-muted-foreground mb-6">
                You are eligible to access our Career Support Loan to purchase work tools such as laptops, accessories, and learning equipment.
              </p>
              
              <div className="bg-secondary rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Interest Rate:</span>
                  <span className="text-foreground font-medium">{walletData.interestRate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="text-foreground font-medium">{walletData.duration}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Repayment:</span>
                  <span className="text-foreground font-medium">{walletData.repayment}</span>
                </div>
              </div>

              <Button 
                className="w-full bg-green hover:bg-green/90 text-white"
                onClick={handleAcceptLoan}
              >
                Accept Loan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Loan Granted Modal */}
        <Dialog open={modalType === "granted"} onOpenChange={() => setModalType(null)}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader className="text-center">
              <button 
                onClick={() => setModalType(null)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <DialogTitle className="text-xl font-semibold text-foreground text-center pt-4">
                Loan Granted
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-6">
                Your loan application has been received. Your account will be funded within 24-72 hours.
              </p>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                onClick={() => setModalType(null)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
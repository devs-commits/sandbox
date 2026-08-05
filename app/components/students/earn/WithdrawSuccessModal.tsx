import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Clock } from "lucide-react"; // 🔥 Changed to Clock to show pending status

interface WithdrawSuccessModalProps {
  open: boolean;
  onClose: () => void;
  amount: string | number;
}

export function WithdrawSuccessModal({ open, onClose, amount }: WithdrawSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0f172a] border-white/10 text-white rounded-3xl p-8 text-center">
        
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center border-4 border-amber-500/20">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>
        
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center text-white tracking-tight mb-2">
            Request Submitted
          </DialogTitle>
          <DialogDescription className="text-center text-white/50 text-base leading-relaxed">
            Your withdrawal request for <strong className="text-white">₦{Number(amount).toLocaleString()}</strong> has been successfully sent to the finance team for review.
            <br /><br />
            You will receive an email notification once the funds have been approved and transferred to your bank account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-8">
          <Button 
            onClick={onClose} 
            className="w-full h-14 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
          >
            Return to Ledger
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
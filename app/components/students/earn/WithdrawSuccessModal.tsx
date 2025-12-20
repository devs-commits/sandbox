import { CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

interface WithdrawSuccessModalProps {
  open: boolean;
  onClose: () => void;
  amount: string;
}

export function WithdrawSuccessModal({ open, onClose, amount }: WithdrawSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center">
            <DialogTitle className="flex items-center gap-2">
              Withdrawal
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Withdrawal Successful</h3>
          <p className="text-muted-foreground text-center text-sm">
            Your withdrawal of ₦{parseInt(amount || "0").toLocaleString()} has been processed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
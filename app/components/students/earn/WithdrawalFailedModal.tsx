import { XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

interface WithdrawFailedModalProps {
  open: boolean;
  onClose: () => void;
}

export function WithdrawFailedModal({ open, onClose }: WithdrawFailedModalProps) {
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
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Withdrawal Failed</h3>
          <p className="text-muted-foreground text-center text-sm">
            Please check your details and try again.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
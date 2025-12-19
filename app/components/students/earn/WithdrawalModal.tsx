import { X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

const banks = [
  "Access Bank",
  "GTBank",
  "First Bank",
  "UBA",
  "Zenith Bank",
  "Kuda Bank",
  "Opay",
  "Palmpay",
];

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  totalEarnings: number;
  userName: string;
  bankName: string;
  setBankName: (value: string) => void;
  accountNumber: string;
  setAccountNumber: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  onWithdraw: () => void;
}

export function WithdrawModal({
  open,
  onClose,
  totalEarnings,
  userName,
  bankName,
  setBankName,
  accountNumber,
  setAccountNumber,
  amount,
  setAmount,
  onWithdraw,
}: WithdrawModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border max-w-md p-0 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            {/* <h2 className="text-xl font-semibold text-foreground">Withdraw</h2> */}
            <DialogTitle className="text-xl font-semibold text-foreground">
              Withdraw
            </DialogTitle>
            <div className="background-muted-foreground h=1 w=full" ></div>
          </div>

          {/* Earnings Display */}
          <div className="bg-[linear-gradient(135deg,hsla(262,55%,22%,1)_0%,hsla(252,45%,18%,1)_45%,hsla(242,39%,14%,1)_100%)] rounded-xl p-4 mb-4">
            <p className="text-green-500 text-xs font-medium uppercase tracking-wider mb-1">
              TOTAL EARNINGS
            </p>
            <p className="text-2xl font-bold text-foreground">
              ₦{totalEarnings.toLocaleString()}
            </p>
          </div>

          {/* Warning Note */}
          <div className="bg-yellow/20 rounded-lg p-3 mb-6">
            <p className="text-yellow text-sm">
              Note: Your bank account name must be the same as your registered name.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                BANK NAME
              </label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select Bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                ACCOUNT NUMBER
              </label>
              <Input
                type="text"
                placeholder="Enter account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {/* User Name Display */}
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-foreground font-semibold">{userName}</p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                AMOUNT
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <Button 
            onClick={onWithdraw}
            className="w-full mt-6 bg-green hover:bg-green/90 text-white"
          >
            Withdraw
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
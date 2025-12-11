import { cn } from "../../lib/utils";

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const paymentMethods = [
  { id: "visa", label: "Visa/Mastercard" },
  { id: "paypal", label: "PayPal" },
  { id: "bank", label: "Nigeria bank transfer" },
];

export const PaymentMethodSelector = ({ value, onChange }: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Select Payment Method
      </label>
      <div className="flex flex-wrap gap-2">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onChange(method.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
              value === method.id
                ? "bg-primary/20 border-primary text-primary"
                : "bg-secondary border-border text-foreground hover:border-primary/50"
            )}
          >
            {method.label}
          </button>
        ))}
      </div>
    </div>
  );
};

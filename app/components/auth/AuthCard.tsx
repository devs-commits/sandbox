import { X } from "lucide-react";
import { cn } from"../../lib/utils";

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const AuthCard = ({ title, children, onClose, className }: AuthCardProps) => {
  return (
    <div className={cn(
      "w-full max-w-md bg-card rounded-xl border border-border p-6 relative",
      className
    )}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-destructive hover:text-destructive/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

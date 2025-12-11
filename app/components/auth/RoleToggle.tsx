import { cn } from "../../lib/utils";

interface RoleToggleProps {
  value: "student" | "recruiter";
  onChange: (value: "student" | "recruiter") => void;
}

export const RoleToggle = ({ value, onChange }: RoleToggleProps) => {
  return (
    <div className="flex items-center justify-center gap-1 bg-secondary rounded-full p-1 w-fit mx-auto">
      <button
        type="button"
        onClick={() => onChange("student")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
          value === "student" 
            ? "text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className={cn(
          "w-3 h-3 rounded-full border-2 transition-all",
          value === "student" 
            ? "bg-primary border-primary" 
            : "border-muted-foreground"
        )} />
        Student
      </button>
      <button
        type="button"
        onClick={() => onChange("recruiter")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
          value === "recruiter" 
            ? "text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className={cn(
          "w-3 h-3 rounded-full border-2 transition-all",
          value === "recruiter" 
            ? "bg-primary border-primary" 
            : "border-muted-foreground"
        )} />
        Recruiter
      </button>
    </div>
  );
};
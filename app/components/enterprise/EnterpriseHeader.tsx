interface EnterpriseHeaderProps {
  title: string;
  subtitle?: string;
}

export const EnterpriseHeader = ({ title, subtitle }: EnterpriseHeaderProps) => {
  return (
    <header className="px-4 lg:px-6 py-4 flex items-center justify-between border-b border-border">
      {/* Left side - Title */}
      <div className="lg:ml-0 ml-12">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm font-medium text-foreground">{subtitle}</p>
      </div>

      {/* Right side - User info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-primary/20 text-primary-foreground px-3 py-1.5 rounded-full">
          <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            JS
          </div>
          <span className="text-sm font-medium hidden sm:inline text-foreground">John Snow</span>
        </div>
      </div>
    </header>
  );
};

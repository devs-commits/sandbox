interface StudentHeaderProps {
  title: string;
  subtitle?: string;
}

export const StudentHeader = ({ title }: StudentHeaderProps) => {
  return (
    <header className="px-4 lg:px-6 py-4 flex items-center justify-between border-b border-border">
      {/* Left side - Title */}
      <div className="lg:ml-0 ml-12">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h1>
      </div>

      {/* Right side - User info */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground">Digital Marketing</p>
          <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">INTERN</span>
        </div>
        <div className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-full">
          <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            JS
          </div>
          <span className="text-sm font-medium hidden sm:inline">John Snow</span>
        </div>
      </div>
    </header>
  );
};

interface FooterDarkProps {
  locations?: string[];
}

const FooterDark = ({ locations = ['Lagos', 'Nairobi', 'Remote'] }: FooterDarkProps) => {
  return (
    <footer className="bg-background border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-teal">
              <span className="text-primary-foreground font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-lg text-foreground">
              WDC<span className="font-normal text-muted-foreground">Labs</span>
            </span>
          </a>

          {/* Locations */}
          <p className="text-sm text-muted-foreground">
            {locations.map((loc, index) => (
              <span key={loc}>
                {loc}
                {index < locations.length - 1 && <span className="mx-2 text-teal">•</span>}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterDark;
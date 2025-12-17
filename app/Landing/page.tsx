import { Button } from "../components/ui/button";
import Link from "next/link";
import wdcLogo from "../../public/wdc-logo.jpg";
import Image from "next/image";

const Landing = () => {
  return (
    <div className="min-h-screen bg-[hsla(222,47%,11%,1)] relative overflow-hidden">
        <header className="relative z-10 w-full px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <Link href="/" className="inline-block">
                <Image src={wdcLogo} alt="WDC Labs" className="h-[50px] w-[120px] sm:h-[55px] sm:w-[200px]" />
              </Link>
            </div>
        </header>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        <main className="min-h-screen hero-gradient flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div
            className="absolute right-0 top-1/4 w-1/2 h-2/3 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 70% 50%, hsl(187 100% 50% / 0.7), transparent 75%)",
              filter: "blur(40px)",
              zIndex: 0,
            }}
          />

          {/* Hero Card */}
          <div className="w-full max-w-4xl card-gradient rounded-2xl p-8 sm:p-12 lg:p-16 card-shadow border border-border/30 animate-scale-in">
          <div
            className="absolute right-0 top-1/4 w-1/2 h-2/3 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 70% 50%, hsl(187 100% 50% / 0.7), transparent 75%)",
              filter: "blur(40px)",
              zIndex: 0,
            }}
          />
            <div className="text-center space-y-6">
              {/* Headline */}
              <h1 
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight opacity-0 animate-fade-in"
                style={{ animationDelay: "0.1s" }}
              >
                Don't Just Learn Tech.
                <br />
                <span className="text-foreground">Simulate The Job.</span>
              </h1>

              {/* Subtitle */}
              <p 
                className="text-muted-foreground text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in"
                style={{ animationDelay: "0.3s" }}
              >
                A gamified, AI-powered job simulation lab that gives you real
                work experience recruiters trust.
              </p>
    {/* CTA Buttons */}
              <div 
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 opacity-0 animate-fade-in"
                style={{ animationDelay: "0.5s" }}
              >
                <Button variant="hero" size="lg" className="w-full sm:w-auto min-w-[200px]" asChild>
                  <Link href="/signup">Start Your Internship</Link>
                </Button>
                <Button variant="heroOutline" size="lg" className="w-full sm:w-auto min-w-[200px]" asChild>
                  <Link href="/login">Member Login</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
    </div>
  );
};

export default Landing;
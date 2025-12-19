import { Button } from "../components/ui/button";
import Link from "next/link";
import wdcLogo from "../../public/wdc-logo.jpg";
import Image from "next/image";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
        <header className="relative z-10 w-full py-4 border border-b-muted-foreground">
            <div className="max-w-7xl ml-[100px]">
              <Link href="/" className="inline-block">
                <Image src={wdcLogo} alt="WDC Labs" className="h-[50px] w-[120px] sm:h-[55px] sm:w-[200px]" />
              </Link>
            </div>
        </header>
        <main className="bg-background min-h-[650px] hero-gradient flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Hero Card */}
          <div className="bg-card w-full max-w-6xl h-full rounded-2xl p-4 sm:p-12 lg:p-16 card-shadow border border-muted-foreground/50 border-1 animate-scale-in">
            <div className="text-center items-center justify-center space-y-6 py-16 sm:py-20 lg:py-24">
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
                <Button variant="hero" size="lg" className="w-full sm:w-auto min-w-[200px] text-foreground" asChild>
                  <Link href="/signup">Start Your Internship</Link>
                </Button>
                <Button variant="heroOutline" size="lg" className="w-full sm:w-auto min-w-[200px] color-foreground" asChild>
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
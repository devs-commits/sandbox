"use client";
import { Button } from "../../components/ui/button";
import Link from "next/link";

const Landing = () => {
  return (
    <main className="min-h-screen hero-gradient flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Hero Card */}
      <div className="w-full max-w-4xl card-gradient rounded-2xl p-8 sm:p-12 lg:p-16 card-shadow border border-border/30 animate-scale-in">
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
  );
};

export default Landing;
import Link from "next/link";
import { MailCheck } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-white/10 p-8 rounded-[2rem] shadow-2xl max-w-md w-full text-center space-y-6 relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto relative z-10">
          <MailCheck className="w-12 h-12 text-primary" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl font-black text-white tracking-tight">Check Your Email</h1>
          <p className="text-white/60 text-sm leading-relaxed">
            We've sent a secure verification link to your inbox. Please click the link to activate your WDC Labs account.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-xl relative z-10">
           <p className="text-xs text-white/40 font-medium">
             Didn't receive the email? Make sure to check your spam or promotions folder.
           </p>
        </div>

        <div className="pt-4 relative z-10">
          <Link 
            href="/login" 
            className="flex items-center justify-center w-full h-14 bg-primary text-primary-foreground font-bold tracking-widest uppercase rounded-xl hover:opacity-90 transition-opacity shadow-lg"
          >
            Return to Login
          </Link>
        </div>

      </div>
    </div>
  );
}
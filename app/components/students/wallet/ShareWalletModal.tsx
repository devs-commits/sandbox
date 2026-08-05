"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Share2, Copy, Heart, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface ShareWalletModalProps {
  open: boolean;
  onClose: () => void;
  accountName: string;
  accountNumber: string;
  bankName: string;
  track: string; // We keep the prop just in case, but we don't rely on it for the default anymore
}

export function ShareWalletModal({ open, onClose, accountName, accountNumber, bankName }: ShareWalletModalProps) {
  
  // The official learning paths
  const availableTracks = ["Cybersecurity", "Data Analytics", "Digital Marketing"];
  
  // 🔥 Set to empty by default so they MUST select one
  const [selectedTrack, setSelectedTrack] = useState<string>("");

  // Reset the selection whenever the modal closes/opens
  useEffect(() => {
    if (!open) setSelectedTrack("");
  }, [open]);

  const shareMessage = `🚀 Support my tech journey at WDC Labs!\n\nI am currently training to become a world-class ${selectedTrack || "[Your Path]"} professional. You can support my learning by funding my workspace wallet to cover my ₦15,000 monthly subscription.\n\n📚 Path: ${selectedTrack || "[Your Path]"}\n🏦 Bank: ${bankName}\n🔢 Account: ${accountNumber}\n👤 Name: ${accountName}\n\nThank you for investing in my future! 💻✨`;

  const handleCopy = () => {
    if (!selectedTrack) return toast.error("Please select a learning path first!");
    navigator.clipboard.writeText(shareMessage);
    toast.success("Funding message copied to clipboard!");
  };

  const handleShare = async () => {
    if (!selectedTrack) return toast.error("Please select a learning path first!");
    
    const shareData = {
      title: 'Support my WDC Labs Journey',
      text: shareMessage,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      handleCopy();
    }
  };

  const isReady = selectedTrack !== "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0f172a] border-white/10 text-white rounded-[2rem] p-0 overflow-hidden">
        
        <DialogTitle className="sr-only">Sponsor My Learning</DialogTitle>
        <DialogDescription className="sr-only">Invite friends and family to fund your wallet.</DialogDescription>
        
        <div className="bg-gradient-to-br from-[#111b2f] via-[#0d1729] to-[#0a1425] p-8 relative overflow-hidden">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none"></div>
           <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none"></div>
           
           <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
                 <Heart className="text-emerald-400 w-8 h-8" fill="currentColor" />
              </div>
              
              <h2 className="text-2xl font-black text-white tracking-tight mb-2" aria-hidden="true">Sponsor My Learning</h2>
              <p className="text-sm text-white/60 mb-5 max-w-[250px] mx-auto">
                Invite friends and family to fund your wallet for your ₦15,000/month subscription.
              </p>

              {/* 🔥 Interactive Track Selector */}
              <div className="w-full mb-6">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${selectedTrack ? 'text-white/40' : 'text-amber-400 animate-pulse'}`}>
                  {selectedTrack ? "Path Selected" : "Select your path to continue *"}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {availableTracks.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTrack(t)}
                      className={`text-[10px] uppercase font-black tracking-widest px-3 py-2 rounded-xl transition-all duration-300 ${
                        selectedTrack === t 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 scale-105" 
                          : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Details Card */}
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-left relative overflow-hidden shadow-2xl">
                 <div className="flex justify-between items-start mb-6">
                    <GraduationCap className="text-white/20 w-8 h-8" />
                    <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">WDC Workspace</span>
                 </div>
                 
                 <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Account Number</p>
                      <p className="text-2xl font-mono font-bold text-white tracking-widest mt-1">{accountNumber}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                       <div>
                         <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Bank Name</p>
                         <p className="text-sm font-bold text-white mt-1 truncate">{bankName}</p>
                       </div>
                       <div>
                         <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Account Name</p>
                         <p className="text-sm font-bold text-white mt-1 truncate">{accountName}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-black/40 flex gap-3">
           <Button 
              onClick={handleCopy} 
              disabled={!isReady}
              variant="outline" 
              className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5 h-12 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
           >
              <Copy className="w-4 h-4 mr-2" /> Copy text
           </Button>
           <Button 
              onClick={handleShare} 
              disabled={!isReady}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-12 rounded-xl font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-30 disabled:cursor-not-allowed"
           >
              <Share2 className="w-4 h-4 mr-2" /> Share now
           </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
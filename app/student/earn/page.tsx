"use client";
import { StudentHeader } from "@/app/components/students/StudentHeader";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Image from "next/image";
import {
  Copy,
  Link as LinkIcon,
ShieldCheckIcon,
} from "lucide-react";

// Import modal components
import { IdentityVerifiedModal } from  "../../components/students/earn/IdentityVerifiedModal";
import { IdentityFailedModal } from "../../components/students/earn/IdentityFailedModal";
import { WithdrawModal } from "../../components/students/earn/WithdrawalModal";
import { WithdrawSuccessModal } from "../../components/students/earn/WithdrawSuccessModal";
import { WithdrawFailedModal } from "../../components/students/earn/WithdrawalFailedModal";
import { SocialIcon } from "../../components/students/earn/SocialIcon";

// Mock data
const earnData = {
  totalEarnings: 42000,
  activeReferrals: 8,
  referralLink: "wdc.mg/join/john-snow-88",
  userName: "JOHN SNOW",
  bvn: "222 *********",
};

const getSocialLinks = (referralLink: string) => {
  const encodedLink = encodeURIComponent(`https://${referralLink}`);
  const shareText = encodeURIComponent("Join me on Warlord Digital Club and start earning! 💰");
  
  return [
    { name: "Copy link", icon: "link", color: "bg-cyan-500/20 text-cyan-500", url: null },
    { name: "Instagram", icon: "instagram", color: "bg-pink-500/20 text-pink-500", url: `https://www.instagram.com/` },
    { name: "Whatsapp", icon: "whatsapp", color: "bg-green-500/20 text-green-500", url: `https://wa.me/?text=${shareText}%20${encodedLink}` },
    { name: "Status", icon: "status", color: "bg-green-500/20 text-green-500", url: `https://wa.me/?text=${shareText}%20${encodedLink}` },
    { name: "Facebook", icon: "facebook", color: "bg-blue-600/20 text-blue-600", url: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}` },
    { name: "Snapchat", icon: "snapchat", color: "bg-yellow-500/20 text-yellow-500", url: `https://www.snapchat.com/` },
    { name: "Telegram", icon: "telegram", color: "bg-blue-400/20 text-blue-400", url: `https://t.me/share/url?url=${encodedLink}&text=${shareText}` },
    { name: "Tiktok", icon: "tiktok", color: "bg-foreground/20 text-foreground", url: `https://www.tiktok.com/` },
    { name: "Linkedin", icon: "linkedin", color: "bg-blue-700/20 text-blue-700", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}` },
    { name: "Email", icon: "email", color: "bg-purple-500/20 text-purple-500", url: `mailto:?subject=${shareText}&body=${shareText}%20${encodedLink}` },
    { name: "Thread", icon: "thread", color: "bg-foreground/20 text-foreground", url: `https://www.threads.net/` },
    { name: "X", icon: "x", color: "bg-foreground/20 text-foreground", url: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedLink}` },
  ];
};

type ModalType = 
  | "none" 
  | "identityVerified" 
  | "identityFailed" 
  | "withdraw" 
  | "withdrawSuccess" 
  | "withdrawFailed";

export default function EarnMoney() {
  const [activeModal, setActiveModal] = useState<ModalType>("none");
  const [isVerified, setIsVerified] = useState(false);
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(earnData.referralLink);
  };

  const handleVerifyIdentity = () => {
    if (bvn && nin && bvn.length >= 10 && nin.length >= 11) {
      setIsVerified(true);
      setActiveModal("identityVerified");
    } else {
      setActiveModal("identityFailed");
    }
  };

  const handleWithdrawClick = () => {
    if (isVerified) {
      setActiveModal("withdraw");
    } else {
      setActiveModal("identityFailed");
    }
  };

  const handleWithdraw = () => {
    if (bankName && accountNumber && amount && parseInt(amount) > 0) {
      setActiveModal("withdrawSuccess");
    } else {
      setActiveModal("withdrawFailed");
    }
  };

  const closeModal = () => {
    setActiveModal("none");
  };

  return (
    <>
      <StudentHeader
        title="Earn Money"
        subtitle="Digital Marketing Intern"
      />
      <main className="flex-1 p-4 lg:p-6">
        <div className="max-w-5xl space-y-6">
          {/* Hero Section */}
          <div className="bg-[linear-gradient(135deg,hsla(176,50%,12%,1)_0%,hsla(204,48%,12%,1)_45%,hsla(176,50%,14%,1)_100%)] rounded-xl p-6 border border-primary/30 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-foreground mb-2">
              Turn Your Network into Net Worth
            </h2>
            <p className="text-muted-foreground">
              Earn N2,000 instantly (once your friend pays the first month subscription)
              <br />
              + 10% recurring commission every payment he makes. Cash out anytime.
            </p>
            </div>
            <div className="absolute right-0 top-0 w-1/3 h-full bg-green-500/10 skew-x-12 transform translate-x-10"></div>
          </div>

          {/* Top Row - Earnings and Referrals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Earnings Card */}
            <div className="bg-[linear-gradient(135deg,hsla(261,56%,20%,1)_0%,hsla(256,49%,18%,1)_100%)] rounded-xl p-6 border border-border">
              <p className="text-[hsla(145,100%,39%,1)] text-sm font-medium uppercase tracking-wider mb-2">
                TOTAL EARNINGS
              </p>
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-foreground">
                  ₦{earnData.totalEarnings.toLocaleString()}
                </h2>
                <Button 
                  onClick={handleWithdrawClick}
                  className="bg-[hsla(145,100%,39%,1)] hover:bg-[hsla(145,100%,39%,1)]/90 text-primary-foreground px-6 text-foreground"
                >
                  Withdraw
                </Button>
              </div>
            </div>

            {/* Active Referrals Card */}
            <div className="bg-[linear-gradient(135deg,hsla(198,82%,33%,1)_0%,hsla(206,61%,15%,1)_100%)] rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-1">
                    ACTIVE REFERRALS
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {earnData.activeReferrals} <span className="text-lg font-normal">Interns</span>
                  </p>
                </div>
                <div className="w-[100px] h-[100px] bg-purple/20 rounded-lg flex items-center justify-center">
                  <Image src="/proicons_gift.png" alt="Gift" width={60} height={40} className="w-28 h-28 text-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - Verification and Referral Link */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Identity Verification Card */}
            <div className="bg-[hsla(216,36%,18%,1)] rounded-xl p-6 border border-border relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground">Identity Verification</h3>
                </div>
                <div className="p-1 rounded-md">
                  <Image 
                    src="/cbn-logo.png" 
                    alt="CBN Logo" 
                    width={40} 
                    height={40} 
                    className="object-contain w-10 h-10" 
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                To enable withdrawals, we are required by CBN to verify your identity.
              </p>

              <div className="space-y-8">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-4">
                    BANK VERIFICATION NUMBER (BVN)
                  </label>
                  <Input
                    type="text"
                    placeholder="222 *********"
                    value={bvn}
                    onChange={(e) => setBvn(e.target.value)}
                    className="bg-background border-border h-11"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-4">
                    NATIONAL IDENTIFICATION NUMBER (NIN)
                  </label>
                  <Input
                    type="text"
                    placeholder="11 Digits"
                    value={nin}
                    onChange={(e) => setNin(e.target.value)}
                    className="bg-background border-border h-11"
                  />
                </div>
              </div>

              <Button 
                onClick={handleVerifyIdentity}
                className="w-full h-11 mt-6 bg-primary hover:bg-primary/90 text-white"
              >
                Verify Identity
              </Button>
            </div>

            {/* Your Warlord Link Card */}
            <div className="bg-[hsla(216,36%,18%,1)] rounded-xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <LinkIcon className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-foreground">Your Warlord Link</h3>
              </div>

              <div className="flex items-center gap-2 bg-background rounded-lg p-3 mb-6">
                <p className="flex-1 text-primary">{earnData.referralLink}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
                SHARE LINK TO:
              </p>

              <div className="grid grid-cols-4 gap-1">
                {getSocialLinks(earnData.referralLink).map((link, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (link.name === "Copy link") {
                        copyToClipboard();
                      } else if (link.url) {
                        window.open(link.url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${link.color}`}>
                      <SocialIcon name={link.icon} />
                    </div>
                    <span className="text-xs text-muted-foreground">{link.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <IdentityVerifiedModal 
        open={activeModal === "identityVerified"} 
        onClose={closeModal} 
      />
      
      <IdentityFailedModal 
        open={activeModal === "identityFailed"} 
        onClose={closeModal} 
      />
      
      <WithdrawModal
        open={activeModal === "withdraw"}
        onClose={closeModal}
        totalEarnings={earnData.totalEarnings}
        userName={earnData.userName}
        bankName={bankName}
        setBankName={setBankName}
        accountNumber={accountNumber}
        setAccountNumber={setAccountNumber}
        amount={amount}
        setAmount={setAmount}
        onWithdraw={handleWithdraw}
      />
      
      <WithdrawSuccessModal
        open={activeModal === "withdrawSuccess"}
        onClose={closeModal}
        amount={amount}
      />
      
      <WithdrawFailedModal
        open={activeModal === "withdrawFailed"}
        onClose={closeModal}
      />
    </>
  );
}
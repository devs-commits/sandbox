"use client";
import { StudentHeader } from "@/app/components/students/StudentHeader";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Copy,
  Link as LinkIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { IdentityVerifiedModal } from "../../components/students/earn/IdentityVerifiedModal";
import { IdentityFailedModal } from "../../components/students/earn/IdentityFailedModal";
import { WithdrawModal } from "../../components/students/earn/WithdrawalModal";
import { WithdrawSuccessModal } from "../../components/students/earn/WithdrawSuccessModal";
import { WithdrawFailedModal } from "../../components/students/earn/WithdrawalFailedModal";
import { SocialIcon } from "../../components/students/earn/SocialIcon";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/contexts/AuthContexts";
import { useEffect } from "react";

const initialEarnData = {
  totalEarnings: 0,
  activeReferrals: 0,
  referralLink: "Loading...",
  userName: "User",
  bvn: "",
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
  | "withdrawFailed"
  | "basicInfo"
  | "identityWarning";

export default function EarnMoney() {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<ModalType>("none");
  const [isVerified, setIsVerified] = useState(false);
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [occupation, setOccupation] = useState("");
  const [nationality, setNationality] = useState("");
  
  const [formErrors, setFormErrors] = useState({
    fullName: "",
    address: "",
    dateOfBirth: "",
    occupation: "",
    nationality: ""
  });

  const searchParams = useSearchParams();
  const [earnData, setEarnData] = useState(initialEarnData);

  useEffect(() => {
    if (user) {
      fetchEarnData();
    }

    const focus = searchParams.get('focus');
    if (focus === 'verification') {
      const section = document.getElementById('verification-section');
      if (section) {
        setTimeout(() => {
          section.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    } else if (focus === 'withdraw') {
      setActiveModal("withdraw");
    }
  }, [user, searchParams]);

  const fetchEarnData = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, wallet_balance, referral_code, full_name, id_verified, bvn, nin, bank_name, account_number, account_name')
        .eq('auth_id', user?.id)
        .single();

      const { count, error: refError } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userData?.id || 0);

      if (userData) {
        const code = userData.referral_code || "Generate Code";
        const fullLink = userData.referral_code
          ? `${window.location.origin}/signup?code=${userData.referral_code}`
          : "Complete setup to get code";

        setEarnData({
          totalEarnings: userData.wallet_balance || 0,
          activeReferrals: count || 0,
          referralLink: fullLink,
          userName: userData.full_name || "User",
          bvn: ""
        });

        setIsVerified(userData.id_verified || false);
        setBvn(userData.bvn || "");
        setNin(userData.nin || "");
        setBankName(userData.bank_name || "");
        setAccountNumber(userData.account_number || "");
      }
    } catch (error) {
      console.error("Error fetching earn data:", error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(earnData.referralLink);
  };

  const validateBasicInfo = () => {
    const errors = {
      fullName: "",
      address: "",
      dateOfBirth: "",
      occupation: "",
      nationality: ""
    };

    if (!fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (fullName.length < 3) {
      errors.fullName = "Full name must be at least 3 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(fullName)) {
      errors.fullName = "Full name should only contain letters and spaces";
    }

    if (!address.trim()) {
      errors.address = "Address is required";
    } else if (address.length < 10) {
      errors.address = "Please enter a complete address";
    }

    if (!dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18) {
        errors.dateOfBirth = "You must be at least 18 years old";
      } else if (age > 100) {
        errors.dateOfBirth = "Please enter a valid date of birth";
      }
    }

    if (!occupation.trim()) {
      errors.occupation = "Occupation is required";
    } else if (occupation.length < 2) {
      errors.occupation = "Please enter a valid occupation";
    }

    if (!nationality.trim()) {
      errors.nationality = "Nationality is required";
    } else if (nationality.length < 2) {
      errors.nationality = "Please enter a valid nationality";
    }

    setFormErrors(errors);
    
    return !Object.values(errors).some(error => error !== "");
  };

  const handleBasicInfoSubmit = () => {
    if (!validateBasicInfo()) {
      return;
    }
    setActiveModal("identityWarning");
  };

  const handleProceedToIdentityVerification = () => {
    setActiveModal("none");
    const basicSection = document.getElementById('verification-section');
    const bvnSection = document.getElementById('identity-verification-form');
    
    if (basicSection && bvnSection) {
      basicSection.classList.add('hidden');
      bvnSection.classList.remove('hidden');
      bvnSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleVerifyIdentity = async () => {
    if (bvn && nin && bvn.length >= 10 && nin.length >= 11) {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            id_verified: true,
            bvn: bvn,
            nin: nin
          })
          .eq('auth_id', user?.id);

        if (error) throw error;

        setIsVerified(true);
        setActiveModal("identityVerified");
      } catch (err) {
        console.error("Verification error:", err);
        setActiveModal("identityFailed");
      }
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

  const handleWithdraw = async () => {
    const withdrawAmount = parseInt(amount);

    if (
      bankName &&
      accountNumber &&
      withdrawAmount &&
      withdrawAmount > 0
    ) {
      if (withdrawAmount > earnData.totalEarnings) {
        // Could use a toast here or just fail the modal
        // For now using withdrawFailed modal, but ideally should be specific
        console.error("Insufficient funds");
        setActiveModal("withdrawFailed");
        return;
      }

      try {
        await supabase
          .from('users')
          .update({
            bank_name: bankName,
            account_number: accountNumber,
            account_name: earnData.userName
          })
          .eq('auth_id', user?.id);

        setActiveModal("withdrawSuccess");
      } catch (err) {
        console.error("Withdraw error:", err);
        setActiveModal("withdrawFailed");
      }
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
            <div id="verification-section" className="bg-[hsla(216,36%,18%,1)] rounded-xl p-6 border border-border relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground">Complete Verification</h3>
                </div>
                <div className="p-1 rounded-md justify-between flex ">
                  <Image
                    src="/cbn-logo.png"
                    alt="CBN Logo"
                    width={40}
                    height={40}
                    className="object-contain w-14 h-14"
                  />
                  <Image
                    src="/ndpb.png"
                    alt="NDPB Logo"
                    width={40}
                    height={40}
                    className="object-contain w-14 h-14"
                  />
                </div>
              </div>
              
              <div className="bg-blue-50/10 border border-blue-200/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-100 mb-2">Your Privacy & Security</h4>
                    <p className="text-xs text-blue-200 leading-relaxed">
                      WDC Labs collects your data primarily to provide and improve your banking experience. 
                      We do not sell your personal data to third parties. Your information is encrypted 
                      and protected according to industry standards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                    FULL NAME
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your full legal name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (formErrors.fullName) {
                        setFormErrors(prev => ({ ...prev, fullName: "" }));
                      }
                    }}
                    className={`bg-background border-border h-10 ${
                      formErrors.fullName ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  />
                  {formErrors.fullName && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                    RESIDENTIAL ADDRESS
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your current address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (formErrors.address) {
                        setFormErrors(prev => ({ ...prev, address: "" }));
                      }
                    }}
                    className={`bg-background border-border h-10 ${
                      formErrors.address ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                      DATE OF BIRTH
                    </label>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        if (formErrors.dateOfBirth) {
                          setFormErrors(prev => ({ ...prev, dateOfBirth: "" }));
                        }
                      }}
                      className={`bg-background border-border h-10 ${
                        formErrors.dateOfBirth ? "border-red-500 focus:border-red-500" : ""
                      }`}
                    />
                    {formErrors.dateOfBirth && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.dateOfBirth}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                      OCCUPATION
                    </label>
                    <Input
                      type="text"
                      placeholder="Your occupation"
                      value={occupation}
                      onChange={(e) => {
                        setOccupation(e.target.value);
                        if (formErrors.occupation) {
                          setFormErrors(prev => ({ ...prev, occupation: "" }));
                        }
                      }}
                      className={`bg-background border-border h-10 ${
                        formErrors.occupation ? "border-red-500 focus:border-red-500" : ""
                      }`}
                    />
                    {formErrors.occupation && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.occupation}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                    NATIONALITY
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Nigerian"
                    value={nationality}
                    onChange={(e) => {
                      setNationality(e.target.value);
                      if (formErrors.nationality) {
                        setFormErrors(prev => ({ ...prev, nationality: "" }));
                      }
                    }}
                    className={`bg-background border-border h-10 ${
                      formErrors.nationality ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  />
                  {formErrors.nationality && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.nationality}</p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleBasicInfoSubmit}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white"
              >
                Proceed to Identity Verification
              </Button>
            </div>

            <div id="identity-verification-form" className="hidden bg-[hsla(216,36%,18%,1)] rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground">Complete Verification</h3>
                </div>
                <div className="p-1 rounded-md justify-between flex ">
                  <Image
                    src="/cbn-logo.png"
                    alt="CBN Logo"
                    width={40}
                    height={40}
                    className="object-contain w-14 h-14"
                  />
                  <Image
                    src="/ndpb.png"
                    alt="NDPB Logo"
                    width={40}
                    height={40}
                    className="object-contain w-14 h-14"
                  />
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6">
                To enable withdrawals, we are required by CBN to verify your identity with your BVN and NIN.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                    BANK VERIFICATION NUMBER (BVN)
                  </label>
                  <Input
                    type="text"
                    placeholder="222 *********"
                    value={bvn}
                    onChange={(e) => setBvn(e.target.value)}
                    className="bg-background border-border h-10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                    NATIONAL IDENTIFICATION NUMBER (NIN)
                  </label>
                  <Input
                    type="text"
                    placeholder="11 Digits"
                    value={nin}
                    onChange={(e) => setNin(e.target.value)}
                    className="bg-background border-border h-10"
                  />
                </div>
              </div>

              <Button
                onClick={handleVerifyIdentity}
                className="w-full h-11 mt-6 bg-primary hover:bg-primary/90 text-white"
              >
                Complete Verification
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

      {/* Identity Warning Modal */}
      {activeModal === "identityWarning" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl p-6 max-w-md w-full border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Confirm Your Information</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-sm text-muted-foreground">
                Please ensure all information provided is accurate and correct. 
                Incorrect information may lead to verification delays or failure.
              </p>
              
              <div className="bg-yellow-50/10 border border-yellow-200/30 rounded-lg p-3">
                <p className="text-xs text-yellow-200">
                  <strong>Important:</strong> Make sure your full name, address, date of birth, 
                  occupation, and nationality match your official documents.
                </p>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p><strong>Information you provided:</strong></p>
                <ul className="mt-2 space-y-1">
                  <li>• Full Name: {fullName || "Not provided"}</li>
                  <li>• Address: {address || "Not provided"}</li>
                  <li>• Date of Birth: {dateOfBirth || "Not provided"}</li>
                  <li>• Occupation: {occupation || "Not provided"}</li>
                  <li>• Nationality: {nationality || "Not provided"}</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={closeModal}
                className="flex-1"
              >
                Review Information
              </Button>
              <Button
                onClick={handleProceedToIdentityVerification}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                Confirm & Proceed
              </Button>
            </div>
          </div>
        </div>
      )}
      
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
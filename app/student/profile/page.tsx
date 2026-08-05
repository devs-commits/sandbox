"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Cropper from "react-easy-crop";
import { StudentHeader } from "@/app/components/students/StudentHeader";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  ShieldCheck, Landmark, Lock, Loader2, CheckCircle2, Fingerprint,
  Calendar, Phone, MapPin, Briefcase, XCircle, UserCircle, Camera,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/contexts/AuthContexts";

// Absolute imports
import { SetPinModal } from "@/app/components/auth/SetPinModal";
import { SubscriptionCard } from "@/app/components/students/earn/profile/SubscriptionCard"; 

// ==========================================
// HELPER: CREATE CROPPED IMAGE BLOB
// ==========================================
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
  const image = document.createElement("img");
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Canvas is empty"));
        else resolve(blob);
      },
      "image/jpeg",
      0.95
    );
  });
};

function ProfileSetupContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [hasWallet, setHasWallet] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  // Profile State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // KYC & Security State
  const [bvn, setBvn] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Cropper State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "security" || tabParam === "profile") {
      setActiveTab(tabParam as "profile" | "security");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", user.id)
          .limit(1)
          .maybeSingle();

        if (userError) console.error("Database user fetch error:", userError);

        const { data: walletData } = await supabase
          .from("wallets")
          .select("account_number, transaction_pin")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (userData) {
          setFullName(userData.full_name || (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || "");
          if (userData.phone) setPhone(userData.phone);
          if (userData.address) setAddress(userData.address);
          if (userData.occupation) setOccupation(userData.occupation);
          if (userData.avatar_url) setAvatarUrl(userData.avatar_url);

          if (userData.date_of_birth) {
            setDob(userData.date_of_birth.split("T")[0]);
          }

          if (userData.is_complete || (walletData?.account_number && walletData.account_number !== "****")) {
            setHasWallet(true);
          }
        }
        if (walletData?.transaction_pin) setHasPin(true);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // ==========================================
  // ACTION: SAVE GENERAL PROFILE
  // ==========================================
  const handleSaveProfile = async () => {
    if (!fullName) return toast.error("Full Name is required.");
    if (!phone) return toast.error("Phone Number is required.");
    if (!dob) return toast.error("Date of Birth is required.");

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("users")
        .upsert({
          auth_id: user?.id,
          email: user?.email, 
          role: "student", 
          track: (user as any)?.user_metadata?.track || "general", 
          full_name: fullName,
          phone: phone || null,
          date_of_birth: dob || null,
          address: address || null,
          occupation: occupation || null,
        }, { onConflict: 'auth_id' });

      if (error) throw error;
      
      toast.success("Profile details saved successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ==========================================
  // ACTION: GENERATE PAYSTACK WALLET (DVA)
  // ==========================================
  const handleProvisionWallet = async () => {
    if (!fullName || !phone || !dob) {
      setActiveTab("profile");
      return toast.error("Please complete your General Profile (Name, Phone, DOB) first.");
    }
    
    // 🔥 ONLY BVN IS REQUIRED NOW
    if (!bvn || bvn.length !== 11) return toast.error("BVN must be exactly 11 digits.");
    
    // 🔥 ONLY REQUIRE PIN IF THEY DON'T ALREADY HAVE ONE
    if (!hasPin) {
      if (!pin || pin.length !== 4) return toast.error("Please set a 4-digit PIN.");
      if (pin !== confirmPin) return toast.error("PINs do not match.");
    }

    setIsGeneratingWallet(true);

    try {
      const names = fullName.split(" ");
      const firstName = names[0];
      const lastName = names.slice(1).join(" ") || firstName;

      const res = await fetch("/api/wallet/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user?.id, 
          email: user?.email,
          phone: phone,
          firstName: firstName,
          lastName: lastName,
          bvn: bvn // NIN completely removed
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initiate identity verification.");
      }

      // 🔥 ONLY PUSH PIN TO BACKEND IF THEY ARE CREATING A NEW ONE
      if (!hasPin && pin) {
        const pinRes = await fetch("/api/wallet/update-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id, pin: pin }),
        });

        if (!pinRes.ok) {
          toast.warning("Validation started, but PIN setup failed. You can set it later in settings.");
        } else {
          setHasPin(true);
        }
      }
      
      toast.success("Validation started! Your virtual account will be assigned shortly.", {
        icon: <ShieldCheck className="text-emerald-500" />,
      });
      
      setBvn("");
      
      router.push("/student/wallet");
    } catch (error: any) {
      console.error("Wallet Provisioning Error:", error);
      toast.error(error.message || "An error occurred while generating your wallet.");
    } finally {
      setIsGeneratingWallet(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Image must be less than 2MB");

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageToCrop(reader.result as string);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
    reader.readAsDataURL(file);
  };

  const handleCropAndUpload = async () => {
    if (!imageToCrop || !croppedAreaPixels || !user?.id) return;

    setIsUploadingAvatar(true);
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const fileName = `${user.id}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, croppedBlob, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const bustUrl = `${publicUrl}?t=${new Date().getTime()}`;

      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: bustUrl })
        .eq("auth_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(bustUrl);
      toast.success("Profile picture updated!");
      setImageToCrop(null);
    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-[#020817]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-xs font-black tracking-widest text-white/40 uppercase">Loading Environment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] flex flex-col">
      <StudentHeader title="Settings" subtitle="Manage your profile and financial security" />

      <main className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
        
        {/* HORIZONTAL TOP TABS */}
        <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all whitespace-nowrap ${
              activeTab === "profile" 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5" 
                : "text-white/50 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <UserCircle size={18} /> General Profile
          </button>
          
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all whitespace-nowrap ${
              activeTab === "security" 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5" 
                : "text-white/50 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <ShieldCheck size={18} /> Security & Billing
          </button>
        </div>

        {/* TAB CONTENT AREA */}
        <div className="flex-1 bg-[#0f172a] border border-white/10 rounded-[2rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

          {/* ========================================== */}
          {/* TAB 1: GENERAL PROFILE */}
          {/* ========================================== */}
          {activeTab === "profile" && (
            <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">General Profile</h2>
                <p className="text-white/40 text-sm mt-1">This information will be used on your portfolio and recommendation letters.</p>
              </div>

              {/* Profile Picture Upload */}
              <div className="flex items-center gap-6 p-5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 overflow-hidden flex items-center justify-center relative">
                    {isUploadingAvatar ? (
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    ) : avatarUrl ? (
                      <Image src={avatarUrl} alt="Profile" fill className="object-cover" />
                    ) : (
                      <UserCircle className="w-10 h-10 text-emerald-500/50" />
                    )}
                    <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                </div>
                <div>
                  <h4 className="text-white font-bold">Professional Headshot</h4>
                  <p className="text-xs text-white/40 mt-1 max-w-xs">Upload a clear, professional photo. Max size 2MB.</p>
                  <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-emerald-400 mt-2 hover:underline">Upload New Image</button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center mb-2">
                    Full Legal Name {hasWallet && <Lock size={12} className="text-red-400/80 ml-2" />}
                  </label>
                  <Input type="text" placeholder="e.g. Ademola John Alabi" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={hasWallet} className="bg-white/5 border-white/10 h-14 rounded-xl font-medium text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed" />
                  {!hasWallet && <p className="text-[10px] text-emerald-400/70 mt-2">Must exactly match your BVN records.</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <Input type="text" placeholder="08012345678" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="bg-white/5 border-white/10 h-14 rounded-xl pl-12 text-white focus:border-emerald-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center mb-2">
                      Date of Birth {hasWallet && <Lock size={12} className="text-red-400/80 ml-2" />}
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} disabled={hasWallet} className="bg-white/5 border-white/10 h-14 rounded-xl pl-12 text-white focus:border-emerald-500/50 block w-full [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">Residential Address</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <Input type="text" placeholder="123 Main St, Lagos" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-white/5 border-white/10 h-14 rounded-xl pl-12 text-white focus:border-emerald-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">Occupation</label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <Input type="text" placeholder="e.g. Software Engineer" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="bg-white/5 border-white/10 h-14 rounded-xl pl-12 text-white focus:border-emerald-500/50" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full md:w-auto h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-widest uppercase rounded-xl shadow-xl transition-all">
                  {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Profile Details"}
                </Button>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: KYC & WALLET SECURITY */}
          {/* ========================================== */}
          {activeTab === "security" && (
            <div className="space-y-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* BILLING WIDGET */}
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                       <CreditCard size={16} /> Billing Status
                    </h3>
                 </div>
                 <SubscriptionCard />
              </div>

              <div className="h-px w-full bg-white/5"></div>

              {/* 🔥 CONDITIONAL RENDERING FOR KYC SECTION */}
              {!hasWallet && (
                <>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2"><Fingerprint size={16} /> Government ID</h3>
                    </div>

                    <div className="w-full">
                      <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center mb-2">BVN (Required for Account Generation)</label>
                      <Input type="text" maxLength={11} placeholder="Enter your 11-digit BVN" value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))} className="bg-white/5 border-white/10 h-14 rounded-xl font-mono text-white px-4" />
                    </div>
                  </div>
                  <div className="h-px w-full bg-white/5"></div>
                </>
              )}

              {/* SECURITY / PIN SETUP */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2"><Lock size={16} /> Withdrawal Security</h3>

                {hasWallet ? (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">Wallet & KYC Verified</h4>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-xs text-white/40 mt-1 max-w-sm">Your identity is secured. Transaction PIN is active for withdrawals.</p>
                    </div>
                    <Button onClick={() => setIsPinModalOpen(true)} variant="outline" className="w-full md:w-auto bg-transparent border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">Change PIN</Button>
                  </div>
                ) : (
                  <>
                    {/* 🔥 HIDE THE PIN BOXES IF THEY ALREADY HAVE ONE IN THE DATABASE */}
                    {!hasPin ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <label className="text-[10px] text-white/40 uppercase font-black tracking-widest">Set 4-Digit PIN</label>
                            {pin.length > 0 && pin.length < 4 && <span className="text-[9px] font-bold text-amber-400">Needs 4 digits</span>}
                            {pin.length === 4 && <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 size={10} /> Valid</span>}
                          </div>
                          <Input type="password" maxLength={4} placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className={`h-14 rounded-xl font-mono text-2xl tracking-[0.5em] text-white px-4 text-center transition-all duration-300 ${pin.length === 4 ? "bg-emerald-500/5 border-emerald-500/50" : "bg-white/5 border-white/10 focus:border-emerald-500/50"}`} />
                        </div>
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <label className="text-[10px] text-white/40 uppercase font-black tracking-widest">Confirm PIN</label>
                            {confirmPin.length > 0 && pin !== confirmPin && <span className="text-[9px] font-bold text-red-400 flex items-center gap-1"><XCircle size={10} /> Mismatch</span>}
                            {confirmPin.length > 0 && pin === confirmPin && pin.length === 4 && <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 size={10} /> Matches</span>}
                          </div>
                          <Input type="password" maxLength={4} placeholder="••••" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))} className={`h-14 rounded-xl font-mono text-2xl tracking-[0.5em] text-white px-4 text-center transition-all duration-300 ${confirmPin.length > 0 && pin !== confirmPin ? "bg-red-500/5 border-red-500/50 focus:border-red-500" : ""} ${confirmPin.length > 0 && pin === confirmPin && pin.length === 4 ? "bg-emerald-500/5 border-emerald-500/50 focus:border-emerald-500" : ""} ${confirmPin.length === 0 || (pin === confirmPin && pin.length < 4) ? "bg-white/5 border-white/10 focus:border-emerald-500/50" : ""}`} />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <p className="text-xs text-emerald-400 flex items-center gap-2">
                          <CheckCircle2 size={16} /> Your 4-digit transaction PIN is already securely stored.
                        </p>
                      </div>
                    )}

                    <div className="pt-6">
                      <Button onClick={handleProvisionWallet} disabled={isGeneratingWallet} className="w-full md:w-auto h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-widest uppercase rounded-xl shadow-xl transition-all">
                        {isGeneratingWallet ? <Loader2 className="w-5 h-5 animate-spin" /> : "PROVISION SETTLEMENT WALLET"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <SetPinModal open={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} userId={user?.id} onSuccess={() => { setHasPin(true); setIsPinModalOpen(false); toast.success("Transaction PIN updated successfully."); }} />

      {/* Cropper Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0f172a] border border-white/10 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-white">Adjust your avatar</h3>
            <div className="relative h-64 w-full overflow-hidden rounded-xl bg-black/50 sm:h-80">
              <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} cropShape="rect" onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels as any)} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setImageToCrop(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="rounded-lg px-4 py-2 text-sm font-bold text-white/60 hover:bg-white/10 hover:text-white transition-colors" disabled={isUploadingAvatar}>Cancel</button>
              <button onClick={handleCropAndUpload} disabled={isUploadingAvatar} className="flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                {isUploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Picture"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfileSetup() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-xs font-black tracking-widest text-white/40 uppercase">Loading Environment...</p>
      </div>
    }>
      <ProfileSetupContent />
    </Suspense>
  ); 
}
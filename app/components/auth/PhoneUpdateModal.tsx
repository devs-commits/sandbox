"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useAuth } from "../../contexts/AuthContexts"; 
import { supabase } from "@/lib/supabase"; // Use "../../../lib/supabase" if your alias isn't setup

export const PhoneUpdateModal = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState<string>("");
  const [defaultCountryCode, setDefaultCountryCode] = useState<any>("NG");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 Trigger the modal if the user is logged in but the phone column is null/empty
  useEffect(() => {
    // Adding a slight delay so it doesn't flash jarringly on immediate page load
    const checkUserPhone = setTimeout(() => {
      if (user && !(user as any).phone) {
         setIsOpen(true);
      } else {
         setIsOpen(false);
      }
    }, 800);

    return () => clearTimeout(checkUserPhone);
  }, [user]);

  // 🔥 Auto-fetch Geolocation for the flag
  useEffect(() => {
    if (!isOpen) return; // Only fetch if the modal actually opens to save API calls
    const fetchCountryCode = async () => {
      try {
        const res = await fetch("https://ipapi.co/country/");
        if (res.ok) {
          const code = await res.text();
          setDefaultCountryCode(code.trim());
        }
      } catch (err) {
        console.error("Could not fetch geolocation.", err);
      }
    };
    fetchCountryCode();
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!phone || phone.length < 8) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 🔥 FIX: We now point precisely to the 'auth_id' column instead of 'id'
      const { error } = await supabase
        .from('users')
        .update({ phone: phone })
        .eq('auth_id', user?.id);

      if (error) throw error;

      toast.success("Phone number secured! Welcome back.");
      setIsOpen(false);
      
      // Force a hard router refresh so the rest of the app gets the updated user object
      router.refresh();

    } catch (error: any) {
      toast.error(error.message || "Failed to update phone number. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If the modal isn't supposed to be open, render absolutely nothing.
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      {/* Notice there is NO close button (X). 
        They cannot escape this box without submitting. 
      */}
      <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 space-y-6 animate-in zoom-in-95 fade-in duration-300">
        <div className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Security Update</h2>
          <p className="text-sm text-muted-foreground">
            We are upgrading our platform security. Please link a valid phone number to continue accessing your WDC Labs desk.
          </p>
        </div>

        <div className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted-foreground">Phone Number</label>
            <div className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-primary">
              <PhoneInput
                international
                defaultCountry={defaultCountryCode}
                value={phone}
                onChange={(val) => setPhone(val || "")}
                className="w-full bg-transparent outline-none border-none phone-input-global"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !phone}
            className="flex h-11 w-full items-center justify-center rounded-md bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};
"use client";

import { useState, useEffect } from 'react';
import { OfficeProvider, useOffice } from '@/app/contexts/OfficeContext';
import { LobbyScreen } from '@/app/components/students/office/LobbyScreen';
import { OfficeDashboard } from '@/app/components/students/office/OfficeDashboard';
import { CVUploadUI } from '@/app/components/students/office/CVUploadUI';
import { useAuth } from '@/app/contexts/AuthContexts';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, X } from 'lucide-react';

function OfficeContent() {
  const { phase, isLoadingOnboarding, subscription } = useOffice();
  const { user } = useAuth();
  
  const [hasCv, setHasCv] = useState(true); 
  const [showCvWidget, setShowCvWidget] = useState(false);

  useEffect(() => {
    const checkCvStatus = async () => {
      if (!user?.id) return;

      try {
        // 1. Fetch the entire row just in case the column name varies
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();

        // 2. Check if they are already advanced in the program (Grandfather logic)
        const { data: progressData } = await supabase
          .from('user_progression')
          .select('current_week')
          .eq('user_id', user.id) 
          .maybeSingle();

        // 🔥 BULLETPROOF CHECK: Ignores fake "null" strings and empty spaces
        const hasBio = userData?.bio && userData.bio.trim() !== "" && userData.bio !== "null";
        
        // Checks both 'cv_url' and 'resume_url' just in case the DB schema differs
        const hasCvUrl = 
          (userData?.cv_url && userData.cv_url.trim() !== "" && userData.cv_url !== "null") ||
          (userData?.resume_url && userData.resume_url.trim() !== "" && userData.resume_url !== "null");

        const isAdvancedUser = progressData && progressData.current_week > 1;

        // If they have a real CV, real Bio, or are past Week 1, hide it forever!
        if (hasBio || hasCvUrl || isAdvancedUser) {
          setHasCv(true);
          setShowCvWidget(false);
        } else {
          setHasCv(false);
          // Only show the widget if they haven't dismissed it this session
          if (!sessionStorage.getItem(`dismissed_cv_${user.id}`)) {
            setShowCvWidget(true);
          }
        }
      } catch (err) {
        console.error("Error checking career profile status:", err);
      }
    };
    
    if (phase === 'working') {
      checkCvStatus();
    }
  }, [user, phase]);

  if (isLoadingOnboarding) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Checking Access...</p>
        </div>
      </div>
    );
  }

  const today = new Date();
  const hasNoExpiryDate = !subscription?.expiresAt;
  const expiryDate = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;
  const isPastExpiry = !expiryDate || isNaN(expiryDate.getTime()) || expiryDate <= today;
  const isInactive = subscription?.status !== 'active';

  if (!subscription || isInactive || hasNoExpiryDate || isPastExpiry) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-md p-8 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <span className="text-4xl">🔒</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Office Access Restricted</h2>
        <p className="text-gray-400 max-w-md mb-8 text-lg">
          Your internship subscription has expired or cannot be verified. Access to your office is restricted. 
          Please <strong className="text-white">fund your wallet</strong> to renew your 
          subscription and regain access to your work and tools.
        </p>
        <button 
          onClick={() => window.location.href = '/student/wallet'} 
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-red-900/20"
        >
          Fund Wallet & Renew
        </button>
      </div>
    );
  }

  if (phase === 'lobby') {
    return <LobbyScreen />;
  }

  return (
    <>
      <OfficeDashboard />

      <AnimatePresence>
        {!hasCv && showCvWidget && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-[320px] bg-card border border-primary/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-primary/10 p-4 border-b border-primary/20 flex justify-between items-start">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Target size={16} className="text-primary"/> Action Required
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Upload your CV or write a bio to unlock personalized career coaching.</p>
              </div>
              <button 
                onClick={() => {
                  setShowCvWidget(false);
                  sessionStorage.setItem(`dismissed_cv_${user?.id}`, 'true');
                }} 
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 bg-background/50">
              <CVUploadUI 
                userId={user?.id || ''} 
                compact 
                onSuccess={() => {
                  setHasCv(true);
                  setShowCvWidget(false);
                }} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function OfficePage() {
  return (
    <OfficeProvider>
      <OfficeContent />
    </OfficeProvider>
  );
}
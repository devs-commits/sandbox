"use client";
import { OfficeProvider, useOffice } from './../../contexts/OfficeContext';
import { LobbyScreen } from '../../components/students/office/LobbyScreen';
import { OfficeDashboard } from '../../components/students/office/OfficeDashboard';

function OfficeContent() {
  const { phase, isLoadingOnboarding, subscription } = useOffice();

  // 1. Loading State - Restored your original spinner to fix the ReferenceError
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

  // 2. The Strict Lock - Updated Copy
  const today = new Date();
  const isExpired = subscription?.expiresAt && new Date(subscription.expiresAt) <= today;
  const isInactive = subscription?.status !== 'active';

  if (!subscription || isExpired || isInactive) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-md p-8 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <span className="text-4xl">🔒</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Office Access Restricted</h2>
        <p className="text-gray-400 max-w-md mb-8 text-lg">
          Your internship subscription has expired. Access to your office is restricted. 
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

  // 3. Normal Flow
  if (phase === 'lobby') {
    return <LobbyScreen />;
  }

  return <OfficeDashboard />;
}

export default function OfficePage() {
  return (
    <OfficeProvider>
      <OfficeContent />
    </OfficeProvider>
  );
}
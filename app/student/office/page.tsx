"use client";
import { OfficeProvider, useOffice } from './../../contexts/OfficeContext';
import { LobbyScreen } from '../../components/students/office/LobbyScreen';
import { OfficeDashboard } from '../../components/students/office/OfficeDashboard';

function OfficeContent() {
  const { phase, isLoadingOnboarding } = useOffice();

  if (isLoadingOnboarding) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Entering Virtual Office...</p>
        </div>
      </div>
    );
  }

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
};

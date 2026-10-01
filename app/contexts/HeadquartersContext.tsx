import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContexts';
import { supabase } from '@/lib/supabase';

interface HeadquartersContextType {
  tourStep: number;
  setTourStep: (step: number) => void;
  completeTour: () => void;
  cancelTour: () => void;
  isTourActive: boolean;
  isLoadingTour: boolean;
}

const HeadquartersContext = createContext<HeadquartersContextType | null>(null);

export function HeadquartersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tourStep, setTourStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);
  const [isLoadingTour, setIsLoadingTour] = useState(true);

  useEffect(() => {
    const fetchTourState = async () => {
      if (!user?.id) {
        setIsLoadingTour(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('has_completed_headquarters_tour')
          .eq('auth_id', user.id)
          .limit(1)
          .maybeSingle(); // 🔥 FIX: Lowercase and bulletproofed!

        if (error) {
          console.error('Error fetching tour state:', error);
          setIsLoadingTour(false);
          return;
        }

        const hasCompleted = data?.has_completed_headquarters_tour || false;
        // If this optional lookup is slow or unavailable, it returns false,
        // which keeps the established Headquarters tour behaviour intact.
        const suppressFirstShiftTour = await getFirstShiftSuppression();
        setIsTourActive(!hasCompleted && !suppressFirstShiftTour);
      } catch (err) {
        console.error('Error fetching tour state:', err);
      } finally {
        setIsLoadingTour(false);
      }
    };

    fetchTourState();
  }, [user?.id]);

  const completeTour = useCallback(async () => {
    if (!user?.id) return;

    setIsTourActive(false);
    
    try {
      await supabase
        .from('users')
        .update({ has_completed_headquarters_tour: true })
        .eq('auth_id', user.id);
    } catch (error) {
      console.error('Error completing tour:', error);
    }
  }, [user?.id]);

  const cancelTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  return (
    <HeadquartersContext.Provider 
      value={{ 
        tourStep, 
        setTourStep, 
        completeTour,
        cancelTour,
        isTourActive, 
        isLoadingTour 
      }}
    >
      {children}
    </HeadquartersContext.Provider>
  );
}

export function useHeadquarters() {
  const context = useContext(HeadquartersContext);
  if (!context) {
    throw new Error('useHeadquarters must be used within HeadquartersProvider');
  }
  return context;
}

async function getFirstShiftSuppression(): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 1000);

  try {
    const response = await fetch('/api/onboarding/first-shift', {
      cache: 'no-store',
      headers: sessionData.session?.access_token
        ? { Authorization: `Bearer ${sessionData.session.access_token}` }
        : undefined,
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const state = await response.json();
    return state?.suppressHeadquartersTour === true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

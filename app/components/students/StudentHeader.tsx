"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContexts";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import wdc from "../../../public/image.png";
import actdLogoClean from "../../../public/actd-logo.png";
import { Bell, CheckCircle2, XCircle, Loader2, Users, Shield, ArrowRight } from "lucide-react";

interface StudentHeaderProps {
  title: string;
  subtitle?: string;
}

export const StudentHeader = ({ title, subtitle }: StudentHeaderProps) => {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [liveTrack, setLiveTrack] = useState<string | null>(null);
  const [liveIdentity, setLiveIdentity] = useState<string | null>(null);

  const [activeInvite, setActiveInvite] = useState<any | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchHeaderData = async () => {
      // 🔥 THE FIX: Only fetch invites sent within the last 3 hours
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

      const { data: notifData } = await supabase
        .from('notifications')
        .select('*, squads(name)')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .gte('created_at', threeHoursAgo); // Hides expired ones
        
      if (notifData) setNotifications(notifData);

      const { data: profile } = await supabase
        .from('users')
        .select('track, current_identity')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profile) {
        setLiveTrack(profile.track);
        setLiveIdentity(profile.current_identity);
      }
    };

    fetchHeaderData();

    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchHeaderData)
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user?.id]);

  const handleViewInvite = async (notif: any) => {
    setShowNotifs(false);
    setActiveInvite(notif);
    setLoadingPreview(true);
    
    try {
      const res = await fetch(`/api/squad/invite/preview?squadId=${notif.squad_id}&senderId=${notif.sender_id}`);
      const data = await res.json();
      if (data.success) {
        setPreviewData(data);
      } else {
        toast.error("Failed to load squad details.");
        setActiveInvite(null);
      }
    } catch (err) {
      toast.error("Network error.");
      setActiveInvite(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleInviteResponse = async (notificationId: string, squadId: string, action: 'accepted' | 'declined') => {
    setProcessingId(notificationId);
    try {
      const res = await fetch("/api/squad/invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, action, squadId, userId: user?.id })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Invite ${action}!`);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setActiveInvite(null);
        if (action === 'accepted') window.location.reload(); 
      } else {
        toast.error(data.error || "Failed to process invite.");
        // If it failed because of expiration, close the modal and refresh list
        setActiveInvite(null);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setProcessingId(null);
    }
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatTrack = (trackRaw?: string | null) => {
    const track = (trackRaw || "").trim().toLowerCase();
    if (track.includes("marketing") || track.includes("digital")) return "Digital Marketing";
    if (track.includes("cyber") || track.includes("security")) return "Cyber Security";
    return "Data Analytics";
  };

  const activeTrack = formatTrack(liveTrack || user?.track);
  const activeLevel = liveIdentity || user?.experienceLevel || "INTERN";

  return (
    <>
      <header className="px-4 lg:px-6 py-4 flex items-center justify-between border-b border-border bg-background relative z-40">
        <div className="lg:ml-0 ml-10">
          <h1 className="text-sm lg:text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifs(!showNotifs)} 
              className="p-2 rounded-full hover:bg-muted transition-colors relative"
            >
              <Bell size={20} className="text-muted-foreground" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border/60 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-border/40 font-bold text-sm">Notifications</div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">No new notifications.</div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-4 border-b border-border/20 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            <Shield size={14} />
                          </div>
                          <div>
                            <p className="text-sm text-foreground">
                              You've been invited to join <strong className="text-primary">{notif.squads?.name || "a Squad"}</strong>.
                            </p>
                            <button 
                              onClick={() => handleViewInvite(notif)}
                              className="mt-3 text-xs font-bold bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-90 w-full justify-center shadow-md transition-transform hover:scale-[1.02]"
                            >
                              View Invitation <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="text-right hidden sm:block">
            <p className="sm:text-[12px] text-[8px] font-bold text-foreground">{activeTrack}</p>
            <span className="sm:text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-black uppercase tracking-wider">{activeLevel}</span>
          </div>
          
          <div className="flex items-center gap-2 text-primary-foreground px-2 py-1 rounded-full">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {user?.fullName ? getInitials(user.fullName) : "U"}
            </div>
          </div>

          <div className="flex items-center justify-between ml-2 border-l border-border/40 pl-4">
            <Link href="https://wdc.ng/" target="_blank" className="inline-flex items-center hover:opacity-90 transition mr-3">
              <Image src={wdc} alt="WildFusion Digital Centre" className="h-7 w-auto object-contain" />
            </Link>
            <Link href="https://www.actd.us/wildfusiondigitalcentre/" target="_blank" className="inline-flex items-center hover:opacity-90 transition">
              <Image src={actdLogoClean} alt="ACTD Accreditation" className="h-7 w-auto object-contain mr-2" />
              <span className="text-[6px] sm:text-[8px] font-semibold text-muted-foreground leading-tight max-w-[80px]">
                Accredited by the American Council of Training and Development
              </span>
            </Link>
          </div>
        </div>
      </header>

      {activeInvite && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card border border-border/60 w-full max-w-lg rounded-[2rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95">
            
            <button 
              onClick={() => setActiveInvite(null)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <XCircle size={24} />
            </button>

            {loadingPreview || !previewData ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Loading squad details...</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-4">
                    <Shield size={32} />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Squad Invitation</p>
                  <h2 className="text-3xl font-black text-foreground">{previewData.squadName}</h2>
                  <p className="text-lg text-muted-foreground">
                    <strong className="text-foreground">{previewData.senderName}</strong> wants you on their team.
                  </p>
                </div>

                <div className="bg-muted/30 border border-border/50 rounded-2xl p-5">
                  <h4 className="text-sm font-bold flex items-center gap-2 mb-4 text-foreground">
                    <Users size={16} className="text-primary"/> Current Roster ({previewData.members.length}/4)
                  </h4>
                  <div className="space-y-3">
                    {previewData.members.map((member: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-background/50 p-3 rounded-xl border border-border/30">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{formatTrack(member.track)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => handleInviteResponse(activeInvite.id, activeInvite.squad_id, 'declined')}
                    disabled={processingId === activeInvite.id}
                    className="flex-1 py-4 text-sm font-bold rounded-xl border border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={() => handleInviteResponse(activeInvite.id, activeInvite.squad_id, 'accepted')}
                    disabled={processingId === activeInvite.id}
                    className="flex-1 py-4 text-sm font-bold rounded-xl bg-primary text-white shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    {processingId === activeInvite.id ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                    Accept Invite
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
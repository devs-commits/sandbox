import { X, Mail, Phone, Globe, Calendar, CreditCard, Users, Eye, MessageCircle, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

interface Recruiter {
  id: string;
  name: string;
  email: string;
  status: string;
  expiresOn: string;
  daysLeft: string;
  fullData?: {
    companyName: string;
    industry: string;
    location: string;
    website: string;
    phone: string;
    plan: string;
    subscriptionStatus: string;
    expiration: string;
    candidatesViewed: number;
    messagesSent: number;
    companySize?: string;
  };
}

interface AdminRecruiterProfileModalProps {
  recruiter: Recruiter | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminRecruiterProfileModal({
  recruiter,
  isOpen,
  onClose,
}: AdminRecruiterProfileModalProps) {
  if (!recruiter) return null;

  const data = recruiter.fullData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-4xl p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Recruiter Profile
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Company Profile */}
          <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-700 rounded-xl p-6 border border-indigo-500/30 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6">Company Profile</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-blue-100 mb-1">Company Name</p>
                  <p className="text-lg font-semibold text-white">{data?.companyName || recruiter.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-100 mb-1">Industry</p>
                  <p className="text-base text-white">{data?.industry || 'Technology'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-100 mb-1">Location</p>
                  <p className="text-base text-white">{data?.location || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-blue-100 mb-1">Website</p>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-300" />
                    <a href={data?.website || '#'} className="text-cyan-300 hover:text-cyan-200 hover:underline">
                      {data?.website || 'N/A'}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-100 mb-1">Company Size</p>
                  <p className="text-base text-white">{data?.companySize || '50-200 employees'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Contact Information</h3>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Email</p>
                    <p className="text-base text-white font-medium">{recruiter.email}</p>
                  </div>
                </div>
                {data?.phone && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">Phone</p>
                      <p className="text-base text-white font-medium">{data.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Subscription Details</h3>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Plan</p>
                    <p className="text-base text-white font-medium">{data?.plan || 'Monthly'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Expiration</p>
                    <p className="text-base text-white font-medium">{recruiter.expiresOn}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  recruiter.status === 'Active' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    recruiter.status === 'Active' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Status</p>
                  <p className={`text-lg font-bold ${
                    recruiter.status === 'Active' ? 'text-green-400' : 'text-red-400'
                  }`}>{recruiter.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Usage Statistics</h3>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                  <div className="w-16 h-16 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-blue-300" />
                  </div>
                  <p className="text-3xl font-bold text-white">{data?.candidatesViewed || 0}</p>
                  <p className="text-sm text-blue-200">Candidates Viewed</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                  <div className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-green-300" />
                  </div>
                  <p className="text-3xl font-bold text-white">{data?.messagesSent || 0}</p>
                  <p className="text-sm text-blue-200">Messages Sent</p>
                </div>
              </div>
            </div>
          </div>

          {!data && (
            <div className="bg-muted/30 rounded-lg p-6 border border-border text-center">
              <p className="text-sm text-muted-foreground">
                No additional profile information available for this recruiter.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

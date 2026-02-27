import { X, Mail, Phone, MapPin, Globe, Calendar, CreditCard, Users, TrendingUp, Database, Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

interface Enterprise {
  id: string;
  company: string;
  plan: string;
  status: string;
  expiresOn: string;
  daysLeft: string;
  fullData?: {
    companyName: string;
    industry: string;
    companySize: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    plan: string;
    subscriptionStatus: string;
    expiration: string;
    activeUsers: number;
    storageUsed: string;
    apiCalls: number;
    founded?: string;
  };
}

interface AdminEnterpriseProfileModalProps {
  enterprise: Enterprise | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminEnterpriseProfileModal({
  enterprise,
  isOpen,
  onClose,
}: AdminEnterpriseProfileModalProps) {
  if (!enterprise) return null;

  const data = enterprise.fullData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-4xl p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Enterprise Profile
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Organization Profile */}
          <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-700 rounded-xl p-6 border border-purple-500/30 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6">Organization Profile</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-purple-100 mb-1">Company Name</p>
                  <p className="text-lg font-semibold text-white">{data?.companyName || enterprise.company}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-100 mb-1">Industry</p>
                  <p className="text-base text-white">{data?.industry || 'Finance'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-100 mb-1">Company Size</p>
                  <p className="text-base text-white">{data?.companySize || '1000+ employees'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-purple-100 mb-1">Website</p>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-300" />
                    <a href={data?.website || '#'} className="text-pink-300 hover:text-pink-200 hover:underline">
                      {data?.website || 'N/A'}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-100 mb-1">Founded</p>
                  <p className="text-base text-white">{data?.founded || '2010'}</p>
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
                    <p className="text-base text-white font-medium">{data?.email || 'contact@company.com'}</p>
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
                {data?.address && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">Address</p>
                      <p className="text-base text-white font-medium">{data.address}</p>
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
                    <p className="text-base text-white font-medium">{data?.plan || enterprise.plan}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Expiration</p>
                    <p className="text-base text-white font-medium">{enterprise.expiresOn}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  enterprise.status === 'Active' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    enterprise.status === 'Active' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Status</p>
                  <p className={`text-lg font-bold ${
                    enterprise.status === 'Active' ? 'text-green-400' : 'text-red-400'
                  }`}>{enterprise.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Analytics */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Usage Analytics</h3>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                  <div className="w-16 h-16 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-300" />
                  </div>
                  <p className="text-3xl font-bold text-white">{data?.activeUsers || 0}</p>
                  <p className="text-sm text-purple-200">Active Users</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                  <div className="w-16 h-16 bg-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8 text-purple-300" />
                  </div>
                  <p className="text-3xl font-bold text-white">{data?.storageUsed || '2.5 GB'}</p>
                  <p className="text-sm text-purple-200">Storage Used</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                  <div className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-green-300" />
                  </div>
                  <p className="text-3xl font-bold text-white">{data?.apiCalls || 0}</p>
                  <p className="text-sm text-purple-200">API Calls</p>
                </div>
              </div>
            </div>
          </div>

          {!data && (
            <div className="bg-muted/30 rounded-lg p-6 border border-border text-center">
              <p className="text-sm text-muted-foreground">
                No additional profile information available for this enterprise.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

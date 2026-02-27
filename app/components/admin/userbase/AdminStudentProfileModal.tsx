import { X, Mail, Phone, MapPin, Calendar, Award, Briefcase, Users, CreditCard, CheckCircle, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface Student {
  id: string;
  name: string;
  email: string;
  course: string;
  expiration: string;
  fullData?: {
    realName: string;
    phone: string;
    location: string;
    joinDate: string;
    lastActive: string;
    score: number;
    tasks: number;
    weeks: number;
    streak: number;
    longestStreak: number;
    lastTaskDate: string;
    skills: string[];
    bvn: string;
    nin: string;
    bankName: string;
    accountNumber: string;
  };
}

interface AdminStudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminStudentProfileModal({
  student,
  isOpen,
  onClose,
}: AdminStudentProfileModalProps) {
  if (!student) return null;

  const data = student.fullData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-4xl p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Student Profile
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Performance Overview */}
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl p-6 border border-blue-500/30 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6">Performance Overview</h3>
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="w-12 h-12 bg-green-400/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Award className="w-6 h-6 text-green-300" />
                </div>
                <p className="text-2xl font-bold text-white">{data?.score || 0}%</p>
                <p className="text-sm text-blue-100">Score</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="w-12 h-12 bg-blue-400/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Briefcase className="w-6 h-6 text-blue-300" />
                </div>
                <p className="text-2xl font-bold text-white">{data?.tasks || 0}</p>
                <p className="text-sm text-blue-100">Tasks</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="w-12 h-12 bg-purple-400/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-purple-300" />
                </div>
                <p className="text-2xl font-bold text-white">{data?.weeks || 0}</p>
                <p className="text-sm text-blue-100">Weeks</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="w-12 h-12 bg-orange-400/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-orange-300" />
                </div>
                <p className="text-2xl font-bold text-white">{data?.streak || 0}</p>
                <p className="text-sm text-blue-100">Streak</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="w-12 h-12 bg-green-400/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-green-300" />
                </div>
                <p className="text-lg font-bold text-white">Active</p>
                <p className="text-sm text-blue-100">Status</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Personal Information</h3>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Email</p>
                    <p className="text-base text-white font-medium">{student.email}</p>
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
                {data?.location && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">Location</p>
                      <p className="text-base text-white font-medium">{data.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Academic Details */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Academic Details</h3>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Join Date</p>
                    <p className="text-base text-white font-medium">{data?.joinDate || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Course</p>
                    <p className="text-base text-white font-medium">{student.course}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Current Streak</p>
                    <p className="text-base text-white font-medium">{data?.streak || 0} days</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Longest Streak</p>
                    <p className="text-base text-white font-medium">{data?.longestStreak || 0} days</p>
                  </div>
                </div>
              </div>
              {data?.lastTaskDate && (
                <div className="mt-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Last Task Date</p>
                    <p className="text-base text-white font-medium">{data.lastTaskDate}</p>
                  </div>
                </div>
              )}
              {data?.skills && data.skills.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-400 mb-3">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill, index) => (
                      <span key={index} className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full border border-blue-500/30">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Banking Information */}
          {data && (data.bvn || data.nin || data.bankName || data.accountNumber) && (
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">Banking Information</h3>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg">
                <div className="grid grid-cols-2 gap-6">
                  {data.bvn && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-400">BVN</p>
                        <p className="text-base text-white font-medium">{data.bvn}</p>
                      </div>
                    </div>
                  )}
                  {data.nin && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-400">NIN</p>
                        <p className="text-base text-white font-medium">{data.nin}</p>
                      </div>
                    </div>
                  )}
                  {data.bankName && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-400">Bank Name</p>
                        <p className="text-base text-white font-medium">{data.bankName}</p>
                      </div>
                    </div>
                  )}
                  {data.accountNumber && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-400">Account Number</p>
                        <p className="text-base text-white font-medium">{data.accountNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!data && (
            <div className="bg-muted/30 rounded-lg p-6 border border-border text-center">
              <p className="text-sm text-muted-foreground">
                No additional profile information available for this student.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

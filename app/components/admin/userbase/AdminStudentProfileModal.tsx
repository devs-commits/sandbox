import { X, Unlock, Linkedin, Mail, Download, Phone, MapPin, Calendar } from "lucide-react";
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
    skills: string[];
    bvn?: string;
    nin?: string;
    bankName?: string;
    accountNumber?: string;
    course: string;
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

  const handleDownloadProfile = () => {
    const profileData = {
      name: student.name,
      email: student.email,
      course: student.course,
      expiration: student.expiration,
      ...(data && {
        phone: data.phone,
        location: data.location,
        joinDate: data.joinDate,
        score: data.score,
        tasks: data.tasks,
        weeks: data.weeks,
        skills: data.skills,
        bvn: data.bvn,
        nin: data.nin,
        bankName: data.bankName,
        accountNumber: data.accountNumber
      })
    };

    const jsonString = JSON.stringify(profileData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${student.name.replace(/\s+/g, '_')}_profile.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Student Profile
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">
                  {student.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{student.name}</h3>
                <p className="text-sm text-muted-foreground">{student.email}</p>
                <p className="text-xs text-muted-foreground mt-1">{student.course}</p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs font-bold text-green-500 bg-green-500/20 border border-none rounded">
              ACTIVE
            </span>
          </div>

          {data && (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                <p className="text-xs text-muted-foreground uppercase">Score</p>
                <p className="text-xl font-bold text-green-500">{data.score}%</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                <p className="text-xs text-muted-foreground uppercase">Tasks</p>
                <p className="text-xl font-bold text-foreground">{data.tasks}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                <p className="text-xs text-muted-foreground uppercase">Weeks</p>
                <p className="text-xl font-bold text-foreground">{data.weeks}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                <p className="text-xs text-muted-foreground uppercase">Status</p>
                <p className="text-xl font-bold text-blue-500">Active</p>
              </div>
            </div>
          )}

          {data && (data.phone || data.location) && (
            <div>
              <h4 className="font-semibold text-foreground mb-3">Contact Information</h4>
              <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                {data.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Phone</p>
                      <p className="text-sm text-muted-foreground">{data.phone}</p>
                    </div>
                  </div>
                )}
                {data.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Location</p>
                      <p className="text-sm text-muted-foreground">{data.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {data && (data.joinDate || data.skills) && (
            <div>
              <h4 className="font-semibold text-foreground mb-3">Academic Information</h4>
              <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
                {data.joinDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Join Date</p>
                      <p className="text-sm text-muted-foreground">{data.joinDate}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Course/Track</p>
                  <p className="text-sm text-muted-foreground">{student.course}</p>
                </div>
                {data.skills && data.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {data.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {data && (data.bvn || data.nin || data.bankName || data.accountNumber) && (
            <div>
              <h4 className="font-semibold text-foreground mb-3">Banking Information</h4>
              <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
                {data.bvn && (
                  <div>
                    <p className="text-sm font-medium text-foreground">BVN</p>
                    <p className="text-sm text-muted-foreground">{data.bvn}</p>
                  </div>
                )}
                {data.nin && (
                  <div>
                    <p className="text-sm font-medium text-foreground">NIN</p>
                    <p className="text-sm text-muted-foreground">{data.nin}</p>
                  </div>
                )}
                {data.bankName && (
                  <div>
                    <p className="text-sm font-medium text-foreground">Bank Name</p>
                    <p className="text-sm text-muted-foreground">{data.bankName}</p>
                  </div>
                )}
                {data.accountNumber && (
                  <div>
                    <p className="text-sm font-medium text-foreground">Account Number</p>
                    <p className="text-sm text-muted-foreground">{data.accountNumber}</p>
                  </div>
                )}
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

          <div className="flex gap-3 pt-4">
            <Button onClick={handleDownloadProfile} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white">
              <Download className="w-4 h-4 mr-2" />
              Download Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

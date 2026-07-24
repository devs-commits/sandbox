"use client";
import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useOffice } from '@/app/contexts/OfficeContext';

interface CVUploadUIProps {
  userId: string;
  onSuccess?: () => void;
  compact?: boolean;
}

export function CVUploadUI({ userId, onSuccess, compact = false }: CVUploadUIProps) {
  const { submitBio } = useOffice();
  const [file, setFile] = useState<File | null>(null);
  const [bioText, setBioText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 5MB.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file && !bioText.trim()) return;

    setIsSubmitting(true);
    try {
      const finalBio = bioText.trim().length > 0 
        ? bioText 
        : "I am an intern eager to learn and execute tasks to the best of my ability.";

      // 1. Send to AI Engine & Upload File (via OfficeContext)
      await submitBio(finalBio, file || undefined);

      // 2. 🔥 Explicitly write to the users DB so the system confirms it's uploaded!
      const { error } = await supabase.from('users').update({
        bio: finalBio
        // cv_url is updated automatically inside submitBio if a file exists
      }).eq('auth_id', userId);

      if (error) throw error;

      toast.success("Career Profile updated successfully!");
      if (onSuccess) onSuccess();
      setFile(null);
      setBioText('');
    } catch (error: any) {
      console.error("Profile update failed:", error);
      toast.error(error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasInput = file !== null || bioText.trim().length > 0;

  return (
    <div className={`w-full ${compact ? '' : 'p-6 bg-white/5 border border-white/10 rounded-2xl'}`}>
      {!compact && (
        <div className="mb-4">
          <h4 className="text-sm font-bold text-white">Career Profile</h4>
          <p className="text-xs text-white/40 mt-1">Upload your CV or write a short bio about yourself.</p>
        </div>
      )}

      <div
        onClick={() => !isSubmitting && fileInputRef.current?.click()}
        className={`border-2 border-dashed border-border/50 rounded-xl text-center cursor-pointer transition-all ${
          isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:bg-primary/5'
        } ${compact ? 'p-4 mb-4' : 'p-6 mb-4'}`}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <FileText className="text-primary" size={16} />
            </div>
            <span className="text-foreground text-sm font-medium truncate max-w-[200px]">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="p-1.5 hover:bg-secondary rounded-md transition-colors"
              disabled={isSubmitting}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2">
            <Upload className="text-muted-foreground mb-2" size={20} />
            <p className="text-foreground text-sm font-medium">Select CV File</p>
            <p className="text-muted-foreground text-[10px]">PDF or DOCX (Max 5MB)</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" disabled={isSubmitting} />
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
          <span className="bg-card px-2 text-muted-foreground">Or write a profile</span>
        </div>
      </div>

      <Textarea
        placeholder="Tell us about your background, skills, or what you want to learn..."
        value={bioText}
        onChange={(e) => setBioText(e.target.value)}
        disabled={isSubmitting}
        className="min-h-[100px] resize-none rounded-xl bg-secondary/30 border-border/50 focus:border-primary/50 text-sm mb-4"
      />

      <Button
        onClick={handleUpload}
        disabled={!hasInput || isSubmitting}
        className="w-full h-10 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isSubmitting ? <><Loader2 className="animate-spin mr-2" size={16} /> Saving...</> : 'Save Profile'}
      </Button>
    </div>
  );
}
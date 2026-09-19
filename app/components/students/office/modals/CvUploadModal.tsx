"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Loader2, User, Copy, Sparkles } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useOffice } from "@/app/contexts/OfficeContext";

interface CVUploadModalProps {
  isOpen: boolean;
  userId: string;
  onSuccess?: () => void;
}

export function CVUploadModal({ isOpen, userId, onSuccess }: CVUploadModalProps) {
  // 🔥 Extract generateTask so we can actually tell the AI to start
  const { submitBio, generateTask, tasks = [] } = useOffice(); 
  const [file, setFile] = useState<File | null>(null);
  const [bioText, setBioText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingForTask, setIsWaitingForTask] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileTemplate = "My name is [Your Name], and I am a [Your Track] enthusiast eager to develop practical skills. I have foundational knowledge in [Skill 1] and [Skill 2], and my goal is to execute real-world tasks to prepare for a professional career.";

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (isSubmitting && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (!isSubmitting) {
      setTimeLeft(90); 
    }
    return () => clearInterval(timerId);
  }, [isSubmitting, timeLeft]);

  useEffect(() => {
    if (isWaitingForTask && tasks.length > 0) {
      toast.success("Profile synced! AI has prepared your first task.");
      setIsSubmitting(false);
      setIsWaitingForTask(false);
      if (onSuccess) onSuccess();
    }
  }, [tasks.length, isWaitingForTask, onSuccess]);

  useEffect(() => {
    if (isWaitingForTask && timeLeft === 0) {
      toast.success("Profile saved! Transitioning to your desk...");
      setIsSubmitting(false);
      setIsWaitingForTask(false);
      if (onSuccess) onSuccess();
    }
  }, [isWaitingForTask, timeLeft, onSuccess]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isValidType = 
        selectedFile.type === 'application/pdf' || 
        selectedFile.type === 'application/msword' || 
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (!isValidType) {
        toast.error("Please upload a PDF or Word document.");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 5MB.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUseTemplate = () => {
    setBioText(profileTemplate);
    toast.success("Template applied! Please edit the bracketed details.");
  };

  const handleSubmit = async () => {
    if (!file && bioText.trim().length < 20) return;
    
    setIsSubmitting(true);
    try {
      await submitBio(bioText, file || undefined);

      if (bioText.trim().length > 0) {
        const { error } = await supabase
          .from('users')
          .update({ bio: bioText })
          .eq('auth_id', userId);

        if (error) throw error;
      }

      if (tasks.length > 0) {
        toast.success("Profile synced! AI has prepared your first task.");
        setIsSubmitting(false);
        if (onSuccess) onSuccess();
      } else {
        // 🔥 THE MISSING LINK: Trigger the AI Engine generation!
        generateTask();
        
        // Switch to waiting state to hold the user on this screen
        setIsWaitingForTask(true);
      }
    } catch (error: any) {
      console.error("Profile update failed:", error);
      toast.error(error.message || "Failed to update profile. Please try again.");
      setIsSubmitting(false);
      setIsWaitingForTask(false);
    }
  };

  const canSubmit = file !== null || bioText.trim().length >= 20;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-gradient-to-br from-[#0f172a] to-emerald-900/20 border border-emerald-500/20 rounded-3xl p-6 md:p-8 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <User className="text-emerald-400" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Complete Your Profile</h2>
                <p className="text-sm text-emerald-100/60 mt-1">Upload your CV or use the template to tell the AI about your skills.</p>
              </div>
            </div>

            <div
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-emerald-500/30 rounded-2xl p-6 text-center cursor-pointer transition-all mb-6 bg-white/5 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <FileText className="text-emerald-400" size={20} />
                  </div>
                  <span className="text-white font-medium truncate max-w-[200px]">{file.name}</span>
                  {!isSubmitting && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Upload className="text-emerald-400" size={24} />
                  </div>
                  <p className="text-white font-bold mb-1">Upload CV (PDF / Word)</p>
                  <p className="text-white/40 text-xs">Max size: 5MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">OR</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-white/70">Short Professional Bio</label>
                <button 
                  onClick={handleUseTemplate}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2.5 py-1 rounded-md disabled:opacity-50"
                >
                  <Copy className="w-3 h-3" />
                  Use Template
                </button>
              </div>
              <Textarea
                placeholder="Tell us about yourself: your background, skills, what you want to learn... (minimum 20 characters)"
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[120px] resize-none rounded-xl bg-black/20 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-white/20 text-sm p-4"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              size="lg"
              className={`w-full h-14 text-sm font-bold rounded-xl transition-all shadow-lg ${
                isSubmitting 
                  ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 cursor-not-allowed' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-3 w-full">
                  <Loader2 className="animate-spin shrink-0" size={20} />
                  <div className="flex flex-col items-start text-left">
                    <span>{isWaitingForTask ? "AI Finalizing Task..." : "AI Analysing Profile..."}</span>
                    <span className="text-[10px] font-mono opacity-70">Estimated wait: {timeLeft}s</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles size={18} />
                  <span>Save & Generate First Task</span>
                </div>
              )}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
"use client";
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Loader2, User } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Textarea } from '../../../ui/textarea';
import { useOffice } from "../../../../contexts/OfficeContext";

interface CVUploadModalProps {
  isOpen: boolean;
}

export function CVUploadModal({ isOpen }: CVUploadModalProps) {
  const { submitBio } = useOffice();
  const [file, setFile] = useState<File | null>(null);
  const [bioText, setBioText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file && !bioText.trim()) return;
    
    setIsSubmitting(true);
    await submitBio(bioText, file || undefined);
    setIsSubmitting(false);
  };

  const canSubmit = file || bioText.trim().length > 20;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-lg bg-card border border-border/50 rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <User className="text-primary" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Who are you?</h2>
                <p className="text-sm text-muted-foreground">Tell us about yourself to get started</p>
              </div>
            </div>

            {/* File Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all mb-4"
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <FileText className="text-primary" size={20} />
                  </div>
                  <span className="text-foreground font-medium">{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center mb-3">
                    <Upload className="text-muted-foreground" size={24} />
                  </div>
                  <p className="text-foreground font-medium mb-1">Upload your CV</p>
                  <p className="text-muted-foreground text-sm">PDF, DOC, or DOCX</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground">Or type your bio</span>
              </div>
            </div>

            <Textarea
              placeholder="Tell us about yourself: your background, skills, what you want to learn... (minimum 20 characters)"
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              className="min-h-[140px] resize-none rounded-2xl bg-secondary/30 border-border/50 focus:border-primary/50"
            />

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              size="lg"
              className="w-full mt-6 h-14 text-base rounded-2xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Processing...
                </>
              ) : (
                'Submit & Enter Office'
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              No formal CV? No problem. We accept everyone who is ready to work.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
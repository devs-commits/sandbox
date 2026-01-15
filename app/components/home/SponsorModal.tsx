"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, User, Copy, Share2, Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';

interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
  variant?: 'dark' | 'light';
}

const SponsorModal = ({ isOpen, onClose, planName = 'The Career Accelerator', variant = 'dark' }: SponsorModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'link'>('form');
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    yourName: '',
    yourEmail: '',
    sponsorName: '',
    sponsorEmail: '',
    message: '',
  });

  const sponsorLink = `https://wdclabs.com/sponsor/${encodeURIComponent(formData.yourName)}?plan=${encodeURIComponent(planName)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('link');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sponsorLink);
    setCopied(true);
    toast({
      title: "Link copied! 📋",
      description: "Share this with your sponsor.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Sponsorship Request for WDC Labs - ${planName}`);
    const body = encodeURIComponent(
      `Hi ${formData.sponsorName},\n\n${formData.message || `I'm reaching out to ask if you'd consider sponsoring my subscription to WDC Labs.`}\n\nHere's my sponsorship link: ${sponsorLink}\n\nThank you!\n${formData.yourName}`
    );
    window.open(`mailto:${formData.sponsorEmail}?subject=${subject}&body=${body}`);
    toast({
      title: "Email client opened! ✉️",
      description: "Complete sending the email to your sponsor.",
    });
  };

  const handleClose = () => {
    onClose();
    setStep('form');
    setFormData({ yourName: '', yourEmail: '', sponsorName: '', sponsorEmail: '', message: '' });
  };

  const overlayClass = variant === 'dark' 
    ? 'bg-background/80' 
    : 'bg-foreground/50';

  const modalClass = variant === 'dark'
    ? 'bg-card border-border'
    : 'bg-card border-border';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClass} backdrop-blur-sm`}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`${modalClass} rounded-2xl border p-6 w-full max-w-md shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {step === 'form' ? 'Ask Sponsor to Pay' : 'Share with Your Sponsor'}
              </h2>
              <button 
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <p className="text-xs text-muted-foreground">Selected Plan</p>
                  <p className="text-sm font-semibold text-foreground">{planName}</p>
                </div>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Your Name"
                    value={formData.yourName}
                    onChange={(e) => setFormData({ ...formData, yourName: e.target.value })}
                    required
                    className="pl-10 bg-secondary border-border"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={formData.yourEmail}
                    onChange={(e) => setFormData({ ...formData, yourEmail: e.target.value })}
                    required
                    className="pl-10 bg-secondary border-border"
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-3">Sponsor's Details</p>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Sponsor's Name"
                        value={formData.sponsorName}
                        onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                        required
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Sponsor's Email"
                        value={formData.sponsorEmail}
                        onChange={(e) => setFormData({ ...formData, sponsorEmail: e.target.value })}
                        required
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>

                    <Textarea
                      placeholder="Personal message (optional)"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="bg-secondary border-border resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  className={`w-full py-5 font-semibold ${
                    variant === 'dark' 
                      ? 'btn-coral-gradient text-foreground' 
                      : 'bg-coral hover:bg-coral-dark text-foreground'
                  }`}
                >
                  Generate Sponsorship Link
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Your unique sponsorship link</p>
                  <p className="text-sm text-foreground break-all font-mono">{sponsorLink}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleCopyLink}
                    variant="outline"
                    className="py-5 font-medium border-border"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button 
                    onClick={handleSendEmail}
                    className={`py-5 font-semibold ${
                      variant === 'dark' 
                        ? 'btn-primary-gradient text-primary-foreground' 
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    }`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </div>

                <Button 
                  onClick={() => setStep('form')}
                  variant="ghost"
                  className="w-full text-muted-foreground"
                >
                  ← Back to form
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SponsorModal;

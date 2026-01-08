"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface NavbarDarkProps {
  onChatClick?: () => void;
  onJoinWaitlistClick?: () => void;
}

const NavbarDark = ({ onChatClick, onJoinWaitlistClick }: NavbarDarkProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Chat with Tolu', onClick: onChatClick },
    { label: 'The Value', href: '#arsenal' },
    { label: 'Get Sponsored', href: '#pricing' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-teal">
              <span className="text-primary-foreground font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-lg text-foreground">
              WDC<span className="font-normal text-muted-foreground">Labs</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={link.onClick}
                className="nav-link cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button 
              onClick={onJoinWaitlistClick}
              className="btn-primary-gradient text-primary-foreground px-6"
            >
              Join Waitlist
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => {
                    link.onClick?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className="nav-link py-2"
                >
                  {link.label}
                </a>
              ))}
              <Button 
                onClick={onJoinWaitlistClick}
                className="btn-primary-gradient text-primary-foreground w-full"
              >
                Join Waitlist
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default NavbarDark;
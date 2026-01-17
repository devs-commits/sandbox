"use client";
import { useState } from 'react';
import NavbarDark from '../app/components/home/NavbarDark';
import HeroSectionDark from '../app/components/home/HeroSectionDark';
import ArsenalSection from '../app/components/home/ArsenalSection';
import ChatSectionDark from '../app/components/home/ChatSectionDark';
import PricingSection from '../app/components/home/PricingSection';
import CTASectionDark from '../app/components/home/CTASectionDark';
import FooterDark from '../app/components/home/FooterDark';
import WaitlistModal from '../app/components/home/WaitListModal';
import SponsorModal from '../app/components/home/SponsorModal';
import Link from 'next/link';
import Image from 'next/image';
import wdcLogo from '../public/wdc-logo.jpg';

const HomeDark = () => {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isSponsorOpen, setIsSponsorOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: '', price: '' });

  const plans: Record<string, string> = {
    'The Monthly Grind': '15,000',
    'The Career Accelerator': '45,000',
    'The Titan': '150,000',
  };

  const handleSponsorClick = (planName: string) => {
    setSelectedPlan({ name: planName, price: plans[planName] || '15,000' });
    setIsSponsorOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavbarDark 
        onJoinWaitlistClick={() => setIsWaitlistOpen(true)}
        onChatClick={() => document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })}
      />
        {/* <header className="relative z-10 w-full py-4 border border-b-muted-foreground">
            <div className="max-w-7xl ml-[100px]">
              <Link href="/" className="inline-block">
                <Image src={wdcLogo} alt="WDC Labs" className="h-[50px] w-[120px] sm:h-[55px] sm:w-[200px]" />
              </Link>
            </div>
        </header> */}
      <HeroSectionDark 
        onSecureSpotClick={() => setIsWaitlistOpen(true)}
        onMentorPayClick={() => setIsSponsorOpen(true)}
      />
      <ArsenalSection variant="light" />
      <div id="chat">
        <ChatSectionDark />
      </div>
      {/* <PricingSection 
        variant="dark" 
        onSponsorClick={handleSponsorClick}
      /> */}
      {/* <CTASectionDark onSecureSpotClick={() => setIsWaitlistOpen(true)} /> */}
      {/* <FooterDark /> */}

      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} variant="dark" />
      <SponsorModal isOpen={isSponsorOpen} onClose={() => setIsSponsorOpen(false)} planName={selectedPlan.name || 'The Career Accelerator'} variant="dark" />
    </div>
  );
};

export default HomeDark;
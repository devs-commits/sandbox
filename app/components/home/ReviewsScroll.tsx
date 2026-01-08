"use client";
import { useRef, useState } from 'react';
import ReviewCard from './ReviewCard';
import avatarFemale from '@/assets/avatar-female.png';
import avatarMale from '@/assets/avatar-male.png';

interface ReviewsScrollProps {
  variant?: 'dark' | 'light';
}

const reviews = [
  {
    name: 'Chidi, Lagos.',
    location: 'Lagos',
    content: "I thought I was ready. Tolu asked me one question about my SQL project and I froze. I signed up immediately.",
    avatar: avatarMale,
  },
  {
    name: 'Aisha, Ibadan.',
    location: 'Ibadan',
    content: "Tolu doesn't care about vibes or emotion. She scans your profile and exposes the gaps instantly. It was scary... but exactly what I needed.",
    avatar: avatarFemale,
  },
  {
    name: 'Samuel, Abuja.',
    location: 'Abuja',
    content: "I've done courses before, but none tested me like this. Three turns with Tolu felt like a real HR screening. I finally understood why recruiters ghost me.",
    avatar: avatarMale,
  },
  {
    name: 'Blessing, Port Harcourt.',
    location: 'Port Harcourt',
    content: "The AI doesn't sugarcoat. It told me my portfolio was 'generic' and gave me 3 actionable fixes. Worth every naira.",
    avatar: avatarFemale,
  },
  {
    name: 'Emeka, Enugu.',
    location: 'Enugu',
    content: "Finally, a platform that treats you like a professional, not a student. The strict deadlines changed my work ethic completely.",
    avatar: avatarMale,
  },
  {
    name: 'Fatima, Kano.',
    location: 'Kano',
    content: "I got my recommendation letter 2 days after graduation. Used it for my visa application. Still can't believe this costs only ₦15k/month.",
    avatar: avatarFemale,
  },
];

const ReviewsScroll = ({ variant = 'dark' }: ReviewsScrollProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate reviews for seamless loop
  const duplicatedReviews = [...reviews, ...reviews];

  return (
    <div 
      className="relative h-[400px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Gradient overlays */}
      <div className={`absolute top-0 left-0 right-0 h-12 z-10 pointer-events-none ${
        variant === 'dark' 
          ? 'bg-gradient-to-b from-background to-transparent' 
          : 'bg-gradient-to-b from-secondary to-transparent'
      }`} />
      <div className={`absolute bottom-0 left-0 right-0 h-12 z-10 pointer-events-none ${
        variant === 'dark' 
          ? 'bg-gradient-to-t from-background to-transparent' 
          : 'bg-gradient-to-t from-secondary to-transparent'
      }`} />

      {/* Scrolling container */}
      <div 
        ref={scrollRef}
        className={`flex flex-col space-y-4 ${isPaused ? '' : 'auto-scroll'}`}
        style={{ paddingTop: '1rem', paddingBottom: '1rem' }}
      >
        {duplicatedReviews.map((review, index) => (
          <ReviewCard
            key={`${review.name}-${index}`}
            name={review.name}
            location={review.location}
            content={review.content}
            avatar={review.avatar}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
};

export default ReviewsScroll;
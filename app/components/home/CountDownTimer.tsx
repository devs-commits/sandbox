"use client";
import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
  variant?: 'dark' | 'light';
}

interface TimeLeft {
  days: number;
  hours: number;
  mins: number;
  secs: number;
}

const CountdownTimer = ({ targetDate, variant = 'dark' }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          mins: Math.floor((difference / 1000 / 60) % 60),
          secs: Math.floor((difference / 1000) % 60),
        };
      }
      
      return { days: 0, hours: 0, mins: 0, secs: 0 };
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeUnits = [
    { value: timeLeft.days, label: 'DAYS', isAccent: false },
    { value: timeLeft.hours, label: 'HOURS', isAccent: false },
    { value: timeLeft.mins, label: 'MINS', isAccent: false },
    { value: timeLeft.secs, label: 'SECS', isAccent: true },
  ];

  if (variant === 'light') {
    return (
      <div className="flex gap-2">
        {timeUnits.map((unit, index) => (
          <div
            key={unit.label}
            className={`flex flex-col items-center justify-center w-14 h-16 md:w-16 md:h-20 rounded-lg ${
              unit.isAccent 
                ? 'bg-teal text-primary-foreground' 
                : 'bg-primary text-primary-foreground'
            }`}
          >
            <span className="text-xl md:text-2xl font-bold">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-[8px] md:text-[10px] font-medium opacity-80">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {timeUnits.map((unit, index) => (
        <div
          key={unit.label}
          className={`flex flex-col items-center justify-center w-14 h-16 md:w-16 md:h-20 rounded-lg transition-all duration-300 ${
            unit.isAccent 
              ? 'countdown-box-accent pulse-glow text-primary-foreground' 
              : 'countdown-box text-foreground'
          }`}
        >
          <span className="text-xl md:text-2xl font-bold">
            {String(unit.value).padStart(2, '0')}
          </span>
          <span className="text-[8px] md:text-[10px] font-medium opacity-70">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
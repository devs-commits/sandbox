"use client";
import React, { useRef, useState } from "react";
import { Input } from "../ui/input";

export function PinInput({ length = 4, onComplete }: { length?: number; onComplete: (pin: string) => void }) {
  const [pin, setPin] = useState(new Array(length).fill(""));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const handleChange = (value: string, index: number) => {
    const newPin = [...pin];
    newPin[index] = value.substring(value.length - 1);
    setPin(newPin);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPin.every((digit) => digit !== "")) {
      onComplete(newPin.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-3">
      {pin.map((digit, index) => (
        <input
          key={index}
          type="password"
          maxLength={1}
          value={digit}
          ref={(el) => (inputRefs.current[index] = el!)}
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 outline-none transition-all"
        />
      ))}
    </div>
  );
}
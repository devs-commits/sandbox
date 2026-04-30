"use client";
import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

interface SearchableBankSelectProps {
  banks: { institutionCode: string; institutionName: string }[];
  selectedBank: string;
  onSelect: (bankName: string) => void;
}

export function SearchableBankSelect({ banks, selectedBank, onSelect }: SearchableBankSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBanks = banks.filter((bank) =>
    bank.institutionName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
      >
        <span className={selectedBank ? "text-white" : "text-white/40"}>
          {selectedBank || "Search and select a bank..."}
        </span>
        <ChevronDown size={18} className={`text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-[#0f172a]">
            <Search size={16} className="text-white/40" />
            <input
              type="text"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-white focus:outline-none placeholder:text-white/30 text-sm"
              autoFocus
            />
          </div>

          {/* List of Banks */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredBanks.length === 0 ? (
              <div className="p-4 text-center text-sm text-white/40">No banks found.</div>
            ) : (
              filteredBanks.map((bank) => (
                <button
                  key={bank.institutionCode}
                  type="button"
                  onClick={() => {
                    onSelect(bank.institutionName);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between hover:bg-white/5 ${
                    selectedBank === bank.institutionName ? "bg-emerald-500/10 text-emerald-400" : "text-white/80"
                  }`}
                >
                  {bank.institutionName}
                  {selectedBank === bank.institutionName && <Check size={16} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
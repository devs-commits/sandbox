"use client";
import { RecruiterHeader } from "@/app/components/recruiter/RecruiterHeader";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Slider } from "../../components/ui/slider";
import { toast } from "sonner";

const talentCategories = [
  "Digital Marketing",
  "Data Analytics",
  "Cyber Security",
  "Growth Marketing",
];

interface HiringPreferencesProps {
  onOpenSidebar: () => void;
}

export default function HiringPreferences({ onOpenSidebar }: HiringPreferencesProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(80);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSavePreferences = () => {
    toast.success("Preferences saved successfully!");
    console.log("Saved preferences:", {
      categories: selectedCategories,
      minScore,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={onOpenSidebar}
        className="lg:hidden mb-4 p-2 text-foreground"
      >
        <Menu className="w-6 h-6" />
      </button>
      <RecruiterHeader title="Hiring Preferences" />

      {/* Preferences Card */}
      <div className="bg-card rounded-xl p-6 border border-border max-w-2xl mx-auto my-10">
        {/* Primary Talent Interest */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Primary Talent Interest
          </h2>
          <div className="flex flex-wrap gap-3">
            {talentCategories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategories.includes(category)
                    ? "bg-muted text-foreground border border-border"
                    : "bg-muted/50 text-muted-foreground border border-transparent hover:border-border"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Minimum AI Grading Score */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Minimum AI Grading Score
            </h2>
            <span className="text-primary font-semibold">{minScore}%</span>
          </div>
          <Slider
            value={[minScore]}
            onValueChange={(value) => setMinScore(value[0])}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
          <p className="text-muted-foreground text-sm mt-2">
            Only recommend candidates who score above {minScore}% in simulations.
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSavePreferences}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
}


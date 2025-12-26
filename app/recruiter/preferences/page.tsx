"use client";
import { RecruiterHeader } from "@/app/components/recruiter/RecruiterHeader";
import { useState, useEffect } from "react";
import { Menu, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Slider } from "../../components/ui/slider";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../contexts/AuthContexts";

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
  const { user } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(80);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('recruiters')
          .select('preferences_categories, preferences_min_score')
          .eq('auth_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setSelectedCategories(data.preferences_categories || []);
          setMinScore(data.preferences_min_score || 80);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
        toast.error('Failed to load preferences');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user?.id]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSavePreferences = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('recruiters')
        .update({
          preferences_categories: selectedCategories,
          preferences_min_score: minScore,
        })
        .eq('auth_id', user.id);

      if (error) throw error;

      toast.success("Preferences saved successfully!");
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={onOpenSidebar}
        className="lg:hidden mb-4 p-2 text-foreground"
      >
        <Menu className="w-6 h-6" />
      </button>
      <RecruiterHeader title="Hiring Preferences" subtitle="Configure your AI recommendation engine"/>

      {/* Preferences Card */}
      <div className="bg-[hsla(216,36%,18%,1)] rounded-xl p-6 border border-border max-w-2xl mx-auto my-10">
        {/* Primary Talent Interest */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Primary Talent Interest
          </h2>
          <div className="flex flex-wrap gap-3 justify-between">
            {talentCategories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategories.includes(category)
                    ? "bg-muted-foreground text-foreground border border-border"
                    : "bg-foreground/20 text-foreground border border-transparent hover:border-border"
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
          disabled={isSaving}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}


import { useState } from "react";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import { ExternalLink } from "lucide-react";
import { TermsAgreementModal } from "./TermsAgreementModal";

interface TermsAgreementProps {
//   wdcLabsTerms: boolean;
  wdcPrivacy: boolean;
//   onWdcLabsTermsChange: (checked: boolean) => void;
  onWdcPrivacyChange: (checked: boolean) => void;
}

export const TermsAgreement = ({
//   wdcLabsTerms,
  wdcPrivacy,
//   onWdcLabsTermsChange,
  onWdcPrivacyChange,
}: TermsAgreementProps) => {
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <div className="space-y-3 py-3 border-t border-b border-border/50">
      <p className="text-xs text-muted-foreground font-medium">By signing up, you agree to:</p>
      
      {/* WDC Labs Terms */}
      {/* <div className="flex items-start space-x-3">
        <Checkbox
          id="wdc-labs-terms"
        //   checked={wdcLabsTerms}
        //   onCheckedChange={(checked) => onWdcLabsTermsChange(checked === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor="wdc-labs-terms"
          className="text-sm text-muted-foreground leading-tight cursor-pointer"
        >
          I agree to WDC Labs'{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowTermsModal(true);
            }}
            className="text-primary hover:underline font-medium"
          >
            Terms of Use, Privacy Policy & Data Protection Agreement
          </button>
        </Label>
      </div> */}

      {/* WDC Privacy Policy */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="wdc-privacy"
          checked={wdcPrivacy}
          onCheckedChange={(checked) => onWdcPrivacyChange(checked === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor="wdc-privacy"
          className="text-sm text-muted-foreground leading-tight cursor-pointer"
        >
          I agree to{" "}
          <a
            href="https://wdc.ng/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            WDC Privacy Policy
            <ExternalLink className="w-3 h-3" />
          </a>
        </Label>
      </div>

      <TermsAgreementModal open={showTermsModal} onOpenChange={setShowTermsModal} />
    </div>
  );
};

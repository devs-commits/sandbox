import { useState } from "react";
import { MessageCircle, X, ExternalLink, Headphones} from "lucide-react";
import { cn } from "@/lib/utils";

const WHATSAPP_LINK = "https://chat.whatsapp.com/IWMuvfGQhTJHCXBMlfGzir?mode=gi_t";

export function WhatsAppSupport() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
      <div
        className={cn(
          "w-[calc(100vw-2rem)] max-w-80 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 origin-bottom-right",
          "border border-border/50 backdrop-blur-xl",
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-90 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="relative p-5 pb-4 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-base tracking-tight">WDC Support</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                  <p className="text-white/80 text-xs font-medium">Online now</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="bg-card p-4 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Got questions about tasks, portfolio or your account? Jump into our community. We're happy to help.
          </p>

          {/* CTA Button */}
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
          >
            <ExternalLink className="w-4 h-4 transition-transform group-hover:rotate-12" />
            Join Support Community
          </a>

          <p className="text-[10px] text-muted-foreground text-center">
            Opens in WhatsApp • Free to join
          </p>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95",
          isOpen
            ? "bg-card border border-border rotate-0"
            : "hover:shadow-[0_4px_24px_rgba(37,211,102,0.35)]"
        )}
        style={!isOpen ? { background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" } : undefined}
        aria-label="WhatsApp Support"
      >
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-coral rounded-full border-2 border-background animate-pulse" />
        )}
        {isOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        )}
      </button>
    </div>
  );
}

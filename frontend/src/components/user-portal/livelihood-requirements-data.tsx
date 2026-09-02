import { X, CheckCircle2, AlertTriangle } from "lucide-react"

export interface RequirementsModalProps {
  accepted: boolean
  onAcceptedChange: (checked: boolean) => void
  onContinue: () => void
  showInfoBanner?: boolean
  onCloseInfoBanner?: () => void
  onClose?: () => void
}

export function LivelihoodRequirementsModal({
  accepted,
  onAcceptedChange,
  onContinue,
  onClose,
}: RequirementsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border shrink-0 flex items-center justify-between gap-4 bg-muted/20">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground">
              Apply for Livelihood — Requirements
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Please Review the Following Requirements for this Service
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body with Scroll */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm leading-relaxed text-foreground">
          {/* Important Reminder Banner */}
          <div className="relative flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold uppercase tracking-wider text-xs text-amber-800 dark:text-amber-300">
                IMPORTANT REMINDER
              </p>
              <p className="mt-1 text-amber-950 dark:text-amber-100 font-medium">
                Please scroll and read all the information and requirements below before proceeding with your Livelihood Program application.
              </p>
            </div>
          </div>

          {/* Section I */}
          <div className="bg-muted/10 border border-border/80 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-base text-primary flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">I</span>
              Ano ang Livelihood Program?
            </h3>
            <p className="text-muted-foreground text-sm">
              Ang Livelihood Program ay nagbibigay ng suporta sa mga kwalipikadong aplikante na nais magsimula o magpatuloy ng maliit na pagkakakitaan.
            </p>
            <p className="font-semibold text-xs text-foreground uppercase tracking-wide pt-1">
              Maaaring kabilang dito ang:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {[
                "Sari-sari Store",
                "Food Business",
                "Online Selling",
                "Sewing / Tailoring",
                "Beauty Services",
                "Repair Services",
                "Iba pang maliit na livelihood",
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section II */}
          <div className="bg-muted/10 border border-border/80 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-base text-primary flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">II</span>
              Sino ang maaaring mag-apply?
            </h3>
            <ul className="space-y-2 pt-1 text-sm">
              {[
                "Dapat ay may valid at active QCID.",
                "Dapat kumpleto at tama ang personal information sa profile.",
                "Dapat nakakatugon sa eligibility requirements ng Livelihood Program.",
                "Hindi dapat may existing pending livelihood application.",
              ].map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section III */}
          <div className="bg-muted/10 border border-border/80 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-base text-primary flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">III</span>
              Documentary Requirements
            </h3>
            <p className="text-muted-foreground text-xs">
              Pakihanda ang mga sumusunod:
            </p>
            <ul className="space-y-2 pt-1 text-sm">
              {[
                "Valid ID / QCID",
                "Proof of Residency kung kinakailangan",
                "Supporting Document para sa livelihood, kung kinakailangan",
                "Iba pang dokumentong maaaring hingin ng administrator",
              ].map((doc, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground">
                  <span className="flex items-center justify-center h-4 w-4 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer with Acceptance Checkbox & Button */}
        <div className="p-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-muted/20">
          <label className="flex items-start gap-2.5 text-sm select-none text-foreground cursor-pointer group">
            <input
              type="checkbox"
              id="livelihood-accept-checkbox"
              checked={accepted}
              onChange={(e) => onAcceptedChange(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-medium group-hover:text-primary transition-colors">
              I accept and understand the requirements for this service.
            </span>
          </label>

          <button
            onClick={onContinue}
            disabled={!accepted}
            id="btn-understand-apply-livelihood"
            className="w-full sm:w-auto px-6 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold tracking-wide hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            I UNDERSTAND &bull; APPLY FOR LIVELIHOOD
          </button>
        </div>
      </div>
    </div>
  )
}
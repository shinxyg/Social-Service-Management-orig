import { useState } from "react"
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertCircle, X, ChevronDown, ChevronUp } from "lucide-react"

interface SubmitPrivacyOverlayModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmSubmit?: () => void
  onConfirm?: () => void
  title?: string
  description?: string
  confirmText?: string
  moduleName?: string
  isSubmitting?: boolean
}

export function SubmitPrivacyOverlayModal({
  isOpen,
  onClose,
  onConfirmSubmit,
  onConfirm,
  title,
  description,
  confirmText,
  moduleName = "Social Assistance Program",
  isSubmitting = false,
}: SubmitPrivacyOverlayModalProps) {
  const [agreed, setAgreed] = useState(false)
  const [showFullPolicy, setShowFullPolicy] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!agreed) {
      setAttemptedSubmit(true)
      return
    }
    if (onConfirm) {
      onConfirm()
    } else if (onConfirmSubmit) {
      onConfirmSubmit()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div
        className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-xl my-6 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{title || "Data Privacy Consent & Review"}</h3>
              <p className="text-xs text-muted-foreground">Quezon City SSDD • Republic Act No. 10173 (Data Privacy Act of 2012)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-foreground/90 leading-relaxed">
          {}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 text-sm">
              <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Data Collection Consent Notice</span>
            </div>
            <p className="text-blue-800 dark:text-blue-300 text-xs leading-relaxed">
              {description || (
                <>
                  Before submitting your <strong className="text-foreground">{moduleName}</strong> application, please confirm that you allow the Quezon City Social Services Development Department (SSDD) to collect, process, and store your personal information and uploaded supporting documents strictly for social welfare evaluation, eligibility verification, and assistance disbursement.
                </>
              )}
            </p>
          </div>

          {}
          <div className="space-y-2 text-xs text-muted-foreground bg-muted/20 p-3.5 rounded-xl border border-border/60">
            <p className="font-semibold text-foreground">Summary of Privacy Principles (RA 10173):</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Exclusive Use:</strong> Your data is used solely for social welfare processing and municipal service delivery.</li>
              <li><strong>Strict Security:</strong> Encrypted storage with access restricted strictly to authorized Social Workers.</li>
              <li><strong>No Commercial Disclosure:</strong> Your information is never shared or sold to unauthorized third parties.</li>
            </ul>
          </div>

          {}
          <button
            type="button"
            onClick={() => setShowFullPolicy((prev) => !prev)}
            className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 hover:underline text-xs cursor-pointer focus:outline-none"
          >
            <FileText className="h-3.5 w-3.5" />
            {showFullPolicy ? "Hide Full Policy Details" : "Read Full Data Privacy Policy Details"}
            {showFullPolicy ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {}
          {showFullPolicy && (
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-2 text-muted-foreground animate-fade-in max-h-48 overflow-y-auto">
              <p className="font-bold text-foreground">Republic Act No. 10173 - Rights of Data Subjects:</p>
              <p>1. <strong>Right to be Informed:</strong> You have the right to know how your data is collected and processed.</p>
              <p>2. <strong>Right to Access & Correct:</strong> You may request access to view or correct your personal record.</p>
              <p>3. <strong>Data Protection Standards:</strong> All files uploaded (IDs, Barangay Certificates, Income Proof) are stored in encrypted servers complying with National Privacy Commission regulations.</p>
            </div>
          )}

          {}
          <div className={`mt-2 p-4 rounded-xl border transition-all ${
            attemptedSubmit && !agreed
              ? "border-red-500/80 bg-red-50/60 dark:bg-red-950/30"
              : agreed
                ? "border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20"
                : "border-border bg-card"
          }`}>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked)
                  if (e.target.checked) setAttemptedSubmit(false)
                }}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
              />
              <span className="text-xs sm:text-sm font-semibold text-foreground leading-normal">
                I have read, understood, and agree to the Data Privacy Policy. I explicitly allow the Quezon City SSDD to collect, process, and store my data for this application under Republic Act No. 10173. <span className="text-red-500 font-bold">*</span>
              </span>
            </label>

            {attemptedSubmit && !agreed && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>You must check the agreement box before submitting your application.</span>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
          >
            ← Cancel & Edit Details
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !agreed}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
              agreed && !isSubmitting
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-500/20"
                : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            {isSubmitting ? (
              <span>Submitting Application...</span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>{confirmText || "CONFIRM & SUBMIT APPLICATION"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from "react"
import { Check, ClipboardList, ImagePlus, X } from "lucide-react"
import { PageHeader } from "../ui/shared"
import { useLanguage } from "../ui/language-context"

function generateReference() {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `AICS-2026-${num}`
}

interface ApplyAICSProps {
  // When provided (e.g. resident clicked a specific assistance card like
  // "Medical Assistance"), the type is locked/fixed and shown as read-only
  // instead of a dropdown the user can change.
  initialType?: string
}

export default function ApplyAICS({ initialType }: ApplyAICSProps) {
  const { t } = useLanguage()

  const assistanceTypes = [
    t("assistMedical"),
    t("assistBurial"),
    t("assistEducational"),
    t("assistTransportationLower"),
  ]

  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [contact, setContact] = useState("")
  const [type, setType] = useState(initialType || assistanceTypes[0])
  const [narrative, setNarrative] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState("")

  // Supporting document (optional image attachment)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const isTypeLocked = Boolean(initialType)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAttachment(file)
    setPreviewUrl(URL.createObjectURL(file))
    e.target.value = ""
  }

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAttachment(null)
    setPreviewUrl(null)
  }

  const canSubmit = name.trim() && address.trim() && contact.trim() && narrative.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    setReference(generateReference())
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center">
            <Check className="h-7 w-7 text-success" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground">{t("applicationSubmittedTitle")}</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {t("appSubmittedMsg", { name, type: type.toLowerCase() })}
          </p>
          <div className="mt-2 bg-muted rounded-xl px-4 py-3 w-full">
            <p className="text-xs text-muted-foreground">{t("referenceNumber")}</p>
            <p className="text-sm font-semibold text-foreground">{reference}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("saveReferenceNote")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title={t("applyAicsTitle")}
        desc={t("applyAicsDesc")}
      />

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ClipboardList className="h-4 w-4 text-primary" />
          {t("applicantInformation")}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("fullName")}>
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} h-10`} placeholder="Juan D. Dela Cruz" />
          </Field>
          <Field label={t("contactNumber")}>
            <input value={contact} onChange={(e) => setContact(e.target.value)} className={`${inputCls} h-10`} placeholder="09XX XXX XXXX" />
          </Field>
          <Field label={t("address")} full>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputCls} h-10`} placeholder="Barangay, City" />
          </Field>
          <Field label={t("typeOfAssistance")} full>
            {isTypeLocked ? (
              <div className={`${inputCls} h-10 flex items-center font-medium text-foreground bg-primary/5 border border-primary/20 cursor-not-allowed`}>
                {type}
              </div>
            ) : (
              <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} h-10`}>
                {assistanceTypes.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("situationReason")} full>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              rows={4}
              className={inputCls}
              placeholder={t("situationPlaceholder")}
            />
          </Field>

          <Field label={t("attachSupportingDocument")} full>
            <p className="text-xs text-muted-foreground mb-2 -mt-1">{t("attachHint")}</p>

            {previewUrl ? (
              <div className="flex items-start gap-3">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border shrink-0">
                  <img src={previewUrl} alt={attachment?.name ?? "attachment"} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <p className="text-xs text-foreground truncate max-w-48">{attachment?.name}</p>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/70 cursor-pointer transition-colors">
                      {t("changeImage")}
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t("removeImage")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg h-32 cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground">
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-medium">{t("chooseImage")}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("bringDocsNote")}
        </p>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {t("submitApplication")}
        </button>
      </div>
    </div>
  )
}

const inputCls =
  "w-full rounded-lg bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/40"

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  )
}
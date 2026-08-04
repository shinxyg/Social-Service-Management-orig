import { useEffect, useState } from "react"
import { Check, ClipboardList, ChevronRight, Accessibility, Users, ImagePlus, X } from "lucide-react"
import { PageHeader } from "../ui/shared"
import { Field, inputCls } from "../ui/form-ui"

function generateReference(prefix: string) {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-2026-${num}`
}

type Category = "PWD" | "Senior Citizen"

const CATEGORY_ITEMS: { value: Category; label: string; desc: string; icon: typeof Accessibility }[] = [
  {
    value: "PWD",
    label: "PWD (Person with Disability)",
    desc: "Registration and ID for persons with disability",
    icon: Accessibility,
  },
  {
    value: "Senior Citizen",
    label: "Senior Citizen",
    desc: "OSCA ID for residents 60 years old and above",
    icon: Users,
  },
]

export default function ApplyPWDSenior() {
  const [view, setView] = useState<"select" | "form">("select")
  const [category, setCategory] = useState<Category>("PWD")

  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [contact, setContact] = useState("")
  const [medicalCertificate, setMedicalCertificate] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState("")

  // Supporting document (optional image attachment)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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

  const isPWD = category === "PWD"
  const canSubmit = name.trim() && address.trim() && contact.trim() && (!isPWD || medicalCertificate.trim())

  const handleSubmit = () => {
    if (!canSubmit) return
    setReference(generateReference(isPWD ? "PWD" : "SC"))
    setSubmitted(true)
  }

  const handleSelectCategory = (value: Category) => {
    setCategory(value)
    setView("form")
  }

  if (submitted) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center">
            <Check className="h-7 w-7 text-success" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground">Application submitted</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Thank you, {name}. Your {category} registration has been received and is now pending review by a
            social worker.
          </p>
          <div className="mt-2 bg-muted rounded-xl px-4 py-3 w-full">
            <p className="text-xs text-muted-foreground">Reference number</p>
            <p className="text-sm font-semibold text-foreground">{reference}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Save this reference number to track your application status.
          </p>
        </div>
      </div>
    )
  }

  if (view === "select") {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <PageHeader
          title="Apply for PWD / Senior Citizen ID"
          desc="Pick the category that applies to you to start your application."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {CATEGORY_ITEMS.map(({ value, label, desc, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleSelectCategory(value)}
              className="w-full flex items-center gap-3.5 bg-card border border-border rounded-2xl px-4 py-3 shadow-soft transition-all duration-150 hover:-translate-y-0.5 hover:shadow-medium hover:border-primary/35 text-left"
            >
              <div className="h-11 w-11 shrink-0 rounded-full bg-linear-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center">
                <Icon className="h-5.5 w-5.5 text-white" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <ChevronRight className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>

        <div className="mt-6 bg-muted/50 border border-border rounded-2xl p-5 text-sm text-muted-foreground flex items-start gap-2.5">
          <ClipboardList className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
          Pick a category above to start your application. Bring a valid ID, 1x1 photo, and Barangay Certificate
          of Residency (plus Medical Certificate for PWD) when a social worker asks you to visit for
          verification.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <button
        onClick={() => setView("select")}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back
      </button>

      <PageHeader
        title="Apply for PWD / Senior Citizen ID"
        desc="Fill out this form to register for a PWD or Senior Citizen ID. A social worker will review your application and contact you for the next steps."
      />

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ClipboardList className="h-4 w-4 text-primary" />
          Applicant information
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} h-10`} placeholder="Juan D. Dela Cruz" />
          </Field>
          <Field label="Contact number">
            <input value={contact} onChange={(e) => setContact(e.target.value)} className={`${inputCls} h-10`} placeholder="09XX XXX XXXX" />
          </Field>
          <Field label="Address" full>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputCls} h-10`} placeholder="Barangay, City" />
          </Field>
          <Field label="Category" full>
            <div className={`${inputCls} h-10 flex items-center font-medium text-foreground bg-primary/5 border border-primary/20 cursor-not-allowed`}>
              {category === "PWD" ? "PWD (Person with Disability)" : "Senior Citizen"}
            </div>
          </Field>
          {isPWD && (
            <Field label="Medical certificate details" full>
              <input
                value={medicalCertificate}
                onChange={(e) => setMedicalCertificate(e.target.value)}
                className={`${inputCls} h-10`}
                placeholder="Attending physician / diagnosis summary"
              />
            </Field>
          )}

          <Field label="Attach supporting document (optional)" full>
            <p className="text-xs text-muted-foreground mb-2 -mt-1">
              Upload a photo of your valid ID or requirement (JPG or PNG, max 5MB).
            </p>

            {previewUrl ? (
              <div className="flex items-start gap-3">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border shrink-0">
                  <img src={previewUrl} alt={attachment?.name ?? "attachment"} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <p className="text-xs text-foreground truncate max-w-48">{attachment?.name}</p>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/70 cursor-pointer transition-colors">
                      Change image
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg h-32 cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground">
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-medium">Choose image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          You will need to bring a valid ID, 1x1 photo, Barangay Certificate of Residency
          {isPWD && ", and your Medical Certificate"} when you visit your barangay social welfare office.
        </p>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Submit application
        </button>
      </div>
    </div>
  )
}
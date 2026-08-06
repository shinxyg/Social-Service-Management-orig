import { useEffect, useState, useRef } from "react"
import {
  Check,
  ClipboardList,
  ChevronRight,
  Accessibility,
  Users,
  ImagePlus,
  X,
  IdCard,
  Download,
  Building2,
} from "lucide-react"
import { PageHeader } from "../ui/shared"
import { Field, inputCls } from "../ui/form-ui"

function generateReference(prefix: string) {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-2026-${num}`
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

// Format date as MONTH DD, YYYY
function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "—"
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" }).toUpperCase()
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
  const [category, setCategory] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [contact, setContact] = useState("")
  const [medicalCertificate, setMedicalCertificate] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState("")

  const [attachment, setAttachment] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Track the latest blob URL in a ref and only revoke on true unmount.
  // (A cleanup tied to [previewUrl] would re-run on every change, and in
  // React 18 StrictMode dev mode effects mount→cleanup→mount again, which
  // would revoke a freshly created blob URL before it's ever used —
  // producing the "net::ERR_FILE_NOT_FOUND" console errors. The handlers
  // below already revoke the *old* URL themselves whenever it changes, so
  // this effect only needs to guard the very last URL when the component
  // unmounts.)
  const previewUrlRef = useRef<string | null>(null)
  useEffect(() => {
    previewUrlRef.current = previewUrl
  }, [previewUrl])
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

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
  const canSubmit =
    !!category && name.trim() && address.trim() && contact.trim() && (!isPWD || medicalCertificate.trim())

  const handleSubmit = () => {
    if (!canSubmit || !category) return
    setReference(generateReference(isPWD ? "PWD" : "SC"))
    setSubmitted(true)
  }

  const handleSelectCategory = (value: Category) => {
    setCategory(value)
    setMedicalCertificate("")
  }

  const handleResetAll = () => {
    setCategory(null)
    setName("")
    setAddress("")
    setContact("")
    setMedicalCertificate("")
    handleRemoveFile()
    setSubmitted(false)
  }

  // ============ CANVAS-BASED ID CARD GENERATOR ============
  type IdCategory = "PWD" | "Senior Citizen"
  const CIVIL_STATUS_OPTIONS = ["Single", "Married", "Widowed", "Separated"]

  const [idCategory, setIdCategory] = useState<IdCategory>("PWD")
  const [idLastName, setIdLastName] = useState("")
  const [idFirstName, setIdFirstName] = useState("")
  const [idMiddleInitial, setIdMiddleInitial] = useState("")
  const [idSex, setIdSex] = useState<"Male" | "Female">("Male")
  const [idCivilStatus, setIdCivilStatus] = useState(CIVIL_STATUS_OPTIONS[0])
  const [idBloodType, setIdBloodType] = useState("")
  const [idDisabilityType, setIdDisabilityType] = useState("")
  const [idAddress, setIdAddress] = useState("")
  const [idBirthdate, setIdBirthdate] = useState("")
  const [idEmergencyName, setIdEmergencyName] = useState("")
  const [idEmergencyNumber, setIdEmergencyNumber] = useState("")
  const [idPhoto, setIdPhoto] = useState<File | null>(null)
  const [idPhotoUrl, setIdPhotoUrl] = useState<string | null>(null)

  // Template image (base for overlaying data)
  const [templateImage, setTemplateImage] = useState<File | null>(null)
  const [templateImageUrl, setTemplateImageUrl] = useState<string | null>(null)

  // Generated card (canvas output)
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Same ref-tracked, unmount-only cleanup pattern as previewUrl above —
  // avoids StrictMode's double effect invocation revoking a blob URL that
  // was just created and is still in active use (e.g. by the canvas Image()
  // in handleGenerateId, or by the <img> previews below).
  const idPhotoUrlRef = useRef<string | null>(null)
  useEffect(() => {
    idPhotoUrlRef.current = idPhotoUrl
  }, [idPhotoUrl])
  useEffect(() => {
    return () => {
      if (idPhotoUrlRef.current) URL.revokeObjectURL(idPhotoUrlRef.current)
    }
  }, [])

  const templateImageUrlRef = useRef<string | null>(null)
  useEffect(() => {
    templateImageUrlRef.current = templateImageUrl
  }, [templateImageUrl])
  useEffect(() => {
    return () => {
      if (templateImageUrlRef.current) URL.revokeObjectURL(templateImageUrlRef.current)
    }
  }, [])

  const handleIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (idPhotoUrl) URL.revokeObjectURL(idPhotoUrl)
    setIdPhoto(file)
    setIdPhotoUrl(URL.createObjectURL(file))
    e.target.value = ""
  }

  const handleRemoveIdPhoto = () => {
    if (idPhotoUrl) URL.revokeObjectURL(idPhotoUrl)
    setIdPhoto(null)
    setIdPhotoUrl(null)
  }

  const handleTemplateImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (templateImageUrl) URL.revokeObjectURL(templateImageUrl)
    setTemplateImage(file)
    setTemplateImageUrl(URL.createObjectURL(file))
    e.target.value = ""
  }

  const handleRemoveTemplateImage = () => {
    if (templateImageUrl) URL.revokeObjectURL(templateImageUrl)
    setTemplateImage(null)
    setTemplateImageUrl(null)
  }

  const isIdPWD = idCategory === "PWD"
  const canGenerateId = idLastName.trim() && idFirstName.trim() && templateImageUrl

  // Canvas: Draw form data onto template image
  const handleGenerateId = async () => {
    if (!canGenerateId || !canvasRef.current || !templateImageUrl) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const templateImg = new Image()
    templateImg.onload = async () => {
      // Set canvas size to match image
      canvas.width = templateImg.width
      canvas.height = templateImg.height

      // Draw template image
      ctx.drawImage(templateImg, 0, 0)

      // Configuration for text overlay positions
      // Calibrated pixel-for-pixel against the 1536x1024 "Citizen Care ID"
      // (Bayanihan Republic) template — each value sits in the blank space
      // just above its corresponding dashed answer-line, under the matching
      // orange label. Re-measure with a grid overlay if a different template
      // image is used, since these are template-specific pixel coordinates.
      const textConfig = {
        // Full Name — sits above the line below the "FULL NAME" label
        nameX: 383,
        nameY: 333,
        nameFont: "bold 24px Arial, sans-serif",
        nameColor: "#000",

        // Sex / Date of Birth / Civil Status row (line at y=472)
        sexX: 383,
        sexY: 446,
        sexFont: "bold 18px Arial, sans-serif",

        birthX: 608,
        birthY: 446,
        birthFont: "bold 18px Arial, sans-serif",

        civilX: 1133,
        civilY: 446,
        civilFont: "bold 18px Arial, sans-serif",

        // Blood Type / Date Issued / Valid Until row (line at y=579)
        bloodX: 383,
        bloodY: 553,
        bloodFont: "bold 18px Arial, sans-serif",

        issuedX: 608,
        issuedY: 553,
        issuedFont: "bold 18px Arial, sans-serif",

        validX: 1133,
        validY: 553,
        validFont: "bold 18px Arial, sans-serif",

        // Disability Type / Unique ID Number row (line at y=693)
        disabilityX: 383,
        disabilityY: 655,
        disabilityFont: "bold 14px Arial, sans-serif",
        disabilityMaxWidth: 300,
        disabilityLineHeight: 17,

        idNumberX: 730,
        idNumberY: 669,
        idNumberFont: "bold 16px 'Courier New', monospace",
        idNumberColor: "#000",

        // Address — two answer lines (at y=770 and y=805)
        addressX: 383,
        addressY: 749,
        addressFont: "bold 15px Arial, sans-serif",
        addressMaxWidth: 750,
        addressLineHeight: 35,

        // Emergency Contact (line at y=874)
        emergencyX: 383,
        emergencyY: 854,
        emergencyFont: "bold 14px Arial, sans-serif",
        emergencyMaxWidth: 750,
      }

      ctx.fillStyle = textConfig.nameColor
      ctx.textBaseline = "top"

      // 1. Draw Full Name
      const fullName = `${idLastName.toUpperCase()}, ${idFirstName.toUpperCase()} ${idMiddleInitial.toUpperCase()}`.trim()
      ctx.font = textConfig.nameFont
      ctx.fillText(fullName, textConfig.nameX, textConfig.nameY)

      // 2. Draw Sex
      ctx.font = textConfig.sexFont
      ctx.fillText(idSex === "Male" ? "M" : "F", textConfig.sexX, textConfig.sexY)

      // 3. Draw Birthdate
      ctx.font = textConfig.birthFont
      const displayBirthdate = formatDisplayDate(idBirthdate)
      ctx.fillText(displayBirthdate, textConfig.birthX, textConfig.birthY)

      // 4. Draw Civil Status
      ctx.font = textConfig.civilFont
      ctx.fillText(idCivilStatus.toUpperCase(), textConfig.civilX, textConfig.civilY)

      // 5. Draw Blood Type
      ctx.font = textConfig.bloodFont
      ctx.fillText(idBloodType || "—", textConfig.bloodX, textConfig.bloodY)

      // 6. Draw Date Issued
      const issued = new Date()
      const expiry = new Date(issued)
      expiry.setFullYear(expiry.getFullYear() + (idCategory === "PWD" ? 5 : 3))

      ctx.font = textConfig.issuedFont
      const issuedDateStr = issued.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" }).toUpperCase()
      ctx.fillText(issuedDateStr, textConfig.issuedX, textConfig.issuedY)

      // 7. Draw Valid Until
      ctx.font = textConfig.validFont
      const expiryDateStr = expiry.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" }).toUpperCase()
      ctx.fillText(expiryDateStr, textConfig.validX, textConfig.validY)

      // 8. Draw Disability Type (PWD only) — wraps by measured width, not character count
      if (isIdPWD && idDisabilityType) {
        ctx.font = textConfig.disabilityFont
        ctx.fillStyle = "#000"
        const disabilityText = idDisabilityType.toUpperCase()
        const words = disabilityText.split(" ")
        let line = ""
        let y = textConfig.disabilityY
        const dMaxWidth = textConfig.disabilityMaxWidth
        const dLineHeight = textConfig.disabilityLineHeight
        words.forEach((word) => {
          const testLine = line + (line ? " " : "") + word
          const metrics = ctx.measureText(testLine)
          if (metrics.width > dMaxWidth && line) {
            ctx.fillText(line, textConfig.disabilityX, y)
            line = word
            y += dLineHeight
          } else {
            line = testLine
          }
        })
        if (line) ctx.fillText(line, textConfig.disabilityX, y)
      }

      // 9. Draw Unique ID Number (CCID-YYYY-MM-DD-XXXXX format)
      const idNumber = `CCID-${issued.getFullYear()}-${String(issued.getMonth() + 1).padStart(2, "0")}-${String(issued.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`
      ctx.font = textConfig.idNumberFont
      ctx.fillStyle = textConfig.idNumberColor
      ctx.fillText(idNumber, textConfig.idNumberX, textConfig.idNumberY)

      // 10. Draw Address (with word wrap)
      ctx.font = textConfig.addressFont
      ctx.fillStyle = "#000"
      const addressText = idAddress.toUpperCase()
      const words = addressText.split(" ")
      let line = ""
      let y = textConfig.addressY
      const maxWidth = textConfig.addressMaxWidth
      words.forEach((word) => {
        const testLine = line + (line ? " " : "") + word
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && line) {
          ctx.fillText(line, textConfig.addressX, y)
          line = word
          y += textConfig.addressLineHeight
        } else {
          line = testLine
        }
      })
      if (line) ctx.fillText(line, textConfig.addressX, y)

      // 11. Draw Emergency Contact — shrinks to fit its single answer-line if too long
      ctx.fillStyle = "#000"
      const emergencyText = idEmergencyName && idEmergencyNumber 
        ? `${idEmergencyName.toUpperCase()} (${idEmergencyNumber})` 
        : "—"
      let emergencySize = 14
      ctx.font = `bold ${emergencySize}px Arial, sans-serif`
      while (ctx.measureText(emergencyText).width > textConfig.emergencyMaxWidth && emergencySize > 10) {
        emergencySize -= 1
        ctx.font = `bold ${emergencySize}px Arial, sans-serif`
      }
      ctx.fillText(emergencyText, textConfig.emergencyX, textConfig.emergencyY)

      // 12. Add photo to photo area (if provided)
      if (idPhotoUrl) {
        const photoImg = new Image()
        photoImg.onload = () => {
          // Photo silhouette box measured directly from the template: x 62–382, y 283–683
          const photoX = 62
          const photoY = 283
          const photoWidth = 320
          const photoHeight = 400

          // Center-crop the uploaded photo to the box's aspect ratio so it
          // fills the frame without stretching or distorting the image.
          const boxRatio = photoWidth / photoHeight
          const imgRatio = photoImg.width / photoImg.height
          let sx = 0, sy = 0, sw = photoImg.width, sh = photoImg.height
          if (imgRatio > boxRatio) {
            // Image is wider than the box — crop the sides
            sw = photoImg.height * boxRatio
            sx = (photoImg.width - sw) / 2
          } else {
            // Image is taller than the box — crop top/bottom
            sh = photoImg.width / boxRatio
            sy = (photoImg.height - sh) / 2
          }
          ctx.drawImage(photoImg, sx, sy, sw, sh, photoX, photoY, photoWidth, photoHeight)
          
          // Convert canvas to image and display
          const cardDataUrl = canvas.toDataURL("image/png")
          setGeneratedCardUrl(cardDataUrl)
          clearIdForm()
        }
        photoImg.src = idPhotoUrl
      } else {
        // Convert canvas to image and display (without photo)
        const cardDataUrl = canvas.toDataURL("image/png")
        setGeneratedCardUrl(cardDataUrl)
        clearIdForm()
      }
    }
    templateImg.src = templateImageUrl
  }

  // Clear form inputs after generation
  // NOTE: this intentionally does NOT clear idPhotoUrl via revoke here;
  // the effect above handles cleanup when idPhotoUrl actually changes.
  const clearIdForm = () => {
    setIdLastName("")
    setIdFirstName("")
    setIdMiddleInitial("")
    setIdSex("Male")
    setIdCivilStatus(CIVIL_STATUS_OPTIONS[0])
    setIdBloodType("")
    setIdDisabilityType("")
    setIdAddress("")
    setIdBirthdate("")
    setIdEmergencyName("")
    setIdEmergencyNumber("")
    setIdPhoto(null)
    setIdPhotoUrl(null)
  }

  const handleDownloadCard = () => {
    if (!generatedCardUrl) return
    const link = document.createElement("a")
    link.href = generatedCardUrl
    link.download = `ID-Card-${Date.now()}.png`
    link.click()
  }

  if (submitted && category) {
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
          <button
            onClick={handleResetAll}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Submit another application
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {category && (
        <button
          onClick={() => setCategory(null)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      )}

      <PageHeader
        title="Apply for PWD / Senior Citizen ID"
        desc={
          category
            ? "Fill out this form to register. A social worker will review your application and contact you for the next steps."
            : "Pick the category that applies to you, then fill out the form below."
        }
      />

      {!category && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CATEGORY_ITEMS.map(({ value, label, desc, icon: Icon }) => {
            return (
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
            )
          })}
        </div>
      )}

      {!category && (
        <div className="bg-muted/50 border border-border rounded-2xl p-5 text-sm text-muted-foreground flex items-start gap-2.5">
          <ClipboardList className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
          Pick a category above to open the application form. Bring a valid ID, 1x1 photo, and Barangay
          Certificate of Residency (plus Medical Certificate for PWD) when a social worker asks you to visit for
          verification.
        </div>
      )}

      {category && (
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
      )}

      {/* Canvas-based ID Generator */}
      {!category && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <IdCard className="h-4 w-4 text-primary" />
            🎫 Canvas Auto-Generate ID Card
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            ⭐ Upload your blank template, fill in data, auto-generate card with canvas overlay.
          </p>

          <div className="flex gap-2">
            {(["PWD", "Senior Citizen"] as IdCategory[]).map((opt) => (
              <button
                key={opt}
                onClick={() => setIdCategory(opt)}
                className={`flex-1 h-10 rounded-lg text-xs font-medium border transition-colors ${
                  idCategory === opt
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-muted border-transparent text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {opt === "PWD" ? "PWD" : "Senior Citizen"}
              </button>
            ))}
          </div>

          {/* Template Image Upload */}
          <Field label="📸 Step 1: Upload Card Template Image" full>
            <p className="text-xs text-muted-foreground mb-2 -mt-1">
              Upload your blank ID card template (JPG/PNG). The form data will be auto-overlaid onto this image using Canvas.
            </p>
            {templateImageUrl ? (
              <div className="flex items-start gap-3">
                <div className="relative w-40 h-32 rounded-lg overflow-hidden border border-border shrink-0">
                  <img src={templateImageUrl} alt="Template" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-foreground truncate max-w-48">{templateImage?.name}</p>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/70 cursor-pointer transition-colors">
                      Change template
                      <input type="file" accept="image/*" className="hidden" onChange={handleTemplateImageChange} />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveTemplateImage}
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
                <span className="text-xs font-medium">Upload template image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleTemplateImageChange} />
              </label>
            )}
          </Field>

          {/* Form fields for ID data */}
          <div className="pt-4 border-t border-border space-y-4">
            <p className="text-xs font-semibold text-foreground">📝 Step 2: Fill Out ID Information</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Last name">
                <input value={idLastName} onChange={(e) => setIdLastName(e.target.value)} className={`${inputCls} h-10`} placeholder="Dela Cruz" />
              </Field>
              <Field label="First name">
                <input value={idFirstName} onChange={(e) => setIdFirstName(e.target.value)} className={`${inputCls} h-10`} placeholder="Juan" />
              </Field>
              <Field label="M.I.">
                <input value={idMiddleInitial} onChange={(e) => setIdMiddleInitial(e.target.value)} className={`${inputCls} h-10`} placeholder="D." maxLength={4} />
              </Field>

              <Field label="Sex">
                <select value={idSex} onChange={(e) => setIdSex(e.target.value as "Male" | "Female")} className={`${inputCls} h-10`}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </Field>
              <Field label="Birthdate">
                <input type="date" value={idBirthdate} onChange={(e) => setIdBirthdate(e.target.value)} className={`${inputCls} h-10`} />
              </Field>
              <Field label="Civil status">
                <select value={idCivilStatus} onChange={(e) => setIdCivilStatus(e.target.value)} className={`${inputCls} h-10`}>
                  {CIVIL_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>

              <Field label="Blood type (optional)">
                <input value={idBloodType} onChange={(e) => setIdBloodType(e.target.value)} className={`${inputCls} h-10`} placeholder="O+" />
              </Field>
              {isIdPWD && (
                <Field label="Disability type" full>
                  <input
                    value={idDisabilityType}
                    onChange={(e) => setIdDisabilityType(e.target.value)}
                    className={`${inputCls} h-10`}
                    placeholder="e.g. Physical Disability"
                  />
                </Field>
              )}

              <Field label="Address" full>
                <input value={idAddress} onChange={(e) => setIdAddress(e.target.value)} className={`${inputCls} h-10`} placeholder="123 St., Barangay" />
              </Field>

              <Field label="Emergency contact name">
                <input value={idEmergencyName} onChange={(e) => setIdEmergencyName(e.target.value)} className={`${inputCls} h-10`} placeholder="Maria Dela Cruz" />
              </Field>
              <Field label="Emergency contact number">
                <input value={idEmergencyNumber} onChange={(e) => setIdEmergencyNumber(e.target.value)} className={`${inputCls} h-10`} placeholder="09XX XXX XXXX" />
              </Field>
            </div>
          </div>

          {/* Photo Upload */}
          <Field label="🖼️ Photo (Optional)" full>
            {idPhotoUrl ? (
              <div className="flex items-center gap-3">
                <img src={idPhotoUrl} alt="ID photo" className="w-16 h-16 rounded-lg object-cover border border-border shrink-0" />
                <div className="flex gap-2">
                  <label className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/70 cursor-pointer transition-colors">
                    Change photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleIdPhotoChange} />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveIdPhoto}
                    className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg h-24 cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground">
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs font-medium">Choose photo (1x1 or 2x2)</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleIdPhotoChange} />
              </label>
            )}
          </Field>

          {/* Hidden canvas for rendering */}
          <canvas ref={canvasRef} className="hidden" />

          <button
            onClick={handleGenerateId}
            disabled={!canGenerateId}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            ✨ Generate ID Card (Canvas)
          </button>

          {/* Generated Card Preview */}
          {generatedCardUrl && (
            <div className="pt-4 space-y-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                ✅ Generated Card Output
              </p>
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={generatedCardUrl} alt="Generated ID Card" className="w-full" />
              </div>
              <button
                onClick={handleDownloadCard}
                className="w-full h-10 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Card Image
              </button>
              <p className="text-xs text-muted-foreground text-center">
                💡 If text position is wrong, adjust textConfig coordinates in component code and re-test.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
import { useEffect, useRef, useState } from "react"
import { Camera, Clock, ClipboardList, ImagePlus, ScanFace, X, Loader2, RotateCcw, Info, FileText, CheckCircle2, XCircle } from "lucide-react"
import { PageHeader } from "../ui/shared"
import { useLanguage } from "../ui/language-context"
import RequirementsModal, { AICS_REQUIREMENTS } from "./Requirements-modal"


function generateReference() {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `AICS-2026-${num}`
}

interface ApplyAICSProps {
  initialType?: string
  initialTypeKey?: string   // stable key ("aicsMedical"), used for logic — not translated text
  onBack?: () => void
}

// "requirements" and "checklist" are pre-form screens — only shown for Medical Assistance
// "personal" is the Personal Information wizard step (step 2), also Medical Assistance only
// "documents" is the Sample Documents wizard step (step 3), also Medical Assistance only
type Step = "requirements" | "checklist" | "personal" | "documents" | "review" | "form" | "verify" | "matching" | "pending"
const WIZARD_TABS = [
  "COMPLETE CHECKLIST",
  "PERSONAL INFORMATION",
  "SAMPLE DOCUMENTS",
  "REVIEW & SUBMIT",
  "SET AN APPOINTMENT",
]

// Sample documents required for the Medical Assistance program (Para sa Gamot / Medical Supplies)
const SAMPLE_DOCUMENTS = [
  "MEDICAL CERTIFICATE / CLINICAL ABSTRACT",
  "RESETA NG GAMOT",
  "BARANGAY CERTIFICATE OF INDIGENCY",
  "QC ID NG PASYENTE",
  "AUTHORIZATION / PERSONAL LETTER",
]

const FUNERAL_SAMPLE_DOCUMENTS = [
  "REFERRAL FORM MULA SA BARANGAY, HOSPITAL O FUNERAL",
  "CERTIFIED TRUE COPY NG DEATH CERTIFICATE",
  "NOTARIZED FUNERAL CONTRACT",
  "CERTIFICATE OF INDIGENCY (PARA SA FUNERAL/BURIAL ASSISTANCE)",
  "VALID ID NG DECEASED AT NG INFORMANT",
]

const SAMPLE_DOCUMENT_INFO: Record<string, { images: string[]; downloadUrl?: string }> = {
  "MEDICAL CERTIFICATE / CLINICAL ABSTRACT": {
    images: ["/path/to/medical-certificate-sample.png"],
  },
  "RESETA NG GAMOT": {
    images: ["/path/to/reseta-sample.png"],
  },
  "BARANGAY CERTIFICATE OF INDIGENCY": {
    images: ["/path/to/barangay-certificate-sample.png"],
  },
  "QC ID NG PASYENTE": {
    images: ["/path/to/qc-id-sample.png"],
  },
  "AUTHORIZATION / PERSONAL LETTER": {
    images: ["/path/to/authorization-letter-sample.png"],
  },
}

export default function ApplyAICS({ initialType, initialTypeKey, onBack }: ApplyAICSProps) {
  const { t } = useLanguage()
  const [sampleDocOpen, setSampleDocOpen] = useState<string | null>(null)

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
  const [reference, setReference] = useState("")

const isFuneralAssistance = initialTypeKey === "aicsFuneral"
const requirements = initialTypeKey ? AICS_REQUIREMENTS[initialTypeKey] : undefined
const hasRequirements = Boolean(requirements)

const [step, setStep] = useState<Step>(
  hasRequirements ? "requirements" : "form"
)

  // Requirements modal state
  const [reqAccepted, setReqAccepted] = useState(false)
  const [showInfoBanner, setShowInfoBanner] = useState(true)
  const [showSlotBanner, setShowSlotBanner] = useState(true)

  // Checklist step state
  const [checklistResident, setChecklistResident] = useState(false)
  const [checklistPatient, setChecklistPatient] = useState(false)
  const [checklistPriorAid, setChecklistPriorAid] = useState<"yes" | "no">("no")
  const [priorAidOffice, setPriorAidOffice] = useState("")
  const [priorAidType, setPriorAidType] = useState("")

  // Funeral Assistance checklist fields
  const [checklistDeceasedResident, setChecklistDeceasedResident] = useState<"yes" | "no" | "">("")
  const [checklistRelation, setChecklistRelation] = useState("")
  const [checklistFuneralHome, setChecklistFuneralHome] = useState("")

  const canProceedChecklist = isFuneralAssistance
    ? Boolean(checklistDeceasedResident === "yes" && checklistRelation)
    : checklistResident && checklistPatient

  // ── Personal Information step state (Medical Assistance only, wizard step 2) ──
  const [qcId] = useState("110000116932100")
  const [pFirstName, setPFirstName] = useState("")
  const [pMiddleName, setPMiddleName] = useState("")
  const [pLastName, setPLastName] = useState("")
  const [pSuffix, setPSuffix] = useState("")
  const [pNationality, setPNationality] = useState("FILIPINO")
  const [pBirthDate, setPBirthDate] = useState("")
  const [pAge, setPAge] = useState("")
  const [pGender, setPGender] = useState("")
  const [pCivilStatus, setPCivilStatus] = useState("")
  const [pHouseNumber, setPHouseNumber] = useState("")
  const [pStreetName, setPStreetName] = useState("")
  const [pBarangay, setPBarangay] = useState("")
  const [pPhoneNumber, setPPhoneNumber] = useState("")
  const [pEmail, setPEmail] = useState("")
  const [isSelfPatient, setIsSelfPatient] = useState(false)

  // Impormasyon ng Informant
  const [iFirstName, setIFirstName] = useState("")
  const [iMiddleName, setIMiddleName] = useState("")
  const [iLastName, setILastName] = useState("")
  const [iSuffix, setISuffix] = useState("")
  const [iGender, setIGender] = useState("")
  const [iBirthDate, setIBirthDate] = useState("")
  const [iAge, setIAge] = useState("")
  const [sameAddressAsApplicant, setSameAddressAsApplicant] = useState(false)
  const [iHouseNumber, setIHouseNumber] = useState("")
  const [iStreetName, setIStreetName] = useState("")
  const [iBarangay, setIBarangay] = useState("")

  // If informant address matches applicant, keep the fields in sync automatically
  useEffect(() => {
    if (sameAddressAsApplicant) {
      setIHouseNumber(pHouseNumber)
      setIStreetName(pStreetName)
      setIBarangay(pBarangay)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sameAddressAsApplicant, pHouseNumber, pStreetName, pBarangay])

  // When the applicant is the patient themselves, the whole Informant section
  // mirrors the applicant's own details and is locked/disabled.
  useEffect(() => {
    if (isSelfPatient) {
      setIFirstName(pFirstName)
      setIMiddleName(pMiddleName)
      setILastName(pLastName)
      setISuffix(pSuffix)
      setIGender(pGender)
      setIBirthDate(pBirthDate)
      setIAge(pAge)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelfPatient, pFirstName, pMiddleName, pLastName, pSuffix, pGender, pBirthDate, pAge])

  // "Ako ang pasyente..." checkbox drives "Katulad ng Address ng Applicant":
  // checking it auto-checks + fills the informant address; unchecking clears it back to editable/empty.
  const handleToggleSelfPatient = (checked: boolean) => {
    setIsSelfPatient(checked)
    setSameAddressAsApplicant(checked)
    if (!checked) {
      setIHouseNumber("")
      setIStreetName("")
      setIBarangay("")
      setIFirstName("")
      setIMiddleName("")
      setILastName("")
      setISuffix("")
      setIGender("")
      setIBirthDate("")
      setIAge("")
    }
  }

  const canProceedPersonal = Boolean(
  pFirstName.trim() &&
  pLastName.trim() &&
  pNationality.trim() &&
  pBirthDate.trim() &&
  pAge.trim() &&
  pGender.trim() &&
  pHouseNumber.trim() &&
  pStreetName.trim() &&
  pBarangay.trim() &&
  pPhoneNumber.trim() &&
  pEmail.trim() &&
  iFirstName.trim() &&
  iLastName.trim() &&
  iGender.trim() &&
  iBirthDate.trim() &&
  iAge.trim() &&
  iHouseNumber.trim() &&
  iStreetName.trim() &&
  iBarangay.trim()
)

  // Supporting document — valid ID (required for verification matching)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Verification selfie — resident holding their valid ID, captured live
  // from the camera instead of picked from a file dialog.
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [verifyError, setVerifyError] = useState("")
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const isTypeLocked = Boolean(initialType)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const handleOpenCamera = async () => {
    setCameraError("")
    setVerifyError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })
      streamRef.current = stream
      setCameraOpen(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
    } catch {
      setCameraError(
        "We couldn't access your camera. Please allow camera permission, or make sure your device has one."
      )
    }
  }

  const handleCaptureSelfie = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 480
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setSelfieDataUrl(canvas.toDataURL("image/jpeg", 0.9))
    stopCamera()
    setCameraOpen(false)
  }

  const handleRetakeSelfie = () => {
    setSelfieDataUrl(null)
    handleOpenCamera()
  }

  const handleCancelCamera = () => {
    stopCamera()
    setCameraOpen(false)
  }

  const handleRemoveSelfie = () => {
    setSelfieDataUrl(null)
  }

  const canSubmit = name.trim() && address.trim() && contact.trim() && narrative.trim()

  const handleContinueToVerify = () => {
    if (!canSubmit) return
    if (!attachment) {
      setVerifyError("Please attach a photo of your valid ID first.")
      return
    }
    setVerifyError("")
    setStep("verify")
  }

  const handleVerifyAndSubmit = () => {
    if (!selfieDataUrl) {
      setVerifyError("Please take a selfie holding your valid ID to continue.")
      return
    }
    setVerifyError("")
    setStep("matching")
    setReference(generateReference())

    setTimeout(() => {
      setStep("pending")
    }, 1800)
  }

// ── Requirements acknowledgement MODAL (Medical Assistance only) ──
if (step === "requirements" && requirements) {
  return (
    <>
      <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        )}
        <PageHeader title={t("applyAicsTitle")} desc={t("applyAicsDesc")} />
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft opacity-40 pointer-events-none">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ClipboardList className="h-4 w-4 text-primary" />
            {t("applicantInformation")}
          </div>
        </div>
      </div>

      <RequirementsModal
        requirements={requirements}
        accepted={reqAccepted}
        onAcceptedChange={setReqAccepted}
        onContinue={() => setStep(hasRequirements ? "checklist" : "form")}
        showInfoBanner={showInfoBanner}
        onCloseInfoBanner={() => setShowInfoBanner(false)}
        showSlotBanner={showSlotBanner}
        onCloseSlotBanner={() => setShowSlotBanner(false)}
      />
    </>
  )
}
  // ── Complete Checklist wizard step (Medical Assistance only) ──
  if (step === "checklist") {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="border border-border rounded-2xl overflow-hidden shadow-soft bg-card relative">
          {/* Step indicator */}
          <div className="flex items-center px-6 pt-6">
            {WIZARD_TABS.map((_, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${
                    i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < WIZARD_TABS.length - 1 && <div className="flex-1 h-px bg-border mx-2" />}
              </div>
            ))}
          </div>

          {/* Tab labels */}
          <div className="flex gap-1 px-6 pt-4">
            {WIZARD_TABS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 text-center text-xs font-semibold py-3 rounded-md ${
                  i === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="p-6 space-y-6">
            {isFuneralAssistance ? (
              <>
                <div>
                  <h2 className="font-heading font-semibold text-foreground mb-1">ELIGIBILITY</h2>
                </div>

                <div>
                  <p className="text-sm text-foreground mb-3">Ang namatay ba ay residente ng QC? *</p>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm text-primary cursor-pointer select-none">
                      <input
                        type="radio"
                        name="deceasedResident"
                        checked={checklistDeceasedResident === "yes"}
                        onChange={() => setChecklistDeceasedResident("yes")}
                        className="h-4 w-4 accent-primary"
                      />
                      Oo
                    </label>
                    <label className="flex items-center gap-2 text-sm text-primary cursor-pointer select-none">
                      <input
                        type="radio"
                        name="deceasedResident"
                        checked={checklistDeceasedResident === "no"}
                        onChange={() => setChecklistDeceasedResident("no")}
                        className="h-4 w-4 accent-primary"
                      />
                      Hindi
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-foreground mb-3">Ano ang relasyon mo sa yumao? *</p>
                  <div className="space-y-2">
                    {["Anak", "Magulang", "Kapatid", "Asawa", "Iba pa"].map((rel) => (
                      <label key={rel} className="flex items-center gap-2.5 text-sm text-primary cursor-pointer select-none">
                        <input
                          type="radio"
                          name="relationToDeceased"
                          checked={checklistRelation === rel}
                          onChange={() => setChecklistRelation(rel)}
                          className="h-4 w-4 accent-primary"
                        />
                        {rel}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-primary mb-1">
                    Kung mayroon nang nakuhang punerarya, pumili kung anong funeral ang nagserbisyo *
                  </label>
                  <select
                    value={checklistFuneralHome}
                    onChange={(e) => setChecklistFuneralHome(e.target.value)}
                    className="w-full h-11 rounded-lg border border-primary/40 bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="" disabled>Pumili ng funeral home</option>
                    <option value="Catalonia Funeral Homes">Catalonia Funeral Homes</option>
                    <option value="Iba pa">Iba pa</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pumili po ng isang akreditadong partner na punerarya. Kung hindi nakalista ang inyong
                    napiling punerarya, piliin ang 'Iba pa'.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="font-heading font-semibold text-foreground mb-1">MGA KINAKAILANGAN SA SERBISYO</h2>
                  <p className="text-sm font-semibold text-foreground">MGA PANGUNAHING KINAKAILANGAN</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-2.5 text-sm text-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checklistResident}
                      onChange={(e) => setChecklistResident(e.target.checked)}
                      className="h-4 w-4 mt-0.5 rounded border-border accent-primary shrink-0"
                    />
                    <span>Ikaw ba ay isang lehitimong residente ng Quezon City? *</span>
                  </label>

                  <label className="flex items-start gap-2.5 text-sm text-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checklistPatient}
                      onChange={(e) => setChecklistPatient(e.target.checked)}
                      className="h-4 w-4 mt-0.5 rounded border-border accent-primary shrink-0"
                    />
                    <span>
                      Ikaw ba ay isang QC citizen (o miyembro ng pamilya) na may karamdaman na nangangailangan ng
                      tulong pinansyal para sa ospitalisasyon/gamot? *
                    </span>
                  </label>
                </div>

                <div>
                  <p className="text-sm text-foreground mb-3">
                    Nakakuha ka na ba ng tulong medikal mula sa ibang opisina ng Quezon City? *
                  </p>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm text-primary cursor-pointer select-none">
                      <input
                        type="radio"
                        name="priorAid"
                        checked={checklistPriorAid === "yes"}
                        onChange={() => setChecklistPriorAid("yes")}
                        className="h-4 w-4 accent-primary"
                      />
                      Oo, nakakuha na ako ng tulong medikal
                    </label>
                    <label className="flex items-center gap-2 text-sm text-primary cursor-pointer select-none">
                      <input
                        type="radio"
                        name="priorAid"
                        checked={checklistPriorAid === "no"}
                        onChange={() => {
                          setChecklistPriorAid("no")
                          setPriorAidOffice("")
                          setPriorAidType("")
                        }}
                        className="h-4 w-4 accent-primary"
                      />
                      Hindi pa
                    </label>
                  </div>

                  {checklistPriorAid === "yes" && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-xs text-primary mb-1">Kung oo, tukuyin ang opisina</label>
                        <input
                          value={priorAidOffice}
                          onChange={(e) => setPriorAidOffice(e.target.value)}
                          placeholder="hal., QC Health Department, QC Social Services, atbp."
                          className="w-full h-11 rounded-lg border border-primary/40 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-primary mb-1">Uri ng tulong na natanggap</label>
                        <select
                          value={priorAidType}
                          onChange={(e) => setPriorAidType(e.target.value)}
                          className="w-full h-11 rounded-lg border border-primary/40 bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          <option value="" disabled>Uri ng tulong na natanggap</option>
                          <option value="cash">Cash</option>
                          <option value="guarantee_letter">Guarantee Letter</option>
                          <option value="gamot">Gamot</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">I-CLICK ANG TYPE NG ASSISTANCE</h3>
                  <label className="block text-xs text-primary mb-1">Pumili ng Type ng Assistance **</label>
                  <div className="w-full h-11 rounded-lg border border-primary/40 bg-background px-3 flex items-center justify-between text-sm text-foreground cursor-not-allowed opacity-90">
                    Medicines / Medical Supplies
                    <span className="text-muted-foreground">▾</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="px-6 pb-6 flex justify-end">
            <button
              onClick={() => setStep("personal")}
              disabled={!canProceedChecklist}
              className="px-6 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-opacity"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Personal Information wizard step (Medical Assistance only) ──
  if (step === "personal") {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="border border-border rounded-2xl overflow-hidden shadow-soft bg-card relative">
          {/* Step indicator */}
          <div className="flex items-center px-6 pt-6">
            {WIZARD_TABS.map((_, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${
                    i === 1
                      ? "bg-primary text-primary-foreground"
                      : i < 1
                      ? "bg-primary/70 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < WIZARD_TABS.length - 1 && <div className="flex-1 h-px bg-border mx-2" />}
              </div>
            ))}
          </div>

          {/* Tab labels */}
          <div className="flex gap-1 px-6 pt-4">
            {WIZARD_TABS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 text-center text-xs font-semibold py-3 rounded-md ${
                  i === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-600">MAHALAGANG PAALALA</p>
                <p className="text-blue-600/90 mt-0.5">
                  Mangyaring tiyakin na ang impormasyong nakalagay sa iyong QCID ay tama at kumpleto.
                  Kung may kulang o maling detalye, makipag-ugnayan sa QCID Team upang ma-update ang
                  iyong QCID records bago magpatuloy sa aplikasyon. Ang tamang impormasyon ay mahalaga
                  para sa mabilis at maayos na pagproseso ng iyong serbisyo.
                </p>
              </div>
            </div>

            {/* Applicant details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="QC ID *" full>
                <input value={qcId} disabled className={`${inputCls} h-10 disabled:cursor-not-allowed disabled:opacity-80`} />
              </Field>

              <Field label="Pangalan *">
                <input value={pFirstName} onChange={(e) => setPFirstName(e.target.value)} className={`${inputCls} h-10`} placeholder="Pangalan" />
              </Field>
              <Field label="Gitnang Pangalan (middle name)">
                <input value={pMiddleName} onChange={(e) => setPMiddleName(e.target.value)} className={`${inputCls} h-10`} placeholder="Gitnang Pangalan" />
              </Field>
              <Field label="Apelyido *">
                <input value={pLastName} onChange={(e) => setPLastName(e.target.value)} className={`${inputCls} h-10`} placeholder="Apelyido" />
              </Field>

              <Field label="Suffix (Jr., Sr., III, atbp.)">
                <input value={pSuffix} onChange={(e) => setPSuffix(e.target.value)} className={`${inputCls} h-10`} placeholder="Suffix" />
              </Field>
              <Field label="Nasyonalidad *">
                <input value={pNationality} onChange={(e) => setPNationality(e.target.value)} className={`${inputCls} h-10`} placeholder="Nasyonalidad" />
              </Field>
              <Field label="Petsa ng Kapanganakan *">
                <input type="date" value={pBirthDate} onChange={(e) => setPBirthDate(e.target.value)} className={`${inputCls} h-10`} />
              </Field>

              <Field label="Edad *">
                <input
                  value={pAge}
                  onChange={(e) => setPAge(e.target.value.replace(/\D/g, ""))}
                  className={`${inputCls} h-10`}
                  placeholder="Edad"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Kasarian *">
                <select value={pGender} onChange={(e) => setPGender(e.target.value)} className={`${inputCls} h-10`}>
                  <option value="" disabled>Piliin</option>
                  <option value="Lalaki">Lalaki</option>
                  <option value="Babae">Babae</option>
                </select>
              </Field>
              <Field label="Katayuang Sibil *">
                <select value={pCivilStatus} onChange={(e) => setPCivilStatus(e.target.value)} className={`${inputCls} h-10`}>
                  <option value="" disabled>Piliin</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </Field>

              <Field label="Numero ng Bahay/Gusali *">
                <input value={pHouseNumber} onChange={(e) => setPHouseNumber(e.target.value)} autoComplete="off" className={`${inputCls} h-10`} placeholder="Numero ng Bahay/Gusali" />
              </Field>
              <Field label="Pangalan ng Kalye *">
                <input value={pStreetName} onChange={(e) => setPStreetName(e.target.value)} autoComplete="off" className={`${inputCls} h-10`} placeholder="Pangalan ng Kalye" />
              </Field>
              <Field label="Barangay *">
                <input value={pBarangay} onChange={(e) => setPBarangay(e.target.value)} autoComplete="off" className={`${inputCls} h-10`} placeholder="Barangay" />
              </Field>

              <Field label="Numero ng Telepono *">
                <input value={pPhoneNumber} onChange={(e) => setPPhoneNumber(e.target.value)} className={`${inputCls} h-10`} placeholder="0900 000 0000" />
              </Field>
              <Field label="Email *" full>
                <input type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} className={`${inputCls} h-10`} placeholder="email@example.com" />
              </Field>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSelfPatient}
                onChange={(e) => handleToggleSelfPatient(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Ako ang pasyente na nag-a-apply para sa sarili ko
            </label>

            {/* Informant details */}
            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="font-heading font-semibold text-foreground">Impormasyon ng Informant</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Pangalan *">
                  <input
                    value={iFirstName}
                    onChange={(e) => setIFirstName(e.target.value)}
                    disabled={isSelfPatient}
                    className={`${inputCls} h-10 disabled:cursor-not-allowed disabled:opacity-80`}
                    placeholder="Pangalan"
                  />
                </Field>
                <Field label="Gitnang Pangalan (middle name)">
                  <input
                    value={iMiddleName}
                    onChange={(e) => setIMiddleName(e.target.value)}
                    disabled={isSelfPatient}
                    className={`${inputCls} h-10 disabled:cursor-not-allowed disabled:opacity-80`}
                    placeholder="Gitnang Pangalan"
                  />
                </Field>
                <Field label="Apelyido *">
                  <input
                    value={iLastName}
                    onChange={(e) => setILastName(e.target.value)}
                    disabled={isSelfPatient}
                    className={`${inputCls} h-10 disabled:cursor-not-allowed disabled:opacity-80`}
                    placeholder="Apelyido"
                  />
                </Field>

                <Field label="Suffix (Jr., Sr., III, atbp.)">
                  <input
                    value={iSuffix}
                    onChange={(e) => setISuffix(e.target.value)}
                    disabled={isSelfPatient}
                    className={`${inputCls} h-10 disabled:cursor-not-allowed disabled:opacity-80`}
                    placeholder="Suffix"
                  />
                </Field>
                <Field label="Kasarian *">
                  <select
                    value={iGender}
                    onChange={(e) => setIGender(e.target.value)}
                    disabled={isSelfPatient}
                    className={`${inputCls} h-10 disabled:cursor-not-allowed disabled:opacity-80`}
                  >
                    <option value="" disabled>Piliin</option>
                    <option value="Lalaki">Lalaki</option>
                    <option value="Babae">Babae</option>
                  </select>
                </Field>
                <Field label="Petsa ng Kapanganakan *">
                  <input
                    type="date"
                    value={iBirthDate}
                    onChange={(e) => setIBirthDate(e.target.value)}
                    disabled={isSelfPatient}
                    className={`${inputCls} h-10 disabled:cursor-not-allowed disabled:opacity-80`}
                  />
                </Field>

                <Field label="Edad *">
                  <input
                    value={iAge}
                    onChange={(e) => setIAge(e.target.value.replace(/\D/g, ""))}
                    disabled={isSelfPatient}
                    className={`${inputCls} h-10 disabled:cursor-not-allowed disabled:opacity-80`}
                    placeholder="Edad"
                    inputMode="numeric"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sameAddressAsApplicant}
                  onChange={(e) => setSameAddressAsApplicant(e.target.checked)}
                  tabIndex={isSelfPatient ? -1 : 0}
                  className={`h-4 w-4 rounded border-border accent-primary ${isSelfPatient ? "pointer-events-none" : ""}`}
                />
                Katulad ng Address ng Applicant
              </label>

              {/* Address fields always visible; locked when Katulad ng Address ng Applicant is checked */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Numero ng Bahay/Gusali *">
                  <input
                    value={iHouseNumber}
                    onChange={(e) => setIHouseNumber(e.target.value)}
                    disabled={sameAddressAsApplicant}
                    autoComplete="off"
                    className={`${inputCls} h-10 disabled:cursor-not-allowed disabled:opacity-80`}
                    placeholder="Numero ng Bahay/Gusali"
                  />
                </Field>
                <Field label="Pangalan ng Kalye *">
                  <input
                    value={iStreetName}
                    onChange={(e) => setIStreetName(e.target.value)}
                    disabled={sameAddressAsApplicant}
                    autoComplete="off"
                    className={`${inputCls} h-10 disabled:cursor-not-allowed disabled:opacity-80`}
                    placeholder="Pangalan ng Kalye"
                  />
                </Field>
                <Field label="Barangay *">
                  <input
                    value={iBarangay}
                    onChange={(e) => setIBarangay(e.target.value)}
                    disabled={sameAddressAsApplicant}
                    autoComplete="off"
                    className={`${inputCls} h-10 disabled:cursor-not-allowed disabled:opacity-80`}
                    placeholder="Barangay"
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 flex justify-between">
            <button
              onClick={() => setStep("checklist")}
              className="px-6 h-10 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors"
            >
              BACK
            </button>
            <button
              onClick={() => setStep("documents")}
              disabled={!canProceedPersonal}
              className="px-6 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-opacity"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Sample Documents wizard step (Medical Assistance only, wizard step 3) ──
  if (step === "documents") {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="border border-border rounded-2xl overflow-hidden shadow-soft bg-card relative">
          {/* Step indicator */}
          <div className="flex items-center px-6 pt-6">
            {WIZARD_TABS.map((_, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${
                    i === 2
                      ? "bg-primary text-primary-foreground"
                      : i < 2
                      ? "bg-primary/70 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < WIZARD_TABS.length - 1 && <div className="flex-1 h-px bg-border mx-2" />}
              </div>
            ))}
          </div>

          {/* Tab labels */}
          <div className="flex gap-1 px-6 pt-4">
            {WIZARD_TABS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 text-center text-xs font-semibold py-3 rounded-md ${
                  i === 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h2 className="font-heading font-semibold text-foreground mb-1">
                Mga sample ng dokumentong ipapasa.
              </h2>
              <p className="text-sm text-amber-600">
                Paalala: Ang pagsusuri ng kahilingan ay dadaan sa assessment ng social worker.
                Siguraduhing dalhin din ang lahat ng orihinal na dokumento sa araw ng appointment.
              </p>
            </div>

           <div>
                <h3 className="text-sm font-bold text-foreground mb-3 tracking-wide">
                  {isFuneralAssistance ? "PARA SA FUNERAL AND BURIAL ASSISTANCE" : "PARA SA GAMOT / MEDICAL SUPPLIES"}
                </h3>

                <div className="space-y-4">
                  {(isFuneralAssistance ? FUNERAL_SAMPLE_DOCUMENTS : SAMPLE_DOCUMENTS).map((doc) => (
                  <div key={doc} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setSampleDocOpen(doc)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      SAMPLE DOCUMENT
                    </button>
                    <div className="border border-dashed border-border rounded-lg px-4 py-3 text-sm font-medium text-foreground">
                      {doc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
      {sampleDocOpen && SAMPLE_DOCUMENT_INFO[sampleDocOpen] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="p-6 pb-4 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold text-foreground">
                Sample: {sampleDocOpen}
              </h2>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-wrap gap-4 justify-center">
                {SAMPLE_DOCUMENT_INFO[sampleDocOpen].images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${sampleDocOpen} sample ${i + 1}`}
                    className="max-h-96 rounded-lg border border-border object-contain"
                  />
                ))}
              </div>
            </div>
            <div className="p-6 pt-4 border-t border-border flex items-center justify-end gap-4 shrink-0">
              <button
                onClick={() => setSampleDocOpen(null)}
                className="px-6 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
          <div className="px-6 pb-6 flex justify-between">
            <button
              onClick={() => setStep("personal")}
              className="px-6 h-10 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors"
            >
              BACK
            </button>
            <button
              onClick={() => setStep("review")}
              className="px-6 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    )
  }
 // ── Review & Submit wizard step (Medical Assistance only, wizard step 4) ──
  if (step === "review") {
    const hasPriorAidType = Boolean(priorAidType.trim())

    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="border border-border rounded-2xl overflow-hidden shadow-soft bg-card relative">
          {/* Step indicator */}
          <div className="flex items-center px-6 pt-6">
            {WIZARD_TABS.map((_, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${
                    i === 3
                      ? "bg-primary text-primary-foreground"
                      : i < 3
                      ? "bg-primary/70 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < WIZARD_TABS.length - 1 && <div className="flex-1 h-px bg-border mx-2" />}
              </div>
            ))}
          </div>

          {/* Tab labels */}
          <div className="flex gap-1 px-6 pt-4">
            {WIZARD_TABS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 text-center text-xs font-semibold py-3 rounded-md ${
                  i === 3
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h2 className="font-heading font-semibold text-foreground mb-1">SURIIN ANG IYONG APPLICATION</h2>
              <p className="text-sm text-muted-foreground">
                Mangyaring suriin nang mabuti ang lahat ng impormasyon bago i-submit ang iyong application.
                Maaari mong i-edit ang anumang seksyon sa pamamagitan ng pag-click sa edit button.
              </p>
            </div>

            {/* Mga Kinakailangan */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between bg-muted/50 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Mga Kinakailangan</h3>
                <button
                  onClick={() => setStep("checklist")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  I-EDIT
                </button>
              </div>
             <div className="divide-y divide-border">
                {isFuneralAssistance ? (
                  <>
                    <ReviewCheckItem ok={checklistDeceasedResident === "yes"} label="Ang namatay ba ay residente ng QC?" />
                    <ReviewCheckItem ok={Boolean(checklistRelation)} label={`Relasyon sa yumao: ${checklistRelation || "—"}`} />
                    <ReviewCheckItem
                      ok={Boolean(checklistFuneralHome)}
                      label={`Funeral home: ${checklistFuneralHome || "—"}`}
                    />
                    <ReviewCheckItem ok={true} label="Type ng Assistance: Funeral and Burial Assistance" />
                  </>
                ) : (
                  <>
                    <ReviewCheckItem ok={checklistResident} label="Ikaw ba ay isang lehitimong residente ng Quezon City?" />
                    <ReviewCheckItem
                      ok={checklistPatient}
                      label="Ikaw ba ay isang QC citizen (o miyembro ng pamilya) na may karamdaman na nangangailangan ng tulong pinansyal para sa ospitalisasyon/gamot?"
                    />
                    <ReviewCheckItem
                      ok={true}
                      label="Nakakuha ka na ba ng tulong medikal mula sa ibang opisina ng Quezon City?"
                    />
                    <ReviewCheckItem ok={hasPriorAidType} label="Uri ng tulong na natanggap:" />
                    <ReviewCheckItem ok={true} label="Type ng Assistance: Medicines / Medical Supplies" />
                  </>
                )}
              </div>
            </div>

            {/* Personal na Impormasyon */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between bg-muted/50 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Personal na Impormasyon</h3>
                <button
                  onClick={() => setStep("personal")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  I-EDIT
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4">
                <ReviewField label="QC ID Number" value={qcId} />
                <ReviewField
                  label="Buong Pangalan"
                  value={[pFirstName, pMiddleName, pLastName, pSuffix].filter(Boolean).join(" ")}
                />
                <ReviewField label="Nasyonalidad" value={pNationality} />
                <ReviewField label="Petsa ng Kapanganakan" value={pBirthDate} />
                <ReviewField label="Edad" value={pAge} />
                <ReviewField label="Kasarian" value={pGender} />
                <ReviewField label="Katayuang Sibil" value={pCivilStatus} />
                <ReviewField
                  label="Kumpletong Address"
                  value={`${[pHouseNumber, pStreetName].filter(Boolean).join(" ")} Brgy. ${pBarangay} Quezon City`}
                />
                <ReviewField label="Numero ng Telepono" value={pPhoneNumber} />
                <ReviewField label="Email" value={pEmail} />
              </div>
            </div>

            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-600/90">
                Sa pag-click ng "Submit", kinukumpirma mo na ang lahat ng impormasyong ibinigay ay tama at
                kumpleto. Ang iyong application ay susuriin ng isang evaluator, at makakatanggap ka ng
                notification sa iyong email tungkol sa status ng iyong application.
              </p>
            </div>
          </div>

          <div className="px-6 pb-6 flex justify-between">
            <button
              onClick={() => setStep("documents")}
              className="inline-flex items-center gap-1.5 px-6 h-10 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors"
            >
              ← BACK
            </button>
            <button
              onClick={() => setStep("verify")}
              className="px-6 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              SUBMIT
            </button>
          </div>
        </div>
      </div>
    )
  }
  if (step === "matching") {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground">Verifying your identity</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Matching your selfie with your uploaded ID. This will only take a moment...
          </p>
        </div>
      </div>
    )
  }

  if (step === "pending") {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Clock className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground">Waiting for admin approval</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Thank you, {name}. Your identity has been verified and your {type.toLowerCase()} request is now
            waiting for approval by a social worker.
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

  if (step === "verify") {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
        <button
          onClick={() => {
            stopCamera()
            setCameraOpen(false)
            setStep("form")
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>

        <PageHeader
          title="Verify your identity"
          desc="For your security, take a live selfie holding the same valid ID you uploaded. We'll match it before sending your application for admin approval."
        />

        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ScanFace className="h-4 w-4 text-primary" />
            ID verification
          </div>

          {previewUrl && (
            <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl p-3">
              <img src={previewUrl} alt={attachment?.name ?? "ID"} className="w-14 h-14 rounded-lg object-cover border border-border shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">ID on file</p>
                <p className="text-xs font-medium text-foreground truncate max-w-56">{attachment?.name}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Selfie holding your valid ID
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Make sure your face and the ID details are both clearly visible.
            </p>

            {cameraOpen && (
              <div className="space-y-3">
                <div className="relative w-full max-w-xs mx-auto aspect-square rounded-xl overflow-hidden border border-border bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={handleCaptureSelfie}
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Capture
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCamera}
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/70 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!cameraOpen && selfieDataUrl && (
              <div className="flex items-start gap-3">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border shrink-0">
                  <img src={selfieDataUrl} alt="Captured selfie" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <p className="text-xs text-foreground">Selfie captured</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRetakeSelfie}
                      className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/70 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveSelfie}
                      className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!cameraOpen && !selfieDataUrl && (
              <button
                type="button"
                onClick={handleOpenCamera}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg h-32 cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground"
              >
                <Camera className="h-6 w-6" />
                <span className="text-xs font-medium">Tap to open camera</span>
              </button>
            )}

            {cameraError && (
              <p className="text-xs text-destructive mt-2">{cameraError}</p>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {verifyError && (
            <p className="text-xs text-destructive">{verifyError}</p>
          )}

          <button
            onClick={handleVerifyAndSubmit}
            disabled={!selfieDataUrl}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Verify & submit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      {onBack && (
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      )}

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

        {verifyError && step === "form" && (
          <p className="text-xs text-destructive">{verifyError}</p>
        )}

        <button
          onClick={handleContinueToVerify}
          disabled={!canSubmit}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Continue to ID verification
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
function ReviewCheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 text-sm text-foreground">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
      )}
      <span>{label}</span>
    </div>
  )
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value || "—"}</p>
    </div>
  )
}
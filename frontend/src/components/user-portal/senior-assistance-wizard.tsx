import { useState, useEffect } from "react"
import {
  Check,
  Upload,
  Camera,
  FileText,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  ChevronRight,
  ChevronUp,
  Pencil,
  Info,
  Home,
  Search,
} from "lucide-react"
import { useLanguage } from "../ui/language-context"
import DocumentCameraModal from "../ui/document-camera-modal"

export interface UserProfile {
  userId?: string
  qcidNo?: string
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  nationality?: string
  dobMonth: string
  dobDay: string
  dobYear: string
  age?: string
  sex?: string
  civilStatus?: string
  addressHouseNo?: string
  addressStreet: string
  addressBarangay: string
  addressCityMunicipality: string
  contactNo?: string
  email?: string
}

import { getCurrentUserProfile } from "../../utils/userProfile"

const MOCK_USER_PROFILE: UserProfile = getCurrentUserProfile() as any

export interface SeniorAssistanceWizardProps {
  onBack?: () => void
  userProfile?: UserProfile
  onStepChange?: (step: number) => void
}

interface RequiredDoc {
  id: string
  label: string
  description: string
  required: boolean
}

const LIVING_ARRANGEMENTS = [
  { id: "Alone", label: "Alone (Mag-isa)", desc: "Nakatira nang mag-isa sa tahanan" },
  { id: "With Family", label: "With Family (Kasama ang Pamilya)", desc: "Kasama ang mga anak, apo, o asawa" },
  { id: "With Caregiver", label: "With Caregiver (Kasama ang Tagapag-alaga)", desc: "May tagapag-alaga na nag-aasikaso" },
]

const EMPLOYMENT_STATUSES = [
  "Retired / Pensyonado",
  "Unemployed (Walang Trabaho)",
  "Self-employed / Maliit na Negosyo",
  "Part-time Worker",
  "Employed (May Trabaho)",
]

const MONTHLY_INCOME_RANGES = [
  "Walang Regular na Kita / No Income",
  "Below ₱5,000",
  "₱5,000 - ₱10,000",
  "₱10,001 - ₱15,000",
  "₱15,001 - ₱25,000",
  "Higit sa ₱25,000",
]

const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
]

function calculateAge(monthStr: string, dayStr: string, yearStr: string): string {
  if (!monthStr || !dayStr || !yearStr) return ""
  let mIdx = MONTHS.indexOf(monthStr.toUpperCase())
  if (mIdx === -1 && !isNaN(parseInt(monthStr, 10))) {
    mIdx = parseInt(monthStr, 10) - 1
  }
  if (mIdx === -1) return ""
  const birthDate = new Date(parseInt(yearStr), mIdx, parseInt(dayStr))
  const today = new Date(2026, 7, 29)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age > 0 ? String(age) : ""
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0.0 KB"
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-border rounded-xl overflow-hidden shadow-xs">
      <div className="flex items-center justify-between bg-gray-50/80 px-4 py-3 border-b border-border">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-blue-600 transition-colors"
        >
          <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "" : "rotate-180"}`} />
          {title}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Pencil className="h-3 w-3" />
          I-EDIT
        </button>
      </div>
      {open && <div className="p-4 bg-white">{children}</div>}
    </div>
  )
}

function ReviewCheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2 text-xs md:text-sm text-foreground">
      <span
        className={`flex items-center justify-center h-4 w-4 rounded-full shrink-0 mt-0.5 ${
          ok ? "bg-emerald-500" : "bg-red-500"
        }`}
      >
        {ok ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /> : <X className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
      </span>
      <span>{label}</span>
    </div>
  )
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value || "—"}</p>
    </div>
  )
}

export default function SeniorSocialAssistanceWizard({ onBack, userProfile = MOCK_USER_PROFILE, onStepChange }: SeniorAssistanceWizardProps) {
  const { t } = useLanguage()

  const STEPS = [
    { id: 1, label: t("wizardChecklist").toUpperCase() },
    { id: 2, label: t("wizardPersonal").toUpperCase() },
    { id: 3, label: t("pwdStepDocuments").toUpperCase() },
    { id: 4, label: t("wizardReview").toUpperCase() },
  ]

  const [step, setStep] = useState(1)

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  const [attemptedNext, setAttemptedNext] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3)
  const [referenceNumber, setReferenceNumber] = useState("")
  const [submissionDate, setSubmissionDate] = useState("")
  const [isEditingInfo, setIsEditingInfo] = useState(false)

  // Reload / Navigation warning protection
  useEffect(() => {
    if (step > 1 && !submitted) {
      ;(window as any).__isFormDirty = true
    } else {
      ;(window as any).__isFormDirty = false
    }
    return () => {
      ;(window as any).__isFormDirty = false
    }
  }, [step, submitted])

  // Auto-redirect to pending status screen (Pic 2) after 3 seconds on submitted
  useEffect(() => {
    if (!submitted) return

    setRedirectCountdown(3)
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsBlocked(true)
          setSubmitted(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [submitted])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step > 1 && !submitted) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [step, submitted])

  // Checklist State (Step 1)
  const [isResident, setIsResident] = useState(false)
  const [isSenior, setIsSenior] = useState(false)
  const [hasSeniorId, setHasSeniorId] = useState(false)
  const [isIndigentOrInNeed, setIsIndigentOrInNeed] = useState(false)

  // Form Data (Step 1 & Step 2)
  const [formData, setFormData] = useState({
    seniorIdNumber: "QC-SC-2022-09412",

    // Step 2: Personal (from QCID profile)
    qcidNumber: userProfile?.qcidNo || "110000116932100",
    firstName: userProfile?.firstName || "CLARISA MAE",
    middleName: userProfile?.middleName || "GALIAS",
    lastName: userProfile?.lastName || "DIMAL",
    suffix: userProfile?.suffix || "",
    nationality: userProfile?.nationality || "FILIPINO",
    dobMonth: userProfile?.dobMonth || "10",
    dobDay: userProfile?.dobDay || "29",
    dobYear: userProfile?.dobYear || "1960",
    age: userProfile?.age || "65",
    sex: userProfile?.sex || "Female",
    civilStatus: userProfile?.civilStatus || "Single",
    addressHouseNo: userProfile?.addressHouseNo || "11",
    addressStreet: userProfile?.addressStreet || "OLD CABUYAO SAMPALOK ST",
    barangay: userProfile?.addressBarangay || "Sauyo",
    contactNumber: userProfile?.contactNo || "09000000000",
    emailAddress: userProfile?.email || "dimalmae@gmail.com",

    // Step 2: Household & Need
    livingArrangement: "Alone",
    familyMembersCount: "1",
    monthlyIncome: "Below ₱5,000",
    employmentStatus: "Retired / Pensyonado",
    sourceOfIncome: "",
    purposeOfAssistance: "",
    needDescription: "Kasalukuyang nag-iisa sa pamumuhay at walang regular na trabaho.",

    // Step 4 & 5
    signatureName: "Clarisa Mae G. Dimal",
    agreedToCertification: false,
    districtOffice: "main",
  })

  // Uploaded Files (Step 3)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({})
  const [cameraDoc, setCameraDoc] = useState<RequiredDoc | null>(null)
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; file: File } | null>(null)

  const requiredDocuments: RequiredDoc[] = [
    {
      id: "seniorId",
      label: "SENIOR CITIZEN ID / OSCA ID",
      description: "Malinaw na kopya ng inyong OSCA / QC Senior Citizen ID (harapan at likod).",
      required: true,
    },
    {
      id: "validGovId",
      label: "VALID GOVERNMENT-ISSUED ID",
      description: "Passport, UMID, Driver's License, Postal ID, o Voter's Certificate.",
      required: true,
    },
    {
      id: "proofOfResidency",
      label: "BARANGAY CERTIFICATE OF RESIDENCY O INDIGENCY",
      description: "Katibayan ng paninirahan o indigency mula sa inyong barangay.",
      required: true,
    },
    {
      id: "idPhoto",
      label: "2×2 O RECENT ID PICTURE",
      description: "Kamakailang 2x2 ID picture na may puting background.",
      required: true,
    },
    {
      id: "proofOfIncome",
      label: "PROOF OF INCOME (KUNG MAYROON)",
      description: "Certificate of Indigency, Pension Voucher, o payslip kung may regular na pensyon.",
      required: false,
    },
    {
      id: "medicalPrescription",
      label: "MEDICAL CERTIFICATE / RESETA (KUNG MEDICAL-RELATED)",
      description: "Medical abstract, reseta ng doktor, o hospital bill kung medikal ang hinihiling.",
      required: false,
    },
    {
      id: "otherDocs",
      label: "OTHER SUPPORTING DOCUMENTS (OPTIONAL)",
      description: "Iba pang katibayan o dokumento na sumusuporta sa inyong aplikasyon.",
      required: false,
    },
  ]

  const [isVerifying, setIsVerifying] = useState(false)
  const [isIdVerified, setIsIdVerified] = useState(false)

  const handleVerifyId = () => {
    if (!formData.seniorIdNumber.trim()) return
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      setIsIdVerified(true)
    }, 600)
  }

  const updateField = (field: string, val: string | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: val }
      if (field === "dobMonth" || field === "dobDay" || field === "dobYear") {
        next.age = calculateAge(
          field === "dobMonth" ? (val as string) : next.dobMonth,
          field === "dobDay" ? (val as string) : next.dobDay,
          field === "dobYear" ? (val as string) : next.dobYear
        )
      }
      return next
    })
  }

  const handleFileUpload = (docId: string, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [docId]: file }))
  }

  const removeFile = (docId: string) => {
    setUploadedFiles((prev) => {
      const copy = { ...prev }
      delete copy[docId]
      return copy
    })
  }

  // Step Validations
  const isStep1Valid =
    isResident &&
    isSenior &&
    hasSeniorId &&
    isIndigentOrInNeed &&
    formData.seniorIdNumber.trim() !== "" &&
    isIdVerified

  const isStep2Valid =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.dobMonth !== "" &&
    formData.dobDay !== "" &&
    formData.dobYear !== "" &&
    formData.sex !== "" &&
    formData.civilStatus !== "" &&
    formData.contactNumber.trim() !== "" &&
    formData.addressStreet.trim() !== "" &&
    formData.barangay !== "" &&
    formData.familyMembersCount.trim() !== "" &&
    formData.monthlyIncome !== "" &&
    formData.sourceOfIncome.trim() !== "" &&
    formData.employmentStatus !== "" &&
    formData.livingArrangement !== "" &&
    formData.purposeOfAssistance.trim() !== ""

  const isStep3Valid = requiredDocuments.every((doc) => !doc.required || !!uploadedFiles[doc.id])

  const isStep4Valid = formData.signatureName.trim() !== "" && formData.agreedToCertification

  const canGoNext =
    step === 1
      ? isStep1Valid
      : step === 2
      ? isStep2Valid
      : step === 3
      ? isStep3Valid
      : isStep4Valid

  const goNext = () => {
    setAttemptedNext(true)
    if (step === 1 && !isStep1Valid) return
    if (step === 2 && !isStep2Valid) return
    if (step === 3 && !isStep3Valid) return
    setAttemptedNext(false)
    setStep((prev) => Math.min(prev + 1, 4))
  }

  const goBack = () => {
    setAttemptedNext(false)
    if (step === 1) {
      onBack?.()
      return
    }
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleFinalSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      const qcid = userProfile?.qcidNo || "110000116932100"
      setReferenceNumber(qcid)
      setSubmissionDate(
        new Date().toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      )
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1000)
  }

  if (isBlocked) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            ← Bumalik
          </button>
        )}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Info className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            May Kasalukuyang Application Ka Pa
          </h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Mayroon ka pang nakabinbing aplikasyon para sa Senior Citizen Social Assistance. Maghintay
            ng pagsusuri bago magsumite ng panibagong aplikasyon.
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
        <div className="bg-white border border-border rounded-2xl p-6 md:p-8 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <Check className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" /> Application Submitted Successfully!
            </span>
            <h2 className="text-2xl font-bold text-foreground">
              Mabuhay! Ang inyong aplikasyon ay Natanggap Na
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Ang inyong Senior Citizen Social Assistance application ay matagumpay na naisumite at kasalukuyang sinusuri.
            </p>
          </div>

          {/* Reference Card */}
          <div className="border border-border rounded-xl p-5 max-w-md mx-auto space-y-2.5 text-left bg-gray-50/60">
            <div className="flex justify-between items-center text-xs text-foreground border-b border-border/80 pb-2">
              <span className="font-semibold text-muted-foreground">Application Reference No.:</span>
              <span className="font-mono font-bold text-blue-700 text-sm">{referenceNumber}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-semibold text-foreground">Senior Citizen Social Assistance</span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">OSCA ID No.:</span>
              <span className="font-mono font-semibold text-foreground">{formData.seniorIdNumber}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">Aplikante:</span>
              <span className="font-semibold text-foreground">
                {formData.firstName} {formData.middleName ? `${formData.middleName} ` : ""}{formData.lastName}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">Petsa:</span>
              <span className="text-foreground">{submissionDate}</span>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 max-w-md mx-auto flex items-center justify-center gap-2.5 text-center">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <p>
              Maaari ninyong tingnan ang Notifications para sa mga update sa inyong aplikasyon.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3b82f6]" />
            <span>
              Awtomatikong lilipat sa application status sa loob ng {redirectCountdown} segundo...
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Main Wizard Card with 5-Step Indicator */}
      <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
        {/* Step indicator dots */}
        <div className="flex items-center px-6 pt-6 pb-4">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div
                className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  s.id === step
                    ? "bg-blue-600 text-white"
                    : s.id < step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s.id < step ? <Check className="h-4 w-4" /> : s.id}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-2 ${s.id < step ? "bg-blue-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Tab labels bar */}
        <div className="flex gap-2 border-b border-border bg-gray-50 p-2 overflow-x-auto">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap text-center transition-colors ${
                s.id === step
                  ? "bg-blue-600 text-white shadow-xs"
                  : s.id < step
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Current Step Sub-Header */}
        <div className="px-6 pt-4 pb-2">
          <h2 className="text-lg font-bold text-foreground">{STEPS[step - 1]?.label}</h2>
        </div>

        {/* Step Body */}
        <div className="p-6 md:p-8 min-h-[380px]">
          {/* ──────────────── STEP 1: CHECKLIST ──────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">
                  MGA KINAKAILANGAN AT KWALIPIKASYON (ELIGIBILITY CHECKLIST)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pakisagot ang mga katanungan sa ibaba upang maberipika ang inyong kwalipikasyon para sa Senior Citizen Social Assistance.
                </p>
              </div>

              {attemptedNext && !isStep1Valid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Kailangang kumpirmahin ang lahat ng katanungan at i-verify ang inyong Senior Citizen / OSCA ID number.</span>
                </div>
              )}

              {/* Blue Info Alert Banner */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Tulong Panlipunan ng Quezon City SSDD at OSCA
                  </h4>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Ang programang ito ay naglalayong magkaloob ng ayuda, gamot, assistive devices, at suportang medikal sa mga kapus-palad o nangangailangang senior citizens ng lungsod.
                  </p>
                </div>
              </div>

              {/* Eligibility Checkboxes */}
              <div className="space-y-3 bg-gray-50/60 border border-border rounded-xl p-5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isResident}
                    onChange={(e) => setIsResident(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-600 rounded"
                  />
                  <span className={`text-sm ${attemptedNext && !isResident ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                    Ikaw ba ay isang lehitimong residente ng Quezon City? <span className="text-red-500">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSenior}
                    onChange={(e) => setIsSenior(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-600 rounded"
                  />
                  <span className={`text-sm ${attemptedNext && !isSenior ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                    Ikaw ba ay 60 taong gulang na pataas? <span className="text-red-500">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSeniorId}
                    onChange={(e) => setHasSeniorId(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-600 rounded"
                  />
                  <span className={`text-sm ${attemptedNext && !hasSeniorId ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                    Mayroon ka na bang opisyal na QC Senior Citizen / OSCA ID? <span className="text-red-500">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isIndigentOrInNeed}
                    onChange={(e) => setIsIndigentOrInNeed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-600 rounded"
                  />
                  <span className={`text-sm ${attemptedNext && !isIndigentOrInNeed ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                    Kabilang ka ba sa kapus-palad o indigent na sektor na nangangailangan ng agarang tulong? <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>

              {/* Senior Citizen ID Number input */}
              <div className="bg-slate-50 border border-blue-200 rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                    Senior Citizen / OSCA ID Number <span className="text-red-500">*</span>
                  </label>
                  {isIdVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      <Check className="w-3.5 h-3.5" /> OSCA ID Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={formData.seniorIdNumber}
                    onChange={(e) => {
                      updateField("seniorIdNumber", e.target.value)
                      setIsIdVerified(false)
                    }}
                    placeholder="Hal. QC-SC-2022-09412"
                    className="flex-1 border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyId}
                    disabled={!formData.seniorIdNumber.trim() || isVerifying}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>VERIFY ID</span>
                      </>
                    )}
                  </button>
                </div>
                {attemptedNext && !formData.seniorIdNumber.trim() && (
                  <p className="text-xs text-red-500">Kailangang ilagay ang inyong Senior Citizen / OSCA ID Number.</p>
                )}
                {attemptedNext && formData.seniorIdNumber.trim() !== "" && !isIdVerified && (
                  <p className="text-xs text-red-500">Pakipindot ang VERIFY ID at tiyaking verified ang ID bago magpatuloy.</p>
                )}
                {isIdVerified && (
                  <div className="mt-1 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center gap-2 text-xs text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Matagumpay na na-verify ang OSCA ID record <strong>({formData.seniorIdNumber})</strong>.</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Ilagay ang inyong rehistradong OSCA ID number sa Quezon City.
                </p>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: PERSONAL & HOUSEHOLD INFO ──────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Header with QCID Badge and Edit Button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">{(t("pwdPersonalInfoHeader") || "PERSONAL INFORMATION").toUpperCase()}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("qcidProfileDesc") || "Please review your personal information from your QCID profile. Fill in the additional details below."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>{t("autoFilledQcidBadge") || "Auto-filled from QCID Record"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{isEditingInfo ? (t("lockInformation") || "Lock Information") : (t("editInformation") || "Edit Information")}</span>
                  </button>
                </div>
              </div>

              {/* IMPORTANT REMINDER BOX */}
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-600">{t("importantReminder") || "IMPORTANT REMINDER"}</p>
                  <p className="text-blue-600/90 mt-0.5 text-xs">
                    {t("qcidReminderNote") || "Please make sure the information on your QCID is correct and complete. If any detail is missing or incorrect, contact the QCID Team to update your QCID records before continuing your application. Accurate information is important for fast and smooth processing of your service."}
                  </p>
                </div>
              </div>

              {attemptedNext && !isStep2Valid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Mangyaring punan ang lahat ng kinakailangang fields na may pulang asterisko (*).</span>
                </div>
              )}

              {/* Applicant QCID Profile Information Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("qcIdLabel") || "QC ID"} *</label>
                    <input
                      type="text"
                      value={formData.qcidNumber}
                      onChange={(e) => updateField("qcidNumber", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 font-mono transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("firstNameLabel") || "First name"} *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("middleNameLabel") || "Middle name"}</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => updateField("middleName", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("lastNameLabel") || "Last name"} *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("suffixLabel") || "Suffix (Jr., Sr., III, etc.)"}</label>
                    <input
                      type="text"
                      value={formData.suffix}
                      onChange={(e) => updateField("suffix", e.target.value)}
                      placeholder={t("suffixLabel") || "Suffix (Jr., Sr., etc.)"}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("nationalityLabel") || "Nationality"} *</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => updateField("nationality", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("birthDateLabel") || "Date of birth"} *</label>
                    <input
                      type="text"
                      value={`${formData.dobMonth}/${formData.dobDay}/${formData.dobYear}`}
                      onChange={(e) => {
                        const parts = e.target.value.split("/")
                        if (parts.length === 3) {
                          updateField("dobMonth", parts[0])
                          updateField("dobDay", parts[1])
                          updateField("dobYear", parts[2])
                        }
                      }}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("ageLabel") || "Age"} *</label>
                    <input
                      type="text"
                      value={formData.age}
                      onChange={(e) => updateField("age", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("genderLabel") || "Gender"} *</label>
                    <input
                      type="text"
                      value={formData.sex}
                      onChange={(e) => updateField("sex", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("civilStatusLabel") || "Civil status"} *</label>
                    <input
                      type="text"
                      value={formData.civilStatus}
                      onChange={(e) => updateField("civilStatus", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("houseNumberLabel") || "House/Building number"} *</label>
                    <input
                      type="text"
                      value={formData.addressHouseNo}
                      onChange={(e) => updateField("addressHouseNo", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("streetNameLabel") || "Street name"} *</label>
                    <input
                      type="text"
                      value={formData.addressStreet}
                      onChange={(e) => updateField("addressStreet", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("barangayLabel") || "Barangay"} *</label>
                    <input
                      type="text"
                      value={formData.barangay}
                      onChange={(e) => updateField("barangay", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("phoneNumberLabel") || "Phone number"} *</label>
                    <input
                      type="text"
                      value={formData.contactNumber}
                      onChange={(e) => updateField("contactNumber", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 font-mono transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">{t("emailLabel") || "Email"} *</label>
                  <input
                    type="text"
                    value={formData.emailAddress}
                    onChange={(e) => updateField("emailAddress", e.target.value)}
                    readOnly={!isEditingInfo}
                    disabled={!isEditingInfo}
                    className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                      !isEditingInfo
                        ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                        : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                    }`}
                  />
                </div>
              </div>

              {/* Household & Economic Situation */}
              <div className="border-t border-border pt-4 space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Home className="h-4 w-4 text-blue-600" />
                  <span>Kalagayan ng Sambahayan at Kabuhayan</span>
                </h4>

                {/* Living Arrangement */}
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wide block mb-2">
                    Kaayusan sa Tirahan (Living Arrangement) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {LIVING_ARRANGEMENTS.map((opt) => {
                      const isSelected = formData.livingArrangement === opt.id
                      return (
                        <div
                          key={opt.id}
                          onClick={() => updateField("livingArrangement", opt.id)}
                          className={`border rounded-xl p-3.5 cursor-pointer transition-all ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20"
                              : "border-border hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{opt.label}</span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">{opt.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide block mb-1">
                      Bilang ng Kasapi sa Bahay <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.familyMembersCount}
                      onChange={(e) => updateField("familyMembersCount", e.target.value)}
                      placeholder="1"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide block mb-1">
                      Buwanang Kita ng Pamilya <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.monthlyIncome}
                      onChange={(e) => updateField("monthlyIncome", e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {MONTHLY_INCOME_RANGES.map((inc) => (
                        <option key={inc} value={inc}>{inc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide block mb-1">
                      Katayuan sa Trabaho / Pensyon <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.employmentStatus}
                      onChange={(e) => updateField("employmentStatus", e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {EMPLOYMENT_STATUSES.map((emp) => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-bold uppercase tracking-wide block mb-1 ${attemptedNext && !formData.sourceOfIncome.trim() ? "text-red-600 font-semibold" : "text-foreground"}`}>
                    Pinagkukunan ng Kita / Pensyon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sourceOfIncome}
                    onChange={(e) => updateField("sourceOfIncome", e.target.value)}
                    placeholder="Maliit na pensyon at tulong mula sa mga kamag-anak"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      attemptedNext && !formData.sourceOfIncome.trim()
                        ? "border-red-400 focus:ring-red-300 bg-red-50"
                        : "border-border bg-white focus:ring-blue-400"
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold uppercase tracking-wide block mb-1 ${attemptedNext && !formData.purposeOfAssistance.trim() ? "text-red-600 font-semibold" : "text-foreground"}`}>
                    Dahilan at Layunin ng Kahilingan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.purposeOfAssistance}
                    onChange={(e) => updateField("purposeOfAssistance", e.target.value)}
                    placeholder="Pambili ng maintenance medicine para sa hypertension at diabetes, at pambayad sa pang-araw-araw na pangangailangan."
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      attemptedNext && !formData.purposeOfAssistance.trim()
                        ? "border-red-400 focus:ring-red-300 bg-red-50"
                        : "border-border bg-white focus:ring-blue-400"
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: DOCUMENTS / FILE UPLOAD ──────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">{t("fileUploadHeader") || "File upload"}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("fileUploadDesc1") || "Siguraduhing i-upload ang angkop na mga dokumento para sa bawat kategorya at tiyaking tugma ang lahat ng detalye—gaya ng inyong buong pangalan at tirahan—sa impormasyon sa inyong QC ID."}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("fileUploadDesc2") || 'Pindutin ang "Sample Document" na button sa itaas ng bawat pag-upload ng file upang makita ang halimbawa ng file at masigurong tugma ang inyong ia-upload.'}
              </p>

              {attemptedNext && !isStep3Valid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Kailangang i-upload ang lahat ng required na dokumento bago magpatuloy.</span>
                </div>
              )}

              <div className="space-y-6 pt-2">
                {requiredDocuments.map((doc) => {
                  const file = uploadedFiles[doc.id]
                  const inputId = `upload-doc-${doc.id}`
                  const missing = attemptedNext && doc.required && !file

                  return (
                    <div key={doc.id}>
                      <div
                        className={`border rounded-xl p-5 transition-colors ${
                          file
                            ? "border-green-300 bg-green-50"
                            : missing
                            ? "border-red-400 bg-red-50"
                            : "border-border bg-card"
                        }`}
                      >
                        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground uppercase tracking-wide">
                          {doc.label} {doc.required ? <span className="text-red-500">*</span> : <span className="text-muted-foreground font-normal text-[10px] lowercase">(opsyonal)</span>}
                          {file && (
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-500 text-white shrink-0">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </span>
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>

                        <p className="text-xs text-muted-foreground mt-2">
                          Allowed file types: JPG, JPEG, PNG, WEBP (o kumuha gamit ang Camera)
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          <input
                            type="file"
                            id={inputId}
                            accept=".jpg,.jpeg,.png,.webp,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) handleFileUpload(doc.id, f)
                              e.target.value = ""
                            }}
                          />
                          <label
                            htmlFor={inputId}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide cursor-pointer transition-colors shadow-xs"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            UPLOAD PHOTO
                          </label>

                          <button
                            type="button"
                            onClick={() => setCameraDoc(doc)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide cursor-pointer transition-colors shadow-xs"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            KUMUHA NG LARAWAN (CAMERA)
                          </button>
                        </div>

                        {file && (
                          <div className="flex flex-wrap gap-3 pt-4">
                            <div className="relative w-40 border border-border rounded-lg bg-white p-3 flex flex-col items-center text-center shadow-xs">
                              <button
                                type="button"
                                onClick={() => removeFile(doc.id)}
                                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                                aria-label={`Alisin ang ${file.name}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <div className="h-12 w-12 rounded-md overflow-hidden border border-border mb-2 flex items-center justify-center bg-gray-50">
                                <FileThumbnail file={file} className="h-full w-full object-cover" />
                              </div>
                              <p className="text-xs font-medium text-foreground truncate w-full">{file.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                        )}

                        {missing && (
                          <p className="text-xs text-red-500 mt-2">
                            {t("pwdStillNeedsUploadNote") || "Kailangan pang mag-upload ng dokumento para sa kinakailangang item na ito."}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ──────────────── STEP 4: REVIEW & SUBMIT ──────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-foreground">{(t("pwdReviewHeader") || "REVIEW INFORMATION").toUpperCase()}</h3>
                <p className="text-sm text-muted-foreground">{t("pwdReviewDesc") || "Pakisuri nang mabuti ang lahat ng impormasyon at uploaded documents bago isumite ang aplikasyon."}</p>
              </div>

              {/* Section 1: Checklist & Assistance */}
              <ReviewSection title="Mga Kinakailangan at Tulong na Hinihiling" onEdit={() => setStep(1)}>
                <div className="divide-y divide-border">
                  <ReviewCheckItem ok={isResident} label="Lehitimong residente ng Quezon City" />
                  <ReviewCheckItem ok={isSenior} label="60 taong gulang na pataas (Senior Citizen)" />
                  <ReviewCheckItem ok={hasSeniorId} label={`May QC Senior Citizen / OSCA ID: ${formData.seniorIdNumber}`} />
                  <ReviewCheckItem ok={isIndigentOrInNeed} label="Kabilang sa kapus-palad o nangangailangang sektor" />
                </div>
              </ReviewSection>

              {/* Section 2: Personal & Household */}
              <ReviewSection title="Personal na Impormasyon at Kalagayan ng Tahanan" onEdit={() => setStep(2)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <ReviewField
                    label="Buong Pangalan"
                    value={`${formData.firstName} ${formData.middleName} ${formData.lastName} ${formData.suffix}`}
                  />
                  <ReviewField
                    label="Petsa ng Kapanganakan"
                    value={`${formData.dobMonth} ${formData.dobDay}, ${formData.dobYear}`}
                  />
                  <ReviewField label="Edad at Kasarian" value={`${formData.age} taong gulang, ${formData.sex}`} />
                  <ReviewField label="Katayuang Sibil" value={formData.civilStatus} />
                  <ReviewField label="Barangay" value={formData.barangay} />
                  <div className="sm:col-span-2">
                    <ReviewField label="Kumpletong Address" value={`${formData.addressHouseNo ? `${formData.addressHouseNo} ` : ""}${formData.addressStreet}, Brgy. ${formData.barangay}, Quezon City`} />
                  </div>
                  <ReviewField label="Contact Number" value={formData.contactNumber} />
                  <ReviewField label="Living Arrangement" value={formData.livingArrangement} />
                  <ReviewField label="Kasama sa Bahay" value={`${formData.familyMembersCount} miyembro`} />
                  <ReviewField label="Buwanang Kita" value={formData.monthlyIncome} />
                  <ReviewField label="Trabaho / Pensyon" value={formData.employmentStatus} />
                  <div className="sm:col-span-2">
                    <ReviewField label="Pinagkukunan ng Kita" value={formData.sourceOfIncome} />
                  </div>
                  <div className="sm:col-span-2">
                    <ReviewField label="Layunin ng Kahilingan" value={formData.purposeOfAssistance} />
                  </div>
                </div>
              </ReviewSection>

              {/* Section 3: Documents */}
              <ReviewSection title="Mga Dokumentong Na-upload" onEdit={() => setStep(3)}>
                <div className="space-y-4">
                  {requiredDocuments.map((doc) => {
                    const file = uploadedFiles[doc.id]
                    const uploaded = Boolean(file)
                    if (!uploaded && !doc.required) return null

                    return (
                      <div key={doc.id}>
                        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                          {doc.label} {doc.required && <span className="text-red-500">*</span>}
                          {uploaded ? (
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-500 shrink-0">
                              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                            </span>
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                        </p>
                        {uploaded ? (
                          <div className="mt-2 space-y-2">
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: doc.label, file })}
                              className="w-full max-w-md border border-border hover:border-blue-400 rounded-lg overflow-hidden text-left bg-white cursor-pointer transition-colors shadow-xs"
                            >
                              <div className="h-28 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                <FileThumbnail file={file} className="h-full w-full object-cover" />
                              </div>
                              <div className="px-3 py-2 text-center border-t border-border bg-white">
                                <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
                              </div>
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-red-500 mt-1">{t("noFileUploadedYet") || "Walang nai-upload na dokumento"}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ReviewSection>

              {/* Declaration & Signature */}
              <div className="border border-border rounded-xl p-5 bg-gray-50/50 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToCertification}
                    onChange={(e) => updateField("agreedToCertification", e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-xs text-foreground leading-relaxed">
                    Pinatutunayan ko sa ilalim ng kaparusahan ng batas na ang lahat ng impormasyong ibinigay sa aplikasyong ito para sa Tulong Panlipunan ay totoo at tapat sa abot ng aking kaalaman.
                  </span>
                </label>

                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wide block mb-1">
                    Lagda ng Aplikante (Electronic Signature / Buong Pangalan) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.signatureName}
                    onChange={(e) => updateField("signatureName", e.target.value)}
                    placeholder="I-type ang inyong buong pangalan"
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-serif italic text-base text-blue-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="flex items-center justify-between border-t border-border bg-gray-50 px-6 py-4">
          {step === 1 && !onBack ? (
            <div />
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-white border border-border text-foreground hover:bg-gray-100 cursor-pointer transition-colors"
            >
              {t("backButton").toUpperCase()}
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className={`flex items-center gap-1.5 px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                canGoNext
                  ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span>{t("nextButton").toUpperCase()}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAttemptedNext(true)
                if (!isStep4Valid) return
                setShowConfirmModal(true)
              }}
              disabled={!isStep4Valid}
              className={`px-8 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-2 ${
                isStep4Valid
                  ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span>SUBMIT APPLICATION</span>
            </button>
          )}
        </div>
      </div>

      {/* 🔔 CONFIRMATION DIALOG / MODAL BEFORE SUBMIT */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-border"
          >
            {/* Modal Header */}
            <div className="p-6 pb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Review Before Submission</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Please make sure that all information and uploaded documents are correct. You can still go back and make changes before submitting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                aria-label="Isara"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-gray-50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                  setStep(4)
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-white transition-colors cursor-pointer"
              >
                ← GO BACK &amp; EDIT
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                  handleFinalSubmit()
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>YES, SUBMIT APPLICATION</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📸 Document Camera Capture Modal */}
      <DocumentCameraModal
        isOpen={Boolean(cameraDoc)}
        onClose={() => setCameraDoc(null)}
        docTitle={cameraDoc?.label}
        onCapture={(file) => {
          if (cameraDoc) {
            handleFileUpload(cameraDoc.id, file)
          }
        }}
      />

      {/* 👁️ UPLOADED DOCUMENT FULL PREVIEW MODAL */}
      {previewDocModal && (
        <UploadedDocPreviewModal
          title={previewDocModal.title}
          file={previewDocModal.file}
          onClose={() => setPreviewDocModal(null)}
        />
      )}
    </div>
  )
}

function FileThumbnail({ file, className }: { file: File; className?: string }) {
  const [src, setSrc] = useState<string>("")
  const isImg = file.type.startsWith("image/") || /\.(jpe?g|png|webp|jfif|bmp|gif)$/i.test(file.name)

  useEffect(() => {
    if (!isImg) return
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file, isImg])

  if (isImg && src) {
    return <img src={src} alt={file.name} className={className || "h-full w-full object-cover"} />
  }
  return <FileText className="h-8 w-8 text-muted-foreground" />
}

function UploadedDocPreviewModal({
  title,
  file,
  onClose,
}: {
  title: string
  file: File | null
  onClose: () => void
}) {
  if (!file) return null
  const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|jfif|bmp|gif)$/i.test(file.name)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  useEffect(() => {
    if (!isImage) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file, isImage])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wide truncate pr-2">{title}</h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 max-h-[65vh] overflow-y-auto bg-gray-50 flex items-center justify-center">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt={title} className="max-w-full max-h-[55vh] rounded-lg border border-border object-contain shadow-xs" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <FileText className="h-12 w-12 text-blue-500" />
              <p className="text-sm font-medium">{file.name}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground truncate bg-white">
          {file.name}
        </div>
      </div>
    </div>
  )
}

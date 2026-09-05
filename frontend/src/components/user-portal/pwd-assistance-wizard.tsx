import React, { useState, useEffect, type ReactNode } from "react"
import {
  Check,
  Upload,
  Camera,
  ChevronDown,
  Pencil,
  FileText,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  Info,
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
  gender?: string
  civilStatus?: string
  citizenship?: string
  contactNo?: string
  email?: string
  addressHouseNo?: string
  addressStreet: string
  addressBarangay: string
  addressCityMunicipality: string
  emergencyFirstName?: string
  emergencyLastName?: string
  emergencyContactNo?: string
  emergencyRelationship?: string
  emergencyAddress?: string
}

import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"
import { API_BASE } from "../../config/api"

const MOCK_USER_PROFILE: UserProfile = getCurrentUserProfile() as any


const DISABILITY_TYPES = [
  "Deaf / Hard of Hearing",
  "Intellectual Disability",
  "Learning Disability",
  "Mental Disability",
  "Orthopedic Disability",
  "Physical Disability",
  "Psychosocial Disability",
  "Speech and Language Impairment",
  "Visual Disability",
  "Chronic Illness with Disability",
  "Multiple Disabilities",
  "Developmental / Neurological Disability",
]

const DISABILITY_CAUSES = [
  "Congenital / Inborn",
  "Illness / Disease",
  "Accident / Trauma",
  "Acquired through Aging",
  "Others",
]

const ASSISTANCE_TYPES = [
  "Financial Assistance / Cash Aid",
  "Medical & Medicine Support",
  "Assistive Device / Mobility",
  "Educational Assistance",
  "Emergency Assistance",
]

const MONTHLY_INCOME_RANGES = [
  "Walang Regular na Kita",
  "Below ₱5,000",
  "₱5,000 - ₱10,000",
  "₱10,001 - ₱15,000",
  "₱15,001 - ₱25,000",
  "Above ₱25,000",
]

interface RequiredDocument {
  id: string
  label: string
  description: string
  note?: string
  images?: string[]
  required?: boolean
}

const REQUIRED_DOCUMENTS: RequiredDocument[] = [
  {
    id: "pwdQcId",
    label: "VALID QC ID – PWD SECTOR",
    description: "Malinaw na litrato ng iyong QCitizen ID (PWD Sector) harapan at likod.",
    images: ["/samples/QC ID.png"],
    required: true,
  },
  {
    id: "barangayIndigency",
    label: "BARANGAY CERTIFICATE OF INDIGENCY",
    description: "Kamakailang Certificate of Indigency mula sa Barangay Hall kung saan nakatira.",
    images: ["/samples/BARANGAY CERTIFICATE OF INDIGENCY.png"],
    required: true,
  },
  {
    id: "medicalCertificate",
    label: "MEDICAL CERTIFICATE",
    description: "Medical Certificate / Clinical Abstract mula sa licensed physician o ospital.",
    images: ["/samples/MEDICAL CERTIFICATE.png"],
    required: true,
  },
  {
    id: "idPhoto",
    label: "2×2 PICTURE",
    description: "2×2 ID picture na may puting background, o Whole-body picture na may kasamang kalendaryo kung bedridden ang aplikante.",
    note: "Kung bedridden: Whole-body picture na may katabing kalendaryo na kita ang kasalukuyang petsa.",
    images: ["/samples/1X1 PICTURE.png"],
    required: true,
  },
]

function formatFileSize(bytes: number) {
  if (!bytes) return "0.0 KB"
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

interface FormData {
  // Checklist
  isResident: boolean
  hasDisability: boolean
  isIndigent: boolean
  applyingFor: "myself" | "family"

  // Step 2: Personal Info
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  dobYear: string
  dobMonth: string
  dobDay: string
  age: string
  sex: string
  pwdIdNumber: string
  contactNumber: string
  email: string

  // Address
  houseNo: string
  street: string
  barangay: string
  cityMunicipality: string

  // Disability
  disabilityType: string
  disabilityTypeOther: string
  causeOfDisability: string
  causeOfDisabilityOther: string
  disabilityDescription: string

  // Household
  householdMembersCount: string
  monthlyHouseholdIncome: string
  monthlyHouseholdExpenses: string

  // Assistance
  assistanceType: string
  assistanceTypeOther: string
  reasonForRequest: string

  // Certification & Signature
  isCertified: boolean
  signatureName: string
}

const EMPTY_FORM: FormData = {
  isResident: false,
  hasDisability: false,
  isIndigent: false,
  applyingFor: "myself",

  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  dobYear: "",
  dobMonth: "",
  dobDay: "",
  age: "",
  sex: "Female",
  pwdIdNumber: "",
  contactNumber: "",
  email: "",

  houseNo: "",
  street: "",
  barangay: "",
  cityMunicipality: "QUEZON CITY",

  disabilityType: "",
  disabilityTypeOther: "",
  causeOfDisability: "",
  causeOfDisabilityOther: "",
  disabilityDescription: "",

  householdMembersCount: "",
  monthlyHouseholdIncome: "",
  monthlyHouseholdExpenses: "",

  assistanceType: "",
  assistanceTypeOther: "",
  reasonForRequest: "",

  isCertified: false,
  signatureName: "",
}

// ── UI Helper Components ──
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-border pb-2">
      <h4 className="text-sm font-bold text-foreground tracking-wide">{title}</h4>
    </div>
  )
}

function Field({
  label,
  required,
  span,
  invalid,
  invalidNote,
  hint,
  children,
}: {
  label: string
  required?: boolean
  span?: number
  invalid?: boolean
  invalidNote?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : span === 3 ? "sm:col-span-3" : span === 4 ? "sm:col-span-4" : ""}>
      <label className={`text-xs font-semibold ${invalid ? "text-red-600" : "text-muted-foreground"}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {hint && !invalid && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {invalid && <p className="text-xs text-red-500 mt-1">{invalidNote || "Kailangan punan ang field na ito."}</p>}
    </div>
  )
}

function formatPwdId(val: string): string {
  const digits = val.replace(/^PWD-?/i, "").replace(/^PWD\s*-\s*/i, "").replace(/\D/g, "").slice(0, 16)
  if (!digits) return ""
  if (digits.length <= 6) return digits
  if (digits.length <= 10) return `${digits.slice(0, 6)}-${digits.slice(6)}`
  return `${digits.slice(0, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 16)}`
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  invalid = false,
  numbersOnly = false,
  maxLength,
  prefix,
  isPwdIdMask = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
  invalid?: boolean
  numbersOnly?: boolean
  maxLength?: number
  prefix?: string
  isPwdIdMask?: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value
    if (isPwdIdMask) {
      const formatted = formatPwdId(raw)
      onChange(formatted)
      return
    }
    if (prefix && raw.toUpperCase().startsWith(prefix.toUpperCase())) {
      raw = raw.slice(prefix.length)
    }
    if (numbersOnly) {
      raw = raw.replace(/\D/g, "")
    }
    if (maxLength && raw.length > maxLength) {
      raw = raw.slice(0, maxLength)
    }
    onChange(raw)
  }

  const displayVal = isPwdIdMask
    ? value.replace(/^PWD-?/i, "").replace(/^PWD\s*-\s*/i, "")
    : prefix && value.toUpperCase().startsWith(prefix.toUpperCase())
    ? value.slice(prefix.length)
    : value

  if (prefix) {
    return (
      <div className={`flex items-center w-full rounded-lg border overflow-hidden transition-all focus-within:ring-2 ${
        disabled
          ? "border-border bg-gray-100 cursor-not-allowed opacity-60"
          : invalid
          ? "border-red-400 focus-within:ring-red-300 bg-red-50"
          : "border-border focus-within:ring-blue-400 bg-white"
      }`}>
        <span className="inline-flex items-center justify-center px-3.5 py-2.5 bg-slate-100 border-r border-border text-xs font-bold text-slate-700 select-none tracking-wider shrink-0 font-mono">
          {prefix}
        </span>
        <input
          type={isPwdIdMask || numbersOnly ? "tel" : type}
          inputMode={isPwdIdMask || numbersOnly ? "numeric" : undefined}
          value={displayVal}
          placeholder={placeholder}
          onChange={handleChange}
          disabled={disabled}
          maxLength={isPwdIdMask ? 18 : maxLength}
          className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none font-mono placeholder:font-sans text-foreground"
        />
      </div>
    )
  }

  return (
    <input
      type={numbersOnly ? "tel" : type}
      inputMode={numbersOnly ? "numeric" : undefined}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={handleChange}
      disabled={disabled}
      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
        disabled
          ? "border-border bg-gray-100 text-muted-foreground cursor-not-allowed"
          : invalid
          ? "border-red-400 focus:ring-red-300 bg-red-50"
          : "border-border focus:ring-blue-400"
      }`}
    />
  )
}

function SelectInput({
  value,
  onChange,
  options,
  invalid = false,
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  invalid?: boolean
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 ${
        disabled
          ? "border-border bg-gray-100 text-muted-foreground cursor-not-allowed"
          : invalid
          ? "border-red-400 focus:ring-red-300 bg-red-50"
          : "border-border focus:ring-blue-400"
      }`}
    >
      <option value="">Piliin...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  invalid = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  invalid?: boolean
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
        invalid ? "border-red-400 focus:ring-red-300 bg-red-50" : "border-border focus:ring-blue-400"
      }`}
    />
  )
}

function LockedField({ value, placeholder }: { value?: string; placeholder?: string }) {
  return (
    <div className="w-full border border-border bg-gray-100 rounded-lg px-3 py-2 text-sm text-foreground select-none cursor-not-allowed">
      {value || <span className="text-muted-foreground">{placeholder || "—"}</span>}
    </div>
  )
}

function AccordionSection({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="flex items-center justify-between bg-muted/40 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-bold text-foreground text-left"
        >
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
          <span>{title}</span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          <Pencil className="h-3 w-3" />
          I-EDIT
        </button>
      </div>
      {open && <div className="p-4 border-t border-border">{children}</div>}
    </div>
  )
}

function ReviewField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value || "—"}</p>
    </div>
  )
}

// ── Sample Document Modal ──
function SampleDocModal({
  doc,
  isOpen,
  onClose,
}: {
  doc: RequiredDocument | null
  isOpen: boolean
  onClose: () => void
}) {
  const { t } = useLanguage()
  if (!isOpen || !doc) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            {t("sampleLabel", { name: doc.label })}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-sm text-muted-foreground">{doc.description}</p>
          {doc.note && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 font-medium">
              💡 {doc.note}
            </div>
          )}
          {doc.images && doc.images.length > 0 ? (
            <div className="space-y-3">
              {doc.images.map((imgSrc, idx) => (
                <div key={idx} className="border border-border rounded-xl overflow-hidden bg-gray-50 p-2 flex items-center justify-center">
                  <img
                    src={imgSrc}
                    alt={doc.label}
                    className="max-h-80 w-auto object-contain rounded-lg shadow-xs"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none"
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-muted-foreground text-sm">
              {t("noSampleImageAvailable")}
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-gray-800 text-white rounded-lg hover:bg-gray-900 cursor-pointer"
          >
            {t("close").toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  )
}

interface PWDSocialAssistanceWizardProps {
  userProfile?: UserProfile
  onBack?: () => void
  onStepChange?: (step: number) => void
}

// ── Main Wizard Component ──
export default function PWDSocialAssistanceWizard({
  userProfile = MOCK_USER_PROFILE,
  onBack,
  onStepChange,
}: PWDSocialAssistanceWizardProps) {
  const { t } = useLanguage()

  const STEPS = [
    { id: 1, label: t("wizardChecklist").toUpperCase() },
    { id: 2, label: t("wizardPersonal").toUpperCase() },
    { id: 3, label: t("pwdStepDocuments").toUpperCase() },
    { id: 4, label: t("wizardReview").toUpperCase() },
  ]
  const [step, setStep] = useState(1)
  const [returnToReview, setReturnToReview] = useState(false)

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])
  const [attemptedNext, setAttemptedNext] = useState(false)
  const [selectedSampleDoc, setSelectedSampleDoc] = useState<RequiredDocument | null>(null)
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [cameraDoc, setCameraDoc] = useState<RequiredDocument | null>(null)
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; file: File } | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submissionStage, setSubmissionStage] = useState<"form" | "matching" | "pending">("form")
  const [reference, setReference] = useState("")
  const [isBlocked, setIsBlocked] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3)

  // Reload / Navigation warning protection
  useEffect(() => {
    if (step > 1 && submissionStage === "form") {
      ;(window as any).__isFormDirty = true
    } else {
      ;(window as any).__isFormDirty = false
    }
    return () => {
      ;(window as any).__isFormDirty = false
    }
  }, [step, submissionStage])

  // Auto-redirect to pending status screen (Pic 2) after 3 seconds on pending
  useEffect(() => {
    if (submissionStage !== "pending") return

    setRedirectCountdown(3)
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsBlocked(true)
          setSubmissionStage("form")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [submissionStage])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step > 1 && submissionStage === "form") {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [step, submissionStage])

  const [formData, setFormData] = useState<FormData>(() => {
    let initialDisabilityType = ""
    let initialCauseOfDisability = ""
    let initialDesc = ""

    try {
      const localKeys = ["pwd_senior_applications", "applications", "all_user_applications", "qcid_cards"]
      for (const k of localKeys) {
        const local = JSON.parse(localStorage.getItem(k) || "[]")
        if (Array.isArray(local)) {
          const matched = local.find(
            (a) =>
              a &&
              ((a.category && a.category.toUpperCase().includes("PWD")) ||
                (a.type && typeof a.type === "string" && a.type.toLowerCase().includes("pwd")) ||
                a.disabilityType ||
                a.causeOfDisability)
          )
          if (matched) {
            if (matched.disabilityType && !initialDisabilityType) initialDisabilityType = matched.disabilityType
            if (matched.causeOfDisability && !initialCauseOfDisability) initialCauseOfDisability = matched.causeOfDisability
            if (matched.specificDisability && !initialDesc) initialDesc = matched.specificDisability
          }
        }
      }
    } catch {}

    return {
      ...EMPTY_FORM,
      firstName: userProfile.firstName || "",
      middleName: userProfile.middleName || "",
      lastName: userProfile.lastName || "",
      suffix: userProfile.suffix || "",
      dobYear: userProfile.dobYear || "",
      dobMonth: userProfile.dobMonth || "",
      dobDay: userProfile.dobDay || "",
      age: userProfile.age || "20",
      pwdIdNumber: "",
      disabilityType: initialDisabilityType || "Psychosocial Disability",
      causeOfDisability: initialCauseOfDisability || "Congenital / Inborn",
      disabilityDescription: initialDesc || "",
      contactNumber: userProfile.contactNo || "09123456789",
      email: userProfile.email || "",
      houseNo: userProfile.addressHouseNo || "",
      street: userProfile.addressStreet || "",
      barangay: userProfile.addressBarangay || "",
      cityMunicipality: userProfile.addressCityMunicipality || "QUEZON CITY",
    }
  })

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File[]>>({})
  const [isVerifying, setIsVerifying] = useState(false)
  const [isIdVerified, setIsIdVerified] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const handleVerifyId = async () => {
    setVerifyError(null)
    const typed = (formData.pwdIdNumber || "").trim()
    const cleanTyped = typed.replace(/[^a-z0-9]/gi, "").toLowerCase()
    const cleanTypedDigits = typed.replace(/\D/g, "")

    if (!cleanTyped) {
      setVerifyError("Please enter your PWD ID number before clicking verify.")
      return
    }

    setIsVerifying(true)
    try {
      let allApps: any[] = []
      try {
        const res = await fetch(`${API_BASE}/api/pwd-senior/applications`)
        if (res.ok) {
          const apps = await res.json()
          if (Array.isArray(apps)) allApps = apps
        }
      } catch {}

      try {
        const res2 = await fetch(`${API_BASE}/api/user-applications`)
        if (res2.ok) {
          const apps2 = await res2.json()
          if (Array.isArray(apps2)) {
            const ids = new Set(allApps.map((a) => a.id || a._id))
            for (const a of apps2) {
              if (!ids.has(a.id || a._id)) allApps.push(a)
            }
          }
        }
      } catch {}

      const localKeys = ["pwd_senior_applications", "applications", "all_user_applications", "qcid_cards"]
      for (const k of localKeys) {
        try {
          const local = JSON.parse(localStorage.getItem(k) || "[]")
          if (Array.isArray(local)) {
            const ids = new Set(allApps.map((a) => a.id || a._id))
            for (const la of local) {
              if (la && !ids.has(la.id || la._id)) allApps.push(la)
            }
          }
        } catch {}
      }

      const checkFieldMatch = (val: any): boolean => {
        if (!val || typeof val !== "string") return false
        const cleanVal = val.replace(/[^a-z0-9]/gi, "").toLowerCase()
        const cleanValDigits = val.replace(/\D/g, "")
        if (!cleanVal) return false

        if (cleanTyped === cleanVal || cleanTyped === `pwd${cleanVal}` || `pwd${cleanTyped}` === cleanVal) return true
        if (cleanTypedDigits && cleanValDigits && (cleanTypedDigits === cleanValDigits || cleanTypedDigits.endsWith(cleanValDigits) || cleanValDigits.endsWith(cleanTypedDigits))) {
          if (cleanTypedDigits.length >= 6 && cleanValDigits.length >= 6) return true
        }
        return false
      }

      const matchedApp = allApps.find((a) => {
        if (!a) return false
        const cat = (a.category || a.type || "").trim().toUpperCase()
        const isPwdRecord =
          cat.includes("PWD") ||
          a.category === "PWD" ||
          a.disabilityType ||
          (typeof a.type === "string" && a.type.toLowerCase().includes("pwd"))

        // Also check if any PWD identifier matches
        const matchesAnyId =
          checkFieldMatch(a.assignedIdNumber) ||
          checkFieldMatch(a.referenceNumber) ||
          checkFieldMatch(a.pwdIdNumber) ||
          checkFieldMatch(a.existingPwdIdNumber) ||
          checkFieldMatch(a.qcidNo) ||
          checkFieldMatch(a.qcid) ||
          checkFieldMatch(a.id)

        return Boolean(matchesAnyId && (isPwdRecord || !cat))
      })

      if (matchedApp) {
        setIsIdVerified(true)
        setVerifyError(null)
        const officialId = formatPwdId(matchedApp.assignedIdNumber || matchedApp.referenceNumber || typed)
        updateField("pwdIdNumber", officialId)
        const matchedDisability =
          matchedApp.disabilityType ||
          matchedApp.specificDisability ||
          matchedApp.disability ||
          matchedApp.typeOfDisability ||
          "Visual Disability"
        updateField("disabilityType", matchedDisability)
        const matchedCause =
          matchedApp.causeOfDisability ||
          matchedApp.disabilityCause ||
          matchedApp.familyCauseOfDisability ||
          formData.causeOfDisability ||
          "Congenital / Inborn"
        updateField("causeOfDisability", matchedCause)
        const matchedDesc =
          matchedApp.specificDisability ||
          matchedApp.disabilityDescription ||
          matchedApp.description ||
          formData.disabilityDescription ||
          ""
        if (matchedDesc) updateField("disabilityDescription", matchedDesc)
        if (matchedApp.firstName && !formData.firstName) updateField("firstName", matchedApp.firstName)
        if (matchedApp.lastName && !formData.lastName) updateField("lastName", matchedApp.lastName)
        if (matchedApp.middleName && !formData.middleName) updateField("middleName", matchedApp.middleName)
        if (matchedApp.suffix && !formData.suffix) updateField("suffix", matchedApp.suffix)
        if (matchedApp.contactNo && !formData.contactNumber) updateField("contactNumber", matchedApp.contactNo)
        if (matchedApp.cellphoneNo && !formData.contactNumber) updateField("contactNumber", matchedApp.cellphoneNo)
        if (matchedApp.barangay && !formData.barangay) updateField("barangay", matchedApp.barangay)
        if (matchedApp.street && !formData.street) updateField("street", matchedApp.street)
        if (matchedApp.houseNo && !formData.houseNo) updateField("houseNo", matchedApp.houseNo)
      } else {
        setIsIdVerified(false)
        setVerifyError("No registered PWD ID record found in the system matching this ID number. Unregistered or random numbers cannot proceed.")
      }
    } catch {
      setIsIdVerified(false)
      setVerifyError("An error occurred while verifying the PWD ID. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const updateField = (key: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  // Strict Photo Upload
  const handleFileUpload = (docId: string, files: File[]) => {
    if (!files || files.length === 0) return
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const allowedExtensions = /\.(jpe?g|png|webp|jfif|bmp|heic|heif)$/i

    const validFiles = files.filter(
      (f) => allowedTypes.includes(f.type) || allowedExtensions.test(f.name)
    )
    const rejectedCount = files.length - validFiles.length

    if (rejectedCount > 0) {
      alert(
        `${rejectedCount} file(s) ang hindi tinanggap. Mga litrato o larawan (JPG, JPEG, PNG, WEBP) lamang ang maaaring i-upload. Bawal ang document/PDF file.`
      )
    }

    if (validFiles.length === 0) return
    setUploadedDocs((prev) => ({
      ...prev,
      [docId]: [...(prev[docId] || []), ...validFiles],
    }))
  }

  const handleRemoveFile = (docId: string, fileIndex: number) => {
    setUploadedDocs((prev) => {
      const updated = [...(prev[docId] || [])]
      updated.splice(fileIndex, 1)
      return { ...prev, [docId]: updated }
    })
  }

  // Step 1 Validation (Checklist)
  const step1Valid =
    formData.isResident &&
    formData.hasDisability &&
    formData.pwdIdNumber.trim() !== "" &&
    isIdVerified &&
    formData.disabilityType !== "" &&
    formData.assistanceType !== ""

  // Step 2 Validation (Personal Information / Application Form)
  const step2Valid =
    (formData.firstName || userProfile.firstName || "").trim() !== "" &&
    (formData.lastName || userProfile.lastName || "").trim() !== "" &&
    (formData.barangay || userProfile.addressBarangay || "").trim() !== "" &&
    formData.causeOfDisability !== "" &&
    formData.householdMembersCount.trim() !== "" &&
    formData.monthlyHouseholdIncome !== "" &&
    formData.monthlyHouseholdExpenses.trim() !== "" &&
    formData.reasonForRequest.trim() !== ""

  // Step 3 Validation (Upload Documents)
  const step3Valid = REQUIRED_DOCUMENTS.every(
    (doc) => (uploadedDocs[doc.id]?.length ?? 0) > 0
  )

  // Step 4 Validation (Review & Submit)
  const step4Valid =
    formData.isCertified &&
    formData.signatureName.trim() !== ""

  const canGoNext =
    step === 1
      ? step1Valid
      : step === 2
      ? step2Valid
      : step === 3
      ? step3Valid
      : step === 4
      ? step4Valid
      : true

  const goNext = () => {
    if (!canGoNext) {
      setAttemptedNext(true)
      return
    }

    setAttemptedNext(false)
    if (returnToReview) {
      setStep(4)
      setReturnToReview(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    setStep((s) => Math.min(s + 1, 4))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const goBack = () => {
    setAttemptedNext(false)
    setStep((s) => Math.max(s - 1, 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleFinalSubmit = () => {
    setSubmissionStage("matching")
    const ref = getLoggedInUserQcid() || formData?.pwdIdNumber || `PWD-AST-${Date.now()}`
    setReference(ref)

    const newApp = {
      id: `APP-AST-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      referenceNumber: ref,
      category: "PWD",
      type: "assistance",
      firstName: formData.firstName || userProfile?.firstName || "Ricardo",
      middleName: formData.middleName || userProfile?.middleName || "",
      lastName: formData.lastName || userProfile?.lastName || "Dimal",
      suffix: formData.suffix || "",
      dateOfBirth: `${formData.dobYear || "2000"}-${(formData.dobMonth || "01").padStart(2, "0")}-${(formData.dobDay || "01").padStart(2, "0")}`,
      age: formData.age || "24",
      sex: formData.sex || "Male",
      civilStatus: "Single",
      contactNo: formData.contactNumber || userProfile?.contactNo || "09123456789",
      cellphoneNo: formData.contactNumber || userProfile?.contactNo || "09123456789",
      email: formData.email || userProfile?.email || "applicant@example.com",
      address: `${formData.houseNo || ""} ${formData.street || ""} ${formData.barangay || ""}, ${formData.cityMunicipality || "QUEZON CITY"}`.trim(),
      disabilityType: formData.disabilityType || "Visual Disability",
      disabilityClass: "non-apparent",
      causeOfDisability: formData.causeOfDisability || "Acquired",
      assistanceType: formData.assistanceType || "Educational Assistance",
      reasonForRequest: formData.reasonForRequest || "Support",
      monthlyHouseholdIncome: formData.monthlyHouseholdIncome || "",
      monthlyHouseholdExpenses: formData.monthlyHouseholdExpenses || "",
      applyingFor: "myself",
      documents: Object.keys(uploadedDocs).flatMap((docId) =>
        (uploadedDocs[docId] || []).map((file) => ({
          name: docId,
          filename: file.name,
          uploadedAt: new Date().toISOString(),
          status: "verified",
        }))
      ),
      status: "pending",
    }

    try {
      const existing = JSON.parse(localStorage.getItem("pwd_senior_applications") || "[]")
      localStorage.setItem("pwd_senior_applications", JSON.stringify([newApp, ...existing]))
      fetch(`${API_BASE}/api/pwd-senior/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApp),
      }).catch(() => {})
    } catch {}

    setTimeout(() => {
      setSubmissionStage("pending")
    }, 1200)
  }

  const fullApplicantName = [formData.firstName, formData.middleName, formData.lastName, formData.suffix]
    .filter(Boolean)
    .join(" ")

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
            Mayroon ka pang nakabinbing aplikasyon para sa PWD Social Assistance. Maghintay
            ng pagsusuri bago magsumite ng panibagong aplikasyon.
          </p>
          <button
            onClick={() => {
              setIsBlocked(false)
              setStep(1)
              setSubmissionStage("form")
            }}
            className="mt-2 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          >
            + Magsumite ng Panibagong Aplikasyon
          </button>
        </div>
      </div>
    )
  }

  if (submissionStage === "matching") {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Isinusumite ang inyong aplikasyon</h2>
          <p className="text-sm text-muted-foreground max-w-sm">Ito ay aabutin lamang ng ilang segundo...</p>
        </div>
      </div>
    )
  }

  if (submissionStage === "pending") {
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
              Ang inyong PWD Social Assistance application ay matagumpay na naisumite at kasalukuyang sinusuri.
            </p>
          </div>

          {/* Reference Card */}
          <div className="border border-border rounded-xl p-5 max-w-md mx-auto space-y-2.5 text-left bg-gray-50/60">
            <div className="flex justify-between items-center text-xs text-foreground border-b border-border/80 pb-2">
              <span className="font-semibold text-muted-foreground">Application Reference No.:</span>
              <span className="font-mono font-bold text-blue-700 text-sm">{reference}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-semibold text-foreground">PWD Social Assistance</span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">QC PWD ID No.:</span>
              <span className="font-mono font-semibold text-foreground">{formData.pwdIdNumber}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">Aplikante:</span>
              <span className="font-semibold text-foreground">{fullApplicantName || "Applicant"}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">Petsa:</span>
              <span className="text-foreground">
                {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
              </span>
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

        {/* Tab labels */}
        <div className="flex gap-2 border-b border-border bg-gray-50 p-2 overflow-x-auto">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex-1 px-4 py-3 rounded-lg text-xs font-semibold whitespace-nowrap text-center transition-colors ${
                s.id === step
                  ? "bg-blue-600 text-white"
                  : s.id < step
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        <div className="p-6 min-h-90">
          {/* ──────────────── STEP 1: COMPLETE CHECKLIST ──────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
                  SERVICE AND PRIMARY REQUIREMENTS
                </h3>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isResident}
                    onChange={(e) => updateField("isResident", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${attemptedNext && !formData.isResident ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                    Are you a legitimate resident of Quezon City? <span className="text-red-500">*</span>
                  </span>
                </label>
                {attemptedNext && !formData.isResident && (
                  <p className="text-xs text-red-500 ml-6">Kinakailangang residente ng Quezon City.</p>
                )}

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.hasDisability}
                    onChange={(e) => updateField("hasDisability", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${attemptedNext && !formData.hasDisability ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                    Do you have a registered PWD ID or valid proof of disability? <span className="text-red-500">*</span>
                  </span>
                </label>
                {attemptedNext && !formData.hasDisability && (
                  <p className="text-xs text-red-500 ml-6">Kinakailangang may kapansanan o rehistradong PWD ID.</p>
                )}
              </div>

              {/* Service Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-900">PWD SOCIAL ASSISTANCE — SIMPLIFIED APPLICATION</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Tulong pinansyal, gamot, medical support, at assistive devices para sa mga Persons with Disabilities sa QC.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={`text-xs font-semibold uppercase tracking-wide block ${attemptedNext && (!formData.pwdIdNumber.trim() || !isIdVerified) ? "text-red-600" : "text-foreground"}`}>
                      PWD ID number <span className="text-red-500">*</span>
                    </label>
                    {isIdVerified && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> PWD ID Verified
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <TextInput
                        prefix="PWD-"
                        isPwdIdMask={true}
                        value={formData.pwdIdNumber}
                        onChange={(v) => {
                          updateField("pwdIdNumber", v)
                          setIsIdVerified(false)
                          setVerifyError(null)
                        }}
                        placeholder="137404-2026-847708"
                        invalid={attemptedNext && (!formData.pwdIdNumber.trim() || !isIdVerified)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyId}
                      disabled={!formData.pwdIdNumber.trim() || isVerifying}
                      className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 h-10"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>VERIFY PWD ID</span>
                      )}
                    </button>
                  </div>
                  {verifyError && (
                    <div className="mt-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2 animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{verifyError}</span>
                    </div>
                  )}
                  {attemptedNext && !formData.pwdIdNumber.trim() && !verifyError && (
                    <p className="text-xs text-red-500 mt-1">Please enter your PWD ID Number.</p>
                  )}
                  {attemptedNext && formData.pwdIdNumber.trim() !== "" && !isIdVerified && !verifyError && (
                    <p className="text-xs text-red-500 mt-1">Please click VERIFY PWD ID and ensure the record is verified before proceeding.</p>
                  )}
                  {isIdVerified && (
                    <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in duration-200">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        PWD ID record successfully verified <strong>(PWD-{formData.pwdIdNumber})</strong>.
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide block mb-1">
                    TYPE OF DISABILITY <span className="text-red-500">**</span>
                  </label>
                  {isIdVerified && formData.disabilityType ? (
                    <LockedField value={formData.disabilityType} />
                  ) : (
                    <SelectInput
                      value={formData.disabilityType}
                      onChange={(v) => updateField("disabilityType", v)}
                      options={DISABILITY_TYPES}
                      invalid={attemptedNext && formData.disabilityType === ""}
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide block mb-1">
                    TYPE OF ASSISTANCE REQUESTED <span className="text-red-500">**</span>
                  </label>
                  <SelectInput
                    value={formData.assistanceType}
                    onChange={(e) => updateField("assistanceType", e)}
                    options={ASSISTANCE_TYPES}
                    invalid={attemptedNext && formData.assistanceType === ""}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: PERSONAL INFORMATION ──────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              {/* IMPORTANT REMINDER BOX matching Pic 1 */}
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-600">IMPORTANT REMINDER</p>
                  <p className="text-blue-600/90 mt-0.5 text-xs">
                    Please make sure the information on your QCID is correct and complete. If any detail is missing or incorrect, contact the QCID Team to update your QCID records before continuing your application. Accurate information is important for fast and smooth processing of your service.
                  </p>
                </div>
              </div>

              {/* APPLICANT FIELDS matching Pic 1 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="QC ID *">
                    <LockedField value={userProfile?.qcidNo || "110000572516915"} />
                  </Field>
                  <Field label="First name *">
                    <LockedField value={formData.firstName || userProfile?.firstName || "RENZ"} placeholder="First name" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Middle name">
                    <LockedField value={formData.middleName || userProfile?.middleName || "MAHINAY"} placeholder="Middle name" />
                  </Field>
                  <Field label="Last name *">
                    <LockedField value={formData.lastName || userProfile?.lastName || "MILLARES"} placeholder="Last name" />
                  </Field>
                  <Field label="Suffix (Jr., Sr., III, etc.)">
                    <LockedField value={formData.suffix || userProfile?.suffix || ""} placeholder="Suffix (Jr., Sr., III, etc.)" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Nationality *">
                    <LockedField value={userProfile?.nationality || userProfile?.citizenship || "FILIPINO"} placeholder="Nationality" />
                  </Field>
                  <Field label="Date of birth *">
                    <LockedField
                      value={
                        formData.dobMonth && formData.dobDay && formData.dobYear
                          ? `${formData.dobMonth.padStart(2, "0")}/${formData.dobDay.padStart(2, "0")}/${formData.dobYear}`
                          : userProfile?.dobMonth && userProfile?.dobDay && userProfile?.dobYear
                          ? `${userProfile.dobMonth.padStart(2, "0")}/${userProfile.dobDay.padStart(2, "0")}/${userProfile.dobYear}`
                          : "06/09/2005"
                      }
                    />
                  </Field>
                  <Field label="Age *">
                    <LockedField value={formData.age || userProfile?.age || "21"} placeholder="Age" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Gender *">
                    <LockedField value={formData.sex || userProfile?.sex || userProfile?.gender || "Female"} />
                  </Field>
                  <Field label="Civil status *">
                    <LockedField value={userProfile?.civilStatus || "Single"} />
                  </Field>
                  <Field label="House/Building number *">
                    <LockedField
                      value={formData.houseNo || userProfile?.addressHouseNo || "11"}
                      placeholder="House/Building number"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Street name *">
                    <LockedField
                      value={formData.street || userProfile?.addressStreet || "ACACIA ST."}
                      placeholder="Street name"
                    />
                  </Field>
                  <Field label="Barangay *">
                    <LockedField value={formData.barangay || userProfile?.addressBarangay || "SAUYO"} placeholder="Barangay" />
                  </Field>
                  <Field label="Phone number *">
                    <LockedField value={formData.contactNumber || userProfile?.contactNo || "09155212353"} placeholder="0900 000 0000" />
                  </Field>
                </div>

                <Field label="Email *">
                  <LockedField value={formData.email || userProfile?.email || "rencemillares619@gmail.com"} placeholder="email@example.com" />
                </Field>
              </div>

              {/* DISABILITY INFORMATION */}
              <div className="space-y-4">
                <SectionHeader title="DISABILITY INFORMATION" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Disability Type *">
                    <LockedField value={formData.disabilityType || "Psychosocial Disability"} />
                  </Field>
                  <Field label="Cause of Disability *">
                    <LockedField value={formData.causeOfDisability || "Congenital / Inborn"} />
                  </Field>
                </div>
                <Field label="Brief Description of Disability">
                  {formData.disabilityDescription ? (
                    <LockedField value={formData.disabilityDescription} />
                  ) : (
                    <TextArea
                      value={formData.disabilityDescription}
                      onChange={(v) => updateField("disabilityDescription", v)}
                      placeholder="Maikling paglalarawan sa kondisyon o kapansanan (opsyonal)..."
                      rows={2}
                    />
                  )}
                </Field>
              </div>

              {/* HOUSEHOLD & SOCIO-ECONOMIC INFORMATION */}
              <div className="space-y-4">
                <SectionHeader title="HOUSEHOLD & SOCIO-ECONOMIC INFORMATION" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Number of Household Members" required invalid={attemptedNext && formData.householdMembersCount.trim() === ""}>
                    <TextInput
                      value={formData.householdMembersCount}
                      onChange={(v) => updateField("householdMembersCount", v)}
                      numbersOnly
                      maxLength={2}
                      placeholder="4"
                      invalid={attemptedNext && formData.householdMembersCount.trim() === ""}
                    />
                  </Field>
                  <Field label="Total Monthly Household Income" required invalid={attemptedNext && formData.monthlyHouseholdIncome === ""}>
                    <SelectInput
                      value={formData.monthlyHouseholdIncome}
                      onChange={(v) => updateField("monthlyHouseholdIncome", v)}
                      options={MONTHLY_INCOME_RANGES}
                      invalid={attemptedNext && formData.monthlyHouseholdIncome === ""}
                    />
                  </Field>
                  <Field label="Total Monthly Household Expenses (₱)" required invalid={attemptedNext && formData.monthlyHouseholdExpenses.trim() === ""}>
                    <TextInput
                      value={formData.monthlyHouseholdExpenses}
                      onChange={(v) => updateField("monthlyHouseholdExpenses", v)}
                      numbersOnly
                      placeholder="8000"
                      invalid={attemptedNext && formData.monthlyHouseholdExpenses.trim() === ""}
                    />
                  </Field>
                </div>
              </div>

              {/* ASSISTANCE DETAILS */}
              <div className="space-y-4">
                <SectionHeader title="ASSISTANCE DETAILS" />
                <Field label="Type of Assistance Requested *">
                  <LockedField value={formData.assistanceType || "Emergency Assistance"} />
                </Field>
                <Field label="Reason for Request" required invalid={attemptedNext && formData.reasonForRequest.trim() === ""}>
                  <TextArea
                    value={formData.reasonForRequest}
                    onChange={(v) => updateField("reasonForRequest", v)}
                    placeholder="Ipaliwanag kung bakit kinakailangan ang tulong na ito..."
                    rows={3}
                    invalid={attemptedNext && formData.reasonForRequest.trim() === ""}
                  />
                </Field>
              </div>

              {attemptedNext && !step2Valid && (
                <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Pakikumpleto ang lahat ng kinakailangang impormasyon sa Step 2 bago magpatuloy sa susunod na hakbang.</span>
                </div>
              )}
            </div>
          )}

          {/* ──────────────── STEP 3: SAMPLE DOCUMENTS / UPLOAD PHOTO ──────────────── */}
          {/* ──────────────── STEP 3: FILE UPLOAD / SUBMIT DOCUMENTS ──────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">{t("fileUploadHeader") || "File upload"}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("fileUploadDesc1") || "Siguraduhing i-upload ang angkop na mga dokumento para sa bawat kategorya at tiyaking tugma ang lahat ng detalye—gaya ng inyong buong pangalan at tirahan—sa impormasyon sa inyong QC ID."}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("fileUploadDesc2") || 'Pindutin ang "Sample Document" na button sa itaas ng bawat pag-upload ng file upang makita ang halimbawa ng file at masigurong tugma ang inyong ia-upload.'}
              </p>

              <div className="space-y-6 pt-2">
                {REQUIRED_DOCUMENTS.map((doc) => {
                  const files = uploadedDocs[doc.id] || []
                  const isUploaded = files.length > 0
                  const inputId = `upload-${doc.id}`
                  const missing = attemptedNext && !isUploaded

                  return (
                    <div key={doc.id}>
                      {doc.images && doc.images.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSampleDoc(doc)
                            setShowSampleModal(true)
                          }}
                          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline mb-2 cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {(t("sampleDocument") || "Sample Document").toUpperCase()}
                        </button>
                      )}

                      <div
                        className={`border rounded-xl p-5 transition-colors ${
                          isUploaded
                            ? "border-green-300 bg-green-50"
                            : missing
                            ? "border-red-400 bg-red-50"
                            : "border-border bg-card"
                        }`}
                      >
                        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground uppercase tracking-wide">
                          {doc.label} <span className="text-red-500">*</span>
                          {isUploaded && (
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-500 text-white shrink-0">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </span>
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                        {doc.note && (
                          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mt-1.5 border border-amber-200">
                            {doc.note}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          Allowed file types: JPG, JPEG, PNG, WEBP (o kumuha gamit ang Camera)
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          <input
                            type="file"
                            id={inputId}
                            key={`${inputId}-${files.length}`}
                            multiple
                            accept=".jpg,.jpeg,.png,.webp,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const selected = e.target.files ? Array.from(e.target.files) : []
                              if (selected.length > 0) handleFileUpload(doc.id, selected)
                              e.target.value = ""
                            }}
                          />
                          <label
                            htmlFor={inputId}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold tracking-wide cursor-pointer hover:bg-blue-700 transition-colors shadow-xs"
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

                        {isUploaded && (
                          <div className="flex flex-wrap gap-3 pt-4">
                            {files.map((file, i) => (
                              <div
                                key={`${file.name}-${i}`}
                                className="relative w-40 border border-border rounded-lg bg-white p-3 flex flex-col items-center text-center shadow-xs"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(doc.id, i)}
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
                            ))}
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

              <div className="space-y-3">
                <AccordionSection title="Checklist & Primary Requirements" onEdit={() => { setReturnToReview(true); setStep(1) }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ReviewField label="Residente ng QC" value={formData.isResident ? "Oo" : "Hindi"} />
                    <ReviewField label="May Kapansanan" value={formData.hasDisability ? "Oo" : "Hindi"} />
                    <ReviewField label="PWD ID Number" value={formData.pwdIdNumber} />
                    <ReviewField label="Uri ng Kapansanan" value={formData.disabilityType} />
                    <ReviewField label="Uri ng Tulong" value={formData.assistanceType} />
                  </div>
                </AccordionSection>

                <AccordionSection title="Personal & Address Information" onEdit={() => { setReturnToReview(true); setStep(2) }}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <ReviewField label="Buong Pangalan" value={fullApplicantName} />
                    <ReviewField label="Date of Birth" value={`${formData.dobMonth} ${formData.dobDay}, ${formData.dobYear}`} />
                    <ReviewField label="Edad / Kasarian" value={`${formData.age || "—"} / ${formData.sex}`} />
                    <ReviewField label="Contact Number" value={formData.contactNumber} />
                    <ReviewField label="House No. / Street" value={`${formData.houseNo} ${formData.street}`.trim()} />
                    <ReviewField label="Barangay" value={formData.barangay} />
                    <ReviewField label="Lungsod" value={formData.cityMunicipality} />
                    <ReviewField label="Dahilan ng Kapansanan" value={formData.causeOfDisability} />
                  </div>
                </AccordionSection>

                <AccordionSection title="Household & Assistance Details" onEdit={() => { setReturnToReview(true); setStep(2) }}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <ReviewField label="Bilang ng Miyembro sa Bahay" value={`${formData.householdMembersCount} miyembro`} />
                    <ReviewField label="Buwanang Kita" value={formData.monthlyHouseholdIncome} />
                    <ReviewField label="Buwanang Gastusin" value={formData.monthlyHouseholdExpenses ? `₱${formData.monthlyHouseholdExpenses}` : "—"} />
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <ReviewField label="Dahilan ng Kahilingan" value={formData.reasonForRequest} />
                  </div>
                </AccordionSection>

                <AccordionSection title="Uploaded Documents" onEdit={() => { setReturnToReview(true); setStep(3) }}>
                  <div className="space-y-4">
                    {REQUIRED_DOCUMENTS.map((doc) => {
                      const files = uploadedDocs[doc.id] || []
                      const uploaded = files.length > 0

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
                              {files.map((file, i) => (
                                <button
                                  key={`${file.name}-${i}`}
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
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-red-500 mt-1">{t("noFileUploadedYet") || "Walang nai-upload na dokumento"}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </AccordionSection>
              </div>

              {/* Certification */}
              <div className="border border-blue-200 bg-blue-50/60 rounded-xl p-4 md:p-5 space-y-4">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                  Pahayag at Sertipikasyon (Certification & Declaration)
                </h4>
                <p className="text-xs text-blue-900 leading-relaxed">
                  Ako ay nagpapatunay na ang lahat ng impormasyong aking inilagay sa aplikasyong ito at ang mga kalakip na litrato/dokumento ay totoo, tama, at kumpleto ayon sa aking pinakamahusay na kaalaman.
                </p>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isCertified}
                    onChange={(e) => updateField("isCertified", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <span className="text-xs font-bold text-foreground">
                    Sumasang-ayon ako sa mga kondisyon at pinatutunayan ang kawastuhan ng mga datos. <span className="text-red-500">*</span>
                  </span>
                </label>
                {attemptedNext && !formData.isCertified && (
                  <p className="text-xs text-red-600 font-semibold">Kailangang lagyan ng check ang kahon bago magpatuloy.</p>
                )}
              </div>

              {/* Signature */}
              <div className="border border-border rounded-xl p-4 md:p-5 space-y-3">
                <label className="text-xs font-bold text-foreground uppercase tracking-wide block">
                  Lagda ng Aplikante (Applicant Signature / Full Name) <span className="text-red-500">*</span>
                </label>
                <TextInput
                  value={formData.signatureName}
                  onChange={(v) => updateField("signatureName", v)}
                  placeholder="I-type ang buong pangalan bilang electronic signature"
                  invalid={attemptedNext && formData.signatureName.trim() === ""}
                />
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="flex items-center justify-between border-t border-border bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              step === 1 ? "invisible" : "bg-white border border-border text-foreground hover:bg-gray-100 cursor-pointer"
            }`}
          >
            PREV
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-colors ${
                canGoNext
                  ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              NEXT &gt;
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAttemptedNext(true)
                if (!canGoNext) return
                setShowConfirmModal(true)
              }}
              disabled={!canGoNext}
              className={`px-8 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-2 ${
                canGoNext
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
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <span>YES, SUBMIT APPLICATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Document Modal */}
      <SampleDocModal
        doc={selectedSampleDoc}
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
      />

      {/* 📸 Document Camera Capture Modal */}
      <DocumentCameraModal
        isOpen={Boolean(cameraDoc)}
        onClose={() => setCameraDoc(null)}
        docTitle={cameraDoc?.label}
        onCapture={(file) => {
          if (cameraDoc) {
            handleFileUpload(cameraDoc.id, [file])
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

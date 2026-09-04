import { useState, useEffect } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Upload,
  Camera,
  X,
  Pencil,
  Info,
  Sparkles,
  Loader2,
  ShieldCheck,
  User,
  IdCard,
  Search,
  AlertCircle,
} from "lucide-react"
import DocumentCameraModal from "../ui/document-camera-modal"
import { API_BASE } from "../../config/api"
import { useLanguage } from "../ui/language-context"

interface DocumentItem {
  id: string
  label: string
  required: boolean
  description: string
  sampleImage?: string
}

// Requirements para sa NEW Application
const NEW_DOCUMENTS: DocumentItem[] = [
  {
    id: "birthCertificate",
    label: "Proof of Age / Birth Certificate",
    required: true,
    description: "PSA Birth Certificate o valid document na nagpapatunay ng edad (60+).",
    sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg",
  },
  {
    id: "proofOfResidency",
    label: "Proof of Residency",
    required: true,
    description: "Barangay Certificate of Residency o Utility Bill sa Quezon City.",
    sampleImage: "/samples/PROOF OF RESIDENCE.webp",
  },
  {
    id: "validId",
    label: "Valid Government-issued ID",
    required: true,
    description: "Anumang government ID na may larawan at lagda (Passport, SSS, UMID, Postal ID, atbp.).",
    sampleImage: "/samples/sample_valid_id.png",
  },
  {
    id: "idPhoto",
    label: "Recent 2×2 / ID Picture",
    required: true,
    description: "Kuhang litrato na may puting background (white background), kuha sa loob ng nakalipas na 6 buwan.",
    sampleImage: "/samples/ID PICTURE (2X2).webp",
  },
  {
    id: "qcidDoc",
    label: "QCID (kung mayroon)",
    required: false,
    description: "QC Citizen ID card (opsyonal kung mayroon nang QCID).",
    sampleImage: "/samples/QC ID NG PASYENTE.jpg",
  },
]

// Requirements para sa RENEWAL Application
const RENEWAL_DOCUMENTS: DocumentItem[] = [
  {
    id: "oldSeniorId",
    label: "Lumang / Expired Senior Citizen ID (Old ID)",
    required: true,
    description: "Malinaw na kopya o litrato ng harap at likod ng lumang Senior Citizen / OSCA ID.",
    sampleImage: "/samples/OLD SOLO ID.jpg",
  },
  {
    id: "idPhoto",
    label: "Recent 2×2 / ID Picture",
    required: true,
    description: "Kasalukuyang 2×2 ID Picture na may puting background, kuha sa nakaraang 6 buwan.",
    sampleImage: "/samples/ID PICTURE (2X2).webp",
  },
  {
    id: "proofOfResidency",
    label: "Barangay Certificate of Residency",
    required: true,
    description: "Katibayan ng paninirahan sa Quezon City (lalo na kung nagbago ang tirahan).",
    sampleImage: "/samples/PROOF OF RESIDENCE.webp",
  },
  {
    id: "validId",
    label: "Valid Government ID (Back-up ID)",
    required: true,
    description: "Anumang karagdagang valid ID para sa pagpapatunay ng pagkakakilanlan.",
    sampleImage: "/samples/sample_valid_id.png",
  },
]

// Requirements para sa REPLACEMENT / LOST ID
const LOSS_DOCUMENTS: DocumentItem[] = [
  {
    id: "affidavitOfLoss",
    label: "Notarized Affidavit of Loss",
    required: true,
    description: "Notaryadong Affidavit of Loss na nagsasaad kung paano nawala o nasira ang Senior Citizen ID.",
    sampleImage: "/samples/AFFIDAVIT OF LOSS.webp",
  },
  {
    id: "validId",
    label: "Valid Government-issued ID",
    required: true,
    description: "Valid government ID na may larawan at lagda (Passport, Postal ID, SSS, Driver's License).",
    sampleImage: "/samples/sample_valid_id.png",
  },
  {
    id: "idPhoto",
    label: "Recent 2×2 / ID Picture",
    required: true,
    description: "Kasalukuyang 2×2 ID Picture na may puting background.",
    sampleImage: "/samples/ID PICTURE (2X2).webp",
  },
  {
    id: "proofOfResidency",
    label: "Barangay Certificate of Residency",
    required: true,
    description: "Barangay Certificate na nagpapatunay na residente ka pa rin ng Quezon City.",
    sampleImage: "/samples/PROOF OF RESIDENCE.webp",
  },
]

import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"

function generateReference(qcid?: string) {
  if (qcid && qcid.trim() && qcid !== "110000116932100") return qcid.trim()
  return getLoggedInUserQcid()
}

function calculateAge(month: string, day: string, year: string): string {
  const y = parseInt(year, 10)
  const m = parseInt(month, 10)
  const d = parseInt(day, 10)
  if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) return ""
  const today = new Date()
  let age = today.getFullYear() - y
  const birthDate = new Date(y, m - 1, d)
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age >= 0 ? String(age) : ""
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0.0 KB"
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function CustomCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
}) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-[#3b82f6] cursor-pointer select-none">
      <span
        onClick={() => onChange(!checked)}
        className={`flex items-center justify-center h-4.5 w-4.5 mt-0.5 rounded-[3px] shrink-0 border-2 transition-colors ${
          checked ? "bg-[#3b82f6] border-[#3b82f6]" : "bg-white border-gray-300"
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="leading-snug text-gray-800 text-sm font-medium">{label}</span>
    </label>
  )
}

export interface UserProfile {
  qcidNo?: string
  firstName?: string
  middleName?: string
  lastName?: string
  suffix?: string
  nationality?: string
  dobMonth?: string
  dobDay?: string
  dobYear?: string
  age?: string
  sex?: string
  civilStatus?: string
  addressHouseNo?: string
  addressStreet?: string
  addressBarangay?: string
  addressCity?: string
  contactNo?: string
  email?: string
  bloodType?: string
  emergencyFirstName?: string
  emergencyLastName?: string
  emergencyContactNo?: string
  emergencyRelationship?: string
}

const MOCK_USER_PROFILE: UserProfile = getCurrentUserProfile() as any

interface SeniorCitizenApplicationWizardProps {
  onBack?: () => void
  userProfile?: UserProfile
  initialIdStatus?: "new" | "renewal" | "loss"
}

export default function SeniorCitizenApplicationWizard({
  onBack,
  userProfile = MOCK_USER_PROFILE,
  initialIdStatus = "new",
}: SeniorCitizenApplicationWizardProps) {
  const { t } = useLanguage()
  const appFlow = initialIdStatus || "new"

  const WIZARD_TABS = [
    t("wizardChecklist") || "COMPLETE CHECKLIST",
    t("wizardPersonal") || "PERSONAL INFORMATION",
    t("wizardDocuments") || "SUBMIT DOCUMENTS",
    t("wizardReview") || "REVIEW & SUBMIT",
  ]

  const [step, setStep] = useState(1)
  const [attemptedNext, setAttemptedNext] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [bypassedBlock, setBypassedBlock] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3)

  // Step 1: Checklist state
  const [isResidencyChecked, setIsResidencyChecked] = useState(false)
  const [isAgeChecked, setIsAgeChecked] = useState(false)
  const [isDeclarationChecked, setIsDeclarationChecked] = useState(false)

  // Step 1: Existing ID / Verification state for Renewal & Lost ID
  const [existingIdNumber, setExistingIdNumber] = useState("")
  const [isIdVerified, setIsIdVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [reasonForReplacement, setReasonForReplacement] = useState("")
  const [reasonForRenewal, setReasonForRenewal] = useState("")

  const handleVerifyId = () => {
    if (!existingIdNumber.trim()) return
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      setIsIdVerified(true)
    }, 600)
  }

  const step1Valid =
    isResidencyChecked &&
    isAgeChecked &&
    isDeclarationChecked &&
    (appFlow === "new" ||
      (isIdVerified &&
        existingIdNumber.trim() !== "" &&
        ((appFlow === "renewal" && reasonForRenewal !== "") ||
          (appFlow === "loss" && reasonForReplacement !== ""))))

  // Step 2: Personal Information state
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [formData, setFormData] = useState({
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
    contactNo: (userProfile?.contactNo || "09000000000").replace(/\s+/g, ""),
    houseNo: userProfile?.addressHouseNo || "11",
    street: userProfile?.addressStreet || "OLD CABUYAO SAMPALOK ST",
    barangay: userProfile?.addressBarangay || "Sauyo",
    city: userProfile?.addressCity || "QUEZON CITY",
    email: userProfile?.email || "dimalmae@gmail.com",
    bloodType: userProfile?.bloodType || "O+",
    psaReference: "",
    qcidNumber: userProfile?.qcidNo || "110000116932100",
    // Emergency Contact (for myself) - auto-filled from profile, editable via Edit Information
    emergencyFirstName: userProfile?.emergencyFirstName || "JUAN",
    emergencyLastName: userProfile?.emergencyLastName || "DIMAL",
    emergencyContactNo: userProfile?.emergencyContactNo || "09123456789",
    emergencyRelationship: userProfile?.emergencyRelationship || "Child",
    // Family member application fields
    familyFirstName: "",
    familyMiddleName: "",
    familyLastName: "",
    familySuffix: "",
    familyDobMonth: "",
    familyDobDay: "",
    familyDobYear: "",
    familyAge: "",
    familySex: "",
    familyCivilStatus: "",
    familyContactNo: "",
    familyAddressHouseNo: "",
    familyAddressStreet: "",
    familyAddressBarangay: "",
    familyAddressCity: "QUEZON CITY",
    familyEmergencyFirstName: "",
    familyEmergencyLastName: "",
    familyEmergencyContactNo: "",
    familyEmergencyRelationship: "",
  })

  // Recalculate age on date of birth change (myself)
  useEffect(() => {
    if (formData.dobMonth && formData.dobDay && formData.dobYear.length === 4) {
      const computedAge = calculateAge(formData.dobMonth, formData.dobDay, formData.dobYear)
      setFormData((prev) => ({ ...prev, age: computedAge }))
    }
  }, [formData.dobMonth, formData.dobDay, formData.dobYear])

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const step2Valid =
    appFlow !== "new"
      ? true
      : (formData.emergencyFirstName || "").trim() !== "" &&
        (formData.emergencyLastName || "").trim() !== "" &&
        (formData.emergencyContactNo || "").trim().length >= 11 &&
        (formData.emergencyRelationship || "").trim() !== ""

  // Step 3: Documents state
  const currentRequirements =
    appFlow === "renewal"
      ? RENEWAL_DOCUMENTS
      : appFlow === "loss"
      ? LOSS_DOCUMENTS
      : NEW_DOCUMENTS

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({})
  const [cameraDoc, setCameraDoc] = useState<DocumentItem | null>(null)
  const [selectedSampleDoc, setSelectedSampleDoc] = useState<DocumentItem | null>(null)
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; file: File } | null>(null)

  // Reload / Navigation warning protection
  const isFormDirty =
    !isSubmitted &&
    (step > 1 ||
      isResidencyChecked ||
      isAgeChecked ||
      isDeclarationChecked ||
      existingIdNumber !== "" ||
      Object.keys(uploadedFiles).length > 0)

  useEffect(() => {
    if (isFormDirty) {
      ;(window as any).__isFormDirty = true
    } else {
      ;(window as any).__isFormDirty = false
    }
    return () => {
      ;(window as any).__isFormDirty = false
    }
  }, [isFormDirty])

  // Check if there is an active PENDING application for this user
  useEffect(() => {
    const checkActiveApp = async () => {
      let activeAppStatus: string | null = null

      // Check backend API first
      try {
        const res = await fetch(`${API_BASE}/api/pwd-senior/applications`)
        if (res.ok) {
          const apps = await res.json()
          if (Array.isArray(apps)) {
            const userApp = apps.find(
              (a) =>
                (a.referenceNumber === (userProfile?.qcidNo || "110000116932100") ||
                 a.email === (userProfile?.email || "dimalmae@gmail.com")) &&
                a.category === "Senior Citizen"
            )
            if (userApp) {
              activeAppStatus = userApp.status
            }
          }
        }
      } catch {}

      // Fallback check localStorage if backend unavailable
      if (!activeAppStatus) {
        try {
          const saved = localStorage.getItem("pwd_senior_applications")
          if (saved) {
            const apps = JSON.parse(saved)
            if (Array.isArray(apps)) {
              const userApp = apps.find(
                (a) =>
                  (a.referenceNumber === (userProfile?.qcidNo || "110000116932100") ||
                   a.email === (userProfile?.email || "dimalmae@gmail.com")) &&
                  a.category === "Senior Citizen"
              )
              if (userApp) {
                activeAppStatus = userApp.status
              }
            }
          }
        } catch {}
      }

      // Block ONLY if status is strictly 'pending' AND user is applying for a new ID
      const isNewFlow = appFlow === "new"
      if (!bypassedBlock && activeAppStatus === "pending" && isNewFlow) {
        setIsBlocked(true)
      } else {
        // If rejected, approved, bypassed, or no active application, allow user to apply freely
        setIsBlocked(false)
      }
    }

    checkActiveApp()
    const interval = setInterval(checkActiveApp, 2000)
    return () => clearInterval(interval)
  }, [userProfile?.qcidNo, userProfile?.email, bypassedBlock, appFlow])

  // Auto-redirect to pending status screen after 3 seconds on submitted
  useEffect(() => {
    if (!isSubmitted) return

    setRedirectCountdown(3)
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsBlocked(true)
          setIsSubmitted(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isSubmitted])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isFormDirty])

  const handleFileUpload = (docId: string, files: File[]) => {
    if (!files || files.length === 0) return
    setUploadedFiles((prev) => ({
      ...prev,
      [docId]: [...(prev[docId] || []), ...files],
    }))
  }

  const handleRemoveFile = (docId: string, index: number) => {
    setUploadedFiles((prev) => {
      const nextList = [...(prev[docId] || [])]
      nextList.splice(index, 1)
      return { ...prev, [docId]: nextList }
    })
  }

  // All mandatory documents must have at least 1 file
  const step3Valid = currentRequirements.filter((d) => d.required).every(
    (d) => (uploadedFiles[d.id]?.length ?? 0) > 0
  )

  // Step 4: Review & Certification
  const [certified, setCertified] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [referenceNo, setReferenceNo] = useState("")

  const handleFinalSubmit = () => {
    setIsSubmitting(true)
    const refNum = generateReference(userProfile?.qcidNo)

    try {
      const existing = JSON.parse(localStorage.getItem("pwd_senior_applications") || "[]")
      const newApp = {
        id: `APP-${Date.now()}`,
        submittedAt: new Date().toISOString(),
        referenceNumber: refNum,
        category: "Senior Citizen",
        type: appFlow === "renewal" ? "renewal" : appFlow === "loss" ? "replacement" : "new",
        firstName: formData.firstName || userProfile.firstName,
        middleName: formData.middleName || userProfile.middleName || "",
        lastName: formData.lastName || userProfile.lastName,
        suffix: formData.suffix || "",
        dateOfBirth: `${formData.dobYear || "1955"}-${(formData.dobMonth || "01").padStart(2, "0")}-${(formData.dobDay || "01").padStart(2, "0")}`,
        age: formData.age || "60",
        sex: formData.sex || "Female",
        civilStatus: formData.civilStatus || "Married",
        cellphoneNo: formData.contactNo || userProfile?.contactNo || "09175552233",
        email: formData.email || userProfile?.email || "senior@quezoncity.gov.ph",
        address: `${formData.houseNo || ""} ${formData.street || ""} ${formData.barangay || ""}, QUEZON CITY`.trim(),
        vaccinatedCovid: "Yes",
        applyingFor: "myself",
        documents: Object.keys(uploadedFiles).map((k) => ({
          name: k,
          filename: uploadedFiles[k]?.[0]?.name || "doc.pdf",
          uploadedAt: new Date().toISOString(),
          status: "verified",
        })),
        status: "pending",
      }
      localStorage.setItem("pwd_senior_applications", JSON.stringify([newApp, ...existing]))

      // Send to real backend API so it syncs across all windows, devices, and Incognito mode
      fetch(`${API_BASE}/api/pwd-senior/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApp),
      }).catch((err) => console.warn("Backend sync failed, saved locally:", err))
    } catch (e) {
      console.error("Failed saving senior application to localStorage:", e)
    }

    setTimeout(() => {
      setReferenceNo(refNum)
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1200)
  }

  const fullName = [
    formData.firstName,
    formData.middleName,
    formData.lastName,
    formData.suffix,
  ]
    .filter(Boolean)
    .join(" ")

  const fullAddress = `${[formData.houseNo, formData.street].filter(Boolean).join(" ")}, Brgy. ${formData.barangay}, ${formData.city}`

  const flowBadgeTitle =
    appFlow === "new"
      ? "New Application"
      : appFlow === "renewal"
      ? "Renewal Application"
      : "Replacement / Lost ID"

  if (isBlocked && appFlow === "new" && !bypassedBlock) {
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
            Mayroon ka pang nakabinbing aplikasyon para sa Senior Citizen ID. Maghintay
            ng pagsusuri bago magsumite ng panibagong aplikasyon.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
            <button
              type="button"
              onClick={() => {
                setBypassedBlock(true)
                setIsBlocked(false)
                setStep(1)
                setIsSubmitted(false)
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              Magsumite ng Bagong Aplikasyon / Buksan ang Form
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SUBMISSION SUCCESS SCREEN ──
  if (isSubmitted) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto animate-in fade-in duration-300">
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white p-8 text-center shadow-xs space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <Check className="w-8 h-8" strokeWidth={3} />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" /> Application Submitted Successfully!
            </span>
            <h2 className="text-2xl font-bold text-gray-900">
              Mabuhay! Ang inyong aplikasyon ay Natanggap Na.
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Ang inyong Senior Citizen ID application ay matagumpay na naisumite at kasalukuyang sinusuri.
            </p>
          </div>

          {/* Reference Card */}
          <div className="border border-gray-200 rounded-xl p-5 max-w-md mx-auto space-y-2.5 text-left bg-gray-50/70">
            <div className="flex justify-between items-center text-xs text-gray-900 border-b border-gray-200 pb-2">
              <span className="font-semibold text-gray-500">Application Reference No.:</span>
              <span className="font-mono font-bold text-[#3b82f6] text-sm">{referenceNo}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-900">
              <span className="text-gray-500">Service:</span>
              <span className="font-semibold text-gray-900">Senior Citizen ID</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-900">
              <span className="text-gray-500">Application Type:</span>
              <span className="font-semibold text-gray-900 uppercase">{flowBadgeTitle}</span>
            </div>
            {appFlow !== "new" && existingIdNumber && (
              <>
                <div className="flex justify-between items-center text-xs text-gray-900">
                  <span className="text-gray-500">
                    {appFlow === "renewal" ? "Expired / Old Senior ID:" : "Lost Senior ID / QCID:"}
                  </span>
                  <span className="font-mono font-semibold text-gray-900">{existingIdNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-900">
                  <span className="text-gray-500">
                    {appFlow === "renewal" ? "Reason for Renewal:" : "Reason for Replacement:"}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {appFlow === "renewal" ? reasonForRenewal : reasonForReplacement}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center text-xs text-gray-900">
              <span className="text-gray-500">Aplikante:</span>
              <span className="font-semibold text-gray-900 uppercase">{fullName}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-900">
              <span className="text-gray-500">Petsa:</span>
              <span className="text-gray-900">
                {new Date().toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 max-w-md mx-auto flex items-center justify-center gap-2.5 text-center">
            <Info className="w-4 h-4 text-[#3b82f6] shrink-0" />
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
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* ── MAIN AICS-STYLE WHITE BOX ── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white relative shadow-xs">
        {/* ── STEPPER CONNECTED NUMBERED CIRCLES ── */}
        <div className="flex items-center px-6 pt-6 pb-4">
          {WIZARD_TABS.map((_, i) => {
            const stepNum = i + 1
            const isCompleted = step > stepNum
            const isCurrent = step === stepNum

            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-[#3b82f6] text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
                </div>
                {i < WIZARD_TABS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-2 transition-colors ${
                      step > stepNum ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* ── STEPPER TABS BAR ── */}
        <div className="flex gap-2 px-6 pb-4">
          {WIZARD_TABS.map((label, i) => {
            const stepNum = i + 1
            const isCurrent = step === stepNum
            const isCompleted = step > stepNum

            return (
              <div
                key={label}
                className={`flex-1 text-center text-xs font-bold py-3 rounded-lg tracking-wide uppercase transition-colors select-none ${
                  isCurrent
                    ? "bg-[#3b82f6] text-white shadow-xs"
                    : isCompleted
                    ? "bg-blue-50 text-[#3b82f6]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {label}
              </div>
            )
          })}
        </div>

        {/* ── STEP BODY CONTAINER ── */}
        <div className="p-6 sm:p-8 space-y-7 border-t border-gray-100">
          {/* ──────────────── STEP 1: COMPLETE CHECKLIST ──────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-wide uppercase">
                  {appFlow === "new"
                    ? (t("seniorChecklistTitle") || "SERVICE AND PRIMARY REQUIREMENTS")
                    : appFlow === "renewal"
                    ? (t("seniorRenewalChecklistTitle") || "RENEWAL OF SENIOR CITIZEN ID — PRIMARY REQUIREMENTS")
                    : (t("seniorLossChecklistTitle") || "REPLACEMENT / LOST SENIOR CITIZEN ID — PRIMARY REQUIREMENTS")}
                </h2>
              </div>

              <div className="space-y-3.5 pt-1">
                <CustomCheckbox
                  checked={isResidencyChecked}
                  onChange={setIsResidencyChecked}
                  label={`${t("seniorResidentCheck") || "Are you a legitimate resident of Quezon City?"} *`}
                />

                <CustomCheckbox
                  checked={isAgeChecked}
                  onChange={setIsAgeChecked}
                  label={`${t("seniorAgeCheck") || "Are you 60 years of age or older?"} *`}
                />

                <CustomCheckbox
                  checked={isDeclarationChecked}
                  onChange={setIsDeclarationChecked}
                  label={
                    appFlow === "new"
                      ? (t("seniorNoExistingIdCheck") || "Do you have no existing Senior Citizen / OSCA ID? *")
                      : appFlow === "renewal"
                      ? (t("seniorHasExistingRenewalCheck") || "Do you have an existing or expired Senior Citizen / OSCA ID for renewal? *")
                      : (t("seniorLostDamagedCheck") || "Was your Senior Citizen / OSCA ID lost or damaged, and in need of replacement? *")
                  }
                />
              </div>

              {/* ID Verification Field para sa Renewal at Lost ID */}
              {appFlow !== "new" && (
                <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-gray-800 tracking-wide flex items-center gap-1.5">
                        <IdCard className="w-4 h-4 text-[#3b82f6]" />
                        {t("seniorOscaIdNumberLabel") || "Senior Citizen / OSCA ID Number *"}
                      </label>
                      {isIdVerified && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          <Check className="w-3.5 h-3.5" /> {t("seniorRecordFound") || "Senior Citizen Record Found"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                      <input
                        type="text"
                        value={existingIdNumber}
                        onChange={(e) => {
                          setExistingIdNumber(e.target.value.toUpperCase())
                          setIsIdVerified(false)
                        }}
                        placeholder={t("enterExistingIdPlaceholder") || "Enter Existing ID Number"}
                        className="flex-1 h-11 px-3.5 rounded-lg border border-gray-300 bg-white text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyId}
                        disabled={!existingIdNumber.trim() || isVerifying}
                        className="px-5 py-2 rounded-lg bg-[#3b82f6] hover:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{isVerifying ? (t("verifyingBtn") || "Verifying...") : (t("verifyIdBtn") || "VERIFY ID")}</span>
                      </button>
                    </div>
                  </div>

                  {/* Reason for Renewal or Replacement when verified */}
                  {isIdVerified && (
                    <div className="pt-3 border-t border-gray-200 space-y-2.5 animate-in fade-in duration-200">
                      <label className="block text-xs font-bold uppercase text-gray-800 tracking-wide">
                        {appFlow === "renewal" ? (t("reasonForRenewalLabel") || "Reason for Renewal *") : (t("reasonForReplacementLabel") || "Reason for Replacement *")}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-5">
                        {appFlow === "renewal" ? (
                          <>
                            <label className="flex items-center gap-2.5 text-sm text-gray-800 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="reasonForRenewal"
                                value="Expired / Due for Renewal"
                                checked={reasonForRenewal === "Expired / Due for Renewal"}
                                onChange={() => setReasonForRenewal("Expired / Due for Renewal")}
                                className="h-4 w-4 accent-[#3b82f6] cursor-pointer"
                              />
                              <span className="font-medium">{t("expiredDueRenewal") || "Expired / Due for Renewal"}</span>
                            </label>
                            <label className="flex items-center gap-2.5 text-sm text-gray-800 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="reasonForRenewal"
                                value="Updated Information"
                                checked={reasonForRenewal === "Updated Information"}
                                onChange={() => setReasonForRenewal("Updated Information")}
                                className="h-4 w-4 accent-[#3b82f6] cursor-pointer"
                              />
                              <span className="font-medium">{t("updatedInformation") || "Updated Information"}</span>
                            </label>
                          </>
                        ) : (
                          <>
                            <label className="flex items-center gap-2.5 text-sm text-gray-800 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="reasonForReplacement"
                                value="Lost / Nawala"
                                checked={reasonForReplacement === "Lost / Nawala"}
                                onChange={() => setReasonForReplacement("Lost / Nawala")}
                                className="h-4 w-4 accent-[#3b82f6] cursor-pointer"
                              />
                              <span className="font-medium">{t("lostOption") || "Lost / Nawala"}</span>
                            </label>
                            <label className="flex items-center gap-2.5 text-sm text-gray-800 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="reasonForReplacement"
                                value="Damaged / Nasira"
                                checked={reasonForReplacement === "Damaged / Nasira"}
                                onChange={() => setReasonForReplacement("Damaged / Nasira")}
                                className="h-4 w-4 accent-[#3b82f6] cursor-pointer"
                              />
                              <span className="font-medium">{t("damagedOption") || "Damaged / Nasira"}</span>
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Information Box */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 sm:p-5 flex items-start gap-3.5">
                <Info className="w-5 h-5 text-[#3b82f6] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-blue-900 uppercase tracking-wide">
                    {appFlow === "new"
                      ? (t("navNewSeniorId") || "BAGONG APLIKASYON PARA SA SENIOR CITIZEN (SENIOR) ID")
                      : appFlow === "renewal"
                      ? (t("navRenewalSeniorId") || "PAG-RENEW NG SENIOR CITIZEN (SENIOR / OSCA) ID")
                      : (t("navLossSeniorId") || "REPLACEMENT / NAWALANG SENIOR CITIZEN (OSCA) ID")}
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                    {appFlow === "new"
                      ? (t("seniorNewAlert") || "First-time application para sa Senior Citizen ID. Kumpletuhin ang lahat ng kinakailangang impormasyon at dokumento.")
                      : appFlow === "renewal"
                      ? (t("seniorRenewalAlert") || "Para sa mga umiiral na senior citizen na nag-expire o mag-eexpire na ang ID. Ilagay ang inyong lumang ID number at ihanda ang mga kaukulang dokumento para sa renewal.")
                      : (t("seniorLossIdAlert") || "Para sa mga nawalan o nasiraan ng Senior Citizen ID. Kumpletuhin ang Notarized Affidavit of Loss at mga kailangang dokumento para sa pagpapalit ng ID.")}
                  </p>
                </div>
              </div>

              {attemptedNext && !step1Valid && (
                <p className="text-xs text-red-600 font-medium">
                  {appFlow !== "new" && (!isIdVerified || !existingIdNumber.trim())
                    ? (t("seniorRenewalAlert") || "Pakilagay at i-verify ang inyong Senior Citizen ID bago magpatuloy.")
                    : (t("pwdCheckboxRequiredNote") || "Kailangang markahan ang lahat ng mga kwalipikasyon upang makapagpatuloy.")}
                </p>
              )}

              {/* Footer Action */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    if (!step1Valid) {
                      setAttemptedNext(true)
                      return
                    }
                    setAttemptedNext(false)
                    setStep(2)
                  }}
                  disabled={!step1Valid}
                  className={`px-7 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                    step1Valid
                      ? "bg-[#3b82f6] hover:bg-blue-600 text-white cursor-pointer shadow-xs"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span>{t("nextButton") ? t("nextButton").toUpperCase() : "NEXT"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: PERSONAL INFORMATION ──────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 tracking-wide uppercase">
                    {appFlow === "new" ? (t("wizardPersonal") || "Personal Information") : (t("verifiedPersonalInfo") || "Verified Personal Information")}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {appFlow === "new"
                      ? (t("reviewSeniorDesc") || "Please review your personal information from your QCID profile. Fill in the additional details below.")
                      : t("autoFetchedFromVerifiedSeniorId", { id: existingIdNumber || "—" }) || `Information automatically retrieved from verified Senior Citizen ID (${existingIdNumber || "—"}).`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <Check className="w-3.5 h-3.5" /> {t("autoFilledFromQcidRecord") || "Auto-filled from QCID Record"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{isEditingInfo ? "Lock Information" : "Edit Information"}</span>
                  </button>
                </div>
              </div>

              {/* IMPORTANT REMINDER BOX */}
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-600">{t("importantReminder") || "IMPORTANT REMINDER"}</p>
                  <p className="text-blue-600/90 mt-0.5">
                    {t("qcidReminderNote") || "Please make sure the information on your QCID is correct and complete. If any detail is missing or incorrect, contact the QCID Team to update your QCID records before continuing your application. Accurate information is important for fast and smooth processing of your service."}
                  </p>
                </div>
              </div>

              {/* Applicant QCID Profile Information Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("qcIdLabel") || "QC ID"} *</label>
                    <input
                      type="text"
                      value={userProfile?.qcidNo || "110000116932100"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("firstNameLabel") || "First name"} *</label>
                    <input
                      type="text"
                      value={userProfile?.firstName || "CLARISA MAE"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("middleNameLabel") || "Middle name"}</label>
                    <input
                      type="text"
                      value={userProfile?.middleName || "GALIAS"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("lastNameLabel") || "Last name"} *</label>
                    <input
                      type="text"
                      value={userProfile?.lastName || "DIMAL"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("suffixLabel") || "Suffix (Jr., Sr., III, etc.)"}</label>
                    <input
                      type="text"
                      value={userProfile?.suffix || ""}
                      placeholder={t("suffixLabel") || "Suffix (Jr., Sr., etc.)"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("nationalityLabel") || "Nationality"} *</label>
                    <input
                      type="text"
                      value={userProfile?.nationality || "FILIPINO"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("birthDateLabel") || "Date of birth"} *</label>
                    <input
                      type="text"
                      value={
                        userProfile?.dobMonth && userProfile?.dobDay && userProfile?.dobYear
                          ? `${userProfile.dobMonth}/${userProfile.dobDay}/${userProfile.dobYear}`
                          : "10/29/1960"
                      }
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("ageLabel") || "Age"} *</label>
                    <input
                      type="text"
                      value={userProfile?.age || "65"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("genderLabel") || "Gender"} *</label>
                    <input
                      type="text"
                      value={userProfile?.sex || "Female"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("civilStatusLabel") || "Civil status"} *</label>
                    <input
                      type="text"
                      value={userProfile?.civilStatus || "Single"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Blood type *</label>
                    <select
                      value={formData.bloodType}
                      onChange={(e) => handleFieldChange("bloodType", e.target.value)}
                      disabled={appFlow !== "new" && !isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        appFlow !== "new" && !isEditingInfo
                          ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                      }`}
                    >
                      {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bt) => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("houseNumberLabel") || "House/Building number"} *</label>
                    <input
                      type="text"
                      value={userProfile?.addressHouseNo || "11"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("streetNameLabel") || "Street name"} *</label>
                    <input
                      type="text"
                      value={userProfile?.addressStreet || "OLD CABUYAO SAMPALOK ST"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("barangayLabel") || "Barangay"} *</label>
                    <input
                      type="text"
                      value={userProfile?.addressBarangay || "Sauyo"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("phoneNumberLabel") || "Phone number"} *</label>
                    <input
                      type="text"
                      value={userProfile?.contactNo || "09000000000"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("emailLabel") || "Email"} *</label>
                    <input
                      type="text"
                      value={userProfile?.email || "dimalmae@gmail.com"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                </div>

                {/* Existing Senior Citizen ID / OSCA ID for Renewal & Lost ID */}
                {appFlow !== "new" && (
                  <div className="pt-4 border-t border-gray-200 space-y-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Existing Senior Citizen ID / OSCA ID *
                    </label>
                    <input
                      type="text"
                      value={existingIdNumber || "110000116932100"}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed font-mono mt-1"
                    />
                  </div>
                )}

                {/* EMERGENCY CONTACT (Editable directly on New App, toggleable on Renewal/Loss) */}
                {(() => {
                  const isEmergencyEditable = appFlow === "new" || isEditingInfo
                  return (
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#3b82f6]" />
                        {t("emergencyContactTitle") || "EMERGENCY CONTACT"}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${attemptedNext && !formData.emergencyFirstName.trim() ? "text-red-600" : "text-gray-700"}`}>
                            {t("firstNameLabel") || "First Name"} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            readOnly={!isEmergencyEditable}
                            disabled={!isEmergencyEditable}
                            value={formData.emergencyFirstName}
                            onChange={(e) => handleFieldChange("emergencyFirstName", e.target.value.toUpperCase())}
                            placeholder={t("firstNameLabel") || "First Name"}
                            className={`w-full h-11 rounded-lg border px-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                              !isEmergencyEditable
                                ? "bg-gray-100 text-gray-800 cursor-not-allowed border-gray-200"
                                : attemptedNext && !formData.emergencyFirstName.trim()
                                ? "border-red-400 focus:ring-red-300 bg-red-50"
                                : "border-gray-300 bg-white focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${attemptedNext && !formData.emergencyLastName.trim() ? "text-red-600" : "text-gray-700"}`}>
                            {t("lastNameLabel") || "Last Name"} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            readOnly={!isEmergencyEditable}
                            disabled={!isEmergencyEditable}
                            value={formData.emergencyLastName}
                            onChange={(e) => handleFieldChange("emergencyLastName", e.target.value.toUpperCase())}
                            placeholder={t("lastNameLabel") || "Last Name"}
                            className={`w-full h-11 rounded-lg border px-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                              !isEmergencyEditable
                                ? "bg-gray-100 text-gray-800 cursor-not-allowed border-gray-200"
                                : attemptedNext && !formData.emergencyLastName.trim()
                                ? "border-red-400 focus:ring-red-300 bg-red-50"
                                : "border-gray-300 bg-white focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${attemptedNext && formData.emergencyContactNo.trim().length < 11 ? "text-red-600" : "text-gray-700"}`}>
                            {t("phoneNumberLabel") || "Contact Number"} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={11}
                            readOnly={!isEmergencyEditable}
                            disabled={!isEmergencyEditable}
                            value={formData.emergencyContactNo}
                            onChange={(e) => handleFieldChange("emergencyContactNo", e.target.value.replace(/\D/g, ""))}
                            placeholder="09XXXXXXXXX"
                            className={`w-full h-11 rounded-lg border px-3.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 ${
                              !isEmergencyEditable
                                ? "bg-gray-100 text-gray-800 cursor-not-allowed border-gray-200"
                                : attemptedNext && formData.emergencyContactNo.trim().length < 11
                                ? "border-red-400 focus:ring-red-300 bg-red-50"
                                : "border-gray-300 bg-white focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${attemptedNext && !formData.emergencyRelationship.trim() ? "text-red-600" : "text-gray-700"}`}>
                            {t("pwdRelationshipLabel") || "Relationship"} <span className="text-red-500">*</span>
                          </label>
                          <select
                            disabled={!isEmergencyEditable}
                            value={formData.emergencyRelationship}
                            onChange={(e) => handleFieldChange("emergencyRelationship", e.target.value)}
                            className={`w-full h-11 rounded-lg border px-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                              !isEmergencyEditable
                                ? "bg-gray-100 text-gray-800 cursor-not-allowed border-gray-200"
                                : attemptedNext && !formData.emergencyRelationship.trim()
                                ? "border-red-400 focus:ring-red-300 bg-red-50"
                                : "border-gray-300 bg-white focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                            }`}
                          >
                            <option value="">{t("selectRelationshipOption") || "Select Relationship"}</option>
                            <option value="Child">{t("relationChild") || "Child"}</option>
                            <option value="Spouse">{t("relationSpouse") || "Spouse"}</option>
                            <option value="Sibling">{t("relationSibling") || "Sibling"}</option>
                            <option value="Relative">{t("relationRelative") || "Relative"}</option>
                            <option value="Caregiver">{t("relationCaregiver") || "Caregiver / Guardian"}</option>
                            <option value="Friend">{t("relationFriend") || "Friend / Neighbor"}</option>
                            <option value="Others">{t("relationOthers") || "Others"}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {attemptedNext && !step2Valid && (
                <p className="text-xs text-red-600 font-medium">
                  {t("emergencyContactRequirementAlert") || "Punan ang lahat ng kinakailangang field para sa emergency contact bago magpatuloy."}
                </p>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t("backButton") ? t("backButton").toUpperCase() : "BACK"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!step2Valid) {
                      setAttemptedNext(true)
                      return
                    }
                    setAttemptedNext(false)
                    setStep(3)
                  }}
                  disabled={!step2Valid}
                  className={`px-7 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                    step2Valid
                      ? "bg-[#3b82f6] hover:bg-blue-600 text-white cursor-pointer shadow-xs"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span>{t("nextButton") ? t("nextButton").toUpperCase() : "NEXT"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: SUBMIT DOCUMENTS / FILE UPLOAD ──────────────── */}
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
                {currentRequirements.map((doc) => {
                  const files = uploadedFiles[doc.id] || []
                  const isUploaded = files.length > 0
                  const inputId = `upload-${doc.id}`
                  const missing = attemptedNext && doc.required && !isUploaded

                  return (
                    <div key={doc.id}>
                      {doc.sampleImage && (
                        <button
                          type="button"
                          onClick={() => setSelectedSampleDoc(doc)}
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
                          {doc.label} {doc.required && <span className="text-red-500">*</span>}
                          {isUploaded && (
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-500 text-white shrink-0">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </span>
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>

                        <p className="text-xs text-muted-foreground mt-2">
                          Allowed file types: JPG, JPEG, PNG, WEBP, PDF (o kumuha gamit ang Camera)
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          <input
                            type="file"
                            id={inputId}
                            key={`${inputId}-${files.length}`}
                            multiple
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
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
                            {files.map((file, idx) => (
                              <div
                                key={`${file.name}-${idx}`}
                                className="relative w-40 border border-border rounded-lg bg-white p-3 flex flex-col items-center text-center shadow-xs"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(doc.id, idx)}
                                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                                  title="Remove file"
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
                            {t("uploadFilesRequirementAlert") || "Kinakailangang mag-upload ng file para sa bawat required document (*) bago magpatuloy."}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t("backButton") ? t("backButton").toUpperCase() : "BACK"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!step3Valid) {
                      setAttemptedNext(true)
                      return
                    }
                    setAttemptedNext(false)
                    setStep(4)
                  }}
                  disabled={!step3Valid}
                  className={`px-7 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                    step3Valid
                      ? "bg-[#3b82f6] hover:bg-blue-600 text-white cursor-pointer shadow-xs"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span>{t("nextButton") ? t("nextButton").toUpperCase() : "NEXT"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
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

              {/* Card 1: Application Details */}
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/70 space-y-2.5">
                <h3 className="text-xs font-bold uppercase text-gray-700 tracking-wide">
                  {t("applicationDetails") || "Application Details"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">{t("serviceLabel") || "Service"}:</span>{" "}
                    <span className="font-semibold text-gray-900">Senior Citizen ID</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t("applicationTypeLabel") || "Application Type"}:</span>{" "}
                    <span className="font-semibold text-gray-900 uppercase">{flowBadgeTitle}</span>
                  </div>
                  {appFlow !== "new" && existingIdNumber && (
                    <>
                      <div>
                        <span className="text-gray-500">
                          {appFlow === "renewal" ? (t("expiredOldSeniorId") || "Expired / Old Senior ID:") : (t("lostSeniorIdLabel") || "Lost Senior ID / QCID:")}
                        </span>{" "}
                        <span className="font-mono font-semibold text-gray-900">{existingIdNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">
                          {appFlow === "renewal" ? (t("reasonForRenewalLabel") || "Reason for Renewal:") : (t("reasonForReplacementLabel") || "Reason for Replacement:")}
                        </span>{" "}
                        <span className="font-semibold text-gray-900">
                          {appFlow === "renewal" ? reasonForRenewal : reasonForReplacement}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card 2: Personal Information */}
              <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-white">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h3 className="text-xs font-bold uppercase text-gray-800 tracking-wide flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#3b82f6]" />{" "}
                    {t("wizardPersonal") || "Personal Information"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-semibold text-[#3b82f6] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" /> {t("editLabel") || "Edit"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3.5 gap-x-4 text-xs">
                    <div>
                      <p className="text-gray-500">{t("fullNameLabel") || "Full Name"}</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">{fullName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t("birthDateLabel") || "Date of Birth"}</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {formData.dobMonth}/{formData.dobDay}/{formData.dobYear}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t("ageLabel") || "Age"}</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">{formData.age} {t("yearsOld") || "taong gulang"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t("genderLabel") || "Sex/Gender"}</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">{formData.sex}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t("civilStatusLabel") || "Civil Status"}</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">{formData.civilStatus}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Blood Type</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">{formData.bloodType || "O+"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t("phoneNumberLabel") || "Contact Number"}</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5 font-mono">{formData.contactNo}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-gray-500">{t("fullAddressLabel") || "Complete Address"}</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">{fullAddress}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t("barangayLabel") || "Barangay"}</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">{formData.barangay}</p>
                    </div>
                    {formData.email && (
                      <div>
                        <p className="text-gray-500">{t("emailLabel") || "Email"}</p>
                        <p className="font-semibold text-gray-900 text-sm mt-0.5">{formData.email}</p>
                      </div>
                    )}
                    {formData.qcidNumber && (
                      <div>
                        <p className="text-gray-500">{t("qcIdLabel") || "QCID Number"}</p>
                        <p className="font-semibold text-gray-900 text-sm mt-0.5 font-mono">{formData.qcidNumber}</p>
                      </div>
                    )}
                    {formData.psaReference && (
                      <div>
                        <p className="text-gray-500">PSA Reference</p>
                        <p className="font-semibold text-gray-900 text-sm mt-0.5 font-mono">{formData.psaReference}</p>
                      </div>
                    )}
                    {formData.emergencyFirstName && (
                      <div className="sm:col-span-3 border-t border-gray-100 pt-3 mt-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <p className="text-gray-500">{t("emergencyContactName") || "Emergency Contact Name"}</p>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">
                            {formData.emergencyFirstName} {formData.emergencyLastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t("emergencyContactNoLabel") || "Emergency Contact No."}</p>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5 font-mono">
                            {formData.emergencyContactNo}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t("pwdRelationshipLabel") || "Relationship"}</p>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5">
                            {formData.emergencyRelationship}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
              </div>

              {/* Card 3: Documents */}
              <div className="border border-gray-200 rounded-xl p-5 space-y-3 bg-white">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h3 className="text-xs font-bold uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#3b82f6]" /> {t("uploadedDocuments") || "Uploaded Documents"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs font-semibold text-[#3b82f6] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" /> {t("editLabel") || "Edit"}
                  </button>
                </div>

                <div className="space-y-4">
                  {currentRequirements.map((doc) => {
                    const files = uploadedFiles[doc.id] || []
                    const uploaded = files.length > 0
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
                            {files.map((f, i) => (
                              <button
                                key={`${f.name}-${i}`}
                                type="button"
                                onClick={() => setPreviewDocModal({ title: doc.label, file: f })}
                                className="w-full max-w-md border border-border hover:border-blue-400 rounded-lg overflow-hidden text-left bg-white cursor-pointer transition-colors shadow-xs"
                              >
                                <div className="h-28 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                  <FileThumbnail file={f} className="h-full w-full object-cover" />
                                </div>
                                <div className="px-3 py-2 text-center border-t border-border bg-white">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {f.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {formatFileSize(f.size)}
                                  </p>
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
              </div>

              {/* Certification Checkbox */}
              <div className="pt-2">
                <CustomCheckbox
                  checked={certified}
                  onChange={setCertified}
                  label={t("certifyTrueAndCorrect") || "I certify that all information provided is true and correct. *"}
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t("backButton") ? t("backButton").toUpperCase() : "BACK"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!certified}
                  className={`px-7 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                    certified
                      ? "bg-[#3b82f6] hover:bg-blue-600 text-white cursor-pointer shadow-xs"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span>{t("submitApplicationUpper") || "SUBMIT APPLICATION"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SUBMIT CONFIRMATION MODAL ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#3b82f6] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-gray-900">{t("reviewBeforeSubmission") || "Review Before Submission"}</h3>
              <p className="text-sm font-semibold text-gray-900">
                {t("areYouSureSubmit") || "Are you sure you want to submit your application?"}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t("checkAllInfoNotice") || "Please check all information and uploaded documents before submitting. You can still go back and make changes."}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                  setStep(4)
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t("goBackEditBtn") || "← GO BACK & EDIT"}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t("cancelBtnUpper") || "CANCEL"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                  handleFinalSubmit()
                }}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-[#3b82f6] hover:bg-blue-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                {isSubmitting ? (t("submittingUpper") || "Submitting...") : (t("yesSubmitBtn") || "YES, SUBMIT APPLICATION")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMERA MODAL ── */}
      {cameraDoc && (
        <DocumentCameraModal
          isOpen={Boolean(cameraDoc)}
          onClose={() => setCameraDoc(null)}
          docTitle={cameraDoc.label}
          onCapture={(file) => {
            handleFileUpload(cameraDoc.id, [file])
            setCameraDoc(null)
          }}
        />
      )}

      {/* ── SAMPLE DOCUMENT MODAL ── */}
      <SampleDocModal
        doc={selectedSampleDoc}
        isOpen={Boolean(selectedSampleDoc)}
        onClose={() => setSelectedSampleDoc(null)}
      />

      {/* ── UPLOADED DOCUMENT FULL PREVIEW MODAL ── */}
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

function SampleDocModal({
  doc,
  isOpen,
  onClose,
}: {
  doc: DocumentItem | null
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
            {t("sampleLabel", { name: doc.label }) || `SAMPLE: ${doc.label}`}
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
          {doc.sampleImage ? (
            <div className="border border-border rounded-xl overflow-hidden bg-gray-50 p-2 flex items-center justify-center">
              <img
                src={doc.sampleImage}
                alt={doc.label}
                className="max-h-80 w-auto object-contain rounded-lg shadow-xs"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none"
                }}
              />
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-muted-foreground text-sm">
              {t("noSampleImageAvailable") || "Walang sample image na available."}
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-gray-800 text-white rounded-lg hover:bg-gray-900 cursor-pointer"
          >
            {t("close") ? t("close").toUpperCase() : "CLOSE"}
          </button>
        </div>
      </div>
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
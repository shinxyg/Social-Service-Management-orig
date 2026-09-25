import { useState, useEffect, useRef } from "react"
import {
  Check,
  CheckCircle2,
  Upload,
  Camera,
  FileText,
  AlertCircle,
  X,
  Loader2,
  ChevronUp,
  Pencil,
  Info,
  Search,
  RotateCcw,
  User,
  Briefcase,
  Users,
  DollarSign,
  Home,
  Gift,
  Plus,
  Trash2,
} from "lucide-react"
import { useLanguage } from "../ui/language-context"
import DocumentCameraModal from "../ui/document-camera-modal"
import { SubmitPrivacyOverlayModal } from "../ui/submit-privacy-overlay-modal"
import { API_BASE } from "../../config/api"
import { fetchPwdSeniorApplications } from "../../utils/cachedApiFetch"
import { notifyApplicationChange } from "../../utils/realtimeSync"
import { readFileAsDataUrl } from "../../utils/fileUpload"
import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"
import { formatAppDate } from "./my-applications"

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
  addressCityMunicipality?: string
  contactNo?: string
  email?: string
}

export interface SeniorFamilyMember {
  id?: string
  name: string
  relationship: string
  age: string
  occupation: string
  income: string
  otherInfo: string
}

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

function formatSeniorId(val: string): string {
  const trimmed = val.trim().toUpperCase()
  if (trimmed.startsWith("QC-") || trimmed.startsWith("SENIOR-") || trimmed.startsWith("OSCA-")) {
    return trimmed.slice(0, 24)
  }
  const digits = val.replace(/\D/g, "").slice(0, 16)
  if (!digits) return ""
  if (digits.length <= 6) return digits
  if (digits.length <= 10) return `${digits.slice(0, 6)}-${digits.slice(6)}`
  return `${digits.slice(0, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 16)}`
}

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
    <div className="border border-border dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
      <div className="flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/80 px-4 py-3 border-b border-border dark:border-slate-800">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-bold text-foreground dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ChevronUp className={`h-4 w-4 text-muted-foreground dark:text-slate-400 transition-transform ${open ? "" : "rotate-180"}`} />
          {title}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer"
        >
          <Pencil className="h-3 w-3" />
          I-EDIT
        </button>
      </div>
      {open && <div className="p-4 bg-white dark:bg-slate-900/70 text-foreground dark:text-slate-100">{children}</div>}
    </div>
  )
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-foreground dark:text-slate-100 mt-0.5">{value || "—"}</p>
    </div>
  )
}

export default function SeniorSocialAssistanceWizard({ onBack, userProfile: propUserProfile, onStepChange }: SeniorAssistanceWizardProps) {
  const { language, t } = useLanguage()
  const [profile, setProfile] = useState(() => (propUserProfile || getCurrentUserProfile()) as any)

  useEffect(() => {
    const handleProfileUpdate = () => {
      const p = getCurrentUserProfile() as any
      setProfile(p)
      if (p) {
        setFormData((prev) => ({
          ...prev,
          qcidNumber: p.qcidNo || p.qcidNumber || prev.qcidNumber,
          firstName: p.firstName || prev.firstName,
          middleName: p.middleName || prev.middleName,
          lastName: p.lastName || prev.lastName,
          suffix: p.suffix || prev.suffix,
          nationality: p.nationality || prev.nationality || "FILIPINO",
          dobMonth: p.dobMonth || prev.dobMonth,
          dobDay: p.dobDay || prev.dobDay,
          dobYear: p.dobYear || prev.dobYear,
          age: String(p.age || prev.age || ""),
          sex: p.sex || p.gender || prev.sex,
          civilStatus: p.civilStatus || prev.civilStatus,
          addressHouseNo: p.addressHouseNo || p.houseNo || prev.addressHouseNo,
          addressStreet: p.addressStreet || p.street || prev.addressStreet,
          barangay: p.addressBarangay || p.barangay || prev.barangay,
          contactNumber: String(p.contactNo || p.mobileNumber || prev.contactNumber || "").replace(/\s+/g, ""),
          emailAddress: p.email || prev.emailAddress,
          signatureName: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
        }))
      }
    }
    window.addEventListener("user_profile_updated", handleProfileUpdate)
    window.addEventListener("storage", handleProfileUpdate)
    return () => {
      window.removeEventListener("user_profile_updated", handleProfileUpdate)
      window.removeEventListener("storage", handleProfileUpdate)
    }
  }, [])

  const userProfile = propUserProfile || profile || (getCurrentUserProfile() as any)

  const STEPS = [
    { id: 1, label: t("wizardChecklist")?.toUpperCase() || "COMPLETE CHECKLIST" },
    { id: 2, label: t("wizardPersonal")?.toUpperCase() || "PERSONAL & HOUSEHOLD INFORMATION" },
    { id: 3, label: t("pwdStepDocuments")?.toUpperCase() || "UPLOAD DOCUMENTS" },
    { id: 4, label: t("wizardReview")?.toUpperCase() || "REVIEW & SUBMIT" },
  ]

  const [step, setStep] = useState(1)
  const [returnToReview, setReturnToReview] = useState(false)
  const [attemptedNext, setAttemptedNext] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [latestSubmittedApp, setLatestSubmittedApp] = useState<any | null>(null)
  const [referenceNumber, setReferenceNumber] = useState("")
  const bypassedActiveAppRef = useRef(false)
  const dismissedAppRefCurrent = useRef<string | null>(null)

  const [formData, setFormData] = useState(() => {
    const prof: any = propUserProfile || getCurrentUserProfile() || {}
    const fullName = `${prof.firstName || ""} ${prof.lastName || ""}`.trim()
    return {
      seniorIdNumber: "",

      // 1. Personal Information
      qcidNumber: prof.qcidNo || prof.qcidNumber || getLoggedInUserQcid() || "110000116932100",
      firstName: prof.firstName || prof.first_name || "",
      middleName: prof.middleName || prof.middle_name || "",
      lastName: prof.lastName || prof.last_name || "",
      suffix: prof.suffix || "",
      nationality: prof.nationality || "FILIPINO",
      dobMonth: prof.dobMonth || prof.birthMonth || "10",
      dobDay: prof.dobDay || prof.birthDay || "29",
      dobYear: prof.dobYear || prof.birthYear || "1960",
      age: String(prof.age || "65"),
      sex: prof.sex || prof.gender || "Female",
      civilStatus: prof.civilStatus || "Single",
      addressHouseNo: prof.addressHouseNo || prof.houseNo || "",
      addressStreet: prof.addressStreet || prof.street || "",
      barangay: prof.addressBarangay || prof.barangay || "Sauyo",
      cityMunicipality: "Quezon City",
      contactNumber: String(prof.contactNo || prof.mobileNumber || "").replace(/\s+/g, ""),
      emailAddress: prof.email || "",

      // 2. Occupation / Financial Information
      employmentStatus: "",
      currentPreviousOccupation: "",
      sourceOfIncome: "",
      approximateMonthlyIncome: "",
      pensionType: "",
      pensionSSS: false,
      pensionGSIS: false,
      pensionOther: false,
      pensionOtherSpecify: "",
      pensionNone: false,

      // 3. Family Composition
      familyMembers: [] as SeniorFamilyMember[],

      // 4. Monthly Household Expenses
      totalMonthlyExpenses: "",

      // 5. Living Situation / Additional Information
      livingArrangements: [] as string[],
      livingArrangementOther: "",
      financialSources: [] as string[],
      financialSourceOther: "",
      reasonsForAssistance: [] as string[],
      reasonForAssistanceOther: "",

      // 6. Other Assistance / Benefits Received
      otherAssistanceType: "",
      otherAssistanceSpecify: "",
      dswdSocialPension: false,
      sssPensionBenefit: false,
      gsisPensionBenefit: false,
      otherGovtAssistance: false,
      otherGovtAssistanceSpecify: "",
      otherFinancialAssistance: false,
      otherFinancialAssistanceSpecify: "",
      otherAssistanceNone: false,

      signatureName: fullName,
      agreedToCertification: false,
      districtOffice: "main",
    }
  })

  const isFormDirty = !submitted && step > 1

  useEffect(() => {
    ;(window as any).__isFormDirty = isFormDirty
    return () => {
      ;(window as any).__isFormDirty = false
    }
  }, [isFormDirty])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step > 1 && !submitted) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      ;(window as any).__isFormDirty = false
    }
  }, [step, submitted])

  useEffect(() => {
    if (submitted) {
      onStepChange?.(0)
    } else {
      onStepChange?.(step)
    }
  }, [step, submitted, onStepChange])

  useEffect(() => {
    let isMounted = true

    const syncRealtimeApp = async () => {
      if (!isMounted) return
      try {
        let allApps: any[] = []
        let backendFetched = false
        try {
          const data = await fetchPwdSeniorApplications()
          if (Array.isArray(data) && data.length > 0) {
            allApps = data
            backendFetched = true
            try {
              localStorage.setItem("pwd_senior_applications", JSON.stringify(data))
            } catch {}
          }
        } catch {}

        if (!backendFetched) {
          const localKeys = ["pwd_senior_applications", "applications", "all_user_applications", "active_applications"]
          for (const k of localKeys) {
            try {
              const local = JSON.parse(localStorage.getItem(k) || "[]")
              if (Array.isArray(local)) {
                for (const la of local) {
                  if (la && !allApps.some((a) => (a.id && a.id === la.id) || (a.referenceNumber && a.referenceNumber === la.referenceNumber))) {
                    allApps.push(la)
                  }
                }
              }
            } catch {}
          }
        }

        const userEmail = (userProfile?.email || formData.emailAddress || "").toLowerCase().trim()
        const currentQcid = (userProfile?.qcidNo || formData.qcidNumber || "").trim()
        const userFirst = (formData.firstName || userProfile?.firstName || "").toLowerCase().trim()
        const userLast = (formData.lastName || userProfile?.lastName || "").toLowerCase().trim()

        const isUserMatch = (a: any) => {
          if (!a) return false
          const aEmail = String(a.email || "").toLowerCase().trim()
          const aRef = String(a.referenceNumber || a.reference_number || "").trim()
          const aQcid = String(a.qcid || a.qc_id || "").trim()
          const aExisting = String(a.existingIdNumber || a.existing_id_number || a.seniorIdNumber || "").trim()
          const aAssigned = String(a.assignedIdNumber || a.assigned_id_number || "").trim()
          const aFirst = String(a.firstName || a.first_name || "").toLowerCase().trim()
          const aLast = String(a.lastName || a.last_name || "").toLowerCase().trim()

          if (userEmail && aEmail && userEmail === aEmail) return true
          if (currentQcid && (aRef.includes(currentQcid) || aQcid === currentQcid || aAssigned === currentQcid || aExisting === currentQcid)) return true
          if (userFirst && userLast && aFirst === userFirst && aLast === userLast) return true
          return false
        }

        const activeAssistanceApp = allApps.find((a) => {
          if (!a) return false
          const appType = String(a.type || a.service || a.extra_data?.type || "").toLowerCase()
          const appCat = String(a.category || a.extra_data?.category || "").toLowerCase()
          const appAssistance = String(a.assistanceType || a.extra_data?.assistanceType || "").toLowerCase()
          const isSeniorAssistance =
            (appType.includes("assistance") || appCat.includes("assistance") || appAssistance.includes("assistance")) &&
            (appCat.includes("senior") || appType.includes("senior") || String(a.service || "").toLowerCase().includes("senior") || !appCat.includes("pwd"))

          if (!isSeniorAssistance) return false
          const status = String(a.status || "").toLowerCase()
          if (status !== "pending" && status !== "under_review" && status !== "approved" && status !== "completed" && status !== "for_release") return false
          return isUserMatch(a)
        })

        if (bypassedActiveAppRef.current) return

        if (activeAssistanceApp) {
          const activeRef = String(activeAssistanceApp.referenceNumber || activeAssistanceApp.reference_number || "").trim()
          if (dismissedAppRefCurrent.current && (dismissedAppRefCurrent.current === activeRef || dismissedAppRefCurrent.current === "all")) {
            return
          }
          setLatestSubmittedApp(activeAssistanceApp)
          setSubmitted(true)
          setReferenceNumber(activeRef)
        }
      } catch (err) {
        console.warn("Real-time sync error:", err)
      }
    }

    syncRealtimeApp()
    const interval = setInterval(syncRealtimeApp, 8000)

    const handleUpdate = () => syncRealtimeApp()
    window.addEventListener("storage", handleUpdate)
    window.addEventListener("pwd_senior_applications_updated", handleUpdate)
    window.addEventListener("applications_updated", handleUpdate)

    return () => {
      isMounted = false
      clearInterval(interval)
      window.removeEventListener("storage", handleUpdate)
      window.removeEventListener("pwd_senior_applications_updated", handleUpdate)
      window.removeEventListener("applications_updated", handleUpdate)
    }
  }, [userProfile, formData.emailAddress, formData.qcidNumber, formData.firstName, formData.lastName])

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({})
  const [cameraDoc, setCameraDoc] = useState<RequiredDoc | null>(null)
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; file: File } | null>(null)

  // Documentary Requirements / Uploads
  const requiredDocuments: RequiredDoc[] = [
    {
      id: "seniorQcId",
      label: "QCITIZEN ID / SENIOR CITIZEN ID",
      description: "Malinaw na kopya ng inyong QCitizen ID o Senior Citizen / OSCA ID.",
      required: true,
    },
    {
      id: "indigencyCertificate",
      label: "CERTIFICATE OF INDIGENCY",
      description: "Certificate of Indigency mula sa Barangay na may layunin na 'For Social Welfare Assistance'.",
      required: true,
    },
    {
      id: "otherSupportingDocs",
      label: "OTHER SUPPORTING DOCUMENTS",
      description: "Iba pang katibayan o dokumento kung kinakailangan batay sa kalagayan.",
      required: false,
    },
  ]

  const [isVerifying, setIsVerifying] = useState(false)
  const [isIdVerified, setIsIdVerified] = useState(false)
  const [verifiedSeniorName, setVerifiedSeniorName] = useState<string>("")
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null)

  // Relaxed verification: checks DB if available to autofill, otherwise accepts user ID smoothly without error blocking!
  const handleVerifyId = async () => {
    const typed = (formData.seniorIdNumber || "").trim().toUpperCase()
    if (!typed) {
      setVerifyNotice("Please enter your Senior Citizen / OSCA ID Number.")
      return
    }

    setIsVerifying(true)
    setVerifyNotice(null)

    try {
      let allApps: any[] = []
      try {
        const res = await fetch(`${API_BASE}/api/pwd-senior/applications`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) allApps = data
        }
      } catch {}

      const localKeys = ["pwd_senior_applications", "applications", "all_user_applications", "active_applications"]
      for (const k of localKeys) {
        try {
          const local = JSON.parse(localStorage.getItem(k) || "[]")
          if (Array.isArray(local)) {
            for (const la of local) {
              if (la && !allApps.some((a) => (a.id && a.id === la.id) || (a.referenceNumber && a.referenceNumber === la.referenceNumber))) {
                allApps.push(la)
              }
            }
          }
        } catch {}
      }

      const cleanTyped = typed.replace(/[^A-Z0-9]/gi, "").toUpperCase()
      const cleanDigits = typed.replace(/\D/g, "")

      const matchedApp = allApps.find((a) => {
        if (!a) return false
        const cat = String(a.category || a.service || a.serviceCategory || "").toUpperCase()
        const isSenior = cat.includes("SENIOR") || cat === "SENIOR CITIZEN" || String(a.service || "").toLowerCase().includes("senior")
        if (!isSenior) return false

        const aAssignedClean = String(a.assignedIdNumber || a.assigned_id_number || "").replace(/[^A-Z0-9]/gi, "").toUpperCase()
        const aRefClean = String(a.referenceNumber || a.reference_number || "").replace(/[^A-Z0-9]/gi, "").toUpperCase()
        const aExistingClean = String(a.existingIdNumber || a.existing_id_number || a.seniorIdNumber || "").replace(/[^A-Z0-9]/gi, "").toUpperCase()
        const aQcidClean = String(a.qcid || a.qcidNo || a.qc_id || "").replace(/[^A-Z0-9]/gi, "").toUpperCase()

        if (aAssignedClean && aAssignedClean === cleanTyped) return true
        if (aRefClean && aRefClean === cleanTyped) return true
        if (aExistingClean && aExistingClean === cleanTyped) return true
        if (aQcidClean && aQcidClean === cleanTyped) return true

        const aAssignedDigits = aAssignedClean.replace(/\D/g, "")
        const aRefDigits = aRefClean.replace(/\D/g, "")
        const aExistingDigits = aExistingClean.replace(/\D/g, "")

        if (cleanDigits.length >= 5) {
          if (aAssignedDigits && (aAssignedDigits === cleanDigits || aAssignedDigits.includes(cleanDigits))) return true
          if (aRefDigits && (aRefDigits === cleanDigits || aRefDigits.includes(cleanDigits))) return true
          if (aExistingDigits && (aExistingDigits === cleanDigits || aExistingDigits.includes(cleanDigits))) return true
        }

        return false
      })

      setIsIdVerified(true)

      if (matchedApp) {
        const foundName = [
          matchedApp.firstName || matchedApp.first_name,
          matchedApp.middleName || matchedApp.middle_name,
          matchedApp.lastName || matchedApp.last_name,
          matchedApp.suffix,
        ].filter(Boolean).join(" ").trim().toUpperCase()

        setVerifiedSeniorName(foundName || "SENIOR CITIZEN BENEFICIARY")
        setVerifyNotice(`Record verified for: ${foundName || "Senior Citizen"}`)

        const bMonth = matchedApp.dobMonth || ""
        const bDay = matchedApp.dobDay || ""
        const bYear = matchedApp.dobYear || ""
        let compAge = matchedApp.age || ""
        if (bMonth && bDay && bYear && bYear.length === 4) {
          const calc = calculateAge(bMonth, bDay, bYear)
          if (calc) compAge = calc
        }

        setFormData((prev) => ({
          ...prev,
          firstName: matchedApp.firstName || matchedApp.first_name || prev.firstName,
          middleName: matchedApp.middleName || matchedApp.middle_name || prev.middleName,
          lastName: matchedApp.lastName || matchedApp.last_name || prev.lastName,
          suffix: matchedApp.suffix || prev.suffix,
          dobMonth: bMonth || prev.dobMonth,
          dobDay: bDay || prev.dobDay,
          dobYear: bYear || prev.dobYear,
          age: compAge || prev.age,
          sex: matchedApp.sex || matchedApp.gender || prev.sex,
          civilStatus: matchedApp.civilStatus || prev.civilStatus,
          contactNumber: (matchedApp.contactNo || matchedApp.cellphoneNo || matchedApp.contactNumber || prev.contactNumber || "").replace(/\s+/g, ""),
          emailAddress: matchedApp.email || prev.emailAddress,
          addressHouseNo: matchedApp.houseNo || matchedApp.addressHouseNo || prev.addressHouseNo,
          addressStreet: matchedApp.street || matchedApp.addressStreet || prev.addressStreet,
          barangay: matchedApp.barangay || matchedApp.addressBarangay || prev.barangay,
        }))
      } else {
        // ID is accepted directly for senior social welfare assistance!
        const profileName = [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(" ").trim().toUpperCase()
        setVerifiedSeniorName(profileName || "SENIOR CITIZEN APPLICANT")
        setVerifyNotice(`Senior Citizen / OSCA ID (${typed}) accepted. You may now proceed to complete the information.`)
      }
    } catch {
      setIsIdVerified(true)
      setVerifiedSeniorName("SENIOR CITIZEN APPLICANT")
      setVerifyNotice(`Senior Citizen / OSCA ID accepted. You may now proceed.`)
    } finally {
      setIsVerifying(false)
    }
  }

  const updateField = (field: string, val: any) => {
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

  // Family Members handler
  const addFamilyMember = () => {
    const newMember: SeniorFamilyMember = {
      id: `fam-${Date.now()}`,
      name: "",
      relationship: "",
      age: "",
      occupation: "",
      income: "",
      otherInfo: "",
    }
    setFormData((prev) => ({
      ...prev,
      familyMembers: [...prev.familyMembers, newMember],
    }))
  }

  const updateFamilyMember = (index: number, field: keyof SeniorFamilyMember, val: string) => {
    setFormData((prev) => {
      const list = [...prev.familyMembers]
      if (list[index]) {
        list[index] = { ...list[index], [field]: val }
      }
      return { ...prev, familyMembers: list }
    })
  }

  const removeFamilyMember = (index: number) => {
    setFormData((prev) => {
      const list = prev.familyMembers.filter((_, i) => i !== index)
      return { ...prev, familyMembers: list }
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

  // Validations
  const isStep1Valid = formData.seniorIdNumber.trim().length >= 3

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
    formData.barangay !== ""

  const isStep3Valid = requiredDocuments.every((doc) => !doc.required || !!uploadedFiles[doc.id])
  const isStep4Valid = true

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
    if (returnToReview) {
      setStep(4)
      setReturnToReview(false)
      return
    }
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

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    const qcid = userProfile?.qcidNo || formData.qcidNumber || "110000116932100"
    setReferenceNumber(qcid)

    // Format living arrangement string
    const livingArrangementDisplay = [
      ...formData.livingArrangements,
      formData.livingArrangements.includes("Other") && formData.livingArrangementOther
        ? `Other: ${formData.livingArrangementOther}`
        : null,
    ].filter(Boolean).join(", ") || "Living Alone"

    // Format financial support string
    const financialSupportDisplay = [
      ...formData.financialSources,
      formData.financialSources.includes("Other") && formData.financialSourceOther
        ? `Other: ${formData.financialSourceOther}`
        : null,
    ].filter(Boolean).join(", ") || "Pension"

    // Format reasons for assistance string
    const reasonDisplay = [
      ...formData.reasonsForAssistance,
      formData.reasonsForAssistance.includes("Other") && formData.reasonForAssistanceOther
        ? `Other: ${formData.reasonForAssistanceOther}`
        : null,
    ].filter(Boolean).join(", ") || "Medical/Medication Expenses"

    // Format pensions received
    const pensionsList = [
      formData.pensionSSS ? "SSS" : null,
      formData.pensionGSIS ? "GSIS" : null,
      formData.pensionOther ? `Other: ${formData.pensionOtherSpecify || "Yes"}` : null,
      formData.pensionNone ? "None" : null,
    ].filter(Boolean).join(", ") || "None"

    // Format other assistance received
    const otherAssistanceList = [
      formData.dswdSocialPension ? "DSWD Social Pension" : null,
      formData.sssPensionBenefit ? "SSS Pension" : null,
      formData.gsisPensionBenefit ? "GSIS Pension" : null,
      formData.otherGovtAssistance ? `Other Govt: ${formData.otherGovtAssistanceSpecify || "Yes"}` : null,
      formData.otherFinancialAssistance ? `Other Financial: ${formData.otherFinancialAssistanceSpecify || "Yes"}` : null,
      formData.otherAssistanceType === "Other" ? `Other: ${formData.otherAssistanceSpecify || "Yes"}` : null,
      formData.otherAssistanceNone ? "None" : null,
    ].filter(Boolean).join(", ") || "None"

    const newApp = {
      id: `APP-SNR-SWA-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      referenceNumber: qcid,
      qcid: qcid,
      seniorIdNumber: formData.seniorIdNumber,
      oscaId: formData.seniorIdNumber,
      category: "Senior Citizen",
      type: "social-assistance",
      service: "Senior Citizen Social Assistance",
      assistanceType: "Social Welfare Assistance (SWA)",

      // 1. Personal Info
      firstName: formData.firstName || userProfile?.firstName || "CLARISA MAE",
      middleName: formData.middleName || userProfile?.middleName || "GALIAS",
      lastName: formData.lastName || userProfile?.lastName || "DIMAL",
      suffix: formData.suffix || "",
      dateOfBirth: `${formData.dobYear || "1960"}-${(formData.dobMonth || "10").padStart(2, "0")}-${(formData.dobDay || "29").padStart(2, "0")}`,
      age: formData.age || "65",
      sex: formData.sex || "Female",
      civilStatus: formData.civilStatus || "Single",
      contactNo: formData.contactNumber || userProfile?.contactNo || "09000000000",
      cellphoneNo: formData.contactNumber || userProfile?.contactNo || "09000000000",
      email: formData.emailAddress || userProfile?.email || "dimalmae@gmail.com",
      houseNo: formData.addressHouseNo || userProfile?.addressHouseNo || "",
      street: formData.addressStreet || userProfile?.addressStreet || "",
      barangay: formData.barangay || userProfile?.addressBarangay || "Sauyo",
      city: "QUEZON CITY",
      address: `${formData.addressHouseNo ? `${formData.addressHouseNo} ` : ""}${formData.addressStreet}, ${formData.barangay}, QUEZON CITY`.trim(),

      // 2. Occupation / Financial Information
      employmentStatus: formData.employmentStatus,
      currentPreviousOccupation: formData.currentPreviousOccupation,
      sourceOfIncome: formData.sourceOfIncome,
      monthlyIncome: formData.approximateMonthlyIncome,
      pensionsReceived: pensionsList,

      // 3. Family Composition
      familyMembers: formData.familyMembers || [],
      family_members: formData.familyMembers || [],
      familyMembersCount: String((formData.familyMembers || []).length),
      householdMembersCount: String((formData.familyMembers || []).length),

      // 4. Monthly Household Expenses
      totalMonthlyExpenses: formData.totalMonthlyExpenses,
      monthlyHouseholdExpenses: formData.totalMonthlyExpenses,

      // 5. Living Situation / Additional Info
      livingArrangement: livingArrangementDisplay,
      livingArrangements: formData.livingArrangements,
      sourceOfFinancialSupport: financialSupportDisplay,
      reasonForRequest: reasonDisplay,
      reasonsForAssistance: formData.reasonsForAssistance,

      // 6. Other Assistance / Benefits Received
      otherAssistanceReceived: otherAssistanceList,

      // Extra Data container for all structured fields
      extra_data: {
        seniorIdNumber: formData.seniorIdNumber,
        qcidNumber: formData.qcidNumber,
        employmentStatus: formData.employmentStatus,
        currentPreviousOccupation: formData.currentPreviousOccupation,
        sourceOfIncome: formData.sourceOfIncome,
        approximateMonthlyIncome: formData.approximateMonthlyIncome,
        pensionsReceived: pensionsList,
        familyMembers: formData.familyMembers,
        totalMonthlyExpenses: formData.totalMonthlyExpenses,
        livingArrangements: formData.livingArrangements,
        livingArrangementOther: formData.livingArrangementOther,
        financialSources: formData.financialSources,
        financialSourceOther: formData.financialSourceOther,
        reasonsForAssistance: formData.reasonsForAssistance,
        reasonForAssistanceOther: formData.reasonForAssistanceOther,
        otherAssistanceReceived: otherAssistanceList,
      },

      documents: await Promise.all(
        Object.keys(uploadedFiles).map(async (k) => {
          const f = uploadedFiles[k]
          const dataUrl = f ? await readFileAsDataUrl(f, 1000, 0.75) : ""
          return {
            name: k,
            filename: f?.name || "doc.jpg",
            fileUrl: dataUrl || "",
            uploadedAt: new Date().toISOString(),
            status: "verified",
          }
        })
      ),
      status: "pending",
    }

    try {
      await fetch(`${API_BASE}/api/pwd-senior/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApp),
      })

      try {
        const existing = JSON.parse(localStorage.getItem("pwd_senior_applications") || "[]")
        localStorage.setItem("pwd_senior_applications", JSON.stringify([newApp, ...existing.slice(0, 5)]))
      } catch {
        const lightApp = {
          ...newApp,
          documents: newApp.documents.map((d: any) => ({ ...d, fileUrl: d.filename })),
        }
        localStorage.setItem("pwd_senior_applications", JSON.stringify([lightApp]))
      }
      window.dispatchEvent(new Event("pwd_senior_applications_updated"))
      notifyApplicationChange("APPLICATION_SUBMITTED", "pwd_senior", qcid)
    } catch {
      notifyApplicationChange("APPLICATION_SUBMITTED", "pwd_senior", qcid)
    }

    bypassedActiveAppRef.current = false
    dismissedAppRefCurrent.current = null

    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1000)
  }

  if (submitted) {
    const isAppApproved =
      String(latestSubmittedApp?.status || "").toLowerCase() === "approved" ||
      String(latestSubmittedApp?.status || "").toLowerCase() === "completed" ||
      String(latestSubmittedApp?.status || "").toLowerCase() === "for_release"
    const displayRef =
      latestSubmittedApp?.referenceNumber ||
      latestSubmittedApp?.reference_no ||
      latestSubmittedApp?.reference_number ||
      referenceNumber ||
      (userProfile as any)?.qcidNo ||
      "110000116932100"
    const rawDate = latestSubmittedApp?.submittedAt || latestSubmittedApp?.submitted_at || latestSubmittedApp?.created_at || latestSubmittedApp?.dateSubmitted
    const displayDate = formatAppDate(rawDate, latestSubmittedApp)

    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4 animate-in fade-in duration-150">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center gap-4">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${isAppApproved ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-500"}`}>
            {isAppApproved ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            ) : (
              <Info className="h-8 w-8 text-amber-500" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isAppApproved ? "Application Approved" : "Application Successfully Submitted"}
            </h2>
            <p className="text-sm text-gray-500 max-w-md mt-1 leading-relaxed">
              {isAppApproved
                ? "Your application for Senior Citizen Social Assistance has been officially approved! You can check your scheduled appointment or payout release status in Financial Aid / My Applications."
                : "Your application for Senior Citizen Social Assistance has been successfully submitted and is currently pending review. Please wait for a Social Worker's assessment."}
            </p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-gray-500 font-medium">Application Reference No.:</span>
              <span className="font-mono font-bold text-blue-600">{displayRef}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-gray-500 font-medium">Status:</span>
              {isAppApproved ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Under Review (Pending)
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Date Filed:</span>
              <span className="font-semibold text-gray-700">{displayDate}</span>
            </div>
          </div>

          <div className="w-full pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false)
                setStep(1)
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>
                {language === "en"
                  ? "RE-APPLY (SUBMIT NEW APPLICATION)"
                  : language === "bis"
                  ? "MAG-APPLY PAG-USAB (RE-APPLY)"
                  : "MAG-APPLY MULI (RE-APPLY APPLICATION)"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem("pwd_senior_reapplying_senior_social-assistance")
                  localStorage.removeItem("pwd_senior_reapplying")
                } catch {}
                window.location.href = "/portal/financial-aid"
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-colors cursor-pointer uppercase tracking-wider"
            >
              {language === "tl"
                ? "TINGNAN SA FINANCIAL AID / APPLICATION HISTORY"
                : language === "bis"
                ? "TAN-AWA SA FINANCIAL AID / APPLICATION HISTORY"
                : "VIEW IN FINANCIAL AID / APPLICATION HISTORY"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
        {/* Step indicator */}
        <div className="flex items-center px-6 pt-6 pb-4">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div
                className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  s.id === step
                    ? "bg-blue-600 text-white"
                    : s.id < step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
                }`}
              >
                {s.id < step ? <Check className="h-4 w-4" /> : s.id}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-2 ${s.id < step ? "bg-blue-300 dark:bg-blue-600" : "bg-gray-200 dark:bg-slate-800"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step labels */}
        <div className="flex gap-2 border-b border-border bg-gray-50 dark:bg-slate-900/50 p-2 overflow-x-auto">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap text-center transition-colors ${
                s.id === step
                  ? "bg-blue-600 text-white shadow-xs"
                  : s.id < step
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        <div className="px-6 pt-4 pb-2">
          <h2 className="text-lg font-bold text-foreground">{STEPS[step - 1]?.label}</h2>
        </div>

        <div className="p-6 md:p-8 min-h-[380px]">
          {/* STEP 1: CHECKLIST & SENIOR CITIZEN ID ENTRY */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">
                  SOCIAL WELFARE ASSISTANCE (SWA) — SENIOR CITIZEN SECTOR
                </h3>
              </div>

              {/* Info notice */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-slate-100">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <p className="text-xs leading-relaxed">
                  <span className="font-bold text-blue-950 dark:text-white">Senior Citizen Sector:</span> Qualified indigent Senior Citizens aged 60 and above may receive the assistance, subject to validation and assessment.
                </p>
              </div>

              {/* Non-blocking ID input */}
              <div className="bg-slate-50 border border-blue-200 rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                    Senior Citizen / OSCA ID Number <span className="text-red-500">*</span>
                  </label>
                  {isIdVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      <Check className="w-3.5 h-3.5" /> OSCA ID Validated
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={formData.seniorIdNumber}
                    onChange={(e) => {
                      const formatted = formatSeniorId(e.target.value)
                      updateField("seniorIdNumber", formatted)
                      setIsIdVerified(false)
                      setVerifyNotice(null)
                    }}
                    placeholder="e.g. 137404-2026-XXXXXX or 343243-2432-432"
                    maxLength={24}
                    className={`flex-1 border rounded-lg px-3 py-2.5 text-sm font-mono transition-all focus:outline-none ${
                      isIdVerified
                        ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20 text-gray-900"
                        : "border-border bg-white focus:ring-2 focus:ring-blue-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyId}
                    disabled={!formData.seniorIdNumber.trim() || isVerifying}
                    className={`px-5 py-2.5 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 ${
                      isIdVerified
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : isIdVerified ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>VERIFIED</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>VERIFY ID</span>
                      </>
                    )}
                  </button>
                </div>

                {verifyNotice && (
                  <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2 text-xs text-emerald-800 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{verifyNotice}</p>
                      {verifiedSeniorName && (
                        <p className="text-emerald-700 text-[11px] mt-0.5">Beneficiary: {verifiedSeniorName}</p>
                      )}
                    </div>
                  </div>
                )}

                {attemptedNext && !formData.seniorIdNumber.trim() && (
                  <p className="text-xs text-red-500">Senior Citizen / OSCA ID Number is required.</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PERSONAL & HOUSEHOLD INFORMATION */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Notice */}
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-600">IMPORTANT REMINDER / MAHALAGANG PAALALA</p>
                  <p className="text-blue-600/90 mt-0.5 text-xs">
                    Pakisiguradong tama at kumpleto ang lahat ng impormasyon para sa mabilis na pagproseso ng inyong Social Welfare Assistance.
                  </p>
                </div>
              </div>

              {attemptedNext && !isStep2Valid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Mangyaring punan ang lahat ng kinakailangang fields na may pulang asterisko (*).</span>
                </div>
              )}

              {/* PERSONAL INFORMATION (DISABLED PROFILE FIELDS) */}
              <div className="border border-gray-300 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="border-b border-gray-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Personal Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">QCitizen ID Number *</label>
                    <input
                      type="text"
                      value={formData.qcidNumber}
                      disabled
                      readOnly
                      placeholder="e.g. 110000116932100"
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 font-mono cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Senior Citizen / OSCA ID Number *</label>
                    <input
                      type="text"
                      value={formData.seniorIdNumber}
                      disabled
                      readOnly
                      placeholder="e.g. 137404-2026-XXXXXX"
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      disabled
                      readOnly
                      placeholder="Pangalan"
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Middle Name</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      disabled
                      readOnly
                      placeholder="Gitnang Pangalan"
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      disabled
                      readOnly
                      placeholder="Apelyido"
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Suffix</label>
                    <input
                      type="text"
                      value={formData.suffix}
                      disabled
                      readOnly
                      placeholder="e.g. Jr., Sr."
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Date of Birth *</label>
                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                      <input
                        type="text"
                        placeholder="MM"
                        maxLength={2}
                        value={formData.dobMonth}
                        disabled
                        readOnly
                        className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-2 py-2 text-center text-sm font-mono cursor-not-allowed"
                      />
                      <input
                        type="text"
                        placeholder="DD"
                        maxLength={2}
                        value={formData.dobDay}
                        disabled
                        readOnly
                        className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-2 py-2 text-center text-sm font-mono cursor-not-allowed"
                      />
                      <input
                        type="text"
                        placeholder="YYYY"
                        maxLength={4}
                        value={formData.dobYear}
                        disabled
                        readOnly
                        className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-2 py-2 text-center text-sm font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Age *</label>
                    <input
                      type="text"
                      value={formData.age}
                      disabled
                      readOnly
                      placeholder="Edad"
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 font-mono cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Sex *</label>
                    <input
                      type="text"
                      value={formData.sex}
                      disabled
                      readOnly
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Civil Status *</label>
                    <input
                      type="text"
                      value={formData.civilStatus}
                      disabled
                      readOnly
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">House/Building No.</label>
                    <input
                      type="text"
                      value={formData.addressHouseNo}
                      disabled
                      readOnly
                      placeholder="e.g. 12-A"
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Street Name *</label>
                    <input
                      type="text"
                      value={formData.addressStreet}
                      disabled
                      readOnly
                      placeholder="e.g. Mabini St."
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Barangay *</label>
                    <input
                      type="text"
                      value={formData.barangay}
                      disabled
                      readOnly
                      placeholder="e.g. Sauyo"
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Contact Number *</label>
                    <input
                      type="text"
                      value={formData.contactNumber}
                      disabled
                      readOnly
                      placeholder="09XXXXXXXXX"
                      className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* OCCUPATION / FINANCIAL INFORMATION */}
              <div className="border border-gray-300 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="border-b border-gray-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Occupation / Financial Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Employment Status *</label>
                    <select
                      value={formData.employmentStatus}
                      onChange={(e) => updateField("employmentStatus", e.target.value)}
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    >
                      <option value="" disabled>Select Employment Status</option>
                      <option value="Retired / Pensioner">Retired / Pensioner</option>
                      <option value="Unemployed">Unemployed</option>
                      <option value="Self-employed / Small Business">Self-employed / Small Business</option>
                      <option value="Part-time Worker">Part-time Worker</option>
                      <option value="Employed">Employed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Current / Previous Occupation</label>
                    <input
                      type="text"
                      value={formData.currentPreviousOccupation}
                      onChange={(e) => updateField("currentPreviousOccupation", e.target.value)}
                      placeholder="e.g. Kasambahay, Karpintero, Vendor, atbp."
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Source of Income</label>
                    <input
                      type="text"
                      value={formData.sourceOfIncome}
                      onChange={(e) => updateField("sourceOfIncome", e.target.value)}
                      placeholder="e.g. Suporta ng anak, maliit na sari-sari store"
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Approximate Monthly Income</label>
                    <select
                      value={formData.approximateMonthlyIncome}
                      onChange={(e) => updateField("approximateMonthlyIncome", e.target.value)}
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    >
                      <option value="" disabled>Select Monthly Income</option>
                      <option value="Below ₱5,000">Below ₱5,000</option>
                      <option value="₱5,000 - ₱10,000">₱5,000 – ₱10,000</option>
                      <option value="₱10,001 - ₱20,000">₱10,001 – ₱20,000</option>
                      <option value="Above ₱20,000">Above ₱20,000</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
                    Pension / Benefits Received, if any:
                  </label>
                  <div className="max-w-md">
                    <select
                      value={
                        formData.pensionType ||
                        (formData.pensionSSS
                          ? "SSS Pension"
                          : formData.pensionGSIS
                          ? "GSIS Pension"
                          : formData.pensionOther
                          ? "Other Pension / Benefits"
                          : formData.pensionNone
                          ? "None"
                          : "")
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        setFormData((prev) => ({
                          ...prev,
                          pensionType: val,
                          pensionSSS: val === "SSS Pension",
                          pensionGSIS: val === "GSIS Pension",
                          pensionOther: val === "Other Pension / Benefits",
                          pensionNone: val === "None",
                        }))
                      }}
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    >
                      <option value="" disabled>Select Pension / Benefit</option>
                      <option value="None">None</option>
                      <option value="SSS Pension">SSS Pension</option>
                      <option value="GSIS Pension">GSIS Pension</option>
                      <option value="Other Pension / Benefits">Other Pension / Benefits</option>
                    </select>

                    {(formData.pensionType === "Other Pension / Benefits" || formData.pensionOther) && (
                      <div className="mt-2.5">
                        <input
                          type="text"
                          value={formData.pensionOtherSpecify}
                          onChange={(e) => updateField("pensionOtherSpecify", e.target.value)}
                          placeholder="Pakitukoy ang ibang pensyon o benepisyo"
                          className="w-full border border-blue-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none bg-blue-50/30 dark:bg-slate-800"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FAMILY COMPOSITION */}
              <div className="border border-gray-300 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="border-b border-gray-200 dark:border-slate-700 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        Family Composition
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Para malaman kung sino ang kasama at sumusuporta sa senior citizen.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addFamilyMember}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Magdagdag ng Kasapi</span>
                  </button>
                </div>

                {formData.familyMembers.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-800/40 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Walang nakatalang kasapi sa bahay. Kung mag-isang naninirahan, maaaring iwanang bakante o magdagdag kung may kasama.
                    </p>
                    <button
                      type="button"
                      onClick={addFamilyMember}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-medium text-blue-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Magdagdag ng Kasapi ng Pamilya</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.familyMembers.map((member, idx) => (
                      <div
                        key={member.id || idx}
                        className="p-4 rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 shadow-xs space-y-3 relative"
                      >
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 pb-2">
                          <span className="text-xs font-bold text-blue-600">
                            Kasapi #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFamilyMember(idx)}
                            className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Alisin</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                              Pangalan ng Family Member *
                            </label>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => updateFamilyMember(idx, "name", e.target.value)}
                              placeholder="Buong pangalan"
                              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                              Relationship *
                            </label>
                            <select
                              value={member.relationship}
                              onChange={(e) => updateFamilyMember(idx, "relationship", e.target.value)}
                              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            >
                              <option value="" disabled>Select Relationship</option>
                              <option value="Asawa / Spouse">Asawa / Spouse</option>
                              <option value="Anak / Child">Anak / Child</option>
                              <option value="Apo / Grandchild">Apo / Grandchild</option>
                              <option value="Kapatid / Sibling">Kapatid / Sibling</option>
                              <option value="Magulang / Parent">Magulang / Parent</option>
                              <option value="Kamag-anak / Relative">Kamag-anak / Relative</option>
                              <option value="Tagapag-alaga / Caregiver">Tagapag-alaga / Caregiver</option>
                              <option value="Iba pa / Other">Iba pa / Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                              Age *
                            </label>
                            <input
                              type="text"
                              value={member.age}
                              onChange={(e) => updateFamilyMember(idx, "age", e.target.value.replace(/\D/g, ""))}
                              placeholder="e.g. 35"
                              maxLength={3}
                              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 font-mono focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                              Occupation
                            </label>
                            <input
                              type="text"
                              value={member.occupation}
                              onChange={(e) => updateFamilyMember(idx, "occupation", e.target.value)}
                              placeholder="e.g. Driver, Tindera, Estudyante"
                              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                              Income / Support
                            </label>
                            <input
                              type="text"
                              value={member.income}
                              onChange={(e) => updateFamilyMember(idx, "income", e.target.value)}
                              placeholder="e.g. ₱5,000 o N/A"
                              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                              Other Information
                            </label>
                            <input
                              type="text"
                              value={member.otherInfo}
                              onChange={(e) => updateFamilyMember(idx, "otherInfo", e.target.value)}
                              placeholder="e.g. Nag-aaral, May kapansanan, atbp."
                              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MONTHLY HOUSEHOLD EXPENSES */}
              <div className="border border-gray-300 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="border-b border-gray-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Monthly Household Expenses
                  </h3>
                </div>

                <div className="max-w-md">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Total Monthly Expenses
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">₱</span>
                    <input
                      type="text"
                      maxLength={5}
                      value={formData.totalMonthlyExpenses}
                      onChange={(e) => updateField("totalMonthlyExpenses", e.target.value.replace(/\D/g, "").slice(0, 5))}
                      placeholder="e.g. 6500"
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Tantiyang kabuuang gastusin kada buwan (hanggang 5 numero lamang).
                  </p>
                </div>
              </div>

              {/* LIVING SITUATION / ADDITIONAL INFORMATION */}
              <div className="border border-gray-300 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-5">
                <div className="border-b border-gray-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <Home className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Living Situation / Additional Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Living Arrangement */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Living Arrangement *
                    </label>
                    <select
                      value={formData.livingArrangements[0] || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        setFormData((prev) => ({
                          ...prev,
                          livingArrangements: val ? [val] : [],
                        }))
                      }}
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    >
                      <option value="" disabled>Select Living Arrangement</option>
                      <option value="Living Alone">Living Alone</option>
                      <option value="Living with Spouse">Living with Spouse</option>
                      <option value="Living with Children">Living with Children</option>
                      <option value="Living with Relatives">Living with Relatives</option>
                      <option value="Other">Other</option>
                    </select>

                    {formData.livingArrangements.includes("Other") && (
                      <div className="mt-2.5">
                        <input
                          type="text"
                          value={formData.livingArrangementOther}
                          onChange={(e) => updateField("livingArrangementOther", e.target.value)}
                          placeholder="Pakitukoy ang living arrangement"
                          className="w-full border border-blue-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none bg-blue-50/30 dark:bg-slate-800"
                        />
                      </div>
                    )}
                  </div>

                  {/* Source of Financial Support */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Source of Financial Support *
                    </label>
                    <select
                      value={formData.financialSources[0] || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        setFormData((prev) => ({
                          ...prev,
                          financialSources: val ? [val] : [],
                        }))
                      }}
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    >
                      <option value="" disabled>Select Source of Financial Support</option>
                      <option value="Own Income">Own Income</option>
                      <option value="Children/Family">Children/Family</option>
                      <option value="Pension">Pension</option>
                      <option value="Other">Other</option>
                    </select>

                    {formData.financialSources.includes("Other") && (
                      <div className="mt-2.5">
                        <input
                          type="text"
                          value={formData.financialSourceOther}
                          onChange={(e) => updateField("financialSourceOther", e.target.value)}
                          placeholder="Pakitukoy ang iba pang pinagkukunan ng suporta"
                          className="w-full border border-blue-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none bg-blue-50/30 dark:bg-slate-800"
                        />
                      </div>
                    )}
                  </div>

                  {/* Reason for Requesting Assistance */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Reason for Requesting Assistance *
                    </label>
                    <select
                      value={formData.reasonsForAssistance[0] || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        setFormData((prev) => ({
                          ...prev,
                          reasonsForAssistance: val ? [val] : [],
                        }))
                      }}
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    >
                      <option value="" disabled>Select Reason for Assistance</option>
                      <option value="Insufficient Income">Insufficient Income</option>
                      <option value="No Regular Income">No Regular Income</option>
                      <option value="High Household Expenses">High Household Expenses</option>
                      <option value="Medical/Medication Expenses">Medical/Medication Expenses</option>
                      <option value="Food/Basic Needs">Food/Basic Needs</option>
                      <option value="Other">Other</option>
                    </select>

                    {formData.reasonsForAssistance.includes("Other") && (
                      <div className="mt-2.5">
                        <input
                          type="text"
                          value={formData.reasonForAssistanceOther}
                          onChange={(e) => updateField("reasonForAssistanceOther", e.target.value)}
                          placeholder="Pakitukoy ang ibang dahilan ng paghingi ng tulong..."
                          className="w-full border border-blue-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none bg-blue-50/30 dark:bg-slate-800"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* OTHER ASSISTANCE / BENEFITS RECEIVED */}
              <div className="border border-gray-300 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="border-b border-gray-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Other Assistance / Benefits Received
                  </h3>
                </div>

                <div className="max-w-md">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Other Assistance / Benefits Received
                  </label>
                  <select
                    value={
                      formData.otherAssistanceType ||
                      (formData.dswdSocialPension
                        ? "DSWD Social Pension"
                        : formData.sssPensionBenefit
                        ? "SSS Pension"
                        : formData.gsisPensionBenefit
                        ? "GSIS Pension"
                        : formData.otherGovtAssistance
                        ? "Other Government Assistance"
                        : formData.otherFinancialAssistance
                        ? "Other Financial Assistance"
                        : formData.otherAssistanceNone
                        ? "None"
                        : "")
                    }
                    onChange={(e) => {
                      const val = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        otherAssistanceType: val,
                        dswdSocialPension: val === "DSWD Social Pension",
                        sssPensionBenefit: val === "SSS Pension",
                        gsisPensionBenefit: val === "GSIS Pension",
                        otherGovtAssistance: val === "Other Government Assistance",
                        otherFinancialAssistance: val === "Other Financial Assistance",
                        otherAssistanceNone: val === "None",
                      }))
                    }}
                    className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  >
                    <option value="" disabled>Select Other Assistance / Benefit</option>
                    <option value="None">None</option>
                    <option value="DSWD Social Pension">DSWD Social Pension</option>
                    <option value="SSS Pension">SSS Pension</option>
                    <option value="GSIS Pension">GSIS Pension</option>
                    <option value="Other Government Assistance">Other Government Assistance</option>
                    <option value="Other Financial Assistance">Other Financial Assistance</option>
                    <option value="Other">Other</option>
                  </select>

                  {(formData.otherAssistanceType === "Other Government Assistance" || formData.otherGovtAssistance) && (
                    <div className="mt-2.5">
                      <input
                        type="text"
                        value={formData.otherGovtAssistanceSpecify}
                        onChange={(e) => updateField("otherGovtAssistanceSpecify", e.target.value)}
                        placeholder="Tukuyin ang Other Government Assistance"
                        className="w-full border border-blue-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none bg-blue-50/30 dark:bg-slate-800"
                      />
                    </div>
                  )}

                  {(formData.otherAssistanceType === "Other Financial Assistance" || formData.otherFinancialAssistance) && (
                    <div className="mt-2.5">
                      <input
                        type="text"
                        value={formData.otherFinancialAssistanceSpecify}
                        onChange={(e) => updateField("otherFinancialAssistanceSpecify", e.target.value)}
                        placeholder="Tukuyin ang Other Financial Assistance"
                        className="w-full border border-blue-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none bg-blue-50/30 dark:bg-slate-800"
                      />
                    </div>
                  )}

                  {formData.otherAssistanceType === "Other" && (
                    <div className="mt-2.5">
                      <input
                        type="text"
                        value={formData.otherAssistanceSpecify}
                        onChange={(e) => updateField("otherAssistanceSpecify", e.target.value)}
                        placeholder="Pakitukoy ang ibang tulong o benepisyo"
                        className="w-full border border-blue-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none bg-blue-50/30 dark:bg-slate-800"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DOCUMENTARY REQUIREMENTS / UPLOADS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">
                  DOCUMENTARY REQUIREMENTS / UPLOADS
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Para sa Senior Social Welfare Assistance, mangyaring i-upload ang malinaw na larawan ng mga sumusunod:
                </p>
              </div>

              {attemptedNext && !isStep3Valid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Kailangang i-upload ang lahat ng required na dokumentong may pulang asterisko (*).</span>
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
                            ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30 dark:border-emerald-500/30"
                            : missing
                            ? "border-red-500/40 bg-red-500/10 dark:bg-red-950/30 dark:border-red-500/30"
                            : "border-gray-300 dark:border-slate-700 bg-card/60 dark:bg-slate-900/40"
                        }`}
                      >
                        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground uppercase tracking-wide">
                          {doc.label} {doc.required ? <span className="text-red-500">*</span> : <span className="text-muted-foreground font-normal text-[10px] uppercase">Optional</span>}
                          {file && (
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white shrink-0">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </span>
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>

                        <p className="text-xs text-muted-foreground mt-2">
                          Allowed file types: JPG, JPEG, PNG, WEBP
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
                            KUMUHA NG LARAWAN
                          </button>
                        </div>

                        {file && (
                          <div className="flex flex-wrap gap-3 pt-4">
                            <div className="relative w-40 border border-border rounded-lg bg-card dark:bg-slate-900/90 shadow-sm p-3 flex flex-col items-center text-center shadow-xs">
                              <button
                                type="button"
                                onClick={() => removeFile(doc.id)}
                                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-slate-700 hover:bg-red-600 flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                                aria-label={`Alisin ang ${file.name}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <div className="h-12 w-12 rounded-md overflow-hidden border border-border mb-2 flex items-center justify-center bg-muted/40 dark:bg-slate-800">
                                <FileThumbnail file={file} className="h-full w-full object-cover" />
                              </div>
                              <p className="text-xs font-medium text-foreground truncate w-full">{file.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                        )}

                        {missing && (
                          <p className="text-xs text-red-500 mt-2">
                            Kailangang mag-upload ng dokumento para sa item na ito.
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-foreground">REVIEW & CONFIRM DETAILS</h3>
                <p className="text-sm text-muted-foreground">
                  Pakisuri nang mabuti ang lahat ng nakatalang impormasyon bago isumite ang inyong aplikasyon.
                </p>
              </div>

              {/* Unified Step 2: Personal, Family & Socio-Economic Information */}
              <ReviewSection
                title="Personal & Socio-Economic Information"
                onEdit={() => {
                  setReturnToReview(true)
                  setStep(2)
                }}
              >
                <div className="space-y-6">
                  {/* 1. Personal Information */}
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                      1. Personal Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <ReviewField label="QCitizen ID Number" value={formData.qcidNumber} />
                      <ReviewField label="Senior Citizen / OSCA ID" value={formData.seniorIdNumber} />
                      <ReviewField
                        label="Buong Pangalan"
                        value={`${formData.firstName} ${formData.middleName} ${formData.lastName} ${formData.suffix}`.trim()}
                      />
                      <ReviewField
                        label="Petsa ng Kapanganakan"
                        value={`${formData.dobMonth}/${formData.dobDay}/${formData.dobYear}`}
                      />
                      <ReviewField label="Edad at Kasarian" value={`${formData.age} taong gulang, ${formData.sex}`} />
                      <ReviewField label="Katayuang Sibil" value={formData.civilStatus} />
                      <ReviewField label="Barangay" value={formData.barangay} />
                      <ReviewField label="Contact Number" value={formData.contactNumber} />
                      <div className="sm:col-span-4">
                        <ReviewField
                          label="Kumpletong Address"
                          value={`${formData.addressHouseNo ? `${formData.addressHouseNo} ` : ""}${formData.addressStreet}, Brgy. ${formData.barangay}, Quezon City`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Occupation & Financial Information */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                      2. Occupation &amp; Financial Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <ReviewField label="Employment Status" value={formData.employmentStatus} />
                      <ReviewField label="Current / Previous Occupation" value={formData.currentPreviousOccupation || "N/A"} />
                      <ReviewField label="Source of Income" value={formData.sourceOfIncome || "N/A"} />
                      <ReviewField label="Approximate Monthly Income" value={formData.approximateMonthlyIncome} />
                      <div className="sm:col-span-4">
                        <ReviewField
                          label="Pension / Benefits Received"
                          value={[
                            formData.pensionSSS ? "SSS" : null,
                            formData.pensionGSIS ? "GSIS" : null,
                            formData.pensionOther ? `Other: ${formData.pensionOtherSpecify || "Yes"}` : null,
                            formData.pensionNone ? "None" : null,
                          ].filter(Boolean).join(", ") || "None"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Family Composition */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                      3. Family Composition ({formData.familyMembers.length} Kasapi)
                    </h4>
                    {formData.familyMembers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Walang nakatalang kasapi sa bahay.</p>
                    ) : (
                      <div className="space-y-2">
                        {formData.familyMembers.map((m, i) => (
                          <div key={i} className="p-2.5 rounded-lg border border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <span className="text-gray-500 dark:text-slate-400 font-semibold block">Pangalan:</span>
                              <span className="font-bold text-foreground dark:text-slate-100">{m.name || "—"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-slate-400 font-semibold block">Relasyon / Edad:</span>
                              <span className="text-foreground dark:text-slate-200">{m.relationship} - {m.age || "—"} anyos</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-slate-400 font-semibold block">Trabaho:</span>
                              <span className="text-foreground dark:text-slate-200">{m.occupation || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-slate-400 font-semibold block">Kita / Notes:</span>
                              <span className="text-foreground dark:text-slate-200">{m.income || m.otherInfo || "N/A"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Monthly Household Expenses */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                      4. Monthly Household Expenses
                    </h4>
                    <ReviewField label="Total Monthly Expenses" value={formData.totalMonthlyExpenses ? `₱ ${formData.totalMonthlyExpenses}` : "—"} />
                  </div>

                  {/* 5. Living Situation & Financial Support */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                      5. Living Situation &amp; Financial Support
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <ReviewField
                        label="Living Arrangement"
                        value={[
                          ...formData.livingArrangements,
                          formData.livingArrangements.includes("Other") && formData.livingArrangementOther ? `Other: ${formData.livingArrangementOther}` : null,
                        ].filter(Boolean).join(", ") || "—"}
                      />
                      <ReviewField
                        label="Source of Financial Support"
                        value={[
                          ...formData.financialSources,
                          formData.financialSources.includes("Other") && formData.financialSourceOther ? `Other: ${formData.financialSourceOther}` : null,
                        ].filter(Boolean).join(", ") || "—"}
                      />
                      <ReviewField
                        label="Reason for Requesting Assistance"
                        value={[
                          ...formData.reasonsForAssistance,
                          formData.reasonsForAssistance.includes("Other") && formData.reasonForAssistanceOther ? `Other: ${formData.reasonForAssistanceOther}` : null,
                        ].filter(Boolean).join(", ") || "—"}
                      />
                    </div>
                  </div>

                  {/* 6. Other Assistance / Benefits Received */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                      6. Other Assistance / Benefits Received
                    </h4>
                    <ReviewField
                      label="Tulong / Benepisyo mula sa Gobyerno o Ibang Tanggapan"
                      value={[
                        formData.dswdSocialPension ? "DSWD Social Pension" : null,
                        formData.sssPensionBenefit ? "SSS Pension" : null,
                        formData.gsisPensionBenefit ? "GSIS Pension" : null,
                        formData.otherGovtAssistance ? `Other Govt: ${formData.otherGovtAssistanceSpecify || "Yes"}` : null,
                        formData.otherFinancialAssistance ? `Other Financial: ${formData.otherFinancialAssistanceSpecify || "Yes"}` : null,
                        formData.otherAssistanceType === "Other" ? `Other: ${formData.otherAssistanceSpecify || "Yes"}` : null,
                        formData.otherAssistanceNone ? "None" : null,
                      ].filter(Boolean).join(", ") || "None"}
                    />
                  </div>
                </div>
              </ReviewSection>

              {/* Documentary Requirements */}
              <ReviewSection title="Uploaded Documents" onEdit={() => { setReturnToReview(true); setStep(3) }}>
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
                              className="w-full max-w-md border border-border dark:border-slate-800 hover:border-blue-400 rounded-lg overflow-hidden text-left bg-white dark:bg-slate-900/70 cursor-pointer transition-colors shadow-xs"
                            >
                              <div className="h-28 w-full bg-gray-100 dark:bg-slate-800/80 flex items-center justify-center overflow-hidden">
                                <FileThumbnail file={file} className="h-full w-full object-cover" />
                              </div>
                              <div className="px-3 py-2 text-center border-t border-border dark:border-slate-800 bg-white dark:bg-slate-900/70">
                                <p className="text-xs font-medium text-foreground dark:text-slate-100 truncate">{file.name}</p>
                                <p className="text-[10px] text-muted-foreground dark:text-slate-400 mt-0.5">{formatFileSize(file.size)}</p>
                              </div>
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-red-500 mt-1">Walang nai-upload na dokumento</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ReviewSection>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-border bg-gray-50 dark:bg-slate-900/60 px-6 py-4">
          {step === 1 && !onBack ? (
            <div />
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-border dark:border-slate-700 text-foreground dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            >
              {t("backButton")?.toUpperCase() || "BACK"}
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
                  : "bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed"
              }`}
            >
              <span>{t("nextButton")?.toUpperCase() || "NEXT"}</span>
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
                  : "bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed"
              }`}
            >
              <span>SUBMIT APPLICATION</span>
            </button>
          )}
        </div>
      </div>

      <SubmitPrivacyOverlayModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false)
          handleFinalSubmit()
        }}
        isSubmitting={isSubmitting}
        title="Review Before Submission & Data Privacy Notice"
        description="Please check all details and accept our Data Privacy Policy before submitting your senior assistance application."
        confirmText="YES, SUBMIT APPLICATION"
      />

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
  const isImage = file ? (file.type.startsWith("image/") || /\.(jpe?g|png|webp|jfif|bmp|gif)$/i.test(file.name)) : false
  const [previewUrl, setPreviewUrl] = useState<string>("")

  useEffect(() => {
    if (!file || !isImage) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file, isImage])

  if (!file) return null

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

import { useRef, useState, useEffect, type ReactNode } from "react"
import { Check, Upload, Camera, ChevronRight, ChevronDown, Pencil, FileText, AlertCircle, Info, X, Sparkles, Loader2, ExternalLink } from "lucide-react"
import { useLanguage } from "../ui/language-context"
import DocumentCameraModal from "../ui/document-camera-modal"
import { API_BASE } from "../../config/api"

type DisabilityClass = "apparent" | "non-apparent" | null
type IdStatus = "new" | "renewal" | "loss" | null

type SubmitStatus = "idle" | "submitting" | "submitted"

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

const APPARENT_DOCS = [
  { title: "Whole Body Picture", desc: "Clear photo showing the disability" },
  { title: "Certificate of Disability from Specialist", desc: "Annex 4, NCDA Administrative Order 001 S. 2021" },
]

const NON_APPARENT_BASE_DOC = { title: "Certificate of Disability from Specialist", desc: "Annex 4, NCDA Administrative Order 001 S. 2021" }

const BASE_DOCS = [
  { title: "Proof of Residence", desc: "Valid ID or Original Barangay Certificate" },
  { title: "ID Picture (2x2)", desc: "With white background" },
  { title: "Signature", desc: "Signed on plain white paper" },
]

const REPLACEMENT_DOCS = [
  { title: "Affidavit of Loss / Certificate of Damage", desc: "Notarized Affidavit of Loss (o larawan ng sirang ID kung damaged)" },
  { title: "ID Picture (2x2)", desc: "Recent ID Picture na may puting background" },
  { title: "Valid Government ID", desc: "Kopya ng valid government ID bilang katibayan ng pagkakakilanlan" },
  { title: "Proof of Residence", desc: "Barangay Certificate of Residency sa Quezon City" },
]

interface FormData {
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  dobMonth: string
  dobDay: string
  dobYear: string
  pobCity: string
  pobProvince: string
  citizenship: string
  citizenshipOther: string
  sex: string
  bloodType: string
  age: string
  occupation: string
  civilStatus: string
  religion: string
  religionOther: string
  contactNo: string
  email: string
  addressHouseNo: string
  addressStreet: string
  addressBarangay: string
  addressCity: string
  addressProvince: string
  permanentAddress: string
  presentAddress: string
  emergencyLastName: string
  emergencyFirstName: string
  emergencyMiddleName: string
  emergencyContactNo: string
  emergencyRelationship: string
  emergencyAddress: string
  heightCm: string
  weightKg: string
  colorOfHair: string
  colorOfEyes: string
  otherMarks: string
  covidVaccineWilling: string
  medicalFrontliner: string
  hasExistingPwdId: string
  existingPwdIdNumber: string
  ethnicGroup: string
  ethnicGroupOther: string
  causeOfDisability: string
  specificDisability: string
  educationalAttainment: string
  currentlyStudying: string
  schoolName: string
  statusOfEmployment: string
  categoryOfEmployment: string
  companyName: string
  companyAddress: string
  sssNumber: string
  gsisNumber: string
  philhealthNumber: string
  pagibigNumber: string
  familyFirstName: string
  familyMiddleName: string
  familyLastName: string
  familySuffix: string
  familySex: string
  familyDobMonth: string
  familyDobDay: string
  familyDobYear: string
  familyAge: string
  familyAddressHouseNo: string
  familyAddressStreet: string
  familyAddressBarangay: string
  familyAddressCity: string
  familyCauseOfDisability: string
}

const EMPTY_FORM_DATA: FormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  dobMonth: "",
  dobDay: "",
  dobYear: "",
  pobCity: "",
  pobProvince: "",
  citizenship: "",
  citizenshipOther: "",
  sex: "",
  bloodType: "",
  age: "",
  occupation: "",
  civilStatus: "",
  religion: "",
  religionOther: "",
  contactNo: "",
  email: "",
  addressHouseNo: "",
  addressStreet: "",
  addressBarangay: "",
  addressCity: "",
  addressProvince: "",
  permanentAddress: "",
  presentAddress: "",
  emergencyLastName: "",
  emergencyFirstName: "",
  emergencyMiddleName: "",
  emergencyContactNo: "",
  emergencyRelationship: "",
  emergencyAddress: "",
  heightCm: "",
  weightKg: "",
  colorOfHair: "",
  colorOfEyes: "",
  otherMarks: "",
  covidVaccineWilling: "",
  medicalFrontliner: "",
  hasExistingPwdId: "",
  existingPwdIdNumber: "",
  ethnicGroup: "",
  ethnicGroupOther: "",
  causeOfDisability: "",
  specificDisability: "",
  educationalAttainment: "",
  currentlyStudying: "",
  schoolName: "",
  statusOfEmployment: "",
  categoryOfEmployment: "",
  companyName: "",
  companyAddress: "",
  sssNumber: "",
  gsisNumber: "",
  philhealthNumber: "",
  pagibigNumber: "",
  familyFirstName: "",
  familyMiddleName: "",
  familyLastName: "",
  familySuffix: "",
  familySex: "",
  familyDobMonth: "",
  familyDobDay: "",
  familyDobYear: "",
  familyAge: "",
  familyAddressHouseNo: "",
  familyAddressStreet: "",
  familyAddressBarangay: "",
  familyAddressCity: "",
  familyCauseOfDisability: "",
}

const CAUSE_OF_DISABILITY = [
  "Congenital / Inborn",
  "Acquired",
  "Illness / Disease",
  "Injury / Accident",
]

interface UserProfile {
  qcidNo: string
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
  addressCity: string
  contactNo?: string
  email?: string
  emergencyFirstName?: string
  emergencyLastName?: string
  emergencyMiddleName?: string
  emergencyName?: string
  emergencyContactNo?: string
  emergencyRelationship?: string
  emergencyAddress?: string
}

interface PWDApplicationWizardProps {
  onBack?: () => void
  userProfile?: UserProfile
  initialIdStatus?: "new" | "renewal" | "loss"
  onStepChange?: (step: number) => void
}

import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"

const MOCK_USER_PROFILE: UserProfile = getCurrentUserProfile() as any

// real uploaded file + generated preview URL, instead of a plain boolean
interface UploadedDoc {
  file: File
  previewUrl: string
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-2">
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
  children,
}: {
  label: string
  required?: boolean
  span?: number
  invalid?: boolean
  invalidNote?: string
  children: ReactNode
}) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : span === 4 ? "sm:col-span-4" : ""}>
      <label className={`text-xs font-semibold ${invalid ? "text-red-600" : "text-muted-foreground"}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {invalid && <p className="text-xs text-red-500 mt-1">{invalidNote}</p>}
    </div>
  )
}

function formatPwdId(val: string): string {
  const digits = val.replace(/^PWD-?/i, "").replace(/\D/g, "").slice(0, 16)
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

  const displayVal = prefix && value.toUpperCase().startsWith(prefix.toUpperCase())
    ? value.slice(prefix.length)
    : value

  if (prefix) {
    return (
      <div className={`flex w-full rounded-lg border overflow-hidden transition-all focus-within:ring-2 ${
        disabled
          ? "border-border bg-gray-100 cursor-not-allowed opacity-60"
          : invalid
          ? "border-red-400 focus-within:ring-red-300 bg-red-50"
          : "border-border focus-within:ring-blue-400 bg-white"
      }`}>
        <span className="inline-flex items-center px-3.5 bg-slate-100 border-r border-border text-xs font-bold text-slate-700 select-none tracking-wider shrink-0 font-mono">
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
          className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none font-mono placeholder:font-sans"
        />
      </div>
    )
  }

  return (
    <input
      type={isPwdIdMask || numbersOnly ? "tel" : type}
      inputMode={isPwdIdMask || numbersOnly ? "numeric" : undefined}
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      disabled={disabled}
      maxLength={isPwdIdMask ? 18 : maxLength}
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
  disabled = false,
  invalid = false,
  placeholder = "Select",
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
        disabled
          ? "border-border bg-gray-100 text-muted-foreground cursor-not-allowed"
          : invalid
          ? "border-red-400 focus:ring-red-300 bg-red-50"
          : "border-border focus:ring-blue-400"
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}

function LockedField({ value, placeholder }: { value: string; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder || "—"}
      readOnly
      disabled
      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-gray-100 text-foreground cursor-not-allowed"
    />
  )
}

const SAMPLE_DOC_IMAGES: Record<string, string> = {
  "Proof of Residence": "/samples/PROOF OF RESIDENCE.webp",
  "ID Picture (2x2)": "/samples/ID PICTURE (2X2).webp",
  "Signature": "/samples/SIGNATURE.avif",
  "Certificate of Disability from Specialist": "/samples/CERTIFICATE OF DISABILITY.jpg",
  "Whole Body Picture": "/samples/WHOLE BODY.jpg",
}

function SampleDocPreview({ title, noSampleText }: { title: string; noSampleText: string }) {
  const src = SAMPLE_DOC_IMAGES[title]
  if (!src) {
    return (
      <div className="w-full max-w-sm mx-auto border border-dashed border-border rounded-lg bg-white p-8 text-center text-sm text-muted-foreground">
        {noSampleText}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={`Sample ${title}`}
      className="w-full max-w-sm mx-auto rounded-lg border border-border object-contain"
    />
  )
}

function SampleDocumentModal({ title, onClose }: { title: string; onClose: () => void }) {
  const { t } = useLanguage()
  const src = SAMPLE_DOC_IMAGES[title]

  const handleDownload = () => {
    if (!src) return
    const link = document.createElement("a")
    link.href = src
    const ext = src.split(".").pop()
    link.download = `${title.replace(/[^a-z0-9]+/gi, "-")}.${ext}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
            {t("sampleLabel", { name: title })}
          </h4>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto bg-gray-50">
          <SampleDocPreview
            title={title}
            noSampleText={`No sample image set yet for "${title}". Add its URL to SAMPLE_DOC_IMAGES.`}
          />
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!src}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              src
                ? "bg-gray-100 text-foreground hover:bg-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {t("download").toUpperCase()}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
          >
            {t("close").toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  )
}

// full-size preview modal for a document the user actually uploaded
function UploadedDocPreviewModal({
  title,
  doc,
  onClose,
}: {
  title: string
  doc: UploadedDoc
  onClose: () => void
}) {
  const isImage = doc.file.type.startsWith("image/")
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">{title}</h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 max-h-[65vh] overflow-y-auto bg-gray-50 flex items-center justify-center">
          {isImage ? (
            <img src={doc.previewUrl} alt={title} className="max-w-full max-h-[55vh] rounded-lg border border-border object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <FileText className="h-10 w-10" />
              <p className="text-sm">{doc.file.name}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground truncate">
          {doc.file.name}
        </div>
      </div>
    </div>
  )
}

// formats bytes into a readable size like "5.2 MB"
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Uses the user's official QCID Number
function generateReferenceNumber(qcid?: string) {
  if (qcid && (qcid || "").trim() && qcid !== "110000116932100") return (qcid || "").trim()
  return getLoggedInUserQcid()
}

export default function PWDApplicationWizard({ onBack, userProfile = MOCK_USER_PROFILE, initialIdStatus, onStepChange }: PWDApplicationWizardProps) {
  const { t } = useLanguage()

  const STEPS = [
    { id: 1, label: t("pwdStepChecklist").toUpperCase() },
    { id: 2, label: t("pwdStepPersonal").toUpperCase() },
    { id: 3, label: t("pwdStepDocuments").toUpperCase() },
    { id: 4, label: t("pwdStepReview").toUpperCase() },
  ]

  const [step, setStep] = useState(1)
  const [returnToReview, setReturnToReview] = useState(false)
  const [attemptedNext, setAttemptedNext] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [isBlocked, setIsBlocked] = useState(false)
  const [bypassedBlock, setBypassedBlock] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3)

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  const [isResident, setIsResident] = useState(false)
  const [hasDisability, setHasDisability] = useState(false)
  const [idStatus, setIdStatus] = useState<IdStatus>(initialIdStatus ?? null)
  const [disabilityType, setDisabilityType] = useState("")
  const [disabilityClass, setDisabilityClass] = useState<DisabilityClass>(null)

  const [formData, setFormData] = useState<FormData>(() => {
    const prof: any = userProfile || {}
    return {
      ...EMPTY_FORM_DATA,
      firstName: prof.firstName || prof.first_name || "CLARISA MAE",
      middleName: prof.middleName || prof.middle_name || "GALIAS",
      lastName: prof.lastName || prof.last_name || "DIMAL",
      suffix: prof.suffix || "",
      citizenship: prof.nationality || "FILIPINO",
      dobMonth: prof.dobMonth || prof.birthMonth || prof.birth_month || "10",
      dobDay: prof.dobDay || prof.birthDay || prof.birth_day || "29",
      dobYear: prof.dobYear || prof.birthYear || prof.birth_year || "2000",
      age: String(prof.age || "24"),
      sex: prof.sex || "Female",
      civilStatus: prof.civilStatus || "Single",
      addressCity: prof.addressCity || prof.city || "QUEZON CITY",
      addressHouseNo: prof.addressHouseNo || prof.houseNo || prof.house_no || "11",
      addressStreet: prof.addressStreet || prof.street || "OLD CABUYAO SAMPALOK ST",
      addressBarangay: prof.addressBarangay || prof.barangay || "Sauyo",
      contactNo: String(prof.contactNo || prof.mobileNumber || prof.mobile_number || "09000000000").replace(/\s+/g, ""),
      email: prof.email || "dimalmae@gmail.com",
    }
  })

  const [uploaded, setUploaded] = useState<Record<string, UploadedDoc | undefined>>({})
  const [sampleDoc, setSampleDoc] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<string | null>(null) // which uploaded doc is being previewed
  const [cameraDoc, setCameraDoc] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Reload / Navigation warning protection
  const isFormDirty =
    submitStatus !== "submitted" &&
    (step > 1 ||
      isResident ||
      hasDisability ||
      disabilityType !== "" ||
      disabilityClass !== null ||
      Object.keys(uploaded).length > 0)

  // Reload / Navigation warning protection
  useEffect(() => {
    if (step > 1 && submitStatus === "idle") {
      ;(window as any).__isFormDirty = true
    } else {
      ;(window as any).__isFormDirty = false
    }
    return () => {
      ;(window as any).__isFormDirty = false
    }
  }, [step, submitStatus])

  const [latestApprovedApp, setLatestApprovedApp] = useState<any>(null)
  const [activeAppStatus, setActiveAppStatus] = useState<string | null>(null)
  const [blockedApp, setBlockedApp] = useState<any>(null)

  // Check if there is an active application for this user
  useEffect(() => {
    const checkActiveApp = async () => {
      let currentAppStatus: string | null = null
      let matchedApproved: any = null
      let matchedPending: any = null

      const checkUserMatches = (a: any) => {
        const qcid = userProfile?.qcidNo || "110000116932100"
        const email = userProfile?.email || "dimalmae@gmail.com"
        return (
          (a.referenceNumber === qcid || a.email === email) &&
          a.category === "PWD"
        )
      }

      // Check backend API first
      try {
        const res = await fetch(`${API_BASE}/api/pwd-senior/applications`)
        if (res.ok) {
          const apps = await res.json()
          if (Array.isArray(apps)) {
            const userApps = apps.filter(checkUserMatches)
            const pendingApp = userApps.find((a) => a.status === "pending")
            const approvedApp = userApps.find((a) => a.status === "approved")
            if (pendingApp) {
              currentAppStatus = "pending"
              matchedPending = pendingApp
            }
            if (approvedApp) matchedApproved = approvedApp
          }
        }
      } catch {}

      // Fallback check localStorage if backend unavailable
      if (!matchedApproved || !currentAppStatus) {
        try {
          const saved = localStorage.getItem("pwd_senior_applications")
          if (saved) {
            const apps = JSON.parse(saved)
            if (Array.isArray(apps)) {
              const userApps = apps.filter(checkUserMatches)
              const pendingApp = userApps.find((a) => a.status === "pending")
              const approvedApp = userApps.find((a) => a.status === "approved")
              if (!currentAppStatus && pendingApp) {
                currentAppStatus = "pending"
                matchedPending = pendingApp
              }
              if (!matchedApproved && approvedApp) matchedApproved = approvedApp
            }
          }
        } catch {}
      }

      setActiveAppStatus(currentAppStatus)
      if (matchedPending) {
        setBlockedApp(matchedPending)
      }

      if (matchedApproved && !matchedPending) {
        setLatestApprovedApp(matchedApproved)
        // When approved and no pending application, reset blocked or submitted states
        if (isBlocked || submitStatus === "submitted") {
          setIsBlocked(false)
          setSubmitStatus("idle")
          setStep(1)
        }
      } else if (!matchedApproved) {
        setLatestApprovedApp(null)
      }

      // Block if user has an active pending application
      if (!bypassedBlock && currentAppStatus === "pending") {
        setIsBlocked(true)
      } else {
        setIsBlocked(false)
      }
    }

    checkActiveApp()
    const interval = setInterval(checkActiveApp, 2000)
    return () => clearInterval(interval)
  }, [userProfile?.qcidNo, userProfile?.email, bypassedBlock, initialIdStatus, isBlocked, submitStatus])

  // Auto-redirect to pending status screen after 3 seconds on submitted
  useEffect(() => {
    if (submitStatus !== "submitted") return

    setRedirectCountdown(3)
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsBlocked(true)
          setSubmitStatus("idle")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [submitStatus])

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

  const updateField = (key: keyof FormData, value: string) => {
    if (key === "existingPwdIdNumber") {
      setIsIdVerified(false)
      setVerifyError(null)
      setApprovedPwdRecord(null)
    }
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  // handles the actual <input type="file"> change event
  const handleFileChange = (title: string, fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file) return
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|jfif|bmp|heic|heif)$/i.test(file.name)) {
      alert("Mga litrato o larawan (JPG, JPEG, PNG, WEBP) lamang ang maaaring i-upload. Bawal ang document/PDF file.")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          let width = img.width
          let height = img.height
          const maxDim = 1200
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            const compressed = canvas.toDataURL("image/jpeg", 0.75)
            setUploaded((prev) => ({
              ...prev,
              [title]: { file, previewUrl: compressed },
            }))
            return
          }
        } catch {}
        setUploaded((prev) => ({
          ...prev,
          [title]: { file, previewUrl: rawDataUrl },
        }))
      }
      img.src = rawDataUrl
    }
    reader.readAsDataURL(file)
  }

  const removeUploadedFile = (title: string) => {
    setUploaded((prev) => {
      const existing = prev[title]
      if (existing) URL.revokeObjectURL(existing.previewUrl)
      const next = { ...prev }
      delete next[title]
      return next
    })
  }

  const [isVerifying, setIsVerifying] = useState(false)
  const [isIdVerified, setIsIdVerified] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [approvedPwdRecord, setApprovedPwdRecord] = useState<any | null>(null)
  const [reasonForReplacement, setReasonForReplacement] = useState("")
  const [reasonForRenewal, setReasonForRenewal] = useState("")
  const [dontKnowId, setDontKnowId] = useState(false)

  // Function to fetch all PWD applications from Backend + LocalStorage
  const fetchAllPwdApps = async (): Promise<any[]> => {
    let allApps: any[] = []
    try {
      const res = await fetch(`${API_BASE}/api/pwd-senior/applications`)
      if (res.ok) {
        const apps = await res.json()
        if (Array.isArray(apps)) allApps = apps
      }
    } catch {}

    try {
      const saved = localStorage.getItem("pwd_senior_applications")
      if (saved) {
        const localApps = JSON.parse(saved)
        if (Array.isArray(localApps)) {
          const ids = new Set(allApps.map((a) => a.id))
          for (const la of localApps) {
            if (!ids.has(la.id)) allApps.push(la)
          }
        }
      }
    } catch {}

    return allApps
  }



  const handleVerifyId = async () => {
    setVerifyError(null)
    const typed = (formData.existingPwdIdNumber || "").trim()
    const cleanTyped = typed.replace(/[^a-z0-9]/gi, "").toLowerCase()
    const userQcid = (userProfile?.qcidNo || "110000116932100").trim().toLowerCase()
    const userEmail = (userProfile?.email || "dimalmae@gmail.com").trim().toLowerCase()

    if (!dontKnowId && !cleanTyped) {
      setVerifyError(t("pwdEnterIdPrompt") || "Please enter your PWD ID number before verifying.")
      return
    }

    setIsVerifying(true)
    try {
      const apps = await fetchAllPwdApps()

      // Hanapin ang tunay na PWD application / rehistradong PWD record sa system
      const matchedApp = apps.find((a) => {
        if (!a) return false
        const cat = (a.category || "").trim().toUpperCase()
        if (cat !== "PWD") return false

        // Ang record ay dapat nagmula sa valid application (approved o may assigned/reference number mula sa New App)
        const assignedClean = (a.assignedIdNumber || "").replace(/[^a-z0-9]/gi, "").toLowerCase()
        const refClean = (a.referenceNumber || "").replace(/[^a-z0-9]/gi, "").toLowerCase()
        const idClean = (a.id || "").replace(/[^a-z0-9]/gi, "").toLowerCase()
        const emailClean = (a.email || "").trim().toLowerCase()

        if (dontKnowId) {
          // Verify gamit ang QCID / email
          const qcidClean = userQcid.replace(/[^a-z0-9]/gi, "")
          return (
            (refClean !== "" && refClean === qcidClean) ||
            (assignedClean !== "" && assignedClean === qcidClean) ||
            (emailClean !== "" && emailClean === userEmail)
          )
        }

        // STRICT MATCHING: dapat tumutugma nang eksakto sa assigned ID o reference number o app ID
        const matchAssigned =
          assignedClean !== "" &&
          (cleanTyped === assignedClean ||
           cleanTyped === `pwd${assignedClean}` ||
           `pwd${cleanTyped}` === assignedClean)

        const matchRef =
          refClean !== "" &&
          (cleanTyped === refClean ||
           cleanTyped === `pwd${refClean}` ||
           `pwd${cleanTyped}` === refClean)

        const matchId = idClean !== "" && cleanTyped === idClean

        return Boolean(matchAssigned || matchRef || matchId)
      })

      if (matchedApp) {
        const officialId = matchedApp.assignedIdNumber || matchedApp.referenceNumber || formData.existingPwdIdNumber
        setIsIdVerified(true)
        setVerifyError(null)
        setApprovedPwdRecord(matchedApp)
        if (matchedApp.disabilityType) setDisabilityType(matchedApp.disabilityType)
        if (matchedApp.disabilityClass) setDisabilityClass(matchedApp.disabilityClass)
        setFormData((prev) => ({
          ...prev,
          existingPwdIdNumber: officialId,
          causeOfDisability: matchedApp.causeOfDisability || prev.causeOfDisability || "Acquired",
          specificDisability: matchedApp.specificDisability || prev.specificDisability || "Visual Impairment / Low Vision",
          pobCity: prev.pobCity || "QUEZON CITY",
          pobProvince: prev.pobProvince || "METRO MANILA",
          bloodType: prev.bloodType || "O+",
          permanentAddress: prev.permanentAddress || `${prev.addressHouseNo || ""} ${prev.addressStreet || ""}, ${prev.addressBarangay || ""}, ${prev.addressCity || ""}`.trim(),
          presentAddress: prev.presentAddress || `${prev.addressHouseNo || ""} ${prev.addressStreet || ""}, ${prev.addressBarangay || ""}, ${prev.addressCity || ""}`.trim(),
          emergencyLastName: prev.emergencyLastName || "DIMAL",
          emergencyFirstName: prev.emergencyFirstName || "ROBERTO",
          emergencyContactNo: prev.emergencyContactNo || "09171234567",
          emergencyRelationship: prev.emergencyRelationship || "Father",
          emergencyAddress: prev.emergencyAddress || `${prev.addressHouseNo || ""} ${prev.addressStreet || ""}, ${prev.addressBarangay || ""}, ${prev.addressCity || ""}`.trim(),
          heightCm: prev.heightCm || "160",
          weightKg: prev.weightKg || "52",
          colorOfHair: prev.colorOfHair || "Black",
          colorOfEyes: prev.colorOfEyes || "Brown",
          otherMarks: prev.otherMarks || "None",
        }))
      } else {
        // NO VALID PWD ID RECORD FOUND
        setIsIdVerified(false)
        setApprovedPwdRecord(null)
        setVerifyError(
          t("pwdNoRecordFoundDesc") ||
          "No existing PWD ID record found in the system for this number. Random or unregistered ID numbers are not allowed. You must have a registered New PWD ID application in the system before applying for Renewal or Replacement / Lost ID."
        )
      }
    } catch {
      setIsIdVerified(false)
      setVerifyError(t("pwdVerifyErrorGeneric") || "An error occurred while verifying the PWD ID. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const effectiveDisabilityClass =
    disabilityClass ||
    (disabilityType === "Physical Disability" || disabilityType === "Orthopedic Disability"
      ? "apparent"
      : "non-apparent")

  const step1Valid =
    isResident &&
    hasDisability &&
    idStatus !== null &&
    (idStatus === "loss"
      ? (dontKnowId || (formData.existingPwdIdNumber || "").trim() !== "") && isIdVerified && reasonForReplacement !== ""
      : idStatus === "renewal"
      ? (formData.existingPwdIdNumber || "").trim() !== "" && isIdVerified && reasonForRenewal !== ""
      : (disabilityType || "").trim() !== "")

  const step2Valid =
    (formData.firstName || "").trim() !== "" &&
    (formData.lastName || "").trim() !== "" &&
    Boolean(formData.dobMonth) &&
    Boolean(formData.dobDay) &&
    Boolean(formData.dobYear) &&
    (formData.addressHouseNo || "").trim() !== "" &&
    (formData.addressBarangay || "").trim() !== "" &&
    (formData.contactNo || "").trim().length === 11 &&
    (formData.bloodType || "").trim() !== "" &&
    (formData.permanentAddress || "").trim() !== "" &&
    (formData.emergencyLastName || "").trim() !== "" &&
    (formData.emergencyFirstName || "").trim() !== "" &&
    (formData.emergencyContactNo || "").trim().length === 11 &&
    (formData.emergencyRelationship || "").trim() !== "" &&
    (formData.emergencyAddress || "").trim() !== "" &&
    (formData.heightCm || "").trim() !== "" &&
    (formData.weightKg || "").trim() !== "" &&
    (formData.colorOfHair || "").trim() !== "" &&
    (formData.colorOfEyes || "").trim() !== "" &&
    (formData.causeOfDisability || "").trim() !== "" &&
    effectiveDisabilityClass !== null &&
    (disabilityType || "").trim() !== ""

  const requiredDocs =
    idStatus === "loss"
      ? REPLACEMENT_DOCS
      : [
          ...BASE_DOCS,
          ...(effectiveDisabilityClass === "apparent" ? APPARENT_DOCS : [NON_APPARENT_BASE_DOC]),
        ]
  const step3Valid = requiredDocs.every((doc) => !!uploaded[doc.title])

  const canGoNext =
    step === 1 ? step1Valid : step === 2 ? step2Valid : step === 3 ? step3Valid : true

  const goNext = () => {
    if (!canGoNext) {
      setAttemptedNext(true)
      return
    }
    setAttemptedNext(false)
    if (returnToReview) {
      setStep(4)
      setReturnToReview(false)
      return
    }
    setStep((s) => Math.min(s + 1, 4))
  }

  const goBack = () => {
    setAttemptedNext(false)
    if (step === 1) {
      onBack?.()
      return
    }
    setStep((s) => Math.max(s - 1, 1))
  }

  const handleConfirmSubmit = () => {
    setSubmitStatus("submitting")
    const refNum = generateReferenceNumber(userProfile?.qcidNo)

    try {
      const existing = JSON.parse(localStorage.getItem("pwd_senior_applications") || "[]")
      const newApp = {
        id: `APP-${Date.now()}`,
        submittedAt: new Date().toISOString(),
        referenceNumber: refNum,
        category: "PWD",
        type: idStatus === "renewal" ? "renewal" : idStatus === "loss" ? "replacement" : "new",
        firstName: formData.firstName || userProfile.firstName,
        middleName: formData.middleName || userProfile.middleName || "",
        lastName: formData.lastName || userProfile.lastName,
        suffix: formData.suffix || "",
        dateOfBirth: `${formData.dobYear || userProfile.dobYear || "2000"}-${(formData.dobMonth || userProfile.dobMonth || "01").padStart(2, "0")}-${(formData.dobDay || userProfile.dobDay || "01").padStart(2, "0")}`,
        age: formData.age || userProfile.age || "21",
        sex: formData.sex || userProfile.sex || "Female",
        civilStatus: formData.civilStatus || userProfile.civilStatus || "Single",
        contactNo: (formData.contactNo || userProfile.contactNo || "09171234567").replace(/\s+/g, ""),
        cellphoneNo: (formData.contactNo || userProfile.contactNo || "09171234567").replace(/\s+/g, ""),
        email: formData.email || userProfile.email || "applicant@example.com",
        address: `${formData.addressHouseNo || userProfile.addressHouseNo || ""} ${formData.addressStreet || userProfile.addressStreet || ""} ${formData.addressBarangay || userProfile.addressBarangay || ""}, QUEZON CITY`.trim(),
        disabilityType: disabilityType || "Visual Disability",
        disabilityClass: effectiveDisabilityClass || "apparent",
        causeOfDisability: formData.causeOfDisability || "Congenital / Inborn",
        applyingFor: "myself",
        emergencyFirstName: formData.emergencyFirstName || userProfile?.emergencyFirstName || "Clarence",
        emergencyLastName: formData.emergencyLastName || userProfile?.emergencyLastName || "Millares",
        emergencyMiddleName: formData.emergencyMiddleName || "",
        emergencyName: `${formData.emergencyFirstName || userProfile?.emergencyFirstName || "Clarence"} ${formData.emergencyLastName || userProfile?.emergencyLastName || "Millares"}`.trim(),
        emergencyContactNo: formData.emergencyContactNo || userProfile?.emergencyContactNo || "09151312123",
        emergencyRelationship: formData.emergencyRelationship || userProfile?.emergencyRelationship || "Guardian",
        emergencyAddress: formData.emergencyAddress || userProfile?.emergencyAddress || "Quezon City",
        documents: Object.keys(uploaded).map((k) => ({
          name: k,
          filename: uploaded[k]?.file.name || "doc.jpg",
          fileUrl: uploaded[k]?.previewUrl,
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
      console.error("Failed saving application to localStorage:", e)
    }

    window.setTimeout(() => {
      setReferenceNumber(refNum)
      setSubmitStatus("submitted")
    }, 1200)
  }

  // ---- APPROVED state (Bungad bago mag Step 1) ----
  if (latestApprovedApp && (!initialIdStatus || initialIdStatus === "new") && !bypassedBlock) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 animate-in fade-in duration-300">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            ← Bumalik
          </button>
        )}
        <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-6 sm:p-8 shadow-md flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md ring-8 ring-emerald-50">
            <Check className="h-8 w-8 stroke-[3]" />
          </div>

          <div className="space-y-1.5 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              ✓ APPROVED APPLICATION
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {t("pwdAppApprovedTitle") || "Aprubado na ang Iyong Aplikasyon sa PWD ID"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {t("pwdAppApprovedDesc") || "Binabati kita! Ang iyong aplikasyon para sa PWD ID ay opisyal nang nasuri at naaprubahan ng Social Services Development Department."}
            </p>
          </div>

          {/* Details Card */}
          <div className="w-full bg-linear-to-br from-emerald-50/70 to-slate-50 border border-emerald-200 rounded-xl p-4 sm:p-5 text-left space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-emerald-100 pb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t("officialIdNumberLabel") || "Opisyal na PWD ID Number"}
              </span>
              <span className="font-mono font-black text-base text-emerald-950 tracking-wider bg-white px-3 py-1 rounded-lg border border-emerald-300 select-all shadow-2xs">
                {latestApprovedApp.assignedIdNumber || latestApprovedApp.referenceNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block">Pangalan ng Aplikante:</span>
                <span className="font-bold text-gray-900 text-sm">
                  {[latestApprovedApp.firstName, latestApprovedApp.middleName, latestApprovedApp.lastName].filter(Boolean).join(" ")}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Disability Type:</span>
                <span className="font-bold text-gray-900 text-sm">
                  {latestApprovedApp.disabilityType || "Visual Disability"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">{t("dateApprovedLabel") || "Petsa ng Pag-apruba"}:</span>
                <span className="font-semibold text-emerald-900">
                  {latestApprovedApp.approvedDate || (latestApprovedApp.updatedAt ? new Date(latestApprovedApp.updatedAt).toLocaleDateString() : "Active")}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Aktibo / Rehistrado
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 w-full justify-center">
            <a
              href="/portal/my-applications"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              <span>{t("viewInMyApplications") || "Tingnan sa My Applications"}</span>
            </a>
            <a
              href="/portal/apply-pwd-senior?category=pwd&type=renewal"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Mag-apply para sa Renewal</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setBypassedBlock(true)
                setStep(1)
              }}
              className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
            >
              Buksan ang Form
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isBlocked && !bypassedBlock) {
    const serviceTitle =
      initialIdStatus === "renewal"
        ? "Renewal PWD ID"
        : initialIdStatus === "loss"
        ? "Replacement / Lost PWD ID"
        : "New App PWD ID"

    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4 animate-in fade-in duration-150">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Info className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {t("hasPendingAppTitle") || "You Have an Active Application"}
            </h2>
            <p className="text-sm text-gray-500 max-w-md mt-1 leading-relaxed">
              Your application for {serviceTitle} has been successfully submitted and is currently pending review. Please wait for a Social Worker's assessment before submitting a new application.
            </p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-gray-500 font-medium">{t("appRefNoLabel") || "Application Reference No.:"}</span>
              <span className="font-mono font-bold text-blue-600">
                {blockedApp?.referenceNumber || blockedApp?.reference_no || userProfile?.qcidNo || "110000572516915"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-gray-500 font-medium">{t("appStatusLabel") || "Status:"}</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                {t("statusPendingBadge") || "Under Review (Pending)"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">{t("dateFiledLabel") || "Date Filed:"}</span>
              <span className="font-semibold text-gray-700">
                {blockedApp?.submittedAt
                  ? new Date(blockedApp.submittedAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
                  : new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>

          <div className="w-full pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/portal/my-applications"
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs uppercase tracking-wide"
            >
              {t("viewMyApplications") || "VIEW IN MY APPLICATIONS"}
            </button>
            <button
              type="button"
              onClick={() => {
                setBypassedBlock(true)
                setIsBlocked(false)
                setStep(1)
              }}
              className="w-full py-2 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-colors cursor-pointer"
            >
              Magsumite ng Ibang Aplikasyon / Buksan ang Form
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- SUBMITTING state ----
  if (submitStatus === "submitting") {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center">
            <div className="h-7 w-7 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{t("pwdSubmittingTitle")}</h2>
          <p className="text-sm text-muted-foreground max-w-sm">{t("submittingApplicationDesc")}</p>
        </div>
      </div>
    )
  }

  // ---- SUBMITTED / SUCCESS state ----
  if (submitStatus === "submitted") {
    const fullApplicantName = [formData.firstName, formData.middleName, formData.lastName, formData.suffix]
      .filter(Boolean)
      .join(" ")

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
              Ang inyong Persons with Disability (PWD) ID application ay matagumpay na naisumite at kasalukuyang sinusuri.
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
              <span className="font-semibold text-foreground">Persons with Disability (PWD) ID</span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">Application Type:</span>
              <span className="font-semibold text-foreground uppercase">
                {idStatus === "renewal" ? "Renewal" : "Bagong PWD ID"}
              </span>
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
        <div className="flex gap-2 border-b border-border bg-gray-50 p-2">
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

        {/* Step content */}
        <div className="p-6 min-h-90">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground">{t("pwdChecklistHeader").toUpperCase()}</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isResident}
                      onChange={(e) => setIsResident(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span className={`text-sm ${attemptedNext && !isResident ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                      {t("pwdResidentQuestion")} <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {attemptedNext && !isResident && (
                    <p className="text-xs text-red-500 mt-1 ml-6">{t("pwdCheckboxRequiredNote")}</p>
                  )}
                </div>
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasDisability}
                      onChange={(e) => setHasDisability(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span className={`text-sm ${attemptedNext && !hasDisability ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                      {t("pwdHasDisabilityQuestion")} <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {attemptedNext && !hasDisability && (
                    <p className="text-xs text-red-500 mt-1 ml-6">{t("pwdCheckboxRequiredNote")}</p>
                  )}
                </div>
              </div>

              {initialIdStatus ? (
                <div>
                  {initialIdStatus === "renewal" ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900">RENEWAL NG PWD ID</p>
                          <p className="text-xs text-amber-700 mt-0.5">{t("pwdRenewalNote")}</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-blue-200 space-y-3">
                        <div className="flex justify-between items-center">
                          <label className={`block text-xs font-semibold ${attemptedNext && (!(formData.existingPwdIdNumber || "").trim() || !isIdVerified) ? "text-red-600" : "text-foreground"}`}>
                            {t("pwdExistingIdLabel")} <span className="text-red-500">*</span>
                          </label>
                          {isIdVerified && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                              <Check className="w-3.5 h-3.5" /> PWD ID Verified
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <TextInput
                            prefix="PWD-"
                            isPwdIdMask
                            value={formData.existingPwdIdNumber}
                            onChange={(v) => {
                              updateField("existingPwdIdNumber", v)
                              updateField("hasExistingPwdId", t("yes"))
                              setIsIdVerified(false)
                            }}
                            placeholder="137404-2026-847708"
                            invalid={attemptedNext && (!(formData.existingPwdIdNumber || "").trim() || !isIdVerified)}
                          />
                          <button
                            type="button"
                            onClick={handleVerifyId}
                            disabled={!(formData.existingPwdIdNumber || "").trim() || isVerifying}
                            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                          >
                            {isVerifying ? (
                              <>
                                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
<Check className="w-3.5 h-3.5" />
                                <span>VERIFY PWD ID</span>
                              </>
                            )}
                          </button>
                        </div>
                        {verifyError && (
                          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in duration-200">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-red-900">{t("pwdNoRecordFoundTitle") || "NO APPROVED PWD ID RECORD FOUND"}</p>
                              <p className="mt-0.5 leading-relaxed">{verifyError}</p>
                              <p className="mt-1 text-red-700 font-semibold">{t("pwdRenewalReminder") || "Reminder: You must first register and get approved for a \"New App PWD ID\" before applying for Renewal."}</p>
                            </div>
                          </div>
                        )}

                        {attemptedNext && (!(formData.existingPwdIdNumber || "").trim() || !isIdVerified) && !verifyError && (
                          <p className="text-xs text-red-500">
                            {!(formData.existingPwdIdNumber || "").trim()
                              ? t("pwdFieldRequiredNote") || "Required"
                              : "Click VERIFY PWD ID and ensure your record is verified before proceeding."}
                          </p>
                        )}

                        {isIdVerified && (
                          <div className="space-y-3 animate-in fade-in duration-200">
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                                <Check className="h-4 w-4 text-emerald-600" />
                                <span>PWD ID verified.</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-emerald-950 pt-1">
                                <div>
                                  <span className="text-emerald-700 block">Name:</span>
                                  <span className="font-semibold text-sm">{formData.firstName} {formData.middleName ? `${formData.middleName} ` : ""}{formData.lastName}</span>
                                </div>
                                <div>
                                  <span className="text-emerald-700 block">Disability Type:</span>
                                  <span className="font-semibold text-sm">{disabilityType || "Visual Disability"}</span>
                                </div>
                                <div>
                                  <span className="text-emerald-700 block">PWD ID Status:</span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-0.5 ${
                                    activeAppStatus === "pending" || approvedPwdRecord?.status === "pending"
                                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  }`}>
                                    {activeAppStatus === "pending" || approvedPwdRecord?.status === "pending" ? "Pending" : "Active"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-blue-100 space-y-2">
                              <label className={`block text-xs font-semibold ${attemptedNext && !reasonForRenewal ? "text-red-600 font-semibold" : "text-foreground"}`}>
                                Reason for Renewal <span className="text-red-500">*</span>
                              </label>
                              <div className="flex flex-wrap items-center gap-6 pt-1">
                                {[
                                  { label: "Expired ID", value: "Expired ID" },
                                  { label: "Updating Personal Information", value: "Updating Personal Information" },
                                  { label: "Damaged ID", value: "Damaged ID" },
                                ].map((opt) => (
                                  <label key={opt.value} className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                                    <input
                                      type="radio"
                                      name="pwdRenewalReasonInitial"
                                      value={opt.value}
                                      checked={reasonForRenewal === opt.value}
                                      onChange={() => setReasonForRenewal(opt.value)}
                                      className="h-4 w-4 text-blue-600 accent-blue-600 cursor-pointer"
                                    />
                                    <span>{opt.label}</span>
                                  </label>
                                ))}
                              </div>
                              {attemptedNext && !reasonForRenewal && (
                                <p className="text-xs text-red-500 mt-1">Pumili ng dahilan ng renewal.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : initialIdStatus === "loss" ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-orange-600" />
                        <div>
                          <p className="text-sm font-semibold text-orange-900">REPLACEMENT / LOST PWD ID</p>
                          <p className="text-xs text-orange-700 mt-0.5">
                            Aplikasyon para sa Nawala o Nasirang PWD ID. I-verify ang inyong existing PWD record.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-blue-200 space-y-3">
                        <div className="flex justify-between items-center">
                          <label className={`block text-xs font-semibold ${attemptedNext && !isIdVerified ? "text-red-600" : "text-foreground"}`}>
                            {t("pwdExistingIdLabel")} {!dontKnowId && <span className="text-red-500">*</span>}
                          </label>
                          {isIdVerified && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                              <Check className="w-3.5 h-3.5" /> PWD ID Verified
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <TextInput
                            prefix={dontKnowId ? undefined : "PWD-"}
                            isPwdIdMask={!dontKnowId}
                            value={formData.existingPwdIdNumber}
                            onChange={(v) => {
                              updateField("existingPwdIdNumber", v)
                              updateField("hasExistingPwdId", t("yes"))
                              setIsIdVerified(false)
                            }}
                            placeholder={dontKnowId ? "Gamitin ang QC ID Profile para i-verify" : "137404-2026-847708"}
                            disabled={dontKnowId}
                            invalid={attemptedNext && !dontKnowId && (!(formData.existingPwdIdNumber || "").trim() || !isIdVerified)}
                          />
                          <button
                            type="button"
                            onClick={handleVerifyId}
                            disabled={(!dontKnowId && !(formData.existingPwdIdNumber || "").trim()) || isVerifying}
                            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                          >
                            {isVerifying ? (
                              <>
                                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>VERIFY PWD ID</span>
                              </>
                            )}
                          </button>
                        </div>

                        <label className="flex items-center gap-2 text-xs text-blue-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={dontKnowId}
                            onChange={(e) => {
                              setDontKnowId(e.target.checked)
                              setIsIdVerified(false)
                            }}
                            className="h-3.5 w-3.5 rounded border-border accent-blue-600 cursor-pointer"
                          />
                          <span>Hindi alam ang PWD ID number (Gamitin ang QC ID / personal information para i-verify)</span>
                        </label>

                        <div className="pt-2 border-t border-blue-100">
                          <label className={`block text-xs font-semibold ${attemptedNext && reasonForReplacement === "" ? "text-red-600" : "text-foreground"} mb-1.5`}>
                            Reason for Replacement <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="pwdReplacementReason"
                                value="Lost"
                                checked={reasonForReplacement === "Lost"}
                                onChange={() => setReasonForReplacement("Lost")}
                                className="accent-blue-600 cursor-pointer"
                              />
                              <span className="text-xs font-medium text-foreground">Lost / Nawala</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="pwdReplacementReason"
                                value="Damaged"
                                checked={reasonForReplacement === "Damaged"}
                                onChange={() => setReasonForReplacement("Damaged")}
                                className="accent-blue-600 cursor-pointer"
                              />
                              <span className="text-xs font-medium text-foreground">Damaged / Nasira</span>
                            </label>
                          </div>
                          {attemptedNext && reasonForReplacement === "" && (
                            <p className="text-xs text-red-500 mt-1">Pumili ng dahilan ng pagpapalit (Lost o Damaged).</p>
                          )}
                        </div>

                        {verifyError && (
                          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in duration-200">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-red-900">{t("pwdNoRecordFoundTitle") || "NO APPROVED PWD ID RECORD FOUND"}</p>
                              <p className="mt-0.5 leading-relaxed">{verifyError}</p>
                              <p className="mt-1 text-red-700 font-semibold">{t("pwdLossReminder") || "Reminder: You must first register and get approved for a \"New App PWD ID\" before applying for Replacement / Lost ID."}</p>
                            </div>
                          </div>
                        )}

                        {attemptedNext && !isIdVerified && !verifyError && (
                          <p className="text-xs text-red-500">
                            {!dontKnowId && !(formData.existingPwdIdNumber || "").trim()
                              ? t("pwdFieldRequiredNote") || "Required"
                              : "Click VERIFY PWD ID and ensure your record is verified before proceeding."}
                          </p>
                        )}

                        {isIdVerified && (
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                              <Check className="h-4 w-4 text-emerald-600" />
                              <span>PWD ID verified.</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-emerald-950 pt-1">
                              <div>
                                <span className="text-emerald-700 block">Name:</span>
                                <span className="font-semibold text-sm">{formData.firstName} {formData.middleName ? `${formData.middleName} ` : ""}{formData.lastName}</span>
                              </div>
                              <div>
                                <span className="text-emerald-700 block">Disability Type:</span>
                                <span className="font-semibold text-sm">{disabilityType || "Visual Disability"}</span>
                              </div>
                              <div>
                                <span className="text-emerald-700 block">PWD ID Status:</span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-0.5 ${
                                  activeAppStatus === "pending" || approvedPwdRecord?.status === "pending"
                                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                }`}>
                                  {activeAppStatus === "pending" || approvedPwdRecord?.status === "pending" ? "Pending" : "Active"}
                                </span>
                              </div>
                              <div>
                                <span className="text-emerald-700 block">Reason:</span>
                                <span className="font-semibold text-sm">{reasonForReplacement === "Damaged" ? "Damaged / Nasira" : "Lost / Nawala"}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">BAGONG APLIKASYON PARA SA PWD ID</p>
                        <p className="text-xs text-blue-700 mt-0.5">{t("pwdNewApplicationNote")}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className={`text-sm mb-2 ${attemptedNext && idStatus === null ? "text-red-600 font-semibold" : "text-foreground"}`}>
                    {t("pwdIdStatusQuestion")} <span className="text-red-500">*</span>
                  </p>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="idStatus"
                        checked={idStatus === "renewal"}
                        onChange={() => {
                          setIdStatus("renewal")
                          updateField("hasExistingPwdId", t("yes"))
                          setIsIdVerified(false)
                        }}
                      />
                      <span className={`text-sm ${idStatus === "renewal" ? "font-semibold text-blue-700" : "text-blue-700"}`}>
                        {t("pwdRenewalOption")}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="idStatus"
                        checked={idStatus === "loss"}
                        onChange={() => {
                          setIdStatus("loss")
                          updateField("hasExistingPwdId", t("yes"))
                          setIsIdVerified(false)
                        }}
                      />
                      <span className={`text-sm ${idStatus === "loss" ? "font-semibold text-blue-700" : "text-blue-700"}`}>
                        Replacement / Lost ID
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="idStatus"
                        checked={idStatus === "new"}
                        onChange={() => {
                          setIdStatus("new")
                          updateField("hasExistingPwdId", t("no"))
                          updateField("existingPwdIdNumber", "")
                          setIsIdVerified(false)
                        }}
                      />
                      <span className={`text-sm ${idStatus === "new" ? "font-semibold text-blue-700" : "text-blue-700"}`}>
                        {t("pwdNewApplicationOption")}
                      </span>
                    </label>
                  </div>
                  {attemptedNext && idStatus === null && (
                    <p className="text-xs text-red-500 mt-1">{t("pwdChooseOneNote")}</p>
                  )}

                  {idStatus && (
                    <div className="mt-3 space-y-3">
                      {idStatus === "renewal" && (
                        <div className="p-4 rounded-lg bg-slate-50 border border-blue-200 space-y-3">
                          <div className="flex justify-between items-center">
                            <label className={`block text-xs font-semibold ${attemptedNext && (!(formData.existingPwdIdNumber || "").trim() || !isIdVerified) ? "text-red-600" : "text-foreground"}`}>
                              {t("pwdExistingIdLabel")} <span className="text-red-500">*</span>
                            </label>
                            {isIdVerified && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                <Check className="w-3.5 h-3.5" /> PWD ID Verified
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <TextInput
                              prefix="PWD-"
                              isPwdIdMask
                              value={formData.existingPwdIdNumber}
                              onChange={(v) => {
                                updateField("existingPwdIdNumber", v)
                                updateField("hasExistingPwdId", t("yes"))
                                setIsIdVerified(false)
                              }}
                              placeholder="137404-2026-847708"
                              invalid={attemptedNext && (!(formData.existingPwdIdNumber || "").trim() || !isIdVerified)}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyId}
                              disabled={!(formData.existingPwdIdNumber || "").trim() || isVerifying}
                              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                            >
                              {isVerifying ? (
                                <>
                                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Verifying...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>VERIFY PWD ID</span>
                                </>
                              )}
                            </button>
                          </div>
                          {verifyError && (
                            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in duration-200">
                              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-red-900">{t("pwdNoRecordFoundTitle") || "NO APPROVED PWD ID RECORD FOUND"}</p>
                                <p className="mt-0.5 leading-relaxed">{verifyError}</p>
                                <p className="mt-1 text-red-700 font-semibold">{t("pwdRenewalReminder") || "Reminder: You must first register and get approved for a \"New App PWD ID\" before applying for Renewal."}</p>
                              </div>
                            </div>
                          )}

                          {attemptedNext && (!(formData.existingPwdIdNumber || "").trim() || !isIdVerified) && !verifyError && (
                            <p className="text-xs text-red-500">
                              {!(formData.existingPwdIdNumber || "").trim()
                                ? t("pwdFieldRequiredNote") || "Required"
                                : "Click VERIFY PWD ID and ensure your record is verified before proceeding."}
                            </p>
                          )}

                          {isIdVerified && (
                            <div className="space-y-3 animate-in fade-in duration-200">
                              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                                  <Check className="h-4 w-4 text-emerald-600" />
                                  <span>PWD ID verified.</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-emerald-950 pt-1">
                                  <div>
                                    <span className="text-emerald-700 block">Name:</span>
                                    <span className="font-semibold text-sm">{formData.firstName} {formData.middleName ? `${formData.middleName} ` : ""}{formData.lastName}</span>
                                  </div>
                                  <div>
                                    <span className="text-emerald-700 block">Disability Type:</span>
                                    <span className="font-semibold text-sm">{disabilityType || "Visual Disability"}</span>
                                  </div>
                                  <div>
                                    <span className="text-emerald-700 block">PWD ID Status:</span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-0.5 ${
                                      activeAppStatus === "pending" || approvedPwdRecord?.status === "pending"
                                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    }`}>
                                      {activeAppStatus === "pending" || approvedPwdRecord?.status === "pending" ? "Pending" : "Active"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-blue-100 space-y-2">
                                <label className={`block text-xs font-semibold ${attemptedNext && !reasonForRenewal ? "text-red-600 font-semibold" : "text-foreground"}`}>
                                  Reason for Renewal <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-wrap items-center gap-6 pt-1">
                                  {[
                                    { label: "Expired ID", value: "Expired ID" },
                                    { label: "Updating Personal Information", value: "Updating Personal Information" },
                                    { label: "Damaged ID", value: "Damaged ID" },
                                  ].map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                                      <input
                                        type="radio"
                                        name="pwdRenewalReason"
                                        value={opt.value}
                                        checked={reasonForRenewal === opt.value}
                                        onChange={() => setReasonForRenewal(opt.value)}
                                        className="h-4 w-4 text-blue-600 accent-blue-600 cursor-pointer"
                                      />
                                      <span>{opt.label}</span>
                                    </label>
                                  ))}
                                </div>
                                {attemptedNext && !reasonForRenewal && (
                                  <p className="text-xs text-red-500 mt-1">Pumili ng dahilan ng renewal.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {idStatus === "loss" && (
                        <div className="p-4 rounded-lg bg-slate-50 border border-blue-200 space-y-3">
                          <div className="flex justify-between items-center">
                            <label className={`block text-xs font-semibold ${attemptedNext && !isIdVerified ? "text-red-600" : "text-foreground"}`}>
                              {t("pwdExistingIdLabel")} {!dontKnowId && <span className="text-red-500">*</span>}
                            </label>
                            {isIdVerified && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                <Check className="w-3.5 h-3.5" /> PWD ID Verified
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <TextInput
                              prefix={dontKnowId ? undefined : "PWD-"}
                              isPwdIdMask={!dontKnowId}
                              value={formData.existingPwdIdNumber}
                              onChange={(v) => {
                                updateField("existingPwdIdNumber", v)
                                updateField("hasExistingPwdId", t("yes"))
                                setIsIdVerified(false)
                              }}
                              placeholder={dontKnowId ? "Gamitin ang QC ID Profile para i-verify" : "137404-2026-847708"}
                              disabled={dontKnowId}
                              invalid={attemptedNext && !dontKnowId && (!(formData.existingPwdIdNumber || "").trim() || !isIdVerified)}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyId}
                              disabled={(!dontKnowId && !(formData.existingPwdIdNumber || "").trim()) || isVerifying}
                              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                            >
                              {isVerifying ? (
                                <>
                                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Verifying...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>VERIFY PWD ID</span>
                                </>
                              )}
                            </button>
                          </div>

                          <label className="flex items-center gap-2 text-xs text-blue-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={dontKnowId}
                              onChange={(e) => {
                                setDontKnowId(e.target.checked)
                                setIsIdVerified(false)
                              }}
                              className="h-3.5 w-3.5 rounded border-border accent-blue-600 cursor-pointer"
                            />
                            <span>Hindi alam ang PWD ID number (Gamitin ang QC ID / personal information para i-verify)</span>
                          </label>

                          <div className="pt-2 border-t border-blue-100">
                            <label className={`block text-xs font-semibold ${attemptedNext && reasonForReplacement === "" ? "text-red-600" : "text-foreground"} mb-1.5`}>
                              Reason for Replacement <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="pwdReplacementReasonModal"
                                  value="Lost"
                                  checked={reasonForReplacement === "Lost"}
                                  onChange={() => setReasonForReplacement("Lost")}
                                  className="accent-blue-600 cursor-pointer"
                                />
                                <span className="text-xs font-medium text-foreground">Lost / Nawala</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="pwdReplacementReasonModal"
                                  value="Damaged"
                                  checked={reasonForReplacement === "Damaged"}
                                  onChange={() => setReasonForReplacement("Damaged")}
                                  className="accent-blue-600 cursor-pointer"
                                />
                                <span className="text-xs font-medium text-foreground">Damaged / Nasira</span>
                              </label>
                            </div>
                            {attemptedNext && reasonForReplacement === "" && (
                              <p className="text-xs text-red-500 mt-1">Pumili ng dahilan ng pagpapalit (Lost o Damaged).</p>
                            )}
                          </div>

                          {verifyError && (
                            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in duration-200">
                              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-red-900">{t("pwdNoRecordFoundTitle") || "NO APPROVED PWD ID RECORD FOUND"}</p>
                                <p className="mt-0.5 leading-relaxed">{verifyError}</p>
                                <p className="mt-1 text-red-700 font-semibold">{t("pwdLossReminder") || "Reminder: You must first register and get approved for a \"New App PWD ID\" before applying for Replacement / Lost ID."}</p>
                              </div>
                            </div>
                          )}

                          {attemptedNext && !isIdVerified && !verifyError && (
                            <p className="text-xs text-red-500">
                              {!dontKnowId && !(formData.existingPwdIdNumber || "").trim()
                                ? t("pwdFieldRequiredNote") || "Required"
                                : "Click VERIFY PWD ID and ensure your record is verified before proceeding."}
                            </p>
                          )}

                          {isIdVerified && (
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in fade-in duration-200">
                              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                                <Check className="h-4 w-4 text-emerald-600" />
                                <span>PWD ID verified.</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-emerald-950 pt-1">
                                <div>
                                  <span className="text-emerald-700 block">Name:</span>
                                  <span className="font-semibold text-sm">{formData.firstName} {formData.middleName ? `${formData.middleName} ` : ""}{formData.lastName}</span>
                                </div>
                                <div>
                                  <span className="text-emerald-700 block">Disability Type:</span>
                                  <span className="font-semibold text-sm">{disabilityType || "Visual Disability"}</span>
                                </div>
                                <div>
                                  <span className="text-emerald-700 block">PWD ID Status:</span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-0.5 ${
                                    activeAppStatus === "pending" || approvedPwdRecord?.status === "pending"
                                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  }`}>
                                    {activeAppStatus === "pending" || approvedPwdRecord?.status === "pending" ? "Pending" : "Active"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-emerald-700 block">Reason:</span>
                                  <span className="font-semibold text-sm">{reasonForReplacement === "Damaged" ? "Damaged / Nasira" : "Lost / Nawala"}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {idStatus !== "renewal" && idStatus !== "loss" && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">{t("pwdDisabilityTypeHeader").toUpperCase()}</p>
                  <label className={`text-xs mb-2 block ${attemptedNext && disabilityType === "" ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                    {t("pwdChooseDisabilityType")} **
                  </label>
                  <div className="relative">
                    <select
                      value={disabilityType}
                      onChange={(e) => {
                        const val = e.target.value
                        setDisabilityType(val)
                        const isApparent = val === "Physical Disability" || val === "Orthopedic Disability"
                        setDisabilityClass(isApparent ? "apparent" : "non-apparent")
                      }}
                      className={`w-full appearance-none border bg-white rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 ${
                        attemptedNext && disabilityType === ""
                          ? "border-red-400 focus:ring-red-300 bg-red-50"
                          : "border-blue-200 focus:ring-blue-400"
                      }`}
                    >
                      <option value="" disabled>
                        {t("pwdSelectDisabilityType")}
                      </option>
                      {DISABILITY_TYPES.map((ty) => (
                        <option key={ty} value={ty}>
                          {ty}
                        </option>
                      ))}
                    </select>
                  </div>
                  {attemptedNext && disabilityType === "" && (
                    <p className="text-xs text-red-500 mt-1">{t("pwdDisabilityTypeRequiredNote")}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — PWD Personal Information Form */}
          {step === 2 && (
            <div className="space-y-6">
              {(idStatus === "renewal" || idStatus === "loss") && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800">
                      {idStatus === "loss" ? "REPLACEMENT / LOST PWD ID — ID Reference" : "RENEWAL — ID Reference"}
                    </p>
                    <p className="text-amber-700 mt-0.5">
                      PWD ID Number: <span className="font-bold">{formData.existingPwdIdNumber || "Verified"}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* IMPORTANT REMINDER BOX */}
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-600">{t("importantReminder").toUpperCase()}</p>
                  <p className="text-blue-600/90 mt-0.5">
                    {t("qcidReminderNote")}
                  </p>
                </div>
              </div>

              {/* Applicant QCID Profile Information Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={`${t("qcIdLabel")} *`}>
                    <LockedField value={userProfile?.qcidNo || "110000116932100"} />
                  </Field>
                  <Field label={`${t("firstNameLabel")} *`}>
                    <LockedField value={formData.firstName || "CLARISA MAE"} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label={t("middleNameLabel")}>
                    <LockedField value={formData.middleName || "GALIAS"} placeholder="—" />
                  </Field>
                  <Field label={`${t("lastNameLabel")} *`}>
                    <LockedField value={formData.lastName || "DIMAL"} />
                  </Field>
                  <Field label={t("suffixLabel")}>
                    <LockedField value={formData.suffix || ""} placeholder={t("suffixLabel")} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label={`${t("nationalityLabel")} *`}>
                    <LockedField value={formData.citizenship || "FILIPINO"} />
                  </Field>
                  <Field label={`${t("birthDateLabel")} *`}>
                    <LockedField
                      value={
                        formData.dobMonth && formData.dobDay && formData.dobYear
                          ? `${formData.dobMonth}/${formData.dobDay}/${formData.dobYear}`
                          : "10/29/2004"
                      }
                    />
                  </Field>
                  <Field label={`${t("ageLabel")} *`}>
                    <LockedField value={formData.age || "21"} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label={`${t("genderLabel")} *`}>
                    <LockedField value={formData.sex || "Female"} />
                  </Field>
                  <Field label={`${t("civilStatusLabel")} *`}>
                    <LockedField value={formData.civilStatus || "Single"} />
                  </Field>
                  <Field label={`${t("houseNumberLabel")} *`}>
                    <LockedField value={formData.addressHouseNo || "11"} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label={`${t("streetNameLabel")} *`}>
                    <LockedField value={formData.addressStreet || "OLD CABUYAO SAMPALOK ST"} />
                  </Field>
                  <Field label={`${t("barangayLabel")} *`}>
                    <LockedField value={formData.addressBarangay || "Sauyo"} />
                  </Field>
                  <Field label={`${t("pwdContactNoLabel")} *`}>
                    <LockedField value={formData.contactNo || userProfile?.contactNo || "09XXXXXXXXX"} />
                  </Field>
                </div>

                <Field label={`${t("emailLabel")} *`}>
                  <LockedField value={formData.email || userProfile?.email || "espelitadanny@gmail.com"} />
                </Field>
              </div>

              {/* Additional personal fields */}
              <div className="space-y-4 border-t border-border pt-6">
                <SectionHeader title={t("personalInfoSectionTitle").toUpperCase()} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t("pwdPobCityLabel")}>
                    <TextInput value={formData.pobCity} onChange={(v) => updateField("pobCity", v)} placeholder="City / Municipality" />
                  </Field>
                  <Field label={t("pwdPobProvinceLabel")}>
                    <TextInput value={formData.pobProvince} onChange={(v) => updateField("pobProvince", v)} placeholder="Province" />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label={t("pwdBloodTypeLabel")}
                    required
                    invalid={attemptedNext && (formData.bloodType || "").trim() === ""}
                    invalidNote="Required"
                  >
                    <TextInput
                      value={formData.bloodType}
                      onChange={(v) => updateField("bloodType", v)}
                      placeholder="e.g. O+, A+, B+"
                      invalid={attemptedNext && (formData.bloodType || "").trim() === ""}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label={t("pwdPermanentAddressLabel")}
                    required
                    invalid={attemptedNext && (formData.permanentAddress || "").trim() === ""}
                    invalidNote="Required"
                  >
                    <TextInput
                      value={formData.permanentAddress}
                      onChange={(v) => updateField("permanentAddress", v)}
                      placeholder="Permanent Address"
                      invalid={attemptedNext && (formData.permanentAddress || "").trim() === ""}
                    />
                  </Field>
                  <Field label={t("pwdPresentAddressLabel")}>
                    <TextInput value={formData.presentAddress} onChange={(v) => updateField("presentAddress", v)} placeholder="Present Address (kung iba sa permanent)" />
                  </Field>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <SectionHeader title={t("pwdEmergencyContactLabel").toUpperCase()} />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Field
                    label={t("lastNameLabel")}
                    required
                    invalid={attemptedNext && (formData.emergencyLastName || "").trim() === ""}
                    invalidNote="Required"
                  >
                    <TextInput
                      value={formData.emergencyLastName}
                      onChange={(v) => updateField("emergencyLastName", v)}
                      invalid={attemptedNext && (formData.emergencyLastName || "").trim() === ""}
                    />
                  </Field>
                  <Field
                    label={t("firstNameLabel")}
                    required
                    invalid={attemptedNext && (formData.emergencyFirstName || "").trim() === ""}
                    invalidNote="Required"
                  >
                    <TextInput
                      value={formData.emergencyFirstName}
                      onChange={(v) => updateField("emergencyFirstName", v)}
                      invalid={attemptedNext && (formData.emergencyFirstName || "").trim() === ""}
                    />
                  </Field>
                  <Field
                    label={t("pwdContactNoLabel")}
                    required
                    invalid={attemptedNext && (formData.emergencyContactNo || "").trim().length !== 11}
                    invalidNote="11 digits required (09XXXXXXXXX)"
                  >
                    <TextInput
                      value={formData.emergencyContactNo}
                      onChange={(v) => updateField("emergencyContactNo", v)}
                      placeholder="09XXXXXXXXX"
                      numbersOnly
                      maxLength={11}
                      invalid={attemptedNext && (formData.emergencyContactNo || "").trim().length !== 11}
                    />
                  </Field>
                  <Field
                    label={t("pwdRelationshipLabel")}
                    required
                    invalid={attemptedNext && (formData.emergencyRelationship || "").trim() === ""}
                    invalidNote="Required"
                  >
                    <TextInput
                      value={formData.emergencyRelationship}
                      onChange={(v) => updateField("emergencyRelationship", v)}
                      invalid={attemptedNext && (formData.emergencyRelationship || "").trim() === ""}
                    />
                  </Field>
                </div>
                <Field
                  label={t("address")}
                  required
                  invalid={attemptedNext && (formData.emergencyAddress || "").trim() === ""}
                  invalidNote="Required"
                >
                  <TextInput
                    value={formData.emergencyAddress}
                    onChange={(v) => updateField("emergencyAddress", v)}
                    invalid={attemptedNext && (formData.emergencyAddress || "").trim() === ""}
                  />
                </Field>
              </div>

              {/* Physical Appearance */}
              <div className="space-y-4">
                <SectionHeader title={t("pwdPhysicalAppearanceHeader").toUpperCase()} />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Field
                    label={t("pwdHeightLabel")}
                    required
                    invalid={attemptedNext && (formData.heightCm || "").trim() === ""}
                    invalidNote="Required"
                  >
                    <TextInput
                      value={formData.heightCm}
                      onChange={(v) => updateField("heightCm", v)}
                      placeholder="e.g. 165"
                      invalid={attemptedNext && (formData.heightCm || "").trim() === ""}
                    />
                  </Field>
                  <Field
                    label={t("pwdWeightLabel")}
                    required
                    invalid={attemptedNext && (formData.weightKg || "").trim() === ""}
                    invalidNote="Required"
                  >
                    <TextInput
                      value={formData.weightKg}
                      onChange={(v) => updateField("weightKg", v)}
                      placeholder="e.g. 60"
                      invalid={attemptedNext && (formData.weightKg || "").trim() === ""}
                    />
                  </Field>
                  <Field
                    label={t("pwdHairColorLabel")}
                    required
                    invalid={attemptedNext && (formData.colorOfHair || "").trim() === ""}
                    invalidNote="Required"
                  >
                    <TextInput
                      value={formData.colorOfHair}
                      onChange={(v) => updateField("colorOfHair", v)}
                      placeholder="e.g. Black"
                      invalid={attemptedNext && (formData.colorOfHair || "").trim() === ""}
                    />
                  </Field>
                  <Field
                    label={t("pwdEyeColorLabel")}
                    required
                    invalid={attemptedNext && (formData.colorOfEyes || "").trim() === ""}
                    invalidNote="Required"
                  >
                    <TextInput
                      value={formData.colorOfEyes}
                      onChange={(v) => updateField("colorOfEyes", v)}
                      placeholder="e.g. Brown"
                      invalid={attemptedNext && (formData.colorOfEyes || "").trim() === ""}
                    />
                  </Field>
                </div>
                <Field label={t("pwdOtherMarksLabel")}>
                  <TextInput
                    value={formData.otherMarks}
                    onChange={(v) => updateField("otherMarks", v)}
                    placeholder="e.g. Mole on left cheek (optional)"
                  />
                </Field>
              </div>

              {/* Sectoral Form / PWD Information */}
              <div className="space-y-4">
                <SectionHeader title="PWD INFORMATION" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field
                    label={t("disabilityTypeLabel")}
                    required
                    invalid={attemptedNext && disabilityType === ""}
                    invalidNote={t("pwdDisabilityTypeRequiredNote") || "Required"}
                  >
                    <TextInput
                      value={disabilityType}
                      onChange={() => {}}
                      disabled={true}
                      placeholder={t("pwdChooseDisabilityType")}
                    />
                  </Field>
                  <Field
                    label={t("pwdCauseOfDisabilityLabel")}
                    required
                    invalid={attemptedNext && (formData.causeOfDisability || "").trim() === ""}
                    invalidNote="Required"
                  >
                    <SelectInput
                      value={formData.causeOfDisability}
                      onChange={(v) => updateField("causeOfDisability", v)}
                      options={CAUSE_OF_DISABILITY}
                      invalid={attemptedNext && (formData.causeOfDisability || "").trim() === ""}
                    />
                  </Field>
                  <Field label={t("pwdSpecificDisabilityLabel")}>
                    <TextInput
                      value={formData.specificDisability}
                      onChange={(v) => updateField("specificDisability", v)}
                      placeholder="Optional"
                    />
                  </Field>
                </div>
              </div>

              {/* Error Banner when Next is attempted with incomplete fields */}
              {attemptedNext && !step2Valid && (
                <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Pakikumpleto ang lahat ng kinakailangang impormasyon sa Step 2 bago magpatuloy sa susunod na hakbang.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — matches the AICS "Pag-upload ng File" card layout */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">{t("fileUploadHeader")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("fileUploadDesc1")}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("fileUploadDesc2")}</p>

              <div className="space-y-6 pt-2">
                {requiredDocs.map((doc) => {
                  const missing = attemptedNext && !uploaded[doc.title]
                  const entry = uploaded[doc.title]
                  const isImage = entry?.file.type.startsWith("image/")
                  return (
                    <div key={doc.title}>
                      <button
                        type="button"
                        onClick={() => setSampleDoc(doc.title)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline mb-2"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {t("sampleDocument").toUpperCase()}
                      </button>

                      {/* Hidden real file input */}
                      <input
                        ref={(el) => {
                          fileInputRefs.current[doc.title] = el
                        }}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(doc.title, e.target.files)}
                      />

                      <div
                        className={`border rounded-xl p-5 ${
                          entry
                            ? "border-green-300 bg-green-50"
                            : missing
                            ? "border-red-400 bg-red-50"
                            : "border-border bg-card"
                        }`}
                      >
                        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground uppercase tracking-wide">
                          {doc.title} <span className="text-red-500">*</span>
                          {entry && (
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-500 shrink-0">
                              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Allowed file types: JPG, JPEG, PNG, WEBP (o kumuha gamit ang Camera)</p>

                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[doc.title]?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold tracking-wide hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            UPLOAD PHOTO
                          </button>

                          <button
                            type="button"
                            onClick={() => setCameraDoc(doc.title)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide transition-colors cursor-pointer shadow-xs"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            KUMUHA NG LARAWAN (CAMERA)
                          </button>
                        </div>

                        {entry && (
                          <div className="relative mt-3 w-40 border border-border rounded-lg bg-white p-3 flex flex-col items-center text-center">
                            <button
                              type="button"
                              onClick={() => removeUploadedFile(doc.title)}
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-500 text-white flex items-center justify-center hover:bg-gray-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {isImage ? (
                              <img
                                src={entry.previewUrl}
                                alt={doc.title}
                                className="h-12 w-12 object-cover rounded-md border border-border mb-2"
                              />
                            ) : (
                              <FileText className="h-9 w-9 text-muted-foreground mb-2" />
                            )}
                            <p className="text-xs font-medium text-foreground break-all leading-tight">{entry.file.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{formatFileSize(entry.file.size)}</p>
                          </div>
                        )}

                        {missing && <p className="text-xs text-red-500 mt-2">{t("pwdStillNeedsUploadNote")}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 4 — matches the AICS review layout */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-foreground">{t("pwdReviewHeader").toUpperCase()}</h3>
                <p className="text-sm text-muted-foreground">{t("pwdReviewDesc")}</p>
              </div>

              {/* Requirements */}
              <div className="border border-border rounded-xl overflow-hidden">
                <p className="flex items-center gap-1.5 text-sm font-bold text-foreground px-5 pt-5 pb-3">
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  {t("requirementsSectionTitle")}
                </p>
                <div>
                  {[
                    { ok: isResident, label: t("pwdResidentQuestion") },
                    { ok: hasDisability, label: t("pwdHasDisabilityQuestion") },
                    {
                      ok: true,
                      label: idStatus === "renewal"
                        ? `RENEWAL — PWD ID: ${formData.existingPwdIdNumber}${reasonForRenewal ? ` (${reasonForRenewal})` : ""}`
                        : idStatus === "loss"
                        ? `REPLACEMENT — PWD ID: ${formData.existingPwdIdNumber || "N/A"}${reasonForReplacement ? ` (${reasonForReplacement})` : ""}`
                        : t("pwdNewApplicationOption"),
                    },
                    { ok: true, label: `${t("disabilityTypeLabel")}: ${disabilityType || "—"}` },
                  ].map((item, idx, arr) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 px-5 py-3 ${
                        idx < arr.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center h-5 w-5 rounded-full shrink-0 ${
                          item.ok ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {item.ok ? (
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        ) : (
                          <X className="h-3 w-3 text-white" strokeWidth={3} />
                        )}
                      </span>
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Information */}
              <div className="border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    {t("personalInfoSectionTitle")}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setReturnToReview(true); setStep(2) }}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <Pencil className="h-3 w-3" />
                    {t("editButton").toUpperCase()}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("fullNameLabel")}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {formData.firstName} {formData.middleName} {formData.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("pwdDobDisplayLabel")}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {formData.dobMonth}/{formData.dobDay}/{formData.dobYear}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("genderLabel")}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{formData.sex || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("pwdCivilStatusDisplayLabel")}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{formData.civilStatus || "—"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("address")}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {formData.addressHouseNo} {formData.addressStreet} {formData.addressBarangay} {formData.addressCity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("pwdContactNoLabel")}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{formData.contactNo || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("emailLabel")}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{formData.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("disabilityTypeLabel")}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{disabilityType || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("pwdCauseOfDisabilityLabel")}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{formData.causeOfDisability || "—"}</p>
                  </div>
                  {formData.specificDisability && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("pwdSpecificDisabilityLabel")}</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{formData.specificDisability}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    {t("pwdDocumentsSectionTitle")}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setReturnToReview(true); setStep(3) }}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <Pencil className="h-3 w-3" />
                    {t("editButton").toUpperCase()}
                  </button>
                </div>
                <div className="space-y-5">
                  {requiredDocs.map((doc) => {
                    const entry = uploaded[doc.title]
                    return (
                      <div key={doc.title}>
                        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                          {doc.title} <span className="text-red-500">*</span>
                          {entry ? (
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-500 shrink-0">
                              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                            </span>
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                        </p>
                        <button
                          type="button"
                          onClick={() => entry && setPreviewDoc(doc.title)}
                          disabled={!entry}
                          className={`mt-2 w-full max-w-md border rounded-lg overflow-hidden text-left ${
                            entry ? "border-border hover:border-blue-400" : "border-red-200 cursor-default"
                          }`}
                        >
                          <div className="h-28 w-full bg-gray-100 flex items-center justify-center">
                            {entry?.file.type.startsWith("image/") ? (
                              <img src={entry.previewUrl} alt={doc.title} className="h-full w-full object-cover" />
                            ) : (
                              <FileText className="h-9 w-9 text-gray-400" />
                            )}
                          </div>
                          <div className="px-3 py-2 text-center bg-white">
                            <p className="text-xs font-medium text-foreground truncate">
                              {entry ? entry.file.name : t("pwdNotYetUploadedLabel")}
                            </p>
                            {entry && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{formatFileSize(entry.file.size)}</p>
                            )}
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-700">{t("pwdAllCompleteNote")}</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer nav */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-gray-50">
          {step === 1 ? (
            <div />
          ) : (
            <button
              onClick={goBack}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              {t("backButton").toUpperCase()}
            </button>
              )}

          {step < 4 ? (
            <button
              onClick={goNext}
              disabled={!canGoNext}
              className={`flex items-center gap-1.5 px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                canGoNext
                  ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {t("nextButton").toUpperCase()} <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setAttemptedNext(true)
                if (!canGoNext) return
                setShowConfirmModal(true)
              }}
              disabled={!canGoNext}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                canGoNext
                  ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              SUBMIT APPLICATION
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
                  handleConfirmSubmit()
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <span>YES, SUBMIT APPLICATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {sampleDoc && <SampleDocumentModal title={sampleDoc} onClose={() => setSampleDoc(null)} />}
      {previewDoc && uploaded[previewDoc] && (
        <UploadedDocPreviewModal
          title={previewDoc}
          doc={uploaded[previewDoc] as UploadedDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* 📸 Document Camera Capture Modal */}
      <DocumentCameraModal
        isOpen={Boolean(cameraDoc)}
        onClose={() => setCameraDoc(null)}
        docTitle={cameraDoc || undefined}
        onCapture={(file) => {
          if (cameraDoc) {
            setUploaded((prev) => {
              const existing = prev[cameraDoc]
              if (existing) URL.revokeObjectURL(existing.previewUrl)
              return { ...prev, [cameraDoc]: { file, previewUrl: URL.createObjectURL(file) } }
            })
          }
        }}
      />
    </div>
  )
}
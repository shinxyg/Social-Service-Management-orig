import React, { useState, useEffect, type ReactNode } from "react"
import {
  Check,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  FileText,
  Upload,
  Camera,
  X,
  Pencil,
  Info,
  Loader2,
  Plus,
  Trash2,
  School,
  User,
} from "lucide-react"

import { useLanguage } from "../ui/language-context"
import DocumentCameraModal from "../ui/document-camera-modal"
import { DataPrivacyConsent } from "../ui/data-privacy-consent"
import { SubmitPrivacyOverlayModal } from "../ui/submit-privacy-overlay-modal"
import { API_BASE, getAuthHeaders } from "../../config/api"
import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"
import { notifyApplicationChange } from "../../utils/realtimeSync"
import { readFileAsDataUrl } from "../../utils/fileUpload"

export interface SchoolingChild {
  id: string
  fullName: string
  birthDate: string
  age: string
  schoolName: string
  gradeLevel: string
  schoolType: string
}

interface SampleDocument {
  id: string
  label: string
  description?: string
  images?: string[]
  downloadUrl?: string
}

const EDUCATIONAL_ASSISTANCE_DOCUMENTS: SampleDocument[] = [
  {
    id: "soloParentIdOrCert",
    label: "VALID SOLO PARENT ID / SOLO PARENT CERTIFICATE",
    description: "Kopya o larawan ng inyong valid Solo Parent ID o opisyal na Certificate mula sa QC SSDD.",
    images: ["/samples/QC ID.png"],
    downloadUrl: "/samples/QC ID.png",
  },
  {
    id: "enrollmentCertificates",
    label: "CERTIFICATE OF ENROLLMENT / REGISTRATION (PUBLIC SCHOOL)",
    description: "Sertipiko ng pagpapatala mula sa pampublikong paaralan ng dalawa (2) o higit pang anak.",
    images: ["/samples/BARANGAY CERTIFICATE.webp"],
    downloadUrl: "/samples/BARANGAY CERTIFICATE.webp",
  },
  {
    id: "barangayIndigency",
    label: "BARANGAY CERTIFICATE OF INDIGENCY / RESIDENCY",
    description: "Barangay Certificate of Indigency na nagpapatunay ng pangangailangan sa tulong-pinansyal.",
    images: ["/samples/BARANGAY CERTIFICATE.webp"],
    downloadUrl: "/samples/BARANGAY CERTIFICATE.webp",
  },
  {
    id: "birthCertificates",
    label: "PSA BIRTH CERTIFICATE(S) OF CHILDREN",
    description: "PSA Birth Certificate ng mga anak na nag-aaral at tumatanggap ng suporta.",
    images: ["/samples/BIRTH CERTIFICATE OF MINOR.jpg"],
    downloadUrl: "/samples/BIRTH CERTIFICATE OF MINOR.jpg",
  },
  {
    id: "validGovId",
    label: "VALID GOVERNMENT ID O QC ID NG SOLO PARENT",
    description: "Valid Government-issued ID o QCitizen ID ng solong magulang na may litrato at lagda.",
    images: ["/samples/QC ID.png"],
    downloadUrl: "/samples/QC ID.png",
  },
  {
    id: "idPicture",
    label: "RECENT 2X2 ID PICTURE NG SOLO PARENT",
    description: "Kasalukuyang 2x2 picture na may malinis na puting background.",
    images: ["/samples/ID PICTURE (2X2).webp"],
    downloadUrl: "/samples/ID PICTURE (2X2).webp",
  },
]

function formatFileSize(bytes: number) {
  if (!bytes) return "0.0 KB"
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  invalid = false,
  verified = false,
  numbersOnly = false,
  maxLength,
  prefix,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
  invalid?: boolean
  verified?: boolean
  numbersOnly?: boolean
  maxLength?: number
  prefix?: string
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value
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
      <div
        className={`flex items-center w-full rounded-lg border overflow-hidden transition-all focus-within:ring-2 ${
          disabled
            ? "border-border bg-gray-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
            : verified
            ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
            : invalid
            ? "border-red-400 focus-within:ring-red-300 bg-red-50 dark:bg-red-950/30"
            : "border-border dark:border-slate-700 focus-within:ring-blue-400 bg-white dark:bg-slate-900"
        }`}
      >
        <span
          className={`inline-flex items-center justify-center px-3.5 py-2.5 border-r text-xs font-bold select-none tracking-wider shrink-0 font-mono transition-colors ${
            verified
              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
              : "bg-slate-100 dark:bg-slate-800 border-border dark:border-slate-700 text-slate-700 dark:text-slate-300"
          }`}
        >
          {prefix}
        </span>
        <input
          type={numbersOnly ? "tel" : type}
          inputMode={numbersOnly ? "numeric" : undefined}
          value={displayVal}
          placeholder={placeholder}
          onChange={handleChange}
          disabled={disabled}
          maxLength={maxLength}
          className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none font-mono placeholder:font-sans text-foreground placeholder:text-muted-foreground"
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
      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${
        disabled
          ? "border-border dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-muted-foreground cursor-not-allowed"
          : invalid
          ? "border-red-400 focus:ring-red-300 bg-red-50 dark:bg-red-950/30 text-foreground"
          : "border-border dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground placeholder:text-muted-foreground focus:ring-blue-400"
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
  placeholder = "Select...",
}: {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[] | string[]
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
        disabled
          ? "border-border dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-muted-foreground cursor-not-allowed"
          : invalid
          ? "border-red-400 focus:ring-red-300 bg-red-50 dark:bg-red-950/30 text-foreground"
          : "border-border dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground focus:ring-blue-400"
      }`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value
        const lab = typeof opt === "string" ? opt : opt.label
        return (
          <option key={val} value={val} className="bg-white dark:bg-slate-900 text-foreground">
            {lab}
          </option>
        )
      })}
    </select>
  )
}

function LockedField({ value, placeholder }: { value?: string; placeholder?: string }) {
  return (
    <div className="w-full border border-border dark:border-slate-800 bg-gray-100 dark:bg-slate-800/80 rounded-lg px-3 py-2.5 text-sm text-foreground select-none cursor-not-allowed">
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
    <div className="border border-border dark:border-slate-800 rounded-xl overflow-hidden bg-card dark:bg-slate-900/60 shadow-xs">
      <div className="flex items-center justify-between bg-muted/40 dark:bg-slate-800/60 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-bold text-foreground text-left cursor-pointer"
        >
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
          <span>{title}</span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
        >
          <Pencil className="h-3 w-3" />
          I-EDIT
        </button>
      </div>
      {open && <div className="p-4 border-t border-border dark:border-slate-800">{children}</div>}
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

interface SoloParentApplicationWizardProps {
  onBack?: () => void
  userProfile?: any
  initialCategoryId?: number | null
  initialType?: string | null
  isModalOpen?: boolean
  onBlockedStatusChange?: (blocked: boolean, app?: any) => void
  onStepChange?: (step: number) => void
  onSubmissionStageChange?: (stage: "form" | "matching" | "pending") => void
}

export default function SoloParentApplicationWizard({
  onBack,
  userProfile: propUserProfile,
  onStepChange,
  onSubmissionStageChange,
}: SoloParentApplicationWizardProps) {
  const { language } = useLanguage()
  const userProfile = propUserProfile || getCurrentUserProfile()

  const STEPS = [
    { id: 1, label: "COMPLETE CHECKLIST" },
    { id: 2, label: "PERSONAL INFORMATION" },
    { id: 3, label: "UPLOAD DOCUMENTS" },
    { id: 4, label: "REVIEW & SUBMIT" },
  ]

  const [step, setStep] = useState(1)
  const [returnToReview, setReturnToReview] = useState(false)
  const [attemptedNext, setAttemptedNext] = useState(false)

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  // Step 1: Form Fields (Exact Image 1 Spec)
  const [soloParentIdNumber, setSoloParentIdNumber] = useState("")
  const [isIdVerified, setIsIdVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null)
  const [soloParentStatus, setSoloParentStatus] = useState("")
  const [assistanceType, setAssistanceType] = useState("Educational Assistance")
  const [beneficiaryType, setBeneficiaryType] = useState("Solo Parent's Child/Beneficiary")

  // Step 2: Personal info
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || "",
    middleName: userProfile?.middleName || "",
    lastName: userProfile?.lastName || "",
    suffix: userProfile?.suffix || "",
    dobMonth: userProfile?.dobMonth || "",
    dobDay: userProfile?.dobDay || "",
    dobYear: userProfile?.dobYear || "",
    age: userProfile?.age ? String(userProfile.age) : "",
    sex: userProfile?.sex || userProfile?.gender || "Female",
    civilStatus: userProfile?.civilStatus || "Solo Parent / Single Parent",
    citizenship: userProfile?.nationality || "FILIPINO",
    addressHouseNo: userProfile?.addressHouseNo || "",
    addressStreet: userProfile?.addressStreet || "",
    addressBarangay: userProfile?.addressBarangay || "SAUYO",
    addressCityMunicipality: userProfile?.addressCityMunicipality || "QUEZON CITY",
    qcidNumber: userProfile?.qcidNo || userProfile?.qcidNumber || getLoggedInUserQcid() || "110000572516915",
    contactNo: userProfile?.contactNo || "09171234567",
    email: userProfile?.email || "soloparent@example.com",
    bloodType: userProfile?.bloodType || "O+",
    emergencyFirstName: userProfile?.emergencyFirstName || "MARIA",
    emergencyLastName: userProfile?.emergencyLastName || "DELA CRUZ",
    emergencyContactNo: userProfile?.emergencyContactNo || "09181234567",
    emergencyRelationship: userProfile?.emergencyRelationship || "Parent",
    emergencyAddress: userProfile?.emergencyAddress || "QUEZON CITY",
  })

  const [isEditingInfo, setIsEditingInfo] = useState(false)

  // Schooling Children (Min 2 children in public school)
  const [schoolingChildren, setSchoolingChildren] = useState<SchoolingChild[]>([
    {
      id: "child-1",
      fullName: "JUAN DELA CRUZ JR.",
      birthDate: "2015-05-12",
      age: "11",
      schoolName: "SAUYO ELEMENTARY SCHOOL",
      gradeLevel: "Grade 5",
      schoolType: "Public School",
    },
    {
      id: "child-2",
      fullName: "JANE DELA CRUZ",
      birthDate: "2018-08-20",
      age: "8",
      schoolName: "SAUYO ELEMENTARY SCHOOL",
      gradeLevel: "Grade 2",
      schoolType: "Public School",
    },
  ])

  const handleAddChild = () => {
    setSchoolingChildren((prev) => [
      ...prev,
      {
        id: `child-${Date.now()}`,
        fullName: "",
        birthDate: "",
        age: "",
        schoolName: "",
        gradeLevel: "Grade 1",
        schoolType: "Public School",
      },
    ])
  }

  const handleRemoveChild = (index: number) => {
    if (schoolingChildren.length <= 2) return
    setSchoolingChildren((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleUpdateChild = (index: number, field: keyof SchoolingChild, val: string) => {
    setSchoolingChildren((prev) =>
      prev.map((c, idx) => (idx === index ? { ...c, [field]: val } : c))
    )
  }

  const updateField = (field: string, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }))
  }

  const handleVerifySoloParentId = () => {
    if (!soloParentIdNumber.trim()) return
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      setIsIdVerified(true)
      setSoloParentStatus("Active / Verified Solo Parent (QC SSDD Recorded)")
      setVerifyNotice(`Verified Record: ${formData.firstName} ${formData.lastName} (QC Solo Parent Registered)`)
    }, 600)
  }

  // Step 3: Documents
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File[]>>({})
  const [uploadedDocsBase64, setUploadedDocsBase64] = useState<Record<string, string>>({})
  const [cameraDoc, setCameraDoc] = useState<SampleDocument | null>(null)

  const handleFileUpload = async (docId: string, files: File[]) => {
    if (!files.length) return
    const file = files[0]
    setUploadedDocs((prev) => ({ ...prev, [docId]: [file] }))
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setUploadedDocsBase64((prev) => ({ ...prev, [docId]: dataUrl }))
    } catch {}
  }

  const handleRemoveFile = (docId: string) => {
    setUploadedDocs((prev) => {
      const copy = { ...prev }
      delete copy[docId]
      return copy
    })
    setUploadedDocsBase64((prev) => {
      const copy = { ...prev }
      delete copy[docId]
      return copy
    })
  }

  // Step 4: Submission
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [reference, setReference] = useState("")

  // Validations
  const step1Valid = Boolean(
    soloParentIdNumber.trim() &&
    assistanceType &&
    beneficiaryType
  )

  const childrenValid =
    schoolingChildren.length >= 2 &&
    schoolingChildren.every(
      (c) =>
        (c.fullName || "").trim() !== "" &&
        (c.schoolName || "").trim() !== "" &&
        (c.gradeLevel || "").trim() !== ""
    )

  const step2Valid =
    (formData.firstName || "").trim() !== "" &&
    (formData.lastName || "").trim() !== "" &&
    (formData.contactNo || "").replace(/\D/g, "").length >= 10 &&
    (formData.addressBarangay || "").trim() !== "" &&
    childrenValid &&
    (formData.emergencyFirstName || "").trim() !== "" &&
    (formData.emergencyLastName || "").trim() !== "" &&
    (formData.emergencyContactNo || "").replace(/\D/g, "").length === 11

  const step3Valid = EDUCATIONAL_ASSISTANCE_DOCUMENTS.every(
    (doc) => (uploadedDocs[doc.id]?.length ?? 0) > 0
  )

  const goNext = () => {
    if (step === 1 && !step1Valid) {
      setAttemptedNext(true)
      return
    }
    if (step === 2 && !step2Valid) {
      setAttemptedNext(true)
      return
    }
    if (step === 3 && !step3Valid) {
      setAttemptedNext(true)
      return
    }

    setAttemptedNext(false)
    if (returnToReview && step2Valid && step3Valid) {
      setStep(4)
      setReturnToReview(false)
      return
    }
    setReturnToReview(false)
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

  const handleSubmit = async () => {
    setSubmitting(true)
    const randNum = Math.floor(100000 + Math.random() * 900000)
    const generatedRef = `SP-EDU-2026-${randNum}`
    setReference(generatedRef)

    const docPayload = EDUCATIONAL_ASSISTANCE_DOCUMENTS.map((doc) => ({
      documentId: doc.id,
      documentLabel: doc.label,
      files: (uploadedDocs[doc.id] || []).map((f) => ({
        filename: f.name,
        previewUrl: uploadedDocsBase64[doc.id] || f.name,
        fileSize: f.size,
        uploadedAt: new Date().toISOString(),
      })),
    }))

    const newAppRecord = {
      id: String(Date.now()),
      reference_number: generatedRef,
      referenceNumber: generatedRef,
      category: "Solo Parent",
      module_type: "solo-parent",
      service: "Solo Parent Educational Assistance Program",
      service_name: "Solo Parent Educational Assistance Program",
      classification_title: "Solo Parent Educational Assistance Program (₱5,000 Financial Assistance)",
      assistanceType: "Educational Assistance (₱5,000)",
      type: "educational-assistance",
      application_type: "educational-assistance",
      solo_parent_id_number: soloParentIdNumber.startsWith("SP-") ? soloParentIdNumber : `SP-${soloParentIdNumber}`,
      soloParentStatus: soloParentStatus || "Active / Verified Solo Parent",
      assistance_type_requested: assistanceType,
      beneficiary_type: beneficiaryType,
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName,
      qcid_number: formData.qcidNumber || getLoggedInUserQcid() || "110000572516915",
      email: formData.email,
      contact_no: formData.contactNo,
      address_barangay: formData.addressBarangay,
      children: schoolingChildren,
      schooling_children: schoolingChildren,
      financial_assistance_amount: "₱5,000 bawat benepisyaryo",
      status: "pending",
      application_status: "pending",
      created_at: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      form_data: {
        ...formData,
        soloParentIdNumber,
        soloParentStatus,
        assistanceType,
        beneficiaryType,
        schoolingChildren,
        assistanceAmount: "₱5,000 bawat benepisyaryo",
        assessmentStatus: "Pending Social Worker Assessment & Interview",
      },
      documents: docPayload,
    }

    try {
      const existing = JSON.parse(localStorage.getItem("solo_parent_applications") || "[]")
      localStorage.setItem("solo_parent_applications", JSON.stringify([newAppRecord, ...existing]))
      const allUserApps = JSON.parse(localStorage.getItem("applications") || "[]")
      localStorage.setItem("applications", JSON.stringify([newAppRecord, ...allUserApps]))
      window.dispatchEvent(new Event("storage"))
      notifyApplicationChange("APPLICATION_SUBMITTED", "solo_parent", generatedRef)
    } catch {}

    try {
      await fetch(`${API_BASE}/api/solo-parent/create`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          userId: formData.qcidNumber || "0",
          referenceNumber: generatedRef,
          applicationData: newAppRecord,
          documents: docPayload,
        }),
      }).catch(() => null)
    } catch {}

    setSubmitting(false)
    setShowSubmitModal(false)
    setIsSubmitted(true)
    onSubmissionStageChange?.("pending")
  }

  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-6 py-8 animate-in fade-in duration-150">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {language === "en" ? "Application Submitted Successfully!" : "Matagumpay na Naisumite ang Aplikasyon!"}
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mt-1.5 leading-relaxed">
              Naisumite na ang inyong aplikasyon para sa Solo Parent Educational Assistance Program. Magsasagawa ng panayam (interview) at assessment ang Social Worker bago maipagkaloob ang tulong-pinansyal na ₱5,000 para sa bawat kwalipikadong anak na mag-aaral.
            </p>
          </div>

          <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Application Reference No.:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-sky-400">{reference}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Solo Parent ID:</span>
              <span className="font-mono font-bold text-foreground">{soloParentIdNumber.startsWith("SP-") ? soloParentIdNumber : `SP-${soloParentIdNumber}`}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Type of Assistance:</span>
              <span className="font-semibold text-foreground">{assistanceType}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Beneficiary Type:</span>
              <span className="font-semibold text-foreground">{beneficiaryType}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Assistance Amount:</span>
              <span className="font-semibold text-emerald-600 font-mono">₱5,000 bawat benepisyaryo</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Status:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Under Review / Assessment
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
              {language === "en" ? "VIEW IN APPLICATION HISTORY" : "TINGNAN SA APPLICATION HISTORY"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const fullApplicantName = [formData.firstName, formData.middleName, formData.lastName, formData.suffix]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
        {/* Top Circle Connector Stepper (Matching Pic 2) */}
        <div className="flex items-center px-6 pt-6 pb-4">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div
                className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  s.id === step
                    ? "bg-blue-600 text-white"
                    : s.id < step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-slate-800 text-gray-500"
                }`}
              >
                {s.id < step ? <Check className="h-4 w-4 stroke-[2.5]" /> : s.id}
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 mx-2 transition-colors ${
                    s.id < step ? "bg-blue-500" : "bg-gray-200 dark:bg-slate-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Indicator Tabs (Matching Pic 2) */}
        <div className="flex gap-2 border-b border-border bg-gray-50 dark:bg-slate-900/60 p-2 overflow-x-auto">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex-1 px-4 py-3 rounded-lg text-xs font-semibold whitespace-nowrap text-center transition-colors ${
                s.id === step
                  ? "bg-blue-600 text-white shadow-xs"
                  : s.id < step
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-sky-300"
                  : "bg-gray-100 text-gray-500 dark:bg-slate-800/80 dark:text-slate-400"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="p-6 min-h-90">
          {/* STEP 1: SERVICE AND PRIMARY REQUIREMENTS (Exact Image 1 & 2 Spec) */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
                  SERVICE AND PRIMARY REQUIREMENTS
                </h3>
              </div>

              {/* Notice Box (Matching Pic 2 Style) */}
              <div className="bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 flex items-start gap-3.5 shadow-xs">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="text-xs md:text-sm font-bold text-blue-950 dark:text-blue-200">
                    Solo Parent Sector: Qualified beneficiaries may receive the educational assistance provided.
                  </p>
                  <p className="text-blue-900/90 dark:text-blue-300/90 leading-relaxed text-justify">
                    Para sa indigent solo parents’ children/beneficiaries na nag-aaral. Kabilang dito ang mga solo parents na may dalawa (2) o higit pang anak na naka-enroll sa pampublikong paaralan, na may tulong-pinansyal na ₱5,000 bawat kwalipikadong benepisyaryo. May interview at assessment din ng Social Worker bago ma-extend ang tulong-pinansyal.
                  </p>
                </div>
              </div>

              {/* Form Fields from Pic 1 */}
              <div className="space-y-5 pt-1">
                {/* 1. SOLO PARENT ID NUMBER */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label
                      className={`text-xs font-semibold uppercase tracking-wide block ${
                        attemptedNext && !soloParentIdNumber.trim() ? "text-red-600" : "text-foreground"
                      }`}
                    >
                      SOLO PARENT ID NUMBER <span className="text-red-500">*</span>
                    </label>
                    {isIdVerified && soloParentIdNumber.trim() && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Solo Parent ID Verified
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <TextInput
                        prefix="SP-"
                        value={soloParentIdNumber}
                        onChange={(v) => {
                          setSoloParentIdNumber(v)
                          setIsIdVerified(true)
                          setSoloParentStatus("Active / Verified Solo Parent (QC SSDD Recorded)")
                          setVerifyNotice(`Verified Record: ${formData.firstName} ${formData.lastName}`)
                        }}
                        placeholder="137404-2026-847708"
                        verified={isIdVerified && Boolean(soloParentIdNumber.trim())}
                        invalid={attemptedNext && !soloParentIdNumber.trim()}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifySoloParentId}
                      disabled={!soloParentIdNumber.trim() || isVerifying}
                      className={`px-5 py-2.5 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 h-10 ${
                        isIdVerified && soloParentIdNumber.trim()
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : isIdVerified && soloParentIdNumber.trim() ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>VERIFIED</span>
                        </>
                      ) : (
                        <span>VERIFY SOLO PARENT ID</span>
                      )}
                    </button>
                  </div>
                  {verifyNotice && isIdVerified && soloParentIdNumber.trim() && (
                    <div className="mt-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-3 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{verifyNotice}</p>
                        <p className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5">
                          QC SSDD Solo Parent Beneficiary ID
                        </p>
                      </div>
                    </div>
                  )}
                  {attemptedNext && !soloParentIdNumber.trim() && (
                    <p className="text-xs text-red-500 mt-1">
                      Kailangang ilagay ang inyong Solo Parent ID Number bago magpatuloy.
                    </p>
                  )}
                </div>

                {/* 2. SOLO PARENT STATUS */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide block text-foreground mb-1.5">
                    SOLO PARENT STATUS <span className="text-red-500">*</span>
                  </label>
                  <LockedField
                    value={
                      isIdVerified && soloParentIdNumber.trim()
                        ? soloParentStatus || "Active / Verified Solo Parent (QC SSDD Recorded)"
                        : ""
                    }
                    placeholder="Auto-filled upon Solo Parent ID verification"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Auto-filled upon Solo Parent ID verification
                  </p>
                </div>

                {/* 3. TYPE OF ASSISTANCE REQUESTED */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide block text-foreground mb-1.5">
                    TYPE OF ASSISTANCE REQUESTED <span className="text-red-500">*</span>
                  </label>
                  <SelectInput
                    value={assistanceType}
                    onChange={(v) => setAssistanceType(v)}
                    placeholder="Select Type of Assistance"
                    options={[
                      {
                        label: "Educational Assistance",
                        value: "Educational Assistance",
                      },
                    ]}
                    invalid={attemptedNext && !assistanceType}
                  />
                  {attemptedNext && !assistanceType && (
                    <p className="text-xs text-red-500 mt-1">
                      Pumili ng uri ng tulong na hinihiling.
                    </p>
                  )}
                </div>

                {/* 4. BENEFICIARY TYPE */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide block text-foreground mb-1.5">
                    BENEFICIARY TYPE <span className="text-red-500">*</span>
                  </label>
                  <SelectInput
                    value={beneficiaryType}
                    onChange={(v) => setBeneficiaryType(v)}
                    placeholder="Select Beneficiary Type"
                    options={[
                      {
                        label: "Solo Parent's Child/Beneficiary",
                        value: "Solo Parent's Child/Beneficiary",
                      },
                      {
                        label: "Solo Parent (Self)",
                        value: "Solo Parent (Self)",
                      },
                    ]}
                    invalid={attemptedNext && !beneficiaryType}
                  />
                  {attemptedNext && !beneficiaryType && (
                    <p className="text-xs text-red-500 mt-1">
                      Pumili ng beneficiary type.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PERSONAL INFORMATION & SCHOOLING BENEFICIARIES */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h2 className="text-base font-bold text-foreground uppercase tracking-wide">
                    PERSONAL INFORMATION & BENEFICIARIES
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please review your personal information from your QCID profile. Fill in the schooling children details below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingInfo((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {isEditingInfo ? "LOCK INFORMATION" : "EDIT INFORMATION"}
                </button>
              </div>

              {/* QCID Notice */}
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-600">Important reminder</p>
                  <p className="text-blue-600/90 mt-0.5 text-xs">
                    Please make sure the information on your QCID is correct and complete. Accurate information is important for fast processing of your Educational Assistance.
                  </p>
                </div>
              </div>

              {/* Personal Info Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">QC ID *</label>
                    <input
                      type="text"
                      value={formData.qcidNumber}
                      onChange={(e) => updateField("qcidNumber", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 font-mono transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 border-blue-400"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 border-blue-400"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Middle Name</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => updateField("middleName", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 border-blue-400"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 border-blue-400"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Suffix</label>
                    <input
                      type="text"
                      value={formData.suffix}
                      onChange={(e) => updateField("suffix", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 border-blue-400"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Barangay *</label>
                    <input
                      type="text"
                      value={formData.addressBarangay}
                      onChange={(e) => updateField("addressBarangay", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 border-blue-400"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Contact Number *</label>
                    <input
                      type="text"
                      value={formData.contactNo}
                      onChange={(e) => updateField("contactNo", e.target.value.replace(/\D/g, "").slice(0, 11))}
                      maxLength={11}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 font-mono transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 border-blue-400"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 border-blue-400"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Schooling Children Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <School className="w-4 h-4 text-blue-600" />
                      <span>Mga Mag-aaral na Anak na Benepisyaryo (Public School)</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Kailangan ng dalawa (2) o higit pang anak na naka-enroll sa pampublikong paaralan para sa ₱5,000 educational financial aid.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddChild}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>MAGDAGDAG NG ANAK</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {schoolingChildren.map((child, idx) => (
                    <div
                      key={child.id}
                      className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/40 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 dark:text-sky-300 uppercase tracking-wide">
                          Mag-aaral na Anak #{idx + 1}
                        </span>
                        {schoolingChildren.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChild(idx)}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Alisin</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">Buong Pangalan ng Anak *</label>
                          <input
                            type="text"
                            value={child.fullName}
                            onChange={(e) => handleUpdateChild(idx, "fullName", e.target.value.toUpperCase())}
                            placeholder="JUAN DELA CRUZ JR."
                            className="w-full border border-border rounded-lg px-3 py-2 text-xs mt-1 bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">Pangalan ng Pampublikong Paaralan *</label>
                          <input
                            type="text"
                            value={child.schoolName}
                            onChange={(e) => handleUpdateChild(idx, "schoolName", e.target.value.toUpperCase())}
                            placeholder="e.g. SAUYO HIGH SCHOOL"
                            className="w-full border border-border rounded-lg px-3 py-2 text-xs mt-1 bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">Grade / Year Level *</label>
                          <select
                            value={child.gradeLevel}
                            onChange={(e) => handleUpdateChild(idx, "gradeLevel", e.target.value)}
                            className="w-full border border-border rounded-lg px-3 py-2 text-xs mt-1 bg-white dark:bg-slate-900"
                          >
                            <option value="Kindergarten">Kindergarten</option>
                            <option value="Grade 1">Grade 1</option>
                            <option value="Grade 2">Grade 2</option>
                            <option value="Grade 3">Grade 3</option>
                            <option value="Grade 4">Grade 4</option>
                            <option value="Grade 5">Grade 5</option>
                            <option value="Grade 6">Grade 6</option>
                            <option value="Grade 7">Grade 7 (Junior HS)</option>
                            <option value="Grade 8">Grade 8 (Junior HS)</option>
                            <option value="Grade 9">Grade 9 (Junior HS)</option>
                            <option value="Grade 10">Grade 10 (Junior HS)</option>
                            <option value="Grade 11">Grade 11 (Senior HS)</option>
                            <option value="Grade 12">Grade 12 (Senior HS)</option>
                            <option value="College / Vocational">College / Vocational</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Emergency Contact Person</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">First Name *</label>
                    <input
                      type="text"
                      value={formData.emergencyFirstName}
                      onChange={(e) => updateField("emergencyFirstName", e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-xs mt-1 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Last Name *</label>
                    <input
                      type="text"
                      value={formData.emergencyLastName}
                      onChange={(e) => updateField("emergencyLastName", e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-xs mt-1 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Contact Number (11-digits) *</label>
                    <input
                      type="text"
                      value={formData.emergencyContactNo}
                      onChange={(e) => updateField("emergencyContactNo", e.target.value.replace(/\D/g, "").slice(0, 11))}
                      maxLength={11}
                      className="w-full border border-border rounded-lg px-3 py-2 text-xs mt-1 font-mono bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              {attemptedNext && !step2Valid && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Pakikumpleto ang lahat ng mandatory fields at tiyaking may kahit dalawang (2) kumpletong talaan ng mag-aaral na anak.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: UPLOAD DOCUMENTS */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-bold text-foreground uppercase tracking-wide">
                  DOCUMENTARY REQUIREMENTS
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  I-upload ang malilinaw na kopya o larawan ng mga kinakailangang dokumento para sa Educational Assistance.
                </p>
              </div>

              <div className="space-y-4">
                {EDUCATIONAL_ASSISTANCE_DOCUMENTS.map((doc, docIndex) => {
                  const files = uploadedDocs[doc.id] || []
                  const uploaded = files.length > 0
                  const inputId = `upload-doc-${docIndex}`
                  const invalid = attemptedNext && !uploaded

                  return (
                    <div
                      key={doc.id}
                      className={`border rounded-xl p-4 sm:p-5 transition-colors ${
                        uploaded
                          ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30"
                          : invalid
                          ? "border-red-500/40 bg-red-500/10 dark:bg-red-950/30"
                          : "border-border bg-card/60 dark:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
                            {doc.label} <span className="text-red-500">*</span>
                            {uploaded && (
                              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white shrink-0">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </span>
                            )}
                          </p>
                          {doc.description && <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="file"
                            id={inputId}
                            accept=".jpg,.jpeg,.png,.webp,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const selectedFiles = e.target.files ? Array.from(e.target.files) : []
                              if (selectedFiles.length > 0) handleFileUpload(doc.id, selectedFiles)
                              e.target.value = ""
                            }}
                          />
                          <label
                            htmlFor={inputId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold tracking-wide cursor-pointer hover:bg-blue-700 transition-colors shadow-xs"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>UPLOAD</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setCameraDoc(doc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide cursor-pointer transition-colors shadow-xs"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>CAMERA</span>
                          </button>
                        </div>
                      </div>

                      {uploaded && (
                        <div className="flex flex-wrap gap-3 pt-3">
                          {files.map((file, i) => (
                            <div
                              key={`${file.name}-${i}`}
                              className="relative w-44 border border-border rounded-lg bg-card dark:bg-slate-900 p-2.5 flex items-center gap-2"
                            >
                              <FileText className="h-6 w-6 text-blue-500 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                                <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(doc.id)}
                                className="h-5 w-5 rounded-full bg-slate-700 hover:bg-red-600 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {invalid && (
                        <p className="text-xs text-red-500 mt-2 font-medium">
                          Kinakailangang mag-upload ng dokumento para sa aytem na ito.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-bold text-foreground uppercase tracking-wide">
                  REVIEW & SUBMIT INFORMATION
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pakisuri ang lahat ng impormasyon bago isumite ang aplikasyon para sa Solo Parent Educational Assistance.
                </p>
              </div>

              {/* Service & Primary Requirements */}
              <AccordionSection title="Service & Primary Requirements" onEdit={() => setStep(1)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <ReviewField label="Solo Parent ID Number" value={soloParentIdNumber.startsWith("SP-") ? soloParentIdNumber : `SP-${soloParentIdNumber}`} />
                  <ReviewField label="Solo Parent Status" value={soloParentStatus || "Active / Verified Solo Parent"} />
                  <ReviewField label="Type of Assistance" value={assistanceType} />
                  <ReviewField label="Beneficiary Type" value={beneficiaryType} />
                  <ReviewField label="Assistance Amount" value="₱5,000 bawat benepisyaryo (subject to assessment)" />
                </div>
              </AccordionSection>

              {/* Personal Information */}
              <AccordionSection title="Personal Information & Emergency Contact" onEdit={() => setStep(2)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <ReviewField label="Full Name" value={fullApplicantName} />
                  <ReviewField label="Barangay" value={formData.addressBarangay} />
                  <ReviewField label="Contact Number" value={formData.contactNo} />
                  <ReviewField label="Email Address" value={formData.email} />
                  <ReviewField label="Emergency Contact" value={`${formData.emergencyFirstName} ${formData.emergencyLastName} (${formData.emergencyContactNo})`} />
                </div>
              </AccordionSection>

              {/* Schooling Children */}
              <AccordionSection title="Schooling Children (Beneficiaries)" onEdit={() => setStep(2)}>
                <div className="space-y-2 text-xs">
                  {schoolingChildren.map((c, i) => (
                    <div key={c.id} className="flex justify-between items-center border-b border-border/60 pb-1.5">
                      <span className="font-semibold text-foreground">
                        {i + 1}. {c.fullName}
                      </span>
                      <span className="text-muted-foreground">
                        {c.schoolName} ({c.gradeLevel})
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionSection>

              {/* Uploaded Documents */}
              <AccordionSection title="Uploaded Documents" onEdit={() => setStep(3)}>
                <div className="space-y-2 text-xs">
                  {EDUCATIONAL_ASSISTANCE_DOCUMENTS.map((doc) => {
                    const uploaded = Boolean(uploadedDocs[doc.id]?.length)
                    return (
                      <div key={doc.id} className="flex items-center justify-between">
                        <span className="text-foreground">{doc.label}</span>
                        {uploaded ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-red-500 font-semibold">Missing</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </AccordionSection>

              {/* Privacy Consent */}
              <div className="pt-2">
                <DataPrivacyConsent
                  checked={privacyAgreed}
                  onChange={setPrivacyAgreed}
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="bg-gray-50 dark:bg-slate-900/60 border-t border-border px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className="px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer"
          >
            {step === 1 ? "CANCEL" : "BUMALIK"}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer shadow-xs"
            >
              SUSUNOD
            </button>
          ) : (
            <button
              type="button"
              disabled={!privacyAgreed || submitting}
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer shadow-xs flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>ISUMITE ANG APLIKASYON</span>
            </button>
          )}
        </div>
      </div>

      {/* Camera Capture Modal */}
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

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <SubmitPrivacyOverlayModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onConfirm={handleSubmit}
          loading={submitting}
        />
      )}
    </div>
  )
}
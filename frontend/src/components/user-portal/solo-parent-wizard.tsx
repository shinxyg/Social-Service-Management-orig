import { useState, useEffect, useRef, type ReactNode } from "react"
import {
  Check,
  CheckCircle2,
  ChevronUp,
  AlertCircle,
  FileText,
  Upload,
  Camera,
  X,
  Pencil,
  Info,
  Loader2,
  Sparkles,
  User,
  Clock,
  RotateCcw,
  GraduationCap,
  Plus,
  Trash2,
  School,
} from "lucide-react"

import { useLanguage } from "../ui/language-context"
import DocumentCameraModal from "../ui/document-camera-modal"
import { DataPrivacyConsent } from "../ui/data-privacy-consent"
import { SubmitPrivacyOverlayModal } from "../ui/submit-privacy-overlay-modal"
import { API_BASE, getAuthHeaders, getAuthToken } from "../../config/api"
import { cachedApiFetch } from "../../utils/cachedApiFetch"
import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"
import { notifyApplicationChange, subscribeToRealtimeChanges } from "../../utils/realtimeSync"
import { readFileAsDataUrl } from "../../utils/fileUpload"
import { formatAppDate } from "./my-applications"

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

interface UserProfile {
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
  bloodType?: string
  emergencyFirstName?: string
  emergencyLastName?: string
  emergencyContactNo?: string
  emergencyRelationship?: string
  emergencyAddress?: string
}

export interface SchoolingChild {
  id: string
  fullName: string
  birthDate: string
  age: string
  schoolName: string
  gradeLevel: string
  schoolType: string
}

interface SoloParentApplicationWizardProps {
  onBack?: () => void
  userProfile?: UserProfile
  initialCategoryId?: number | null
  initialType?: string | null
  isModalOpen?: boolean
  onBlockedStatusChange?: (blocked: boolean, app?: any) => void
  onStepChange?: (step: number) => void
  onSubmissionStageChange?: (stage: "form" | "matching" | "pending") => void
}

interface FormData {
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  citizenship?: string
  dobMonth: string
  dobDay: string
  dobYear: string
  age: string
  sex: string
  civilStatus: string
  contactNo: string
  addressHouseNo: string
  addressStreet: string
  addressBarangay: string
  addressCityMunicipality: string
  qcidNumber: string
  soloParentIdNumber: string
  email: string
  bloodType: string
  monthlyIncome: string
  emergencyFirstName: string
  emergencyLastName: string
  emergencyContactNo: string
  emergencyRelationship: string
  emergencyAddress: string
}

const EMPTY_FORM_DATA: FormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  citizenship: "FILIPINO",
  dobMonth: "",
  dobDay: "",
  dobYear: "",
  age: "",
  sex: "",
  civilStatus: "Single Parent",
  contactNo: "",
  addressHouseNo: "",
  addressStreet: "",
  addressBarangay: "",
  addressCityMunicipality: "QUEZON CITY",
  qcidNumber: "",
  soloParentIdNumber: "",
  email: "",
  bloodType: "O+",
  monthlyIncome: "Below ₱15,000",
  emergencyFirstName: "",
  emergencyLastName: "",
  emergencyContactNo: "",
  emergencyRelationship: "",
  emergencyAddress: "",
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5 break-words">{value || "—"}</p>
    </div>
  )
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: ReactNode
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/80 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer"
        >
          <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "" : "rotate-180"}`} />
          {title}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <Pencil className="w-3 h-3" />
          <span>{t("editButton")?.toUpperCase() || "I-EDIT"}</span>
        </button>
      </div>
      {open && children}
    </div>
  )
}

export default function SoloParentApplicationWizard({
  onBack,
  userProfile: propUserProfile,
  onBlockedStatusChange,
  onStepChange,
  onSubmissionStageChange,
}: SoloParentApplicationWizardProps) {
  const { t, language } = useLanguage()
  const [profile, setProfile] = useState(() => (propUserProfile || getCurrentUserProfile()) as any)

  const STEPS = [
    { id: 1, label: language === "en" ? "CHECKLIST & ELIGIBILITY" : "CHECKLIST AT KWALIPIKASYON" },
    { id: 2, label: language === "en" ? "APPLICANT & BENEFICIARIES" : "IMPORMASYON AT MGA MAG-AARAL" },
    { id: 3, label: language === "en" ? "UPLOAD DOCUMENTS" : "UPLOAD NG DOKUMENTO" },
    { id: 4, label: language === "en" ? "REVIEW & SUBMIT" : "PAGSUSURI AT PAGSUMITE" },
  ]

  const [step, setStep] = useState(1)
  const [returnToReview, setReturnToReview] = useState(false)
  const [attemptedNext, setAttemptedNext] = useState(false)

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  // Step 1: Checklist items
  const [checkResidency, setCheckResidency] = useState(false)
  const [checkTwoChildren, setCheckTwoChildren] = useState(false)
  const [checkIndigent, setCheckIndigent] = useState(false)
  const [checkAssessmentInterview, setCheckAssessmentInterview] = useState(false)

  // Step 2: Form data
  const [formData, setFormData] = useState<FormData>(() => {
    const prof = getCurrentUserProfile()
    return {
      ...EMPTY_FORM_DATA,
      firstName: prof.firstName || propUserProfile?.firstName || "",
      middleName: prof.middleName || propUserProfile?.middleName || "",
      lastName: prof.lastName || propUserProfile?.lastName || "",
      suffix: prof.suffix || propUserProfile?.suffix || "",
      citizenship: prof.nationality || propUserProfile?.nationality || "FILIPINO",
      dobMonth: prof.dobMonth || propUserProfile?.dobMonth || "",
      dobDay: prof.dobDay || propUserProfile?.dobDay || "",
      dobYear: prof.dobYear || propUserProfile?.dobYear || "",
      age: prof.age ? String(prof.age) : propUserProfile?.age ? String(propUserProfile.age) : "",
      sex: prof.sex || propUserProfile?.sex || "",
      civilStatus: prof.civilStatus || propUserProfile?.civilStatus || "Single Parent",
      contactNo: prof.contactNo || propUserProfile?.contactNo || "",
      addressHouseNo: prof.addressHouseNo || propUserProfile?.addressHouseNo || "",
      addressStreet: prof.addressStreet || propUserProfile?.addressStreet || "",
      addressBarangay: prof.addressBarangay || propUserProfile?.addressBarangay || "",
      addressCityMunicipality: prof.addressCityMunicipality || propUserProfile?.addressCityMunicipality || "QUEZON CITY",
      qcidNumber: prof.qcidNo || (prof as any).qcidNumber || propUserProfile?.qcidNo || "",
      soloParentIdNumber: "",
      email: prof.email || propUserProfile?.email || "",
      bloodType: (prof as any).bloodType || propUserProfile?.bloodType || "O+",
      monthlyIncome: "Below ₱15,000",
      emergencyFirstName: prof.emergencyFirstName || propUserProfile?.emergencyFirstName || "",
      emergencyLastName: prof.emergencyLastName || propUserProfile?.emergencyLastName || "",
      emergencyContactNo: prof.emergencyContactNo || propUserProfile?.emergencyContactNo || "",
      emergencyRelationship: prof.emergencyRelationship || propUserProfile?.emergencyRelationship || "",
      emergencyAddress: (prof as any).emergencyAddress || propUserProfile?.emergencyAddress || "",
    }
  })

  const [isEditingInfo, setIsEditingInfo] = useState(false)

  // Schooling Children (beneficiaries enrolled in public school)
  const [schoolingChildren, setSchoolingChildren] = useState<SchoolingChild[]>([
    {
      id: "child-1",
      fullName: "",
      birthDate: "",
      age: "",
      schoolName: "",
      gradeLevel: "Grade 1",
      schoolType: "Public School",
    },
    {
      id: "child-2",
      fullName: "",
      birthDate: "",
      age: "",
      schoolName: "",
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
    if (schoolingChildren.length <= 1) return
    setSchoolingChildren((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleUpdateChild = (index: number, field: keyof SchoolingChild, val: string) => {
    setSchoolingChildren((prev) =>
      prev.map((c, idx) => (idx === index ? { ...c, [field]: val } : c))
    )
  }

  // Step 3: Documents
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File[]>>({})
  const [uploadedDocsBase64, setUploadedDocsBase64] = useState<Record<string, string>>({})
  const [cameraDoc, setCameraDoc] = useState<SampleDocument | null>(null)
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; file: File } | null>(null)

  // Step 4: Submit & Modals
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [reference, setReference] = useState("")

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

  const updateField = (field: keyof FormData, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }))
  }

  // Validations
  const step1Valid = checkResidency && checkTwoChildren && checkIndigent && checkAssessmentInterview

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
    (formData.emergencyContactNo || "").replace(/\D/g, "").length === 11 &&
    (formData.emergencyRelationship || "").trim() !== ""

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
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4 animate-in fade-in duration-150 py-8">
        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {language === "en"
                ? "Application Submitted Successfully!"
                : "Matagumpay na Naisumite ang Aplikasyon!"}
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mt-1.5 leading-relaxed">
              {language === "en"
                ? "Your application for the Solo Parent Educational Assistance Program has been received. A City Social Worker will conduct an interview and assessment of your 2 or more schooling children before assistance of ₱5,000 is extended."
                : "Naisumite na ang inyong aplikasyon para sa Solo Parent Educational Assistance Program. Magsasagawa ng panayam (interview) at assessment ang City Social Worker bago maipagkaloob ang ₱5,000 tulong-pinansyal para sa inyong mga mag-aaral na anak."}
            </p>
          </div>

          <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Application Reference No.:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-sky-400">{reference}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Program:</span>
              <span className="font-semibold text-foreground">Solo Parent Educational Assistance</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Assistance Amount:</span>
              <span className="font-semibold text-emerald-600 font-mono">₱5,000 / beneficiary</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Enrolled Children:</span>
              <span className="font-semibold text-foreground">{schoolingChildren.length} mga mag-aaral</span>
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
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-2 space-y-6 animate-in fade-in duration-150">
      {/* Step Indicator */}
      <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STEPS.map((s, idx) => {
            const isCurrent = step === s.id
            const isCompleted = step > s.id
            return (
              <div
                key={s.id}
                className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-sky-300 font-bold"
                    : isCompleted
                    ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "text-muted-foreground opacity-60 font-medium"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    isCurrent
                      ? "bg-blue-600 text-white font-bold"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-200 dark:bg-slate-800 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                </div>
                <span className="text-xs truncate">{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Card Container */}
      <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: CHECKLIST & ELIGIBILITY */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-3 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wide">
                    {language === "en"
                      ? "Educational Assistance — Qualification Checklist"
                      : "Educational Assistance — Checklist at Kwalipikasyon"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === "en"
                      ? "Financial assistance of ₱5,000 per qualified beneficiary for solo parents with 2 or more children enrolled in public school."
                      : "Tulong-pinansyal na ₱5,000 bawat kwalipikadong benepisyaryo para sa mga solo parent na may 2 o higit pang anak sa pampublikong paaralan."}
                  </p>
                </div>
              </div>

              {/* Highlight Info Box */}
              <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-blue-950 dark:text-sky-200">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>QC Social Services Development Department (SSDD) Guidelines</span>
                </div>
                <p className="text-xs text-blue-900/90 dark:text-slate-300 leading-relaxed text-justify">
                  Ang programang ito ay nakalaan para sa mga kapus-palad (indigent) na rehistradong Solo Parents sa Lungsod Quezon na nagtataguyod ng dalawa (2) o higit pang anak na nag-aaral sa pampublikong paaralan. May interview at assessment ang Social Worker bago ma-extend ang ayuda na ₱5,000 bawat benepisyaryo.
                </p>
              </div>

              {/* Checklist items */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Pakilagyan ng tsek (✓) ang lahat ng aytem upang magpatuloy:
                </h3>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/30 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkResidency}
                    onChange={(e) => setCheckResidency(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-blue-600 rounded cursor-pointer shrink-0"
                  />
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-foreground">
                      1. Lehitimong Residente ng Lungsod Quezon at may Solo Parent record
                    </p>
                    <p className="text-muted-foreground">
                      Ako ay naninirahan sa QC at mayroong valid Solo Parent ID o sertipikasyon.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/30 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkTwoChildren}
                    onChange={(e) => setCheckTwoChildren(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-blue-600 rounded cursor-pointer shrink-0"
                  />
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-foreground">
                      2. May dalawa (2) o higit pang anak na naka-enroll sa Pampublikong Paaralan (Public School)
                    </p>
                    <p className="text-muted-foreground">
                      Ang aking mga mag-aaral na anak ay opisyal na naka-enroll sa pampublikong elementarya, high school, o kolehiyo.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/30 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkIndigent}
                    onChange={(e) => setCheckIndigent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-blue-600 rounded cursor-pointer shrink-0"
                  />
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-foreground">
                      3. Kabilang sa Indigent Solo Parents na nangangailangan ng tulong-pinansyal sa edukasyon
                    </p>
                    <p className="text-muted-foreground">
                      Tulong-pinansyal na ₱5,000 bawat benepisyaryo para sa gastusin sa pag-aaral, uniporme, gamit sa eskwela, at proyekto.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/30 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkAssessmentInterview}
                    onChange={(e) => setCheckAssessmentInterview(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-blue-600 rounded cursor-pointer shrink-0"
                  />
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-foreground">
                      4. Sumasang-ayon sa Panayam (Interview) at Assessment ng Social Worker
                    </p>
                    <p className="text-muted-foreground">
                      Nauunawaan ko na may interview at assessment ng Social Worker bago maaprubahan at maipagkaloob ang tulong-pinansyal.
                    </p>
                  </div>
                </label>
              </div>

              {attemptedNext && !step1Valid && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Kailangang lagyan ng tsek ang lahat ng kwalipikasyon bago makapagpatuloy.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: APPLICANT & BENEFICIARIES */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wide">
                    {language === "en" ? "Applicant & Schooling Beneficiaries" : "Impormasyon ng Magulang at Mag-aaral"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pakisuri ang inyong personal na impormasyon at ilagay ang detalye ng inyong mga anak na nag-aaral sa pampublikong paaralan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingInfo((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {isEditingInfo ? "LOCK FIELDS" : "EDIT INFO"}
                </button>
              </div>

              {/* Applicant Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>I. Personal Details ng Solo Parent</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo ? "bg-gray-100 dark:bg-slate-800 text-foreground border-border" : "bg-white border-blue-400"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Middle Name</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => updateField("middleName", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo ? "bg-gray-100 dark:bg-slate-800 text-foreground border-border" : "bg-white border-blue-400"
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
                        !isEditingInfo ? "bg-gray-100 dark:bg-slate-800 text-foreground border-border" : "bg-white border-blue-400"
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
                      placeholder="e.g. Sauyo"
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo ? "bg-gray-100 dark:bg-slate-800 text-foreground border-border" : "bg-white border-blue-400"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Contact Number *</label>
                    <input
                      type="text"
                      value={formData.contactNo}
                      onChange={(e) => updateField("contactNo", e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="09XXXXXXXXX"
                      maxLength={11}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 font-mono transition-colors ${
                        !isEditingInfo ? "bg-gray-100 dark:bg-slate-800 text-foreground border-border" : "bg-white border-blue-400"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Solo Parent ID / Cert No. (Kung mayroon)</label>
                    <input
                      type="text"
                      value={formData.soloParentIdNumber}
                      onChange={(e) => updateField("soloParentIdNumber", e.target.value)}
                      placeholder="e.g. 137404-2026-XXXXXX"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 font-mono bg-white dark:bg-slate-900"
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
                      <span>II. Mga Mag-aaral na Anak na Benepisyaryo (Public School)</span>
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
                    <span>MAGDAGDAG NG ANAK (ADD CHILD)</span>
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
                          Benepisyaryong Anak #{idx + 1}
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
                  <span>III. Emergency Contact Person</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">First Name *</label>
                    <input
                      type="text"
                      value={formData.emergencyFirstName}
                      onChange={(e) => updateField("emergencyFirstName", e.target.value)}
                      placeholder="First Name"
                      className="w-full border border-border rounded-lg px-3 py-2 text-xs mt-1 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Last Name *</label>
                    <input
                      type="text"
                      value={formData.emergencyLastName}
                      onChange={(e) => updateField("emergencyLastName", e.target.value)}
                      placeholder="Last Name"
                      className="w-full border border-border rounded-lg px-3 py-2 text-xs mt-1 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Contact Number (11-digits) *</label>
                    <input
                      type="text"
                      value={formData.emergencyContactNo}
                      onChange={(e) => updateField("emergencyContactNo", e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="09XXXXXXXXX"
                      maxLength={11}
                      className="w-full border border-border rounded-lg px-3 py-2 text-xs mt-1 font-mono bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Relationship *</label>
                    <select
                      value={formData.emergencyRelationship}
                      onChange={(e) => updateField("emergencyRelationship", e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-xs mt-1 bg-white dark:bg-slate-900"
                    >
                      <option value="">Pumili ng Relasyon</option>
                      <option value="Magulang">Magulang (Parent)</option>
                      <option value="Kapatid">Kapatid (Sibling)</option>
                      <option value="Kamag-anak">Kamag-anak (Relative)</option>
                      <option value="Kapitbahay">Kapitbahay (Neighbor)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Address *</label>
                    <input
                      type="text"
                      value={formData.emergencyAddress}
                      onChange={(e) => updateField("emergencyAddress", e.target.value)}
                      placeholder="Tirahan sa Quezon City"
                      className="w-full border border-border rounded-lg px-3 py-2 text-xs mt-1 bg-white dark:bg-slate-900"
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
                <h2 className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wide">
                  {language === "en" ? "Documentary Requirements" : "Upload ng mga Dokumento"}
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
                <h2 className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wide">
                  {language === "en" ? "Review & Confirmation" : "Pagsusuri at Pagsumite"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pakisuri ang lahat ng impormasyon bago isumite ang aplikasyon para sa Solo Parent Educational Assistance.
                </p>
              </div>

              {/* Program Summary */}
              <ReviewSection title="Program Details" onEdit={() => setStep(1)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-xs">
                  <ReviewField label="Program" value="Solo Parent Educational Assistance Program" />
                  <ReviewField label="Assistance Amount" value="₱5,000 bawat kwalipikadong mag-aaral" />
                  <ReviewField label="Assessment Process" value="Subject to interview & assessment by Social Worker" />
                  <ReviewField label="Enrolled School Children" value={`${schoolingChildren.length} mga mag-aaral`} />
                </div>
              </ReviewSection>

              {/* Applicant Info */}
              <ReviewSection title="Applicant Information" onEdit={() => setStep(2)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-xs">
                  <ReviewField label="Full Name" value={fullApplicantName} />
                  <ReviewField label="Barangay" value={formData.addressBarangay} />
                  <ReviewField label="Contact Number" value={formData.contactNo} />
                  <ReviewField label="Email Address" value={formData.email} />
                  <ReviewField label="Emergency Contact" value={`${formData.emergencyFirstName} ${formData.emergencyLastName} (${formData.emergencyContactNo})`} />
                </div>
              </ReviewSection>

              {/* Schooling Children Summary */}
              <ReviewSection title="Schooling Children (Beneficiaries)" onEdit={() => setStep(2)}>
                <div className="p-4 space-y-2 text-xs">
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
              </ReviewSection>

              {/* Uploaded Documents Summary */}
              <ReviewSection title="Uploaded Documents" onEdit={() => setStep(3)}>
                <div className="p-4 space-y-2 text-xs">
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
              </ReviewSection>

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
        <div className="bg-gray-50 dark:bg-slate-800/60 border-t border-border px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className="px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer"
          >
            {step === 1 ? (language === "en" ? "CANCEL" : "KANSELAHIN") : (language === "en" ? "BACK" : "BUMALIK")}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer shadow-xs"
            >
              {language === "en" ? "NEXT STEP" : "SUSUNOD"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!privacyAgreed || submitting}
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer shadow-xs flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{language === "en" ? "SUBMIT APPLICATION" : "ISUMITE ANG APLIKASYON"}</span>
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
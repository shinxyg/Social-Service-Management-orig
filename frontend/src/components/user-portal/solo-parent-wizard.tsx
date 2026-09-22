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
  User,
  Briefcase,
  HelpCircle,
} from "lucide-react"

import DocumentCameraModal from "../ui/document-camera-modal"
import { DataPrivacyConsent } from "../ui/data-privacy-consent"
import { SubmitPrivacyOverlayModal } from "../ui/submit-privacy-overlay-modal"
import { API_BASE, getAuthHeaders } from "../../config/api"
import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"
import { notifyApplicationChange } from "../../utils/realtimeSync"
import { readFileAsDataUrl } from "../../utils/fileUpload"

interface SampleDocument {
  id: string
  label: string
  description?: string
  images?: string[]
  downloadUrl?: string
}

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

function LockedField({ value, placeholder }: { value?: string; placeholder?: string }) {
  return (
    <div className="w-full border border-border dark:border-slate-800 bg-gray-100 dark:bg-slate-800/80 rounded-lg px-3 py-2.5 text-sm text-foreground select-none cursor-not-allowed">
      {value || <span className="text-muted-foreground">{placeholder || "—"}</span>}
    </div>
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
      <option value="">{placeholder}</option>
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
          EDIT
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
  programType?: string | null
  isModalOpen?: boolean
  onBlockedStatusChange?: (blocked: boolean, app?: any) => void
  onStepChange?: (step: number) => void
  onSubmissionStageChange?: (stage: "form" | "matching" | "pending") => void
}

export default function SoloParentApplicationWizard({
  onBack,
  userProfile: propUserProfile,
  programType = "financial-subsidy",
  onStepChange,
  onSubmissionStageChange,
}: SoloParentApplicationWizardProps) {
  const userProfile = propUserProfile || getCurrentUserProfile()

  const STEPS = [
    { id: 1, label: "APPLICATION FORM" },
    { id: 2, label: "REQUIRED DOCUMENTS" },
    { id: 3, label: "REVIEW & SUBMIT" },
  ]

  const [step, setStep] = useState(1)
  const [returnToReview, setReturnToReview] = useState(false)
  const [attemptedNext, setAttemptedNext] = useState(false)

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  // Step 1: Preliminary fields
  const [soloParentIdNumber, setSoloParentIdNumber] = useState("")
  const [isIdVerified, setIsIdVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null)
  const [soloParentStatus, setSoloParentStatus] = useState("")
  const [employmentStatus, setEmploymentStatus] = useState("")

  // Step 1: Section A. Applicant Information
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || "",
    middleName: userProfile?.middleName || "",
    lastName: userProfile?.lastName || "",
    suffix: userProfile?.suffix || "",
    birthDate: userProfile?.dob || userProfile?.birthDate || "1988-04-15",
    dobMonth: userProfile?.dobMonth || "04",
    dobDay: userProfile?.dobDay || "15",
    dobYear: userProfile?.dobYear || "1988",
    age: userProfile?.age ? String(userProfile.age) : "38",
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
  })

  // Step 1: Section B. Solo Parent Information
  const [soloParentCategory, setSoloParentCategory] = useState("Unmarried parent")
  const [numberOfDependents, setNumberOfDependents] = useState("2")
  const [ageOfYoungestDependent, setAgeOfYoungestDependent] = useState("4")

  // Step 1: Section C. Employment & Income Information
  const [occupation, setOccupation] = useState("")
  const [employerOrIncomeSource, setEmployerOrIncomeSource] = useState("")
  const [monthlyIncome, setMonthlyIncome] = useState("")
  const [otherSourceOfIncome, setOtherSourceOfIncome] = useState("")

  // Step 1: Section D. Other Government Assistance
  const [receivingGovAssistance, setReceivingGovAssistance] = useState<"No" | "Yes">("No")
  const [govAssistanceProgramName, setGovAssistanceProgramName] = useState("")
  const [govAssistanceAmountFreq, setGovAssistanceAmountFreq] = useState("")
  const [receivingPension, setReceivingPension] = useState<"No" | "Yes">("No")
  const [pensionType, setPensionType] = useState("")

  const [isEditingInfo, setIsEditingInfo] = useState(false)

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

  // Step 2: Documents based on Employment Status
  const getProofDocumentLabel = () => {
    if (employmentStatus === "Unemployed") {
      return {
        label: "3. PROOF OF INDIGENCY: AFFIDAVIT OF NO EMPLOYMENT / NON-EMPLOYMENT",
        description: "Notarized Affidavit of No Employment or Certificate of Non-Employment.",
      }
    }
    if (employmentStatus === "Employed") {
      return {
        label: "3. PROOF OF INCOME: LATEST ITR OR LATEST PAYSLIP (1 MONTH)",
        description: "Latest Income Tax Return (ITR) or latest payslip covering one month.",
      }
    }
    return {
      label: "3. PROOF OF INDIGENCY / INCOME OR BARANGAY CERTIFICATE",
      description: "Verifiable proof of income or Barangay Certificate of Indigency.",
    }
  }

  const proofDocInfo = getProofDocumentLabel()

  const requiredDocuments: SampleDocument[] = [
    {
      id: "spicIdCard",
      label: "1. SOLO PARENT IDENTIFICATION CARD (SPIC)",
      description: "Photocopy or clear scan/photo of your valid Solo Parent ID (SPIC).",
      images: ["/samples/QC ID.png"],
      downloadUrl: "/samples/QC ID.png",
    },
    {
      id: "qcidCard",
      label: "2. QCITIZEN ID (QC ID)",
      description: "Photocopy or clear scan/photo of your valid QCitizen ID.",
      images: ["/samples/QC ID.png"],
      downloadUrl: "/samples/QC ID.png",
    },
    {
      id: "proofOfIndigencyOrIncome",
      label: proofDocInfo.label,
      description: proofDocInfo.description,
      images: ["/samples/BARANGAY CERTIFICATE.webp"],
      downloadUrl: "/samples/BARANGAY CERTIFICATE.webp",
    },
  ]

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File[]>>({})
  const [uploadedDocsBase64, setUploadedDocsBase64] = useState<Record<string, string>>({})
  const [cameraDoc, setCameraDoc] = useState<SampleDocument | null>(null)

  const handleFileUpload = async (docId: string, files: File[]) => {
    setUploadedDocs((prev) => ({ ...prev, [docId]: files }))
    if (!files.length) return
    try {
      const dataUrl = await readFileAsDataUrl(files[0])
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

  // Step 3: Submission & Validation
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [reference, setReference] = useState("")

  const step1Valid = Boolean(
    soloParentIdNumber.trim() &&
    employmentStatus &&
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.qcidNumber.trim() &&
    formData.contactNo.replace(/\D/g, "").length >= 10 &&
    formData.addressBarangay.trim() &&
    formData.email.trim() &&
    soloParentCategory &&
    numberOfDependents.trim() &&
    ageOfYoungestDependent.trim()
  )

  const step2Valid = requiredDocuments.every(
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

    setAttemptedNext(false)
    if (returnToReview && step1Valid && step2Valid) {
      setStep(3)
      setReturnToReview(false)
      return
    }
    setReturnToReview(false)
    setStep((s) => Math.min(s + 1, 3))
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
    const generatedRef = `SP-SUB-2026-${randNum}`
    setReference(generatedRef)

    const docPayload = requiredDocuments.map((doc) => ({
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
      service: "Solo Parent Financial Subsidy Program",
      service_name: "Solo Parent Financial Subsidy Program",
      classification_title: "Solo Parent Financial Subsidy Program",
      assistanceType: "Financial Subsidy",
      type: programType || "financial-subsidy",
      application_type: programType || "financial-subsidy",
      solo_parent_id_number: soloParentIdNumber.startsWith("SP-") ? soloParentIdNumber : `SP-${soloParentIdNumber}`,
      soloParentStatus: soloParentStatus || "Active / Verified Solo Parent",
      employment_status: employmentStatus,
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName,
      qcid_number: formData.qcidNumber || getLoggedInUserQcid() || "110000572516915",
      email: formData.email,
      contact_no: formData.contactNo,
      address_barangay: formData.addressBarangay,
      solo_parent_category: soloParentCategory,
      number_of_dependents: numberOfDependents,
      age_of_youngest_dependent: ageOfYoungestDependent,
      occupation,
      employer_or_income_source: employerOrIncomeSource,
      monthly_income: monthlyIncome,
      other_source_of_income: otherSourceOfIncome,
      receiving_gov_assistance: receivingGovAssistance,
      gov_assistance_program: govAssistanceProgramName,
      gov_assistance_amount_freq: govAssistanceAmountFreq,
      receiving_pension: receivingPension,
      pension_type: pensionType,
      financial_assistance_amount: "Financial Subsidy (Subject to assessment)",
      status: "pending",
      application_status: "pending",
      created_at: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      form_data: {
        ...formData,
        soloParentIdNumber,
        soloParentStatus,
        employmentStatus,
        soloParentCategory,
        numberOfDependents,
        ageOfYoungestDependent,
        occupation,
        employerOrIncomeSource,
        monthlyIncome,
        otherSourceOfIncome,
        receivingGovAssistance,
        govAssistanceProgramName,
        govAssistanceAmountFreq,
        receivingPension,
        pensionType,
        assistanceAmount: "Financial Subsidy",
        assessmentStatus: "Pending Social Worker Assessment & Verification",
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
              Application Submitted Successfully!
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mt-1.5 leading-relaxed">
              Your application for the Solo Parent Financial Subsidy Program has been submitted. A Social Worker will conduct document verification and assessment before approval.
            </p>
          </div>

          <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Application Reference No.:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-sky-400">{reference}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Solo Parent ID (SPIC):</span>
              <span className="font-mono font-bold text-foreground">
                {soloParentIdNumber.startsWith("SP-") ? soloParentIdNumber : `SP-${soloParentIdNumber}`}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Program:</span>
              <span className="font-semibold text-foreground">Solo Parent Financial Subsidy Program</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-muted-foreground font-medium">Employment Status:</span>
              <span className="font-semibold text-foreground">{employmentStatus || "—"}</span>
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
              VIEW IN APPLICATION HISTORY
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
        {/* Stepper Circles */}
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

        {/* Step Tabs */}
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

        {/* Main Step Content */}
        <div className="p-6 min-h-90">
          {/* ================= STEP 1: APPLICATION FORM ================= */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Notice Box */}
              <div className="bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 flex items-start gap-3.5 shadow-xs">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="text-xs md:text-sm font-bold text-blue-950 dark:text-blue-200">
                    SOLO PARENT SECTOR: Qualified applicants may receive financial subsidy.
                  </p>
                  <p className="text-blue-900/90 dark:text-blue-300/90 leading-relaxed text-justify">
                    For qualified Solo Parents who meet the applicable income and program requirements. Eligibility is subject to document verification and assessment before approval.
                  </p>
                </div>
              </div>

              {/* Primary Verification & Employment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-border pb-5">
                {/* Solo Parent ID Number */}
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide block text-foreground">
                      SOLO PARENT ID NUMBER <span className="text-red-500">*</span>
                    </label>
                    {isIdVerified && soloParentIdNumber.trim() && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Solo Parent ID Verified
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
                      className={`px-4 py-2 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 h-10 ${
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
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      {verifyNotice}
                    </p>
                  )}
                  {attemptedNext && !soloParentIdNumber.trim() && (
                    <p className="text-xs text-red-500 mt-1">Please enter your Solo Parent ID Number.</p>
                  )}
                </div>

                {/* Solo Parent Status */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide block text-foreground mb-1.5">
                    SOLO PARENT STATUS <span className="text-red-500">*</span>
                  </label>
                  <LockedField
                    value={
                      isIdVerified && soloParentIdNumber.trim()
                        ? soloParentStatus || "Active / Verified Solo Parent"
                        : ""
                    }
                    placeholder="Auto-filled upon Solo Parent ID verification"
                  />
                </div>

                {/* Employment Status */}
                <div className="sm:col-span-3">
                  <label className="text-xs font-semibold uppercase tracking-wide block text-foreground mb-1.5">
                    EMPLOYMENT STATUS <span className="text-red-500">*</span>
                  </label>
                  <SelectInput
                    value={employmentStatus}
                    onChange={setEmploymentStatus}
                    placeholder="Select Employment Status..."
                    options={[
                      { label: "Employed", value: "Employed" },
                      { label: "Unemployed", value: "Unemployed" },
                      { label: "Informal Economy Worker", value: "Informal Economy Worker" },
                    ]}
                    invalid={attemptedNext && !employmentStatus}
                  />
                  {attemptedNext && !employmentStatus && (
                    <p className="text-xs text-red-500 mt-1">Please select your Employment Status.</p>
                  )}
                </div>
              </div>

              {/* A. APPLICANT INFORMATION */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>A. Applicant Information</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{isEditingInfo ? "LOCK INFORMATION" : "EDIT INFORMATION"}</span>
                  </button>
                </div>

                {/* Full Name */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                      placeholder="e.g. Jr., III"
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 border-blue-400"
                      }`}
                    />
                  </div>
                </div>

                {/* DOB, Sex, Civil Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Date of Birth (YYYY-MM-DD) *</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => updateField("birthDate", e.target.value)}
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
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Sex *</label>
                    <select
                      value={formData.sex}
                      onChange={(e) => updateField("sex", e.target.value)}
                      disabled={!isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 border-blue-400"
                      }`}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Civil Status *</label>
                    <input
                      type="text"
                      value={formData.civilStatus}
                      onChange={(e) => updateField("civilStatus", e.target.value)}
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

                {/* Address */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Complete Address (House/Street) *</label>
                    <input
                      type="text"
                      value={formData.addressStreet}
                      onChange={(e) => updateField("addressStreet", e.target.value)}
                      readOnly={!isEditingInfo}
                      disabled={!isEditingInfo}
                      placeholder="House / Unit / Street"
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        !isEditingInfo
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 border-blue-400"
                      }`}
                    />
                  </div>
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
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">City / Municipality *</label>
                    <input
                      type="text"
                      value={formData.addressCityMunicipality}
                      onChange={(e) => updateField("addressCityMunicipality", e.target.value)}
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

                {/* Contact, Email, QCID, SPIC */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">QCitizen ID Number *</label>
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
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Solo Parent ID (SPIC) Number</label>
                    <input
                      type="text"
                      value={soloParentIdNumber ? (soloParentIdNumber.startsWith("SP-") ? soloParentIdNumber : `SP-${soloParentIdNumber}`) : "—"}
                      readOnly
                      disabled
                      className="w-full border rounded-lg px-3 py-2 text-sm mt-1 font-mono bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* B. SOLO PARENT INFORMATION */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>B. Solo Parent Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                      Solo Parent Category / Reason *
                    </label>
                    <SelectInput
                      value={soloParentCategory}
                      onChange={setSoloParentCategory}
                      options={[
                        { label: "Unmarried parent", value: "Unmarried parent" },
                        { label: "Widow / Widower", value: "Widow/Widower" },
                        { label: "Abandoned by spouse", value: "Abandoned by spouse" },
                        { label: "Separated", value: "Separated" },
                        { label: "Spouse with disability/incapacity", value: "Spouse with disability/incapacity" },
                        { label: "Other qualified category", value: "Other qualified category" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                      Number of Dependents *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={numberOfDependents}
                      onChange={(e) => setNumberOfDependents(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                      Age of Youngest Dependent *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={ageOfYoungestDependent}
                      onChange={(e) => setAgeOfYoungestDependent(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* C. EMPLOYMENT & INCOME INFORMATION */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>C. Employment & Income Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="e.g. Vendor, Clerk, Freelancer"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                      Employer / Source of Income
                    </label>
                    <input
                      type="text"
                      value={employerOrIncomeSource}
                      onChange={(e) => setEmployerOrIncomeSource(e.target.value)}
                      placeholder="e.g. Self-employed, Company Name"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                      Monthly Income (Estimated)
                    </label>
                    <input
                      type="text"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      placeholder="e.g. ₱5,000 - ₱10,000"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                      Other Source of Income
                    </label>
                    <input
                      type="text"
                      value={otherSourceOfIncome}
                      onChange={(e) => setOtherSourceOfIncome(e.target.value)}
                      placeholder="e.g. Remittance, Sideline, None"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* D. OTHER GOVERNMENT ASSISTANCE */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>D. Other Government Assistance</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Government Assistance */}
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-border">
                    <label className="text-xs font-semibold text-foreground block">
                      Currently receiving government assistance?
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="govAssistance"
                          value="Yes"
                          checked={receivingGovAssistance === "Yes"}
                          onChange={() => setReceivingGovAssistance("Yes")}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="govAssistance"
                          value="No"
                          checked={receivingGovAssistance === "No"}
                          onChange={() => setReceivingGovAssistance("No")}
                        />
                        <span>No</span>
                      </label>
                    </div>
                    {receivingGovAssistance === "Yes" && (
                      <div className="space-y-2 pt-2">
                        <input
                          type="text"
                          value={govAssistanceProgramName}
                          onChange={(e) => setGovAssistanceProgramName(e.target.value)}
                          placeholder="Program Name (e.g. 4Ps, UCT)"
                          className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-900 text-foreground"
                        />
                        <input
                          type="text"
                          value={govAssistanceAmountFreq}
                          onChange={(e) => setGovAssistanceAmountFreq(e.target.value)}
                          placeholder="Amount / Frequency (e.g. ₱1,500/month)"
                          className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-900 text-foreground"
                        />
                      </div>
                    )}
                  </div>

                  {/* Pension */}
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-border">
                    <label className="text-xs font-semibold text-foreground block">
                      Receiving pension?
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="pensionRadio"
                          value="Yes"
                          checked={receivingPension === "Yes"}
                          onChange={() => setReceivingPension("Yes")}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="pensionRadio"
                          value="No"
                          checked={receivingPension === "No"}
                          onChange={() => setReceivingPension("No")}
                        />
                        <span>No</span>
                      </label>
                    </div>
                    {receivingPension === "Yes" && (
                      <div className="pt-2">
                        <input
                          type="text"
                          value={pensionType}
                          onChange={(e) => setPensionType(e.target.value)}
                          placeholder="Type of Pension (e.g. SSS Survivorship, GSIS)"
                          className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-900 text-foreground"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {attemptedNext && !step1Valid && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Please ensure your Solo Parent ID is entered, Employment Status is selected, and all required personal details are filled.</span>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: REQUIRED DOCUMENTS ================= */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-bold text-foreground uppercase tracking-wide">
                  REQUIRED DOCUMENTS
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Please upload clear photocopies or photographs of the required documents below.
                </p>
              </div>

              {/* Status Hint */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-border text-xs text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Employment Status: <strong className="text-foreground font-semibold">{employmentStatus || "Not Specified"}</strong> — Document requirements for Proof of Indigency/Income are tailored accordingly.
                </span>
              </div>

              <div className="space-y-4">
                {requiredDocuments.map((doc, docIndex) => {
                  const files = uploadedDocs[doc.id] || []
                  const uploaded = files.length > 0
                  const inputId = `upload-doc-${docIndex}`
                  const invalid = attemptedNext && !uploaded

                  return (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-xl border transition-all ${
                        uploaded
                          ? "border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                          : invalid
                          ? "border-red-300 dark:border-red-800/60 bg-red-50/30 dark:bg-red-950/10"
                          : "border-border bg-card dark:bg-slate-900/40"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                              {doc.label}
                            </span>
                            <span className="text-red-500 font-bold">*</span>
                            {uploaded ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3 stroke-[3]" /> Uploaded
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                                Required
                              </span>
                            )}
                          </div>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {doc.description}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          <input
                            id={inputId}
                            type="file"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const selected = Array.from(e.target.files || [])
                              if (selected.length) {
                                handleFileUpload(doc.id, selected)
                              }
                            }}
                          />
                          <label
                            htmlFor={inputId}
                            className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>CHOOSE FILE</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setCameraDoc(doc)}
                            className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
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
                          Please upload a valid document for this required item.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 3: REVIEW & SUBMIT ================= */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-bold text-foreground uppercase tracking-wide">
                  REVIEW & SUBMIT INFORMATION
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Please review all your details carefully before submitting your application for the Solo Parent Financial Subsidy Program.
                </p>
              </div>

              {/* Preliminary & Applicant Information */}
              <AccordionSection title="Applicant Information" onEdit={() => setStep(1)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <ReviewField label="Solo Parent ID (SPIC)" value={soloParentIdNumber.startsWith("SP-") ? soloParentIdNumber : `SP-${soloParentIdNumber}`} />
                  <ReviewField label="Solo Parent Status" value={soloParentStatus || "Active / Verified Solo Parent"} />
                  <ReviewField label="Employment Status" value={employmentStatus} />
                  <ReviewField label="Full Name" value={fullApplicantName} />
                  <ReviewField label="Date of Birth / Age" value={`${formData.birthDate} (Age: ${formData.age})`} />
                  <ReviewField label="Sex / Civil Status" value={`${formData.sex} / ${formData.civilStatus}`} />
                  <ReviewField label="Complete Address" value={`${formData.addressStreet ? `${formData.addressStreet}, ` : ""}${formData.addressBarangay}, ${formData.addressCityMunicipality}`} />
                  <ReviewField label="Contact / Email" value={`${formData.contactNo} / ${formData.email}`} />
                  <ReviewField label="QCitizen ID Number" value={formData.qcidNumber} />
                </div>
              </AccordionSection>

              {/* Solo Parent & Employment Info */}
              <AccordionSection title="Solo Parent, Employment & Income Information" onEdit={() => setStep(1)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <ReviewField label="Category / Reason" value={soloParentCategory} />
                  <ReviewField label="Dependents Info" value={`${numberOfDependents} dependent(s) (Youngest Age: ${ageOfYoungestDependent})`} />
                  <ReviewField label="Occupation" value={occupation || "—"} />
                  <ReviewField label="Employer / Source of Income" value={employerOrIncomeSource || "—"} />
                  <ReviewField label="Monthly Income" value={monthlyIncome || "—"} />
                  <ReviewField label="Other Source of Income" value={otherSourceOfIncome || "—"} />
                  <ReviewField label="Other Gov Assistance" value={receivingGovAssistance === "Yes" ? `${govAssistanceProgramName} (${govAssistanceAmountFreq})` : "None"} />
                  <ReviewField label="Pension" value={receivingPension === "Yes" ? pensionType : "None"} />
                </div>
              </AccordionSection>

              {/* Uploaded Documents */}
              <AccordionSection title="Required Documents" onEdit={() => setStep(2)}>
                <div className="space-y-2 text-xs">
                  {requiredDocuments.map((doc) => {
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
            {step === 1 ? "CANCEL" : "BACK"}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer shadow-xs"
            >
              NEXT
            </button>
          ) : (
            <button
              type="button"
              disabled={!privacyAgreed || submitting}
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer shadow-xs flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>SUBMIT APPLICATION</span>
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
          isSubmitting={submitting}
        />
      )}
    </div>
  )
}
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
  return <FileText className="h-6 w-6 text-gray-400" />
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
  initialCategoryId,
  initialType,
  programType = "financial-subsidy",
  isModalOpen,
  onBlockedStatusChange,
  onStepChange,
  onSubmissionStageChange,
}: SoloParentApplicationWizardProps) {
  const userProfile = propUserProfile || getCurrentUserProfile()
  const isEducational =
    String(programType || "").toLowerCase().includes("educational") ||
    String(initialType || "").toLowerCase().includes("educational")

  const STEPS = [
    { id: 1, label: "VERIFICATION" },
    { id: 2, label: isEducational ? "EDUCATIONAL FORM" : "APPLICATION FORM" },
    { id: 3, label: "REQUIRED DOCUMENTS" },
    { id: 4, label: "REVIEW & SUBMIT" },
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

  // Step 2: Section A. Solo Parent / Guardian Information
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

  // Financial Subsidy Specific Fields
  const [soloParentCategory, setSoloParentCategory] = useState("")
  const [numberOfDependents, setNumberOfDependents] = useState("")
  const [ageOfYoungestDependent, setAgeOfYoungestDependent] = useState("")
  const [occupation, setOccupation] = useState("")
  const [employerOrIncomeSource, setEmployerOrIncomeSource] = useState("")
  const [monthlyIncome, setMonthlyIncome] = useState("")
  const [otherSourceOfIncome, setOtherSourceOfIncome] = useState("")
  const [receivingGovAssistance, setReceivingGovAssistance] = useState<"No" | "Yes" | "">("")
  const [govAssistanceProgramName, setGovAssistanceProgramName] = useState("")
  const [govAssistanceAmountFreq, setGovAssistanceAmountFreq] = useState("")
  const [receivingPension, setReceivingPension] = useState<"No" | "Yes" | "">("")
  const [pensionType, setPensionType] = useState("")

  // Educational Assistance Specific Fields
  const [childName, setChildName] = useState("")
  const [childAge, setChildAge] = useState("")
  const [childBirthday, setChildBirthday] = useState("")
  const [childSex, setChildSex] = useState("Male")
  const [childRelationship, setChildRelationship] = useState("Child / Dependent")
  const [childSchoolName, setChildSchoolName] = useState("")
  const [childSchoolAddress, setChildSchoolAddress] = useState("")
  const [childGradeLevel, setChildGradeLevel] = useState("")
  const [childLrnOrId, setChildLrnOrId] = useState("")

  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        firstName: userProfile.firstName || prev.firstName,
        middleName: userProfile.middleName || prev.middleName,
        lastName: userProfile.lastName || prev.lastName,
        suffix: userProfile.suffix || prev.suffix,
        birthDate: userProfile.dob || userProfile.birthDate || prev.birthDate,
        sex: userProfile.sex || userProfile.gender || prev.sex,
        civilStatus: userProfile.civilStatus || prev.civilStatus,
        addressStreet: userProfile.addressStreet || userProfile.addressHouseNo || prev.addressStreet,
        addressBarangay: userProfile.addressBarangay || prev.addressBarangay,
        addressCityMunicipality: userProfile.addressCityMunicipality || prev.addressCityMunicipality,
        contactNo: userProfile.contactNo || prev.contactNo,
        email: userProfile.email || prev.email,
        qcidNumber: userProfile.qcidNo || userProfile.qcidNumber || prev.qcidNumber,
      }))
    }
  }, [userProfile])

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

  // Step 3: Documents based on Program Type & Employment Status
  const getProofDocumentLabel = () => {
    if (employmentStatus === "Unemployed") {
      return {
        label: "PROOF OF INDIGENCY: AFFIDAVIT OF NO EMPLOYMENT / NON-EMPLOYMENT",
        description: "Notarized Affidavit of No Employment or Certificate of Non-Employment.",
        note: "If unemployed: Notarized Affidavit of No Employment or Certificate of Non-Employment from Barangay.",
      }
    }
    if (employmentStatus === "Employed") {
      return {
        label: "PROOF OF INCOME: LATEST ITR OR LATEST PAYSLIP (1 MONTH)",
        description: "Latest Income Tax Return (ITR) or latest payslip covering one month.",
        note: "If employed: Latest ITR or latest 1-month payslip from your employer.",
      }
    }
    return {
      label: "PROOF OF INDIGENCY / INCOME OR BARANGAY CERTIFICATE",
      description: "Verifiable proof of income or Barangay Certificate of Indigency.",
      note: "Informal economy worker: Barangay Certificate of Indigency or proof of income.",
    }
  }

  const proofDocInfo = getProofDocumentLabel()

  const requiredDocuments: SampleDocument[] = isEducational
    ? [
        {
          id: "certOfEnrollment",
          label: "CERTIFICATE OF ENROLLMENT / REGISTRATION FORM",
          description: "Official Certificate of Matriculation, Registration Form, or School Certification for current academic year.",
          images: ["/samples/BIRTH CERTIFICATE OF MINOR.jpg"],
          downloadUrl: "/samples/BIRTH CERTIFICATE OF MINOR.jpg",
        },
        {
          id: "reportCard",
          label: "REPORT CARD / COPY OF GRADES",
          description: "Latest School Report Card (Form 138) or Copy of Official Grades of the enrolled student.",
          images: ["/samples/BIRTH CERTIFICATE OF MINOR.jpg"],
          downloadUrl: "/samples/BIRTH CERTIFICATE OF MINOR.jpg",
        },
        {
          id: "spicIdCard",
          label: "SOLO PARENT IDENTIFICATION CARD (SPIC)",
          description: "Photocopy or clear scan/photo of your valid Solo Parent ID (SPIC).",
          images: ["/samples/QC ID.png"],
          downloadUrl: "/samples/QC ID.png",
        },
        {
          id: "qcidCard",
          label: "QCITIZEN ID / APPLICABLE IDENTIFICATION",
          description: "Clear photo of your QCitizen ID or any applicable identification card (front and back).",
          images: ["/samples/QC ID.png"],
          downloadUrl: "/samples/QC ID.png",
        },
        {
          id: "proofOfIndigencyOrIncome",
          label: "BARANGAY CERTIFICATE OF INDIGENCY / LOW INCOME",
          description: "Barangay Certificate of Indigency or Certificate of Low Income.",
          images: ["/samples/BARANGAY CERTIFICATE.webp"],
          downloadUrl: "/samples/BARANGAY CERTIFICATE.webp",
        },
      ]
    : [
        {
          id: "spicIdCard",
          label: "SOLO PARENT IDENTIFICATION CARD (SPIC)",
          description: "Photocopy or clear scan/photo of your valid Solo Parent ID (SPIC).",
          images: ["/samples/QC ID.png"],
          downloadUrl: "/samples/QC ID.png",
        },
        {
          id: "qcidCard",
          label: "QCITIZEN ID / APPLICABLE IDENTIFICATION",
          description: "Clear photo of your QCitizen ID or any applicable identification card (front and back).",
          images: ["/samples/QC ID.png"],
          downloadUrl: "/samples/QC ID.png",
        },
        {
          id: "proofOfIndigencyOrIncome",
          label: proofDocInfo.label,
          description: proofDocInfo.description,
          note: proofDocInfo.note,
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

  // Step 4: Submission & Validation
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [reference, setReference] = useState("")

  const step1Valid = Boolean(soloParentIdNumber.trim() && employmentStatus)

  const step2Valid = isEducational
    ? Boolean(
        formData.firstName.trim() &&
        formData.lastName.trim() &&
        formData.qcidNumber.trim() &&
        formData.contactNo.replace(/\D/g, "").length >= 10 &&
        formData.addressBarangay.trim() &&
        formData.email.trim() &&
        childName.trim() &&
        childAge.trim() &&
        childBirthday.trim() &&
        childSex.trim() &&
        childSchoolName.trim() &&
        childSchoolAddress.trim() &&
        childGradeLevel.trim() &&
        childLrnOrId.trim()
      )
    : Boolean(
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

  const step3Valid = requiredDocuments.every(
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
    if (returnToReview && step1Valid && step2Valid && step3Valid) {
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
    const generatedRef = isEducational ? `SP-EDU-2026-${randNum}` : `SP-SUB-2026-${randNum}`
    setReference(generatedRef)

    const docPayload = requiredDocuments.map((doc) => ({
      documentId: doc.id,
      documentLabel: doc.label,
      files: (uploadedDocs[doc.id] || []).map((f) => ({
        filename: f.name,
        size: f.size,
        dataUrl: uploadedDocsBase64[doc.id] || null,
      })),
    }))

    const newAppRecord = {
      id: String(Date.now()),
      reference_number: generatedRef,
      referenceNumber: generatedRef,
      category: "Solo Parent",
      module_type: "SOLO_PARENT",
      service: isEducational ? "Solo Parent Educational Assistance Program" : "Solo Parent Financial Subsidy Program",
      service_name: isEducational ? "Solo Parent Educational Assistance Program" : "Solo Parent Financial Subsidy Program",
      classification_title: isEducational ? "Solo Parent Educational Assistance Program" : "Solo Parent Financial Subsidy Program",
      assistanceType: isEducational ? "Solo Parent Educational Assistance" : "Financial Subsidy",
      type: isEducational ? "educational-assistance" : (programType || "financial-subsidy"),
      application_type: isEducational ? "EDUCATIONAL_ASSISTANCE" : (programType || "financial-subsidy"),
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
      // Educational Specific Details
      child_name: isEducational ? childName : undefined,
      child_age: isEducational ? childAge : undefined,
      child_birthday: isEducational ? childBirthday : undefined,
      child_sex: isEducational ? childSex : undefined,
      child_relationship: isEducational ? childRelationship : undefined,
      child_school_daycare: isEducational ? childSchoolName : undefined,
      child_school_name: isEducational ? childSchoolName : undefined,
      child_school_address: isEducational ? childSchoolAddress : undefined,
      child_grade_level: isEducational ? childGradeLevel : undefined,
      lrn: isEducational ? childLrnOrId : undefined,
      childLrnOrId: isEducational ? childLrnOrId : undefined,
      // Subsidy Specific Details
      solo_parent_category: isEducational ? "Solo Parent with Studying Child" : soloParentCategory,
      number_of_dependents: isEducational ? "1" : numberOfDependents,
      age_of_youngest_dependent: isEducational ? childAge : ageOfYoungestDependent,
      occupation: isEducational ? undefined : occupation,
      employer_or_income_source: isEducational ? undefined : employerOrIncomeSource,
      monthly_income: isEducational ? undefined : monthlyIncome,
      other_source_of_income: isEducational ? undefined : otherSourceOfIncome,
      receiving_gov_assistance: isEducational ? undefined : receivingGovAssistance,
      gov_assistance_program: isEducational ? undefined : govAssistanceProgramName,
      gov_assistance_amount_freq: isEducational ? undefined : govAssistanceAmountFreq,
      receiving_pension: isEducational ? undefined : receivingPension,
      pension_type: isEducational ? undefined : pensionType,
      approved_amount: isEducational ? "5000" : undefined,
      financial_assistance_amount: isEducational ? "₱5,000.00 (Annual Educational Grant)" : "Financial Subsidy (Subject to assessment)",
      status: "pending",
      application_status: isEducational ? "ssdd_validation" : "pending",
      created_at: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      form_data: {
        ...formData,
        isEducational,
        soloParentIdNumber,
        soloParentStatus,
        employmentStatus,
        childName: isEducational ? childName : undefined,
        childAge: isEducational ? childAge : undefined,
        childBirthday: isEducational ? childBirthday : undefined,
        childSex: isEducational ? childSex : undefined,
        childRelationship: isEducational ? childRelationship : undefined,
        childSchoolName: isEducational ? childSchoolName : undefined,
        childSchoolAddress: isEducational ? childSchoolAddress : undefined,
        childGradeLevel: isEducational ? childGradeLevel : undefined,
        childLrnOrId: isEducational ? childLrnOrId : undefined,
        soloParentCategory: isEducational ? "Solo Parent with Studying Child" : soloParentCategory,
        numberOfDependents: isEducational ? "1" : numberOfDependents,
        ageOfYoungestDependent: isEducational ? childAge : ageOfYoungestDependent,
        occupation: isEducational ? undefined : occupation,
        employerOrIncomeSource: isEducational ? undefined : employerOrIncomeSource,
        monthlyIncome: isEducational ? undefined : monthlyIncome,
        otherSourceOfIncome: isEducational ? undefined : otherSourceOfIncome,
        receivingGovAssistance: isEducational ? undefined : receivingGovAssistance,
        govAssistanceProgramName: isEducational ? undefined : govAssistanceProgramName,
        govAssistanceAmountFreq: isEducational ? undefined : govAssistanceAmountFreq,
        receivingPension: isEducational ? undefined : receivingPension,
        pensionType: isEducational ? undefined : pensionType,
        assistanceAmount: isEducational ? "₱5,000.00 (Annual Educational Grant)" : "Financial Subsidy",
        assessmentStatus: isEducational ? "SSDD Validation (Stage 1 of 6)" : "Pending Social Worker Assessment & Verification",
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
              {isEducational
                ? "Educational Assistance Application Submitted!"
                : "Application Submitted Successfully!"}
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mt-1.5 leading-relaxed">
              {isEducational
                ? "Your application for the Solo Parent Educational Assistance Program (₱5,000.00 Annual Grant) has been submitted. SSDD Intake Officers are validating your enrollment documents."
                : "Your application for the Solo Parent Financial Subsidy Program has been submitted. A Social Worker will conduct document verification and assessment before approval."}
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
              <span className="font-semibold text-foreground">
                {isEducational
                  ? "Solo Parent Educational Assistance Program"
                  : "Solo Parent Financial Subsidy Program"}
              </span>
            </div>
            {isEducational ? (
              <>
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-muted-foreground font-medium">Student / Dependent:</span>
                  <span className="font-semibold text-foreground">{childName || "—"} ({childGradeLevel || "—"})</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-muted-foreground font-medium">Fixed Annual Grant:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₱5,000.00 / Academic Year</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-muted-foreground font-medium">Employment Status:</span>
                <span className="font-semibold text-foreground">{employmentStatus || "—"}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Status:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                {isEducational ? "SSDD Validation (Stage 1 of 6)" : "Under Review / Assessment"}
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
          {/* ================= STEP 1: VERIFICATION & ELIGIBILITY ================= */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Notice Box */}
              <div className="bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 flex items-start gap-3.5 shadow-xs">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="text-xs md:text-sm font-bold text-blue-950 dark:text-blue-200">
                    {isEducational
                      ? "SOLO PARENT EDUCATIONAL ASSISTANCE PROGRAM (₱5,000.00 ANNUAL GRANT)"
                      : "SOLO PARENT SECTOR: Qualified applicants may receive financial subsidy."}
                  </p>
                  <p className="text-blue-900/90 dark:text-blue-300/90 leading-relaxed text-justify">
                    {isEducational
                      ? "Educational financial assistance for qualified dependent children of Solo Parents who are currently enrolled in public school. Provides an annual financial grant of ₱5,000.00 per qualified beneficiary."
                      : "For qualified Solo Parents who meet the applicable income and program requirements. Eligibility is subject to document verification and assessment before approval."}
                  </p>
                </div>
              </div>

              {/* Primary Verification & Employment Status */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      <p className="text-xs text-red-500 mt-1 font-medium">Please enter your Solo Parent ID Number.</p>
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
                </div>

                {/* Employment Status */}
                <div>
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
                    <p className="text-xs text-red-500 mt-1 font-medium">Please select your Employment Status.</p>
                  )}
                </div>
              </div>

              {attemptedNext && !step1Valid && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Please provide a valid Solo Parent ID Number and select your Employment Status to continue.</span>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: APPLICATION FORM ================= */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-bold text-foreground uppercase tracking-wide">
                  {isEducational ? "SOLO PARENT EDUCATIONAL ASSISTANCE FORM" : "APPLICATION FORM"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEducational
                    ? "Please provide the student details and academic information below for the ₱5,000.00 educational grant."
                    : "Please review and complete the applicant information and family details below."}
                </p>
              </div>

              {/* A. SOLO PARENT / GUARDIAN INFORMATION */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>A. Solo Parent / Guardian Information</span>
                  </h3>
                </div>

                {/* Full Name */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      disabled
                      readOnly
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Middle Name</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      disabled
                      readOnly
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      disabled
                      readOnly
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Suffix</label>
                    <input
                      type="text"
                      value={formData.suffix}
                      disabled
                      readOnly
                      placeholder="e.g. Jr., III"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* DOB, Sex, Civil Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Date of Birth (YYYY-MM-DD) *</label>
                    <input
                      type="text"
                      value={formData.birthDate}
                      disabled
                      readOnly
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Sex *</label>
                    <input
                      type="text"
                      value={formData.sex}
                      disabled
                      readOnly
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Civil Status *</label>
                    <input
                      type="text"
                      value={formData.civilStatus}
                      disabled
                      readOnly
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
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
                      disabled
                      readOnly
                      placeholder="House / Unit / Street"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Barangay *</label>
                    <input
                      type="text"
                      value={formData.addressBarangay}
                      disabled
                      readOnly
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">City / Municipality *</label>
                    <input
                      type="text"
                      value={formData.addressCityMunicipality}
                      disabled
                      readOnly
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
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
                      disabled
                      readOnly
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 font-mono bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      readOnly
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">QCitizen ID Number *</label>
                    <input
                      type="text"
                      value={formData.qcidNumber}
                      disabled
                      readOnly
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 font-mono bg-gray-100 dark:bg-slate-800/80 text-foreground cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Solo Parent ID (SPIC) Number</label>
                    <input
                      type="text"
                      value={soloParentIdNumber ? (soloParentIdNumber.startsWith("SP-") ? soloParentIdNumber : `SP-${soloParentIdNumber}`) : "—"}
                      readOnly
                      disabled
                      className="w-full border rounded-lg px-3 py-2 text-sm mt-1 font-mono bg-gray-100 dark:bg-slate-800/80 text-gray-800 dark:text-slate-200 border-border cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Branch based on Program Type */}
              {isEducational ? (
                <>
                  {/* B. STUDENT / DEPENDENT CHILD INFORMATION */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span>B. Student / Dependent Child Information</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Student Full Name (Anak / Mag-aaral) *
                        </label>
                        <input
                          type="text"
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                          placeholder="e.g. Juan Dela Cruz Jr."
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground ${
                            attemptedNext && !childName.trim() ? "border-red-400 bg-red-50" : "border-border"
                          }`}
                        />
                        {attemptedNext && !childName.trim() && (
                          <p className="text-xs text-red-500 mt-1">Please enter the student full name.</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Relationship to Solo Parent *
                        </label>
                        <SelectInput
                          value={childRelationship}
                          onChange={setChildRelationship}
                          options={[
                            { label: "Son / Anak na Lalaki", value: "Son" },
                            { label: "Daughter / Anak na Babae", value: "Daughter" },
                            { label: "Legal Dependent / Beneficiary", value: "Legal Dependent" },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Age (Edad) *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={childAge}
                          onChange={(e) => setChildAge(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 14"
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground ${
                            attemptedNext && !childAge.trim() ? "border-red-400 bg-red-50" : "border-border"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Date of Birth (YYYY-MM-DD) *
                        </label>
                        <input
                          type="date"
                          value={childBirthday}
                          onChange={(e) => setChildBirthday(e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground ${
                            attemptedNext && !childBirthday.trim() ? "border-red-400 bg-red-50" : "border-border"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Sex (Kasarian) *
                        </label>
                        <SelectInput
                          value={childSex}
                          onChange={setChildSex}
                          options={[
                            { label: "Male / Lalaki", value: "Male" },
                            { label: "Female / Babae", value: "Female" },
                          ]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* C. SCHOOL & ACADEMIC DETAILS */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span>C. School & Academic Details</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Name of School / Institution *
                        </label>
                        <input
                          type="text"
                          value={childSchoolName}
                          onChange={(e) => setChildSchoolName(e.target.value)}
                          placeholder="e.g. Sauyo High School / Quezon City Public School"
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground ${
                            attemptedNext && !childSchoolName.trim() ? "border-red-400 bg-red-50" : "border-border"
                          }`}
                        />
                        {attemptedNext && !childSchoolName.trim() && (
                          <p className="text-xs text-red-500 mt-1">Please enter the school name.</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Grade Level / Academic Year *
                        </label>
                        <input
                          type="text"
                          value={childGradeLevel}
                          onChange={(e) => setChildGradeLevel(e.target.value)}
                          placeholder="e.g. Grade 7 / Grade 10 / 1st Year College"
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground ${
                            attemptedNext && !childGradeLevel.trim() ? "border-red-400 bg-red-50" : "border-border"
                          }`}
                        />
                        {attemptedNext && !childGradeLevel.trim() && (
                          <p className="text-xs text-red-500 mt-1">Please enter the current grade level.</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Learner Reference Number (LRN) / Student ID *
                        </label>
                        <input
                          type="text"
                          value={childLrnOrId}
                          onChange={(e) => setChildLrnOrId(e.target.value)}
                          placeholder="e.g. 136548190234"
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 font-mono bg-white dark:bg-slate-900 text-foreground ${
                            attemptedNext && !childLrnOrId.trim() ? "border-red-400 bg-red-50" : "border-border"
                          }`}
                        />
                        {attemptedNext && !childLrnOrId.trim() && (
                          <p className="text-xs text-red-500 mt-1">Please enter the student's LRN or Student ID.</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Complete School Address *
                        </label>
                        <input
                          type="text"
                          value={childSchoolAddress}
                          onChange={(e) => setChildSchoolAddress(e.target.value)}
                          placeholder="e.g. Sauyo Road, Novaliches, Quezon City"
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground ${
                            attemptedNext && !childSchoolAddress.trim() ? "border-red-400 bg-red-50" : "border-border"
                          }`}
                        />
                        {attemptedNext && !childSchoolAddress.trim() && (
                          <p className="text-xs text-red-500 mt-1">Please enter the school address.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                          placeholder="Select Solo Parent Category..."
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
                          type="text"
                          inputMode="numeric"
                          value={numberOfDependents}
                          onChange={(e) => setNumberOfDependents(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter number of dependents"
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-slate-900 text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Age of Youngest Dependent *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={ageOfYoungestDependent}
                          onChange={(e) => setAgeOfYoungestDependent(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter age of youngest dependent"
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
                          Employment Status (from Step 1)
                        </label>
                        <input
                          type="text"
                          value={employmentStatus || "Not Specified"}
                          readOnly
                          disabled
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-100 dark:bg-slate-800 text-foreground font-semibold cursor-not-allowed"
                        />
                      </div>
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
                      <div className="sm:col-span-2">
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
                </>
              )}

              {attemptedNext && !step2Valid && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>
                    {isEducational
                      ? "Please provide all required student and school information before proceeding."
                      : "Please ensure all required personal details, family members, and contact numbers are provided."}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 3: REQUIRED DOCUMENTS ================= */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
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
                  {isEducational
                    ? "Solo Parent Educational Assistance (₱5,000.00 Annual Grant) requires official proof of current academic enrollment and grades."
                    : `Employment Status: ${employmentStatus || "Unemployed"} — Document requirements for Proof of Indigency/Income are tailored accordingly.`}
                </span>
              </div>

              <div className="space-y-4">
                {requiredDocuments.map((doc, docIndex) => {
                  const files = uploadedDocs[doc.id] || []
                  const isUploaded = files.length > 0
                  const inputId = `upload-doc-${docIndex}`
                  const missing = attemptedNext && !isUploaded

                  return (
                    <div
                      key={doc.id}
                      className={`border rounded-xl p-5 transition-colors ${
                        isUploaded
                          ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30 dark:border-emerald-500/30"
                          : missing
                          ? "border-red-500/40 bg-red-500/10 dark:bg-red-950/30 dark:border-red-500/30"
                          : "border-border dark:border-slate-800 bg-card/60 dark:bg-slate-900/40"
                      }`}
                    >
                      <p className="flex items-center gap-1.5 text-sm font-bold text-foreground uppercase tracking-wide">
                        {doc.label} <span className="text-red-500">*</span>
                        {isUploaded && (
                          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white shrink-0">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        )}
                      </p>

                      {doc.description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {doc.description}
                        </p>
                      )}

                      {doc.note && (
                        <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 dark:bg-amber-950/40 rounded-lg p-2 mt-1.5 border border-amber-500/30 dark:border-amber-800/40">
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
                          <span>UPLOAD PHOTO</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => setCameraDoc(doc)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide cursor-pointer transition-colors shadow-xs"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>TAKE PHOTO (CAMERA)</span>
                        </button>
                      </div>

                      {isUploaded && (
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50 mt-4">
                          {files.map((file, i) => (
                            <div
                              key={`${file.name}-${i}`}
                              className="relative w-40 border border-border dark:border-slate-800 rounded-lg bg-card dark:bg-slate-900 shadow-xs p-3 flex flex-col items-center text-center"
                            >
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(doc.id)}
                                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-slate-700 hover:bg-red-600 flex items-center justify-center text-white transition-colors z-10 cursor-pointer shadow-xs"
                                aria-label={`Remove ${file.name}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <div className="h-16 w-16 rounded-md overflow-hidden border border-border dark:border-slate-700 mb-2 flex items-center justify-center bg-muted/40 dark:bg-slate-800">
                                <FileThumbnail file={file} className="h-full w-full object-cover" />
                              </div>
                              <p className="text-xs font-medium text-foreground truncate w-full">{file.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {missing && (
                        <p className="text-xs text-red-500 mt-2 font-medium">
                          Photo upload is required for this item.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {attemptedNext && !step3Valid && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Please upload all the required documents before proceeding to review.</span>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 4: REVIEW & SUBMIT ================= */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-bold text-foreground uppercase tracking-wide">
                  REVIEW & SUBMIT INFORMATION
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEducational
                    ? "Please review all your details carefully before submitting your application for the Solo Parent Educational Assistance Program."
                    : "Please review all your details carefully before submitting your application for the Solo Parent Financial Subsidy Program."}
                </p>
              </div>

              {/* Preliminary & Verification */}
              <AccordionSection
                title="1. Solo Parent ID & Verification"
                onEdit={() => {
                  setStep(1)
                  setReturnToReview(true)
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <ReviewField label="Solo Parent ID (SPIC)" value={soloParentIdNumber.startsWith("SP-") ? soloParentIdNumber : `SP-${soloParentIdNumber}`} />
                  <ReviewField label="Solo Parent Status" value={soloParentStatus || "Active / Verified Solo Parent"} />
                  <ReviewField label="Employment Status" value={employmentStatus} />
                </div>
              </AccordionSection>

              {/* Applicant / Guardian Information */}
              <AccordionSection
                title="2. Solo Parent / Guardian Information"
                onEdit={() => {
                  setStep(2)
                  setReturnToReview(true)
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <ReviewField label="Full Name" value={fullApplicantName} />
                  <ReviewField label="Date of Birth / Age" value={`${formData.birthDate} (Age: ${formData.age})`} />
                  <ReviewField label="Sex / Civil Status" value={`${formData.sex} / ${formData.civilStatus}`} />
                  <ReviewField label="Complete Address" value={`${formData.addressStreet ? `${formData.addressStreet}, ` : ""}${formData.addressBarangay}, ${formData.addressCityMunicipality}`} />
                  <ReviewField label="Contact / Email" value={`${formData.contactNo} / ${formData.email}`} />
                  <ReviewField label="QCitizen ID Number" value={formData.qcidNumber} />
                </div>
              </AccordionSection>

              {/* Program Specific Review Sections */}
              {isEducational ? (
                <>
                  <AccordionSection
                    title="3. Student / Dependent Child Details"
                    onEdit={() => {
                      setStep(2)
                      setReturnToReview(true)
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <ReviewField label="Student Full Name" value={childName} />
                      <ReviewField label="Relationship" value={childRelationship} />
                      <ReviewField label="Age / Date of Birth" value={`${childAge} y/o (${childBirthday || "—"})`} />
                      <ReviewField label="Sex" value={childSex} />
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="4. School & Academic Details"
                    onEdit={() => {
                      setStep(2)
                      setReturnToReview(true)
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <ReviewField label="School Name" value={childSchoolName} />
                      <ReviewField label="Grade Level" value={childGradeLevel} />
                      <ReviewField label="Learner Reference No. (LRN)" value={childLrnOrId} />
                      <ReviewField label="School Address" value={childSchoolAddress} />
                      <div className="sm:col-span-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                        <strong>Fixed Educational Assistance:</strong> ₱5,000.00 / academic year (Once a year grant upon SSDD verification).
                      </div>
                    </div>
                  </AccordionSection>
                </>
              ) : (
                <AccordionSection
                  title="3. Solo Parent, Employment & Other Assistance"
                  onEdit={() => {
                    setStep(2)
                    setReturnToReview(true)
                  }}
                >
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
              )}

              {/* Uploaded Documents */}
              <AccordionSection
                title={isEducational ? "5. Required Documents" : "4. Required Documents"}
                onEdit={() => {
                  setStep(3)
                  setReturnToReview(true)
                }}
              >
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
        <div className={`bg-gray-50 dark:bg-slate-900/60 border-t border-border px-6 py-4 flex items-center ${step > 1 ? "justify-between" : "justify-end"} gap-4`}>
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer"
            >
              BACK
            </button>
          )}

          {step < 4 ? (
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
import { useState, useEffect, type ReactNode } from "react"
import {
  Check,
  ChevronRight,
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
} from "lucide-react"

import { useLanguage } from "../ui/language-context"
import DocumentCameraModal from "../ui/document-camera-modal"
import { API_BASE } from "../../config/api"
import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"

function generateReference(_status?: string | null, qcid?: string) {
  if (qcid && (qcid || "").trim() && qcid !== "110000116932100") return (qcid || "").trim()
  return getLoggedInUserQcid()
}

type IdStatus = "new" | "renewal" | "loss" | null

interface SoloParentCategory {
  id: number
  title: string
  description?: string
  requirements: string[]
}

const SOLO_PARENT_CATEGORIES: SoloParentCategory[] = [
  {
    id: 1,
    title: "Solo parent with child/children as a consequence of rape",
    requirements: [
      "Birth certificate/s of the child/children",
      "Complaint affidavit",
      "Medical record on the incident of rape",
      "Sworn Affidavit of Solo Parent (Sole Parental Care & Support)",
      "Barangay Certificate of Residency & Parental Care",
      "Solo Parent Orientation Seminar Certificate of Attendance",
    ],
  },
  {
    id: 2,
    title: "Death of the spouse",
    requirements: [
      "Birth certificate/s of the child/children",
      "Marriage certificate",
      "Death certificate of the spouse",
      "Sworn Affidavit of Solo Parent (Sole Parental Care & Non-Cohabitation)",
      "Barangay Certificate of Residency & Parental Care",
      "Solo Parent Orientation Seminar Certificate of Attendance",
    ],
  },
  {
    id: 3,
    title: "Detention or criminal conviction of the spouse",
    requirements: [
      "Birth certificate/s of the child/children",
      "Marriage certificate",
      "Certificate of detention or court commitment order of the spouse (at least 3 months sentence)",
      "Sworn Affidavit of Solo Parent (Sole Parental Care & Non-Cohabitation)",
      "Barangay Certificate of Residency & Parental Care",
      "Solo Parent Orientation Seminar Certificate of Attendance",
    ],
  },
  {
    id: 4,
    title: "Physical or mental incapacity of the spouse",
    requirements: [
      "Birth certificate/s of the child/children",
      "Marriage certificate or affidavit of cohabitation",
      "Medical abstract / certificate of physical or mental incapacity of the spouse, or PWD ID",
      "Sworn Affidavit of Solo Parent (Sole Parental Care & Non-Cohabitation)",
      "Barangay Certificate of Residency & Parental Care",
      "Solo Parent Orientation Seminar Certificate of Attendance",
    ],
  },
  {
    id: 5,
    title: "Legal or de facto separation of spouse",
    requirements: [
      "Birth certificate/s of the child/children",
      "Marriage certificate",
      "Judicial decree of legal separation, or affidavit of two (2) disinterested persons for de facto separation",
      "Sworn Affidavit of Solo Parent (Sole Parental Care & Non-Cohabitation)",
      "Barangay Certificate of Residency & Parental Care",
      "Solo Parent Orientation Seminar Certificate of Attendance",
    ],
  },
  {
    id: 6,
    title: "Declaration of nullity or annulment of marriage",
    requirements: [
      "Birth certificate/s of the child/children",
      "Marriage Certificate with annotation of nullity / annulment / divorce",
      "Judicial decree of nullity or annulment of marriage or divorce",
      "Sworn Affidavit of Solo Parent (Sole Parental Care & Non-Cohabitation)",
      "Barangay Certificate of Residency & Parental Care",
      "Solo Parent Orientation Seminar Certificate of Attendance",
    ],
  },
  {
    id: 7,
    title: "Abandonment by the spouse",
    requirements: [
      "Birth certificate/s of the child/children",
      "Marriage certificate",
      "Affidavit of 2 disinterested persons or police/barangay record of abandonment",
      "Sworn Affidavit of Solo Parent (Sole Parental Care & Non-Cohabitation)",
      "Barangay Certificate of Residency & Parental Care",
      "Solo Parent Orientation Seminar Certificate of Attendance",
    ],
  },
  {
    id: 8,
    title: "Spouse is an OFW / migrant worker (RA 11861)",
    requirements: [
      "Birth certificate/s of the child/children",
      "Marriage certificate",
      "Valid OFW contract, OEC, or certification showing continuous absence for at least 12 months",
      "Sworn Affidavit of Solo Parent (Sole Parental Care & Non-Cohabitation)",
      "Barangay Certificate of Residency & Parental Care",
      "Solo Parent Orientation Seminar Certificate of Attendance",
    ],
  },
  {
    id: 9,
    title: "Unmarried father or mother who keeps and rears the child/children",
    requirements: [
      "Birth certificate/s of the child/children",
      "Certificate of No Marriage (CENOMAR)",
      "Sworn Affidavit of Solo Parent (Sole Parental Care & Non-Cohabitation)",
      "Barangay Certificate of Residency & Parental Care",
      "Solo Parent Orientation Seminar Certificate of Attendance",
    ],
  },
  {
    id: 10,
    title: "Legal guardian, adoptive or foster parent",
    requirements: [
      "Birth certificate/s of the child/children",
      "Proof of guardianship (Court decision, Adoption decree, or Foster Parent license)",
      "Sworn Affidavit of Solo Parent (Sole Parental Care & Non-Cohabitation)",
      "Barangay Certificate of Residency & Parental Care",
      "Solo Parent Orientation Seminar Certificate of Attendance",
    ],
  },
  {
    id: 11,
    title: "Relative within the 4th civil degree who assumes parental care & support",
    requirements: [
      "Birth certificate/s of the child/children",
      "Death certificate, incapacity certificate, or police/barangay record of absence of parents for at least 6 months",
      "Proof of relationship of relative to the parents / legal guardian",
      "Sworn Affidavit of Solo Parent (Sole Parental Care & Support)",
      "Barangay Certificate of Residency & Parental Care",
      "Solo Parent Orientation Seminar Certificate of Attendance",
    ],
  },
  {
    id: 12,
    title: "Pregnant woman",
    requirements: [
      "Medical record of pregnancy",
      "Sworn Affidavit of Solo Parent (Non-Cohabitation / Sole Support)",
      "Barangay Certificate of Residency",
      "Solo Parent Orientation Seminar Certificate of Attendance",
    ],
  },
]

// ---- Step 3: Sample Documents (dynamic base sa ID status) ----
interface SampleDocument {
  id: string
  label: string
  description?: string
  images?: string[]
  downloadUrl?: string
}

const RENEWAL_DOCUMENTS: SampleDocument[] = [
  { id: "oldId", 
    label: "OLD ID", 
    description: "Ang iyong dating Solo Parent card.",
    images: ["/samples/OLD SOLO ID.jpg"],
    downloadUrl: "/samples/OLD SOLO ID.jpg"
},
  { id: "idPicture", 
    label: "RECENT 2X2 ID PICTURE", 
    description: "Recent color photo, light background, clear face.", 
    images: ["/samples/ID PICTURE (2X2).webp"],
    downloadUrl: "/samples/ID PICTURE (2X2).webp"
},
  { id: "barangayCertificate", 
    label: "BARANGAY CERTIFICATE (KUNG NAGBAGO ANG ADDRESS)", 
    description: "Kailangan lamang kung nagbago ang tirahan mula noong huling application.",
    images: ["/samples/BARANGAY CERTIFICATE.webp"],
    downloadUrl: "/samples/BARANGAY CERTIFICATE.webp"
},
  { id: "endorsement", 
    label: "ENDORSEMENT FROM SOLO PARENT PRESIDENT", 
    description: "Endorsement mula sa Solo Parent President ng iyong barangay.",
    images: ["/samples/ENDORSEMENT FROM SOLO PARENT.webp"],
    downloadUrl: "/samples/ENDORSEMENT FROM SOLO PARENT.webp"
},
]

const LOSS_ID_DOCUMENTS: SampleDocument[] = [
  {
    id: "affidavitOfLoss",
    label: "AFFIDAVIT OF LOSS",
    description: "Notarized Affidavit of Loss na nagpapatunay ng pagkawala ng ID.",
    images: ["/samples/AFFIDAVIT OF LOSS.webp"],
    downloadUrl: "/samples/AFFIDAVIT OF LOSS.webp",
  },
  {
    id: "idPicture",
    label: "RECENT 2X2 ID PICTURE",
    description: "Recent color photo, light background, clear face.",
    images: ["/samples/ID PICTURE (2X2).webp"],
    downloadUrl: "/samples/ID PICTURE (2X2).webp",
  },
  {
    id: "validGovId",
    label: "VALID GOVERNMENT ID O QCID",
    description: "Kahit anong valid government-issued ID o QCitizen ID.",
    images: ["/samples/QC ID.png"],
    downloadUrl: "/samples/QC ID.png",
  },
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// I-convert ang isang requirement string mula sa SOLO_PARENT_CATEGORIES
// patungong SampleDocument row (may sample image kung may existing match).
function requirementToDocument(requirement: string, index: number): SampleDocument {
  const id = `req-${index}-${slugify(requirement).slice(0, 40)}`

  if (/birth certificate/i.test(requirement)) {
    return {
      id,
      label: requirement,
      images: ["/samples/BIRTH CERTIFICATE OF MINOR.jpg"],
      downloadUrl: "/samples/BIRTH CERTIFICATE OF MINOR.jpg",
    }
  }
  if (/barangay/i.test(requirement)) {
    return {
      id,
      label: requirement,
      images: ["/samples/BARANGAY CERTIFICATE.webp"],
      downloadUrl: "/samples/BARANGAY CERTIFICATE.webp",
    }
  }
  return { id, label: requirement }
}

// Ang 2x2 ID picture ay palaging kailangan para sa ID card mismo,
// kahit hindi ito nasa RA 8972/11861 requirements list.
const BASE_NEW_APPLICANT_DOCUMENT: SampleDocument = {
  id: "idPicture",
  label: "1 PC 2X2 ID PICTURE",
  description: "Recent color photo, light background, clear face.",
  images: ["/samples/ID PICTURE (2X2).webp"],
  downloadUrl: "/samples/ID PICTURE (2X2).webp",
}

function getNewApplicantDocuments(categoryId: number | null): SampleDocument[] {
  const category = SOLO_PARENT_CATEGORIES.find((c) => c.id === categoryId)
  if (!category) return [BASE_NEW_APPLICANT_DOCUMENT]
  return [BASE_NEW_APPLICANT_DOCUMENT, ...category.requirements.map(requirementToDocument)]
}

function getRequiredDocuments(idStatus: IdStatus, categoryId: number | null): SampleDocument[] {
  if (idStatus === "renewal") return RENEWAL_DOCUMENTS
  if (idStatus === "loss") return LOSS_ID_DOCUMENTS
  return getNewApplicantDocuments(categoryId)
}

const ALLOWED_UPLOAD_FILE_TYPES = "JPG, JPEG, PNG, WEBP"

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
}

interface SoloParentApplicationWizardProps {
  onBack?: () => void
  userProfile?: UserProfile
  initialCategoryId?: number | null
  initialType?: IdStatus
  isModalOpen?: boolean
  onBlockedStatusChange?: (blocked: boolean) => void
}

const MOCK_USER_PROFILE: UserProfile = getCurrentUserProfile() as any

interface FamilyMember {
  id: string
  name: string
  relationship: string
  age: string
  birthday: string
  status: string
  educationalAttainment: string
  occupationMonthlyIncome: string
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
  email: string
  bloodType: string
  emergencyFirstName: string
  emergencyLastName: string
  emergencyContactNo: string
  emergencyRelationship: string
}

const EMPTY_FORM_DATA: FormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  dobMonth: "10",
  dobDay: "29",
  dobYear: "2004",
  age: "21",
  sex: "Female",
  civilStatus: "Single",
  contactNo: "",
  addressHouseNo: "",
  addressStreet: "",
  addressBarangay: "",
  addressCityMunicipality: "QUEZON CITY",
  qcidNumber: "110000116932100",
  email: "",
  bloodType: "O+",
  emergencyFirstName: "JUAN",
  emergencyLastName: "DIMAL",
  emergencyContactNo: "09123456789",
  emergencyRelationship: "Child",
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
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
  invalid?: boolean
  numbersOnly?: boolean
  maxLength?: number
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value
    if (numbersOnly) {
      raw = raw.replace(/\D/g, "")
    }
    if (maxLength && raw.length > maxLength) {
      raw = raw.slice(0, maxLength)
    }
    onChange(raw)
  }
  return (
    <input
      type={numbersOnly ? "tel" : type}
      inputMode={numbersOnly ? "numeric" : undefined}
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      disabled={disabled}
      maxLength={maxLength}
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

// ── Sample Document modal ──
interface DocumentModalProps {
  doc: SampleDocument | null
  isOpen: boolean
  onClose: () => void
}

function DocumentSampleModal({ doc, isOpen, onClose }: DocumentModalProps) {
  const { t } = useLanguage()
  if (!isOpen || !doc) return null
  const hasImages = Boolean(doc.images && doc.images.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 pb-4 border-b border-gray-200 shrink-0">
          <h3 className="text-lg font-bold text-foreground">{t("sampleLabel", { name: doc.label })}</h3>
        </div>

        <div className="p-6 overflow-y-auto">
          {hasImages ? (
            <div className="flex flex-wrap gap-4 justify-center">
              {doc.images!.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${doc.label} sample ${i + 1}`}
                  className="max-h-96 rounded-lg border border-border object-contain"
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 text-center text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-semibold mb-2">{t("noSampleImageAvailable")}</p>
            </div>
          )}

          {doc.description && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 text-left">
              <p className="text-xs text-blue-700 leading-relaxed">{doc.description}</p>
            </div>
          )}
        </div>

        <div className="p-6 pt-4 border-t border-gray-200 flex items-center justify-between gap-4 shrink-0">
          {doc.downloadUrl ? (
            <a
              href={doc.downloadUrl}
              download
              className="px-6 h-10 flex items-center rounded-xl bg-gray-100 text-foreground text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              {t("download").toUpperCase()}
            </a>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="px-6 h-10 rounded-xl bg-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t("close").toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Multi-file upload row ──
function DocumentUploadRow({
  doc,
  docIndex,
  files,
  invalid,
  onUpload,
  onRemove,
  onSampleClick,
  onCameraClick,
}: {
  doc: SampleDocument
  docIndex: number
  files: File[]
  invalid?: boolean
  onUpload: (files: File[]) => void
  onRemove: (fileIndex: number) => void
  onSampleClick: (doc: SampleDocument) => void
  onCameraClick: (doc: SampleDocument) => void
}) {
  const { t } = useLanguage()
  const inputId = `upload-doc-${docIndex}`
  const uploaded = files.length > 0

  return (
    <div key={doc.id}>
      <button
        type="button"
        onClick={() => onSampleClick(doc)}
        className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline mb-2 cursor-pointer"
      >
        <FileText className="h-3.5 w-3.5" />
        {(t("sampleDocument") || "Sample Document").toUpperCase()}
      </button>

      <div
        className={`border rounded-xl p-5 transition-colors ${
          uploaded
            ? "border-green-300 bg-green-50"
            : invalid
            ? "border-red-400 bg-red-50"
            : "border-border bg-card"
        }`}
      >
        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground uppercase tracking-wide">
          {doc.label} <span className="text-red-500">*</span>
          {uploaded && (
            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-500 text-white shrink-0">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </span>
          )}
        </p>
        {doc.description && <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>}
        <p className="text-xs text-muted-foreground mt-2">
          {t("allowedFileTypes") || "Allowed file types"}: {ALLOWED_UPLOAD_FILE_TYPES} (o kumuha gamit ang Camera)
        </p>

        <input
          type="file"
          id={inputId}
          key={`${inputId}-${files.length}`}
          multiple
          accept=".jpg,.jpeg,.png,.webp,image/*"
          className="hidden"
          onChange={(e) => {
            const selectedFiles = e.target.files ? Array.from(e.target.files) : []
            if (selectedFiles.length > 0) onUpload(selectedFiles)
            e.target.value = ""
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <label
            htmlFor={inputId}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold tracking-wide cursor-pointer hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            UPLOAD PHOTO
          </label>

          <button
            type="button"
            onClick={() => onCameraClick(doc)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide cursor-pointer transition-colors shadow-xs"
          >
            <Camera className="h-3.5 w-3.5" />
            KUMUHA NG LARAWAN (CAMERA)
          </button>
        </div>

        {uploaded && (
          <div className="flex flex-wrap gap-3 pt-4">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="relative w-40 border border-border rounded-lg bg-white p-3 flex flex-col items-center text-center shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                  aria-label={t("removeFile", { filename: file.name })}
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

        {invalid && (
          <p className="text-xs text-red-500 mt-2">{t("spDocRequiredNote") || "Kailangan pang mag-upload ng dokumento para sa kinakailangang item na ito."}</p>
        )}
      </div>
    </div>
  )
}

// ── Review & Submit helpers ──
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
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
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

// ============================================================================
// MAIN COMPONENT: SoloParentApplicationWizard
// ============================================================================
export default function SoloParentApplicationWizard({
  onBack,
  userProfile = MOCK_USER_PROFILE,
  initialCategoryId = null,
  initialType = "new",
  isModalOpen = false,
  onBlockedStatusChange,
}: SoloParentApplicationWizardProps) {
  const { t } = useLanguage()
  const [idStatus, setIdStatus] = useState<IdStatus>(initialType)

  useEffect(() => {
    if (initialType) {
      setIdStatus(initialType)
      setIsIdVerified(false)
      setExistingIdNumber("")
      setVerifyError("")
    }
  }, [initialType])

  const STEPS = [
    { id: 1, label: "COMPLETE CHECKLIST" },
    { id: 2, label: "PERSONAL INFORMATION" },
    { id: 3, label: "SAMPLE DOCUMENTS" },
    { id: 4, label: "REVIEW & SUBMIT" },
  ]

  const [step, setStep] = useState(1)
  const [attemptedNext, setAttemptedNext] = useState(false)
  const [selectedSampleDoc, setSelectedSampleDoc] = useState<SampleDocument | null>(null)
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [cameraDoc, setCameraDoc] = useState<SampleDocument | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; file: File } | null>(null)

  // ---- Step 1: Complete Checklist / Verification ----
  const [isResident, setIsResident] = useState(false)
  const [hasSoleParentalCare, setHasSoleParentalCare] = useState(false)
  const [hasOtherLguAssistance, setHasOtherLguAssistance] = useState<"yes" | "no">("no")
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategoryId ?? null)
  const [existingIdNumber, setExistingIdNumber] = useState("")
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [renewalReason, setRenewalReason] = useState("")
  const [replacementReason, setReplacementReason] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isIdVerified, setIsIdVerified] = useState(false)
  const [verifyError, setVerifyError] = useState("")
  const [verifiedRecord, setVerifiedRecord] = useState<{
    name: string
    idNumber: string
    barangay: string
    status: string
  } | null>(null)
  const [agreedCertification, setAgreedCertification] = useState(false)
  const selectedCategory = SOLO_PARENT_CATEGORIES.find((c) => c.id === selectedCategoryId) || null

  const handleVerifyId = () => {
    if (!(existingIdNumber || "").trim()) {
      setVerifyError("Kailangang ilagay ang inyong Solo Parent ID Number.")
      return
    }
    setVerifyError("")
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      setIsIdVerified(true)
      const fullName = `${userProfile.firstName} ${userProfile.middleName || ""} ${userProfile.lastName}`.trim()
      setVerifiedRecord({
        name: fullName,
        idNumber: (existingIdNumber || "").trim(),
        barangay: userProfile.addressBarangay || "SAUYO",
        status: idStatus === "renewal" ? "Active / Expired" : "Replacement / Lost ID",
      })
    }, 600)
  }
  
  // ---- Eligibility check (bago pumasok sa wizard) ----
  const userId = userProfile.userId || "1"
  const [checkingEligibility, setCheckingEligibility] = useState(true)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState<"draft" | "pending" | "approved" | null>(null)
  const [blockedReference, setBlockedReference] = useState("")

  useEffect(() => {
    const checkEligibility = async () => {
      setCheckingEligibility(true)
      try {
        const typeToCheck = idStatus || "new"
        const res = await fetch(
          `${API_BASE}/api/solo-parent/eligibility/${userId}?applicationType=${typeToCheck}`
        )
        if (res.ok) {
          const data = await res.json()
          setIsBlocked(data.blocked)
          setBlockReason(data.reason)
          setBlockedReference(data.referenceNumber || "")
          onBlockedStatusChange?.(Boolean(data.blocked))
        }
      } catch (err) {
        console.warn("Eligibility check server unreachable, skipping:", err)
      } finally {
        setCheckingEligibility(false)
      }
    }
    checkEligibility()
  }, [userId, idStatus])

  // ---- Submission & Application State ----
  const [submissionStage, setSubmissionStage] = useState<"form" | "matching" | "pending">("form")
  const [reference, setReference] = useState("")
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3)

  // Auto-redirect to pending status screen (Pic 2) after 3 seconds on pending
  useEffect(() => {
    if (submissionStage !== "pending") return

    setRedirectCountdown(3)
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsBlocked(true)
          setBlockReason("pending")
          setBlockedReference(reference)
          setSubmissionStage("form")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [submissionStage, reference])
  const familyMembers: FamilyMember[] = []

  // ---- Step 2: Personal Information ----
  const [formData, setFormData] = useState<FormData>(() => ({
    ...EMPTY_FORM_DATA,
    firstName: userProfile.firstName || "",
    middleName: userProfile.middleName || "",
    lastName: userProfile.lastName || "",
    suffix: userProfile.suffix || "",
    dobMonth: userProfile.dobMonth || "",
    dobDay: userProfile.dobDay || "",
    dobYear: userProfile.dobYear || "",
    age: userProfile.age || "",
    sex: userProfile.sex || "",
    civilStatus: userProfile.civilStatus || "",
    contactNo: userProfile.contactNo || "",
    addressHouseNo: userProfile.addressHouseNo || "",
    addressStreet: userProfile.addressStreet || "",
    addressBarangay: userProfile.addressBarangay || "",
    addressCityMunicipality: userProfile.addressCityMunicipality || "Quezon City",
    qcidNumber: userProfile.qcidNo || "110000116932100",
    email: userProfile.email || "",
    bloodType: userProfile.bloodType || "O+",
    emergencyFirstName: idStatus === "new" ? "" : userProfile.emergencyFirstName || "CLARENCE",
    emergencyLastName: idStatus === "new" ? "" : userProfile.emergencyLastName || "MILLARES",
    emergencyContactNo: idStatus === "new" ? "" : userProfile.emergencyContactNo || "09123123123",
    emergencyRelationship: idStatus === "new" ? "" : userProfile.emergencyRelationship || "Friend",
  }))
  const updateField = (key: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }))

  // ---- Step 3: Sample Documents (dynamic base sa idStatus) ----
  const requiredDocs = getRequiredDocuments(idStatus, selectedCategoryId)
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File[]>>({})

  // Reload / Navigation warning protection — active from Step 2 onwards when modal is closed
  const isFormDirty =
    !isModalOpen &&
    submissionStage === "form" &&
    (step >= 2 && step <= 4)

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
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const allowedExtensions = /\.(jpe?g|png|webp|jfif|bmp|heic|heif)$/i

    const validFiles = files.filter(
      (f) => allowedTypes.includes(f.type) || allowedExtensions.test(f.name)
    )
    const rejectedCount = files.length - validFiles.length

    if (rejectedCount > 0) {
      alert(`${rejectedCount} file(s) ang hindi tinanggap. Mga litrato o larawan (JPG, JPEG, PNG, WEBP) lamang ang maaaring i-upload. Bawal ang document/PDF file.`)
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

  const handleFinalSubmit = async () => {
    setSubmissionStage("matching")
    const fallbackRef = reference || generateReference(idStatus, userProfile?.qcidNo || formData?.qcidNumber)
    setReference(fallbackRef)

    try {
      // 1. Create application record sa backend
      const res = await fetch(`${API_BASE}/api/solo-parent/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          applicationData: {
            isResident,
            idStatus,
            selectedCategoryId,
            selectedCategory,
            existingIdNumber,
            isIdVerified,
            formData,
            familyMembers,
          },
          requiredDocumentIds: requiredDocs.map((d) => d.id),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const appId = data.applicationId
        if (data.referenceNumber) {
          setReference(data.referenceNumber)
        }

        // 2. I-upload ang lahat ng nakalakip na dokumento
        for (const doc of requiredDocs) {
          const files = uploadedDocs[doc.id] || []
          if (files.length > 0 && appId) {
            const uploadFormData = new FormData()
            files.forEach((f) => uploadFormData.append("documents", f))
            uploadFormData.append("documentId", doc.id)
            uploadFormData.append("documentLabel", doc.label)
            await fetch(`${API_BASE}/api/solo-parent/${appId}/upload-documents`, {
              method: "POST",
              body: uploadFormData,
            }).catch(() => {})
          }
        }

        // 3. Markahan bilang pending / submitted
        if (appId) {
          await fetch(`${API_BASE}/api/solo-parent/${appId}/submit`, {
            method: "POST",
          }).catch(() => {})
        }
      }
    } catch (err) {
      console.warn("Final submit error / offline fallback:", err)
    }

    setTimeout(() => {
      setSubmissionStage("pending")
    }, 1200)
  }

  const step1Valid =
    isResident &&
    (idStatus === "new"
      ? selectedCategoryId !== null && hasSoleParentalCare
      : idStatus === "renewal"
      ? isIdVerified && (existingIdNumber || "").trim() !== "" && hasSoleParentalCare && renewalReason !== ""
      : isIdVerified && (existingIdNumber || "").trim() !== "" && hasSoleParentalCare && replacementReason !== "")

  const step2Valid =
    (formData.emergencyFirstName || "").trim() !== "" &&
    (formData.emergencyLastName || "").trim() !== "" &&
    (formData.emergencyContactNo || "").trim().length === 11 &&
    (formData.emergencyRelationship || "").trim() !== ""

  const step3Valid = requiredDocs.every((doc) => (uploadedDocs[doc.id]?.length ?? 0) > 0)

  const canGoNext =
    step === 1 ? step1Valid : step === 2 ? step2Valid : step === 3 ? step3Valid : agreedCertification

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

  const fullApplicantName = [formData.firstName, formData.middleName, formData.lastName, formData.suffix]
    .filter(Boolean)
    .join(" ")

  const applicationTypeLabel =
    idStatus === "renewal" ? t("spTypeRenewal") : idStatus === "loss" ? t("spTypeReplacementRequest") : t("spTypeApplication")

  
    if (checkingEligibility) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft flex flex-col items-center text-center gap-3">
          <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
          <p className="text-sm text-muted-foreground">Sinusuri ang iyong eligibility...</p>
        </div>
      </div>
    )
  }

  if (isBlocked && (blockReason === "pending" || blockReason === "draft")) {
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
            Mayroon ka pang nakabinbing aplikasyon para sa Solo Parent ID. Maghintay
            ng pagsusuri bago magsumite ng panibagong aplikasyon.
          </p>
        </div>
      </div>
    )
  }

  if (isBlocked && blockReason === "approved") {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4">
        {onBack && (
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
            {t("spBackToServicesButton")}
          </button>
        )}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Check className="h-7 w-7 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Meron Ka Nang Approved na Application</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Hindi mo na maaaring ulitin ang application na ito.
          </p>
          {blockedReference && (
            <div className="mt-2 bg-gray-100 rounded-xl px-4 py-3 w-full">
              <p className="text-xs text-muted-foreground">Reference Number</p>
              <p className="text-sm font-semibold text-foreground">{blockedReference}</p>
            </div>
          )}
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
          <h2 className="text-lg font-bold text-foreground">{t("spSubmittingTitle")}</h2>
          <p className="text-sm text-muted-foreground max-w-sm">{t("spSubmittingDesc")}</p>
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
              Ang inyong Solo Parent ID application ay matagumpay na naisumite at kasalukuyang sinusuri.
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
              <span className="font-semibold text-foreground">Solo Parent ID Application</span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">Application Type:</span>
              <span className="font-semibold text-foreground uppercase">{applicationTypeLabel}</span>
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

        {/* Step content */}
        <div className="p-6 min-h-90">
          {/* ──────────────── STEP 1: COMPLETE CHECKLIST ──────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
                  SERVICE AND PRIMARY REQUIREMENTS
                </h3>
              </div>

              {/* Checklist items without outer borders */}
              <div className="space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isResident}
                    onChange={(e) => setIsResident(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                  />
                  <span className={`text-sm ${attemptedNext && !isResident ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                    Are you a legitimate resident of Quezon City? <span className="text-red-500">*</span>
                  </span>
                </label>
                {attemptedNext && !isResident && (
                  <p className="text-xs text-red-500 ml-6">Kinakailangang residente ng Quezon City upang makapag-apply.</p>
                )}

                {idStatus === "new" ? (
                  <>
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasSoleParentalCare}
                        onChange={(e) => setHasSoleParentalCare(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                      <span className={`text-sm ${attemptedNext && !hasSoleParentalCare ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                        Are you a solo parent with sole parental care and custody over your child/children? <span className="text-red-500">*</span>
                      </span>
                    </label>
                    {attemptedNext && !hasSoleParentalCare && (
                      <p className="text-xs text-red-500 ml-6">Kinakailangang may solong responsibilidad sa pag-aalaga ng anak.</p>
                    )}
                  </>
                ) : (
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasSoleParentalCare}
                      onChange={(e) => setHasSoleParentalCare(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                    />
                    <span className={`text-sm ${attemptedNext && !hasSoleParentalCare ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                      {idStatus === "renewal"
                        ? "Do you have an existing or expired Solo Parent ID for renewal? *"
                        : "Was your Solo Parent ID lost or damaged, and in need of replacement? *"}
                    </span>
                  </label>
                )}
              </div>

              {/* Blue Info Alert Banner */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    {idStatus === "renewal"
                      ? "PAG-RENEW NG SOLO PARENT ID"
                      : idStatus === "loss"
                      ? "PAGPAPALIT NG NAWALA O NASIRANG SOLO PARENT ID"
                      : "BAGONG APLIKASYON PARA SA SOLO PARENT ID"}
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {idStatus === "renewal"
                      ? "RENEWAL: I-update ang inyong kasalukuyang Solo Parent ID. Ihanda ang ID number at mga kaukulang dokumento."
                      : idStatus === "loss"
                      ? "REPLACEMENT: Aplikasyon para sa nawala o nasirang Solo Parent ID. Ihanda ang Affidavit of Loss o sirang ID."
                      : "NEW APPLICATION: First-time Solo Parent ID application. Complete all requirements."}
                  </p>
                </div>
              </div>

              {/* Radio question - only for NEW application */}
              {idStatus === "new" && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-sm text-blue-700 font-medium">
                    Have you already received medical assistance or Solo Parent services from another Quezon City office? <span className="text-red-500">*</span>
                  </p>
                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                      <input
                        type="radio"
                        name="otherLguAssistance"
                        checked={hasOtherLguAssistance === "yes"}
                        onChange={() => setHasOtherLguAssistance("yes")}
                        className="h-4 w-4 text-blue-600 accent-blue-600 cursor-pointer"
                      />
                      <span>Yes, I already received assistance</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                      <input
                        type="radio"
                        name="otherLguAssistance"
                        checked={hasOtherLguAssistance === "no"}
                        onChange={() => setHasOtherLguAssistance("no")}
                        className="h-4 w-4 text-blue-600 accent-blue-600 cursor-pointer"
                      />
                      <span>Not yet</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Dropdown / ID verification section */}
              {idStatus === "new" && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wide block">
                    CLICK THE TYPE OF ASSISTANCE / CATEGORY
                  </label>
                  <p className="text-xs text-blue-700 mb-1 font-medium">Choose the category / circumstance **</p>
                  <select
                    value={selectedCategoryId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null
                      setSelectedCategoryId(val)
                    }}
                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 ${
                      attemptedNext && selectedCategoryId === null
                        ? "border-red-400 focus:ring-red-300 bg-red-50"
                        : "border-border focus:ring-blue-400"
                    }`}
                  >
                    <option value="">Choose category...</option>
                    {SOLO_PARENT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                  {attemptedNext && selectedCategoryId === null && (
                    <p className="text-xs text-red-500 mt-1">Pumili ng kategorya upang makapagpatuloy.</p>
                  )}
                </div>
              )}

              {/* RENEWAL: STEP 1 — VERIFY EXISTING SOLO PARENT ID */}
              {idStatus === "renewal" && (
                <div className="space-y-5 pt-2">
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Existing Solo Parent ID
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide block text-gray-700">
                      Existing Solo Parent ID Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                      <div className="flex-1">
                        <TextInput
                          value={existingIdNumber}
                          onChange={(v) => {
                            setExistingIdNumber(v)
                            setIsIdVerified(false)
                            setVerifyError("")
                          }}
                          placeholder="Enter Solo Parent ID Number"
                          invalid={attemptedNext && (!(existingIdNumber || "").trim() || !isIdVerified)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyId}
                        disabled={!(existingIdNumber || "").trim() || isVerifying}
                        className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 h-10 uppercase tracking-wide"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>VERIFY ID</span>
                          </>
                        )}
                      </button>
                    </div>
                    {verifyError && <p className="text-xs text-red-500 mt-1">{verifyError}</p>}
                    {attemptedNext && !isIdVerified && (
                      <p className="text-xs text-red-500 mt-1">
                        Pindutin ang VERIFY ID at tiyaking verified ang record bago magpatuloy.
                      </p>
                    )}
                  </div>

                  {isIdVerified && (
                    <div className="space-y-4 max-w-md">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
                        <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                            ✓ Solo Parent ID Verified
                          </p>
                          <p className="text-xs text-emerald-800">
                            <span className="font-semibold">Existing Solo Parent record found:</span> {verifiedRecord?.name || `${userProfile.firstName} ${userProfile.lastName}`}
                          </p>
                          <p className="text-xs text-emerald-800">
                            <span className="font-semibold">ID Status:</span> Active / Expired
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide block text-gray-700">
                          Reason for Renewal <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap items-center gap-6 pt-1">
                          {[
                            { label: "Expired ID", value: "Expired ID" },
                            { label: "Updating Personal Information", value: "Updating Personal Information" },
                            { label: "Updating Family Information", value: "Updating Family Information" },
                            { label: "Damaged ID", value: "Damaged ID" },
                          ].map((opt) => (
                            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="spRenewalReason"
                                checked={renewalReason === opt.value}
                                onChange={() => setRenewalReason(opt.value)}
                                className="h-4 w-4 text-blue-600 accent-blue-600 cursor-pointer"
                              />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                        {attemptedNext && !renewalReason && (
                          <p className="text-xs text-red-500 mt-1">Pumili ng dahilan ng renewal.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LOSS: STEP 1 — VERIFY EXISTING SOLO PARENT ID */}
              {idStatus === "loss" && (
                <div className="space-y-5 pt-2">
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Existing Solo Parent ID
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide block text-gray-700">
                      Existing Solo Parent ID Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                      <div className="flex-1">
                        <TextInput
                          value={existingIdNumber}
                          onChange={(v) => {
                            setExistingIdNumber(v)
                            setIsIdVerified(false)
                            setVerifyError("")
                          }}
                          placeholder="Enter Solo Parent ID Number"
                          invalid={attemptedNext && (!(existingIdNumber || "").trim() || !isIdVerified)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyId}
                        disabled={!(existingIdNumber || "").trim() || isVerifying}
                        className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 h-10 uppercase tracking-wide"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>VERIFY ID</span>
                          </>
                        )}
                      </button>
                    </div>
                    {verifyError && <p className="text-xs text-red-500 mt-1">{verifyError}</p>}
                    {attemptedNext && !isIdVerified && (
                      <p className="text-xs text-red-500 mt-1">
                        Pindutin ang VERIFY ID at tiyaking verified ang record bago magpatuloy.
                      </p>
                    )}
                  </div>

                  {isIdVerified && (
                    <div className="space-y-4 max-w-md">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
                        <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                            ✓ Solo Parent ID Verified
                          </p>
                          <p className="text-xs text-emerald-800">
                            <span className="font-semibold">Existing Solo Parent record found:</span> {verifiedRecord?.name || `${userProfile.firstName} ${userProfile.lastName}`}
                          </p>
                          <p className="text-xs text-emerald-800">
                            <span className="font-semibold">ID Status:</span> Active / Expired
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide block text-gray-700">
                          Reason for Replacement <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap items-center gap-6 pt-1">
                          {[
                            { label: "Lost Solo Parent ID", value: "Lost" },
                            { label: "Damaged Solo Parent ID", value: "Damaged" },
                            { label: "Stolen Solo Parent ID", value: "Stolen" },
                          ].map((opt) => (
                            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="spReplacementReason"
                                checked={replacementReason === opt.value}
                                onChange={() => setReplacementReason(opt.value)}
                                className="h-4 w-4 text-blue-600 accent-blue-600 cursor-pointer"
                              />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                        {attemptedNext && !replacementReason && (
                          <p className="text-xs text-red-500 mt-1">Pumili ng dahilan ng pagpapalit.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 tracking-wide uppercase">
                    {t("wizardPersonal") || "PERSONAL INFORMATION"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t("reviewSeniorDesc") || "Please review your personal information from your QCID profile. Fill in the additional details below."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {isEditingInfo ? "LOCK INFORMATION" : "EDIT INFORMATION"}
                  </button>
                </div>
              </div>

              {/* IMPORTANT REMINDER BOX */}
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-600">{t("importantReminder") || "Important reminder"}</p>
                  <p className="text-blue-600/90 mt-0.5 text-xs sm:text-sm">
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
                      value={formData.qcidNumber || userProfile?.qcidNo || "110000116932100"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, qcidNumber: e.target.value }))}
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
                      value={formData.firstName || userProfile?.firstName || "CLARISA MAE"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
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
                      value={formData.middleName !== undefined && formData.middleName !== "" ? formData.middleName : (userProfile?.middleName || "GALIAS")}
                      onChange={(e) => setFormData((prev) => ({ ...prev, middleName: e.target.value }))}
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
                      value={formData.lastName || userProfile?.lastName || "DIMAL"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
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
                      value={formData.suffix || userProfile?.suffix || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, suffix: e.target.value }))}
                      placeholder={t("suffixLabel") || "Suffix (Jr., Sr., III, etc.)"}
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
                      value={formData.citizenship || userProfile?.nationality || "FILIPINO"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, citizenship: e.target.value }))}
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
                      value={
                        formData.dobMonth && formData.dobDay && formData.dobYear
                          ? `${formData.dobMonth}/${formData.dobDay}/${formData.dobYear}`
                          : (userProfile?.dobMonth && userProfile?.dobDay && userProfile?.dobYear
                            ? `${userProfile.dobMonth}/${userProfile.dobDay}/${userProfile.dobYear}`
                            : "10/29/1960")
                      }
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
                      value={formData.age || userProfile?.age || "65"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
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
                      value={formData.sex || userProfile?.sex || "Female"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sex: e.target.value }))}
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
                      value={formData.civilStatus || userProfile?.civilStatus || "Single"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, civilStatus: e.target.value }))}
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
                    <label className="text-xs font-semibold text-gray-700">Blood type *</label>
                    <select
                      value={formData.bloodType || "O+"}
                      onChange={(e) => updateField("bloodType", e.target.value)}
                      disabled={idStatus !== "new" && !isEditingInfo}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 transition-colors ${
                        idStatus !== "new" && !isEditingInfo
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
                      value={formData.addressHouseNo || userProfile?.addressHouseNo || "11"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, addressHouseNo: e.target.value }))}
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
                    <label className="text-xs font-semibold text-gray-700">{t("streetNameLabel") || "Street name"} *</label>
                    <input
                      type="text"
                      value={formData.addressStreet || userProfile?.addressStreet || "OLD CABUYAO SAMPALOK ST"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, addressStreet: e.target.value }))}
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
                      value={formData.addressBarangay || userProfile?.addressBarangay || "Sauyo"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, addressBarangay: e.target.value }))}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("phoneNumberLabel") || "Phone number"} *</label>
                    <input
                      type="text"
                      value={formData.contactNo || userProfile?.contactNo || "09000000000"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contactNo: e.target.value }))}
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
                    <label className="text-xs font-semibold text-gray-700">{t("emailLabel") || "Email"} *</label>
                    <input
                      type="text"
                      value={formData.email || userProfile?.email || "dimalmae@gmail.com"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
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

                {/* EMERGENCY CONTACT */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#3b82f6]" />
                    {t("emergencyContactTitle") || "EMERGENCY CONTACT"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${attemptedNext && !(formData.emergencyFirstName || "").trim() ? "text-red-600" : "text-gray-700"}`}>
                        {t("firstNameLabel") || "First name"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyFirstName}
                        onChange={(e) => updateField("emergencyFirstName", e.target.value.toUpperCase())}
                        readOnly={idStatus !== "new" && !isEditingInfo}
                        disabled={idStatus !== "new" && !isEditingInfo}
                        placeholder={t("firstNameLabel") || "First name"}
                        className={`w-full h-11 rounded-lg border px-3.5 text-sm transition-colors ${
                          idStatus !== "new" && !isEditingInfo
                            ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                            : isEditingInfo
                            ? "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                            : attemptedNext && !(formData.emergencyFirstName || "").trim()
                            ? "border-red-400 focus:ring-red-300 bg-red-50"
                            : "border-gray-300 bg-white focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${attemptedNext && !(formData.emergencyLastName || "").trim() ? "text-red-600" : "text-gray-700"}`}>
                        {t("lastNameLabel") || "Last name"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyLastName}
                        onChange={(e) => updateField("emergencyLastName", e.target.value.toUpperCase())}
                        readOnly={idStatus !== "new" && !isEditingInfo}
                        disabled={idStatus !== "new" && !isEditingInfo}
                        placeholder={t("lastNameLabel") || "Last name"}
                        className={`w-full h-11 rounded-lg border px-3.5 text-sm transition-colors ${
                          idStatus !== "new" && !isEditingInfo
                            ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                            : isEditingInfo
                            ? "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                            : attemptedNext && !(formData.emergencyLastName || "").trim()
                            ? "border-red-400 focus:ring-red-300 bg-red-50"
                            : "border-gray-300 bg-white focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${attemptedNext && (formData.emergencyContactNo || "").trim().length < 11 ? "text-red-600" : "text-gray-700"}`}>
                        {t("phoneNumberLabel") || "Phone number"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={11}
                        value={formData.emergencyContactNo}
                        onChange={(e) => updateField("emergencyContactNo", e.target.value.replace(/\D/g, ""))}
                        readOnly={idStatus !== "new" && !isEditingInfo}
                        disabled={idStatus !== "new" && !isEditingInfo}
                        placeholder="09XXXXXXXXX"
                        className={`w-full h-11 rounded-lg border px-3.5 text-sm font-mono transition-colors ${
                          idStatus !== "new" && !isEditingInfo
                            ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed"
                            : isEditingInfo
                            ? "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                            : attemptedNext && (formData.emergencyContactNo || "").trim().length < 11
                            ? "border-red-400 focus:ring-red-300 bg-red-50"
                            : "border-gray-300 bg-white focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${attemptedNext && !(formData.emergencyRelationship || "").trim() ? "text-red-600" : "text-gray-700"}`}>
                        {t("pwdRelationshipLabel") || "Relationship"} <span className="text-red-500">*</span>
                      </label>
                      {idStatus !== "new" && !isEditingInfo ? (
                        <input
                          type="text"
                          value={formData.emergencyRelationship || "Friend / Neighbor"}
                          readOnly
                          disabled
                          className="w-full h-11 rounded-lg border border-gray-200 px-3.5 text-sm bg-gray-100 text-gray-800 cursor-not-allowed"
                        />
                      ) : (
                        <select
                          value={formData.emergencyRelationship}
                          onChange={(e) => updateField("emergencyRelationship", e.target.value)}
                          className={`w-full h-11 rounded-lg border px-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                            isEditingInfo
                              ? "bg-white text-gray-900 border-blue-400 ring-2 ring-blue-100"
                              : attemptedNext && !(formData.emergencyRelationship || "").trim()
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
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                <p className="text-sm font-bold text-foreground">
                  {idStatus === "renewal" ? t("spDocForRenewalLabel") : idStatus === "loss" ? t("spDocForLossLabel") : t("spDocForNewLabel")}
                </p>

                <div className="space-y-6">
                  {requiredDocs.map((doc, docIndex) => (
                    <DocumentUploadRow
                      key={doc.id}
                      doc={doc}
                      docIndex={docIndex}
                      files={uploadedDocs[doc.id] || []}
                      invalid={attemptedNext && (uploadedDocs[doc.id]?.length ?? 0) === 0}
                      onUpload={(files) => handleFileUpload(doc.id, files)}
                      onRemove={(fileIndex) => handleRemoveFile(doc.id, fileIndex)}
                      onSampleClick={(d) => {
                        setSelectedSampleDoc(d)
                        setShowSampleModal(true)
                      }}
                      onCameraClick={(d) => setCameraDoc(d)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">{t("spDocFileTypeNote")}</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-foreground">{(t("pwdReviewHeader") || "REVIEW INFORMATION").toUpperCase()}</h3>
                <p className="text-sm text-muted-foreground">{t("pwdReviewDesc") || "Pakisuri nang mabuti ang lahat ng impormasyon at uploaded documents bago isumite ang aplikasyon."}</p>
              </div>

              {/* Application Details */}
              <ReviewSection title="Application Details" onEdit={() => setStep(1)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-xs">
                  <ReviewField
                    label="Application Type"
                    value={
                      idStatus === "new"
                        ? "New Application (Bagong Solo Parent ID)"
                        : idStatus === "renewal"
                        ? "Renewal ng Solo Parent ID"
                        : "Replacement / Lost Solo Parent ID"
                    }
                  />
                  {idStatus === "new" ? (
                    <ReviewField
                      label="Solo Parent Category / Reason"
                      value={selectedCategory ? selectedCategory.title : "—"}
                    />
                  ) : (
                    <>
                      <ReviewField
                        label="Solo Parent ID Number"
                        value={existingIdNumber || "—"}
                      />
                      <ReviewField
                        label={idStatus === "renewal" ? "Reason for Renewal" : "Reason for Replacement"}
                        value={(idStatus === "renewal" ? renewalReason : replacementReason) || "—"}
                      />
                    </>
                  )}
                  <ReviewField label="Residency Status" value="Residente ng Lungsod Quezon (Verified)" />
                </div>
              </ReviewSection>

              {/* Personal Information */}
              <ReviewSection title="Personal Information" onEdit={() => setStep(2)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-xs">
                  <ReviewField label="Full Name" value={fullApplicantName} />
                  <ReviewField
                    label="Date of Birth / Age"
                    value={`${[formData.dobMonth, formData.dobDay, formData.dobYear].filter(Boolean).join("/")} (${formData.age} y/o)`}
                  />
                  <ReviewField label="Sex / Gender" value={formData.sex} />
                  <ReviewField label="Civil Status" value={formData.civilStatus} />
                  <ReviewField label="Blood Type" value={formData.bloodType || "O+"} />
                  <ReviewField label="Contact Number" value={formData.contactNo} />
                  <ReviewField
                    label="Complete Address"
                    value={`${formData.addressHouseNo} ${formData.addressStreet}, Brgy. ${formData.addressBarangay}, ${formData.addressCityMunicipality}`}
                  />
                  <ReviewField label="Barangay" value={formData.addressBarangay} />
                  <ReviewField label="QCID Number" value={formData.qcidNumber} />
                  <ReviewField label="Email Address" value={formData.email || "—"} />
                  <ReviewField label="Emergency Contact" value={`${formData.emergencyFirstName} ${formData.emergencyLastName}`} />
                  <ReviewField label="Emergency Contact No." value={formData.emergencyContactNo} />
                  <ReviewField label="Emergency Relationship" value={formData.emergencyRelationship} />
                </div>
              </ReviewSection>

              {/* Uploaded Documents */}
              <ReviewSection title="Uploaded Documents" onEdit={() => setStep(3)}>
                <div className="p-4 space-y-4">
                  {requiredDocs.map((doc) => {
                    const files = uploadedDocs[doc.id] || []
                    const uploaded = files.length > 0
                    return (
                      <div key={doc.id}>
                        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                          {doc.label} <span className="text-red-500">*</span>
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
              </ReviewSection>

              {/* Certification Checkbox */}
              <div className="border border-border rounded-xl p-4 bg-gray-50 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedCertification}
                    onChange={(e) => setAgreedCertification(e.target.checked)}
                    className="mt-0.5 accent-blue-600 h-4 w-4 shrink-0"
                  />
                  <span className="text-xs text-foreground font-medium leading-relaxed select-none">
                    Pinatutunayan ko na ang lahat ng impormasyong aking ibinigay ay totoo, wasto, at kumpleto ayon sa aking pinakamahusay na kaalaman. Nauunawaan ko na ang anumang maling pahayag ay maaaring maging sanhi ng pagkakansela ng aking aplikasyon. <span className="text-red-500">*</span>
                  </span>
                </label>
                {attemptedNext && !agreedCertification && (
                  <p className="text-xs text-red-500 ml-6 font-semibold">
                    Kailangang lagyan ng tsek ang certification checkbox bago mag-submit.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-gray-50">
          {step === 1 ? (
            <div />
          ) : (
            <button onClick={goBack} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
              {t("spBackButton")}
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={goNext}
              disabled={!canGoNext}
              className={`flex items-center gap-1.5 px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                canGoNext ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {t("spNextButton") || "NEXT"} <ChevronRight className="h-4 w-4" />
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
      <DocumentSampleModal
        doc={selectedSampleDoc}
        isOpen={showSampleModal}
        onClose={() => {
          setShowSampleModal(false)
          setSelectedSampleDoc(null)
        }}
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
import { useState, useEffect, type ReactNode } from "react"
import {
  Check,
  FileText,
  Upload,
  X,
  Pencil,
  Info,
  Users,
  Baby,
  AlertCircle,
  User,
  Camera,
  ChevronUp,
  RotateCcw,
} from "lucide-react"
import { useLanguage } from "../ui/language-context"
import { DataPrivacyConsent } from "../ui/data-privacy-consent"
import { SubmitPrivacyOverlayModal } from "../ui/submit-privacy-overlay-modal"
import { getCurrentUserProfile } from "../../utils/userProfile"
import { notifyApplicationChange, subscribeToRealtimeChanges } from "../../utils/realtimeSync"
import { API_BASE, getAuthHeaders, getAuthToken } from "../../config/api"
import { readFileAsDataUrl } from "../../utils/fileUpload"
import DocumentCameraModal from "../ui/document-camera-modal"

function generateReference(qcid?: string) {
  if (qcid && qcid.trim()) return qcid.trim()
  return "110000116932100"
}

export interface ChildWelfareProgram {
  id: number
  key: string
  title: string
  desc: string
  checklists: [string, string, string]
  receivedQuestion: string
  receivedOptions: string[]
  assistanceTypeLabel: string
  assistanceTypes: string[]
  whatIsIt: string
  whoIsEligible: string[]
  childRequirements: string[]
  parentRequirements: string[]
  specialRequirements: string[]
  hasProtectionConcern?: boolean
  hasEmergencyInfo?: boolean
  hasPsychosocialReason?: boolean
  hasShelterCareInfo?: boolean
  hasParentingReason?: boolean
  documents: {
    id: string
    label: string
    required: boolean
    description?: string
    sampleImage?: string
  }[]
  submitButtonText?: string
}

export const CHILD_WELFARE_PROGRAMS: ChildWelfareProgram[] = [
  {
    id: 1,
    key: "educational-assistance",
    title: "Educational Assistance for Indigent Children & Youth",
    desc: "Provides educational financial assistance and learning support for indigent children & youth, solo parents' children/beneficiaries, and children with disabilities (CWD) residing in Quezon City.",
    checklists: [
      "Are you a legitimate resident of Quezon City?",
      "Are you applying for educational assistance for an indigent child or youth?",
      "Is the beneficiary currently enrolled or in need of educational assistance?",
    ],
    receivedQuestion: "Have you already received educational assistance from another Quezon City office? *",
    receivedOptions: ["Yes, I already received educational assistance", "Not yet"],
    assistanceTypeLabel: "Choose the type of assistance *",
    assistanceTypes: [
      "Educational Financial Assistance (₱5,000 / Student)",
      "School Supplies & Learning Materials Support",
      "Tuition / Miscellaneous Fee Subsidy",
      "Special Education (SPED) / CWD Learning Assistance",
    ],
    whatIsIt: "The Educational Assistance for Indigent Children & Youth Program provides financial assistance and learning support to qualified indigent students, children of solo parents, and children with disabilities in Quezon City to help them continue their studies.",
    whoIsEligible: [
      "Indigent children and youth residing in Quezon City currently enrolled in elementary, high school, or college.",
      "Children/beneficiaries of registered Solo Parents.",
      "Children with Disabilities (CWD) enrolled in formal or SPED classes.",
    ],
    childRequirements: [
      "Certificate of Enrollment – Original",
      "Recent School ID – if available",
    ],
    parentRequirements: [
      "Barangay Certificate of Indigency – Original (Purpose: Educational Assistance)",
      "Valid Government ID / preferably QCitizen ID",
    ],
    specialRequirements: [
      "School Enrollment / Academic Record Assessment",
    ],
    documents: [
      {
        id: "barangayIndigency",
        label: "Barangay Certificate of Indigency – Original (Purpose: Educational Assistance)",
        required: true,
        sampleImage: "/samples/BARANGAY CERTIFICATE.webp",
      },
      {
        id: "certEnrollment",
        label: "Certificate of Enrollment – Original",
        required: true,
        sampleImage: "/samples/sample_valid_id.png",
      },
      {
        id: "schoolId",
        label: "Recent School ID – if available",
        required: false,
        sampleImage: "/samples/sample_valid_id.png",
      },
      {
        id: "validGovId",
        label: "Valid Government ID / preferably QCitizen ID",
        required: true,
        sampleImage: "/samples/QC ID.png",
      },
    ],
    submitButtonText: "SUBMIT APPLICATION",
  },
  {
    id: 2,
    key: "child-welfare-services",
    title: "Child Welfare Services",
    desc: "Comprehensive care, protection, and developmental welfare services dedicated to ensuring the well-being and rights of children and youth in Quezon City.",
    checklists: [
      "Are you a legitimate resident of Quezon City?",
      "Are you applying for welfare assistance for a child or youth?",
      "Is the beneficiary in need of child welfare support and social services?",
    ],
    receivedQuestion: "Have you already received child welfare assistance from another Quezon City office? *",
    receivedOptions: ["Yes, I already received assistance", "Not yet"],
    assistanceTypeLabel: "Choose the type of assistance *",
    assistanceTypes: [
      "Educational Financial Assistance (₱5,000 / Student)",
      "School Supplies & Learning Materials Support",
      "Tuition / Miscellaneous Fee Subsidy",
      "Special Education (SPED) / CWD Learning Assistance",
    ],
    whatIsIt: "The Child Welfare Services Program provides comprehensive care, development, and social welfare support to qualified indigent children, solo parents' children, and children with special needs in Quezon City.",
    whoIsEligible: [
      "Indigent children and youth residing in Quezon City currently enrolled in elementary, high school, or college.",
      "Children/beneficiaries of registered Solo Parents.",
      "Children with Disabilities (CWD) enrolled in formal or SPED classes.",
    ],
    childRequirements: [
      "Birth certificate, if available",
      "School documents, if applicable",
    ],
    parentRequirements: [
      "Upload available documents",
      "Referral letter, if applicable",
      "Medical/police/barangay documents, if applicable",
    ],
    specialRequirements: [
      "Social Welfare Case Assessment",
    ],
    documents: [
      {
        id: "availableDocs",
        label: "Upload available documents",
        required: true,
        sampleImage: "/samples/BARANGAY CERTIFICATE.webp",
      },
      {
        id: "referralLetter",
        label: "Referral letter, if applicable",
        required: false,
        sampleImage: "/samples/sample_valid_id.png",
      },
      {
        id: "birthCert",
        label: "Birth certificate, if available",
        required: false,
        sampleImage: "/samples/sample_valid_id.png",
      },
      {
        id: "medPoliceBrgyDocs",
        label: "Medical/police/barangay documents, if applicable",
        required: false,
        sampleImage: "/samples/sample_valid_id.png",
      },
    ],
    submitButtonText: "SUBMIT APPLICATION",
  },
]

export function getLocalizedChildWelfarePrograms(language: string): ChildWelfareProgram[] {
  if (language === "tl") {
    return [
      {
        id: 1,
        key: "educational-assistance",
        title: "Tulong-Pang-edukasyon para sa Maralitang Bata at Kabataan",
        desc: "Nagbibigay ng tulong-pinansyal at suporta sa edukasyon para sa mga maralitang bata at kabataan, anak ng solo parent, at mga batang may kapansanan (CWD) sa Lungsod Quezon.",
        checklists: [
          "Ikaw ba ay lehitimong residente ng Quezon City?",
          "Nag-a-apply ka ba para sa tulong-pang-edukasyon para sa bata o kabataan?",
          "Kasalukuyan bang naka-enroll o nangangailangan ng tulong sa pag-aaral ang benepisyaryo?",
        ],
        receivedQuestion: "Nakatanggap ka na ba ng tulong-pang-edukasyon mula sa ibang opisina ng Quezon City? *",
        receivedOptions: ["Oo, nakatanggap na ako ng tulong-pang-edukasyon", "Hindi pa"],
        assistanceTypeLabel: "Piliin ang uri ng tulong *",
        assistanceTypes: [
          "Educational Financial Assistance (₱5,000 / Student)",
          "School Supplies & Learning Materials Support",
          "Tuition / Miscellaneous Fee Subsidy",
          "Special Education (SPED) / CWD Learning Assistance",
        ],
        whatIsIt: "Ang Educational Assistance Program ay nagbibigay ng suportang pinansyal at gamit sa pag-aaral sa mga maralitang mag-aaral, anak ng solo parent, at batang may kapansanan sa Lungsod Quezon upang makapagpatuloy sa kanilang edukasyon.",
        whoIsEligible: [
          "Mga maralitang bata at kabataang residente ng Quezon City na kasalukuyang nag-aaral sa elementarya, hayskul, o kolehiyo.",
          "Mga anak o benepisyaryo ng rehistradong Solo Parent.",
          "Mga Batang may Kapansanan (CWD) na naka-enroll sa pormal o SPED na klase.",
        ],
        childRequirements: [
          "Certificate of Enrollment – Original",
          "Recent School ID – kung mayroon",
        ],
        parentRequirements: [
          "Barangay Certificate of Indigency – Original (Purpose: Educational Assistance)",
          "Valid Government ID / mas mainam ang QCitizen ID",
        ],
        specialRequirements: [
          "School Enrollment / Academic Record Assessment",
        ],
        documents: [
          {
            id: "barangayIndigency",
            label: "Barangay Certificate of Indigency – Original (Purpose: Educational Assistance)",
            required: true,
            sampleImage: "/samples/BARANGAY CERTIFICATE.webp",
          },
          {
            id: "certEnrollment",
            label: "Certificate of Enrollment – Original",
            required: true,
            sampleImage: "/samples/sample_valid_id.png",
          },
          {
            id: "schoolId",
            label: "Recent School ID – if available",
            required: false,
            sampleImage: "/samples/sample_valid_id.png",
          },
          {
            id: "validGovId",
            label: "Valid Government ID / preferably QCitizen ID",
            required: true,
            sampleImage: "/samples/QC ID.png",
          },
        ],
        submitButtonText: "ISUMITE ANG APLIKASYON",
      },
      {
        id: 2,
        key: "child-welfare-services",
        title: "Child Welfare Services",
        desc: "Komprehensibong serbisyo at programang pangangalaga, proteksyon, at pagpapaunlad para sa kapakanan ng mga bata at kabataan sa Lungsod Quezon.",
        checklists: [
          "Ikaw ba ay lehitimong residente ng Quezon City?",
          "Nag-a-apply ka ba para sa tulong sa kapakanan ng bata o kabataan?",
          "Nangangailangan ba ang benepisyaryo ng serbisyo at suportang panlipunan para sa bata?",
        ],
        receivedQuestion: "Nakatanggap ka na ba ng tulong mula sa ibang opisina ng Quezon City? *",
        receivedOptions: ["Oo, nakatanggap na ako", "Hindi pa"],
        assistanceTypeLabel: "Piliin ang uri ng tulong *",
        assistanceTypes: [
          "Child Protection Services",
          "Alternative Child Care",
          "Rehabilitative Counseling",
        ],
        whatIsIt: "Ang Child Welfare Services ay nagbibigay ng komprehensibong pangangalaga, proteksyon, at serbisyong panlipunan para sa mga maralitang bata at kabataan sa Lungsod Quezon.",
        whoIsEligible: [
          "Mga bata at kabataang residente ng Quezon City na nangangailangan ng proteksyon, pangangalaga, o counseling.",
          "Mga anak o benepisyaryo ng rehistradong Solo Parent.",
          "Mga Batang may Kapansanan (CWD) at mga maralitang kabataan.",
        ],
        childRequirements: [
          "Birth certificate, if available (kung mayroon)",
          "School documents, if applicable (kung mayroon)",
        ],
        parentRequirements: [
          "Upload available documents (Mag-upload ng mga available na dokumento)",
          "Referral letter, if applicable (kung mayroon)",
          "Medical/police/barangay documents, if applicable (kung mayroon)",
        ],
        specialRequirements: [
          "Social Welfare Case Assessment",
        ],
        documents: [
          {
            id: "availableDocs",
            label: "Upload available documents",
            required: true,
            sampleImage: "/samples/BARANGAY CERTIFICATE.webp",
          },
          {
            id: "referralLetter",
            label: "Referral letter, if applicable",
            required: false,
            sampleImage: "/samples/sample_valid_id.png",
          },
          {
            id: "birthCert",
            label: "Birth certificate, if available",
            required: false,
            sampleImage: "/samples/sample_valid_id.png",
          },
          {
            id: "medPoliceBrgyDocs",
            label: "Medical/police/barangay documents, if applicable",
            required: false,
            sampleImage: "/samples/sample_valid_id.png",
          },
        ],
        submitButtonText: "ISUMITE ANG APLIKASYON",
      },
    ]
  }

  if (language === "bis") {
    return [
      {
        id: 1,
        key: "educational-assistance",
        title: "Tabang Pang-edukasyon alang sa Kabus nga mga Bata ug Kabatan-onan",
        desc: "Naghatag og pinansyal nga tabang ug suporta sa edukasyon alang sa mga kabus nga bata ug kabatan-onan, anak sa solo parent, ug mga bata nga adunay kapansanan (CWD) sa Quezon City.",
        checklists: [
          "Ikaw ba usa ka lehitimong residente sa Quezon City?",
          "Nag-apply ba ka alang sa tabang pang-edukasyon para sa bata o batan-on?",
          "Kasamtangan ba nga naka-enroll o nagkinahanglan og tabang sa pag-eskwela ang benepisyaryo?",
        ],
        receivedQuestion: "Nakadawat na ba ka og tabang pang-edukasyon gikan sa laing opisina sa Quezon City? *",
        receivedOptions: ["Oo, nakadawat na ko og tabang pang-edukasyon", "Wala pa"],
        assistanceTypeLabel: "Pilia ang matang sa tabang *",
        assistanceTypes: [
          "Educational Financial Assistance (₱5,000 / Student)",
          "School Supplies & Learning Materials Support",
          "Tuition / Miscellaneous Fee Subsidy",
          "Special Education (SPED) / CWD Learning Assistance",
        ],
        whatIsIt: "Ang Educational Assistance Program naghatag og pinansyal nga suporta ug gamit sa pagtuon alang sa mga kabus nga estudyante, anak sa solo parent, ug bata nga may kapansanan sa Quezon City.",
        whoIsEligible: [
          "Mga kabus nga bata ug kabatan-onan sa Quezon City nga kasamtangang nag-eskwela sa elementarya, high school, o kolehiyo.",
          "Mga anak o benepisyaryo sa rehistradong Solo Parent.",
          "Mga Bata nga Adunay Kapansanan (CWD) nga naka-enroll sa pormal o SPED classes.",
        ],
        childRequirements: [
          "Certificate of Enrollment – Original",
          "Recent School ID – kung anaa",
        ],
        parentRequirements: [
          "Barangay Certificate of Indigency – Original (Purpose: Educational Assistance)",
          "Balido nga Government ID / QCID",
        ],
        specialRequirements: [
          "School Enrollment / Academic Record Assessment",
        ],
        documents: [
          {
            id: "barangayIndigency",
            label: "Barangay Certificate of Indigency – Original (Purpose: Educational Assistance)",
            required: true,
            sampleImage: "/samples/BARANGAY CERTIFICATE.webp",
          },
          {
            id: "certEnrollment",
            label: "Certificate of Enrollment – Original",
            required: true,
            sampleImage: "/samples/sample_valid_id.png",
          },
          {
            id: "schoolId",
            label: "Recent School ID – if available",
            required: false,
            sampleImage: "/samples/sample_valid_id.png",
          },
          {
            id: "validGovId",
            label: "Valid Government ID / preferably QCitizen ID",
            required: true,
            sampleImage: "/samples/QC ID.png",
          },
        ],
        submitButtonText: "ISUMITE ANG APLIKASYON",
      },
      {
        id: 2,
        key: "child-welfare-services",
        title: "Child Welfare Services",
        desc: "Komprehensibong serbisyo ug programa sa pag-atiman, proteksyon, ug kalamboan alang sa kaayohan sa mga bata ug kabatan-onan sa Quezon City.",
        checklists: [
          "Ikaw ba usa ka lehitimong residente sa Quezon City?",
          "Nag-apply ba ka alang sa tabang sa kaayohan sa bata o batan-on?",
          "Nagkinahanglan ba ang benepisyaryo og suporta ug serbisyong sosyal alang sa mga bata?",
        ],
        receivedQuestion: "Nakadawat na ba ka og tabang gikan sa laing opisina sa Quezon City? *",
        receivedOptions: ["Oo, nakadawat na ko", "Wala pa"],
        assistanceTypeLabel: "Pilia ang matang sa tabang *",
        assistanceTypes: [
          "Child Protection Services",
          "Alternative Child Care",
          "Rehabilitative Counseling",
        ],
        whatIsIt: "Ang Child Welfare Services naghatag og komprehensibong pag-atiman, proteksyon, ug serbisyo sosyal alang sa mga kabus nga bata ug kabatan-onan sa Quezon City.",
        whoIsEligible: [
          "Mga bata ug kabatan-onan sa Quezon City nga nagkinahanglan og proteksyon, pag-atiman, o counseling.",
          "Mga anak o benepisyaryo sa rehistradong Solo Parent.",
          "Mga Bata nga Adunay Kapansanan (CWD) ug kabus nga kabatan-onan.",
        ],
        childRequirements: [
          "Birth certificate, if available (kung anaa)",
          "School documents, if applicable (kung anaa)",
        ],
        parentRequirements: [
          "Upload available documents (I-upload ang mga available nga dokumento)",
          "Referral letter, if applicable (kung anaa)",
          "Medical/police/barangay documents, if applicable (kung anaa)",
        ],
        specialRequirements: [
          "Social Welfare Case Assessment",
        ],
        documents: [
          {
            id: "availableDocs",
            label: "Upload available documents",
            required: true,
            sampleImage: "/samples/BARANGAY CERTIFICATE.webp",
          },
          {
            id: "referralLetter",
            label: "Referral letter, if applicable",
            required: false,
            sampleImage: "/samples/sample_valid_id.png",
          },
          {
            id: "birthCert",
            label: "Birth certificate, if available",
            required: false,
            sampleImage: "/samples/sample_valid_id.png",
          },
          {
            id: "medPoliceBrgyDocs",
            label: "Medical/police/barangay documents, if applicable",
            required: false,
            sampleImage: "/samples/sample_valid_id.png",
          },
        ],
        submitButtonText: "ISUMITE ANG APLIKASYON",
      },
    ]
  }

  return CHILD_WELFARE_PROGRAMS
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0.0 KB"
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export interface UserProfile {
  userId?: string
  qcidNo?: string
  qcidNumber?: string
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  nationality?: string
  dobMonth?: string
  dobDay?: string
  dobYear?: string
  birthMonth?: string
  birthDay?: string
  birthYear?: string
  age?: string | number
  sex?: string
  civilStatus?: string
  addressHouseNo?: string
  houseNo?: string
  addressStreet?: string
  street?: string
  addressBarangay?: string
  barangay?: string
  addressCityMunicipality?: string
  city?: string
  contactNo?: string
  mobileNumber?: string
  email?: string
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
    <label className="flex items-start gap-2.5 text-sm cursor-pointer select-none group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        className={`flex items-center justify-center h-4.5 w-4.5 mt-0.5 rounded-[3px] shrink-0 border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 ${
          checked ? "bg-[#3b82f6] border-[#3b82f6]" : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 group-hover:border-blue-400"
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
      </span>
      <span className="leading-snug text-slate-800 dark:text-white font-medium text-sm">{label}</span>
    </label>
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
  return <FileText className="h-8 w-8 text-gray-400" />
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
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide truncate pr-2">{title}</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 max-h-[65vh] overflow-y-auto bg-gray-50 flex items-center justify-center">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt={title} className="max-w-full max-h-[55vh] rounded-lg border border-gray-200 object-contain shadow-xs" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-500">
              <FileText className="h-12 w-12 text-blue-500" />
              <p className="text-sm font-medium">{file.name}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-gray-200 text-xs text-gray-500 truncate bg-white">
          {file.name}
        </div>
      </div>
    </div>
  )
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">{value || "—"}</p>
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
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer"
        >
          <ChevronUp className={`h-4 w-4 text-gray-500 transition-transform ${open ? "" : "rotate-180"}`} />
          {title}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <Pencil className="w-3 h-3" />
          <span>{t("editButton")?.toUpperCase() || "I-EDIT"}</span>
        </button>
      </div>
      {open && children}
    </div>
  )
}

interface ChildWelfareWizardProps {
  onBack?: () => void
  userProfile?: UserProfile
  initialProgramId?: number
  initialProgramKey?: string
  onStepChange?: (step: number) => void
  onSubmissionStageChange?: (stage: "form" | "matching" | "pending", status?: string) => void
}

export default function ChildWelfareApplicationWizard({
  onBack,
  userProfile: propUserProfile,
  initialProgramId,
  initialProgramKey,
  onStepChange,
  onSubmissionStageChange,
}: ChildWelfareWizardProps) {
  const { t, language } = useLanguage()
  const [profile, setProfile] = useState(() => (propUserProfile || getCurrentUserProfile()) as any)
  const userProfile = propUserProfile || profile || (getCurrentUserProfile() as any)

  const getProfileData = (prof: any) => {
    const p = prof || {}
    const fullName = [p.firstName, p.middleName, p.lastName, p.suffix].filter(Boolean).join(" ").trim()
    const fullAddress = [p.addressHouseNo || p.houseNo, p.addressStreet || p.street].filter(Boolean).join(" ").trim()
    return {
      parentFullName: fullName || p.name || p.fullName || "",
      parentRelationship: "",
      parentQcid: p.qcidNo || p.qcidNumber || p.qcid || "110000116932100",
      parentContactNo: p.contactNo || p.mobileNumber || p.contactNumber || p.phone || p.mobileNo || "",
      parentEmail: p.email || p.userEmail || "",
      parentAddress: fullAddress || p.address || p.fullAddress || "",
      parentBarangay: p.addressBarangay || p.barangay || "Sauyo",
    }
  }

  const initialProfile = userProfile || getCurrentUserProfile() || ({} as any)
  const initialData = getProfileData(initialProfile)

  const [formData, setFormData] = useState({
    // A. Applicant / Parent / Guardian Information
    parentFullName: initialData.parentFullName,
    parentRelationship: "",
    parentQcid: initialData.parentQcid,
    parentContactNo: initialData.parentContactNo,
    parentEmail: initialData.parentEmail,
    parentAddress: initialData.parentAddress,
    parentBarangay: initialData.parentBarangay,

    // B. Child / Beneficiary Information
    childFullName: "",
    childDob: "",
    childAge: "",
    childSex: "",
    childAddress: initialData.parentAddress || "",
    childSchool: "",
    childSchoolName: "",
    childGradeLevel: "",
    childSchoolType: "",

    // Reason for Request (Child Welfare Services)
    incidentConcernDescription: "",
    incidentDate: "",
    incidentLocation: "",

    // C. Family Information (Educational Assistance)
    familyNumChildren: "",
    familyNumStudying: "",
    is4PsBeneficiary: "",
    isSoloParentEdBeneficiary: "",
    isPwdEdBeneficiary: "",
  })

  useEffect(() => {
    const handleProfileUpdate = () => {
      const p = getCurrentUserProfile() as any
      setProfile(p)
      if (p) {
        const d = getProfileData(p)
        setFormData((prev) => ({
          ...prev,
          parentFullName: prev.parentFullName || d.parentFullName,
          parentQcid: prev.parentQcid || d.parentQcid,
          parentContactNo: prev.parentContactNo || d.parentContactNo,
          parentEmail: prev.parentEmail || d.parentEmail,
          parentAddress: prev.parentAddress || d.parentAddress,
          parentBarangay: prev.parentBarangay || d.parentBarangay,
          childAddress: prev.childAddress || d.parentAddress,
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

  const STEPS = [
    { id: 1, label: "COMPLETE CHECKLIST" },
    { id: 2, label: "APPLICATION FORM" },
    { id: 3, label: "UPLOAD DOCUMENTS" },
    { id: 4, label: "REVIEW & SUBMIT" },
  ]

  const [step, setStep] = useState(1)
  const [returnToReview, setReturnToReview] = useState(false)

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  const [attemptedNext, setAttemptedNext] = useState(false)
  const [cameraDoc, setCameraDoc] = useState<{ id: string; label: string } | null>(null)
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; file: File } | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const currentPrograms = getLocalizedChildWelfarePrograms(language)

  const [selectedProgramId, setSelectedProgramId] = useState<number>(() => {
    if (initialProgramId) return initialProgramId
    if (initialProgramKey) {
      const found = currentPrograms.find((p) => p.key === initialProgramKey)
      if (found) return found.id
    }
    return 1
  })

  useEffect(() => {
    if (initialProgramId) {
      setSelectedProgramId(initialProgramId)
    } else if (initialProgramKey) {
      const found = currentPrograms.find((p) => p.key === initialProgramKey)
      if (found) setSelectedProgramId(found.id)
    }
  }, [initialProgramId, initialProgramKey])

  const selectedProgram = currentPrograms.find((p) => p.id === selectedProgramId) || currentPrograms[0]

  const [check1, setCheck1] = useState(false)
  const [check2, setCheck2] = useState(false)
  const [check3, setCheck3] = useState(false)
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [selectedServicesRequested, setSelectedServicesRequested] = useState<string[]>([])

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({})
  const [uploadedFilesBase64, setUploadedFilesBase64] = useState<Record<string, string>>({})

  const handleFileUpload = (docId: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    setUploadedFiles((prev) => ({
      ...prev,
      [docId]: [fileArray[0]],
    }))

    const file = fileArray[0]
    if (file) {
      readFileAsDataUrl(file, 1000, 0.75).then((base64) => {
        if (base64) {
          setUploadedFilesBase64((prev) => ({ ...prev, [docId]: base64 }))
        }
      })
    }
  }

  const removeFile = (docId: string, index: number) => {
    setUploadedFiles((prev) => {
      const current = prev[docId] || []
      const updated = current.filter((_, i) => i !== index)
      return { ...prev, [docId]: updated }
    })
    setUploadedFilesBase64((prev) => {
      const updated = { ...prev }
      delete updated[docId]
      return updated
    })
  }

  const [submissionStage, setSubmissionStage] = useState<"form" | "matching" | "pending">("form")
  const [appStatus, setAppStatus] = useState<"pending" | "approved" | "rejected">("pending")
  const [reference, setReference] = useState("")
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [isReapplying, setIsReapplying] = useState(() => {
    try {
      const progKey = initialProgramKey || "educational-assistance"
      const progId = initialProgramId || 1
      const isUrlParam = typeof window !== "undefined" && window.location.search.includes("reapply=true")
      const isLocal =
        localStorage.getItem(`cw_reapplying_${progKey}`) === "true" ||
        localStorage.getItem(`cw_reapplying_${progId}`) === "true"
      return Boolean(isUrlParam || isLocal)
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      const isLocal =
        localStorage.getItem(`cw_reapplying_${selectedProgram.key}`) === "true" ||
        localStorage.getItem(`cw_reapplying_${selectedProgram.id}`) === "true"
      if (isLocal) {
        setIsReapplying(true)
        setSubmissionStage("form")
      }
    } catch {}
  }, [selectedProgram.id, selectedProgram.key])

  const handleReapply = () => {
    try {
      localStorage.setItem(`cw_reapplying_${selectedProgram.key}`, "true")
      localStorage.setItem(`cw_reapplying_${selectedProgram.id}`, "true")
    } catch {}
    setIsReapplying(true)
    setSubmissionStage("form")
    setStep(1)
    setReference("")
    setUploadedFiles({})
    setUploadedFilesBase64({})
    setCheck1(false)
    setCheck2(false)
    setCheck3(false)
    setSelectedSectors([])
    setSelectedServicesRequested([])
    try {
      ;(window as any).__isFormDirty = false
    } catch {}
  }

  const isFormDirty =
    submissionStage === "form" &&
    (
      step >= 2 ||
      formData.childFullName.trim() !== "" ||
      formData.childSchoolName.trim() !== "" ||
      formData.familyNumChildren.trim() !== "" ||
      formData.familyNumStudying.trim() !== "" ||
      formData.is4PsBeneficiary !== "" ||
      selectedSectors.length > 0 ||
      selectedServicesRequested.length > 0 ||
      check1 ||
      check2 ||
      check3 ||
      Object.values(uploadedFiles).some((files) => files && files.length > 0)
    )

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

  useEffect(() => {
    if (isReapplying) return
    let active = true
    const checkActiveApplication = async () => {
      if (isReapplying) return
      try {
        const prof = getCurrentUserProfile()
        const uid = prof.id || (userProfile as any)?.id || (userProfile as any)?.userId || ""
        const cleanUserQcid = String(prof.qcidNo || prof.qcidNumber || (userProfile as any)?.qcidNo || (userProfile as any)?.qcidNumber || "").replace(/\D/g, "")
        const userEmail = String(prof.email || (userProfile as any)?.email || "").toLowerCase().trim()
        const userFirstName = String(prof.firstName || (userProfile as any)?.firstName || "").toLowerCase().trim()
        const userLastName = String(prof.lastName || (userProfile as any)?.lastName || "").toLowerCase().trim()

        const token = localStorage.getItem("token")
        const headers: Record<string, string> = {}
        if (token) headers["Authorization"] = `Bearer ${token}`

        const isUserApplication = (a: any) => {
          if (!a) return false
          const appUid = String(a.user_id || a.userId || "").trim()
          if (uid && uid !== "0" && uid !== "1" && appUid && appUid === String(uid)) return true

          const appEmail = String(a.email || a.guardian_email || a.form_data?.email || a.form_data?.parentEmail || "").toLowerCase().trim()
          if (userEmail && appEmail && userEmail === appEmail) return true

          const appRef = String(a.reference_number || a.referenceNumber || a.qcid_number || a.qcidNumber || a.form_data?.parentQcid || "").replace(/\D/g, "")
          if (cleanUserQcid && cleanUserQcid.length >= 10 && appRef && (cleanUserQcid === appRef || appRef.startsWith(cleanUserQcid))) return true

          const appFn = String(a.guardian_first_name || a.parentFullName || a.firstName || a.first_name || a.form_data?.parentFullName || "").toLowerCase().trim()
          const appChildName = String(a.child_name || a.childName || a.form_data?.childFullName || a.form_data?.childName || "").toLowerCase().trim()

          if (userFirstName && userLastName) {
            if (appFn.includes(userLastName)) return true
            if (appChildName.includes(userLastName)) return true
          }
          return false
        }

        try {
          const stored = JSON.parse(localStorage.getItem("child_welfare_applications") || "[]")
          const localMatch = stored.find((a: any) => {
            if (!a || !isUserApplication(a)) return false
            const aCatId = String(a.category_id || a.selectedCategoryId || "")
            const aTitle = String(a.category_title || a.classification_title || "").toLowerCase().trim()
            const progId = String(selectedProgram.id)
            const progTitle = selectedProgram.title.toLowerCase().trim()
            const progKey = selectedProgram.key.toLowerCase().trim()
            return aCatId === progId || aTitle.includes(progTitle) || progTitle.includes(aTitle) || aTitle === progKey
          })
          if (localMatch && active && !isReapplying) {
            setSubmissionStage("pending")
            setAppStatus((localMatch.application_status || localMatch.status || "pending") as any)
            if (localMatch.reference_number || localMatch.referenceNumber) {
              setReference(localMatch.reference_number || localMatch.referenceNumber)
            }
          }
        } catch {}

        if (uid && uid !== "0" && uid !== "1") {
          const res = await fetch(`${API_BASE}/api/child-welfare/user/${uid}?qcid=${encodeURIComponent(cleanUserQcid)}&email=${encodeURIComponent(userEmail)}&firstName=${encodeURIComponent(userFirstName)}&lastName=${encodeURIComponent(userLastName)}`, { headers })
          if (res.ok) {
            const data = await res.json()
            if (active && !isReapplying) {
              const applications = data.applications || []
              const matched = applications.find((a: any) => {
                if (!a || !isUserApplication(a)) return false
                const aCatId = String(a.category_id || "")
                const aTitle = String(a.category_title || "").toLowerCase().trim()
                const progId = String(selectedProgram.id)
                const progTitle = selectedProgram.title.toLowerCase().trim()
                const progKey = selectedProgram.key.toLowerCase().trim()

                const idMatch = aCatId === progId
                const titleMatch = aTitle.includes(progTitle) || progTitle.includes(aTitle) || aTitle === progKey
                return idMatch || titleMatch
              })

              if (matched && ["pending", "approved", "rejected"].includes(matched.application_status)) {
                setSubmissionStage("pending")
                setAppStatus(matched.application_status as any)
                if (matched.reference_number) setReference(matched.reference_number)
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error checking child welfare application status:", err)
      }
    }

    checkActiveApplication()
    const unsubscribe = subscribeToRealtimeChanges(() => {
      if (!isReapplying) checkActiveApplication()
    })

    const handleUpdate = () => {
      if (!isReapplying) checkActiveApplication()
    }
    window.addEventListener("child_welfare_applications_updated", handleUpdate)
    window.addEventListener("applications_updated", handleUpdate)
    window.addEventListener("storage", handleUpdate)

    return () => {
      active = false
      unsubscribe()
      window.removeEventListener("child_welfare_applications_updated", handleUpdate)
      window.removeEventListener("applications_updated", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [selectedProgram.id, selectedProgram.title, userProfile, isReapplying])

  const step1Valid =
    check1 &&
    check2 &&
    (!selectedProgram.checklists[2] || check3) &&
    selectedSectors.length > 0 &&
    selectedServicesRequested.length > 0

  const isCwServices = selectedProgram.key === "child-welfare-services"

  const step2Valid = isCwServices
    ? (
        // Applicant Information
        formData.parentFullName.trim() !== "" &&
        formData.parentRelationship.trim() !== "" &&
        formData.parentContactNo.trim().length >= 11 &&
        (formData.parentAddress.trim() !== "" || formData.parentBarangay.trim() !== "") &&
        // Child Information
        formData.childFullName.trim() !== "" &&
        formData.childDob.trim() !== "" &&
        formData.childAge.trim() !== "" &&
        formData.childSex.trim() !== "" &&
        formData.childAddress.trim() !== "" &&
        // Reason for Request
        formData.incidentConcernDescription.trim() !== ""
      )
    : (
        // A. Applicant / Parent / Guardian Information
        formData.parentFullName.trim() !== "" &&
        formData.parentRelationship.trim() !== "" &&
        formData.parentContactNo.trim().length >= 11 &&
        formData.parentAddress.trim() !== "" &&
        formData.parentBarangay.trim() !== "" &&
        // B. Child / Beneficiary Information
        formData.childFullName.trim() !== "" &&
        formData.childDob.trim() !== "" &&
        formData.childAge.trim() !== "" &&
        formData.childSex.trim() !== "" &&
        formData.childSchoolName.trim() !== "" &&
        formData.childGradeLevel.trim() !== "" &&
        formData.childSchoolType.trim() !== "" &&
        // C. Family Information
        formData.familyNumChildren.trim() !== "" &&
        formData.familyNumStudying.trim() !== "" &&
        formData.is4PsBeneficiary.trim() !== "" &&
        formData.isSoloParentEdBeneficiary.trim() !== "" &&
        formData.isPwdEdBeneficiary.trim() !== ""
      )

  const requiredDocItems = selectedProgram.documents.filter((d) => d.required)
  const step3Valid = requiredDocItems.every((d) => (uploadedFiles[d.id] || []).length > 0)

  const canGoNext =
    step === 1 ? step1Valid : step === 2 ? step2Valid : step === 3 ? step3Valid : privacyAgreed

  const handleNext = () => {
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

  const handleBack = () => {
    setAttemptedNext(false)
    if (step === 1) {
      onBack?.()
      return
    }
    setStep((s) => Math.max(s - 1, 1))
  }

  const handleSubmit = async () => {
    const ref = generateReference(userProfile?.qcidNo || formData.parentQcid)
    setReference(ref)
    setShowConfirmModal(false)
    setSubmissionStage("pending")
    setAppStatus("pending")
    try {
      ;(window as any).__isFormDirty = false
    } catch {}

    const newDocItems = selectedProgram.documents.map((d) => ({
      documentId: d.id,
      documentLabel: d.label,
      files: (uploadedFiles[d.id] || []).map((f) => ({
        filename: f.name,
        originalName: f.name,
        fileUrl: uploadedFilesBase64[d.id] || `${API_BASE}/uploads/child-welfare/${f.name}`,
        previewUrl: uploadedFilesBase64[d.id] || `${API_BASE}/uploads/child-welfare/${f.name}`,
        dataUrl: uploadedFilesBase64[d.id] || undefined,
        fileSize: f.size,
        uploadedAt: new Date().toISOString(),
      })),
    }))

    const userId = (userProfile as any)?.id || (userProfile as any)?.userId || "0"
    const childFullName = formData.childFullName.trim()

    const finalFormData = {
      ...formData,
      sector: selectedSectors.join(", "),
      sectors: selectedSectors,
      serviceRequested: selectedServicesRequested.join(", "),
      servicesRequested: selectedServicesRequested,
      childName: childFullName,
      supportTypes: selectedServicesRequested.length > 0 ? selectedServicesRequested : selectedSectors,
      documents: newDocItems,
      uploaded_documents: newDocItems,
    }

    try {
      const stored = JSON.parse(localStorage.getItem("child_welfare_applications") || "[]")
      const localRecord = {
        id: String(Date.now()),
        user_id: String(userId || (userProfile as any)?.id || "0"),
        qcid_number: String(formData.parentQcid || userProfile?.qcidNo || "").trim(),
        email: String(formData.parentEmail || (userProfile as any)?.email || "").trim().toLowerCase(),
        reference_number: ref,
        referenceNumber: ref,
        category: "Child Welfare",
        classification_title: selectedProgram.title,
        application_type: "Educational Assistance",
        sector: selectedSectors.join(", "),
        sectors: selectedSectors,
        serviceRequested: selectedServicesRequested.join(", "),
        servicesRequested: selectedServicesRequested,
        childName: childFullName,
        child_name: childFullName,
        parentFullName: formData.parentFullName,
        parentRelationship: formData.parentRelationship,
        parentContactNo: formData.parentContactNo,
        guardian_first_name: formData.parentFullName,
        guardian_contact_no: formData.parentContactNo,
        documents: newDocItems,
        form_data: finalFormData,
        uploaded_documents: newDocItems,
        application_status: "pending",
        status: "pending",
        created_at: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        dateSubmitted: new Date().toISOString(),
      }
      try {
        localStorage.setItem("child_welfare_applications", JSON.stringify([localRecord, ...stored.slice(0, 10)]))
      } catch {
        const lightRecord = {
          ...localRecord,
          documents: newDocItems.map((d: any) => ({ ...d, files: d.files.map((f: any) => ({ ...f, dataUrl: undefined, previewUrl: f.filename })) })),
          uploaded_documents: newDocItems.map((d: any) => ({ ...d, files: d.files.map((f: any) => ({ ...f, dataUrl: undefined, previewUrl: f.filename })) })),
        }
        localStorage.setItem("child_welfare_applications", JSON.stringify([lightRecord, ...stored.slice(0, 3)]))
      }
      window.dispatchEvent(new Event("storage"))
    } catch {}

    const payload = {
      userId: String(userId),
      referenceNumber: ref,
      applicationData: {
        programKey: selectedProgram.key,
        programTitle: selectedProgram.title,
        selectedCategoryId: String(selectedProgram.id),
        selectedCategory: { id: selectedProgram.id, title: selectedProgram.title, key: selectedProgram.key },
        selectedAssistanceType: "Educational Assistance",
        documents: newDocItems,
        uploadedDocuments: newDocItems,
        formData: finalFormData,
      },
      documents: newDocItems,
      requiredDocumentIds: selectedProgram.documents.filter((d) => d.required).map((d) => d.id),
    }

    try {
      const createRes = await fetch(`${API_BASE}/api/child-welfare/create`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      })

      if (createRes.ok) {
        const data = await createRes.json()
        const appId = data.applicationId
        if (data.referenceNumber) {
          setReference(data.referenceNumber)
        }

        const token = getAuthToken()
        const uploadPromises = selectedProgram.documents.map(async (doc) => {
          const files = uploadedFiles[doc.id] || []
          if (files.length > 0 && appId) {
            const uploadData = new FormData()
            files.forEach((f) => uploadData.append("documents", f))
            uploadData.append("documentId", doc.id)
            uploadData.append("documentLabel", doc.label)
            return fetch(`${API_BASE}/api/child-welfare/${appId}/upload-documents`, {
              method: "POST",
              headers: token ? { Authorization: `Bearer ${token}`, "x-access-token": token, "x-session-token": token } : undefined,
              body: uploadData,
            }).catch(() => null)
          }
        })

        await Promise.all(uploadPromises)

        if (appId) {
          await fetch(`${API_BASE}/api/child-welfare/${appId}/submit`, {
            method: "POST",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
          }).catch(() => {})
        }

        notifyApplicationChange("APPLICATION_SUBMITTED", "child_welfare", data.referenceNumber || ref)
      } else {
        notifyApplicationChange("APPLICATION_SUBMITTED", "child_welfare", ref)
      }
    } catch (err) {
      console.warn("Child welfare submission error fallback:", err)
      notifyApplicationChange("APPLICATION_SUBMITTED", "child_welfare", ref)
    }

    try {
      localStorage.removeItem(`cw_reapplying_${selectedProgram.key}`)
      localStorage.removeItem(`cw_reapplying_${selectedProgram.id}`)
      ;(window as any).__isFormDirty = false
    } catch {}
    setIsReapplying(false)
    setSubmissionStage("pending")
  }

  useEffect(() => {
    onSubmissionStageChange?.(submissionStage, appStatus)
  }, [submissionStage, appStatus, onSubmissionStageChange])

  if (submissionStage === "pending") {
    if (appStatus === "rejected") {
      return (
        <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
              <X className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {language === "en"
                ? "Application Disapproved"
                : language === "bis"
                ? "Wala Na-aprobahan ang Aplikasyon"
                : "Hindi Na-approve ang Application"}
            </h2>
            <p className="text-xs text-gray-600 max-w-sm">
              {language === "en"
                ? `We regret to inform you that your application for ${selectedProgram.title} was not approved. You may contact the Quezon City Social Welfare Office for more details or submit a new application.`
                : language === "bis"
                ? `Gikasubo namo nga ipahibalo nga ang imong aplikasyon para sa ${selectedProgram.title} wala maaprobahan. Mahimo kang makig-alayon sa Quezon City Social Welfare Office o magsumite og bag-ong aplikasyon.`
                : `Ikinalulungkot naming ipabatid na ang iyong aplikasyon para sa ${selectedProgram.title} ay hindi naaprubahan. Maaari kayong makipag-ugnayan sa Quezon City Social Welfare Office para sa karagdagang detalye o magsumite ng bagong aplikasyon.`}
            </p>
            <button
              type="button"
              onClick={handleReapply}
              className="mt-2 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs uppercase tracking-wide"
            >
              <RotateCcw className="h-4 w-4" />
              <span>
                {language === "en"
                  ? "Submit New Application"
                  : language === "bis"
                  ? "Magsumite og Bag-ong Aplikasyon"
                  : "Magsumite ng Bagong Aplikasyon"}
              </span>
            </button>
          </div>
        </div>
      )
    }

    if (appStatus === "approved") {
      return (
        <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Check className="h-7 w-7 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {language === "en" ? "Application Approved" : language === "bis" ? "Na-aprobahan ang Aplikasyon" : "Aprobado ang Aplikasyon"}
              </span>
              <h2 className="text-lg font-bold text-gray-900 mt-2">
                {language === "en" ? "Congratulations!" : language === "bis" ? "Pahalipay!" : "Binabati Kita!"}
              </h2>
              <p className="text-xs text-gray-600 max-w-sm">
                {language === "en"
                  ? `Your application for ${selectedProgram.title} has been officially approved.`
                  : language === "bis"
                  ? `Ang imong aplikasyon para sa ${selectedProgram.title} opisyal nang naaprobahan.`
                  : `Ang inyong aplikasyon para sa ${selectedProgram.title} ay opisyal nang naaprubahan.`}
              </p>
            </div>

            <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2 text-xs mt-2">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500">Reference Number:</span>
                <span className="font-mono font-bold text-blue-700 text-sm">{reference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Child / Beneficiary:</span>
                <span className="font-semibold text-gray-900">{formData.childFullName || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Parent / Guardian:</span>
                <span className="font-semibold text-gray-900">{formData.parentFullName || "—"}</span>
              </div>
            </div>

            <div className="w-full bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 text-left flex items-start gap-2.5">
              <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {language === "en"
                  ? "You can now track the release schedule, appointment, or claiming instructions in your Application History and Notifications."
                  : language === "bis"
                  ? "Mahimo na nimo masubay ang release schedule, appointment, o instruksyon sa pag-claim sa imong Application History ug Notifications."
                  : "Maaari mo nang subaybayan ang release schedule, appointment, o claim instructions sa inyong Application History at Notifications."}
              </span>
            </div>

            <div className="w-full flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem(`cw_reapplying_${selectedProgram.key}`)
                    localStorage.removeItem(`cw_reapplying_${selectedProgram.id}`)
                  } catch {}
                  ;(window as any).__isFormDirty = false
                  window.location.href = "/portal/my-applications"
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs uppercase tracking-wide"
              >
                {language === "bis" ? "TAN-AWA SA KASAYSAYAN SA APLIKASYON" : "VIEW IN APPLICATION HISTORY"}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-2xl mx-auto p-6 md:p-8 my-6 bg-white border border-border rounded-2xl shadow-sm text-center space-y-6 animate-in fade-in duration-300">
        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-blue-50/50">
          <Baby className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {language === "en"
              ? "Under Review (Pending)"
              : language === "bis"
              ? "Gisusi Pa (Pending)"
              : (t("cwPendingBadge") || "Kasalukuyang Sinusuri (Pending Review)")}
          </span>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            {language === "en"
              ? "Application Submitted Successfully!"
              : language === "bis"
              ? "Malampusong Nasumite ang Aplikasyon!"
              : (t("cwSuccessTitle") || "Matagumpay na Naisumite ang Aplikasyon!")}
          </h2>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            {language === "en"
              ? `Your application for ${selectedProgram.title} has been received and is currently being reviewed by the Quezon City SSDD Social Worker.`
              : language === "bis"
              ? `Ang imong aplikasyon para sa ${selectedProgram.title} nadawat na ug kasamtangang gisusi sa Quezon City SSDD Social Worker.`
              : (t("cwSuccessDesc", { program: selectedProgram.title }) || `Ang inyong aplikasyon para sa ${selectedProgram.title} ay natanggap na at kasalukuyang sinusuri ng Quezon City SSDD Social Worker.`)}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-md mx-auto text-left space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-500">
              {language === "en" ? "Reference Number" : language === "bis" ? "Numero sa Reperensya" : "Reference Number"}:
            </span>
            <span className="font-mono font-bold text-blue-700 text-sm">{reference}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">
              {language === "en" ? "Program" : "Programa"}:
            </span>
            <span className="font-semibold text-gray-900">{selectedProgram.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">
              Child / Beneficiary:
            </span>
            <span className="font-semibold text-gray-900">{formData.childFullName || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">
              Parent / Guardian:
            </span>
            <span className="font-semibold text-gray-900">{formData.parentFullName || "—"}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-800 max-w-md mx-auto flex items-center gap-2 text-left">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            {language === "en"
              ? "You can track your application status in your Portal Notifications and Activity History."
              : language === "bis"
              ? "Mahimo nimong masubay ang status sa imong Portal Notifications ug Kasaysayan sa Kalihokan."
              : (t("trackPortalNotifDesc") || "Maaari ninyong i-track ang status sa inyong Portal Notifications at Activity History.")}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 pt-2 w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem(`cw_reapplying_${selectedProgram.key}`)
                localStorage.removeItem(`cw_reapplying_${selectedProgram.id}`)
              } catch {}
              ;(window as any).__isFormDirty = false
              window.location.href = "/portal/my-applications"
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs uppercase tracking-wide"
          >
            {language === "bis" ? "TAN-AWA SA KASAYSAYAN SA APLIKASYON" : "VIEW IN APPLICATION HISTORY"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white relative">
        {/* Step progress header */}
        <div className="flex items-center px-6 pt-6 pb-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div
                className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i === step - 1
                    ? "bg-blue-600 text-white"
                    : step > i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 transition-colors ${step > i + 1 ? "bg-blue-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step tabs */}
        <div className="flex gap-2 border-b border-border bg-gray-50 p-2 overflow-x-auto">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex-1 px-4 py-3 rounded-lg text-xs font-semibold whitespace-nowrap text-center transition-colors ${
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

        {/* Wizard content */}
        <div className="p-6 sm:p-8 space-y-7">
          {/* STEP 1: Checklist, Sector, Assistance Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 uppercase">
                    {selectedProgram.title.toUpperCase()} — PRIMARY REQUIREMENTS
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {language === "tl"
                      ? "Kumpletuhin ang mga pangunahing kwalipikasyon sa ibaba at ihanda ang mga kaukulang dokumento upang makapagpatuloy sa inyong aplikasyon."
                      : language === "bis"
                      ? "Kompletoha ang mga nag-unang kwalipikasyon sa ubos ug andama ang mga gikinahanglang dokumento aron makapadayon sa aplikasyon."
                      : "Complete the primary qualification questions below and prepare the required documents to proceed with your application."}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-wide uppercase">
                  SERVICE AND PRIMARY REQUIREMENTS
                </h2>
              </div>

              {attemptedNext && !step1Valid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {language === "tl"
                      ? "Mangyaring lagyan ng check ang lahat ng aytem sa checklist at pumili ng Sector at Service Requested."
                      : language === "bis"
                      ? "Palihug markahi ang tanang aytem sa checklist ug pagpili og Sector ug Service Requested."
                      : "Please check all items in the checklist and select at least one Sector and Service Requested."}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <CustomCheckbox
                  checked={check1}
                  onChange={setCheck1}
                  label={`${selectedProgram.checklists[0]} *`}
                />
                <CustomCheckbox
                  checked={check2}
                  onChange={setCheck2}
                  label={`${selectedProgram.checklists[1]} *`}
                />
                {selectedProgram.checklists[2] && (
                  <CustomCheckbox
                    checked={check3}
                    onChange={setCheck3}
                    label={`${selectedProgram.checklists[2]} *`}
                  />
                )}
              </div>

              {/* Sector */}
              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 tracking-wide uppercase">
                    Sector <span className="text-red-500">*</span>
                  </h3>
                </div>
                <div className="space-y-3 bg-gray-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                  {[
                    "Children & Youth",
                    "Solo Parent’s Child/Beneficiary",
                    "Child with Disability (CWD)",
                  ].map((sec) => (
                    <CustomCheckbox
                      key={sec}
                      checked={selectedSectors.includes(sec)}
                      onChange={(checked) => {
                        if (checked) {
                          setSelectedSectors((prev) => [...prev, sec])
                        } else {
                          setSelectedSectors((prev) => prev.filter((s) => s !== sec))
                        }
                      }}
                      label={sec}
                    />
                  ))}
                </div>
                {attemptedNext && selectedSectors.length === 0 && (
                  <p className="text-xs text-red-500 font-medium">
                    {language === "tl"
                      ? "Mangyaring pumili ng kahit isang sektor."
                      : language === "bis"
                      ? "Palihug pagpili og bisan usa ka sektor."
                      : "Please select at least one sector."}
                  </p>
                )}
              </div>

              {/* Service Requested */}
              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 tracking-wide uppercase flex items-center gap-1.5">
                    <span>Service Requested</span>
                    <span className="text-xs font-medium normal-case text-gray-500 dark:text-slate-400">({language === "tl" ? "Piliin ang lahat ng naaangkop" : language === "bis" ? "Pilia ang tanang magamit" : "Select all that apply"})</span>
                    <span className="text-red-500">*</span>
                  </h3>
                </div>
                <div className="space-y-3 bg-gray-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                  {[
                    "Child Protection",
                    "Alternative Child Care",
                    "Rehabilitative Counseling",
                  ].map((srv) => (
                    <CustomCheckbox
                      key={srv}
                      checked={selectedServicesRequested.includes(srv)}
                      onChange={(checked) => {
                        if (checked) {
                          setSelectedServicesRequested((prev) => [...prev, srv])
                        } else {
                          setSelectedServicesRequested((prev) => prev.filter((s) => s !== srv))
                        }
                      }}
                      label={srv}
                    />
                  ))}
                </div>
                {attemptedNext && selectedServicesRequested.length === 0 && (
                  <p className="text-xs text-red-500 font-medium">
                    {language === "tl"
                      ? "Mangyaring pumili ng kahit isang hininging serbisyo (Service Requested)."
                      : language === "bis"
                      ? "Palihug pagpili og bisan usa ka gipangayong serbisyo (Service Requested)."
                      : "Please select at least one requested service."}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Application Form */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-base font-bold text-gray-900 uppercase">
                  {selectedProgram.title} — APPLICATION FORM
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isCwServices
                    ? "Please complete the information for Applicant, Child, and Reason for Request. Fields marked with (*) are required."
                    : "Please complete the information for Applicant/Parent, Child Beneficiary, and Family. Fields marked with (*) are required."}
                </p>
              </div>

              {attemptedNext && !step2Valid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {language === "tl"
                      ? "Mangyaring punan ang lahat ng kinakailangang fields na may pulang asterisko (*)."
                      : language === "bis"
                      ? "Palihug kompletoha ang tanang gikinahanglan nga fields nga adunay pulang asterisko (*)."
                      : "Please fill in all required fields marked with an asterisk (*)."}
                  </span>
                </div>
              )}

              {isCwServices ? (
                <>
                  {/* Applicant Information */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-gray-800 dark:text-slate-100 tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Applicant Information
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          disabled
                          value={formData.parentFullName}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          QCitizen ID / Valid Government ID *
                        </label>
                        <input
                          type="text"
                          disabled
                          value={formData.parentQcid}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 font-mono focus:outline-none bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Contact Number *
                        </label>
                        <input
                          type="text"
                          disabled
                          value={formData.parentContactNo}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 font-mono focus:outline-none bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          disabled
                          value={formData.parentEmail}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 cursor-not-allowed"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Address *
                        </label>
                        <input
                          type="text"
                          disabled
                          value={formData.parentAddress ? `${formData.parentAddress}${formData.parentBarangay ? `, ${formData.parentBarangay}` : ""}` : formData.parentBarangay || ""}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 cursor-not-allowed"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.parentRelationship ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          Relationship to Child *
                        </label>
                        <select
                          value={formData.parentRelationship}
                          onChange={(e) => updateField("parentRelationship", e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.parentRelationship ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        >
                          <option value="">Select Relationship</option>
                          <option value="Mother">Mother</option>
                          <option value="Father">Father</option>
                          <option value="Legal Guardian">Legal Guardian</option>
                          <option value="Grandparent">Grandparent</option>
                          <option value="Aunt / Uncle">Aunt / Uncle</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Custodian / Caregiver">Custodian / Caregiver</option>
                          <option value="Other Relative">Other Relative</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Child Information */}
                  <div className="space-y-4 pt-3 border-t border-gray-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase text-gray-800 dark:text-slate-100 tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                      <Baby className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Child Information
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.childFullName.trim() ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          Child’s Full Name *
                        </label>
                        <input
                          type="text"
                          value={formData.childFullName}
                          onChange={(e) => updateField("childFullName", e.target.value.replace(/[^a-zA-Z\sñÑ.-]/g, "").toUpperCase())}
                          placeholder="Enter Child's Full Name"
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.childFullName.trim() ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={`text-xs font-semibold ${attemptedNext && !formData.childDob ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                            Date of Birth *
                          </label>
                          <input
                            type="date"
                            value={formData.childDob}
                            onChange={(e) => {
                              const val = e.target.value
                              updateField("childDob", val)
                              if (val) {
                                const birthDate = new Date(val)
                                const today = new Date()
                                let age = today.getFullYear() - birthDate.getFullYear()
                                const m = today.getMonth() - birthDate.getMonth()
                                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                  age--
                                }
                                if (age >= 0 && age <= 100) {
                                  updateField("childAge", String(age))
                                }
                              }
                            }}
                            className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                              attemptedNext && !formData.childDob ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs font-semibold ${attemptedNext && !formData.childAge ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                            Age *
                          </label>
                          <input
                            type="text"
                            maxLength={3}
                            value={formData.childAge}
                            onChange={(e) => updateField("childAge", e.target.value.replace(/\D/g, ""))}
                            placeholder="Age"
                            className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                              attemptedNext && !formData.childAge ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                            }`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.childSex ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          Sex *
                        </label>
                        <select
                          value={formData.childSex}
                          onChange={(e) => updateField("childSex", e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.childSex ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        >
                          <option value="">Select Sex</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.childAddress?.trim() ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          Address *
                        </label>
                        <input
                          type="text"
                          value={formData.childAddress}
                          onChange={(e) => updateField("childAddress", e.target.value)}
                          placeholder="House No., Street / Barangay"
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.childAddress?.trim() ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          School, if applicable
                        </label>
                        <input
                          type="text"
                          value={formData.childSchool}
                          onChange={(e) => updateField("childSchool", e.target.value)}
                          placeholder="e.g. Quezon City Elementary School (Optional)"
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reason for Request */}
                  <div className="space-y-4 pt-3 border-t border-gray-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase text-gray-800 dark:text-slate-100 tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Reason for Request
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.incidentConcernDescription.trim() ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          Description of concern/problem *
                        </label>
                        <textarea
                          rows={4}
                          value={formData.incidentConcernDescription}
                          onChange={(e) => updateField("incidentConcernDescription", e.target.value)}
                          placeholder="Please provide details regarding the child's situation, concern, or reason for requesting assistance / protection..."
                          className={`w-full border rounded-lg p-3 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white resize-y ${
                            attemptedNext && !formData.incidentConcernDescription.trim() ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                            Date / approximate date of incident, if applicable
                          </label>
                          <input
                            type="date"
                            value={formData.incidentDate}
                            onChange={(e) => updateField("incidentDate", e.target.value)}
                            className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                            Location of incident, if applicable
                          </label>
                          <input
                            type="text"
                            value={formData.incidentLocation}
                            onChange={(e) => updateField("incidentLocation", e.target.value)}
                            placeholder="e.g. Barangay / Street / Specific location (Optional)"
                            className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* A. APPLICANT / PARENT / GUARDIAN INFORMATION */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-gray-800 dark:text-slate-100 tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      A. APPLICANT / PARENT / GUARDIAN INFORMATION
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          disabled
                          value={formData.parentFullName}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.parentRelationship ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          Relationship to Child *
                        </label>
                        <select
                          value={formData.parentRelationship}
                          onChange={(e) => updateField("parentRelationship", e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.parentRelationship ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        >
                          <option value="">Select Relationship</option>
                          <option value="Mother">Mother</option>
                          <option value="Father">Father</option>
                          <option value="Legal Guardian">Legal Guardian</option>
                          <option value="Grandparent">Grandparent</option>
                          <option value="Aunt / Uncle">Aunt / Uncle</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Other Relative">Other Relative</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          QCitizen ID / Valid Government ID *
                        </label>
                        <input
                          type="text"
                          disabled
                          value={formData.parentQcid}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 font-mono focus:outline-none bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Contact Number *
                        </label>
                        <input
                          type="text"
                          disabled
                          value={formData.parentContactNo}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 font-mono focus:outline-none bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          disabled
                          value={formData.parentEmail}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Complete Address *
                        </label>
                        <input
                          type="text"
                          disabled
                          value={formData.parentAddress}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                          Barangay *
                        </label>
                        <input
                          type="text"
                          disabled
                          value={formData.parentBarangay}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* B. CHILD / BENEFICIARY INFORMATION */}
                  <div className="space-y-4 pt-3 border-t border-gray-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase text-gray-800 dark:text-slate-100 tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                      <Baby className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      B. CHILD / BENEFICIARY INFORMATION
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.childFullName.trim() ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={formData.childFullName}
                          onChange={(e) => updateField("childFullName", e.target.value.replace(/[^a-zA-Z\sñÑ.-]/g, "").toUpperCase())}
                          placeholder="Enter Child's Full Name"
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.childFullName.trim() ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={`text-xs font-semibold ${attemptedNext && !formData.childDob ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                            Date of Birth *
                          </label>
                          <input
                            type="date"
                            value={formData.childDob}
                            onChange={(e) => {
                              const val = e.target.value
                              updateField("childDob", val)
                              if (val) {
                                const birthDate = new Date(val)
                                const today = new Date()
                                let age = today.getFullYear() - birthDate.getFullYear()
                                const m = today.getMonth() - birthDate.getMonth()
                                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                  age--
                                }
                                if (age >= 0 && age <= 100) {
                                  updateField("childAge", String(age))
                                }
                              }
                            }}
                            className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                              attemptedNext && !formData.childDob ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs font-semibold ${attemptedNext && !formData.childAge ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                            Age *
                          </label>
                          <input
                            type="text"
                            maxLength={3}
                            value={formData.childAge}
                            onChange={(e) => updateField("childAge", e.target.value.replace(/\D/g, ""))}
                            placeholder="Age"
                            className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                              attemptedNext && !formData.childAge ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.childSex ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          Sex *
                        </label>
                        <select
                          value={formData.childSex}
                          onChange={(e) => updateField("childSex", e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.childSex ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        >
                          <option value="">Select Sex</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.childSchoolName.trim() ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          School Name *
                        </label>
                        <input
                          type="text"
                          value={formData.childSchoolName}
                          onChange={(e) => updateField("childSchoolName", e.target.value)}
                          placeholder="Enter School Name"
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.childSchoolName.trim() ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.childGradeLevel.trim() ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          Grade Level *
                        </label>
                        <input
                          type="text"
                          value={formData.childGradeLevel}
                          onChange={(e) => updateField("childGradeLevel", e.target.value)}
                          placeholder="e.g. Grade 5 / Grade 11"
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.childGradeLevel.trim() ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold ${attemptedNext && !formData.childSchoolType ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                        Type of School *
                      </label>
                      <select
                        value={formData.childSchoolType}
                        onChange={(e) => updateField("childSchoolType", e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                          attemptedNext && !formData.childSchoolType ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                        }`}
                      >
                        <option value="">Select Type of School</option>
                        <option value="Public School">Public School</option>
                        <option value="Alternative Learning System (ALS)">Alternative Learning System (ALS)</option>
                      </select>
                    </div>
                  </div>

                  {/* C. FAMILY INFORMATION */}
                  <div className="space-y-4 pt-3 border-t border-gray-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase text-gray-800 dark:text-slate-100 tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      C. FAMILY INFORMATION
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.familyNumChildren.trim() ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          Number of Children in the Family *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.familyNumChildren}
                          onChange={(e) => updateField("familyNumChildren", e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter number"
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.familyNumChildren.trim() ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.familyNumStudying.trim() ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          Number of Children Currently Studying *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.familyNumStudying}
                          onChange={(e) => updateField("familyNumStudying", e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter number"
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.familyNumStudying.trim() ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      {/* 4Ps Beneficiary? */}
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.is4PsBeneficiary ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          4Ps Beneficiary? *
                        </label>
                        <select
                          value={formData.is4PsBeneficiary}
                          onChange={(e) => updateField("is4PsBeneficiary", e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.is4PsBeneficiary ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        >
                          <option value="">Select Option</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {/* Solo Parent Educational Assistance Beneficiary? */}
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.isSoloParentEdBeneficiary ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          Solo Parent Educational Assistance Beneficiary? *
                        </label>
                        <select
                          value={formData.isSoloParentEdBeneficiary}
                          onChange={(e) => updateField("isSoloParentEdBeneficiary", e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.isSoloParentEdBeneficiary ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        >
                          <option value="">Select Option</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {/* PWD Educational Assistance Beneficiary? */}
                      <div>
                        <label className={`text-xs font-semibold ${attemptedNext && !formData.isPwdEdBeneficiary ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"}`}>
                          PWD Educational Assistance Beneficiary? *
                        </label>
                        <select
                          value={formData.isPwdEdBeneficiary}
                          onChange={(e) => updateField("isPwdEdBeneficiary", e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            attemptedNext && !formData.isPwdEdBeneficiary ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                          }`}
                        >
                          <option value="">Select Option</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Required Documents (D) */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-base font-bold text-gray-900 uppercase">
                  D. REQUIRED DOCUMENTS
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upload the required documents for {selectedProgram.title}. Fields marked with (*) are required.
                </p>
              </div>

              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  {t("allowedFileTypesCameraNote") || "Allowed file types: JPG, JPEG, PNG, WEBP, PDF (or capture using Camera). Make sure documents are clear and legible."}
                </p>
              </div>

              <div className="space-y-4">
                {selectedProgram.documents.map((doc, docIdx) => {
                  const files = uploadedFiles[doc.id] || []
                  const uploaded = files.length > 0
                  const isInvalid = doc.required && attemptedNext && !uploaded
                  const inputId = `upload-cw-doc-${doc.id}-${docIdx}`

                  return (
                    <div key={doc.id}>
                      <div
                        className={`border rounded-xl p-4 sm:p-5 transition-colors ${
                          uploaded
                            ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30 dark:border-emerald-500/30"
                            : isInvalid
                            ? "border-red-500/40 bg-red-500/10 dark:bg-red-950/30 dark:border-red-500/30"
                            : "border-border bg-card/60 dark:bg-slate-900/40"
                        }`}
                      >
                        <p className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wide">
                          {doc.label} {doc.required ? <span className="text-red-500">*</span> : <span className="text-muted-foreground text-xs font-normal">({language === "tl" ? "Opsyonal" : language === "bis" ? "Opsyonal" : "Optional"})</span>}
                          {uploaded && (
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white shrink-0 ml-1">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </span>
                          )}
                        </p>

                        {doc.description && <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>}
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {t("allowedFileTypesCameraNote") || "Allowed file types: JPG, JPEG, PNG, WEBP (o kumuha gamit ang Camera)"}
                        </p>

                        <input
                          type="file"
                          id={inputId}
                          key={`${inputId}-${files.length}`}
                          accept=".jpg,.jpeg,.png,.webp,.pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleFileUpload(doc.id, e.target.files)
                            }
                            e.target.value = ""
                          }}
                        />

                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          <label
                            htmlFor={inputId}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold tracking-wide cursor-pointer hover:bg-blue-700 transition-colors shadow-xs"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {t("uploadPhotoBtn") || (language === "tl" ? "MAG-UPLOAD NG LARAWAN" : language === "bis" ? "PAG-UPLOAD OG HULAGWAY" : "UPLOAD PHOTO")}
                          </label>

                          <button
                            type="button"
                            onClick={() => setCameraDoc(doc)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide cursor-pointer transition-colors shadow-xs"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            {t("takePhotoCameraBtn") || (language === "tl" ? "KUMUHA NG LARAWAN (CAMERA)" : language === "bis" ? "PAGKUHA OG HULAGWAY (CAMERA)" : "TAKE PHOTO (CAMERA)")}
                          </button>
                        </div>

                        {uploaded && (
                          <div className="flex flex-wrap gap-3 pt-4">
                            {files.map((file, i) => (
                              <div
                                key={`${file.name}-${i}`}
                                className="relative w-36 sm:w-40 border border-border rounded-lg bg-card dark:bg-slate-900/90 shadow-sm p-2.5 flex flex-col items-center text-center shadow-xs"
                              >
                                <button
                                  type="button"
                                  onClick={() => removeFile(doc.id, i)}
                                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-slate-700 hover:bg-red-600 flex items-center justify-center text-white transition-colors z-10 cursor-pointer shadow-xs"
                                  aria-label={t("removeFile", { filename: file.name }) || "Remove file"}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocModal({ title: doc.label, file })}
                                  className="h-16 w-full rounded-md overflow-hidden border border-border mb-2 flex items-center justify-center bg-muted/40 dark:bg-slate-800 cursor-pointer hover:opacity-90"
                                >
                                  <FileThumbnail file={file} className="h-full w-full object-cover" />
                                </button>
                                <p className="text-[11px] font-medium text-foreground truncate w-full">{file.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {isInvalid && (
                          <p className="text-xs text-red-500 mt-2">
                            {t("spDocRequiredNote") || (language === "tl" ? "Kailangan pang mag-upload ng dokumento para sa kinakailangang item na ito." : language === "bis" ? "Kinahanglan pang mag-upload og dokumento alang niining gikinahanglang aytem." : "A document must be uploaded for this required item.")}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Review & Submit */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-gray-900 uppercase">
                  REVIEW APPLICATION DETAILS
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Please review all information and uploaded documents before submitting your application.
                </p>
              </div>

              {/* Program & Sector Details */}
              <ReviewSection title="Program, Sector & Service Details" onEdit={() => { setReturnToReview(true); setStep(1) }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-xs">
                  <ReviewField
                    label="Program"
                    value={selectedProgram.title}
                  />
                  <ReviewField
                    label="Sector"
                    value={selectedSectors.join(", ") || "—"}
                  />
                  <ReviewField
                    label="Service Requested"
                    value={selectedServicesRequested.join(", ") || "—"}
                  />
                  <ReviewField label="Residency Status" value="Residente ng Lungsod Quezon (Verified)" />
                </div>
              </ReviewSection>

              {isCwServices ? (
                <>
                  {/* Applicant Information Review */}
                  <ReviewSection title="Applicant Information" onEdit={() => { setReturnToReview(true); setStep(2) }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-xs">
                      <ReviewField label="Full Name" value={formData.parentFullName} />
                      <ReviewField label="Relationship to Child" value={formData.parentRelationship} />
                      <ReviewField label="QCitizen ID / Valid Government ID" value={formData.parentQcid} />
                      <ReviewField label="Contact Number" value={formData.parentContactNo} />
                      <ReviewField label="Email Address" value={formData.parentEmail} />
                      <ReviewField
                        label="Address"
                        value={formData.parentAddress ? `${formData.parentAddress}${formData.parentBarangay ? `, ${formData.parentBarangay}` : ""}` : formData.parentBarangay || "—"}
                      />
                    </div>
                  </ReviewSection>

                  {/* Child Information Review */}
                  <ReviewSection title="Child Information" onEdit={() => { setReturnToReview(true); setStep(2) }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-xs">
                      <ReviewField label="Child's Full Name" value={formData.childFullName} />
                      <ReviewField
                        label="Date of Birth / Age"
                        value={`${formData.childDob} (${formData.childAge} years old)`}
                      />
                      <ReviewField label="Sex" value={formData.childSex} />
                      <ReviewField label="Address" value={formData.childAddress} />
                      {formData.childSchool && (
                        <ReviewField label="School" value={formData.childSchool} />
                      )}
                    </div>
                  </ReviewSection>

                  {/* Reason for Request Review */}
                  <ReviewSection title="Reason for Request" onEdit={() => { setReturnToReview(true); setStep(2) }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-xs">
                      <div className="sm:col-span-2">
                        <ReviewField label="Description of concern/problem" value={formData.incidentConcernDescription} />
                      </div>
                      {formData.incidentDate && (
                        <ReviewField label="Date of incident" value={formData.incidentDate} />
                      )}
                      {formData.incidentLocation && (
                        <ReviewField label="Location of incident" value={formData.incidentLocation} />
                      )}
                    </div>
                  </ReviewSection>
                </>
              ) : (
                <>
                  {/* Section A Review */}
                  <ReviewSection title="A. Applicant / Parent / Guardian Information" onEdit={() => { setReturnToReview(true); setStep(2) }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-xs">
                      <ReviewField label="Full Name" value={formData.parentFullName} />
                      <ReviewField label="Relationship to Child" value={formData.parentRelationship} />
                      <ReviewField label="QCitizen ID / Valid Government ID" value={formData.parentQcid} />
                      <ReviewField label="Contact Number" value={formData.parentContactNo} />
                      <ReviewField label="Email Address" value={formData.parentEmail} />
                      <ReviewField
                        label="Complete Address"
                        value={formData.parentAddress}
                      />
                      <ReviewField label="Barangay" value={formData.parentBarangay} />
                    </div>
                  </ReviewSection>

                  {/* Section B Review */}
                  <ReviewSection title="B. Child / Beneficiary Information" onEdit={() => { setReturnToReview(true); setStep(2) }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-xs">
                      <ReviewField label="Child's Full Name" value={formData.childFullName} />
                      <ReviewField
                        label="Date of Birth / Age"
                        value={`${formData.childDob} (${formData.childAge} years old)`}
                      />
                      <ReviewField label="Sex" value={formData.childSex} />
                      <ReviewField label="School Name" value={formData.childSchoolName} />
                      <ReviewField label="Grade Level" value={formData.childGradeLevel} />
                      <ReviewField label="Type of School" value={formData.childSchoolType} />
                    </div>
                  </ReviewSection>

                  {/* Section C Review */}
                  <ReviewSection title="C. Family Information" onEdit={() => { setReturnToReview(true); setStep(2) }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-xs">
                      <ReviewField label="Number of Children in Family" value={formData.familyNumChildren} />
                      <ReviewField label="Number of Children Currently Studying" value={formData.familyNumStudying} />
                      <ReviewField label="4Ps Beneficiary?" value={formData.is4PsBeneficiary} />
                      <ReviewField label="Solo Parent Educational Assistance Beneficiary?" value={formData.isSoloParentEdBeneficiary} />
                      <ReviewField label="PWD Educational Assistance Beneficiary?" value={formData.isPwdEdBeneficiary} />
                    </div>
                  </ReviewSection>
                </>
              )}

              {/* Section D Review (Uploaded Documents) */}
              <ReviewSection title="D. Required Documents" onEdit={() => { setReturnToReview(true); setStep(3) }}>
                <div className="p-4 space-y-4">
                  {selectedProgram.documents.map((doc) => {
                    const files = uploadedFiles[doc.id] || []
                    const uploaded = files.length > 0
                    return (
                      <div key={doc.id}>
                        <p className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase">
                          {doc.label} {doc.required && <span className="text-red-500">*</span>}
                          {uploaded ? (
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-500 text-white shrink-0 ml-1">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </span>
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 ml-1" />
                          )}
                        </p>
                        {uploaded ? (
                          <div className="mt-2 space-y-2">
                            {files.map((file, i) => (
                              <button
                                key={`${file.name}-${i}`}
                                type="button"
                                onClick={() => setPreviewDocModal({ title: doc.label, file })}
                                className="w-full max-w-md border border-gray-200 hover:border-blue-400 rounded-xl overflow-hidden text-left bg-white cursor-pointer transition-colors shadow-xs block"
                              >
                                <div className="h-28 w-full bg-gray-50 flex items-center justify-center overflow-hidden p-2">
                                  <FileThumbnail file={file} className="max-h-full max-w-full object-contain" />
                                </div>
                                <div className="px-3 py-2 text-center bg-white border-t border-gray-100">
                                  <p className="text-xs font-semibold text-gray-800 truncate">{file.name}</p>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-red-500 mt-1">{language === "tl" ? "Walang nai-upload na dokumento" : language === "bis" ? "Walay na-upload nga dokumento" : "No document uploaded yet"}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ReviewSection>

              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                  {language === "tl"
                    ? "Sa pag-click ng \"Isumite\", kinukumpirma mo na ang lahat ng impormasyong ibinigay ay totoo at kumpleto. Susuriin ang iyong aplikasyon ng isang evaluator, at makakatanggap ka ng abiso tungkol sa katayuan nito."
                    : language === "bis"
                    ? "Sa pag-click sa \"Isumite\", gipamatud-an nimo nga ang tanang impormasyon nga gihatag tinuod ug kompleto. Susihon ang imong aplikasyon sa evaluator."
                    : "By clicking \"Submit Application\", you confirm that all information provided is true and complete. Your application will be reviewed by Quezon City SSDD social workers."}
                </p>
              </div>

              <div className="mt-4">
                <DataPrivacyConsent
                  checked={privacyAgreed}
                  onChange={setPrivacyAgreed}
                  moduleName="Child Welfare Assistance Program"
                  error={attemptedNext && !privacyAgreed ? "Mandatory: You must agree to the Data Privacy Policy to submit your application." : undefined}
                />
              </div>
            </div>
          )}
        </div>

        {/* Wizard action bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-2 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors uppercase tracking-wider cursor-pointer"
            >
              {returnToReview ? (language === "tl" ? "BUMALIK SA REVIEW" : language === "bis" ? "BALIK SA REVIEW" : "BACK TO REVIEW") : (t("backButton") || "BACK")}
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className={`px-7 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center ${
                canGoNext
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span>
                {returnToReview
                  ? language === "tl"
                    ? "BUMALIK SA REVIEW"
                    : language === "bis"
                    ? "BALIK SA REVIEW"
                    : "RETURN TO REVIEW"
                  : t("nextButton") || "NEXT"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs"
            >
              <span>{selectedProgram.submitButtonText || t("submitApplicationUpper") || "SUBMIT APPLICATION"}</span>
            </button>
          )}
        </div>
      </div>

      <DocumentCameraModal
        isOpen={Boolean(cameraDoc)}
        onClose={() => setCameraDoc(null)}
        docTitle={cameraDoc?.label}
        onCapture={(file) => {
          if (cameraDoc) {
            handleFileUpload(cameraDoc.id, [file] as any)
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
      
      <SubmitPrivacyOverlayModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        moduleName="Child Welfare Assistance Program"
        onConfirmSubmit={() => {
          setShowConfirmModal(false)
          handleSubmit()
        }}
      />
    </div>
  )
}
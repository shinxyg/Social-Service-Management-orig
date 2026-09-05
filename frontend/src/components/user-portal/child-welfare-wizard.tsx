import { useState, useEffect } from "react"
import {
  Check,
  ChevronRight,
  FileText,
  Upload,
  X,
  Pencil,
  Info,
  Loader2,
  HeartHandshake,
  ShieldAlert,
  Home,
  Users,
  Baby,
  Activity,
  AlertCircle,
  User,
} from "lucide-react"
import { useLanguage } from "../ui/language-context"
import { getCurrentUserProfile } from "../../utils/userProfile"

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
    key: "nutritional-assistance",
    title: "Nutritional Assistance",
    desc: "Nagbibigay ng suporta sa mga batang nangangailangan ng masustansyang pagkain, supplementary feeding, gatas o infant nutrition, nutritional supplements, at gabay tungkol sa wastong nutrisyon upang makatulong sa kanilang kalusugan at nutritional status.",
    checklists: [
      "Are you a legitimate resident of Quezon City?",
      "Are you applying for nutritional assistance for a child?",
      "Is the child currently in need of nutritional support?",
    ],
    receivedQuestion: "Have you already received nutritional assistance from another Quezon City office? *",
    receivedOptions: ["Yes, I already received nutritional assistance", "Not yet"],
    assistanceTypeLabel: "Choose the type of assistance *",
    assistanceTypes: [
      "Food Pack / Nutritious Food",
      "Supplementary Feeding",
      "Milk / Infant Nutrition",
      "Nutritional Supplements",
      "Nutrition Education / Counseling",
    ],
    whatIsIt: "Ang Nutritional Assistance Program ay nagbibigay ng suporta sa mga batang nangangailangan ng masustansyang pagkain, supplementary feeding, gatas o infant nutrition, nutritional supplements, at gabay tungkol sa wastong nutrisyon upang makatulong sa kanilang kalusugan at nutritional status.",
    whoIsEligible: [
      "Mga batang residente ng Quezon City na nangangailangan ng nutritional assistance.",
      "Mga batang may nutritional needs o nasa panganib ng malnutrition.",
      "Ang aplikasyon ay maaaring isumite ng magulang o legal na guardian ng bata.",
    ],
    childRequirements: [
      "PSA Birth Certificate ng Bata",
      "Medical / Nutrition Assessment, kung mayroon o kinakailangan",
      "Barangay Certificate / Referral, kung applicable",
    ],
    parentRequirements: [
      "QCID o Valid ID",
      "Proof of Residency",
      "Contact Information",
    ],
    specialRequirements: [
      "Medical/Nutritionist recommendation",
      "Feeding assessment",
      "Iba pang supporting documents depende sa napiling assistance",
    ],
    documents: [
      { id: "psaBirthCert", label: "PSA Birth Certificate of the Child", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
      { id: "parentId", label: "Valid ID of Parent/Guardian", required: true, sampleImage: "/samples/sample_valid_id.png" },
      { id: "proofResidency", label: "Proof of Residency", required: true, sampleImage: "/samples/PROOF OF RESIDENCE.webp" },
      { id: "barangayCert", label: "Barangay Certificate / Referral", required: false, sampleImage: "/samples/BARANGAY CERTIFICATE.webp" },
      { id: "medicalAssessment", label: "Medical or Nutrition Assessment", required: false },
      { id: "otherDocs", label: "Other Supporting Documents", required: false },
    ],
    submitButtonText: "SUBMIT APPLICATION",
  },
  {
    id: 2,
    key: "child-protection",
    title: "Child Protection Assistance",
    desc: "Nagbibigay ng proteksyon, intervention, referral, at iba pang kinakailangang suporta para sa mga batang nakakaranas o nasa panganib ng abuse, neglect, exploitation, violence, o iba pang child protection concerns.",
    checklists: [
      "Are you a legitimate resident of Quezon City?",
      "Are you applying for child protection assistance for a child?",
      "Is the child currently experiencing a protection or safety concern?",
    ],
    receivedQuestion: "Have you already received child protection assistance from another Quezon City office? *",
    receivedOptions: ["Yes, I already received assistance", "Not yet"],
    assistanceTypeLabel: "Choose the type of assistance *",
    assistanceTypes: [
      "Child Protection / Safety Assistance",
      "Emergency Child Assistance",
      "Temporary Shelter / Protective Custody Referral",
      "Legal / Case Referral Assistance",
      "Psychosocial Support / Counseling Referral",
    ],
    whatIsIt: "Ang Child Protection Assistance Program ay nagbibigay ng proteksyon, intervention, referral, at iba pang kinakailangang suporta para sa mga batang nakakaranas o nasa panganib ng abuse, neglect, exploitation, violence, o iba pang child protection concerns.",
    whoIsEligible: [
      "Mga batang residente ng Quezon City na nangangailangan ng child protection services.",
      "Mga batang nakakaranas o nasa panganib ng abuse, neglect, exploitation, violence, o iba pang safety concerns.",
      "Maaaring magsumite ng aplikasyon o referral ang magulang, legal guardian, kamag-anak, o authorized reporting person, depende sa sitwasyon.",
    ],
    childRequirements: [
      "PSA Birth Certificate ng Bata",
      "Proof of Residency",
      "Medical Certificate / Medico-Legal Report, kung applicable",
      "Social Case Study Report, kung available o kinakailangan",
    ],
    parentRequirements: [
      "QCID o Valid ID",
      "Contact Information",
      "Barangay Certificate / Referral, kung applicable",
    ],
    specialRequirements: [
      "Police Blotter / Incident Report, kung applicable",
      "Court Documents, kung applicable",
      "Iba pang supporting documents, kung kinakailangan",
    ],
    hasProtectionConcern: true,
    documents: [
      { id: "psaBirthCert", label: "PSA Birth Certificate ng Bata", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
      { id: "parentId", label: "Valid ID ng Parent/Guardian/Reporting Person", required: true, sampleImage: "/samples/sample_valid_id.png" },
      { id: "proofResidency", label: "Proof of Residency", required: true, sampleImage: "/samples/PROOF OF RESIDENCE.webp" },
      { id: "barangayCert", label: "Barangay Certificate / Referral", required: false, sampleImage: "/samples/BARANGAY CERTIFICATE.webp" },
      { id: "caseStudy", label: "Social Case Study Report", required: false },
      { id: "medicoLegal", label: "Medical Certificate / Medico-Legal Report", required: false },
      { id: "policeBlotter", label: "Police Blotter / Incident Report", required: false },
      { id: "courtDocs", label: "Court Documents", required: false },
      { id: "otherDocs", label: "Other Supporting Documents", required: false },
    ],
    submitButtonText: "SUBMIT APPLICATION",
  },
  {
    id: 3,
    key: "emergency-assistance",
    title: "Emergency Assistance",
    desc: "Nagbibigay ng agarang tulong at intervention sa mga batang nakakaranas ng emergency o agarang pangangailangan, kabilang ang medical, food, transportation, shelter, at protection concerns.",
    checklists: [
      "Are you a legitimate resident of Quezon City?",
      "Are you requesting emergency assistance for a child?",
      "Is the child currently experiencing an emergency or immediate need?",
    ],
    receivedQuestion: "Is the child currently in immediate danger or in need of urgent assistance? *",
    receivedOptions: ["Yes", "No"],
    assistanceTypeLabel: "Choose the type of assistance *",
    assistanceTypes: [
      "Emergency Food Assistance",
      "Emergency Medical Assistance",
      "Emergency Transportation Assistance",
      "Emergency Shelter Assistance",
      "Emergency Protection / Intervention",
    ],
    whatIsIt: "Ang Emergency Assistance Program ay nagbibigay ng agarang tulong at intervention sa mga batang nakakaranas ng emergency o agarang pangangailangan, kabilang ang medical, food, transportation, shelter, at protection concerns.",
    whoIsEligible: [
      "Mga batang residente ng Quezon City na nangangailangan ng agarang assistance.",
      "Mga batang nakakaranas ng emergency o sitwasyong maaaring makaapekto sa kanilang kaligtasan, kalusugan, o pangunahing pangangailangan.",
      "Maaaring magsumite ng request ang magulang, legal guardian, kamag-anak, o authorized person, depende sa sitwasyon.",
    ],
    childRequirements: [
      "PSA Birth Certificate ng Bata",
      "Proof of Residency",
      "Medical Certificate / Medical Record, kung medical emergency",
      "Incident Report, kung applicable",
    ],
    parentRequirements: [
      "QCID o Valid ID",
      "Contact Information",
      "Barangay Certificate / Referral, kung available",
    ],
    specialRequirements: [
      "Police Blotter / Incident Report",
      "Medical Documents",
      "Other Supporting Documents",
    ],
    hasEmergencyInfo: true,
    documents: [
      { id: "psaBirthCert", label: "PSA Birth Certificate ng Bata", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
      { id: "parentId", label: "Valid ID ng Parent/Guardian", required: true, sampleImage: "/samples/sample_valid_id.png" },
      { id: "proofResidency", label: "Proof of Residency", required: true, sampleImage: "/samples/PROOF OF RESIDENCE.webp" },
      { id: "barangayCert", label: "Barangay Certificate / Referral", required: false, sampleImage: "/samples/BARANGAY CERTIFICATE.webp" },
      { id: "medicalRecord", label: "Medical Certificate / Medical Record", required: false },
      { id: "policeBlotter", label: "Police Blotter / Incident Report", required: false },
      { id: "otherDocs", label: "Other Supporting Documents", required: false },
    ],
    submitButtonText: "SUBMIT EMERGENCY REQUEST",
  },
]

export function getLocalizedChildWelfarePrograms(language: string): ChildWelfareProgram[] {
  if (language === "tl" || language === "bis") {
    return [
      {
        id: 1,
        key: "nutritional-assistance",
        title: language === "bis" ? "Tabang sa Nutrisyon" : "Tulong sa Nutrisyon",
        desc: language === "bis"
          ? "Naghatag og tabang sa mga bata nga nagkinahanglan og masustansyang pagkaon, supplementary feeding, gatas o infant nutrition, nutritional supplements, ug giya sa nutrisyon."
          : "Nagbibigay ng suporta sa mga batang nangangailangan ng masustansyang pagkain, supplementary feeding, gatas o infant nutrition, nutritional supplements, at gabay tungkol sa wastong nutrisyon upang makatulong sa kanilang kalusugan at nutritional status.",
        checklists: [
          language === "bis" ? "Ikaw ba usa ka lehitimong residente sa Quezon City?" : "Ikaw ba ay lehitimong residente ng Quezon City?",
          language === "bis" ? "Nag-apply ba ka og tabang sa nutrisyon para sa bata?" : "Nag-a-apply ka ba para sa tulong sa nutrisyon para sa bata?",
          language === "bis" ? "Kasamtangan ba nga nagkinahanglan og tabang sa nutrisyon ang bata?" : "Kasalukuyan bang nangangailangan ng suporta sa nutrisyon ang bata?",
        ],
        receivedQuestion: language === "bis" ? "Nakadawat na ba ka og tabang sa nutrisyon gikan sa laing opisina sa Quezon City? *" : "Nakatanggap ka na ba ng tulong sa nutrisyon mula sa ibang opisina ng Quezon City? *",
        receivedOptions: [
          language === "bis" ? "Oo, nakadawat na ko og tabang sa nutrisyon" : "Oo, nakatanggap na ako ng tulong sa nutrisyon",
          language === "bis" ? "Wala pa" : "Hindi pa"
        ],
        assistanceTypeLabel: language === "bis" ? "Pilia ang matang sa tabang *" : "Piliin ang uri ng tulong *",
        assistanceTypes: [
          language === "bis" ? "Food Pack / Masustansyang Pagkaon" : "Food Pack / Masustansyang Pagkain",
          "Supplementary Feeding",
          language === "bis" ? "Gatas / Infant Nutrition" : "Gatas / Infant Nutrition",
          "Nutritional Supplements",
          language === "bis" ? "Edukasyon sa Nutrisyon / Counseling" : "Edukasyon sa Nutrisyon / Counseling",
        ],
        whatIsIt: "Ang Nutritional Assistance Program ay nagbibigay ng suporta sa mga batang nangangailangan ng masustansyang pagkain, supplementary feeding, gatas o infant nutrition, nutritional supplements, at gabay tungkol sa wastong nutrisyon upang makatulong sa kanilang kalusugan at nutritional status.",
        whoIsEligible: [
          "Mga batang residente ng Quezon City na nangangailangan ng nutritional assistance.",
          "Mga batang may nutritional needs o nasa panganib ng malnutrition.",
          "Ang aplikasyon ay maaaring isumite ng magulang o legal na guardian ng bata.",
        ],
        childRequirements: [
          "PSA Birth Certificate ng Bata",
          "Medical / Nutrition Assessment, kung mayroon o kinakailangan",
          "Barangay Certificate / Referral, kung applicable",
        ],
        parentRequirements: [
          "QCID o Valid ID",
          "Proof of Residency",
          "Contact Information",
        ],
        specialRequirements: [
          "Medical/Nutritionist recommendation",
          "Feeding assessment",
          "Iba pang supporting documents depende sa napiling assistance",
        ],
        documents: [
          { id: "psaBirthCert", label: language === "bis" ? "PSA Birth Certificate sa Bata" : "PSA Birth Certificate ng Bata", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
          { id: "parentId", label: language === "bis" ? "Balido nga ID sa Ginikanan / Guardian" : "Valid ID ng Magulang / Guardian", required: true, sampleImage: "/samples/sample_valid_id.png" },
          { id: "proofResidency", label: language === "bis" ? "Katibayan sa Pagpuyo (Proof of Residency)" : "Katibayan ng Paninirahan (Proof of Residency)", required: true, sampleImage: "/samples/PROOF OF RESIDENCE.webp" },
          { id: "barangayCert", label: "Barangay Certificate / Referral", required: false, sampleImage: "/samples/BARANGAY CERTIFICATE.webp" },
          { id: "medicalAssessment", label: "Medical / Nutrition Assessment", required: false },
          { id: "otherDocs", label: language === "bis" ? "Uban pang Gikinahanglang Dokumento" : "Iba pang Karagdagang Dokumento", required: false },
        ],
        submitButtonText: language === "bis" ? "ISUMITE ANG APLIKASYON" : "ISUMITE ANG APLIKASYON",
      },
      {
        id: 2,
        key: "child-protection",
        title: language === "bis" ? "Tabang sa Proteksyon sa Bata" : "Tulong sa Proteksyon ng Bata",
        desc: language === "bis"
          ? "Naghatag og proteksyon, intervention, referral, ug suporta para sa mga bata nga nag-atubang o anaa sa peligro sa pang-abuso o kapabayaan."
          : "Nagbibigay ng proteksyon, intervention, referral, at iba pang kinakailangang suporta para sa mga batang nakakaranas o nasa panganib ng abuse, neglect, exploitation, violence, o iba pang child protection concerns.",
        checklists: [
          language === "bis" ? "Ikaw ba usa ka lehitimong residente sa Quezon City?" : "Ikaw ba ay lehitimong residente ng Quezon City?",
          language === "bis" ? "Nag-apply ba ka para sa proteksyon sa bata?" : "Nag-a-apply ka ba para sa proteksyon ng bata?",
          language === "bis" ? "Kasamtangan ba nga dunay kabalaka sa kaluwasan o proteksyon ang bata?" : "Kasalukuyan bang may banta sa kaligtasan o proteksyon ang bata?",
        ],
        receivedQuestion: language === "bis" ? "Nakadawat na ba ka og tabang sa proteksyon gikan sa laing opisina sa Quezon City? *" : "Nakatanggap ka na ba ng tulong sa proteksyon mula sa ibang opisina ng Quezon City? *",
        receivedOptions: [
          language === "bis" ? "Oo, nakadawat na ko og tabang" : "Oo, nakatanggap na ako ng tulong",
          language === "bis" ? "Wala pa" : "Hindi pa"
        ],
        assistanceTypeLabel: language === "bis" ? "Pilia ang matang sa tabang *" : "Piliin ang uri ng tulong *",
        assistanceTypes: [
          language === "bis" ? "Tabang sa Proteksyon / Kaluwasan sa Bata" : "Tulong sa Proteksyon / Kaligtasan ng Bata",
          language === "bis" ? "Pang-emerhensya nga Tabang sa Bata" : "Pang-emerhensiyang Tulong sa Bata",
          "Temporary Shelter / Protective Custody Referral",
          language === "bis" ? "Tabang Legal / Case Referral" : "Tulong Legal / Case Referral",
          "Psychosocial Support / Counseling Referral",
        ],
        whatIsIt: "Ang Child Protection Assistance Program ay nagbibigay ng proteksyon, intervention, referral, at iba pang kinakailangang suporta para sa mga batang nakakaranas o nasa panganib ng abuse, neglect, exploitation, violence, o iba pang child protection concerns.",
        whoIsEligible: [
          "Mga batang residente ng Quezon City na nangangailangan ng child protection services.",
          "Mga batang nakakaranas o nasa panganib ng abuse, neglect, exploitation, violence, o iba pang safety concerns.",
          "Maaaring magsumite ng aplikasyon o referral ang magulang, legal guardian, kamag-anak, o authorized reporting person, depende sa sitwasyon.",
        ],
        childRequirements: [
          "PSA Birth Certificate ng Bata",
          "Proof of Residency",
          "Medical Certificate / Medico-Legal Report, kung applicable",
          "Social Case Study Report, kung available o kinakailangan",
        ],
        parentRequirements: [
          "QCID o Valid ID",
          "Contact Information",
          "Barangay Certificate / Referral, kung applicable",
        ],
        specialRequirements: [
          "Police Blotter / Incident Report, kung applicable",
          "Court Documents, kung applicable",
          "Iba pang supporting documents, kung kinakailangan",
        ],
        hasProtectionConcern: true,
        documents: [
          { id: "psaBirthCert", label: language === "bis" ? "PSA Birth Certificate sa Bata" : "PSA Birth Certificate ng Bata", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
          { id: "parentId", label: language === "bis" ? "Balido nga ID sa Ginikanan / Nag-report" : "Valid ID ng Magulang / Guardian / Nag-uulat", required: true, sampleImage: "/samples/sample_valid_id.png" },
          { id: "proofResidency", label: language === "bis" ? "Katibayan sa Pagpuyo (Proof of Residency)" : "Katibayan ng Paninirahan (Proof of Residency)", required: true, sampleImage: "/samples/PROOF OF RESIDENCE.webp" },
          { id: "barangayCert", label: "Barangay Certificate / Referral", required: false, sampleImage: "/samples/BARANGAY CERTIFICATE.webp" },
          { id: "caseStudy", label: "Social Case Study Report", required: false },
          { id: "medicoLegal", label: "Medical Certificate / Medico-Legal Report", required: false },
          { id: "policeBlotter", label: "Police Blotter / Incident Report", required: false },
          { id: "courtDocs", label: language === "bis" ? "Dokumento gikan sa Korte" : "Dokumento mula sa Korte", required: false },
          { id: "otherDocs", label: language === "bis" ? "Uban pang Gikinahanglang Dokumento" : "Iba pang Karagdagang Dokumento", required: false },
        ],
        submitButtonText: "ISUMITE ANG APLIKASYON",
      },
      {
        id: 3,
        key: "emergency-assistance",
        title: language === "bis" ? "Pang-emerhensya nga Tabang" : "Pang-emerhensiyang Tulong",
        desc: language === "bis"
          ? "Naghatag og dinalian nga tabang ug intervention sa mga bata nga nag-atubang og emerhensya o dinaliang panginahanglan."
          : "Nagbibigay ng agarang tulong at intervention sa mga batang nakakaranas ng emergency o agarang pangangailangan, kabilang ang medical, food, transportation, shelter, at protection concerns.",
        checklists: [
          language === "bis" ? "Ikaw ba usa ka lehitimong residente sa Quezon City?" : "Ikaw ba ay lehitimong residente ng Quezon City?",
          language === "bis" ? "Nangayo ba ka og pang-emerhensya nga tabang para sa bata?" : "Humihiling ka ba ng pang-emerhensiyang tulong para sa bata?",
          language === "bis" ? "Kasamtangan ba nga nakasinati og emerhensya o dinaliang panginahanglan ang bata?" : "Kasalukuyan bang nakakaranas ng emergency o agarang pangangailangan ang bata?",
        ],
        receivedQuestion: language === "bis" ? "Kasamtangan ba nga anaa sa dinaliang peligro o nagkinahanglan og dinalian nga tabang ang bata? *" : "Kasalukuyan bang nasa agarang panganib o nangangailangan ng agarang saklolo ang bata? *",
        receivedOptions: [
          language === "bis" ? "Oo" : "Oo",
          language === "bis" ? "Dili" : "Hindi"
        ],
        assistanceTypeLabel: language === "bis" ? "Pilia ang matang sa tabang *" : "Piliin ang uri ng tulong *",
        assistanceTypes: [
          language === "bis" ? "Pang-emerhensya nga Tabang sa Pagkaon" : "Pang-emerhensiyang Tulong sa Pagkain",
          language === "bis" ? "Pang-emerhensya nga Tabang Medikal" : "Pang-emerhensiyang Tulong Medikal",
          language === "bis" ? "Pang-emerhensya nga Tabang sa Transportasyon" : "Pang-emerhensiyang Tulong sa Transportasyon",
          language === "bis" ? "Pang-emerhensya nga Kapasilongan" : "Pang-emerhensiyang Silungan",
          language === "bis" ? "Pang-emerhensya nga Proteksyon / Intervention" : "Pang-emerhensiyang Proteksyon / Intervention",
        ],
        whatIsIt: "Ang Emergency Assistance Program ay nagbibigay ng agarang tulong at intervention sa mga batang nakakaranas ng emergency o agarang pangangailangan, kabilang ang medical, food, transportation, shelter, at protection concerns.",
        whoIsEligible: [
          "Mga batang residente ng Quezon City na nangangailangan ng agarang assistance.",
          "Mga batang nakakaranas ng emergency o sitwasyong maaaring makaapekto sa kanilang kaligtasan, kalusugan, o pangunahing pangangailangan.",
          "Maaaring magsumite ng request ang magulang, legal guardian, kamag-anak, o authorized person, depende sa sitwasyon.",
        ],
        childRequirements: [
          "PSA Birth Certificate ng Bata",
          "Proof of Residency",
          "Medical Certificate / Medical Record, kung medical emergency",
          "Incident Report, kung applicable",
        ],
        parentRequirements: [
          "QCID o Valid ID",
          "Contact Information",
          "Barangay Certificate / Referral, kung available",
        ],
        specialRequirements: [
          "Police Blotter / Incident Report",
          "Medical Documents",
          "Other Supporting Documents",
        ],
        hasEmergencyInfo: true,
        documents: [
          { id: "psaBirthCert", label: language === "bis" ? "PSA Birth Certificate sa Bata" : "PSA Birth Certificate ng Bata", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
          { id: "parentId", label: language === "bis" ? "Balido nga ID sa Ginikanan / Guardian" : "Valid ID ng Magulang / Guardian", required: true, sampleImage: "/samples/sample_valid_id.png" },
          { id: "proofResidency", label: language === "bis" ? "Katibayan sa Pagpuyo (Proof of Residency)" : "Katibayan ng Paninirahan (Proof of Residency)", required: true, sampleImage: "/samples/PROOF OF RESIDENCE.webp" },
          { id: "barangayCert", label: "Barangay Certificate / Referral", required: false, sampleImage: "/samples/BARANGAY CERTIFICATE.webp" },
          { id: "medicalRecord", label: "Medical Certificate / Medical Record", required: false },
          { id: "policeBlotter", label: "Police Blotter / Incident Report", required: false },
          { id: "otherDocs", label: language === "bis" ? "Uban pang Gikinahanglang Dokumento" : "Iba pang Karagdagang Dokumento", required: false },
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

interface ChildWelfareWizardProps {
  onBack?: () => void
  userProfile?: UserProfile
  initialProgramId?: number
  initialProgramKey?: string
  onStepChange?: (step: number) => void
}

const MOCK_USER_PROFILE: UserProfile = getCurrentUserProfile() as any

export default function ChildWelfareApplicationWizard({
  onBack,
  userProfile = MOCK_USER_PROFILE,
  initialProgramId,
  initialProgramKey,
  onStepChange,
}: ChildWelfareWizardProps) {
  const { t, language } = useLanguage()

  const STEPS = [
    { id: 1, label: t("cwStepChecklist") || (language === "tl" ? "KUMPLETUHIN ANG CHECKLIST" : language === "bis" ? "KUMPLETOHA ANG CHECKLIST" : "COMPLETE CHECKLIST") },
    { id: 2, label: t("cwStepPersonal") || (language === "tl" ? "PERSONAL NA IMPORMASYON" : language === "bis" ? "PERSONAL NGA IMPORMASYON" : "PERSONAL INFORMATION") },
    { id: 3, label: t("pwdStepDocuments") ? t("pwdStepDocuments").toUpperCase() : "SAMPLE DOCUMENTS" },
    { id: 4, label: t("cwStepReview") || (language === "tl" ? "SURIIN AT ISUMITE" : language === "bis" ? "SUSIHA UG ISUMITE" : "REVIEW & SUBMIT") },
  ]

  const [step, setStep] = useState(1)

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  const [attemptedNext, setAttemptedNext] = useState(false)
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [selectedSampleDoc, setSelectedSampleDoc] = useState<{ id: string; label: string; sampleImage?: string; description?: string } | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isEditingInfo, setIsEditingInfo] = useState(false)

  const currentPrograms = getLocalizedChildWelfarePrograms(language)

  // Step 1: Program selection & Checklist
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
  const [selectedAssistanceType, setSelectedAssistanceType] = useState<string>(selectedProgram.assistanceTypes[0])

  // Sync default assistance type when program changes
  useEffect(() => {
    if (selectedProgram && !selectedProgram.assistanceTypes.includes(selectedAssistanceType)) {
      setSelectedAssistanceType(selectedProgram.assistanceTypes[0])
    }
  }, [selectedProgramId, language])

  // Step 2: Personal Information
  const currentUser = getCurrentUserProfile()
  const [formData, setFormData] = useState(() => {
    const prof = userProfile || (currentUser as any)
    const qcid = prof?.qcidNo || prof?.qcidNumber || (prof as any)?.qcid || "110000116932100"
    const fName = prof?.firstName || "CLARISA MAE"
    const mName = prof?.middleName || "GALIAS"
    const lName = prof?.lastName || "DIMAL"
    const sfx = prof?.suffix || ""
    const nat = prof?.nationality || "FILIPINO"
    const dMonth = prof?.dobMonth || (prof as any)?.birthMonth || "10"
    const dDay = prof?.dobDay || (prof as any)?.birthDay || "29"
    const dYear = prof?.dobYear || (prof as any)?.birthYear || "1960"
    const userAge = prof?.age ? String(prof.age) : "65"
    const userSex = prof?.sex || "Female"
    const civStat = prof?.civilStatus || "Single"
    const hNo = prof?.addressHouseNo || (prof as any)?.houseNo || "11"
    const st = prof?.addressStreet || (prof as any)?.street || "OLD CABUYAO SAMPALOK ST"
    const brgy = prof?.addressBarangay || (prof as any)?.barangay || "Sauyo"
    const userCity = prof?.addressCityMunicipality || (prof as any)?.city || "Quezon City"
    const cNo = prof?.contactNo || (prof as any)?.mobileNumber || "09000000000"
    const userEmail = prof?.email || "dimalmae@gmail.com"
    const pFullName = `${fName} ${mName ? mName + " " : ""}${lName}`.trim()

    return {
      // I. Applicant QCID Profile Information
      qcidNumber: qcid,
      firstName: fName,
      middleName: mName,
      lastName: lName,
      suffix: sfx,
      nationality: nat,
      dobMonth: dMonth,
      dobDay: dDay,
      dobYear: dYear,
      age: userAge,
      sex: userSex,
      civilStatus: civStat,
      addressHouseNo: hNo,
      addressStreet: st,
      barangay: brgy,
      city: userCity,
      contactNo: cNo,
      email: userEmail,

      // II. Parent / Guardian / Reporting Person
      parentFullName: pFullName,
      parentRelationship: "Mother",
      parentContactNo: cNo,

      // Specific concern / details
      reasonForRequest: "",
      briefDescription: "",
      isImmediateDanger: "No",
      isChildSafe: "Yes",
      isParentAvailable: "Yes",
      emergencyType: "Emergency Medical Assistance",
      emergencyDateTime: "",
      reportEmergencyPriority: false,
      currentLivingSituation: "",

      // Certification
      certifiedCorrect: false,
    }
  })

  // Sync profile data if userProfile changes
  useEffect(() => {
    if (!userProfile) return
    const qcid = userProfile?.qcidNo || userProfile?.qcidNumber || (userProfile as any)?.qcid || "110000116932100"
    const fName = userProfile?.firstName || "CLARISA MAE"
    const mName = userProfile?.middleName || "GALIAS"
    const lName = userProfile?.lastName || "DIMAL"
    const sfx = userProfile?.suffix || ""
    const nat = userProfile?.nationality || "FILIPINO"
    const dMonth = userProfile?.dobMonth || (userProfile as any)?.birthMonth || "10"
    const dDay = userProfile?.dobDay || (userProfile as any)?.birthDay || "29"
    const dYear = userProfile?.dobYear || (userProfile as any)?.birthYear || "1960"
    const userAge = userProfile?.age ? String(userProfile.age) : "65"
    const userSex = userProfile?.sex || "Female"
    const civStat = userProfile?.civilStatus || "Single"
    const hNo = userProfile?.addressHouseNo || (userProfile as any)?.houseNo || "11"
    const st = userProfile?.addressStreet || (userProfile as any)?.street || "OLD CABUYAO SAMPALOK ST"
    const brgy = userProfile?.addressBarangay || (userProfile as any)?.barangay || "Sauyo"
    const userCity = userProfile?.addressCityMunicipality || (userProfile as any)?.city || "Quezon City"
    const cNo = userProfile?.contactNo || (userProfile as any)?.mobileNumber || "09000000000"
    const userEmail = userProfile?.email || "dimalmae@gmail.com"
    const pFullName = `${fName} ${mName ? mName + " " : ""}${lName}`.trim()

    setFormData((prev) => ({
      ...prev,
      qcidNumber: qcid,
      firstName: fName,
      middleName: mName,
      lastName: lName,
      suffix: sfx,
      nationality: nat,
      dobMonth: dMonth,
      dobDay: dDay,
      dobYear: dYear,
      age: userAge,
      sex: userSex,
      civilStatus: civStat,
      addressHouseNo: hNo,
      addressStreet: st,
      barangay: brgy,
      city: userCity,
      contactNo: cNo,
      email: userEmail,
      parentFullName: pFullName,
      parentContactNo: cNo,
    }))
  }, [userProfile])

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Step 3: Documents
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({})

  const handleFileUpload = (docId: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    setUploadedFiles((prev) => ({
      ...prev,
      [docId]: [...(prev[docId] || []), ...fileArray],
    }))
  }

  const removeFile = (docId: string, index: number) => {
    setUploadedFiles((prev) => {
      const current = prev[docId] || []
      const updated = current.filter((_, i) => i !== index)
      return { ...prev, [docId]: updated }
    })
  }

  // Submission State
  const [submissionStage, setSubmissionStage] = useState<"form" | "matching" | "pending">("form")
  const [reference, setReference] = useState("")
  const [redirectCountdown, setRedirectCountdown] = useState(3)

  useEffect(() => {
    if (submissionStage !== "pending") return

    setRedirectCountdown(3)
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setSubmissionStage("form")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [submissionStage])

  // Validations
  const step1Valid = check1 && check2 && check3 && selectedAssistanceType !== ""

  const step2Valid =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.parentFullName.trim() !== "" &&
    formData.parentContactNo.trim().length >= 11

  const requiredDocItems = selectedProgram.documents.filter((d) => d.required)
  const step3Valid = requiredDocItems.every((d) => (uploadedFiles[d.id] || []).length > 0)

  const canGoNext =
    step === 1 ? step1Valid : step === 2 ? step2Valid : step === 3 ? step3Valid : formData.certifiedCorrect

  const handleNext = () => {
    if (!canGoNext) {
      setAttemptedNext(true)
      return
    }
    setAttemptedNext(false)
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

  const handleSubmit = () => {
    if (!formData.certifiedCorrect) {
      setAttemptedNext(true)
      return
    }
    const ref = generateReference(userProfile?.qcidNo)
    setReference(ref)
    setShowConfirmModal(false)
    setSubmissionStage("matching")
    setTimeout(() => {
      setSubmissionStage("pending")
    }, 1500)
  }

  // Pending Success Screen
  if (submissionStage === "matching") {
    return (
      <div className="max-w-xl mx-auto p-8 my-12 bg-white border border-border rounded-2xl text-center space-y-4 shadow-sm">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
        <h3 className="text-base font-bold text-gray-900">{t("appProcessingTitle") || "Pinoproseso ang inyong Aplikasyon..."}</h3>
        <p className="text-xs text-gray-500">{t("appProcessingDesc") || "Ipinapasa ang mga detalye sa Child Welfare Support Division."}</p>
      </div>
    )
  }

  if (submissionStage === "pending") {
    return (
      <div className="max-w-2xl mx-auto p-6 md:p-8 my-6 bg-white border border-border rounded-2xl shadow-sm text-center space-y-6">
        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <Baby className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {t("cwPendingBadge") || "Kasalukuyang Sinusuri (Pending Review)"}
          </span>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">{t("cwSuccessTitle") || "Matagumpay na Naisumite ang Aplikasyon!"}</h2>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            {t("cwSuccessDesc", { program: selectedProgram.title }) || `Ang inyong aplikasyon para sa ${selectedProgram.title} ay natanggap na at kasalukuyang sinusuri ng Quezon City SSDD Social Worker.`}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-md mx-auto text-left space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-500">{t("referenceNumber") || "Reference Number"}:</span>
            <span className="font-mono font-bold text-blue-700 text-sm">{reference}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Program:</span>
            <span className="font-semibold text-gray-900">{selectedProgram.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">{t("typeOfAssistance") || "Uri ng Tulong"}:</span>
            <span className="font-semibold text-gray-900">{selectedAssistanceType}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">{t("applicantName") || "Pangalan ng Aplikante"}:</span>
            <span className="font-semibold text-gray-900">{formData.firstName} {formData.lastName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">{t("parentGuardian") || "Magulang / Guardian"}:</span>
            <span className="font-semibold text-gray-900">{formData.parentFullName}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-800 max-w-md mx-auto flex items-center gap-2 text-left">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          <span>{t("trackPortalNotifDesc") || "Maaari ninyong i-track ang status sa inyong Portal Notifications at Activity History."}</span>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("autoRedirectCountdown", { seconds: String(redirectCountdown) }) || `Babalik sa aplikasyon sa loob ng ${redirectCountdown} segundo...`}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white relative">
        {/* Step Indicator Badges and Tab Bars */}
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

        {/* Tab labels */}
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

        {/* Card Content */}
        <div className="p-6 sm:p-8 space-y-7">
          {/* ──────────────── STEP 1: COMPLETE CHECKLIST ──────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-wide uppercase">
                  {t("serviceAndPrimaryRequirements") || "SERVICE AND PRIMARY REQUIREMENTS"}
                </h2>
              </div>

              {/* 3 Primary Checklist Questions */}
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={check1}
                    onChange={(e) => setCheck1(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${attemptedNext && !check1 ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                    {selectedProgram.checklists[0]} *
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={check2}
                    onChange={(e) => setCheck2(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${attemptedNext && !check2 ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                    {selectedProgram.checklists[1]} *
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={check3}
                    onChange={(e) => setCheck3(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${attemptedNext && !check3 ? "text-red-600 font-semibold" : "text-blue-700"}`}>
                    {selectedProgram.checklists[2]} *
                  </span>
                </label>

                {attemptedNext && (!check1 || !check2 || !check3) && (
                  <p className="text-xs text-red-500">Kailangang lagyan ng check ang lahat ng eligibility requirements bago magpatuloy.</p>
                )}
              </div>

              {/* Blue Info Alert Banner */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    BAGONG APLIKASYON PARA SA CHILD WELFARE SERVICES
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    NEW APPLICATION: First-time Child Welfare assistance. Complete all requirements.
                  </p>
                </div>
              </div>

              {/* Click the type of assistance */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-bold text-gray-900 tracking-wide uppercase">
                  {language === "tl" ? "PILIIN ANG URI NG TULONG" : language === "bis" ? "PILIA ANG MATANG SA TABANG" : "CLICK THE TYPE OF ASSISTANCE"}
                </h3>
                <p className="text-xs text-blue-700 font-medium">Choose the type of assistance **</p>
                <div className="relative">
                  <select
                    value={selectedAssistanceType}
                    onChange={(e) => setSelectedAssistanceType(e.target.value)}
                    className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
                  >
                    {selectedProgram.assistanceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: PERSONAL INFORMATION ──────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 uppercase">
                    {selectedProgram.title} — {t("cwStepPersonal") || (language === "tl" ? "PERSONAL NA IMPORMASYON" : language === "bis" ? "PERSONAL NGA IMPORMASYON" : "PERSONAL INFORMATION")}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t("qcidProfileDesc") || "Please review your personal information from your QCID profile. Fill in the additional details below."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>{t("autoFilledQcidBadge") || "Auto-filled from QCID Record"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{isEditingInfo ? (t("lockInformation") || "Lock Information") : (t("editInformation") || "Edit Information")}</span>
                  </button>
                </div>
              </div>

              {/* IMPORTANT REMINDER BOX */}
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-600">{t("importantReminder") || "IMPORTANT REMINDER"}</p>
                  <p className="text-blue-600/90 mt-0.5 text-xs">
                    {t("qcidReminderNote") || "Please make sure the information on your QCID is correct and complete. If any detail is missing or incorrect, contact the QCID Team to update your QCID records before continuing your application. Accurate information is important for fast and smooth processing of your service."}
                  </p>
                </div>
              </div>

              {attemptedNext && !step2Valid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Mangyaring punan ang lahat ng kinakailangang fields na may pulang asterisko (*).</span>
                </div>
              )}

              {/* I. IMPORMASYON NG APLIKANTE (QCID PROFILE) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  {language === "tl" ? "I. IMPORMASYON NG APLIKANTE (QCID PROFILE)" : language === "bis" ? "I. IMPORMASYON SA APLIKANTE (QCID PROFILE)" : "I. APPLICANT INFORMATION (QCID PROFILE)"}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">{t("qcIdLabel") || "QC ID"} *</label>
                    <input
                      type="text"
                      value={formData.qcidNumber}
                      onChange={(e) => updateField("qcidNumber", e.target.value)}
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
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
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
                      value={formData.middleName}
                      onChange={(e) => updateField("middleName", e.target.value)}
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
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
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
                      value={formData.suffix}
                      onChange={(e) => updateField("suffix", e.target.value)}
                      placeholder={t("suffixLabel") || "Suffix (Jr., Sr., etc.)"}
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
                      value={formData.nationality}
                      onChange={(e) => updateField("nationality", e.target.value)}
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
                      value={`${formData.dobMonth}/${formData.dobDay}/${formData.dobYear}`}
                      onChange={(e) => {
                        const parts = e.target.value.split("/")
                        if (parts.length === 3) {
                          updateField("dobMonth", parts[0])
                          updateField("dobDay", parts[1])
                          updateField("dobYear", parts[2])
                        }
                      }}
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
                      value={formData.age}
                      onChange={(e) => updateField("age", e.target.value)}
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
                      value={formData.sex}
                      onChange={(e) => updateField("sex", e.target.value)}
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
                      value={formData.civilStatus}
                      onChange={(e) => updateField("civilStatus", e.target.value)}
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
                    <label className="text-xs font-semibold text-gray-700">{t("contactNumberLabel") || "Contact number"} *</label>
                    <input
                      type="text"
                      value={formData.contactNo}
                      onChange={(e) => updateField("contactNo", e.target.value)}
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
                    <label className="text-xs font-semibold text-gray-700">{t("houseNumberLabel") || "House/Building number"} *</label>
                    <input
                      type="text"
                      value={formData.addressHouseNo}
                      onChange={(e) => updateField("addressHouseNo", e.target.value)}
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
                    <label className="text-xs font-semibold text-gray-700">{t("streetLabel") || "Street"} *</label>
                    <input
                      type="text"
                      value={formData.addressStreet}
                      onChange={(e) => updateField("addressStreet", e.target.value)}
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
                      value={formData.barangay}
                      onChange={(e) => updateField("barangay", e.target.value)}
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
              </div>

              {/* PARENT / GUARDIAN INFORMATION */}
              <div className="space-y-4 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-bold uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  {t("parentGuardianTitle") || (language === "tl" ? "II. MAGULANG / GUARDIAN / NAG-UULAT" : language === "bis" ? "II. GINIKANAN / GUARDIAN / TIG-REPORT" : "II. PARENT / GUARDIAN / REPORTING PERSON")}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${attemptedNext && !formData.parentFullName.trim() ? "text-red-600" : "text-gray-700"}`}>
                      {language === "tl" ? "Buong Pangalan ng Magulang / Guardian *" : language === "bis" ? "Tibuok Ngalan sa Ginikanan / Guardian *" : "Full Name of Parent / Guardian *"}
                    </label>
                    <input
                      type="text"
                      value={formData.parentFullName}
                      onChange={(e) => updateField("parentFullName", e.target.value.toUpperCase())}
                      placeholder="Hal. MARIA DELA CRUZ"
                      className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {language === "tl" ? "Relasyon sa Bata *" : language === "bis" ? "Relasyon sa Bata *" : "Relationship to Child *"}
                    </label>
                    <select
                      value={formData.parentRelationship}
                      onChange={(e) => updateField("parentRelationship", e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {[
                        { val: "Mother", label: language === "tl" ? "Ina (Mother)" : language === "bis" ? "Inahan (Mother)" : "Mother" },
                        { val: "Father", label: language === "tl" ? "Ama (Father)" : language === "bis" ? "Amahan (Father)" : "Father" },
                        { val: "Legal Guardian", label: language === "tl" ? "Legal na Tagapag-alaga (Guardian)" : language === "bis" ? "Legal nga Tig-atiman" : "Legal Guardian" },
                        { val: "Relative", label: language === "tl" ? "Kamag-anak (Relative)" : language === "bis" ? "Paryente (Relative)" : "Relative" },
                        { val: "Reporting Person", label: language === "tl" ? "Nag-uulat (Reporting Person)" : language === "bis" ? "Tig-report (Reporting Person)" : "Reporting Person" },
                        { val: "Other", label: language === "tl" ? "Iba pa" : language === "bis" ? "Uban pa" : "Other" },
                      ].map((r) => (
                        <option key={r.val} value={r.val}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${attemptedNext && formData.parentContactNo.length < 11 ? "text-red-600" : "text-gray-700"}`}>
                      {language === "tl" ? "Numero ng Telepono *" : language === "bis" ? "Numero sa Telepono *" : "Contact Number *"}
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.parentContactNo}
                      onChange={(e) => updateField("parentContactNo", e.target.value.replace(/\D/g, ""))}
                      placeholder="09XXXXXXXXX"
                      className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* SPECIFIC PROGRAM DETAILS */}
              {/* 1. Child Protection Specific */}
              {selectedProgram.hasProtectionConcern && (
                <div className="space-y-4 pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-bold uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    CHILD PROTECTION CONCERN
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Reason for Request *
                      </label>
                      <select
                        value={formData.reasonForRequest}
                        onChange={(e) => updateField("reasonForRequest", e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">Pumili ng dahilan / concern...</option>
                        <option value="Child Abuse / Maltreatment">Child Abuse / Maltreatment</option>
                        <option value="Severe Neglect">Severe Neglect</option>
                        <option value="Exploitation / Violence">Exploitation / Violence</option>
                        <option value="Immediate Safety Concern">Immediate Safety Concern</option>
                        <option value="Abandonment">Abandonment</option>
                        <option value="Other Protection Concern">Other Protection Concern</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Brief Description of the Concern *
                      </label>
                      <textarea
                        rows={3}
                        value={formData.briefDescription}
                        onChange={(e) => updateField("briefDescription", e.target.value)}
                        placeholder="Please describe the child's situation or concern in detail..."
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <label className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.reportEmergencyPriority}
                        onChange={(e) => updateField("reportEmergencyPriority", e.target.checked)}
                        className="h-4 w-4 rounded text-rose-600 accent-rose-600 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-rose-900">
                        🚨 Report an Emergency / Immediate Safety Concern (I-prioritize para sa agarang pagtugon ng social worker)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* 2. Emergency Assistance Specific */}
              {selectedProgram.hasEmergencyInfo && (
                <div className="space-y-4 pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-bold uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <Activity className="w-4 h-4 text-amber-600" />
                    EMERGENCY INFORMATION
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Type of Emergency *
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyType}
                        onChange={(e) => updateField("emergencyType", e.target.value)}
                        placeholder="Hal. Emergency Medical Assistance"
                        className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Date & Time of Emergency *
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyDateTime}
                        onChange={(e) => updateField("emergencyDateTime", e.target.value)}
                        placeholder="Hal. Kasalukuyan / Ngayong Araw"
                        className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Brief Description of Emergency *
                    </label>
                    <textarea
                      rows={3}
                      value={formData.briefDescription}
                      onChange={(e) => updateField("briefDescription", e.target.value)}
                      placeholder="Please describe the emergency situation..."
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Is the child currently safe? *
                    </label>
                    <div className="flex items-center gap-6">
                      {["Yes", "No"].map((v) => (
                        <label key={v} className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                          <input
                            type="radio"
                            name="childSafe"
                            value={v}
                            checked={formData.isChildSafe === v}
                            onChange={() => updateField("isChildSafe", v)}
                            className="h-4 w-4 text-blue-600 accent-blue-600 cursor-pointer"
                          />
                          <span>{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Psychosocial Support Specific */}
              {selectedProgram.hasPsychosocialReason && (
                <div className="space-y-4 pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-bold uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <HeartHandshake className="w-4 h-4 text-indigo-600" />
                    SUPPORT INFORMATION
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Reason for Request *
                    </label>
                    <select
                      value={formData.reasonForRequest}
                      onChange={(e) => updateField("reasonForRequest", e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Pumili ng dahilan...</option>
                      <option value="Emotional Distress">Emotional Distress</option>
                      <option value="Family Problem">Family Problem</option>
                      <option value="Grief / Loss">Grief / Loss</option>
                      <option value="Bullying">Bullying</option>
                      <option value="Trauma / Difficult Experience">Trauma / Difficult Experience</option>
                      <option value="Abuse / Neglect Concern">Abuse / Neglect Concern</option>
                      <option value="Behavioral Concern">Behavioral Concern</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Brief Description of the Concern *
                    </label>
                    <textarea
                      rows={3}
                      value={formData.briefDescription}
                      onChange={(e) => updateField("briefDescription", e.target.value)}
                      placeholder="Please describe the child's concern..."
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              )}

              {/* 4. Temporary Shelter / Care Specific */}
              {selectedProgram.hasShelterCareInfo && (
                <div className="space-y-4 pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-bold uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <Home className="w-4 h-4 text-emerald-600" />
                    SHELTER / CARE INFORMATION
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Reason for Request *
                    </label>
                    <select
                      value={formData.reasonForRequest}
                      onChange={(e) => updateField("reasonForRequest", e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Pumili ng dahilan...</option>
                      <option value="No Safe Place to Stay">No Safe Place to Stay</option>
                      <option value="Child Protection Concern">Child Protection Concern</option>
                      <option value="Family Crisis">Family Crisis</option>
                      <option value="Abandonment">Abandonment</option>
                      <option value="Emergency Situation">Emergency Situation</option>
                      <option value="Risk of Abuse / Neglect">Risk of Abuse / Neglect</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Current Living Situation *
                    </label>
                    <textarea
                      rows={3}
                      value={formData.currentLivingSituation}
                      onChange={(e) => updateField("currentLivingSituation", e.target.value)}
                      placeholder="Please describe the child's current living situation..."
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Is the child currently safe? *
                      </label>
                      <div className="flex items-center gap-6">
                        {["Yes", "No"].map((v) => (
                          <label key={v} className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                            <input
                              type="radio"
                              name="shelterChildSafe"
                              value={v}
                              checked={formData.isChildSafe === v}
                              onChange={() => updateField("isChildSafe", v)}
                              className="h-4 w-4 text-blue-600 accent-blue-600 cursor-pointer"
                            />
                            <span>{v}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Is there a parent/guardian available? *
                      </label>
                      <div className="flex items-center gap-6">
                        {["Yes", "No"].map((v) => (
                          <label key={v} className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                            <input
                              type="radio"
                              name="shelterParentAvailable"
                              value={v}
                              checked={formData.isParentAvailable === v}
                              onChange={() => updateField("isParentAvailable", v)}
                              className="h-4 w-4 text-blue-600 accent-blue-600 cursor-pointer"
                            />
                            <span>{v}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Family / Parenting Support Specific */}
              {selectedProgram.hasParentingReason && (
                <div className="space-y-4 pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-bold uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <Users className="w-4 h-4 text-violet-600" />
                    FAMILY / PARENTING INFORMATION
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Reason for Request *
                    </label>
                    <select
                      value={formData.reasonForRequest}
                      onChange={(e) => updateField("reasonForRequest", e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Pumili ng dahilan...</option>
                      <option value="Parenting Concern">Parenting Concern</option>
                      <option value="Family Conflict">Family Conflict</option>
                      <option value="Parent-Child Relationship Concern">Parent-Child Relationship Concern</option>
                      <option value="Child Care Concern">Child Care Concern</option>
                      <option value="Parenting Skills Support">Parenting Skills Support</option>
                      <option value="Family Communication Problem">Family Communication Problem</option>
                      <option value="Family Crisis">Family Crisis</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Brief Description of the Concern *
                    </label>
                    <textarea
                      rows={3}
                      value={formData.briefDescription}
                      onChange={(e) => updateField("briefDescription", e.target.value)}
                      placeholder="Please describe your family or parenting concern..."
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────────── STEP 3: SUBMIT DOCUMENTS ──────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-base font-bold text-gray-900 uppercase">
                  {t("cwStepDocuments") || (language === "tl" ? "MAGSUMITE NG DOKUMENTO" : language === "bis" ? "ISUMITE ANG MGA DOKUMENTO" : "SUBMIT DOCUMENTS")}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === "tl"
                    ? `I-upload ang mga kaukulang dokumento para sa ${selectedProgram.title}. Ang may markang (*) ay kinakailangan.`
                    : language === "bis"
                    ? `I-upload ang mga angay nga dokumento para sa ${selectedProgram.title}. Ang may marka nga (*) gikinahanglan.`
                    : `Upload the required documents for ${selectedProgram.title}. Fields marked with (*) are required.`}
                </p>
              </div>

              <div className="space-y-4">
                {selectedProgram.documents.map((doc) => {
                  const files = uploadedFiles[doc.id] || []
                  const hasUploaded = files.length > 0
                  return (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-xl border transition-all ${
                        hasUploaded
                          ? "border-emerald-200 bg-emerald-50/40"
                          : doc.required && attemptedNext
                          ? "border-red-300 bg-red-50/30"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <span>{doc.label}</span>
                            {doc.required ? (
                              <span className="text-red-500">*</span>
                            ) : (
                              <span className="text-gray-400 font-normal">
                                ({language === "tl" ? "Opsyonal" : language === "bis" ? "Opsyonal" : "Optional"})
                              </span>
                            )}
                            {hasUploaded && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                          </p>
                          {doc.description && (
                            <p className="text-[11px] text-gray-500 mt-0.5">{doc.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {doc.sampleImage && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSampleDoc(doc)
                                setShowSampleModal(true)
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                            >
                              {language === "tl" ? "Sample na Dokumento" : language === "bis" ? "Sample nga Dokumento" : "Sample Document"}
                            </button>
                          )}

                          <label className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors shadow-xs">
                            <Upload className="w-3.5 h-3.5 inline mr-1" />
                            {language === "tl" ? "MAG-UPLOAD NG FILE" : language === "bis" ? "PAG-UPLOAD OG FILE" : "CHOOSE FILE"}
                            <input
                              type="file"
                              multiple
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileUpload(doc.id, e.target.files)}
                              className="sr-only"
                            />
                          </label>
                        </div>
                      </div>

                      {/* File preview list */}
                      {hasUploaded && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                          {files.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span className="max-w-[150px] truncate">{file.name}</span>
                              <span className="text-[10px] text-gray-400">({formatFileSize(file.size)})</span>
                              <button
                                type="button"
                                onClick={() => removeFile(doc.id, idx)}
                                className="ml-1 text-gray-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {doc.required && attemptedNext && !hasUploaded && (
                        <p className="text-xs text-red-500 mt-2">
                          {language === "tl"
                            ? "Kailangang i-upload ang dokumentong ito."
                            : language === "bis"
                            ? "Kinahanglan i-upload kini nga dokumento."
                            : "This document is required."}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ──────────────── STEP 4: REVIEW & SUBMIT ──────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-base font-bold text-gray-900 uppercase">
                  {t("cwStepReview") || (language === "tl" ? "SURIIN AT ISUMITE" : language === "bis" ? "SUSIHA UG ISUMITE" : "REVIEW YOUR APPLICATION")}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === "tl"
                    ? "Pakisuri ang lahat ng impormasyon bago isumite ang inyong aplikasyon."
                    : language === "bis"
                    ? "Palihug susiha ang tanang impormasyon sa dili pa isumite ang imong aplikasyon."
                    : "Please review all information before submitting your application."}
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Applicant Information */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="font-bold text-gray-900 uppercase">
                      {language === "tl" ? "IMPORMASYON NG APLIKANTE" : language === "bis" ? "IMPORMASYON SA APLIKANTE" : "APPLICANT INFORMATION"}
                    </span>
                    <button type="button" onClick={() => setStep(2)} className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> {language === "tl" ? "I-edit" : language === "bis" ? "I-edit" : "Edit"}
                    </button>
                  </div>
                  <p><span className="text-gray-500">QC ID:</span> <span className="font-semibold text-gray-900 font-mono">{formData.qcidNumber}</span></p>
                  <p><span className="text-gray-500">{language === "tl" ? "Buong Pangalan:" : language === "bis" ? "Tibuok Ngalan:" : "Full Name:"}</span> <span className="font-semibold text-gray-900">{formData.firstName} {formData.middleName ? formData.middleName + " " : ""}{formData.lastName} {formData.suffix}</span></p>
                  <p><span className="text-gray-500">{language === "tl" ? "Petsa ng Kapanganakan / Edad:" : language === "bis" ? "Petsa sa Pagkatawo / Edad:" : "Date of Birth / Age:"}</span> <span className="font-semibold text-gray-900">{formData.dobMonth}/{formData.dobDay}/{formData.dobYear} ({formData.age} {language === "tl" ? "taong gulang" : language === "bis" ? "ka tuig" : "y/o"})</span></p>
                  <p><span className="text-gray-500">{language === "tl" ? "Kasarian / Katayuang Sibil:" : language === "bis" ? "Kasarian / Sibil nga Kahimtang:" : "Sex / Civil Status:"}</span> <span className="font-semibold text-gray-900">{formData.sex} / {formData.civilStatus}</span></p>
                  <p><span className="text-gray-500">{language === "tl" ? "Tirahan:" : language === "bis" ? "Pinuy-anan:" : "Address:"}</span> <span className="font-semibold text-gray-900">{formData.addressHouseNo} {formData.addressStreet}, Brgy. {formData.barangay}, {formData.city}</span></p>
                </div>

                {/* Parent / Guardian Information */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="font-bold text-gray-900 uppercase">
                      {language === "tl" ? "MAGULANG / GUARDIAN" : language === "bis" ? "GINIKANAN / GUARDIAN" : "PARENT / GUARDIAN"}
                    </span>
                    <button type="button" onClick={() => setStep(2)} className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> {language === "tl" ? "I-edit" : language === "bis" ? "I-edit" : "Edit"}
                    </button>
                  </div>
                  <p><span className="text-gray-500">{language === "tl" ? "Pangalan:" : language === "bis" ? "Ngalan:" : "Name:"}</span> <span className="font-semibold text-gray-900">{formData.parentFullName}</span></p>
                  <p><span className="text-gray-500">{language === "tl" ? "Relasyon:" : language === "bis" ? "Relasyon:" : "Relationship:"}</span> <span className="font-semibold text-gray-900">{formData.parentRelationship}</span></p>
                  <p><span className="text-gray-500">{language === "tl" ? "Numero ng Telepono:" : language === "bis" ? "Numero sa Telepono:" : "Contact Number:"}</span> <span className="font-semibold text-gray-900 font-mono">{formData.parentContactNo}</span></p>
                  <p><span className="text-gray-500">QC Resident:</span> <span className="font-semibold text-emerald-700">✓ Verified</span></p>
                </div>
              </div>

              {/* Program & Assistance Requested */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="font-bold text-gray-900 uppercase">
                    {language === "tl" ? "HINIHILING NA SERBISYO / TULONG" : language === "bis" ? "GIHANGYO NGA TABANG" : "ASSISTANCE REQUESTED"}
                  </span>
                  <button type="button" onClick={() => setStep(1)} className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
                    <Pencil className="w-3 h-3" /> {language === "tl" ? "I-edit" : language === "bis" ? "I-edit" : "Edit"}
                  </button>
                </div>
                <p><span className="text-gray-500">{language === "tl" ? "Programa:" : language === "bis" ? "Programa:" : "Program:"}</span> <span className="font-bold text-blue-700 text-sm">{selectedProgram.title}</span></p>
                <p><span className="text-gray-500">{language === "tl" ? "Uri ng Tulong:" : language === "bis" ? "Matang sa Tabang:" : "Type of Assistance:"}</span> <span className="font-semibold text-gray-900">{selectedAssistanceType}</span></p>
                {formData.reasonForRequest && (
                  <p><span className="text-gray-500">{language === "tl" ? "Dahilan:" : language === "bis" ? "Rason:" : "Reason for Request:"}</span> <span className="font-semibold text-gray-900">{formData.reasonForRequest}</span></p>
                )}
                {formData.briefDescription && (
                  <p><span className="text-gray-500">{language === "tl" ? "Deskripsyon:" : language === "bis" ? "Deskripsyon:" : "Description:"}</span> <span className="text-gray-800">{formData.briefDescription}</span></p>
                )}
              </div>

              {/* Uploaded Documents Summary */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="font-bold text-gray-900 uppercase">
                    {language === "tl" ? "MGA NA-UPLOAD NA DOKUMENTO" : language === "bis" ? "MGA NA-UPLOAD NGA DOKUMENTO" : "UPLOADED DOCUMENTS"}
                  </span>
                  <button type="button" onClick={() => setStep(3)} className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
                    <Pencil className="w-3 h-3" /> {language === "tl" ? "I-edit" : language === "bis" ? "I-edit" : "Edit"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedProgram.documents.map((doc) => {
                    const files = uploadedFiles[doc.id] || []
                    const uploaded = files.length > 0
                    return (
                      <div key={doc.id} className="flex items-center gap-2">
                        {uploaded ? (
                          <span className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="h-4 w-4 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center shrink-0 text-[10px]">
                            •
                          </span>
                        )}
                        <span className={`truncate ${uploaded ? "font-semibold text-gray-900" : "text-gray-400"}`}>
                          {doc.label} {uploaded && `(${files.length})`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Certification Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.certifiedCorrect}
                    onChange={(e) => updateField("certifiedCorrect", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-blue-950 leading-relaxed">
                    {language === "tl"
                      ? "Pinatutunayan ko na ang lahat ng impormasyong ibinigay ay totoo at tama. Nauunawaan ko na ang anumang maling pahayag ay maaaring maging dahilan ng hindi pag-apruba sa aking aplikasyon. *"
                      : language === "bis"
                      ? "Gipamatud-an nako nga ang tanang impormasyon nga gihatag tinuod ug husto. *"
                      : "I certify that all information provided is true and correct. I understand that any false declaration may result in the disapproval of my Child Welfare Support application. *"}
                  </span>
                </label>
                {attemptedNext && !formData.certifiedCorrect && (
                  <p className="text-xs text-red-500 mt-1 ml-1">
                    {language === "tl" ? "Kailangang lagyan ng check ang certification bago i-submit." : language === "bis" ? "Kinahanglan markahan ang certification sa dili pa i-submit." : "Certification must be checked before submitting."}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-2 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors uppercase tracking-wider cursor-pointer"
            >
              {t("backButton") || "BACK"}
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className={`px-7 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                canGoNext
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span>{t("nextButton") || "NEXT"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={!formData.certifiedCorrect}
              className={`px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                formData.certifiedCorrect
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span>{selectedProgram.submitButtonText || t("submitApplicationUpper") || "SUBMIT APPLICATION"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sample Document Modal */}
      {showSampleModal && selectedSampleDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-sm font-bold text-gray-900">{t("sampleDocument") || "Sample"}: {selectedSampleDoc.label}</h4>
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {selectedSampleDoc.sampleImage ? (
              <div className="h-64 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src={selectedSampleDoc.sampleImage}
                  alt="Sample"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs">
                {t("noSampleImageAvailable") || "Walang available na sample image para sa dokumentong ito."}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
              >
                {t("close") || "CLOSE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 text-center">
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Baby className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">{t("submitAppTitle") || "Isumite ang Aplikasyon?"}</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {t("submitAppDesc", { program: selectedProgram.title, type: selectedAssistanceType }) || `Sigurado ka bang nais mong isumite ang inyong aplikasyon para sa ${selectedProgram.title} (${selectedAssistanceType})?`}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                {t("cancel") || "CANCEL"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs"
              >
                {t("yesSubmitBtn") || "YES, SUBMIT"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
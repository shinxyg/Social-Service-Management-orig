import { useState, useEffect } from "react"
import {
  Check,
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
import { notifyApplicationChange } from "../../utils/realtimeSync"

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
    desc: "Provides nutritional support for children in need of nutritious food, supplementary feeding, milk or infant nutrition, nutritional supplements, and dietary counseling to improve their health and nutritional status.",
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
    whatIsIt: "The Nutritional Assistance Program provides support to children who need nutritious food packs, supplementary feeding, milk or infant nutrition, nutritional supplements, and proper nutrition guidance to improve their health and wellbeing.",
    whoIsEligible: [
      "Children residing in Quezon City who are in need of nutritional assistance.",
      "Children with specific nutritional needs or at risk of malnutrition.",
      "Applications may be submitted by the parent or legal guardian of the child.",
    ],
    childRequirements: [
      "PSA Birth Certificate of the Child",
      "Medical / Nutrition Assessment, if available or required",
      "Barangay Certificate / Referral, if applicable",
    ],
    parentRequirements: [
      "QCID or Valid Government ID",
      "Proof of Residency",
      "Contact Information",
    ],
    specialRequirements: [
      "Medical/Nutritionist recommendation",
      "Feeding assessment report",
      "Other supporting documents depending on requested assistance",
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
    desc: "Provides protection, intervention, legal and case referral, and psychosocial support for children experiencing or at risk of abuse, neglect, exploitation, violence, or other safety concerns.",
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
    whatIsIt: "The Child Protection Assistance Program provides comprehensive protection, intervention, counseling, and legal referral for children facing abuse, neglect, violence, exploitation, or urgent welfare concerns.",
    whoIsEligible: [
      "Children residing in Quezon City in need of child protection services.",
      "Children experiencing or at risk of abuse, neglect, exploitation, violence, or safety issues.",
      "Applications or reports may be filed by parents, guardians, relatives, or authorized reporting individuals.",
    ],
    childRequirements: [
      "PSA Birth Certificate of the Child",
      "Proof of Residency",
      "Medical Certificate / Medico-Legal Report, if applicable",
      "Social Case Study Report, if available or required",
    ],
    parentRequirements: [
      "QCID or Valid Government ID",
      "Contact Information",
      "Barangay Certificate / Referral, if applicable",
    ],
    specialRequirements: [
      "Police Blotter / Incident Report, if applicable",
      "Court / Legal Documents, if applicable",
      "Other supporting documents as required",
    ],
    hasProtectionConcern: true,
    documents: [
      { id: "psaBirthCert", label: "PSA Birth Certificate of the Child", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
      { id: "parentId", label: "Valid ID of Parent/Guardian/Reporting Person", required: true, sampleImage: "/samples/sample_valid_id.png" },
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
    desc: "Provides immediate intervention and emergency aid for children facing crisis situations, including emergency food, medical aid, temporary shelter, transportation, and urgent protection.",
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
    whatIsIt: "The Emergency Assistance Program delivers urgent intervention and rapid response relief for children caught in crisis, medical emergencies, disasters, or critical safety situations.",
    whoIsEligible: [
      "Children residing in Quezon City in immediate need of emergency assistance.",
      "Children facing emergencies affecting their immediate health, safety, food security, or shelter.",
      "Requests may be submitted by parents, guardians, relatives, or authorized first responders.",
    ],
    childRequirements: [
      "PSA Birth Certificate of the Child",
      "Proof of Residency",
      "Medical Certificate / Medical Record, if medical emergency",
      "Incident Report, if applicable",
    ],
    parentRequirements: [
      "QCID or Valid Government ID",
      "Contact Information",
      "Barangay Certificate / Referral, if available",
    ],
    specialRequirements: [
      "Police Blotter / Incident Report",
      "Medical Documents",
      "Other Supporting Documents",
    ],
    hasEmergencyInfo: true,
    documents: [
      { id: "psaBirthCert", label: "PSA Birth Certificate of the Child", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
      { id: "parentId", label: "Valid ID of Parent/Guardian", required: true, sampleImage: "/samples/sample_valid_id.png" },
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
  if (language === "tl") {
    return [
      {
        id: 1,
        key: "nutritional-assistance",
        title: "Tulong sa Nutrisyon",
        desc: "Nagbibigay ng suporta sa mga batang nangangailangan ng masustansyang pagkain, supplementary feeding, gatas o infant nutrition, nutritional supplements, at gabay tungkol sa wastong nutrisyon upang makatulong sa kanilang kalusugan at nutritional status.",
        checklists: [
          "Ikaw ba ay lehitimong residente ng Quezon City?",
          "Nag-a-apply ka ba para sa tulong sa nutrisyon para sa bata?",
          "Kasalukuyan bang nangangailangan ng suporta sa nutrisyon ang bata?",
        ],
        receivedQuestion: "Nakatanggap ka na ba ng tulong sa nutrisyon mula sa ibang opisina ng Quezon City? *",
        receivedOptions: ["Oo, nakatanggap na ako ng tulong sa nutrisyon", "Hindi pa"],
        assistanceTypeLabel: "Piliin ang uri ng tulong *",
        assistanceTypes: [
          "Food Pack / Masustansyang Pagkain",
          "Supplementary Feeding",
          "Gatas / Infant Nutrition",
          "Nutritional Supplements",
          "Edukasyon sa Nutrisyon / Counseling",
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
          "QCID o Valid ID ng Magulang / Guardian",
          "Katibayan ng Paninirahan (Proof of Residency)",
          "Impormasyon sa Pakikipag-ugnayan (Contact Information)",
        ],
        specialRequirements: [
          "Rekomendasyon mula sa Doktor / Nutritionist",
          "Feeding assessment report",
          "Iba pang supporting documents depende sa napiling tulong",
        ],
        documents: [
          { id: "psaBirthCert", label: "PSA Birth Certificate ng Bata", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
          { id: "parentId", label: "Valid ID ng Magulang / Guardian", required: true, sampleImage: "/samples/sample_valid_id.png" },
          { id: "proofResidency", label: "Katibayan ng Paninirahan (Proof of Residency)", required: true, sampleImage: "/samples/PROOF OF RESIDENCE.webp" },
          { id: "barangayCert", label: "Barangay Certificate / Referral", required: false, sampleImage: "/samples/BARANGAY CERTIFICATE.webp" },
          { id: "medicalAssessment", label: "Medical / Nutrition Assessment", required: false },
          { id: "otherDocs", label: "Iba pang Karagdagang Dokumento", required: false },
        ],
        submitButtonText: "ISUMITE ANG APLIKASYON",
      },
      {
        id: 2,
        key: "child-protection",
        title: "Tulong sa Proteksyon ng Bata",
        desc: "Nagbibigay ng proteksyon, intervention, referral, at iba pang kinakailangang suporta para sa mga batang nakakaranas o nasa panganib ng abuse, neglect, exploitation, violence, o iba pang child protection concerns.",
        checklists: [
          "Ikaw ba ay lehitimong residente ng Quezon City?",
          "Nag-a-apply ka ba para sa proteksyon ng bata?",
          "Kasalukuyan bang may banta sa kaligtasan o proteksyon ang bata?",
        ],
        receivedQuestion: "Nakatanggap ka na ba ng tulong sa proteksyon mula sa ibang opisina ng Quezon City? *",
        receivedOptions: ["Oo, nakatanggap na ako ng tulong", "Hindi pa"],
        assistanceTypeLabel: "Piliin ang uri ng tulong *",
        assistanceTypes: [
          "Tulong sa Proteksyon / Kaligtasan ng Bata",
          "Pang-emerhensiyang Tulong sa Bata",
          "Temporary Shelter / Protective Custody Referral",
          "Tulong Legal / Case Referral",
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
          "Katibayan ng Paninirahan (Proof of Residency)",
          "Medical Certificate / Medico-Legal Report, kung applicable",
          "Social Case Study Report, kung available o kinakailangan",
        ],
        parentRequirements: [
          "QCID o Valid ID ng Magulang / Guardian / Nag-uulat",
          "Impormasyon sa Pakikipag-ugnayan",
          "Barangay Certificate / Referral, kung applicable",
        ],
        specialRequirements: [
          "Police Blotter / Incident Report, kung applicable",
          "Dokumento mula sa Korte, kung applicable",
          "Iba pang karagdagang dokumento, kung kinakailangan",
        ],
        hasProtectionConcern: true,
        documents: [
          { id: "psaBirthCert", label: "PSA Birth Certificate ng Bata", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
          { id: "parentId", label: "Valid ID ng Magulang / Guardian / Nag-uulat", required: true, sampleImage: "/samples/sample_valid_id.png" },
          { id: "proofResidency", label: "Katibayan ng Paninirahan (Proof of Residency)", required: true, sampleImage: "/samples/PROOF OF RESIDENCE.webp" },
          { id: "barangayCert", label: "Barangay Certificate / Referral", required: false, sampleImage: "/samples/BARANGAY CERTIFICATE.webp" },
          { id: "caseStudy", label: "Social Case Study Report", required: false },
          { id: "medicoLegal", label: "Medical Certificate / Medico-Legal Report", required: false },
          { id: "policeBlotter", label: "Police Blotter / Incident Report", required: false },
          { id: "courtDocs", label: "Dokumento mula sa Korte", required: false },
          { id: "otherDocs", label: "Iba pang Karagdagang Dokumento", required: false },
        ],
        submitButtonText: "ISUMITE ANG APLIKASYON",
      },
      {
        id: 3,
        key: "emergency-assistance",
        title: "Pang-emerhensiyang Tulong",
        desc: "Nagbibigay ng agarang tulong at intervention sa mga batang nakakaranas ng emergency o agarang pangangailangan, kabilang ang medical, food, transportation, shelter, at protection concerns.",
        checklists: [
          "Ikaw ba ay lehitimong residente ng Quezon City?",
          "Humihiling ka ba ng pang-emerhensiyang tulong para sa bata?",
          "Kasalukuyan bang nakakaranas ng emergency o agarang pangangailangan ang bata?",
        ],
        receivedQuestion: "Kasalukuyan bang nasa agarang panganib o nangangailangan ng agarang saklolo ang bata? *",
        receivedOptions: ["Oo", "Hindi"],
        assistanceTypeLabel: "Piliin ang uri ng tulong *",
        assistanceTypes: [
          "Pang-emerhensiyang Tulong sa Pagkain",
          "Pang-emerhensiyang Tulong Medikal",
          "Pang-emerhensiyang Tulong sa Transportasyon",
          "Pang-emerhensiyang Silungan",
          "Pang-emerhensiyang Proteksyon / Intervention",
        ],
        whatIsIt: "Ang Emergency Assistance Program ay nagbibigay ng agarang tulong at intervention sa mga batang nakakaranas ng emergency o agarang pangangailangan, kabilang ang medical, food, transportation, shelter, at protection concerns.",
        whoIsEligible: [
          "Mga batang residente ng Quezon City na nangangailangan ng agarang tulong o saklolo.",
          "Mga batang nakakaranas ng emergency o sitwasyong maaaring makaapekto sa kanilang kaligtasan, kalusugan, o pangunahing pangangailangan.",
          "Maaaring magsumite ng request ang magulang, legal guardian, kamag-anak, o authorized person.",
        ],
        childRequirements: [
          "PSA Birth Certificate ng Bata",
          "Katibayan ng Paninirahan (Proof of Residency)",
          "Medical Certificate / Rekord Medikal, kung emergency na medikal",
          "Incident Report, kung applicable",
        ],
        parentRequirements: [
          "QCID o Valid ID ng Magulang / Guardian",
          "Impormasyon sa Pakikipag-ugnayan",
          "Barangay Certificate / Referral, kung mayroon",
        ],
        specialRequirements: [
          "Police Blotter / Incident Report",
          "Mga Dokumentong Medikal / Ospital",
          "Iba pang dokumentong sumusuporta sa emergency",
        ],
        hasEmergencyInfo: true,
        documents: [
          { id: "psaBirthCert", label: "PSA Birth Certificate ng Bata", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
          { id: "parentId", label: "Valid ID ng Magulang / Guardian", required: true, sampleImage: "/samples/sample_valid_id.png" },
          { id: "proofResidency", label: "Katibayan ng Paninirahan (Proof of Residency)", required: true, sampleImage: "/samples/PROOF OF RESIDENCE.webp" },
          { id: "barangayCert", label: "Barangay Certificate / Referral", required: false, sampleImage: "/samples/BARANGAY CERTIFICATE.webp" },
          { id: "medicalRecord", label: "Medical Certificate / Medical Record", required: false },
          { id: "policeBlotter", label: "Police Blotter / Incident Report", required: false },
          { id: "otherDocs", label: "Iba pang Karagdagang Dokumento", required: false },
        ],
        submitButtonText: "ISUMITE ANG APLIKASYON",
      },
    ]
  }

  if (language === "bis") {
    return [
      {
        id: 1,
        key: "nutritional-assistance",
        title: "Tabang sa Nutrisyon",
        desc: "Naghatag og tabang sa mga bata nga nagkinahanglan og masustansyang pagkaon, supplementary feeding, gatas o infant nutrition, nutritional supplements, ug giya sa nutrisyon.",
        checklists: [
          "Ikaw ba usa ka lehitimong residente sa Quezon City?",
          "Nag-apply ba ka og tabang sa nutrisyon para sa bata?",
          "Kasamtangan ba nga nagkinahanglan og tabang sa nutrisyon ang bata?",
        ],
        receivedQuestion: "Nakadawat na ba ka og tabang sa nutrisyon gikan sa laing opisina sa Quezon City? *",
        receivedOptions: ["Oo, nakadawat na ko og tabang sa nutrisyon", "Wala pa"],
        assistanceTypeLabel: "Pilia ang matang sa tabang *",
        assistanceTypes: [
          "Food Pack / Masustansyang Pagkaon",
          "Supplementary Feeding",
          "Gatas / Infant Nutrition",
          "Nutritional Supplements",
          "Edukasyon sa Nutrisyon / Counseling",
        ],
        whatIsIt: "Ang Nutritional Assistance Program naghatag og tabang sa mga bata nga nagkinahanglan og masustansyang pagkaon, supplementary feeding, gatas o infant nutrition, nutritional supplements, ug giya sa nutrisyon aron mapalambo ang ilang kahimsog.",
        whoIsEligible: [
          "Mga bata nga residente sa Quezon City nga nagkinahanglan og tabang sa nutrisyon.",
          "Mga bata nga adunay partikular nga panginahanglan sa nutrisyon o anaa sa peligro sa malnutrisyon.",
          "Ang aplikasyon mahimong isumite sa ginikanan o legal nga guardian sa bata.",
        ],
        childRequirements: [
          "PSA Birth Certificate sa Bata",
          "Medical / Nutrition Assessment, kung anaa o gikinahanglan",
          "Barangay Certificate / Referral, kung magamit",
        ],
        parentRequirements: [
          "QCID o Balido nga ID sa Ginikanan / Guardian",
          "Katibayan sa Pagpuyo (Proof of Residency)",
          "Impormasyon sa Pakig-kontak (Contact Information)",
        ],
        specialRequirements: [
          "Rekomendasyon gikan sa Doktor / Nutritionist",
          "Feeding assessment report",
          "Uban pang gikinahanglang dokumento depende sa napiling tabang",
        ],
        documents: [
          { id: "psaBirthCert", label: "PSA Birth Certificate sa Bata", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
          { id: "parentId", label: "Balido nga ID sa Ginikanan / Guardian", required: true, sampleImage: "/samples/sample_valid_id.png" },
          { id: "proofResidency", label: "Katibayan sa Pagpuyo (Proof of Residency)", required: true, sampleImage: "/samples/PROOF OF RESIDENCE.webp" },
          { id: "barangayCert", label: "Barangay Certificate / Referral", required: false, sampleImage: "/samples/BARANGAY CERTIFICATE.webp" },
          { id: "medicalAssessment", label: "Medical / Nutrition Assessment", required: false },
          { id: "otherDocs", label: "Uban pang Gikinahanglang Dokumento", required: false },
        ],
        submitButtonText: "ISUMITE ANG APLIKASYON",
      },
      {
        id: 2,
        key: "child-protection",
        title: "Tabang sa Proteksyon sa Bata",
        desc: "Naghatag og proteksyon, intervention, referral, ug suporta para sa mga bata nga nag-atubang o anaa sa peligro sa pang-abuso, kapabayaan, o kapintasan.",
        checklists: [
          "Ikaw ba usa ka lehitimong residente sa Quezon City?",
          "Nag-apply ba ka para sa proteksyon sa bata?",
          "Kasamtangan ba nga dunay kabalaka sa kaluwasan o proteksyon ang bata?",
        ],
        receivedQuestion: "Nakadawat na ba ka og tabang sa proteksyon gikan sa laing opisina sa Quezon City? *",
        receivedOptions: ["Oo, nakadawat na ko og tabang", "Wala pa"],
        assistanceTypeLabel: "Pilia ang matang sa tabang *",
        assistanceTypes: [
          "Tabang sa Proteksyon / Kaluwasan sa Bata",
          "Pang-emerhensya nga Tabang sa Bata",
          "Temporary Shelter / Protective Custody Referral",
          "Tabang Legal / Case Referral",
          "Psychosocial Support / Counseling Referral",
        ],
        whatIsIt: "Ang Child Protection Assistance Program naghatag og proteksyon, intervention, referral, ug suporta para sa mga bata nga nag-atubang o anaa sa peligro sa pang-abuso, kapabayaan, o kapintasan.",
        whoIsEligible: [
          "Mga bata nga residente sa Quezon City nga nagkinahanglan og proteksyon.",
          "Mga bata nga nakasinati o anaa sa peligro sa pang-abuso, kapabayaan, o kapintasan.",
          "Mahimong magsumite og aplikasyon ang ginikanan, legal nga guardian, paryente, o tig-report.",
        ],
        childRequirements: [
          "PSA Birth Certificate sa Bata",
          "Katibayan sa Pagpuyo (Proof of Residency)",
          "Medical Certificate / Medico-Legal Report, kung magamit",
          "Social Case Study Report, kung anaa o gikinahanglan",
        ],
        parentRequirements: [
          "QCID o Balido nga ID sa Ginikanan / Guardian / Tig-report",
          "Impormasyon sa Pakig-kontak",
          "Barangay Certificate / Referral, kung magamit",
        ],
        specialRequirements: [
          "Police Blotter / Incident Report, kung magamit",
          "Dokumento gikan sa Korte, kung magamit",
          "Uban pang gikinahanglang dokumento",
        ],
        hasProtectionConcern: true,
        documents: [
          { id: "psaBirthCert", label: "PSA Birth Certificate sa Bata", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
          { id: "parentId", label: "Balido nga ID sa Ginikanan / Nag-report", required: true, sampleImage: "/samples/sample_valid_id.png" },
          { id: "proofResidency", label: "Katibayan sa Pagpuyo (Proof of Residency)", required: true, sampleImage: "/samples/PROOF OF RESIDENCE.webp" },
          { id: "barangayCert", label: "Barangay Certificate / Referral", required: false, sampleImage: "/samples/BARANGAY CERTIFICATE.webp" },
          { id: "caseStudy", label: "Social Case Study Report", required: false },
          { id: "medicoLegal", label: "Medical Certificate / Medico-Legal Report", required: false },
          { id: "policeBlotter", label: "Police Blotter / Incident Report", required: false },
          { id: "courtDocs", label: "Dokumento gikan sa Korte", required: false },
          { id: "otherDocs", label: "Uban pang Gikinahanglang Dokumento", required: false },
        ],
        submitButtonText: "ISUMITE ANG APLIKASYON",
      },
      {
        id: 3,
        key: "emergency-assistance",
        title: "Pang-emerhensya nga Tabang",
        desc: "Naghatag og dinalian nga tabang ug intervention sa mga bata nga nag-atubang og emerhensya o dinaliang panginahanglan, lakip ang medikal, pagkaon, kapasilongan, ug proteksyon.",
        checklists: [
          "Ikaw ba usa ka lehitimong residente sa Quezon City?",
          "Nangayo ba ka og pang-emerhensya nga tabang para sa bata?",
          "Kasamtangan ba nga nakasinati og emerhensya o dinaliang panginahanglan ang bata?",
        ],
        receivedQuestion: "Kasamtangan ba nga anaa sa dinaliang peligro o nagkinahanglan og dinalian nga tabang ang bata? *",
        receivedOptions: ["Oo", "Dili"],
        assistanceTypeLabel: "Pilia ang matang sa tabang *",
        assistanceTypes: [
          "Pang-emerhensya nga Tabang sa Pagkaon",
          "Pang-emerhensya nga Tabang Medikal",
          "Pang-emerhensya nga Tabang sa Transportasyon",
          "Pang-emerhensya nga Kapasilongan",
          "Pang-emerhensya nga Proteksyon / Intervention",
        ],
        whatIsIt: "Ang Emergency Assistance Program naghatag og dinalian nga tabang ug intervention sa mga bata nga nag-atubang og emerhensya o dinaliang panginahanglan, lakip ang medikal, pagkaon, kapasilongan, ug proteksyon.",
        whoIsEligible: [
          "Mga bata nga residente sa Quezon City nga nagkinahanglan og dinalian nga tabang o saklolo.",
          "Mga bata nga nag-atubang og emerhensya nga makaapekto sa ilang kaluwasan, kahimsog, o pangunang panginahanglan.",
          "Mahimong magsumite og hangyo ang ginikanan, legal nga guardian, paryente, o otorisadong tawo.",
        ],
        childRequirements: [
          "PSA Birth Certificate sa Bata",
          "Katibayan sa Pagpuyo (Proof of Residency)",
          "Medical Certificate / Rekord Medikal, kung emerhensyang medikal",
          "Incident Report, kung magamit",
        ],
        parentRequirements: [
          "QCID o Balido nga ID sa Ginikanan / Guardian",
          "Impormasyon sa Pakig-kontak",
          "Barangay Certificate / Referral, kung anaa",
        ],
        specialRequirements: [
          "Police Blotter / Incident Report",
          "Mga Dokumentong Medikal / Ospital",
          "Uban pang gikinahanglang dokumento sa emerhensya",
        ],
        hasEmergencyInfo: true,
        documents: [
          { id: "psaBirthCert", label: "PSA Birth Certificate sa Bata", required: true, sampleImage: "/samples/BIRTH CERTIFICATE OF MINOR.jpg" },
          { id: "parentId", label: "Balido nga ID sa Ginikanan / Guardian", required: true, sampleImage: "/samples/sample_valid_id.png" },
          { id: "proofResidency", label: "Katibayan sa Pagpuyo (Proof of Residency)", required: true, sampleImage: "/samples/PROOF OF RESIDENCE.webp" },
          { id: "barangayCert", label: "Barangay Certificate / Referral", required: false, sampleImage: "/samples/BARANGAY CERTIFICATE.webp" },
          { id: "medicalRecord", label: "Medical Certificate / Medical Record", required: false },
          { id: "policeBlotter", label: "Police Blotter / Incident Report", required: false },
          { id: "otherDocs", label: "Uban pang Gikinahanglang Dokumento", required: false },
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
  const [returnToReview, setReturnToReview] = useState(false)

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  const [attemptedNext, setAttemptedNext] = useState(false)
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [selectedSampleDoc, setSelectedSampleDoc] = useState<{ id: string; label: string; sampleImage?: string; description?: string } | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

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
  const [selectedAssistanceType, setSelectedAssistanceType] = useState<string>("")

  // Sync assistance type when program changes only if not matching
  useEffect(() => {
    if (selectedProgram && selectedAssistanceType && !selectedProgram.assistanceTypes.includes(selectedAssistanceType)) {
      setSelectedAssistanceType("")
    }
  }, [selectedProgramId, language])

  // Step 2: Personal / Beneficiary Information
  const [formData, setFormData] = useState({
    // I. Applicant / Child Information
    qcidNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    nationality: "FILIPINO",
    dobMonth: "",
    dobDay: "",
    dobYear: "",
    age: "",
    sex: "",
    civilStatus: "Single",
    addressHouseNo: "",
    addressStreet: "",
    barangay: "",
    city: "Quezon City",
    contactNo: "",
    email: "",

    // II. Parent / Guardian / Reporting Person
    parentFullName: "",
    parentRelationship: "",
    parentContactNo: "",

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
  })

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
      [docId]: [fileArray[0]],
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
    formData.parentRelationship.trim() !== "" &&
    formData.parentContactNo.trim().length >= 11 &&
    (!selectedProgram.hasProtectionConcern || (formData.reasonForRequest.trim() !== "" && formData.briefDescription.trim() !== "")) &&
    (!selectedProgram.hasEmergencyInfo || (formData.emergencyType.trim() !== "" && formData.emergencyDateTime.trim() !== "" && formData.briefDescription.trim() !== "")) &&
    (!selectedProgram.hasPsychosocialReason || (formData.reasonForRequest.trim() !== "" && formData.briefDescription.trim() !== "")) &&
    (!selectedProgram.hasShelterCareInfo || (formData.reasonForRequest.trim() !== "" && formData.currentLivingSituation.trim() !== "")) &&
    (!selectedProgram.hasParentingReason || (formData.reasonForRequest.trim() !== "" && formData.briefDescription.trim() !== ""))

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

  const handleSubmit = () => {
    if (!formData.certifiedCorrect) {
      setAttemptedNext(true)
      return
    }
    const ref = generateReference(userProfile?.qcidNo)
    setReference(ref)
    setShowConfirmModal(false)
    setSubmissionStage("matching")

    // Dispatch real-time event
    notifyApplicationChange("APPLICATION_SUBMITTED", "child_welfare", ref)

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

        <div className="flex flex-col items-center justify-center gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            {t("autoRedirectCountdown", { seconds: String(redirectCountdown) }) || `Babalik sa aplikasyon sa loob ng ${redirectCountdown} segundo...`}
          </p>
          <button
            type="button"
            onClick={() => {
              ;(window as any).__isFormDirty = false
              window.location.href = "/portal/my-applications"
            }}
            className="w-full max-w-md py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs uppercase tracking-wide"
          >
            VIEW IN APPLICATION HISTORY
          </button>
        </div>
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

              {/* Select Category / Type of Assistance */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-bold text-gray-900 tracking-wide uppercase">
                  SELECT CATEGORY / TYPE OF ASSISTANCE
                </h3>
                <p className={`text-xs font-semibold ${attemptedNext && !selectedAssistanceType ? "text-red-600" : "text-blue-700"}`}>
                  Choose the type of assistance / category *
                </p>
                <div className="relative">
                  <select
                    value={selectedAssistanceType}
                    onChange={(e) => setSelectedAssistanceType(e.target.value)}
                    className={`w-full h-11 rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 cursor-pointer ${
                      attemptedNext && !selectedAssistanceType
                        ? "border-red-500 ring-2 ring-red-100"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">
                      Select Category / Type of Assistance
                    </option>
                    {selectedProgram.assistanceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                {attemptedNext && !selectedAssistanceType && (
                  <p className="text-xs text-red-600 mt-1">
                    Please select an assistance type or category before proceeding.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: PERSONAL INFORMATION ──────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-base font-bold text-gray-900 uppercase">
                  {selectedProgram.title} — {language === "tl" ? "PERSONAL NA IMPORMASYON" : language === "bis" ? "PERSONAL NGA IMPORMASYON" : "PERSONAL INFORMATION"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === "tl"
                    ? "Mangyaring ilagay ang mga kinakailangang impormasyon ng bata o aplikante sa ibaba."
                    : language === "bis"
                    ? "Palihug ibutang ang gikinahanglan nga impormasyon sa bata o aplikante sa ubos."
                    : "Please provide the required personal information of the child or applicant below."}
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

              {/* I. IMPORMASYON NG BATA / APLIKANTE */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  {language === "tl" ? "I. IMPORMASYON NG APLIKANTE / BATA" : language === "bis" ? "I. IMPORMASYON SA APLIKANTE / BATA" : "I. APPLICANT / CHILD INFORMATION"}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      {language === "tl" ? "QC ID (Kung mayroon)" : language === "bis" ? "QC ID (Kung anaa)" : "QC ID (Optional / If available)"}
                    </label>
                    <input
                      type="text"
                      value={formData.qcidNumber}
                      onChange={(e) => updateField("qcidNumber", e.target.value)}
                      placeholder="Hal. 110000184613308"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-semibold ${attemptedNext && !formData.firstName.trim() ? "text-red-600" : "text-gray-700"}`}>
                      {language === "tl" ? "Pangalan (First name) *" : language === "bis" ? "Unang Ngalan (First name) *" : "First Name *"}
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value.toUpperCase())}
                      placeholder="Hal. JUAN"
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 ${
                        attemptedNext && !formData.firstName.trim() ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      {language === "tl" ? "Gitnang Pangalan (Middle name)" : language === "bis" ? "Tunga nga Ngalan (Middle name)" : "Middle Name"}
                    </label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => updateField("middleName", e.target.value.toUpperCase())}
                      placeholder="Hal. SANTOS"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-semibold ${attemptedNext && !formData.lastName.trim() ? "text-red-600" : "text-gray-700"}`}>
                      {language === "tl" ? "Apelyido (Last name) *" : language === "bis" ? "Apelyido (Last name) *" : "Last Name *"}
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value.toUpperCase())}
                      placeholder="Hal. DELA CRUZ"
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 ${
                        attemptedNext && !formData.lastName.trim() ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      {language === "tl" ? "Suffix (Jr., Sr., III, atbp.)" : language === "bis" ? "Suffix (Jr., Sr., III, ug uban pa)" : "Suffix (Jr., Sr., III, etc.)"}
                    </label>
                    <input
                      type="text"
                      value={formData.suffix}
                      onChange={(e) => updateField("suffix", e.target.value)}
                      placeholder="Jr., Sr., III"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      {language === "tl" ? "Nasyonalidad *" : language === "bis" ? "Nasyonalidad *" : "Nationality *"}
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => updateField("nationality", e.target.value.toUpperCase())}
                      placeholder="FILIPINO"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      {language === "tl" ? "Araw ng Kapanganakan (MM/DD/YYYY)" : language === "bis" ? "Adlaw sa Pagkatawo (MM/DD/YYYY)" : "Date of Birth (MM/DD/YYYY)"}
                    </label>
                    <input
                      type="text"
                      value={formData.dobMonth && formData.dobDay && formData.dobYear ? `${formData.dobMonth}/${formData.dobDay}/${formData.dobYear}` : (formData.dobMonth || formData.dobDay || formData.dobYear ? `${formData.dobMonth}/${formData.dobDay}/${formData.dobYear}` : "")}
                      onChange={(e) => {
                        const val = e.target.value
                        const parts = val.split("/")
                        if (parts.length === 3) {
                          updateField("dobMonth", parts[0])
                          updateField("dobDay", parts[1])
                          updateField("dobYear", parts[2])
                        } else {
                          updateField("dobMonth", val)
                        }
                      }}
                      placeholder="MM/DD/YYYY"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      {language === "tl" ? "Edad *" : language === "bis" ? "Edad *" : "Age *"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={formData.age}
                      onChange={(e) => updateField("age", e.target.value)}
                      placeholder="Hal. 5"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      {language === "tl" ? "Kasarian *" : language === "bis" ? "Kasarian *" : "Gender / Sex *"}
                    </label>
                    <select
                      value={formData.sex}
                      onChange={(e) => updateField("sex", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    >
                      <option value="">{language === "tl" ? "Piliin ang Kasarian" : language === "bis" ? "Pilia ang Kasarian" : "Select Gender"}</option>
                      <option value="Male">{language === "tl" ? "Lalaki (Male)" : language === "bis" ? "Lalaki (Male)" : "Male"}</option>
                      <option value="Female">{language === "tl" ? "Babae (Female)" : language === "bis" ? "Babaye (Female)" : "Female"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      {language === "tl" ? "Katayuang Sibil" : language === "bis" ? "Kahimtang Sibil" : "Civil Status"}
                    </label>
                    <select
                      value={formData.civilStatus}
                      onChange={(e) => updateField("civilStatus", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    >
                      <option value="Single">{language === "tl" ? "Walang Asawa (Single)" : language === "bis" ? "Walay Asawa (Single)" : "Single"}</option>
                      <option value="Married">{language === "tl" ? "May Asawa (Married)" : language === "bis" ? "Minyo (Married)" : "Married"}</option>
                      <option value="Widowed">{language === "tl" ? "Balo (Widowed)" : language === "bis" ? "Balo (Widowed)" : "Widowed"}</option>
                      <option value="Separated">{language === "tl" ? "Hiwalay (Separated)" : language === "bis" ? "Bulag (Separated)" : "Separated"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      {language === "tl" ? "Numero ng Telepono" : language === "bis" ? "Numero sa Telepono" : "Contact Number"}
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.contactNo}
                      onChange={(e) => updateField("contactNo", e.target.value.replace(/\D/g, ""))}
                      placeholder="09XXXXXXXXX"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      {language === "tl" ? "Numero ng Bahay / Gusali" : language === "bis" ? "Numero sa Balay / Bilding" : "House / Building Number"}
                    </label>
                    <input
                      type="text"
                      value={formData.addressHouseNo}
                      onChange={(e) => updateField("addressHouseNo", e.target.value)}
                      placeholder="Hal. 123"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      {language === "tl" ? "Kalye (Street)" : language === "bis" ? "Dalan (Street)" : "Street"}
                    </label>
                    <input
                      type="text"
                      value={formData.addressStreet}
                      onChange={(e) => updateField("addressStreet", e.target.value)}
                      placeholder="Hal. Sampaguita St."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      {language === "tl" ? "Barangay" : language === "bis" ? "Barangay" : "Barangay"}
                    </label>
                    <input
                      type="text"
                      value={formData.barangay}
                      onChange={(e) => updateField("barangay", e.target.value)}
                      placeholder="Hal. Sauyo"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
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
                    <label className={`block text-xs font-semibold mb-1 ${attemptedNext && !formData.parentRelationship ? "text-red-600" : "text-gray-700"}`}>
                      {language === "tl" ? "Relasyon sa Bata *" : language === "bis" ? "Relasyon sa Bata *" : "Relationship to Child *"}
                    </label>
                    <select
                      value={formData.parentRelationship}
                      onChange={(e) => updateField("parentRelationship", e.target.value)}
                      className={`w-full h-10 border rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                        attemptedNext && !formData.parentRelationship ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">{language === "tl" ? "Piliin ang Relasyon" : language === "bis" ? "Pilia ang Relasyon" : "Select Relationship"}</option>
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
                    <button type="button" onClick={() => { setReturnToReview(true); setStep(2) }} className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
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
                    <button type="button" onClick={() => { setReturnToReview(true); setStep(2) }} className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
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
                  <button type="button" onClick={() => { setReturnToReview(true); setStep(1) }} className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
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
                  <button type="button" onClick={() => { setReturnToReview(true); setStep(3) }} className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
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
              className={`px-7 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center ${
                canGoNext
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span>{t("nextButton") || "NEXT"}</span>
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
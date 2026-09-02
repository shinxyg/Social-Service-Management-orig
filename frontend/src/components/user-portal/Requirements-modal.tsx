import { X, Info, AlertTriangle } from "lucide-react"
import { useLanguage } from "../ui/language-context"


export interface RequirementSection {
  heading: string
  body?: string
  list?: string[]
  listClassName?: string
  note?: string
  noteList?: string[]
}

export interface RequirementFAQ {
  question: string
  answer: string
}

export interface ProgramRequirements {
  key: string
  programTitle: string
  sections: RequirementSection[]
  slotBannerText?: string
  faqs?: RequirementFAQ[]
}


export const AICS_REQUIREMENTS: Record<string, ProgramRequirements> = {
  aicsMedical: {
    key: "aicsMedical",
    programTitle: "SERVICE REQUIREMENTS FOR THE MEDICAL ASSISTANCE PROGRAM:",
    sections: [
      {
        heading: "I. Ano ang Medical Assistance Program?",
        body:
          "Ang Medical Assistance Program ay nagbibigay ng tulong pinansyal para sa mga residente ng Lungsod Quezon na walang kakayahang tugunan ang mga medikal na pangangailangan tulad ng gamot na hindi available sa Botika ng Bayan.",
      },
      {
        heading: "II. Sino ang kwalipikado sa programa?",
        list: [
          "Mga lehitimong residente ng Lungsod Quezon at mayroong QCID.",
          "Wala o hindi sapat ang kakayahan na tugunan ang mga medikal na pangangailangan.",
        ],
        listClassName: "text-muted-foreground list-decimal",
      },
      {
        heading: "III. Requirements",
        body: "Para sa Pasyente",
        list: [
          "Medical Certificate / Clinical Abstract",
          "Reseta",
          "Barangay Certificate of Indigency",
          "QCID",
        ],
        note:
          "Kung may authorized representative (pinakamalapit na kamag-anak / nearest of kin):",
        noteList: [
          "QCID or Valid ID",
          "Authorization letter nakasaad ang relasyon sa pasyente",
        ],
      },
    ],
  },

  aicsFuneral: {
    key: "aicsFuneral",
    programTitle:
      "SERVICE REQUIREMENTS FOR THE FUNERAL AND BURIAL ASSISTANCE PROGRAM:",
    sections: [
      {
        heading: "I. Ano ang Funeral and Burial Assistance Program?",
        body:
          "Ang Funeral and Burial Assistance Program ay batay sa Ordinansa 2865 S-2019 ay nagbibigay ng tulong pinansyal sa pamamagitan ng Certificate of Guarantee sa accredited partner funeral home ng lungsod.",
      },
      {
        heading: "II. Ano ang kasama sa funeral service package?",
        body:
          "Ang funeral service package ay nakasaad sa Funeral Contract kabilang ang mga sumusunod na serbisyo na hindi lalagpas sa Php25,000:",
        list: [
          "Retrieval of human remains from the place of death (within Quezon City)",
          "Use of white casket (OMS)",
          "Embalming and funeral arrangement of viewing place for a maximum of 7 days",
          "1 standing flower arrangement",
          "1 tarpaulin",
          "Provision of hearse for interment or cremation",
          "Registration of death certificate",
          "Securing of burial / cremation permit",
          "Interment arrangement at city-owned cemetery",
        ],
      },
      {
        heading: "III. Sino ang kwalipikado sa programa?",
        body: "Indigent o mahirap na pamilya ng mga namatay na residente ng lungsod Quezon.",
      },
      {
        heading: "IV. Mga Dokumentong Kailangan",
        list: [
          "Referral Form mula sa barangay, hospital o funeral",
          "Certified True Copy ng Death Certificate",
          "Notarized Funeral Contract (Original Copy; nakatala ang mga serbisyo at ang amount)",
          'Certificate of Indigency (Original Copy; specified for "funeral/burial assistance"; may dry seal at pirmado ng barangay captain o kanyang duly assigned representative)',
          "Photocopy ng Valid Identification (ID) ng deceased at ng Informant, preferably QCID (may photo at signature)",
        ],
      },
    ],
  },

  aicsEducational: {
    key: "aicsEducational",
    programTitle:
      "SERVICE REQUIREMENTS FOR THE EDUCATIONAL ASSISTANCE FOR CHILDREN WITH DISABILITIES:",
    sections: [
      {
        heading: "I. Ano ang Educational Assistance for Children with Disabilities?",
        body:
          "Ang programang ito ay nagbibigay ng tulong-pinansyal sa mga taong may kapansanan upang masuportahan ang gastusing pang edukasyon. Ang halaga ay ₱5,000 para sa bawat kwalipikadong benepisyaryo.",
      },
      {
        heading: "II. Sino ang kwalipikado sa programa?",
        list: [
          "Taga-Quezon City na may rehistradong anak/bata na may kapansanan (may QC PWD ID)",
          "Edad 6 hanggang 30",
          "Kasalukuyang nag-aaral sa pampublikong paaralan mula SPED hanggang Grade 10",
          "Kabilang sa isang mahirap na pamilya na may buwanang kita na ₱13,873 pababa",
        ],
        listClassName: "text-blue-600 list-disc",
      },
      {
        heading: "III. Mga Dokumentong Kailangan",
        list: [
          "Kopya ng pinakabagong school ID o pinakahuling Certificate of Enrollment ng benepisyaryo",
          "Sertipiko ng Indigency na inisyu ng Barangay na nagsasaad ng layunin ng pag-avail ng SSDD Educational Assistance",
          "QC ID/PWD ID",
        ],
      },
      {
        heading: "IV. Mahalagang Paalala",
        list: [
          "Makakatanggap ng halagang ₱5,000 para sa bawat qualified applicant",
          "Ibinibigay lamang ito isang taon bawat pamilya",
          "Bibigyan ng prioridad ang mga aplikanteng hindi pa nakakatanggap ng assistance sa nakalipas na dalawang taon (2)",
        ],
      },
    ],
    faqs: [
      {
        question: "1. Sino ang maaaring makabenipisyo mula sa programang ito?",
        answer: "Kabilang sa isang mahirap na pamilya na may buwanang kita na ₱13,873 pababa.",
      },
      {
        question: "2. Kailangan po ba ng QC ID para maka-avail ng serbisyong ito?",
        answer: "Ang aplikante po ay dapat may QC ID/PWD.",
      },
      {
        question: "3. Ano ang mga kakailanganin na dokumento?",
        answer:
          "Kopya ng pinakabagong school ID o pinakahuling Certificate of Enrollment ng benepisyaryo. Sertipiko ng Indigency na inisyu ng Barangay na nagsasaad ng layunin ng pag-avail ng SSDD Educational Assistance. QC ID/PWD ID.",
      },
      {
        question: "4. Paano mag-sumite ng aplikasyon para sa Educational Assistance Program?",
        answer:
          "Maaaring buksan ang website ng qceservices.quezoncity.gov.ph at pumunta sa porsyon ng SSDD (Social Services Development Department) na nakalagay sa ibabang bahagi ng website. Maaaring kompletuhin ang mga kinakailangang dokumento bago magsumite ng aplikasyon.",
      },
      {
        question: "5. Saan pwedeng i-upload ang mga dokumento?",
        answer:
          "Maaaring i-upload ang mga kinakailangang dokumento sa SSDD portal ng QCEServices (Social Services Development Department).",
      },
      {
        question: "6. Magkano ang matatanggap sa Educational Assistance Program?",
        answer:
          "Makakatanggap ng halagang ₱5,000 para sa bawat qualified applicant. Paalala: ibinibigay lamang ito isang taon bawat pamilya.",
      },
      {
        question: "7. Kung natanggap na po ako ng educational assistance, maaari pa rin po ba akong mag-apply?",
        answer:
          "Bibigyan ng prioridad ang mga aplikanteng hindi pa nakakatanggap ng assistance sa nakalipas na dalawang taon (2).",
      },
    ],
  },
  aicsMaterial: {
    key: "aicsMaterial",
    programTitle: "SERVICE REQUIREMENTS FOR THE MATERIAL ASSISTANCE PROGRAM",
    sections: [
      {
        heading: "I. Ano ang Material Assistance Program?",
        body:
          "Ang Material Assistance Program ay nagbibigay ng tulong sa mga indibidwal o pamilyang nakakaranas ng crisis situation at nangangailangan ng non-food items o pangunahing gamit, depende sa assessment ng social worker.",
      },
      {
        heading: "II. Sino ang maaaring mag-apply?",
        list: [
          "Mga residenteng nangangailangan ng material assistance dahil sa crisis situation.",
          "Mga indibidwal o pamilyang nangangailangan ng basic non-food items.",
        ],
        listClassName: "text-blue-600 list-disc",
      },
      {
        heading: "III. Requirements",
        body: "Para sa Applicant:",
        list: [
          "Barangay Certificate of Indigency / Residency",
          "QCitizen ID o Valid Government-Issued ID",
          "Supporting document, kung applicable",
        ],
        note: "Depende sa uri ng assistance:",
        noteList: [
          "Hygiene Kit",
          "Sleeping Kit",
          "Clothing Assistance",
          "School Supplies",
          "Starter Kit",
          "Assistive Devices",
        ],
      },
    ],
  },
  aicsFood: {
    key: "aicsFood",
    programTitle: "SERVICE REQUIREMENTS FOR THE FOOD ASSISTANCE PROGRAM",
    sections: [
      {
        heading: "I. Ano ang Food Assistance Program?",
        body:
          "Ang Food Assistance Program ay nagbibigay ng tulong sa mga indibidwal o pamilyang nakakaranas ng crisis situation at nangangailangan ng pagkain o food support.",
      },
      {
        heading: "II. Sino ang maaaring mag-apply?",
        list: [
          "Mga residenteng nakakaranas ng crisis situation.",
          "Mga indibidwal o pamilyang nangangailangan ng food assistance.",
        ],
        listClassName: "text-blue-600 list-disc",
      },
      {
        heading: "III. Requirements",
        body: "Para sa Applicant:",
        list: [
          "Barangay Certificate of Indigency / Residency",
          "QCitizen ID o Valid Government-Issued ID",
          "Supporting document, kung applicable",
        ],
        note: "Type of Food Assistance:",
        noteList: [
          "Food Pack",
          "Emergency Food Assistance",
        ],
      },
    ],
  },
  aicsTransportation: {
    key: "aicsTransportation",
    programTitle: "SERVICE REQUIREMENTS FOR THE TRANSPORTATION ASSISTANCE PROGRAM",
    sections: [
      {
        heading: "I. Ano ang Transportation Assistance Program?",
        body:
          "Ang Transportation Assistance Program ay nagbibigay ng tulong sa mga indibidwal o pamilyang nasa crisis situation na nangangailangan ng assistance para sa kanilang paglalakbay, lalo na para sa Balik-Probinsya. Sa QC, maaaring kabilang ang assistance ang pagbili ng ticket at iba pang travel support depende sa assessment.",
      },
      {
        heading: "II. Sino ang maaaring mag-apply?",
        list: [
          "Mga indibidwal o pamilyang nasa crisis situation.",
          "Indigent Quezon City residents na nangangailangan ng transportation assistance.",
        ],
        listClassName: "text-blue-600 list-disc",
      },
      {
        heading: "III. Requirements",
        body: "Para sa Applicant:",
        list: [
          "Barangay Certificate of Residency / Indigency",
          "Valid Government-Issued ID (Preferably QCitizen ID)",
        ],
        note: "Para sa Balik-Probinsya, kung applicable:",
        noteList: [
          "Travel Clearance",
          "Health Certificate / Fit-to-Travel Certificate",
        ],
      },
      {
        heading: "Mahalagang Paalala",
        body:
          "Ang QC guide para sa Balik-Probinsya ay partikular na naglilista ng Barangay Certificate of Residency/Indigency, Travel Clearance, Health Certificate at valid government ID.",
      },
    ],
  },
}

interface RequirementsModalProps {
  requirements: ProgramRequirements
  accepted: boolean
  onAcceptedChange: (checked: boolean) => void
  onContinue: () => void

  showInfoBanner: boolean
  onCloseInfoBanner: () => void

  showSlotBanner: boolean
  onCloseSlotBanner: () => void

  onClose?: () => void
}

export default function RequirementsModal({
  requirements,
  accepted,
  onAcceptedChange,
  onContinue,
  showInfoBanner,
  onCloseInfoBanner,
  showSlotBanner,
  onCloseSlotBanner,
  onClose,
}: RequirementsModalProps) {
  const { t } = useLanguage()

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden relative"
      >
        <div className="p-6 pb-4 border-b border-border shrink-0 flex items-center justify-between gap-4">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            {t("requirementsReviewHeader")}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg p-1"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {(showInfoBanner || (showSlotBanner && requirements.slotBannerText)) && (
          <div className="px-6 pt-4 space-y-3 shrink-0">
            {showInfoBanner && (
              <div className="relative flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm pr-6">
                  <p className="font-semibold text-blue-600">{t("importantReminder")}</p>
                  <p className="text-blue-600/90 mt-0.5">
                    {t("pwdGeneralReminderDesc")}
                  </p>
                </div>
                <button
                  onClick={onCloseInfoBanner}
                  className="absolute top-3 right-3 text-blue-500/60 hover:text-blue-500 cursor-pointer"
                  aria-label={t("close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {showSlotBanner && requirements.slotBannerText && (
              <div className="relative flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm pr-6">
                  <p className="font-semibold text-amber-600">{t("reminderTitle")}</p>
                  <p className="text-amber-600/90 mt-0.5">
                    {requirements.slotBannerText}
                  </p>
                </div>
                <button
                  onClick={onCloseSlotBanner}
                  className="absolute top-3 right-3 text-amber-500/60 hover:text-amber-500 cursor-pointer"
                  aria-label={t("close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="border-t border-border pt-4 space-y-4 text-sm text-foreground">
            <h3 className="font-heading font-semibold">
              {requirements.programTitle}
            </h3>

            {requirements.sections.map((section, i) => (
              <div key={i}>
                <p className="font-semibold mb-1">{section.heading}</p>

                {section.body && (
                  <p className="text-muted-foreground">{section.body}</p>
                )}

                {section.list && (
                  <ul
                    className={`list-inside space-y-0.5 mt-1 ${
                      section.listClassName ?? "text-blue-600 list-disc"
                    }`}
                  >
                    {section.list.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                )}

                {section.note && (
                  <p className="text-muted-foreground mt-3">{section.note}</p>
                )}

                {section.noteList && (
                  <ul className="list-disc list-inside text-blue-600 space-y-0.5 mt-1">
                    {section.noteList.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {requirements.faqs && requirements.faqs.length > 0 && (
              <div>
                <p className="font-semibold mb-2">
                  V. FREQUENTLY ASKED QUESTIONS:
                </p>
                <div className="space-y-3">
                  {requirements.faqs.map((faq, i) => (
                    <div key={i}>
                      <p className="font-semibold text-blue-600">{faq.question}</p>
                      <p className="text-muted-foreground mt-0.5">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-border flex items-center justify-between gap-4 shrink-0">
          <label className="flex items-start gap-2 text-sm select-none text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => onAcceptedChange(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded border-border accent-primary disabled:cursor-not-allowed cursor-pointer"
            />
            {t("requirementsAcceptCheckbox")}
          </label>

          <button
            onClick={onContinue}
            disabled={!accepted}
            className="shrink-0 px-5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-opacity cursor-pointer"
          >
            {t("iUnderstand")}
          </button>
        </div>
      </div>
    </div>
  )
}

// requirements-modal.tsx
//
// Pinagsamang file: (1) yung requirements content ng bawat AICS assistance
// type (Medical, Funeral, atbp.) at (2) yung generic modal component na
// nagre-render nito. Idagdag lang dito ang susunod na program sa
// AICS_REQUIREMENTS kapag kailangan na — hindi na kailangang gumawa ng
// bagong JSX block sa apply-aics.tsx.

import { X, Info, AlertTriangle } from "lucide-react"

// ── Data types ──────────────────────────────────────────────────────────

export interface RequirementSection {
  /** Roman-numeral heading, hal. "I. Ano ang Medical Assistance Program?" */
  heading: string
  /** Optional na paragraph bago o kasama ng list */
  body?: string
  /** Optional bullet/numbered list */
  list?: string[]
  listClassName?: string
  note?: string
  noteList?: string[]
}

export interface ProgramRequirements {
  /** Dapat tumugma sa initialTypeKey (hal. "aicsMedical", "aicsFuneral") */
  key: string
  /** Malaking heading sa taas ng content, hal. "SERVICE REQUIREMENTS FOR THE ..." */
  programTitle: string
  sections: RequirementSection[]
  /** Kung gusto ipakita ang amber "slot" banner (opsyonal) */
  slotBannerText?: string
}

// ── Data ────────────────────────────────────────────────────────────────

export const AICS_REQUIREMENTS: Record<string, ProgramRequirements> = {
  aicsMedical: {
    key: "aicsMedical",
    programTitle: "SERVICE REQUIREMENTS FOR THE MEDICAL ASSISTANCE PROGRAM:",
    slotBannerText:
      "Ang mga available na slot para sa Medical Assistance ay magagamit lamang hanggang December 18, 2025.",
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
}

// ── Component ───────────────────────────────────────────────────────────

interface RequirementsModalProps {
  requirements: ProgramRequirements
  accepted: boolean
  onAcceptedChange: (checked: boolean) => void
  onContinue: () => void

  showInfoBanner: boolean
  onCloseInfoBanner: () => void

  showSlotBanner: boolean
  onCloseSlotBanner: () => void
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
}: RequirementsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 pb-4 border-b border-border shrink-0">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            Mangyaring Suriin ang mga Sumusunod na Dokumentaryong Kinakailangan
            para sa Serbisyong ito
          </h2>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {showInfoBanner && (
            <div className="relative flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm pr-6">
                <p className="font-semibold text-blue-600">MAHALAGANG PAALALA</p>
                <p className="text-blue-600/90 mt-0.5">
                  Mangyaring mag-scroll at basahin ang lahat ng kinakailangan
                  sa ibaba.
                </p>
              </div>
              <button
                onClick={onCloseInfoBanner}
                className="absolute top-3 right-3 text-blue-500/60 hover:text-blue-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {showSlotBanner && requirements.slotBannerText && (
            <div className="relative flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm pr-6">
                <p className="font-semibold text-amber-600">PAALALA</p>
                <p className="text-amber-600/90 mt-0.5">
                  {requirements.slotBannerText}
                </p>
              </div>
              <button
                onClick={onCloseSlotBanner}
                className="absolute top-3 right-3 text-amber-500/60 hover:text-amber-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

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
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-border flex items-center justify-between gap-4 shrink-0">
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => onAcceptedChange(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Tinatanggap at nauunawaan ko ang mga dokumentaryong kinakailangan
            para sa serbisyong ito
          </label>

          <button
            onClick={onContinue}
            disabled={!accepted}
            className="shrink-0 px-5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-opacity"
          >
            I UNDERSTAND
          </button>
        </div>
      </div>
    </div>
  )
}
import { X, Building2, ShieldCheck } from "lucide-react"

export interface ReferralLetterData {
  controlNo?: string
  applicationRef?: string
  patientName: string
  qcidNumber?: string
  barangay?: string
  district?: string
  age?: string | number
  gender?: string
  address?: string
  diagnosis?: string
  hospitalName?: string
  targetAgency: string
  referralReason?: string
  dateIssued?: string
  socialWorkerName?: string
}

export const TARGET_AGENCY_DETAILS: Record<string, { fullName: string; officeAddress: string; focalPerson: string }> = {
  "PCSO": {
    fullName: "PHILIPPINE CHARITY SWEEPSTAKES OFFICE (PCSO)",
    officeAddress: "PCSO Main Office / Medical Services Dept., Conservatory Bldg., Mandaluyong City",
    focalPerson: "CHIEF, MEDICAL SERVICES DEPARTMENT",
  },
  "DSWD": {
    fullName: "DEPARTMENT OF SOCIAL WELFARE AND DEVELOPMENT (DSWD)",
    officeAddress: "Crisis Intervention Unit (CIU), DSWD Central Office, Batasan Hills, Quezon City",
    focalPerson: "OFFICE OF THE SOCIAL WELFARE OFFICER - CIU",
  },
  "DOH": {
    fullName: "DEPARTMENT OF HEALTH (DOH) - MALASAKIT PROGRAM OFFICE",
    officeAddress: "Malasakit Center Operations Center, San Lazaro Compound, Sta. Cruz, Manila",
    focalPerson: "MALASAKIT PROGRAM DESK OFFICER",
  },
  "Charity Hospital": {
    fullName: "ACCREDITED CHARITY & TERTIARY HEALTHCARE FACILITY",
    officeAddress: "Medical Social Services Division",
    focalPerson: "CHIEF MEDICAL SOCIAL WORKER",
  },
}

interface OfficialReferralLetterModalProps {
  data: ReferralLetterData
  onClose: () => void
  canPrint?: boolean
}

export function OfficialReferralLetterModal({
  data,
  onClose,
}: OfficialReferralLetterModalProps) {
  const agencyKey = Object.keys(TARGET_AGENCY_DETAILS).find((k) =>
    (data.targetAgency || "").toUpperCase().includes(k.toUpperCase())
  ) || "PCSO"
  const agencyInfo = TARGET_AGENCY_DETAILS[agencyKey] || TARGET_AGENCY_DETAILS["PCSO"]

  const now = new Date()
  const dateIssuedStr =
    data.dateIssued ||
    now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).toUpperCase()

  const digits = String(data.controlNo || data.applicationRef || "048912").replace(/\D/g, "").slice(-6)
  const finalControlNo = data.controlNo || `QC-SSDD-REF-2026-${digits.padStart(6, "0")}`

  const barangayStr =
    (data.barangay ? `BRGY. ${data.barangay.replace(/^brgy\.?\s*/i, "").toUpperCase()}` : "BRGY. COMMONWEALTH") +
    (data.district ? `, DISTRICT ${data.district}` : ", DISTRICT 2")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #official-referral-letter-print-area, #official-referral-letter-print-area * {
            visibility: visible;
          }
          #official-referral-letter-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Top Control Bar */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">Official Social Service Referral Letter</h3>
              <p className="text-[11px] text-slate-300">Inter-Agency Endorsement Package &bull; Control No: {finalControlNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Printable Area */}
        <div className="overflow-y-auto p-6 sm:p-10 bg-slate-50/50 flex justify-center">
          <div
            id="official-referral-letter-print-area"
            className="w-full bg-white p-8 sm:p-12 rounded-xl shadow-xs border border-slate-200 text-slate-900 text-[13px] leading-relaxed relative"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Header / Seal */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img src="/assets/qc-logo.png" alt="QC Seal" className="w-14 h-14 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                <div>
                  <h4 className="text-[12px] uppercase tracking-widest font-semibold text-slate-700">Republic of the Philippines</h4>
                  <h2 className="text-[18px] font-bold uppercase tracking-wider text-slate-900">Quezon City Government</h2>
                  <h3 className="text-[13px] font-semibold text-slate-800">SOCIAL SERVICES DEVELOPMENT DEPARTMENT (SSDD)</h3>
                  <p className="text-[11px] text-slate-600 font-sans">Quezon City Hall Complex, Elliptical Road, Diliman, Quezon City &bull; (02) 8988-4242</p>
                </div>
                <img src="/assets/ssdd-logo.png" alt="SSDD Seal" className="w-14 h-14 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              </div>
              <div className="mt-4 bg-slate-900 text-white py-1 px-4 inline-block font-sans font-bold text-xs uppercase tracking-widest rounded-xs">
                OFFICIAL INTER-AGENCY REFERRAL LETTER
              </div>
            </div>

            {/* Reference Meta */}
            <div className="flex justify-between items-start text-xs font-sans mb-6">
              <div>
                <p><strong className="text-slate-900">DATE ISSUED:</strong> {dateIssuedStr}</p>
                <p><strong className="text-slate-900">CONTROL NO:</strong> <span className="font-mono font-bold text-blue-900">{finalControlNo}</span></p>
                <p><strong className="text-slate-900">QC ID / APP REF:</strong> <span className="font-mono">{data.qcidNumber || data.applicationRef || "QC-2026-AICS-REF"}</span></p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold px-2 py-0.5 rounded-sm">
                  <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED INDIGENT
                </span>
              </div>
            </div>

            {/* Target Agency Addressee */}
            <div className="mb-6 leading-snug">
              <p className="font-bold text-slate-900">TO:</p>
              <p className="font-bold text-slate-900 uppercase">{agencyInfo.focalPerson}</p>
              <p className="font-semibold text-slate-800">{agencyInfo.fullName}</p>
              <p className="text-slate-600 text-xs italic">{agencyInfo.officeAddress}</p>
            </div>

            {/* Salutation & Body */}
            <div className="space-y-4 text-justify mb-8">
              <p>Dear Sir / Madam:</p>
              <p>
                Greetings from the Social Services Development Department (SSDD) of Quezon City.
              </p>
              <p>
                This is to officially refer and endorse the case of <strong>{data.patientName.toUpperCase()}</strong>
                {data.age ? `, ${data.age} years old` : ""}{data.gender ? `, ${data.gender}` : ""}, a bonafide resident of <strong>{barangayStr}</strong>.
              </p>
              <p>
                Based on our Social Case Assessment and documentary review, the client / patient is currently diagnosed with / receiving medical care for:
              </p>
              
              <div className="bg-slate-50 border-l-4 border-blue-600 p-3 my-2 font-sans">
                <p className="text-xs text-slate-500 font-bold uppercase">Medical Diagnosis / Condition:</p>
                <p className="text-sm font-bold text-slate-900">{data.diagnosis || "Medical Confinement / Hospitalization / Specialty Treatment"}</p>
                {data.hospitalName && (
                  <p className="text-xs text-slate-700 mt-1"><strong>Healthcare Facility / Hospital:</strong> {data.hospitalName}</p>
                )}
              </div>

              <p>
                Due to the extent of the medical expenses and the household's limited financial capability, the requested assistance exceeds the standard local government emergency assistance ceiling. We are respectfully endorsing this case to your good office for favorable consideration and financial augmentation under your Medical / Social Assistance Program.
              </p>

              {data.referralReason && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 my-2 font-sans">
                  <p className="text-xs text-amber-800 font-bold uppercase">Social Worker Case Notes / Assessment:</p>
                  <p className="text-xs text-slate-800 italic mt-0.5">{data.referralReason}</p>
                </div>
              )}

              <p>
                Attached herewith are the verified copies of the patient's Clinical Abstract, Hospital Statement of Account (SOA) / Prescription, Barangay Certificate of Indigency, and Valid QC ID for your perusal.
              </p>
              <p>
                Thank you very much for your continued partnership in serving our marginalized constituents.
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 font-sans">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Assessed & Endorsed by:</p>
                <div className="mt-8 border-b border-slate-900 w-48"></div>
                <p className="font-bold text-xs text-slate-900 mt-1">{data.socialWorkerName || "REGISTERED SOCIAL WORKER (RSW)"}</p>
                <p className="text-[11px] text-slate-500">SSDD Assessment Division &bull; QC Hall</p>
              </div>

              <div className="text-right flex flex-col items-end">
                <p className="text-xs text-slate-500 uppercase font-semibold">Noted & Approved by:</p>
                <div className="mt-8 border-b border-slate-900 w-48"></div>
                <p className="font-bold text-xs text-slate-900 mt-1">EILEEN R. VELASCO, RSW</p>
                <p className="text-[11px] text-slate-500">Officer-in-Charge, SSDD Quezon City</p>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-8 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 font-sans">
              <p>This is an official document generated by the Quezon City Social Services Management System (GovServe).</p>
              <p className="font-mono">VALIDITY: 60 DAYS FROM DATE OF ISSUANCE &bull; VERIFIABLE VIA QC SSDD RECORDS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default OfficialReferralLetterModal

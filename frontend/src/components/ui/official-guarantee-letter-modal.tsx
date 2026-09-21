import { Printer, X, ShieldCheck } from "lucide-react"

export interface GuaranteeLetterData {
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
  hospitalAddress?: string
  hospitalCaseNo?: string
  claimantName?: string
  claimantRelation?: string
  amount?: number
  dateIssued?: string
  validUntil?: string
}

export const PARTNER_HOSPITAL_ADDRESSES: Record<string, string> = {
  "Quezon City General Hospital (QCGH)": "Seminary Road, Project 8, Quezon City",
  "Lung Center of the Philippines": "Quezon Avenue, Diliman, Quezon City",
  "Lung Center of the Philippines (LCP)": "Quezon Avenue, Diliman, Quezon City",
  "National Children’s Hospital": "264 E. Rodriguez Sr. Ave., Quezon City",
  "National Children's Hospital": "264 E. Rodriguez Sr. Ave., Quezon City",
  "National Kidney and Transplant Institute (NKTI)": "East Avenue, Diliman, Quezon City",
  "Heart Center of the Philippines": "East Avenue, Diliman, Quezon City",
  "Philippine Heart Center (PHC)": "East Avenue, Diliman, Quezon City",
  "East Avenue Medical Center": "East Avenue, Diliman, Quezon City",
  "East Avenue Medical Center (EAMC)": "East Avenue, Diliman, Quezon City",
  "Philippine Children’s Medical Center (PCMC)": "Quezon Avenue cor. BIR Road, Diliman, Quezon City",
  "Philippine Children's Medical Center (PCMC)": "Quezon Avenue cor. BIR Road, Diliman, Quezon City",
  "Quirino Memorial Medical Center (QMMC)": "JP Rizal cor. Katipunan Ave., Project 4, Quezon City",
  "St. Luke’s Medical Center – Quezon City": "279 E. Rodriguez Sr. Ave., Kalusugan, Quezon City",
  "St. Luke's Medical Center – Quezon City": "279 E. Rodriguez Sr. Ave., Kalusugan, Quezon City",
  "St. Luke's Medical Center (SLMC - QC)": "279 E. Rodriguez Sr. Ave., Kalusugan, Quezon City",
  "Novaliches District Hospital (NDH)": "Quirino Highway, San Bartolome, Novaliches, Quezon City",
  "Rosario Maclang Bautista General Hospital (RMBGH)": "Batasan Road, Batasan Hills, Quezon City",
}

export function amountInWords(amount: number): string {
  if (amount === 5000) return "FIVE THOUSAND PESOS ONLY"
  if (amount === 10000) return "TEN THOUSAND PESOS ONLY"
  if (amount === 15000) return "FIFTEEN THOUSAND PESOS ONLY"
  if (amount === 20000) return "TWENTY THOUSAND PESOS ONLY"
  if (amount === 25000) return "TWENTY-FIVE THOUSAND PESOS ONLY"
  if (amount === 30000) return "THIRTY THOUSAND PESOS ONLY"
  if (amount === 35000) return "THIRTY-FIVE THOUSAND PESOS ONLY"
  if (amount === 40000) return "FORTY THOUSAND PESOS ONLY"
  if (amount === 50000) return "FIFTY THOUSAND PESOS ONLY"
  if (amount === 100000) return "ONE HUNDRED THOUSAND PESOS ONLY"
  return `${amount.toLocaleString()} PESOS ONLY`
}

interface OfficialGuaranteeLetterModalProps {
  data: GuaranteeLetterData
  onClose: () => void
  canPrint?: boolean
}

export function OfficialGuaranteeLetterModal({
  data,
  onClose,
  canPrint = true,
}: OfficialGuaranteeLetterModalProps) {
  const hospital = data.hospitalName || "EAST AVENUE MEDICAL CENTER (EAMC)"
  const hospitalAddress =
    data.hospitalAddress ||
    PARTNER_HOSPITAL_ADDRESSES[hospital] ||
    "East Avenue, Diliman, Quezon City"

  const now = new Date()
  const dateIssuedStr =
    data.dateIssued ||
    now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).toUpperCase()

  const validUntilDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const validUntilStr =
    data.validUntil ||
    validUntilDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).toUpperCase()

  const digits = String(data.controlNo || data.applicationRef || "048912").replace(/\D/g, "").slice(-6)
  const finalControlNo = data.controlNo || `QC-SSDD-GL-2026-${digits.padStart(6, "0")}`
  const finalSoaNo = data.hospitalCaseNo || `SOA-2026-${digits.padStart(6, "0")}`

  const barangayStr =
    (data.barangay ? `BRGY. ${data.barangay.replace(/^brgy\.?\s*/i, "").toUpperCase()}` : "BRGY. COMMONWEALTH") +
    (data.district ? `, DISTRICT ${data.district}` : ", DISTRICT 2")

  const isMedicineGL =
    String(data.diagnosis || "").toLowerCase().includes("medicine") ||
    String(data.diagnosis || "").toLowerCase().includes("reseta") ||
    String(data.hospitalName || "").toLowerCase().includes("pharmacy") ||
    String(data.controlNo || "").toLowerCase().includes("med")

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-xs text-left"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #official-guarantee-letter-print-area, #official-guarantee-letter-print-area * {
            visibility: visible;
          }
          #official-guarantee-letter-print-area {
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
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-4 overflow-hidden flex flex-col border border-gray-300 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation & Print Top Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isMedicineGL
                ? "Quezon City SSDD • Official Medicine Assistance Voucher / GL"
                : "Quezon City SSDD • Official Guarantee Letter (GL)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {canPrint && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isMedicineGL ? "Print Voucher / GL" : "Print GL"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors cursor-pointer text-xl leading-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Guarantee Letter Document Body */}
        <div id="official-guarantee-letter-print-area" className="p-6 sm:p-8 space-y-4 text-gray-900 bg-white text-xs leading-relaxed overflow-y-auto max-h-[82vh] font-serif print:max-h-none print:overflow-visible print:p-4">
          {/* Header Banner */}
          <div className="border-b-2 border-black pb-3 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-4">
              <img
                src="/gov-serves-seal.png"
                alt="Quezon City Official Seal"
                className="w-16 h-16 object-contain shrink-0"
              />
              <div className="text-center font-sans">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  Republic of the Philippines • Quezon City Government
                </p>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-black">
                  SOCIAL SERVICES DEVELOPMENT DEPARTMENT (SSDD)
                </h1>
                <p className="text-[10px] text-gray-700">
                  City Hall Compound, Elliptical Road, Diliman, Quezon City, Metro Manila
                </p>
              </div>
            </div>
          </div>

          {/* Document Top Metadata */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-b border-gray-400 pb-2.5 pt-1">
            <div>
              <p>
                <span className="font-bold text-gray-700">CONTROL NO. : </span>
                <span className="font-black text-black">{finalControlNo}</span>
              </p>
              <p>
                <span className="font-bold text-gray-700">BARANGAY    : </span>
                <span className="font-semibold">{barangayStr}</span>
              </p>
            </div>
            <div className="text-right">
              <p>
                <span className="font-bold text-gray-700">DATE ISSUED : </span>
                <span className="font-bold">{dateIssuedStr}</span>
              </p>
              <p>
                <span className="font-bold text-gray-700">VALID UNTIL : </span>
                <span className="font-bold text-black">{validUntilStr}</span>
              </p>
            </div>
          </div>

          {/* Addressee */}
          <div className="space-y-0.5 text-xs font-sans pt-1">
            <p className="font-bold text-gray-700 uppercase">
              {isMedicineGL
                ? "TO: THE ACCREDITED PARTNER PHARMACY / HEALTH FACILITY"
                : "TO: THE MEDICAL SOCIAL SERVICES & BILLING DEPARTMENT"}
            </p>
            <p className="font-black text-sm text-slate-900 uppercase">{hospital}</p>
            <p className="text-gray-600 text-[11px]">{hospitalAddress}</p>
          </div>

          {/* Document Title */}
          <div className="text-center py-1.5">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-widest text-black underline underline-offset-4">
              {isMedicineGL ? "GUARANTEE LETTER & MEDICINE VOUCHER" : "GUARANTEE LETTER"}
            </h2>
            <p className="text-[11px] font-bold text-gray-600 mt-0.5 font-sans">
              {isMedicineGL
                ? "(AICS - Medicines & Medical Supplies Assistance)"
                : "(AICS - Medical & Hospitalization Assistance)"}
            </p>
          </div>

          {/* Intro Statement */}
          <div className="space-y-1.5 text-justify text-xs text-gray-900 font-sans">
            <p className="font-semibold">Sir / Madam:</p>
            <p className="leading-relaxed">
              This is to certify that the <strong>QUEZON CITY GOVERNMENT</strong> through the{" "}
              <strong>Social Services Development Department (SSDD)</strong> hereby{" "}
              <strong>GUARANTEES</strong> the payment for the {isMedicineGL ? "prescribed medicines & medical supplies" : "medical/hospitalization expenses"} of the
              patient specified below:
            </p>
          </div>

          {/* Section 1: Patient & Case Information */}
          <div className="border border-black rounded-lg p-3.5 bg-slate-50/50 space-y-1.5 font-sans">
            <div className="text-center pb-1.5 border-b border-gray-300">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                PATIENT &amp; CASE INFORMATION
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <p>
                <span className="font-bold text-gray-600">Patient Name: </span>
                <span className="font-black uppercase text-gray-900">{data.patientName}</span>
              </p>
              <p>
                <span className="font-bold text-gray-600">QC ID / Resident No.: </span>
                <span className="font-mono font-bold text-gray-900">{data.qcidNumber || data.applicationRef || "QC-1100-0094-8211"}</span>
              </p>
              <p>
                <span className="font-bold text-gray-600">Age / Gender: </span>
                <span>{data.age || "54"} Years Old / {data.gender || "Male"}</span>
              </p>
              <p>
                <span className="font-bold text-gray-600">{isMedicineGL ? "Prescription / SOA #: " : "Hospital Case / SOA #: "}</span>
                <span className="font-mono font-semibold">{finalSoaNo}</span>
              </p>
              <p className="sm:col-span-2">
                <span className="font-bold text-gray-600">Permanent Address: </span>
                <span>{data.address || `#12 Sampaguita St., ${barangayStr}, Quezon City`}</span>
              </p>
              <p className="sm:col-span-2">
                <span className="font-bold text-gray-600">{isMedicineGL ? "Medical Condition / Prescription: " : "Medical Diagnosis: "}</span>
                <span className="font-semibold text-slate-900">{data.diagnosis || "Chronic Kidney Disease (Stage 5) / Hemodialysis"}</span>
              </p>
              <p className="sm:col-span-2">
                <span className="font-bold text-gray-600">Authorized Claimant: </span>
                <span className="font-bold">{data.claimantName || data.patientName} {data.claimantRelation ? `(${data.claimantRelation})` : "(Patient / Representative)"}</span>
              </p>
            </div>
          </div>

          {/* Section 2: Approved Financial / Medical Coverage */}
          <div className="border border-black rounded-lg p-3.5 bg-slate-50/50 space-y-1.5 font-sans">
            <div className="text-center pb-1.5 border-b border-gray-300">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                APPROVED FINANCIAL / MEDICAL COVERAGE
              </h3>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <p>
                  <span className="font-bold text-gray-600">ASSISTANCE SCHEME: </span>
                  <span className="font-black text-black text-sm sm:text-base">
                    DIRECT HOSPITAL BILLING GUARANTEE (NON-CASH)
                  </span>
                </p>
                <p className="text-[11px] font-bold text-slate-700">
                  <span className="font-bold text-gray-500">COVERAGE STATUS: </span>
                  <span className="text-emerald-700 font-extrabold uppercase">OFFICIALLY GUARANTEED &amp; APPROVED</span>
                </p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="font-bold text-gray-600 mb-1">COVERED EXPENSES (ON-SITE ASSESSED):</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-gray-800">
                  {isMedicineGL ? (
                    <>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="font-black text-black">[X]</span> Doctor's Prescribed Medicines
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="font-black text-black">[X]</span> Essential Medical Supplies
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="font-black text-black">[X]</span> Maintenance &amp; Critical Drugs
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="font-black text-black">[X]</span> Hospital Confinement / Room &amp; Board
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="font-black text-black">[X]</span> Dialysis / Diagnostic Tests
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="font-black text-black">[X]</span> Medicines &amp; Medical Supplies
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Billing & Claim Instructions */}
          <div className="border border-black rounded-lg p-3 bg-gray-50/60 font-sans text-[11px] space-y-1 text-gray-800">
            <p className="font-bold uppercase tracking-wider text-slate-900">
              BILLING &amp; CLAIM INSTRUCTIONS (ON-SITE PROCESSING):
            </p>
            <ol className="list-decimal pl-4 space-y-0.5 leading-relaxed">
              <li>
                {isMedicineGL
                  ? "Please dispense the doctor-prescribed medicines and medical supplies covered under the Quezon City SSDD healthcare assistance program."
                  : "Please honor this Official Guarantee Letter (GL) and credit the approved medical and hospitalization charges from the patient's final Statement of Account (SOA)."}
              </li>
              <li>
                {isMedicineGL
                  ? "The Pharmacy / Health Facility Billing shall submit the official billing invoice/receipt attached with this original GL to the City Accounting & Treasurer's Office of Quezon City for direct payment processing."
                  : "The Hospital Billing Department & Medical Social Service shall submit the Statement of Account (SOA) attached with this original GL to the City Accounting & Treasurer's Office of Quezon City for direct institutional settlement."}
              </li>
              <li>
                This Guarantee Letter is non-transferable, valid within thirty (30) days from issuance, and subject to on-site hospital verification alongside the patient's valid QC ID.
              </li>
            </ol>
          </div>

          {/* Signatories (Evaluated By & Approved By) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 items-end font-sans">
            {/* Evaluator Signature */}
            <div className="text-center space-y-0.5">
              <p className="text-[10px] font-bold uppercase text-gray-600 mb-8">
                PREPARED &amp; EVALUATED BY:
              </p>
              <div className="w-52 border-b-2 border-black mx-auto" />
              <p className="font-black text-xs uppercase text-black pt-1">MARIA SANTOS, RSW</p>
              <p className="text-[10px] text-gray-700 font-medium">Social Welfare Officer II</p>
              <p className="text-[9.5px] text-gray-500">PRC License No. 0048123</p>
            </div>

            {/* Approver Signature */}
            <div className="text-center space-y-0.5">
              <p className="text-[10px] font-bold uppercase text-gray-600 mb-8">
                APPROVED BY:
              </p>
              <div className="w-52 border-b-2 border-black mx-auto" />
              <p className="font-black text-xs uppercase text-black pt-1">FE P. MACALE</p>
              <p className="text-[10px] text-gray-700 font-medium">SSDD Department Head / City Mayor Rep.</p>
              <p className="text-[9.5px] text-gray-500">Quezon City Government</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-3.5 bg-gray-100 border-t border-gray-300 flex items-center justify-between no-print gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

          {canPrint && (
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Guarantee Letter (GL)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

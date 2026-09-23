import { Printer, X, Pill, Building2 } from "lucide-react"

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
  assistanceType?: string
  isMedicineVoucher?: boolean
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
  if (amount === 500) return "FIVE HUNDRED PESOS ONLY"
  if (amount === 1000) return "ONE THOUSAND PESOS ONLY"
  if (amount === 1500) return "ONE THOUSAND FIVE HUNDRED PESOS ONLY"
  if (amount === 2000) return "TWO THOUSAND PESOS ONLY"
  if (amount === 3000) return "THREE THOUSAND PESOS ONLY"
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
  const isHospital =
    String(data.assistanceType || "").toLowerCase().includes("hospital") ||
    String(data.diagnosis || "").toLowerCase().includes("hospital bill") ||
    String(data.diagnosis || "").toLowerCase().includes("confinement")

  const isMedicineGL =
    !isHospital && (
      data.isMedicineVoucher === true ||
      String(data.assistanceType || "").toLowerCase().includes("medical") ||
      String(data.assistanceType || "").toLowerCase().includes("medicine") ||
      String(data.assistanceType || "").toLowerCase().includes("gamot") ||
      String(data.assistanceType || "").toLowerCase().includes("prescription") ||
      String(data.diagnosis || "").toLowerCase().includes("medical") ||
      String(data.diagnosis || "").toLowerCase().includes("medicine") ||
      String(data.diagnosis || "").toLowerCase().includes("reseta") ||
      String(data.diagnosis || "").toLowerCase().includes("gamot") ||
      String(data.hospitalName || "").toLowerCase().includes("pharmacy") ||
      String(data.hospitalName || "").toLowerCase().includes("mercury") ||
      String(data.controlNo || "").toLowerCase().includes("md") ||
      String(data.controlNo || "").toLowerCase().includes("med")
    )

  const hospital = isMedicineGL
    ? data.hospitalName || "MERCURY DRUG (QUEZON CITY BRANCHES)"
    : data.hospitalName || "EAST AVENUE MEDICAL CENTER (EAMC)"

  const hospitalAddress =
    data.hospitalAddress ||
    PARTNER_HOSPITAL_ADDRESSES[hospital] ||
    (isMedicineGL ? "Accredited Mercury Drug Branches, Quezon City" : "East Avenue, Diliman, Quezon City")

  const now = new Date()
  const dateIssuedStr =
    data.dateIssued ||
    now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).toUpperCase()

  const validUntilDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const validUntilStr =
    data.validUntil ||
    validUntilDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).toUpperCase()

  const digits = String(data.controlNo || data.applicationRef || "048912").replace(/\D/g, "").slice(-6)
  const finalControlNo = data.controlNo || (isMedicineGL ? `QC-MD-GC-2026-${digits.padStart(6, "0")}` : `QC-SSDD-GL-2026-${digits.padStart(6, "0")}`)
  const finalSoaNo = data.hospitalCaseNo || (isMedicineGL ? `RX-2026-${digits.padStart(6, "0")}` : `SOA-2026-${digits.padStart(6, "0")}`)
  const voucherAmount = data.amount || (isMedicineGL ? 500 : 25000)

  const barangayStr =
    (data.barangay ? `BRGY. ${data.barangay.replace(/^brgy\.?\s*/i, "").toUpperCase()}` : "BRGY. COMMONWEALTH") +
    (data.district ? `, DISTRICT ${data.district}` : ", DISTRICT 2")

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
          #official-document-print-area, #official-document-print-area * {
            visibility: visible;
          }
          #official-document-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
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
        className={`bg-white rounded-2xl shadow-2xl w-full my-4 overflow-hidden flex flex-col border border-gray-300 animate-in zoom-in-95 duration-200 ${
          isMedicineGL ? "max-w-4xl" : "max-w-3xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation & Print Top Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            {isMedicineGL ? (
              <Pill className="w-4 h-4 text-emerald-400" />
            ) : (
              <Building2 className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">
              {isMedicineGL
                ? "Quezon City SSDD • Mercury Drug Medicine Gift Certificate"
                : "Quezon City SSDD • Official Hospital Guarantee Letter (GL)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors cursor-pointer text-xl leading-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Container */}
        <div
          id="official-document-print-area"
          className="p-4 sm:p-8 bg-slate-100/50 overflow-y-auto max-h-[84vh] print:max-h-none print:overflow-visible print:p-0 print:bg-white flex items-center justify-center"
        >
          {isMedicineGL ? (
            /* ========================================================================= */
            /* 💊 MERCURY DRUG OFFICIAL GIFT CERTIFICATE (Exact Authentic Reproduction) */
            /* ========================================================================= */
            <div className="w-full max-w-3xl bg-[#fbfbf8] rounded-xl border-4 border-[#dcd6be] shadow-xl p-6 sm:p-8 relative overflow-hidden text-slate-900 select-none print:border-2 print:shadow-none print:m-0">
              {/* Background Guilloche Security Pattern & Watermarks */}
              <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#b89c56_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Central Classical Hermes Watermark Emblem */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]">
                <img
                  src="/gov-serves-seal.png"
                  alt="Watermark Seal"
                  className="w-80 h-80 object-contain grayscale"
                />
              </div>

              {/* Decorative Guilloche Top Arch Line */}
              <div className="w-full h-4 relative mb-4 border-t-2 border-b-2 border-[#d0c69d] rounded-t-full bg-gradient-to-r from-transparent via-[#f3edd4] to-transparent opacity-80" />

              {/* Header: Mercury Drug Brand Logo & Value Badge */}
              <div className="flex items-start justify-between relative z-10 gap-4">
                {/* Mercury Drug Brand Block */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[#d32f2f] rounded-lg p-1.5 flex items-center justify-center shadow-xs border border-red-700">
                    <svg viewBox="0 0 24 24" className="w-full h-full fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2a4 4 0 00-4 4v1H6a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2V6a4 4 0 00-4-4zm0 2a2 2 0 012 2v1h-4V6a2 2 0 012-2zm-1 7h2v3h3v2h-3v3h-2v-3H8v-2h3v-3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-sans font-black text-xl sm:text-2xl text-[#d32f2f] tracking-tight lowercase">
                        mercury drug
                      </span>
                    </div>
                    <p className="text-[7.5px] sm:text-[8.5px] font-sans font-bold uppercase tracking-widest text-slate-600">
                      NAKASISIGURO GAMOT AY LAGING BAGO
                    </p>
                  </div>
                </div>

                {/* Top-Right Value Badge */}
                <div className="text-right">
                  <span className="font-serif italic font-bold text-2xl sm:text-3xl text-indigo-950 tracking-tight">
                    ₱{voucherAmount.toLocaleString()}
                  </span>
                  <span className="block text-[8px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
                    PESOS VALUE
                  </span>
                </div>
              </div>

              {/* Main Title Banner */}
              <div className="text-center my-6 sm:my-8 relative z-10">
                <h1 className="font-serif font-normal text-2xl sm:text-3xl text-slate-800 tracking-wide">
                  Mercury Drug Gift Certificate
                </h1>
                <p className="text-[9px] sm:text-[10px] font-sans uppercase font-bold tracking-widest text-slate-500 mt-1">
                  QUEZON CITY SOCIAL SERVICES DEVELOPMENT DEPARTMENT (SSDD) • AICS MEDICINE ASSISTANCE
                </p>
              </div>

              {/* Certificate Main Body Entitlement */}
              <div className="my-6 space-y-4 text-center font-serif text-sm sm:text-base text-slate-800 relative z-10">
                <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
                  <span className="font-normal text-slate-600">This certificate entitles</span>
                  <span className="font-bold uppercase text-slate-950 font-sans tracking-wide border-b-2 border-slate-700 px-3 min-w-[220px] sm:min-w-[320px] inline-block text-center text-sm sm:text-base">
                    {data.patientName}
                  </span>
                  <span className="font-normal text-slate-600">or bearer</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-sans">
                  <span className="font-serif text-slate-600 text-sm sm:text-base">to a</span>
                  <span className="inline-flex items-center gap-1 bg-white border border-slate-300 px-3 py-1 rounded-md shadow-2xs font-mono font-black text-base sm:text-lg text-red-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block mr-1" />
                    ₱{voucherAmount.toLocaleString()}.00
                  </span>
                  <span className="font-serif text-slate-600 text-sm sm:text-base">
                    worth of purchase on a one-time basis at Mercury Drug
                  </span>
                </div>
              </div>

              {/* Bottom Security Guilloche Waves Border */}
              <div className="my-6 w-full h-6 bg-gradient-to-r from-blue-100 via-indigo-100 to-blue-100 border-y border-indigo-300 rounded flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(45deg,#3b82f6,#3b82f6_6px,#e0e7ff_6px,#e0e7ff_12px)]" />
                <span className="relative z-10 text-[8px] font-mono uppercase tracking-widest text-indigo-900 font-extrabold">
                  QUEZON CITY GOVERNMENT HEALTHCARE &amp; PHARMACY SUBSIDY • NON-CONVERTIBLE TO CASH
                </span>
              </div>

              {/* Footer: Large Embossed Amount, Barcode, Serial, Signatures */}
              <div className="flex flex-col sm:flex-row items-end justify-between gap-4 pt-2 relative z-10">
                {/* Left: Large Gold Denomination */}
                <div className="text-left">
                  <span className="font-serif font-black text-4xl sm:text-5xl text-[#c49a38] tracking-tighter opacity-90 drop-shadow-xs">
                    {voucherAmount.toLocaleString()}
                  </span>
                  <p className="text-[8px] font-sans font-bold text-slate-500 uppercase mt-0.5">
                    Authorized Medical Voucher
                  </p>
                </div>

                {/* Center: Signatories */}
                <div className="text-center font-sans text-[9px] space-y-0.5">
                  <p className="font-bold text-slate-700 uppercase">HON. MA. JOSEFINA G. BELMONTE</p>
                  <p className="text-[8px] text-slate-500">City Mayor, Quezon City</p>
                  <p className="text-[7.5px] text-emerald-700 font-bold">✓ Validated by QC SSDD Medical Assistance Section</p>
                </div>

                {/* Right: Security Barcode & Control Serial */}
                <div className="text-right flex flex-col items-end">
                  {/* Real Simulated Barcode SVG */}
                  <div className="bg-white px-2 py-1 border border-slate-300 rounded shadow-2xs">
                    <svg className="w-36 h-8" viewBox="0 0 144 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" width="2" height="26" fill="#1e293b"/>
                      <rect x="6" width="4" height="26" fill="#1e293b"/>
                      <rect x="12" width="2" height="26" fill="#1e293b"/>
                      <rect x="16" width="3" height="26" fill="#1e293b"/>
                      <rect x="22" width="1" height="26" fill="#1e293b"/>
                      <rect x="26" width="4" height="26" fill="#1e293b"/>
                      <rect x="32" width="2" height="26" fill="#1e293b"/>
                      <rect x="36" width="3" height="26" fill="#1e293b"/>
                      <rect x="42" width="2" height="26" fill="#1e293b"/>
                      <rect x="46" width="1" height="26" fill="#1e293b"/>
                      <rect x="50" width="4" height="26" fill="#1e293b"/>
                      <rect x="56" width="2" height="26" fill="#1e293b"/>
                      <rect x="62" width="3" height="26" fill="#1e293b"/>
                      <rect x="68" width="1" height="26" fill="#1e293b"/>
                      <rect x="72" width="4" height="26" fill="#1e293b"/>
                      <rect x="78" width="2" height="26" fill="#1e293b"/>
                      <rect x="84" width="3" height="26" fill="#1e293b"/>
                      <rect x="90" width="2" height="26" fill="#1e293b"/>
                      <rect x="94" width="4" height="26" fill="#1e293b"/>
                      <rect x="102" width="2" height="26" fill="#1e293b"/>
                      <rect x="108" width="3" height="26" fill="#1e293b"/>
                      <rect x="114" width="1" height="26" fill="#1e293b"/>
                      <rect x="118" width="4" height="26" fill="#1e293b"/>
                      <rect x="126" width="2" height="26" fill="#1e293b"/>
                      <rect x="132" width="3" height="26" fill="#1e293b"/>
                      <rect x="138" width="2" height="26" fill="#1e293b"/>
                    </svg>
                    <span className="block font-mono text-[8px] font-bold text-slate-700 tracking-wider text-center">
                      {finalControlNo}
                    </span>
                  </div>
                  <span className="text-[7.5px] font-mono text-slate-400 mt-0.5">
                    VALID UNTIL: {validUntilStr}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 🏥 OFFICIAL HOSPITAL GUARANTEE LETTER (GL) (Hospital Bill / Confinement) */
            /* ========================================================================= */
            <div className="w-full bg-white rounded-xl p-6 sm:p-8 space-y-4 text-gray-900 text-xs leading-relaxed font-serif">
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
                  TO: THE MEDICAL SOCIAL SERVICES &amp; BILLING DEPARTMENT
                </p>
                <p className="font-black text-sm text-slate-900 uppercase">{hospital}</p>
                <p className="text-gray-600 text-[11px]">{hospitalAddress}</p>
              </div>

              {/* Document Title */}
              <div className="text-center py-1.5">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-widest text-black underline underline-offset-4">
                  OFFICIAL GUARANTEE LETTER (GL)
                </h2>
                <p className="text-[11px] font-bold text-gray-600 mt-0.5 font-sans">
                  (AICS - Medical Confinement, Dialysis &amp; Hospital Bill Assistance)
                </p>
              </div>

              {/* Intro Statement */}
              <div className="space-y-1.5 text-justify text-xs text-gray-900 font-sans">
                <p className="font-semibold">Sir / Madam:</p>
                <p className="leading-relaxed">
                  This is to certify that the <strong>QUEZON CITY GOVERNMENT</strong> through the{" "}
                  <strong>Social Services Development Department (SSDD)</strong> hereby{" "}
                  <strong>GUARANTEES</strong> the payment for the medical and hospitalization expenses of the patient specified below:
                </p>
              </div>

              {/* Patient Info Card */}
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
                    <span className="font-bold text-gray-600">Hospital Case / SOA #: </span>
                    <span className="font-mono font-semibold">{finalSoaNo}</span>
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-bold text-gray-600">Permanent Address: </span>
                    <span>{data.address || `#12 Sampaguita St., ${barangayStr}, Quezon City`}</span>
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-bold text-gray-600">Medical Diagnosis: </span>
                    <span className="font-semibold text-slate-900">{data.diagnosis || "Chronic Kidney Disease (Stage 5) / Hemodialysis"}</span>
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-bold text-gray-600">Authorized Claimant: </span>
                    <span className="font-bold">{data.claimantName || data.patientName} {data.claimantRelation ? `(${data.claimantRelation})` : "(Patient / Representative)"}</span>
                  </p>
                </div>
              </div>

              {/* Coverage Card */}
              <div className="border border-black rounded-lg p-3.5 bg-slate-50/50 space-y-1.5 font-sans">
                <div className="text-center pb-1.5 border-b border-gray-300">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                    APPROVED FINANCIAL &amp; MEDICAL COVERAGE
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
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="font-black text-black">[X]</span> Hospital Confinement / Room &amp; Board
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="font-black text-black">[X]</span> Dialysis / Diagnostic Tests
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="font-black text-black">[X]</span> Medicines &amp; Medical Supplies
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Claim Instructions */}
              <div className="border border-black rounded-lg p-3 bg-gray-50/60 font-sans text-[11px] space-y-1 text-gray-800">
                <p className="font-bold uppercase tracking-wider text-slate-900">
                  BILLING &amp; CLAIM INSTRUCTIONS (ON-SITE PROCESSING):
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 leading-relaxed">
                  <li>
                    Please honor this Official Guarantee Letter (GL) and credit the approved medical and hospitalization charges from the patient's final Statement of Account (SOA).
                  </li>
                  <li>
                    The Hospital Billing Department &amp; Medical Social Service shall submit the Statement of Account (SOA) attached with this original GL to the City Accounting &amp; Treasurer's Office of Quezon City for direct institutional settlement.
                  </li>
                  <li>
                    This Guarantee Letter is non-transferable, valid within sixty (60) days from issuance, and subject to on-site hospital verification alongside the patient's valid QC ID.
                  </li>
                </ol>
              </div>

              {/* Signatories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 items-end font-sans">
                <div className="text-center space-y-0.5">
                  <p className="text-[10px] font-bold uppercase text-gray-600 mb-8">
                    PREPARED &amp; EVALUATED BY:
                  </p>
                  <div className="w-52 border-b-2 border-black mx-auto" />
                  <p className="font-black text-xs uppercase text-black pt-1">MARIA SANTOS, RSW</p>
                  <p className="text-[10px] text-gray-700 font-medium">Social Welfare Officer II</p>
                  <p className="text-[9.5px] text-gray-500">PRC License No. 0048123</p>
                </div>

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
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-3.5 bg-gray-100 border-t border-gray-300 flex items-center justify-end no-print gap-3">
          {canPrint && (
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isMedicineGL ? "Print Mercury Drug Gift Certificate" : "Print Guarantee Letter (GL)"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

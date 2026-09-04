import React, { useState, useEffect } from "react"
import {
  Check,
  X,
  Eye,
  FileText,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Paperclip,
  Landmark,
  Image as ImageIcon,
  HeartHandshake,
  IdCard,
  Printer,
} from "lucide-react"
import { API_BASE } from "../../config/api"

// ---- Types for collected form data from user submissions ----
interface ApplicationDocument {
  name: string
  filename?: string
  fileUrl?: string
  file?: File
  uploadedAt: string
  status: "verified" | "pending" | "rejected"
}

interface PWDApplicationSubmission {
  id: string
  submittedAt: string
  referenceNumber: string
  category: "PWD"
  type: "new" | "renewal" | "loss" | "assistance"

  // Personal Info
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  dateOfBirth: string
  age?: number | string
  sex: string
  civilStatus: string

  // Contact & Address
  contactNo: string
  email: string
  address: string

  // Disability Info
  disabilityType: string
  disabilityClass: "apparent" | "non-apparent" | string
  causeOfDisability: string

  // Family Member (if applicable)
  applyingFor?: "myself" | "family"
  familyMemberName?: string
  familyRelationship?: string

  // Documents
  documents: ApplicationDocument[]

  // Admin Review
  status: "pending" | "approved" | "rejected" | "needs_revision"
  assignedIdNumber?: string
  rejectionReason?: string
  approvedBy?: string
  approvedDate?: string
  notes?: string
}

interface SeniorCitizenApplicationSubmission {
  id: string
  submittedAt: string
  referenceNumber: string
  category: "Senior Citizen"
  type: "new" | "renewal" | "loss" | "medicine-booklet" | "movie-booklet" | "social-assistance"

  // Personal Info
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  dateOfBirth: string
  age?: number | string
  sex: string
  civilStatus: string

  // Contact & Address
  cellphoneNo: string
  email: string
  address: string

  // Vaccination Info
  vaccinatedCovid: string

  // Family Member (if applicable)
  applyingFor?: "myself" | "family"
  familyMemberName?: string
  familyRelationship?: string

  // Documents
  documents: ApplicationDocument[]

  // Admin Review
  status: "pending" | "approved" | "rejected" | "needs_revision"
  assignedIdNumber?: string
  rejectionReason?: string
  approvedBy?: string
  approvedDate?: string
  notes?: string
}

type ApplicationSubmission = PWDApplicationSubmission | SeniorCitizenApplicationSubmission

function isPWD(app: ApplicationSubmission): app is PWDApplicationSubmission {
  return (
    String(app.category || "").toUpperCase() === "PWD" ||
    String(app.category || "").toLowerCase().includes("disability")
  )
}

function generateOfficialIdNumber(app: ApplicationSubmission): string {
  if (app.assignedIdNumber && app.assignedIdNumber !== app.referenceNumber && !app.assignedIdNumber.startsWith("11000011")) {
    return app.assignedIdNumber
  }

  const cleanDigits = (app.referenceNumber || app.id || "").replace(/\D/g, "")
  const seq = cleanDigits.length >= 6 ? cleanDigits.slice(-6) : String(Math.floor(100000 + Math.random() * 900000))
  const year = new Date().getFullYear()

  if (isPWD(app)) {
    return `PWD-137404-${year}-${seq}`
  } else {
    return `OSCA-137404-${year}-${seq}`
  }
}



// =====================================================================================
// Design Tokens & GovServe Styles (Identical to Solo Parent & Child Welfare)
// =====================================================================================
const Tokens = React.memo(function Tokens() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

      .gw-root {
        --ink: #0f172a; --ink-soft: #6b7280; --ink-faint: #94a3b8;
        --paper: #f9fafb; --surface: #ffffff; --surface-sunk: #f1f3f5;
        --line: #e5e7eb; --line-soft: #eef0f2;
        --plum: #2563eb; --plum-ink: #1d4ed8; --plum-soft: #eaf1ff; --plum-line: #c7dbff;
        --brick: #0284c7; --brick-ink: #0369a1; --brick-soft: #e0f2fe; --brick-line: #bae6fd;
        --gold: #f59e0b; --gold-ink: #b45309; --gold-soft: #fef6e7; --gold-line: #fde7be;
        --forest: #22c55e; --forest-ink: #15803d; --forest-soft: #e9fbef; --forest-line: #bbf7d0;
        --redwood: #ef4444; --redwood-ink: #b91c1c; --redwood-soft: #fdeded; --redwood-line: #fcc9c9;
        --shadow-soft: 0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.06);
        --shadow-medium: 0 4px 6px rgba(15,23,42,.05), 0 10px 15px rgba(15,23,42,.08);
        font-family: 'Inter', sans-serif; color: var(--ink); background: var(--paper);
      }
      .gw-serif { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; letter-spacing: -0.01em; }
      .gw-mono { font-family: 'Inter', sans-serif; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }

      .gw-eyebrow { font-family: 'Inter', sans-serif; font-size: .68rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-faint); }

      /* pennant tags */
      .gw-tag { display: inline-flex; align-items: center; gap: .4rem; padding: .34rem .85rem .34rem .65rem; font-size: .68rem; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; color: #fff; white-space: nowrap; clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%); }
      .gw-tag--pwd { background: var(--plum); }
      .gw-tag--senior { background: #0284c7; }
      .gw-tag--ghost { background: var(--surface-sunk); color: var(--ink-soft); border: 1px solid var(--line); clip-path: none; padding: .34rem .7rem; border-radius: 8px; }
      .gw-tag--btn { cursor: pointer; border: none; opacity: .5; transition: opacity .15s, transform .1s; }
      .gw-tag--btn:hover { opacity: .8; }
      .gw-tag--btn.is-active { opacity: 1; }

      /* stamp dots */
      .gw-dot { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
      .gw-dot--pending { background: var(--gold-soft); border: 2px dashed var(--gold); }
      .gw-dot--approved { background: var(--forest); }
      .gw-dot--rejected { background: var(--redwood); }
      .gw-dot--revision { background: var(--surface); border: 2px dashed var(--ink-faint); }

      .gw-status { display: inline-flex; align-items: center; gap: .5rem; font-size: .76rem; font-weight: 600; }
      .gw-status--pending { color: var(--gold-ink); }
      .gw-status--approved { color: var(--forest-ink); }
      .gw-status--rejected { color: var(--redwood-ink); }
      .gw-status--revision { color: var(--ink-soft); }

      .gw-card { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; box-shadow: var(--shadow-soft); transition: box-shadow .15s ease, transform .15s ease; }
      .gw-card:hover { box-shadow: var(--shadow-medium); transform: translateY(-1px); }
      .gw-card--pwd { border-left: 4px solid var(--plum); }
      .gw-card--senior { border-left: 4px solid #0284c7; }

      .gw-avatar { display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #fff; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; }
      .gw-avatar--pwd { background: linear-gradient(135deg, var(--plum), var(--plum-ink)); }
      .gw-avatar--senior { background: linear-gradient(135deg, #0284c7, #0369a1); }

      .gw-btn-primary { background: var(--plum); color: #fff; border: 1px solid var(--plum); border-radius: 12px; font-weight: 600; box-shadow: var(--shadow-soft); transition: background .15s, transform .15s; }
      .gw-btn-primary:hover { background: var(--plum-ink); transform: translateY(-1px); }
      .gw-btn-ghost { background: var(--surface); color: var(--ink); border: 1px solid var(--line); border-radius: 12px; font-weight: 600; transition: background .15s, transform .15s; }
      .gw-btn-ghost:hover { background: var(--surface-sunk); transform: translateY(-1px); }
      .gw-btn-approve { background: var(--forest); color: #fff; border: 1px solid var(--forest); border-radius: 12px; font-weight: 600; box-shadow: var(--shadow-soft); transition: background .15s, transform .15s; }
      .gw-btn-approve:hover { background: var(--forest-ink); transform: translateY(-1px); }
      .gw-btn-reject { background: var(--redwood); color: #fff; border: 1px solid var(--redwood); border-radius: 12px; font-weight: 600; box-shadow: var(--shadow-soft); transition: background .15s, transform .15s; }
      .gw-btn-reject:hover { background: var(--redwood-ink); transform: translateY(-1px); }

      .gw-input { background: var(--surface-sunk); border: 1px solid var(--line); border-radius: 10px; color: var(--ink); }
      .gw-input:focus { outline: none; border-color: var(--plum); box-shadow: 0 0 0 3px var(--plum-soft); }
      .gw-input::placeholder { color: var(--ink-faint); }

      .gw-section-num { font-family: 'Inter', sans-serif; font-weight: 700; font-size: .68rem; color: var(--plum-ink); background: var(--plum-soft); padding: .2rem .5rem; border-radius: 6px; }
      .gw-section-rule { height: 1px; background: var(--line); flex: 1; }

      .gw-stat { background: var(--surface); border: 1px solid var(--line); border-top: 3px solid var(--stat-color, var(--ink)); border-radius: 16px; box-shadow: var(--shadow-soft); }
    `}</style>
  )
})

function displayName(app: ApplicationSubmission) {
  return [app.firstName, app.middleName, app.lastName, app.suffix]
    .filter(Boolean)
    .filter((s) => s !== "null" && s !== "undefined")
    .join(" ")
}

function initials(app: ApplicationSubmission) {
  const f = app.firstName ? app.firstName.charAt(0) : "P"
  const l = app.lastName ? app.lastName.charAt(0) : "S"
  return `${f}${l}`.toUpperCase()
}

function subLabelForApp(app: ApplicationSubmission) {
  const type = String(app.type || "").toLowerCase()
  if (isPWD(app)) {
    switch (type) {
      case "new": return "New ID Application"
      case "renewal": return "ID Renewal"
      case "loss":
      case "replacement": return "Lost ID Replacement"
      case "assistance": return "PWD Social Assistance"
      default: return "PWD Application"
    }
  } else {
    switch (type) {
      case "new": return "New Senior ID"
      case "renewal": return "Senior ID Renewal"
      case "loss":
      case "replacement": return "Lost ID Replacement"
      case "medicine-booklet": return "Medicine Discount Booklet"
      case "movie-booklet": return "Free Movie Booklet"
      case "social-assistance":
      case "assistance": return "Senior Social Assistance"
      default: return "Senior Citizen Application"
    }
  }
}

const statusMeta = {
  pending: { dot: "gw-dot--pending", text: "gw-status--pending", label: "Pending" },
  approved: { dot: "gw-dot--approved", text: "gw-status--approved", label: "Approved" },
  rejected: { dot: "gw-dot--rejected", text: "gw-status--rejected", label: "Rejected" },
  needs_revision: { dot: "gw-dot--revision", text: "gw-status--revision", label: "Needs Revision" },
} as const

function StatusBadge({ status }: { status: ApplicationSubmission["status"] }) {
  const m = statusMeta[status] ?? statusMeta.pending
  return (
    <span className={`gw-status ${m.text}`}>
      <span className={`gw-dot ${m.dot}`} />
      {m.label}
    </span>
  )
}

function CategoryTag({ category }: { category: ApplicationSubmission["category"] }) {
  return <span className={`gw-tag ${category === "PWD" ? "gw-tag--pwd" : "gw-tag--senior"}`}>{category}</span>
}

function SectionHeading({ icon, number, children }: { icon: React.ReactNode; number: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="gw-section-num">{number}</span>
      <span style={{ color: "var(--ink-faint)" }}>{icon}</span>
      <h3 className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>{children}</h3>
      <span className="gw-section-rule" />
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>{label}</p>
      <p className="font-medium mt-1 text-sm" style={{ color: "var(--ink)" }}>{value || "—"}</p>
    </div>
  )
}

function getDocImageUrl(doc: ApplicationDocument | null): string {
  if (!doc) return ""
  if (doc.fileUrl && (doc.fileUrl.startsWith("data:image") || doc.fileUrl.startsWith("http") || doc.fileUrl.startsWith("/"))) {
    return doc.fileUrl
  }

  const name = (doc.name || doc.filename || "").toLowerCase()
  if (name.includes("loss") || name.includes("affidavit")) return "/samples/AFFIDAVIT OF LOSS.webp"
  if (name.includes("2x2") || name.includes("picture (2x2)") || name.includes("id picture") || name.includes("id photo") || name.includes("1x1")) return "/samples/ID PICTURE (2X2).webp"
  if (name.includes("whole body") || name.includes("body")) return "/samples/WHOLE BODY.jpg"
  if (name.includes("signature") || name.includes("pirma")) return "/samples/SIGNATURE.avif"
  if (name.includes("disability") || name.includes("medical") || name.includes("certificate of disability")) return "/samples/CERTIFICATE OF DISABILITY.jpg"
  if (name.includes("residence") || name.includes("residency")) return "/samples/PROOF OF RESIDENCE.webp"
  if (name.includes("barangay")) return "/samples/BARANGAY CERTIFICATE.webp"
  if (name.includes("birth") || name.includes("psa")) return "/samples/BIRTH CERTIFICATE OF MINOR.jpg"
  if (name.includes("gov") || name.includes("valid id") || name.includes("government")) return "/samples/sample_valid_id.png"
  if (name.includes("qc id") || name.includes("pwd id")) return "/samples/QC ID NG PERSON WITH DISABILITY.jpg"

  return "/samples/sample_valid_id.png"
}

function DocumentViewerModal({
  doc,
  onClose,
}: {
  doc: ApplicationDocument | null
  onClose: () => void
}) {
  if (!doc) return null
  const imageUrl = getDocImageUrl(doc)

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.65)" }}>
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-gray-200 shrink-0 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">{doc.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{doc.filename || doc.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl font-light leading-none p-1 cursor-pointer">×</button>
        </div>

        <div className="p-6 overflow-y-auto flex items-center justify-center bg-slate-100/60 min-h-[360px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={doc.name}
              className="max-h-[60vh] max-w-full rounded-xl border border-border shadow-md object-contain bg-white"
            />
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-muted-foreground w-full max-w-sm border border-border">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-semibold">{doc.name}</p>
              <p className="text-xs mt-1">Uploaded document on file.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-6 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}

function OfficialIdCardModal({
  app,
  onClose,
}: {
  app: ApplicationSubmission | null
  onClose: () => void
}) {
  if (!app) return null
  const isPwdApp = isPWD(app)
  const idNumber = generateOfficialIdNumber(app)
  const appDate = new Date(app.approvedDate || app.submittedAt || Date.now()).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const [activeSide, setActiveSide] = useState<"front" | "back">("front")

  const handlePrint = () => {
    window.print()
  }

  const photoDoc = (app.documents || []).find(
    (d) =>
      (d.name || "").toLowerCase().includes("2x2") ||
      (d.name || "").toLowerCase().includes("picture") ||
      (d.filename || "").toLowerCase().includes("2x2") ||
      (d.filename || "").toLowerCase().includes("picture")
  )
  const photoUrl = photoDoc ? getDocImageUrl(photoDoc) : "/samples/ID PICTURE (2X2).webp"

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.7)" }}>
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <IdCard className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-none">
                Official Quezon City {isPwdApp ? "Persons with Disability (PWD) ID Card" : "Senior Citizen OSCA ID Card"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-1">
                Card ID: <span className="font-mono font-bold text-blue-700">{idNumber}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl font-light leading-none p-1 cursor-pointer">×</button>
        </div>

        {/* Side Selector */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveSide("front")}
            className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeSide === "front" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            FRONT OF ID CARD
          </button>
          <button
            onClick={() => setActiveSide("back")}
            className={`pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeSide === "back" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            BACK OF ID CARD (PRIVILEGES &amp; EMERGENCY)
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 bg-slate-100/80 flex flex-col items-center justify-center overflow-y-auto">
          {activeSide === "front" ? (
            /* FRONT CARD */
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden shadow-lg border border-slate-300 relative bg-white select-none"
              style={{
                aspectRatio: "1.586 / 1",
                background: isPwdApp
                  ? "linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #eff6ff 100%)"
                  : "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f0fdf4 100%)",
              }}
            >
              {/* Header */}
              <div className={`px-4 py-2.5 flex items-center justify-between text-white ${isPwdApp ? "bg-[#1d4ed8]" : "bg-[#0369a1]"}`}>
                <div>
                  <p className="text-[8px] font-bold tracking-widest uppercase opacity-90 leading-tight">Republic of the Philippines</p>
                  <p className="text-xs font-black tracking-wide leading-tight uppercase">Quezon City Government</p>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {isPwdApp ? "PDAO CARD" : "OSCA CARD"}
                </span>
              </div>

              {/* Sub-header */}
              <div className={`py-1 text-center text-[10px] font-black uppercase tracking-widest ${isPwdApp ? "bg-amber-400 text-slate-900" : "bg-emerald-600 text-white"}`}>
                {isPwdApp ? "Persons with Disability Affairs Office" : "Office for Senior Citizens Affairs"}
              </div>

              {/* Details */}
              <div className="p-3 flex gap-3 items-start">
                <div className="w-22 h-26 shrink-0 rounded-lg border-2 border-slate-300 bg-white overflow-hidden shadow-xs flex flex-col items-center justify-center relative">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Cardholder" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <User className="w-8 h-8 text-slate-300 mb-1" />
                      <span className="text-[7px] font-bold uppercase tracking-wider">2x2 Photo</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[6.5px] text-center py-0.5 font-bold uppercase">
                    QC {isPwdApp ? "PDAO" : "OSCA"}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div>
                    <span className="text-[7.5px] font-bold uppercase text-slate-400 tracking-wider">QC ID Number</span>
                    <p className="text-sm font-black text-blue-900 font-mono tracking-wide leading-none">{idNumber}</p>
                  </div>

                  <div className="pt-0.5">
                    <span className="text-[7.5px] font-bold uppercase text-slate-400 tracking-wider">Cardholder Full Name</span>
                    <p className="text-xs font-black text-slate-900 leading-tight uppercase truncate">{displayName(app)}</p>
                  </div>

                  {isPwdApp ? (
                    <div className="pt-0.5">
                      <span className="text-[7.5px] font-bold uppercase text-slate-400 tracking-wider">Type of Disability</span>
                      <p className="text-[9.5px] font-bold text-red-700 leading-tight">{app.disabilityType || "Visual Disability"}</p>
                    </div>
                  ) : (
                    <div className="pt-0.5">
                      <span className="text-[7.5px] font-bold uppercase text-slate-400 tracking-wider">Classification</span>
                      <p className="text-[9.5px] font-bold text-emerald-800 leading-tight">Senior Citizen Welfare Beneficiary</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1 pt-0.5 text-[8.5px] text-slate-700">
                    <div>
                      <span className="text-[7px] font-semibold text-slate-400 uppercase">Birthdate:</span> {app.dateOfBirth || "—"}
                    </div>
                    <div>
                      <span className="text-[7px] font-semibold text-slate-400 uppercase">Sex / Blood:</span> {app.sex || "—"} / O+
                    </div>
                  </div>

                  <div className="text-[8.5px] text-slate-700 truncate pt-0.5">
                    <span className="text-[7px] font-semibold text-slate-400 uppercase">Address:</span> {app.address || "Quezon City"}
                  </div>
                </div>
              </div>

              {/* Bottom Signatures & Barcode */}
              <div className="px-3 py-1.5 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-between text-[7.5px]">
                <div>
                  <p className="font-mono font-bold text-slate-700 tracking-widest text-[8.5px]">|||| | || |||| | | ||| ||||</p>
                  <p className="text-[6.5px] text-slate-400 uppercase tracking-wider">Issued: {appDate}</p>
                </div>
                <div className="text-center">
                  <div className="w-18 border-b border-slate-400 mx-auto mb-0.5" />
                  <p className="font-bold text-slate-800 text-[7.5px] leading-tight uppercase">MA. JOSEFINA G. BELMONTE</p>
                  <p className="text-[6.5px] text-slate-500 uppercase leading-none">City Mayor</p>
                </div>
              </div>
            </div>
          ) : (
            /* BACK CARD */
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden shadow-lg border border-slate-300 relative bg-white select-none p-4 flex flex-col justify-between"
              style={{
                aspectRatio: "1.586 / 1",
                background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
              }}
            >
              <div>
                <p className="text-[9px] font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1 text-center">
                  {isPwdApp ? "Republic Act 7277 / RA 9442 Magna Carta for PWDs" : "Republic Act 9994 Expanded Senior Citizens Act"}
                </p>
                <ul className="text-[8px] text-slate-600 mt-2 space-y-1 list-disc pl-4">
                  <li>20% discount and VAT exemption on medicines, medical supplies, and dental services.</li>
                  <li>20% discount on public domestic transportation (air, sea, land, MRT/LRT).</li>
                  <li>20% discount on hotels, restaurants, and recreational centers.</li>
                  <li>This card is non-transferable and valid across the Republic of the Philippines.</li>
                </ul>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1">
                <p className="text-[8px] font-bold text-slate-700 uppercase">In case of emergency, please notify:</p>
                <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-600 bg-slate-50 p-1.5 rounded-md border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-400 block">Contact Person:</span>
                    <span>Emergency Contact / Brgy Office</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 block">Contact Number:</span>
                    <span className="font-mono font-bold text-blue-700">{app.contactNo || (app as any).cellphoneNo || "09171234567"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Compliant with official Quezon City PDAO &amp; OSCA card issuance guidelines.
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Card
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================================================
// Application Card (List Row)
// =====================================================================================
interface ApplicationCardProps {
  app: ApplicationSubmission
  onView: (app: ApplicationSubmission) => void
  onShowCard?: (app: ApplicationSubmission) => void
}

function ApplicationCard({ app, onView, onShowCard }: ApplicationCardProps) {
  const subLabel = subLabelForApp(app)

  return (
    <div
      onClick={() => onView(app)}
      className={`gw-card ${isPWD(app) ? "gw-card--pwd" : "gw-card--senior"} p-4 transition-shadow hover:shadow-sm cursor-pointer`}
    >
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex">
          <div className={`h-11 w-11 shrink-0 gw-avatar ${isPWD(app) ? "gw-avatar--pwd" : "gw-avatar--senior"} text-sm`}>
            {initials(app)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="gw-serif text-base font-semibold" style={{ color: "var(--ink)" }}>
              {displayName(app)}
            </p>
            <CategoryTag category={app.category} />
            <span className="gw-tag gw-tag--ghost truncate max-w-56">{subLabel}</span>
          </div>
          <p className="gw-mono text-xs mb-1" style={{ color: "var(--ink-faint)" }}>REF {app.referenceNumber}</p>
          <p className="text-xs mb-3" style={{ color: "var(--ink-soft)" }}>
            Submitted {new Date(app.submittedAt).toLocaleDateString()} ·{" "}
            {new Date(app.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-soft)" }}>
              <Paperclip className="h-3.5 w-3.5" />
              {(app.documents || []).length} documents
            </span>
            {app.status === "approved" && app.assignedIdNumber && (
              <span className="gw-mono text-xs font-semibold" style={{ color: "var(--forest-ink)" }}>
                ID {app.assignedIdNumber}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2.5 shrink-0">
          <StatusBadge status={app.status} />
          <div className="flex items-center gap-2">
            {app.status === "approved" && app.assignedIdNumber && onShowCard && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onShowCard(app)
                }}
                className="gw-btn-ghost px-2.5 py-1.5 text-xs text-blue-700 hover:text-blue-800 border-blue-200 bg-blue-50/60 inline-flex items-center gap-1 cursor-pointer"
              >
                <IdCard className="h-3.5 w-3.5 text-blue-600" />
                View ID
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onView(app)
              }}
              className="gw-btn-ghost px-3 py-1.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              Review
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================================================
// Detailed View Modal
// =====================================================================================
interface DetailedViewProps {
  app: ApplicationSubmission
  onClose: () => void
  onApprove: (app: ApplicationSubmission, idNumber: string) => void
  onReject: (id: string, reason: string) => void
  onShowCard?: (app: ApplicationSubmission) => void
}

function DetailedView({ app, onClose, onApprove, onReject, onShowCard }: DetailedViewProps) {
  const idNumber = generateOfficialIdNumber(app)
  const [customIdNumber, setCustomIdNumber] = useState(idNumber)
  const [rejectionReason, setRejectionReason] = useState(app.rejectionReason || "")
  const [actionMode, setActionMode] = useState<"view" | "approve" | "reject">("view")
  const [previewDoc, setPreviewDoc] = useState<ApplicationDocument | null>(null)

  const contactNumber = isPWD(app) ? app.contactNo : app.cellphoneNo
  const subLabel = subLabelForApp(app)

  let sectionNum = 0
  const nextNum = () => String(++sectionNum).padStart(2, "0")

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(2px)" }}
    >
      <div
        className="w-full max-w-3xl my-8 flex flex-col max-h-[90vh] overflow-hidden rounded-2xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow-medium)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4" style={{ background: "var(--surface-sunk)", borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`h-12 w-12 shrink-0 gw-avatar ${isPWD(app) ? "gw-avatar--pwd" : "gw-avatar--senior"} text-base`}>
                {initials(app)}
              </div>
              <div className="min-w-0">
                <h2 className="gw-serif text-xl font-semibold truncate" style={{ color: "var(--ink)" }}>
                  {displayName(app)}
                </h2>
                <p className="gw-mono text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>REF {app.referenceNumber}</p>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <CategoryTag category={app.category} />
                  <span className="gw-tag gw-tag--ghost max-w-64 truncate">{subLabel}</span>
                  <StatusBadge status={app.status} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="h-8 w-8 flex items-center justify-center shrink-0 rounded-full text-xl font-light transition-colors"
              style={{ color: "var(--ink-soft)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto space-y-7">
          {/* Section 01: Personal Information */}
          <div>
            <SectionHeading number={nextNum()} icon={<User className="h-4 w-4" />}>Personal Information</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm p-4 rounded-lg" style={{ background: "var(--surface-sunk)" }}>
              <Field label="Full name" value={displayName(app)} />
              <Field
                label="Date of birth"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" style={{ color: "var(--ink-faint)" }} />
                    {app.dateOfBirth}
                  </span>
                }
              />
              <Field label="Age / Sex" value={`${app.age || "—"} / ${app.sex || "—"}`} />
              <Field label="Civil status" value={app.civilStatus || "—"} />
              <Field
                label="Contact number"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" style={{ color: "var(--ink-faint)" }} />
                    {contactNumber || "—"}
                  </span>
                }
              />
              <Field
                label="Email address"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" style={{ color: "var(--ink-faint)" }} />
                    {app.email || "—"}
                  </span>
                }
              />
              <div className="col-span-2">
                <Field
                  label="Registered residential address"
                  value={
                    <span className="inline-flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--ink-faint)" }} />
                      {app.address}
                    </span>
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 02: Program Specific Details */}
          <div>
            <SectionHeading number={nextNum()} icon={<HeartHandshake className="h-4 w-4" />}>
              {isPWD(app) ? "Disability Information" : "Senior Citizen Program Details"}
            </SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm p-4 rounded-lg" style={{ background: "var(--surface-sunk)" }}>
              {isPWD(app) ? (
                <>
                  <Field label="Disability type" value={app.disabilityType} />
                  <Field label="Classification" value={<span className="capitalize">{app.disabilityClass}</span>} />
                  <div className="col-span-2">
                    <Field label="Cause of disability" value={app.causeOfDisability} />
                  </div>
                </>
              ) : (
                <>
                  <Field label="COVID-19 Vaccination status" value={app.vaccinatedCovid} />
                  <Field label="Application category" value="Senior Citizen Services" />
                </>
              )}
            </div>
          </div>

          {/* Section 03: Documents */}
          <div>
            <SectionHeading number={nextNum()} icon={<Paperclip className="h-4 w-4" />}>
              Supporting Documents ({(app.documents || []).length})
            </SectionHeading>
            <div className="space-y-2">
              {(app.documents || []).length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 bg-slate-50 rounded-lg">No documents uploaded.</p>
              ) : (
                (app.documents || []).map((doc, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewDoc(doc)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                        {/\.(jpe?g|png)$/i.test(doc.filename || doc.name) ? (
                          <ImageIcon className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : "Uploaded on file"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified
                      </span>
                      <span className="text-xs font-semibold text-blue-600 hover:underline">View</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Decision Section */}
          {app.status === "pending" && (
            <div className="border-t border-border pt-5">
              {actionMode === "view" && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActionMode("approve")}
                    className="gw-btn-approve flex-1 h-11 inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    Approve Application
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionMode("reject")}
                    className="gw-btn-reject flex-1 h-11 inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    Reject Application
                  </button>
                </div>
              )}

              {actionMode === "approve" && (
                <div className="space-y-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Assign {app.category} ID Number *
                      </label>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                        Official QC ID
                      </span>
                    </div>
                    <input
                      type="text"
                      value={customIdNumber}
                      onChange={(e) => setCustomIdNumber(e.target.value)}
                      placeholder="e.g. PWD-137404-2026-XXXXXX"
                      className="gw-input w-full mt-1.5 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-mono"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActionMode("view")}
                      className="gw-btn-ghost flex-1 h-10 text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const finalId = customIdNumber.trim() || idNumber
                        if (finalId) {
                          onApprove(app, finalId)
                          onClose()
                        }
                      }}
                      className="gw-btn-approve flex-1 h-10 text-sm cursor-pointer"
                    >
                      Confirm Approval
                    </button>
                  </div>
                </div>
              )}

              {actionMode === "reject" && (
                <div className="space-y-4 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-300">
                      Reason for Rejection *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Specify reason for rejecting this application..."
                      className="gw-input w-full mt-1.5 px-3 py-2 text-sm"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActionMode("view")}
                      className="gw-btn-ghost flex-1 h-10 text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (rejectionReason.trim()) {
                          onReject(app.id, rejectionReason)
                          onClose()
                        }
                      }}
                      className="gw-btn-reject flex-1 h-10 text-sm cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {app.status === "approved" && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 text-sm space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                Approved on {new Date(app.approvedDate || app.submittedAt).toLocaleDateString()} by {app.approvedBy || "Admin Staff"}
              </p>
              {app.assignedIdNumber && (
                <p className="text-xs">
                  <strong>Assigned ID Number:</strong> {app.assignedIdNumber}
                </p>
              )}
              {app.notes && <p className="text-xs"><strong>Notes:</strong> {app.notes}</p>}
              {onShowCard && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onShowCard(app)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <IdCard className="h-4 w-4" />
                    Preview &amp; Print Official QC ID Card
                  </button>
                </div>
              )}
            </div>
          )}

          {app.status === "rejected" && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200 text-sm space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <X className="h-4 w-4 text-red-600" />
                Rejected Application
              </p>
              <p className="text-xs"><strong>Reason:</strong> {app.rejectionReason || "Requirements not met."}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3" style={{ background: "var(--surface-sunk)" }}>
          <button
            type="button"
            onClick={onClose}
            className="gw-btn-ghost px-6 h-10 text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {previewDoc && <DocumentViewerModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  )
}

const DEFAULT_SEED_APPLICATIONS: ApplicationSubmission[] = [
  {
    id: "APP-PWD-2026-001",
    submittedAt: "2026-08-20T09:30:00.000Z",
    referenceNumber: "PWD-QC-2026-4891",
    category: "PWD",
    type: "new",
    firstName: "Juan",
    middleName: "Ramos",
    lastName: "Dela Cruz",
    suffix: "",
    dateOfBirth: "1998-05-14",
    age: "28",
    sex: "Male",
    civilStatus: "Single",
    contactNo: "09171234567",
    cellphoneNo: "09171234567",
    email: "juan.delacruz@gmail.com",
    address: "Block 12 Lot 4, Brgy. Batasan Hills, Quezon City",
    disabilityType: "Visual Disability",
    disabilityClass: "apparent",
    causeOfDisability: "Congenital / Inborn",
    applyingFor: "myself",
    documents: [
      { name: "Whole Body Picture", filename: "whole_body.jpg", fileUrl: "/samples/WHOLE BODY.jpg", uploadedAt: "2026-08-20T09:25:00.000Z", status: "verified" },
      { name: "Certificate of Disability", filename: "cert_disability.jpg", fileUrl: "/samples/CERTIFICATE OF DISABILITY.jpg", uploadedAt: "2026-08-20T09:26:00.000Z", status: "verified" },
      { name: "Proof of Residence", filename: "residency.webp", fileUrl: "/samples/PROOF OF RESIDENCE.webp", uploadedAt: "2026-08-20T09:27:00.000Z", status: "verified" },
      { name: "2x2 ID Picture", filename: "id_picture.webp", fileUrl: "/samples/ID PICTURE (2X2).webp", uploadedAt: "2026-08-20T09:28:00.000Z", status: "verified" },
    ],
    status: "pending",
  },
  {
    id: "APP-PWD-2026-002",
    submittedAt: "2026-08-18T14:15:00.000Z",
    referenceNumber: "PWD-QC-2026-3109",
    category: "PWD",
    type: "renewal",
    firstName: "Maria",
    middleName: "Clara",
    lastName: "Santos",
    suffix: "",
    dateOfBirth: "1992-11-20",
    age: "33",
    sex: "Female",
    civilStatus: "Married",
    contactNo: "09189876543",
    cellphoneNo: "09189876543",
    email: "maria.santos@gmail.com",
    address: "24 Malakas St., Brgy. Pinyahan, Quezon City",
    disabilityType: "Orthopedic Disability",
    disabilityClass: "apparent",
    causeOfDisability: "Accident / Trauma",
    applyingFor: "myself",
    documents: [
      { name: "Previous PWD ID Card", filename: "qc_id_pwd.jpg", fileUrl: "/samples/QC ID NG PERSON WITH DISABILITY.jpg", uploadedAt: "2026-08-18T14:10:00.000Z", status: "verified" },
      { name: "Certificate of Disability", filename: "cert_disability.jpg", fileUrl: "/samples/CERTIFICATE OF DISABILITY.jpg", uploadedAt: "2026-08-18T14:12:00.000Z", status: "verified" },
      { name: "2x2 ID Picture", filename: "id_picture.webp", fileUrl: "/samples/ID PICTURE (2X2).webp", uploadedAt: "2026-08-18T14:13:00.000Z", status: "verified" },
    ],
    status: "approved",
    assignedIdNumber: "PWD-137404-2026-310901",
    approvedBy: "Social Worker Admin",
    approvedDate: "2026-08-19T10:00:00.000Z",
  },
  {
    id: "APP-PWD-2026-003",
    submittedAt: "2026-08-22T11:00:00.000Z",
    referenceNumber: "PWD-QC-2026-5520",
    category: "PWD",
    type: "assistance",
    firstName: "Ricardo",
    middleName: "Bautista",
    lastName: "Dimal",
    suffix: "Jr.",
    dateOfBirth: "2001-03-08",
    age: "25",
    sex: "Male",
    civilStatus: "Single",
    contactNo: "09205554321",
    cellphoneNo: "09205554321",
    email: "ricardo.dimal@gmail.com",
    address: "Zone 3, Brgy. Holy Spirit, Quezon City",
    disabilityType: "Psychosocial Disability",
    disabilityClass: "non-apparent",
    causeOfDisability: "Illness / Disease",
    applyingFor: "myself",
    documents: [
      { name: "Certificate of Disability from Specialist", filename: "cert_disability.jpg", fileUrl: "/samples/CERTIFICATE OF DISABILITY.jpg", uploadedAt: "2026-08-22T10:50:00.000Z", status: "verified" },
      { name: "Barangay Indigency Certificate", filename: "barangay_cert.webp", fileUrl: "/samples/BARANGAY CERTIFICATE.webp", uploadedAt: "2026-08-22T10:52:00.000Z", status: "verified" },
      { name: "Proof of Residence", filename: "residency.webp", fileUrl: "/samples/PROOF OF RESIDENCE.webp", uploadedAt: "2026-08-22T10:55:00.000Z", status: "verified" },
    ],
    status: "pending",
  },
  {
    id: "APP-SNR-2026-004",
    submittedAt: "2026-08-21T08:45:00.000Z",
    referenceNumber: "OSCA-QC-2026-8802",
    category: "Senior Citizen",
    type: "new",
    firstName: "Teresa",
    middleName: "Manalo",
    lastName: "Lopez",
    suffix: "",
    dateOfBirth: "1960-04-12",
    age: "66",
    sex: "Female",
    civilStatus: "Widowed",
    contactNo: "09193337788",
    cellphoneNo: "09193337788",
    email: "teresa.lopez@gmail.com",
    address: "15 Dahlia St., Brgy. Fairview, Quezon City",
    disabilityType: "",
    disabilityClass: "",
    causeOfDisability: "",
    vaccinatedCovid: "Yes",
    applyingFor: "myself",
    documents: [
      { name: "Birth Certificate / Valid ID", filename: "birth_cert.jpg", fileUrl: "/samples/BIRTH CERTIFICATE OF MINOR.jpg", uploadedAt: "2026-08-21T08:40:00.000Z", status: "verified" },
      { name: "Barangay Residency Certificate", filename: "barangay_cert.webp", fileUrl: "/samples/BARANGAY CERTIFICATE.webp", uploadedAt: "2026-08-21T08:42:00.000Z", status: "verified" },
      { name: "2x2 ID Picture", filename: "id_picture.webp", fileUrl: "/samples/ID PICTURE (2X2).webp", uploadedAt: "2026-08-21T08:43:00.000Z", status: "verified" },
    ],
    status: "pending",
  },
]

// =====================================================================================
// Main Admin Component: PWDSeniorCitizenAdmin
// =====================================================================================
export default function PWDSeniorCitizenAdmin() {
  const [applications, setApplications] = useState<ApplicationSubmission[]>(() => {
    try {
      const saved = localStorage.getItem("pwd_senior_applications")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {}
    return DEFAULT_SEED_APPLICATIONS
  })

  const [selectedApp, setSelectedApp] = useState<ApplicationSubmission | null>(null)
  const [cardApp, setCardApp] = useState<ApplicationSubmission | null>(null)
  const [filterCategory, setFilterCategory] = useState<"all" | "PWD" | "Senior Citizen">("all")
  const [filterType, setFilterType] = useState<"all" | "new" | "renewal" | "loss" | "assistance">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected" | "needs_revision">("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Real-time backend synchronization across windows, devices, and Incognito mode
  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/pwd-senior/applications`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setApplications(data)
            try {
              localStorage.setItem("pwd_senior_applications", JSON.stringify(data))
            } catch {}
          }
        }
      } catch (err) {
        console.warn("Could not fetch PWD/Senior applications from backend:", err)
      }
    }

    fetchApps()
    const interval = setInterval(fetchApps, 3000)
    return () => clearInterval(interval)
  }, [])

  // Persist applications to localStorage
  const updateApplications = (updater: (prev: ApplicationSubmission[]) => ApplicationSubmission[]) => {
    setApplications((prev) => {
      const next = updater(prev)
      try {
        localStorage.setItem("pwd_senior_applications", JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleApprove = async (targetApp: ApplicationSubmission, idNumber: string) => {
    const id = targetApp.id
    const approvedDate = new Date().toISOString()
    const emailToSend = targetApp.email ? targetApp.email.trim() : ""

    updateApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status: "approved" as const,
              assignedIdNumber: idNumber,
              approvedBy: "Social Worker Admin",
              approvedDate,
            }
          : app
      )
    )

    // Sync status to backend database
    try {
      await fetch(`${API_BASE}/api/pwd-senior/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          assignedIdNumber: idNumber,
          approvedBy: "Social Worker Admin",
          approvedDate,
        }),
      })
    } catch (err) {
      console.warn("Failed updating backend status:", err)
    }

    // Dispatch real email notification to applicant's email address
    if (targetApp && emailToSend) {
      try {
        console.log(`[Email Dispatch] Sending PWD ID to applicant email: ${emailToSend}`)
        const emailRes = await fetch(`${API_BASE}/api/email/send-pwd-id`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientEmail: emailToSend,
            recipientName: displayName(targetApp),
            pwdIdNumber: idNumber,
            referenceNumber: targetApp.referenceNumber,
            disabilityType: isPWD(targetApp) ? targetApp.disabilityType : "PWD / Senior Program",
            approvedDate,
            contactNumber: isPWD(targetApp) ? targetApp.contactNo : targetApp.cellphoneNo,
            address: targetApp.address,
          }),
        })
        const emailData = await emailRes.json()
        console.log(`[Email Response]`, emailData)
      } catch (err) {
        console.warn("Email dispatch error:", err)
      }
    }
  }

  const handleReject = async (id: string, reason: string) => {
    updateApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status: "rejected" as const,
              rejectionReason: reason,
            }
          : app
      )
    )

    // Sync rejection to backend database
    try {
      await fetch(`${API_BASE}/api/pwd-senior/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          rejectionReason: reason,
        }),
      })
    } catch (err) {
      console.warn("Failed updating backend rejection:", err)
    }
  }

  // Filter applications
  const filteredApps = applications.filter((app) => {
    const appCat = String(app.category || "").toUpperCase()
    const matchCategory =
      filterCategory === "all" ||
      (filterCategory === "PWD" && (appCat === "PWD" || appCat.includes("DISABILITY"))) ||
      (filterCategory === "Senior Citizen" && (appCat === "SENIOR CITIZEN" || appCat.includes("SENIOR")))
    const matchStatus =
      filterStatus === "all" ||
      String(app.status || "").toLowerCase() === filterStatus.toLowerCase()

    const appType = String(app.type || "").toLowerCase()
    const matchType =
      filterType === "all" ||
      (filterType === "new" && appType === "new") ||
      (filterType === "renewal" && appType === "renewal") ||
      (filterType === "loss" && (appType === "loss" || appType === "replacement")) ||
      (filterType === "assistance" &&
        (appType.includes("assist") ||
          appType === "social-assistance" ||
          appType === "medicine-booklet" ||
          appType === "movie-booklet"))

    const q = searchTerm.trim().toLowerCase()
    const matchSearch =
      q === "" ||
      (app.firstName || "").toLowerCase().includes(q) ||
      (app.lastName || "").toLowerCase().includes(q) ||
      displayName(app).toLowerCase().includes(q) ||
      (app.referenceNumber || "").toLowerCase().includes(q) ||
      (app.assignedIdNumber || "").toLowerCase().includes(q) ||
      (app.address || "").toLowerCase().includes(q)
    return matchCategory && matchType && matchStatus && matchSearch
  })

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }

  const categoryOptions: { label: string; value: "all" | "PWD" | "Senior Citizen" }[] = [
    { label: "All Categories", value: "all" },
    { label: "PWD", value: "PWD" },
    { label: "Senior Citizen", value: "Senior Citizen" },
  ]

  const typeOptions: { label: string; value: "all" | "new" | "renewal" | "loss" | "assistance" }[] = [
    { label: "All Types", value: "all" },
    { label: "New ID", value: "new" },
    { label: "Renewal", value: "renewal" },
    { label: "Lost / Replacement", value: "loss" },
    { label: "Social Assistance", value: "assistance" },
  ]

  const statusOptions: { label: string; value: "all" | "pending" | "approved" | "rejected" }[] = [
    { label: "All Statuses", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ]

  return (
    <div className="gw-root">
      <Tokens />
      <div className="p-4 md:p-8 space-y-7 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="h-3.5 w-3.5" style={{ color: "var(--plum)" }} />
            <span className="gw-eyebrow">Case registry · social welfare intake</span>
          </div>
          <h1 className="gw-serif text-[2.1rem] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
            PWD &amp; Senior Citizen Services
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--ink-soft)" }}>
            Review submitted applications, verify documents, and record a decision on each case.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total applications", value: stats.total, color: "var(--ink)" },
            { label: "Pending review", value: stats.pending, color: "var(--gold)" },
            { label: "Approved", value: stats.approved, color: "var(--forest)" },
            { label: "Rejected", value: stats.rejected, color: "var(--redwood)" },
          ].map((stat) => (
            <div key={stat.label} className="gw-stat p-4" style={{ "--stat-color": stat.color } as React.CSSProperties}>
              <p className="gw-eyebrow" style={{ color: "var(--ink-faint)" }}>{stat.label}</p>
              <p className="gw-serif text-3xl font-semibold mt-2" style={{ color: "var(--ink)" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="gw-card p-4 space-y-4">
          <div className="flex items-center gap-2 rounded-lg px-3" style={{ border: "1px solid var(--line)", background: "var(--surface-sunk)" }}>
            <Search className="h-4 w-4 shrink-0" style={{ color: "var(--ink-faint)" }} />
            <input
              type="text"
              placeholder="Search by name or reference number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 py-2.5 text-sm bg-transparent focus:outline-none"
              style={{ color: "var(--ink)" }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="gw-eyebrow mb-2" style={{ color: "var(--ink-faint)" }}>Category</p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterCategory(opt.value)}
                    className={`gw-tag gw-tag--btn ${
                      opt.value === "all" ? "gw-tag--ghost" : opt.value === "PWD" ? "gw-tag--pwd" : "gw-tag--senior"
                    } ${filterCategory === opt.value ? "is-active" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="gw-eyebrow mb-2" style={{ color: "var(--ink-faint)" }}>Service Type</p>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterType(opt.value)}
                    className="gw-tag gw-tag--ghost gw-tag--btn"
                    style={filterType === opt.value ? { opacity: 1, borderColor: "var(--ink-soft)", fontWeight: 700 } : undefined}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="gw-eyebrow mb-2" style={{ color: "var(--ink-faint)" }}>Status</p>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value as any)}
                    className="gw-tag gw-tag--ghost gw-tag--btn"
                    style={filterStatus === opt.value ? { opacity: 1, borderColor: "var(--ink-soft)" } : undefined}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="gw-serif text-lg font-semibold" style={{ color: "var(--ink)" }}>Applications</h2>
            <span className="gw-mono text-sm" style={{ color: "var(--ink-faint)" }}>({filteredApps.length})</span>
          </div>

          {filteredApps.length === 0 ? (
            <div className="text-center py-16 gw-card">
              <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--ink-faint)" }} />
              <p className="gw-serif text-base font-semibold" style={{ color: "var(--ink)" }}>No applications found</p>
              <p className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>Try a different search term or filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onView={() => setSelectedApp(app)}
                  onShowCard={() => setCardApp(app)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detailed View Modal */}
        {selectedApp && (
          <DetailedView
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onShowCard={(app) => setCardApp(app)}
          />
        )}

        {/* Official QC ID Card Modal */}
        {cardApp && (
          <OfficialIdCardModal
            app={cardApp}
            onClose={() => setCardApp(null)}
          />
        )}
      </div>
    </div>
  )
}
import { useState, useEffect } from "react"
import {
  Check,
  X,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Send,
  Building2,
  MapPin,
  Calendar,
  Phone,
  Mail,
  User,
  Package,
  Activity,
  Banknote,
  Wrench,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
} from "lucide-react"
import { API_BASE } from "../../config/api"

// ---- Unified Interfaces ----
export type ApplicationStatus = "pending" | "under_review" | "approved" | "rejected" | "needs_revision"

export interface MaterialItem {
  item: string
  quantity: string
  description?: string
  remarks?: string
}

export interface EquipmentApprovedItem {
  equipment: string
  quantity: string
  description?: string
  remarks?: string
}

export interface CapitalMaterialsAssistance {
  id: string | number
  application_id: string | number
  reference_number: string
  beneficiary_id: string
  assistance_status: "FOR PROCESSING" | "FOR RELEASE" | "RELEASED" | "for_processing" | "for_release" | "released"
  release_status: "NOT RELEASED" | "RELEASED" | string
  approved_financial_amount: number | string
  approved_materials: MaterialItem[]
  approved_equipment: EquipmentApprovedItem[]
  release_date?: string
  release_time?: string
  release_location?: string
  instructions?: string
  released_at?: string
  released_by?: string
  allocation_saved?: boolean
  created_at?: string
  updated_at?: string
}

export interface LivelihoodMonitoringRecord {
  id: string | number
  application_id: string | number
  reference_number: string
  capital_materials_id?: string | number
  beneficiary_id?: string
  monitoring_status: "ACTIVE" | "ONGOING" | "NEEDS FOLLOW-UP" | "COMPLETED" | string
  monitoring_date?: string
  inspection_date?: string
  status?: string
  progress_update?: string
  title?: string
  remarks?: string
  notes?: string
  next_follow_up_date?: string
  officer_name?: string
  created_at?: string
}

export interface LivelihoodApplication {
  id: string | number
  submittedAt: string
  created_at?: string
  referenceNumber: string
  reference_number?: string
  userId: string
  user_id?: string
  qcid?: string
  firstName: string
  first_name?: string
  middleName?: string
  middle_name?: string
  lastName: string
  last_name?: string
  suffix?: string
  dateOfBirth?: string
  date_of_birth?: string
  sex?: string
  gender?: string
  civilStatus?: string
  civil_status?: string
  mobileNo?: string
  phone_number?: string
  email?: string
  address?: string
  statusOfClient: string
  livelihood_status?: string
  entrepreneurCategory: string
  livelihood_type?: string
  businessName: string
  business_name?: string
  placeOfBusiness?: string
  business_location?: string
  businessGoal?: string
  reason_purpose?: string
  estimatedAmount?: number
  estimated_amount?: number
  assistanceNeeded?: string[]
  assistance_needed?: string[]
  documents: Array<{ name: string; uploadedAt?: string; uploaded_at?: string; status?: string }>
  status: ApplicationStatus
  application_status?: string
  approvedBy?: string
  approved_by?: string
  approvedDate?: string
  approved_date?: string
  notes?: string
  rejectionReason?: string
  rejection_reason?: string
  revisionReason?: string
  revision_reason?: string
  revisionNotes?: string
  revision_notes?: string
  adminNotes?: string
  admin_notes?: string
  assistance: CapitalMaterialsAssistance | null
  monitoring: LivelihoodMonitoringRecord[]
}

// Helper: parse date and time string to Date object in Philippine Standard Time (UTC+8)
function parseDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr) return null
  try {
    let year: number, month: number, day: number
    const str = String(dateStr).trim()
    const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10)
      month = parseInt(isoMatch[2], 10) - 1
      day = parseInt(isoMatch[3], 10)
    } else {
      const usMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
      if (usMatch) {
        month = parseInt(usMatch[1], 10) - 1
        day = parseInt(usMatch[2], 10)
        year = parseInt(usMatch[3], 10)
      } else {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return null
        year = d.getFullYear()
        month = d.getMonth()
        day = d.getDate()
      }
    }

    let hours = 9
    let minutes = 0
    if (timeStr) {
      const match = String(timeStr).trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
      if (match) {
        hours = parseInt(match[1], 10)
        minutes = parseInt(match[2], 10)
        const ampm = match[3]?.toUpperCase()
        if (ampm === "PM" && hours < 12) hours += 12
        if (ampm === "AM" && hours === 12) hours = 0
      }
    }

    const targetUtcMs = Date.UTC(year, month, day, hours - 8, minutes, 0, 0)
    return new Date(targetUtcMs)
  } catch {
    return null
  }
}

// Normalization helper
function normalizeApplication(raw: any): LivelihoodApplication {
  const rawStatus = (raw.application_status || raw.status || "pending").toLowerCase()
  const status: ApplicationStatus =
    rawStatus === "approved"
      ? "approved"
      : rawStatus === "rejected"
      ? "rejected"
      : rawStatus === "needs_revision"
      ? "needs_revision"
      : "pending"

  let assist: CapitalMaterialsAssistance | null = null
  if (raw.assistance) {
    const scheduledDt = parseDateTime(raw.assistance.release_date, raw.assistance.release_time)
    const isScheduledPast = scheduledDt !== null && Date.now() >= scheduledDt.getTime()
    const rawAssistStatus = (raw.assistance.assistance_status || "FOR PROCESSING").toUpperCase()

    let normAssistStatus: "FOR PROCESSING" | "FOR RELEASE" | "RELEASED"
    if (rawAssistStatus.includes("RELEASED") || (rawAssistStatus.includes("FOR RELEASE") && isScheduledPast)) {
      normAssistStatus = "RELEASED"
    } else if (rawAssistStatus.includes("FOR RELEASE") || rawAssistStatus.includes("FOR_RELEASE")) {
      normAssistStatus = "FOR RELEASE"
    } else {
      normAssistStatus = "FOR PROCESSING"
    }

    assist = {
      id: raw.assistance.id || `ASST-${raw.id || raw.reference_number}`,
      application_id: raw.assistance.application_id || raw.id,
      reference_number: raw.assistance.reference_number || raw.reference_number || raw.referenceNumber,
      beneficiary_id: raw.assistance.beneficiary_id || raw.user_id || raw.userId || `QC-${raw.id}`,
      assistance_status: normAssistStatus,
      release_status: raw.assistance.release_status || (normAssistStatus === "RELEASED" ? "RELEASED" : "NOT RELEASED"),
      approved_financial_amount: (() => {
        const assistRaw = parseFloat(String(raw.assistance.approved_financial_amount || "").replace(/[^0-9.]/g, ""))
        const estRaw = parseFloat(String(raw.estimated_amount || raw.estimatedAmount || "").replace(/[^0-9.]/g, ""))
        return assistRaw > 0 ? assistRaw : estRaw > 0 ? estRaw : 15000
      })(),
      approved_materials: Array.isArray(raw.assistance.approved_materials)
        ? raw.assistance.approved_materials
        : typeof raw.assistance.approved_materials === "string"
        ? (() => { try { const p = JSON.parse(raw.assistance.approved_materials); return Array.isArray(p) ? p : [] } catch { return [] } })()
        : [],
      approved_equipment: Array.isArray(raw.assistance.approved_equipment)
        ? raw.assistance.approved_equipment
        : typeof raw.assistance.approved_equipment === "string"
        ? (() => { try { const p = JSON.parse(raw.assistance.approved_equipment); return Array.isArray(p) ? p : [] } catch { return [] } })()
        : [],
      release_date: raw.assistance.release_date || "",
      release_time: raw.assistance.release_time || "",
      release_location: raw.assistance.release_location || "Quezon City Hall - SSDD Livelihood Center",
      instructions: raw.assistance.instructions || "Please bring a valid ID and your Livelihood Application Reference Number.",
      released_at: raw.assistance.released_at,
      released_by: raw.assistance.released_by,
      created_at: raw.assistance.created_at,
      updated_at: raw.assistance.updated_at,
    }
  }

  const refNum = raw.reference_number || raw.referenceNumber || `LP-2026-${raw.id || "1000"}`
  const fName = raw.first_name || raw.firstName || ""
  const mName = raw.middle_name || raw.middleName || ""
  const lName = raw.last_name || raw.lastName || ""

  const monitoringLogs: LivelihoodMonitoringRecord[] = Array.isArray(raw.monitoring)
    ? raw.monitoring.map((m: any, idx: number) => ({
        id: m.id || `MON-${idx}`,
        application_id: m.application_id || raw.id,
        reference_number: m.reference_number || raw.reference_number || raw.referenceNumber,
        capital_materials_id: m.capital_materials_id || assist?.id,
        beneficiary_id: m.beneficiary_id || raw.user_id || raw.userId,
        monitoring_status: (m.monitoring_status || m.status || "ACTIVE").toUpperCase(),
        monitoring_date: m.monitoring_date || m.inspection_date || new Date().toLocaleDateString("en-US"),
        inspection_date: m.inspection_date || m.monitoring_date,
        progress_update: m.progress_update || m.title || "Monitoring update recorded.",
        title: m.title || m.progress_update,
        remarks: m.remarks || m.notes || "",
        notes: m.notes || m.remarks,
        next_follow_up_date: m.next_follow_up_date,
        officer_name: m.officer_name || "SSDD Social Worker / Admin",
        created_at: m.created_at || new Date().toISOString(),
      }))
    : []

  // If assistance reached scheduled time and became RELEASED, automatically activate Stage 3 monitoring
  if (assist && assist.assistance_status === "RELEASED" && monitoringLogs.length === 0) {
    monitoringLogs.push({
      id: `MON-${raw.id || Date.now()}`,
      application_id: raw.id,
      reference_number: refNum,
      capital_materials_id: assist.id,
      beneficiary_id: raw.user_id || raw.userId || `QC-${raw.id}`,
      monitoring_status: "ACTIVE",
      monitoring_date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      progress_update: "Initial monitoring has started. The scheduled assistance release time has arrived.",
      remarks: "Automated release triggered at scheduled date and time.",
      officer_name: "SSDD Social Worker / Admin",
      created_at: new Date().toISOString(),
    })
  }

  return {
    id: raw.id ?? refNum,
    submittedAt: raw.created_at || raw.submittedAt || new Date().toISOString(),
    created_at: raw.created_at || raw.submittedAt,
    referenceNumber: refNum,
    reference_number: refNum,
    userId: raw.user_id || raw.userId || "110000116932100",
    user_id: raw.user_id || raw.userId || "110000116932100",
    qcid: raw.qcid || raw.user_id || raw.userId || "110000116932100",
    firstName: fName,
    first_name: fName,
    middleName: mName,
    middle_name: mName,
    lastName: lName,
    last_name: lName,
    suffix: raw.suffix || "",
    dateOfBirth: raw.date_of_birth || raw.dateOfBirth || "",
    date_of_birth: raw.date_of_birth || raw.dateOfBirth || "",
    sex: raw.gender || raw.sex || "Female",
    gender: raw.gender || raw.sex || "Female",
    civilStatus: raw.civil_status || raw.civilStatus || "Single",
    civil_status: raw.civil_status || raw.civilStatus || "Single",
    mobileNo: raw.phone_number || raw.mobileNo || "",
    phone_number: raw.phone_number || raw.mobileNo || "",
    email: raw.email || "",
    address:
      raw.address ||
      `${raw.house_building_no ? raw.house_building_no + " " : ""}${raw.street_name || ""}, ${raw.barangay || ""}, Quezon City`,
    statusOfClient: raw.livelihood_status || raw.statusOfClient || "Micro entrepreneur/ Vendors",
    livelihood_status: raw.livelihood_status || raw.statusOfClient || "Micro entrepreneur/ Vendors",
    entrepreneurCategory: raw.livelihood_type || raw.entrepreneurCategory || "Sari-sari Store",
    livelihood_type: raw.livelihood_type || raw.entrepreneurCategory || "Sari-sari Store",
    businessName: raw.business_name || raw.businessName || `${fName}'s Livelihood`,
    business_name: raw.business_name || raw.businessName || `${fName}'s Livelihood`,
    placeOfBusiness: raw.business_location || raw.placeOfBusiness || "",
    business_location: raw.business_location || raw.placeOfBusiness || "",
    businessGoal: raw.reason_purpose || raw.businessGoal || "",
    reason_purpose: raw.reason_purpose || raw.businessGoal || "",
    estimatedAmount: raw.estimated_amount || raw.estimatedAmount || 15000,
    estimated_amount: raw.estimated_amount || raw.estimatedAmount || 15000,
    assistanceNeeded: Array.isArray(raw.assistance_needed) ? raw.assistance_needed : raw.assistanceNeeded || [],
    assistance_needed: Array.isArray(raw.assistance_needed) ? raw.assistance_needed : raw.assistanceNeeded || [],
    documents: Array.isArray(raw.uploaded_documents)
      ? raw.uploaded_documents.map((d: any) => ({
          name: d.name || d.label || d.type || "Document",
          uploadedAt: d.uploaded_at || d.uploadedAt || new Date().toISOString(),
          status: "verified",
        }))
      : Array.isArray(raw.documents)
      ? raw.documents
      : [],
    status: status,
    application_status: status,
    approvedBy: raw.approved_by || raw.approvedBy,
    approved_by: raw.approved_by || raw.approvedBy,
    approvedDate: raw.approved_date || raw.approvedDate,
    approved_date: raw.approved_date || raw.approvedDate,
    notes: raw.admin_notes || raw.notes,
    rejectionReason: raw.rejection_reason || raw.rejectionReason,
    rejection_reason: raw.rejection_reason || raw.rejectionReason,
    revisionReason: raw.revision_reason || raw.revisionReason,
    revision_reason: raw.revision_reason || raw.revisionReason,
    revisionNotes: raw.revision_notes || raw.revisionNotes,
    revision_notes: raw.revision_notes || raw.revisionNotes,
    adminNotes: raw.admin_notes || raw.adminNotes,
    admin_notes: raw.admin_notes || raw.adminNotes,
    assistance: assist,
    monitoring: monitoringLogs,
  }
}

// UI Badges
function StatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === "pending" || status === "under_review") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="h-3.5 w-3.5 text-amber-600" />
        Pending Review
      </span>
    )
  }
  if (status === "needs_revision") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
        <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
        Needs Revision
      </span>
    )
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        Approved
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <XCircle className="h-3.5 w-3.5 text-rose-600" />
      Rejected
    </span>
  )
}

function AssistanceStatusBadge({ status }: { status: string }) {
  const norm = (status || "FOR PROCESSING").toUpperCase()
  if (norm.includes("RELEASED")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        RELEASED
      </span>
    )
  }
  if (norm.includes("FOR RELEASE") || norm.includes("FOR_RELEASE")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
        <Calendar className="h-3.5 w-3.5 text-blue-600" />
        FOR RELEASE
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
      <Clock className="h-3.5 w-3.5 text-amber-600" />
      FOR PROCESSING
    </span>
  )
}

function MonitoringStatusBadge({ status }: { status: string }) {
  const norm = (status || "ACTIVE").toUpperCase().replace(/_/g, " ")
  if (norm.includes("ACTIVE")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        ACTIVE
      </span>
    )
  }
  if (norm.includes("ONGOING")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
        <Clock className="h-3.5 w-3.5 text-blue-600" />
        ONGOING
      </span>
    )
  }
  if (norm.includes("NEEDS") || norm.includes("FOLLOW")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        NEEDS FOLLOW-UP
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
      <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
      COMPLETED
    </span>
  )
}

// =====================================================================================
// 1. APPLICATION REVIEW MODAL (STAGE 1 DECISIONS)
// =====================================================================================
interface ReviewModalProps {
  app: LivelihoodApplication
  onClose: () => void
  onApprove: (id: string | number) => void
  onReject: (id: string | number, reason: string, remarks: string) => void
  onRequestRevision: (id: string | number, reason: string, remarks: string) => void
  onOpenAssistance: (app: LivelihoodApplication) => void
}

function ReviewModal({
  app,
  onClose,
  onApprove,
  onReject,
  onRequestRevision,
  onOpenAssistance,
}: ReviewModalProps) {
  const [actionMode, setActionMode] = useState<"view" | "approve" | "revision" | "reject">("view")

  const [selectedRevisionReason, setSelectedRevisionReason] = useState(app.revisionReason || "")
  const [customRevisionReason, setCustomRevisionReason] = useState("")
  const [revisionRemarks, setRevisionRemarks] = useState(app.revisionNotes || "")

  const [selectedRejectionReason, setSelectedRejectionReason] = useState(app.rejectionReason || "")
  const [customRejectionReason, setCustomRejectionReason] = useState("")
  const [rejectionRemarks, setRejectionRemarks] = useState(app.adminNotes || "")

  const finalRevisionReason = selectedRevisionReason === "Other" ? customRevisionReason : selectedRevisionReason
  const finalRejectionReason = selectedRejectionReason === "Other" ? customRejectionReason : selectedRejectionReason
  const fullName = [app.firstName, app.middleName, app.lastName].filter(Boolean).join(" ")

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">{fullName}</h2>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ref: <strong className="font-mono text-foreground">{app.referenceNumber}</strong> · Submitted:{" "}
              {new Date(app.submittedAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground text-2xl font-light hover:bg-muted transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Checklist */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">1. Checklist &amp; Client Category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm p-4 rounded-xl bg-muted/20 border border-border">
              <div>
                <p className="text-xs text-muted-foreground">Status of Client</p>
                <p className="text-foreground font-semibold mt-0.5">{app.statusOfClient}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Category of Entrepreneur</p>
                <p className="text-foreground font-semibold mt-0.5">{app.entrepreneurCategory}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">2. Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm p-4 rounded-xl bg-muted/20 border border-border">
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-foreground font-semibold mt-0.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {fullName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date of Birth / Sex</p>
                <p className="text-foreground font-semibold mt-0.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {app.dateOfBirth} ({app.sex})
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Civil Status</p>
                <p className="text-foreground font-semibold mt-0.5">{app.civilStatus}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contact Number</p>
                <p className="text-foreground font-semibold mt-0.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {app.mobileNo}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="text-foreground font-semibold mt-0.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {app.email}
                </p>
              </div>
              <div className="col-span-full">
                <p className="text-xs text-muted-foreground">Registered Address</p>
                <p className="text-foreground font-semibold mt-0.5 flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  {app.address}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Business Plan */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">3. Proposed Business Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm p-4 rounded-xl bg-muted/20 border border-border">
              <div>
                <p className="text-xs text-muted-foreground">Business Name</p>
                <p className="text-foreground font-semibold mt-0.5">{app.businessName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Business Location</p>
                <p className="text-foreground font-semibold mt-0.5">{app.placeOfBusiness}</p>
              </div>
              <div className="col-span-full">
                <p className="text-xs text-muted-foreground">Business Goal / Purpose</p>
                <p className="text-foreground font-medium mt-0.5 leading-relaxed">{app.businessGoal}</p>
              </div>
            </div>
          </div>

          {/* Section 4: Documents */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              4. Uploaded Requirements ({app.documents.length})
            </h3>
            <div className="space-y-2">
              {app.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-xl bg-card">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{doc.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(doc.uploadedAt || app.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* APPLICATION DECISION SECTION */}
          <div className="border-t border-border pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Application Decision
              </h3>
              <span className="text-xs text-muted-foreground">
                Current Status: <strong className="uppercase">{app.status.replace("_", " ")}</strong>
              </span>
            </div>

            {/* If approved, show banner with direct link to Stage 2 */}
            {app.status === "approved" && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-0.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Application is APPROVED
                  </p>
                  <p>
                    Approved by {app.approvedBy || "SSDD Staff"} on{" "}
                    {new Date(app.approvedDate || app.submittedAt).toLocaleDateString()}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onOpenAssistance(app)
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Package className="h-4 w-4" />
                  Process Capital / Materials &rarr;
                </button>
              </div>
            )}

            {/* 3 Decision Actions: APPROVE, NEEDS REVISION, REJECT */}
            {actionMode === "view" && app.status !== "approved" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setActionMode("approve")}
                  id="btn-admin-approve-livelihood"
                  className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  1. APPROVE
                </button>
                <button
                  type="button"
                  onClick={() => setActionMode("revision")}
                  id="btn-admin-revision-livelihood"
                  className="h-11 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <AlertCircle className="h-4 w-4" />
                  2. NEEDS REVISION
                </button>
                <button
                  type="button"
                  onClick={() => setActionMode("reject")}
                  id="btn-admin-reject-livelihood"
                  className="h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  3. REJECT
                </button>
              </div>
            )}

            {/* 1. APPROVE Confirmation Dialog */}
            {actionMode === "approve" && (
              <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-emerald-950 dark:text-emerald-200">
                      Confirm Application Approval
                    </h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                      Are you sure you want to approve the Livelihood application for <strong>{fullName}</strong> (
                      {app.referenceNumber})? This will update the application status to <strong>APPROVED</strong>, automatically
                      create one linked <strong>Capital / Materials Assistance</strong> record with status{" "}
                      <strong>FOR PROCESSING</strong> (release status: NOT RELEASED), and unlock Stage 2.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-emerald-500/20">
                  <button
                    type="button"
                    onClick={() => setActionMode("view")}
                    className="px-5 h-10 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onApprove(app.referenceNumber || app.id)
                      onClose()
                    }}
                    id="btn-confirm-approval"
                    className="px-6 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    Confirm Approval
                  </button>
                </div>
              </div>
            )}

            {/* 2. NEEDS REVISION */}
            {actionMode === "revision" && (
              <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-200">
                      Send Revision Request
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                      Specify the reason and instructions for the applicant to revise.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200">
                      Reason for Revision <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedRevisionReason}
                      onChange={(e) => {
                        setSelectedRevisionReason(e.target.value)
                        if (e.target.value !== "Other") setCustomRevisionReason("")
                      }}
                      className="w-full mt-1.5 px-3.5 py-2.5 text-xs sm:text-sm border border-amber-300 dark:border-amber-700 rounded-xl bg-card text-foreground focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="">-- Select Reason for Revision --</option>
                      <option value="Incomplete Documents">Incomplete Documents / Kulang na Dokumento</option>
                      <option value="Blurry / Unclear Valid ID or QCID">Blurry or Unclear Valid ID / QCID</option>
                      <option value="Invalid Proof of Residency">Invalid Proof of Residency / Hindi Tugmang Tirahan</option>
                      <option value="Insufficient Business / Livelihood Details">Insufficient Business Details</option>
                      <option value="Unclear Purpose of Assistance">Unclear Purpose of Assistance</option>
                      <option value="Other">Other Reason (Specify below)</option>
                    </select>

                    {selectedRevisionReason === "Other" && (
                      <input
                        type="text"
                        placeholder="Enter custom reason for revision..."
                        value={customRevisionReason}
                        onChange={(e) => setCustomRevisionReason(e.target.value)}
                        className="w-full mt-2 px-3.5 py-2 text-xs sm:text-sm border border-amber-300 dark:border-amber-700 rounded-xl bg-card text-foreground focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200">
                      Admin Remarks / Instructions <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Provide clear instructions on what the resident needs to correct or re-upload..."
                      value={revisionRemarks}
                      onChange={(e) => setRevisionRemarks(e.target.value)}
                      className="w-full mt-1.5 px-3.5 py-2.5 text-xs sm:text-sm border border-amber-300 dark:border-amber-700 rounded-xl bg-card text-foreground focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-500/20">
                  <button
                    type="button"
                    onClick={() => setActionMode("view")}
                    className="px-5 h-10 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!finalRevisionReason.trim() || !revisionRemarks.trim()}
                    onClick={() => {
                      onRequestRevision(app.referenceNumber || app.id, finalRevisionReason, revisionRemarks)
                      onClose()
                    }}
                    id="btn-send-revision-request"
                    className="px-6 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="h-4 w-4" />
                    Send Revision Request
                  </button>
                </div>
              </div>
            )}

            {/* 3. REJECT */}
            {actionMode === "reject" && (
              <div className="p-5 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-rose-950 dark:text-rose-200">
                      Reject Livelihood Application
                    </h4>
                    <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
                      Select reason and provide remarks explaining the decision.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-rose-950 dark:text-rose-200">
                      Reason for Rejection <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedRejectionReason}
                      onChange={(e) => {
                        setSelectedRejectionReason(e.target.value)
                        if (e.target.value !== "Other") setCustomRejectionReason("")
                      }}
                      className="w-full mt-1.5 px-3.5 py-2.5 text-xs sm:text-sm border border-rose-300 dark:border-rose-700 rounded-xl bg-card text-foreground focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="">-- Select Reason for Rejection --</option>
                      <option value="Ineligible based on Program Criteria">Ineligible based on Program Criteria</option>
                      <option value="Non-Quezon City Resident">Non-Quezon City Resident</option>
                      <option value="Existing Active Livelihood Grant">Existing Active Livelihood Grant</option>
                      <option value="Duplicate Application">Duplicate Application</option>
                      <option value="Other">Other Reason (Specify below)</option>
                    </select>

                    {selectedRejectionReason === "Other" && (
                      <input
                        type="text"
                        placeholder="Enter custom rejection reason..."
                        value={customRejectionReason}
                        onChange={(e) => setCustomRejectionReason(e.target.value)}
                        className="w-full mt-2 px-3.5 py-2 text-xs sm:text-sm border border-rose-300 dark:border-rose-700 rounded-xl bg-card text-foreground focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-rose-950 dark:text-rose-200">
                      Admin Remarks Explaining Decision <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Explain the official decision and reason for closing this application..."
                      value={rejectionRemarks}
                      onChange={(e) => setRejectionRemarks(e.target.value)}
                      className="w-full mt-1.5 px-3.5 py-2.5 text-xs sm:text-sm border border-rose-300 dark:border-rose-700 rounded-xl bg-card text-foreground focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-rose-500/20">
                  <button
                    type="button"
                    onClick={() => setActionMode("view")}
                    className="px-5 h-10 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!finalRejectionReason.trim() || !rejectionRemarks.trim()}
                    onClick={() => {
                      onReject(app.referenceNumber || app.id, finalRejectionReason, rejectionRemarks)
                      onClose()
                    }}
                    id="btn-confirm-rejection"
                    className="px-6 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="h-4 w-4" />
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-border text-foreground font-semibold text-xs hover:bg-muted transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================================================
// 2. CAPITAL / MATERIALS PROCESSING MODAL (STAGE 2)
// =====================================================================================
interface AssistanceModalProps {
  app: LivelihoodApplication
  onClose: () => void
  onSaveAssistance?: (appId: string | number, assistance: CapitalMaterialsAssistance) => Promise<void>
}

function AssistanceModal({ app, onClose }: AssistanceModalProps) {

  const initialAssist: CapitalMaterialsAssistance = app.assistance || {
    id: `ASST-${app.id || app.referenceNumber}`,
    application_id: app.id,
    reference_number: app.referenceNumber,
    beneficiary_id: app.userId || app.qcid || `QC-${app.id}`,
    assistance_status: "FOR PROCESSING",
    release_status: "NOT RELEASED",
    approved_financial_amount: app.estimatedAmount || 15000,
    approved_materials: [],
    approved_equipment: [],
    release_date: "",
    release_time: "",
    release_location: "Quezon City Hall - SSDD Livelihood Center",
    instructions: "Please bring a valid ID and your Livelihood Application Reference Number.",
  }
  const parsedAssistAmt = parseFloat(String(initialAssist.approved_financial_amount || "").replace(/[^0-9.]/g, ""))
  const parsedAppEst = parseFloat(String(app.estimatedAmount || "").replace(/[^0-9.]/g, ""))
  const rawInitialAmt = parsedAssistAmt > 0 ? parsedAssistAmt : parsedAppEst > 0 ? parsedAppEst : 15000

  const financialAmount = (rawInitialAmt > 0 ? rawInitialAmt : 15000).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const materials: MaterialItem[] =
    initialAssist.approved_materials && initialAssist.approved_materials.length > 0
      ? initialAssist.approved_materials
      : [{ item: "Starter Livelihood Supply Pack", quantity: "1 set", description: "Standard initial allocation" }]
  const equipment: EquipmentApprovedItem[] =
    initialAssist.approved_equipment && initialAssist.approved_equipment.length > 0
      ? initialAssist.approved_equipment
      : [{ equipment: "Operational Kit / Tools", quantity: "1 unit", description: "Standard package" }]

  const currentStatus = (initialAssist.assistance_status || "FOR PROCESSING").toUpperCase()
  const fullName = [app.firstName, app.middleName, app.lastName].filter(Boolean).join(" ")

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-foreground">
              Capital / Materials Assistance Details
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                currentStatus === "RELEASED"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : currentStatus === "FOR RELEASE"
                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              }`}
            >
              {currentStatus}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Section 1: Beneficiary Overview */}
          <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-muted-foreground block">Applicant Name</span>
                <span className="font-bold text-foreground block mt-0.5">{fullName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Reference Number</span>
                <span className="font-mono font-bold text-foreground block mt-0.5">{app.referenceNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Livelihood Type</span>
                <span className="font-bold text-foreground block mt-0.5">{app.entrepreneurCategory}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Business Name</span>
                <span className="font-bold text-foreground block mt-0.5">{app.businessName}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Set Approved Assistance */}
          <div className="border border-border rounded-xl p-5 space-y-5 bg-card shadow-xs">
            <div className="border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Approved Assistance Allocation
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Specify approved financial capital grant, materials/supplies, and equipment
              </p>
            </div>

            {/* A. Financial Assistance */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-emerald-600" />
                Financial / Capital Assistance (Approved Amount ₱)
              </label>
              <div className="relative max-w-sm">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">₱</span>
                <input
                  type="text"
                  disabled={true}
                  value={
                    financialAmount && parseFloat(financialAmount.replace(/[^0-9.]/g, "")) > 0
                      ? financialAmount
                      : "15,000.00"
                  }
                  readOnly
                  placeholder="15,000.00"
                  className="w-full pl-8 pr-3 py-2 text-sm font-bold border border-border rounded-xl bg-muted/40 text-foreground cursor-not-allowed opacity-90 select-none"
                />
              </div>
            </div>

            {/* B. Materials / Supplies */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-blue-600" />
                  Materials / Supplies ({materials.length})
                </label>
              </div>

              {materials.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No material items requested by applicant.</p>
              ) : (
                <div className="space-y-2">
                  {materials.map((mat, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 rounded-xl border border-border bg-muted/15 items-center text-xs">
                      <input
                        type="text"
                        disabled={true}
                        readOnly
                        placeholder="Item name"
                        value={mat.item}
                        className="col-span-8 px-3 py-1.5 border border-border rounded-lg bg-muted/40 text-foreground cursor-not-allowed opacity-90 select-none font-medium"
                      />
                      <input
                        type="text"
                        disabled={true}
                        readOnly
                        placeholder="Quantity"
                        value={mat.quantity}
                        className="col-span-4 px-3 py-1.5 border border-border rounded-lg bg-muted/40 text-foreground cursor-not-allowed opacity-90 select-none font-medium"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* C. Equipment */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Wrench className="h-4 w-4 text-indigo-600" />
                  Equipment ({equipment.length})
                </label>
              </div>

              {equipment.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No equipment requested by applicant.</p>
              ) : (
                <div className="space-y-2">
                  {equipment.map((eq, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 rounded-xl border border-border bg-muted/15 items-center text-xs">
                      <input
                        type="text"
                        disabled={true}
                        readOnly
                        placeholder="Equipment name"
                        value={eq.equipment}
                        className="col-span-8 px-3 py-1.5 border border-border rounded-lg bg-muted/40 text-foreground cursor-not-allowed opacity-90 select-none font-medium"
                      />
                      <input
                        type="text"
                        disabled={true}
                        readOnly
                        placeholder="Quantity"
                        value={eq.quantity}
                        className="col-span-4 px-3 py-1.5 border border-border rounded-lg bg-muted/40 text-foreground cursor-not-allowed opacity-90 select-none font-medium"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Financial Aid & Appointments Integration Notice */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-2 mt-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Calendar className="h-4.5 w-4.5" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Disbursement &amp; Appointment Scheduling
                </h4>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                Ang naaprubahang <strong>Livelihood Capital Assistance</strong> na ito ay awtomatikong nakatala sa{" "}
                <strong>Financial Aid Disbursements</strong>. Ang pagtatakda ng petsa, oras, at venue ng release/payout ay
                pinamamahalaan sa pamamagitan ng <strong>Appointments</strong> module.
              </p>
            </div>

            {/* Allocation Status Badge */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border mt-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Naka-lock ang opisyal na allocation batay sa isinumite ng aplikante. Pumunta sa Appointments para sa release schedule.</span>
              </div>

              <div
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 select-none flex items-center gap-1.5 shrink-0"
              >
                <Check className="h-4 w-4 text-emerald-600" />
                ✓ [ ALLOCATION LOCKED / VIEW ONLY ]
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-border text-foreground font-semibold text-xs hover:bg-muted transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================================================
// 3. FULL LIVELIHOOD MONITORING DETAILS MODAL (STAGE 3)
// =====================================================================================
interface MonitoringModalProps {
  app: LivelihoodApplication
  onClose: () => void
  onAddMonitoringUpdate: (
    appId: string | number,
    update: {
      monitoringDate: string
      status: string
      progressUpdate: string
      remarks: string
      nextFollowUpDate?: string
    }
  ) => Promise<void>
  onReopenMonitoring?: (appId: string | number) => Promise<void>
}

function MonitoringModal({ app, onClose, onAddMonitoringUpdate, onReopenMonitoring }: MonitoringModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showConfirmComplete, setShowConfirmComplete] = useState(false)

  // Add update form state
  const [monitoringDate, setMonitoringDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedStatus, setSelectedStatus] = useState("ONGOING")
  const [progressUpdate, setProgressUpdate] = useState("")
  const [remarks, setRemarks] = useState("")
  const [nextFollowUpDate, setNextFollowUpDate] = useState("")

  const monitoringLogs: LivelihoodMonitoringRecord[] = app.monitoring || []
  const currentStatus = (monitoringLogs[0]?.monitoring_status || monitoringLogs[0]?.status || "ACTIVE").toUpperCase()
  const isCompleted = currentStatus === "COMPLETED"

  const fullName = [app.firstName, app.middleName, app.lastName].filter(Boolean).join(" ")
  const assistance = app.assistance

  // Format materials & equipment received
  const materialsList = Array.isArray(assistance?.approved_materials)
    ? assistance.approved_materials
    : typeof assistance?.approved_materials === "string"
    ? (() => { try { const p = JSON.parse(assistance.approved_materials); return Array.isArray(p) ? p : [] } catch { return [] } })()
    : []
  const equipmentList = Array.isArray(assistance?.approved_equipment)
    ? assistance.approved_equipment
    : typeof assistance?.approved_equipment === "string"
    ? (() => { try { const p = JSON.parse(assistance.approved_equipment); return Array.isArray(p) ? p : [] } catch { return [] } })()
    : []
  const rawAmt = parseFloat(String(assistance?.approved_financial_amount || "").replace(/[^0-9.]/g, ""))
  const estAmt = parseFloat(String(app.estimatedAmount || app.estimated_amount || "").replace(/[^0-9.]/g, ""))
  const financialAmount = rawAmt > 0 ? rawAmt : estAmt > 0 ? estAmt : 15000

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!monitoringDate || !selectedStatus || !progressUpdate.trim()) return

    if (selectedStatus === "COMPLETED") {
      setShowConfirmComplete(true)
      return
    }

    await saveUpdate(selectedStatus)
  }

  const saveUpdate = async (statusToSave: string) => {
    setSubmitting(true)
    await onAddMonitoringUpdate(app.id, {
      monitoringDate,
      status: statusToSave,
      progressUpdate: progressUpdate.trim(),
      remarks: remarks.trim(),
      nextFollowUpDate: nextFollowUpDate || undefined,
    })
    setSubmitting(false)
    setShowAddForm(false)
    setShowConfirmComplete(false)
    setProgressUpdate("")
    setRemarks("")
  }

  const handleConfirmCompletion = async () => {
    await saveUpdate("COMPLETED")
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Livelihood Monitoring Details
              </h2>
              <MonitoringStatusBadge status={currentStatus} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Beneficiary: <strong className="text-foreground">{fullName}</strong> · Ref:{" "}
              <span className="font-mono font-bold text-foreground">{app.referenceNumber}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground text-2xl font-light hover:bg-muted transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* ============================================================ */}
          {/* 1. BENEFICIARY INFORMATION                                   */}
          {/* ============================================================ */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2">
              <User className="h-4 w-4 text-emerald-600" />
              1. Beneficiary Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Applicant Name</span>
                <span className="font-bold text-foreground text-sm block mt-0.5">{fullName}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Reference Number</span>
                <span className="font-mono font-bold text-foreground text-sm block mt-0.5">{app.referenceNumber}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Livelihood Type</span>
                <span className="font-bold text-foreground text-sm block mt-0.5">{app.entrepreneurCategory}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Business Name</span>
                <span className="font-bold text-foreground text-sm block mt-0.5">{app.businessName}</span>
              </div>
              <div className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px] text-muted-foreground">
                <div>Client Category: <strong className="text-foreground">{app.statusOfClient}</strong></div>
                <div>Contact: <strong className="text-foreground">{app.mobileNo}</strong></div>
                <div>Location: <strong className="text-foreground">{app.address}</strong></div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. ASSISTANCE RECEIVED                                       */}
          {/* ============================================================ */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2">
              <Package className="h-4 w-4 text-blue-600" />
              2. Assistance Received
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Financial Assistance */}
              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-emerald-800 dark:text-emerald-300 font-bold block text-[11px] uppercase flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5" /> Financial Capital Grant
                </span>
                <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-200 block mt-1">
                  ₱{Number(financialAmount).toLocaleString()}.00
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">Approved Cash Disbursement</span>
              </div>

              {/* Release Schedule & Handover Details */}
              <div className="col-span-2 p-3.5 rounded-xl border border-border bg-muted/15 space-y-1.5">
                <div className="flex items-center justify-between border-b border-border pb-1">
                  <span className="font-bold text-[11px] uppercase text-muted-foreground">Release Handover Status</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    RELEASED
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block">Actual Release Date:</span>
                    <strong className="text-foreground">
                      {assistance?.released_at
                        ? new Date(assistance.released_at).toLocaleDateString()
                        : assistance?.release_date || "September 1, 2026"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Actual Release Time:</span>
                    <strong className="text-foreground">{assistance?.release_time || "9:00 AM - 11:30 AM"}</strong>
                  </div>
                  <div className="col-span-full">
                    <span className="text-muted-foreground block">Release Location:</span>
                    <strong className="text-foreground">{assistance?.release_location || "Quezon City Hall - SSDD Livelihood Center"}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Materials & Equipment Lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
              {/* Materials */}
              <div className="border border-border rounded-xl p-3.5 bg-muted/10 space-y-2">
                <span className="font-bold text-foreground text-xs block uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-blue-600" />
                  Materials / Supplies Received ({materialsList.length})
                </span>
                {materialsList.length === 0 ? (
                  <p className="text-muted-foreground text-[11px] italic">No material items listed.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {materialsList.map((m, idx) => (
                      <li key={idx} className="p-2 rounded-lg bg-card border border-border flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-foreground">{m.item}</strong>
                          {m.description && <p className="text-[10px] text-muted-foreground">{m.description}</p>}
                        </div>
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-muted text-foreground">
                          {m.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Equipment */}
              <div className="border border-border rounded-xl p-3.5 bg-muted/10 space-y-2">
                <span className="font-bold text-foreground text-xs block uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-indigo-600" />
                  Equipment Received ({equipmentList.length})
                </span>
                {equipmentList.length === 0 ? (
                  <p className="text-muted-foreground text-[11px] italic">No equipment units listed.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {equipmentList.map((e, idx) => (
                      <li key={idx} className="p-2 rounded-lg bg-card border border-border flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-foreground">{e.equipment}</strong>
                          {e.description && <p className="text-[10px] text-muted-foreground">{e.description}</p>}
                        </div>
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-muted text-foreground">
                          {e.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 3. CURRENT MONITORING STATUS                                 */}
          {/* ============================================================ */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  3. Current Monitoring Status
                </h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <MonitoringStatusBadge status={currentStatus} />
                  <span className="text-xs text-muted-foreground">
                    {currentStatus === "ACTIVE" && "Active - Beneficiary has launched and operates business."}
                    {currentStatus === "ONGOING" && "Ongoing - Regular operational trade and sales in progress."}
                    {currentStatus === "NEEDS FOLLOW-UP" && "Needs Follow-up - Field visit or guidance needed."}
                    {currentStatus === "COMPLETED" && "Completed - Livelihood successfully graduated."}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isCompleted ? (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    id="btn-open-add-update"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    [ + ADD MONITORING UPDATE ]
                  </button>
                ) : (
                  onReopenMonitoring && (
                    <button
                      type="button"
                      onClick={() => onReopenMonitoring(app.id)}
                      className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reopen Monitoring
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Visual Workflow Breadcrumb */}
            <div className="p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
              <span className="font-bold text-foreground">Monitoring Progression:</span>
              <div className="flex items-center gap-1.5 font-semibold">
                <span className="text-muted-foreground">RELEASED</span>
                <span>&rarr;</span>
                <span className={currentStatus === "ACTIVE" ? "text-emerald-600 font-bold" : ""}>ACTIVE</span>
                <span>&rarr;</span>
                <span className={currentStatus === "ONGOING" ? "text-blue-600 font-bold" : ""}>ONGOING</span>
                <span>&rarr;</span>
                <span className={currentStatus === "NEEDS FOLLOW-UP" ? "text-amber-600 font-bold" : ""}>NEEDS FOLLOW-UP</span>
                <span>&rarr;</span>
                <span className={currentStatus === "COMPLETED" ? "text-purple-600 font-bold" : ""}>COMPLETED</span>
              </div>
            </div>

            {/* If COMPLETED, show informational banner */}
            {isCompleted && (
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-start gap-3 text-xs text-purple-900 dark:text-purple-200">
                <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Livelihood Monitoring Record is COMPLETED</strong>
                  <p className="mt-0.5 text-purple-800 dark:text-purple-300">
                    This beneficiary has successfully concluded all social service supervision requirements. Further monitoring updates are locked.
                  </p>
                </div>
              </div>
            )}

            {/* ADD MONITORING UPDATE FORM */}
            {showAddForm && !isCompleted && (
              <form onSubmit={handleFormSubmit} className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    New Monitoring Progress Evaluation
                  </h4>
                  <span className="text-[11px] text-muted-foreground">Officer: SSDD Social Worker / Admin</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Monitoring Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={monitoringDate}
                      onChange={(e) => setMonitoringDate(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Current Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      id="select-monitoring-status"
                      className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground font-bold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ONGOING">ONGOING</option>
                      <option value="NEEDS FOLLOW-UP">NEEDS FOLLOW-UP</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>

                  <div className="col-span-full">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Progress Update <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      id="textarea-progress-update"
                      placeholder="e.g. The sari-sari store is currently operating and generating regular sales."
                      value={progressUpdate}
                      onChange={(e) => setProgressUpdate(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground"
                    />
                  </div>

                  <div className="col-span-full">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Remarks (Optional)
                    </label>
                    <textarea
                      rows={2}
                      id="textarea-remarks"
                      placeholder="Optional notes, inventory observations, or guidance given..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Next Follow-up Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground font-semibold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-emerald-500/20">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
                  >
                    [ CANCEL ]
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !progressUpdate.trim()}
                    id="btn-save-monitoring-update"
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    [ SAVE MONITORING UPDATE ]
                  </button>
                </div>
              </form>
            )}

            {/* COMPLETED STATUS CONFIRMATION DIALOG */}
            {showConfirmComplete && (
              <div className="p-5 rounded-xl border border-purple-500/40 bg-purple-500/10 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-6 w-6 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-purple-950 dark:text-purple-200">
                      Confirm Livelihood Monitoring Completion
                    </h4>
                    <p className="text-xs text-purple-800 dark:text-purple-300 mt-0.5">
                      Are you sure you want to complete this livelihood monitoring record?
                      After confirmation, monitoring status will be set to <strong>COMPLETED</strong>, permanently saved, and further updates will be closed.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-purple-500/20">
                  <button
                    type="button"
                    onClick={() => setShowConfirmComplete(false)}
                    className="px-4 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleConfirmCompletion}
                    id="btn-confirm-completion"
                    className="px-6 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                  >
                    Confirm Completion
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 4. MONITORING HISTORY                                        */}
          {/* ============================================================ */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Monitoring History ({monitoringLogs.length})
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Chronological supervision evaluations and field progress logs
                </p>
              </div>
            </div>

            {monitoringLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-muted/15 rounded-xl border border-border">
                No monitoring records logged yet.
              </div>
            ) : (
              <div className="space-y-3">
                {monitoringLogs.map((log, idx) => (
                  <div key={log.id || idx} className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs hover:border-border/80 transition-colors">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-bold text-foreground">
                          {log.monitoring_date || log.inspection_date || (log.created_at ? new Date(log.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Recorded Date")}
                        </span>
                      </div>
                      <MonitoringStatusBadge status={log.monitoring_status || log.status || "ACTIVE"} />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">Progress Update:</span>
                      <p className="font-semibold text-foreground text-sm mt-0.5 leading-relaxed">
                        {log.progress_update || log.title || "Monitoring update recorded."}
                      </p>
                    </div>

                    {log.remarks && (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Remarks:</span>
                        <p className="text-muted-foreground mt-0.5">{log.remarks}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
                      <span>Evaluator: <strong className="text-foreground">{log.officer_name || "SSDD Social Worker / Admin"}</strong></span>
                      {log.next_follow_up_date && (
                        <span>Next Follow-up: <strong className="text-emerald-600">{log.next_follow_up_date}</strong></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-border text-foreground font-semibold text-xs hover:bg-muted transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================================================
// MAIN ADMIN COMPONENT
// =====================================================================================
export default function LivelihoodApplicationsAdmin() {
  // Initialize applications from localStorage or seed
  const [applications, setApplications] = useState<LivelihoodApplication[]>(() => {
    try {
      const stored = localStorage.getItem("livelihood_applications")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (a: any) =>
              a.reference_number !== "LP-2026-2104" &&
              a.reference_number !== "LP-2026-3891" &&
              a.reference_number !== "LP-2026-1042" &&
              a.reference_number !== "LP-2026-2518"
          )
          return cleaned.map(normalizeApplication)
        }
      }
    } catch (_) {}
    return []
  })

  const [adminTab, setAdminTab] = useState<"applications" | "assistance" | "monitoring">("applications")

  // Modals state
  const [selectedReviewApp, setSelectedReviewApp] = useState<LivelihoodApplication | null>(null)
  const [selectedAssistanceApp, setSelectedAssistanceApp] = useState<LivelihoodApplication | null>(null)
  const [selectedMonitoringApp, setSelectedMonitoringApp] = useState<LivelihoodApplication | null>(null)

  // Filters & Search
  const [filterStatusOfClient, setFilterStatusOfClient] = useState("all")
  const [filterStatus, setFilterStatus] = useState<"all" | ApplicationStatus>("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Single source of truth storage updater
  const updateAndPersist = (updatedList: LivelihoodApplication[]) => {
    setApplications(updatedList)
    try {
      localStorage.setItem("livelihood_applications", JSON.stringify(updatedList))
      window.dispatchEvent(new Event("livelihood_status_updated"))
      window.dispatchEvent(new Event("storage"))
    } catch (_) {}
  }

  // Fetch applications from backend
  const fetchApps = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/livelihood/applications`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.applications)) {
          const backendApps = data.applications.map(normalizeApplication)
          setApplications(backendApps)
          try {
            localStorage.setItem("livelihood_applications", JSON.stringify(backendApps))
          } catch (_) {}
          return
        }
      }
    } catch (_) {}
  }

  // Reset / Clear all applications in Admin for clean testing
  const handleResetAll = async () => {
    if (!window.confirm("Sigurado ka bang nais mong burahin ang lahat ng livelihood applications at records sa Admin para makapagsimula mula sa simula?")) {
      return
    }
    setApplications([])
    setSelectedReviewApp(null)
    setSelectedAssistanceApp(null)
    setSelectedMonitoringApp(null)
    try {
      localStorage.removeItem("livelihood_applications")
      window.dispatchEvent(new Event("livelihood_status_updated"))
      window.dispatchEvent(new Event("storage"))
    } catch (_) {}

    try {
      await fetch(`${API_BASE}/api/livelihood/applications/reset`, { method: "POST" })
    } catch (_) {}
  }

  useEffect(() => {
    fetchApps()
    const interval = setInterval(fetchApps, 3000)
    window.addEventListener("livelihood_status_updated", fetchApps)
    window.addEventListener("storage", fetchApps)

    return () => {
      clearInterval(interval)
      window.removeEventListener("livelihood_status_updated", fetchApps)
      window.removeEventListener("storage", fetchApps)
    }
  }, [])

  // ==========================================
  // REQUIRED APPROVAL LOGIC
  // ==========================================
  const handleApproveApplication = async (id: string | number) => {
    const updatedList = applications.map((app) => {
      if (String(app.id) === String(id) || app.referenceNumber === id || app.reference_number === id) {
        const existingAssistance = app.assistance
        const assistanceRecord: CapitalMaterialsAssistance = existingAssistance || {
          id: `ASST-${app.id || app.referenceNumber}`,
          application_id: app.id,
          reference_number: app.referenceNumber,
          beneficiary_id: app.userId || app.qcid || `QC-${app.id}`,
          assistance_status: "FOR PROCESSING",
          release_status: "NOT RELEASED",
          approved_financial_amount: (() => {
            const estApp = parseFloat(String(app.estimatedAmount || app.estimated_amount || "").replace(/[^0-9.]/g, ""))
            return estApp > 0 ? estApp : 15000
          })(),
          approved_materials: [],
          approved_equipment: [],
          release_date: "",
          release_time: "",
          release_location: "Quezon City Hall - SSDD Livelihood Center",
          instructions: "Please bring a valid ID and your Livelihood Application Reference Number.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        return {
          ...app,
          status: "approved" as ApplicationStatus,
          application_status: "approved",
          approvedBy: "SSDD Livelihood Evaluator",
          approved_by: "SSDD Livelihood Evaluator",
          approvedDate: new Date().toISOString(),
          approved_date: new Date().toISOString(),
          assistance: assistanceRecord,
        }
      }
      return app
    })

    updateAndPersist(updatedList)

    try {
      await fetch(`${API_BASE}/api/livelihood/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          approvedBy: "SSDD Livelihood Evaluator",
        }),
      })
    } catch (_) {}

    setSelectedReviewApp(null)
  }

  const handleRequestRevision = async (id: string | number, reason: string, remarks: string) => {
    const updatedList = applications.map((app) => {
      if (String(app.id) === String(id) || app.referenceNumber === id) {
        return {
          ...app,
          status: "needs_revision" as ApplicationStatus,
          application_status: "needs_revision",
          revisionReason: reason,
          revision_reason: reason,
          revisionNotes: remarks,
          revision_notes: remarks,
          adminNotes: remarks,
          admin_notes: remarks,
        }
      }
      return app
    })

    updateAndPersist(updatedList)

    try {
      await fetch(`${API_BASE}/api/livelihood/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "needs_revision",
          rejectionReason: reason,
          revisionNotes: remarks,
          adminNotes: remarks,
        }),
      })
    } catch (_) {}

    setSelectedReviewApp(null)
  }

  const handleRejectApplication = async (id: string | number, reason: string, remarks: string) => {
    const updatedList = applications.map((app) => {
      if (String(app.id) === String(id) || app.referenceNumber === id) {
        return {
          ...app,
          status: "rejected" as ApplicationStatus,
          application_status: "rejected",
          rejectionReason: reason,
          rejection_reason: reason,
          adminNotes: remarks,
          admin_notes: remarks,
        }
      }
      return app
    })

    updateAndPersist(updatedList)

    try {
      await fetch(`${API_BASE}/api/livelihood/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          rejectionReason: reason,
          adminNotes: remarks,
        }),
      })
    } catch (_) {}

    setSelectedReviewApp(null)
  }

  // Save Assistance Details (Stage 2)
  const handleSaveAssistance = async (appId: string | number, assistanceData: CapitalMaterialsAssistance) => {
    const isReleased = assistanceData.assistance_status === "RELEASED" || assistanceData.assistance_status === "released"

    const targetApp = applications.find(
      (a) => String(a.id) === String(appId) || a.referenceNumber === appId || a.reference_number === appId
    )
    const effectiveAppId = targetApp?.referenceNumber || targetApp?.id || appId

    const updatedList = applications.map((app) => {
      if (String(app.id) === String(appId) || app.referenceNumber === appId || app.reference_number === appId) {
        let monLogs = app.monitoring || []
        if (isReleased && monLogs.length === 0) {
          monLogs = [
            {
              id: `MON-${Date.now()}`,
              application_id: app.id,
              reference_number: app.referenceNumber,
              capital_materials_id: assistanceData.id,
              beneficiary_id: app.userId || app.qcid,
              monitoring_status: "ACTIVE",
              monitoring_date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
              progress_update: "Initial monitoring has started. The beneficiary has received the approved livelihood assistance.",
              remarks: "Initial monitoring record created upon assistance release.",
              officer_name: "SSDD Social Worker / Admin",
              created_at: new Date().toISOString(),
            },
          ]
        }

        return {
          ...app,
          assistance: {
            ...assistanceData,
            release_status: (isReleased ? "RELEASED" : "NOT RELEASED") as "RELEASED" | "NOT RELEASED",
          },
          monitoring: monLogs,
        }
      }
      return app
    })

    updateAndPersist(updatedList)

    try {
      await fetch(`${API_BASE}/api/livelihood/applications/${effectiveAppId}/assistance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistanceStatus: isReleased ? "released" : assistanceData.assistance_status.toLowerCase().replace(" ", "_"),
          approvedFinancialAmount: assistanceData.approved_financial_amount,
          approvedMaterials: assistanceData.approved_materials,
          approvedEquipment: assistanceData.approved_equipment,
          releaseDate: assistanceData.release_date,
          releaseTime: assistanceData.release_time,
          releaseLocation: assistanceData.release_location,
          instructions: assistanceData.instructions,
          releasedBy: assistanceData.released_by || "SSDD Admin Evaluator",
        }),
      })
    } catch (_) {}
  }

  // Add Monitoring Update (Stage 3)
  const handleAddMonitoringUpdate = async (
    appId: string | number,
    update: {
      monitoringDate: string
      status: string
      progressUpdate: string
      remarks: string
      nextFollowUpDate?: string
    }
  ) => {
    const targetApp = applications.find(
      (a) => String(a.id) === String(appId) || a.referenceNumber === appId || a.reference_number === appId
    )
    const effectiveAppId = targetApp?.referenceNumber || targetApp?.id || appId

    let updatedAppObject: LivelihoodApplication | null = null

    const updatedList = applications.map((app) => {
      if (
        String(app.id) === String(appId) ||
        app.referenceNumber === appId ||
        app.reference_number === appId
      ) {
        const newLog: LivelihoodMonitoringRecord = {
          id: `MON-${Date.now()}`,
          application_id: app.id,
          reference_number: app.referenceNumber,
          capital_materials_id: app.assistance?.id,
          beneficiary_id: app.userId || app.qcid,
          monitoring_status: update.status.toUpperCase(),
          status: update.status.toUpperCase(),
          monitoring_date: update.monitoringDate,
          progress_update: update.progressUpdate,
          remarks: update.remarks,
          next_follow_up_date: update.nextFollowUpDate,
          officer_name: "SSDD Social Worker / Admin",
          created_at: new Date().toISOString(),
        }

        const newApp: LivelihoodApplication = {
          ...app,
          monitoring: [newLog, ...(app.monitoring || [])],
        }
        updatedAppObject = newApp
        return newApp
      }
      return app
    })

    updateAndPersist(updatedList)

    // Immediately update modal active app state so modal re-renders with new status and history
    if (updatedAppObject) {
      setSelectedMonitoringApp(updatedAppObject)
    }

    try {
      await fetch(`${API_BASE}/api/livelihood/applications/${effectiveAppId}/monitoring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: update.status,
          monitoringDate: update.monitoringDate,
          progressUpdate: update.progressUpdate,
          remarks: update.remarks,
          nextFollowUpDate: update.nextFollowUpDate,
        }),
      })
    } catch (_) {}
  }

  // Reopen Monitoring if completed
  const handleReopenMonitoring = async (appId: string | number) => {
    let updatedAppObject: LivelihoodApplication | null = null

    const updatedList = applications.map((app) => {
      if (String(app.id) === String(appId) || app.referenceNumber === appId) {
        const newLog: LivelihoodMonitoringRecord = {
          id: `MON-${Date.now()}`,
          application_id: app.id,
          reference_number: app.referenceNumber,
          capital_materials_id: app.assistance?.id,
          beneficiary_id: app.userId || app.qcid,
          monitoring_status: "ONGOING",
          status: "ONGOING",
          monitoring_date: new Date().toISOString().split("T")[0],
          progress_update: "Livelihood monitoring record reopened by authorized Admin for ongoing supervision.",
          remarks: "Reopened for follow-up evaluation and guidance.",
          officer_name: "SSDD Social Worker / Admin",
          created_at: new Date().toISOString(),
        }

        const newApp: LivelihoodApplication = {
          ...app,
          monitoring: [newLog, ...(app.monitoring || [])],
        }
        updatedAppObject = newApp
        return newApp
      }
      return app
    })

    updateAndPersist(updatedList)
    if (updatedAppObject) {
      setSelectedMonitoringApp(updatedAppObject)
    }
  }

  // Stage 2: All applications where application_status = "APPROVED" AND has a valid linked Capital / Materials Assistance record
  const capitalMaterialsList = applications.filter(
    (app) => (app.status === "approved" || app.application_status === "approved") && app.assistance !== null
  )

  // Stage 3: All released assistance records
  const releasedBeneficiaries = capitalMaterialsList.filter(
    (app) =>
      app.assistance?.assistance_status === "RELEASED" ||
      app.assistance?.assistance_status === "released" ||
      app.assistance?.release_status === "RELEASED"
  )

  // Stage 1: Applications review list
  const filteredApps = applications.filter((app) => {
    const matchStatusOfClient = filterStatusOfClient === "all" || app.statusOfClient === filterStatusOfClient
    const isPendingMatch =
      filterStatus === "pending"
        ? app.status === "pending" || app.status === "under_review" || app.application_status === "pending" || app.application_status === "under_review"
        : app.status === filterStatus || app.application_status === filterStatus
    const matchStatus = filterStatus === "all" || isPendingMatch
    const matchSearch =
      searchTerm === "" ||
      app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    return matchStatusOfClient && matchStatus && matchSearch
  })

  // Exact Dashboard Counters
  const pendingCount = applications.filter(
    (a) => a.status === "pending" || a.status === "under_review" || a.application_status === "pending" || a.application_status === "under_review"
  ).length
  const approvedCount = applications.filter(
    (a) => a.status === "approved" || a.application_status === "approved"
  ).length
  const rejectedCount = applications.filter(
    (a) => a.status === "rejected" || a.application_status === "rejected"
  ).length

  const forProcessingCount = capitalMaterialsList.filter(
    (a) =>
      a.assistance?.assistance_status === "FOR PROCESSING" ||
      a.assistance?.assistance_status === "for_processing"
  ).length
  const forReleaseCount = capitalMaterialsList.filter(
    (a) =>
      a.assistance?.assistance_status === "FOR RELEASE" ||
      a.assistance?.assistance_status === "for_release"
  ).length
  const releasedCount = releasedBeneficiaries.length

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Livelihood &amp; Training Program Administration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Intake evaluation, capital &amp; materials disbursement, and post-release livelihood monitoring.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetAll}
          id="btn-reset-livelihood-registry"
          className="px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center shrink-0 shadow-xs"
          title="Burahin lahat ng records sa Admin para sa malinis na testing"
        >
          <Trash2 className="h-4 w-4" />
          [ Burahin Laman ng Admin / Reset ]
        </button>
      </div>

      {/* Admin 3-Stage Navigation Tabs */}
      <div className="bg-card border border-border rounded-2xl p-1.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setAdminTab("applications")}
            id="tab-admin-applications"
            className={`px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              adminTab === "applications"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>1. APPLICATIONS REVIEW ({pendingCount} Pending)</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab("assistance")}
            id="tab-admin-assistance"
            className={`px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              adminTab === "assistance"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>2. CAPITAL / MATERIALS ({capitalMaterialsList.length} Approved)</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab("monitoring")}
            id="tab-admin-monitoring"
            className={`px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              adminTab === "monitoring"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>3. LIVELIHOOD MONITORING ({releasedCount} Released)</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: APPLICATIONS INTAKE & REVIEW                          */}
      {/* ============================================================ */}
      {adminTab === "applications" && (
        <div className="space-y-6">
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Applications", value: applications.length, border: "border-blue-200 dark:border-blue-900", bg: "bg-blue-50/50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-300" },
              { label: "Pending Review", value: pendingCount, border: "border-amber-200 dark:border-amber-900", bg: "bg-amber-50/50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-300" },
              { label: "Approved", value: approvedCount, border: "border-emerald-200 dark:border-emerald-900", bg: "bg-emerald-50/50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-300" },
              { label: "Rejected", value: rejectedCount, border: "border-rose-200 dark:border-rose-900", bg: "bg-rose-50/50 dark:bg-rose-950/20", text: "text-rose-700 dark:text-rose-300" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl p-4 border ${stat.border} ${stat.bg} shadow-xs`}>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl sm:text-3xl font-extrabold ${stat.text} mt-1.5`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl bg-muted/20">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search by applicant name or reference number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 text-xs sm:text-sm bg-transparent focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status of Client</label>
                <select
                  value={filterStatusOfClient}
                  onChange={(e) => setFilterStatusOfClient(e.target.value)}
                  className="mt-1 px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 block"
                >
                  <option value="all">All Categories</option>
                  <option value="Micro entrepreneur/ Vendors">Micro entrepreneur/ Vendors</option>
                  <option value="OFW / Displaced Worker">OFW / Displaced Worker</option>
                  <option value="Solo Parent">Solo Parent</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "all" | ApplicationStatus)}
                  className="mt-1 px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 block"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="needs_revision">Needs Revision</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Applications Registry ({filteredApps.length})
            </h2>

            {filteredApps.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-bold text-foreground">No applications found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map((app) => {
                  const name = [app.firstName, app.middleName, app.lastName].filter(Boolean).join(" ")
                  return (
                    <div key={app.id} className="bg-card border border-border rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-foreground truncate">{name}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                              {app.entrepreneurCategory}
                            </span>
                            <StatusBadge status={app.status} />
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="font-mono font-semibold text-foreground">REF: {app.referenceNumber}</span>
                            <span>·</span>
                            <span>Client: {app.statusOfClient}</span>
                            <span>·</span>
                            <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                          </div>

                          <div className="text-xs text-muted-foreground flex items-center gap-4 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              {app.businessName}
                            </span>
                            <span>{app.documents.length} documents</span>
                          </div>
                        </div>

                        <div className="flex items-center sm:self-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedReviewApp(app)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            [ REVIEW ]
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: CAPITAL / MATERIALS (STAGE 2)                         */}
      {/* ============================================================ */}
      {adminTab === "assistance" && (
        <div className="space-y-6">
          {/* Dashboard Metrics for Stage 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Approved Grants", value: capitalMaterialsList.length, border: "border-indigo-200 dark:border-indigo-900", bg: "bg-indigo-50/50 dark:bg-indigo-950/20", text: "text-indigo-700 dark:text-indigo-300" },
              { label: "For Processing", value: forProcessingCount, border: "border-amber-200 dark:border-amber-900", bg: "bg-amber-50/50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-300" },
              { label: "For Release", value: forReleaseCount, border: "border-blue-200 dark:border-blue-900", bg: "bg-blue-50/50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-300" },
              { label: "Released", value: releasedCount, border: "border-emerald-200 dark:border-emerald-900", bg: "bg-emerald-50/50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-300" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl p-4 border ${stat.border} ${stat.bg} shadow-xs`}>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl sm:text-3xl font-extrabold ${stat.text} mt-1.5`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Approved Beneficiaries ({capitalMaterialsList.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                All approved applications with active Capital / Materials Assistance records
              </p>
            </div>

            {capitalMaterialsList.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-bold text-foreground">No approved applications in Capital / Materials</p>
                <p className="text-xs text-muted-foreground mt-1">
                  When you approve a pending application in Tab 1, it will automatically appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {capitalMaterialsList.map((app) => {
                  const name = [app.firstName, app.middleName, app.lastName].filter(Boolean).join(" ")
                  const assistStatus = (app.assistance?.assistance_status || "FOR PROCESSING").toUpperCase()
                  const approvalDateStr = app.approvedDate || app.approved_date
                    ? new Date(app.approvedDate || app.approved_date!).toLocaleDateString()
                    : new Date(app.submittedAt).toLocaleDateString()

                  return (
                    <div key={app.id} className="bg-card border border-border rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-foreground truncate">{name}</h3>
                            <span className="font-mono text-xs font-semibold text-foreground">REF: {app.referenceNumber}</span>
                            <AssistanceStatusBadge status={assistStatus} />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Livelihood Type</span>
                              <span className="font-semibold text-foreground">{app.entrepreneurCategory}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Business Name</span>
                              <span className="font-semibold text-foreground">{app.businessName}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Approval Date</span>
                              <span className="font-semibold text-foreground">{approvalDateStr}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Current Status</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400 uppercase">
                                {assistStatus}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedAssistanceApp(app)}
                            id={`btn-process-assistance-${app.id}`}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <Package className="h-4 w-4" />
                            [ PROCESS ASSISTANCE ]
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: LIVELIHOOD MONITORING (STAGE 3)                       */}
      {/* ============================================================ */}
      {adminTab === "monitoring" && (
        <div className="space-y-6">
          {/* Dashboard Metrics for Stage 3 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Released", value: releasedCount, border: "border-emerald-200 dark:border-emerald-900", bg: "bg-emerald-50/50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-300" },
              { label: "Active Operations", value: releasedBeneficiaries.filter((a) => (a.monitoring[0]?.monitoring_status || "ACTIVE").includes("ACTIVE")).length, border: "border-teal-200 dark:border-teal-900", bg: "bg-teal-50/50 dark:bg-teal-950/20", text: "text-teal-700 dark:text-teal-300" },
              { label: "Ongoing Follow-up", value: releasedBeneficiaries.filter((a) => (a.monitoring[0]?.monitoring_status || "").includes("ONGOING")).length, border: "border-blue-200 dark:border-blue-900", bg: "bg-blue-50/50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-300" },
              { label: "Needs Follow-up", value: releasedBeneficiaries.filter((a) => (a.monitoring[0]?.monitoring_status || "").includes("NEEDS") || (a.monitoring[0]?.monitoring_status || "").includes("FOLLOW")).length, border: "border-amber-200 dark:border-amber-900", bg: "bg-amber-50/50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-300" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl p-4 border ${stat.border} ${stat.bg} shadow-xs`}>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl sm:text-3xl font-extrabold ${stat.text} mt-1.5`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Released Assistance Records for Monitoring ({releasedBeneficiaries.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Beneficiaries whose Capital / Materials assistance has been marked as RELEASED
              </p>
            </div>

            {releasedBeneficiaries.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-bold text-foreground">No released beneficiaries yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Once an approved application&apos;s assistance is marked as [ MARK AS RELEASED ], it will automatically appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {releasedBeneficiaries.map((app) => {
                  const name = [app.firstName, app.middleName, app.lastName].filter(Boolean).join(" ")
                  const monStatus = app.monitoring[0]?.monitoring_status || "ACTIVE"
                  const lastUpdate = app.monitoring[0]?.progress_update || "Active business operation"

                  return (
                    <div key={app.id} className="bg-card border border-border rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-foreground truncate">{name}</h3>
                            <span className="font-mono text-xs font-semibold text-foreground">REF: {app.referenceNumber}</span>
                            <MonitoringStatusBadge status={monStatus} />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Business</span>
                              <span className="font-semibold text-foreground">{app.businessName} ({app.entrepreneurCategory})</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Latest Update</span>
                              <span className="font-semibold text-foreground truncate block">{lastUpdate}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Release Handover</span>
                              <span className="font-semibold text-foreground">
                                {app.assistance?.released_at ? new Date(app.assistance.released_at).toLocaleDateString() : app.assistance?.release_date || "Released"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedMonitoringApp(app)}
                            id={`btn-monitor-${app.id}`}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <Activity className="h-4 w-4" />
                            [ MONITOR ]
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS                                                       */}
      {/* ============================================================ */}
      {/* 1. Stage 1 Review Modal */}
      {selectedReviewApp && (
        <ReviewModal
          app={selectedReviewApp}
          onClose={() => setSelectedReviewApp(null)}
          onApprove={handleApproveApplication}
          onReject={handleRejectApplication}
          onRequestRevision={handleRequestRevision}
          onOpenAssistance={(app) => {
            setAdminTab("assistance")
            setSelectedAssistanceApp(app)
          }}
        />
      )}

      {/* 2. Stage 2 Capital / Materials Processing Modal */}
      {selectedAssistanceApp && (
        <AssistanceModal
          app={selectedAssistanceApp}
          onClose={() => setSelectedAssistanceApp(null)}
          onSaveAssistance={handleSaveAssistance}
        />
      )}

      {/* 3. Stage 3 Monitoring & Progress Update Modal */}
      {selectedMonitoringApp && (
        <MonitoringModal
          app={selectedMonitoringApp}
          onClose={() => setSelectedMonitoringApp(null)}
          onAddMonitoringUpdate={handleAddMonitoringUpdate}
          onReopenMonitoring={handleReopenMonitoring}
        />
      )}
    </div>
  )
}
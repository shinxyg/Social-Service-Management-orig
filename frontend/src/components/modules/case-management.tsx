import { useState, type ReactElement } from "react"
import {
  ClipboardList,
  Send,
  HeartHandshake,
  History,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  User,
  Plus,
  ChevronRight,
} from "lucide-react"

type ModuleKey =
  | "AICS"
  | "PWD"
  | "Senior Citizen"
  | "Solo Parent"
  | "Child Welfare"
  | "Livelihood"

type CaseStatus = "open" | "monitoring" | "referred" | "closed"
type CasePriority = "high" | "medium" | "low"
type ReferralStatus = "pending" | "accepted" | "completed" | "declined"

interface Referral {
  id: string
  date: string
  referredTo: string
  reason: string
  referredBy: string
  status: ReferralStatus
  remarks?: string
}

interface AssistanceRecord {
  id: string
  date: string
  type: string
  amount?: string
  description: string
  providedBy: string
}

interface StatusEvent {
  id: string
  date: string
  status: CaseStatus
  note: string
  by: string
}

interface CaseRecord {
  id: string
  caseNumber: string
  clientName: string
  age: string
  sex: string
  address: string
  contactNo: string
  linkedProgram: ModuleKey
  linkedReferenceNo: string
  caseType: string
  dateOpened: string
  assignedSocialWorker: string
  status: CaseStatus
  priority: CasePriority
  summary: string
  referrals: Referral[]
  assistance: AssistanceRecord[]
  statusHistory: StatusEvent[]
}

// =====================================================================================
// Mock data — cases follow up on applicants already seen in the other modules
// (AICS, PWD & Senior Citizen, Solo Parent & Child Welfare, Livelihood & Training)
// =====================================================================================

const MOCK_CASES: CaseRecord[] = [
  {
    id: "CASE-001",
    caseNumber: "CM-2026-0001",
    clientName: "Clarisa Mae Dimal",
    age: "21",
    sex: "Female",
    address: "11 Sampaloc Street, Brgy. Sauyo, Quezon City",
    contactNo: "0917 555 1234",
    linkedProgram: "AICS",
    linkedReferenceNo: "AICS-2026-4127",
    caseType: "Medical Assistance Follow-up",
    dateOpened: "2026-08-21",
    assignedSocialWorker: "Admin User",
    status: "monitoring",
    priority: "high",
    summary:
      "Client's child (Josh Dimal, 4 y/o) requires continued asthma maintenance medication. Medical assistance was released; monitoring ongoing kasabay ng Child Welfare case CW-2026-3312.",
    referrals: [
      {
        id: "REF-001",
        date: "2026-08-21",
        referredTo: "Quezon City General Hospital — Pediatrics",
        reason: "Follow-up check-up para sa asthma management ng anak.",
        referredBy: "Admin User",
        status: "accepted",
        remarks: "Naka-schedule na ng follow-up consult.",
      },
    ],
    assistance: [
      {
        id: "AST-001",
        date: "2026-08-21",
        type: "Medical Assistance",
        amount: "8,500",
        description: "Gamot at ospital na gastusin para sa medical assistance application.",
        providedBy: "AICS Program",
      },
    ],
    statusHistory: [
      { id: "SH-001", date: "2026-08-19", status: "open", note: "Case opened matapos ma-approve ang AICS application.", by: "Admin User" },
      { id: "SH-002", date: "2026-08-21", status: "monitoring", note: "Nilipat sa monitoring habang tinutugunan ang pangangailangan sa Child Welfare.", by: "Admin User" },
    ],
  },
  {
    id: "CASE-002",
    caseNumber: "CM-2026-0002",
    clientName: "Rosalinda Torres",
    age: "71",
    sex: "Female",
    address: "Purok 5, Barangay Malaya, Quezon City",
    contactNo: "0917 555 2233",
    linkedProgram: "Senior Citizen",
    linkedReferenceNo: "SC-2026-4521",
    caseType: "Aftercare — OSCA ID Released",
    dateOpened: "2026-08-14",
    assignedSocialWorker: "Admin User",
    status: "closed",
    priority: "low",
    summary: "New OSCA ID application approved and released. Walang karagdagang pangangailangan na naitala.",
    referrals: [],
    assistance: [
      {
        id: "AST-002",
        date: "2026-08-25",
        type: "OSCA ID Release",
        description: "Naibigay ang Senior Citizen ID matapos ang verification appointment.",
        providedBy: "OSCA Office, QC Hall",
      },
    ],
    statusHistory: [
      { id: "SH-003", date: "2026-08-14", status: "open", note: "Case opened kasabay ng application.", by: "Admin User" },
      { id: "SH-004", date: "2026-08-25", status: "closed", note: "Naibigay na ang ID; walang follow-up na kinakailangan.", by: "Admin User" },
    ],
  },
  {
    id: "CASE-003",
    caseNumber: "CM-2026-0003",
    clientName: "Julius Cabrera",
    age: "36",
    sex: "Male",
    address: "Zone 1, Barangay San Roque, Quezon City",
    contactNo: "0928 774 4410",
    linkedProgram: "PWD",
    linkedReferenceNo: "PWD-2026-3421",
    caseType: "Continued Benefits Monitoring",
    dateOpened: "2026-08-13",
    assignedSocialWorker: "Jonalyn P.",
    status: "monitoring",
    priority: "medium",
    summary: "Renewal ng PWD ID approved. Monitoring ng access sa discount privileges at posibleng livelihood referral.",
    referrals: [
      {
        id: "REF-002",
        date: "2026-08-16",
        referredTo: "PDAO Office, QC Hall",
        reason: "Assessment para sa karagdagang assistive device support.",
        referredBy: "Jonalyn P.",
        status: "pending",
      },
    ],
    assistance: [],
    statusHistory: [
      { id: "SH-005", date: "2026-08-13", status: "open", note: "Case opened matapos ang renewal approval.", by: "Jonalyn P." },
      { id: "SH-006", date: "2026-08-16", status: "monitoring", note: "Naghintay ng referral outcome sa PDAO.", by: "Jonalyn P." },
    ],
  },
  {
    id: "CASE-004",
    caseNumber: "CM-2026-0004",
    clientName: "Emilyn Salazar",
    age: "34",
    sex: "Female",
    address: "Purok 2, Barangay Sto. Niño, Quezon City",
    contactNo: "0917 332 8891",
    linkedProgram: "Solo Parent",
    linkedReferenceNo: "SP-2026-4821",
    caseType: "Crisis Intervention — Death of Spouse",
    dateOpened: "2026-08-17",
    assignedSocialWorker: "Admin User",
    status: "open",
    priority: "high",
    summary:
      "Solo parent application pending; kasalukuyang nangangailangan ng agarang tulong pagkain at livelihood support habang naghihintay ng ID.",
    referrals: [
      {
        id: "REF-003",
        date: "2026-08-18",
        referredTo: "Livelihood & Training Program",
        reason: "Pagsasanay o starter kit para sa panibagong pinagkukunan ng kita.",
        referredBy: "Admin User",
        status: "pending",
      },
    ],
    assistance: [
      {
        id: "AST-003",
        date: "2026-08-18",
        type: "Food Pack",
        description: "Isang linggong food pack habang naghihintay ng Solo Parent ID.",
        providedBy: "Admin User",
      },
    ],
    statusHistory: [
      { id: "SH-007", date: "2026-08-17", status: "open", note: "Case opened; agad na kinilala bilang high priority.", by: "Admin User" },
    ],
  },
  {
    id: "CASE-005",
    caseNumber: "CM-2026-0005",
    clientName: "Ferdinand Villanueva",
    age: "54",
    sex: "Male",
    address: "23 Masagana St., Brgy. Payatas, Quezon City",
    contactNo: "0915 887 2210",
    linkedProgram: "Livelihood",
    linkedReferenceNo: "TRNG-2026-2201",
    caseType: "Referral Coordination — Skills Training",
    dateOpened: "2026-08-16",
    assignedSocialWorker: "Jonalyn P.",
    status: "referred",
    priority: "medium",
    summary: "Naka-schedule na ng Motorcycle/Small Engine Servicing Training. Ni-refer din para sa PWD assessment.",
    referrals: [
      {
        id: "REF-004",
        date: "2026-08-16",
        referredTo: "SSDD Training Center",
        reason: "Motorcycle/Small Engine Servicing Training enrollment.",
        referredBy: "Jonalyn P.",
        status: "accepted",
        remarks: "Naka-schedule Aug 27, 2026, 9:00 AM.",
      },
    ],
    assistance: [],
    statusHistory: [
      { id: "SH-008", date: "2026-08-16", status: "open", note: "Case opened matapos mag-apply sa livelihood training.", by: "Jonalyn P." },
      { id: "SH-009", date: "2026-08-16", status: "referred", note: "Ni-refer sa SSDD Training Center.", by: "Jonalyn P." },
    ],
  },
  {
    id: "CASE-006",
    caseNumber: "CM-2026-0006",
    clientName: "Bryan Aguilar",
    age: "41",
    sex: "Male",
    address: "Zone 4, Barangay Bagumbayan, Quezon City",
    contactNo: "0928 110 4477",
    linkedProgram: "Solo Parent",
    linkedReferenceNo: "SP-2026-4790",
    caseType: "Document Completion Support",
    dateOpened: "2026-08-17",
    assignedSocialWorker: "Admin User",
    status: "open",
    priority: "medium",
    summary: "Nabigo ang renewal dahil sa hindi kumpletong requirements. Kailangan ng tulong para makuha ang kulang na dokumento mula sa barangay.",
    referrals: [
      {
        id: "REF-005",
        date: "2026-08-17",
        referredTo: "Barangay Bagumbayan Office",
        reason: "Pagkuha ng endorsement mula sa Solo Parent President.",
        referredBy: "Admin User",
        status: "pending",
      },
    ],
    assistance: [],
    statusHistory: [
      { id: "SH-010", date: "2026-08-17", status: "open", note: "Case opened matapos ma-reject ang renewal dahil sa kulang na dokumento.", by: "Admin User" },
    ],
  },
]

const programColors: Record<ModuleKey, string> = {
  AICS: "bg-blue-50 text-blue-700 border-blue-200",
  PWD: "bg-purple-50 text-purple-700 border-purple-200",
  "Senior Citizen": "bg-amber-50 text-amber-700 border-amber-200",
  "Solo Parent": "bg-violet-50 text-violet-700 border-violet-200",
  "Child Welfare": "bg-rose-50 text-rose-700 border-rose-200",
  Livelihood: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const PROGRAM_OPTIONS: ModuleKey[] = ["AICS", "PWD", "Senior Citizen", "Solo Parent", "Child Welfare", "Livelihood"]

const statusTheme: Record<CaseStatus, { chip: string; card: string; icon: ReactElement; label: string }> = {
  open: {
    chip: "bg-sky-100 text-sky-700",
    card: "bg-sky-50/60 border-sky-200",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: "Open",
  },
  monitoring: {
    chip: "bg-blue-100 text-blue-700",
    card: "bg-blue-50/60 border-blue-200",
    icon: <Clock className="h-3.5 w-3.5" />,
    label: "Under Monitoring",
  },
  referred: {
    chip: "bg-indigo-100 text-indigo-700",
    card: "bg-indigo-50/60 border-indigo-200",
    icon: <Send className="h-3.5 w-3.5" />,
    label: "Referred",
  },
  closed: {
    chip: "bg-emerald-100 text-emerald-700",
    card: "bg-emerald-50/60 border-emerald-200",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Closed",
  },
}

const priorityTheme: Record<CasePriority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-700",
}

const referralStatusTheme: Record<ReferralStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
}

const DEFAULT_STATUS_THEME = {
  chip: "bg-sky-100 text-sky-700",
  card: "bg-sky-50/60 border-sky-200",
  icon: <AlertCircle className="h-3.5 w-3.5" />,
  label: "Open",
}

function getCaseStatusTheme(status?: string) {
  if (!status) return DEFAULT_STATUS_THEME
  const s = String(status).toLowerCase() as CaseStatus
  if (statusTheme[s]) return statusTheme[s]
  if (s.includes("monitor")) return statusTheme.monitoring
  if (s.includes("refer")) return statusTheme.referred
  if (s.includes("close")) return statusTheme.closed
  return {
    chip: "bg-slate-100 text-slate-700",
    card: "bg-slate-50/60 border-slate-200",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  }
}

function getProgramColor(prog?: string) {
  if (prog && programColors[prog as ModuleKey]) return programColors[prog as ModuleKey]
  return "bg-slate-50 text-slate-700 border-slate-200"
}

function getPriorityColor(priority?: string) {
  if (priority && priorityTheme[priority as CasePriority]) return priorityTheme[priority as CasePriority]
  return "bg-slate-100 text-slate-700"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function initials(name: string) {
  const parts = name.trim().split(" ")
  return `${parts[0]?.charAt(0) ?? ""}${parts[parts.length - 1]?.charAt(0) ?? ""}`.toUpperCase()
}

// =====================================================================================
// Small shared bits
// =====================================================================================

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-foreground font-medium mt-0.5">{value || "—"}</p>
    </div>
  )
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-muted-foreground">{icon}</span>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{children}</h3>
    </div>
  )
}

// =====================================================================================
// Case Records — list card
// =====================================================================================

function CaseCard({ c, onOpen }: { c: CaseRecord; onOpen: (id: string) => void }) {
  const st = getCaseStatusTheme(c.status)
  return (
    <div className={`border rounded-xl p-4 transition-shadow hover:shadow-sm ${st.card}`}>
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white text-sm font-semibold">
          {initials(c.clientName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{c.clientName}</p>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getProgramColor(c.linkedProgram)}`}>
              {c.linkedProgram}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getPriorityColor(c.priority)}`}>
              {c.priority} priority
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1 font-mono">Case No. {c.caseNumber} · Ref: {c.linkedReferenceNo}</p>
          <p className="text-sm text-foreground mb-2">{c.caseType}</p>
          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
            <span>Opened {formatDate(c.dateOpened)}</span>
            <span>Worker: {c.assignedSocialWorker}</span>
            <span>{c.referrals.length} referral{c.referrals.length !== 1 ? "s" : ""}</span>
            <span>{c.assistance.length} assistance record{c.assistance.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st?.chip || 'bg-sky-100 text-sky-700'}`}>
            {st?.icon}
            {st?.label}
          </span>
          <button
            onClick={() => onOpen(c.id)}
            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Open Case
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================================================
// Case Profile modal
// =====================================================================================

type ProfileTab = "overview" | "referrals" | "assistance" | "timeline"

function CaseProfileModal({
  c,
  onClose,
  onAddReferral,
  onAddAssistance,
  onUpdateStatus,
}: {
  c: CaseRecord
  onClose: () => void
  onAddReferral: (caseId: string, referral: Omit<Referral, "id">) => void
  onAddAssistance: (caseId: string, record: Omit<AssistanceRecord, "id">) => void
  onUpdateStatus: (caseId: string, status: CaseStatus, note: string) => void
}) {
  const [tab, setTab] = useState<ProfileTab>("overview")
  const [showReferralForm, setShowReferralForm] = useState(false)
  const [showAssistanceForm, setShowAssistanceForm] = useState(false)
  const [showStatusForm, setShowStatusForm] = useState(false)

  const [refTo, setRefTo] = useState("")
  const [refReason, setRefReason] = useState("")
  const [refBy, setRefBy] = useState("Admin User")

  const [astType, setAstType] = useState("")
  const [astAmount, setAstAmount] = useState("")
  const [astDesc, setAstDesc] = useState("")
  const [astBy, setAstBy] = useState("Admin User")

  const [newStatus, setNewStatus] = useState<CaseStatus>(c.status)
  const [statusNote, setStatusNote] = useState("")
  const st = getCaseStatusTheme(c.status)

  const tabs: { key: ProfileTab; label: string; icon: ReactElement }[] = [
    { key: "overview", label: "Overview", icon: <User className="h-3.5 w-3.5" /> },
    { key: "referrals", label: "Referrals", icon: <Send className="h-3.5 w-3.5" /> },
    { key: "assistance", label: "Assistance", icon: <HeartHandshake className="h-3.5 w-3.5" /> },
    { key: "timeline", label: "Monitoring", icon: <History className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white text-base font-semibold">
                {initials(c.clientName)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">{c.clientName}</h2>
                <p className="text-sm text-muted-foreground mt-0.5 font-mono">
                  Case No. {c.caseNumber} · Ref: {c.linkedReferenceNo}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getProgramColor(c.linkedProgram)}`}>
                    {c.linkedProgram}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${st?.chip || 'bg-sky-100 text-sky-700'}`}>
                    {st?.icon}
                    {st?.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getPriorityColor(c.priority)}`}>
                    {c.priority} priority
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center shrink-0 transition-colors text-xl font-light"
            >
              ×
            </button>
          </div>

          {/* Inner tabs */}
          <div className="flex items-center gap-1 mt-4 bg-muted rounded-lg p-1 w-fit">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === t.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto space-y-6">
          {tab === "overview" && (
            <>
              <div>
                <SectionHeading icon={<User className="h-4 w-4" />}>Client Information</SectionHeading>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <Field label="Age / Sex" value={`${c.age} / ${c.sex}`} />
                  <Field
                    label="Contact Number"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.contactNo}
                      </span>
                    }
                  />
                  <div className="col-span-2">
                    <Field
                      label="Address"
                      value={
                        <span className="inline-flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          {c.address}
                        </span>
                      }
                    />
                  </div>
                  <Field label="Date Opened" value={formatDate(c.dateOpened)} />
                  <Field label="Assigned Social Worker" value={c.assignedSocialWorker} />
                </div>
              </div>

              <div>
                <SectionHeading icon={<ClipboardList className="h-4 w-4" />}>Case Summary</SectionHeading>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-foreground leading-relaxed">
                  {c.summary}
                </div>
              </div>

              <div className="border-t border-border pt-5">
                {!showStatusForm ? (
                  <button
                    onClick={() => setShowStatusForm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
                  >
                    <Clock className="h-4 w-4" />
                    Update Case Status
                  </button>
                ) : (
                  <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">New Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as CaseStatus)}
                          className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="open">Open</option>
                          <option value="monitoring">Under Monitoring</option>
                          <option value="referred">Referred</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Note</label>
                      <textarea
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        rows={2}
                        placeholder="Ilarawan ang update sa kaso..."
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowStatusForm(false)}
                        className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!statusNote.trim()) return
                          onUpdateStatus(c.id, newStatus, statusNote)
                          setStatusNote("")
                          setShowStatusForm(false)
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Save Update
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "referrals" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionHeading icon={<Send className="h-4 w-4" />}>Referral History ({c.referrals.length})</SectionHeading>
                <button
                  onClick={() => setShowReferralForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Referral
                </button>
              </div>

              {showReferralForm && (
                <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Referred To *</label>
                    <input
                      value={refTo}
                      onChange={(e) => setRefTo(e.target.value)}
                      placeholder="e.g. QC General Hospital — Medical Social Service"
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Reason *</label>
                    <textarea
                      value={refReason}
                      onChange={(e) => setRefReason(e.target.value)}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Referred By</label>
                    <input
                      value={refBy}
                      onChange={(e) => setRefBy(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowReferralForm(false)}
                      className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!refTo.trim() || !refReason.trim()) return
                        onAddReferral(c.id, {
                          date: new Date().toISOString().split("T")[0],
                          referredTo: refTo,
                          reason: refReason,
                          referredBy: refBy || "Admin User",
                          status: "pending",
                        })
                        setRefTo("")
                        setRefReason("")
                        setShowReferralForm(false)
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Save Referral
                    </button>
                  </div>
                </div>
              )}

              {c.referrals.length === 0 && !showReferralForm ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Wala pang naitalang referral para sa kasong ito.</p>
              ) : (
                <div className="space-y-2">
                  {c.referrals.map((r) => (
                    <div key={r.id} className="border border-border rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{r.referredTo}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${referralStatusTheme[r.status]}`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-1">{r.reason}</p>
                      {r.remarks && <p className="text-xs text-muted-foreground mb-1">Remarks: {r.remarks}</p>}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(r.date)} · Referred by {r.referredBy}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "assistance" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionHeading icon={<HeartHandshake className="h-4 w-4" />}>Assistance Given ({c.assistance.length})</SectionHeading>
                <button
                  onClick={() => setShowAssistanceForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Log Assistance
                </button>
              </div>

              {showAssistanceForm && (
                <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Type *</label>
                      <input
                        value={astType}
                        onChange={(e) => setAstType(e.target.value)}
                        placeholder="e.g. Food Pack, Cash Assistance"
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Amount (₱, optional)</label>
                      <input
                        value={astAmount}
                        onChange={(e) => setAstAmount(e.target.value)}
                        placeholder="e.g. 3,000"
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Description *</label>
                    <textarea
                      value={astDesc}
                      onChange={(e) => setAstDesc(e.target.value)}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Provided By</label>
                    <input
                      value={astBy}
                      onChange={(e) => setAstBy(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowAssistanceForm(false)}
                      className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!astType.trim() || !astDesc.trim()) return
                        onAddAssistance(c.id, {
                          date: new Date().toISOString().split("T")[0],
                          type: astType,
                          amount: astAmount || undefined,
                          description: astDesc,
                          providedBy: astBy || "Admin User",
                        })
                        setAstType("")
                        setAstAmount("")
                        setAstDesc("")
                        setShowAssistanceForm(false)
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Save Record
                    </button>
                  </div>
                </div>
              )}

              {c.assistance.length === 0 && !showAssistanceForm ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Wala pang naitalang tulong para sa kasong ito.</p>
              ) : (
                <div className="space-y-2">
                  {c.assistance.map((a) => (
                    <div key={a.id} className="border border-border rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{a.type}</p>
                        {a.amount && <p className="text-sm font-bold text-foreground">₱{a.amount}</p>}
                      </div>
                      <p className="text-sm text-foreground mb-1">{a.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.date)} · Provided by {a.providedBy}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "timeline" && (
            <div>
              <SectionHeading icon={<History className="h-4 w-4" />}>Status / Monitoring Timeline</SectionHeading>
              <div className="space-y-0">
                {c.statusHistory
                  .slice()
                  .reverse()
                  .map((ev, idx) => {
                    const evTheme = getCaseStatusTheme(ev.status)
                    return (
                      <div key={ev.id} className="flex gap-3 pb-4 last:pb-0">
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center ${evTheme?.chip || 'bg-slate-100 text-slate-700'}`}>
                            {evTheme?.icon}
                          </div>
                          {idx !== c.statusHistory.length - 1 && <div className="flex-1 w-px bg-border mt-1" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${evTheme?.chip || 'bg-slate-100 text-slate-700'}`}>
                              {evTheme?.label}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDate(ev.date)} · {ev.by}</span>
                          </div>
                          <p className="text-sm text-foreground">{ev.note}</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-white shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================================================
// Main Component
// =====================================================================================

type MainTab = "records" | "referrals" | "assistance" | "monitoring"

export default function CaseManagement() {
  const [cases, setCases] = useState<CaseRecord[]>(MOCK_CASES)
  const [tab, setTab] = useState<MainTab>("records")
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProgram, setFilterProgram] = useState<"all" | ModuleKey>("all")
  const [filterStatus, setFilterStatus] = useState<"all" | CaseStatus>("all")

  const selectedCase = cases.find((c) => c.id === selectedCaseId) ?? null

  const handleAddReferral = (caseId: string, referral: Omit<Referral, "id">) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, referrals: [...c.referrals, { ...referral, id: `REF-${Date.now()}` }] } : c
      )
    )
  }

  const handleAddAssistance = (caseId: string, record: Omit<AssistanceRecord, "id">) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, assistance: [...c.assistance, { ...record, id: `AST-${Date.now()}` }] } : c
      )
    )
  }

  const handleUpdateStatus = (caseId: string, status: CaseStatus, note: string) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status,
              statusHistory: [
                ...c.statusHistory,
                { id: `SH-${Date.now()}`, date: new Date().toISOString().split("T")[0], status, note, by: "Admin User" },
              ],
            }
          : c
      )
    )
  }

  const filteredCases = cases.filter((c) => {
    const matchProgram = filterProgram === "all" || c.linkedProgram === filterProgram
    const matchStatus = filterStatus === "all" || c.status === filterStatus
    const matchSearch =
      searchTerm === "" ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.linkedReferenceNo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchProgram && matchStatus && matchSearch
  })

  const allReferrals = cases.flatMap((c) => c.referrals.map((r) => ({ ...r, clientName: c.clientName, caseNumber: c.caseNumber, caseId: c.id })))
  const allAssistance = cases.flatMap((c) => c.assistance.map((a) => ({ ...a, clientName: c.clientName, caseNumber: c.caseNumber, caseId: c.id })))
  const allTimeline = cases
    .flatMap((c) => c.statusHistory.map((h) => ({ ...h, clientName: c.clientName, caseNumber: c.caseNumber, caseId: c.id })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const stats = {
    total: cases.length,
    open: cases.filter((c) => c.status === "open").length,
    monitoring: cases.filter((c) => c.status === "monitoring" || c.status === "referred").length,
    closed: cases.filter((c) => c.status === "closed").length,
  }

  const MAIN_TABS: { key: MainTab; label: string; icon: ReactElement }[] = [
    { key: "records", label: "Case Records", icon: <ClipboardList className="h-4 w-4" /> },
    { key: "referrals", label: "Referrals", icon: <Send className="h-4 w-4" /> },
    { key: "assistance", label: "Assistance", icon: <HeartHandshake className="h-4 w-4" /> },
    { key: "monitoring", label: "Monitoring", icon: <History className="h-4 w-4" /> },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold text-foreground">Case Management</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Cases", value: stats.total, color: "blue" },
          { label: "Open", value: stats.open, color: "sky" },
          { label: "Monitoring / Referred", value: stats.monitoring, color: "indigo" },
          { label: "Closed", value: stats.closed, color: "green" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg p-4 bg-${stat.color}-50 border border-${stat.color}-200`}>
            <p className={`text-xs font-semibold text-${stat.color}-700 uppercase`}>{stat.label}</p>
            <p className={`text-3xl font-bold text-${stat.color}-700 mt-2`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit flex-wrap">
        {MAIN_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Case Records */}
      {tab === "records" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by client name, case no., or reference no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Linked Program</label>
                <select
                  value={filterProgram}
                  onChange={(e) => setFilterProgram(e.target.value as any)}
                  className="mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 block"
                >
                  <option value="all">All Programs</option>
                  {PROGRAM_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 block"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="monitoring">Under Monitoring</option>
                  <option value="referred">Referred</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Cases ({filteredCases.length})</h2>
            {filteredCases.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Walang nahanap na kaso.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCases.map((c) => (
                  <CaseCard key={c.id} c={c} onOpen={setSelectedCaseId} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Referrals ledger */}
      {tab === "referrals" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">All referrals ({allReferrals.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-2 font-medium">Client</th>
                  <th className="px-4 py-2 font-medium">Case No.</th>
                  <th className="px-4 py-2 font-medium">Referred To</th>
                  <th className="px-4 py-2 font-medium">Reason</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {allReferrals.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedCaseId(r.caseId)}
                    className="border-b border-border last:border-0 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-foreground font-medium">{r.clientName}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{r.caseNumber}</td>
                    <td className="px-4 py-3 text-foreground">{r.referredTo}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{r.reason}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(r.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${referralStatusTheme[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assistance ledger */}
      {tab === "assistance" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">All assistance records ({allAssistance.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-2 font-medium">Client</th>
                  <th className="px-4 py-2 font-medium">Case No.</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {allAssistance.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedCaseId(a.caseId)}
                    className="border-b border-border last:border-0 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-foreground font-medium">{a.clientName}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{a.caseNumber}</td>
                    <td className="px-4 py-3 text-foreground">{a.type}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{a.description}</td>
                    <td className="px-4 py-3 text-foreground">{a.amount ? `₱${a.amount}` : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(a.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monitoring timeline */}
      {tab === "monitoring" && (
        <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Status updates across all cases ({allTimeline.length})</h2>
          </div>
          <div>
            {allTimeline.map((ev) => {
              const evTheme = getCaseStatusTheme(ev.status)
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedCaseId(ev.caseId)}
                  className="flex gap-4 px-4 py-4 border-b border-border last:border-0 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${evTheme?.chip || 'bg-slate-100 text-slate-700'}`}>
                      {evTheme?.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-foreground">{ev.clientName}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{ev.caseNumber}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${evTheme?.chip || 'bg-slate-100 text-slate-700'}`}>
                        {evTheme?.label}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{ev.note}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5">{formatDate(ev.date)} · {ev.by}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selectedCase && (
        <CaseProfileModal
          c={selectedCase}
          onClose={() => setSelectedCaseId(null)}
          onAddReferral={handleAddReferral}
          onAddAssistance={handleAddAssistance}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  )
}
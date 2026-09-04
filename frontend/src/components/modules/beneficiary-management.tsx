import { useState, type ReactElement } from "react"
import {
  IdCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Home,
  History,
  ChevronRight,
} from "lucide-react"

// =====================================================================================
// Types
// =====================================================================================

type ProgramKey = "AICS" | "PWD" | "Senior Citizen" | "Solo Parent" | "Child Welfare" | "Livelihood"
type VerificationStatus = "verified" | "pending" | "unverified"

interface EnrolledProgram {
  program: ProgramKey
  referenceNo: string
  status: string
  dateEnrolled: string
}

interface HistoryEvent {
  id: string
  date: string
  program: ProgramKey
  action: string
  detail: string
}

interface Beneficiary {
  id: string
  beneficiaryNo: string
  fullName: string
  age: string
  sex: string
  address: string
  contactNo: string
  householdMembers: string
  dateRegistered: string
  verificationStatus: VerificationStatus
  verifiedBy?: string
  verifiedDate?: string
  idType?: string
  idNumber?: string
  enrolledPrograms: EnrolledProgram[]
  history: HistoryEvent[]
}

// =====================================================================================
// Mock data — same client roster used across the other modules
// =====================================================================================

const MOCK_BENEFICIARIES: Beneficiary[] = [
  {
    id: "BEN-001",
    beneficiaryNo: "BNF-2026-0001",
    fullName: "Clarisa Mae Dimal",
    age: "21",
    sex: "Female",
    address: "11 Sampaloc Street, Brgy. Sauyo, Quezon City",
    contactNo: "0917 555 1234",
    householdMembers: "4",
    dateRegistered: "2026-08-15",
    verificationStatus: "verified",
    verifiedBy: "Admin User",
    verifiedDate: "2026-08-15",
    idType: "PhilID",
    idNumber: "1234-5678-9012",
    enrolledPrograms: [
      { program: "AICS", referenceNo: "110000116932100", status: "Approved", dateEnrolled: "2026-08-15" },
      { program: "Child Welfare", referenceNo: "110000116932100", status: "Pending", dateEnrolled: "2026-08-18" },
      { program: "Livelihood", referenceNo: "110000116932100", status: "Pending", dateEnrolled: "2026-08-15" },
    ],
    history: [
      { id: "H-001", date: "2026-08-15", program: "AICS", action: "Application submitted", detail: "Medical Assistance application." },
      { id: "H-002", date: "2026-08-21", program: "AICS", action: "Application approved", detail: "Medical Assistance approved and released." },
      { id: "H-003", date: "2026-08-18", program: "Child Welfare", action: "Application submitted", detail: "Medical support for child (Josh Dimal)." },
    ],
  },
  {
    id: "BEN-002",
    beneficiaryNo: "BNF-2026-0002",
    fullName: "Rosalinda Torres",
    age: "71",
    sex: "Female",
    address: "Purok 5, Barangay Malaya, Quezon City",
    contactNo: "0917 555 2233",
    householdMembers: "3",
    dateRegistered: "2026-08-14",
    verificationStatus: "verified",
    verifiedBy: "Admin User",
    verifiedDate: "2026-08-14",
    idType: "Voter's ID",
    idNumber: "8812-4471",
    enrolledPrograms: [{ program: "Senior Citizen", referenceNo: "SC-2026-4521", status: "Released", dateEnrolled: "2026-08-14" }],
    history: [
      { id: "H-004", date: "2026-08-14", program: "Senior Citizen", action: "Application submitted", detail: "New OSCA ID application." },
      { id: "H-005", date: "2026-08-25", program: "Senior Citizen", action: "ID released", detail: "OSCA ID released at QC Hall." },
    ],
  },
  {
    id: "BEN-003",
    beneficiaryNo: "BNF-2026-0003",
    fullName: "Julius Cabrera",
    age: "36",
    sex: "Male",
    address: "Zone 1, Barangay San Roque, Quezon City",
    contactNo: "0928 774 4410",
    householdMembers: "5",
    dateRegistered: "2026-08-13",
    verificationStatus: "pending",
    idType: "PWD ID (expired)",
    idNumber: "PWD-2023-00127",
    enrolledPrograms: [{ program: "PWD", referenceNo: "PWD-2026-3421", status: "Approved", dateEnrolled: "2026-08-13" }],
    history: [
      { id: "H-006", date: "2026-08-13", program: "PWD", action: "Renewal submitted", detail: "PWD ID renewal application." },
      { id: "H-007", date: "2026-08-13", program: "PWD", action: "Renewal approved", detail: "New ID number PWD-2026-00127 assigned." },
    ],
  },
  {
    id: "BEN-004",
    beneficiaryNo: "BNF-2026-0004",
    fullName: "Emilyn Salazar",
    age: "34",
    sex: "Female",
    address: "Purok 2, Barangay Sto. Niño, Quezon City",
    contactNo: "0917 332 8891",
    householdMembers: "2",
    dateRegistered: "2026-08-17",
    verificationStatus: "unverified",
    enrolledPrograms: [{ program: "Solo Parent", referenceNo: "SP-2026-4821", status: "Pending", dateEnrolled: "2026-08-17" }],
    history: [{ id: "H-008", date: "2026-08-17", program: "Solo Parent", action: "Application submitted", detail: "New Solo Parent ID — death of spouse." }],
  },
  {
    id: "BEN-005",
    beneficiaryNo: "BNF-2026-0005",
    fullName: "Ferdinand Villanueva",
    age: "54",
    sex: "Male",
    address: "23 Masagana St., Brgy. Payatas, Quezon City",
    contactNo: "0915 887 2210",
    householdMembers: "2",
    dateRegistered: "2026-08-09",
    verificationStatus: "verified",
    verifiedBy: "Jonalyn P.",
    verifiedDate: "2026-08-09",
    idType: "PWD ID",
    idNumber: "PWD-2021-00981",
    enrolledPrograms: [
      { program: "Livelihood", referenceNo: "PBQC-2026-1955", status: "Pending", dateEnrolled: "2026-08-09" },
      { program: "Livelihood", referenceNo: "TRNG-2026-2201", status: "Scheduled", dateEnrolled: "2026-08-16" },
    ],
    history: [
      { id: "H-009", date: "2026-08-09", program: "Livelihood", action: "Application submitted", detail: "Urban Agriculture livelihood application." },
      { id: "H-010", date: "2026-08-16", program: "Livelihood", action: "Training scheduled", detail: "Motorcycle/Small Engine Servicing Training, Aug 27." },
    ],
  },
  {
    id: "BEN-006",
    beneficiaryNo: "BNF-2026-0006",
    fullName: "Bryan Aguilar",
    age: "41",
    sex: "Male",
    address: "Zone 4, Barangay Bagumbayan, Quezon City",
    contactNo: "0928 110 4477",
    householdMembers: "4",
    dateRegistered: "2026-08-17",
    verificationStatus: "pending",
    idType: "Old Solo Parent ID",
    idNumber: "SP-2023-00892",
    enrolledPrograms: [{ program: "Solo Parent", referenceNo: "SP-2026-4790", status: "Rejected", dateEnrolled: "2026-08-15" }],
    history: [
      { id: "H-011", date: "2026-08-15", program: "Solo Parent", action: "Renewal submitted", detail: "Solo Parent ID renewal." },
      { id: "H-012", date: "2026-08-17", program: "Solo Parent", action: "Renewal rejected", detail: "Incomplete requirements — missing endorsement." },
    ],
  },
]

// =====================================================================================
// Theme
// =====================================================================================

const programColors: Record<ProgramKey, string> = {
  AICS: "bg-blue-50 text-blue-700 border-blue-200",
  PWD: "bg-purple-50 text-purple-700 border-purple-200",
  "Senior Citizen": "bg-amber-50 text-amber-700 border-amber-200",
  "Solo Parent": "bg-violet-50 text-violet-700 border-violet-200",
  "Child Welfare": "bg-rose-50 text-rose-700 border-rose-200",
  Livelihood: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const PROGRAM_OPTIONS: ProgramKey[] = ["AICS", "PWD", "Senior Citizen", "Solo Parent", "Child Welfare", "Livelihood"]

const verificationTheme: Record<VerificationStatus, { chip: string; icon: ReactElement; label: string }> = {
  verified: { chip: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Verified" },
  pending: { chip: "bg-amber-100 text-amber-700", icon: <Clock className="h-3.5 w-3.5" />, label: "Pending" },
  unverified: { chip: "bg-red-100 text-red-700", icon: <XCircle className="h-3.5 w-3.5" />, label: "Unverified" },
}

const DEFAULT_VERIFICATION_THEME = {
  chip: "bg-slate-100 text-slate-700",
  icon: <Clock className="h-3.5 w-3.5" />,
  label: "Pending",
}

function getVerificationTheme(status?: string) {
  if (!status) return DEFAULT_VERIFICATION_THEME
  const s = String(status).toLowerCase() as VerificationStatus
  if (verificationTheme[s]) return verificationTheme[s]
  if (s.includes("verif") || s.includes("approve")) return verificationTheme.verified
  if (s.includes("pend")) return verificationTheme.pending
  if (s.includes("unverif") || s.includes("reject")) return verificationTheme.unverified
  return {
    chip: "bg-slate-100 text-slate-700",
    icon: <Clock className="h-3.5 w-3.5" />,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  }
}

function getProgramColor(prog?: string) {
  if (prog && programColors[prog as ProgramKey]) return programColors[prog as ProgramKey]
  return "bg-slate-50 text-slate-700 border-slate-200"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function initials(name: string) {
  const parts = name.trim().split(" ")
  return `${parts[0]?.charAt(0) ?? ""}${parts[parts.length - 1]?.charAt(0) ?? ""}`.toUpperCase()
}

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
// Beneficiary Card
// =====================================================================================

function BeneficiaryCard({ b, onOpen }: { b: Beneficiary; onOpen: (id: string) => void }) {
  const vt = getVerificationTheme(b.verificationStatus)
  return (
    <div className="border border-border rounded-xl p-4 bg-white transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white text-sm font-semibold">
          {initials(b.fullName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{b.fullName}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${vt?.chip || 'bg-slate-100 text-slate-700'}`}>
              {vt?.icon}
              {vt?.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2 font-mono">{b.beneficiaryNo}</p>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {b.enrolledPrograms.map((p, i) => (
              <span key={i} className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getProgramColor(p.program)}`}>
                {p.program}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
            <span>{b.age} y/o, {b.sex}</span>
            <span>Household: {b.householdMembers}</span>
            <span>Registered {formatDate(b.dateRegistered)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={() => onOpen(b.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            View Profile
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================================================
// Beneficiary Profile Modal
// =====================================================================================

type ProfileTab = "overview" | "programs" | "verification" | "history"

function BeneficiaryProfileModal({
  b,
  onClose,
  onVerify,
  onReject,
}: {
  b: Beneficiary
  onClose: () => void
  onVerify: (id: string, idType: string, idNumber: string) => void
  onReject: (id: string) => void
}) {
  const [tab, setTab] = useState<ProfileTab>("overview")
  const [idType, setIdType] = useState(b.idType || "")
  const [idNumber, setIdNumber] = useState(b.idNumber || "")

  const vt = getVerificationTheme(b.verificationStatus)

  const tabs: { key: ProfileTab; label: string; icon: ReactElement }[] = [
    { key: "overview", label: "Overview", icon: <User className="h-3.5 w-3.5" /> },
    { key: "programs", label: "Enrolled Programs", icon: <IdCard className="h-3.5 w-3.5" /> },
    { key: "verification", label: "Verification", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { key: "history", label: "History", icon: <History className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white text-base font-semibold">
                {initials(b.fullName)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">{b.fullName}</h2>
                <p className="text-sm text-muted-foreground mt-0.5 font-mono">{b.beneficiaryNo}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${vt?.chip || 'bg-slate-100 text-slate-700'}`}>
                    {vt?.icon}
                    {vt?.label}
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

          <div className="flex items-center gap-1 mt-4 bg-muted rounded-lg p-1 w-fit flex-wrap">
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
            <div>
              <SectionHeading icon={<User className="h-4 w-4" />}>Personal Information</SectionHeading>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-slate-50 border border-slate-100 rounded-xl p-4">
                <Field label="Age / Sex" value={`${b.age} / ${b.sex}`} />
                <Field label="Household Members" value={b.householdMembers} />
                <Field
                  label="Contact Number"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {b.contactNo}
                    </span>
                  }
                />
                <Field label="Date Registered" value={formatDate(b.dateRegistered)} />
                <div className="col-span-2">
                  <Field
                    label="Address"
                    value={
                      <span className="inline-flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        {b.address}
                      </span>
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "programs" && (
            <div>
              <SectionHeading icon={<IdCard className="h-4 w-4" />}>
                Enrolled Programs ({b.enrolledPrograms.length})
              </SectionHeading>
              {b.enrolledPrograms.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Wala pang naka-enroll na programa.</p>
              ) : (
                <div className="space-y-2">
                  {b.enrolledPrograms.map((p, i) => (
                    <div key={i} className="border border-border rounded-lg p-3 bg-white flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${programColors[p.program]}`}>
                            {p.program}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">{p.referenceNo}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Enrolled {formatDate(p.dateEnrolled)}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "verification" && (
            <div className="space-y-4">
              <SectionHeading icon={<ShieldCheck className="h-4 w-4" />}>Identity Verification</SectionHeading>

              {b.verificationStatus === "verified" ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm text-emerald-800">
                    <strong>Verified</strong> on {b.verifiedDate ? formatDate(b.verifiedDate) : "—"} by {b.verifiedBy}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <Field label="ID Type" value={b.idType} />
                    <Field label="ID Number" value={b.idNumber} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">ID Type</label>
                      <input
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
                        placeholder="e.g. PhilID, PWD ID"
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">ID Number</label>
                      <input
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="e.g. 1234-5678-9012"
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (!idType.trim() || !idNumber.trim()) return
                        onVerify(b.id, idType, idNumber)
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm Verification
                    </button>
                    <button
                      onClick={() => onReject(b.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Mark Unverified
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "history" && (
            <div>
              <SectionHeading icon={<History className="h-4 w-4" />}>
                Program & Assistance History ({b.history.length})
              </SectionHeading>
              <div className="space-y-0">
                {b.history
                  .slice()
                  .reverse()
                  .map((ev, idx) => (
                    <div key={ev.id} className="flex gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-100">
                          <Home className="h-3.5 w-3.5 text-slate-600" />
                        </div>
                        {idx !== b.history.length - 1 && <div className="flex-1 w-px bg-border mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${programColors[ev.program]}`}>
                            {ev.program}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{ev.action}</span>
                        </div>
                        <p className="text-sm text-foreground">{ev.detail}</p>
                        <p className="text-[11px] text-muted-foreground mt-1.5">{formatDate(ev.date)}</p>
                      </div>
                    </div>
                  ))}
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

type MainTab = "list" | "verification" | "history"

export default function BeneficiaryManagement() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(MOCK_BENEFICIARIES)
  const [tab, setTab] = useState<MainTab>("list")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProgram, setFilterProgram] = useState<"all" | ProgramKey>("all")
  const [filterVerification, setFilterVerification] = useState<"all" | VerificationStatus>("all")

  const selected = beneficiaries.find((b) => b.id === selectedId) ?? null

  const handleVerify = (id: string, idType: string, idNumber: string) => {
    setBeneficiaries((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              verificationStatus: "verified" as const,
              idType,
              idNumber,
              verifiedBy: "Admin User",
              verifiedDate: new Date().toISOString().split("T")[0],
            }
          : b
      )
    )
  }

  const handleReject = (id: string) => {
    setBeneficiaries((prev) => prev.map((b) => (b.id === id ? { ...b, verificationStatus: "unverified" as const } : b)))
  }

  const filteredList = beneficiaries.filter((b) => {
    const matchProgram = filterProgram === "all" || b.enrolledPrograms.some((p) => p.program === filterProgram)
    const matchVerification = filterVerification === "all" || b.verificationStatus === filterVerification
    const matchSearch =
      searchTerm === "" ||
      b.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.beneficiaryNo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchProgram && matchVerification && matchSearch
  })

  const pendingVerification = beneficiaries.filter((b) => b.verificationStatus !== "verified")

  const allHistory = beneficiaries
    .flatMap((b) => b.history.map((h) => ({ ...h, fullName: b.fullName, beneficiaryNo: b.beneficiaryNo, beneficiaryId: b.id })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const stats = {
    total: beneficiaries.length,
    verified: beneficiaries.filter((b) => b.verificationStatus === "verified").length,
    pending: beneficiaries.filter((b) => b.verificationStatus === "pending").length,
    unverified: beneficiaries.filter((b) => b.verificationStatus === "unverified").length,
  }

  const MAIN_TABS: { key: MainTab; label: string; icon: ReactElement }[] = [
    { key: "list", label: "Beneficiary List", icon: <IdCard className="h-4 w-4" /> },
    { key: "verification", label: "Verification Queue", icon: <ShieldCheck className="h-4 w-4" /> },
    { key: "history", label: "History Log", icon: <History className="h-4 w-4" /> },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold text-foreground">Beneficiary Management</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Beneficiaries", value: stats.total, color: "blue" },
          { label: "Verified", value: stats.verified, color: "green" },
          { label: "Pending", value: stats.pending, color: "yellow" },
          { label: "Unverified", value: stats.unverified, color: "red" },
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

      {/* Beneficiary List */}
      {tab === "list" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or beneficiary no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Program</label>
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
                <label className="text-xs font-semibold text-muted-foreground">Verification</label>
                <select
                  value={filterVerification}
                  onChange={(e) => setFilterVerification(e.target.value as any)}
                  className="mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 block"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Beneficiaries ({filteredList.length})</h2>
            {filteredList.length === 0 ? (
              <div className="text-center py-12">
                <IdCard className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Walang nahanap na beneficiary.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredList.map((b) => (
                  <BeneficiaryCard key={b.id} b={b} onOpen={setSelectedId} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Queue */}
      {tab === "verification" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Needs Verification ({pendingVerification.length})</h2>
          {pendingVerification.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Lahat ng beneficiary ay verified na.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVerification.map((b) => (
                <BeneficiaryCard key={b.id} b={b} onOpen={setSelectedId} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Log */}
      {tab === "history" && (
        <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">All beneficiary history ({allHistory.length})</h2>
          </div>
          <div>
            {allHistory.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedId(ev.beneficiaryId)}
                className="flex gap-4 px-4 py-4 border-b border-border last:border-0 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center bg-slate-100">
                    <Home className="h-4 w-4 text-slate-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-foreground">{ev.fullName}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{ev.beneficiaryNo}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${programColors[ev.program]}`}>
                      {ev.program}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-medium">{ev.action}</p>
                  <p className="text-sm text-muted-foreground">{ev.detail}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{formatDate(ev.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <BeneficiaryProfileModal
          b={selected}
          onClose={() => setSelectedId(null)}
          onVerify={handleVerify}
          onReject={handleReject}
        />
      )}
    </div>
  )
}
import { useState, useEffect, useCallback, type ReactElement } from "react"
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
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { API_BASE } from "../../config/api"
import { subscribeToRealtimeChanges, notifyApplicationChange } from "../../utils/realtimeSync"

// =====================================================================================
// Types
// =====================================================================================

type ProgramKey = "AICS" | "PWD" | "Senior Citizen" | "Solo Parent" | "Child Welfare" | "Livelihood" | "General" | "System"
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
  performedBy?: string
  status?: string
}

interface Beneficiary {
  id: string
  beneficiaryNo: string
  fullName: string
  firstName?: string
  lastName?: string
  age: string
  sex: string
  civilStatus?: string
  address: string
  contactNo: string
  email?: string
  qcidNumber?: string
  householdMembers: string
  dateRegistered: string
  verificationStatus: VerificationStatus
  verifiedBy?: string
  verifiedDate?: string
  verificationRemarks?: string
  idType?: string
  idNumber?: string
  enrolledPrograms: EnrolledProgram[]
  history: HistoryEvent[]
}

// =====================================================================================
// Theme & Utility Helpers
// =====================================================================================

const programColors: Record<string, string> = {
  AICS: "bg-blue-50 text-blue-700 border-blue-200",
  PWD: "bg-purple-50 text-purple-700 border-purple-200",
  "Senior Citizen": "bg-amber-50 text-amber-700 border-amber-200",
  "Solo Parent": "bg-violet-50 text-violet-700 border-violet-200",
  "Child Welfare": "bg-rose-50 text-rose-700 border-rose-200",
  Livelihood: "bg-emerald-50 text-emerald-700 border-emerald-200",
  General: "bg-slate-50 text-slate-700 border-slate-200",
  System: "bg-gray-100 text-gray-700 border-gray-300",
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
  if (prog && programColors[prog]) return programColors[prog]
  return "bg-slate-50 text-slate-700 border-slate-200"
}

function formatDate(iso?: string) {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return iso
  }
}

function initials(name?: string) {
  if (!name) return "BN"
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
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
    <div
      onClick={() => onOpen(b.id)}
      className="border border-border rounded-xl p-4 bg-white transition-all hover:shadow-md hover:border-blue-200 cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white text-sm font-semibold group-hover:bg-blue-600 transition-colors">
          {initials(b.fullName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-foreground uppercase group-hover:text-blue-600 transition-colors">{b.fullName}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${vt?.chip || 'bg-slate-100 text-slate-700'}`}>
              {vt?.icon}
              {vt?.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2 font-mono">{b.beneficiaryNo}</p>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {b.enrolledPrograms.length > 0 ? (
              b.enrolledPrograms.map((p, i) => (
                <span key={i} className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getProgramColor(p.program)}`}>
                  {p.program}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border bg-slate-50 text-slate-600 border-slate-200">
                Registered Beneficiary
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
            <span>{b.age} y/o{b.sex && b.sex !== "—" ? `, ${b.sex}` : ""}</span>
            <span>Household: {b.householdMembers}</span>
            <span>Registered {formatDate(b.dateRegistered)}</span>
          </div>
        </div>
        <div className="flex items-center self-center shrink-0 text-muted-foreground group-hover:text-blue-600 transition-colors">
          <ChevronRight className="h-5 w-5" />
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
  onSetPending,
  isProcessing,
}: {
  b: Beneficiary
  onClose: () => void
  onVerify: (id: string, idType: string, idNumber: string, remarks: string) => Promise<void>
  onReject: (id: string, remarks: string) => Promise<void>
  onSetPending: (id: string, remarks: string) => Promise<void>
  isProcessing: boolean
}) {
  const [tab, setTab] = useState<ProfileTab>("overview")
  const [idType, setIdType] = useState(b.idType || "QCitizen ID")
  const [idNumber, setIdNumber] = useState(b.idNumber || b.qcidNumber || "")
  const [remarks, setRemarks] = useState(b.verificationRemarks || "")

  const vt = getVerificationTheme(b.verificationStatus)

  const tabs: { key: ProfileTab; label: string; icon: ReactElement }[] = [
    { key: "overview", label: "Overview", icon: <User className="h-3.5 w-3.5" /> },
    { key: "programs", label: `Enrolled Programs (${b.enrolledPrograms.length})`, icon: <IdCard className="h-3.5 w-3.5" /> },
    { key: "verification", label: "Verification", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { key: "history", label: `History (${b.history.length})`, icon: <History className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border bg-slate-50/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white text-base font-semibold shadow-inner">
                {initials(b.fullName)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate uppercase">{b.fullName}</h2>
                <p className="text-sm text-muted-foreground mt-0.5 font-mono">{b.beneficiaryNo}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${vt?.chip || 'bg-slate-100 text-slate-700'}`}>
                    {vt?.icon}
                    {vt?.label}
                  </span>
                  {b.qcidNumber && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-mono">
                      QCID: {b.qcidNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-muted-foreground hover:text-foreground hover:bg-gray-200/60 rounded-full h-8 w-8 flex items-center justify-center shrink-0 transition-colors text-xl font-light"
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
        <div className="px-6 py-6 overflow-y-auto space-y-6 flex-1">
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
                <Field label="Email Address" value={b.email || "—"} />
                <Field label="Civil Status" value={b.civilStatus || "—"} />
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
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <IdCard className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Wala pang naka-enroll na programa ang beneficiary na ito.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {b.enrolledPrograms.map((p, i) => (
                    <div key={i} className="border border-border rounded-xl p-3.5 bg-white flex items-center justify-between gap-3 shadow-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getProgramColor(p.program)}`}>
                            {p.program}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono font-medium">{p.referenceNo}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Enrolled on {formatDate(p.dateEnrolled)}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.status}
                      </span>
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
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Verified Beneficiary</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Verified on <strong>{b.verifiedDate ? formatDate(b.verifiedDate) : "—"}</strong> by <strong>{b.verifiedBy || "Social Worker"}</strong>
                  </p>
                  {b.verificationRemarks && (
                    <p className="text-xs text-emerald-800 mt-2 bg-emerald-100/50 p-2 rounded border border-emerald-200/50">
                      <strong>Remarks:</strong> {b.verificationRemarks}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm pt-2 border-t border-emerald-200/60">
                    <Field label="ID Type" value={b.idType || "QCitizen ID"} />
                    <Field label="ID Number" value={b.idNumber || b.qcidNumber || "—"} />
                  </div>
                </div>
              ) : b.verificationStatus === "unverified" ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-800 font-semibold mb-1">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span>Unverified Beneficiary</span>
                  </div>
                  <p className="text-xs text-red-700">
                    This profile is flagged as unverified due to missing or non-matching records.
                  </p>
                  {b.verificationRemarks && (
                    <p className="text-xs text-red-800 mt-2 bg-red-100/50 p-2 rounded border border-red-200/50">
                      <strong>Remarks:</strong> {b.verificationRemarks}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span>Pending Identity Verification</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Review and confirm client identification documents to grant full verified beneficiary status.
                  </p>
                </div>
              )}

              {/* Admin Verification Controls — Only for Pending / Unverified Beneficiaries */}
              {b.verificationStatus !== "verified" && (
                <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Update Verification Status
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">ID Type</label>
                      <input
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
                        placeholder="e.g. QCitizen ID, PhilID, PWD ID"
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">ID Number</label>
                      <input
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="e.g. 110000116932100"
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">Verification Remarks / Notes</label>
                      <input
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="e.g. Verified against QCitizen Portal and Voter's Record."
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      disabled={isProcessing}
                      onClick={() => onVerify(b.id, idType, idNumber, remarks)}
                      className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Confirm Verified
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => onReject(b.id, remarks)}
                      className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium text-xs hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Flag Unverified
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => onSetPending(b.id, remarks)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-300 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Clock className="h-4 w-4" />
                      Set Pending
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
              {b.history.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <History className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Wala pang naitalang history events ang profile na ito.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {b.history
                    .slice()
                    .reverse()
                    .map((ev, idx) => (
                      <div key={ev.id || idx} className="flex gap-3 pb-4 last:pb-0">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-100 border border-slate-200 shadow-xs">
                            <Home className="h-3.5 w-3.5 text-slate-600" />
                          </div>
                          {idx !== b.history.length - 1 && <div className="flex-1 w-px bg-border mt-1" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getProgramColor(ev.program)}`}>
                              {ev.program}
                            </span>
                            <span className="text-sm font-semibold text-foreground">{ev.action}</span>
                            {ev.status && (
                              <span className="text-[11px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                {ev.status}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground">{ev.detail}</p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                            <span>{formatDate(ev.date)}</span>
                            {ev.performedBy && <span>• By {ev.performedBy}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-white shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-gray-50 transition-colors shadow-xs"
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
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<MainTab>("list")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProgram, setFilterProgram] = useState<"all" | ProgramKey>("all")
  const [filterVerification, setFilterVerification] = useState<"all" | VerificationStatus>("all")
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: "success" | "danger" } | null>(null)

  const showToast = (text: string, type: "success" | "danger" = "success") => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Fetch beneficiaries from backend database
  const fetchBeneficiaries = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/beneficiaries`)
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch beneficiaries`)
      const data = await res.json()
      if (data.success && Array.isArray(data.beneficiaries)) {
        setBeneficiaries(data.beneficiaries)
      } else {
        throw new Error(data.error || "Failed to load beneficiary records")
      }
    } catch (err: any) {
      console.warn("[BeneficiaryManagement] Fetch failed:", err.message)
      setError(err.message || "Could not connect to database.")
    } finally {
      if (!isSilent) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBeneficiaries()

    // Subscribe to cross-tab / realtime application and beneficiary status updates
    const unsubscribe = subscribeToRealtimeChanges(() => {
      fetchBeneficiaries(true)
    })

    return () => {
      unsubscribe()
    }
  }, [fetchBeneficiaries])

  const selected = beneficiaries.find((b) => b.id === selectedId) ?? null

  // Handle Admin Verification
  const handleVerify = async (id: string, idType: string, idNumber: string, remarks: string) => {
    setIsProcessing(true)
    try {
      const res = await fetch(`${API_BASE}/api/beneficiaries/${encodeURIComponent(id)}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "verified",
          id_type: idType,
          id_number: idNumber,
          verified_by: "Admin User",
          remarks: remarks || "Identity verified with valid documents.",
        }),
      })

      if (!res.ok) throw new Error("Failed to verify beneficiary on server.")
      await res.json()

      showToast(`Beneficiary verified successfully!`, "success")
      notifyApplicationChange("STATUS_CHANGED", "all", id)
      await fetchBeneficiaries(true)
    } catch (err: any) {
      showToast(err.message || "Failed to verify beneficiary.", "danger")
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Admin Rejection / Unverified Flag
  const handleReject = async (id: string, remarks: string) => {
    setIsProcessing(true)
    try {
      const res = await fetch(`${API_BASE}/api/beneficiaries/${encodeURIComponent(id)}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "unverified",
          verified_by: "Admin User",
          remarks: remarks || "Marked unverified due to incomplete/unmatched credentials.",
        }),
      })

      if (!res.ok) throw new Error("Failed to flag beneficiary on server.")
      showToast(`Beneficiary marked as unverified.`, "danger")
      notifyApplicationChange("STATUS_CHANGED", "all", id)
      await fetchBeneficiaries(true)
    } catch (err: any) {
      showToast(err.message || "Failed to update beneficiary status.", "danger")
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Admin Setting Pending
  const handleSetPending = async (id: string, remarks: string) => {
    setIsProcessing(true)
    try {
      const res = await fetch(`${API_BASE}/api/beneficiaries/${encodeURIComponent(id)}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "pending",
          verified_by: "Admin User",
          remarks: remarks || "Status reset to pending verification.",
        }),
      })

      if (!res.ok) throw new Error("Failed to update status on server.")
      showToast(`Beneficiary status reset to pending.`, "success")
      notifyApplicationChange("STATUS_CHANGED", "all", id)
      await fetchBeneficiaries(true)
    } catch (err: any) {
      showToast(err.message || "Failed to reset status.", "danger")
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredList = beneficiaries.filter((b) => {
    const matchProgram = filterProgram === "all" || b.enrolledPrograms.some((p) => p.program === filterProgram)
    const matchVerification = filterVerification === "all" || b.verificationStatus === filterVerification
    const matchSearch =
      searchTerm === "" ||
      b.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.beneficiaryNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.qcidNumber && b.qcidNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchProgram && matchVerification && matchSearch
  })

  const pendingVerification = beneficiaries.filter((b) => b.verificationStatus !== "verified")

  const allHistory = beneficiaries
    .flatMap((b) =>
      b.history.map((h) => ({
        ...h,
        fullName: b.fullName,
        beneficiaryNo: b.beneficiaryNo,
        beneficiaryId: b.id,
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const stats = {
    total: beneficiaries.length,
    verified: beneficiaries.filter((b) => b.verificationStatus === "verified").length,
    pending: beneficiaries.filter((b) => b.verificationStatus === "pending").length,
    unverified: beneficiaries.filter((b) => b.verificationStatus === "unverified").length,
  }

  const MAIN_TABS: { key: MainTab; label: string; icon: ReactElement }[] = [
    { key: "list", label: "Beneficiary List", icon: <IdCard className="h-4 w-4" /> },
    { key: "verification", label: `Verification Queue (${stats.pending + stats.unverified})`, icon: <ShieldCheck className="h-4 w-4" /> },
    { key: "history", label: "History Log", icon: <History className="h-4 w-4" /> },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-xl text-sm font-medium ${
              toastMessage.type === "danger" ? "bg-red-600" : "bg-emerald-600"
            }`}
          >
            {toastMessage.type === "danger" ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Beneficiary Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centralized database of social service beneficiaries, program enrollments, and identity verification.
          </p>
        </div>
        <button
          onClick={() => fetchBeneficiaries()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>Notice: {error}</span>
          </div>
          <button
            onClick={() => fetchBeneficiaries()}
            className="text-xs font-semibold underline hover:no-underline text-amber-800"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 bg-blue-50/70 border border-blue-200 shadow-xs">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Total Beneficiaries</p>
          <p className="text-3xl font-bold text-blue-800 mt-2">{stats.total}</p>
        </div>
        <div className="rounded-xl p-4 bg-emerald-50/70 border border-emerald-200 shadow-xs">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Verified</p>
          <p className="text-3xl font-bold text-emerald-800 mt-2">{stats.verified}</p>
        </div>
        <div className="rounded-xl p-4 bg-amber-50/70 border border-amber-200 shadow-xs">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pending</p>
          <p className="text-3xl font-bold text-amber-800 mt-2">{stats.pending}</p>
        </div>
        <div className="rounded-xl p-4 bg-red-50/70 border border-red-200 shadow-xs">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Unverified</p>
          <p className="text-3xl font-bold text-red-800 mt-2">{stats.unverified}</p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit flex-wrap border border-border/50">
        {MAIN_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Beneficiary List View */}
      {tab === "list" && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-4 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, QCID, or beneficiary number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3.5 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Program</label>
                <select
                  value={filterProgram}
                  onChange={(e) => setFilterProgram(e.target.value as any)}
                  className="mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 block bg-white"
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
                  className="mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 block bg-white"
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
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                Beneficiaries ({filteredList.length})
              </h2>
            </div>

            {isLoading ? (
              <div className="text-center py-16 bg-white rounded-xl border border-border shadow-xs">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Loading beneficiary records...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-border shadow-xs">
                <IdCard className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-base font-semibold text-foreground">No beneficiaries found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query or filters.</p>
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

      {/* Verification Queue View */}
      {tab === "verification" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Needs Verification Queue ({pendingVerification.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-16 bg-white rounded-xl border border-border shadow-xs">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Loading queue...</p>
            </div>
          ) : pendingVerification.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-border shadow-xs">
              <ShieldCheck className="h-12 w-12 text-emerald-600 mx-auto mb-3 opacity-80" />
              <p className="text-base font-bold text-foreground">All Beneficiaries Verified</p>
              <p className="text-xs text-muted-foreground mt-1">Lahat ng beneficiary ay verified na sa database.</p>
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

      {/* History Log View */}
      {tab === "history" && (
        <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-slate-50/60 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              System-wide Beneficiary Activity Log ({allHistory.length})
            </h2>
          </div>
          <div>
            {isLoading ? (
              <div className="text-center py-16">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading history entries...</p>
              </div>
            ) : allHistory.length === 0 ? (
              <div className="text-center py-16">
                <History className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No history events recorded yet.</p>
              </div>
            ) : (
              allHistory.map((ev, idx) => (
                <div
                  key={ev.id || idx}
                  onClick={() => setSelectedId(ev.beneficiaryId)}
                  className="flex gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center bg-slate-100 border border-slate-200">
                      <Home className="h-4 w-4 text-slate-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-foreground uppercase">{ev.fullName}</span>
                      <span className="text-[11px] text-muted-foreground font-mono font-medium">{ev.beneficiaryNo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getProgramColor(ev.program)}`}>
                        {ev.program}
                      </span>
                      {ev.status && (
                        <span className="text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                          {ev.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground font-semibold">{ev.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ev.detail}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                      <span>{formatDate(ev.date)}</span>
                      {ev.performedBy && <span>• By {ev.performedBy}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Selected Profile Modal */}
      {selected && (
        <BeneficiaryProfileModal
          b={selected}
          onClose={() => setSelectedId(null)}
          onVerify={handleVerify}
          onReject={handleReject}
          onSetPending={handleSetPending}
          isProcessing={isProcessing}
        />
      )}
    </div>
  )
}
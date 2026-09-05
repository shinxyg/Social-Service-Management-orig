import { useState, useEffect, type ReactElement } from "react"
import {
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  MapPin,
} from "lucide-react"
import {
  syncAppointmentToFinancialAid,
  parseAppointmentDateTime,
  checkAndAutoReleaseScheduledDisbursements,
} from "../../utils/financialAidSync"
import { API_BASE } from "../../config/api"

// ---- Types ----
type ModuleKey =
  | "AICS"
  | "PWD"
  | "Senior Citizen"
  | "Solo Parent"
  | "Child Welfare"
  | "Livelihood"

type AppointmentStatus = "pending" | "scheduled" | "completed"

interface AppointmentRequest {
  id: string
  referenceNo: string
  module: ModuleKey
  applicantName: string
  submittedAt: string
  concern: string
  status: AppointmentStatus
  scheduledDate?: string
  scheduledTime?: string
  officeLocation?: string
  notes?: string
}

// ---- Empty Mock Data so only real submitted applications appear ----
const MOCK_APPOINTMENTS: AppointmentRequest[] = []

const MODULE_OPTIONS: ModuleKey[] = [
  "AICS",
  "PWD",
  "Senior Citizen",
  "Solo Parent",
  "Child Welfare",
  "Livelihood",
]

const moduleColors: Record<ModuleKey, string> = {
  AICS: "bg-blue-50 text-blue-700 border-blue-200",
  PWD: "bg-purple-50 text-purple-700 border-purple-200",
  "Senior Citizen": "bg-amber-50 text-amber-700 border-amber-200",
  "Solo Parent": "bg-violet-50 text-violet-700 border-violet-200",
  "Child Welfare": "bg-rose-50 text-rose-700 border-rose-200",
  Livelihood: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const statusTheme: Record<AppointmentStatus, { card: string; chip: string; icon: ReactElement; label: string }> = {
  pending: {
    card: "bg-amber-50/60 border-amber-200",
    chip: "bg-amber-100 text-amber-700",
    icon: <Clock className="h-3.5 w-3.5" />,
    label: "Pending",
  },
  scheduled: {
    card: "bg-blue-50/60 border-blue-200",
    chip: "bg-blue-100 text-blue-700",
    icon: <Calendar className="h-3.5 w-3.5" />,
    label: "Scheduled",
  },
  completed: {
    card: "bg-emerald-50/60 border-emerald-200",
    chip: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Completed",
  },
}

const DEFAULT_APPT_STATUS_THEME = {
  card: "bg-amber-50/60 border-amber-200",
  chip: "bg-amber-100 text-amber-700",
  icon: <Clock className="h-3.5 w-3.5" />,
  label: "Pending",
}

function getAppointmentStatusTheme(status?: string) {
  if (!status) return DEFAULT_APPT_STATUS_THEME
  const s = String(status).toLowerCase() as AppointmentStatus
  if (statusTheme[s]) return statusTheme[s]
  if (s.includes("sched")) return statusTheme.scheduled
  if (s.includes("comp") || s.includes("done")) return statusTheme.completed
  return {
    card: "bg-slate-50/60 border-slate-200",
    chip: "bg-slate-100 text-slate-700",
    icon: <Clock className="h-3.5 w-3.5" />,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  }
}

function getAppointmentModuleColor(mod?: string) {
  if (mod && moduleColors[mod as ModuleKey]) return moduleColors[mod as ModuleKey]
  return "bg-slate-50 text-slate-700 border-slate-200"
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

// ---- Schedule Modal ----
interface ScheduleModalProps {
  appointment: AppointmentRequest
  onClose: () => void
  onSave: (id: string, date: string, time: string, location: string, notes: string) => void
}

function ScheduleModal({ appointment, onClose, onSave }: ScheduleModalProps) {
  const [date, setDate] = useState(appointment.scheduledDate || "")
  const [time, setTime] = useState(appointment.scheduledTime || "")
  const [location, setLocation] = useState(appointment.officeLocation || "")
  const [notes, setNotes] = useState(appointment.notes || "")

  const canSave = date.trim() !== "" && time.trim() !== "" && location.trim() !== ""

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Set Appointment Schedule</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{appointment.applicantName} — {appointment.referenceNo}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl font-light">
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Time *</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Office Location *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. SSDD Main Office, Room 102"
              className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Notes / Instructions</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bring original IDs, 2x2 picture..."
              className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (canSave) onSave(appointment.id, date, time, location, notes)
            }}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm & Save Schedule
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Appointment Card ----
function AppointmentCard({
  appt,
  onSchedule,
  onMarkCompleted,
}: {
  appt: AppointmentRequest
  onSchedule: (a: AppointmentRequest) => void
  onMarkCompleted: (id: string) => void
}) {
  const st = getAppointmentStatusTheme(appt.status)
  return (
    <div className={`border rounded-xl p-4 ${st?.card || 'bg-slate-50/60 border-slate-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{appt.applicantName}</p>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getAppointmentModuleColor(appt.module)}`}>
              {appt.module}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1 font-mono">Ref: {appt.referenceNo}</p>
          <p className="text-sm text-foreground mb-2">{appt.concern}</p>
          <p className="text-xs text-muted-foreground">Requested: {formatDateTime(appt.submittedAt)}</p>

          {appt.status !== "pending" && appt.scheduledDate && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground bg-white/60 rounded-lg px-3 py-2 border border-border/60">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {new Date(appt.scheduledDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {appt.scheduledTime}
              </span>
              {appt.officeLocation && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {appt.officeLocation}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st?.chip || 'bg-slate-100 text-slate-700'}`}>
            {st?.icon}
            {st?.label}
          </span>

          {appt.status === "pending" && (
            <button
              onClick={() => onSchedule(appt)}
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              Set Schedule
            </button>
          )}
          {appt.status === "scheduled" && (
            <div className="flex flex-col items-end gap-1.5">
              <button
                onClick={() => onSchedule(appt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Reschedule
              </button>
              <button
                onClick={() => onMarkCompleted(appt.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark Completed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Main Component ----
export default function Appointments() {
  const [appointments, setAppointments] = useState<AppointmentRequest[]>(MOCK_APPOINTMENTS)
  const [schedulingAppt, setSchedulingAppt] = useState<AppointmentRequest | null>(null)
  const [filterModule, setFilterModule] = useState<"all" | ModuleKey>("all")
  const [filterStatus, setFilterStatus] = useState<"all" | AppointmentStatus>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        let appts: AppointmentRequest[] = []

        // 1. Fetch from PostgreSQL /api/appointments
        const resDb = await fetch(`${API_BASE}/api/appointments`)
        if (resDb.ok) {
          const dataDb = await resDb.json()
          if (dataDb.appointments && Array.isArray(dataDb.appointments)) {
            const mapped = dataDb.appointments.map((a: any) => ({
              id: `db-appt-${a.id}`,
              referenceNo: a.reference_no,
              module: (a.module || "AICS") as ModuleKey,
              applicantName: a.applicant_name,
              submittedAt: a.created_at || new Date().toISOString(),
              concern: a.concern,
              status: (a.status || "pending") as AppointmentStatus,
              scheduledDate: a.scheduled_date,
              scheduledTime: a.scheduled_time,
              officeLocation: a.office_location,
              notes: a.notes,
            }))
            appts.push(...mapped)
          }
        }

        // 2. Fetch from /api/aics/applications (Approved Only)
        const resAics = await fetch(`${API_BASE}/api/aics/applications`)
        if (resAics.ok) {
          const dataAics = await resAics.json()
          if (dataAics.applications && Array.isArray(dataAics.applications)) {
            const unapprovedRefs = new Set<string>()
            dataAics.applications.forEach((app: any) => {
              const ref = app.qc_id || app.reference_no || app.reference_number || "110000116932100"
              if (app.status === "rejected" || app.status === "pending") {
                unapprovedRefs.add(ref)
              } else if (app.status === "approved" || app.status === "completed" || app.status === "for_release") {
                if (!appts.some((ap) => ap.referenceNo === ref)) {
                  const fullName = [app.first_name, app.middle_name, app.last_name, app.suffix].filter(Boolean).join(" ") || "APPLICANT"
                  const rawType = (app.assistance_type || "Medical").replace(/\s*assistance/gi, "").trim()
                  const cleanType = rawType.charAt(0).toUpperCase() + rawType.slice(1) + " Assistance"
                  appts.push({
                    id: `aics-appt-${app.id}`,
                    referenceNo: ref,
                    module: "AICS",
                    applicantName: fullName,
                    submittedAt: app.created_at || new Date().toISOString(),
                    concern: cleanType,
                    status: "pending",
                  })
                }
              }
            })

            // Strict Filter: Only approved applications are allowed in Appointments
            appts = appts.filter((a) => !unapprovedRefs.has(a.referenceNo))
          }
        }

        // 3. Fetch from /api/pwd-senior/applications (Approved Social Assistance Only)
        let pwdSeniorApps: any[] = []
        try {
          const resPwd = await fetch(`${API_BASE}/api/pwd-senior/applications`)
          if (resPwd.ok) {
            pwdSeniorApps = await resPwd.json()
          }
        } catch {}

        if (!Array.isArray(pwdSeniorApps) || pwdSeniorApps.length === 0) {
          try {
            const local = localStorage.getItem("pwd_senior_applications")
            if (local) pwdSeniorApps = JSON.parse(local)
          } catch {}
        }

        if (Array.isArray(pwdSeniorApps) && pwdSeniorApps.length > 0) {
          const unapprovedPwdRefs = new Set<string>()
          pwdSeniorApps.forEach((app: any) => {
            const ref = app.referenceNumber || app.reference_number || app.id
            const isAssistance =
              app.type === "assistance" ||
              app.type === "social-assistance" ||
              String(app.category || "").toLowerCase().includes("assistance") ||
              String(app.service || "").toLowerCase().includes("assistance") ||
              String(app.assistanceType || "").toLowerCase().includes("assistance")

            if (isAssistance) {
              if (app.status === "rejected" || app.status === "pending") {
                unapprovedPwdRefs.add(ref)
              } else if (app.status === "approved" || app.status === "completed" || app.status === "for_release") {
                if (!appts.some((ap) => ap.referenceNo === ref)) {
                  const fullName =
                    [app.firstName, app.middleName, app.lastName, app.suffix].filter(Boolean).join(" ") ||
                    [app.first_name, app.middle_name, app.last_name, app.suffix].filter(Boolean).join(" ") ||
                    "APPLICANT"
                  const isPwdApp = String(app.category || "").toUpperCase().includes("PWD")
                  const concernName = isPwdApp ? "PWD Social Assistance" : "Senior Social Assistance"

                  appts.push({
                    id: `pwd-senior-appt-${app.id || ref}`,
                    referenceNo: ref,
                    module: isPwdApp ? "PWD" : "Senior Citizen",
                    applicantName: fullName,
                    submittedAt: app.submittedAt || app.created_at || new Date().toISOString(),
                    concern: concernName,
                    status: "pending",
                  })
                }
              }
            }
          })

          appts = appts.filter((a) => !unapprovedPwdRefs.has(a.referenceNo))
        }

        setAppointments(appts)
      } catch (err) {
        console.warn("Could not fetch appointments from backend:", err)
      }
    }

    fetchAppointments()

    // Real-time live checker: auto-completes appointments and auto-releases aid when time arrives
    const liveTimer = setInterval(() => {
      checkAndAutoReleaseScheduledDisbursements()
      const now = new Date()
      setAppointments((prev) =>
        prev.map((a) => {
          if (a.status === "scheduled" && a.scheduledDate) {
            const dt = parseAppointmentDateTime(a.scheduledDate, a.scheduledTime)
            if (dt && now.getTime() >= dt.getTime()) {
              return { ...a, status: "completed" as const }
            }
          }
          return a
        })
      )
    }, 2000)

    const handleStorageChange = () => fetchAppointments()
    window.addEventListener("appointments_updated", handleStorageChange)
    window.addEventListener("storage", handleStorageChange)
    return () => {
      clearInterval(liveTimer)
      window.removeEventListener("appointments_updated", handleStorageChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const handleSaveSchedule = (id: string, date: string, time: string, location: string, notes: string) => {
    const targetAppt = appointments.find((a) => a.id === id)
    if (targetAppt) {
      // Auto-connect with Financial Aid Disbursement and User Notifications
      syncAppointmentToFinancialAid({
        referenceNo: targetAppt.referenceNo,
        applicantName: targetAppt.applicantName,
        concern: targetAppt.concern,
        date,
        time,
        location,
        notes,
      })
    }

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "scheduled" as const,
              scheduledDate: date,
              scheduledTime: time,
              officeLocation: location,
              notes,
            }
          : a
      )
    )
    setSchedulingAppt(null)
  }

  const handleMarkCompleted = (id: string) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "completed" as const } : a)))
  }

  const filtered = appointments.filter((a) => {
    const matchModule = filterModule === "all" || a.module === filterModule
    const matchStatus = filterStatus === "all" || a.status === filterStatus
    const matchSearch =
      searchTerm === "" ||
      a.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.referenceNo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchModule && matchStatus && matchSearch
  })

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    scheduled: appointments.filter((a) => a.status === "scheduled").length,
    completed: appointments.filter((a) => a.status === "completed").length,
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: stats.total, color: "blue" },
          { label: "Pending", value: stats.pending, color: "yellow" },
          { label: "Scheduled", value: stats.scheduled, color: "blue" },
          { label: "Completed", value: stats.completed, color: "green" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg p-4 bg-${stat.color}-50 border border-${stat.color}-200`}>
            <p className={`text-xs font-semibold text-${stat.color}-700 uppercase`}>{stat.label}</p>
            <p className={`text-3xl font-bold text-${stat.color}-700 mt-2`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or reference number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Module</label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value as any)}
              className="mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 block"
            >
              <option value="all">All Modules</option>
              {MODULE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
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
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Requests ({filtered.length})</h2>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No appointment requests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                onSchedule={setSchedulingAppt}
                onMarkCompleted={handleMarkCompleted}
              />
            ))}
          </div>
        )}
      </div>

      {schedulingAppt && (
        <ScheduleModal
          appointment={schedulingAppt}
          onClose={() => setSchedulingAppt(null)}
          onSave={handleSaveSchedule}
        />
      )}
    </div>
  )
}
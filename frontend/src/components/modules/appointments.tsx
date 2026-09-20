import { useState, useEffect, type ReactElement } from "react"
import {
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  MapPin,
  Building2,
  Printer,
  XCircle,
  Sparkles,
} from "lucide-react"

import { notifyApplicationChange, subscribeToRealtimeChanges } from "../../utils/realtimeSync"
import { pushUserNotification, syncAppointmentToFinancialAid } from "../../utils/financialAidSync"
import { API_BASE } from "../../config/api"
import { OfficialGuaranteeLetterModal, type GuaranteeLetterData } from "../ui/official-guarantee-letter-modal"
import { OfficialReferralLetterModal, type ReferralLetterData } from "../ui/official-referral-letter-modal"

type ModuleKey =
  | "AICS"
  | "PWD"
  | "Senior Citizen"
  | "Solo Parent"
  | "Child Welfare"
  | "Livelihood"

type AppointmentStatus = "pending" | "scheduled" | "under_review" | "completed" | "approved" | "referred" | "rejected"

interface AppointmentRequest {
  id: string
  rawAppId?: string | number
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
  rawApp?: any
}

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
  AICS: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60",
  PWD: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60",
  "Senior Citizen": "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
  "Solo Parent": "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60",
  "Child Welfare": "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
  Livelihood: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
}

const statusTheme: Record<AppointmentStatus, { card: string; chip: string; icon: ReactElement; label: string }> = {
  pending: {
    card: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40",
    chip: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60",
    icon: <Clock className="h-3.5 w-3.5" />,
    label: "Pending",
  },
  scheduled: {
    card: "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40",
    chip: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60",
    icon: <Calendar className="h-3.5 w-3.5" />,
    label: "Under Review",
  },
  under_review: {
    card: "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40",
    chip: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60",
    icon: <Calendar className="h-3.5 w-3.5" />,
    label: "Under Review",
  },
  approved: {
    card: "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40",
    chip: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Approved",
  },
  completed: {
    card: "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40",
    chip: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Completed",
  },
  referred: {
    card: "bg-purple-50/70 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40",
    chip: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60",
    icon: <Building2 className="h-3.5 w-3.5" />,
    label: "Referred",
  },
  rejected: {
    card: "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40",
    chip: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60",
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "Rejected",
  },
}

const DEFAULT_APPT_STATUS_THEME = {
  card: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40",
  chip: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60",
  icon: <Clock className="h-3.5 w-3.5" />,
  label: "Pending",
}

function getAppointmentStatusTheme(status?: string) {
  if (!status) return DEFAULT_APPT_STATUS_THEME
  const s = String(status).toLowerCase() as AppointmentStatus
  if (statusTheme[s]) return statusTheme[s]
  if (s.includes("sched") || s.includes("under") || s.includes("review")) return statusTheme.scheduled
  if (s.includes("appr")) return statusTheme.approved
  if (s.includes("ref")) return statusTheme.referred
  if (s.includes("rej") || s.includes("den")) return statusTheme.rejected
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

interface ScheduleModalProps {
  appointment: AppointmentRequest
  onClose: () => void
  onSave: (id: string, date: string, time: string, location: string, notes: string) => void
}

function ScheduleModal({ appointment, onClose, onSave }: ScheduleModalProps) {
  const [date, setDate] = useState(appointment.scheduledDate || "")
  const [time, setTime] = useState(appointment.scheduledTime || "")
  const location = appointment.officeLocation || "Quezon City Hall"

  const canSave = date.trim() !== "" && time.trim() !== ""

  const autoNotes =
    appointment.notes && !appointment.notes.includes("Awtomatikong pumasok")
      ? appointment.notes
      : `Mangyaring magtungo sa ${location} sa itinakdang petsa at oras. Dalhin ang orihinal na QCID / Valid ID para sa transaksyon sa ${appointment.concern}.`

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Set Appointment Schedule</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{appointment.applicantName} — {appointment.referenceNo}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl font-light cursor-pointer">
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
            <label className="text-xs font-semibold text-muted-foreground">Office Location</label>
            <div className="w-full mt-1 px-3 py-2.5 text-sm bg-slate-50 border border-border rounded-lg text-foreground font-semibold flex items-center justify-between">
              <span>{location}</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase tracking-wider">Fixed Venue</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (canSave) onSave(appointment.id, date, time, location, autoNotes)
            }}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Confirm & Save Schedule
          </button>
        </div>
      </div>
    </div>
  )
}

function AppointmentCard({
  appt,
  onSchedule,
  onApprove,
  onRefer,
  onReject,
  onPrintGL,
  onPrintReferral,
  onDelete: _onDelete,
}: {
  appt: AppointmentRequest
  onSchedule: (a: AppointmentRequest) => void
  onApprove?: (a: AppointmentRequest) => void
  onRefer?: (a: AppointmentRequest) => void
  onReject?: (a: AppointmentRequest) => void
  onPrintGL?: (a: AppointmentRequest) => void
  onPrintReferral?: (a: AppointmentRequest) => void
  onDelete?: (id: string, ref: string) => void
}) {
  const st = getAppointmentStatusTheme(appt.status)
  return (
    <div className={`border rounded-xl p-4 ${st?.card || 'bg-slate-50/60 border-slate-200'}`}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-bold text-foreground">{appt.applicantName}</p>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getAppointmentModuleColor(appt.module)}`}>
              {appt.module}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1 font-mono">Ref: {appt.referenceNo}</p>
          <p className="text-sm text-foreground mb-1 font-medium">{appt.concern}</p>
          <p className="text-xs text-muted-foreground">Requested: {formatDateTime(appt.submittedAt)}</p>

          {appt.scheduledDate && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground bg-white/80 dark:bg-slate-900/60 rounded-lg px-3 py-2 border border-border/70 dark:border-slate-800">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                {new Date(appt.scheduledDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                {appt.scheduledTime}
              </span>
              {appt.officeLocation && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  {appt.officeLocation}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st?.chip || 'bg-slate-100 text-slate-700'}`}>
              {st?.icon}
              {st?.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-2 justify-end">
            {/* 1. Pending Schedule Stage */}
            {appt.status === "pending" && (
              <>
                <button
                  type="button"
                  onClick={() => onSchedule(appt)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>📅 Set Schedule</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReject?.(appt)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>
              </>
            )}

            {/* 2. Scheduled Interview / Under Review Stage */}
            {(appt.status === "scheduled" || (appt.status as string) === "under_review") && (
              <>
                <button
                  type="button"
                  onClick={() => onApprove?.(appt)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs"
                  title="Approve QC Assistance & generate Guarantee Letter"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>✓ Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRefer?.(appt)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors cursor-pointer shadow-2xs"
                  title="Endorse to partner agency (PCSO / DSWD / DOH)"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>🏛️ Refer</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReject?.(appt)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>
              </>
            )}

            {/* 3. Approved / Completed Stage */}
            {(appt.status === "approved" || appt.status === "completed") && (
              <button
                type="button"
                onClick={() => onPrintGL?.(appt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>📄 Print GL</span>
              </button>
            )}

            {/* 4. Referred Stage */}
            {appt.status === "referred" && (
              <button
                type="button"
                onClick={() => onPrintReferral?.(appt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>🏛️ Print Referral</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getAppointmentDeduplicationKey(a: { id?: string; referenceNo?: string; applicantName?: string; concern?: string; module?: string }): string {
  const ref = String(a.referenceNo || "").toLowerCase().trim()
  const id = String(a.id || "").toLowerCase().trim()
  if (ref) {
    return `ref_${ref}`
  }
  if (id) {
    return `id_${id}`
  }
  const cleanName = String(a.applicantName || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim()
  return `name_${cleanName}_${Date.now()}`
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([])
  const [schedulingAppt, setSchedulingAppt] = useState<AppointmentRequest | null>(null)
  const [filterModule, setFilterModule] = useState<"all" | ModuleKey>("all")
  const [filterStatus, setFilterStatus] = useState<"all" | AppointmentStatus>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const isFetchingRef = useState({ current: false })[0]

  useEffect(() => {
    const fetchAppointments = async () => {
      if (isFetchingRef.current) return
      isFetchingRef.current = true
      try {
        let appts: AppointmentRequest[] = []

        let localScheduledMap: Record<string, any> = {}
        try {
          const raw = localStorage.getItem("all_appointments_scheduled")
          if (raw) localScheduledMap = JSON.parse(raw)
        } catch {}

        let dismissedSet = new Set<string>()
        try {
          const dismissedRaw = localStorage.getItem("dismissed_appointments")
          if (dismissedRaw) {
            const parsed = JSON.parse(dismissedRaw)
            if (Array.isArray(parsed)) {
              parsed.forEach((d: string) => dismissedSet.add(String(d).trim().toLowerCase()))
            }
          }
        } catch {}

        const [
          resDbSettled,
          resAicsSettled,
          resPwdSettled,
          resLivSettled,
          resCwSettled,
        ] = await Promise.allSettled([
          fetch(`${API_BASE}/api/appointments`),
          fetch(`${API_BASE}/api/aics/applications`),
          fetch(`${API_BASE}/api/pwd-senior/applications`),
          fetch(`${API_BASE}/api/livelihood/applications`),
          fetch(`${API_BASE}/api/child-welfare/admin/all?limit=100`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }),
        ])

        const cleanDate = (d: any) => {
          if (!d) return null
          const s = String(d).trim()
          if (!s || s.toLowerCase().includes('sep 19') || s.includes('2026-09-19')) return null
          return s
        }

        if (resDbSettled.status === "fulfilled" && resDbSettled.value.ok) {
          try {
            const dataDb = await resDbSettled.value.json()
            if (Array.isArray(dataDb.deletedReferences)) {
              dataDb.deletedReferences.forEach((r: string) => dismissedSet.add(String(r).trim().toLowerCase()))
            }
            if (dataDb.appointments && Array.isArray(dataDb.appointments)) {
              const mapped = dataDb.appointments
                .filter((a: any) => {
                  const concern = String(a.concern || '').toLowerCase()
                  const ref = String(a.qc_id || a.qcid || a.reference_no || a.reference_number || '').trim().toLowerCase()
                  const rawId = String(a.id || '').trim().toLowerCase()
                  if (dismissedSet.has(ref) || dismissedSet.has(rawId) || dismissedSet.has(`db-appt-${rawId}`)) {
                    return false
                  }
                  if (concern.includes('id card') || concern.includes('issuance') || concern.includes('replacement') || concern.includes('renewal')) {
                    return false
                  }
                  return true
                })
                .map((a: any) => {
                  const apptId = `db-appt-${a.id}`
                  const ref = String(a.qc_id || a.qcid || a.reference_no || a.reference_number || "").trim()
                  const cached = localScheduledMap[apptId] || (ref ? localScheduledMap[`appt_${ref}`] : undefined)
                  const schedDate = cleanDate(a.scheduled_date || cached?.scheduledDate)
                  const schedTime = schedDate ? (a.scheduled_time || cached?.scheduledTime || null) : null
                  const hasDate = Boolean(schedDate)
                  
                  let statusVal: AppointmentStatus = 'pending'
                  if (hasDate) {
                    if (a.status === 'completed' || cached?.status === 'completed') {
                      statusVal = 'completed'
                    } else if (a.status === 'approved' || cached?.status === 'approved') {
                      statusVal = 'approved'
                    } else if (a.status === 'referred' || a.status === 'for_referral' || cached?.status === 'referred') {
                      statusVal = 'referred'
                    } else if (a.status === 'rejected' || cached?.status === 'rejected') {
                      statusVal = 'rejected'
                    } else {
                      statusVal = 'scheduled'
                    }
                  } else {
                    if (a.status === 'rejected' || cached?.status === 'rejected') {
                      statusVal = 'rejected'
                    } else {
                      statusVal = 'pending'
                    }
                  }

                  return {
                    id: apptId,
                    referenceNo: ref,
                    module: (a.module || "AICS") as ModuleKey,
                    applicantName: a.applicant_name,
                    submittedAt: a.created_at || new Date().toISOString(),
                    concern: a.concern,
                    status: statusVal,
                    scheduledDate: schedDate,
                    scheduledTime: schedTime,
                    officeLocation: cached?.officeLocation || a.office_location || "Quezon City Hall",
                    notes: cached?.notes || a.notes,
                  }
                })
              appts.push(...mapped)
            }
          } catch {}
        }

        if (resAicsSettled.status === "fulfilled" && resAicsSettled.value.ok) {
          try {
            const data = await resAicsSettled.value.json()
            if (data.applications && Array.isArray(data.applications)) {
              data.applications.forEach((app: any) => {
                if (app.status !== "rejected") {
                  const rawType = (app.assistance_type || "Medical").replace(/\s*assistance/gi, "").trim()
                  const cleanType = (rawType.charAt(0).toUpperCase() + rawType.slice(1)) + " Assistance"
                  const ref = String(app.qc_id || app.reference_no || app.reference_number || `AICS-2026-${String(app.id || 1).padStart(4, "0")}`).trim()
                  const apptId = `aics-appt-${app.id || ref}`
                  const cached = localScheduledMap[apptId] || (ref ? localScheduledMap[`appt_${ref}`] : undefined)
                  const schedDate = cleanDate((app.details as any)?.appointmentDate || cached?.scheduledDate)
                  const schedTime = schedDate ? ((app.details as any)?.appointmentTime || cached?.scheduledTime || null) : null
                  const hasDate = Boolean(schedDate)
                  
                  let apptStatus: AppointmentStatus = 'pending'
                  const rawAppStatus = String(app.status || '').toLowerCase()
                  if (rawAppStatus === 'approved' || rawAppStatus === 'completed' || cached?.status === 'approved' || cached?.status === 'completed') {
                    apptStatus = 'approved'
                  } else if (rawAppStatus === 'for_referral' || rawAppStatus === 'referred' || cached?.status === 'referred') {
                    apptStatus = 'referred'
                  } else if (rawAppStatus === 'rejected' || cached?.status === 'rejected') {
                    apptStatus = 'rejected'
                  } else if (hasDate || rawAppStatus === 'scheduled' || rawAppStatus === 'under_review' || cached?.status === 'scheduled') {
                    apptStatus = 'scheduled'
                  } else {
                    apptStatus = 'pending'
                  }

                  appts.push({
                    id: apptId,
                    rawAppId: app.id,
                    referenceNo: ref,
                    module: "AICS",
                    applicantName: `${app.first_name || ""} ${app.middle_name || ""} ${app.last_name || ""}`.trim().toUpperCase() || "BENEFICIARY APPLICANT",
                    submittedAt: app.created_at || new Date().toISOString(),
                    concern: cleanType,
                    status: apptStatus,
                    scheduledDate: schedDate,
                    scheduledTime: schedTime,
                    officeLocation: cached?.officeLocation || (app.details as any)?.appointmentVenue || "Quezon City Hall",
                    notes: cached?.notes,
                    rawApp: app,
                  })
                }
              })
            }
          } catch {}
        }

        let pwdSeniorApps: any[] = []
        if (resPwdSettled.status === "fulfilled" && resPwdSettled.value.ok) {
          try {
            pwdSeniorApps = await resPwdSettled.value.json()
          } catch {}
        }
        if (!pwdSeniorApps || pwdSeniorApps.length === 0) {
          try {
            const local = localStorage.getItem("pwd_senior_applications")
            if (local) pwdSeniorApps = JSON.parse(local)
          } catch {}
        }
        if (Array.isArray(pwdSeniorApps)) {
          pwdSeniorApps.forEach((app: any) => {
            const isAssistance =
              app.type === "assistance" ||
              app.type === "social-assistance" ||
              String(app.category || "").toLowerCase().includes("assistance") ||
              String(app.service || "").toLowerCase().includes("assistance") ||
              String(app.assistanceType || "").toLowerCase().includes("assistance")
            if (isAssistance && (app.status === "approved" || app.status === "completed" || app.status === "for_release" || app.status === "released")) {
              const isPwd = String(app.category || "").toUpperCase().includes("PWD")
              const mod: ModuleKey = isPwd ? "PWD" : "Senior Citizen"
              const concern = isPwd ? "PWD Social Assistance" : "Senior Social Assistance"
              const ref = app.referenceNumber || app.reference_number || "PWD-QC-2026"
              const apptId = `pwd-senior-appt-${app.id || ref}`
              const cached = localScheduledMap[apptId] || localScheduledMap[ref] || localScheduledMap[`${ref}_${concern}`]
              const fullName = [app.firstName || app.first_name, app.middleName || app.middle_name, app.lastName || app.last_name, app.suffix].filter(Boolean).join(" ").trim().toUpperCase() || "BENEFICIARY"
              const isDone = app.status === "completed" || app.status === "released" || cached?.status === "completed"
              appts.push({
                id: apptId,
                referenceNo: ref,
                module: mod,
                applicantName: fullName,
                submittedAt: app.submittedAt || app.created_at || new Date().toISOString(),
                concern,
                status: isDone ? "completed" : ((cached?.status || "pending") as AppointmentStatus),
                scheduledDate: cached?.scheduledDate,
                scheduledTime: cached?.scheduledTime,
                officeLocation: cached?.officeLocation || "Quezon City Hall",
                notes: cached?.notes,
              })
            }
          })
        }

        if (resLivSettled.status === "fulfilled" && resLivSettled.value.ok) {
          try {
            const dataLiv = await resLivSettled.value.json()
            if (Array.isArray(dataLiv)) {
              dataLiv.forEach((l: any) => {
                if (String(l.application_status || l.status).toLowerCase() === "approved") {
                  const ref = l.reference_number || `LP-2026-${l.id}`
                  const apptId = `liv-appt-${l.id || ref}`
                  const concern = "Livelihood Capital Assistance"
                  const cached = localScheduledMap[apptId] || localScheduledMap[ref] || localScheduledMap[`${ref}_${concern}`]
                  const fullName = `${l.first_name || ""} ${l.last_name || ""}`.trim().toUpperCase() || "BENEFICIARY"
                  appts.push({
                    id: apptId,
                    referenceNo: ref,
                    module: "Livelihood",
                    applicantName: fullName,
                    submittedAt: l.created_at || new Date().toISOString(),
                    concern,
                    status: (cached?.status || "pending") as AppointmentStatus,
                    scheduledDate: cached?.scheduledDate,
                    scheduledTime: cached?.scheduledTime,
                    officeLocation: cached?.officeLocation || "Quezon City Hall - SSDD Livelihood Center",
                    notes: cached?.notes,
                  })
                }
              })
            }
          } catch {}
        }

        if (resCwSettled.status === "fulfilled" && resCwSettled.value.ok) {
          try {
            const dataCw = await resCwSettled.value.json()
            const cwApps = Array.isArray(dataCw.applications) ? dataCw.applications : []
            cwApps.forEach((c: any) => {
              const st = String(c.application_status || c.status).toLowerCase()
              if (st === "approved" || st === "for_release" || st === "released" || st === "completed") {
                const ref = c.reference_number || `CW-2026-${c.id}`
                const apptId = `cw-appt-${c.id || ref}`
                const concern = c.category_title ? `${c.category_title} (Child Welfare)` : "Child Welfare Support"
                const cached = localScheduledMap[apptId] || localScheduledMap[ref] || localScheduledMap[`${ref}_${concern}`]
                const fullName = [c.guardian_first_name, c.guardian_last_name].filter(Boolean).join(" ").trim().toUpperCase() || (c.child_name || "").toUpperCase() || "BENEFICIARY"
                const isDone = st === "released" || st === "completed" || cached?.status === "completed"
                appts.push({
                  id: apptId,
                  referenceNo: ref,
                  module: "Child Welfare",
                  applicantName: fullName,
                  submittedAt: c.created_at || new Date().toISOString(),
                  concern,
                  status: isDone ? "completed" : ((cached?.status || "pending") as AppointmentStatus),
                  scheduledDate: cached?.scheduledDate,
                  scheduledTime: cached?.scheduledTime,
                  officeLocation: cached?.officeLocation || "Quezon City Hall - SSDD Child Welfare Section",
                  notes: cached?.notes,
                })
              }
            })
          } catch {}
        }

        appts = appts.filter((a) => {
          const ref = String(a.referenceNo || '').toLowerCase().trim()
          const id = String(a.id || '').toLowerCase().trim()
          const rawId = id.replace(/^(db-appt-|aics-appt-|pwd-senior-appt-|cw-appt-|liv-appt-)/, '')
          return !dismissedSet.has(ref) && !dismissedSet.has(id) && !dismissedSet.has(rawId)
        })

        const dedupedMap = new Map<string, AppointmentRequest>()
        const statusPriority: Record<AppointmentStatus, number> = { completed: 5, approved: 4, referred: 3, scheduled: 2, pending: 1, rejected: 1 }

        appts.forEach((a) => {
          const c = (a.concern || '').toLowerCase()
          if (c.includes('id card') || c.includes('issuance') || c.includes('replacement') || c.includes('renewal')) {
            return
          }
          const key = getAppointmentDeduplicationKey(a)
          if (!dedupedMap.has(key)) {
            dedupedMap.set(key, a)
          } else {
            const existing = dedupedMap.get(key)!
            const curPrio = statusPriority[a.status] || 1
            const exPrio = statusPriority[existing.status] || 1

            const merged: AppointmentRequest = { ...existing }
            if (a.scheduledDate && (!merged.scheduledDate || curPrio >= exPrio)) {
              merged.scheduledDate = a.scheduledDate
              merged.scheduledTime = a.scheduledTime
              merged.officeLocation = a.officeLocation
              merged.notes = a.notes || merged.notes
            }
            if (merged.scheduledDate) {
              if (curPrio > exPrio) {
                merged.status = a.status
              }
            } else {
              merged.status = (a.status === 'rejected' || existing.status === 'rejected') ? 'rejected' : 'pending'
            }
            if (a.id.startsWith('db-appt-')) {
              merged.id = a.id
            }
            if (a.referenceNo && String(a.referenceNo).length > String(merged.referenceNo || '').length) {
              merged.referenceNo = a.referenceNo
            }
            if (a.concern && a.concern.length > (merged.concern || '').length) {
              merged.concern = a.concern
            }
            dedupedMap.set(key, merged)
          }
        })

        const finalAppts = Array.from(dedupedMap.values())
        setAppointments(finalAppts)
        try {
          localStorage.setItem("cached_appointments_list", JSON.stringify(finalAppts))
          localStorage.setItem("all_appointments", JSON.stringify(finalAppts))
          localStorage.setItem("appointments", JSON.stringify(finalAppts))
        } catch {}
      } catch (err) {
        console.warn("Could not fetch appointments from backend:", err)
      } finally {
        isFetchingRef.current = false
      }
    }

    fetchAppointments()

    // Periodic live sync without auto-completing appointments prematurely
    const liveTimer = setInterval(() => {
      fetchAppointments()
    }, 10000)

    const unsubscribeRealtime = subscribeToRealtimeChanges(() => {
      fetchAppointments()
    })

    const handleStorageChange = () => fetchAppointments()
    window.addEventListener("appointments_updated", handleStorageChange)
    window.addEventListener("storage", handleStorageChange)
    return () => {
      clearInterval(liveTimer)
      unsubscribeRealtime()
      window.removeEventListener("appointments_updated", handleStorageChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const handleSaveSchedule = async (id: string, date: string, time: string, location: string, notes: string) => {
    const targetAppt = appointments.find((a) => a.id === id)
    if (targetAppt) {

      try {
        const raw = localStorage.getItem("all_appointments_scheduled")
        const localScheduledMap = raw ? JSON.parse(raw) : {}
        const schedObj = {
          status: "scheduled",
          scheduledDate: date,
          scheduledTime: time,
          officeLocation: location,
          notes,
        }
        localScheduledMap[targetAppt.id] = schedObj
        localScheduledMap[`${targetAppt.referenceNo}_${targetAppt.concern}`] = schedObj
        localScheduledMap[targetAppt.referenceNo] = schedObj
        localStorage.setItem("all_appointments_scheduled", JSON.stringify(localScheduledMap))
      } catch {}

      syncAppointmentToFinancialAid({
        referenceNo: targetAppt.referenceNo,
        applicantName: targetAppt.applicantName,
        concern: targetAppt.concern,
        date,
        time,
        location,
        notes,
      })

      try {
        await fetch(`${API_BASE}/api/appointments/${encodeURIComponent(targetAppt.referenceNo)}/schedule`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledDate: date,
            scheduledTime: time,
            officeLocation: location,
            notes,
            applicantName: targetAppt.applicantName,
            concern: targetAppt.concern,
          }),
        })

        // Also notify AICS and Citizen User Portal
        const targetAppId = targetAppt.rawAppId || targetAppt.id.replace('aics-appt-', '').replace('db-appt-', '')
        await fetch(`${API_BASE}/api/aics/applications/${targetAppId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'under_review',
            appointmentDate: date,
            appointmentVenue: location,
          }),
        }).catch(() => fetch(`${API_BASE}/applications/${targetAppId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'under_review',
            appointmentDate: date,
            appointmentVenue: location,
          }),
        })).catch(() => {})

        pushUserNotification({
          userId: targetAppt.referenceNo || 'all',
          title: 'AICS: Interview Scheduled — Under Review',
          message: `Nakatakda ang inyong interview sa ${date} (${time}) sa ${location}. Ang inyong aplikasyon ay kasalukuyang under review.`,
          type: 'appointment',
          link: '/portal/aics',
        })

        notifyApplicationChange('STATUS_CHANGED', 'aics', targetAppt.referenceNo)
        window.dispatchEvent(new Event("aics_applications_updated"))
        window.dispatchEvent(new Event("appointments_updated"))
        window.dispatchEvent(new Event("user_notifications_updated"))
      } catch (err) {
        console.warn("Backend schedule PUT error:", err)
      }
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

  const handleMarkCompleted = async (id: string) => {
    const targetAppt = appointments.find((a) => a.id === id)
    const ref = targetAppt?.referenceNo || id.replace('db-appt-', '')
    try {
      const raw = localStorage.getItem("all_appointments_scheduled")
      const localScheduledMap = raw ? JSON.parse(raw) : {}
      const compObj = { status: "completed" }
      localScheduledMap[id] = compObj
      if (targetAppt) {
        localScheduledMap[`${targetAppt.referenceNo}_${targetAppt.concern}`] = compObj
      }
      localScheduledMap[ref] = compObj
      localStorage.setItem("all_appointments_scheduled", JSON.stringify(localScheduledMap))
    } catch {}

    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "completed" as const } : a)))

    try {
      await fetch(`${API_BASE}/api/appointments/${encodeURIComponent(ref)}/complete`, { method: "PUT" })
    } catch {}
  }

  const [glModalData, setGlModalData] = useState<GuaranteeLetterData | null>(null)
  const [refLetterModalData, setRefLetterModalData] = useState<ReferralLetterData | null>(null)
  const [referralApp, setReferralApp] = useState<AppointmentRequest | null>(null)
  const [selectedAgency, setSelectedAgency] = useState('PCSO')
  const [referralNotes, setReferralNotes] = useState('Total financial requirement exceeds local budget capacity. Endorsed for assistance.')

  const handleApproveAid = async (appt: AppointmentRequest) => {
    try {
      const targetId = appt.rawAppId || appt.id.replace('aics-appt-', '').replace('db-appt-', '')
      await fetch(`${API_BASE}/api/aics/applications/${encodeURIComponent(targetId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      }).catch(() => fetch(`${API_BASE}/applications/${encodeURIComponent(targetId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })).catch(() => {})

      await fetch(`${API_BASE}/api/appointments/${encodeURIComponent(appt.referenceNo || targetId)}/complete`, {
        method: 'PUT',
      }).catch(() => {})

      const raw = localStorage.getItem("all_appointments_scheduled") || "{}"
      const localMap = JSON.parse(raw)
      localMap[appt.id] = { ...(localMap[appt.id] || {}), status: "approved" }
      localMap[appt.referenceNo] = { ...(localMap[appt.referenceNo] || {}), status: "approved" }
      localStorage.setItem("all_appointments_scheduled", JSON.stringify(localMap))

      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "approved" as const } : a))

      pushUserNotification({
        userId: appt.referenceNo || 'all',
        title: 'AICS: Application APPROVED',
        message: `Malugod naming ipinababatid na APPROVED ang inyong ${appt.concern}. Ang inyong Guarantee Letter ay handa na.`,
        type: 'payout',
        link: '/portal/aics',
      })

      notifyApplicationChange('STATUS_CHANGED', 'aics', appt.referenceNo)
      window.dispatchEvent(new Event("appointments_updated"))
      window.dispatchEvent(new Event("aics_applications_updated"))
    } catch (err) {
      console.error(err)
    }
  }

  const handleConfirmReferral = async () => {
    if (!referralApp) return
    const appt = referralApp
    try {
      const targetId = appt.rawAppId || appt.id.replace('aics-appt-', '').replace('db-appt-', '')
      await fetch(`${API_BASE}/api/aics/applications/${encodeURIComponent(targetId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'referred',
          referralAgency: selectedAgency,
          referralNotes: referralNotes,
        }),
      }).catch(() => fetch(`${API_BASE}/applications/${encodeURIComponent(targetId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'referred',
          referralAgency: selectedAgency,
          referralNotes: referralNotes,
        }),
      })).catch(() => {})

      const raw = localStorage.getItem("all_appointments_scheduled") || "{}"
      const localMap = JSON.parse(raw)
      localMap[appt.id] = { ...(localMap[appt.id] || {}), status: "referred" }
      localMap[appt.referenceNo] = { ...(localMap[appt.referenceNo] || {}), status: "referred" }
      localStorage.setItem("all_appointments_scheduled", JSON.stringify(localMap))

      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "referred" as const } : a))

      pushUserNotification({
        userId: appt.referenceNo || 'all',
        title: `AICS: Endorsed to ${selectedAgency}`,
        message: `Ang inyong ${appt.concern} ay inendorso sa ${selectedAgency}. Maaari ninyong i-download ang inyong Referral Letter.`,
        type: 'aics',
        link: '/portal/aics',
      })

      notifyApplicationChange('STATUS_CHANGED', 'aics', appt.referenceNo)
      window.dispatchEvent(new Event("appointments_updated"))
      window.dispatchEvent(new Event("aics_applications_updated"))

      setReferralApp(null)
    } catch (err) {
      console.error(err)
      setReferralApp(null)
    }
  }

  const handleRejectAid = async (appt: AppointmentRequest) => {
    const reason = prompt("Pakilagay ang dahilan ng disqualification / rejection:", "Non-resident of Quezon City / Unverified Residency Documents")
    if (reason === null) return

    try {
      const targetId = appt.rawAppId || appt.id.replace('aics-appt-', '').replace('db-appt-', '')
      await fetch(`${API_BASE}/api/aics/applications/${encodeURIComponent(targetId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'rejected',
          rejectionReason: reason,
        }),
      }).catch(() => fetch(`${API_BASE}/applications/${encodeURIComponent(targetId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'rejected',
          rejectionReason: reason,
        }),
      })).catch(() => {})

      await fetch(`${API_BASE}/api/appointments/${encodeURIComponent(appt.referenceNo || targetId)}`, {
        method: 'DELETE',
      }).catch(() => {})

      const raw = localStorage.getItem("all_appointments_scheduled") || "{}"
      const localMap = JSON.parse(raw)
      localMap[appt.id] = { ...(localMap[appt.id] || {}), status: "rejected" }
      localMap[appt.referenceNo] = { ...(localMap[appt.referenceNo] || {}), status: "rejected" }
      localStorage.setItem("all_appointments_scheduled", JSON.stringify(localMap))

      pushUserNotification({
        userId: appt.referenceNo || 'all',
        title: 'AICS: Application REJECTED / DISQUALIFIED',
        message: `Ikinalulungkot naming ipabatid na hindi naaprubahan ang inyong aplikasyon (${appt.concern}). Dahilan: ${reason}`,
        type: 'aics',
        link: '/portal/aics',
      })

      setAppointments(prev => prev.filter(a => a.id !== appt.id && a.referenceNo !== appt.referenceNo))
      notifyApplicationChange('STATUS_CHANGED', 'aics', appt.referenceNo)
      window.dispatchEvent(new Event("appointments_updated"))
      window.dispatchEvent(new Event("aics_applications_updated"))
      window.dispatchEvent(new Event("user_notifications_updated"))
    } catch (err) {
      console.error(err)
    }
  }

  const handlePrintGL = (appt: AppointmentRequest) => {
    const raw = appt.rawApp || {}
    const rawDetails = raw.details || {}
    setGlModalData({
      controlNo: `QC-SSDD-GL-2026-${String(appt.rawAppId || appt.id).padStart(6, '0')}`,
      applicationRef: appt.referenceNo,
      patientName: appt.applicantName,
      qcidNumber: raw.qc_id || appt.referenceNo,
      barangay: raw.address?.split(',')[1]?.trim() || rawDetails.beneficiaryBarangay || 'Commonwealth',
      district: '2',
      age: raw.age || '42',
      gender: raw.gender || 'Female',
      address: raw.address || 'Quezon City',
      diagnosis: rawDetails.medicalDiagnosis || `${appt.concern} — SSDD Evaluated Assistance`,
      hospitalName: rawDetails.partnerHospital || rawDetails.partnerHospitalOther || 'East Avenue Medical Center',
      amount: 5000,
      dateIssued: new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
    })
  }

  const handlePrintReferral = (appt: AppointmentRequest, agencyOverride?: string, notesOverride?: string) => {
    const raw = appt.rawApp || {}
    const rawDetails = raw.details || {}
    const targetAgency = agencyOverride || rawDetails.referralAgency || selectedAgency || 'PCSO'
    const refNotes = notesOverride || rawDetails.referralNotes || 'Total financial requirement exceeds local budget capacity. Respectfully endorsed for partner agency financial assistance.'

    setRefLetterModalData({
      controlNo: `QC-SSDD-REF-2026-${String(appt.rawAppId || appt.id).padStart(6, '0')}`,
      applicationRef: appt.referenceNo,
      patientName: appt.applicantName,
      qcidNumber: raw.qc_id || appt.referenceNo,
      barangay: raw.address?.split(',')[1]?.trim() || rawDetails.beneficiaryBarangay || 'Commonwealth',
      district: '2',
      age: raw.age || '42',
      gender: raw.gender || 'Female',
      address: raw.address || 'Quezon City',
      diagnosis: rawDetails.medicalDiagnosis || `${appt.concern} Support`,
      hospitalName: rawDetails.partnerHospital || rawDetails.partnerHospitalOther || 'East Avenue Medical Center',
      targetAgency,
      referralReason: refNotes,
      dateIssued: new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
      socialWorkerName: 'MARIA SANTOS, RSW',
    })
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
    completed: appointments.filter((a) => a.status === "completed" || a.status === "approved").length,
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Appointments & Case Scheduling</h1>
        <p className="text-xs text-muted-foreground mt-1">Set schedules, conduct assessments, approve aid vouchers, and issue partner agency referrals.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: stats.total },
          { label: "Pending Schedule", value: stats.pending },
          { label: "Under Review", value: stats.scheduled },
          { label: "Approved / Done", value: stats.completed },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-4 bg-card border border-border shadow-xs">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-bold text-foreground dark:text-white mt-2">{stat.value}</p>
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
              <option value="scheduled">Under Review / Scheduled</option>
              <option value="approved">Approved</option>
              <option value="referred">Referred</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Appointments ({filtered.length})</h2>
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
                onApprove={handleApproveAid}
                onRefer={(a) => setReferralApp(a)}
                onReject={handleRejectAid}
                onPrintGL={handlePrintGL}
                onPrintReferral={(a) => handlePrintReferral(a)}
                onDelete={async (id, ref) => {
                  if (confirm(`Burahin ang appointment request para kay ${appt.applicantName}?`)) {
                    const cleanRef = String(ref || '').trim()
                    const cleanId = String(id || '').trim()
                    const rawId = cleanId.replace(/^(db-appt-|aics-appt-|pwd-senior-appt-|cw-appt-)/, '').trim()

                    setAppointments((prev) =>
                      prev.filter((item) => {
                        const iRef = String(item.referenceNo || '').trim().toLowerCase()
                        const iId = String(item.id || '').trim().toLowerCase()
                        if (cleanId && iId === cleanId.toLowerCase()) return false
                        if (cleanRef && iRef === cleanRef.toLowerCase()) return false
                        if (rawId && (iId.includes(rawId.toLowerCase()) || iRef === rawId.toLowerCase())) return false
                        return true
                      })
                    )

                    try {
                      const dismissedRaw = localStorage.getItem("dismissed_appointments") || "[]"
                      const dismissedList: string[] = JSON.parse(dismissedRaw)
                      if (cleanRef && !dismissedList.includes(cleanRef)) dismissedList.push(cleanRef)
                      if (cleanId && !dismissedList.includes(cleanId)) dismissedList.push(cleanId)
                      if (rawId && !dismissedList.includes(rawId)) dismissedList.push(rawId)
                      localStorage.setItem("dismissed_appointments", JSON.stringify(dismissedList))
                    } catch {}

                    try {
                      const raw = localStorage.getItem("all_appointments_scheduled")
                      if (raw) {
                        const localMap = JSON.parse(raw)
                        delete localMap[cleanId]
                        delete localMap[cleanRef]
                        delete localMap[rawId]
                        localStorage.setItem("all_appointments_scheduled", JSON.stringify(localMap))
                      }
                    } catch {}

                    try {
                      await Promise.allSettled([
                        fetch(`${API_BASE}/api/appointments/${encodeURIComponent(cleanId)}`, { method: "DELETE" }),
                        fetch(`${API_BASE}/api/appointments/${encodeURIComponent(cleanRef)}`, { method: "DELETE" }),
                        fetch(`${API_BASE}/api/appointments/${encodeURIComponent(rawId)}`, { method: "DELETE" }),
                      ])
                    } catch {}

                    window.dispatchEvent(new Event("appointments_updated"))
                    notifyApplicationChange("APPLICATION_APPROVED", "appointment", cleanRef || cleanId)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {schedulingAppt && (
        <ScheduleModal
          appointment={schedulingAppt}
          onClose={() => setSchedulingAppt(null)}
          onSave={handleSaveSchedule}
        />
      )}

      {/* Referral Agency Selection Modal */}
      {referralApp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Refer to Partner Agency</h3>
                  <p className="text-xs text-slate-500">{referralApp.applicantName} ({referralApp.referenceNo})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReferralApp(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-light cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Partner Welfare Agency *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'PCSO', name: 'PCSO', desc: 'Philippine Charity Sweepstakes Office' },
                    { id: 'DSWD', name: 'DSWD', desc: 'Crisis Intervention Unit (CIU)' },
                    { id: 'DOH', name: 'DOH', desc: 'Malasakit Program Office' },
                    { id: 'Charity Hospital', name: 'Charity Hosp.', desc: 'Medical Social Services' },
                  ].map((ag) => (
                    <button
                      key={ag.id}
                      type="button"
                      onClick={() => setSelectedAgency(ag.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        selectedAgency === ag.id
                          ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-200'
                          : 'border-slate-200 hover:border-purple-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{ag.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{ag.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Endorsement & Social Worker Remarks
                </label>
                <textarea
                  rows={3}
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Ilagay ang dahilan ng endorsement..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setReferralApp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReferral}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Confirm & Issue Referral Letter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Guarantee Letter Modal */}
      {glModalData && (
        <OfficialGuaranteeLetterModal
          data={glModalData}
          onClose={() => setGlModalData(null)}
        />
      )}

      {/* Official Referral Letter Modal */}
      {refLetterModalData && (
        <OfficialReferralLetterModal
          data={refLetterModalData}
          onClose={() => setRefLetterModalData(null)}
        />
      )}
    </div>
  )
}
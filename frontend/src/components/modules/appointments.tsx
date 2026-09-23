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
  Trash2,
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
  decision?: "approved" | "referred" | "rejected"
  scheduledDate?: string
  scheduledTime?: string
  officeLocation?: string
  notes?: string
  rawApp?: any
  email?: string
}

export function findApplicantEmail(appt: { email?: string; referenceNo?: string; applicantName?: string; rawApp?: any }): string {
  if (appt.email && appt.email.includes("@")) return appt.email.trim()
  if (appt.rawApp?.email && appt.rawApp.email.includes("@")) return appt.rawApp.email.trim()
  if (appt.rawApp?.applicant_email && appt.rawApp.applicant_email.includes("@")) return appt.rawApp.applicant_email.trim()
  try {
    const rawPwd = localStorage.getItem("pwd_senior_applications")
    if (rawPwd) {
      const parsed = JSON.parse(rawPwd)
      const found = parsed.find((p: any) =>
        (appt.referenceNo && (p.referenceNumber === appt.referenceNo || p.id === appt.referenceNo)) ||
        (appt.applicantName && [p.firstName, p.lastName].filter(Boolean).join(" ").toLowerCase() === appt.applicantName.toLowerCase())
      )
      if (found?.email && found.email.includes("@")) return found.email.trim()
    }
  } catch {}
  try {
    const rawAics = localStorage.getItem("aics_applications")
    if (rawAics) {
      const parsed = JSON.parse(rawAics)
      const found = parsed.find((p: any) =>
        (appt.referenceNo && (p.reference_no === appt.referenceNo || p.qc_id === appt.referenceNo)) ||
        (appt.applicantName && [p.first_name, p.last_name].filter(Boolean).join(" ").toLowerCase() === appt.applicantName.toLowerCase())
      )
      if (found?.email && found.email.includes("@")) return found.email.trim()
    }
  } catch {}
  try {
    const userProf = localStorage.getItem("user_profile")
    if (userProf) {
      const p = JSON.parse(userProf)
      if (p.email && p.email.includes("@")) return p.email.trim()
    }
  } catch {}
  return "citizen@quezoncity.gov.ph"
}

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

const STANDARD_REJECTION_REASONS = [
  {
    id: "cooldown",
    title: "Double Availment (3-Month Rule Violation)",
    desc: "Kamakailan lamang nakatanggap ng AICS Assistance sa loob ng nakaraang 3 buwan (AICS Cooldown Guidelines).",
  },
  {
    id: "expired_docs",
    title: "Incomplete / Expired Medical Documents",
    desc: "Lampas na sa 3 buwan (Expired) ang Medical Abstract / Reseta / Billing o hindi orihinal ang dokumento.",
  },
  {
    id: "discrepancy",
    title: "Discrepancy in Identification / Patient Records",
    desc: "Hindi tumutugma ang impormasyon sa QCID / Valid ID o hindi beripikado ang billing sa ospital.",
  },
  {
    id: "not_indigent",
    title: "Above Poverty / Indigency Threshold",
    desc: "Batay sa Case Assessment ng Social Worker, may sapat na kapasidad at hindi pasok sa indigent category.",
  },
  {
    id: "no_show",
    title: "Failure to Appear on Interview",
    desc: "Hindi sumipot ang aplikante sa takdang araw at oras ng interview nang walang pabatid.",
  },
  {
    id: "other",
    title: "Iba pang Partikular na Dahilan",
    desc: "Manu-manong ilagay ang partikular na dahilan ng diskwalipikasyon.",
  },
]

export function isAppointmentDue(scheduledDate?: string, scheduledTime?: string): boolean {
  if (!scheduledDate) return false
  try {
    const now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth()
    let day = now.getDate()

    const isoMatch = scheduledDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10)
      month = parseInt(isoMatch[2], 10) - 1
      day = parseInt(isoMatch[3], 10)
    } else {
      const d = new Date(scheduledDate)
      if (!isNaN(d.getTime())) {
        year = d.getFullYear()
        month = d.getMonth()
        day = d.getDate()
      }
    }

    let targetHour = 0
    let targetMin = 0

    if (scheduledTime) {
      const timeMatch = scheduledTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
      if (timeMatch) {
        let h = parseInt(timeMatch[1], 10)
        const m = parseInt(timeMatch[2], 10)
        const ampm = timeMatch[3]?.toUpperCase()
        if (ampm === "PM" && h < 12) h += 12
        if (ampm === "AM" && h === 12) h = 0
        targetHour = h
        targetMin = m
      }
    }

    const apptDateTime = new Date(year, month, day, targetHour, targetMin, 0, 0)
    if (isNaN(apptDateTime.getTime())) return false

    return now.getTime() >= apptDateTime.getTime()
  } catch {
    return false
  }
}

const statusTheme: Record<AppointmentStatus, { card: string; chip: string; icon: ReactElement; label: string }> = {
  pending: {
    card: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40",
    chip: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60",
    icon: <Clock className="h-3.5 w-3.5" />,
    label: "Pending Schedule",
  },
  scheduled: {
    card: "bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40",
    chip: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60",
    icon: <Calendar className="h-3.5 w-3.5" />,
    label: "Scheduled",
  },
  under_review: {
    card: "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40",
    chip: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60",
    icon: <Clock className="h-3.5 w-3.5" />,
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
  label: "Pending Schedule",
}

function getAppointmentStatusTheme(status?: string) {
  if (!status) return DEFAULT_APPT_STATUS_THEME
  const s = String(status).toLowerCase() as AppointmentStatus
  if (statusTheme[s]) return statusTheme[s]
  if (s === "scheduled") return statusTheme.scheduled
  if (s.includes("under") || s.includes("review")) return statusTheme.under_review
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
              if (canSave) {
                onClose()
                onSave(appointment.id, date, time, location, autoNotes)
              }
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

export function getApptEffectiveStatus(a: AppointmentRequest): AppointmentStatus {
  // 1. Pending schedule: If no schedule has been set yet, it is ALWAYS pending!
  if (!a.scheduledDate) return "pending"

  // 2. Explicit admin decisions made during appointment assessment (only valid once scheduled)
  if (a.decision === "approved") return "approved"
  if (a.decision === "referred") return "referred"
  if (a.decision === "rejected") return "rejected"

  // 3. Time-based status: Scheduled before date/time, Under Review on/after date/time
  const isDue = isAppointmentDue(a.scheduledDate, a.scheduledTime)
  return isDue ? "under_review" : "scheduled"
}

function AppointmentCard({
  appt,
  onSchedule,
  onApprove,
  onRefer,
  onReject,
  onPrintGL,
  onPrintReferral,
  onDelete,
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
  const effectiveStatus: AppointmentStatus = getApptEffectiveStatus(appt)
  const st = getAppointmentStatusTheme(effectiveStatus)
  const isPwdAppt = appt.module === "PWD" || String(appt.concern || "").toLowerCase().includes("pwd") || String(appt.concern || "").toLowerCase().includes("disability")

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
            {/* 1. Pending Schedule Stage (No date set yet) */}
            {effectiveStatus === "pending" && (
              <button
                type="button"
                onClick={() => onSchedule(appt)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>📅 Set Schedule</span>
              </button>
            )}

            {/* 2. Scheduled Stage (Upcoming Interview - Waiting for exact appointment time) */}
            {effectiveStatus === "scheduled" && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Scheduled (Upcoming Interview)</span>
                </span>
                <button
                  type="button"
                  onClick={() => onSchedule(appt)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
                  title="Reschedule Appointment"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Resched</span>
                </button>
              </div>
            )}

            {/* 3. Under Review Stage (Due for Assessment / Interview - Approve and Reject actions unlocked) */}
            {effectiveStatus === "under_review" && (
              isPwdAppt ? (
                <div className="flex flex-wrap items-center gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => onApprove?.(appt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs"
                    title="Approve PWD Application, issue official PWD ID and activate ₱500/month pension"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approve & Start ₱500/mo Pension</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSchedule(appt)}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                    title="Reschedule Interview"
                  >
                    <span>Resched</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject?.(appt)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 text-xs font-bold transition-colors cursor-pointer"
                    title="Reject PWD Application"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => onApprove?.(appt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs"
                    title="Approve QC Assistance & generate Guarantee Letter"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>✓ Approve Aid</span>
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
                    onClick={() => onSchedule(appt)}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                    title="Reschedule Appointment"
                  >
                    <span>Resched</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject?.(appt)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              )
            )}

            {/* 4. Approved / Completed Stage (Admin clicked Approve) */}
            {effectiveStatus === "approved" && (
              isPwdAppt ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>✓ PWD Pension Active (₱500/mo)</span>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onPrintGL?.(appt)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer shadow-2xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>
                    {String(appt.concern || '').toLowerCase().includes('medicine') || String(appt.concern || '').toLowerCase().includes('gamot') || String(appt.rawApp?.assistance_type || '').toLowerCase().includes('medicine') || String(appt.rawApp?.assistance_type || '').toLowerCase().includes('gamot') || String(appt.rawApp?.details?.assistanceSubType || '').toLowerCase().includes('medicine') || String(appt.rawApp?.details?.assistanceSubType || '').toLowerCase().includes('gamot')
                      ? '🎁 Print Gift Certificate'
                      : '📄 Print GL'}
                  </span>
                </button>
              )
            )}

            {/* 5. Referred Stage (Admin clicked Refer) */}
            {effectiveStatus === "referred" && (
              <button
                type="button"
                onClick={() => onPrintReferral?.(appt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>🏛️ Print Referral</span>
              </button>
            )}

            {/* 6. Delete Action */}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(appt.id, appt.referenceNo)}
                className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer ml-1"
                title="Burahin ang appointment na ito"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getAppointmentDeduplicationKey(a: { id?: string; referenceNo?: string; applicantName?: string; concern?: string; module?: string }): string {
  const mod = String(a.module || "AICS").toUpperCase().trim()
  const c = String(a.concern || "").toLowerCase()
  let cleanConcern = "general"
  if (c.includes("pwd") || c.includes("disability")) cleanConcern = "pwd"
  else if (c.includes("medical") || c.includes("gamot") || c.includes("hospital")) cleanConcern = "medical"
  else if (c.includes("senior")) cleanConcern = "senior"
  else if (c.includes("funeral") || c.includes("burial")) cleanConcern = "burial"
  else if (c.includes("food")) cleanConcern = "food"
  else if (c.includes("education")) cleanConcern = "education"
  else if (c.includes("transport")) cleanConcern = "transport"
  else if (c.includes("livelihood")) cleanConcern = "livelihood"
  else if (c.includes("child")) cleanConcern = "child_welfare"
  else if (c.includes("solo")) cleanConcern = "solo_parent"
  else cleanConcern = c.replace(/[^a-z0-9]/g, "")

  const ref = String(a.referenceNo || "").toLowerCase().trim()
  const id = String(a.id || "").toLowerCase().trim()
  if (ref) {
    return `${mod}_${cleanConcern}_ref_${ref}`
  }
  if (id) {
    return `${mod}_${cleanConcern}_id_${id}`
  }
  const cleanName = String(a.applicantName || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim()
  return `${mod}_${cleanConcern}_name_${cleanName}_${Date.now()}`
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([])
  const [schedulingAppt, setSchedulingAppt] = useState<AppointmentRequest | null>(null)
  const [filterModule, setFilterModule] = useState<"all" | ModuleKey>("all")
  const [filterStatus, setFilterStatus] = useState<"all" | AppointmentStatus>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const isFetchingRef = useState({ current: false })[0]
  const [, setClockTick] = useState(0)

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setClockTick((c) => (c + 1) % 100000)
    }, 1000)
    return () => clearInterval(clockTimer)
  }, [])

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

        // Sanitize legacy contaminated keys in localScheduledMap
        try {
          let cleaned = false
          for (const key of Object.keys(localScheduledMap)) {
            const lk = key.toLowerCase()
            if (
              lk.includes("110000262304143") ||
              lk.includes("66") ||
              /^\d{10,}$/.test(key) ||
              key.startsWith("appt_1100") ||
              !localScheduledMap[key]?.savedInSession
            ) {
              delete localScheduledMap[key]
              cleaned = true
            }
          }
          if (cleaned) {
            localStorage.setItem("all_appointments_scheduled", JSON.stringify(localScheduledMap))
          }
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
          const lower = s.toLowerCase()
          if (
            !s ||
            lower.includes('sep 19') ||
            s.includes('2026-09-19') ||
            lower.includes('sep 15') ||
            s.includes('2026-09-15')
          ) {
            return null
          }
          return s
        }

        let unapprovedAicsRefs = new Set<string>()
        let pendingAicsRefs = new Set<string>()
        if (resAicsSettled.status === "fulfilled" && resAicsSettled.value.ok) {
          try {
            const aicsClone = await resAicsSettled.value.clone().json()
            if (aicsClone.applications && Array.isArray(aicsClone.applications)) {
              aicsClone.applications.forEach((app: any) => {
                const s = String(app.status || '').toLowerCase()
                const hasSched = Boolean((app.details as any)?.appointmentDate)
                // Strict Connection: Hanggat hindi pa na-screen / approved for scheduling sa /aics nang walang schedule, bawal lumabas sa /appointments
                const isApprovedOrEligible = ['waiting_approval', 'for_scheduling', 'scheduled', 'under_review', 'approved', 'completed', 'for_referral', 'referred'].includes(s) || hasSched
                if (!isApprovedOrEligible) {
                  if (app.reference_no) unapprovedAicsRefs.add(String(app.reference_no).trim().toLowerCase())
                  if (app.id) unapprovedAicsRefs.add(String(app.id).trim().toLowerCase())
                  if (app.qc_id) unapprovedAicsRefs.add(String(app.qc_id).trim().toLowerCase())
                }
                if (['pending', 'submit_pending', 'waiting_approval', 'for_scheduling'].includes(s) && !hasSched) {
                  if (app.reference_no) pendingAicsRefs.add(String(app.reference_no).trim().toLowerCase())
                  if (app.id) pendingAicsRefs.add(String(app.id).trim().toLowerCase())
                  if (app.qc_id) pendingAicsRefs.add(String(app.qc_id).trim().toLowerCase())
                }
              })
            }
          } catch {}
        }

        let unapprovedPwdRefs = new Set<string>()
        if (resPwdSettled.status === "fulfilled" && resPwdSettled.value.ok) {
          try {
            const pwdClone = await resPwdSettled.value.clone().json()
            if (Array.isArray(pwdClone)) {
              pwdClone.forEach((app: any) => {
                const s = String(app.status || '').toLowerCase()
                // Strict Connection: Hanggat hindi pa approved sa /pwd-senior, bawal lumabas sa /appointments
                const isApprovedOrEligible = s === 'approved' || s === 'under_review' || s === 'completed' || s === 'for_release' || s === 'released'
                if (!isApprovedOrEligible) {
                  const r = String(app.referenceNumber || app.reference_number || '').trim().toLowerCase()
                  const id = String(app.id || '').trim().toLowerCase()
                  if (r) unapprovedPwdRefs.add(r)
                  if (id) unapprovedPwdRefs.add(id)
                }
              })
            }
          } catch {}
        }

        let dataDb: any = { appointments: [] }
        if (resDbSettled.status === "fulfilled" && resDbSettled.value.ok) {
          try {
            dataDb = await resDbSettled.value.json()

            // Un-dismiss any appointments that are currently alive in the database
            if (dataDb.appointments && Array.isArray(dataDb.appointments)) {
              dataDb.appointments.forEach((a: any) => {
                const r = String(a.qc_id || a.qcid || a.reference_no || a.reference_number || '').trim().toLowerCase()
                const id = String(a.id || '').trim().toLowerCase()
                if (r) dismissedSet.delete(r)
                if (id) {
                  dismissedSet.delete(id)
                  dismissedSet.delete(`db-appt-${id}`)
                }
              })

              try {
                const dismissedRaw = localStorage.getItem("dismissed_appointments")
                if (dismissedRaw) {
                  let parsed = JSON.parse(dismissedRaw)
                  if (Array.isArray(parsed)) {
                    parsed = parsed.filter((item: string) => {
                      const cleanItem = String(item).trim().toLowerCase()
                      return !dataDb.appointments.some((a: any) => {
                        const ar = String(a.qc_id || a.qcid || a.reference_no || a.reference_number || '').trim().toLowerCase()
                        const aid = String(a.id || '').trim().toLowerCase()
                        return cleanItem === ar || cleanItem === aid || cleanItem === `db-appt-${aid}`
                      })
                    })
                    localStorage.setItem("dismissed_appointments", JSON.stringify(parsed))
                  }
                }
              } catch {}
            }

            if (Array.isArray(dataDb.deletedReferences)) {
              dataDb.deletedReferences.forEach((r: string) => {
                const cleanR = String(r).trim().toLowerCase()
                const isCurrentlyActive = dataDb.appointments && Array.isArray(dataDb.appointments) && dataDb.appointments.some((a: any) => {
                  const ar = String(a.qc_id || a.qcid || a.reference_no || a.reference_number || '').trim().toLowerCase()
                  const aid = String(a.id || '').trim().toLowerCase()
                  return cleanR === ar || cleanR === aid
                })
                if (!isCurrentlyActive) {
                  dismissedSet.add(cleanR)
                }
              })
            }
            if (dataDb.appointments && Array.isArray(dataDb.appointments)) {
              const mapped = dataDb.appointments
                .filter((a: any) => {
                  const status = String(a.status || '').toLowerCase()
                  const concern = String(a.concern || '').toLowerCase()
                  const ref = String(a.qc_id || a.qcid || a.reference_no || a.reference_number || '').trim().toLowerCase()
                  const rawId = String(a.id || '').trim().toLowerCase()
                  const mod = String(a.module || '').toUpperCase()

                  if (dismissedSet.has(ref) || dismissedSet.has(rawId) || dismissedSet.has(`db-appt-${rawId}`)) {
                    return false
                  }
                  if (mod === 'AICS' && (unapprovedAicsRefs.has(ref) || unapprovedAicsRefs.has(rawId))) {
                    if (!a.scheduled_date) {
                      return false
                    }
                  }
                  // Strict Guard: PWD/Senior records must be approved first in Pic 1 (/pwd-senior)
                  if ((mod === 'PWD' || mod.includes('SENIOR')) && (unapprovedPwdRefs.has(ref) || unapprovedPwdRefs.has(rawId))) {
                    return false
                  }
                  if (concern.includes('id card') || concern.includes('issuance') || concern.includes('replacement') || concern.includes('renewal')) {
                    return false
                  }
                  if (status === 'rejected' || status === 'denied' || status === 'disapproved') {
                    return false
                  }
                  return true
                })
                .map((a: any) => {
                  const apptId = `db-appt-${a.id}`
                  const rawId = String(a.id || '').trim()
                  const ref = String(a.qc_id || a.qcid || a.reference_no || a.reference_number || "").trim()
                  const rawStatus = String(a.status || '').toLowerCase()
                  const isExplicitPending = rawStatus === 'pending' || !a.scheduled_date
                  const isAicsPending = (a.module === 'AICS' || String(a.concern || '').toLowerCase().includes('medical') || String(a.concern || '').toLowerCase().includes('gamot')) &&
                    (pendingAicsRefs.has(ref.toLowerCase()) || (rawId && pendingAicsRefs.has(rawId.toLowerCase())) || (rawStatus === 'pending' && !a.scheduled_date))
                  const hasExplicitLocalSched = Boolean(localScheduledMap[apptId]?.savedInSession && localScheduledMap[apptId]?.scheduledDate)
                  const cached = (hasExplicitLocalSched && !isAicsPending) ? localScheduledMap[apptId] : (isAicsPending ? undefined : (localScheduledMap[apptId] || localScheduledMap[`${ref}_${a.concern}`] || localScheduledMap[`${a.module}_${ref}`] || undefined))

                  const schedDate = isExplicitPending ? (hasExplicitLocalSched && !isAicsPending ? cleanDate(cached?.scheduledDate) : null) : (isAicsPending ? null : cleanDate(a.scheduled_date || cached?.scheduledDate))
                  const schedTime = schedDate ? (a.scheduled_time || cached?.scheduledTime || null) : null
                  const hasDate = Boolean(schedDate)

                  let statusVal: AppointmentStatus = 'pending'
                  let cachedDecision: ("approved" | "referred" | "rejected" | undefined) = undefined

                  if (!hasDate) {
                    statusVal = 'pending'
                    cachedDecision = undefined
                  } else if (!isAicsPending && (rawStatus === 'approved' || rawStatus === 'completed' || cached?.decision === 'approved')) {
                    statusVal = 'approved'
                    cachedDecision = 'approved'
                  } else if (!isAicsPending && (rawStatus === 'referred' || cached?.decision === 'referred')) {
                    statusVal = 'referred'
                    cachedDecision = 'referred'
                  } else if (rawStatus === 'rejected' || cached?.decision === 'rejected') {
                    statusVal = 'rejected'
                    cachedDecision = 'rejected'
                  } else {
                    statusVal = 'scheduled'
                  }

                  return {
                    id: apptId,
                    referenceNo: ref,
                    module: (a.module || "AICS") as ModuleKey,
                    applicantName: a.applicant_name,
                    submittedAt: a.created_at || new Date().toISOString(),
                    concern: a.concern,
                    status: statusVal,
                    decision: cachedDecision,
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
                const rawAppStatus = String(app.status || '').toLowerCase()
                const hasSched = Boolean((app.details as any)?.appointmentDate)
                const isAicsEligible = ['waiting_approval', 'for_scheduling', 'scheduled', 'under_review', 'approved', 'completed', 'for_referral', 'referred'].includes(rawAppStatus) || hasSched
                // Strict Connection: Hanggat pending/submit_pending pa sa /aics nang walang schedule, bawal lumabas sa /appointments!
                if (!isAicsEligible) return

                const rawType = (app.assistance_type || "Medical").replace(/\s*assistance/gi, "").trim()
                const cleanType = (rawType.charAt(0).toUpperCase() + rawType.slice(1)) + " Assistance"
                const ref = String(app.reference_no || app.qc_id || app.reference_number || `AICS-2026-${String(app.id || 1).padStart(4, "0")}`).trim()
                const apptId = `aics-appt-${app.id || ref}`

                // If already in dataDb.appointments, DO NOT synthesize a duplicate!
                const existsInDb = dataDb.appointments && Array.isArray(dataDb.appointments) && dataDb.appointments.some((dba: any) => {
                  const dbr = String(dba.reference_no || '').trim().toLowerCase()
                  const dbid = String(dba.id || '').trim().toLowerCase()
                  return (ref && dbr === String(ref).trim().toLowerCase()) || (app.id && dbid === String(app.id).trim().toLowerCase())
                })
                if (existsInDb) return

                const isAicsPending = ['waiting_approval', 'for_scheduling'].includes(rawAppStatus) && !hasSched
                const cached = (isAicsPending && !localScheduledMap[apptId]?.savedInSession)
                  ? undefined
                  : (localScheduledMap[apptId] || localScheduledMap[`${ref}_${cleanType}`] || localScheduledMap[`AICS_${ref}`] || undefined)
                const schedDate = (isAicsPending && !cached?.savedInSession) ? null : cleanDate((app.details as any)?.appointmentDate || cached?.scheduledDate)
                const schedTime = schedDate ? ((app.details as any)?.appointmentTime || cached?.scheduledTime || null) : null
                const hasDate = Boolean(schedDate)

                let apptStatus: AppointmentStatus = 'pending'
                let cachedDecision: ("approved" | "referred" | "rejected" | undefined) = undefined

                if (!hasDate) {
                  apptStatus = 'pending'
                  cachedDecision = undefined
                } else if (rawAppStatus === 'approved' || rawAppStatus === 'completed' || cached?.decision === 'approved') {
                  apptStatus = 'approved'
                  cachedDecision = 'approved'
                } else if (rawAppStatus === 'for_referral' || rawAppStatus === 'referred' || cached?.decision === 'referred') {
                  apptStatus = 'referred'
                  cachedDecision = 'referred'
                } else if (rawAppStatus === 'rejected' || cached?.decision === 'rejected') {
                  apptStatus = 'rejected'
                  cachedDecision = 'rejected'
                } else {
                  apptStatus = 'scheduled'
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
                  decision: cachedDecision,
                  scheduledDate: schedDate,
                  scheduledTime: schedTime,
                  officeLocation: cached?.officeLocation || (app.details as any)?.appointmentVenue || "Quezon City Hall",
                  notes: cached?.notes,
                  rawApp: app,
                })
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
        // Only fallback to localStorage if network completely failed, NOT if DB returned empty
        if ((resPwdSettled.status !== "fulfilled" || !resPwdSettled.value.ok) && (!pwdSeniorApps || pwdSeniorApps.length === 0)) {
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
            const appSt = String(app.status || '').toLowerCase()
            const isApprovedOrEligible = appSt === 'approved' || appSt === 'under_review' || appSt === 'completed' || appSt === 'for_release' || appSt === 'released'
            if (isAssistance && isApprovedOrEligible) {
              const ref = app.referenceNumber || app.reference_number || "PWD-QC-2026"

              // If already in dataDb.appointments, DO NOT synthesize! The database row is authoritative!
              const existsInDb = dataDb.appointments && Array.isArray(dataDb.appointments) && dataDb.appointments.some((dba: any) => {
                const dbr = String(dba.reference_no || dba.qc_id || '').trim().toLowerCase()
                const dbid = String(dba.id || '').trim().toLowerCase()
                return (ref && dbr === String(ref).trim().toLowerCase()) || (app.id && dbid === String(app.id).trim().toLowerCase())
              })
              if (existsInDb) return

              const isPwd = String(app.category || "").toUpperCase().includes("PWD")
              const mod: ModuleKey = isPwd ? "PWD" : "Senior Citizen"
              const concern = isPwd ? "PWD Social Assistance" : "Senior Social Assistance"
              const apptId = `pwd-senior-appt-${app.id || ref}`
              const fullName = [app.firstName || app.first_name, app.middleName || app.middle_name, app.lastName || app.last_name, app.suffix].filter(Boolean).join(" ").trim().toUpperCase() || "BENEFICIARY"
              const isDone = app.status === "completed" || app.status === "released"

              const hasExplicitLocalSched = Boolean(localScheduledMap[apptId]?.savedInSession && localScheduledMap[apptId]?.scheduledDate)
              const cached = hasExplicitLocalSched ? localScheduledMap[apptId] : undefined
              const schedDate = hasExplicitLocalSched ? cleanDate(cached?.scheduledDate) : null
              const schedTime = hasExplicitLocalSched ? (cached?.scheduledTime || null) : null
              const decision = hasExplicitLocalSched ? (cached?.decision as ("approved" | "referred" | "rejected")) : undefined
              let statusVal: AppointmentStatus = isDone ? "completed" : hasExplicitLocalSched ? (decision || (schedDate ? "scheduled" : "pending")) : "pending"

              appts.push({
                id: apptId,
                referenceNo: ref,
                module: mod,
                applicantName: fullName,
                submittedAt: app.submittedAt || app.created_at || new Date().toISOString(),
                concern,
                status: statusVal,
                decision,
                scheduledDate: schedDate,
                scheduledTime: schedTime,
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
                  const cachedDecision = (cached?.decision as ("approved" | "referred" | "rejected")) || undefined
                  appts.push({
                    id: apptId,
                    referenceNo: ref,
                    module: "Livelihood",
                    applicantName: fullName,
                    submittedAt: l.created_at || new Date().toISOString(),
                    concern,
                    status: (cached?.status || "pending") as AppointmentStatus,
                    decision: cachedDecision,
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
                const cachedDecision = (cached?.decision as ("approved" | "referred" | "rejected")) || undefined
                appts.push({
                  id: apptId,
                  referenceNo: ref,
                  module: "Child Welfare",
                  applicantName: fullName,
                  submittedAt: c.created_at || new Date().toISOString(),
                  concern,
                  status: isDone ? "completed" : ((cached?.status || "pending") as AppointmentStatus),
                  decision: cachedDecision,
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
        const statusPriority: Record<AppointmentStatus, number> = { completed: 5, approved: 4, referred: 3, scheduled: 2, under_review: 2, pending: 1, rejected: 1 }

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
            if (a.decision) {
              merged.decision = a.decision
            }
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

        const finalAppts = Array.from(dedupedMap.values()).filter(
          (a) => a.status !== 'rejected' && (a.status as string) !== 'denied' && (a.status as string) !== 'disapproved'
        )
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

  const handleSaveSchedule = (id: string, date: string, time: string, location: string, notes: string) => {
    // 1. Immediately close modal & update UI state optimistically
    setSchedulingAppt(null)
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "scheduled" as const,
              decision: undefined,
              scheduledDate: date,
              scheduledTime: time,
              officeLocation: location,
              notes,
            }
          : a
      )
    )

    const targetAppt = appointments.find((a) => a.id === id)
    if (targetAppt) {
      try {
        const raw = localStorage.getItem("all_appointments_scheduled")
        const localScheduledMap = raw ? JSON.parse(raw) : {}
        const schedObj = {
          status: "scheduled",
          savedInSession: true,
          decision: undefined,
          scheduledDate: date,
          scheduledTime: time,
          officeLocation: location,
          notes,
          concern: targetAppt.concern,
          module: targetAppt.module,
        }
        localScheduledMap[targetAppt.id] = schedObj
        localScheduledMap[`${targetAppt.referenceNo}_${targetAppt.concern}`] = schedObj
        localScheduledMap[`${targetAppt.module}_${targetAppt.referenceNo}`] = schedObj
        delete localScheduledMap[targetAppt.referenceNo]
        delete localScheduledMap[`appt_${targetAppt.referenceNo}`]
        localStorage.setItem("all_appointments_scheduled", JSON.stringify(localScheduledMap))
      } catch {}

      // Run network calls in background strictly by module
      ;(async () => {
        try {
          const isAics = targetAppt.module === "AICS" || String(targetAppt.concern || "").toLowerCase().includes("medical")
          const isPwd = targetAppt.module === "PWD" || String(targetAppt.concern || "").toLowerCase().includes("pwd") || String(targetAppt.concern || "").toLowerCase().includes("disability")
          const targetAppId = targetAppt.rawAppId || targetAppt.id.replace('aics-appt-', '').replace('db-appt-', '')

          const schedCalls: Promise<any>[] = [
            fetch(`${API_BASE}/api/appointments/${encodeURIComponent(targetAppt.referenceNo)}/schedule`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                scheduledDate: date,
                scheduledTime: time,
                officeLocation: location,
                notes,
                applicantName: targetAppt.applicantName,
                concern: targetAppt.concern,
                module: targetAppt.module,
              }),
            }),
          ]

          if (isAics) {
            schedCalls.push(
              fetch(`${API_BASE}/api/aics/applications/${targetAppId}/status`, {
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
              }))
            )
          }

          await Promise.allSettled(schedCalls)

          // PWD Module Email 2 & Notification
          if (isPwd) {
            const recipientEmail = findApplicantEmail(targetAppt)
            fetch(`${API_BASE}/api/email/send-pwd-interview-scheduled`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: recipientEmail,
                recipientEmail,
                applicantName: targetAppt.applicantName,
                referenceNumber: targetAppt.referenceNo,
                scheduledDate: date,
                scheduledTime: time,
                officeLocation: location || "Quezon City Hall - PDAO Room 102",
              }),
            }).catch((err) => console.warn("Email 2 send warning:", err))

            pushUserNotification({
              userId: targetAppt.referenceNo || 'all',
              title: 'Interview Scheduled',
              desc: `Notice to Appear: Your interview is scheduled on ${date} at ${time} at ${location || "Quezon City Hall - PDAO Room 102"}. Please bring valid IDs and original documents.`,
              applicationRef: targetAppt.referenceNo,
              type: 'appointment',
              link: '/portal/my-applications',
            })
          } else {
            pushUserNotification({
              userId: targetAppt.referenceNo || 'all',
              title: 'AICS: Interview Scheduled — Under Review',
              message: `Nakatakda ang inyong interview sa ${date} (${time}) sa ${location}. Ang inyong aplikasyon ay kasalukuyang under review.`,
              type: 'appointment',
              link: '/portal/aics',
            })
          }

          notifyApplicationChange('STATUS_CHANGED', isPwd ? 'pwd_senior' : 'aics', targetAppt.referenceNo)
          window.dispatchEvent(new Event("aics_applications_updated"))
          window.dispatchEvent(new Event("pwd_senior_applications_updated"))
          window.dispatchEvent(new Event("appointments_updated"))
          window.dispatchEvent(new Event("user_notifications_updated"))
        } catch (err) {
          console.warn("Backend schedule error:", err)
        }
      })()
    }
  }

  const [glModalData, setGlModalData] = useState<GuaranteeLetterData | null>(null)
  const [refLetterModalData, setRefLetterModalData] = useState<ReferralLetterData | null>(null)
  const [referralApp, setReferralApp] = useState<AppointmentRequest | null>(null)
  const [selectedAgency, setSelectedAgency] = useState('PCSO')
  const [referralNotes, setReferralNotes] = useState('Total financial requirement exceeds local budget capacity. Endorsed for assistance.')

  const [rejectingAppt, setRejectingAppt] = useState<AppointmentRequest | null>(null)
  const [selectedRejectReasonId, setSelectedRejectReasonId] = useState("cooldown")
  const [customRejectReason, setCustomRejectReason] = useState("")

  const handleApproveAid = async (appt: AppointmentRequest) => {
    try {
      const targetRef = appt.referenceNo || appt.rawAppId || appt.id.replace('aics-appt-', '').replace('db-appt-', '')
      const cleanRef = String(appt.referenceNo || '').replace(/[^a-zA-Z0-9]/g, '')
      const cleanName = String(appt.applicantName || '').toLowerCase().trim()
      const isPwd = appt.module === "PWD" || String(appt.concern || "").toLowerCase().includes("pwd") || String(appt.concern || "").toLowerCase().includes("disability")
      const isAics = appt.module === "AICS" || String(appt.concern || "").toLowerCase().includes("medical")

      const pwdIdNumber = `PWD-137404-2026-${String(Math.floor(1000 + Math.random() * 9000))}`
      const approvedIsoDate = new Date().toISOString()

      // 1. Call Backend Endpoints STRICTLY by module
      const calls: Promise<any>[] = [
        fetch(`${API_BASE}/api/appointments/${encodeURIComponent(targetRef)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'approved',
            decision: 'approved',
            applicantName: appt.applicantName,
            module: appt.module,
            concern: appt.concern,
          }),
        }),
      ]

      if (isPwd) {
        calls.push(
          fetch(`${API_BASE}/api/pwd-senior/applications/${encodeURIComponent(targetRef)}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'approved',
              assignedIdNumber: pwdIdNumber,
              approvedDate: approvedIsoDate,
              approvedBy: "Social Worker Admin",
            }),
          })
        )
      } else if (isAics) {
        calls.push(
          fetch(`${API_BASE}/api/aics/applications/${encodeURIComponent(targetRef)}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved', applicantName: appt.applicantName }),
          })
        )
      }

      await Promise.allSettled(calls)

      // 2. Comprehensive LocalStorage Cache with Multi-Key Aliases (MODULE ISOLATED)
      const raw = localStorage.getItem("all_appointments_scheduled") || "{}"
      const localMap = JSON.parse(raw)
      const approvedPayload = {
        status: "approved",
        decision: "approved",
        scheduledDate: appt.scheduledDate,
        scheduledTime: appt.scheduledTime,
        officeLocation: appt.officeLocation,
        applicantName: appt.applicantName,
        referenceNo: appt.referenceNo,
        concern: appt.concern,
        module: appt.module,
        pwdIdNumber: isPwd ? pwdIdNumber : undefined,
        approvedDate: approvedIsoDate,
      }

      localMap[appt.id] = approvedPayload
      if (appt.referenceNo) {
        localMap[`${appt.referenceNo}_${appt.concern}`] = approvedPayload
        localMap[`${appt.module}_${appt.referenceNo}`] = approvedPayload
      }
      if (cleanRef) {
        localMap[`${appt.module}_${cleanRef}`] = approvedPayload
      }
      if (appt.rawAppId) {
        localMap[String(appt.rawAppId)] = approvedPayload
      }
      // Delete any cross-contaminating naked key
      delete localMap[appt.referenceNo]
      delete localMap[cleanRef]
      delete localMap[cleanName]
      delete localMap[`appt_${appt.referenceNo}`]
      delete localMap[`appt_${cleanRef}`]
      delete localMap[`appt_${cleanName}`]

      localStorage.setItem("all_appointments_scheduled", JSON.stringify(localMap))

      // Update pwd_senior_applications in localStorage if PWD
      if (isPwd) {
        try {
          const rawPwd = localStorage.getItem("pwd_senior_applications") || "[]"
          const pwdList = JSON.parse(rawPwd)
          const updatedPwd = pwdList.map((p: any) => {
            const match = p.referenceNumber === appt.referenceNo || p.id === appt.referenceNo || (cleanName && [p.firstName, p.lastName].filter(Boolean).join(" ").toLowerCase().includes(cleanName))
            if (match) {
              return {
                ...p,
                status: "approved",
                assignedIdNumber: pwdIdNumber,
                approvedDate: approvedIsoDate,
                approvedBy: "Social Worker Admin",
              }
            }
            return p
          })
          localStorage.setItem("pwd_senior_applications", JSON.stringify(updatedPwd))
        } catch {}

        // Send Email 3: PWD ID Issuance & ₱500/month Pension Activation Notice
        const recipientEmail = findApplicantEmail(appt)
        fetch(`${API_BASE}/api/email/send-pwd-approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: recipientEmail,
            recipientEmail,
            applicantName: appt.applicantName,
            referenceNumber: appt.referenceNo,
            pwdIdNumber: pwdIdNumber,
            approvedDate: new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }),
            disabilityType: appt.concern || "Physical / Visual Disability",
          }),
        }).catch((err) => console.warn("Email 3 send warning:", err))

        // Dispatch Bell Notification (Dynamic English/Tagalog)
        pushUserNotification({
          userId: appt.referenceNo || 'all',
          title: 'PWD ID & Pension Approved',
          desc: `Congratulations! Official PWD ID ${pwdIdNumber} has been issued. Your ₱500/month Social Welfare Pension is now active (₱1,500 every 3-month cycle).`,
          applicationRef: appt.referenceNo,
          type: 'pwd_pension',
          amount: 1500,
          link: '/portal/financial-aid',
        })
      } else {
        pushUserNotification({
          userId: appt.referenceNo || 'all',
          title: 'AICS: Application APPROVED',
          message: `Malugod naming ipinababatid na APPROVED ang inyong ${appt.concern}. Ang inyong Guarantee Letter ay handa na.`,
          type: 'payout',
          link: '/portal/aics',
        })
      }

      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "approved" as const, decision: "approved" as const } : a))

      syncAppointmentToFinancialAid({
        referenceNo: appt.referenceNo,
        applicantName: appt.applicantName,
        concern: isPwd ? "PWD Social Assistance" : appt.concern,
        date: isPwd ? undefined : (appt.scheduledDate || new Date().toLocaleDateString("en-PH")),
        time: isPwd ? undefined : (appt.scheduledTime || "10:00 AM"),
        location: appt.officeLocation || "Quezon City Hall",
        notes: isPwd ? "Approved PWD Pension (₱500/month). Accumulating for 3-month consolidated payout." : (appt.notes || "Approved appointment for financial aid payout."),
      })

      notifyApplicationChange('APPLICATION_APPROVED', isPwd ? 'pwd_senior' : 'aics', appt.referenceNo)
      window.dispatchEvent(new Event("appointments_updated"))
      window.dispatchEvent(new Event("pwd_senior_applications_updated"))
      window.dispatchEvent(new Event("aics_applications_updated"))
      window.dispatchEvent(new Event("applications_updated"))
      window.dispatchEvent(new Event("financial_disbursements_updated"))
      window.dispatchEvent(new Event("storage"))
    } catch (err) {
      console.error(err)
    }
  }

  const handleConfirmReferral = async () => {
    if (!referralApp) return
    const appt = referralApp
    try {
      const targetRef = appt.referenceNo || appt.rawAppId || appt.id.replace('aics-appt-', '').replace('db-appt-', '')
      const cleanRef = String(appt.referenceNo || '').replace(/[^a-zA-Z0-9]/g, '')
      const cleanName = String(appt.applicantName || '').toLowerCase().trim()

      await Promise.allSettled([
        fetch(`${API_BASE}/api/appointments/${encodeURIComponent(targetRef)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'referred', decision: 'referred', applicantName: appt.applicantName }),
        }),
        fetch(`${API_BASE}/api/aics/applications/${encodeURIComponent(targetRef)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'referred',
            referralAgency: selectedAgency,
            referralNotes: referralNotes,
            applicantName: appt.applicantName,
          }),
        }),
      ])

      const raw = localStorage.getItem("all_appointments_scheduled") || "{}"
      const localMap = JSON.parse(raw)
      const referredPayload = {
        status: "referred",
        decision: "referred",
        referralAgency: selectedAgency,
        referralNotes: referralNotes,
        scheduledDate: appt.scheduledDate,
        scheduledTime: appt.scheduledTime,
        applicantName: appt.applicantName,
        referenceNo: appt.referenceNo,
      }

      localMap[appt.id] = referredPayload
      if (appt.referenceNo) {
        localMap[appt.referenceNo] = referredPayload
        localMap[`appt_${appt.referenceNo}`] = referredPayload
      }
      if (cleanRef) {
        localMap[cleanRef] = referredPayload
        localMap[`appt_${cleanRef}`] = referredPayload
      }
      if (cleanName) {
        localMap[cleanName] = referredPayload
      }
      localStorage.setItem("all_appointments_scheduled", JSON.stringify(localMap))

      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "referred" as const, decision: "referred" as const } : a))

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
      window.dispatchEvent(new Event("applications_updated"))
      window.dispatchEvent(new Event("storage"))

      setReferralApp(null)
    } catch (err) {
      console.error(err)
      setReferralApp(null)
    }
  }

  const handleRejectAid = (appt: AppointmentRequest) => {
    setRejectingAppt(appt)
    setSelectedRejectReasonId("cooldown")
    setCustomRejectReason("")
  }

  const handleConfirmReject = async () => {
    if (!rejectingAppt) return
    const appt = rejectingAppt

    let finalReason = ""
    const found = STANDARD_REJECTION_REASONS.find((r) => r.id === selectedRejectReasonId)
    if (selectedRejectReasonId === "other") {
      finalReason = customRejectReason.trim() || "Disqualified based on social worker case evaluation."
    } else {
      finalReason = found ? `${found.title} — ${found.desc}` : "Disqualified based on AICS guidelines."
      if (customRejectReason.trim()) {
        finalReason += ` (${customRejectReason.trim()})`
      }
    }

    try {
      const targetRef = appt.referenceNo || appt.rawAppId || appt.id.replace('aics-appt-', '').replace('db-appt-', '')
      const cleanRef = String(appt.referenceNo || '').replace(/[^a-zA-Z0-9]/g, '')
      const cleanName = String(appt.applicantName || '').toLowerCase().trim()

      await Promise.allSettled([
        fetch(`${API_BASE}/api/appointments/${encodeURIComponent(targetRef)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected', decision: 'rejected', applicantName: appt.applicantName }),
        }),
        fetch(`${API_BASE}/api/aics/applications/${encodeURIComponent(targetRef)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'rejected',
            rejectionReason: finalReason,
            applicantName: appt.applicantName,
          }),
        }),
      ])

      const raw = localStorage.getItem("all_appointments_scheduled") || "{}"
      const localMap = JSON.parse(raw)
      const rejectPayload = {
        status: "rejected",
        decision: "rejected",
        rejectionReason: finalReason,
        applicantName: appt.applicantName,
        referenceNo: appt.referenceNo,
      }

      localMap[appt.id] = rejectPayload
      if (appt.referenceNo) {
        localMap[appt.referenceNo] = rejectPayload
        localMap[`appt_${appt.referenceNo}`] = rejectPayload
      }
      if (cleanRef) {
        localMap[cleanRef] = rejectPayload
      }
      if (cleanName) {
        localMap[cleanName] = rejectPayload
      }
      localStorage.setItem("all_appointments_scheduled", JSON.stringify(localMap))

      setAppointments(prev => prev.filter(a => a.id !== appt.id))

      pushUserNotification({
        userId: appt.referenceNo || 'all',
        title: 'AICS: Application Disapproved',
        message: `Paumanhin, ang inyong ${appt.concern} ay hindi naaprubahan dahil sa sumusunod na dahilan: ${finalReason}`,
        type: 'aics',
        link: '/portal/aics',
      })

      notifyApplicationChange('APPLICATION_REJECTED', 'aics', appt.referenceNo)
      window.dispatchEvent(new Event("appointments_updated"))
      window.dispatchEvent(new Event("aics_applications_updated"))
      window.dispatchEvent(new Event("applications_updated"))
      window.dispatchEvent(new Event("storage"))

      setRejectingAppt(null)
    } catch (err) {
      console.error(err)
      setRejectingAppt(null)
    }
  }

  const handlePrintGL = async (appt: AppointmentRequest) => {
    const isPwd = appt.module === "PWD" || String(appt.concern || "").toLowerCase().includes("pwd") || String(appt.concern || "").toLowerCase().includes("disability") || String(appt.concern || "").toLowerCase().includes("pension")
    if (isPwd) {
      console.warn("Strict Guard: PWD Social Assistance uses ID card and direct pension disbursements, not Guarantee Letters.")
      return
    }
    try {
      const rawStored = localStorage.getItem("printed_gl_applications") || "{}"
      const stored = JSON.parse(rawStored)
      const cleanRef = String(appt.referenceNo || "").toLowerCase().trim()
      const cleanId = String(appt.id || "").toLowerCase().trim()
      const rawAppId = String(appt.rawAppId || "").toLowerCase().trim()

      if (cleanRef) stored[cleanRef] = true
      if (cleanId) stored[cleanId] = true
      if (rawAppId) stored[rawAppId] = true
      localStorage.setItem("printed_gl_applications", JSON.stringify(stored))

      // Also ensure all_appointments_scheduled has approved status
      const rawSched = localStorage.getItem("all_appointments_scheduled") || "{}"
      const localMap = JSON.parse(rawSched)
      const approvedPayload = {
        status: "approved",
        decision: "approved",
        scheduledDate: appt.scheduledDate,
        scheduledTime: appt.scheduledTime,
        officeLocation: appt.officeLocation,
        applicantName: appt.applicantName,
        referenceNo: appt.referenceNo,
        concern: appt.concern,
      }
      if (appt.id) localMap[appt.id] = approvedPayload
      if (appt.referenceNo) {
        localMap[appt.referenceNo] = approvedPayload
        localMap[`appt_${appt.referenceNo}`] = approvedPayload
      }
      if (appt.rawAppId) localMap[String(appt.rawAppId)] = approvedPayload
      localStorage.setItem("all_appointments_scheduled", JSON.stringify(localMap))

      const targetRef = appt.referenceNo || appt.rawAppId || appt.id.replace('aics-appt-', '').replace('db-appt-', '')
      await Promise.allSettled([
        fetch(`${API_BASE}/api/appointments/${encodeURIComponent(targetRef)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved', decision: 'approved', applicantName: appt.applicantName }),
        }),
        fetch(`${API_BASE}/api/aics/applications/${encodeURIComponent(targetRef)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved', applicantName: appt.applicantName }),
        }),
      ])

      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "approved" as const, decision: "approved" as const } : a))

      window.dispatchEvent(new Event("printed_gl_applications_updated"))
      window.dispatchEvent(new Event("aics_applications_updated"))
      window.dispatchEvent(new Event("appointments_updated"))
      window.dispatchEvent(new Event("applications_updated"))
      window.dispatchEvent(new Event("financial_disbursements_updated"))
      window.dispatchEvent(new Event("storage"))
    } catch (err) {
      console.error("[handlePrintGL] error:", err)
    }

    const raw = appt.rawApp || {}
    const rawDetails = raw.details || {}
    const isMedicine =
      String(raw.assistance_type || '').toLowerCase().includes('medicine') ||
      String(raw.assistance_type || '').toLowerCase().includes('gamot') ||
      String(appt.concern || '').toLowerCase().includes('medicine') ||
      String(appt.concern || '').toLowerCase().includes('gamot') ||
      String(rawDetails.assistanceSubType || '').toLowerCase().includes('medicine') ||
      String(rawDetails.assistanceSubType || '').toLowerCase().includes('gamot') ||
      String(rawDetails.assistanceSubType || '').toLowerCase().includes('supply')

    setGlModalData({
      controlNo: isMedicine
        ? `QC-MD-GC-2026-${String(appt.rawAppId || appt.id).padStart(6, '0')}`
        : `QC-SSDD-GL-2026-${String(appt.rawAppId || appt.id).padStart(6, '0')}`,
      applicationRef: appt.referenceNo,
      patientName: appt.applicantName,
      qcidNumber: raw.qc_id || appt.referenceNo,
      barangay: raw.address?.split(',')[1]?.trim() || rawDetails.beneficiaryBarangay || 'Commonwealth',
      district: '2',
      age: raw.age || '42',
      gender: raw.gender || 'Female',
      address: raw.address || 'Quezon City',
      diagnosis: rawDetails.medicalDiagnosis || `${appt.concern} — SSDD Evaluated Assistance`,
      hospitalName: isMedicine
        ? 'MERCURY DRUG (QUEZON CITY BRANCHES)'
        : (rawDetails.partnerHospital || rawDetails.partnerHospitalOther || 'East Avenue Medical Center'),
      amount: isMedicine ? 500 : (Number(rawDetails.hospitalBillEstimate) || 25000),
      dateIssued: new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
      assistanceType: isMedicine ? 'Medicines / Medical Supplies' : (raw.assistance_type || appt.concern || 'Medical Assistance'),
      isMedicineVoucher: isMedicine,
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
    const eff = getApptEffectiveStatus(a)
    const matchModule = filterModule === "all" || a.module === filterModule
    const matchStatus =
      filterStatus === "all" ||
      eff === filterStatus ||
      a.status === filterStatus ||
      (filterStatus === "scheduled" && (eff === "scheduled" || eff === "under_review")) ||
      (filterStatus === "under_review" && eff === "under_review") ||
      (filterStatus === "completed" && (eff === "completed" || eff === "approved"))
    const matchSearch =
      searchTerm === "" ||
      a.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.referenceNo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchModule && matchStatus && matchSearch
  })

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => getApptEffectiveStatus(a) === "pending").length,
    scheduled: appointments.filter((a) => getApptEffectiveStatus(a) === "scheduled").length,
    underReview: appointments.filter((a) => getApptEffectiveStatus(a) === "under_review").length,
    completed: appointments.filter((a) => ["approved", "completed", "referred"].includes(getApptEffectiveStatus(a))).length,
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Appointments & Case Scheduling</h1>
        <p className="text-xs text-muted-foreground mt-1">Set schedules, conduct assessments, approve aid vouchers, and issue partner agency referrals.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Requests", value: stats.total },
          { label: "Pending Schedule", value: stats.pending },
          { label: "Scheduled (Upcoming)", value: stats.scheduled },
          { label: "Under Review (Due)", value: stats.underReview },
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
              <option value="pending">Pending Schedule</option>
              <option value="scheduled">Scheduled (Upcoming)</option>
              <option value="under_review">Under Review (Due)</option>
              <option value="approved">Approved</option>
              <option value="referred">Referred</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
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
                        fetch(`${API_BASE}/api/pwd-senior/applications/${encodeURIComponent(cleanRef)}`, { method: "DELETE" }),
                        fetch(`${API_BASE}/api/aics/applications/${encodeURIComponent(cleanRef)}`, { method: "DELETE" }),
                      ])
                    } catch {}

                    try {
                      const rawPwd = localStorage.getItem("pwd_senior_applications")
                      if (rawPwd) {
                        const parsed = JSON.parse(rawPwd)
                        const filtered = parsed.filter((p: any) => {
                          const pRef = String(p.referenceNumber || p.reference_number || '').trim().toLowerCase()
                          const pId = String(p.id || '').trim().toLowerCase()
                          if (cleanRef && pRef === cleanRef.toLowerCase()) return false
                          if (cleanId && pId === cleanId.toLowerCase()) return false
                          if (rawId && (pId === rawId.toLowerCase() || pRef === rawId.toLowerCase())) return false
                          return true
                        })
                        localStorage.setItem("pwd_senior_applications", JSON.stringify(filtered))
                      }
                    } catch {}

                    window.dispatchEvent(new Event("appointments_updated"))
                    window.dispatchEvent(new Event("pwd_senior_applications_updated"))
                    window.dispatchEvent(new Event("aics_applications_updated"))
                    notifyApplicationChange("STATUS_CHANGED", "appointment", cleanRef || cleanId)
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

      {/* Reject / Disqualification Modal */}
      {rejectingAppt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Disqualify / Reject Application</h3>
                  <p className="text-xs text-slate-500">{rejectingAppt.applicantName} ({rejectingAppt.referenceNo})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingAppt(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-light cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Piliin ang Pangunahing Dahilan ng Diskwalipikasyon *
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {STANDARD_REJECTION_REASONS.map((r) => (
                    <label
                      key={r.id}
                      onClick={() => setSelectedRejectReasonId(r.id)}
                      className={`block p-3 rounded-xl border text-left transition cursor-pointer ${
                        selectedRejectReasonId === r.id
                          ? 'border-rose-600 bg-rose-50/80 text-rose-950 ring-2 ring-rose-200'
                          : 'border-slate-200 hover:border-rose-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="reject_reason"
                          checked={selectedRejectReasonId === r.id}
                          onChange={() => setSelectedRejectReasonId(r.id)}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <div className="font-bold text-xs">{r.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{r.desc}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Karagdagang Paliwanag / Social Worker Assessment Notes (Opsyonal)
                </label>
                <textarea
                  rows={2}
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="Hal. Isinumite ang expired na prescription noong June 2026..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setRejectingAppt(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer"
              >
                Kanselahin
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Kumpirmahin ang Disqualify / Reject</span>
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
          canPrint={true}
        />
      )}

      {/* Official Referral Letter Modal */}
      {refLetterModalData && (
        <OfficialReferralLetterModal
          data={refLetterModalData}
          onClose={() => setRefLetterModalData(null)}
          canPrint={true}
        />
      )}
    </div>
  )
}
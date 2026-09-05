import { API_BASE } from "../config/api"

export const FIXED_ASSISTANCE_AMOUNTS: Record<string, number> = {
  "Medical Assistance": 5000,
  "Funeral Assistance": 10000,
  "Educational Assistance": 3000,
  "Burial Assistance": 10000,
  "Food Assistance": 1500,
  "Transportation Assistance": 1000,
  "PWD Social Assistance": 2000,
  "Senior Social Assistance": 2000,
}

export type DisbursementStage = "PENDING" | "RELEASED"

export interface SyncedDisbursementRecord {
  id: string
  disbursementId: string
  applicationRef: string
  applicantName: string
  assistanceType: string
  fixedAmount: number
  dateApproved: string
  status: DisbursementStage
  appointmentDate?: string
  appointmentTime?: string
  venue?: string
  releasedDate?: string
  releasedBy?: string
  remarks?: string
}

export interface UserNotificationItem {
  id: string
  title: string
  desc: string
  time: string
  unread: boolean
  applicationRef?: string
  assistanceType?: string
  amount?: number
}

// ── INITIAL SEED DATA (Empty so only real applications appear) ──
export const INITIAL_DISBURSEMENTS: SyncedDisbursementRecord[] = []

// ── CHECK IF SERVICE IS PURELY AN ID / BOOKLET APPLICATION (NOT CASH AID) ──
export function isIdOrDocumentService(serviceOrConcern?: string): boolean {
  if (!serviceOrConcern) return false
  const lower = serviceOrConcern.toLowerCase()
  if (
    lower.includes("social assistance") ||
    lower.includes("financial assistance") ||
    lower.includes("cash assistance") ||
    lower.includes("medical assistance") ||
    lower.includes("funeral assistance") ||
    lower.includes("educational assistance") ||
    lower.includes("food assistance") ||
    lower.includes("material assistance") ||
    lower.includes("transportation assistance") ||
    lower.includes("burial assistance")
  ) {
    return false
  }

  return (
    lower.includes("id") ||
    lower.includes("booklet") ||
    lower.includes("solo parent") ||
    lower.includes("pwd") ||
    lower.includes("senior")
  )
}

// ── GET DISBURSEMENTS ──
export function getSavedDisbursements(): SyncedDisbursementRecord[] {
  try {
    const raw = localStorage.getItem("all_financial_disbursements")
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // Filter out dummy sample records (d1 to d8) and any pure ID services
        const realOnes = parsed.filter(
          (p) =>
            !["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"].includes(p.id) &&
            !isIdOrDocumentService(p.assistanceType)
        )
        return realOnes
      }
    }
  } catch (e) {
    console.warn("Could not parse disbursements from localStorage:", e)
  }
  return []
}

// ── CLEAR ALL DISBURSEMENTS ──
export function clearAllDisbursements() {
  try {
    localStorage.removeItem("all_financial_disbursements")
    window.dispatchEvent(new Event("financial_disbursements_updated"))
    window.dispatchEvent(new Event("storage"))
  } catch (e) {}
}

// ── SAVE DISBURSEMENTS ──
export function saveDisbursements(records: SyncedDisbursementRecord[]) {
  try {
    localStorage.setItem("all_financial_disbursements", JSON.stringify(records))
    window.dispatchEvent(new Event("financial_disbursements_updated"))
    window.dispatchEvent(new Event("storage"))
  } catch (e) {
    console.warn("Could not save disbursements to localStorage:", e)
  }
}

// ── ADD USER NOTIFICATION ──
export function pushUserNotification(notif: {
  title: string
  desc: string
  applicationRef?: string
  assistanceType?: string
  amount?: number
}) {
  try {
    const raw = localStorage.getItem("all_user_notifications")
    const existing: UserNotificationItem[] = raw ? JSON.parse(raw) : []
    const newNotif: UserNotificationItem = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: notif.title,
      desc: notif.desc,
      time: new Date().toLocaleString("en-PH"),
      unread: true,
      applicationRef: notif.applicationRef,
      assistanceType: notif.assistanceType,
      amount: notif.amount,
    }
    const updated = [newNotif, ...existing]
    localStorage.setItem("all_user_notifications", JSON.stringify(updated))
    window.dispatchEvent(new Event("user_notifications_updated"))
    window.dispatchEvent(new Event("storage"))
  } catch (e) {
    console.warn("Could not save user notification:", e)
  }
}

// ── SYNC: WHEN ADMIN SCHEDULES/UPDATES APPOINTMENT ──
export function syncAppointmentToFinancialAid(params: {
  referenceNo: string
  applicantName: string
  concern: string
  date: string
  time: string
  location: string
  notes?: string
}) {
  // If the appointment concern is an ID application (PWD ID, Senior ID, Solo Parent ID), do not treat as cash payout
  if (isIdOrDocumentService(params.concern)) {
    return
  }

  const currentDisbursements = getSavedDisbursements()
  let found = false

  const rawConcern = params.concern.replace(/\s*assistance/gi, "").trim()
  const formattedConcern = rawConcern.charAt(0).toUpperCase() + rawConcern.slice(1) + " Assistance"
  const fixedAmount = FIXED_ASSISTANCE_AMOUNTS[formattedConcern] || FIXED_ASSISTANCE_AMOUNTS[params.concern] || 1000

  // Format date to human readable e.g. August 31, 2026
  let formattedDate = params.date
  try {
    const d = new Date(params.date)
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
    }
  } catch {}

  const updatedDisbursements = currentDisbursements.map((d) => {
    if (
      d.applicationRef === params.referenceNo ||
      d.applicantName.toLowerCase().trim() === params.applicantName.toLowerCase().trim()
    ) {
      found = true
      return {
        ...d,
        appointmentDate: formattedDate,
        appointmentTime: params.time,
        venue: params.location || "Quezon City Hall",
      }
    }
    return d
  })

  // If not found, create new connected disbursement record!
  if (!found) {
    const newId = `DISB-2026-${String(currentDisbursements.length + 1).padStart(4, "0")}`
    const newRecord: SyncedDisbursementRecord = {
      id: `disb-${Date.now()}`,
      disbursementId: newId,
      applicationRef: params.referenceNo,
      applicantName: params.applicantName.toUpperCase(),
      assistanceType: formattedConcern,
      fixedAmount: fixedAmount,
      dateApproved: new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }),
      status: "PENDING",
      appointmentDate: formattedDate,
      appointmentTime: params.time,
      venue: params.location || "Quezon City Hall",
      remarks: params.notes || "Scheduled appointment for financial aid payout.",
    }
    updatedDisbursements.unshift(newRecord)
  }

  saveDisbursements(updatedDisbursements)

  // Send User Notification for Scheduled Payout Appointment
  pushUserNotification({
    title: "Nakatakda ang Inyong Payout Appointment",
    desc: `Your Financial Aid payout appointment has been scheduled.\nDate: ${formattedDate}\nTime: ${params.time}\nLocation: ${params.location || "Quezon City Hall"}\nAmount: ₱${fixedAmount.toLocaleString()}`,
    applicationRef: params.referenceNo,
    assistanceType: formattedConcern,
    amount: fixedAmount,
  })

  // Asynchronously sync to Backend PostgreSQL
  try {
    fetch(`${API_BASE}/api/appointments/${encodeURIComponent(params.referenceNo)}/schedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledDate: formattedDate,
        scheduledTime: params.time,
        officeLocation: params.location || "Quezon City Hall",
        notes: params.notes,
        applicantName: params.applicantName,
        concern: formattedConcern,
      }),
    }).catch(() => {})
  } catch {}
}

// ── SYNC: WHEN ADMIN CONFIRMS FINANCIAL AID RELEASE ──
export function syncFinancialAidRelease(recordId: string, details: {
  releasedDate: string
  releasedBy: string
  venue: string
  remarks?: string
}) {
  const currentDisbursements = getSavedDisbursements()
  let releasedRecord: SyncedDisbursementRecord | null = null

  const updated = currentDisbursements.map((d) => {
    if (d.id === recordId || d.disbursementId === recordId) {
      releasedRecord = {
        ...d,
        status: "RELEASED" as DisbursementStage,
        releasedDate: details.releasedDate,
        releasedBy: details.releasedBy,
        venue: details.venue,
        remarks: details.remarks || d.remarks,
      }
      return releasedRecord
    }
    return d
  })

  saveDisbursements(updated)

  if (releasedRecord) {
    const rec = releasedRecord as SyncedDisbursementRecord
    // Send User Notification for Released Aid
    pushUserNotification({
      title: "Na-release na ang Inyong Ayuda",
      desc: `Your Financial Aid (${rec.assistanceType} — ₱${rec.fixedAmount.toLocaleString()}) has been released successfully. Date: ${details.releasedDate}.`,
      applicationRef: rec.applicationRef,
      assistanceType: rec.assistanceType,
      amount: rec.fixedAmount,
    })

    // Asynchronously sync to Backend PostgreSQL
    try {
      fetch(`${API_BASE}/api/financial-aid/${encodeURIComponent(recordId)}/release`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releasedDate: details.releasedDate,
          releasedBy: details.releasedBy,
          venue: details.venue,
          remarks: details.remarks,
        }),
      }).catch(() => {})
    } catch {}
  }
}

// ── HELPER: PARSE APPOINTMENT DATETIME ──
export function parseAppointmentDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr) return null
  try {
    let year: number, month: number, day: number

    const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10)
      month = parseInt(isoMatch[2], 10) - 1
      day = parseInt(isoMatch[3], 10)
    } else {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return null
      year = d.getFullYear()
      month = d.getMonth()
      day = d.getDate()
    }

    let hours = 9
    let minutes = 0

    if (timeStr) {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
      if (match) {
        hours = parseInt(match[1], 10)
        minutes = parseInt(match[2], 10)
        const ampm = match[3]?.toUpperCase()
        if (ampm === "PM" && hours < 12) hours += 12
        if (ampm === "AM" && hours === 12) hours = 0
      }
    }

    return new Date(year, month, day, hours, minutes, 0, 0)
  } catch {
    return null
  }
}

// ── TIME-BASED AUTO-RELEASE ENGINE ──
export function checkAndAutoReleaseScheduledDisbursements(): number {
  const currentDisbursements = getSavedDisbursements()
  const now = new Date()
  let releasedCount = 0

  const updated = currentDisbursements.map((d) => {
    if (d.status === "PENDING" && d.appointmentDate) {
      const scheduledDt = parseAppointmentDateTime(d.appointmentDate, d.appointmentTime)
      if (scheduledDt && now.getTime() >= scheduledDt.getTime()) {
        releasedCount++
        const formattedReleaseDate = now.toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        const finalReleaseTime = d.appointmentTime || now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })

        // Send User Notification for Auto-Released Aid
        pushUserNotification({
          title: "Na-release na ang Inyong Ayuda",
          desc: `Your Financial Aid (${d.assistanceType} — ₱${d.fixedAmount.toLocaleString()}) has been automatically released at the scheduled appointment time (${d.appointmentDate} – ${finalReleaseTime}).`,
          applicationRef: d.applicationRef,
          assistanceType: d.assistanceType,
          amount: d.fixedAmount,
        })

        return {
          ...d,
          status: "RELEASED" as DisbursementStage,
          releasedDate: `${formattedReleaseDate} ${finalReleaseTime}`,
          releasedBy: "Automated Scheduled Payout System / Disbursing Officer",
          remarks: `Awtomatikong na-release sa takdang oras ng appointment (${d.appointmentDate} - ${finalReleaseTime}).`,
        }
      }
    }
    return d
  })

  if (releasedCount > 0) {
    saveDisbursements(updated)
  }

  return releasedCount
}


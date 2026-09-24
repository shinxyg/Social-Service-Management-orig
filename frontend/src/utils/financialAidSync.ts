import { API_BASE } from "../config/api"

export const FIXED_ASSISTANCE_AMOUNTS: Record<string, number> = {
  "PWD Social Assistance": 500,
  "PWD Pension Assistance": 500,
  "PWD Social Pension": 500,
  "Senior Social Assistance": 3000,
  "Senior Citizen Social Pension": 3000,
  "Senior Citizen Assistance": 3000,
  "Senior Citizen": 3000,
  "Child Welfare Support": 5000,
  "Nutritional Assistance": 5000,
  "Nutritional Assistance (Child Welfare)": 5000,
  "Child Protection Assistance": 5000,
  "Emergency Assistance": 5000,
  "Child Welfare Assistance": 5000,
  "Solo Parent Financial Subsidy": 3000,
  "Solo Parent Subsidy": 3000,
  "Solo Parent Welfare Assistance": 3000,
  "Solo Parent Assistance": 3000,
  "Livelihood Capital Assistance": 15000,
  "Livelihood Assistance": 15000,
  "Livelihood Program": 15000,
  "Funeral Assistance": 10000,
  "Educational Assistance": 3000,
  "Burial Assistance": 10000,
}

export function resolveFixedAmount(concern: string): number {
  if (!concern) return 5000
  const c = String(concern).trim()
  if (FIXED_ASSISTANCE_AMOUNTS[c]) return FIXED_ASSISTANCE_AMOUNTS[c]
  const clean = c.replace(/\s*assistance/gi, "").trim()
  const formatted = clean.charAt(0).toUpperCase() + clean.slice(1) + " Assistance"
  if (FIXED_ASSISTANCE_AMOUNTS[formatted]) return FIXED_ASSISTANCE_AMOUNTS[formatted]

  const lower = c.toLowerCase()
  if (lower.includes("pwd") || lower.includes("disability") || lower.includes("pension")) return 1500
  if (lower.includes("solo") && (lower.includes("subsidy") || lower.includes("financial"))) return 3000
  if (lower.includes("funeral") || lower.includes("burial")) return 10000
  if (lower.includes("livelihood")) return 15000
  if (lower.includes("nutrition") || lower.includes("child") || lower.includes("medical") || lower.includes("emergency")) return 5000
  if (lower.includes("education")) return 3000
  if (lower.includes("senior") || lower.includes("osca")) return 3000
  return 5000
}

export interface PwdPensionState {
  monthlyRate: number
  currentAccumulated: number
  totalTarget: number
  currentMonthNumber: number
  isMatured: boolean
  progressPercent: number
  elapsedMinutes: number
  nextQuarterMonthName: string
  approvedDateStr: string
}

export interface SoloParentSubsidyState {
  monthlyRate: number
  currentAccumulated: number
  totalTarget: number
  currentMonthNumber: number
  isMatured: boolean
  progressPercent: number
  elapsedMinutes: number
  nextQuarterMonthName: string
  approvedDateStr: string
}

export function getSoloParentSubsidyAccumulation(
  approvedDate?: string | number | Date | null,
  releasedDate?: string | number | Date | null,
  nowMs: number = Date.now()
): SoloParentSubsidyState {
  const MONTHLY_RATE = 1000
  const TARGET_AMOUNT = 3000
  const MINUTES_PER_MONTH = 2 // 2-minute demo interval = 1 month

  if (!approvedDate) {
    return {
      monthlyRate: MONTHLY_RATE,
      currentAccumulated: 0,
      totalTarget: TARGET_AMOUNT,
      currentMonthNumber: 1,
      isMatured: false,
      progressPercent: 0,
      elapsedMinutes: 0,
      nextQuarterMonthName: "Month 1 of 3",
      approvedDateStr: "",
    }
  }

  const appDateObj = new Date(approvedDate)
  const appMs = isNaN(appDateObj.getTime()) ? nowMs : appDateObj.getTime()

  let baseStartMs = appMs
  if (releasedDate) {
    const relDateObj = new Date(releasedDate)
    if (!isNaN(relDateObj.getTime()) && relDateObj.getTime() > appMs) {
      baseStartMs = relDateObj.getTime()
    }
  }

  const diffMs = Math.max(0, nowMs - baseStartMs)
  const elapsedMinutes = diffMs / (60 * 1000)

  // 0 to <2 mins = Month 1 (₱1,000)
  // 2 to <4 mins = Month 2 (₱2,000)
  // >= 4 mins = Month 3 (₱3,000 - Matured)
  let monthIndex = Math.floor(elapsedMinutes / MINUTES_PER_MONTH) + 1
  if (monthIndex > 3) monthIndex = 3
  if (monthIndex < 1) monthIndex = 1

  const currentAccumulated = monthIndex * MONTHLY_RATE
  const isMatured = currentAccumulated >= TARGET_AMOUNT
  const progressPercent = Math.min(100, Math.round((currentAccumulated / TARGET_AMOUNT) * 100))

  return {
    monthlyRate: MONTHLY_RATE,
    currentAccumulated,
    totalTarget: TARGET_AMOUNT,
    currentMonthNumber: monthIndex,
    isMatured,
    progressPercent,
    elapsedMinutes: Math.floor(elapsedMinutes),
    nextQuarterMonthName: `Month ${monthIndex} of 3`,
    approvedDateStr: appDateObj.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
  }
}

export function getPwdPensionAccumulation(
  approvedDate?: string | number | Date | null,
  releasedDate?: string | number | Date | null,
  nowMs: number = Date.now()
): PwdPensionState {
  const MONTHLY_RATE = 500
  const TARGET_AMOUNT = 1500
  const MINUTES_PER_MONTH = 2 // 2-minute demo interval = 1 month

  if (!approvedDate) {
    return {
      monthlyRate: MONTHLY_RATE,
      currentAccumulated: 0,
      totalTarget: TARGET_AMOUNT,
      currentMonthNumber: 1,
      isMatured: false,
      progressPercent: 0,
      elapsedMinutes: 0,
      nextQuarterMonthName: "Month 1 of 3",
      approvedDateStr: "",
    }
  }

  const appDateObj = new Date(approvedDate)
  const appMs = isNaN(appDateObj.getTime()) ? nowMs : appDateObj.getTime()

  let baseStartMs = appMs
  if (releasedDate) {
    const relDateObj = new Date(releasedDate)
    if (!isNaN(relDateObj.getTime()) && relDateObj.getTime() > appMs) {
      baseStartMs = relDateObj.getTime()
    }
  }

  const diffMs = Math.max(0, nowMs - baseStartMs)
  const elapsedMinutes = diffMs / (60 * 1000)

  // 0 to <2 mins = Month 1 (₱500)
  // 2 to <4 mins = Month 2 (₱1,000)
  // >= 4 mins = Month 3 (₱1,500 - Matured)
  let monthIndex = Math.floor(elapsedMinutes / MINUTES_PER_MONTH) + 1
  if (monthIndex > 3) monthIndex = 3
  if (monthIndex < 1) monthIndex = 1

  const currentAccumulated = monthIndex * MONTHLY_RATE
  const isMatured = currentAccumulated >= TARGET_AMOUNT
  const progressPercent = Math.min(100, Math.round((currentAccumulated / TARGET_AMOUNT) * 100))

  return {
    monthlyRate: MONTHLY_RATE,
    currentAccumulated,
    totalTarget: TARGET_AMOUNT,
    currentMonthNumber: monthIndex,
    isMatured,
    progressPercent,
    elapsedMinutes: Math.floor(elapsedMinutes),
    nextQuarterMonthName: `Month ${monthIndex} of 3`,
    approvedDateStr: appDateObj.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
  }
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
  hospitalName?: string
  partnerHospital?: string
  [key: string]: any
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

export const INITIAL_DISBURSEMENTS: SyncedDisbursementRecord[] = []

export function isTrainingService(serviceOrConcern?: string): boolean {
  if (!serviceOrConcern) return false
  const lower = serviceOrConcern.toLowerCase()
  return (
    lower.includes("training") ||
    lower.includes("skills") ||
    lower.includes("sewing") ||
    lower.includes("cooking") ||
    lower.includes("beauty services") ||
    lower.includes("beauty care") ||
    lower.includes("computer training") ||
    lower.includes("training program")
  )
}

export function isNonCashOrGLService(serviceOrConcern?: string): boolean {
  if (!serviceOrConcern) return false
  const lower = serviceOrConcern.toLowerCase()
  return (
    lower.includes("medical") ||
    lower.includes("hospital") ||
    lower.includes("guarantee letter") ||
    lower.includes("gamot") ||
    lower.includes("reseta") ||
    lower.includes("health")
  )
}

export function isIdOrDocumentService(serviceOrConcern?: string): boolean {
  if (!serviceOrConcern) return false
  if (isTrainingService(serviceOrConcern)) return false
  const lower = serviceOrConcern.toLowerCase()
  if (
    lower.includes("medical") ||
    lower.includes("hospital") ||
    lower.includes("dialysis") ||
    lower.includes("guarantee letter") ||
    lower.includes("aics") ||
    lower.includes("social assistance") ||
    lower.includes("financial assistance") ||
    lower.includes("cash assistance") ||
    lower.includes("funeral assistance") ||
    lower.includes("educational assistance") ||
    lower.includes("food assistance") ||
    lower.includes("material assistance") ||
    lower.includes("transportation assistance") ||
    lower.includes("burial assistance") ||
    lower.includes("child welfare") ||
    lower.includes("nutritional") ||
    lower.includes("child protection") ||
    lower.includes("emergency assistance") ||
    lower.includes("solo parent") ||
    lower.includes("subsidy") ||
    lower.includes("livelihood")
  ) {
    return false
  }

  return (
    lower.includes("id card") ||
    lower.includes("identification") ||
    lower.includes("id booklet") ||
    lower.includes("purchase booklet") ||
    lower.includes("pwd id") ||
    lower.includes("senior id") ||
    lower.includes("osca id") ||
    lower.includes("pdao id") ||
    lower.includes("solo parent id") ||
    lower.endsWith(" id") ||
    lower.includes(" id ")
  )
}

export function getDeletedDisbursementKeys(): Set<string> {
  try {
    const raw = localStorage.getItem("deleted_financial_disbursement_keys")
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return new Set(parsed)
    }
  } catch {}
  return new Set()
}

export function markDisbursementAsDeleted(keys: string[]) {
  try {
    const deleted = getDeletedDisbursementKeys()
    keys.forEach((k) => {
      if (k && k.trim()) deleted.add(k.trim())
    })
    localStorage.setItem("deleted_financial_disbursement_keys", JSON.stringify(Array.from(deleted)))
  } catch {}
}

export async function deleteFinancialAidDisbursement(record: {
  id?: string
  disbursementId?: string
  applicationRef?: string
  applicantName?: string
}) {
  const keysToDelete = [
    record.id,
    record.disbursementId,
    record.applicationRef,
  ].filter(Boolean) as string[]

  markDisbursementAsDeleted(keysToDelete)

  try {
    const raw = localStorage.getItem("all_financial_disbursements")
    if (raw) {
      const list = JSON.parse(raw)
      if (Array.isArray(list)) {
        const next = list.filter((item: any) => {
          const idMatch = keysToDelete.includes(item.id) || keysToDelete.includes(item.disbursementId) || keysToDelete.includes(item.applicationRef)
          return !idMatch
        })
        localStorage.setItem("all_financial_disbursements", JSON.stringify(next))
      }
    }
  } catch {}

  try {
    const cleanAppRef = (record.applicationRef || "")
      .replace(/^db-appt-/, "")
      .replace(/^aics-appt-/, "")
      .replace(/^pwd-senior-appt-/, "")

    const requests: Promise<any>[] = []
    if (record.id) requests.push(fetch(`${API_BASE}/api/financial-aid/${encodeURIComponent(record.id)}`, { method: "DELETE" }))
    if (record.disbursementId) requests.push(fetch(`${API_BASE}/api/financial-aid/${encodeURIComponent(record.disbursementId)}`, { method: "DELETE" }))
    if (record.applicationRef) {
      requests.push(fetch(`${API_BASE}/api/financial-aid/${encodeURIComponent(record.applicationRef)}`, { method: "DELETE" }))
      requests.push(fetch(`${API_BASE}/api/financial-aid/cleanup-user/${encodeURIComponent(record.applicationRef)}`, { method: "DELETE" }))
    }
    if (record.applicantName) {
      requests.push(fetch(`${API_BASE}/api/financial-aid/cleanup-user/${encodeURIComponent(record.applicantName.trim())}`, { method: "DELETE" }))
    }
    if (cleanAppRef && cleanAppRef !== record.applicationRef) {
      requests.push(fetch(`${API_BASE}/api/financial-aid/${encodeURIComponent(cleanAppRef)}`, { method: "DELETE" }))
      requests.push(fetch(`${API_BASE}/api/aics/applications/${encodeURIComponent(cleanAppRef)}`, { method: "DELETE" }))
      requests.push(fetch(`${API_BASE}/api/pwd-senior/applications/${encodeURIComponent(cleanAppRef)}`, { method: "DELETE" }))
    }

    await Promise.allSettled(requests)
  } catch (err) {
    console.warn("Error deleting disbursement from backend:", err)
  }

  window.dispatchEvent(new Event("financial_disbursements_updated"))
  window.dispatchEvent(new Event("storage"))
}

export function resetManualDisbursementRelease(refOrId?: string) {
  if (!refOrId) return
  try {
    const target = String(refOrId).toLowerCase().trim()
    const raw = localStorage.getItem("manually_released_disbursements")
    if (raw) {
      const list = JSON.parse(raw)
      if (Array.isArray(list)) {
        const next = list.filter((k: any) => String(k).toLowerCase().trim() !== target)
        localStorage.setItem("manually_released_disbursements", JSON.stringify(next))
      }
    }
    const rawGL = localStorage.getItem("printed_gl_applications")
    if (rawGL) {
      const map = JSON.parse(rawGL)
      if (typeof map === "object" && map !== null) {
        delete map[target]
        localStorage.setItem("printed_gl_applications", JSON.stringify(map))
      }
    }
  } catch {}
}

export function getManuallyReleasedKeys(): Set<string> {
  try {
    const raw = localStorage.getItem("manually_released_disbursements")
    if (raw) {
      const parsed = JSON.parse(raw)
      const list = Array.isArray(parsed) ? parsed : Object.keys(parsed)
      const validRefKeys = list
        .map(k => String(k).toLowerCase().trim())
        .filter(k => k.startsWith("disb") || k.startsWith("1100") || k.startsWith("db-") || k.startsWith("remote-") || /\d{5,}/.test(k))
      return new Set(validRefKeys)
    }
  } catch {}
  return new Set()
}

export function markDisbursementAsManuallyReleased(record: { id?: string; disbursementId?: string; applicationRef?: string }) {
  try {
    const raw = localStorage.getItem("manually_released_disbursements")
    const list: string[] = raw ? JSON.parse(raw) : []
    const keysToAdd = [record.id, record.disbursementId, record.applicationRef]
      .filter(Boolean)
      .map(k => String(k).toLowerCase().trim())
    keysToAdd.forEach(k => {
      if (!list.includes(k)) list.push(k)
    })
    localStorage.setItem("manually_released_disbursements", JSON.stringify(list))
    window.dispatchEvent(new Event("financial_disbursements_updated"))
    window.dispatchEvent(new Event("storage"))
  } catch {}
}

export function isDisbursementManuallyReleased(record: { id?: string; disbursementId?: string; applicationRef?: string; applicantName?: string; releasedBy?: string; status?: string }): boolean {
  if (record.releasedBy && (record.releasedBy.includes("Automated") || record.releasedBy.includes("Appointment") || record.releasedBy.includes("Social Worker"))) {
    return false
  }
  const manualKeys = getManuallyReleasedKeys()
  const cleanId = String(record.id || "").toLowerCase().trim()
  const cleanDisbId = String(record.disbursementId || "").toLowerCase().trim()
  const cleanAppRef = String(record.applicationRef || "").toLowerCase().trim()

  if (cleanId && manualKeys.has(cleanId)) return true
  if (cleanDisbId && manualKeys.has(cleanDisbId)) return true
  if (cleanAppRef && manualKeys.has(cleanAppRef)) return true
  return false
}

export function getSavedDisbursements(): SyncedDisbursementRecord[] {
  try {
    const deletedKeys = getDeletedDisbursementKeys()
    const raw = localStorage.getItem("all_financial_disbursements")
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {

        const realOnes = parsed.filter(
          (p) =>
            p &&
            !["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"].includes(p.id) &&
            !isIdOrDocumentService(p.assistanceType) &&
            !isTrainingService(p.assistanceType) &&
            !isNonCashOrGLService(p.assistanceType) &&
            !/-\d{4}$/.test(p.applicationRef || "") &&
            !deletedKeys.has(p.id) &&
            !deletedKeys.has(p.disbursementId) &&
            !deletedKeys.has(p.applicationRef)
        )

        const recordMap = new Map<string, SyncedDisbursementRecord>()
        realOnes.forEach((r) => {
          const key = `${(r.applicationRef || r.disbursementId || r.id || "").trim()}_${(r.assistanceType || "").trim()}`
          const isManual = isDisbursementManuallyReleased(r)
          const fixedStatus: DisbursementStage = isManual ? "RELEASED" : "PENDING"
          const correctAmount = resolveFixedAmount(r.assistanceType)
          const recordWithCorrectAmount: SyncedDisbursementRecord = {
            ...r,
            status: fixedStatus,
            releasedDate: fixedStatus === "RELEASED" ? r.releasedDate : undefined,
            releasedBy: fixedStatus === "RELEASED" ? (r.releasedBy || "Disbursing Officer") : undefined,
            fixedAmount: (r.fixedAmount && r.fixedAmount !== 1000) ? r.fixedAmount : correctAmount,
          }

          if (!recordMap.has(key)) {
            recordMap.set(key, recordWithCorrectAmount)
          } else {
            const existing = recordMap.get(key)!

            if (fixedStatus === "RELEASED" && existing.status !== "RELEASED") {
              recordMap.set(key, { ...recordWithCorrectAmount, status: "RELEASED" })
            } else if (r.appointmentDate && !existing.appointmentDate) {
              recordMap.set(key, recordWithCorrectAmount)
            }
          }
        })

        return Array.from(recordMap.values())
      }
    }
  } catch (e) {
    console.warn("Could not parse disbursements from localStorage:", e)
  }
  return []
}

export function clearAllDisbursements() {
  try {
    localStorage.removeItem("all_financial_disbursements")
    localStorage.removeItem("deleted_financial_disbursement_keys")
    window.dispatchEvent(new Event("financial_disbursements_updated"))
    window.dispatchEvent(new Event("storage"))
  } catch (e) {}
}

export function saveDisbursements(records: SyncedDisbursementRecord[]) {
  try {

    const recordMap = new Map<string, SyncedDisbursementRecord>()
    records.forEach((r) => {
      const key = `${(r.applicationRef || r.disbursementId || r.id || "").trim()}_${(r.assistanceType || "").trim()}`
      if (!key || key === "_") return
      if (!recordMap.has(key)) {
        recordMap.set(key, r)
      } else {
        const existing = recordMap.get(key)!
        if (r.status === "RELEASED" && existing.status !== "RELEASED") {
          recordMap.set(key, r)
        } else if (r.appointmentDate && !existing.appointmentDate) {
          recordMap.set(key, r)
        }
      }
    })
    const cleanList = Array.from(recordMap.values())
    localStorage.setItem("all_financial_disbursements", JSON.stringify(cleanList))
    window.dispatchEvent(new Event("financial_disbursements_updated"))
    window.dispatchEvent(new Event("storage"))
  } catch (e) {
    console.warn("Could not save disbursements to localStorage:", e)
  }
}

export function pushUserNotification(notif: {
  title: string
  desc?: string
  message?: string
  userId?: string
  type?: string
  link?: string
  applicationRef?: string
  assistanceType?: string
  amount?: number
}) {
  try {
    const raw = localStorage.getItem("all_user_notifications")
    const existing: UserNotificationItem[] = raw ? JSON.parse(raw) : []

    const notifDesc = notif.desc || notif.message || ""
    const appRef = notif.applicationRef || notif.userId

    if (appRef && appRef !== "all") {
      const isDuplicate = existing.some(
        (e) =>
          String(e.applicationRef || "").trim() === String(appRef).trim() &&
          e.title === notif.title
      )
      if (isDuplicate) return
    }

    const newNotif: UserNotificationItem = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: notif.title,
      desc: notifDesc,
      time: new Date().toLocaleString("en-PH"),
      unread: true,
      applicationRef: appRef,
      assistanceType: notif.assistanceType,
      amount: notif.amount,
    }
    localStorage.setItem("all_user_notifications", JSON.stringify([newNotif, ...existing]))
    try {
      let qcidNo: string | null = null
      let userEmail: string | null = null
      try {
        const stored = localStorage.getItem("user_profile")
        if (stored) {
          const parsed = JSON.parse(stored)
          qcidNo = parsed.qcidNumber || parsed.qcidNo || null
          userEmail = parsed.email || null
        }
      } catch {}

      fetch(`${API_BASE}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: notif.applicationRef || qcidNo || null,
          qcid: qcidNo,
          email: userEmail,
          title: notif.title,
          description: notif.desc,
          applicationRef: notif.applicationRef || null,
        }),
      }).catch(() => {})
    } catch (_) {}

    window.dispatchEvent(new Event("user_notifications_updated"))
    window.dispatchEvent(new Event("storage"))
  } catch (e) {
    console.warn("Could not save user notification:", e)
  }
}

export function syncAppointmentToFinancialAid(params: {
  referenceNo: string
  applicantName: string
  concern: string
  date: string
  time: string
  location: string
  notes?: string
}) {
  resetManualDisbursementRelease(params.referenceNo)

  if (
    isIdOrDocumentService(params.concern) || 
    isTrainingService(params.concern) || 
    isNonCashOrGLService(params.concern)
  ) {
    return
  }

  const currentDisbursements = getSavedDisbursements()
  let found = false

  const fixedAmount = resolveFixedAmount(params.concern)
  let formattedConcern = params.concern
  if (params.concern.toLowerCase().includes("solo parent")) {
    formattedConcern = "Solo Parent Financial Subsidy"
  } else if (!params.concern.toLowerCase().includes("assistance") && !params.concern.toLowerCase().includes("pension") && !params.concern.toLowerCase().includes("subsidy")) {
    const rawConcern = params.concern.replace(/\s*assistance/gi, "").trim()
    formattedConcern = rawConcern.charAt(0).toUpperCase() + rawConcern.slice(1) + " Assistance"
  }

  let formattedDate = params.date ? params.date : undefined
  if (params.date) {
    try {
      const d = new Date(params.date)
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
      }
    } catch {}
  }

  const isSoloParentConcern = formattedConcern.toLowerCase().includes("solo parent")
  const updatedDisbursements = currentDisbursements.map((d) => {
    const isExactRef = d.applicationRef && d.applicationRef.trim().toLowerCase() === params.referenceNo.trim().toLowerCase()
    const isSoloMatch = isSoloParentConcern && (
      String(d.assistanceType).toLowerCase().includes("solo parent") ||
      String(d.applicationRef || "").toLowerCase().includes("sp-") ||
      String(d.applicantName || "").toLowerCase().includes("solo parent") ||
      (params.applicantName && d.applicantName && d.applicantName.trim().toUpperCase() === params.applicantName.trim().toUpperCase())
    )

    if (isExactRef || isSoloMatch) {
      found = true
      return {
        ...d,
        applicationRef: params.referenceNo || d.applicationRef,
        applicantName: params.applicantName ? params.applicantName.toUpperCase() : d.applicantName,
        assistanceType: formattedConcern,
        appointmentDate: formattedDate !== undefined ? formattedDate : d.appointmentDate,
        appointmentTime: params.time !== undefined ? params.time : d.appointmentTime,
        venue: params.location || d.venue || (isSoloParentConcern ? "Quezon City Hall - SSDD Solo Parent Welfare Section" : "Quezon City Hall"),
      }
    }
    return d
  })

  // Purge any ghost Senior records for Jefferson or DISB-2026-9929
  const filteredDisbursements = updatedDisbursements.filter((d) => {
    const isGhostSenior =
      d.disbursementId === "DISB-2026-9929" ||
      d.id === "local-appt-9929" ||
      d.id === "remote-pwd-9929" ||
      (String(d.applicantName || "").toUpperCase().includes("JEFFERSON") &&
       String(d.assistanceType || "").toLowerCase().includes("senior"))
    return !isGhostSenior
  })

  if (!found) {
    const newId = `DISB-2026-${String(filteredDisbursements.length + 1).padStart(4, "0")}`
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
      venue: params.location || (isSoloParentConcern ? "Quezon City Hall - SSDD Solo Parent Welfare Section" : "Quezon City Hall"),
      remarks: params.notes || "Scheduled appointment for financial aid payout.",
    }
    filteredDisbursements.unshift(newRecord)
  }

  saveDisbursements(filteredDisbursements)

  if (formattedDate) {
    pushUserNotification({
      title: "Payout Appointment Scheduled",
      desc: `Naitakda ang inyong iskedyul ng payout sa ${formattedDate} (${params.time || "10:00 AM"}) sa ${params.location || "Quezon City Hall"}.\nHalaga: ₱${fixedAmount.toLocaleString()}`,
      applicationRef: params.referenceNo,
      type: "payout_scheduled",
      amount: fixedAmount,
    })
  }

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

    pushUserNotification({
      title: "Financial Aid Released",
      desc: `Your Financial Aid (${rec.assistanceType} — ₱${rec.fixedAmount.toLocaleString()}) has been released successfully. Date: ${details.releasedDate}.`,
      applicationRef: rec.applicationRef,
      assistanceType: rec.assistanceType,
      amount: rec.fixedAmount,
    })

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

export function checkAndAutoReleaseScheduledDisbursements(): number {
  // Do not auto-complete appointments/disbursements without explicit admin action
  return 0
}

export const TARGET_TEST_MATCHES = [
  "kris",
  "topher",
  "110000872276939",
  "110000572516915",
  "-8943",
  "disb-2026-0008",
  "renz",
  "millares",
  "renzoe09062",
  "disb-2026-4213",
  "disb-2026-9929",
  "local-appt-9929",
]

export const ALL_STORAGE_KEYS = [
  "all_financial_disbursements",
  "all_appointments_scheduled",
  "pwd_senior_applications",
  "aics_applications",
  "all_user_applications",
  "active_applications",
  "all_user_notifications",
  "citizen_applications",
  "user_applications",
  "dismissed_senior_assistance_ref",
  "child_welfare_submissions",
  "solo_parent_applications",
  "livelihood_applications",
]

export function purgeLegacyLocalTestData() {
  if (typeof window === "undefined" || !window.localStorage) return

  for (const k of ALL_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(k)
      if (raw) {
        const list = JSON.parse(raw)
        if (Array.isArray(list)) {
          const filtered = list.filter((item: any) => {
            const str = JSON.stringify(item).toLowerCase()
            const isMatch = TARGET_TEST_MATCHES.some((m) => str.includes(m))
            const isJeffersonSenior = str.includes("jefferson") && (str.includes("senior") || str.includes("osca"))
            return !isMatch && !isJeffersonSenior
          })
          localStorage.setItem(k, JSON.stringify(filtered))
        } else if (typeof list === "object" && list !== null) {
          const newObj = { ...list }
          Object.keys(newObj).forEach((objKey) => {
            const lowerKey = objKey.toLowerCase()
            const valStr = JSON.stringify(newObj[objKey] || "").toLowerCase()
            if (
              TARGET_TEST_MATCHES.some((m) => lowerKey.includes(m)) ||
              (valStr.includes("jefferson") && (valStr.includes("senior") || valStr.includes("osca"))) ||
              (lowerKey.includes("jefferson") && (lowerKey.includes("senior") || lowerKey.includes("osca")))
            ) {
              delete newObj[objKey]
            }
          })
          localStorage.setItem(k, JSON.stringify(newObj))
        }
      }
    } catch {}
  }
}

try {
  purgeLegacyLocalTestData()
} catch {}

export async function cleanupRenzTestData() {
  try {

    await Promise.allSettled([
      fetch(`${API_BASE}/api/auth/reset-test-citizen?email=renzoe09062@gmail.com`),
      fetch(`${API_BASE}/api/cleanup-user/110000872276939`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/cleanup-user/110000572516915`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/cleanup-user/kris`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/cleanup-user/renz`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/cleanup-user/millares`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/aics/applications/cleanup-user/110000872276939`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/aics/applications/cleanup-user/110000572516915`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/aics/cleanup-user/110000872276939`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/aics/cleanup-user/110000572516915`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/appointments/cleanup-user/110000872276939`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/appointments/cleanup-user/110000572516915`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/financial-aid/cleanup-user/110000872276939`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/financial-aid/cleanup-user/110000572516915`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/pwd-senior/applications/cleanup-user/110000872276939`, { method: "DELETE" }),
      fetch(`${API_BASE}/api/pwd-senior/applications/cleanup-user/110000572516915`, { method: "DELETE" }),
    ])
  } catch {}

  purgeLegacyLocalTestData()

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("financial_disbursements_updated"))
    window.dispatchEvent(new Event("appointments_updated"))
    window.dispatchEvent(new Event("pwd_senior_applications_updated"))
    window.dispatchEvent(new Event("aics_applications_updated"))
    window.dispatchEvent(new Event("applications_updated"))
    window.dispatchEvent(new Event("storage"))
  }
}

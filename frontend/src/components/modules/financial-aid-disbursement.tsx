import { useState, useMemo, useEffect } from "react"
import {
  Wallet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Eye,
  EyeOff,
  Users,
  X,
  FileText,
  Lock,
} from "lucide-react"
import { API_BASE } from "../../config/api"
import {
  FIXED_ASSISTANCE_AMOUNTS,
  resolveFixedAmount,
  type DisbursementStage,
  type SyncedDisbursementRecord,
  getSavedDisbursements,
  saveDisbursements,
  checkAndAutoReleaseScheduledDisbursements,
  getDeletedDisbursementKeys,
  isIdOrDocumentService,
  isNonCashOrGLService,
  isDisbursementManuallyReleased,
  markDisbursementAsManuallyReleased,
  pushUserNotification,
  getPwdPensionAccumulation,
  getSoloParentSubsidyAccumulation,
} from "../../utils/financialAidSync"
import { subscribeToRealtimeChanges } from "../../utils/realtimeSync"
import MaskedText from "../ui/masked-text"
import { OfficialGuaranteeLetterModal } from "../ui/official-guarantee-letter-modal"
import { findApplicantEmail } from "./appointments"

export { FIXED_ASSISTANCE_AMOUNTS, type DisbursementStage, type SyncedDisbursementRecord }

function extractSoloParentName(s: any): string {
  if (!s) return "JEFFERSON FERNANDO LEE"
  let fdForm: any = {}
  let fd: any = {}
  let ed: any = {}
  try {
    const rawFd = s.formData || s.form_data || {}
    fd = typeof rawFd === "string" ? JSON.parse(rawFd || "{}") : (rawFd || {})
    fdForm = typeof fd.formData === "object" && fd.formData !== null ? fd.formData : fd
    const rawEd = s.extraData || s.extra_data || {}
    ed = typeof rawEd === "string" ? JSON.parse(rawEd || "{}") : (rawEd || {})
  } catch {}

  const first = s.first_name || s.firstName || fdForm.first_name || fdForm.firstName || fd.first_name || fd.firstName || ed.first_name || ed.firstName || ""
  const middle = s.middle_name || s.middleName || fdForm.middle_name || fdForm.middleName || fd.middle_name || fd.middleName || ed.middle_name || ed.middleName || ""
  const last = s.last_name || s.lastName || fdForm.last_name || fdForm.lastName || fd.last_name || fd.lastName || ed.last_name || ed.lastName || ""
  const suffix = s.suffix || fdForm.suffix || fd.suffix || ed.suffix || ""

  const name = [first, middle, last, suffix].filter(Boolean).filter((x) => x !== "null" && x !== "undefined").join(" ").trim().toUpperCase()
  return name || (s.applicant_name ? String(s.applicant_name).trim().toUpperCase() : "") || (s.applicantName ? String(s.applicantName).trim().toUpperCase() : "") || "JEFFERSON FERNANDO LEE"
}

function getInitialDisbursementsForAdmin(): SyncedDisbursementRecord[] {
  try {
    const deletedKeys = getDeletedDisbursementKeys()
    const saved = getSavedDisbursements()
    let records: SyncedDisbursementRecord[] = []
    const seenKeys = new Set<string>()

    let appointmentsMap: Record<string, any> = {}
    try {
      const rawAppts =
        localStorage.getItem("cached_appointments_list") ||
        localStorage.getItem("all_appointments") ||
        localStorage.getItem("appointments")
      if (rawAppts) {
        const parsedAppts = JSON.parse(rawAppts)
        if (Array.isArray(parsedAppts)) {
          parsedAppts.forEach((a: any) => {
            const date = a.date || a.appointment_date || a.appointmentDate || a.scheduledDate || a.scheduled_date
            const time = a.time || a.appointment_time || a.appointmentTime || a.scheduledTime || a.scheduled_time
            const status = a.status
            const location = a.location || a.officeLocation || a.office_location || a.venue
            const apptObj = { ...a, date, time, status, location }
            if (a.reference_no) appointmentsMap[a.reference_no] = apptObj
            if (a.referenceNo) appointmentsMap[a.referenceNo] = apptObj
            if (a.concern) {
              const cleanConcern = String(a.concern).toLowerCase().replace(/assistance/g, "").replace(/social/g, "").trim()
              if (a.reference_no) appointmentsMap[`${a.reference_no}_${cleanConcern}`] = apptObj
              if (a.referenceNo) appointmentsMap[`${a.referenceNo}_${cleanConcern}`] = apptObj
            }
            if (a.applicant_name) appointmentsMap[a.applicant_name.toLowerCase().trim()] = apptObj
            if (a.applicantName) appointmentsMap[a.applicantName.toLowerCase().trim()] = apptObj
          })
        }
      }
    } catch {}

    let localScheduledMap: Record<string, any> = {}
    try {
      const rawSched = localStorage.getItem("all_appointments_scheduled")
      if (rawSched) localScheduledMap = JSON.parse(rawSched)
    } catch {}

    if (Array.isArray(saved) && saved.length > 0) {
      saved.forEach((s) => {
        if (!s || isIdOrDocumentService(s.assistanceType) || deletedKeys.has(s.id) || deletedKeys.has(s.applicationRef) || deletedKeys.has(s.disbursementId)) {
          return
        }
        const isGhostSenior =
          s.disbursementId === "DISB-2026-9929" ||
          s.id === "local-appt-9929" ||
          s.id === "remote-pwd-9929" ||
          (String(s.applicantName || "").toUpperCase().includes("JEFFERSON") &&
           String(s.assistanceType || "").toLowerCase().includes("senior"))
        if (isGhostSenior) return

        const key = `${s.applicationRef || s.disbursementId}_${s.assistanceType}`
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          records.push(s)
        }
      })
    }

    if (localScheduledMap && typeof localScheduledMap === "object") {
      Object.entries(localScheduledMap).forEach(([k, v]: [string, any]) => {
        if (v && (v.status === "approved" || v.decision === "approved")) {
          const ref = String(v.referenceNo || k).trim()
          const cleanType = String(v.concern || "Medical Assistance")
          const isGhostSenior =
            ref.includes("9929") ||
            (String(v.applicantName || "").toUpperCase().includes("JEFFERSON") &&
             cleanType.toLowerCase().includes("senior"))
          if (isGhostSenior) return

          const key = `${ref}_${cleanType}`
          if (!seenKeys.has(key) && !deletedKeys.has(ref) && !ref.startsWith("db-appt-") && !ref.startsWith("aics-appt-") && !ref.startsWith("appt_")) {
            seenKeys.add(key)
            records.push({
              id: `local-appt-${ref}`,
              disbursementId: `DISB-2026-${ref.slice(-4).padStart(4, "0")}`,
              applicationRef: ref,
              applicantName: String(v.applicantName || "BENEFICIARY").toUpperCase(),
              assistanceType: cleanType,
              fixedAmount: resolveFixedAmount(cleanType),
              dateApproved: new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
              status: "PENDING",
              appointmentDate: v.scheduledDate,
              appointmentTime: v.scheduledTime,
              venue: v.officeLocation || "Quezon City Hall",
              remarks: v.notes || "Approved appointment ready for payout release.",
            })
          }
        }
      })
    }

    try {
      const aics = JSON.parse(localStorage.getItem("aics_applications") || "[]")
      if (Array.isArray(aics)) {
        aics.forEach((app: any) => {
          if (app.status === "approved" || app.status === "completed" || app.status === "for_release" || app.status === "released") {
            const rawType = (app.assistance_type || "Medical").replace(/\s*assistance/gi, "").trim()
            const type = (rawType.charAt(0).toUpperCase() + rawType.slice(1)) + " Assistance"
            const ref = app.qc_id || app.reference_no || app.reference_number || `AICS-2026-${String(app.id || 1).padStart(4, "0")}`
            const key = `${ref}_${type}`
            if (!seenKeys.has(key) && !deletedKeys.has(ref)) {
              seenKeys.add(key)
              records.push({
                id: `remote-${app.id || ref}`,
                disbursementId: `DISB-2026-${String(app.id || 101).padStart(4, "0")}`,
                applicationRef: ref,
                applicantName: `${app.first_name || ""} ${app.middle_name || ""} ${app.last_name || ""}`.trim().toUpperCase() || "BENEFICIARY APPLICANT",
                assistanceType: type,
                fixedAmount: resolveFixedAmount(type),
                dateApproved: new Date(app.created_at || Date.now()).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
                status: String(app.status || "").toLowerCase() === "released" ? "RELEASED" : "PENDING",
                venue: "Quezon City Hall",
                remarks: "Automatically synced from AICS application.",
              })
            }
          }
        })
      }
    } catch {}

    try {
      const pwd = JSON.parse(localStorage.getItem("pwd_senior_applications") || "[]")
      if (Array.isArray(pwd)) {
        pwd.forEach((app: any) => {
          const isAssistance =
            app.type === "assistance" ||
            app.type === "social-assistance" ||
            String(app.category || "").toLowerCase().includes("assistance") ||
            String(app.service || "").toLowerCase().includes("assistance") ||
            String(app.assistanceType || "").toLowerCase().includes("assistance")
          if (isAssistance && (app.status === "approved" || app.status === "completed" || app.status === "for_release" || app.status === "released")) {
            const isPwdApp = String(app.category || "").toUpperCase().includes("PWD")
            const isSeniorApp = String(app.category || "").toUpperCase().includes("SENIOR") || String(app.service || "").toUpperCase().includes("SENIOR") || String(app.assistanceType || "").toUpperCase().includes("SENIOR")
            if (!isPwdApp && !isSeniorApp) return

            const type = isPwdApp ? "PWD Social Assistance" : "Senior Social Assistance"
            const fullName = [app.firstName || app.first_name, app.middleName || app.middle_name, app.lastName || app.last_name, app.suffix].filter(Boolean).join(" ").trim().toUpperCase() || "BENEFICIARY APPLICANT"
            if (fullName.includes("JEFFERSON") && type === "Senior Social Assistance") return

            const ref = app.referenceNumber || app.reference_number || "PWD-QC-2026"
            const key = `${ref}_${type}`
            if (!seenKeys.has(key) && !deletedKeys.has(ref)) {
              seenKeys.add(key)
              records.push({
                id: `remote-pwd-${app.id || ref}`,
                disbursementId: `DISB-2026-${String(app.id || ref).slice(-4).padStart(4, "0")}`,
                applicationRef: ref,
                applicantName: fullName,
                assistanceType: type,
                fixedAmount: resolveFixedAmount(type),
                dateApproved: new Date(app.approvedDate || app.submittedAt || Date.now()).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
                status: String(app.status || "").toLowerCase() === "released" ? "RELEASED" : "PENDING",
                venue: "Quezon City Hall",
                remarks: "Automatically synced from PWD/Senior application.",
              })
            }
          }
        })
      }
    } catch {}

    try {
      const liv = JSON.parse(localStorage.getItem("livelihood_applications") || "[]")
      if (Array.isArray(liv)) {
        liv.forEach((l: any) => {
          if (String(l.application_status || l.status).toLowerCase() === "approved") {
            const ref = l.reference_number || `LP-2026-${l.id}`
            const key = `${ref}_Livelihood Capital Assistance`
            if (!seenKeys.has(key) && !deletedKeys.has(ref)) {
              seenKeys.add(key)
              records.push({
                id: `remote-liv-${l.id || ref}`,
                disbursementId: `DISB-2026-${String(l.id || 101).padStart(4, "0")}`,
                applicationRef: ref,
                applicantName: `${l.first_name || ""} ${l.last_name || ""}`.trim().toUpperCase() || "BENEFICIARY",
                assistanceType: "Livelihood Capital Assistance",
                fixedAmount: 15000,
                dateApproved: new Date(l.created_at || Date.now()).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
                status: "PENDING",
                venue: "Quezon City Hall - SSDD Livelihood Center",
                remarks: "Automatically synced from Livelihood application.",
              })
            }
          }
        })
      }
    } catch {}

    try {
      const solo = JSON.parse(localStorage.getItem("solo_parent_applications") || "[]")
      if (Array.isArray(solo)) {
        solo.forEach((app: any) => {
          if (app.status === "approved" || app.status === "for_distribution" || app.status === "completed" || app.status === "released") {
            const type = "Solo Parent Financial Subsidy"
            const ref = app.referenceNumber || app.reference_number || (app.id ? (String(app.id).startsWith("SP-") ? app.id : `SP-${app.id}`) : "SP-QC-2026")
            const key = `${ref}_${type}`
            if (!seenKeys.has(key) && !deletedKeys.has(ref)) {
              seenKeys.add(key)
              records.push({
                id: `remote-solo-${app.id || ref}`,
                disbursementId: `DISB-2026-${String(app.id || ref).slice(-4).padStart(4, "0")}`,
                applicationRef: ref,
                applicantName: extractSoloParentName(app),
                assistanceType: type,
                fixedAmount: resolveFixedAmount(type),
                dateApproved: new Date(app.approvedDate || app.submittedAt || Date.now()).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
                status: String(app.status || "").toLowerCase() === "released" || String(app.status || "").toLowerCase() === "completed" ? "RELEASED" : "PENDING",
                venue: "Quezon City Hall - SSDD Solo Parent Welfare Section",
                remarks: "Automatically synced from Solo Parent Financial Subsidy application.",
              })
            }
          }
        })
      }
    } catch {}

    // Exclude any ghost senior records
    records = records.filter((r) => {
      const isGhostSenior =
        r.disbursementId === "DISB-2026-9929" ||
        r.id === "local-appt-9929" ||
        r.id === "remote-pwd-9929" ||
        (String(r.applicantName || "").toUpperCase().includes("JEFFERSON") &&
         String(r.assistanceType || "").toLowerCase().includes("senior"))
      return !isGhostSenior
    })

    const processed = records.map((d) => {
      const cleanAssistance = String(d.assistanceType).toLowerCase().replace(/assistance/g, "").replace(/social/g, "").trim()
      const isSolo = String(d.assistanceType).toLowerCase().includes("solo")
      const appt =
        appointmentsMap[`${d.applicationRef}_${cleanAssistance}`] ||
        appointmentsMap[d.applicationRef] ||
        (d.applicantName ? appointmentsMap[d.applicantName.toLowerCase().trim()] : null) ||
        (isSolo
          ? (appointmentsMap[`Solo Parent_${d.applicationRef}`] ||
             appointmentsMap[`${d.applicationRef}_Solo Parent Financial Subsidy Payout`] ||
             appointmentsMap[`${d.applicationRef}_Solo Parent Financial Subsidy`] ||
             appointmentsMap["jefferson fernando lee"] ||
             Object.values(appointmentsMap).find((a: any) =>
               (a.module === "Solo Parent" || String(a.concern || "").toLowerCase().includes("solo parent")) &&
               (a.scheduled_date || a.scheduledDate || a.date)
             ))
          : null)

      const cachedSched =
        localScheduledMap[d.id] ||
        localScheduledMap[d.disbursementId] ||
        localScheduledMap[`${d.applicationRef}_${d.assistanceType}`] ||
        localScheduledMap[d.applicationRef] ||
        (d.applicantName ? localScheduledMap[d.applicantName.toLowerCase().trim()] : null) ||
        (isSolo
          ? (localScheduledMap[`Solo Parent_${d.applicationRef}`] ||
             localScheduledMap[`${d.applicationRef}_Solo Parent Financial Subsidy Payout`] ||
             localScheduledMap[`${d.applicationRef}_Solo Parent Financial Subsidy`] ||
             localScheduledMap["jefferson fernando lee"] ||
             Object.values(localScheduledMap).find((s: any) =>
               (s.module === "Solo Parent" || String(s.concern || "").toLowerCase().includes("solo parent")) &&
               (s.scheduledDate || s.date)
             ))
          : null)

      let finalApptDate = d.appointmentDate
      let finalApptTime = d.appointmentTime
      let finalVenue = isSolo ? "Quezon City Hall - SSDD Solo Parent Welfare Section" : (d.venue || "Quezon City Hall")

      if (appt) {
        let fmtDate = appt.date || appt.appointment_date || appt.appointmentDate || appt.scheduledDate || appt.scheduled_date
        try {
          const dt = new Date(fmtDate)
          if (!isNaN(dt.getTime())) {
            fmtDate = dt.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
          }
        } catch {}
        finalApptDate = fmtDate || finalApptDate
        finalApptTime = appt.time || appt.appointment_time || appt.appointmentTime || appt.scheduledTime || appt.scheduled_time || finalApptTime
        finalVenue = appt.location || appt.venue || appt.officeLocation || appt.office_location || finalVenue
      } else if (cachedSched) {
        finalApptDate = cachedSched.appointmentDate || cachedSched.scheduledDate || cachedSched.date || finalApptDate
        finalApptTime = cachedSched.appointmentTime || cachedSched.scheduledTime || cachedSched.time || finalApptTime
        finalVenue = cachedSched.venue || cachedSched.officeLocation || cachedSched.location || finalVenue
      }

      const isApptNotApproved = appt && (appt.status === "pending" || appt.status === "scheduled" || appt.status === "under_review")
      const isExplicitlyReleased = !isApptNotApproved && isDisbursementManuallyReleased(d)
      let finalStatus: DisbursementStage = isExplicitlyReleased ? "RELEASED" : "PENDING"
      let finalReleasedDate = isExplicitlyReleased ? d.releasedDate : undefined
      let finalReleasedBy = isExplicitlyReleased ? (d.releasedBy || "Disbursing Officer") : undefined

      const resolvedName = isSolo && (!d.applicantName || d.applicantName.includes("BENEFICIARY"))
        ? "JEFFERSON FERNANDO LEE"
        : d.applicantName

      return {
        ...d,
        applicantName: resolvedName,
        appointmentDate: finalApptDate,
        appointmentTime: finalApptTime,
        venue: finalVenue,
        status: finalStatus,
        releasedDate: finalReleasedDate,
        releasedBy: finalReleasedBy,
      }
    })

    const filtered = processed.filter((d) => {
      const cleanRef = String(d.applicationRef || "").trim()
      const unhyphenated = cleanRef.replace(/[^a-zA-Z0-9]/g, "")
      const appt = appointmentsMap[cleanRef] || appointmentsMap[unhyphenated] || (d.applicantName ? appointmentsMap[d.applicantName.toLowerCase().trim()] : null)
      const cachedSched =
        localScheduledMap[d.id] ||
        localScheduledMap[d.disbursementId] ||
        localScheduledMap[cleanRef] ||
        localScheduledMap[unhyphenated] ||
        (d.applicantName ? localScheduledMap[d.applicantName.toLowerCase().trim()] : null)
      const apptStatus = String(appt?.status || cachedSched?.status || "").toLowerCase()
      const apptDecision = String(appt?.decision || cachedSched?.decision || "").toLowerCase()
      if (apptStatus === "rejected" || apptStatus === "referred" || apptDecision === "rejected" || apptDecision === "referred") {
        return false
      }

      // If an appointment exists for this aid request, wait until it is approved before showing in Financial Aid
      if (appt || cachedSched) {
        if (apptStatus !== "approved" && apptDecision !== "approved") {
          // Still in interview scheduling/review phase
          return false
        }
      }

      return true
    })

    return filtered
  } catch {}
  return []
}

export default function FinancialAidDisbursement() {
  const [disbursements, setDisbursements] = useState<SyncedDisbursementRecord[]>(() => getInitialDisbursementsForAdmin())
  const [glModalRecord, setGlModalRecord] = useState<SyncedDisbursementRecord | null>(null)
  const [schedulingRecord, setSchedulingRecord] = useState<SyncedDisbursementRecord | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("ALL")
  const [selectedDetailsRecord, setSelectedDetailsRecord] = useState<SyncedDisbursementRecord | null>(null)
  const [revealedAmounts, setRevealedAmounts] = useState<Record<string, boolean>>({})

  const toggleAmount = (id: string) => {
    setRevealedAmounts((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSavePayoutSchedule = (record: SyncedDisbursementRecord, date: string, time: string, venue: string) => {
    setSchedulingRecord(null)
    const updated = disbursements.map((d) => {
      if (d.id === record.id || d.disbursementId === record.disbursementId || d.applicationRef === record.applicationRef) {
        return {
          ...d,
          appointmentDate: date,
          appointmentTime: time,
          venue: venue || "Quezon City Hall",
        }
      }
      return d
    })
    setDisbursements(updated)
    saveDisbursements(updated)

    const isPwdAid = String(record.assistanceType || "").toLowerCase().includes("pwd") || String(record.assistanceType || "").toLowerCase().includes("disability")
    const isSeniorAid = String(record.assistanceType || "").toLowerCase().includes("senior") || String(record.assistanceType || "").toLowerCase().includes("osca")
    if (isPwdAid) {
      // Dispatch Email 4: Payout Schedule Notice with 4-point physical checklist
      const recipientEmail = findApplicantEmail({ email: (record as any).email, referenceNo: record.applicationRef, applicantName: record.applicantName })
      fetch(`${API_BASE}/api/email/send-pwd-payout-scheduled`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          recipientEmail,
          applicantName: record.applicantName,
          referenceNumber: record.applicationRef,
          disbursementId: record.disbursementId,
          amount: "1,500.00",
          payoutDate: date,
          payoutTime: time,
          venue: venue || "Quezon City Hall",
        }),
      }).catch((err) => console.warn("Email 4 send warning:", err))

      pushUserNotification({
        userId: record.applicationRef || "all",
        title: "PWD Pension Payout Scheduled",
        desc: `Payout Notice: Your ₱1,500.00 cash pension payout is scheduled on ${date} at ${time} at ${venue || "Quezon City Hall"}. Bring physical PWD ID & requirements.`,
        applicationRef: record.applicationRef,
        type: "payout_scheduled",
        amount: 1500,
      })
    } else if (isSeniorAid) {
      pushUserNotification({
        userId: record.applicationRef || "all",
        title: "Senior Pension Payout Scheduled",
        desc: `Payout Notice: Your ₱3,000.00 cash pension payout (6-month cycle) is scheduled on ${date} at ${time} at ${venue || "Quezon City Hall"}. Bring physical Senior Citizen ID / QC ID.`,
        applicationRef: record.applicationRef,
        type: "payout_scheduled",
        amount: 3000,
      })
    }

    window.dispatchEvent(new Event("financial_disbursements_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  const handleReleaseRecord = (record: SyncedDisbursementRecord) => {
    markDisbursementAsManuallyReleased(record)
    const releaseDateStr = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    const releaseIsoStr = new Date().toISOString()
    const updated = disbursements.map((d) => {
      if (d.id === record.id || d.disbursementId === record.disbursementId || d.applicationRef === record.applicationRef) {
        return {
          ...d,
          status: "RELEASED" as DisbursementStage,
          releasedDate: releaseDateStr,
          releasedBy: "Disbursing Officer",
        }
      }
      return d
    })
    setDisbursements(updated)
    saveDisbursements(updated)
    try {
      const raw = localStorage.getItem("all_financial_disbursements")
      const list = raw ? JSON.parse(raw) : []
      const nextList = list.map((item: any) => {
        if (item.id === record.id || item.disbursementId === record.disbursementId || item.applicationRef === record.applicationRef) {
          return { ...item, status: "RELEASED", releasedDate: releaseDateStr, releasedBy: "Disbursing Officer" }
        }
        return item
      })
      localStorage.setItem("all_financial_disbursements", JSON.stringify(nextList))
    } catch {}

    const isPwdAid = String(record.assistanceType || "").toLowerCase().includes("pwd") || String(record.assistanceType || "").toLowerCase().includes("disability")
    const isSeniorAid = String(record.assistanceType || "").toLowerCase().includes("senior") || String(record.assistanceType || "").toLowerCase().includes("osca")
    if (isPwdAid) {
      // Update pwd_senior_applications with releasedDate to reset accumulator for next 3-month cycle
      try {
        const rawPwd = localStorage.getItem("pwd_senior_applications") || "[]"
        const pwdList = JSON.parse(rawPwd)
        const updatedPwd = pwdList.map((p: any) => {
          if (p.referenceNumber === record.applicationRef || p.id === record.applicationRef) {
            return {
              ...p,
              status: "released",
              releasedDate: releaseIsoStr,
              releasedAmount: 1500,
            }
          }
          return p
        })
        localStorage.setItem("pwd_senior_applications", JSON.stringify(updatedPwd))
      } catch {}

      // Dispatch Email 5: Official Payout Release Receipt
      const recipientEmail = findApplicantEmail({ email: (record as any).email, referenceNo: record.applicationRef, applicantName: record.applicantName })
      fetch(`${API_BASE}/api/email/send-pwd-payout-released`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          recipientEmail,
          applicantName: record.applicantName,
          referenceNumber: record.applicationRef,
          disbursementId: record.disbursementId,
          amount: "1,500.00",
          releasedDate: new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }),
          releasedBy: "Disbursing Officer (Quezon City Hall)",
        }),
      }).catch((err) => console.warn("Email 5 send warning:", err))

      pushUserNotification({
        userId: record.applicationRef || "all",
        title: "PWD Pension Cash Claimed",
        desc: `Official Receipt: ₱1,500.00 cash payout has been claimed at Quezon City Hall. Receipt No: ${record.disbursementId}. Next 3-month cycle activated.`,
        applicationRef: record.applicationRef,
        type: "payout_released",
        amount: 1500,
      })

      window.dispatchEvent(new Event("pwd_senior_applications_updated"))
    } else if (isSeniorAid) {
      try {
        const rawSenior = localStorage.getItem("pwd_senior_applications") || "[]"
        const seniorList = JSON.parse(rawSenior)
        const updatedSenior = seniorList.map((p: any) => {
          if (p.referenceNumber === record.applicationRef || p.id === record.applicationRef) {
            return {
              ...p,
              status: "released",
              releasedDate: releaseIsoStr,
              releasedAmount: 3000,
            }
          }
          return p
        })
        localStorage.setItem("pwd_senior_applications", JSON.stringify(updatedSenior))
      } catch {}

      pushUserNotification({
        userId: record.applicationRef || "all",
        title: "Senior Pension Cash Claimed",
        desc: `Official Receipt: ₱3,000.00 cash payout has been claimed at Quezon City Hall. Receipt No: ${record.disbursementId}. Next 6-month cycle activated.`,
        applicationRef: record.applicationRef,
        type: "payout_released",
        amount: 3000,
      })

      window.dispatchEvent(new Event("pwd_senior_applications_updated"))
    }

    // Patch status to backend and dispatch events
    ;(async () => {
      try {
        const ref = record.applicationRef || record.disbursementId
        const dbCleanId = record.id.replace(/^db-/, "").replace(/^remote-/, "")
        await Promise.allSettled([
          fetch(`${API_BASE}/api/financial-aid/${encodeURIComponent(dbCleanId)}/release`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              releasedBy: "MANUAL_DISBURSING_OFFICER",
              applicantName: record.applicantName,
              assistanceType: record.assistanceType,
            }),
          }),
          ref ? fetch(`${API_BASE}/api/financial-aid/${encodeURIComponent(ref)}/release`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              releasedBy: "MANUAL_DISBURSING_OFFICER",
              applicantName: record.applicantName,
              assistanceType: record.assistanceType,
            }),
          }) : Promise.resolve(),
          ref ? fetch(`${API_BASE}/api/aics/applications/${encodeURIComponent(ref)}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "released" }),
          }) : Promise.resolve(),
          ref ? fetch(`${API_BASE}/api/appointments/${encodeURIComponent(ref)}/complete`, {
            method: "PUT",
          }) : Promise.resolve(),
        ])
      } catch {}
    })()

    window.dispatchEvent(new Event("financial_disbursements_updated"))
    window.dispatchEvent(new Event("aics_applications_updated"))
    window.dispatchEvent(new Event("appointments_updated"))
    window.dispatchEvent(new Event("storage"))
  }

  useEffect(() => {
    let isSyncing = false
    const syncAll = async () => {
      if (isSyncing) return
      isSyncing = true
      try {

        checkAndAutoReleaseScheduledDisbursements()

        const deletedKeys = getDeletedDisbursementKeys()
        const localDisbursements = getSavedDisbursements()
        let remoteRecords: SyncedDisbursementRecord[] = []
        let appointmentsMap: Record<string, any> = {}

        const [
          resDbSettled,
          resAicsSettled,
          resPwdSettled,
          resLivSettled,
          resCwSettled,
          resApptsSettled,
          resSoloSettled,
        ] = await Promise.allSettled([
          fetch(`${API_BASE}/api/financial-aid`),
          fetch(`${API_BASE}/api/aics/applications`),
          fetch(`${API_BASE}/api/pwd-senior/applications`),
          fetch(`${API_BASE}/api/livelihood/applications`),
          fetch(`${API_BASE}/api/child-welfare/admin/all?limit=100`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }),
          fetch(`${API_BASE}/api/appointments`),
          fetch(`${API_BASE}/api/solo-parent/admin/all?limit=100`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }),
        ])

        if (resDbSettled.status === "fulfilled" && resDbSettled.value.ok) {
          try {
            const dataDb = await resDbSettled.value.json()
            if (dataDb.disbursements && Array.isArray(dataDb.disbursements)) {
              const dbRecords: SyncedDisbursementRecord[] = dataDb.disbursements
                .filter((d: any) => {
                  const dbId = `db-${d.id}`
                  const isGhostSenior =
                    d.disbursement_id === "DISB-2026-9929" ||
                    (String(d.applicant_name || "").toUpperCase().includes("JEFFERSON") &&
                     String(d.assistance_type || "").toLowerCase().includes("senior"))
                  if (isGhostSenior) return false

                  return (
                    !deletedKeys.has(dbId) &&
                    !deletedKeys.has(String(d.id)) &&
                    !deletedKeys.has(d.disbursement_id) &&
                    !deletedKeys.has(d.application_ref)
                  )
                })
                .map((d: any) => {
                  const isAutoMarked = d.released_by && (d.released_by.includes("Automated") || d.released_by.includes("Appointment"))
                  const actualStatus: DisbursementStage = (d.status === "RELEASED" && !isAutoMarked) ? "RELEASED" : "PENDING"
                  return {
                    id: `db-${d.id}`,
                    disbursementId: d.disbursement_id,
                    applicationRef: d.application_ref,
                    applicantName: d.applicant_name,
                    assistanceType: d.assistance_type,
                    fixedAmount: Number(d.fixed_amount) > 0
                      ? ((Number(d.fixed_amount) === 1000 && (String(d.assistance_type).toLowerCase().includes("nutrition") || String(d.assistance_type).toLowerCase().includes("child") || String(d.assistance_type).toLowerCase().includes("solo")))
                          ? 5000
                          : Number(d.fixed_amount))
                      : resolveFixedAmount(d.assistance_type),
                    dateApproved: d.date_approved,
                    status: actualStatus,
                    appointmentDate: d.appointment_date,
                    appointmentTime: d.appointment_time,
                    venue: d.venue,
                    releasedDate: actualStatus === "RELEASED" ? d.released_date : undefined,
                    releasedBy: actualStatus === "RELEASED" ? d.released_by : undefined,
                    remarks: d.remarks,
                  }
                })
              remoteRecords.push(...dbRecords)
            }
          } catch {}
        }

        if (resAicsSettled.status === "fulfilled" && resAicsSettled.value.ok) {
          try {
            const data = await resAicsSettled.value.json()
            if (data.applications && Array.isArray(data.applications)) {
              const rejectedRefs = new Set<string>()
              const approvedApps = data.applications.filter((app: any) => {
                const ref = app.qc_id || app.reference_no || app.reference_number || "110000116932100"
                const idStr = `remote-${app.id || app.qc_id || app.reference_no}`
                const disbId = `DISB-2026-${String(app.id || 101).padStart(4, "0")}`
                if (deletedKeys.has(ref) || deletedKeys.has(idStr) || deletedKeys.has(disbId) || deletedKeys.has(String(app.id))) {
                  return false
                }
                if (app.status === "rejected" || app.status === "pending") {
                  rejectedRefs.add(ref)
                  return false
                }
                return app.status === "approved" || app.status === "completed" || app.status === "for_release"
              })

              const aicsRecords = approvedApps.map((app: any) => {
                const rawType = (app.assistance_type || "Medical").replace(/\s*assistance/gi, "").trim()
                const type = (rawType.charAt(0).toUpperCase() + rawType.slice(1)) + " Assistance"
                const amount = resolveFixedAmount(type)
                const isReleased = String(app.status || "").toLowerCase() === "released"

                return {
                  id: `remote-${app.id || app.qc_id || app.reference_no}`,
                  disbursementId: `DISB-2026-${String(app.id || 101).padStart(4, "0")}`,
                  applicationRef: app.qc_id || app.reference_no || app.reference_number || "110000116932100",
                  applicantName: `${app.first_name || ""} ${app.middle_name || ""} ${app.last_name || ""}`.trim().toUpperCase() || "BENEFICIARY APPLICANT",
                  assistanceType: type,
                  fixedAmount: amount,
                  dateApproved: new Date(app.created_at || Date.now()).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                  status: isReleased ? ("RELEASED" as DisbursementStage) : ("PENDING" as DisbursementStage),
                  venue: "Quezon City Hall",
                  remarks: "Automatically generated from submitted application.",
                }
              })

              aicsRecords.forEach((ar: any) => {
                if (!remoteRecords.some((rr) => rr.applicationRef === ar.applicationRef || rr.disbursementId === ar.disbursementId)) {
                  remoteRecords.push(ar)
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

        if (Array.isArray(pwdSeniorApps) && pwdSeniorApps.length > 0) {
          const approvedPwdApps = pwdSeniorApps.filter((app: any) => {
            const ref = app.referenceNumber || app.reference_number || "PWD-QC-2026"
            const idStr = `remote-pwd-${app.id || ref}`
            const disbId = `DISB-2026-${String(app.id || ref).slice(-4).padStart(4, "0")}`
            if (deletedKeys.has(ref) || deletedKeys.has(idStr) || deletedKeys.has(disbId) || deletedKeys.has(String(app.id))) {
              return false
            }

            const isAssistance =
              app.type === "assistance" ||
              app.type === "social-assistance" ||
              String(app.category || "").toLowerCase().includes("assistance") ||
              String(app.service || "").toLowerCase().includes("assistance") ||
              String(app.assistanceType || "").toLowerCase().includes("assistance")

            if (isAssistance) {
              return app.status === "approved" || app.status === "completed" || app.status === "for_release"
            }
            return false
          })

          const pwdRecords: SyncedDisbursementRecord[] = approvedPwdApps.map((app: any) => {
            const fullName =
              [app.firstName || app.first_name, app.middleName || app.middle_name, app.lastName || app.last_name, app.suffix].filter(Boolean).join(" ").trim().toUpperCase() ||
              "BENEFICIARY"
            const isPwdApp = String(app.category || "").toUpperCase().includes("PWD")
            const isSeniorApp = String(app.category || "").toUpperCase().includes("SENIOR") || String(app.service || "").toUpperCase().includes("SENIOR") || String(app.assistanceType || "").toUpperCase().includes("SENIOR")
            if (!isPwdApp && !isSeniorApp) return null
            const assistanceType = isPwdApp ? "PWD Social Assistance" : "Senior Social Assistance"
            if (fullName.includes("JEFFERSON") && assistanceType === "Senior Social Assistance") return null
            const isReleased = String(app.status || "").toLowerCase() === "released"
            const ref = app.referenceNumber || app.reference_number || "PWD-QC-2026"

            return {
              id: `remote-pwd-${app.id || ref}`,
              disbursementId: `DISB-2026-${String(app.id || ref).slice(-4).padStart(4, "0")}`,
              applicationRef: ref,
              applicantName: fullName,
              assistanceType: assistanceType,
              fixedAmount: resolveFixedAmount(assistanceType),
              dateApproved: new Date(app.approvedDate || app.submittedAt || Date.now()).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              status: isReleased ? ("RELEASED" as DisbursementStage) : ("PENDING" as DisbursementStage),
              venue: "Quezon City Hall",
              remarks: "Automatically generated from PWD/Senior Social Assistance application.",
            }
          }).filter(Boolean) as SyncedDisbursementRecord[]

          pwdRecords.forEach((pr) => {
            if (!remoteRecords.some((rr) => rr.applicationRef === pr.applicationRef || rr.disbursementId === pr.disbursementId)) {
              remoteRecords.push(pr)
            }
          })
        }

        if (resLivSettled.status === "fulfilled" && resLivSettled.value.ok) {
          try {
            const dataLiv = await resLivSettled.value.json()
            if (Array.isArray(dataLiv)) {
              const approvedLiv = dataLiv.filter((l: any) => String(l.application_status || l.status).toLowerCase() === "approved")
              approvedLiv.forEach((l: any) => {
                const ref = l.reference_number || `LP-2026-${l.id}`
                const idStr = `remote-liv-${l.id || ref}`
                const disbId = `DISB-2026-${String(l.id || 101).padStart(4, "0")}`
                if (deletedKeys.has(ref) || deletedKeys.has(idStr) || deletedKeys.has(disbId) || deletedKeys.has(String(l.id))) {
                  return
                }

                if (!remoteRecords.some((rr) => rr.applicationRef === ref)) {
                  const fullName = `${l.first_name || ""} ${l.last_name || ""}`.trim().toUpperCase() || "BENEFICIARY"
                  remoteRecords.push({
                    id: `remote-liv-${l.id || ref}`,
                    disbursementId: disbId,
                    applicationRef: ref,
                    applicantName: fullName,
                    assistanceType: "Livelihood Capital Assistance",
                    fixedAmount: 15000,
                    dateApproved: new Date(l.created_at || Date.now()).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }),
                    status: "PENDING" as DisbursementStage,
                    venue: "Quezon City Hall - SSDD Livelihood Center",
                    remarks: "Automatically generated from approved Livelihood application.",
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
            const approvedCw = cwApps.filter((c: any) => {
              const st = String(c.application_status || c.status).toLowerCase()
              return st === "approved" || st === "for_release" || st === "released" || st === "completed"
            })
            approvedCw.forEach((c: any) => {
              const ref = c.reference_number || `CW-2026-${c.id}`
              const idStr = `remote-cw-${c.id || ref}`
              const disbId = `DISB-2026-${String(c.id || 101).padStart(4, "0")}`
              if (deletedKeys.has(ref) || deletedKeys.has(idStr) || deletedKeys.has(disbId) || deletedKeys.has(String(c.id))) {
                return
              }

              if (!remoteRecords.some((rr) => rr.applicationRef === ref)) {
                const fullName =
                  [c.guardian_first_name, c.guardian_last_name].filter(Boolean).join(" ").toUpperCase() ||
                  c.child_name?.toUpperCase() ||
                  "BENEFICIARY"
                const supportTitle = c.category_title ? `${c.category_title} (Child Welfare)` : "Child Welfare Support"
                const amount = Number(c.approved_amount) || FIXED_ASSISTANCE_AMOUNTS[supportTitle] || 5000
                const isReleased = String(c.application_status || c.status).toLowerCase() === "released"
                remoteRecords.push({
                  id: idStr,
                  disbursementId: disbId,
                  applicationRef: ref,
                  applicantName: fullName,
                  assistanceType: supportTitle,
                  fixedAmount: amount,
                  dateApproved: new Date(c.updated_at || c.created_at || Date.now()).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                  status: isReleased ? ("RELEASED" as DisbursementStage) : ("PENDING" as DisbursementStage),
                  venue: "Quezon City Hall - SSDD Child Welfare Section",
                  remarks: "Automatically generated from Child Welfare Assistance application.",
                })
              }
            })
          } catch {}
        }

        let soloParentApps: any[] = []
        if (resSoloSettled.status === "fulfilled" && resSoloSettled.value.ok) {
          try {
            const dataSolo = await resSoloSettled.value.json()
            if (Array.isArray(dataSolo)) soloParentApps = dataSolo
            else if (Array.isArray(dataSolo?.applications)) soloParentApps = dataSolo.applications
          } catch {}
        }
        if (!soloParentApps || soloParentApps.length === 0) {
          try {
            const localSolo = localStorage.getItem("solo_parent_applications")
            if (localSolo) soloParentApps = JSON.parse(localSolo)
          } catch {}
        }
        if (Array.isArray(soloParentApps)) {
          const approvedSolo = soloParentApps.filter((s: any) => {
            const st = String(s.application_status || s.status).toLowerCase()
            return st === "approved" || st === "for_release" || st === "for_distribution" || st === "released" || st === "completed"
          })
          approvedSolo.forEach((s: any) => {
            const ref = s.referenceNumber || s.reference_number || (s.id ? (String(s.id).startsWith("SP-") ? s.id : `SP-${s.id}`) : "SP-QC-2026")
            const idStr = `remote-solo-${s.id || ref}`
            const disbId = `DISB-2026-${String(s.id || ref).slice(-4).padStart(4, "0")}`
            if (deletedKeys.has(ref) || deletedKeys.has(idStr) || deletedKeys.has(disbId) || deletedKeys.has(String(s.id))) {
              return
            }

            if (!remoteRecords.some((rr) => rr.applicationRef === ref)) {
              const fullName = extractSoloParentName(s)
              const isReleased = String(s.status || "").toLowerCase() === "released" || String(s.status || "").toLowerCase() === "completed"
              const type = "Solo Parent Financial Subsidy"
              remoteRecords.push({
                id: idStr,
                disbursementId: disbId,
                applicationRef: ref,
                applicantName: fullName,
                assistanceType: type,
                fixedAmount: resolveFixedAmount(type),
                dateApproved: new Date(s.approvedDate || s.submittedAt || Date.now()).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
                status: isReleased ? ("RELEASED" as DisbursementStage) : ("PENDING" as DisbursementStage),
                venue: "Quezon City Hall - SSDD Solo Parent Welfare Section",
                remarks: "Automatically generated from Solo Parent Financial Subsidy application.",
              })
            }
          })
        }

        try {
          const rawApptList = localStorage.getItem("cached_appointments_list") || localStorage.getItem("all_appointments") || "[]"
          const apptList = JSON.parse(rawApptList)
          if (Array.isArray(apptList)) {
            apptList.forEach((a: any) => {
              if (a.module === "Solo Parent" || String(a.concern || "").toLowerCase().includes("solo parent")) {
                const ref = a.referenceNo || a.referenceNumber || a.id
                const idStr = `appt-solo-${ref}`
                const disbId = `DISB-2026-${String(ref).slice(-4).padStart(4, "0")}`
                if (deletedKeys.has(ref) || deletedKeys.has(idStr) || deletedKeys.has(disbId)) return
                if (!remoteRecords.some((rr) => rr.applicationRef === ref)) {
                  remoteRecords.push({
                    id: idStr,
                    disbursementId: disbId,
                    applicationRef: ref,
                    applicantName: String(a.applicantName || "JEFFERSON FERNANDO LEE").toUpperCase(),
                    assistanceType: "Solo Parent Financial Subsidy",
                    fixedAmount: resolveFixedAmount("Solo Parent Financial Subsidy"),
                    dateApproved: new Date(a.submittedAt || Date.now()).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }),
                    status: (a.status === "completed" || a.status === "released") ? "RELEASED" : "PENDING",
                    appointmentDate: a.scheduledDate,
                    appointmentTime: a.scheduledTime,
                    venue: a.officeLocation || "Quezon City Hall - SSDD Solo Parent Welfare Section",
                    remarks: a.notes || "Approved Solo Parent Financial Subsidy.",
                  })
                }
              }
            })
          }
        } catch {}

        if (resApptsSettled.status === "fulfilled" && resApptsSettled.value.ok) {
          try {
            const dataAppts = await resApptsSettled.value.json()
            if (dataAppts.appointments && Array.isArray(dataAppts.appointments)) {
              dataAppts.appointments.forEach((a: any) => {
                const ref = String(a.reference_no || "").trim()
                if (ref) appointmentsMap[ref] = a
                if (a.applicant_name) appointmentsMap[a.applicant_name.toLowerCase().trim()] = a

                const isApptApproved = a.status === "approved" || a.decision === "approved"
                const cleanType = a.concern || "Financial Assistance"
                const isGhostSenior =
                  ref.includes("9929") ||
                  (String(a.applicant_name || "").toUpperCase().includes("JEFFERSON") &&
                   cleanType.toLowerCase().includes("senior"))
                if (isGhostSenior) return

                if (
                  isApptApproved &&
                  ref &&
                  !deletedKeys.has(ref) &&
                  !isNonCashOrGLService(cleanType) &&
                  !isIdOrDocumentService(cleanType)
                ) {
                  const disbId = `DISB-2026-${ref.slice(-4).padStart(4, "0")}`
                  if (!remoteRecords.some((rr) => rr.applicationRef === ref || rr.disbursementId === disbId)) {
                    remoteRecords.push({
                      id: `remote-appt-${a.id || ref}`,
                      disbursementId: disbId,
                      applicationRef: ref,
                      applicantName: a.applicant_name ? a.applicant_name.toUpperCase() : "BENEFICIARY",
                      assistanceType: cleanType,
                      fixedAmount: resolveFixedAmount(cleanType),
                      dateApproved: new Date(a.updated_at || a.created_at || Date.now()).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }),
                      status: "PENDING" as DisbursementStage,
                      appointmentDate: a.scheduled_date || undefined,
                      appointmentTime: a.scheduled_time || undefined,
                      venue: a.office_location || "Quezon City Hall",
                      remarks: a.notes || "Approved appointment payout.",
                    })
                  }
                }
              })
            }
          } catch {}
        }

        let localScheduledMap: Record<string, any> = {}
        try {
          const rawSched = localStorage.getItem("all_appointments_scheduled")
          if (rawSched) localScheduledMap = JSON.parse(rawSched)
        } catch {}

        let merged = [...remoteRecords]
        localDisbursements.forEach((l) => {
          if (!merged.some((m) => m.applicationRef === l.applicationRef || m.disbursementId === l.disbursementId)) {
            merged.push(l)
          }
        })

        merged = merged.filter(
          (d) =>
            !deletedKeys.has(d.id) &&
            !deletedKeys.has(d.disbursementId) &&
            !deletedKeys.has(d.applicationRef) &&
            !isNonCashOrGLService(d.assistanceType) &&
            !isIdOrDocumentService(d.assistanceType) &&
            !(d.disbursementId === "DISB-2026-9929" ||
              d.id === "local-appt-9929" ||
              d.id === "remote-pwd-9929" ||
              (String(d.applicantName || "").toUpperCase().includes("JEFFERSON") &&
               String(d.assistanceType || "").toLowerCase().includes("senior")))
        )

        merged = merged.map((d) => {
          const isSolo = String(d.assistanceType).toLowerCase().includes("solo")
          const baseRef = (d.applicationRef || "").split("-")[0].trim()
          const cleanAssistance = String(d.assistanceType).toLowerCase().replace(/assistance/g, "").replace(/social/g, "").trim()

          const appt =
            appointmentsMap[`${d.applicationRef}_${cleanAssistance}`] ||
            appointmentsMap[`${baseRef}_${cleanAssistance}`] ||
            appointmentsMap[d.applicationRef] ||
            appointmentsMap[baseRef] ||
            (d.applicantName ? appointmentsMap[d.applicantName.toLowerCase().trim()] : null) ||
            (isSolo
              ? (appointmentsMap[`Solo Parent_${d.applicationRef}`] ||
                 appointmentsMap[`${d.applicationRef}_Solo Parent Financial Subsidy Payout`] ||
                 appointmentsMap[`${d.applicationRef}_Solo Parent Financial Subsidy`] ||
                 appointmentsMap["jefferson fernando lee"] ||
                 Object.values(appointmentsMap).find((a: any) =>
                   (a.module === "Solo Parent" || String(a.concern || "").toLowerCase().includes("solo parent")) &&
                   (a.scheduled_date || a.scheduledDate || a.date)
                 ))
              : null)

          const cachedSched =
            localScheduledMap[d.id] ||
            localScheduledMap[d.disbursementId] ||
            localScheduledMap[`${d.applicationRef}_${d.assistanceType}`] ||
            localScheduledMap[`${baseRef}_${d.assistanceType}`] ||
            localScheduledMap[d.applicationRef] ||
            localScheduledMap[baseRef] ||
            (d.applicantName ? localScheduledMap[d.applicantName.toLowerCase().trim()] : null) ||
            (isSolo
              ? (localScheduledMap[`Solo Parent_${d.applicationRef}`] ||
                 localScheduledMap[`${d.applicationRef}_Solo Parent Financial Subsidy Payout`] ||
                 localScheduledMap[`${d.applicationRef}_Solo Parent Financial Subsidy`] ||
                 localScheduledMap["jefferson fernando lee"] ||
                 Object.values(localScheduledMap).find((s: any) =>
                   (s.module === "Solo Parent" || String(s.concern || "").toLowerCase().includes("solo parent")) &&
                   (s.scheduledDate || s.date)
                 ))
              : null)

          const existingSaved = localDisbursements.find(
            (x) =>
              (x.applicationRef && (x.applicationRef === d.applicationRef || x.applicationRef === baseRef)) ||
              (x.disbursementId && x.disbursementId === d.disbursementId) ||
              (x.id && x.id === d.id) ||
              (isSolo && x.assistanceType.toLowerCase().includes("solo"))
          )

          const hasValidAppt = Boolean((appt?.scheduled_date || appt?.scheduledDate) && appt?.status !== "pending")
          const hasValidCached = Boolean((cachedSched?.scheduledDate || cachedSched?.appointmentDate) && cachedSched?.status !== "pending")

          const finalApptDate = hasValidAppt
            ? (appt.scheduled_date || appt.scheduledDate)
            : hasValidCached
            ? (cachedSched.scheduledDate || cachedSched.appointmentDate)
            : existingSaved?.appointmentDate || d.appointmentDate || null

          const finalApptTime = hasValidAppt
            ? (appt.scheduled_time || appt.scheduledTime)
            : hasValidCached
            ? (cachedSched.scheduledTime || cachedSched.appointmentTime)
            : existingSaved?.appointmentTime || d.appointmentTime || null

          const finalVenue =
            appt?.office_location ||
            appt?.officeLocation ||
            cachedSched?.officeLocation ||
            existingSaved?.venue ||
            d.venue ||
            (isSolo ? "Quezon City Hall - SSDD Solo Parent Welfare Section" : "Quezon City Hall")

          const isApptNotApproved = appt && (appt.status === "pending" || appt.status === "scheduled" || appt.status === "under_review")
          const isExplicitlyReleased = !isApptNotApproved && (isDisbursementManuallyReleased(d) || (existingSaved ? isDisbursementManuallyReleased(existingSaved) : false))
          const isReleased = isExplicitlyReleased

          const resolvedName = isSolo && (!d.applicantName || d.applicantName.includes("BENEFICIARY"))
            ? "JEFFERSON FERNANDO LEE"
            : d.applicantName

          return {
            ...d,
            applicantName: resolvedName,
            appointmentDate: finalApptDate,
            appointmentTime: finalApptTime,
            venue: finalVenue,
            status: isReleased ? ("RELEASED" as DisbursementStage) : ("PENDING" as DisbursementStage),
            releasedDate: isReleased
              ? d.releasedDate || existingSaved?.releasedDate || new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
              : undefined,
            releasedBy: isReleased
              ? d.releasedBy || existingSaved?.releasedBy || "Disbursing Officer"
              : undefined,
          }
        })

        const approvedOnly = merged.filter((d) => {
          const cleanRef = String(d.applicationRef || "").trim()
          const unhyphenated = cleanRef.replace(/[^a-zA-Z0-9]/g, "")
          const baseRef = cleanRef.split("-")[0].trim()
          const cleanAssistance = String(d.assistanceType).toLowerCase().replace(/assistance/g, "").replace(/social/g, "").trim()
          const appt =
            appointmentsMap[`${cleanRef}_${cleanAssistance}`] ||
            appointmentsMap[`${unhyphenated}_${cleanAssistance}`] ||
            appointmentsMap[`${baseRef}_${cleanAssistance}`] ||
            appointmentsMap[cleanRef] ||
            appointmentsMap[unhyphenated] ||
            appointmentsMap[baseRef] ||
            (d.applicantName ? appointmentsMap[d.applicantName.toLowerCase().trim()] : null)

          const cachedSched =
            localScheduledMap[d.id] ||
            localScheduledMap[d.disbursementId] ||
            localScheduledMap[`${cleanRef}_${d.assistanceType}`] ||
            localScheduledMap[`${unhyphenated}_${d.assistanceType}`] ||
            localScheduledMap[`${baseRef}_${d.assistanceType}`] ||
            localScheduledMap[cleanRef] ||
            localScheduledMap[unhyphenated] ||
            localScheduledMap[baseRef] ||
            (d.applicantName ? localScheduledMap[d.applicantName.toLowerCase().trim()] : null)

          const apptStatus = String(appt?.status || cachedSched?.status || "").toLowerCase()
          const apptDecision = String(appt?.decision || cachedSched?.decision || "").toLowerCase()
          if (apptStatus === "rejected" || apptStatus === "referred" || apptDecision === "rejected" || apptDecision === "referred") {
            return false
          }

          // If an appointment exists for this aid request, only hide if rejected/referred
          if (appt || cachedSched) {
            if (
              !["approved", "scheduled", "completed", "for_distribution", "for_release"].includes(apptStatus) &&
              !["approved", "scheduled"].includes(apptDecision) &&
              !String(d.assistanceType).toLowerCase().includes("solo")
            ) {
              return false
            }
          }

          return true
        })

        // Deduplicate records strictly by applicant name + assistance type
        const dedupedMap = new Map<string, SyncedDisbursementRecord>()
        approvedOnly.forEach((d) => {
          const cleanName = String(d.applicantName || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim()
          const cleanType = String(d.assistanceType || "").toLowerCase().replace(/\s*assistance/gi, "").trim()
          const cleanRef = String(d.applicationRef || "").replace(/[^a-zA-Z0-9]/g, "")
          const dedupKey = cleanName ? `person_${cleanName}_${cleanType}` : `ref_${cleanRef}`

          if (!dedupedMap.has(dedupKey)) {
            dedupedMap.set(dedupKey, d)
          } else {
            const existing = dedupedMap.get(dedupKey)!
            const hasCurrentSched = Boolean(d.appointmentDate)

            const isExistingReleased = existing.status === "RELEASED"
            const isCurrentReleased = d.status === "RELEASED"
            const mergedStatus: DisbursementStage = (isExistingReleased || isCurrentReleased) ? "RELEASED" : "PENDING"

            const bestDate = hasCurrentSched ? d.appointmentDate : existing.appointmentDate
            const bestTime = hasCurrentSched ? d.appointmentTime : existing.appointmentTime
            const bestVenue = d.venue || existing.venue
            const bestReleasedDate = (isCurrentReleased ? d.releasedDate : undefined) || (isExistingReleased ? existing.releasedDate : undefined)
            const bestReleasedBy = (isCurrentReleased ? d.releasedBy : undefined) || (isExistingReleased ? existing.releasedBy : undefined)

            dedupedMap.set(dedupKey, {
              ...existing,
              ...d,
              id: existing.id.startsWith("db-") ? existing.id : d.id,
              disbursementId: existing.disbursementId || d.disbursementId,
              applicationRef: (cleanRef.length > String(existing.applicationRef || "").length) ? d.applicationRef : existing.applicationRef,
              appointmentDate: bestDate,
              appointmentTime: bestTime,
              venue: bestVenue,
              status: mergedStatus,
              releasedDate: bestReleasedDate,
              releasedBy: bestReleasedBy,
            })
          }
        })

        const finalDisbursements = Array.from(dedupedMap.values())
        setDisbursements(finalDisbursements)
        saveDisbursements(finalDisbursements)
      } finally {
        isSyncing = false
      }
    }

    syncAll()

    const autoReleaseInterval = setInterval(() => {
      syncAll()
    }, 15000)

    let debounceTimer: any = null
    const handleStorageChange = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        syncAll()
      }, 350)
    }

    const unsubscribe = subscribeToRealtimeChanges(() => {
      handleStorageChange()
    })

    window.addEventListener("financial_disbursements_updated", handleStorageChange)
    window.addEventListener("appointments_updated", handleStorageChange)
    window.addEventListener("solo_parent_applications_updated", handleStorageChange)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearTimeout(debounceTimer)
      clearInterval(autoReleaseInterval)
      unsubscribe()
      window.removeEventListener("financial_disbursements_updated", handleStorageChange)
      window.removeEventListener("appointments_updated", handleStorageChange)
      window.removeEventListener("solo_parent_applications_updated", handleStorageChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const filteredDisbursements = useMemo(() => {
    return disbursements.filter((d) => {
      const matchStatus =
        selectedStatusTab === "ALL" || d.status === selectedStatusTab
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        d.applicantName.toLowerCase().includes(q) ||
        d.disbursementId.toLowerCase().includes(q) ||
        d.applicationRef.toLowerCase().includes(q) ||
        d.assistanceType.toLowerCase().includes(q)

      return matchStatus && matchSearch
    })
  }, [disbursements, selectedStatusTab, searchQuery])

  const totalDisbursed = disbursements
    .filter((d) => d.status === "RELEASED")
    .reduce((sum, d) => sum + d.fixedAmount, 0)

  const pendingAmount = disbursements
    .filter((d) => d.status === "PENDING")
    .reduce((sum, d) => sum + d.fixedAmount, 0)

  const pendingCount = disbursements.filter((d) => d.status === "PENDING").length
  const releasedCount = disbursements.filter((d) => d.status === "RELEASED").length

  return (
    <div className="p-4 md:p-6 space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Financial Aid Disbursement
          </h1>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              await fetch(`${API_BASE}/api/financial-aid/cleanup`, { method: "POST" })
            } catch {}
            localStorage.removeItem("all_financial_disbursements")
            localStorage.removeItem("deleted_financial_disbursement_keys")
            window.dispatchEvent(new Event("financial_disbursements_updated"))
            window.location.reload()
          }}
          className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer self-start sm:self-auto"
        >
          Reset / Clear Test Data
        </button>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Total Released</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            ₱{totalDisbursed.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            ✓ {releasedCount} beneficiaries paid
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Pending Release</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            ₱{pendingAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">
            {pendingCount} pending payouts
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Total Records</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            {disbursements.length}
          </p>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">
            Disbursement entries
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Status Flow</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-extrabold text-gray-900 mt-2">
            PENDING → RELEASED
          </p>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">
            Auto-synced with Appointment Schedule
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                Financial Aid Disbursement Records
              </h3>
              <p className="text-xs text-gray-500">
                Connected to Appointments. Disbursements become RELEASED upon Social Worker appointment approval or manual disbursement.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ID / Beneficiary name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 h-9 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {["ALL", "PENDING", "RELEASED"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedStatusTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-colors cursor-pointer ${
                    selectedStatusTab === tab
                      ? "bg-[#3b82f6] text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                  }`}
                >
                  {tab} {tab === "PENDING" ? `(${pendingCount})` : tab === "RELEASED" ? `(${releasedCount})` : `(${disbursements.length})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase font-bold text-[11px]">
                <th className="px-4 py-3">Disbursement ID</th>
                <th className="px-4 py-3">Applicant Name</th>
                <th className="px-4 py-3">Assistance Type</th>
                <th className="px-4 py-3">Base Amount</th>
                <th className="px-4 py-3">Appointment Schedule</th>
                <th className="px-4 py-3">Payout Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDisbursements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    No disbursement records match the filter.
                  </td>
                </tr>
              ) : (
                filteredDisbursements.map((d) => {
                  const isPending = d.status === "PENDING"
                  const isRevealed = Boolean(revealedAmounts[d.id])
                  const isPwd = String(d.assistanceType).toLowerCase().includes("pwd") || String(d.assistanceType).toLowerCase().includes("disability")
                  const isSoloSubsidy = String(d.assistanceType).toLowerCase().includes("solo") && (String(d.assistanceType).toLowerCase().includes("subsidy") || String(d.assistanceType).toLowerCase().includes("financial") || String(d.assistanceType).toLowerCase().includes("welfare"))
                  const pwdState = isPwd ? getPwdPensionAccumulation(d.dateApproved || d.appointmentDate, d.releasedDate) : null
                  const soloState = isSoloSubsidy ? getSoloParentSubsidyAccumulation(d.dateApproved || d.appointmentDate, d.releasedDate) : null

                  return (
                    <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-blue-700">
                        {d.disbursementId}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900 uppercase">
                        {d.applicantName}
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 font-medium">
                        {d.assistanceType}
                      </td>
                      <td className="px-4 py-3.5 font-black text-emerald-700 text-sm">
                        {!isRevealed ? (
                          <div className="space-y-0.5">
                            <div className="inline-flex items-center gap-1.5">
                              <span className="font-mono tracking-wider text-gray-400 select-none">₱••••••</span>
                              <button
                                type="button"
                                onClick={() => toggleAmount(d.id)}
                                className="p-1 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Click to reveal payout amount"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {isPwd && pwdState && (
                              <span className="block text-[10px] font-bold text-blue-600">
                                ₱500 / buwan • {pwdState.nextQuarterMonthName}
                              </span>
                            )}
                            {isSoloSubsidy && soloState && (
                              <span className="block text-[10px] font-bold text-sky-600">
                                ₱1,000 / buwan • {soloState.nextQuarterMonthName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="inline-flex items-center gap-1.5">
                              <span>{isPwd ? "₱500 / buwan" : isSoloSubsidy ? "₱1,000 / buwan" : `₱${d.fixedAmount.toLocaleString()}`}</span>
                              <button
                                type="button"
                                onClick={() => toggleAmount(d.id)}
                                className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors cursor-pointer"
                                title="Click to hide payout amount"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {isPwd && pwdState && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                  ₱{pwdState.currentAccumulated.toLocaleString()} Naipon ({pwdState.nextQuarterMonthName})
                                </span>
                              </div>
                            )}
                            {isSoloSubsidy && soloState && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                                  ₱{soloState.currentAccumulated.toLocaleString()} Naipon ({soloState.nextQuarterMonthName})
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-800 font-medium">
                        {d.appointmentDate ? (
                           <div className="space-y-0.5">
                            <span className="block text-gray-900 font-semibold">{d.appointmentDate}</span>
                            <span className="text-[11px] text-blue-700 font-bold">{d.appointmentTime || "10:00 AM"}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Pending Appointment</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-700">
                        <span className="truncate block max-w-[160px]" title={d.venue || "Quezon City Hall"}>
                          {d.venue || "Quezon City Hall"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {isPwd && isPending && pwdState ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                              pwdState.isMatured
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-blue-50 text-blue-800 border-blue-300"
                            }`}
                          >
                            {pwdState.isMatured ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Ready (₱1,500)</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-blue-600 animate-pulse" />
                                <span>Accumulating (₱500/mo)</span>
                              </>
                            )}
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                              isPending
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-emerald-50 text-emerald-800 border-emerald-300"
                            }`}
                          >
                            {isPending ? (
                              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            )}
                            {d.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                          {d.status === "PENDING" && (
                            <>
                              {isPwd ? (
                                pwdState?.isMatured ? (
                                  <button
                                    type="button"
                                    onClick={() => setSchedulingRecord(d)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs animate-pulse"
                                    title="Set Date/Time at Fixed QC Hall Location & Release Payout"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                    <span>Release (₱1,500)</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 font-bold text-xs cursor-not-allowed"
                                    title={`Naka-lock pa dahil Buwan ${pwdState?.currentMonthNumber || 1} pa lang (₱${pwdState?.currentAccumulated || 500}). Mag-u-unlock kapag ₱1,500 na (Buwan 3).`}
                                  >
                                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                                    <span>Locked ({pwdState?.nextQuarterMonthName || "₱500/mo"})</span>
                                  </button>
                                )
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSchedulingRecord(d)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs hover:shadow-xs"
                                  title="Set Date/Time & Release Assistance"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Release</span>
                                </button>
                              )}
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailsRecord(d)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs hover:shadow-xs"
                            title="View full disbursement details"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDetailsRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase">
                  Disbursement Details
                </span>
                <h3 className="text-base font-bold text-gray-900">
                  {selectedDetailsRecord.disbursementId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailsRecord(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Applicant:</span>
                <span className="font-bold text-gray-900 uppercase">
                  {selectedDetailsRecord.applicantName}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Assistance:</span>
                <span className="font-semibold text-gray-800">
                  {selectedDetailsRecord.assistanceType}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Fixed Amount:</span>
                <span className="font-black text-emerald-700 text-sm">
                  {!revealedAmounts[`modal-${selectedDetailsRecord.id}`] ? (
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <span className="tracking-wider text-gray-400 select-none">₱••••••</span>
                      <button
                        type="button"
                        onClick={() => toggleAmount(`modal-${selectedDetailsRecord.id}`)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline ml-1 cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Show
                      </button>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <span>₱{selectedDetailsRecord.fixedAmount.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => toggleAmount(`modal-${selectedDetailsRecord.id}`)}
                        className="text-xs text-gray-500 hover:text-gray-700 font-semibold underline ml-1 cursor-pointer inline-flex items-center gap-1"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide
                      </button>
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Application Reference / QCID:</span>
                <span className="font-mono text-blue-700 font-semibold">
                  <MaskedText
                    value={selectedDetailsRecord.applicationRef}
                    type="id"
                    showButtonLabel
                    auditSubject={selectedDetailsRecord.applicantName}
                    auditField="Application Ref / QCID"
                    auditModule="Financial Aid Disbursement"
                    referenceNo={selectedDetailsRecord.disbursementId}
                  />
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Appointment Schedule:</span>
                <span className="text-blue-700 font-bold">
                  {selectedDetailsRecord.appointmentDate || "August 31, 2026"} – {selectedDetailsRecord.appointmentTime || "10:00 AM"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Payout Location:</span>
                <span className="text-gray-900 font-medium">
                  {selectedDetailsRecord.venue || "Quezon City Hall"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Status:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    selectedDetailsRecord.status === "PENDING"
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-emerald-50 text-emerald-800 border-emerald-300"
                  }`}
                >
                  {selectedDetailsRecord.status}
                </span>
              </div>

              {selectedDetailsRecord.releasedDate && (
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-500">Date Released:</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedDetailsRecord.releasedDate}
                  </span>
                </div>
              )}

              {selectedDetailsRecord.releasedBy && (
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-500">Disbursed By:</span>
                  <span className="font-medium text-gray-800">
                    {selectedDetailsRecord.releasedBy}
                  </span>
                </div>
              )}

              {selectedDetailsRecord.remarks && (
                <div className="bg-gray-50 rounded-xl p-3 text-[11px] text-gray-600 space-y-1">
                  <span className="font-bold text-gray-700 block">Notes / Remarks:</span>
                  <p>{selectedDetailsRecord.remarks}</p>
                </div>
              )}
            </div>

            {(selectedDetailsRecord.assistanceType.toLowerCase().includes("medical") || selectedDetailsRecord.assistanceType.toLowerCase().includes("medicine") || selectedDetailsRecord.assistanceType.toLowerCase().includes("gamot")) && (
              <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setGlModalRecord(selectedDetailsRecord)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {selectedDetailsRecord.assistanceType.toLowerCase().includes("medicine") || selectedDetailsRecord.assistanceType.toLowerCase().includes("gamot")
                      ? "Print Mercury Drug Gift Certificate"
                      : "Print Guarantee Letter (GL)"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {glModalRecord && (
        <OfficialGuaranteeLetterModal
          data={{
            controlNo: `QC-SSDD-GL-2026-${String(glModalRecord.id || glModalRecord.disbursementId || "048912").replace(/\D/g, "").slice(-6).padStart(6, "0")}`,
            applicationRef: glModalRecord.applicationRef || glModalRecord.disbursementId,
            patientName: glModalRecord.applicantName,
            qcidNumber: glModalRecord.applicationRef,
            amount: glModalRecord.fixedAmount || 25000,
            assistanceType: glModalRecord.assistanceType,
            hospitalName: glModalRecord.hospitalName || glModalRecord.partnerHospital || (glModalRecord.assistanceType.toLowerCase().includes("medicine") || glModalRecord.assistanceType.toLowerCase().includes("gamot") ? "MERCURY DRUG (QUEZON CITY BRANCHES)" : "EAST AVENUE MEDICAL CENTER (EAMC)"),
            diagnosis: glModalRecord.remarks || (glModalRecord.assistanceType.toLowerCase().includes("medicine") || glModalRecord.assistanceType.toLowerCase().includes("gamot") ? "Doctor's Prescription / Essential Medicines" : "Chronic Kidney Disease (Stage 5) / Hemodialysis"),
          }}
          onClose={() => setGlModalRecord(null)}
          canPrint={true}
        />
      )}

      {schedulingRecord && (
        <PayoutScheduleModal
          record={schedulingRecord}
          onClose={() => setSchedulingRecord(null)}
          onSave={(date, time, venue) => handleSavePayoutSchedule(schedulingRecord, date, time, venue)}
          onRelease={() => {
            handleReleaseRecord(schedulingRecord)
            setSchedulingRecord(null)
          }}
        />
      )}
    </div>
  )
}

function PayoutScheduleModal({
  record,
  onClose,
  onSave,
  onRelease,
}: {
  record: SyncedDisbursementRecord
  onClose: () => void
  onSave: (date: string, time: string, venue: string) => void
  onRelease?: () => void
}) {
  const getInitialDate = () => {
    if (record.appointmentDate) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(record.appointmentDate)) return record.appointmentDate
      const parsed = new Date(record.appointmentDate)
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0]
      }
    }
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  const [date, setDate] = useState(getInitialDate())
  const [time, setTime] = useState(record.appointmentTime || "09:00 AM - 10:00 AM")
  const venue = "Quezon City Hall (PDAO Ground Floor Social Hall)"

  const canSave = date.trim() !== "" && time.trim() !== ""

  const timeSlots = [
    "08:00 AM - 09:00 AM",
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "01:00 PM - 02:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM",
  ]

  const handleConfirm = () => {
    if (!canSave) return
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    onSave(formattedDate, time, venue)
    if (onRelease) {
      onRelease()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">{record.applicantName}</h2>
            <p className="text-xs text-gray-500 font-mono">{record.disbursementId} • {record.assistanceType}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-light cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Payout Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Payout Time Window *</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium cursor-pointer"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Payout Venue</label>
            <div className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium">
              {venue}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canSave}
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
          >
            Confirm & Release Payout
          </button>
        </div>
      </div>
    </div>
  )
}


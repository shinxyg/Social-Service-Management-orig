import { useState, useMemo, useEffect } from "react"
import {
  Wallet,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  Eye,
  Banknote,
  Users,
  X,
  Printer,
  Trash2,
} from "lucide-react"
import { API_BASE } from "../../config/api"
import {
  FIXED_ASSISTANCE_AMOUNTS,
  type DisbursementStage,
  type SyncedDisbursementRecord,
  getSavedDisbursements,
  checkAndAutoReleaseScheduledDisbursements,
  parseAppointmentDateTime,
} from "../../utils/financialAidSync"

export { FIXED_ASSISTANCE_AMOUNTS, type DisbursementStage, type SyncedDisbursementRecord }

export default function FinancialAidDisbursement() {
  const [disbursements, setDisbursements] = useState<SyncedDisbursementRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("ALL")
  const [selectedDetailsRecord, setSelectedDetailsRecord] = useState<SyncedDisbursementRecord | null>(null)

  // Auto-sync submitted applications from Backend, LocalStorage, and Appointments Bridge
  useEffect(() => {
    let isSyncing = false
    const syncAll = async () => {
      if (isSyncing) return
      isSyncing = true
      try {
        // Auto-release engine: check if any appointment time has arrived
        checkAndAutoReleaseScheduledDisbursements()

        const localDisbursements = getSavedDisbursements()
        let remoteRecords: SyncedDisbursementRecord[] = []

        try {
          const resDb = await fetch(`${API_BASE}/api/financial-aid`)
          if (resDb.ok) {
            const dataDb = await resDb.json()
            if (dataDb.disbursements && Array.isArray(dataDb.disbursements)) {
              const dbRecords: SyncedDisbursementRecord[] = dataDb.disbursements.map((d: any) => ({
                id: `db-${d.id}`,
                disbursementId: d.disbursement_id,
                applicationRef: d.application_ref,
                applicantName: d.applicant_name,
                assistanceType: d.assistance_type,
                fixedAmount: Number(d.fixed_amount) > 0 ? Number(d.fixed_amount) : 15000,
                dateApproved: d.date_approved,
                status: d.status as DisbursementStage,
                appointmentDate: d.appointment_date,
                appointmentTime: d.appointment_time,
                venue: d.venue,
                releasedDate: d.released_date,
                releasedBy: d.released_by,
                remarks: d.remarks,
              }))
              remoteRecords.push(...dbRecords)
            }
          }

        const res = await fetch(`${API_BASE}/api/aics/applications`)
        if (res.ok) {
          const data = await res.json()
          if (data.applications && Array.isArray(data.applications)) {
            const rejectedRefs = new Set<string>()
            const approvedApps = data.applications.filter((app: any) => {
              const ref = app.qc_id || app.reference_no || app.reference_number || "110000116932100"
              if (app.status === "rejected" || app.status === "pending") {
                rejectedRefs.add(ref)
                return false
              }
              return app.status === "approved" || app.status === "completed" || app.status === "for_release"
            })

            const aicsRecords = approvedApps.map((app: any) => {
              const rawType = (app.assistance_type || "Medical").replace(/\s*assistance/gi, "").trim()
              const type = (rawType.charAt(0).toUpperCase() + rawType.slice(1)) + " Assistance"
              const amount = FIXED_ASSISTANCE_AMOUNTS[type] || 1000
              const isReleased = app.status === "released" || app.status === "completed"

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
                remarks: "Awtomatikong pumasok mula sa isinumiteng aplikasyon.",
              }
            })

            // Only add aicsRecords if not already in remoteRecords (from db)
            aicsRecords.forEach((ar) => {
              if (!remoteRecords.some((rr) => rr.applicationRef === ar.applicationRef || rr.disbursementId === ar.disbursementId)) {
                remoteRecords.push(ar)
              }
            })

            // Purge rejected or pending-review applications
            remoteRecords = remoteRecords.filter((rr) => !rejectedRefs.has(rr.applicationRef))
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
          const rejectedPwdRefs = new Set<string>()
          const approvedPwdApps = pwdSeniorApps.filter((app: any) => {
            const ref = app.referenceNumber || app.reference_number || app.id
            const isAssistance =
              app.type === "assistance" ||
              app.type === "social-assistance" ||
              String(app.category || "").toLowerCase().includes("assistance") ||
              String(app.service || "").toLowerCase().includes("assistance") ||
              String(app.assistanceType || "").toLowerCase().includes("assistance")

            if (isAssistance) {
              if (app.status === "rejected" || app.status === "pending") {
                rejectedPwdRefs.add(ref)
                return false
              }
              return app.status === "approved" || app.status === "completed" || app.status === "for_release"
            }
            return false
          })

          const pwdRecords: SyncedDisbursementRecord[] = approvedPwdApps.map((app: any) => {
            const fullName =
              [app.firstName, app.middleName, app.lastName, app.suffix].filter(Boolean).join(" ") ||
              [app.first_name, app.middle_name, app.last_name, app.suffix].filter(Boolean).join(" ") ||
              "APPLICANT"
            const isPwdApp = String(app.category || "").toUpperCase().includes("PWD")
            const assistanceType = isPwdApp ? "PWD Social Assistance" : "Senior Social Assistance"
            const isReleased = app.status === "released" || app.status === "completed"
            const ref = app.referenceNumber || app.reference_number || "PWD-QC-2026"

            return {
              id: `remote-pwd-${app.id || ref}`,
              disbursementId: `DISB-2026-${String(app.id || ref).slice(-4).padStart(4, "0")}`,
              applicationRef: ref,
              applicantName: fullName.toUpperCase(),
              assistanceType: assistanceType,
              fixedAmount: 2000,
              dateApproved: new Date(app.approvedDate || app.submittedAt || Date.now()).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              status: isReleased ? ("RELEASED" as DisbursementStage) : ("PENDING" as DisbursementStage),
              venue: "Quezon City Hall",
              remarks: "Awtomatikong pumasok mula sa PWD/Senior Social Assistance aplikasyon.",
            }
          })

          pwdRecords.forEach((pr) => {
            if (!remoteRecords.some((rr) => rr.applicationRef === pr.applicationRef || rr.disbursementId === pr.disbursementId)) {
              remoteRecords.push(pr)
            }
          })

          remoteRecords = remoteRecords.filter((rr) => !rejectedPwdRefs.has(rr.applicationRef))
        }
      } catch (err) {
        console.warn("Could not fetch remote disbursements/applications:", err)
      }

      const now = new Date()
      // Merge: remote records from database take precedence over local cache
      let merged = [...remoteRecords]
      localDisbursements.forEach((l) => {
        if (!merged.some((m) => m.applicationRef === l.applicationRef || m.disbursementId === l.disbursementId)) {
          merged.push(l)
        }
      })

      // Live auto-release check for any record whose scheduled appointment datetime has arrived
      merged = merged.map((d) => {
        if (d.status === "PENDING" && d.appointmentDate) {
          const dt = parseAppointmentDateTime(d.appointmentDate, d.appointmentTime)
          if (dt && now.getTime() >= dt.getTime()) {
            return {
              ...d,
              status: "RELEASED" as DisbursementStage,
              releasedDate: `${now.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} ${d.appointmentTime || now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`,
              releasedBy: "Automated Scheduled Payout System / Disbursing Officer",
            }
          }
        }
        return d
      })

      setDisbursements(merged)
      } finally {
        isSyncing = false
      }
    }

    syncAll()

    // Interval checker every 2s to auto-release when exact appointment time is reached
    const autoReleaseInterval = setInterval(() => {
      syncAll()
    }, 2000)

    // Listen to real-time events when appointments or applications update
    const handleStorageChange = () => syncAll()
    window.addEventListener("financial_disbursements_updated", handleStorageChange)
    window.addEventListener("appointments_updated", handleStorageChange)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(autoReleaseInterval)
      window.removeEventListener("financial_disbursements_updated", handleStorageChange)
      window.removeEventListener("appointments_updated", handleStorageChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // Filtered disbursements
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

  // KPIs
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
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Financial Aid & Cash Assistance Module
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Financial Aid Disbursement
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Awtomatikong naka-sync sa <strong>Admin Appointments</strong> at <strong>Applications</strong>. Fixed amount ang tulong at magiging <strong>RELEASED</strong> kapag kinumpirma ang payout.
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              await fetch(`${API_BASE}/api/financial-aid/cleanup`, { method: "POST" })
            } catch {}
            localStorage.removeItem("all_financial_disbursements")
            window.dispatchEvent(new Event("financial_disbursements_updated"))
            window.location.reload()
          }}
          className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer self-start sm:self-auto"
        >
          I-reset / Linisin ang Test Data
        </button>
      </div>

      {/* ── STATS SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Total Na-release</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            ₱{totalDisbursed.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            ✓ {releasedCount} benepisyaryo ang nabayaran
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Pending Releasing</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            ₱{pendingAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">
            {pendingCount} nakabinbing ayuda
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Kabuuang Rekord</span>
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
            Auto-synced sa Appointment Schedule
          </p>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ── FIXED AMOUNT RATES TABLE ── */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <h2 className="text-xs font-bold uppercase text-gray-700 flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-emerald-600" />
            Itinakdang Fixed Amount Rates
          </h2>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            Awtomatikong Halaga
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Object.entries(FIXED_ASSISTANCE_AMOUNTS).map(([type, amount]) => (
            <div
              key={type}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-left space-y-0.5 hover:border-blue-300 transition-colors"
            >
              <p className="text-[11px] text-gray-600 font-semibold truncate" title={type}>
                {type}
              </p>
              <p className="text-base font-extrabold text-blue-700">
                ₱{amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ── FINAL FLOW: PENDING -> RELEASED ── */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="border-b border-gray-100 pb-2.5">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Master Flow: Application → Appointment → Financial Aid → Notification
          </h2>
          <p className="text-xs text-gray-500">
            Kapag nag-set ng appointment ang Admin, awtomatikong mag-si-sync ang Payout Schedule sa Financial Aid at ma-no-notify ang mamamayan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-4xl mx-auto py-2">
          {/* Step 1 */}
          <div className="flex-1 w-full bg-blue-50 border border-blue-200 rounded-xl p-3 text-center space-y-0.5">
            <span className="text-[10px] font-bold text-blue-600 uppercase block">1. Citizen Applies</span>
            <p className="text-xs font-bold text-gray-900">Application Approved</p>
            <p className="text-[10px] text-gray-500">Auto Fixed Amount</p>
          </div>

          <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />

          {/* Step 2 */}
          <div className="flex-1 w-full bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center space-y-0.5">
            <span className="text-[10px] font-bold text-indigo-600 uppercase block">2. Admin Appointment</span>
            <p className="text-xs font-bold text-gray-900">Schedule Date + Time</p>
            <p className="text-[10px] text-gray-500">Auto-synced to Payout</p>
          </div>

          <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />

          {/* Step 3 */}
          <div className="flex-1 w-full bg-amber-50 border border-amber-300 rounded-xl p-3 text-center space-y-0.5 ring-2 ring-amber-200/60">
            <span className="text-[10px] font-bold text-amber-700 uppercase block">3. Financial Aid</span>
            <p className="text-xs font-extrabold text-amber-900">Status: PENDING</p>
            <p className="text-[10px] text-amber-700">Citizen Attends Payout</p>
          </div>

          <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />

          {/* Step 4 */}
          <div className="flex-1 w-full bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-center space-y-0.5 ring-2 ring-emerald-200/60">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">4. Final Release</span>
            <p className="text-xs font-extrabold text-emerald-900">Status: RELEASED</p>
            <p className="text-[10px] text-emerald-700">User Notified Automatically</p>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ── DISBURSEMENT RECORDS TABLE ── */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
        {/* Top Controls */}
        <div className="p-4 sm:p-5 border-b border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                Mga Talaan ng Financial Aid Disbursement
              </h3>
              <p className="text-xs text-gray-500">
                Awtomatikong konektado sa appointments at kusang nag-a-auto-release sa takdang oras ng payout.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Hanapin ang ID / Benepisyaryo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 h-9 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase font-bold text-[11px]">
                <th className="px-4 py-3">Disbursement ID</th>
                <th className="px-4 py-3">Applicant Name</th>
                <th className="px-4 py-3">Assistance Type</th>
                <th className="px-4 py-3">Fixed Amount</th>
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
                    Walang disbursement record na tumutugma sa filter.
                  </td>
                </tr>
              ) : (
                filteredDisbursements.map((d) => {
                  const isPending = d.status === "PENDING"

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
                        ₱{d.fixedAmount.toLocaleString()}
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
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailsRecord(d)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs hover:shadow-xs"
                            title="Tingnan ang buong detalye ng ayuda"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Details</span>
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

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ── MODAL: VIEW DETAILS ── */}
      {/* ───────────────────────────────────────────────────────────────── */}
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
                  ₱{selectedDetailsRecord.fixedAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Application Reference:</span>
                <span className="font-mono text-blue-700 font-semibold">
                  {selectedDetailsRecord.applicationRef}
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
                  <span className="font-bold text-gray-700 block">Tala / Remarks:</span>
                  <p>{selectedDetailsRecord.remarks}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>I-print ang Voucher</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("Sigurado ka bang nais mong burahin ang record na ito sa Financial Aid?")) {
                      try {
                        await fetch(`${API_BASE}/api/financial-aid/${selectedDetailsRecord.id || selectedDetailsRecord.disbursementId}`, {
                          method: "DELETE",
                        })
                      } catch {}
                      setDisbursements((prev) => prev.filter((d) => d.disbursementId !== selectedDetailsRecord.disbursementId))
                      setSelectedDetailsRecord(null)
                      window.location.reload()
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Burahin</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailsRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Isara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from "react"
import {
  Wallet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  Calendar,
  Info,
  MapPin,
  FileText,
} from "lucide-react"
import {
  FIXED_ASSISTANCE_AMOUNTS,
  type DisbursementStage,
  type SyncedDisbursementRecord,
  getSavedDisbursements,
  checkAndAutoReleaseScheduledDisbursements,
  parseAppointmentDateTime,
} from "../../utils/financialAidSync"
import { API_BASE } from "../../config/api"
import { useLanguage } from "../ui/language-context"

export default function ApplyFinancialAid() {
  const { t } = useLanguage()
  const [disbursements, setDisbursements] = useState<SyncedDisbursementRecord[]>([])
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null)

  // Auto-sync approved disbursements and scheduled payout appointments
  useEffect(() => {
    const loadDisbursements = async () => {
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
              fixedAmount: Number(d.fixed_amount),
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

        const qcId = "110000116932100"
        const res = await fetch(`${API_BASE}/api/aics/applications?qcId=${qcId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.applications && Array.isArray(data.applications)) {
            const approvedOnes = data.applications.filter(
              (app: any) =>
                app.status === "approved" ||
                app.status === "for_release" ||
                app.status === "released" ||
                app.status === "completed"
            )

            const aicsRecords = approvedOnes.map((app: any) => {
              const rawType = (app.assistance_type || "Medical").replace(/\s*assistance/gi, "").trim()
              const type = (rawType.charAt(0).toUpperCase() + rawType.slice(1)) + " Assistance"
              const amount = FIXED_ASSISTANCE_AMOUNTS[type] || 1000
              const isReleased = app.status === "released" || app.status === "completed"

              return {
                id: `user-remote-${app.id || app.reference_no}`,
                disbursementId: `DISB-2026-${String(app.id || 1).padStart(4, "0")}`,
                applicationRef: app.reference_number || `AICS-2026-${String(app.id).padStart(4, "0")}`,
                applicantName: `${app.first_name || ""} ${app.middle_name || ""} ${app.last_name || ""}`.trim().toUpperCase() || "CLARISA MAE GALIAS DIMAL",
                assistanceType: type,
                fixedAmount: amount,
                dateApproved: new Date(app.updated_at || app.created_at || Date.now()).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                status: isReleased ? ("RELEASED" as DisbursementStage) : ("PENDING" as DisbursementStage),
                venue: "Quezon City Hall",
                remarks: "Scheduled financial aid payout.",
              }
            })
            // Only add aicsRecords if not already in remoteRecords (from db)
            aicsRecords.forEach((ar) => {
              if (!remoteRecords.some((rr) => rr.applicationRef === ar.applicationRef || rr.disbursementId === ar.disbursementId)) {
                remoteRecords.push(ar)
              }
            })
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote approved disbursements:", err)
      }

      const now = new Date()
      // Merge records: remote from db takes precedence
      let combined = [...remoteRecords]
      localDisbursements.forEach((l) => {
        if (!combined.some((c) => c.applicationRef === l.applicationRef || c.disbursementId === l.disbursementId)) {
          combined.push(l)
        }
      })

      combined = combined.map((d) => {
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

      setDisbursements(combined)
    }

    loadDisbursements()

    // Real-time live check every 2 seconds
    const liveTimer = setInterval(() => {
      loadDisbursements()
    }, 2000)

    const handleSync = () => loadDisbursements()
    window.addEventListener("financial_disbursements_updated", handleSync)
    window.addEventListener("appointments_updated", handleSync)
    window.addEventListener("storage", handleSync)

    return () => {
      clearInterval(liveTimer)
      window.removeEventListener("financial_disbursements_updated", handleSync)
      window.removeEventListener("appointments_updated", handleSync)
      window.removeEventListener("storage", handleSync)
    }
  }, [])

  const handleCopy = (voucher: string) => {
    navigator.clipboard?.writeText(voucher)
    setCopiedVoucher(voucher)
    setTimeout(() => setCopiedVoucher(null), 2000)
  }

  const getStageBadge = (status: DisbursementStage, hasAppointment?: boolean) => {
    if (status === "RELEASED") {
      return {
        bg: "bg-emerald-50 text-emerald-800 border-emerald-300",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        label: "RELEASED",
      }
    }
    if (hasAppointment) {
      return {
        bg: "bg-blue-50 text-blue-800 border-blue-300",
        icon: <Calendar className="w-3.5 h-3.5 text-blue-600" />,
        label: "APPOINTMENT SCHEDULED",
      }
    }
    return {
      bg: "bg-amber-50 text-amber-800 border-amber-300",
      icon: <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />,
      label: "PENDING RELEASE",
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ── HEADER ── */}
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Financial Aid & Cash Assistance
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {t("financialAidOverviewTitle") || "Financial Aid Overview"}
        </h1>
        <p className="text-sm text-gray-500">
          {t("financialAidSubtitle") || "Awtomatikong nakatala rito ang inyong naaprubahang ayuda, itinakdang halaga, at iskedyul ng payout appointment sa City Hall."}
        </p>
      </div>

      {/* ── AUTOMATIC INTEGRATION NOTICE BANNER ── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h3 className="text-sm font-bold text-blue-950">
            {t("autoConnectNoticeTitle") || "Awtomatikong Nakakabit ang Appointment at Ayuda"}
          </h3>
          <p className="text-blue-900 leading-relaxed">
            {t("autoConnectNoticeDesc") || "Hindi na kailangan mag-set ng halaga o magsumite ulit. Kapag na-aprubahan ng Admin ang inyong aplikasyon, awtomatikong lalabas ang itinakdang Fixed Amount at ang petsa/oras ng inyong Payout Appointment."}
          </p>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ── ACTIVE DISBURSEMENTS LIST ── */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            {t("myDisbursementsTitle", { count: String(disbursements.length) }) || `Aking mga Ayuda at Payout Record (${disbursements.length})`}
          </h2>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("all_financial_disbursements")
              window.dispatchEvent(new Event("financial_disbursements_updated"))
              window.location.reload()
            }}
            className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer self-start sm:self-auto"
          >
            I-reset / Linisin ang Test Data
          </button>
        </div>

        {disbursements.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <Wallet className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-800">{t("noDisbursementsTitle") || "Walang Kasalukuyang Ayuda Record"}</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {t("noDisbursementsDesc") || "Wala ka pang naisusumiteng aplikasyon para sa ayuda. Mag-apply para sa Medical, Transportation, Food, o iba pang AICS serbisyo upang awtomatikong pumasok dito ang iyong disbursement record."}
              </p>
            </div>
            <a
              href="/portal/aics/medical"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>{t("applyForAssistance") || "Mag-apply ng AICS Assistance"}</span>
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {disbursements.map((d) => {
              const hasAppt = Boolean(d.appointmentDate)
              const dt = parseAppointmentDateTime(d.appointmentDate, d.appointmentTime)
              const isTimeReached = Boolean(dt && new Date().getTime() >= dt.getTime())
              const effectiveStatus: DisbursementStage = (d.status === "RELEASED" || isTimeReached) ? "RELEASED" : "PENDING"
              const isReleased = effectiveStatus === "RELEASED"
              const badge = getStageBadge(effectiveStatus, hasAppt)

            return (
              <div
                key={d.id || d.disbursementId}
                className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-5"
              >
                {/* Top Voucher Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-blue-700">
                        {d.disbursementId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(d.disbursementId)}
                        title="Kopyahin ang Disbursement ID"
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors cursor-pointer"
                      >
                        {copiedVoucher === d.disbursementId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-[11px] font-medium text-gray-400">
                        • Application Ref: <strong>{d.applicationRef}</strong>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{d.assistanceType}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">
                        {t("approvedFixedAmount") || "Approved Fixed Amount"}
                      </span>
                      <span className="text-2xl font-black text-emerald-700">
                        ₱{d.fixedAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── APPOINTMENT & STATUS DETAILS ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Appointment Box */}
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-blue-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {t("payoutApptSchedule") || "Payout Appointment Schedule"}
                    </span>
                    {d.appointmentDate ? (
                      <div>
                        <p className="text-sm font-extrabold text-blue-950">
                          {d.appointmentDate}
                        </p>
                        <p className="text-xs font-bold text-blue-800 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {d.appointmentTime || "10:00 AM"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-blue-700 italic">
                        Inihahanda pa ng Admin ang inyong iskedyul ng appointment.
                      </p>
                    )}
                  </div>

                  {/* Payout Location Box */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-gray-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      {t("payoutLocationVenue") || "Payout Location / Venue"}
                    </span>
                    <p className="text-sm font-bold text-gray-900">
                      {d.venue || "Quezon City Hall"}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Social Services Development Department Counter
                    </p>
                  </div>
                </div>

                {/* Status Stepper */}
                <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700">{t("financialAidStatusLabel") || "Katayuan ng Ayuda:"}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div
                      className={`p-3 rounded-xl border text-center transition-all ${
                        !isReleased
                          ? "bg-amber-100/90 border-amber-300 text-amber-900 font-extrabold shadow-2xs ring-2 ring-amber-200"
                          : "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                      }`}
                    >
                      <span className="text-[10px] block text-gray-500 uppercase">Step 1</span>
                      <span className="text-xs font-bold">{t("step1PendingScheduled") || "PENDING / SCHEDULED"}</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">{t("step1PendingDesc") || "Pumunta sa City Hall sa takdang araw"}</p>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isReleased
                          ? "bg-emerald-100/90 border-emerald-300 text-emerald-900 font-extrabold shadow-2xs ring-2 ring-emerald-200"
                          : "bg-white border-gray-200 text-gray-400"
                      }`}
                    >
                      <span className="text-[10px] block text-gray-500 uppercase">Step 2</span>
                      <span className="text-xs font-bold">{t("step2Released") || "RELEASED"}</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">{t("step2ReleasedDesc") || "Naipagkaloob na ang ayuda"}</p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50/60 border border-blue-200/70 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    {t("payoutReminderNotice") || (
                      <>
                        <span className="font-bold">Paalala sa Pagdalo sa Appointment:</span> Dalhin ang inyong <strong>QCitizen ID</strong> o 1 Valid Government-issued ID kasama ang orihinal na kopya ng inyong mga dokumento sa takdang oras ng payout.
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
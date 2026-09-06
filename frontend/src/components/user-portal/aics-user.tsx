import { useState, useEffect, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  CheckCircle2,
  Info,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Clock,
  Sparkles,
  FileCheck,
  Building2,
  PhoneCall
} from "lucide-react"
import ApplyAICS from "./apply-aics"
import AICSServiceWizard, { type AICSServiceType } from "./aics-service-wizard"
import { useLanguage } from "../ui/language-context"
import { API_BASE } from "../../config/api"
import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"

const AICS_CONFIG: Record<
  string,
  { title: string; key: string; reqKey: string; icon: string; matchers: string[]; desc: string; requirements: string[] }
> = {
  medical: {
    title: "Medical Assistance",
    key: "aicsMedical",
    reqKey: "aicsMedical",
    icon: "🩺",
    matchers: ["medical", "gamot", "hospital", "medicine", "medikal"],
    desc: "Hospitalization expenses, medicines, chemotherapy, dialysis, and diagnostic laboratory procedures.",
    requirements: ["Medical Abstract / Certificate", "Hospital Statement of Account / Pharmacy Quotation", "Barangay Indigency", "Valid QCID / Gov ID"]
  },
  funeral: {
    title: "Funeral Assistance",
    key: "aicsFuneral",
    reqKey: "aicsFuneral",
    icon: "🕊️",
    matchers: ["funeral", "burial", "libing", "patay", "burol"],
    desc: "Burial, cremation, and casket assistance for deceased indigent family members.",
    requirements: ["Death Certificate (Certified Copy)", "Funeral Contract / Official Receipt", "Barangay Indigency", "Valid QCID / Gov ID"]
  },
  educational: {
    title: "Educational Assistance",
    key: "Educational Assistance",
    reqKey: "aicsEducational",
    icon: "🎓",
    matchers: ["educational", "education", "aral", "school", "tuition", "edukasyon"],
    desc: "Tuition support, school supplies, learning aids, and student subsistence allowances.",
    requirements: ["Certificate of Registration / Enrollment", "School ID / Assessment Form", "Barangay Indigency", "Parent/Guardian ID"]
  },
  material: {
    title: "Material Assistance",
    key: "aicsMaterial",
    reqKey: "aicsMaterial",
    icon: "📦",
    matchers: ["material", "materyal"],
    desc: "Provisions of assistive medical devices, relief supplies, and emergency family essentials.",
    requirements: ["Barangay Certificate of Indigency / Incident Report", "Valid QCID / Government ID", "Social Worker Case Report"]
  },
  food: {
    title: "Food Assistance",
    key: "aicsFood",
    reqKey: "aicsFood",
    icon: "🍲",
    matchers: ["food", "pagkain", "grocery"],
    desc: "Emergency nutritional food packages and subsistence grocery assistance for families in crisis.",
    requirements: ["Barangay Certificate of Indigency", "Valid QCID / Government ID", "Proof of Family Dependency"]
  },
  transportation: {
    title: "Transportation Assistance",
    key: "aicsTransportation",
    reqKey: "aicsTransportation",
    icon: "🚌",
    matchers: ["transportation", "pamasahe", "transpo", "travel", "transport"],
    desc: "Emergency transit fares and repatriation allowance for stranded citizens returning to their provinces.",
    requirements: ["Barangay Certificate / Police Blotter if stranded", "Valid QCID / Government ID", "Proof of Travel Need"]
  },
}

export default function AICSUser() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const rawType = searchParams.get("type")?.toLowerCase() || "medical"
  const typeParam = AICS_CONFIG[rawType] ? rawType : "medical"
  const selectedConfig = AICS_CONFIG[typeParam] || AICS_CONFIG.medical

  const [isBlocked, setIsBlocked] = useState(false)
  const [blockedApp, setBlockedApp] = useState<any>(null)
  const [bypassedBlock, setBypassedBlock] = useState(false)
  const bypassedBlockRef = useRef(false)

  const handleNavigateType = (newType: string) => {
    bypassedBlockRef.current = false
    setBypassedBlock(false)
    setSearchParams({ type: newType.toLowerCase() })
  }

  // Reset bypass state on service tab change
  useEffect(() => {
    bypassedBlockRef.current = false
    setBypassedBlock(false)
    setIsBlocked(false)
    setBlockedApp(null)
  }, [typeParam])

  // Real-time polling & eligibility check for active/approved AICS applications
  useEffect(() => {
    let isMounted = true

    const isMatchForService = (app: any, serviceType: string) => {
      if (!app) return false
      const cfg = AICS_CONFIG[serviceType] || AICS_CONFIG.medical
      const appType = String(
        app.assistance_type ||
          app.type ||
          app.assistanceType ||
          app.service ||
          app.assistance_program ||
          app.program ||
          ""
      ).toLowerCase()

      const isMatchCategory = cfg.matchers.some((m) => appType.includes(m))
      if (!isMatchCategory) return false

      const prof = getCurrentUserProfile()
      const currentQcid = (
        getLoggedInUserQcid() ||
        prof?.qcidNo ||
        prof?.qcidNumber ||
        "110000572516915"
      )
        .toLowerCase()
        .trim()
      const currentEmail = (prof?.email || "").toLowerCase().trim()
      const currentLastName = (prof?.lastName || "").toLowerCase().trim()
      const currentFirstName = (prof?.firstName || "").toLowerCase().trim()

      const appRef = String(
        app.reference_no ||
          app.referenceNumber ||
          app.reference_number ||
          app.applicationRef ||
          app.qc_id ||
          app.qcId ||
          app.qcid ||
          app.id ||
          ""
      )
        .toLowerCase()
        .trim()
      const appEmail = String(app.email || app.applicantEmail || "").toLowerCase().trim()
      const appName = String(
        app.full_name ||
          app.applicantName ||
          app.applicant_name ||
          app.name ||
          `${app.first_name || ""} ${app.last_name || ""}`
      )
        .toLowerCase()
        .trim()

      const matchQcid =
        (currentQcid &&
          (appRef === currentQcid ||
            appRef.includes(currentQcid) ||
            currentQcid.includes(appRef))) ||
        appRef.includes("110000116932100") ||
        appRef.includes("110000572516915")
      const matchEmail = Boolean(currentEmail && appEmail && currentEmail === appEmail)
      const matchName = Boolean(
        (currentLastName &&
          currentFirstName &&
          appName.includes(currentLastName) &&
          appName.includes(currentFirstName)) ||
          appName.includes("clarisa") ||
          appName.includes("dimal") ||
          appName.includes("renz") ||
          appName.includes("millares")
      )

      return Boolean(matchQcid || matchEmail || matchName || app.isCurrentUser)
    }

    const checkActiveApp = async () => {
      if (bypassedBlockRef.current) return
      try {
        let allApps: any[] = []
        const currentQcid = getLoggedInUserQcid() || "110000572516915"

        // 1. Fetch user-specific AICS applications
        try {
          const res = await fetch(
            `${API_BASE}/api/aics/applications?qcId=${encodeURIComponent(currentQcid)}`
          )
          if (res.ok) {
            const data = await res.json()
            if (data.applications && Array.isArray(data.applications)) {
              allApps = data.applications
            } else if (Array.isArray(data)) {
              allApps = data
            }
          }
        } catch {}

        // 2. Global applications fallback
        try {
          const resGlobal = await fetch(`${API_BASE}/api/aics/applications`)
          if (resGlobal.ok) {
            const dataGlobal = await resGlobal.json()
            const list = Array.isArray(dataGlobal)
              ? dataGlobal
              : dataGlobal.applications || []
            for (const item of list) {
              if (
                item &&
                !allApps.some(
                  (a) =>
                    (a.id && a.id === item.id) ||
                    (a.reference_no && a.reference_no === item.reference_no)
                )
              ) {
                allApps.push(item)
              }
            }
          }
        } catch {}

        // 3. LocalStorage items fallback
        const localKeys = [
          "aics_applications",
          "all_financial_disbursements",
          "applications",
          "all_user_applications",
          "active_applications",
          "citizen_applications",
          "user_applications",
        ]
        for (const k of localKeys) {
          try {
            const local = JSON.parse(localStorage.getItem(k) || "[]")
            if (Array.isArray(local)) {
              for (const la of local) {
                if (
                  la &&
                  !allApps.some(
                    (a) =>
                      (a.id && a.id === la.id) ||
                      (a.reference_no && a.reference_no === (la.reference_no || la.applicationRef))
                  )
                ) {
                  allApps.push({
                    ...la,
                    reference_no: la.reference_no || la.applicationRef || la.disbursementId || la.id,
                    assistance_type: la.assistance_type || la.assistanceType || la.type || la.service,
                    created_at: la.created_at || la.dateApproved || la.submittedAt,
                    isCurrentUser: true,
                  })
                }
              }
            }
          } catch {}
        }

        const userMatchingApps = allApps.filter((a) =>
          isMatchForService(a, typeParam)
        )
        const matchedApproved = userMatchingApps.find((a) => {
          const s = String(a.status || "").toLowerCase()
          return (
            s === "approved" ||
            s === "completed" ||
            s === "for_release" ||
            s === "released"
          )
        })
        const matchedPending = userMatchingApps.find((a) => {
          const s = String(a.status || "pending").toLowerCase()
          return (
            s === "pending" ||
            s === "under_review" ||
            s === "assessment" ||
            s === "for_assessment"
          )
        })

        if (isMounted && !bypassedBlockRef.current) {
          if (matchedApproved) {
            setIsBlocked(true)
            setBlockedApp(matchedApproved)
          } else if (matchedPending) {
            setIsBlocked(true)
            setBlockedApp(matchedPending)
          } else {
            setIsBlocked(false)
            setBlockedApp(null)
          }
        }
      } catch (err) {
        console.warn("AICS Active check offline/skipped:", err)
      }
    }

    checkActiveApp()
    const pollInterval = setInterval(checkActiveApp, 2000)

    const handleUpdated = () => checkActiveApp()
    window.addEventListener("aics_applications_updated", handleUpdated)
    window.addEventListener("aics_application_submitted", handleUpdated)
    window.addEventListener("applications_updated", handleUpdated)
    window.addEventListener("financial_disbursements_updated", handleUpdated)
    window.addEventListener("storage", handleUpdated)

    return () => {
      isMounted = false
      clearInterval(pollInterval)
      window.removeEventListener("aics_applications_updated", handleUpdated)
      window.removeEventListener("aics_application_submitted", handleUpdated)
      window.removeEventListener("applications_updated", handleUpdated)
      window.removeEventListener("financial_disbursements_updated", handleUpdated)
      window.removeEventListener("storage", handleUpdated)
    }
  }, [typeParam])

  if (isBlocked && !bypassedBlock) {
    const isAppApproved =
      String(blockedApp?.status || "").toLowerCase() === "approved" ||
      String(blockedApp?.status || "").toLowerCase() === "completed" ||
      String(blockedApp?.status || "").toLowerCase() === "for_release" ||
      String(blockedApp?.status || "").toLowerCase() === "released"
    const displayRef =
      getLoggedInUserQcid() ||
      blockedApp?.reference_no ||
      blockedApp?.reference_number ||
      blockedApp?.referenceNumber ||
      blockedApp?.qc_id ||
      blockedApp?.id ||
      "110000572516915"
    const displayDate =
      blockedApp?.created_at ||
      blockedApp?.submittedAt ||
      blockedApp?.dateSubmitted
        ? new Date(
            blockedApp.created_at ||
              blockedApp.submittedAt ||
              blockedApp.dateSubmitted
          ).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : new Date().toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })

    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-150 py-6">
        {/* Top Header & Breadcrumb / Guide Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-900 text-white p-5 rounded-2xl shadow-sm">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200">
              <ShieldAlert className="h-4 w-4" />
              AICS Crisis Intervention Program
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {selectedConfig.title} Status & Service Hub
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/portal/overview")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer self-start sm:self-auto"
          >
            <BookOpen className="h-4 w-4" />
            View Citizen Service Guide
          </button>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
          <div
            className={`h-16 w-16 rounded-2xl flex items-center justify-center ${
              isAppApproved
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-amber-500/10 text-amber-500"
            }`}
          >
            {isAppApproved ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            ) : (
              <Info className="h-8 w-8 text-amber-500" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isAppApproved
                ? "Application Approved"
                : "You Have an Active Application"}
            </h2>
            <p className="text-sm text-gray-500 max-w-md mt-1 leading-relaxed">
              {isAppApproved
                ? `Your application for ${selectedConfig.title} has been officially approved! You can check your scheduled appointment or payout release status in Financial Aid / My Applications.`
                : `Your application for ${selectedConfig.title} has been successfully submitted and is currently pending review. Please wait for a Social Worker's assessment before submitting a new application.`}
            </p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-gray-500 font-medium">
                Application Reference No.:
              </span>
              <span className="font-mono font-bold text-blue-600">
                {displayRef}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-gray-500 font-medium">Status:</span>
              {isAppApproved ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Under Review (Pending)
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Date Filed:</span>
              <span className="font-semibold text-gray-700">{displayDate}</span>
            </div>
          </div>

          <div className="w-full pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => {
                navigate("/portal/financial-aid")
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs uppercase tracking-wide flex items-center justify-center gap-1.5"
            >
              VIEW IN FINANCIAL AID / DISBURSEMENT
            </button>
            <button
              type="button"
              onClick={() => {
                bypassedBlockRef.current = true
                setBypassedBlock(true)
                setIsBlocked(false)
                setBlockedApp(null)
              }}
              className="py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isAppApproved ? "Submit Another Application" : "Edit / Open Application Form"}
            </button>
          </div>
        </div>

        {/* Helpful AICS Program Guide & Other Assistance Types (Below Status) */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">
              Explore Other Available AICS Crisis Programs & Requirements
            </h3>
            <p className="text-xs text-gray-500">
              Need assistance in other categories? You can apply for any of the 6 specialized programs below:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(AICS_CONFIG).map(([k, cfg]) => {
              const isCurrent = k === typeParam
              return (
                <div
                  key={k}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all gap-3 ${
                    isCurrent
                      ? "bg-blue-50/50 border-blue-300 ring-1 ring-blue-300"
                      : "bg-slate-50 border-gray-200 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{cfg.icon}</span>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{cfg.title}</h4>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                            Currently Selected
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{cfg.desc}</p>
                    
                    <div className="text-[11px] text-gray-500 bg-white/80 p-2.5 rounded-lg border border-gray-200/60">
                      <span className="font-bold text-gray-700 block mb-1">Key Documents:</span>
                      <ul className="list-disc list-inside space-y-0.5">
                        {cfg.requirements.slice(0, 2).map((r, rIdx) => (
                          <li key={rIdx} className="truncate">{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigateType(k)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      isCurrent
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-900 text-white hover:bg-blue-600"
                    }`}
                  >
                    {isCurrent ? "View Current Service" : `Switch to ${cfg.title}`} <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (
    typeParam === "material" ||
    typeParam === "food" ||
    typeParam === "transportation"
  ) {
    return (
      <div className="py-2 space-y-4">
        {/* Top Service Guide Context Banner */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-xl bg-white/10">{selectedConfig.icon}</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">{selectedConfig.title}</h2>
                <p className="text-xs text-blue-200">{selectedConfig.desc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/portal/overview")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Help & Guide
            </button>
          </div>
        </div>

        <AICSServiceWizard
          key={typeParam}
          serviceType={typeParam as AICSServiceType}
          onBack={() => handleNavigateType("medical")}
        />
      </div>
    )
  }

  return (
    <div className="py-2 space-y-4">
      {/* Top Service Guide Context Banner */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-xl bg-white/10">{selectedConfig.icon}</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">{selectedConfig.title}</h2>
              <p className="text-xs text-blue-200">{selectedConfig.desc}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/portal/overview")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Help & Guide
          </button>
        </div>
      </div>

      <ApplyAICS
        key={selectedConfig.reqKey}
        initialType={t(selectedConfig.key)}
        initialTypeKey={selectedConfig.reqKey}
      />
    </div>
  )
}
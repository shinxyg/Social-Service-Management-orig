import { useState, useEffect, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  CheckCircle2,
  Info,
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

        const userMatchingApps = allApps
          .filter((a) => isMatchForService(a, typeParam))
          .sort((a, b) => {
            const timeA = new Date(a.created_at || a.submittedAt || a.dateSubmitted || 0).getTime()
            const timeB = new Date(b.created_at || b.submittedAt || b.dateSubmitted || 0).getTime()
            return timeB - timeA
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

        const matchedApproved = userMatchingApps.find((a) => {
          const s = String(a.status || "").toLowerCase()
          return (
            s === "approved" ||
            s === "completed" ||
            s === "for_release" ||
            s === "released"
          )
        })

        if (isMounted && !bypassedBlockRef.current) {
          // If there is an active application pending review by admin, ALWAYS prioritize and display Pending!
          if (matchedPending) {
            setIsBlocked(true)
            setBlockedApp(matchedPending)
          } else if (matchedApproved) {
            setIsBlocked(true)
            setBlockedApp(matchedApproved)
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
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4 animate-in fade-in duration-150 py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center gap-4">
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

          <div className="w-full pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                navigate("/portal/financial-aid")
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs uppercase tracking-wide"
            >
              VIEW IN FINANCIAL AID / DISBURSEMENT
            </button>
            {isAppApproved && (
              <button
                type="button"
                onClick={() => {
                  bypassedBlockRef.current = true
                  setBypassedBlock(true)
                  setIsBlocked(false)
                  setBlockedApp(null)
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Submit Another Application (Apply Again)
              </button>
            )}
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
      <div className="py-2">
        <AICSServiceWizard
          key={typeParam}
          serviceType={typeParam as AICSServiceType}
          onBack={() => handleNavigateType("medical")}
        />
      </div>
    )
  }

  return (
    <div className="py-2">
      <ApplyAICS
        key={selectedConfig.reqKey}
        initialType={t(selectedConfig.key)}
        initialTypeKey={selectedConfig.reqKey}
      />
    </div>
  )
}
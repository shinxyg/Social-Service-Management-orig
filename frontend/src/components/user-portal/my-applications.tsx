import { useState, useEffect } from "react"
import {
  FileText,
  Search,
  ArrowLeft,
  Clock,
  CheckCircle2,
  User,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Copy,
  Check,
  Banknote,
  MapPin,
} from "lucide-react"
import { API_BASE } from "../../config/api"
import { getLoggedInUserQcid } from "../../utils/userProfile"
import {
  FIXED_ASSISTANCE_AMOUNTS,
  getSavedDisbursements,
  checkAndAutoReleaseScheduledDisbursements,
} from "../../utils/financialAidSync"
import { useLanguage } from "../ui/language-context"

export type ApplicationStatus =
  | "Pending"
  | "Under Review"
  | "For Assessment"
  | "Approved"
  | "For Release"
  | "Released"

export interface ApplicationRecord {
  applicationNo: string
  assistance: string
  assistanceCategory: string
  dateApplied: string
  status: ApplicationStatus
  applicantName: string
  dateOfBirth: string
  address: string
  contactNumber: string
  email?: string
  remarks?: string
}

const DEFAULT_APPLICATIONS: ApplicationRecord[] = [
  {
    applicationNo: "AICS-2026-0001",
    assistance: "Transportation Assistance",
    assistanceCategory: "AICS",
    dateApplied: "August 31, 2026",
    status: "Under Review",
    applicantName: "CLARISA MAE GALIAS DIMAL",
    dateOfBirth: "October 29, 1960",
    address: "11 OLD CABUYAO SAMPALOK ST, Sauyo, QUEZON CITY",
    contactNumber: "09000000000",
    email: "dimalmae@gmail.com",
    remarks: "Dokumento ay kasalukuyang sinusuri ng social worker para sa assessment.",
  },
  {
    applicationNo: "AICS-2026-0002",
    assistance: "Material Assistance",
    assistanceCategory: "AICS",
    dateApplied: "August 30, 2026",
    status: "For Assessment",
    applicantName: "CLARISA MAE GALIAS DIMAL",
    dateOfBirth: "October 29, 1960",
    address: "11 OLD CABUYAO SAMPALOK ST, Sauyo, QUEZON CITY",
    contactNumber: "09000000000",
    email: "dimalmae@gmail.com",
    remarks: "Nakatakda para sa panayam at pagsusuri ng pangangailangan.",
  },
  {
    applicationNo: "AICS-2026-0003",
    assistance: "Medical Assistance",
    assistanceCategory: "AICS",
    dateApplied: "August 28, 2026",
    status: "For Release",
    applicantName: "CLARISA MAE GALIAS DIMAL",
    dateOfBirth: "October 29, 1960",
    address: "11 OLD CABUYAO SAMPALOK ST, Sauyo, QUEZON CITY",
    contactNumber: "09000000000",
    email: "dimalmae@gmail.com",
    remarks: "Inaprubahan. Handa na para sa disbursement sa City Hall payout counter.",
  },
  {
    applicationNo: "PWD-2026-0012",
    assistance: "Persons with Disability (PWD) ID",
    assistanceCategory: "PWD",
    dateApplied: "August 25, 2026",
    status: "Released",
    applicantName: "CLARISA MAE GALIAS DIMAL",
    dateOfBirth: "October 29, 1960",
    address: "11 OLD CABUYAO SAMPALOK ST, Sauyo, QUEZON CITY",
    contactNumber: "09000000000",
    email: "dimalmae@gmail.com",
    remarks: "Na-release na ang PWD ID card sa barangay / district office.",
  },
]

export default function MyApplications() {
  const { t } = useLanguage()
  const [applications, setApplications] = useState<ApplicationRecord[]>(DEFAULT_APPLICATIONS)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null)
  const [copied, setCopied] = useState(false)

  // Subaybayan ang lahat ng naisumiteng aplikasyon sa buong sistema
  useEffect(() => {
    const fetchUserApps = async () => {
      // Auto-release engine check
      checkAndAutoReleaseScheduledDisbursements()

      const qcId = getLoggedInUserQcid()
      const userId = localStorage.getItem("userId") || "1"
      let allFoundApps: ApplicationRecord[] = []

      // 1. AICS Applications
      try {
        const res = await fetch(`${API_BASE}/api/aics/applications?qcId=${qcId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.applications && Array.isArray(data.applications)) {
            const mappedAics: ApplicationRecord[] = data.applications.map((app: any) => {
              const rawType = (app.assistance_type || "Transportation").replace(/\s*assistance/gi, "").trim()
              const cleanAssistance = rawType.charAt(0).toUpperCase() + rawType.slice(1) + " Assistance"

              return {
                applicationNo: app.reference_number || `AICS-2026-${String(app.id).padStart(4, "0")}`,
                assistance: cleanAssistance,
                assistanceCategory: "AICS",
                dateApplied: new Date(app.created_at || Date.now()).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                status:
                  app.status === "approved"
                    ? "Approved"
                    : app.status === "released"
                    ? "Released"
                    : app.status === "for_release"
                    ? "For Release"
                    : app.status === "assessment"
                    ? "For Assessment"
                    : "Under Review",
                applicantName: app.full_name || "CLARISA MAE GALIAS DIMAL",
                dateOfBirth: app.birth_date || "October 29, 1960",
                address: app.address || "11 OLD CABUYAO SAMPALOK ST, Sauyo, QUEZON CITY",
                contactNumber: app.contact_number || "09000000000",
                email: "dimalmae@gmail.com",
              }
            })
            allFoundApps.push(...mappedAics)
          }
        }
      } catch (err) {
        console.warn("Could not fetch AICS applications:", err)
      }

      // 2. PWD & Senior Citizen Applications
      try {
        let pwdApps: any[] = []
        try {
          const pwdRes = await fetch(`${API_BASE}/api/pwd-senior/applications`)
          if (pwdRes.ok) {
            pwdApps = await pwdRes.json()
          }
        } catch {}
        if (!pwdApps || pwdApps.length === 0) {
          try {
            pwdApps = JSON.parse(localStorage.getItem("pwd_senior_applications") || "[]")
          } catch {}
        }

        const mappedPwd: ApplicationRecord[] = (pwdApps || [])
          .filter((p: any) => {
            return (
              !qcId ||
              p.referenceNumber === qcId ||
              p.email === "dimalmae@gmail.com" ||
              (p.lastName && p.lastName.toLowerCase().includes("dimal"))
            )
          })
          .map((p: any) => {
            const isPwd =
              String(p.category || "").toUpperCase() === "PWD" ||
              String(p.category || "").toLowerCase().includes("disability")
            const typeStr = String(p.type || "new").toLowerCase()
            const serviceTitle = isPwd
              ? typeStr === "assistance"
                ? "PWD Social Assistance"
                : typeStr === "renewal"
                ? "Persons with Disability (PWD) ID Renewal"
                : typeStr === "loss" || typeStr === "replacement"
                ? "Persons with Disability (PWD) ID Replacement"
                : "Persons with Disability (PWD) ID"
              : typeStr === "medicine-booklet"
              ? "Senior Citizen Medicine Booklet"
              : typeStr === "movie-booklet"
              ? "Senior Citizen Movie Booklet"
              : typeStr === "social-assistance"
              ? "Senior Citizen Social Assistance"
              : typeStr === "renewal"
              ? "Senior Citizen ID Renewal"
              : typeStr === "loss" || typeStr === "replacement"
              ? "Senior Citizen ID Replacement"
              : "Senior Citizen ID"

            let appStatus: ApplicationStatus = "Pending"
            if (p.status === "approved") appStatus = "Approved"
            else if (p.status === "released") appStatus = "Released"
            else if (p.status === "for_release") appStatus = "For Release"
            else if (p.status === "under_review" || p.status === "review") appStatus = "Under Review"

            return {
              applicationNo: p.assignedIdNumber || p.referenceNumber || p.id,
              assistance: serviceTitle,
              assistanceCategory: isPwd ? "PWD" : "Senior Citizen",
              dateApplied: new Date(p.submittedAt || p.created_at || Date.now()).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              status: appStatus,
              applicantName: [p.firstName, p.middleName, p.lastName, p.suffix].filter(Boolean).join(" "),
              dateOfBirth: p.dateOfBirth || "October 29, 1960",
              address: p.address || "Quezon City",
              contactNumber: p.contactNo || p.cellphoneNo || "09171234567",
              email: p.email || "applicant@example.com",
              remarks:
                p.status === "approved"
                  ? `Inaprubahan na. Assigned ID Number: ${p.assignedIdNumber || "Available sa Tanggapan"}`
                  : p.status === "rejected"
                  ? `Kailangang suriin muli: ${p.rejectionReason || "Hindi sapat ang dokumento."}`
                  : "Kasalukuyang sinusuri ng PDAO / OSCA social worker.",
            }
          })
        allFoundApps.push(...mappedPwd)
      } catch (err) {
        console.warn("Could not fetch PWD/Senior applications:", err)
      }

      // 3. Solo Parent Applications
      try {
        const spRes = await fetch(`${API_BASE}/api/solo-parent/user/${userId}`)
        if (spRes.ok) {
          const spData = await spRes.json()
          if (spData.applications && Array.isArray(spData.applications)) {
            const mappedSp: ApplicationRecord[] = spData.applications.map((app: any) => ({
              applicationNo: app.reference_number || `SP-${app.id}`,
              assistance: `Solo Parent ID (${app.application_type || "New"})`,
              assistanceCategory: "Solo Parent",
              dateApplied: new Date(app.created_at || Date.now()).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              status:
                app.application_status === "approved"
                  ? "Approved"
                  : app.application_status === "released"
                  ? "Released"
                  : app.application_status === "for_release"
                  ? "For Release"
                  : "Under Review",
              applicantName: [app.first_name, app.last_name].filter(Boolean).join(" ") || "Applicant",
              dateOfBirth: "N/A",
              address: "Quezon City",
              contactNumber: "09000000000",
              email: "applicant@example.com",
              remarks: app.admin_notes || (app.application_status === "approved" ? "Application approved" : "Under review"),
            }))
            allFoundApps.push(...mappedSp)
          }
        }
      } catch (err) {
        console.warn("Could not fetch Solo Parent applications:", err)
      }

      // 4. Child Welfare Applications
      try {
        const cwRes = await fetch(`${API_BASE}/api/child-welfare/user/${userId}`)
        if (cwRes.ok) {
          const cwData = await cwRes.json()
          if (cwData.applications && Array.isArray(cwData.applications)) {
            const mappedCw: ApplicationRecord[] = cwData.applications.map((app: any) => ({
              applicationNo: app.reference_number || `CW-${app.id}`,
              assistance: app.category_title || "Child Welfare Assistance",
              assistanceCategory: "Child Welfare",
              dateApplied: new Date(app.created_at || Date.now()).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              status:
                app.application_status === "approved"
                  ? "Approved"
                  : app.application_status === "released"
                  ? "Released"
                  : "Under Review",
              applicantName: app.child_name || "Beneficiary Child",
              dateOfBirth: "N/A",
              address: "Quezon City",
              contactNumber: "09000000000",
              email: "applicant@example.com",
              remarks: app.application_status === "approved" ? "Approved by Child Welfare" : "Under review",
            }))
            allFoundApps.push(...mappedCw)
          }
        }
      } catch (err) {
        console.warn("Could not fetch Child Welfare applications:", err)
      }

      // 5. Livelihood Applications
      try {
        let livApps: any[] = []
        try {
          const livRes = await fetch(`${API_BASE}/api/livelihood/applications`)
          if (livRes.ok) {
            const lData = await livRes.json()
            livApps = Array.isArray(lData) ? lData : lData.applications || []
          }
        } catch {}
        if (!livApps || livApps.length === 0) {
          try {
            livApps = JSON.parse(localStorage.getItem("livelihood_applications") || "[]")
          } catch {}
        }
        if (Array.isArray(livApps) && livApps.length > 0) {
          const mappedLiv: ApplicationRecord[] = livApps.map((l: any) => ({
            applicationNo: l.reference_number || `LIV-${l.id}`,
            assistance: l.proposed_business_name ? `Livelihood Assistance: ${l.proposed_business_name}` : "Livelihood Assistance",
            assistanceCategory: "Livelihood",
            dateApplied: new Date(l.created_at || Date.now()).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            status:
              l.status === "Approved" || l.status === "approved"
                ? "Approved"
                : l.status === "Released" || l.status === "released"
                ? "Released"
                : "Under Review",
            applicantName: l.applicant_name || [l.first_name, l.last_name].filter(Boolean).join(" ") || "Applicant",
            dateOfBirth: "N/A",
            address: l.address || "Quezon City",
            contactNumber: l.contact_number || "09000000000",
            email: l.email || "applicant@example.com",
            remarks: l.remarks || "Livelihood capital assistance application",
          }))
          allFoundApps.push(...mappedLiv)
        }
      } catch (err) {
        console.warn("Could not fetch Livelihood applications:", err)
      }

      // 6. Training Applications
      try {
        let trnApps: any[] = []
        try {
          const trnRes = await fetch(`${API_BASE}/api/training/applications`)
          if (trnRes.ok) {
            const tData = await trnRes.json()
            trnApps = Array.isArray(tData) ? tData : tData.applications || []
          }
        } catch {}
        if (!trnApps || trnApps.length === 0) {
          try {
            trnApps = JSON.parse(localStorage.getItem("training_applications") || "[]")
          } catch {}
        }
        if (Array.isArray(trnApps) && trnApps.length > 0) {
          const mappedTrn: ApplicationRecord[] = trnApps.map((t: any) => ({
            applicationNo: t.reference_number || `TRN-${t.id}`,
            assistance: `Training: ${t.program_title || t.course_title || t.training_course || "Skills Training"}`,
            assistanceCategory: "Livelihood",
            dateApplied: new Date(t.created_at || Date.now()).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            status:
              t.status === "Enrolled" || t.status === "approved"
                ? "Approved"
                : t.status === "Completed"
                ? "Released"
                : "Under Review",
            applicantName: t.applicant_name || [t.first_name, t.last_name].filter(Boolean).join(" ") || "Applicant",
            dateOfBirth: "N/A",
            address: "Quezon City",
            contactNumber: t.contact_number || "09000000000",
            email: t.email || "applicant@example.com",
            remarks: `Training course application for ${t.program_title || "Skills Program"}`,
          }))
          allFoundApps.push(...mappedTrn)
        }
      } catch (err) {
        console.warn("Could not fetch Training applications:", err)
      }

      // Default sample if no records exist yet
      if (allFoundApps.length === 0) {
        setApplications(DEFAULT_APPLICATIONS)
      } else {
        // Guarantee default sample is present for visual completeness if not already
        if (!allFoundApps.some((a) => a.applicationNo === "AICS-2026-0001")) {
          allFoundApps.unshift(DEFAULT_APPLICATIONS[0])
        }
        setApplications(allFoundApps)
      }
    }

    fetchUserApps()
  }, [])

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      app.applicationNo.toLowerCase().includes(q) ||
      app.assistance.toLowerCase().includes(q) ||
      app.applicantName.toLowerCase().includes(q) ||
      app.status.toLowerCase().includes(q) ||
      app.assistanceCategory.toLowerCase().includes(q)
    )
  })

  const handleCopyNo = (text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // STATUS HELPERS
  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "Under Review":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />,
          label: "Under Review",
        }
      case "For Assessment":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          icon: <FileText className="w-3.5 h-3.5 text-blue-600" />,
          label: "For Assessment",
        }
      case "Approved":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          label: "Approved",
        }
      case "For Release":
        return {
          bg: "bg-purple-50 text-purple-800 border-purple-200",
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-600" />,
          label: "For Release",
        }
      case "Released":
        return {
          bg: "bg-teal-50 text-teal-800 border-teal-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
          label: "Released",
        }
      case "Pending":
      default:
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          label: "Pending",
        }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ── VIEW APPLICATION PAGE (Detail Screen)
  // ═══════════════════════════════════════════════════════════════════════
  if (selectedApp) {
    const currentStatus = selectedApp.status

    // Check status active stages based on the flow tree:
    // Application Status
    //    ├── Pending -> Under Review -> For Assessment
    //    └── Approved -> For Release -> Released
    const isPendingBranch =
      currentStatus === "Pending" ||
      currentStatus === "Under Review" ||
      currentStatus === "For Assessment"

    const isApprovedBranch =
      currentStatus === "Approved" ||
      currentStatus === "For Release" ||
      currentStatus === "Released"

    const isUnderReviewActive = currentStatus === "Under Review"
    const isForAssessmentActive = currentStatus === "For Assessment"
    const isForReleaseActive = currentStatus === "For Release"
    const isReleasedActive = currentStatus === "Released"

    const badge = getStatusBadge(currentStatus)

    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Top Back Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <button
            onClick={() => setSelectedApp(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("backToMyApplications") || "Bumalik sa My Application"}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Application Status:</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
            >
              {badge.icon}
              {badge.label}
            </span>
          </div>
        </div>

        {/* Page Title */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            {t("applicationDetailsTitle") || "View Application Details"}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {selectedApp.assistance}
          </h1>
          <p className="text-sm text-gray-500">
            Detalyadong impormasyon at opisyal na katayuan ng inyong naisumiteng aplikasyon.
          </p>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* ── APPLICATION STATUS FLOW TREE (The Requested User Diagram) ── */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Application Status Flow
              </h2>
              <p className="text-xs text-gray-500">
                Pagsusuri at daloy ng proseso mula sa pagsumite hanggang sa release ng tulong.
              </p>
            </div>

            {/* Test Status Switcher to easily preview all statuses */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs">
              <span className="text-[11px] text-gray-500 px-2 font-medium">Subukan:</span>
              {(["Under Review", "For Assessment", "For Release", "Released"] as ApplicationStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedApp({ ...selectedApp, status: st })}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      selectedApp.status === st
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Graphical Tree Rendering */}
          <div className="max-w-3xl mx-auto py-2">
            {/* Root: Application Status */}
            <div className="flex flex-col items-center">
              <div className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold shadow-xs tracking-wide">
                Application Status
              </div>

              {/* Vertical line from root */}
              <div className="w-0.5 h-6 bg-gray-300"></div>

              {/* Horizontal Splitter Line */}
              <div className="w-full max-w-lg relative flex items-center justify-center">
                <div className="absolute top-0 left-12 right-12 h-0.5 bg-gray-300"></div>
                <div className="absolute top-0 left-12 w-0.5 h-4 bg-gray-300"></div>
                <div className="absolute top-0 right-12 w-0.5 h-4 bg-gray-300"></div>
              </div>

              {/* Two Main Branches: Pending & Approved */}
              <div className="grid grid-cols-2 gap-4 sm:gap-12 w-full max-w-2xl pt-4">
                {/* ── LEFT BRANCH: PENDING ── */}
                <div className="flex flex-col items-center space-y-4">
                  <div
                    className={`w-full max-w-[200px] text-center px-4 py-2 rounded-xl border text-xs font-bold uppercase transition-all ${
                      isPendingBranch
                        ? "bg-amber-100/80 border-amber-300 text-amber-900 shadow-xs ring-2 ring-amber-400/20"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    Pending
                  </div>

                  <div className="w-0.5 h-4 bg-gray-300"></div>

                  {/* Step 1: Under Review */}
                  <div
                    className={`w-full max-w-[200px] p-3.5 rounded-xl border transition-all text-center space-y-1 ${
                      isUnderReviewActive
                        ? "bg-amber-50 border-amber-300 text-amber-900 shadow-md ring-4 ring-amber-100"
                        : currentStatus === "For Assessment" || isApprovedBranch
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {isUnderReviewActive ? (
                        <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                      ) : currentStatus === "For Assessment" || isApprovedBranch ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                      <span className="text-xs font-bold">Under Review</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Kasalukuyang sinusuri ang mga dokumento</p>
                    {isUnderReviewActive && (
                      <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                        Kasalukuyan
                      </span>
                    )}
                  </div>

                  <div className="w-0.5 h-4 bg-gray-300"></div>

                  {/* Step 2: For Assessment */}
                  <div
                    className={`w-full max-w-[200px] p-3.5 rounded-xl border transition-all text-center space-y-1 ${
                      isForAssessmentActive
                        ? "bg-blue-50 border-blue-300 text-blue-900 shadow-md ring-4 ring-blue-100"
                        : isApprovedBranch
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {isForAssessmentActive ? (
                        <FileText className="w-4 h-4 text-blue-600 animate-pulse" />
                      ) : isApprovedBranch ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                      <span className="text-xs font-bold">For Assessment</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Panayam ng Social Worker</p>
                    {isForAssessmentActive && (
                      <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-200/80 text-blue-900">
                        Kasalukuyan
                      </span>
                    )}
                  </div>
                </div>

                {/* ── RIGHT BRANCH: APPROVED ── */}
                <div className="flex flex-col items-center space-y-4">
                  <div
                    className={`w-full max-w-[200px] text-center px-4 py-2 rounded-xl border text-xs font-bold uppercase transition-all ${
                      isApprovedBranch
                        ? "bg-emerald-100/80 border-emerald-300 text-emerald-900 shadow-xs ring-2 ring-emerald-400/20"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    Approved
                  </div>

                  <div className="w-0.5 h-4 bg-gray-300"></div>

                  {/* Step 3: For Release */}
                  <div
                    className={`w-full max-w-[200px] p-3.5 rounded-xl border transition-all text-center space-y-1 ${
                      isForReleaseActive
                        ? "bg-purple-50 border-purple-300 text-purple-900 shadow-md ring-4 ring-purple-100"
                        : isReleasedActive
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {isForReleaseActive ? (
                        <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                      ) : isReleasedActive ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                      <span className="text-xs font-bold">For Release</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Ipinoproseso ang disbursement</p>
                    {isForReleaseActive && (
                      <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-200/80 text-purple-900">
                        Kasalukuyan
                      </span>
                    )}
                  </div>

                  <div className="w-0.5 h-4 bg-gray-300"></div>

                  {/* Step 4: Released */}
                  <div
                    className={`w-full max-w-[200px] p-3.5 rounded-xl border transition-all text-center space-y-1 ${
                      isReleasedActive
                        ? "bg-teal-50 border-teal-300 text-teal-900 shadow-md ring-4 ring-teal-100"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {isReleasedActive ? (
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                      <span className="text-xs font-bold">Released</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Matagumpay na natanggap ng aplikante</p>
                    {isReleasedActive && (
                      <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-200/80 text-teal-900">
                        Kumpleto
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* ── TWO-COLUMN DETAILS: Application Info & Applicant Info ── */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Application Information */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Application Information
              </h3>
              <span className="text-[11px] font-medium text-gray-400">Opisyal na Resibo</span>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Application No.:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-blue-700">{selectedApp.applicationNo}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyNo(selectedApp.applicationNo)}
                    title="Kopyahin"
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Assistance:</span>
                <span className="font-semibold text-gray-900">{selectedApp.assistance}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Date Applied:</span>
                <span className="text-gray-800">{selectedApp.dateApplied}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-medium text-gray-500">Status:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>
              </div>
            </div>

            {selectedApp.remarks && (
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 text-xs text-blue-900">
                <span className="font-semibold">Paunawa:</span> {selectedApp.remarks}
              </div>
            )}
          </div>

          {/* Card 2: Applicant Information */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Applicant Information
              </h3>
              <span className="text-[11px] font-medium text-gray-400">Beripikadong Rekord</span>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Full Name:</span>
                <span className="font-semibold text-gray-900 uppercase">{selectedApp.applicantName}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Date of Birth:</span>
                <span className="text-gray-800">{selectedApp.dateOfBirth}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-gray-50 gap-4">
                <span className="text-xs font-medium text-gray-500 shrink-0">Address:</span>
                <span className="text-right text-gray-800 text-xs sm:text-sm">{selectedApp.address}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-medium text-gray-500">Contact Number:</span>
                <span className="font-mono text-gray-800">{selectedApp.contactNumber}</span>
              </div>
            </div>

            {selectedApp.email && (
              <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Email Address:</span>
                <span className="text-gray-700">{selectedApp.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Financial Aid & Payout Appointment */}
        {(() => {
          const rawType = (selectedApp.assistance || "").replace(/\s*assistance/gi, "").trim()
          const formattedType = rawType.charAt(0).toUpperCase() + rawType.slice(1) + " Assistance"
          const fixedAmt = FIXED_ASSISTANCE_AMOUNTS[formattedType] || FIXED_ASSISTANCE_AMOUNTS[selectedApp.assistance] || 1000

          const savedDisbursements = getSavedDisbursements()
          const matchDisb = savedDisbursements.find(
            (d) =>
              d.applicationRef === selectedApp.applicationNo ||
              d.applicantName.toLowerCase().trim() === selectedApp.applicantName.toLowerCase().trim()
          )

          const apptDate = matchDisb?.appointmentDate || "August 31, 2026"
          const apptTime = matchDisb?.appointmentTime || "10:00 AM"
          const payoutVenue = matchDisb?.venue || "Quezon City Hall"

          return (
            <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-blue-50/90 border border-emerald-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  FINANCIAL AID & PAYOUT APPOINTMENT
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Awtomatikong Nakakabit
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white/80 rounded-xl p-3.5 border border-emerald-100 space-y-1">
                  <span className="text-gray-500 block uppercase font-bold text-[10px]">Approved Fixed Amount</span>
                  <span className="text-2xl font-black text-emerald-700">₱{fixedAmt.toLocaleString()}</span>
                  <p className="text-[10px] text-gray-500">Itinakda ayon sa uri ng serbisyo</p>
                </div>

                <div className="bg-white/80 rounded-xl p-3.5 border border-emerald-100 space-y-1">
                  <span className="text-gray-500 block uppercase font-bold text-[10px]">Appointment Schedule</span>
                  <span className="text-sm font-extrabold text-blue-950 block">{apptDate}</span>
                  <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {apptTime}
                  </span>
                </div>

                <div className="bg-white/80 rounded-xl p-3.5 border border-emerald-100 space-y-1">
                  <span className="text-gray-500 block uppercase font-bold text-[10px]">Payout Location</span>
                  <span className="text-sm font-bold text-gray-900 block">{payoutVenue}</span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500" /> SSDD Payout Counter
                  </span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSelectedApp(null)}
            className="w-full sm:w-auto px-6 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold transition-colors cursor-pointer"
          >
            ← {t("backToMyApplications") || "Bumalik sa Listahan"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 h-11 rounded-xl bg-[#3b82f6] hover:bg-blue-600 text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs"
          >
            I-print ang Resibo / Detalye
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ── MY APPLICATIONS LIST (Main View - Pinagsama sa Isa)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header na may Search Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            User Application Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t("myApplicationsTitle") || "My Applications"}
          </h1>
          <p className="text-sm text-gray-500">
            {t("myApplicationsSubtitle") || "Tingnan ang katayuan at mga detalye ng inyong mga naisumiteng aplikasyon para sa tulong at serbisyo."}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t("searchApplicationsPlaceholder") || "Hanapin ang Ref No. / Serbisyo..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-10 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-xs"
          />
        </div>
      </div>

      {/* ── APPLICATION CARDS LIST ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>
            Kabuuang Aplikasyon: <strong>{filteredApplications.length}</strong>
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              I-clear ang search
            </button>
          )}
        </div>

        {filteredApplications.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-700">Walang Nahanap na Aplikasyon</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Walang rekord na tumutugma sa inyong napiling serbisyo o paghahanap.
            </p>
          </div>
        ) : (
          filteredApplications.map((app) => {
            const badge = getStatusBadge(app.status)

            return (
              <div
                key={app.applicationNo}
                className="bg-white border border-gray-200 hover:border-blue-300 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-blue-700">
                        {app.applicationNo}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                        {app.assistanceCategory}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{app.assistance}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block">Aplikante:</span>
                    <span className="font-semibold text-gray-900 uppercase">{app.applicantName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Petsa ng Pagsumite:</span>
                    <span className="font-medium text-gray-900">{app.dateApplied}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Contact Number:</span>
                    <span className="font-mono text-gray-900">{app.contactNumber}</span>
                  </div>
                </div>

                {/* ── CONNECTED FINANCIAL AID & PAYOUT APPOINTMENT BANNER ── */}
                {(() => {
                  const rawType = (app.assistance || "").replace(/\s*assistance/gi, "").trim()
                  const formattedType = rawType.charAt(0).toUpperCase() + rawType.slice(1) + " Assistance"
                  const fixedAmt = FIXED_ASSISTANCE_AMOUNTS[formattedType] || FIXED_ASSISTANCE_AMOUNTS[app.assistance] || 1000

                  const savedDisbursements = getSavedDisbursements()
                  const matchDisb = savedDisbursements.find(
                    (d) =>
                      d.applicationRef === app.applicationNo ||
                      d.applicantName.toLowerCase().trim() === app.applicantName.toLowerCase().trim()
                  )

                  const apptDate = matchDisb?.appointmentDate || "August 31, 2026"
                  const apptTime = matchDisb?.appointmentTime || "10:00 AM"
                  const payoutVenue = matchDisb?.venue || "Quezon City Hall"

                  return (
                    <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-blue-50/90 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Banknote className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              Financial Aid Record
                            </span>
                            <span className="text-[11px] font-mono text-blue-700 font-bold">
                              {matchDisb?.disbursementId || "DISB-2026-0001"}
                            </span>
                          </div>
                          <p className="font-bold text-gray-900">
                            Approved Fixed Amount: <span className="text-emerald-700 font-black text-sm">₱{fixedAmt.toLocaleString()}</span>
                          </p>
                          <p className="text-[11px] text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Payout Appointment: <strong className="text-blue-950">{apptDate} – {apptTime}</strong> ({payoutVenue})</span>
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Fixed Amount</span>
                        <span className="text-lg font-black text-emerald-700">₱{fixedAmt.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })()}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Opisyal na talaan ng Quezon City Social Services</span>
                  </div>

                  {/* ┌─────────────────────────┐
                      │    VIEW APPLICATION     │
                      └─────────────────────────┘ */}
                  <button
                    type="button"
                    onClick={() => setSelectedApp(app)}
                    className="w-full sm:w-auto px-5 h-10 rounded-xl bg-[#3b82f6] hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-sm"
                  >
                    <span>VIEW APPLICATION</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

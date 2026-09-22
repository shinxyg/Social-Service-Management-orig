import { useState, useEffect, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  AlertCircle,
  X,
  HeartHandshake,
  Info,
  CheckCircle2,
  RotateCcw,
  Lock,
  Clock,
  ArrowRight,
  ChevronLeft,
  GraduationCap,
} from "lucide-react"
import SoloParentApplicationWizard from "./solo-parent-wizard"
import ChildWelfareApplicationWizard, { getLocalizedChildWelfarePrograms } from "./child-welfare-wizard"
import { useLanguage } from "../ui/language-context"
import { API_BASE, getAuthHeaders } from "../../config/api"
import { cachedApiFetch } from "../../utils/cachedApiFetch"
import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"
import { subscribeToRealtimeChanges } from "../../utils/realtimeSync"
import { formatAppDate } from "./my-applications"

interface RequirementItem {
  title: string
  desc?: string
}

function getLocalizedSoloParentRequirements(language: string): RequirementItem[] {
  if (language === "en") {
    return [
      {
        title: "1. Solo Parent Identification Card (SPIC)",
        desc: "Photocopy or clear image of your valid Solo Parent ID (SPIC).",
      },
      {
        title: "2. QCitizen ID (QC ID)",
        desc: "Photocopy or clear image of your valid QCitizen ID card.",
      },
      {
        title: "3. Proof of Indigency / Income (based on Employment Status)",
        desc: "Unemployed: Affidavit of No Employment | Employed: Latest ITR or Payslip (1 month) | Informal worker: Proof of income or Barangay Certificate of Indigency.",
      },
    ]
  }
  if (language === "bis") {
    return [
      {
        title: "1. Solo Parent Identification Card (SPIC)",
        desc: "Photocopy o klaro nga hulagway sa imong balido nga Solo Parent ID (SPIC).",
      },
      {
        title: "2. QCitizen ID (QC ID)",
        desc: "Photocopy o klaro nga hulagway sa imong balido nga QCitizen ID card.",
      },
      {
        title: "3. Pruweba sa Indigency / Kita (depende sa kahimtang sa trabaho)",
        desc: "Walay trabaho: Affidavit of No Employment | Adunay trabaho: Pinakabag-ong ITR o Payslip (1 ka buwan) | Informal worker: Pruweba sa kita o Barangay Certificate of Indigency.",
      },
    ]
  }
  return [
    {
      title: "1. Solo Parent Identification Card (SPIC)",
      desc: "Photocopy o malinaw na larawan ng inyong valid Solo Parent ID (SPIC).",
    },
    {
      title: "2. QCitizen ID (QC ID)",
      desc: "Photocopy o malinaw na larawan ng inyong valid QCitizen ID card.",
    },
    {
      title: "3. Patunay ng Indigency / Kita (depende sa employment status)",
      desc: "Walang trabaho: Affidavit of No Employment | May trabaho: Latest ITR o Payslip (1 buwan) | Informal worker: Patunay ng kita o Barangay Certificate of Indigency.",
    },
  ]
}

function getLocalSoloParentApplications(): any[] {
  const localKeys = [
    "solo_parent_applications",
    "applications",
    "all_user_applications",
    "active_applications",
    "user_applications",
    "citizen_applications",
  ]
  const collected: any[] = []
  for (const k of localKeys) {
    try {
      const raw = localStorage.getItem(k)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && typeof item === "object") {
              const itemRef = item.id || item.reference_number || item.referenceNumber
              if (itemRef && !collected.some((c) => (c.id || c.reference_number || c.referenceNumber) === itemRef)) {
                collected.push(item)
              }
            }
          }
        }
      }
    } catch {}
  }
  return collected
}

function getLocalChildWelfareApplications(): any[] {
  const localKeys = [
    "child_welfare_applications",
    "all_user_applications",
    "applications",
    "active_applications",
  ]
  const collected: any[] = []
  for (const k of localKeys) {
    try {
      const raw = localStorage.getItem(k)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && typeof item === "object") {
              const itemRef = item.id || item.reference_number || item.referenceNumber
              if (itemRef && !collected.some((c) => (c.id || c.reference_number || c.referenceNumber) === itemRef)) {
                collected.push(item)
              }
            }
          }
        }
      }
    } catch {}
  }
  return collected
}

function evaluateChildWelfareCardState(
  allApps: any[],
  programKey: string,
  userProf: any,
  currentQcid: string
): { isApproved: boolean; isOngoing: boolean } {
  const uid = userProf?.id || (userProf as any)?.userId || ""
  const currentEmail = (userProf?.email || "").toLowerCase().trim()
  const cleanUserQcid = String(currentQcid || userProf?.qcidNo || userProf?.qcidNumber || "110000572516915").replace(/\D/g, "")

  const userApps = allApps.filter((a) => {
    if (!a) return false
    const mod = String(a.module_type || a.moduleType || a.category || "").toLowerCase()
    const srv = String(a.service || a.service_name || a.program_name || a.program || "").toLowerCase()
    const isCW = mod.includes("child") || srv.includes("child") || srv.includes("nutrition") || srv.includes("emergency") || srv.includes("protection")
    if (!isCW && mod && !mod.includes("child")) return false

    const appRef = String(a.reference_number || a.referenceNumber || a.qcid_number || a.qcidNumber || a.qcid || a.form_data?.qcidNumber || "").trim().replace(/\D/g, "")
    const appEmail = String(a.email || a.form_data?.email || "").toLowerCase().trim()
    const appUid = String(a.user_id || a.userId || "").trim()

    if (uid && appUid && String(uid) === appUid && String(uid) !== "0") return true
    if (cleanUserQcid && appRef && (cleanUserQcid === appRef || cleanUserQcid.includes(appRef) || appRef.includes(cleanUserQcid))) return true
    if (currentEmail && appEmail && currentEmail === appEmail) return true
    return false
  })

  const programApps = userApps.filter((a) => {
    const srv = String(a.service || a.service_name || a.program_name || a.program || a.programKey || a.type || "").toLowerCase()
    if (programKey === "nutritional-assistance") return srv.includes("nutrition") || srv.includes("nutrisyon")
    if (programKey === "child-protection") return srv.includes("protection") || srv.includes("proteksyon")
    if (programKey === "emergency-assistance") return srv.includes("emergency") || srv.includes("kagipitan") || srv.includes("sakuna")
    return false
  })

  const approved = programApps.find((a) => {
    const s = String(a.application_status || a.status || "").toLowerCase()
    return s === "approved" || s === "completed" || s === "for_release" || s === "active"
  })

  const pending = programApps.find((a) => {
    const s = String(a.application_status || a.status || "pending").toLowerCase()
    return s === "pending" || s === "draft" || s === "under_review"
  })

  return { isApproved: Boolean(approved), isOngoing: Boolean(pending && !approved) }
}

interface ChildWelfareCardItem {
  id: string
  key: string
  title: string
  titleEn: string
  desc: string
  descEn: string
}

const CHILD_WELFARE_CARDS: ChildWelfareCardItem[] = [
  {
    id: "educational-assistance",
    key: "educational-assistance",
    title: "Educational Assistance for Indigent Children & Youth",
    titleEn: "Educational Assistance for Indigent Children & Youth",
    desc: "Nagbibigay ng tulong-pinansyal at suporta sa edukasyon para sa mga maralitang bata at kabataan, anak ng solo parent, at mga batang may kapansanan (CWD) sa Lungsod Quezon.",
    descEn: "Provides educational and financial aid support for indigent children & youth, solo parents' children/beneficiaries, and children with disabilities (CWD) residing in Quezon City.",
  },
  {
    id: "child-welfare-services",
    key: "child-welfare-services",
    title: "Child Welfare Services",
    titleEn: "Child Welfare Services",
    desc: "Komprehensibong serbisyo at programang pangangalaga, proteksyon, at pagpapaunlad para sa kapakanan ng mga bata at kabataan sa Lungsod Quezon.",
    descEn: "Comprehensive care, protection, and developmental welfare services dedicated to ensuring the well-being and rights of children and youth in Quezon City.",
  },
]

interface ProgramCard {
  id: string
  key: string
  title: string
  titleEn: string
  desc: string
  descEn: string
}

const SOLO_PARENT_PROGRAMS: ProgramCard[] = [
  {
    id: "financial-subsidy",
    key: "financial-subsidy",
    title: "Solo Parent Financial Subsidy Program",
    titleEn: "Solo Parent Financial Subsidy Program",
    desc: "SOLO PARENT SECTOR: Qualified applicants may receive financial subsidy. For qualified Solo Parents who meet the applicable income and program requirements. Eligibility is subject to document verification and assessment before approval.",
    descEn: "SOLO PARENT SECTOR: Qualified applicants may receive financial subsidy. For qualified Solo Parents who meet the applicable income and program requirements. Eligibility is subject to document verification and assessment before approval.",
  },
  {
    id: "educational-assistance",
    key: "educational-assistance",
    title: "Solo Parent Educational Assistance Program",
    titleEn: "Solo Parent Educational Assistance Program",
    desc: "Para sa indigent solo parents’ children/beneficiaries na nag-aaral. Kabilang dito ang mga solo parents na may dalawa (2) o higit pang anak na naka-enroll sa pampublikong paaralan, na may tulong-pinansyal na ₱5,000 bawat kwalipikadong benepisyaryo. May interview at assessment din ng Social Worker bago ma-extend ang tulong-pinansyal.",
    descEn: "Educational financial assistance for indigent solo parents' dependent children/beneficiaries who are currently studying. The program includes solo parents with two (2) or more children enrolled in public school, providing financial assistance of ₱5,000 per qualified beneficiary, subject to interview and social worker assessment prior to granting assistance.",
  },
]

function evaluateSoloParentBlockedState(
  allApps: any[],
  userProf: any,
  currentQcid: string
): { isBlocked: boolean; blockedApp: any; hasApprovedApp: boolean } {
  const uid = userProf?.id || (userProf as any)?.userId || ""
  const currentEmail = (userProf?.email || "").toLowerCase().trim()
  const cleanUserQcid = String(currentQcid || userProf?.qcidNo || userProf?.qcidNumber || "110000572516915").replace(/\D/g, "")

  const userApps = allApps.filter((a) => {
    if (!a) return false
    const mod = String(a.module_type || a.moduleType || a.category || "").toLowerCase()
    const srv = String(a.service || a.service_name || a.classification_title || "").toLowerCase()
    const isSP = mod.includes("solo") || srv.includes("solo") || a.solo_parent_id_number || a.soloParentIdNumber
    if (!isSP && mod && !mod.includes("solo")) return false

    const appRef = String(a.reference_number || a.referenceNumber || a.qcid_number || a.qcidNumber || a.qcid || a.form_data?.qcidNumber || "").trim().replace(/\D/g, "")
    const appEmail = String(a.email || a.form_data?.email || "").toLowerCase().trim()
    const appUid = String(a.user_id || a.userId || "").trim()

    if (uid && appUid && String(uid) === appUid && String(uid) !== "0") return true
    if (cleanUserQcid && appRef && (cleanUserQcid === appRef || cleanUserQcid.includes(appRef) || appRef.includes(cleanUserQcid))) return true
    if (currentEmail && appEmail && currentEmail === appEmail) return true
    return false
  })

  const blockedApp = userApps.find((a) => {
    const s = String(a.application_status || a.status || "pending").toLowerCase()
    return s === "pending" || s === "draft" || s === "under_review" || s === "approved" || s === "active"
  })

  const approvedApp = userApps.find((a) => {
    const s = String(a.application_status || a.status || "").toLowerCase()
    return s === "approved" || s === "completed" || s === "for_release" || s === "active"
  })

  return {
    isBlocked: Boolean(blockedApp),
    blockedApp: blockedApp || null,
    hasApprovedApp: Boolean(approvedApp),
  }
}

function evaluateSoloParentCardState(
  allApps: any[],
  programKey: string,
  userProf: any,
  currentQcid: string
): { isApproved: boolean; isOngoing: boolean } {
  const uid = userProf?.id || (userProf as any)?.userId || ""
  const currentEmail = (userProf?.email || "").toLowerCase().trim()
  const cleanUserQcid = String(currentQcid || userProf?.qcidNo || userProf?.qcidNumber || "110000572516915").replace(/\D/g, "")

  const userApps = allApps.filter((a) => {
    if (!a) return false
    const mod = String(a.module_type || a.moduleType || a.category || "").toLowerCase()
    const srv = String(a.service || a.service_name || a.classification_title || "").toLowerCase()
    const isSP = mod.includes("solo") || srv.includes("solo") || a.solo_parent_id_number || a.soloParentIdNumber
    if (!isSP && mod && !mod.includes("solo")) return false

    const appRef = String(a.reference_number || a.referenceNumber || a.qcid_number || a.qcidNumber || a.qcid || a.form_data?.qcidNumber || "").trim().replace(/\D/g, "")
    const appEmail = String(a.email || a.form_data?.email || "").toLowerCase().trim()
    const appUid = String(a.user_id || a.userId || "").trim()

    if (uid && appUid && String(uid) === appUid && String(uid) !== "0") return true
    if (cleanUserQcid && appRef && (cleanUserQcid === appRef || cleanUserQcid.includes(appRef) || appRef.includes(cleanUserQcid))) return true
    if (currentEmail && appEmail && currentEmail === appEmail) return true
    return false
  })

  const programApps = userApps.filter((a) => {
    const srv = String(a.service || a.service_name || a.classification_title || a.type || a.application_type || "").toLowerCase()
    if (programKey === "financial-subsidy") {
      return srv.includes("subsidy") || srv.includes("financial")
    }
    return srv.includes("education") || srv.includes("educational") || (!srv.includes("subsidy") && !srv.includes("child-welfare"))
  })

  const approved = programApps.find((a) => {
    const s = String(a.application_status || a.status || "").toLowerCase()
    return s === "approved" || s === "completed" || s === "for_release" || s === "active"
  })

  const pending = programApps.find((a) => {
    const s = String(a.application_status || a.status || "pending").toLowerCase()
    return s === "pending" || s === "draft" || s === "under_review"
  })

  return { isApproved: Boolean(approved), isOngoing: Boolean(pending && !approved) }
}

export default function ApplySoloParent() {
  const { t, language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const categoryParam = searchParams.get("category")?.toLowerCase() || "solo-parent"
  const rawTypeParam = searchParams.get("type")?.toLowerCase()
  const rawProgramParam = searchParams.get("program")?.toLowerCase()
  const programParam = rawProgramParam || "nutritional-assistance"
  const isChildWelfare = categoryParam === "child-welfare"

  const currentCwPrograms = getLocalizedChildWelfarePrograms(language)
  const matchedCwProgram = currentCwPrograms.find((p) => p.key === programParam) || currentCwPrograms[0]

  const [initialBlockedState] = useState(() => {
    try {
      if (typeof window === "undefined") return { isBlocked: false, blockedApp: null, hasApprovedApp: false }
      const isReapp =
        window.location.search.includes("reapply=true") ||
        localStorage.getItem("solo_parent_reapplying") === "true"
      if (isReapp) return { isBlocked: false, blockedApp: null, hasApprovedApp: false }

      const prof = getCurrentUserProfile()
      const currentQcid = getLoggedInUserQcid() || "110000572516915"
      const localApps = getLocalSoloParentApplications()
      return evaluateSoloParentBlockedState(localApps, prof, currentQcid)
    } catch {
      return { isBlocked: false, blockedApp: null, hasApprovedApp: false }
    }
  })

  const [showRequirementsModal, setShowRequirementsModal] = useState(false)
  const [blockedApp, setBlockedApp] = useState<any>(initialBlockedState.blockedApp)
  const [isBlocked, setIsBlocked] = useState<boolean>(initialBlockedState.isBlocked)
  const [understood, setUnderstood] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [cwSubmissionStage, setCwSubmissionStage] = useState<"form" | "matching" | "pending">("form")
  const [spSubmissionStage, setSpSubmissionStage] = useState<"form" | "matching" | "pending">("form")

  const [bypassedBlock, setBypassedBlock] = useState(() => {
    try {
      const isUrlParam = typeof window !== "undefined" && window.location.search.includes("reapply=true")
      const isLocal = localStorage.getItem("solo_parent_reapplying") === "true"
      return Boolean(isUrlParam || isLocal)
    } catch {
      return false
    }
  })
  const bypassedBlockRef = useRef(bypassedBlock)

  useEffect(() => {
    let isMounted = true

    const checkActiveApp = async () => {
      if (bypassedBlockRef.current) return
      if (isChildWelfare) {
        if (isMounted) setIsBlocked(false)
        return
      }

      try {
        const currentQcid = getLoggedInUserQcid() || "110000572516915"
        const userProf = getCurrentUserProfile()
        const uid = userProf?.id || (userProf as any)?.userId || ""
        const currentEmail = (userProf?.email || "").toLowerCase().trim()

        const localApps = getLocalSoloParentApplications()
        const localRes = evaluateSoloParentBlockedState(localApps, userProf, currentQcid)
        if (isMounted && localRes.isBlocked) {
          setIsBlocked(true)
          setBlockedApp(localRes.blockedApp)
        }

        let backendApps: any[] = []
        try {
          const data = await cachedApiFetch(
            `${API_BASE}/api/solo-parent/user/${uid || "0"}?qcid=${encodeURIComponent(currentQcid)}&email=${encodeURIComponent(currentEmail)}`,
            { headers: getAuthHeaders() },
            15000
          ).catch(() => null)
          if (data) {
            const raw = Array.isArray(data) ? data : data.applications || []
            if (Array.isArray(raw)) {
              backendApps = raw
            }
          }
        } catch {}

        let allApps = [...backendApps]
        for (const la of localApps) {
          if (la && !allApps.some((ba) => (ba.id && ba.id === la.id) || (ba.reference_number && ba.reference_number === la.reference_number))) {
            allApps.push(la)
          }
        }
        try {
          localStorage.setItem("solo_parent_applications", JSON.stringify(allApps))
        } catch {}

        const finalRes = evaluateSoloParentBlockedState(allApps, userProf, currentQcid)
        if (isMounted) {
          setIsBlocked(finalRes.isBlocked)
          setBlockedApp(finalRes.blockedApp)
        }
      } catch (err) {
        console.warn("Solo parent eligibility check skipped/offline:", err)
      }
    }

    checkActiveApp()
    const pollInterval = setInterval(checkActiveApp, 8000)

    const unsubscribe = subscribeToRealtimeChanges(() => {
      checkActiveApp()
    })

    const handleUpdated = () => checkActiveApp()
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes("solo_parent") || e.key === "applications") {
        checkActiveApp()
      }
    }
    window.addEventListener("solo_parent_applications_updated", handleUpdated)
    window.addEventListener("applications_updated", handleUpdated)
    window.addEventListener("storage", handleStorage)

    return () => {
      isMounted = false
      clearInterval(pollInterval)
      unsubscribe()
      window.removeEventListener("solo_parent_applications_updated", handleUpdated)
      window.removeEventListener("applications_updated", handleUpdated)
      window.removeEventListener("storage", handleStorage)
    }
  }, [categoryParam, rawTypeParam, programParam, isChildWelfare])

  useEffect(() => {
    try {
      const isReapp =
        localStorage.getItem("solo_parent_reapplying") === "true" ||
        (typeof window !== "undefined" && window.location.search.includes("reapply=true"))
      if (isReapp) {
        bypassedBlockRef.current = true
        setBypassedBlock(true)
      } else {
        bypassedBlockRef.current = false
        setBypassedBlock(false)
      }
    } catch {
      bypassedBlockRef.current = false
      setBypassedBlock(false)
    }
    setShowRequirementsModal(false)
    setUnderstood(false)
    setCurrentStep(1)
  }, [categoryParam, rawTypeParam])

  const isSpFinancialSubsidy = rawTypeParam === "financial-subsidy"

  const modalTitle = isChildWelfare
    ? language === "en"
      ? `Requirements for Child Welfare Support — ${matchedCwProgram.title}`
      : language === "bis"
      ? `Mga Kinahanglanon sa Tabang sa Kaayohan sa Bata — ${matchedCwProgram.title}`
      : `Mga Kinakailangan sa Tulong sa Kapakanan ng Bata — ${matchedCwProgram.title}`
    : isSpFinancialSubsidy
    ? language === "en"
      ? "Solo Parent Financial Subsidy Program — Requirements"
      : language === "bis"
      ? "Solo Parent Financial Subsidy Program — Mga Kinahanglanon"
      : "Solo Parent Financial Subsidy Program — Mga Kinakailangan"
    : language === "en"
    ? "Solo Parent Educational Assistance Program — Requirements"
    : language === "bis"
    ? "Solo Parent Educational Assistance Program — Mga Kinahanglanon"
    : "Solo Parent Educational Assistance Program — Mga Kinakailangan"

  const typeBadge = isChildWelfare
    ? { label: matchedCwProgram.title, color: "bg-blue-50 text-blue-700 border-blue-200" }
    : {
        label: isSpFinancialSubsidy ? "Financial Subsidy" : "Educational Assistance",
        color: "bg-blue-50 text-blue-700 border-blue-200",
      }

  const currentRequirements = getLocalizedSoloParentRequirements(language)
  const activeProfile = getCurrentUserProfile()

  const isAppApproved =
    String(blockedApp?.application_status || blockedApp?.status || "").toLowerCase() === "approved" ||
    String(blockedApp?.application_status || blockedApp?.status || "").toLowerCase() === "completed" ||
    String(blockedApp?.application_status || blockedApp?.status || "").toLowerCase() === "for_release" ||
    String(blockedApp?.application_status || blockedApp?.status || "").toLowerCase() === "active"

  const isAppRejected =
    String(blockedApp?.application_status || blockedApp?.status || "").toLowerCase() === "rejected" ||
    String(blockedApp?.application_status || blockedApp?.status || "").toLowerCase() === "disapproved"

  // Child Welfare Card Overview (when category is child-welfare and no program selected)
  if (isChildWelfare && !rawProgramParam) {
    const currentQcid = getLoggedInUserQcid() || "110000572516915"
    const userProf = getCurrentUserProfile()
    const localCwApps = getLocalChildWelfareApplications()

    return (
      <div className="py-8 px-6 sm:px-10 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CHILD_WELFARE_CARDS.map((program) => {
            const ev = evaluateChildWelfareCardState(localCwApps, program.key, userProf, currentQcid)
            const isApproved = ev.isApproved
            const isOngoing = ev.isOngoing

            return (
              <div
                key={program.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
                  isApproved
                    ? "border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-400/30"
                    : isOngoing
                    ? "border-amber-300 dark:border-amber-800 ring-1 ring-amber-400/30"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Dark navy blue top banner matching Senior / PWD */}
                <div
                  className={`text-white py-3 px-4 font-bold text-center text-sm md:text-base tracking-wide select-none flex items-center justify-center gap-2 ${
                    isApproved ? "bg-emerald-800" : isOngoing ? "bg-slate-800" : "bg-[#1e3a5f]"
                  }`}
                >
                  {isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                  {isOngoing && <Clock className="w-4 h-4 text-amber-300" />}
                  <span>{language === "en" ? program.titleEn : program.title}</span>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 gap-4">
                  <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed text-justify">
                    {language === "en" ? program.descEn : program.desc}
                  </p>

                  {/* Status Badges */}
                  {isApproved && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          {language === "en"
                            ? "Already Availed (Approved & Recorded)"
                            : "Na-avail na (Approved & Recorded)"}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90">
                        {language === "en"
                          ? "You already have an approved record for this program."
                          : "Mayroon ka nang aprubadong talaan para sa programang ito."}
                      </p>
                    </div>
                  )}

                  {isOngoing && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>
                          {language === "en"
                            ? "Application In Progress (Active Request)"
                            : "Kasalukuyang Pinoproseso (Active Request)"}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                        {language === "en"
                          ? "Your application has been submitted and is currently being assessed by a Social Worker."
                          : "Nakasumite na ang inyong aplikasyon at nasa ilalim ng pagsusuri ng Social Worker."}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2 flex justify-center">
                    {isApproved || isOngoing ? (
                      <button
                        type="button"
                        onClick={() => navigate("/portal/my-applications")}
                        className={`font-bold text-xs md:text-sm tracking-wider uppercase cursor-pointer transition-colors py-2 px-4 rounded-xl flex items-center gap-2 shadow-xs ${
                          isApproved
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <span>
                          {isApproved
                            ? (language === "en" ? "VIEW IN APPLICATION HISTORY" : "TINGNAN SA APPLICATION HISTORY")
                            : (language === "en" ? "TRACK APPLICATION STATUS" : "SUBAYBAYAN ANG STATUS")}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSearchParams({ category: "child-welfare", program: program.key })}
                        className="text-[#0066cc] dark:text-sky-400 hover:text-[#004c99] dark:hover:text-sky-300 font-extrabold text-xs md:text-sm tracking-widest uppercase cursor-pointer hover:underline transition-colors py-1 px-4"
                      >
                        {language === "en" ? "APPLY NOW" : "MAG-APPLY NGAYON"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Solo Parent Services Card Overview (matching Senior / PWD card pattern)
  if (!isChildWelfare && !rawTypeParam) {
    const currentQcid = getLoggedInUserQcid() || "110000572516915"
    const userProf = getCurrentUserProfile()
    const localSpApps = getLocalSoloParentApplications()

    return (
      <div className="py-8 px-6 sm:px-10 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SOLO_PARENT_PROGRAMS.map((program) => {
            const cardRes = evaluateSoloParentCardState(localSpApps, program.key, userProf, currentQcid)
            const isApproved = cardRes.isApproved
            const isOngoing = cardRes.isOngoing

            return (
              <div
                key={program.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
                  isApproved
                    ? "border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-400/30"
                    : isOngoing
                    ? "border-amber-300 dark:border-amber-800 ring-1 ring-amber-400/30"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Dark navy blue top banner matching Senior / PWD */}
                <div
                  className={`text-white py-3 px-4 font-bold text-center text-sm md:text-base tracking-wide select-none flex items-center justify-center gap-2 ${
                    isApproved ? "bg-emerald-800" : isOngoing ? "bg-slate-800" : "bg-[#1e3a5f]"
                  }`}
                >
                  {isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                  {isOngoing && <Clock className="w-4 h-4 text-amber-300" />}
                  <span>{language === "en" ? program.titleEn : program.title}</span>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 gap-4">
                  <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed text-justify">
                    {language === "en" ? program.descEn : program.desc}
                  </p>

                  {/* Status Badges */}
                  {isApproved && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          {language === "en"
                            ? "Already Availed (Approved & Recorded)"
                            : "Na-avail na (Approved & Recorded)"}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90">
                        {language === "en"
                          ? "You already have an approved record for this program."
                          : "Mayroon ka nang aprubadong talaan para sa programang ito."}
                      </p>
                    </div>
                  )}

                  {isOngoing && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>
                          {language === "en"
                            ? "Application In Progress (Active Request)"
                            : "Kasalukuyang Pinoproseso (Active Request)"}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                        {language === "en"
                          ? "Your application has been submitted and is currently being assessed by a Social Worker."
                          : "Nakasumite na ang inyong aplikasyon at nasa ilalim ng pagsusuri ng Social Worker."}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2 flex justify-center">
                    {isApproved || isOngoing ? (
                      <button
                        type="button"
                        onClick={() => navigate("/portal/my-applications")}
                        className={`font-bold text-xs md:text-sm tracking-wider uppercase cursor-pointer transition-colors py-2 px-4 rounded-xl flex items-center gap-2 shadow-xs ${
                          isApproved
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <span>
                          {isApproved
                            ? (language === "en" ? "VIEW IN APPLICATION HISTORY" : "TINGNAN SA APPLICATION HISTORY")
                            : (language === "en" ? "TRACK APPLICATION STATUS" : "SUBAYBAYAN ANG STATUS")}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSearchParams({ category: "solo-parent", type: program.key })}
                        className="text-[#0066cc] dark:text-sky-400 hover:text-[#004c99] dark:hover:text-sky-300 font-extrabold text-xs md:text-sm tracking-widest uppercase cursor-pointer hover:underline transition-colors py-1 px-4"
                      >
                        {language === "en" ? "APPLY NOW" : "MAG-APPLY NGAYON"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Blocked View for when applying inside wizard
  if (isBlocked && (!bypassedBlock || isAppApproved) && !isChildWelfare) {
    const rejectionReason = blockedApp?.rejection_reason || blockedApp?.rejectionReason || blockedApp?.admin_notes || ""
    const displayRef =
      blockedApp?.reference_number ||
      blockedApp?.referenceNumber ||
      blockedApp?.id ||
      getLoggedInUserQcid() ||
      "110000572516915"

    const rawDate = blockedApp?.created_at || blockedApp?.submittedAt || blockedApp?.submitted_at || blockedApp?.dateSubmitted
    const displayDate = formatAppDate(rawDate, blockedApp)

    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4 animate-in fade-in duration-150 py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center gap-4">
          <div
            className={`h-16 w-16 rounded-2xl flex items-center justify-center ${
              isAppApproved
                ? "bg-emerald-500/10 text-emerald-600"
                : isAppRejected
                ? "bg-red-500/10 text-red-600"
                : "bg-amber-500/10 text-amber-500"
            }`}
          >
            {isAppApproved ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            ) : isAppRejected ? (
              <X className="h-8 w-8 text-red-600" />
            ) : (
              <Info className="h-8 w-8 text-amber-500" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isAppApproved
                ? language === "en"
                  ? "Application Approved"
                  : language === "bis"
                  ? "Na-aprobahan ang Aplikasyon!"
                  : "Na-approve ang Application!"
                : isAppRejected
                ? language === "en"
                  ? "Application Not Approved / Disapproved"
                  : language === "bis"
                  ? "Wala Na-aprobahan ang Aplikasyon"
                  : "Hindi Na-aprubahan ang Aplikasyon"
                : language === "en"
                ? "You Have an Existing Active Application"
                : language === "bis"
                ? "Aduna Ka Nay Aktibo nga Aplikasyon"
                : "May Kasalukuyan Ka Nang Aktibong Aplikasyon"}
            </h2>
            <p className="text-xs text-gray-600 max-w-md mt-1 leading-relaxed">
              {isAppApproved
                ? language === "en"
                  ? "Your application for Solo Parent Educational Assistance has been officially approved! You already have an active assistance record."
                  : language === "bis"
                  ? "Ang imong aplikasyon para sa Solo Parent Educational Assistance opisyal nga na-aprobahan sa Gov Service."
                  : "Ang inyong aplikasyon para sa Solo Parent Educational Assistance ay opisyal nang na-apruba ng QC Social Services Development Department."
                : isAppRejected
                ? language === "en"
                  ? "Your application for Solo Parent Educational Assistance was reviewed and not approved. You can review the reason below and submit a new application with the complete requirements."
                  : language === "bis"
                  ? "Ang imong aplikasyon para sa Educational Assistance gisusi ug wala na-aprobahan. Mahimo nimong susihon ang hinungdan sa ubos ug mag-apply pag-usab."
                  : "Ang inyong aplikasyon para sa Solo Parent Educational Assistance ay sinuri ng Social Worker at hindi na-aprubahan. Maaari ninyong suriin ang dahilan sa ibaba at mag-apply muli kalakip ang kumpletong mga dokumento."
                : language === "en"
                ? "Your application for Solo Parent Educational Assistance has been successfully submitted and is currently pending review. Please wait for a Social Worker's assessment."
                : language === "bis"
                ? "Ang imong aplikasyon para sa Solo Parent Educational Assistance nasumite na ug kasamtangang girebyu sa Social Worker."
                : "Ang inyong aplikasyon para sa Solo Parent Educational Assistance ay matagumpay na naisumite at kasalukuyang sinusuri ng Social Worker."}
            </p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-gray-500 font-medium">
                {language === "en" ? "Reference Number:" : language === "bis" ? "Numero sa Reperensya:" : "Application Reference No.:"}
              </span>
              <span className="font-mono font-bold text-blue-600">{displayRef}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-gray-500 font-medium">Status:</span>
              {isAppApproved ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {language === "en" ? "Approved" : language === "bis" ? "Aprobado" : "Approved"}
                </span>
              ) : isAppRejected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {language === "en" ? "Not Approved (Rejected)" : language === "bis" ? "Wala Na-aprobahan (Rejected)" : "Hindi Na-aprubahan (Rejected)"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {language === "en" ? "Under Review (Pending)" : language === "bis" ? "Gisusi Pa (Pending)" : "Kasalukuyang Sinusuri (Pending)"}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">
                {language === "en" ? "Date Filed:" : language === "bis" ? "Petsa sa Pag-file:" : "Petsa ng Pag-apply:"}
              </span>
              <span className="font-semibold text-gray-700">{displayDate}</span>
            </div>

            {isAppRejected && rejectionReason && (
              <div className="p-3 bg-red-50/90 border border-red-200 rounded-lg text-left mt-2">
                <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block">
                  {language === "en" ? "Reason for Disapproval:" : language === "bis" ? "Hinungdan sa Wala Pag-apruba:" : "Dahilan ng Hindi Pag-apruba:"}
                </span>
                <p className="text-xs text-red-700 mt-1 font-medium leading-relaxed">
                  {rejectionReason}
                </p>
              </div>
            )}
          </div>

          <div className="w-full pt-2 flex flex-col gap-2">
            {isAppApproved ? (
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/portal/my-applications"
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors cursor-pointer uppercase tracking-wide"
              >
                {language === "bis" ? "TAN-AWA SA KASAYSAYAN SA APLIKASYON" : "VIEW IN APPLICATION HISTORY"}
              </button>
            ) : isAppRejected ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem("solo_parent_reapplying", "true")
                    } catch {}
                    bypassedBlockRef.current = true
                    setBypassedBlock(true)
                    setIsBlocked(false)
                    setBlockedApp(null)
                    window.history.replaceState(null, "", "/portal/apply-solo-parent?category=solo-parent&type=educational-assistance&reapply=true")
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs uppercase tracking-wide flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>
                    {language === "en"
                      ? "RE-APPLY (SUBMIT NEW APPLICATION)"
                      : language === "bis"
                      ? "MAG-APPLY PAG-USAB (RE-APPLY)"
                      : "MAG-APPLY MULI (RE-APPLY APPLICATION)"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/portal/my-applications"
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors cursor-pointer uppercase tracking-wide"
                >
                  {language === "bis" ? "TAN-AWA SA KASAYSAYAN SA APLIKASYON" : "VIEW IN APPLICATION HISTORY"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/portal/my-applications"
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors cursor-pointer uppercase tracking-wide"
              >
                {language === "bis" ? "TAN-AWA SA KASAYSAYAN SA APLIKASYON" : "VIEW IN APPLICATION HISTORY"}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const isFormActive = isChildWelfare ? cwSubmissionStage === "form" : spSubmissionStage === "form"
  const hasExistingApp = Boolean(isBlocked || blockedApp)
  const shouldShowRequirements = !hasExistingApp && !bypassedBlock && currentStep === 1 && isFormActive

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-2">
      {/* Top Requirements Bar */}
      {shouldShowRequirements && (
        <div className="max-w-5xl mx-auto px-4 md:px-6 mb-4 animate-in fade-in duration-150">
          <div className="bg-white border border-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-700">
                {isChildWelfare ? <HeartHandshake className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm md:text-base font-bold text-foreground">
                    {modalTitle}
                  </h1>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${typeBadge.color}`}>
                    {typeBadge.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isChildWelfare
                    ? language === "en"
                      ? "Official service for Child & Youth Welfare of Quezon City."
                      : language === "bis"
                      ? "Opisyal nga serbisyo para sa Kaayohan sa Bata ug Kabatan-onan sa Lungsod Quezon."
                      : "Opisyal na serbisyo para sa Child & Youth Welfare ng Lungsod Quezon."
                    : language === "en"
                      ? "Financial assistance of ₱5,000 for indigent solo parents with 2+ children in public school."
                      : language === "bis"
                      ? "Tulong-pinansyal nga ₱5,000 alang sa mga indigent solo parents nga adunay 2+ ka anak sa pampublikong eskwelahan."
                      : "Tulong-pinansyal na ₱5,000 para sa mga indigent solo parents na may 2 o higit pang anak sa pampublikong paaralan."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRequirementsModal(true)}
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer shrink-0"
            >
              {language === "en"
                ? "View Requirements"
                : language === "bis"
                ? "Tan-awa ang mga Kinahanglanon"
                : "Tingnan ang Requirements"}
            </button>
          </div>
        </div>
      )}

      {/* Back to Overview Buttons */}
      {isChildWelfare && rawProgramParam && (
        <div className="max-w-5xl mx-auto px-4 md:px-6 mb-3">
          <button
            type="button"
            onClick={() => setSearchParams({ category: "child-welfare" })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer uppercase tracking-wider bg-white dark:bg-slate-900 border border-border px-3 py-1.5 rounded-lg shadow-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{language === "en" ? "Back to Child Welfare Services" : "Bumalik sa Child Welfare Services"}</span>
          </button>
        </div>
      )}

      {!isChildWelfare && rawTypeParam && (
        <div className="max-w-5xl mx-auto px-4 md:px-6 mb-3">
          <button
            type="button"
            onClick={() => setSearchParams({ category: "solo-parent" })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer uppercase tracking-wider bg-white dark:bg-slate-900 border border-border px-3 py-1.5 rounded-lg shadow-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{language === "en" ? "Back to Solo Parent Services" : "Bumalik sa Solo Parent Services"}</span>
          </button>
        </div>
      )}

      {/* Forms & Wizards */}
      {isChildWelfare ? (
        <ChildWelfareApplicationWizard
          key={`child-welfare-${matchedCwProgram.key}`}
          userProfile={activeProfile as any}
          initialProgramId={matchedCwProgram.id}
          initialProgramKey={matchedCwProgram.key}
          onBack={() => setSearchParams({ category: "child-welfare" })}
          onStepChange={setCurrentStep}
          onSubmissionStageChange={(stage) => setCwSubmissionStage(stage)}
        />
      ) : (
        <SoloParentApplicationWizard
          key={`solo-parent-${rawTypeParam || "financial-subsidy"}`}
          userProfile={activeProfile as any}
          programType={rawTypeParam || "financial-subsidy"}
          initialType={rawTypeParam || "financial-subsidy"}
          initialCategoryId={null}
          isModalOpen={showRequirementsModal}
          onStepChange={setCurrentStep}
          onSubmissionStageChange={(stage) => setSpSubmissionStage(stage)}
          onBlockedStatusChange={(blocked, app) => {
            setIsBlocked(Boolean(blocked))
            if (app) setBlockedApp(app)
            if (blocked) {
              setShowRequirementsModal(false)
            }
          }}
        />
      )}

      {/* Requirements Modal */}
      {showRequirementsModal && shouldShowRequirements && (
        <div
          onClick={() => setShowRequirementsModal(false)}
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-150 cursor-default"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                <h2 className="text-base md:text-lg font-bold text-foreground truncate">
                  {modalTitle}
                </h2>
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${typeBadge.color}`}>
                  {typeBadge.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowRequirementsModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-white">{t("importantReminder") || "Important reminder"}</p>
                  <p className="text-sm text-blue-800 dark:text-slate-200 mt-0.5">
                    {language === "en"
                      ? "Please read all qualification criteria and documentary requirements below."
                      : language === "bis"
                      ? "Palihug basaha ang tanang kwalipikasyon ug gikinahanglang dokumento sa ubos."
                      : "Pakisuri at basahin ang lahat ng kwalipikasyon at dokumentong kailangan sa ibaba."}
                  </p>
                </div>
              </div>

              {isChildWelfare ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2 uppercase tracking-wide">
                      {language === "en"
                        ? `I. WHAT IS THE ${matchedCwProgram.title.toUpperCase()} PROGRAM?`
                        : language === "bis"
                        ? `I. UNSA ANG ${matchedCwProgram.title.toUpperCase()} PROGRAM?`
                        : `I. ANO ANG ${matchedCwProgram.title.toUpperCase()} PROGRAM?`}
                    </h3>
                    <p className="text-sm text-foreground/80 leading-relaxed bg-gray-50 border border-border/80 rounded-xl p-3.5">
                      {matchedCwProgram.whatIsIt}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2 uppercase tracking-wide">
                      {language === "en"
                        ? "II. WHO IS ELIGIBLE FOR THE PROGRAM?"
                        : language === "bis"
                        ? "II. KINSA ANG KWALIPIKADO SA PROGRAMA?"
                        : "II. SINO ANG KWALIPIKADO SA PROGRAMA?"}
                    </h3>
                    <ul className="space-y-2">
                      {matchedCwProgram.whoIsEligible.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                          <span className="text-blue-600 font-bold leading-none mt-1 shrink-0">•</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
                      {language === "en"
                        ? "III. REQUIREMENTS (REQUIRED DOCUMENTS)"
                        : language === "bis"
                        ? "III. MGA GIKINAHANGLANG DOKUMENTO (REQUIREMENTS)"
                        : "III. MGA KINAKAILANGANG DOKUMENTO (REQUIREMENTS)"}
                    </h3>

                    {matchedCwProgram.childRequirements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">
                          {language === "en" ? "For the Child:" : language === "bis" ? "Para sa Bata:" : "Para sa Bata:"}
                        </h4>
                        <ul className="space-y-2">
                          {matchedCwProgram.childRequirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                              <span className="text-blue-600 font-bold leading-none mt-1 shrink-0">•</span>
                              <span className="leading-relaxed">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {matchedCwProgram.parentRequirements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">
                          {language === "en"
                            ? "For Parent / Guardian / Reporting Person:"
                            : language === "bis"
                            ? "Para sa Ginikanan / Guardian / Tig-report:"
                            : "Para sa Magulang / Guardian / Nag-uulat:"}
                        </h4>
                        <ul className="space-y-2">
                          {matchedCwProgram.parentRequirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                              <span className="text-blue-600 font-bold leading-none mt-1 shrink-0">•</span>
                              <span className="leading-relaxed">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {matchedCwProgram.specialRequirements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">
                          {language === "en"
                            ? "For Specific Assistance / If Applicable:"
                            : language === "bis"
                            ? "Para sa pipila ka matang sa tabang / Kung gikinahanglan:"
                            : "Para sa ilang uri ng tulong / Kung kinakailangan:"}
                        </h4>
                        <ul className="space-y-2">
                          {matchedCwProgram.specialRequirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                              <span className="text-blue-600 font-bold leading-none mt-1 shrink-0">•</span>
                              <span className="leading-relaxed">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2 uppercase tracking-wide">
                      {language === "en"
                        ? "I. WHAT IS THE SOLO PARENT EDUCATIONAL ASSISTANCE PROGRAM?"
                        : language === "bis"
                        ? "I. UNSA ANG SOLO PARENT EDUCATIONAL ASSISTANCE PROGRAM?"
                        : "I. ANO ANG SOLO PARENT EDUCATIONAL ASSISTANCE PROGRAM?"}
                    </h3>
                    <p className="text-sm text-foreground/80 leading-relaxed bg-gray-50 border border-border/80 rounded-xl p-3.5 text-justify">
                      {language === "en"
                        ? "The Solo Parent Educational Assistance Program provides educational financial assistance of ₱5,000 per qualified beneficiary for indigent solo parents residing in Quezon City who have two (2) or more dependent children currently enrolled in public school. Assistance is granted following mandatory interview and assessment by a City Social Worker."
                        : language === "bis"
                        ? "Ang Solo Parent Educational Assistance Program naghatag og pinansyal nga tabang nga ₱5,000 matag benepisyaryo alang sa mga indigent solo parents sa Lungsod Quezon nga adunay duha (2) o labaw pa nga mga anak nga naka-enroll sa pampublikong eskwelahan, human sa interview ug assessment sa Social Worker."
                        : "Ang Solo Parent Educational Assistance Program ay nagbibigay ng tulong-pinansyal na ₱5,000 bawat kwalipikadong benepisyaryo para sa mga indigent solo parents sa Lungsod Quezon na may dalawa (2) o higit pang anak na nag-aaral at naka-enroll sa pampublikong paaralan (public school). Isinasagawa ang panayam at assessment ng Social Worker bago maipagkaloob ang tulong."}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2 uppercase tracking-wide">
                      {language === "en"
                        ? "II. WHO IS ELIGIBLE FOR EDUCATIONAL ASSISTANCE?"
                        : language === "bis"
                        ? "II. KINSA ANG KWALIPIKADO SA EDUCATIONAL ASSISTANCE?"
                        : "II. SINO ANG KWALIPIKADO SA EDUCATIONAL ASSISTANCE?"}
                    </h3>
                    <ul className="space-y-2">
                      {[
                        language === "en"
                          ? "Legitimate resident of Quezon City with valid Solo Parent record."
                          : "Lehitimong residente ng Lungsod Quezon na may rehistradong Solo Parent status.",
                        language === "en"
                          ? "Solo parent with two (2) or more children currently enrolled in public school."
                          : "Solong magulang na may dalawa (2) o higit pang anak na kasalukuyang naka-enroll sa pampublikong paaralan.",
                        language === "en"
                          ? "Classified as indigent solo parent in need of educational financial support (₱5,000 per beneficiary)."
                          : "Kabilang sa indigent solo parents na nangangailangan ng tulong-pinansyal sa pag-aaral (₱5,000 bawat benepisyaryo).",
                        language === "en"
                          ? "Agrees to and passes the social assessment and interview conducted by the City Social Worker."
                          : "Sumasang-ayon na sumailalim at pumasa sa panayam (interview) at assessment ng Social Worker bago ma-extend ang assistance.",
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                          <span className="text-blue-600 font-bold leading-none mt-1 shrink-0">•</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
                      {language === "en"
                        ? "III. REQUIRED DOCUMENTS (REQUIREMENTS)"
                        : language === "bis"
                        ? "III. MGA GIKINAHANGLANG DOKUMENTO (REQUIREMENTS)"
                        : "III. MGA KINAKAILANGANG DOKUMENTO (REQUIREMENTS)"}
                    </h3>
                    <ul className="space-y-3 mb-6">
                      {currentRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                          <span className="text-blue-600 font-bold leading-none mt-1 shrink-0">•</span>
                          <div>
                            <span className="font-semibold text-foreground">{req.title}</span>
                            {req.desc && <p className="text-muted-foreground text-xs mt-0.5">{req.desc}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-start gap-2.5 flex-1">
                <input
                  type="checkbox"
                  id="understand"
                  className="mt-0.5 cursor-pointer accent-blue-600 h-4 w-4"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                />
                <label htmlFor="understand" className="text-xs md:text-sm text-foreground cursor-pointer select-none">
                  {language === "en"
                    ? "I accept and understand the qualification criteria & documentary requirements"
                    : language === "bis"
                    ? "Gidawat ug nasabtan nako ang mga kwalipikasyon ug gikinahanglang dokumento"
                    : "Tinatanggap at nauunawaan ko ang mga kwalipikasyon at kailangang dokumento"}
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUnderstood(true)
                  setShowRequirementsModal(false)
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all shrink-0 cursor-pointer shadow-sm"
              >
                {language === "en"
                  ? "Proceed with Application"
                  : language === "bis"
                  ? "Ipadayon ang Aplikasyon"
                  : "Ipagpatuloy ang Aplikasyon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
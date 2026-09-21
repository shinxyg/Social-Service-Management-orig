import { useState, useEffect, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  AlertCircle,
  RefreshCw,
  HeartHandshake,
  X,
  FileText,
  Info,
  CheckCircle2,
  RotateCcw,
  Lock,
  Clock,
  ArrowRight,
  ChevronLeft,
} from "lucide-react"
import PWDSocialAssistanceWizard from "./pwd-assistance-wizard"
import SeniorBookletWizard from "./senior-booklet-wizard"
import SeniorSocialAssistanceWizard from "./senior-assistance-wizard"
import { useLanguage } from "../ui/language-context"
import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"
import { subscribeToRealtimeChanges } from "../../utils/realtimeSync"
import { fetchPwdSeniorApplications } from "../../utils/cachedApiFetch"
import { formatAppDate } from "./my-applications"

function getLocalApplications(): any[] {
  const localKeys = [
    "pwd_senior_applications",
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
              const itemRef = item.id || item.referenceNumber || item.reference_number
              if (itemRef && !collected.some((c) => (c.id || c.referenceNumber || c.reference_number) === itemRef)) {
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

function evaluateActiveAppBlockedState(
  allApps: any[],
  urlCategory: string | undefined,
  urlType: string,
  userProf: any,
  currentQcid: string
): { isBlocked: boolean; blockedApp: any; hasApprovedApp: boolean } {
  const currentEmail = (userProf?.email || "").toLowerCase().trim()
  const currentLastName = (userProf?.lastName || "").toLowerCase().trim()
  const currentFirstName = (userProf?.firstName || "").toLowerCase().trim()
  const currentFullName = `${currentFirstName} ${userProf?.middleName || ""} ${currentLastName}`.toLowerCase().trim()
  const currentUid = String(userProf?.id || (userProf as any)?.userId || "").trim()

  const isUserMatch = (a: any) => {
    if (!a) return false

    const appRef = String(a.referenceNumber || a.reference_number || a.reference_no || a.id || "").toLowerCase().trim()
    const appQcid = String(a.qcid || a.qc_id || a.qcidNo || a.qcidNumber || a.qcid_number || "").toLowerCase().trim()
    const appAssigned = String(a.assignedIdNumber || a.assigned_id_number || "").toLowerCase().trim()
    const appEmail = String(a.email || "").toLowerCase().trim()
    const appLastName = String(a.lastName || a.last_name || "").toLowerCase().trim()
    const appFirstName = String(a.firstName || a.first_name || "").toLowerCase().trim()
    const appFullName = String(a.applicantName || a.applicant_name || `${appFirstName} ${appLastName}`).toLowerCase().trim()
    const appUid = String(a.userId || a.user_id || "").trim()

    if (currentUid && appUid && currentUid === appUid && currentUid !== "0") return true

    const qcidClean = currentQcid.toLowerCase().trim()
    if (qcidClean) {
      if (appRef === qcidClean || appQcid === qcidClean || appAssigned === qcidClean) return true
      if (qcidClean.length >= 8 && (appRef.includes(qcidClean) || appQcid.includes(qcidClean) || appAssigned.includes(qcidClean))) return true
      if (appRef.length >= 8 && qcidClean.includes(appRef)) return true
      const userDigits = qcidClean.replace(/\D/g, "")
      const appRefDigits = appRef.replace(/\D/g, "")
      const appQcidDigits = appQcid.replace(/\D/g, "")
      if (userDigits.length >= 8 && (appRefDigits === userDigits || appQcidDigits === userDigits || appRefDigits.includes(userDigits) || userDigits.includes(appRefDigits))) return true
    }

    if (currentEmail && appEmail && currentEmail === appEmail) return true

    if (currentLastName && appLastName && currentFirstName && appFirstName) {
      if (currentLastName === appLastName && currentFirstName === appFirstName) return true
    }

    if (currentFullName && appFullName) {
      const combined = `${currentFirstName} ${currentLastName}`.trim()
      if (appFullName === combined || (appFullName.startsWith(currentFirstName + " ") && appFullName.endsWith(" " + currentLastName))) {
        return true
      }
    }

    return false
  }

  const userApps = allApps.filter(isUserMatch)
  const isSenior = urlCategory === "senior"
  const isSeniorMedicine = isSenior && urlType === "medicine-booklet"
  const isSeniorMovie = isSenior && urlType === "movie-booklet"
  const isSeniorSocial = isSenior && urlType === "social-assistance"
  const isAssistance = !isSenior && urlType === "assistance"

  const seniorApps = userApps.filter((a) => {
    const cat = String(a.category || "").toLowerCase()
    const srv = String(a.service || "").toLowerCase()
    return cat.includes("senior") || srv.includes("senior")
  })

  const pwdApps = userApps.filter((a) => {
    const cat = String(a.category || "").toLowerCase()
    const srv = String(a.service || "").toLowerCase()
    const isSeniorCat = cat.includes("senior") || srv.includes("senior")
    return !isSeniorCat && (cat.includes("pwd") || cat.includes("disability") || srv.includes("pwd") || cat === "pwd")
  })

  const relevantApps = isSenior ? seniorApps : pwdApps

  if (isSeniorMedicine) {
    const medApps = seniorApps.filter((a) => {
      const t = String(a.type || a.service || "").toLowerCase()
      return t.includes("medicine")
    })
    const approvedMed = medApps.find((a) => ["approved", "completed", "for_release"].includes(String(a.status || "").toLowerCase()))
    const pendingMed = medApps.find((a) => ["pending", "under_review"].includes(String(a.status || "pending").toLowerCase()))
    const rejectedMed = medApps.find((a) => ["rejected", "disapproved"].includes(String(a.status || "").toLowerCase()))
    if (approvedMed) return { isBlocked: true, blockedApp: approvedMed, hasApprovedApp: true }
    if (pendingMed) return { isBlocked: true, blockedApp: pendingMed, hasApprovedApp: false }
    if (rejectedMed) return { isBlocked: true, blockedApp: rejectedMed, hasApprovedApp: false }
    return { isBlocked: false, blockedApp: null, hasApprovedApp: false }
  }

  if (isSeniorMovie) {
    const movieApps = seniorApps.filter((a) => {
      const t = String(a.type || a.service || "").toLowerCase()
      return t.includes("movie")
    })
    const approvedMovie = movieApps.find((a) => ["approved", "completed", "for_release"].includes(String(a.status || "").toLowerCase()))
    const pendingMovie = movieApps.find((a) => ["pending", "under_review"].includes(String(a.status || "pending").toLowerCase()))
    const rejectedMovie = movieApps.find((a) => ["rejected", "disapproved"].includes(String(a.status || "").toLowerCase()))
    if (approvedMovie) return { isBlocked: true, blockedApp: approvedMovie, hasApprovedApp: true }
    if (pendingMovie) return { isBlocked: true, blockedApp: pendingMovie, hasApprovedApp: false }
    if (rejectedMovie) return { isBlocked: true, blockedApp: rejectedMovie, hasApprovedApp: false }
    return { isBlocked: false, blockedApp: null, hasApprovedApp: false }
  }

  if (isSeniorSocial) {
    const socialApps = seniorApps.filter((a) => {
      const t = String(a.type || a.service || a.assistanceType || "").toLowerCase()
      return t.includes("assistance") || t.includes("social")
    })
    const approvedSocial = socialApps.find((a) => ["approved", "completed", "for_release"].includes(String(a.status || "").toLowerCase()))
    const pendingSocial = socialApps.find((a) => ["pending", "under_review"].includes(String(a.status || "pending").toLowerCase()))
    const rejectedSocial = socialApps.find((a) => ["rejected", "disapproved"].includes(String(a.status || "").toLowerCase()))
    if (approvedSocial) return { isBlocked: true, blockedApp: approvedSocial, hasApprovedApp: true }
    if (pendingSocial) return { isBlocked: true, blockedApp: pendingSocial, hasApprovedApp: false }
    if (rejectedSocial) return { isBlocked: true, blockedApp: rejectedSocial, hasApprovedApp: false }
    return { isBlocked: false, blockedApp: null, hasApprovedApp: false }
  }

  if (isAssistance) {
    const pwdAssistanceApps = pwdApps.filter((a) => {
      const t = String(a.type || a.service || a.assistanceType || "").toLowerCase()
      return t.includes("assistance") || t.includes("social") || (a.documents || []).some((d: any) => String(d.name || "").toLowerCase().includes("indigency"))
    })
    const approvedAssistance = pwdAssistanceApps.find((a) => ["approved", "completed", "for_release"].includes(String(a.status || "").toLowerCase()))
    const pendingAssistance = pwdAssistanceApps.find((a) => ["pending", "under_review"].includes(String(a.status || "pending").toLowerCase()))
    const rejectedAssistance = pwdAssistanceApps.find((a) => ["rejected", "disapproved"].includes(String(a.status || "").toLowerCase()))
    if (approvedAssistance) return { isBlocked: true, blockedApp: approvedAssistance, hasApprovedApp: true }
    if (pendingAssistance) return { isBlocked: true, blockedApp: pendingAssistance, hasApprovedApp: false }
    if (rejectedAssistance) return { isBlocked: true, blockedApp: rejectedAssistance, hasApprovedApp: false }
    return { isBlocked: false, blockedApp: null, hasApprovedApp: false }
  }

  const idApps = relevantApps.filter((a) => {
    const t = String(a.type || a.service || "").toLowerCase()
    const isSub = t.includes("booklet") || t.includes("medicine") || t.includes("movie") || t.includes("assistance")
    return !isSub
  })

  const anyApprovedId = idApps.find((a) => {
    const s = String(a.status || "").toLowerCase()
    return s === "approved" || s === "completed" || s === "for_release"
  })
  const approvedNew = idApps.find((a) => {
    const s = String(a.status || "").toLowerCase()
    const t = String(a.type || "new").toLowerCase()
    return (s === "approved" || s === "completed" || s === "for_release") && t !== "renewal" && t !== "loss" && t !== "replacement"
  })
  const approvedRenewal = idApps.find((a) => {
    const s = String(a.status || "").toLowerCase()
    const t = String(a.type || "").toLowerCase()
    return (s === "approved" || s === "completed" || s === "for_release") && t === "renewal"
  })
  const approvedLoss = idApps.find((a) => {
    const s = String(a.status || "").toLowerCase()
    const t = String(a.type || "").toLowerCase()
    return (s === "approved" || s === "completed" || s === "for_release") && (t === "loss" || t === "replacement")
  })

  const pendingNew = idApps.find((a) => {
    const s = String(a.status || "pending").toLowerCase()
    const t = String(a.type || "new").toLowerCase()
    return (s === "pending" || s === "under_review") && t !== "renewal" && t !== "loss" && t !== "replacement"
  })
  const pendingRenewal = idApps.find((a) => {
    const s = String(a.status || "pending").toLowerCase()
    const t = String(a.type || "").toLowerCase()
    return (s === "pending" || s === "under_review") && t === "renewal"
  })
  const pendingLoss = idApps.find((a) => {
    const s = String(a.status || "pending").toLowerCase()
    const t = String(a.type || "").toLowerCase()
    return (s === "pending" || s === "under_review") && (t === "loss" || t === "replacement")
  })

  const rejectedNew = idApps.find((a) => {
    const s = String(a.status || "").toLowerCase()
    const t = String(a.type || "new").toLowerCase()
    return (s === "rejected" || s === "disapproved") && t !== "renewal" && t !== "loss" && t !== "replacement"
  })
  const rejectedRenewal = idApps.find((a) => {
    const s = String(a.status || "").toLowerCase()
    const t = String(a.type || "").toLowerCase()
    return (s === "rejected" || s === "disapproved") && t === "renewal"
  })
  const rejectedLoss = idApps.find((a) => {
    const s = String(a.status || "").toLowerCase()
    const t = String(a.type || "").toLowerCase()
    return (s === "rejected" || s === "disapproved") && (t === "loss" || t === "replacement")
  })

  if (urlType === "new" || !urlType) {
    if (approvedNew || anyApprovedId) return { isBlocked: true, blockedApp: approvedNew || anyApprovedId, hasApprovedApp: true }
    if (pendingNew) return { isBlocked: true, blockedApp: pendingNew, hasApprovedApp: false }
    if (rejectedNew) return { isBlocked: true, blockedApp: rejectedNew, hasApprovedApp: false }
    return { isBlocked: false, blockedApp: null, hasApprovedApp: false }
  }
  if (urlType === "renewal") {
    if (approvedRenewal) return { isBlocked: true, blockedApp: approvedRenewal, hasApprovedApp: true }
    if (pendingRenewal) return { isBlocked: true, blockedApp: pendingRenewal, hasApprovedApp: false }
    if (rejectedRenewal) return { isBlocked: true, blockedApp: rejectedRenewal, hasApprovedApp: false }
    return { isBlocked: false, blockedApp: null, hasApprovedApp: false }
  }
  if (urlType === "loss") {
    if (approvedLoss) return { isBlocked: true, blockedApp: approvedLoss, hasApprovedApp: true }
    if (pendingLoss) return { isBlocked: true, blockedApp: pendingLoss, hasApprovedApp: false }
    if (rejectedLoss) return { isBlocked: true, blockedApp: rejectedLoss, hasApprovedApp: false }
    return { isBlocked: false, blockedApp: null, hasApprovedApp: false }
  }

  return { isBlocked: false, blockedApp: null, hasApprovedApp: false }
}

interface ProgramCard {
  id: "assistance" | "social-assistance" | "medicine-booklet" | "movie-booklet"
  title: string
  titleEn: string
  desc: string
  descEn: string
  key: string
}

const PWD_PROGRAMS: ProgramCard[] = [
  {
    id: "assistance",
    title: "PWD Social Assistance Program",
    titleEn: "PWD Social Assistance Program",
    desc: "Ang PWD Social Assistance Program ay nagbibigay ng direktang tulong-pinansyal, suporta sa kalusugan, assistive devices (wheelchair, saklay, walker), at tulong-panlipunan para sa mga kapus-palad na Persons with Disabilities at kanilang pamilya upang maibsan ang krisis at matugunan ang kanilang pangangailangan.",
    descEn: "The PWD Social Assistance Program provides specialized financial aid, healthcare subsidies, assistive devices (wheelchairs, crutches, walkers), and emergency social safety nets for indigent Persons with Disabilities and their families to address disability-related vulnerabilities.",
    key: "pwdAssistance",
  },
]

const SENIOR_PROGRAMS: ProgramCard[] = [
  {
    id: "social-assistance",
    title: "Senior Citizen Social Assistance Program",
    titleEn: "Senior Citizen Social Assistance Program",
    desc: "Ang Senior Citizen Social Assistance Program ay nagbibigay ng direktang tulong-pinansyal, suporta sa kalusugan, at agarang tulong-panlipunan para sa mga kapus-palad at nangangailangang Senior Citizens sa Lungsod Quezon upang maibsan ang kanilang krisis.",
    descEn: "The Senior Citizen Social Assistance Program provides specialized financial aid, healthcare subsidies, and emergency social safety nets for indigent Senior Citizens and their families to address senior-related vulnerabilities.",
    key: "seniorAssistance",
  },
  {
    id: "medicine-booklet",
    title: "Medicine Discount Booklet",
    titleEn: "Medicine Discount Booklet",
    desc: "Opisyal na purchase booklet mula sa OSCA para sa pagtatala ng mga binibiling gamot at medical supplies upang magamit ang 20% discount at VAT exemption ng Senior Citizen sa mga botika alinsunod sa batas.",
    descEn: "Official purchase booklet issued by OSCA for recording purchases of essential medicines and medical supplies to avail mandated senior citizen discounts in partner pharmacies.",
    key: "seniorMedicineBooklet",
  },
  {
    id: "movie-booklet",
    title: "Free Movie Booklet",
    titleEn: "Free Movie Booklet",
    desc: "Espesyal na booklet na nagbibigay ng libreng panonood ng pelikula sa mga sinehan sa Lungsod Quezon para sa mga rehistradong Senior Citizens sa mga itinakdang screening schedules.",
    descEn: "Special pass booklet entitling qualified Quezon City Senior Citizens to free admission at participating cinemas and movie theaters in Quezon City during designated schedules.",
    key: "seniorMovieBooklet",
  },
]

export default function ApplyPWDSenior() {
  const { t, language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const urlCategory = searchParams.get("category")?.toLowerCase()
  const rawTypeParam = searchParams.get("type")?.toLowerCase()
  const isSenior = urlCategory === "senior"
  const rawType = rawTypeParam || (isSenior ? "social-assistance" : "assistance")
  const urlType = rawType as "assistance" | "medicine-booklet" | "movie-booklet" | "social-assistance"

  const isOverview = !rawTypeParam
  const isSeniorMedicine = isSenior && urlType === "medicine-booklet"
  const isSeniorMovie = isSenior && urlType === "movie-booklet"
  const isSeniorSocial = isSenior && urlType === "social-assistance"
  const isAssistance = !isSenior || urlType === "assistance"

  const [initialBlockedState] = useState(() => {
    try {
      const currentQcid = getLoggedInUserQcid() || "110000572516915"
      const userProf = getCurrentUserProfile()
      const localApps = getLocalApplications()
      return evaluateActiveAppBlockedState(localApps, urlCategory, urlType, userProf, currentQcid)
    } catch {
      return { isBlocked: false, blockedApp: null, hasApprovedApp: false }
    }
  })

  const [showModal, setShowModal] = useState(false)
  const [understood, setUnderstood] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isBlocked, setIsBlocked] = useState(initialBlockedState.isBlocked)
  const [blockedApp, setBlockedApp] = useState<any>(initialBlockedState.blockedApp)
  const [hasApprovedApp, setHasApprovedApp] = useState(initialBlockedState.hasApprovedApp)

  const [bypassedBlock, setBypassedBlock] = useState(() => {
    try {
      const isUrlParam = typeof window !== "undefined" && window.location.search.includes("reapply=true")
      const isLocal =
        localStorage.getItem(`pwd_senior_reapplying_${urlCategory || "pwd"}_${urlType || "new"}`) === "true" ||
        localStorage.getItem("pwd_senior_reapplying") === "true"
      return Boolean(isUrlParam || isLocal)
    } catch {
      return false
    }
  })
  const bypassedBlockRef = useRef(bypassedBlock)

  useEffect(() => {
    let isMounted = true

    const checkActiveApp = async () => {
      try {
        const currentQcid = getLoggedInUserQcid() || "110000572516915"
        const userProf = getCurrentUserProfile()

        const localApps = getLocalApplications()
        const localRes = evaluateActiveAppBlockedState(localApps, urlCategory, urlType, userProf, currentQcid)
        if (isMounted && localRes.isBlocked) {
          setIsBlocked(true)
          setBlockedApp(localRes.blockedApp)
          setHasApprovedApp(localRes.hasApprovedApp)
        }

        const backendApps = await fetchPwdSeniorApplications()

        let allApps = [...backendApps]
        for (const la of localApps) {
          if (la && !allApps.some((ba) => (ba.id && ba.id === la.id) || (ba.referenceNumber && ba.referenceNumber === la.referenceNumber))) {
            allApps.push(la)
          }
        }
        try {
          localStorage.setItem("pwd_senior_applications", JSON.stringify(allApps))
        } catch {}

        const finalRes = evaluateActiveAppBlockedState(allApps, urlCategory, urlType, userProf, currentQcid)
        if (isMounted) {
          setIsBlocked(finalRes.isBlocked)
          setBlockedApp(finalRes.blockedApp)
          setHasApprovedApp(finalRes.hasApprovedApp)
        }
      } catch (err) {
        console.warn("Eligibility check skipped/offline:", err)
      }
    }

    checkActiveApp()
    const pollInterval = setInterval(checkActiveApp, 8000)

    const unsubscribe = subscribeToRealtimeChanges(() => {
      checkActiveApp()
    })

    const handleUpdated = () => checkActiveApp()
    window.addEventListener("pwd_senior_applications_updated", handleUpdated)
    window.addEventListener("applications_updated", handleUpdated)
    window.addEventListener("financial_disbursements_updated", handleUpdated)
    window.addEventListener("storage", handleUpdated)

    return () => {
      isMounted = false
      clearInterval(pollInterval)
      unsubscribe()
      window.removeEventListener("pwd_senior_applications_updated", handleUpdated)
      window.removeEventListener("applications_updated", handleUpdated)
      window.removeEventListener("financial_disbursements_updated", handleUpdated)
      window.removeEventListener("storage", handleUpdated)
    }
  }, [urlCategory, urlType, isSenior, isAssistance, isSeniorSocial, isSeniorMedicine, isSeniorMovie, isSeniorId])

  useEffect(() => {
    try {
      const isReapp =
        localStorage.getItem(`pwd_senior_reapplying_${urlCategory || "pwd"}_${urlType || "new"}`) === "true" ||
        localStorage.getItem("pwd_senior_reapplying") === "true" ||
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
    setShowModal(false)
    setUnderstood(false)
    setCurrentStep(1)
  }, [urlCategory, urlType])

  const typeBadge = isSeniorMedicine
    ? { label: t("badgeMedicineBooklet"), color: "bg-blue-100 text-blue-700 border-blue-200" }
    : isSeniorMovie
    ? { label: t("badgeMovieBooklet"), color: "bg-blue-100 text-blue-700 border-blue-200" }
    : { label: t("badgeSocialAssistance"), color: "bg-blue-100 text-blue-700 border-blue-200" }

  const serviceCleanTitle = isSeniorMedicine
    ? "Medicine Discount Booklet"
    : isSeniorMovie
    ? "Free Movie Booklet"
    : isSeniorSocial
    ? "Senior Citizen Social Assistance"
    : "PWD Social Assistance"

  const modalTitle = isSeniorMedicine
    ? t("seniorMedicineReqTitle")
    : isSeniorMovie
    ? t("seniorMovieReqTitle")
    : isSeniorSocial
    ? t("seniorSocialReqTitle")
    : t("pwdAssistanceReqTitle")

  const pwdSocialAssistanceRequirements = [
    { title: t("pwdSocialReq1Title"), desc: t("pwdSocialReq1Desc") },
    { title: t("pwdSocialReq2Title"), desc: t("pwdSocialReq2Desc") },
    { title: t("pwdSocialReq3Title"), desc: t("pwdSocialReq3Desc") },
    { title: t("pwdSocialReq4Title"), desc: t("pwdSocialReq4Desc") },
  ]

  const generalPwdRequirements = [
    { title: t("pwdGenReqResidence"), desc: t("pwdGenReqResidenceDesc") },
    { title: t("pwdGenReqPhoto"), desc: t("pwdGenReqPhotoDesc") },
    { title: t("pwdGenReqSignature"), desc: "" },
    { title: t("pwdGenReqDisability"), desc: t("pwdGenReqDisabilityDesc") },
  ]

  const apparentDisabilityRequirements = [
    { title: t("pwdApparentPhoto"), desc: t("pwdApparentPhotoDesc") },
    { title: t("pwdApparentXray"), desc: t("pwdApparentXrayDesc") },
  ]

  const nonApparentDisabilityRequirements = [
    { title: t("pwdNonApparentCert"), desc: t("pwdNonApparentCertDesc") },
    { title: t("pwdNonApparentMedCert"), desc: t("pwdNonApparentMedCertDesc") },
  ]

  const seniorCitizenRequirements = [
    t("seniorReq1"),
    t("seniorReq2"),
    t("seniorReq3"),
    t("seniorReq4"),
    t("seniorReq5"),
    t("seniorReq6"),
  ]

  const seniorSocialRequirements = [
    t("seniorSocialReq1"),
    t("seniorSocialReq2"),
    t("seniorSocialReq3"),
    t("seniorSocialReq4"),
    t("seniorSocialReq5"),
    t("seniorSocialReq6"),
    t("seniorSocialReq7"),
  ]

  const seniorMedicineRequirements = [
    t("seniorMedReq1"),
    t("seniorMedReq2"),
    t("seniorMedReq3"),
    t("seniorMedReq4"),
    t("seniorMedReq5"),
  ]

  const seniorMovieRequirements = [
    t("seniorMovieReq1"),
    t("seniorMovieReq2"),
    t("seniorMovieReq3"),
    t("seniorMovieReq4"),
  ]

  const seniorLossRequirements = [
    t("seniorLossReq1"),
    t("seniorLossReq2"),
    t("seniorMedReq3"),
    t("seniorMedReq4"),
  ]

  const seniorRenewalRequirements = [
    t("seniorRenewalReq1"),
    t("seniorMedReq3"),
    t("seniorRenewalReq3"),
    t("seniorRenewalReq4"),
  ]

  const isAppApproved = String(blockedApp?.status || "").toLowerCase() === "approved" || String(blockedApp?.status || "").toLowerCase() === "completed" || String(blockedApp?.status || "").toLowerCase() === "for_release"
  const isAppRejected = String(blockedApp?.status || "").toLowerCase() === "rejected" || String(blockedApp?.status || "").toLowerCase() === "disapproved"
  const rejectionReason = blockedApp?.rejection_reason || blockedApp?.rejectionReason || blockedApp?.admin_notes || blockedApp?.remarks || ""

  // If category is PWD or SENIOR and no specific program type is chosen, render the Card Grid matching Pic 2
  if (isOverview) {
    const currentQcid = getLoggedInUserQcid() || "110000572516915"
    const userProf = getCurrentUserProfile()
    const localApps = getLocalApplications()
    const programs = isSenior ? SENIOR_PROGRAMS : PWD_PROGRAMS

    return (
      <div className="py-8 px-6 sm:px-10 max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((program) => {
            const ev = evaluateActiveAppBlockedState(localApps, isSenior ? "senior" : "pwd", program.id, userProf, currentQcid)
            const isApproved = ev.hasApprovedApp
            const isOngoing = ev.isBlocked && !ev.hasApprovedApp

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
                {/* Dark navy blue top banner matching Pic 2 */}
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

                  {/* Blocked / Availed Status Banner */}
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
                          ? "You already have an approved record for this program. No need to apply again."
                          : "Mayroon ka nang aprubadong talaan para sa programang ito. Hindi na kailangang mag-apply muli."}
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
                        onClick={() => setSearchParams({ category: isSenior ? "senior" : "pwd", type: program.id })}
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

  if (isBlocked && !bypassedBlock) {
    const displayRef = blockedApp?.referenceNumber || blockedApp?.reference_no || blockedApp?.reference_number || blockedApp?.id || blockedApp?.qc_id || blockedApp?.qcid || getLoggedInUserQcid() || "110000572516915"
    const assignedBookletNo = blockedApp?.assignedIdNumber || blockedApp?.assigned_id_number || blockedApp?.bookletNumber || blockedApp?.existingBookletNumber
    const rawBlockedDate = blockedApp?.created_at || blockedApp?.submittedAt || blockedApp?.submitted_at || blockedApp?.dateSubmitted || blockedApp?.date_submitted
    const displayDate = formatAppDate(rawBlockedDate, blockedApp)

    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4 animate-in fade-in duration-150 py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center gap-4">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${isAppApproved ? "bg-emerald-500/10 text-emerald-600" : isAppRejected ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-500"}`}>
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
                ? (isSeniorMedicine
                    ? (language === "en"
                        ? "Your application for Medicine Discount Booklet has been officially approved! Your official booklet number has been issued."
                        : language === "bis"
                        ? "Ang imong aplikasyon para sa Medicine Discount Booklet opisyal nang na-aprobahan."
                        : "Ang inyong aplikasyon para sa Medicine Discount Booklet ay opisyal nang na-apruba ng Gov Service.")
                    : isSeniorMovie
                    ? (language === "en"
                        ? "Your application for Free Movie Booklet has been officially approved! Your official booklet number has been issued."
                        : language === "bis"
                        ? "Ang imong aplikasyon para sa Free Movie Booklet opisyal nang na-aprobahan."
                        : "Ang inyong aplikasyon para sa Free Movie Booklet ay opisyal nang na-apruba ng Gov Service.")
                    : isAssistance || isSeniorSocial
                    ? (language === "en"
                        ? `Your application for ${serviceCleanTitle} has been officially approved! You can check your scheduled appointment or payout release status.`
                        : language === "bis"
                        ? `Ang imong aplikasyon para sa ${serviceCleanTitle} opisyal nang na-aprobahan sa Gov Service.`
                        : `Ang inyong aplikasyon para sa ${serviceCleanTitle} ay opisyal nang na-apruba ng Gov Service Social Services.`)
                    : (language === "en"
                        ? `Your application for ${serviceCleanTitle} has been officially approved! You already have an active ID.`
                        : language === "bis"
                        ? `Ang imong aplikasyon para sa ${serviceCleanTitle} opisyal nang na-aprobahan. Aduna ka nay aktibo nga ID.`
                        : `Ang inyong aplikasyon para sa ${serviceCleanTitle} ay opisyal nang na-apruba ng Gov Service.`))
                : isAppRejected
                ? (language === "en"
                    ? `Your application for ${serviceCleanTitle} was reviewed and not approved. You can review the reason below and submit a new application with updated documents.`
                    : language === "bis"
                    ? `Ang imong aplikasyon para sa ${serviceCleanTitle} gisusi ug wala na-aprobahan. Mahimo nimong susihon ang hinungdan sa ubos ug mag-apply pag-usab.`
                    : `Ang inyong aplikasyon para sa ${serviceCleanTitle} ay sinuri ng Social Worker at hindi na-aprubahan. Maaari ninyong suriin ang dahilan sa ibaba at mag-apply muli kalakip ang kumpletong mga dokumento.`)
                : (language === "en"
                    ? `Your application for ${serviceCleanTitle} has been successfully submitted and is currently pending review. Please wait for an assessment before submitting a new application.`
                    : language === "bis"
                    ? `Ang imong aplikasyon para sa ${serviceCleanTitle} nasumite na ug kasamtangang girebyu.`
                    : `Ang inyong aplikasyon para sa ${serviceCleanTitle} ay matagumpay na naisumite at kasalukuyang sinusuri.`)}
            </p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-gray-500 font-medium">
                {language === "en" ? "Reference Number:" : language === "bis" ? "Numero sa Reperensya:" : "Application Reference No.:"}
              </span>
              <span className="font-mono font-bold text-blue-600">{displayRef}</span>
            </div>
            {(isSeniorMedicine || isSeniorMovie) && assignedBookletNo && (
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-gray-500 font-medium">
                  {language === "en" ? "Official Booklet Number:" : language === "bis" ? "Numero sa Booklet:" : "Numero ng Booklet:"}
                </span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {assignedBookletNo}
                </span>
              </div>
            )}
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
              <span className="font-semibold text-gray-700">
                {displayDate}
              </span>
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
            {}
            {isAppApproved && !isAssistance && !isSeniorSocial && !isSeniorMedicine && !isSeniorMovie ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const cat = isSenior ? "senior" : "pwd"
                    window.location.href = `/portal/apply-pwd-senior?category=${cat}&type=renewal`
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs uppercase tracking-wide"
                >
                  {isSenior
                    ? (language === "en" ? "Apply for Renewal (Renewal SENIOR ID)" : language === "bis" ? "Pag-apply para sa Renewal (Renewal SENIOR ID)" : "Mag-apply para sa Renewal (Renewal SENIOR ID)")
                    : (language === "en" ? "Apply for Renewal (Renewal PWD ID)" : language === "bis" ? "Pag-apply para sa Renewal (Renewal PWD ID)" : "Mag-apply para sa Renewal (Renewal PWD ID)")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cat = isSenior ? "senior" : "pwd"
                    window.location.href = `/portal/apply-pwd-senior?category=${cat}&type=loss`
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  {language === "en" ? "Apply for Replacement / Lost ID" : language === "bis" ? "Pag-apply para sa Replacement / Nawala nga ID" : "Mag-apply para sa Replacement / Nawalang ID"}
                </button>
              </>
            ) : isAppRejected ? (

              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem(`pwd_senior_reapplying_${urlCategory || "pwd"}_${urlType || "new"}`, "true")
                    localStorage.setItem("pwd_senior_reapplying", "true")
                  } catch {}
                  bypassedBlockRef.current = true
                  setBypassedBlock(true)
                  setIsBlocked(false)
                  setBlockedApp(null)
                  setHasApprovedApp(false)
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
            ) : null}

            {}
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(`pwd_senior_reapplying_${urlCategory || "pwd"}_${urlType || "new"}`)
                  localStorage.removeItem("pwd_senior_reapplying")
                } catch {}
                ;(window as any).__isFormDirty = false
                window.location.href = isAssistance || isSeniorSocial ? "/portal/financial-aid" : "/portal/my-applications"
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-colors cursor-pointer uppercase tracking-wide"
            >
              {isAssistance || isSeniorSocial
                ? (language === "bis" ? "TAN-AWA SA FINANCIAL AID / MY APPLICATIONS" : "VIEW IN FINANCIAL AID / DISBURSEMENT")
                : (language === "bis" ? "TAN-AWA SA KASAYSAYAN SA APLIKASYON" : "VIEW IN APPLICATION HISTORY")}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-2">
      {/* Back to Services overview button */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 mb-3">
        <button
          type="button"
          onClick={() => setSearchParams({ category: isSenior ? "senior" : "pwd" })}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          {isSenior
            ? (language === "en" ? "Back to Senior Citizen Services" : "Bumalik sa mga Serbisyo ng Senior Citizen")
            : (language === "en" ? "Back to PWD Services" : "Bumalik sa mga Serbisyo ng PWD")}
        </button>
      </div>

      {currentStep === 1 && !isBlocked && !blockedApp && !hasApprovedApp && (
        <div className="max-w-5xl mx-auto px-4 md:px-6 mb-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSenior ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm md:text-base font-bold text-foreground">
                    {serviceCleanTitle}
                  </h1>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${typeBadge.color}`}>
                    {typeBadge.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isSenior
                    ? "Official government social service for Senior Citizens."
                    : "Official government social service for Persons with Disability (PWD)."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer shrink-0"
            >
              View Requirements
            </button>
          </div>
        </div>
      )}

      {}
      {(() => {
        const activeProfile = getCurrentUserProfile();
        return isSeniorMedicine ? (
          <SeniorBookletWizard key="senior-medicine" bookletType="medicine" userProfile={activeProfile as any} onStepChange={setCurrentStep} />
        ) : isSeniorMovie ? (
          <SeniorBookletWizard key="senior-movie" bookletType="movie" userProfile={activeProfile as any} onStepChange={setCurrentStep} />
        ) : isSeniorSocial ? (
          <SeniorSocialAssistanceWizard key="senior-social" userProfile={activeProfile as any} onStepChange={setCurrentStep} />
        ) : (
          <PWDSocialAssistanceWizard
            key="pwd-assistance"
            userProfile={activeProfile as any}
            onStepChange={setCurrentStep}
          />
        );
      })()}

      {}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-150"
          >
            {}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
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
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {}
              {isSeniorMedicine && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900">
                      {t("seniorDualCitizenshipNote") || 'NOTE: This may apply to seniors with "dual citizenship status" if he/she can prove his/her Filipino Citizen status and has resided in this city for at least six (6) months.'}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <RefreshCw className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-blue-900">
                      {t("seniorMedicineReminder") || "Paalala: Para sa Medicine Discount Booklet ng Senior Citizen, tiyaking mayroong valid na Senior Citizen / OSCA ID."}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
                      {t("seniorRequirementsHeading") || "REQUIREMENTS:"}
                    </h3>
                    <ul className="space-y-2.5">
                      {seniorMedicineRequirements.map((req, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-foreground">
                          <span className="text-blue-600">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-sm text-muted-foreground italic">
                    {t("seniorSocialWorkerVisitNote") || "A social worker will contact you for verification and to schedule an appointment. Please bring all required documents when you visit."}
                  </p>
                </>
              )}

              {}
              {isSeniorMovie && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900">
                      {t("seniorDualCitizenshipNote") || 'NOTE: This may apply to seniors with "dual citizenship status" if he/she can prove his/her Filipino Citizen status and has resided in this city for at least six (6) months.'}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <RefreshCw className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-blue-900">
                      {t("seniorMovieReminder") || "Paalala: Para sa Free Movie Booklet ng Senior Citizen sa Quezon City cinemas, ihanda ang inyong valid OSCA ID."}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
                      {t("seniorRequirementsHeading") || "REQUIREMENTS:"}
                    </h3>
                    <ul className="space-y-2.5">
                      {seniorMovieRequirements.map((req, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-foreground">
                          <span className="text-blue-600">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-sm text-muted-foreground italic">
                    {t("seniorSocialWorkerVisitNote") || "A social worker will contact you for verification and to schedule an appointment. Please bring all required documents when you visit."}
                  </p>
                </>
              )}

              {}
              {isSeniorSocial && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900">
                      {t("seniorDualCitizenshipNote") || 'NOTE: This may apply to seniors with "dual citizenship status" if he/she can prove his/her Filipino Citizen status and has resided in this city for at least six (6) months.'}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <HeartHandshake className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-blue-900">
                      {t("seniorSocialReminder") || "Paalala: Para sa Tulong Panlipunan (Social Assistance) ng Senior Citizens sa Quezon City, ihanda ang mga kaukulang dokumento at katibayan ng pangangailangan."}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
                      {t("seniorRequirementsHeading") || "REQUIREMENTS:"}
                    </h3>
                    <ul className="space-y-2.5">
                      {seniorSocialRequirements.map((req, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-foreground">
                          <span className="text-blue-600">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-sm text-muted-foreground italic">
                    {t("seniorSocialWorkerVisitNote") || "A social worker will contact you for verification and to schedule an appointment. Please bring all required documents when you visit."}
                  </p>
                </>
              )}

              {}
              {isAssistance && (
                <>
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-white">{t("importantReminder")}</p>
                        <p className="text-sm text-blue-800 dark:text-slate-200 mt-1">
                          {t("pwdAssistanceReminderDesc")}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 flex items-start gap-3">
                      <HeartHandshake className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-blue-950 dark:text-white">
                        {t("pwdAssistanceBanner")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
                      {t("requiredDocumentsHeading")}
                    </h3>
                    <ul className="space-y-2 mb-4">
                      {pwdSocialAssistanceRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground bg-gray-50 dark:bg-slate-900/60 border border-border/80 rounded-xl p-3">
                          <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">☑</span>
                          <div>
                            <span className="font-bold text-foreground">{req.title}</span>
                            {req.desc && <p className="text-muted-foreground text-xs mt-0.5">{req.desc}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    {t("pwdPhotoClearNote")}
                  </p>
                </>
              )}

              {}
              {!isSenior && !isAssistance && (
                <>
                  <div className="space-y-3">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">{t("importantReminder")}</p>
                        <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">{t("pwdGeneralReminderDesc")}</p>
                      </div>
                    </div>

                    <div className={`rounded-xl p-4 flex items-start gap-3 border ${
                      urlType === "renewal"
                        ? "bg-amber-500/10 border-amber-500/30"
                        : urlType === "loss"
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-emerald-500/10 border-emerald-500/30"
                    }`}>
                      <RefreshCw className={`h-5 w-5 shrink-0 mt-0.5 ${
                        urlType === "renewal" ? "text-amber-600 dark:text-amber-400" : urlType === "loss" ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
                      }`} />
                      <p className={`text-sm font-semibold ${
                        urlType === "renewal" ? "text-amber-900 dark:text-amber-200" : urlType === "loss" ? "text-orange-900 dark:text-orange-200" : "text-emerald-900 dark:text-emerald-200"
                      }`}>
                        {urlType === "renewal"
                          ? t("pwdRenewalAlert")
                          : urlType === "loss"
                          ? "PAGPAPALIT NG NAWALA O NASIRANG PWD ID — Ihanda ang Affidavit of Loss o larawan ng sirang ID."
                          : t("pwdNewAlert")}
                      </p>
                    </div>
                  </div>

                  {}
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3">{t("pwdNewRenewalHeading")}</h3>
                    <ul className="space-y-1.5 mb-6">
                      {generalPwdRequirements.map((req, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-foreground">
                          <span className="text-blue-600">•</span>
                          <div>
                            <span className="font-semibold">{req.title}</span>
                            {req.desc && <p className="text-muted-foreground text-xs">{req.desc}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {}
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3">{t("apparentDisabilityHeading")}</h3>
                    <ul className="space-y-1.5 mb-6">
                      {apparentDisabilityRequirements.map((req, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-foreground">
                          <span className="text-blue-600">•</span>
                          <div>
                            <span className="font-semibold">{req.title}</span>
                            <p className="text-muted-foreground text-xs">{req.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {}
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3">{t("nonApparentDisabilityHeading")}</h3>
                    <p className="text-xs text-muted-foreground mb-3 italic">
                      {t("nonApparentSubtitle")}
                    </p>
                    <ul className="space-y-1.5">
                      {nonApparentDisabilityRequirements.map((req, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-foreground">
                          <span className="text-blue-600">•</span>
                          <div>
                            <span className="font-semibold">{req.title}</span>
                            <p className="text-muted-foreground text-xs">{req.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-sm text-muted-foreground italic">
                    {t("pwdBringDocumentsVerificationNote")}
                  </p>
                </>
              )}

              {}
              {isSeniorId && (
                <>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900 dark:text-amber-200">
                      {t("seniorDualCitizenshipNote")}
                    </p>
                  </div>

                  <div className={`rounded-xl p-4 flex items-start gap-3 border ${
                    urlType === "loss"
                      ? "bg-orange-500/10 border-orange-500/30"
                      : urlType === "renewal"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-emerald-500/10 border-emerald-500/30"
                  }`}>
                    <RefreshCw className={`h-5 w-5 shrink-0 mt-0.5 ${
                      urlType === "loss"
                        ? "text-orange-600 dark:text-orange-400"
                        : urlType === "renewal"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`} />
                    <p className={`text-sm font-semibold ${
                      urlType === "loss"
                        ? "text-orange-900 dark:text-orange-200"
                        : urlType === "renewal"
                        ? "text-amber-900 dark:text-amber-200"
                        : "text-emerald-900 dark:text-emerald-200"
                    }`}>
                      {urlType === "loss"
                        ? t("seniorLossAlert") || "Paalala: Para sa pagpapalit ng nawala o nasirang Senior Citizen ID. Ihanda ang Notarized Affidavit of Loss at valid ID."
                        : urlType === "renewal"
                        ? t("seniorRenewalReminder") || "Paalala: Para sa pag-renew ng expired o nag-eexpire na Senior Citizen / OSCA ID."
                        : t("seniorNewAlert")}
                    </p>
                  </div>

                  {}
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3">{t("seniorRequirementsHeading")}</h3>
                    <ul className="space-y-2.5">
                      {(urlType === "loss"
                        ? seniorLossRequirements
                        : urlType === "renewal"
                        ? seniorRenewalRequirements
                        : seniorCitizenRequirements
                      ).map((req, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-foreground">
                          <span className="text-blue-600">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-sm text-muted-foreground italic">
                    {t("seniorSocialWorkerVisitNote")}
                  </p>
                </>
              )}
            </div>

            {}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-2.5 flex-1">
                <input
                  type="checkbox"
                  id="understand"
                  className="mt-0.5 cursor-pointer accent-blue-600 h-4 w-4"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                />
                <label htmlFor="understand" className="text-xs md:text-sm text-foreground cursor-pointer select-none">
                  {t("requirementsAcceptCheckbox")}
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUnderstood(true)
                  setShowModal(false)
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all shrink-0 cursor-pointer shadow-sm"
              >
                {t("continueApplicationBtn") || "Ipagpatuloy ang Aplikasyon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
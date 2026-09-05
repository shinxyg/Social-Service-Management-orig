import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertCircle, RefreshCw, HeartHandshake, X, FileText, Info } from "lucide-react"
import PWDApplicationWizard from "./pwd-senior-wizard"
import SeniorCitizenApplicationWizard from "./Senior-citizen-wizard"
import PWDSocialAssistanceWizard from "./pwd-assistance-wizard"
import SeniorBookletWizard from "./senior-booklet-wizard"
import SeniorSocialAssistanceWizard from "./senior-assistance-wizard"
import { useLanguage } from "../ui/language-context"
import { API_BASE } from "../../config/api"
import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"

export default function ApplyPWDSenior() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()

  const urlCategory = searchParams.get("category")?.toLowerCase() // "pwd" | "senior"
  const rawType = searchParams.get("type")?.toLowerCase() || "new"
  const urlType = rawType as "new" | "renewal" | "loss" | "assistance" | "medicine-booklet" | "movie-booklet" | "social-assistance"

  const [showModal, setShowModal] = useState(false)
  const [understood, setUnderstood] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockedApp, setBlockedApp] = useState<any>(null)

  const isSenior = urlCategory === "senior"
  const isSeniorMedicine = isSenior && urlType === "medicine-booklet"
  const isSeniorMovie = isSenior && urlType === "movie-booklet"
  const isSeniorSocial = isSenior && urlType === "social-assistance"
  const isSeniorId = isSenior && !isSeniorMedicine && !isSeniorMovie && !isSeniorSocial
  const isAssistance = !isSenior && urlType === "assistance"

  // Check for existing pending/active applications for this category & service
  useEffect(() => {
    let isMounted = true

    const checkActiveApp = async () => {
      try {
        let allApps: any[] = []
        try {
          const res = await fetch(`${API_BASE}/api/pwd-senior/applications`)
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) allApps = data
          }
        } catch (err) {
          console.warn("Could not fetch applications from backend:", err)
        }

        const localKeys = ["pwd_senior_applications", "applications", "all_user_applications", "active_applications"]
        for (const k of localKeys) {
          try {
            const local = JSON.parse(localStorage.getItem(k) || "[]")
            if (Array.isArray(local)) {
              for (const la of local) {
                if (la && !allApps.some((a) => (a.id && a.id === la.id) || (a.referenceNumber && a.referenceNumber === la.referenceNumber) || (a.reference_number && a.reference_number === la.reference_number))) {
                  allApps.push(la)
                }
              }
            }
          } catch {}
        }

        const currentQcid = getLoggedInUserQcid() || "110000572516915"
        const userProf = getCurrentUserProfile()
        const currentEmail = (userProf?.email || "").toLowerCase().trim()
        const currentLastName = (userProf?.lastName || "").toLowerCase().trim()
        const currentFirstName = (userProf?.firstName || "").toLowerCase().trim()

        const isMatchForCurrentService = (a: any) => {
          if (!a) return false

          const appCategory = String(a.category || "").toLowerCase()
          const appType = String(a.type || a.assistanceType || a.service || "").toLowerCase()
          const appService = String(a.service || "").toLowerCase()

          if (isAssistance) {
            // PWD Social Assistance
            const isAssistanceType =
              appType === "assistance" ||
              appType === "social-assistance" ||
              appCategory.includes("assistance") ||
              appService.includes("assistance") ||
              (appCategory === "pwd" && (appType === "assistance" || appType === "social-assistance")) ||
              (a.documents || []).some((d: any) => String(d.name || "").toLowerCase().includes("indigency") || String(d.name || "").toLowerCase().includes("pwdqcid"))
            if (!isAssistanceType) return false
          } else if (isSeniorSocial) {
            // Senior Social Assistance
            const isSeniorSocialType =
              (appCategory === "senior" && (appType === "social-assistance" || appType === "assistance")) ||
              appService.includes("senior social")
            if (!isSeniorSocialType) return false
          } else if (isSeniorMedicine) {
            if (!(appCategory === "senior" && appType === "medicine-booklet")) return false
          } else if (isSeniorMovie) {
            if (!(appCategory === "senior" && appType === "movie-booklet")) return false
          } else if (isSeniorId) {
            if (appCategory !== "senior" || appType.includes("assistance") || appType.includes("booklet") || appService.includes("assistance")) return false
          } else {
            // PWD ID
            if (appCategory === "senior" || appType.includes("assistance") || appCategory.includes("assistance") || appService.includes("assistance")) return false
          }

          const appStatus = String(a.status || "pending").toLowerCase()
          if (appStatus !== "pending" && appStatus !== "under_review" && appStatus !== "for_release") return false

          const appRef = String(a.referenceNumber || a.reference_number || a.id || a.qc_id || a.qcid || "").trim()
          const appEmail = String(a.email || "").toLowerCase().trim()
          const appLastName = String(a.lastName || a.last_name || "").toLowerCase().trim()
          const appFirstName = String(a.firstName || a.first_name || "").toLowerCase().trim()

          const matchUser =
            (currentQcid && (appRef === currentQcid || appRef.includes(currentQcid) || currentQcid.includes(appRef) || a.qcid === currentQcid || a.qc_id === currentQcid)) ||
            (currentEmail && appEmail && currentEmail === appEmail) ||
            (currentLastName && appLastName && currentFirstName && appFirstName && currentLastName === appLastName && currentFirstName === appFirstName) ||
            (currentLastName && appLastName && (currentLastName === appLastName || appLastName.includes(currentLastName)))

          return Boolean(matchUser)
        }

        const matchedApp = allApps.find(isMatchForCurrentService)

        if (isMounted) {
          if (matchedApp) {
            setIsBlocked(true)
            setBlockedApp(matchedApp)
          } else {
            setIsBlocked(false)
            setBlockedApp(null)
          }
        }
      } catch (err) {
        console.warn("Eligibility check skipped/offline:", err)
      }
    }

    checkActiveApp()

    const handleUpdated = () => checkActiveApp()
    window.addEventListener("pwd_senior_applications_updated", handleUpdated)
    window.addEventListener("storage", handleUpdated)

    return () => {
      isMounted = false
      window.removeEventListener("pwd_senior_applications_updated", handleUpdated)
      window.removeEventListener("storage", handleUpdated)
    }
  }, [urlCategory, urlType, isSenior, isAssistance, isSeniorSocial, isSeniorMedicine, isSeniorMovie, isSeniorId])

  // Keep modal closed on navigation so user can see and access the form UI directly
  useEffect(() => {
    setShowModal(false)
    setUnderstood(false)
    setCurrentStep(1)
  }, [urlCategory, urlType])

  const typeBadge = isSeniorMedicine
    ? { label: t("badgeMedicineBooklet"), color: "bg-blue-100 text-blue-700 border-blue-200" }
    : isSeniorMovie
    ? { label: t("badgeMovieBooklet"), color: "bg-blue-100 text-blue-700 border-blue-200" }
    : isSeniorSocial
    ? { label: t("badgeSocialAssistance"), color: "bg-blue-100 text-blue-700 border-blue-200" }
    : isAssistance
    ? { label: t("badgeSocialAssistance"), color: "bg-blue-100 text-blue-700 border-blue-200" }
    : urlType === "new"
    ? { label: t("badgeNewApplication"), color: "bg-green-100 text-green-700 border-green-200" }
    : urlType === "loss"
    ? { label: "Replacement / Lost ID", color: "bg-orange-100 text-orange-700 border-orange-200" }
    : { label: t("badgeRenewal"), color: "bg-amber-100 text-amber-700 border-amber-200" }

  const modalTitle = isSeniorMedicine
    ? t("seniorMedicineReqTitle")
    : isSeniorMovie
    ? t("seniorMovieReqTitle")
    : isSeniorSocial
    ? t("seniorSocialReqTitle")
    : isSeniorId
    ? t("seniorIdReqTitle")
    : isAssistance
    ? t("pwdAssistanceReqTitle")
    : t("pwdIdReqTitle")

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

  // Render blocked active application UI directly (matching Pic 2)
  if (isBlocked) {
    const displayRef = blockedApp?.referenceNumber || blockedApp?.reference_no || blockedApp?.reference_number || blockedApp?.id || blockedApp?.qc_id || blockedApp?.qcid || getLoggedInUserQcid() || "110000572516915"
    const displayDate = blockedApp?.created_at || blockedApp?.submittedAt || blockedApp?.dateSubmitted
      ? new Date(blockedApp.created_at || blockedApp.submittedAt || blockedApp.dateSubmitted).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })

    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4 animate-in fade-in duration-150">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Info className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {t("hasPendingAppTitle") || "You Have an Active Application"}
            </h2>
            <p className="text-sm text-gray-500 max-w-md mt-1 leading-relaxed">
              {t("hasPendingAppDesc") ? t("hasPendingAppDesc").replace("{type}", modalTitle) : `Your application for ${modalTitle} has been successfully submitted and is currently pending review. Please wait for a Social Worker's assessment before submitting a new application.`}
            </p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-gray-500 font-medium">{t("appRefNoLabel") || "Application Reference No.:"}</span>
              <span className="font-mono font-bold text-blue-600">{displayRef}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-gray-500 font-medium">{t("appStatusLabel") || "Status:"}</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                {t("statusPendingBadge") || "• Under Review (Pending)"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">{t("dateFiledLabel") || "Date Filed:"}</span>
              <span className="font-semibold text-gray-700">
                {displayDate}
              </span>
            </div>
          </div>

          <div className="w-full pt-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/portal/my-applications"
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs uppercase tracking-wide"
            >
              {t("viewMyApplications") || "VIEW IN MY APPLICATIONS"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-2">
      {/* Top Service Quick Info Banner - shown only on Step 1 (Complete Checklist) */}
      {currentStep === 1 && (
        <div className="max-w-5xl mx-auto px-4 md:px-6 mb-3 animate-in fade-in duration-150">
          <div className="bg-white border border-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSenior ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
              }`}>
                <FileText className="w-5 h-5" />
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

      {/* Background: Direct Form Wizard */}
      {isSeniorMedicine ? (
        <SeniorBookletWizard key="senior-medicine" bookletType="medicine" onStepChange={setCurrentStep} />
      ) : isSeniorMovie ? (
        <SeniorBookletWizard key="senior-movie" bookletType="movie" onStepChange={setCurrentStep} />
      ) : isSeniorSocial ? (
        <SeniorSocialAssistanceWizard key="senior-social" onStepChange={setCurrentStep} />
      ) : isSenior ? (
        <SeniorCitizenApplicationWizard
          key={`senior-${urlType}`}
          initialIdStatus={urlType as "new" | "renewal" | "loss"}
          onStepChange={setCurrentStep}
        />
      ) : isAssistance ? (
        <PWDSocialAssistanceWizard
          key="pwd-assistance"
          onStepChange={setCurrentStep}
        />
      ) : (
        <PWDApplicationWizard
          key={`pwd-${urlType}`}
          initialIdStatus={urlType as "new" | "renewal" | "loss"}
          onStepChange={setCurrentStep}
        />
      )}

      {/* Requirements Dialog Modal appearing over the content */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
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

            {/* Modal Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* MEDICINE BOOKLET REQUIREMENTS */}
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
                      Paalala: Para sa Medicine Discount Booklet ng Senior Citizen, tiyaking mayroong valid na Senior Citizen / OSCA ID.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
                      {t("seniorRequirementsHeading") || "REQUIREMENTS:"}
                    </h3>
                    <ul className="space-y-2.5">
                      {[
                        "Senior Citizen ID / OSCA ID (Valid at Aktibo)",
                        "Valid Government-issued ID na may larawan at lagda",
                        "Kasalukuyang 2×2 ID Picture (White background)",
                        "Barangay Certificate of Residency sa Lungsod Quezon",
                        "Kopya ng Medical Prescription o Doctor's Certificate",
                      ].map((req, idx) => (
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

              {/* MOVIE BOOKLET REQUIREMENTS */}
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
                      Paalala: Para sa Free Movie Booklet ng Senior Citizen sa Quezon City cinemas, ihanda ang inyong valid OSCA ID.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
                      {t("seniorRequirementsHeading") || "REQUIREMENTS:"}
                    </h3>
                    <ul className="space-y-2.5">
                      {[
                        "Senior Citizen ID / OSCA ID (Valid at Aktibo)",
                        "Valid Government-issued ID na may larawan at lagda",
                        "Kasalukuyang 2×2 ID Picture (White background)",
                        "Barangay Certificate of Residency sa Lungsod Quezon",
                      ].map((req, idx) => (
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

              {/* SENIOR SOCIAL ASSISTANCE REQUIREMENTS */}
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
                      Paalala: Para sa Tulong Panlipunan (Social Assistance) ng Senior Citizens sa Quezon City, ihanda ang mga kaukulang dokumento at katibayan ng pangangailangan.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
                      {t("seniorRequirementsHeading") || "REQUIREMENTS:"}
                    </h3>
                    <ul className="space-y-2.5">
                      {[
                        "Senior Citizen ID / OSCA ID (Kopya ng harapan at likod)",
                        "Valid Government-issued ID na may larawan at lagda",
                        "Barangay Certificate of Residency o Indigency",
                        "Kasalukuyang 2×2 ID Picture (White background)",
                        "Proof of Income / Certificate of Indigency (kung kinakailangan)",
                        "Medical Certificate / Prescription (para sa tulong-medikal)",
                        "Iba pang katibayan o dokumento na sumusuporta sa kahilingan",
                      ].map((req, idx) => (
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

              {/* PWD ASSISTANCE SECTION */}
              {isAssistance && (
                <>
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">{t("importantReminder")}</p>
                        <p className="text-sm text-blue-800 mt-1">
                          {t("pwdAssistanceReminderDesc")}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                      <HeartHandshake className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-blue-950">
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
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground bg-gray-50 border border-border/80 rounded-xl p-3">
                          <span className="text-blue-600 font-bold mt-0.5">☑</span>
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

              {/* PWD ID SECTION */}
              {!isSenior && !isAssistance && (
                <>
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">{t("importantReminder")}</p>
                        <p className="text-sm text-blue-800 mt-1">{t("pwdGeneralReminderDesc")}</p>
                      </div>
                    </div>

                    <div className={`rounded-xl p-4 flex items-start gap-3 border ${
                      urlType === "renewal"
                        ? "bg-amber-50 border-amber-200"
                        : urlType === "loss"
                        ? "bg-orange-50 border-orange-200"
                        : "bg-green-50 border-green-200"
                    }`}>
                      <RefreshCw className={`h-5 w-5 shrink-0 mt-0.5 ${
                        urlType === "renewal" ? "text-amber-600" : urlType === "loss" ? "text-orange-600" : "text-green-600"
                      }`} />
                      <p className={`text-sm font-semibold ${
                        urlType === "renewal" ? "text-amber-900" : urlType === "loss" ? "text-orange-900" : "text-green-900"
                      }`}>
                        {urlType === "renewal"
                          ? t("pwdRenewalAlert")
                          : urlType === "loss"
                          ? "PAGPAPALIT NG NAWALA O NASIRANG PWD ID — Ihanda ang Affidavit of Loss o larawan ng sirang ID."
                          : t("pwdNewAlert")}
                      </p>
                    </div>
                  </div>

                  {/* General Requirements */}
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

                  {/* Apparent Disability Requirements */}
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

                  {/* Non-Apparent Disability Requirements */}
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

              {/* SENIOR CITIZEN ID SECTION */}
              {isSeniorId && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900">
                      {t("seniorDualCitizenshipNote")}
                    </p>
                  </div>

                  <div className={`rounded-xl p-4 flex items-start gap-3 border ${
                    urlType === "loss"
                      ? "bg-orange-50 border-orange-200"
                      : urlType === "renewal"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-green-50 border-green-200"
                  }`}>
                    <RefreshCw className={`h-5 w-5 shrink-0 mt-0.5 ${
                      urlType === "loss"
                        ? "text-orange-600"
                        : urlType === "renewal"
                        ? "text-amber-600"
                        : "text-green-600"
                    }`} />
                    <p className={`text-sm font-semibold ${
                      urlType === "loss"
                        ? "text-orange-900"
                        : urlType === "renewal"
                        ? "text-amber-900"
                        : "text-green-900"
                    }`}>
                      {urlType === "loss"
                        ? "Paalala: Para sa pagpapalit ng nawala o nasirang Senior Citizen ID. Ihanda ang Notarized Affidavit of Loss at valid ID."
                        : urlType === "renewal"
                        ? "Paalala: Para sa pag-renew ng expired o nag-eexpire na Senior Citizen / OSCA ID."
                        : t("seniorNewAlert")}
                    </p>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3">{t("seniorRequirementsHeading")}</h3>
                    <ul className="space-y-2.5">
                      {(urlType === "loss"
                        ? [
                            "Notarized Affidavit of Loss na nagsasaad ng pagkawala ng ID",
                            "Valid Government-issued ID na may larawan at lagda",
                            "Kasalukuyang 2×2 ID Picture (White background)",
                            "Barangay Certificate of Residency sa Lungsod Quezon",
                          ]
                        : urlType === "renewal"
                        ? [
                            "Lumang / Expired Senior Citizen / OSCA ID",
                            "Kasalukuyang 2×2 ID Picture (White background)",
                            "Barangay Certificate of Residency (kung nagbago ang tirahan)",
                            "Valid Government ID bilang karagdagang pagkakakilanlan",
                          ]
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

            {/* Modal Footer with Checkbox and Button */}
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
                Ipagpatuloy ang Aplikasyon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
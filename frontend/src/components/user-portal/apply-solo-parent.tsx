import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertCircle, FileText, X, RefreshCw, HeartHandshake } from "lucide-react"
import SoloParentApplicationWizard from "./solo-parent-wizard"
import ChildWelfareApplicationWizard, { getLocalizedChildWelfarePrograms } from "./child-welfare-wizard"
import { useLanguage } from "../ui/language-context"
import { API_BASE } from "../../config/api"
import { getCurrentUserProfile } from "../../utils/userProfile"
import { subscribeToRealtimeChanges } from "../../utils/realtimeSync"

interface RequirementItem {
  title: string
  desc?: string
}

function getLocalizedSoloParentRequirements(
  language: string,
  type: "new" | "renewal" | "loss"
): RequirementItem[] {
  if (type === "renewal") {
    if (language === "en") {
      return [
        {
          title: "Old / Expired Solo Parent ID",
          desc: "Prepare your existing Solo Parent ID number and original or copy of the ID card.",
        },
        {
          title: "ID Picture (2×2)",
          desc: "Recent 2×2 ID Picture with clean white background.",
        },
        {
          title: "Barangay Endorsement",
          desc: "Endorsement from the Solo Parent President of your Barangay.",
        },
        {
          title: "Barangay Certificate of Residency",
          desc: "Required if there is a change of residence in Quezon City since your last application.",
        },
        {
          title: "Sworn Affidavit of Solo Parent",
          desc: "Sworn statement certifying continued sole parental care and support.",
        },
      ]
    }
    if (language === "bis") {
      return [
        {
          title: "Daang / Na-expire nga Solo Parent ID",
          desc: "Ihanda ang imong kasamtangang Solo Parent ID number ug orihinal o kopya sa ID card.",
        },
        {
          title: "ID Picture (2×2)",
          desc: "Bag-ong 2×2 ID Picture nga adunay puti nga background.",
        },
        {
          title: "Endorsement sa Barangay",
          desc: "Endorsement gikan sa Solo Parent President sa imong Barangay.",
        },
        {
          title: "Barangay Certificate of Residency",
          desc: "Gikinahanglan kung adunay pagbag-o sa pinuy-anan sa Quezon City sukad sa miaging aplikasyon.",
        },
        {
          title: "Sworn Affidavit of Solo Parent",
          desc: "Pinanumpaang pamahayag nga nagpamatuod sa padayong bugtong pag-atiman sa anak/mga anak.",
        },
      ]
    }
    return [
      {
        title: "Lumang / Expired Solo Parent ID",
        desc: "Ihanda ang inyong kasalukuyang Solo Parent ID number at orihinal o kopya ng ID card.",
      },
      {
        title: "ID Picture (2×2)",
        desc: "Kasalukuyang 2×2 ID Picture na may puting background.",
      },
      {
        title: "Barangay Endorsement",
        desc: "Endorsement mula sa Solo Parent President ng inyong Barangay.",
      },
      {
        title: "Barangay Certificate of Residency",
        desc: "Kailangan kung may pagbabago sa inyong tirahan sa Quezon City mula sa huling aplikasyon.",
      },
      {
        title: "Sworn Affidavit of Solo Parent",
        desc: "Pinanumpaang salaysay na nagpapatunay ng patuloy na solong pagtataguyod sa anak/mga anak.",
      },
    ]
  }

  if (type === "loss") {
    if (language === "en") {
      return [
        {
          title: "Notarized Affidavit of Loss",
          desc: "Stating the reason, date, and details of loss of your Solo Parent ID card.",
        },
        {
          title: "Valid Government ID / QCitizen ID",
          desc: "With photo and signature as official proof of identity.",
        },
        {
          title: "ID Picture (2×2)",
          desc: "Recent 2×2 ID Picture with clean white background.",
        },
        {
          title: "Barangay Certificate of Residency",
          desc: "Proof of legitimate residency in Quezon City.",
        },
      ]
    }
    if (language === "bis") {
      return [
        {
          title: "Notarized Affidavit of Loss",
          desc: "Nagpatin-aw sa hinungdan, petsa, ug mga detalye sa pagkawala sa imong Solo Parent ID card.",
        },
        {
          title: "Balido nga Government ID / QCitizen ID",
          desc: "Adunay litrato ug pirma isip opisyal nga pruweba sa imong pagkatawo.",
        },
        {
          title: "ID Picture (2×2)",
          desc: "Bag-ong 2×2 ID Picture nga adunay limpyo nga puti nga background.",
        },
        {
          title: "Barangay Certificate of Residency",
          desc: "Pruweba sa lehitimong pagpuyo sa Lungsod Quezon.",
        },
      ]
    }
    return [
      {
        title: "Notarized Affidavit of Loss",
        desc: "Nagsasaad ng dahilan, petsa, at detalye ng pagkawala ng inyong Solo Parent ID card.",
      },
      {
        title: "Valid Government ID / QCitizen ID",
        desc: "May larawan at lagda bilang opisyal na patunay ng inyong pagkakakilanlan.",
      },
      {
        title: "ID Picture (2×2)",
        desc: "Kasalukuyang 2×2 ID Picture na may malinis na puting background.",
      },
      {
        title: "Barangay Certificate of Residency",
        desc: "Patunay ng lehitimong paninirahan sa Lungsod Quezon.",
      },
    ]
  }

  // New Application
  if (language === "en") {
    return [
      {
        title: "1 PC 2×2 ID Picture",
        desc: "Recent 2×2 color photo with clean white background.",
      },
      {
        title: "PSA Birth Certificate/s of Children",
        desc: "Birth certificate/s of dependent child/children.",
      },
      {
        title: "Barangay Certificate of Residency & Parental Care",
        desc: "Proof of legitimate residency and parental care in Quezon City.",
      },
      {
        title: "Proof of Circumstance (Category Document)",
        desc: "Death Certificate, Medical/Detention Record, Court Order, OFW Contract, or CENOMAR based on category.",
      },
      {
        title: "Sworn Affidavit of Solo Parent",
        desc: "Certifying sole parental care and support, and non-cohabitation.",
      },
    ]
  }
  if (language === "bis") {
    return [
      {
        title: "1 PC 2×2 ID Picture",
        desc: "Bag-ong 2×2 ID Picture nga adunay limpyo nga puti nga background.",
      },
      {
        title: "PSA Birth Certificate sa mga Anak",
        desc: "Birth Certificate sa anak o mga anak.",
      },
      {
        title: "Barangay Certificate of Residency & Parental Care",
        desc: "Pruweba sa lehitimong pagpuyo ug pag-atiman sa Quezon City.",
      },
      {
        title: "Pruweba sa Sitwasyon (Kategorya)",
        desc: "Death Certificate, Medical/Detention Record, Court Order, OFW Contract, o CENOMAR base sa kategorya.",
      },
      {
        title: "Sworn Affidavit of Solo Parent",
        desc: "Nagpamatuod nga ikaw bugtong nag-atiman sa bata ug walay kapuyo.",
      },
    ]
  }
  return [
    {
      title: "1 PC 2×2 ID Picture",
      desc: "Kasalukuyang 2×2 ID Picture na may malinis na puting background.",
    },
    {
      title: "PSA Birth Certificate ng mga Anak",
      desc: "Birth Certificate ng anak o mga anak.",
    },
    {
      title: "Barangay Certificate of Residency & Parental Care",
      desc: "Patunay ng lehitimong paninirahan at pangangalaga sa Lungsod Quezon.",
    },
    {
      title: "Katibayan ng Sitwasyon (Category Document)",
      desc: "Death Certificate ng asawa, Medical/Detention Record, Court Order, OFW Contract, o CENOMAR base sa kategorya.",
    },
    {
      title: "Sworn Affidavit of Solo Parent",
      desc: "Pinanumpaang salaysay na nagpapatunay ng solong pagtataguyod sa anak at walang kinakasama.",
    },
  ]
}

export default function ApplySoloParent() {
  const { t, language } = useLanguage()
  const [searchParams] = useSearchParams()

  const categoryParam = searchParams.get("category")?.toLowerCase() || "solo-parent"
  const typeParam = searchParams.get("type")?.toLowerCase() || "new"
  const programParam = searchParams.get("program")?.toLowerCase() || "nutritional-assistance"
  const isChildWelfare = categoryParam === "child-welfare"

  const currentCwPrograms = getLocalizedChildWelfarePrograms(language)
  const matchedCwProgram = currentCwPrograms.find((p) => p.key === programParam) || currentCwPrograms[0]

  const [showRequirementsModal, setShowRequirementsModal] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [understood, setUnderstood] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [cwSubmissionStage, setCwSubmissionStage] = useState<"form" | "matching" | "pending">("form")

  useEffect(() => {
    setSelectedCategoryId(null)
    setUnderstood(false)
    setCurrentStep(1)

    if (isChildWelfare) {
      setIsBlocked(false)
      setShowRequirementsModal(false)
      return
    }

    let active = true
    const checkEligibility = async () => {
      try {
        const typeToCheck = typeParam === "renewal" ? "renewal" : typeParam === "loss" ? "loss" : "new"
        const prof = getCurrentUserProfile()
        const uid = prof.id || ""
        const qcid = (prof.qcidNo || prof.qcidNumber || "").trim()
        const email = (prof.email || "").trim()
        const fn = (prof.firstName || "").trim()
        const ln = (prof.lastName || "").trim()
        const res = await fetch(
          `${API_BASE}/api/solo-parent/eligibility/${uid || "0"}?applicationType=${typeToCheck}&qcid=${encodeURIComponent(qcid)}&email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(fn)}&lastName=${encodeURIComponent(ln)}`
        )
        if (res.ok) {
          const data = await res.json()
          if (active) {
            if (data.blocked) {
              setIsBlocked(true)
              setShowRequirementsModal(false)
              return
            }
          }
        }
      } catch (err) {
        console.warn("Eligibility check error:", err)
      }
      if (active) {
        setIsBlocked(false)
        setShowRequirementsModal(false)
      }
    }

    checkEligibility()
    const interval = setInterval(checkEligibility, 1500)
    const handleUpdate = () => checkEligibility()

    const unsubscribe = subscribeToRealtimeChanges(() => {
      checkEligibility()
    })

    window.addEventListener("solo_parent_applications_updated", handleUpdate)
    window.addEventListener("applications_updated", handleUpdate)
    window.addEventListener("storage", handleUpdate)

    return () => {
      active = false
      clearInterval(interval)
      unsubscribe()
      window.removeEventListener("solo_parent_applications_updated", handleUpdate)
      window.removeEventListener("applications_updated", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [categoryParam, typeParam, programParam, isChildWelfare])

  const isRenewal = typeParam === "renewal"
  const isLoss = typeParam === "loss"

  const modalTitle = isChildWelfare
    ? language === "en"
      ? `Requirements for Child Welfare Support — ${matchedCwProgram.title}`
      : language === "bis"
      ? `Mga Kinahanglanon sa Tabang sa Kaayohan sa Bata — ${matchedCwProgram.title}`
      : `Mga Kinakailangan sa Tulong sa Kapakanan ng Bata — ${matchedCwProgram.title}`
    : language === "en"
    ? "Requirements for Application of QC Solo Parent ID"
    : language === "bis"
    ? "Mga Kinahanglanon sa Pag-apply og QC Solo Parent ID"
    : "Mga Kinakailangan sa Aplikasyon ng QC Solo Parent ID"

  const typeBadge = isChildWelfare
    ? { label: matchedCwProgram.title, color: "bg-blue-50 text-blue-700 border-blue-200" }
    : isRenewal
    ? {
        label: language === "en" ? "Renewal" : language === "bis" ? "Pag-renew" : "Pag-renew",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      }
    : isLoss
    ? {
        label: language === "en" ? "Replacement" : language === "bis" ? "Pag-ilis" : "Pagpapalit",
        color: "bg-orange-50 text-orange-700 border-orange-200",
      }
    : {
        label: language === "en" ? "New Application" : language === "bis" ? "Bag-ong Aplikasyon" : "Bagong Aplikasyon",
        color: "bg-green-50 text-green-700 border-green-200",
      }

  const currentRequirements = getLocalizedSoloParentRequirements(
    language,
    isRenewal ? "renewal" : isLoss ? "loss" : "new"
  )

  const activeProfile = getCurrentUserProfile()

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-2">
      {/* Top Requirements Banner with Button to Open Modal (shown only on Step 1 when not in approved/submitted state) */}
      {!isBlocked && (!isChildWelfare || cwSubmissionStage !== "pending") && currentStep === 1 && (
        <div className="max-w-5xl mx-auto px-4 md:px-6 mb-4 animate-in fade-in duration-150">
          <div className="bg-white border border-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-700">
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
                  {isChildWelfare
                    ? language === "en"
                      ? "Official service for Child & Youth Welfare of Quezon City."
                      : language === "bis"
                      ? "Opisyal nga serbisyo para sa Kaayohan sa Bata ug Kabatan-onan sa Lungsod Quezon."
                      : "Opisyal na serbisyo para sa Child & Youth Welfare ng Lungsod Quezon."
                    : language === "en"
                    ? "Official service for Solo Parents (RA 8972 / RA 11861) of Quezon City."
                    : language === "bis"
                    ? "Opisyal nga serbisyo para sa Solo Parents (RA 8972 / RA 11861) sa Lungsod Quezon."
                    : "Opisyal na serbisyo para sa Solo Parents (RA 8972 / RA 11861) ng Lungsod Quezon."}
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

      {/* Background: Direct Form Wizard */}
      {isChildWelfare ? (
        <ChildWelfareApplicationWizard
          key={`child-welfare-${matchedCwProgram.key}`}
          userProfile={activeProfile as any}
          initialProgramId={matchedCwProgram.id}
          initialProgramKey={matchedCwProgram.key}
          onStepChange={setCurrentStep}
          onSubmissionStageChange={(stage) => setCwSubmissionStage(stage)}
        />
      ) : (
        <SoloParentApplicationWizard
          key={`solo-parent-${typeParam}`}
          userProfile={activeProfile as any}
          initialType={typeParam === "renewal" ? "renewal" : typeParam === "loss" ? "loss" : "new"}
          initialCategoryId={selectedCategoryId}
          isModalOpen={showRequirementsModal}
          onStepChange={setCurrentStep}
          onBlockedStatusChange={(blocked) => {
            setIsBlocked(Boolean(blocked))
            if (blocked) {
              setShowRequirementsModal(false)
            }
          }}
        />
      )}

      {/* Requirements Dialog Modal appearing over content */}
      {showRequirementsModal && !isBlocked && (
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

            {/* Modal Content */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {/* Important Reminder (Blue Box) */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">{t("importantReminder") || "Important reminder"}</p>
                  <p className="text-sm text-blue-800 mt-0.5">
                    {language === "en"
                      ? "Please scroll and read all requirements below."
                      : language === "bis"
                      ? "Palihug i-scroll ug basaha ang tanang gikinahanglang dokumento sa ubos."
                      : "Pakisuri at basahin ang lahat ng dokumentong kailangan sa ibaba."}
                  </p>
                </div>
              </div>

              {/* Status / Category Alert Box */}
              {isChildWelfare ? (
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <HeartHandshake className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-blue-950">
                    {language === "en"
                      ? "CHILD & YOUTH WELFARE — Official program for the welfare, protection, and development of children in Quezon City."
                      : language === "bis"
                      ? "CHILD & YOUTH WELFARE — Opisyal nga programa para sa kaayohan, proteksyon ug paglambo sa mga bata sa Lungsod Quezon."
                      : "CHILD & YOUTH WELFARE — Opisyal na programa para sa kapakanan, proteksyon at pag-unlad ng mga bata sa Lungsod Quezon."}
                  </p>
                </div>
              ) : isRenewal ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-amber-900">
                    {language === "en"
                      ? "RENEWAL — Please prepare your current Solo Parent ID Number before proceeding."
                      : language === "bis"
                      ? "RENEWAL — Palihug ihanda ang imong kasamtangang Solo Parent ID Number sa dili pa mopadayon."
                      : "RENEWAL — Ihanda ang inyong kasalukuyang Solo Parent ID Number bago magpatuloy."}
                  </p>
                </div>
              ) : isLoss ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-orange-900">
                    {language === "en"
                      ? "REPLACEMENT — Please prepare your Notarized Affidavit of Loss before proceeding."
                      : language === "bis"
                      ? "REPLACEMENT — Palihug ihanda ang imong Notarized Affidavit of Loss sa dili pa mopadayon."
                      : "REPLACEMENT — Ihanda ang inyong Notarized Affidavit of Loss bago magpatuloy."}
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-green-900">
                    {language === "en"
                      ? "NEW APPLICATION — Ensure all original or certified true copies of documentary requirements are prepared before proceeding."
                      : language === "bis"
                      ? "BAG-ONG APLIKASYON — Siguroha nga andam ang tanang orihinal o sertipikadong kopya sa mga gikinahanglang dokumento sa dili pa mopadayon."
                      : "NEW APPLICATION — Tiyaking handa ang lahat ng orihinal o certified true copy ng mga documentary requirements bago magpatuloy."}
                  </p>
                </div>
              )}

              {/* Requirements Body */}
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
                <div>
                  <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
                    {isRenewal
                      ? language === "en"
                        ? "REQUIREMENTS (FOR RENEWAL)"
                        : language === "bis"
                        ? "MGA KINAHANGLANON (PARA SA PAG-RENEW)"
                        : "MGA KINAKAILANGAN (PARA SA PAG-RENEW)"
                      : isLoss
                      ? language === "en"
                        ? "REQUIREMENTS (FOR REPLACEMENT)"
                        : language === "bis"
                        ? "MGA KINAHANGLANON (PARA SA PAG-ILIS)"
                        : "MGA KINAKAILANGAN (PARA SA PAGPAPALIT)"
                      : language === "en"
                      ? "REQUIREMENTS (FOR NEW APPLICATION)"
                      : language === "bis"
                      ? "MGA KINAHANGLANON (PARA SA BAG-ONG APLIKASYON)"
                      : "MGA KINAKAILANGAN (PARA SA BAGONG APLIKASYON)"}
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
              )}
            </div>

            {/* Modal Footer with Checkbox and Button */}
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
                    ? "I accept and understand the documentary requirements for this service"
                    : language === "bis"
                    ? "Gidawat ug nasabtan nako ang mga gikinahanglang dokumento alang niini nga serbisyo"
                    : "Tinatanggap at nauunawaan ko ang mga kailangang dokumento para sa serbisyong ito"}
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
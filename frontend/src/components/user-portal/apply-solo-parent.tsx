import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertCircle, FileText, X, RefreshCw, HeartHandshake } from "lucide-react"
import SoloParentApplicationWizard from "./solo-parent-wizard"
import ChildWelfareApplicationWizard, { getLocalizedChildWelfarePrograms } from "./child-welfare-wizard"
import { useLanguage } from "../ui/language-context"
import { API_BASE } from "../../config/api"

interface RequirementItem {
  title: string
  desc?: string
}

const SOLO_PARENT_NEW_REQUIREMENTS: RequirementItem[] = [
  {
    title: "Proof of Residence",
    desc: "Valid Government ID na may tirahan sa Quezon City o Orihinal na Barangay Certificate of Residency.",
  },
  {
    title: "ID Picture (2×2)",
    desc: "Kasalukuyang 2×2 ID Picture na may malinis na puting background.",
  },
  {
    title: "Signature / Lagda",
    desc: "Malinaw na ispesimen ng pirma o electronic signature ng magulang.",
  },
  {
    title: "PSA Birth Certificate ng mga Anak",
    desc: "Birth Certificate ng anak o mga anak (wala pang 18 taong gulang o dependent na may kapansanan).",
  },
  {
    title: "Sworn Affidavit of Solo Parent",
    desc: "Nagsasaad na ikaw ay solong nagtataguyod sa bata at walang kinakasama o bagong asawa.",
  },
  {
    title: "Katibayan ng Sitwasyon (Category Proof)",
    desc: "Death Certificate ng asawa, Medical/Detention Record, Court Order ng Nullity, OFW Contract, o CENOMAR.",
  },
  {
    title: "Certificate of Attendance (Seminar)",
    desc: "Katibayan ng pagdalo sa Solo Parent Orientation Seminar ng QC SSDD.",
  },
]

const SOLO_PARENT_RENEWAL_REQUIREMENTS: RequirementItem[] = [
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

const SOLO_PARENT_LOSS_REQUIREMENTS: RequirementItem[] = [
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(1)
  const [understood, setUnderstood] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    setSelectedCategoryId(1)
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
        const res = await fetch(
          `${API_BASE}/api/solo-parent/eligibility/1?applicationType=${typeToCheck}`
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
    return () => {
      active = false
    }
  }, [categoryParam, typeParam, programParam, isChildWelfare])

  const isRenewal = typeParam === "renewal"
  const isLoss = typeParam === "loss"

  const modalTitle = isChildWelfare
    ? `Requirements for Child Welfare Support — ${matchedCwProgram.title}`
    : "Requirements for Application of QC Solo Parent ID"

  const typeBadge = isChildWelfare
    ? { label: matchedCwProgram.title, color: "bg-blue-50 text-blue-700 border-blue-200" }
    : isRenewal
    ? { label: "Renewal", color: "bg-amber-50 text-amber-700 border-amber-200" }
    : isLoss
    ? { label: "Replacement", color: "bg-orange-50 text-orange-700 border-orange-200" }
    : { label: "New Application", color: "bg-green-50 text-green-700 border-green-200" }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-2">
      {/* Top Requirements Banner with Button to Open Modal (shown only on Step 1) */}
      {!isBlocked && currentStep === 1 && (
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
                    ? "Opisyal na serbisyo para sa Child & Youth Welfare ng Lungsod Quezon."
                    : "Opisyal na serbisyo para sa Solo Parents (RA 8972 / RA 11861) ng Lungsod Quezon."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRequirementsModal(true)}
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer shrink-0"
            >
              Tingnan ang Requirements
            </button>
          </div>
        </div>
      )}

      {/* Background: Direct Form Wizard */}
      {isChildWelfare ? (
        <ChildWelfareApplicationWizard
          key={`child-welfare-${matchedCwProgram.key}`}
          initialProgramId={matchedCwProgram.id}
          initialProgramKey={matchedCwProgram.key}
          onStepChange={setCurrentStep}
        />
      ) : (
        <SoloParentApplicationWizard
          key={`solo-parent-${typeParam}`}
          initialType={typeParam === "renewal" ? "renewal" : typeParam === "loss" ? "loss" : "new"}
          initialCategoryId={selectedCategoryId}
          isModalOpen={showRequirementsModal}
          onStepChange={setCurrentStep}
          onBlockedStatusChange={(blocked) => {
            if (blocked) {
              setIsBlocked(true)
              setShowRequirementsModal(false)
            }
          }}
        />
      )}

      {/* Requirements Dialog Modal appearing over content (Matches Pic 2) */}
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
                  <p className="text-sm text-blue-800 mt-0.5">Please scroll and read all requirements below.</p>
                </div>
              </div>

              {/* Status / Category Alert Box */}
              {isChildWelfare ? (
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <HeartHandshake className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-blue-950">
                    CHILD & YOUTH WELFARE — Opisyal na programa para sa kapakanan, proteksyon at pag-unlad ng mga bata sa Lungsod Quezon.
                  </p>
                </div>
              ) : isRenewal ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-amber-900">
                    RENEWAL — Please prepare your current Solo Parent ID Number before proceeding.
                  </p>
                </div>
              ) : isLoss ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-orange-900">
                    REPLACEMENT — Please prepare your Notarized Affidavit of Loss before proceeding.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-green-900">
                    NEW APPLICATION — Tiyaking handa ang lahat ng orihinal o certified true copy ng mga documentary requirements bago magpatuloy.
                  </p>
                </div>
              )}

              {/* Requirements Body */}
              {isChildWelfare ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2 uppercase tracking-wide">
                      I. ANO ANG {matchedCwProgram.title.toUpperCase()} PROGRAM?
                    </h3>
                    <p className="text-sm text-foreground/80 leading-relaxed bg-gray-50 border border-border/80 rounded-xl p-3.5">
                      {matchedCwProgram.whatIsIt}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2 uppercase tracking-wide">
                      II. SINO ANG KWALIPIKADO SA PROGRAMA?
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
                      III. REQUIREMENTS (MGA DOKUMENTONG KAILANGAN)
                    </h3>

                    {matchedCwProgram.childRequirements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">Para sa Bata:</h4>
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
                          Para sa Magulang / Guardian / Reporting Person:
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
                          Para sa ilang uri ng assistance / Kung kinakailangan:
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
                      ? "REQUIREMENTS (FOR RENEWAL)"
                      : isLoss
                      ? "REQUIREMENTS (FOR REPLACEMENT)"
                      : "REQUIREMENTS (FOR NEW APPLICATION)"}
                  </h3>
                  <ul className="space-y-3 mb-6">
                    {(isRenewal
                      ? SOLO_PARENT_RENEWAL_REQUIREMENTS
                      : isLoss
                      ? SOLO_PARENT_LOSS_REQUIREMENTS
                      : SOLO_PARENT_NEW_REQUIREMENTS
                    ).map((req, idx) => (
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

            {/* Modal Footer with Checkbox and Button (Matches Pic 2) */}
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
                  {t("requirementsAcceptCheckbox") || "I accept and understand the documentary requirements for this service"}
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
                Ipagpatuloy ang Aplikasyon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
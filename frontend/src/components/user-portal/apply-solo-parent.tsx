import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertCircle, FileText } from "lucide-react"
import SoloParentApplicationWizard from "./solo-parent-wizard"
import ChildWelfareApplicationWizard, { CHILD_WELFARE_PROGRAMS, getLocalizedChildWelfarePrograms } from "./child-welfare-wizard"
import { useLanguage } from "../ui/language-context"
import { API_BASE } from "../../config/api"

const SOLO_PARENT_PRIMARY_REQUIREMENTS = [
  "PSA Birth Certificate/s ng anak o mga anak",
  "Barangay Certificate of Residency & Parental Care",
  "Sworn Affidavit of Solo Parent (nagpapatunay ng sole parental care at hindi nakikipag-live-in)",
  "Kaukulang Dokumento batay sa Sitwasyon (e.g. Death Certificate, CENOMAR, Medical/Detention Record, Court Order, OFW Contract, etc.)",
  "Solo Parent Orientation Seminar Certificate of Attendance",
  "Recent 2×2 ID Picture na may puting background",
]

const RENEWAL_REQUIREMENTS = [
  "Barangay Certificate (Kailangan lamang kung nagbago ang tirahan mula noong huling application)",
  "Endorsement mula sa Solo Parent President ng iyong Barangay",
  "Previous / Expired Solo Parent ID",
  "Recent 2×2 ID Picture (White background)",
]

const LOSS_ID_REQUIREMENTS = [
  "Notarized Affidavit of Loss na nagpapatunay ng pagkawala ng Solo Parent ID",
  "Recent 2×2 ID Picture (White background)",
  "Valid Government-issued ID o QCitizen ID",
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

  useEffect(() => {
    setSelectedCategoryId(1)
    setUnderstood(false)

    if (isChildWelfare) {
      setIsBlocked(false)
      setShowRequirementsModal(true)
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
        setShowRequirementsModal(true)
      }
    }

    checkEligibility()
    return () => {
      active = false
    }
  }, [categoryParam, typeParam, programParam, isChildWelfare])

  const isRenewal = typeParam === "renewal"
  const isLoss = typeParam === "loss"
  const canProceed = understood

  const modalTitle = isChildWelfare
    ? `${matchedCwProgram.title} Requirements`
    : isRenewal
    ? t("spReqModalTitleRenewal")
    : isLoss
    ? t("spReqModalTitleLoss")
    : t("spReqModalTitleNew")

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-2">
      {/* Background: Direct Form Wizard */}
      {isChildWelfare ? (
        <ChildWelfareApplicationWizard
          key={`child-welfare-${matchedCwProgram.key}`}
          initialProgramId={matchedCwProgram.id}
          initialProgramKey={matchedCwProgram.key}
        />
      ) : (
        <SoloParentApplicationWizard
          key={`solo-parent-${typeParam}`}
          initialType={typeParam === "renewal" ? "renewal" : typeParam === "loss" ? "loss" : "new"}
          initialCategoryId={selectedCategoryId}
          isModalOpen={showRequirementsModal}
          onBlockedStatusChange={(blocked) => {
            if (blocked) {
              setIsBlocked(true)
              setShowRequirementsModal(false)
            }
          }}
        />
      )}

      {/* Requirements Dialog Modal appearing over content */}
      {showRequirementsModal && !isBlocked && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col relative"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-start justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {modalTitle}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isChildWelfare
                    ? t("spSubChildWelfare")
                    : isRenewal
                    ? t("spSubRenewal")
                    : isLoss
                    ? t("spSubLoss")
                    : t("spSubNew")}
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {isChildWelfare ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">{t("importantReminder") || "Important reminder"}</p>
                      <p className="text-sm text-blue-800 mt-1">
                        Please scroll and read all requirements below for your selected service.
                      </p>
                    </div>
                  </div>

                  <div className="border border-border rounded-xl p-5 space-y-4 bg-gray-50/50">
                    <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wide border-b border-gray-200 pb-2">
                      SERVICE REQUIREMENTS FOR THE {matchedCwProgram.title.toUpperCase()} PROGRAM:
                    </h3>

                    {/* Section I */}
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-gray-900">I. Ano ang {matchedCwProgram.title} Program?</p>
                      <p className="text-gray-700 leading-relaxed pl-3">{matchedCwProgram.whatIsIt}</p>
                    </div>

                    {/* Section II */}
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-gray-900">II. Sino ang kwalipikado sa programa?</p>
                      <ul className="space-y-1 text-gray-700 pl-5 list-disc">
                        {matchedCwProgram.whoIsEligible.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Section III */}
                    <div className="space-y-2 text-xs">
                      <p className="font-bold text-gray-900">III. Requirements</p>

                      {matchedCwProgram.childRequirements.length > 0 && (
                        <div className="pl-3">
                          <p className="font-semibold text-gray-800">Para sa Bata:</p>
                          <ul className="space-y-1 text-gray-700 pl-5 list-disc">
                            {matchedCwProgram.childRequirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {matchedCwProgram.parentRequirements.length > 0 && (
                        <div className="pl-3">
                          <p className="font-semibold text-gray-800">Para sa Magulang / Guardian / Reporting Person:</p>
                          <ul className="space-y-1 text-gray-700 pl-5 list-disc">
                            {matchedCwProgram.parentRequirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {matchedCwProgram.specialRequirements.length > 0 && (
                        <div className="pl-3">
                          <p className="font-semibold text-gray-800">Para sa ilang uri ng assistance / Kung kinakailangan:</p>
                          <ul className="space-y-1 text-gray-700 pl-5 list-disc">
                            {matchedCwProgram.specialRequirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : isRenewal ? (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-blue-950 uppercase tracking-wider">
                    {t("spRenewalHeading")}
                  </h4>
                  <ul className="space-y-2 text-xs text-blue-950">
                    {RENEWAL_REQUIREMENTS.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : isLoss ? (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-blue-950 uppercase tracking-wider">
                    {t("spLossHeading")}
                  </h4>
                  <ul className="space-y-2 text-xs text-blue-950">
                    {LOSS_ID_REQUIREMENTS.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-blue-950 uppercase tracking-wider">
                    {t("spPrimaryHeading")}
                  </h4>
                  <ul className="space-y-2 text-xs text-blue-950">
                    {SOLO_PARENT_PRIMARY_REQUIREMENTS.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t p-6 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <input
                  type="checkbox"
                  id="understand"
                  className="mt-1 cursor-pointer"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                />
                <label htmlFor="understand" className="text-sm text-foreground cursor-pointer select-none">
                  {t("requirementsAcceptCheckbox")}
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowRequirementsModal(false)}
                disabled={!canProceed}
                className={`px-6 py-2 rounded-lg font-semibold transition-all shrink-0 ${
                  canProceed
                    ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-sm"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {t("iUnderstand")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
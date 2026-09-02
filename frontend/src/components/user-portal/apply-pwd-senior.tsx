import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertCircle, RefreshCw, HeartHandshake } from "lucide-react"
import PWDApplicationWizard from "./pwd-senior-wizard"
import SeniorCitizenApplicationWizard from "./Senior-citizen-wizard"
import PWDSocialAssistanceWizard from "./pwd-assistance-wizard"
import SeniorBookletWizard from "./senior-booklet-wizard"
import SeniorSocialAssistanceWizard from "./senior-assistance-wizard"
import { useLanguage } from "../ui/language-context"

export default function ApplyPWDSenior() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()

  const urlCategory = searchParams.get("category")?.toLowerCase() // "pwd" | "senior"
  const rawType = searchParams.get("type")?.toLowerCase() || "new"
  const urlType = rawType as "new" | "renewal" | "loss" | "assistance" | "medicine-booklet" | "movie-booklet" | "social-assistance"

  const [showModal, setShowModal] = useState(true)
  const [understood, setUnderstood] = useState(false)

  // Reset modal state whenever the user switches links in the sidebar
  useEffect(() => {
    setShowModal(true)
    setUnderstood(false)
  }, [urlCategory, urlType])

  const isSenior = urlCategory === "senior"
  const isSeniorMedicine = isSenior && urlType === "medicine-booklet"
  const isSeniorMovie = isSenior && urlType === "movie-booklet"
  const isSeniorSocial = isSenior && urlType === "social-assistance"
  const isSeniorId = isSenior && !isSeniorMedicine && !isSeniorMovie && !isSeniorSocial
  const isAssistance = !isSenior && urlType === "assistance"

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



  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-2">
      {/* Background: Direct Form Wizard */}
      {isSeniorMedicine ? (
        <SeniorBookletWizard key="senior-medicine" bookletType="medicine" />
      ) : isSeniorMovie ? (
        <SeniorBookletWizard key="senior-movie" bookletType="movie" />
      ) : isSeniorSocial ? (
        <SeniorSocialAssistanceWizard key="senior-social" />
      ) : isSenior ? (
        <SeniorCitizenApplicationWizard
          key={`senior-${urlType}`}
          initialIdStatus={urlType as "new" | "renewal" | "loss"}
        />
      ) : isAssistance ? (
        <PWDSocialAssistanceWizard
          key="pwd-assistance"
        />
      ) : (
        <PWDApplicationWizard
          key={`pwd-${urlType}`}
          initialIdStatus={urlType as "new" | "renewal" | "loss"}
        />
      )}

      {/* Requirements Dialog Modal appearing over the content */}
      {showModal && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col relative"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                <h2 className="text-lg font-bold text-foreground">
                  {modalTitle}
                </h2>
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${typeBadge.color}`}>
                  {typeBadge.label}
                </span>
              </div>
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
                onClick={() => setShowModal(false)}
                disabled={!understood}
                className={`px-6 py-2 rounded-lg font-semibold transition-all shrink-0 ${
                  understood
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
import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ChevronLeft, Lock, CheckCircle2, Clock, ArrowRight } from "lucide-react"
import ApplyAICS from "./apply-aics"
import AICSServiceWizard, { type AICSServiceType } from "./aics-service-wizard"
import { useLanguage } from "../ui/language-context"
import { API_BASE } from "../../config/api"
import { getCurrentUserProfile } from "../../utils/userProfile"

interface AICSProgramCard {
  id: string
  title: string
  titleEn: string
  desc: string
  descEn: string
  key: string
  reqKey: string
}

const AICS_PROGRAMS: AICSProgramCard[] = [
  {
    id: "educational",
    title: "Educational Assistance - Children with Disability",
    titleEn: "Educational Assistance - Children with Disability",
    desc: "Ang programang ito ay nagbibigay ng tulong-pinansyal sa mga taong may kapansanan upang masuportahan ang gastusing pang edukasyon. Ang halaga ay P5,000 para sa bawat kwalipikadong benepisyaryo.",
    descEn: "This program provides financial assistance to individuals with disabilities and qualified students to support educational expenses and tuition. The aid amount is P5,000 for each qualified beneficiary.",
    key: "Educational Assistance",
    reqKey: "aicsEducational",
  },
  {
    id: "funeral",
    title: "Burial Assistance",
    titleEn: "Burial / Funeral Assistance",
    desc: "Ang Funeral and Burial Assistance Program ay batay sa Ordinansa 2865 S-2019 ay nagbibigay ng tulong pinansyal sa pamamagitan ng Certificate of Guarantee sa accredited partner funeral home ng lungsod. Ang funeral service package ay nakasaad sa Funeral Contract kabilang ang mga sumusunod na serbisyo na hindi lalagpas sa Php25,000.",
    descEn: "The Funeral and Burial Assistance Program under Ordinance 2865 S-2019 provides financial aid through a Certificate of Guarantee to accredited partner funeral homes, covering service packages up to Php25,000.",
    key: "aicsFuneral",
    reqKey: "aicsFuneral",
  },
  {
    id: "medical",
    title: "Medical Assistance",
    titleEn: "Medical Assistance",
    desc: "Ang Medical Assistance Program ay isa sa mga programa ng Lungsod Quezon na nangangalaga sa kalusugan ng mga residente na naninirahan dito at walang kakayahan na tugunan ang kanilang medikal na pangangailangan. Ito ay isinasagawa sa pamamagitan ng pagbibigay ng tulong pinansyal o medikal tulad ng ospitalisasyon, medical laboratory examinations, libreng gamot, medical supplies na hindi available sa Quezon City Health Department na pinangangasiwaan ng Social Services Development Department.",
    descEn: "The Medical Assistance Program safeguards the health of residents unable to meet medical needs, providing financial or medical support for hospitalization, laboratory examinations, medicines, and supplies.",
    key: "aicsMedical",
    reqKey: "aicsMedical",
  },
  {
    id: "material",
    title: "Material Assistance",
    titleEn: "Material Assistance",
    desc: "Ang Material Assistance Program ay nagbibigay ng tulong-materyal tulad ng mga assistive devices (wheelchair, saklay, walker), emergency relief supplies, at kagamitang pang-ayuda para sa mga residenteng may kapansanan o lubos na nangangailangan dulot ng krisis.",
    descEn: "The Material Assistance Program provides material aid such as assistive medical devices (wheelchairs, crutches, walkers), relief supplies, and emergency essentials for citizens in crisis.",
    key: "aicsMaterial",
    reqKey: "aicsMaterial",
  },
  {
    id: "food",
    title: "Food Assistance",
    titleEn: "Food Assistance",
    desc: "Ang Food Assistance Program ay nagbibigay ng agarang tulong-pagkain, emergency food packs, at grocery vouchers para sa mga indigent families at indibidwal na apektado ng biglaang krisis, kalamidad, o matinding kakapusan.",
    descEn: "The Food Assistance Program provides emergency nutritional food packages, relief groceries, and subsistence assistance for indigent families facing severe crisis or hardship.",
    key: "aicsFood",
    reqKey: "aicsFood",
  },
  {
    id: "transportation",
    title: "Transportation Assistance",
    titleEn: "Transportation Assistance",
    desc: "Ang Transportation Assistance Program ay nagbibigay ng tulong-pamasahe o pabalik na biyahe (Balik Probinsya) para sa mga residenteng na-stranded, naipit sa krisis, o may agarang pangangailangan sa transportasyon pabalik sa kanilang sariling probinsya.",
    descEn: "The Transportation Assistance Program provides emergency fare allowances and repatriation transit assistance for stranded citizens returning to their home provinces.",
    key: "aicsTransportation",
    reqKey: "aicsTransportation",
  },
]

export default function AICSUser() {
  const { t, language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [userApps, setUserApps] = useState<any[]>([])

  useEffect(() => {
    const loadApps = async () => {
      try {
        const prof = getCurrentUserProfile()
        const qcId = prof?.qcId || ""
        const email = prof?.email || ""
        const res = await fetch(`${API_BASE}/api/aics/applications?email=${encodeURIComponent(email)}&qcId=${encodeURIComponent(qcId)}`)
        if (res.ok) {
          const data = await res.json()
          setUserApps(data.applications || [])
        }
      } catch {}
    }
    loadApps()
    window.addEventListener("aics_applications_updated", loadApps)
    window.addEventListener("printed_gl_applications_updated", loadApps)
    window.addEventListener("applications_updated", loadApps)
    window.addEventListener("storage", loadApps)
    return () => {
      window.removeEventListener("aics_applications_updated", loadApps)
      window.removeEventListener("printed_gl_applications_updated", loadApps)
      window.removeEventListener("applications_updated", loadApps)
      window.removeEventListener("storage", loadApps)
    }
  }, [])

  const rawType = searchParams.get("type")?.toLowerCase()
  const selectedProgram = rawType ? AICS_PROGRAMS.find((p) => p.id === rawType) : null

  const getProgramMatch = (programId: string) => {
    return userApps.find((app) => {
      const ast = String(app.assistance_type || "").toLowerCase()
      const rawGL = typeof window !== "undefined" ? localStorage.getItem("printed_gl_applications") : null
      const glMap = rawGL ? JSON.parse(rawGL) : {}
      const cleanRef = String(app.reference_no || "").toLowerCase().trim()
      const isGL = cleanRef && glMap[cleanRef]

      const rawSt = String(app.status || "").toLowerCase()
      const isApprovedOrActive = isGL || rawSt === "approved" || rawSt === "completed" || rawSt === "under_review" || rawSt === "scheduled" || rawSt === "pending" || rawSt === "submit_pending"
      if (!isApprovedOrActive) return false

      if (programId === "medical") return ast.includes("medical") || ast.includes("gamot") || ast.includes("hospital") || ast.includes("medicine")
      if (programId === "funeral") return ast.includes("funeral") || ast.includes("burial") || ast.includes("libing")
      if (programId === "educational") return ast.includes("education") || ast.includes("aral") || ast.includes("school")
      if (programId === "material") return ast.includes("material")
      if (programId === "food") return ast.includes("food") || ast.includes("pagkain")
      if (programId === "transportation") return ast.includes("transport") || ast.includes("pamasahe")
      return false
    })
  }

  // If no specific service type selected, render the Card Grid matching Pic 1
  if (!selectedProgram) {
    return (
      <div className="py-8 px-6 sm:px-10 max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AICS_PROGRAMS.map((program) => {
            const existingApp = getProgramMatch(program.id)
            const rawGL = typeof window !== "undefined" ? localStorage.getItem("printed_gl_applications") : null
            const glMap = rawGL ? JSON.parse(rawGL) : {}
            const cleanRef = existingApp ? String(existingApp.reference_no || "").toLowerCase().trim() : ""
            const isApproved = existingApp && (
              (cleanRef && glMap[cleanRef]) ||
              String(existingApp.status || "").toLowerCase() === "approved" ||
              String(existingApp.status || "").toLowerCase() === "completed"
            )
            const isOngoing = existingApp && !isApproved

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
                {/* Dark navy blue top banner */}
                <div className={`text-white py-3 px-4 font-bold text-center text-sm md:text-base tracking-wide select-none flex items-center justify-center gap-2 ${
                  isApproved ? "bg-emerald-800" : isOngoing ? "bg-slate-800" : "bg-[#1e3a5f]"
                }`}>
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
                          ? "You already have an approved Guarantee Letter for this assistance. No need to apply again."
                          : "Mayroon ka nang aprubadong Guarantee Letter para sa tulong na ito. Hindi na kailangang mag-apply muli."}
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
                          ? "Your application for this assistance has been submitted and is currently being assessed by a Social Worker."
                          : "Nakasumite na ang inyong aplikasyon para sa programang ito at nasa ilalim ng pagsusuri ng Social Worker."}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2 flex justify-center">
                    {existingApp ? (
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
                        onClick={() => setSearchParams({ type: program.id })}
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

  // Handle back to cards list
  const handleBackToCards = () => {
    setSearchParams({})
  }

  // Render the specific service wizard / form
  const isSpecialWizard =
    selectedProgram.id === "material" ||
    selectedProgram.id === "food" ||
    selectedProgram.id === "transportation"

  return (
    <div className="py-6 px-6 sm:px-10 max-w-5xl mx-auto space-y-4">
      {/* Back button to return to Card Grid */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBackToCards}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          {language === "en" ? "Back to AICS Programs" : "Bumalik sa mga Programa ng AICS"}
        </button>
      </div>

      {isSpecialWizard ? (
        <AICSServiceWizard
          key={selectedProgram.id}
          serviceType={selectedProgram.id as AICSServiceType}
          onBack={handleBackToCards}
        />
      ) : (
        <ApplyAICS
          key={selectedProgram.reqKey}
          initialType={t(selectedProgram.key)}
          initialTypeKey={selectedProgram.reqKey}
          onBack={handleBackToCards}
        />
      )}
    </div>
  )
}
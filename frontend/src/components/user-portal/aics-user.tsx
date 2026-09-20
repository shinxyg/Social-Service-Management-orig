import { useSearchParams } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import ApplyAICS from "./apply-aics"
import AICSServiceWizard, { type AICSServiceType } from "./aics-service-wizard"
import { useLanguage } from "../ui/language-context"

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

  const rawType = searchParams.get("type")?.toLowerCase()
  const selectedProgram = rawType ? AICS_PROGRAMS.find((p) => p.id === rawType) : null

  // If no specific service type selected, render the Card Grid matching Pic 1
  if (!selectedProgram) {
    return (
      <div className="py-4 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AICS_PROGRAMS.map((program) => (
            <div
              key={program.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              {/* Dark navy blue top banner matching pic1 */}
              <div className="bg-[#1e3a5f] text-white py-3 px-5 font-bold text-center text-sm md:text-base tracking-wide select-none">
                {language === "en" ? program.titleEn : program.title}
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col justify-between flex-1 gap-6">
                <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed text-justify">
                  {language === "en" ? program.descEn : program.desc}
                </p>

                {/* Centered Blue Action Button */}
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setSearchParams({ type: program.id })}
                    className="text-[#0066cc] dark:text-sky-400 hover:text-[#004c99] dark:hover:text-sky-300 font-extrabold text-xs md:text-sm tracking-widest uppercase cursor-pointer hover:underline transition-colors py-1 px-4"
                  >
                    APPLY NOW
                  </button>
                </div>
              </div>
            </div>
          ))}
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
    <div className="py-2 space-y-3">
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
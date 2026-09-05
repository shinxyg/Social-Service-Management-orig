import { useSearchParams } from "react-router-dom"
import ApplyAICS from "./apply-aics"
import AICSServiceWizard, { type AICSServiceType } from "./aics-service-wizard"
import { useLanguage } from "../ui/language-context"

const TYPE_MAP: Record<string, { key: string; reqKey: string }> = {
  medical: { key: "aicsMedical", reqKey: "aicsMedical" },
  funeral: { key: "aicsFuneral", reqKey: "aicsFuneral" },
  educational: { key: "Educational Assistance", reqKey: "aicsEducational" },
  material: { key: "aicsMaterial", reqKey: "aicsMaterial" },
  food: { key: "aicsFood", reqKey: "aicsFood" },
  transportation: { key: "aicsTransportation", reqKey: "aicsTransportation" },
}

export default function AICSUser() {
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()

  const typeParam = searchParams.get("type")?.toLowerCase() || "medical"
  const selectedConfig = TYPE_MAP[typeParam] || TYPE_MAP.medical

  const handleNavigateType = (newType: string) => {
    setSearchParams({ type: newType.toLowerCase() })
  }

  if (typeParam === "material" || typeParam === "food" || typeParam === "transportation") {
    return (
      <div className="py-2">
        <AICSServiceWizard
          key={typeParam}
          serviceType={typeParam as AICSServiceType}
          onBack={() => handleNavigateType("medical")}
        />
      </div>
    )
  }

  return (
    <div className="py-2">
      <ApplyAICS
        key={selectedConfig.reqKey}
        initialType={t(selectedConfig.key)}
        initialTypeKey={selectedConfig.reqKey}
      />
    </div>
  )
}
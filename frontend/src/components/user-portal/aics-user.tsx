import { useState } from "react"
import {
  HeartPulse,
  Flame,
  Truck,
  Package,
  Utensils,
  Banknote,
  ChevronRight,
  ClipboardList,
} from "lucide-react"
import ApplyAICS from "./apply-aics"
import { useLanguage } from "../ui/language-context"

export default function AICSUser() {
  const { t } = useLanguage()
  const [view, setView] = useState<"info" | "apply">("info")

  const ASSIST_ITEMS = [
    { key: "aicsMedical", icon: HeartPulse },
    { key: "aicsFuneral", icon: Flame },
    { key: "aicsTransportation", icon: Truck },
    { key: "aicsMaterial", icon: Package },
    { key: "aicsFood", icon: Utensils },
    { key: "aicsCashRelief", icon: Banknote },
  ] as const

  const [selectedType, setSelectedType] = useState<string>(t(ASSIST_ITEMS[0].key))
  const residentName = "Juan" 

  if (view === "apply") {
    return (
      <div className="p-4 md:p-6">
        <button
          onClick={() => setView("info")}
          className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("back")}
        </button>
        <ApplyAICS initialType={selectedType} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <p className="text-xs text-muted-foreground mb-1">
        {t("aicsWelcome", { name: residentName })}
      </p>

      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-primary mb-6">
        {t("aicsAssistance")}
      </h1>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0 m-0">
        {ASSIST_ITEMS.map(({ key, icon: Icon }) => {
          const label = t(key)
          return (
            <li key={key}>
              <button
                onClick={() => {
                  setSelectedType(label)
                  setView("apply")
                }}
                className="w-full flex items-center gap-3.5 bg-card border border-border rounded-2xl px-4 py-3 shadow-soft transition-all duration-150 hover:-translate-y-0.5 hover:shadow-medium hover:border-primary/35 text-left"
              >
                <div className="h-11 w-11 shrink-0 rounded-full bg-linear-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center">
                  <Icon className="h-5.5 w-5.5 text-white" strokeWidth={2} />
                </div>
                <span className="text-sm font-semibold text-foreground flex-1">{label}</span>
                <ChevronRight className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 bg-muted/50 border border-border rounded-2xl p-5 text-sm text-muted-foreground flex items-start gap-2.5">
        <ClipboardList className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
        {t("aicsFooterNote")}
      </div>
    </div>
  )
}
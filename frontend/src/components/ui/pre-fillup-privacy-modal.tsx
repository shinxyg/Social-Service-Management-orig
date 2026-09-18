import { useState } from "react"
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertCircle, X, ChevronDown, ChevronUp, ArrowRight } from "lucide-react"

interface PreFillupPrivacyModalProps {
  isOpen: boolean
  onAccept: () => void
  onCancel: () => void
  moduleName?: string
}

export function PreFillupPrivacyModal({
  isOpen,
  onAccept,
  onCancel,
  moduleName = "Social Welfare Assistance Program",
}: PreFillupPrivacyModalProps) {
  const [agreed, setAgreed] = useState(false)
  const [showFullPolicy, setShowFullPolicy] = useState(false)
  const [attempted, setAttempted] = useState(false)

  if (!isOpen) return null

  const handleProceed = () => {
    if (!agreed) {
      setAttempted(true)
      return
    }
    onAccept()
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl my-6 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-blue-300 shadow-inner shrink-0">
              <ShieldCheck className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Data Privacy Consent Agreement
                </h3>
                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                  Mandatory Notice
                </span>
              </div>
              <p className="text-[11px] text-blue-200/90 leading-tight">
                Republic Act No. 10173 • Data Privacy Act of 2012
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Cancel & Return"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-200 text-xs sm:text-sm">
              <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Pahintulot sa Pangongolekta ng Impormasyon (Data Collection Notice)</span>
            </div>
            <p className="text-blue-900 dark:text-blue-300 text-xs leading-relaxed font-medium">
              Bago simulan ang pag-fill up ng iyong online application para sa <strong className="text-slate-900 dark:text-white font-bold">{moduleName}</strong>, kinakailangan ang inyong pormal na pahintulot alinsunod sa Data Privacy Act (RA 10173) upang makolekta at maproseso ang inyong personal na impormasyon at mga kalakip na dokumento para sa social welfare evaluation at financial assistance.
            </p>
          </div>

          <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70">
            <p className="font-bold text-slate-900 dark:text-white text-xs">
              Mga Pangunahing Panuntunan sa Proteksyon ng Inyong Datos:
            </p>
            <ul className="space-y-1.5 pl-1 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Eksklusibong Paggamit:</strong> Ang inyong datos ay gagamitin lamang para sa beripikasyon, pag-apruba, at pamamahagi ng tulong mula sa lokal na pamahalaan.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Mataas na Seguridad:</strong> Naka-encrypt (256-bit secure) ang lahat ng impormasyon at tanging mga awtorisadong Social Workers lamang ang may access.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Walang Third-Party Sharing:</strong> Hindi kailanman ibebenta o ibabahagi ang inyong impormasyon sa mga hindi awtorisadong kumpanya o pribadong partido.</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setShowFullPolicy((prev) => !prev)}
            className="inline-flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 hover:underline text-xs cursor-pointer focus:outline-none"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{showFullPolicy ? "Itago ang Buong Detalye ng Polisiya" : "Basahin ang Buong Detalye ng Data Privacy Policy (RA 10173)"}</span>
            {showFullPolicy ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showFullPolicy && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-2 max-h-48 overflow-y-auto leading-relaxed animate-in fade-in">
              <p className="font-bold text-slate-900 dark:text-white">Republika ng Pilipinas • Batas Republika Blg. 10173</p>
              <p>
                Alinsunod sa mga probisyon ng Republic Act No. 10173 (Data Privacy Act of 2012) at Implementing Rules and Regulations (IRR) nito, ang Pamahalaang Lungsod at ang Social Services Development Department (SSDD) ay nakatuon sa paggalang at pagpapanatili ng karapatan sa privacy ng bawat mamamayan.
              </p>
              <p>
                <strong>Mga Karapatan ng Data Subject:</strong> Karapatan mong malaman ang layunin ng pangongolekta, humiling ng kopya o pagwawasto ng iyong datos, at bawiin ang pahintulot alinsunod sa mga alituntunin ng pamahalaan.
              </p>
              <p>
                <strong>Pahintulot sa Pag-upload ng Dokumento:</strong> Ang mga valid ID, certificate of indigency, medical abstract, at birth certificate ay itatago nang ligtas at gagamitin lamang bilang katibayan sa pagkuha ng serbisyo.
              </p>
            </div>
          )}

          <div
            onClick={() => {
              setAgreed(!agreed)
              if (attempted) setAttempted(false)
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
              agreed
                ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500/70 shadow-xs ring-2 ring-emerald-500/20"
                : attempted
                ? "bg-red-50/70 dark:bg-red-950/20 border-red-500 shadow-xs ring-2 ring-red-500/20"
                : "bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 hover:border-blue-400"
            }`}
          >
            <input
              type="checkbox"
              id="prefillup-privacy-checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked)
                if (attempted) setAttempted(false)
              }}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 h-5 w-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 dark:accent-blue-500 shrink-0"
            />
            <label
              htmlFor="prefillup-privacy-checkbox"
              className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 font-semibold leading-snug cursor-pointer select-none"
            >
              Nabasa ko, nauunawaan, at buong-puso akong sumasang-ayon sa <span className="text-blue-600 dark:text-blue-400 font-bold">Data Privacy Policy</span>. Pinapahintulutan ko ang Pamahalaan at GovServe na kolektahin, gamitin, at i-proseso ang aking personal na impormasyon at mga dokumento para sa aking aplikasyon. <span className="text-red-500 font-bold">*</span>
            </label>
          </div>

          {attempted && !agreed && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Kailangan pong lagyan ng tsek (check) ang kahon sa itaas upang makapagpatuloy sa pag-fill up.</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Bumalik / Kanselahin
          </button>

          <button
            type="button"
            onClick={handleProceed}
            disabled={!agreed}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              agreed
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95"
                : "bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none"
            }`}
          >
            <span>Pumapayag at Magpatuloy sa Form</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PreFillupPrivacyModal

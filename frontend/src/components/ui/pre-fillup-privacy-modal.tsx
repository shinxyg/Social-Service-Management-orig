import { useState } from "react"
import { createPortal } from "react-dom"
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, ArrowRight } from "lucide-react"
import { useLanguage } from "./language-context"

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
  const { language } = useLanguage()
  const isEn = language === "en"
  const isBis = language === "bis"

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

  const modalContent = (
    <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
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
                  {isEn ? "Data Privacy Consent Agreement" : isBis ? "Kasabutan sa Pagtugot sa Data Privacy" : "Data Privacy Consent Agreement"}
                </h3>
                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                  {isEn ? "Mandatory Notice" : isBis ? "Importante nga Pahibalo" : "Mahalagang Paunawa"}
                </span>
              </div>
              <p className="text-[11px] text-blue-200/90 leading-tight">
                Republic Act No. 10173 • Data Privacy Act of 2012
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-200 text-xs sm:text-sm">
              <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                {isEn
                  ? "Data Collection & Processing Notice"
                  : isBis
                  ? "Pagtugot sa Pagkolekta sa Impormasyon (Data Collection Notice)"
                  : "Pahintulot sa Pangongolekta ng Impormasyon (Data Collection Notice)"}
              </span>
            </div>
            <p className="text-blue-900 dark:text-blue-300 text-xs leading-relaxed font-medium">
              {isEn ? (
                <>
                  Before accessing and submitting applications for <strong className="text-slate-900 dark:text-white font-bold">{moduleName}</strong>, your formal consent is required under the Data Privacy Act (RA 10173) to collect, process, and verify your personal information and uploaded supporting documents for social welfare assessment and assistance eligibility.
                </>
              ) : isBis ? (
                <>
                  Sa dili pa mopadayon ug mo-apply sa <strong className="text-slate-900 dark:text-white font-bold">{moduleName}</strong>, gikinahanglan ang imong pormal nga pagtugot subay sa Data Privacy Act (RA 10173) aron makolekta ug maproseso ang imong personal nga impormasyon ug mga kalakip nga dokumento para sa social welfare evaluation ug financial assistance.
                </>
              ) : (
                <>
                  Bago magpatuloy at mag-apply sa <strong className="text-slate-900 dark:text-white font-bold">{moduleName}</strong>, kinakailangan ang inyong pormal na pahintulot alinsunod sa Data Privacy Act (RA 10173) upang makolekta at maproseso ang inyong personal na impormasyon at mga kalakip na dokumento para sa social welfare evaluation at financial assistance.
                </>
              )}
            </p>
          </div>

          <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70">
            <p className="font-bold text-slate-900 dark:text-white text-xs">
              {isEn
                ? "Key Data Protection & Privacy Safeguards:"
                : isBis
                ? "Pangunang mga Panalipod sa Inyong Datos:"
                : "Mga Pangunahing Panuntunan sa Proteksyon ng Inyong Datos:"}
            </p>
            <ul className="space-y-1.5 pl-1 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>{isEn ? "Exclusive Welfare Purpose:" : isBis ? "Eksklusibong Paggamit:" : "Eksklusibong Paggamit:"}</strong>{" "}
                  {isEn
                    ? "Your information will be strictly used for identity verification, evaluation, and government assistance distribution."
                    : isBis
                    ? "Ang imong datos gamiton lamang para sa pag-verify, pag-aproba, ug pag-apod-apod sa tabang gikan sa lokal nga kagamhanan."
                    : "Ang inyong datos ay gagamitin lamang para sa beripikasyon, pag-apruba, at pamamahagi ng tulong mula sa lokal na pamahalaan."}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>{isEn ? "High Security Standard:" : isBis ? "Taas nga Seguridad:" : "Mataas na Seguridad:"}</strong>{" "}
                  {isEn
                    ? "All information is protected with industry-standard 256-bit encryption and accessible only by authorized Social Workers."
                    : isBis
                    ? "Naka-encrypt (256-bit secure) ang tanang impormasyon ug ang mga awtorisadong Social Workers lamang ang may access."
                    : "Naka-encrypt (256-bit secure) ang lahat ng impormasyon at tanging mga awtorisadong Social Workers lamang ang may access."}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>{isEn ? "No Third-Party Sharing:" : isBis ? "Walay Third-Party Sharing:" : "Walang Third-Party Sharing:"}</strong>{" "}
                  {isEn
                    ? "We will never sell, lease, or disclose your personal records to unauthorized third parties or commercial entities."
                    : isBis
                    ? "Dili gayod ibaligya o ipaambit ang imong impormasyon sa mga dili awtorisadong kompanya o pribadong partido."
                    : "Hindi kailanman ibebenta o ibabahagi ang inyong impormasyon sa mga hindi awtorisadong kumpanya o pribadong partido."}
                </span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setShowFullPolicy((prev) => !prev)}
            className="inline-flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 hover:underline text-xs cursor-pointer focus:outline-none"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>
              {showFullPolicy
                ? isEn
                  ? "Hide Full Data Privacy Policy"
                  : isBis
                  ? "Itago ang Tibuok Detalye sa Polisiya"
                  : "Itago ang Buong Detalye ng Polisiya"
                : isEn
                ? "Read Full Data Privacy Policy Details (RA 10173)"
                : isBis
                ? "Basaha ang Tibuok Detalye sa Data Privacy Policy (RA 10173)"
                : "Basahin ang Buong Detalye ng Data Privacy Policy (RA 10173)"}
            </span>
            {showFullPolicy ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showFullPolicy && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-2 max-h-48 overflow-y-auto leading-relaxed animate-in fade-in">
              <p className="font-bold text-slate-900 dark:text-white">
                {isEn
                  ? "Republic of the Philippines • Republic Act No. 10173"
                  : "Republika ng Pilipinas • Batas Republika Blg. 10173"}
              </p>
              <p>
                {isEn
                  ? "In accordance with Republic Act No. 10173 (Data Privacy Act of 2012) and its Implementing Rules and Regulations (IRR), the Local Government and the Social Services Development Department (SSDD) are committed to respecting and protecting the privacy rights of all citizens."
                  : isBis
                  ? "Subay sa mga probisyon sa Republic Act No. 10173 (Data Privacy Act of 2012) ug Implementing Rules and Regulations (IRR) niini, ang Kagamhanan sa Dakbayan ug ang Social Services Development Department (SSDD) pasalig nga motahod ug mopabilin sa katungod sa privacy sa matag lungsoranon."
                  : "Alinsunod sa mga probisyon ng Republic Act No. 10173 (Data Privacy Act of 2012) at Implementing Rules and Regulations (IRR) nito, ang Pamahalaang Lungsod at ang Social Services Development Department (SSDD) ay nakatuon sa paggalang at pagpapanatili ng karapatan sa privacy ng bawat mamamayan."}
              </p>
              <p>
                <strong>{isEn ? "Data Subject Rights:" : isBis ? "Mga Katungod sa Data Subject:" : "Mga Karapatan ng Data Subject:"}</strong>{" "}
                {isEn
                  ? "You retain the right to be informed of data collection purposes, request access or corrections to your submitted data, and revoke consent subject to government regulatory guidelines."
                  : isBis
                  ? "Katungod nimo nga mahibal-an ang katuyoan sa pagkolekta, mangayo og kopya o pagtul-id sa imong datos, ug bakwion ang pagtugot subay sa mga lagda sa kagamhanan."
                  : "Karapatan mong malaman ang layunin ng pangongolekta, humiling ng kopya o pagwawasto ng iyong datos, at bawiin ang pahintulot alinsunod sa mga alituntunin ng pamahalaan."}
              </p>
              <p>
                <strong>{isEn ? "Document Upload Consent:" : isBis ? "Pagtugot sa Pag-upload og Dokumento:" : "Pahintulot sa Pag-upload ng Dokumento:"}</strong>{" "}
                {isEn
                  ? "All uploaded valid IDs, certificates of indigency, medical abstracts, and civil registry certificates will be kept secure and used exclusively as documentary proof for this welfare application."
                  : isBis
                  ? "Ang mga balidong ID, certificate of indigency, medical abstract, ug birth certificate itago nga luwas ug gamiton lamang isip ebidensya sa pagkuha og serbisyo."
                  : "Ang mga valid ID, certificate of indigency, medical abstract, at birth certificate ay itatago nang ligtas at gagamitin lamang bilang katibayan sa pagkuha ng serbisyo."}
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
              {isEn ? (
                <>
                  I have read, understood, and agree to the <span className="text-blue-600 dark:text-blue-400 font-bold">Data Privacy Policy</span>. I hereby authorize the Local Government and GovServe to collect, verify, store, and process my personal data and uploaded documents for this application. <span className="text-red-500 font-bold">*</span>
                </>
              ) : isBis ? (
                <>
                  Nabasa nako, nasabtan, ug kinasingkasing kong miuyon sa <span className="text-blue-600 dark:text-blue-400 font-bold">Data Privacy Policy</span>. Gitugotan nako ang Kagamhanan ug GovServe sa pagkolekta, paggamit, ug pagproseso sa akong personal nga impormasyon ug mga dokumento alang sa akong aplikasyon. <span className="text-red-500 font-bold">*</span>
                </>
              ) : (
                <>
                  Nabasa ko, nauunawaan, at buong-puso akong sumasang-ayon sa <span className="text-blue-600 dark:text-blue-400 font-bold">Data Privacy Policy</span>. Pinapahintulutan ko ang Pamahalaan at GovServe na kolektahin, gamitin, at i-proseso ang aking personal na impormasyon at mga dokumento para sa aking aplikasyon. <span className="text-red-500 font-bold">*</span>
                </>
              )}
            </label>
          </div>

          {attempted && !agreed && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {isEn
                  ? "Please check the consent box above to proceed with the application form."
                  : isBis
                  ? "Palihog og tsek (check) sa kahon sa ibabaw aron makapadayon sa pag-fill up."
                  : "Kailangan pong lagyan ng tsek (check) ang kahon sa itaas upang makapagpatuloy sa pag-fill up."}
              </span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {isEn ? "Back" : isBis ? "Balik" : "Bumalik"}
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
            <span>{isEn ? "Agree & Proceed" : isBis ? "Uyon ug Padayon" : "Pumapayag at Magpatuloy"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body)
  }
  return modalContent
}

export default PreFillupPrivacyModal

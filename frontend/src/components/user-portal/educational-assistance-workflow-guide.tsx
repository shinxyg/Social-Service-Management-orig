import React, { useState } from "react"
import {
  FileText,
  Search,
  Calendar,
  Users,
  CheckCircle2,
  Building,
  DollarSign,
  Send,
  XCircle,
  ArrowDown,
  Info,
  Smartphone,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react"

interface WorkflowGuideProps {
  language?: "en" | "tl"
  isModal?: boolean
  onClose?: () => void
}

export const EducationalAssistanceWorkflowGuide: React.FC<WorkflowGuideProps> = ({
  language = "tl",
  isModal = false,
  onClose,
}) => {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  const content = (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0f2744] text-white p-5 rounded-2xl shadow-lg border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Official Workflow
            </span>
            <span className="text-xs text-sky-200 font-medium">SSDD Educational Grant Lifecycle</span>
          </div>
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight">
            Educational Assistance for Indigent Children & Youth — Application Process
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Kumpletong visual guide mula sa pagsusumite ng aplikasyon, SSDD verification, intake assessment, final approval, hanggang sa payout distribution.
          </p>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="self-end md:self-auto p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
            title="Close workflow guide"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Stepper Container */}
      <div className="relative pl-3 md:pl-6 space-y-8 before:absolute before:left-[19px] md:before:left-[31px] before:top-8 before:bottom-8 before:w-1 before:bg-gradient-to-b before:from-blue-500 before:via-emerald-500 before:to-purple-600">

        {/* ================= STEP 1 ================= */}
        <div className="relative pl-10 md:pl-14 group">
          <div className="absolute left-0 top-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 text-white font-extrabold text-sm md:text-base flex items-center justify-center shadow-md ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
            1
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Send className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white">
                  [ 1. PINASA ANG FORM ➔ POP-UP SUCCESS ]
                </h3>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                APPLICATION SUBMITTED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                  <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                  <span>📱 Form Screen:</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Pinindot ang <span className="font-bold text-blue-700 dark:text-blue-300">[ SUBMIT APPLICATION ]</span> ➔ Lumabas ang Success Modal with Reference No: <code className="bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded font-mono font-bold text-blue-600 dark:text-blue-300">CW-EDU-2026-7891</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>👥 Admin Action:</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Pumasok ang bagong record sa Database table (<code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">solo_parent_child_welfare_applications</code>).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Realtime Triggers:</span>
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px]">child_welfare_applications_updated</code>,
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px]">sync_apps</code>
            </div>
          </div>
        </div>

        {/* Connector Arrow */}
        <div className="flex justify-center -my-4">
          <ArrowDown className="w-5 h-5 text-blue-500 animate-bounce" />
        </div>

        {/* ================= STEP 2 ================= */}
        <div className="relative pl-10 md:pl-14 group">
          <div className="absolute left-0 top-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-500 text-white font-extrabold text-sm md:text-base flex items-center justify-center shadow-md ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
            2
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-amber-200/80 dark:border-amber-900/60 shadow-md hover:shadow-lg transition-all space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Search className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white">
                  [ 2. STATUS AY "SSDD VALIDATION" (Document Checking) ]
                </h3>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                🟡 SSDD VALIDATION
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl space-y-1.5 border border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">📄 My Applications:</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                    SSDD VALIDATION
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 italic">
                  "Sinusuri ng Social Worker ang Enrollment Cert, Report Card, at Indigency."
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  💳 Financial Aid: <span className="font-semibold text-slate-400 dark:text-slate-500">(Wala pa / Inactive — ₱0.00)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>👥 Admin (Child Desk):</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Binuksan ang <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">/child-welfare</code> ➔ Sinuri ang mga dokumento at school records ➔ Pinindot ang <span className="font-bold text-emerald-600 dark:text-emerald-400">[ ✅ Validate & Schedule Intake Assessment ]</span>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Realtime Trigger:</span>
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px]">appointments_updated</code>
            </div>
          </div>
        </div>

        {/* Connector Arrow */}
        <div className="flex justify-center -my-4">
          <ArrowDown className="w-5 h-5 text-amber-500 animate-bounce" />
        </div>

        {/* ================= STEP 3 ================= */}
        <div className="relative pl-10 md:pl-14 group">
          <div className="absolute left-0 top-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-sky-600 text-white font-extrabold text-sm md:text-base flex items-center justify-center shadow-md ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
            3
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-200 dark:border-sky-900/60 shadow-md hover:shadow-lg transition-all space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white">
                  [ 3. DUMATING ANG SCHEDULE: STATUS AY "INTERVIEW & ASSESSMENT" ]
                </h3>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 border border-sky-300 dark:border-sky-800">
                🔵 INTERVIEW & ASSESSMENT SCHEDULED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-sky-500" />
                  <span>📅 Admin (Appts):</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Sa <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">/appointments</code>, itinakda ang Date (Oct 5), Time (9:00 AM), Venue: SSDD Child Protection & Counseling Center (Room 205). Pinindot ang <span className="font-bold text-sky-700 dark:text-sky-300">[ Save Assessment Schedule & Notify ]</span>.
                </p>
              </div>

              <div className="p-3 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl space-y-2 border border-sky-200/60 dark:border-sky-900/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">📄 My Applications:</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 font-semibold">
                  "October 5, 2026 @ 9:00 AM sa SSDD Child Protection Center Room 205."
                </p>
                <div className="inline-block px-2.5 py-1 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-lg text-sky-700 dark:text-sky-300 font-bold text-[11px] shadow-xs">
                  📥 I-download ang Intake Slip
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  📲 SMS / Notice: Nakatanggap ang Magulang ng SMS notice sa mobile number.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Realtime Triggers:</span>
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px]">appointments_updated</code>,
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px]">notifications_updated</code>
            </div>
          </div>
        </div>

        {/* Connector Arrow */}
        <div className="flex justify-center -my-4">
          <ArrowDown className="w-5 h-5 text-sky-500 animate-bounce" />
        </div>

        {/* ================= STEP 4 (BRANCH DECISION NODE) ================= */}
        <div className="relative pl-10 md:pl-14 group">
          <div className="absolute left-0 top-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-600 text-white font-extrabold text-sm md:text-base flex items-center justify-center shadow-md ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
            4
          </div>
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-purple-500/50 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Users className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-sm md:text-base text-white">
                  [ 4. INTAKE INTERVIEW & ASSESSMENT ➔ DIRETSANG DESISYON ]
                </h3>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-900/80 text-purple-200 border border-purple-700">
                🏛️ PHYSICAL ASSESSMENT & SCSR EVALUATION
              </span>
            </div>

            <div className="p-3 bg-slate-800/70 rounded-xl space-y-1 text-xs border border-slate-700/60">
              <div className="font-bold text-sky-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>Physical Venue:</span>
              </div>
              <p className="text-slate-300">
                Personal na humarap ang Magulang/Guardian at ang Bata sa Social Worker para sa <span className="font-bold text-amber-300">Social Case Study Report (SCSR)</span> at Intake Assessment.
              </p>
            </div>

            {/* BRANCHING DECISION BOX */}
            <div className="pt-2 space-y-3">
              <div className="text-center font-black text-xs uppercase tracking-widest text-purple-300 bg-purple-950/60 py-1.5 rounded-lg border border-purple-800/50">
                ⚡ DECISION BRANCHING (DESISYON NG SOCIAL WORKER)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BRANCH A: REJECTED */}
                <div className="bg-rose-950/40 border-2 border-rose-700/60 rounded-xl p-4 space-y-2 hover:bg-rose-950/60 transition-colors">
                  <div className="flex items-center justify-between border-b border-rose-800/50 pb-2">
                    <span className="font-extrabold text-xs text-rose-300 uppercase">
                      【 KUNG DISQUALIFIED / REJECTED 】
                    </span>
                    <XCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <ul className="text-[11px] text-rose-200 space-y-1.5 leading-relaxed">
                    <li>📅 <strong>Admin:</strong> Pinindot ang <span className="bg-rose-900 px-1.5 py-0.5 rounded text-rose-100 font-bold">[ ❌ Disqualify ]</span>.</li>
                    <li>📄 <strong>My Applications:</strong> Status: <span className="text-rose-400 font-black">🔴 REJECTED</span> <em>(Dahilan: Exceeded Income / Non-resident)</em>.</li>
                    <li>💳 <strong>Financial Aid:</strong> Permanently Inactive (₱0.00).</li>
                    <li>📲 <strong>SMS Notice:</strong> "Disapproved ang aplikasyon..."</li>
                  </ul>
                  <div className="pt-2 text-center text-xs font-black text-rose-400 uppercase tracking-wider border-t border-rose-900/60">
                    🛑 [ TAPOS ANG PROSESO ]
                  </div>
                </div>

                {/* BRANCH B: RECOMMEND */}
                <div className="bg-emerald-950/40 border-2 border-emerald-600/60 rounded-xl p-4 space-y-2 hover:bg-emerald-950/60 transition-colors">
                  <div className="flex items-center justify-between border-b border-emerald-800/50 pb-2">
                    <span className="font-extrabold text-xs text-emerald-300 uppercase">
                      【 KUNG NA-RECOMMEND FOR APPROVAL 】
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <ul className="text-[11px] text-emerald-200 space-y-1.5 leading-relaxed">
                    <li>📅 <strong>Admin:</strong> Pinindot ang <span className="bg-emerald-900 px-1.5 py-0.5 rounded text-emerald-100 font-bold">[ 🟢 Recommend ]</span>.</li>
                    <li>📄 <strong>My Applications:</strong> Status: <span className="text-sky-300 font-black">🔵 FOR APPROVAL</span> <em>"Endorsed para sa Final Approval."</em></li>
                    <li>⚡ <strong>Realtime:</strong> <code className="bg-emerald-950 px-1 rounded font-mono text-[10px]">child_welfare_updated</code></li>
                  </ul>
                  <div className="pt-2 text-center text-xs font-black text-emerald-400 uppercase tracking-wider border-t border-emerald-900/60 flex items-center justify-center gap-1">
                    <span>➡️ ITULOY SA STEP 5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Connector Arrow */}
        <div className="flex justify-center -my-4">
          <ArrowDown className="w-5 h-5 text-emerald-500 animate-bounce" />
        </div>

        {/* ================= STEP 5 ================= */}
        <div className="relative pl-10 md:pl-14 group">
          <div className="absolute left-0 top-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm md:text-base flex items-center justify-center shadow-md ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
            5
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-300 dark:border-emerald-800/60 shadow-md hover:shadow-lg transition-all space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white">
                  [ 5. STATUS AY "QUALIFIED / APPROVED" ]
                </h3>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                🟢 QUALIFIED / APPROVED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>📄 Admin (Supervisor):</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Sinuri ang SCSR at pinindot ang <span className="font-bold text-emerald-600 dark:text-emerald-400">[ 🟢 Final Approve Grant ]</span>.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl space-y-1.5 border border-emerald-200/60 dark:border-emerald-900/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">📄 My Applications:</span>
                  <span className="font-black text-emerald-700 dark:text-emerald-300">QUALIFIED / APPROVED</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 font-medium">
                  "Inaprubahan ang Educational Grant (<span className="font-bold text-emerald-600 dark:text-emerald-400">₱3,000.00 Financial Assistance</span>)."
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  💳 Financial Aid: Pumasok sa <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px]">/financial-aid</code> bilang "Approved - Pending Distribution" (₱3,000.00).
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Realtime Triggers:</span>
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px]">financial_disbursements_updated</code>,
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px]">sync_apps</code>
            </div>
          </div>
        </div>

        {/* Connector Arrow */}
        <div className="flex justify-center -my-4">
          <ArrowDown className="w-5 h-5 text-purple-500 animate-bounce" />
        </div>

        {/* ================= STEP 6 ================= */}
        <div className="relative pl-10 md:pl-14 group">
          <div className="absolute left-0 top-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-600 text-white font-extrabold text-sm md:text-base flex items-center justify-center shadow-md ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
            6
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-purple-300 dark:border-purple-800/60 shadow-md hover:shadow-lg transition-all space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <DollarSign className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white">
                  [ 6. STATUS: "FOR DISTRIBUTION" (Payout Schedule Set) ]
                </h3>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800">
                🟣 FOR DISTRIBUTION (Payout Scheduled)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                  <DollarSign className="w-3.5 h-3.5 text-purple-500" />
                  <span>💳 Admin (Financial):</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Sa <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">/financial-aid</code>, lumabas sa listahan ng Educational Aid. Itinakda ang Date (Oct 20), Time (9:00 AM - 3:00 PM), QC Hall Amphitheater. Pinindot ang <span className="font-bold text-purple-700 dark:text-purple-300">[ 🚀 Save & Send Payout Notice ]</span>.
                </p>
              </div>

              <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl space-y-2 border border-purple-200/60 dark:border-purple-900/40">
                <div className="font-bold text-purple-950 dark:text-purple-200">
                  💳 Financial Aid Status: <span className="text-purple-700 dark:text-purple-300 font-extrabold">FOR DISTRIBUTION</span>
                </div>
                <ul className="text-slate-700 dark:text-slate-300 space-y-1 text-[11px]">
                  <li>• <strong>Matatanggap:</strong> <span className="text-emerald-600 dark:text-emerald-400 font-bold">₱3,000.00 Educational Cash Aid</span></li>
                  <li>• <strong>Petsa:</strong> Oktubre 20, 2026 (9:00 AM - 3:00 PM)</li>
                  <li>• <strong>Lugar:</strong> Quezon City Hall Main Amphitheater / SSDD Center</li>
                  <li>• <strong>Dadalhin:</strong> School Enrollment Cert, Student ID, Parent's QCID, Ballpen.</li>
                </ul>
                <div className="text-[11px] text-purple-900 dark:text-purple-200 font-semibold pt-1 border-t border-purple-100 dark:border-purple-900/50">
                  📄 <strong>My Applications:</strong> May banner notice: <em>"Educational Payout Scheduled sa QC Hall sa Oktubre 20!"</em>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  📲 <strong>SMS / Notification:</strong> Nakatanggap ang Magulang ng SMS confirmation ng Payout Date at Venue.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Realtime Trigger:</span>
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px]">financial_disbursements_updated</code>
            </div>
          </div>
        </div>

        {/* Connector Arrow */}
        <div className="flex justify-center -my-4">
          <ArrowDown className="w-5 h-5 text-purple-600 animate-bounce" />
        </div>

        {/* ================= STEP 7 ================= */}
        <div className="relative pl-10 md:pl-14 group">
          <div className="absolute left-0 top-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-700 text-white font-extrabold text-sm md:text-base flex items-center justify-center shadow-md ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
            7
          </div>
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-5 border border-emerald-500/60 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Building className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-sm md:text-base text-white">
                  [ 7. ON-SITE CLAIMING (ASSISTANCE RECEIVED) ]
                </h3>
              </div>
              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-500 text-slate-950 uppercase tracking-wide shadow-md">
                🟣 ASSISTANCE RECEIVED / COMPLETED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
              <div className="p-3 bg-emerald-950/60 rounded-xl space-y-1.5 border border-emerald-800/60">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <Building className="w-3.5 h-3.5" />
                  <span>🏛️ Physical Venue:</span>
                </div>
                <p className="text-emerald-100">
                  Pumunta ang Magulang at Mag-aaral sa Quezon City Hall noong Oktubre 20. Ipinakita ang Student ID / QCID at pumirma sa official Payroll Masterlist. Inabot ng Cashier ang <span className="font-black text-amber-300 text-sm">₱3,000.00 Cash Assistance</span>.
                </p>
              </div>

              <div className="p-3 bg-slate-800/70 rounded-xl space-y-1.5 border border-slate-700/60">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>💳 Admin & Reports Action:</span>
                </div>
                <p className="text-slate-200">
                  Pinindot sa tabi ng pangalan ang <span className="font-bold text-emerald-400">[ ✔ Mark as Released ]</span>.
                </p>
                <p className="text-slate-300 text-[11px]">
                  📊 Reports: Awtomatikong nadagdagan ng <strong className="text-emerald-400">+₱3,000</strong> ang <em>"Total Educational Aid Disbursed"</em> counter!
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-800/60 text-[11px] text-emerald-200/90 font-medium">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Realtime Triggers:</span>
                <code className="bg-emerald-950 px-1.5 py-0.5 rounded font-mono text-[10px] text-emerald-300">financial_disbursements_updated</code>,
                <code className="bg-emerald-950 px-1.5 py-0.5 rounded font-mono text-[10px] text-emerald-300">reports_updated</code>
              </div>
              <span className="font-extrabold text-amber-400 uppercase tracking-widest text-[10px]">
                🎉 PROCESS COMPLETED
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
          {content}
        </div>
      </div>
    )
  }

  return content
}

export default EducationalAssistanceWorkflowGuide

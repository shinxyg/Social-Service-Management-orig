import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  ShieldAlert,
  Users,
  Baby,
  HeartHandshake,
  GraduationCap,
  Wallet,
  FileText,
  Search,
  ArrowRight,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  Home,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Briefcase,
  Layers,
} from "lucide-react"
import { useLanguage } from "../ui/language-context"
import { getCurrentUserProfile } from "../../utils/userProfile"
import { API_BASE } from "../../config/api"

interface DashboardModule {
  id: string
  title: string
  tagline: string
  description: string
  badge: string
  category: "crisis" | "pwd" | "senior" | "solo-parent" | "child" | "livelihood" | "finance" | "tracker"
  icon: any
  primaryUrl: string
  primaryActionLabel: string
  theme: {
    bg: string
    border: string
    hoverBorder: string
    iconBg: string
    iconColor: string
    badgeBg: string
    badgeText: string
    accentBtn: string
  }
  quickLinks: {
    label: string
    url: string
    badge?: string
  }[]
}

const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: "aics",
    title: "AICS Crisis Assistance",
    tagline: "Pang-emerhensiyang tulong pinansyal at materyal",
    description: "Tulong para sa mga pamilya at indibidwal na nahaharap sa biglaang krisis, pagkakasakit, o sakuna.",
    badge: "Emergency Welfare",
    category: "crisis",
    icon: ShieldAlert,
    primaryUrl: "/portal/aics",
    primaryActionLabel: "Mag-apply sa AICS",
    theme: {
      bg: "bg-purple-50/50 dark:bg-purple-950/20",
      border: "border-purple-200 dark:border-purple-900/50",
      hoverBorder: "hover:border-purple-400 dark:hover:border-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      iconColor: "text-purple-600 dark:text-purple-400",
      badgeBg: "bg-purple-100 dark:bg-purple-900/60",
      badgeText: "text-purple-700 dark:text-purple-300",
      accentBtn: "bg-purple-600 hover:bg-purple-700 text-white",
    },
    quickLinks: [
      { label: "🏥 Medical / Hospital", url: "/portal/aics?type=medical" },
      { label: "⚰️ Funeral / Burial", url: "/portal/aics?type=funeral" },
      { label: "📚 Educational Crisis", url: "/portal/aics?type=educational" },
      { label: "📦 Food Assistance", url: "/portal/aics?type=food" },
      { label: "🚌 Transportation", url: "/portal/aics?type=transportation" },
      { label: "🏠 Material Aid", url: "/portal/aics?type=material" },
    ],
  },
  {
    id: "pwd",
    title: "PWD Services",
    tagline: "Persons with Disability ID at Social Assistance",
    description: "Pagkuha, renewal, at replacement ng opisyal na PWD ID card kasama ang mandatory 20% discount at mga benepisyo.",
    badge: "RA 7277 / RA 10754",
    category: "pwd",
    icon: Users,
    primaryUrl: "/portal/apply-pwd-senior?category=pwd&type=new",
    primaryActionLabel: "Buksan ang PWD Services",
    theme: {
      bg: "bg-blue-50/50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-900/50",
      hoverBorder: "hover:border-blue-400 dark:hover:border-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
      badgeBg: "bg-blue-100 dark:bg-blue-900/60",
      badgeText: "text-blue-700 dark:text-blue-300",
      accentBtn: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    quickLinks: [
      { label: "Bagong PWD ID", url: "/portal/apply-pwd-senior?category=pwd&type=new", badge: "New" },
      { label: "Renewal ng PWD ID", url: "/portal/apply-pwd-senior?category=pwd&type=renewal" },
      { label: "Replacement / Lost ID", url: "/portal/apply-pwd-senior?category=pwd&type=loss" },
      { label: "PWD Social Assistance", url: "/portal/apply-pwd-senior?category=pwd&type=assistance" },
    ],
  },
  {
    id: "senior",
    title: "Senior Citizen Welfare",
    tagline: "Para sa mga 60 taong gulang pataas",
    description: "Senior Citizen ID card, Medicine Purchase Booklet, Movie Pass Booklet, at Local Social Pension para sa mga nakatatanda.",
    badge: "Elderly Care",
    category: "senior",
    icon: Home,
    primaryUrl: "/portal/apply-pwd-senior?category=senior&type=new",
    primaryActionLabel: "Buksan ang Senior Services",
    theme: {
      bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
      border: "border-emerald-200 dark:border-emerald-900/50",
      hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-600",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      badgeBg: "bg-emerald-100 dark:bg-emerald-900/60",
      badgeText: "text-emerald-700 dark:text-emerald-300",
      accentBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    quickLinks: [
      { label: "Bagong Senior ID", url: "/portal/apply-pwd-senior?category=senior&type=new", badge: "New" },
      { label: "Renewal ng ID", url: "/portal/apply-pwd-senior?category=senior&type=renewal" },
      { label: "Replacement / Lost ID", url: "/portal/apply-pwd-senior?category=senior&type=loss" },
      { label: "💊 Medicine Booklet", url: "/portal/apply-pwd-senior?category=senior&type=medicine-booklet" },
      { label: "🎬 Movie Booklet", url: "/portal/apply-pwd-senior?category=senior&type=movie-booklet" },
      { label: "Social Pension", url: "/portal/apply-pwd-senior?category=senior&type=social-assistance" },
    ],
  },
  {
    id: "solo-parent",
    title: "Solo Parent Welfare",
    tagline: "Benepisyo alinsunod sa RA 8972 & RA 11861",
    description: "Opisyal na Solo Parent ID, buwanang P1,000 cash subsidy (minimum wage), diskwento sa gatas at pagkain, at 7-day parental leave.",
    badge: "RA 11861 Expanded",
    category: "solo-parent",
    icon: Baby,
    primaryUrl: "/portal/apply-solo-parent?category=solo-parent&type=new",
    primaryActionLabel: "Mag-apply bilang Solo Parent",
    theme: {
      bg: "bg-rose-50/50 dark:bg-rose-950/20",
      border: "border-rose-200 dark:border-rose-900/50",
      hoverBorder: "hover:border-rose-400 dark:hover:border-rose-600",
      iconBg: "bg-rose-100 dark:bg-rose-900/50",
      iconColor: "text-rose-600 dark:text-rose-400",
      badgeBg: "bg-rose-100 dark:bg-rose-900/60",
      badgeText: "text-rose-700 dark:text-rose-300",
      accentBtn: "bg-rose-600 hover:bg-rose-700 text-white",
    },
    quickLinks: [
      { label: "Bagong Solo Parent ID", url: "/portal/apply-solo-parent?category=solo-parent&type=new", badge: "New" },
      { label: "Renewal ng ID", url: "/portal/apply-solo-parent?category=solo-parent&type=renewal" },
      { label: "Replacement / Lost ID", url: "/portal/apply-solo-parent?category=solo-parent&type=loss" },
    ],
  },
  {
    id: "child-welfare",
    title: "Child Welfare & Protection",
    tagline: "Proteksyon, nutrisyon, at kalinga sa kabataan",
    description: "Anim na komprehensibong programa para sa nutrisyon ng bata, legal protection, temporary foster shelter, at psychosocial support.",
    badge: "6 Programs",
    category: "child",
    icon: HeartHandshake,
    primaryUrl: "/portal/apply-solo-parent?category=child-welfare&program=nutritional-assistance",
    primaryActionLabel: "Tingnan ang Child Welfare",
    theme: {
      bg: "bg-teal-50/50 dark:bg-teal-950/20",
      border: "border-teal-200 dark:border-teal-900/50",
      hoverBorder: "hover:border-teal-400 dark:hover:border-teal-600",
      iconBg: "bg-teal-100 dark:bg-teal-900/50",
      iconColor: "text-teal-600 dark:text-teal-400",
      badgeBg: "bg-teal-100 dark:bg-teal-900/60",
      badgeText: "text-teal-700 dark:text-teal-300",
      accentBtn: "bg-teal-600 hover:bg-teal-700 text-white",
    },
    quickLinks: [
      { label: "🥦 Nutritional Feeding", url: "/portal/apply-solo-parent?category=child-welfare&program=nutritional-assistance" },
      { label: "⚖️ Child Protection", url: "/portal/apply-solo-parent?category=child-welfare&program=child-protection" },
      { label: "🚨 Emergency Relief", url: "/portal/apply-solo-parent?category=child-welfare&program=emergency-assistance" },
      { label: "🧠 Psychosocial Support", url: "/portal/apply-solo-parent?category=child-welfare&program=psychosocial-support" },
      { label: "🏠 Temporary Shelter", url: "/portal/apply-solo-parent?category=child-welfare&program=temporary-shelter" },
      { label: "👨‍👩‍👧 Parenting Support", url: "/portal/apply-solo-parent?category=child-welfare&program=family-parenting-support" },
    ],
  },
  {
    id: "livelihood-training",
    title: "Livelihood & Skills Training",
    tagline: "Puhunan at libreng bokasyonal na kasanayan",
    description: "Micro-enterprise seed capital grants at libreng 4-araw na TESDA-aligned training courses para sa sariling negosyo at trabaho.",
    badge: "Pangkabuhayan",
    category: "livelihood",
    icon: GraduationCap,
    primaryUrl: "/portal/apply-livelihood",
    primaryActionLabel: "Pumasok sa Pangkabuhayan",
    theme: {
      bg: "bg-amber-50/50 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-900/50",
      hoverBorder: "hover:border-amber-400 dark:hover:border-amber-600",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      badgeBg: "bg-amber-100 dark:bg-amber-900/60",
      badgeText: "text-amber-700 dark:text-amber-300",
      accentBtn: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    quickLinks: [
      { label: "💼 Negosyo Puhunan / Capital", url: "/portal/apply-livelihood?category=livelihood" },
      { label: "🍞 Bread & Pastry Course", url: "/portal/apply-livelihood?category=training" },
      { label: "✂️ Dressmaking / Tailoring", url: "/portal/apply-livelihood?category=training" },
      { label: "💇 Beauty Care & Wellness", url: "/portal/apply-livelihood?category=training" },
      { label: "⚡ Electrical Installation", url: "/portal/apply-livelihood?category=training" },
    ],
  },
  {
    id: "financial-aid",
    title: "Financial Aid Disbursement",
    tagline: "Digital Payout & Ayuda Release Tracker",
    description: "Suriin ang inyong payroll status, GCash / Maya payout reference, Landbank credit, o iskedyul ng on-site cash voucher claim.",
    badge: "E-Payout Hub",
    category: "finance",
    icon: Wallet,
    primaryUrl: "/portal/financial-aid",
    primaryActionLabel: "Tingnan ang Ayuda Payout",
    theme: {
      bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
      border: "border-indigo-200 dark:border-indigo-900/50",
      hoverBorder: "hover:border-indigo-400 dark:hover:border-indigo-600",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      badgeBg: "bg-indigo-100 dark:bg-indigo-900/60",
      badgeText: "text-indigo-700 dark:text-indigo-300",
      accentBtn: "bg-indigo-600 hover:bg-indigo-700 text-white",
    },
    quickLinks: [
      { label: "Tingnan ang Payout Schedule", url: "/portal/financial-aid" },
      { label: "Claim Status Verification", url: "/portal/financial-aid" },
      { label: "E-Wallet Payout Details", url: "/portal/financial-aid" },
    ],
  },
  {
    id: "my-applications",
    title: "My Applications Tracker",
    tagline: "Subaybayan ang lahat ng inyong isinumiteng request",
    description: "Isahang dashboard para makita ang real-time stage ng inyong AICS, PWD, Senior, Solo Parent, Livelihood, at Training records.",
    badge: "Real-Time Tracking",
    category: "tracker",
    icon: FileText,
    primaryUrl: "/portal/my-applications",
    primaryActionLabel: "Buksan ang Application Tracker",
    theme: {
      bg: "bg-sky-50/50 dark:bg-sky-950/20",
      border: "border-sky-200 dark:border-sky-900/50",
      hoverBorder: "hover:border-sky-400 dark:hover:border-sky-600",
      iconBg: "bg-sky-100 dark:bg-sky-900/50",
      iconColor: "text-sky-600 dark:text-sky-400",
      badgeBg: "bg-sky-100 dark:bg-sky-900/60",
      badgeText: "text-sky-700 dark:text-sky-300",
      accentBtn: "bg-sky-600 hover:bg-sky-700 text-white",
    },
    quickLinks: [
      { label: "Lahat ng Application", url: "/portal/my-applications" },
      { label: "Naka-pending na Pagsusuri", url: "/portal/my-applications" },
      { label: "Naaprubahang Dokumento", url: "/portal/my-applications" },
    ],
  },
]

export default function UserDashboard() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const profile = getCurrentUserProfile()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [recentApplications, setRecentApplications] = useState<any[]>([])

  // Load user's recent applications for quick glance
  useEffect(() => {
    try {
      const pwdSenior = JSON.parse(localStorage.getItem("pwd_senior_applications") || "[]")
      const aics = JSON.parse(localStorage.getItem("aics_applications") || "[]")
      const all = [...pwdSenior, ...aics].slice(0, 3)
      setRecentApplications(all)
    } catch {
      setRecentApplications([])
    }
  }, [])

  const filteredModules = useMemo(() => {
    return DASHBOARD_MODULES.filter((m) => {
      const matchesCat = selectedCategory === "all" || m.category === selectedCategory
      const matchesSearch =
        searchQuery === "" ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.quickLinks.some((q) => q.label.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCat && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  const fullName = `${profile.firstName || "Clarisa Mae"} ${profile.lastName || "Dimal"}`
  const userQcid = profile.qcidNo || "110000116932100"
  const userBarangay = profile.barangay || "Sauyo"

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Welcome Citizen Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-600/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Opisyal na Citizen Portal • Lungsod Quezon</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
              Magandang araw, {fullName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal">
              Pumili ng serbisyo sa ibaba upang makapag-apply, mag-renew, o mag-subaybay nang direkta nang hindi na kailangang mag-navigate sa sidebar.
            </p>

            {/* Profile Meta Chips */}
            <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
              <span className="px-3 py-1 rounded-xl bg-white/20 font-mono font-bold tracking-wider">
                QCID: {userQcid}
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Verified Resident
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 text-blue-100">
                Brgy. {userBarangay}, Quezon City
              </span>
            </div>
          </div>

          {/* Quick Action Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shrink-0 flex flex-col gap-2.5 sm:min-w-[220px]">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
              Mabilisang Aksyon
            </span>
            <button
              type="button"
              onClick={() => navigate("/portal/apply-pwd-senior?category=pwd&type=new")}
              className="w-full text-left px-3 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-between"
            >
              <span>Mag-apply ng PWD ID</span>
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/portal/aics?type=medical")}
              className="w-full text-left px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-between"
            >
              <span>AICS Medical Aid</span>
              <ChevronRight className="w-4 h-4 text-blue-200" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/portal/my-applications")}
              className="w-full text-left px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-between"
            >
              <span>Tingnan ang Aplikasyon</span>
              <ChevronRight className="w-4 h-4 text-blue-200" />
            </button>
          </div>
        </div>

        {/* Decorative Graphic */}
        <div className="absolute right-0 -bottom-16 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Quick Search & Category Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Live Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Maghanap ng tulong, ID, o serbisyo (hal. PWD, Funeral, Solo Parent, Negosyo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap self-start md:self-auto text-xs">
          {[
            { id: "all", label: "Lahat ng Modyul" },
            { id: "crisis", label: "AICS" },
            { id: "pwd", label: "PWD" },
            { id: "senior", label: "Senior" },
            { id: "solo-parent", label: "Solo Parent" },
            { id: "child", label: "Child Welfare" },
            { id: "livelihood", label: "Negosyo & Training" },
            { id: "finance", label: "Disbursement" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Services Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModules.map((mod) => {
          const Icon = mod.icon
          const t = mod.theme

          return (
            <div
              key={mod.id}
              className={`rounded-3xl border ${t.border} ${t.bg} ${t.hoverBorder} p-6 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all duration-200`}
            >
              <div>
                {/* Card Top: Icon & Badge */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${t.iconBg} ${t.iconColor} flex items-center justify-center shadow-xs`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${t.badgeBg} ${t.badgeText} border border-black/5 dark:border-white/5`}>
                    {mod.badge}
                  </span>
                </div>

                {/* Title & Tagline */}
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  {mod.title}
                </h3>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  {mod.tagline}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {mod.description}
                </p>

                {/* Direct Sub-Service Links (Click directly to go to each specific feature) */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Direktang Pagpipilian (Quick Jump):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.quickLinks.map((link, lIdx) => (
                      <button
                        key={lIdx}
                        type="button"
                        onClick={() => navigate(link.url)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer shadow-xs"
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 text-blue-700 font-bold">
                            {link.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => navigate(mod.primaryUrl)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold ${t.accentBtn} flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer`}
                >
                  <span>{mod.primaryActionLabel}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
            Walang nahanap na serbisyo para sa "{searchQuery}".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("")
              setSelectedCategory("all")
            }}
            className="mt-3 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Ibalik sa lahat ng modyul
          </button>
        </div>
      )}

      {/* Bottom Row: Recent Application Status Glance & Support */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Applications Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Kasalukuyang Aplikasyon (Quick Glance)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => navigate("/portal/my-applications")}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Tingnan Lahat</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {recentApplications.length > 0 ? (
            <div className="space-y-2.5">
              {recentApplications.map((app, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate("/portal/my-applications")}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-3 hover:border-blue-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      {app.category ? app.category.slice(0, 3).toUpperCase() : "APP"}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {app.category || "Social Service Application"} • {app.type || "Application"}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Ref: {app.referenceNumber || app.id || "APP-PENDING"}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    {app.status || "Pending Review"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-500">
                Wala ka pang isinumiteng aplikasyon. Pumili ng serbisyo sa itaas upang magsimula.
              </p>
            </div>
          )}
        </div>

        {/* Citizen Hotline & QC Support Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-blue-200 uppercase mb-3">
              QC Citizen Help Desk
            </span>
            <h4 className="text-base font-bold text-white">Nangangailangan ng Gabay?</h4>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Kung may katanungan sa inyong documentary requirements o nais ng tulong mula sa Social Worker:
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/10 flex items-center justify-between">
                <span>QC Hotline:</span>
                <strong className="text-yellow-300 text-sm">122</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 flex items-center justify-between">
                <span>SSDD Office:</span>
                <span className="text-slate-200">QC Hall Complex</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 text-[11px] text-slate-400">
            Available Lunes hanggang Biyernes, 8:00 AM - 5:00 PM.
          </div>
        </div>
      </div>
    </div>
  )
}

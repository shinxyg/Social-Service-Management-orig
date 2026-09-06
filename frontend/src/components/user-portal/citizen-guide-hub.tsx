import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  ShieldAlert,
  Users,
  Baby,
  HeartHandshake,
  GraduationCap,
  Wallet,
  FileText,
  HelpCircle,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Building2,
  CreditCard,
  PhoneCall
} from "lucide-react"
import { API_BASE } from "../../config/api"
import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"

function WheelchairIcon({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="11" cy="5" r="2" />
      <path d="M11 7v8h4l4 5" />
      <path d="M11 11h5" />
      <path d="M7 11.5a5 5 0 1 0 6 7.5" />
      <path d="m14 19 3 3" />
    </svg>
  )
}

export default function CitizenGuideHub() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [recentApps, setRecentApps] = useState<any[]>([])

  const profile = getCurrentUserProfile()
  const qcid = getLoggedInUserQcid() || profile?.qcidNo || profile?.qcidNumber || ""
  const userName = profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}` : "Resident"

  // Fetch active / recent applications for user context bar
  useEffect(() => {
    let isMounted = true
    const fetchUserStatus = async () => {
      try {
        const found: any[] = []
        const currentQcid = (qcid || "").toLowerCase().trim()
        const userEmail = (profile?.email || "").toLowerCase().trim()
        const userLastName = (profile?.lastName || "").toLowerCase().trim()

        const isUserMatch = (a: any) => {
          if (!a) return false
          const aRef = String(a.reference_no || a.referenceNumber || a.reference_number || a.qcid || a.id || "").toLowerCase().trim()
          const aEmail = String(a.email || "").toLowerCase().trim()
          const aName = String(a.full_name || a.applicantName || a.lastName || "").toLowerCase().trim()
          return (
            (currentQcid && (aRef === currentQcid || aRef.includes(currentQcid) || currentQcid.includes(aRef))) ||
            (userEmail && aEmail && userEmail === aEmail) ||
            (userLastName && aName.includes(userLastName))
          )
        }

        // 1. AICS Apps
        try {
          const res = await fetch(`${API_BASE}/api/aics/applications`)
          if (res.ok) {
            const data = await res.json()
            const list = Array.isArray(data) ? data : data.applications || []
            const matched = list.filter(isUserMatch).map((a: any) => ({
              id: a.id || a.reference_no,
              program: a.assistance_type || a.assistanceType || a.type || "AICS Assistance",
              category: "AICS",
              status: a.status || "pending",
              date: a.created_at || a.dateSubmitted || new Date().toISOString(),
              ref: a.reference_no || a.referenceNumber || a.id
            }))
            found.push(...matched)
          }
        } catch {}

        // 2. PWD / Senior Apps
        try {
          const res2 = await fetch(`${API_BASE}/api/pwd-senior/applications`)
          if (res2.ok) {
            const list2 = await res2.json()
            if (Array.isArray(list2)) {
              const matched2 = list2.filter(isUserMatch).map((a: any) => ({
                id: a.id || a.referenceNumber,
                program: `${a.category || "Social Service"} - ${a.type ? a.type.toUpperCase() : "Application"}`,
                category: a.category || "PWD / Senior",
                status: a.status || "pending",
                date: a.created_at || a.dateSubmitted || new Date().toISOString(),
                ref: a.referenceNumber || a.reference_no || a.id
              }))
              found.push(...matched2)
            }
          }
        } catch {}

        // 3. LocalStorage fallback
        const localKeys = ["pwd_senior_applications", "aics_applications", "all_user_applications", "applications"]
        for (const k of localKeys) {
          try {
            const local = JSON.parse(localStorage.getItem(k) || "[]")
            if (Array.isArray(local)) {
              for (const item of local) {
                if (isUserMatch(item) && !found.some(f => f.ref === (item.referenceNumber || item.reference_no || item.id))) {
                  found.push({
                    id: item.id || item.referenceNumber || item.reference_no,
                    program: item.assistance_type || item.program || item.service || "Social Service",
                    category: item.category || "General",
                    status: item.status || "pending",
                    date: item.created_at || item.submittedAt || new Date().toISOString(),
                    ref: item.referenceNumber || item.reference_no || item.id
                  })
                }
              }
            }
          } catch {}
        }

        if (isMounted) {
          setRecentApps(found)
        }
      } catch {
        // ignore fetch error
      }
    }

    fetchUserStatus()
  }, [qcid, profile?.email, profile?.lastName])

  const aicsServices = [
    {
      type: "medical",
      title: "Medical Assistance",
      icon: "🩺",
      path: "/portal/aics?type=medical",
      desc: "Financial assistance for hospitalization bills, chemotherapy, dialysis, prescribed medications, and laboratory diagnostic procedures.",
      requirements: ["Medical Abstract / Certificate", "Hospital Bill / Statement of Account or Pharmacy Quotation", "Barangay Certificate of Indigency", "Valid QCID / Government ID"]
    },
    {
      type: "funeral",
      title: "Funeral & Burial Assistance",
      icon: "🕊️",
      path: "/portal/aics?type=funeral",
      desc: "Emergency support for funeral, burial, cremation, and casket expenses for deceased family members.",
      requirements: ["Registered Death Certificate", "Funeral Contract / Statement of Account", "Barangay Certificate of Indigency", "Valid QCID / Gov ID of Claimant"]
    },
    {
      type: "educational",
      title: "Educational Assistance",
      icon: "🎓",
      path: "/portal/aics?type=educational",
      desc: "Financial grant for school fees, supplies, learning materials, and student allowance for indigent students.",
      requirements: ["Certificate of Enrollment / Registration", "School ID / Student Assessment Form", "Barangay Indigency", "Parent/Guardian Valid ID"]
    },
    {
      type: "material",
      title: "Material Assistance",
      icon: "📦",
      path: "/portal/aics?type=material",
      desc: "Direct provisions of assistive supplies, emergency hygiene packs, and material relief for displaced or distressed citizens.",
      requirements: ["Barangay Certificate of Indigency / Incident Report", "Valid QCID / Government ID", "Social Worker Case Validation"]
    },
    {
      type: "food",
      title: "Food Assistance",
      icon: "🍲",
      path: "/portal/aics?type=food",
      desc: "Emergency nutritional food support and subsistence vouchers for families facing sudden economic crisis.",
      requirements: ["Barangay Certificate of Indigency", "Valid QCID / Government ID", "Proof of Family Dependency"]
    },
    {
      type: "transportation",
      title: "Transportation Assistance",
      icon: "🚌",
      path: "/portal/aics?type=transportation",
      desc: "Travel allowance for stranded individuals or residents needing emergency transit/repatriation to their home provinces.",
      requirements: ["Barangay Certificate / Police or Blotter Report if stranded", "Valid QCID / Gov ID", "Proof of Travel Necessity"]
    }
  ]

  const modulesList = [
    {
      id: "aics",
      title: "AICS Crisis Assistance",
      badge: "Financial & Material Aid",
      icon: ShieldAlert,
      color: "bg-red-50 text-red-600 border-red-200",
      btnColor: "bg-red-600 hover:bg-red-700",
      desc: "Immediate relief and financial assistance for individuals and families in crisis situations (Medical, Funeral, Educational, Food, Transportation, Material).",
      features: ["Emergency Cash Aid", "Hospital & Med Support", "Direct Payout via Financial Aid", "Same-week Processing"],
      primaryAction: { label: "Explore AICS Services", path: "/portal/aics?type=medical" },
      secondaryAction: { label: "View All 6 Types", path: "#aics-breakdown" }
    },
    {
      id: "pwd",
      title: "Persons with Disability (PWD) Services",
      badge: "PDAO Welfare & Benefits",
      icon: WheelchairIcon,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      btnColor: "bg-blue-600 hover:bg-blue-700",
      desc: "Comprehensive welfare services including New PWD ID registration, 3-year ID renewal, lost ID replacement, and financial social assistance.",
      features: ["20% Discount on Goods & Services", "12% VAT Exemption", "Free Movie Access", "PWD Social Pension"],
      primaryAction: { label: "Apply New PWD ID", path: "/portal/apply-pwd-senior?category=pwd&type=new" },
      secondaryAction: { label: "Renew or Replace ID", path: "/portal/apply-pwd-senior?category=pwd&type=renewal" }
    },
    {
      id: "senior",
      title: "Senior Citizen Services",
      badge: "OSCA Elderly Welfare",
      icon: Users,
      color: "bg-amber-50 text-amber-600 border-amber-200",
      btnColor: "bg-amber-600 hover:bg-amber-700",
      desc: "Programs for citizens aged 60+, including Official Senior ID registration, Medicine Discount Booklets, Free Movie Booklets, and Social Pension.",
      features: ["20% Senior Discount", "Medicine Purchase Booklet", "Free QC Movie Booklet", "Social Pension Program"],
      primaryAction: { label: "Apply Senior ID", path: "/portal/apply-pwd-senior?category=senior&type=new" },
      secondaryAction: { label: "Get Medicine/Movie Booklet", path: "/portal/apply-pwd-senior?category=senior&type=medicine-booklet" }
    },
    {
      id: "soloParent",
      title: "Solo Parent Services",
      badge: "RA 11861 Benefits",
      icon: Baby,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      btnColor: "bg-purple-600 hover:bg-purple-700",
      desc: "Empowering single parents through Solo Parent ID issuance, 7-day parental leaves, educational grants, and monthly cash subsidies.",
      features: ["Solo Parent ID", "7-Day Additional Leave", "10% Discount on Child Essentials", "Monthly Subsidy for Low-Income"],
      primaryAction: { label: "Apply Solo Parent ID", path: "/portal/apply-solo-parent?category=solo-parent&type=new" },
      secondaryAction: { label: "Renew Solo Parent ID", path: "/portal/apply-solo-parent?category=solo-parent&type=renewal" }
    },
    {
      id: "childWelfare",
      title: "Child Welfare Services",
      badge: "Protection & Nutrition",
      icon: HeartHandshake,
      color: "bg-rose-50 text-rose-600 border-rose-200",
      btnColor: "bg-rose-600 hover:bg-rose-700",
      desc: "Dedicated social protection for minors, nutritional supplemental programs, emergency child welfare, and family psychosocial support.",
      features: ["Nutritional Assistance", "Emergency Child Protection", "Psychosocial Support", "Temporary Foster & Shelter"],
      primaryAction: { label: "Child Welfare Services", path: "/portal/apply-solo-parent?category=child-welfare&program=nutritional-assistance" },
      secondaryAction: { label: "Emergency Protection", path: "/portal/apply-solo-parent?category=child-welfare&program=child-protection" }
    },
    {
      id: "livelihood",
      title: "Livelihood & Skills Training",
      badge: "Socio-Economic Development",
      icon: GraduationCap,
      color: "bg-teal-50 text-teal-600 border-teal-200",
      btnColor: "bg-teal-600 hover:bg-teal-700",
      desc: "Empowering residents with micro-enterprise capital assistance grants, toolkits/equipment support, and technical vocational courses.",
      features: ["Seed Capital Grant", "Livelihood Toolkits", "Vocational Training Courses", "Mentorship & Monitoring"],
      primaryAction: { label: "Apply Livelihood Grant", path: "/portal/apply-livelihood?category=livelihood" },
      secondaryAction: { label: "Enroll in Training", path: "/portal/apply-livelihood?category=training" }
    },
    {
      id: "disbursement",
      title: "Financial Aid & Payout Tracker",
      badge: "Disbursement & Payouts",
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      btnColor: "bg-emerald-600 hover:bg-emerald-700",
      desc: "Check and track your approved financial aid payouts, payout schedule appointments, official QR claim vouchers, and cash distribution.",
      features: ["Real-time Payout Status", "Official Claim QR Code", "Scheduled Venue & Time", "Direct Cash / Bank Release"],
      primaryAction: { label: "Open Payout Tracker", path: "/portal/financial-aid" },
      secondaryAction: { label: "View Application History", path: "/portal/my-applications" }
    }
  ]

  const faqs = [
    {
      q: "What is AICS and who is eligible to apply?",
      a: "AICS (Assistance to Individuals in Crisis Situations) is an emergency social welfare program by Quezon City providing financial and material assistance to residents facing unexpected crisis such as hospitalization, death of a family member, sudden loss of income, or natural calamities. Any bona fide Quezon City resident with a valid QCID or Barangay Indigency can apply."
    },
    {
      q: "How do I renew or replace a lost PWD or Senior Citizen ID?",
      a: "You can easily renew or replace your ID online! Navigate to PWD Services or Senior Citizen Services in the portal, select 'Renewal' (if your ID is expiring/expired) or 'Replacement / Lost ID' (if damaged or lost). Enter your 16-digit ID number to auto-verify against city records in real-time and upload an Affidavit of Loss."
    },
    {
      q: "How long does it take for an application to be approved?",
      a: "Emergency AICS applications (such as Medical and Funeral) are typically reviewed and evaluated by assigned Social Workers within 24 to 72 hours. ID applications (PWD, Senior Citizen, Solo Parent) take 3 to 5 business days for verification and card generation."
    },
    {
      q: "How will I receive my approved financial assistance payout?",
      a: "Once approved, you will receive an update in the 'Financial Aid Disbursement' section showing your scheduled payout appointment, designated venue/payout center, and an official Digital Claim Voucher with a QR code."
    },
    {
      q: "Can I apply for multiple assistance programs?",
      a: "Yes. You can apply for different services (e.g. Senior ID + Medicine Booklet + AICS Medical Assistance) based on your needs, provided you meet the specific qualifications and submit the required documentation for each program."
    }
  ]

  const hasSearch = searchTerm.trim().length > 0

  const filteredAics = aicsServices.filter((s) => {
    if (!hasSearch) return true
    const term = searchTerm.toLowerCase()
    return (
      s.title.toLowerCase().includes(term) ||
      s.desc.toLowerCase().includes(term) ||
      s.requirements.some((r) => r.toLowerCase().includes(term))
    )
  })

  const filteredModules = modulesList.filter((m) => {
    const matchesSearch =
      !hasSearch ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.features.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))
    if (selectedCategory === "all") return matchesSearch
    if (selectedCategory === "aics") return matchesSearch && m.id === "aics"
    if (selectedCategory === "pwd-senior") return matchesSearch && (m.id === "pwd" || m.id === "senior")
    if (selectedCategory === "family") return matchesSearch && (m.id === "soloParent" || m.id === "childWelfare")
    if (selectedCategory === "livelihood") return matchesSearch && (m.id === "livelihood" || m.id === "disbursement")
    return matchesSearch
  })

  const totalResultsCount = (hasSearch ? filteredAics.length : 0) + filteredModules.length

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* 1. HERO HEADER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                Quezon City Social Services Portal • Help & Service Guide
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Welcome, {userName}!
              </h1>
              <p className="text-sm sm:text-base text-blue-100/80 max-w-2xl leading-relaxed">
                Learn about available financial aid programs (AICS), special sector benefits (PWD, Senior Citizen, Solo Parent), child welfare, livelihood grants, and document requirements before applying.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate("/portal/aics?type=medical")}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShieldAlert className="h-4 w-4" />
                Apply for AICS Crisis Aid
              </button>
              <button
                type="button"
                onClick={() => navigate("/portal/my-applications")}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold backdrop-blur-sm border border-white/20 transition-all cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                Track My Applications
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-8 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services, requirements, or benefits (e.g. Medical, Senior Booklet, PWD ID, Funeral, Livelihood)..."
              className="w-full pl-12 pr-10 py-3.5 bg-white text-gray-900 placeholder-gray-400 rounded-2xl shadow-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 border-0"
            />
            {hasSearch && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg font-bold cursor-pointer transition-colors"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="mt-4 flex flex-wrap gap-2 pt-1">
            {[
              { id: "all", label: "All Services" },
              { id: "aics", label: "AICS Crisis Aid (6 Types)" },
              { id: "pwd-senior", label: "PWD & Senior Citizens" },
              { id: "family", label: "Solo Parent & Child Welfare" },
              { id: "livelihood", label: "Livelihood & Payouts" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id)
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-white text-blue-900 shadow-sm"
                    : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 space-y-8">
        {/* LIVE SEARCH RESULTS BANNER (SHOWN WHEN USER TYPES) */}
        {hasSearch && (
          <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 shadow-md space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Search Results for <span className="text-blue-600">"{searchTerm}"</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {totalResultsCount} found
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                Reset Search
              </button>
            </div>

            {totalResultsCount === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm font-bold text-gray-700">No matching social service or requirement found.</p>
                <p className="text-xs text-gray-500">Try searching for keywords like "Medical", "PWD", "Senior", "Solo Parent", "Funeral", or "Livelihood".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matching Modules */}
                {filteredModules.map((mod) => (
                  <div
                    key={mod.id}
                    className="p-4 rounded-xl border border-gray-200 bg-slate-50 flex flex-col justify-between gap-3 hover:border-blue-400 hover:bg-white transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                          {mod.badge}
                        </span>
                        <h3 className="font-bold text-gray-900 text-sm">{mod.title}</h3>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{mod.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(mod.primaryAction.path)}
                      className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {mod.primaryAction.label} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {/* Matching AICS Services */}
                {filteredAics.map((svc) => (
                  <div
                    key={svc.type}
                    className="p-4 rounded-xl border border-red-200 bg-red-50/40 flex flex-col justify-between gap-3 hover:bg-white transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{svc.icon}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                          AICS Crisis Aid
                        </span>
                        <h3 className="font-bold text-gray-900 text-sm">{svc.title}</h3>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{svc.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(svc.path)}
                      className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Apply for {svc.title} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. RECENT APPLICATIONS STATUS BANNER (IF ANY) */}
        {!hasSearch && recentApps.length > 0 && (
          <div className="bg-white border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Your Active & Recent Applications Status</span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/portal/my-applications")}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                View History <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentApps.slice(0, 3).map((app, idx) => {
                const isApproved = String(app.status).toLowerCase() === "approved" || String(app.status).toLowerCase() === "completed"
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="font-bold text-gray-800 truncate">{app.program}</div>
                      <div className="text-gray-500 font-mono text-[11px] truncate">Ref: {app.ref}</div>
                    </div>
                    <div>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Under Review
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. HOW IT WORKS (STEP-BY-STEP PROCESS) */}
        {!hasSearch && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              How the Social Services Application Works
            </h2>
            <p className="text-sm text-gray-500">
              Four simple steps from application filing to official payout and ID releasing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {[
              {
                step: "01",
                title: "Select Service & Requirements",
                desc: "Choose the service you need (AICS, PWD, Senior, Solo Parent) and prepare the required digital files (Indigency, Medical Abstract, IDs).",
                icon: FileCheck,
                color: "text-blue-600 bg-blue-50 border-blue-200"
              },
              {
                step: "02",
                title: "Fill Online Form & Upload",
                desc: "Provide your citizen details, address, and upload legible photos or scanned copies of supporting documents.",
                icon: FileText,
                color: "text-indigo-600 bg-indigo-50 border-indigo-200"
              },
              {
                step: "03",
                title: "Social Worker Assessment",
                desc: "Assigned City Social Workers review your case, evaluate eligibility, and approve the assistance amount or ID card request.",
                icon: Building2,
                color: "text-purple-600 bg-purple-50 border-purple-200"
              },
              {
                step: "04",
                title: "Approval & Payout / ID Claim",
                desc: "Receive real-time notification, QR Claim Voucher for financial payout, or notification to claim your official ID card.",
                icon: CreditCard,
                color: "text-emerald-600 bg-emerald-50 border-emerald-200"
              }
            ].map((st, i) => (
              <div
                key={i}
                className="relative p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col items-start gap-3 text-left hover:bg-white hover:shadow-md transition-all group"
              >
                <div className="w-full flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${st.color}`}>
                    <st.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-black text-gray-300 group-hover:text-blue-500 transition-colors">
                    {st.step}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{st.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* 4. AICS 6 SERVICE TYPES BREAKDOWN */}
        <div id="aics-breakdown" className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wide">
                <ShieldAlert className="h-4 w-4" />
                Crisis Intervention Program
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                AICS Assistance Types & Document Checklist
              </h2>
              <p className="text-sm text-gray-500">
                Direct financial and material assistance for indigent individuals in crisis situations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/portal/aics?type=medical")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start md:self-auto"
            >
              Open AICS Application <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {aicsServices.map((svc) => (
              <div
                key={svc.type}
                className="p-5 rounded-2xl bg-gradient-to-b from-white to-slate-50/50 border border-gray-200 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all gap-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-slate-100 group-hover:scale-110 transition-transform">
                      {svc.icon}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{svc.title}</h3>
                      <span className="text-[11px] text-blue-600 font-semibold">Crisis Financial Aid</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{svc.desc}</p>
                  
                  <div className="bg-slate-100/80 rounded-xl p-3 space-y-1.5">
                    <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                      Key Requirements:
                    </div>
                    <ul className="text-[11px] text-gray-600 space-y-1 list-disc list-inside">
                      {svc.requirements.map((req, rIdx) => (
                        <li key={rIdx} className="leading-tight">{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(svc.path)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Apply for {svc.title} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 5. ALL MODULES & SOCIAL SERVICES DIRECTORY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              Explore All Social Welfare Modules & Services
            </h2>
            <span className="text-xs font-bold text-gray-500">
              Showing {filteredModules.length} programs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredModules.map((mod) => (
              <div
                key={mod.id}
                className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-gray-300 transition-all gap-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl border ${mod.color}`}>
                        <mod.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{mod.title}</h3>
                        <span className="text-xs font-semibold text-gray-500">{mod.badge}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {mod.desc}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {mod.features.map((feat, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-slate-50 py-1.5 px-2.5 rounded-lg border border-slate-100 truncate"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (mod.primaryAction.path.startsWith("#")) {
                        const el = document.querySelector(mod.primaryAction.path)
                        el?.scrollIntoView({ behavior: "smooth" })
                      } else {
                        navigate(mod.primaryAction.path)
                      }
                    }}
                    className={`w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${mod.btnColor}`}
                  >
                    {mod.primaryAction.label} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  {mod.secondaryAction && (
                    <button
                      type="button"
                      onClick={() => {
                        if (mod.secondaryAction.path.startsWith("#")) {
                          const el = document.querySelector(mod.secondaryAction.path)
                          el?.scrollIntoView({ behavior: "smooth" })
                        } else {
                          navigate(mod.secondaryAction.path)
                        }
                      }}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      {mod.secondaryAction.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. GENERAL QUALIFICATION & DOCUMENT REQUIREMENTS SUMMARY */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              General Qualification & Document Requirements
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
              Before submitting any application, make sure your digital copies are clear, legible, and uncropped.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 space-y-2">
              <div className="font-bold text-sm text-blue-100 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-300" />
                Proof of Identity & Residency
              </div>
              <p className="text-xs text-blue-200/90 leading-relaxed">
                Official QCID Card, PhilSys National ID, Voter's Certification, or Barangay Certificate of Residency with at least 6 months residency.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 space-y-2">
              <div className="font-bold text-sm text-blue-100 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-300" />
                Certificate of Indigency
              </div>
              <p className="text-xs text-blue-200/90 leading-relaxed">
                Issued by your Barangay Captain or authorized barangay official stating the family is indigent and specifying the purpose of assistance.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 space-y-2">
              <div className="font-bold text-sm text-blue-100 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-300" />
                Program-Specific Documents
              </div>
              <p className="text-xs text-blue-200/90 leading-relaxed">
                Medical abstract/prescriptions for Medical aid; Death certificate & funeral contract for Burial aid; School Certificate for Education; Doctor's assessment for PWD.
              </p>
            </div>
          </div>
        </div>

        {/* 7. FREQUENTLY ASKED QUESTIONS (FAQS) */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Frequently Asked Questions (FAQs) & Help
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Got questions about social services? Find quick answers below.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-bold text-sm text-gray-900 flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-100/80 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-gray-500 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-4 text-xs sm:text-sm text-gray-600 bg-white leading-relaxed border-t border-gray-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 8. FOOTER CONTACT / HOTLINES */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="font-bold text-gray-900 text-sm flex items-center justify-center sm:justify-start gap-2">
              <PhoneCall className="h-4 w-4 text-blue-600" />
              Need Personal Assistance or Inquiries?
            </div>
            <p className="text-xs text-gray-500">
              Quezon City Social Services Development Department (SSDD) Hotline: (02) 8988-4242 loc. 8701 / 8702
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/portal/aics?type=medical")}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
          >
            Start an Application
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Home,
  FileCheck,
  Sun,
  Moon,
  ShieldAlert,
  Users,
  Baby,
  HeartHandshake,
  GraduationCap,
  Wallet,
  FileText,
  CheckCircle2,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  Clock,
  Award,
  Check,
  QrCode,
  ArrowUpRight,
} from 'lucide-react';

// Comprehensive Service Modules Definition
interface ServiceModule {
  id: string;
  category: 'crisis' | 'pwd' | 'senior' | 'solo-parent' | 'child' | 'livelihood' | 'disbursement';
  title: string;
  tagline: string;
  description: string;
  icon: any;
  tint: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'teal' | 'indigo';
  programs: string[];
  requirements: string[];
  turnaround: string;
  benefitType: string;
  applyUrl: string;
  badge: string;
}

const ALL_SERVICES: ServiceModule[] = [
  {
    id: 'aics-crisis',
    category: 'crisis',
    title: 'AICS Crisis Assistance',
    tagline: 'Agarang tulong pinansyal at materyal sa panahon ng kagipitan',
    description: 'Pang-emerhensiyang tulong para sa mga pamilya at indibidwal na nakararanas ng krisis, sakuna, o biglaang pangangailangan.',
    icon: ShieldAlert,
    tint: 'purple',
    badge: 'Crisis Support',
    programs: [
      'Medical & Hospitalization Subsidy',
      'Burial & Funeral Assistance',
      'Educational Crisis Assistance',
      'Emergency Food & Nutritional Packs',
      'Transportation / Balik-Probinsya',
      'Emergency Shelter & Material Aid',
    ],
    requirements: ['Valid Government / QCID', 'Barangay Certificate of Indigency', 'Medical / Funeral / School Documents', 'Proof of Crisis / Case Assessment'],
    turnaround: '1 - 3 Araw ng Pagsusuri',
    benefitType: 'Direct Cash / Guarantee Letter / In-Kind Goods',
    applyUrl: '/portal/aics',
  },
  {
    id: 'pwd-services',
    category: 'pwd',
    title: 'Persons with Disability (PWD) Services',
    tagline: 'Komprehensibong karapatan, diskwento, at proteksyon para sa may kapansanan',
    description: 'Pagbibigay at pagpapanibago ng opisyal na PWD ID alinsunod sa RA 7277 / RA 10754, kabilang ang social assistance at benepisyo.',
    icon: Users,
    tint: 'blue',
    badge: 'Disability Welfare',
    programs: [
      'Bagong Aplikasyon ng PWD ID',
      'Renewal ng Paso o Matatapos na PWD ID',
      'Replacement para sa Nawala / Nasirang ID',
      'PWD Social Financial Assistance',
      'Apparent & Non-Apparent Assessment',
    ],
    requirements: ['Medical Certificate mula sa Espesyalista o Lisensyadong Doktor', 'Katibayan ng Paninirahan sa Quezon City', '2x2 ID Picture', 'Kumpirmasyon ng Lagda'],
    turnaround: '3 - 5 Araw (Digital Issuance)',
    benefitType: 'Official PWD ID + 20% Mandatory Discount + Social Pension',
    applyUrl: '/portal/apply-pwd-senior?category=pwd',
  },
  {
    id: 'senior-services',
    category: 'senior',
    title: 'Senior Citizen Welfare & Services',
    tagline: 'Pagpapahalaga at kalinga sa mga nakatatandang residente ng Lungsod Quezon',
    description: 'Serbisyo para sa mga 60 taong gulang pataas kabilang ang Senior Citizen ID, Purchase Booklets, at Local Social Pension.',
    icon: Home,
    tint: 'emerald',
    badge: 'Elderly Welfare',
    programs: [
      'Bagong Aplikasyon ng Senior Citizen ID',
      'Renewal at Replacement / Lost ID',
      'Medicine Purchase Booklet',
      'Movie Pass Booklet (Libreng Sine)',
      'Local Social Pension Assistance',
    ],
    requirements: ['Birth Certificate o PSA Record', 'Valid Government ID na may petsa ng kapanganakan', 'Barangay Clearance / Certificate of Residence', '1x1 / 2x2 Recent Photo'],
    turnaround: '1 - 3 Araw',
    benefitType: 'Senior ID + 20% Medicine/Grocery Discount + Free QC Movie Access',
    applyUrl: '/portal/apply-pwd-senior?category=senior',
  },
  {
    id: 'solo-parent-services',
    category: 'solo-parent',
    title: 'Solo Parent Support & Benefits',
    tagline: 'Proteksyon at tulong sa mga solong magulang alinsunod sa RA 8972 & RA 11861',
    description: 'Pagpapatala at pagkilala sa mga solong magulang upang makatanggap ng buwanang subsidiya, scholarship, diskwento, at legal assistance.',
    icon: Baby,
    tint: 'rose',
    badge: 'RA 11861 Expanded',
    programs: [
      'Solo Parent ID (12 Kwalipikadong Kategorya)',
      'Buwanang P1,000 Cash Subsidy (Minimum Wage Earners)',
      '10% Discount sa Gatas, Gamot, at Pagkain ng Bata',
      '7 Araw na Parental Leave sa Trabaho',
      'Prioridad sa Livelihood at Pabahay',
    ],
    requirements: ['PSA Birth Certificate ng Bata', 'Barangay Certificate of Solo Parent Residency', 'Affidavit of Sole Parental Care', 'Income Tax Return (ITR) o Certificate of Indigency'],
    turnaround: '3 - 5 Araw',
    benefitType: 'Solo Parent ID + Buwanang Ayuda + Diskwento sa Batang 0-6 Yrs Old',
    applyUrl: '/portal/apply-solo-parent?category=solo-parent',
  },
  {
    id: 'child-welfare-services',
    category: 'child',
    title: 'Child Welfare & Protection Programs',
    tagline: 'Pangangalaga sa kalusugan, kaligtasan, at kinabukasan ng bawat batang QCitizen',
    description: 'Programa para sa mga bata sa mahihirap na kalagayan, biktima ng karahasan, kapabayaan, o nangangailangan ng agarang kalinga.',
    icon: HeartHandshake,
    tint: 'teal',
    badge: 'Youth & Protection',
    programs: [
      'Nutritional Supplementary Feeding Program',
      'Child Protection & Legal Intervention',
      'Emergency Crisis Assistance for Minors',
      'Psychosocial Support & Child Counseling',
      'Temporary Foster Shelter & Care Center',
      'Responsible Parenting & Family Seminars',
    ],
    requirements: ['Birth Certificate ng Bata', 'Barangay Referral o Indigency Report', 'Medical Record / Nutrition Growth Chart', 'Consent ng Magulang o Tagapangalaga'],
    turnaround: 'Immediate / Case-by-Case Assessment',
    benefitType: 'Feeding Supplies + Psychosocial Care + Protective Custody Aid',
    applyUrl: '/portal/apply-solo-parent?category=child-welfare',
  },
  {
    id: 'livelihood-training-services',
    category: 'livelihood',
    title: 'Livelihood Capital & Vocational Training',
    tagline: 'Puhunan at kasanayan para sa sariling negosyo at disenteng kabuhayan',
    description: 'Pangmatagalang solusyon sa kahirapan sa pamamagitan ng micro-business financial grants at TESDA-aligned technical skills development.',
    icon: GraduationCap,
    tint: 'amber',
    badge: 'Economic Empowerment',
    programs: [
      'Micro-Enterprise Seed Capital Grants',
      'Bread & Pastry Production Course',
      'Dressmaking & Tailoring Workshop',
      'Beauty Care & Wellness Training',
      'Electrical Installation & Maintenance Course',
      'Business Plan Mentorship & Toolkits',
    ],
    requirements: ['QCID / Proof of QC Residence', 'Barangay Indigency / Recommendation', 'Simple Business Plan Outline (para sa Puhunan)', 'Minimum 18 Taong Gulang'],
    turnaround: '4-Araw na Training + Certificate Release',
    benefitType: 'Libreng Training + Starter Toolkit + Negosyo Capital',
    applyUrl: '/portal/apply-livelihood',
  },
  {
    id: 'financial-aid-disbursement',
    category: 'disbursement',
    title: 'Digital Financial Aid Disbursement',
    tagline: 'Mabilis, ligtas, at transparent na electronic release ng ayuda',
    description: 'Modernong sistema ng pamamahagi ng tulong-pinansyal sa pamamagitan ng digital wallets, Landbank, at on-site scheduled releases.',
    icon: Wallet,
    tint: 'indigo',
    badge: 'Automated Payout',
    programs: [
      'GCash / Maya Electronic Direct Credit',
      'Landbank QC Citizen Card Payout',
      'On-site Cash Voucher Disbursement Schedule',
      'Real-Time Payout Claim Status Verification',
      'Automated Beneficiary SMS Notification',
    ],
    requirements: ['Rehistradong QCID', 'Aktibong Mobile Number para sa E-Wallet', 'Valid Reference Number mula sa Naaprubahang Aplikasyon'],
    turnaround: 'Same Day to 48 Oras matapos maaprubahan',
    benefitType: 'Electronic Direct Deposit / ATM Claim Voucher',
    applyUrl: '/portal/financial-aid',
  },
  {
    id: 'my-applications-tracking',
    category: 'crisis',
    title: 'Unified Application Tracker',
    tagline: 'Isang lugar para subaybayan ang estado ng lahat ng iyong aplikasyon',
    description: 'Real-time transparency sa bawat yugto: mula submission, social worker review, field validation, hanggang sa approval at disbursement.',
    icon: FileText,
    tint: 'blue',
    badge: 'Real-time Tracking',
    programs: [
      'Isahang QCID Tracking sa Lahat ng Kagawaran',
      'Live Timeline ng Pagsusuri ng Social Worker',
      'Pag-download ng Digital Reference Vouchers',
      'Automatic Resubmission para sa Kulang na Dokumento',
    ],
    requirements: ['Reference Number (hal. APP-XXXX) o Rehistradong QCID Number'],
    turnaround: 'Instant 24/7 Access',
    benefitType: 'Transparent Status & Tracking Transparency',
    applyUrl: '/portal/my-applications',
  },
];

const STATS = [
  { value: '8+', label: 'Digital Service Modules', desc: 'AICS, PWD, Senior, Solo Parent, Child, Livelihood' },
  { value: '15+', label: 'Specialized Welfare Programs', desc: 'Medical, burial, IDs, booklets, grants, scholarships' },
  { value: '100%', label: 'Paperless Digital Process', desc: 'Camera capture at file upload sa anumang cellphone o PC' },
  { value: '24/7', label: 'QCID Unified Access', desc: 'One-time registration para sa lahat ng serbisyo ng lungsod' },
];

const CITIZEN_STEPS = [
  {
    step: '01',
    title: 'QCID Login o Pagpaparehistro',
    desc: 'Mag-log in gamit ang inyong QCID number. Kusa nitong pupunan ang inyong pangalan, tirahan, at impormasyon upang hindi na mag-type muli.',
    icon: QrCode,
  },
  {
    step: '02',
    title: 'Pumili ng Serbisyo at Mag-upload',
    desc: 'Piliin ang kailangang tulong. Kunin lamang ang litrato ng inyong dokumento (hal. Medical cert, ID, birth cert) gamit ang camera o file selector.',
    icon: FileCheck,
  },
  {
    step: '03',
    title: 'Pagsusuri ng Social Worker',
    desc: 'Susuriin ng mga lisensyadong Social Welfare Officers ang inyong aplikasyon nang mabilis at patas ayon sa mga panuntunan ng pamahalaan.',
    icon: ShieldCheck,
  },
  {
    step: '04',
    title: 'Pagtanggap ng Benepisyo o ID',
    desc: 'Matatanggap ang tulong sa inyong GCash/Maya, bangko, o makukuha ang inyong opisyal na ID card sa nakatakdang iskedyul.',
    icon: Award,
  },
];

const FAQS = [
  {
    q: 'Sino-sino ang maaaring mag-apply sa pamamagitan ng portal na ito?',
    a: 'Lahat ng residente ng Lungsod Quezon na may QCID o patunay ng paninirahan (Barangay Certificate). Sakop nito ang mga nangangailangan ng agarang tulong (AICS), Senior Citizens, PWDs, Solo Parents, kababaihan, at kabataan.',
  },
  {
    q: 'Paano kung wala akong scanner o printer para sa requirements?',
    a: 'Hindi kailangan ng scanner! May built-in document camera ang ating portal. Maaari mong gamitin ang camera ng iyong smartphone o webcam para kumuha ng malinaw na litrato ng iyong mga ID at dokumento.',
  },
  {
    q: 'Paano ko masusubaybayan kung naaprubahan na ang aking aplikasyon?',
    a: 'Pumunta lamang sa "My Applications" sa portal o gamitin ang tracking widget sa ibaba. Ipasok ang inyong Reference Number (hal. APP-2026-PWD-001) upang makita ang real-time progress.',
  },
  {
    q: 'Ano ang kailangan kapag nawala ang aking PWD o Senior Citizen ID?',
    a: 'Piliin lamang ang "Replacement / Lost ID" flow sa kani-kanilang modyul. Ihanda ang Notarized Affidavit of Loss at patunay ng pagkakakilanlan upang makapag-isyu ng panibagong card.',
  },
  {
    q: 'Gaano kabilis bago matanggap ang ayudang pinansyal o assistance?',
    a: 'Para sa AICS medical at burial assistance, 1 hanggang 3 araw ng trabaho ang karaniwang pagsusuri. Pagka-apruba, ang digital payout (GCash/Maya/Landbank) ay naipapadala agad sa loob ng 24 hanggang 48 oras.',
  },
];

export function LandingPage() {
  const [dark, setDark] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [selectedModuleModal, setSelectedModuleModal] = useState<ServiceModule | null>(null);

  // Tracking Simulation State
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingResult, setTrackingResult] = useState<{
    found: boolean;
    ref: string;
    category: string;
    applicant: string;
    stage: string;
    status: 'pending' | 'approved' | 'disbursed';
    date: string;
  } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const filteredServices = useMemo(() => {
    return ALL_SERVICES.filter((svc) => {
      const matchCat = activeCategory === 'all' || svc.category === activeCategory;
      const matchSearch =
        searchQuery === '' ||
        svc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.programs.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleSimulateTrack = (refNumberToUse?: string) => {
    const input = refNumberToUse || trackingInput;
    if (!input.trim()) return;

    // Smart simulation based on input
    const isPwd = /pwd/i.test(input);
    const isSenior = /snr|senior/i.test(input);
    const isSolo = /solo/i.test(input);
    const isAics = /aics|med|burial/i.test(input);

    const categoryName = isPwd
      ? 'PWD Services (ID Issuance)'
      : isSenior
      ? 'Senior Citizen Welfare'
      : isSolo
      ? 'Solo Parent Assistance'
      : isAics
      ? 'AICS Crisis Medical Assistance'
      : 'Social Services General Assistance';

    setTrackingResult({
      found: true,
      ref: input.toUpperCase(),
      category: categoryName,
      applicant: 'CLARISA MAE G. DIMAL (QCID: 110000116932100)',
      stage: 'Dokumento Beripikado • Pagsusuri ng Social Worker (Intake Complete)',
      status: 'pending',
      date: new Date().toLocaleDateString('fil-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
  };

  const getTintStyle = (tint: string) => {
    switch (tint) {
      case 'blue':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
      case 'amber':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      case 'purple':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50';
      case 'rose':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50';
      case 'teal':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/50';
      default:
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-400/15 via-indigo-400/10 to-transparent blur-3xl" />
        <div className="absolute top-[800px] -left-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-[1400px] -right-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Government Banner */}
      <div className="bg-blue-900 text-white text-[11px] font-medium py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Republika ng Pilipinas • Pamahalaang Lungsod Quezon • Social Services Development Department (SSDD)</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-200">
            <span>QC Helpline: <strong>122</strong></span>
            <span>•</span>
            <span>24/7 Digital Citizen Assistance</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 group">
            <img
              src="/samples/Government Service Integrity Seal.png"
              alt="Government Seal"
              className="h-10 w-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Social Services Management</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                  QC Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Komprehensibong Portal ng Lahat ng Serbisyo at Benepisyo
              </p>
            </div>
          </a>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#services" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Mga Serbisyo
            </a>
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Paano Gamitin
            </a>
            <a href="#tracking" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Subaybayan ang Aplikasyon
            </a>
            <a href="#faqs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Gabay at FAQ
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              aria-label="Toggle Theme"
              className="h-9 w-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = '/login')}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Mag-login
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = '/login')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
            >
              <span>Buksan ang Portal</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 shadow-xs animate-in fade-in slide-in-from-top-3 duration-500">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Isahang Digital Hub para sa Lahat ng Serbisyong Panlipunan sa QC</span>
          </div>

          {/* Main Headline */}
          <h1 className="max-w-4xl mx-auto text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
            Lahat ng Tulong, Kalinga, at Benepisyo ng Lungsod,{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Nasa Isang Portal Lamang.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Hindi na kailangang pumila nang matagal. Mula sa <strong>AICS Crisis Assistance</strong>, <strong>PWD & Senior Citizen IDs</strong>, <strong>Solo Parent Subsidies</strong>, hanggang sa <strong>Pangkabuhayan at Skills Training</strong>—lahat ay maaaring i-apply at subaybayan online.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <a
              href="#services"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xl shadow-blue-600/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Galugarin ang Lahat ng Serbisyo</span>
              <ChevronDown size={17} />
            </a>

            <a
              href="#tracking"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Search size={16} className="text-blue-500" />
              <span>I-track ang Aplikasyon</span>
            </a>
          </div>

          {/* Stats Ribbon */}
          <div className="mt-14 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm backdrop-blur-xs">
            {STATS.map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 text-left border border-slate-100 dark:border-slate-800/50 flex flex-col justify-between"
              >
                <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                  {s.label}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Directory Matrix */}
      <section id="services" className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
              Direktoryo ng Serbisyo
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Kumpletong Buod ng Bawat Modyul at Programa
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Pumili ng sektor o maghanap ng partikular na serbisyo upang malaman ang mga benepisyo, proseso, at kailangang dokumento.
            </p>

            {/* Live Search and Filter Bar */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Maghanap (hal. PWD ID, Funeral, Solo Parent, TESDA, Puhunan)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="mt-5 flex items-center justify-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'Lahat ng Modyul' },
                { id: 'crisis', label: 'AICS Crisis' },
                { id: 'pwd', label: 'PWD Services' },
                { id: 'senior', label: 'Senior Citizen' },
                { id: 'solo-parent', label: 'Solo Parent' },
                { id: 'child', label: 'Child Welfare' },
                { id: 'livelihood', label: 'Pangkabuhayan' },
                { id: 'disbursement', label: 'E-Disbursement' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((svc) => {
              const Icon = svc.icon;
              return (
                <div
                  key={svc.id}
                  className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-6 flex flex-col justify-between hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-700 transition-all duration-300 hover:-translate-y-1"
                >
                  <div>
                    {/* Top Tag & Icon */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${getTintStyle(svc.tint)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700">
                        {svc.badge}
                      </span>
                    </div>

                    {/* Titles */}
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {svc.title}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                      {svc.tagline}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed line-clamp-3">
                      {svc.description}
                    </p>

                    {/* Sub-programs pill list */}
                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Mga Sakop na Programa:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {svc.programs.slice(0, 3).map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="truncate max-w-[200px]">{p}</span>
                          </span>
                        ))}
                        {svc.programs.length > 3 && (
                          <span className="text-[11px] px-1.5 py-0.5 text-slate-500 font-medium">
                            +{svc.programs.length - 3} pa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedModuleModal(svc)}
                      className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      Mga Rekisito & Detalye
                    </button>

                    <button
                      type="button"
                      onClick={() => (window.location.href = svc.applyUrl)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Mag-apply</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                Walang nahanap na serbisyo para sa "{searchQuery}".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-3 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                I-reset ang filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* End-to-End Citizen Experience Journey */}
      <section id="how-it-works" className="py-16 md:py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Mabilis at Ligtas na Daloy
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              Paano Gamitin ang Social Services Portal
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Dinisenyo upang gawing madali at maginhawa ang proseso para sa bawat mamamayan ng Quezon City.
            </p>
          </div>

          {/* 4-Step Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CITIZEN_STEPS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="relative p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-2xl font-black text-slate-300 dark:text-slate-700">
                        {s.step}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {s.title}
                    </h4>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Real-time Tracking Widget Section */}
      <section id="tracking" className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-10 text-white shadow-2xl shadow-blue-500/20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-3">
                <Search size={13} />
                <span>Live Verification Widget</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                Subaybayan ang Inyong Aplikasyon
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-blue-100 leading-relaxed">
                Ilagay ang inyong Reference Number (hal. APP-2026-001) o QCID number upang agad na malaman ang kasalukuyang estado ng pagsusuri.
              </p>
            </div>

            {/* Input Bar */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Ipasok ang Reference No. o QCID (hal. APP-2026-PWD-001)..."
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                className="flex-1 px-4 py-3.5 rounded-2xl bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => handleSimulateTrack()}
                className="px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-lg transition-colors cursor-pointer shrink-0"
              >
                I-check ang Status
              </button>
            </div>

            {/* Quick Sample Presets */}
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-blue-100">
              <span>Subukan ang mga halimbawa:</span>
              {[
                { label: 'PWD New ID', code: 'APP-2026-PWD-001' },
                { label: 'AICS Medical', code: 'APP-AICS-2026-MED' },
                { label: 'Solo Parent Subsidy', code: 'APP-SOLO-2026-789' },
              ].map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => {
                    setTrackingInput(sample.code);
                    handleSimulateTrack(sample.code);
                  }}
                  className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white font-mono text-[11px] underline cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            {/* Tracking Result Card */}
            {trackingResult && (
              <div className="mt-6 p-5 rounded-2xl bg-white text-slate-900 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                      {trackingResult.category}
                    </div>
                    <div className="text-base font-black text-slate-900">
                      Reference: {trackingResult.ref}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 self-start sm:self-auto">
                    <Clock size={13} />
                    <span>Under Review / Pending</span>
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">APPLICANT RECORD:</span>
                    <span className="font-bold text-slate-800">{trackingResult.applicant}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">HULING UPDATE:</span>
                    <span className="font-bold text-slate-800">{trackingResult.date}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Kasalukuyang Yugto: <strong className="text-slate-900">{trackingResult.stage}</strong>
                  </span>
                  <a
                    href="/portal/my-applications"
                    className="font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    <span>Buksan sa Portal</span>
                    <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Administrative Operations Experience Highlight */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mb-4">
                <Building2 size={14} />
                <span>Integrated Government Operations</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                Pinag-isang Sistema para sa mga Social Workers at Kawani ng Pamahalaan
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Hindi lamang ito aplikasyon para sa mga mamamayan—ito ay kumpletong Enterprise Case Management System na may automated eligibility checks, real-time deduplication para maiwasan ang dobleng pagkuha ng ayuda, audit trail ng bawat aksyon, at automated disbursement sync sa City Treasury.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Case Management</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Beneficiary Directory</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>System Activity Audit Logs</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Financial Aid Scheduler</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => (window.location.href = '/login')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  Staff Portal Login
                </button>
                <button
                  type="button"
                  onClick={() => (window.location.href = '/super-admin/login')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Super Admin Console
                </button>
              </div>
            </div>

            {/* Background Seal Graphic */}
            <img
              src="/samples/Government Service Integrity Seal.png"
              alt="Seal watermark"
              className="absolute -right-10 -bottom-10 w-80 h-80 object-contain opacity-10 pointer-events-none"
            />
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faqs" className="py-16 md:py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Gabay sa Mamamayan
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              Mga Madalas Itanong (FAQs)
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Alamin ang mga sagot sa mga pangunahing katanungan hinggil sa aplikasyon, rekisito, at benepisyo.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, fIdx) => (
              <div
                key={fIdx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === fIdx ? null : fIdx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === fIdx ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {expandedFaq === fIdx && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1 */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <img
                  src="/samples/Government Service Integrity Seal.png"
                  alt="Government Seal"
                  className="h-10 w-10 object-contain shrink-0"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">Social Services Management System</h4>
                  <p className="text-[11px] text-slate-400">Pamahalaang Lungsod Quezon • SSDD</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Opisyal na digital platform para sa pagpapamahagi ng tulong-panlipunan, mga subsidiya, pangkabuhayan, at ID ng Lungsod Quezon nang may integridad, bilis, at malasakit.
              </p>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Mga Pangunahing Sektor</h5>
              <ul className="space-y-1.5 text-xs">
                <li><a href="#services" className="hover:text-white transition-colors">AICS Crisis Assistance</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Persons with Disability (PWD)</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Senior Citizen Services</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Solo Parent & Child Welfare</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Livelihood & Skills Training</a></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Tulong & Impormasyon</h5>
              <p className="text-xs text-slate-400">
                QC Helpline: <strong className="text-white">122</strong>
              </p>
              <p className="text-xs text-slate-400">
                Email: <strong className="text-white">ssdd@quezoncity.gov.ph</strong>
              </p>
              <p className="text-xs text-slate-400">
                Oras ng Tanggapan: Lunes - Biyernes, 8:00 AM - 5:00 PM
              </p>
              <div className="pt-2">
                <a
                  href="/login"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold"
                >
                  <span>Pumasok sa Resident Portal</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© 2026 Pamahalaang Lungsod Quezon. All rights reserved. Secure Government Cloud Platform.</p>
            <div className="flex items-center gap-4">
              <span>Data Privacy Act of 2012 Compliant</span>
              <span>•</span>
              <span>256-Bit SSL Encryption</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Module Requirements Detail Modal */}
      {selectedModuleModal && (
        <div
          onClick={() => setSelectedModuleModal(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getTintStyle(selectedModuleModal.tint)}`}>
                  <selectedModuleModal.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {selectedModuleModal.title}
                  </h4>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                    {selectedModuleModal.badge}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedModuleModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p className="leading-relaxed">{selectedModuleModal.description}</p>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                  Mga Saklaw na Programa:
                </h5>
                <ul className="space-y-1.5 pl-4 list-disc text-slate-700 dark:text-slate-300">
                  {selectedModuleModal.programs.map((prog, idx) => (
                    <li key={idx}>{prog}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                  Kailangang Dokumento at Rekisito:
                </h5>
                <div className="space-y-1.5">
                  {selectedModuleModal.requirements.map((req, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2 text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 block font-bold">INAASAHANG ORAS:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedModuleModal.turnaround}</span>
                </div>
                <div>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 block font-bold">URI NG BENEPISYO:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedModuleModal.benefitType}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedModuleModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Isara
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = selectedModuleModal.applyUrl)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors cursor-pointer"
              >
                Mag-apply Ngayon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
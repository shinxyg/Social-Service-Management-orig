import { useState, useEffect } from "react"
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Clock3,
  AlertCircle,
  XCircle,
  FileEdit,
  Award,
  Sparkles,
  Scissors,
  UtensilsCrossed,
  Laptop,
  Check,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Lock,
  Unlock,
  Target,
  Printer,
  Plus,
  Coffee,
  Headphones,
  Home,
  HeartPulse,
  Flame,
  ChefHat,
  Upload,
  Camera,
  FileText,
  X,
  GraduationCap,
  User,
  Briefcase,
  FolderCheck,
} from "lucide-react"
import DocumentCameraModal from "../ui/document-camera-modal"
import { API_BASE } from "../../config/api"
import { getCurrentUserProfile, getLoggedInUserQcid, type LoggedInUserProfile } from "../../utils/userProfile"
import { notifyApplicationChange } from "../../utils/realtimeSync"
import { useLanguage } from "../ui/language-context"

export type TrainingProgramTab = "available" | "apply" | "schedule" | "history"

export interface TrainingCourse {
  id: string
  title: string
  category: string
  description: string
  duration: string // "18 working days" or "30 working days"
  durationHours?: number
  batch: string // "3rd Batch 2026"
  applicationOpens: string // "July 1, 2026"
  applicationDeadline: string // "July 15, 2026"
  trainingStarts: string // "August 1 - 30, 2026"
  date?: string
  time?: string
  location?: string
  landmark?: string
  totalSlots: number
  availableSlots: number
  enrolledCount?: number
  percentFilled?: number
  instructor?: string
  prerequisites?: string
  materialsProvided?: string
  icon?: string
}

export interface TrainingApplicationRecord {
  id: string | number
  referenceNumber: string
  qcid: string
  userId?: string
  trainingId: string
  trainingName: string
  applicantInfo: {
    fullName: string
    firstName: string
    middleName?: string
    lastName: string
    suffix?: string
    email: string
    contactNo: string
    address?: string
    completeAddress?: string
    barangay: string
    city: string
    sex: string
    dateOfBirth: string
    age: string | number
    occupation?: string
    civilStatus?: string
    highestEducation?: string
    schoolInstitution?: string
    trainingPurpose?: string
    reasonForApplying?: string
    hasAttendedTraining?: string
    previousTrainingCourse?: string
    previousYearCompleted?: string
    documents?: {
      requestLetter?: string | null
      qcIdProof?: string | null
    }
  }
  status: "pending" | "under_review" | "approved" | "rejected" | "needs_revision"
  submittedAt: string
  approvedBy?: string
  approvedDate?: string
  rejectionReason?: string
  revisionNotes?: string
  schedule: {
    trainingName: string
    trainingDate: string
    trainingTime: string
    trainingLocation: string
    landmark: string
    trainingStatus: "Upcoming" | "Ongoing" | "Completed"
  }
  attendance: {
    totalHours: number
    hoursCompleted: number
    completed: boolean
    sessions: Array<{
      day: number
      topic: string
      attended: boolean
      date: string
    }>
  }
  certificate?: {
    certificateNo: string
    issueDate: string
    title: string
    recipientName: string
    trainingName: string
    hoursCompleted: number
    status: string
  } | null
}

const DEFAULT_COURSES: TrainingCourse[] = [
  {
    id: "tr-bread-pastry",
    title: "Bread and Pastry Making",
    category: "Livelihood & Skills Development",
    description: "Learn commercial bread and pastry production, baking techniques, measuring and mixing, pastry decorating, oven management, and food safety standards.",
    duration: "18 working days",
    durationHours: 54,
    batch: "3rd Batch 2026",
    applicationOpens: "July 1, 2026",
    applicationDeadline: "July 15, 2026",
    trainingStarts: "August 1 - 18, 2026",
    date: "August 1 - 18, 2026",
    time: "8:00 AM - 12:00 PM / 1:00 PM - 5:00 PM",
    location: "Gov Services Skills Development Center, Batasan Hills",
    landmark: "Culinary & Bakery Lab, 3rd Floor",
    totalSlots: 25,
    availableSlots: 25,
    enrolledCount: 0,
    percentFilled: 0,
    instructor: "Chef Melissa Ramos (Master Baker & Pastry Chef)",
    prerequisites: "Gov Services Resident (18 years old and above), interest in commercial baking & pastry production.",
    materialsProvided: "Baking ingredients starter kit, apron, hairnet, baking tools set, and recipe module.",
  },
  {
    id: "tr-barista",
    title: "Barista",
    category: "Livelihood & Skills Development",
    description: "Master espresso extraction, milk steaming, latte art, coffee brewing methods, equipment maintenance, and coffee shop customer service.",
    duration: "18 working days",
    durationHours: 54,
    batch: "3rd Batch 2026",
    applicationOpens: "July 1, 2026",
    applicationDeadline: "July 15, 2026",
    trainingStarts: "August 1 - 18, 2026",
    date: "August 1 - 18, 2026",
    time: "9:00 AM - 12:00 PM / 1:00 PM - 4:00 PM",
    location: "Gov Services Skills Development Center, Batasan Hills",
    landmark: "Beverage & Coffee Training Hub, 2nd Floor",
    totalSlots: 25,
    availableSlots: 25,
    enrolledCount: 0,
    percentFilled: 0,
    instructor: "Mr. Dave Navarro (Certified Master Barista)",
    prerequisites: "Gov Services Resident (18 years old and above), eager to work in cafes or start a coffee business.",
    materialsProvided: "Specialty coffee beans, barista kit, frothing pitcher, tamper, and training handbook.",
  },
  {
    id: "tr-computer-call-center",
    title: "Basic Computer Literacy & Call Center Service",
    category: "Livelihood & Skills Development",
    description: "Practical training in computer operations, Microsoft Office tools, typing speed, English communication skills, call handling techniques, and BPO job preparation.",
    duration: "18 working days",
    durationHours: 54,
    batch: "3rd Batch 2026",
    applicationOpens: "July 1, 2026",
    applicationDeadline: "July 15, 2026",
    trainingStarts: "August 1 - 18, 2026",
    date: "August 1 - 18, 2026",
    time: "9:00 AM - 12:00 PM / 1:00 PM - 4:00 PM",
    location: "Gov Services Skills Development Center, Batasan Hills",
    landmark: "IT & BPO Simulation Lab, 2nd Floor",
    totalSlots: 25,
    availableSlots: 25,
    enrolledCount: 0,
    percentFilled: 0,
    instructor: "Mr. Mark Villanueva (IT & BPO Skills Specialist)",
    prerequisites: "Gov Services Resident seeking computer proficiency and customer service / BPO employment.",
    materialsProvided: "Dedicated computer terminal, headset with mic, training modules, and practice software.",
  },
  {
    id: "tr-hairdressing",
    title: "Hairdressing",
    category: "Livelihood & Skills Development",
    description: "Hands-on training in hair cutting, hair styling, hair coloring, blowdrying, hair rebonding/perming, and salon sanitation management.",
    duration: "30 working days",
    durationHours: 90,
    batch: "3rd Batch 2026",
    applicationOpens: "July 1, 2026",
    applicationDeadline: "July 15, 2026",
    trainingStarts: "August 1 - 30, 2026",
    date: "August 1 - 30, 2026",
    time: "9:00 AM - 12:00 PM / 1:00 PM - 4:00 PM",
    location: "Gov Services Skills Development Center, Batasan Hills",
    landmark: "Salon & Cosmetology Studio, Ground Floor",
    totalSlots: 25,
    availableSlots: 25,
    enrolledCount: 0,
    percentFilled: 0,
    instructor: "Ms. Cheryl Mendez (Senior Hair Stylist & Cosmetologist)",
    prerequisites: "Gov Services Resident (18 years old and above), interest in beauty and salon services.",
    materialsProvided: "Professional shears, hair cutting kit, cape, comb sets, clips, and styling mannequins.",
  },
  {
    id: "tr-beauty-care",
    title: "Beauty Care",
    category: "Livelihood & Skills Development",
    description: "Learn manicure, pedicure, nail art application, basic facial treatments, day/evening makeup, and home-service/salon business management.",
    duration: "30 working days",
    durationHours: 90,
    batch: "3rd Batch 2026",
    applicationOpens: "July 1, 2026",
    applicationDeadline: "July 15, 2026",
    trainingStarts: "August 1 - 30, 2026",
    date: "August 1 - 30, 2026",
    time: "9:00 AM - 12:00 PM / 1:00 PM - 4:00 PM",
    location: "Gov Services Skills Development Center, Batasan Hills",
    landmark: "Beauty & Wellness Studio, Ground Floor",
    totalSlots: 25,
    availableSlots: 25,
    enrolledCount: 0,
    percentFilled: 0,
    instructor: "Ms. Jocelyn Cruz (Certified Esthetician & Nail Artist)",
    prerequisites: "Gov Services Resident (18 years old and above), interested in beauty care and nail technology.",
    materialsProvided: "Nail care grooming set, nail polishes, cuticle care tools, makeup starter kit, and sanitizer kit.",
  },
  {
    id: "tr-dressmaking-sewing",
    title: "Dressmaking / Sewing Craft",
    category: "Livelihood & Skills Development",
    description: "Learn body measurement, pattern drafting, fabric cutting, high-speed sewing machine operation, garment assembly, and sewing craft creation.",
    duration: "30 working days",
    durationHours: 90,
    batch: "3rd Batch 2026",
    applicationOpens: "July 1, 2026",
    applicationDeadline: "July 15, 2026",
    trainingStarts: "August 1 - 30, 2026",
    date: "August 1 - 30, 2026",
    time: "9:00 AM - 12:00 PM / 1:00 PM - 4:00 PM",
    location: "Gov Services Skills Development Center, Batasan Hills",
    landmark: "Garment & Tailoring Workshop, 2nd Floor",
    totalSlots: 25,
    availableSlots: 25,
    enrolledCount: 0,
    percentFilled: 0,
    instructor: "Mrs. Rosa Dimaculangan (Master Tailor & Dressmaker)",
    prerequisites: "Gov Services Resident (18 years old and above), interest in sewing, dressmaking, or alterations.",
    materialsProvided: "Sewing fabric, thread kit, pattern paper, tracing wheel, measuring tape, and tailoring scissors.",
  },
  {
    id: "tr-housekeeping",
    title: "Basic Housekeeping",
    category: "Livelihood & Skills Development",
    description: "Professional training in room cleaning, bed making, linen and laundry management, cleaning chemicals and sanitization, and hospitality guest service standards.",
    duration: "30 working days",
    durationHours: 90,
    batch: "3rd Batch 2026",
    applicationOpens: "July 1, 2026",
    applicationDeadline: "July 15, 2026",
    trainingStarts: "August 1 - 30, 2026",
    date: "August 1 - 30, 2026",
    time: "8:00 AM - 12:00 PM / 1:00 PM - 5:00 PM",
    location: "Gov Services Skills Development Center, Batasan Hills",
    landmark: "Hospitality & Housekeeping Simulation Suite, 3rd Floor",
    totalSlots: 25,
    availableSlots: 25,
    enrolledCount: 0,
    percentFilled: 0,
    instructor: "Mr. Ronald Garcia (Executive Housekeeper & TESDA Assessor)",
    prerequisites: "Gov Services Resident (18 years old and above), willing to work in hotels, resorts, or commercial facilities.",
    materialsProvided: "Housekeeping uniform/apron, cleaning essentials kit, microfibers, and service training manual.",
  },
  {
    id: "tr-health-care",
    title: "Health Care Provider",
    category: "Livelihood & Skills Development",
    description: "Foundational caregiving skills, patient vital signs measurement, elderly care, personal hygiene assistance, patient mobility, first aid, and emergency care basics.",
    duration: "30 working days",
    durationHours: 90,
    batch: "3rd Batch 2026",
    applicationOpens: "July 1, 2026",
    applicationDeadline: "July 15, 2026",
    trainingStarts: "August 1 - 30, 2026",
    date: "August 1 - 30, 2026",
    time: "8:00 AM - 12:00 PM / 1:00 PM - 5:00 PM",
    location: "Gov Services Skills Development Center, Batasan Hills",
    landmark: "Healthcare & Caregiving Simulation Ward, 3rd Floor",
    totalSlots: 25,
    availableSlots: 25,
    enrolledCount: 0,
    percentFilled: 0,
    instructor: "Nurse Elena Fernandez, RN (Certified Healthcare Trainer)",
    prerequisites: "Gov Services Resident (18 years old and above), compassionate and willing to assist patients and seniors.",
    materialsProvided: "BP apparatus with stethoscope, digital thermometer, caregiver scrub suit, and first-aid guide.",
  },
  {
    id: "tr-welding",
    title: "Basic Welding",
    category: "Livelihood & Skills Development",
    description: "Fundamental Shielded Metal Arc Welding (SMAW), welding safety standards, metal cutting, joint preparation, welding positions, and metal fabrication.",
    duration: "30 working days",
    durationHours: 90,
    batch: "3rd Batch 2026",
    applicationOpens: "July 1, 2026",
    applicationDeadline: "July 15, 2026",
    trainingStarts: "August 1 - 30, 2026",
    date: "August 1 - 30, 2026",
    time: "8:00 AM - 12:00 PM / 1:00 PM - 5:00 PM",
    location: "Gov Services Skills Development Center, Batasan Hills",
    landmark: "Industrial Welding & Metal Fabrication Bay, Ground Floor",
    totalSlots: 25,
    availableSlots: 25,
    enrolledCount: 0,
    percentFilled: 0,
    instructor: "Engr. Roberto Salazar (Certified SMAW Welding Instructor)",
    prerequisites: "Gov Services Resident (18 years old and above), physically fit and willing to follow industrial safety.",
    materialsProvided: "Welding helmet/mask, leather welding gloves, chipping hammer, safety goggles, and electrode kit.",
  },
  {
    id: "tr-food-beverage-catering",
    title: "Food, Beverage & Catering Services",
    category: "Livelihood & Skills Development",
    description: "Comprehensive training in food dining service, table setting, banquet catering operations, food safety standards, bar service, and catering event management.",
    duration: "30 working days",
    durationHours: 90,
    batch: "3rd Batch 2026",
    applicationOpens: "July 1, 2026",
    applicationDeadline: "July 15, 2026",
    trainingStarts: "August 1 - 30, 2026",
    date: "August 1 - 30, 2026",
    time: "8:00 AM - 12:00 PM / 1:00 PM - 5:00 PM",
    location: "Gov Services Skills Development Center, Batasan Hills",
    landmark: "Culinary Arts & Dining Banquet Hall, 3rd Floor",
    totalSlots: 25,
    availableSlots: 25,
    enrolledCount: 0,
    percentFilled: 0,
    instructor: "Chef Anthony Santos & F&B Manager Carlo Reyes",
    prerequisites: "Gov Services Resident (18 years old and above), passionate about culinary, dining, or catering business.",
    materialsProvided: "Service apron, waiter corkscrew, table napkin set, banquet service manual, and food handler kit.",
  },
]

interface TrainingProgramViewProps {
  initialTab?: TrainingProgramTab
}

export default function TrainingProgramView({ initialTab = "available" }: TrainingProgramViewProps) {
  const { language } = useLanguage()
  const isEn = language === "en"
  const isBis = language === "bis"

  const [activeTab, setActiveTab] = useState<TrainingProgramTab>(initialTab)
  const [courses, setCourses] = useState<TrainingCourse[]>(DEFAULT_COURSES)
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const COURSE_LOCALIZATIONS: Record<
    string,
    {
      title?: { en: string; tl: string; bis: string }
      description: { en: string; tl: string; bis: string }
      prerequisites?: { en: string; tl: string; bis: string }
      materialsProvided?: { en: string; tl: string; bis: string }
    }
  > = {
    "tr-bread-pastry": {
      title: { en: "Bread and Pastry Making", tl: "Bread and Pastry Making", bis: "Bread and Pastry Making" },
      description: {
        en: "Learn commercial bread and pastry production, baking techniques, measuring and mixing, pastry decorating, oven management, and food safety standards.",
        tl: "Matutunan ang commercial bread and pastry production, baking techniques, measuring at mixing, pastry decorating, oven management, at food safety standards para sa panaderya at pastry business.",
        bis: "Pagkat-on sa commercial bread ug pastry production, baking techniques, pagsukod ug pagsagol, pastry decorating, pagdumala sa oven, ug food safety standards.",
      },
    },
    "tr-barista": {
      title: { en: "Barista", tl: "Barista", bis: "Barista" },
      description: {
        en: "Master espresso extraction, milk steaming, latte art, coffee brewing methods, equipment maintenance, and coffee shop customer service.",
        tl: "Master ang espresso extraction, milk steaming, latte art, coffee brewing methods, equipment maintenance, at coffee shop customer service.",
        bis: "Pagkat-on sa espresso extraction, milk steaming, latte art, mga paagi sa pagtimpla og kape, pagmentinar sa ekipo, ug serbisyo sa kustomer sa coffee shop.",
      },
    },
    "tr-computer-call-center": {
      title: {
        en: "Basic Computer Literacy & Call Center Service",
        tl: "Basic Computer Literacy at Call Center Service",
        bis: "Basic Computer Literacy ug Call Center Service",
      },
      description: {
        en: "Practical training in computer operations, Microsoft Office tools, typing speed, English communication skills, call handling techniques, and BPO job preparation.",
        tl: "Pagsasanay sa computer navigation, Microsoft Office tools, typing speed, communication skills, call handling techniques, at BPO job readiness.",
        bis: "Pagbansay sa paggamit og computer, Microsoft Office tools, katulin sa pag-type, komunikasyon, pagdumala sa tawag, ug pag-andam sa trabaho sa BPO.",
      },
    },
    "tr-hairdressing": {
      title: { en: "Hairdressing", tl: "Hairdressing (Paggugupit at Pag-aayos ng Buhok)", bis: "Hairdressing (Pagtupi ug Pag-ayo sa Buhok)" },
      description: {
        en: "Hands-on training in hair cutting, hair styling, hair coloring, blowdrying, hair rebonding/perming, and salon sanitation management.",
        tl: "Pang-propesyonal na kasanayan sa haircutting, hair styling, hair coloring, blowdrying, hair rebonding/perming, at salon sanitation management.",
        bis: "Propesyonal nga kahanas sa pagtupi, hair styling, pagkolor sa buhok, blowdrying, rebonding/perming, ug kalimpyo sa salon.",
      },
    },
    "tr-beauty-care": {
      title: { en: "Beauty Care", tl: "Beauty Care (Pangangalaga sa Kagandahan)", bis: "Beauty Care (Pag-atiman sa Katahom)" },
      description: {
        en: "Learn manicure, pedicure, nail art application, basic facial treatments, day/evening makeup, and home-service/salon business management.",
        tl: "Matutunan ang manicure, pedicure, nail art, basic facial treatments, day/evening makeup, at salon/home-service business management.",
        bis: "Pagkat-on sa manicure, pedicure, nail art, facial treatments, makeup para sa adlaw ug gabii, ug pagdumala sa negosyo sa salon.",
      },
    },
    "tr-dressmaking-sewing": {
      title: {
        en: "Dressmaking / Sewing Craft",
        tl: "Dressmaking / Pananahi at Sewing Craft",
        bis: "Dressmaking / Panahi ug Sewing Craft",
      },
      description: {
        en: "Learn body measurement, pattern drafting, fabric cutting, high-speed sewing machine operation, garment assembly, and sewing craft creation.",
        tl: "Matutunan ang body measurement, pattern drafting, fabric cutting, paggamit ng high-speed sewing machine, pananahi ng damit, at sewing crafts.",
        bis: "Pagkat-on sa pagsukod sa lawas, pattern drafting, pagputol sa panapton, paggamit sa sewing machine, pagtahi og sinina, ug sewing crafts.",
      },
    },
    "tr-housekeeping": {
      title: {
        en: "Basic Housekeeping",
        tl: "Basic Housekeeping (Pangangalaga sa Silid at Pasilidad)",
        bis: "Basic Housekeeping (Paglimpyo ug Pag-atiman sa Lawak)",
      },
      description: {
        en: "Professional training in room cleaning, bed making, linen and laundry management, cleaning chemicals and sanitization, and hospitality guest service standards.",
        tl: "Propesyonal na kasanayan sa hotel at residential room cleaning, bed making, linen at laundry management, sanitizing chemicals, at hospitality guest service.",
        bis: "Propesyonal nga pagbansay sa paglimpyo sa lawak sa hotel ug balay, bed making, pagdumala sa labada, sanitizing chemicals, ug serbisyo sa hospitality.",
      },
    },
    "tr-health-care": {
      title: {
        en: "Health Care Provider",
        tl: "Health Care Provider (Caregiving at Pangangalaga)",
        bis: "Health Care Provider (Pag-atiman sa Panglawas)",
      },
      description: {
        en: "Foundational caregiving skills, patient vital signs measurement, elderly care, personal hygiene assistance, patient mobility, first aid, and emergency care basics.",
        tl: "Pangunahing kasanayan sa caregiving, pagkuha ng vital signs, pangangalaga sa matatanda at may sakit, personal hygiene assistance, first aid, at healthcare hygiene.",
        bis: "Panguna nga kahanas sa caregiving, pagkuha og vital signs, pag-atiman sa mga tigulang ug masakiton, first aid, ug kalimpyo sa panglawas.",
      },
    },
    "tr-welding": {
      title: {
        en: "Basic Welding",
        tl: "Basic Welding (SMAW Pundasyon sa Pagwewelding)",
        bis: "Basic Welding (Pundasyon sa Pag-welding)",
      },
      description: {
        en: "Fundamental Shielded Metal Arc Welding (SMAW), welding safety standards, metal cutting, joint preparation, welding positions, and metal fabrication.",
        tl: "Pundasyon sa Shielded Metal Arc Welding (SMAW), kaligtasan sa pagwewelding, metal cutting, joint preparation, welding positions, at metal fabrication.",
        bis: "Pundasyon sa Shielded Metal Arc Welding (SMAW), kaluwasan sa pag-welding, pagputol sa metal, joint preparation, ug metal fabrication.",
      },
    },
    "tr-food-beverage-catering": {
      title: {
        en: "Food, Beverage & Catering Services",
        tl: "Food, Beverage at Catering Services",
        bis: "Food, Beverage ug Catering Services",
      },
      description: {
        en: "Comprehensive training in food dining service, table setting, banquet catering operations, food safety standards, bar service, and catering event management.",
        tl: "Komprehensibong pagsasanay sa dining service, table setting, banquet catering operations, food safety standards, bar service, at catering event management.",
        bis: "Komprehensibo nga pagbansay sa dining service, table setting, banquet catering operations, food safety standards, bar service, ug pagdumala sa okasyon.",
      },
    },
  }

  const localizeDateStr = (str?: string) => {
    if (!str) return ""
    if (isEn) return str
    return str
      .replace(/January/g, "Enero")
      .replace(/February/g, "Pebrero")
      .replace(/March/g, "Marso")
      .replace(/April/g, "Abril")
      .replace(/May/g, "Mayo")
      .replace(/June/g, "Hunyo")
      .replace(/July/g, "Hulyo")
      .replace(/August/g, "Agosto")
      .replace(/September/g, "Setyembre")
      .replace(/October/g, "Oktubre")
      .replace(/November/g, "Nobyembre")
      .replace(/December/g, "Disyembre")
  }

  const localizeDuration = (duration?: string) => {
    if (!duration) return isEn ? "18 working days" : isBis ? "18 ka adlaw nga pagbansay" : "18 araw ng pagsasanay"
    if (isEn) return duration
    if (duration.includes("18")) {
      return isBis ? "18 ka adlaw nga pagbansay" : "18 araw ng pagsasanay"
    }
    if (duration.includes("30")) {
      return isBis ? "30 ka adlaw nga pagbansay" : "30 araw ng pagsasanay"
    }
    return duration
  }

  const localizeBatch = (batch?: string) => {
    if (!batch) return isEn ? "3rd Batch 2026" : isBis ? "3rd Batch 2026" : "Ika-3 Batch 2026"
    if (isEn) return batch
    return batch
      .replace(/1st Batch/g, isBis ? "1st Batch" : "Ika-1 Batch")
      .replace(/2nd Batch/g, isBis ? "2nd Batch" : "Ika-2 Batch")
      .replace(/3rd Batch/g, isBis ? "3rd Batch" : "Ika-3 Batch")
      .replace(/4th Batch/g, isBis ? "4th Batch" : "Ika-4 Batch")
  }

  const getLocalizedCourse = (course: TrainingCourse): TrainingCourse => {
    const loc = COURSE_LOCALIZATIONS[course.id]
    if (!loc) return course
    const langKey = isEn ? "en" : isBis ? "bis" : "tl"
    return {
      ...course,
      title: loc.title ? loc.title[langKey] : course.title,
      description: loc.description[langKey] || course.description,
    }
  }

  const [activeApplication, setActiveApplication] = useState<TrainingApplicationRecord | null>(null)
  const [allUserApplications, setAllUserApplications] = useState<TrainingApplicationRecord[]>([])

  const [applyCourseId, setApplyCourseId] = useState<string>("tr-bread-pastry")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formStep, setFormStep] = useState<"select" | "profile" | "review">("select")
  const [isAttested, setIsAttested] = useState(false)
  const [isRevising, setIsRevising] = useState(false)

  const [certificateModalApp, setCertificateModalApp] = useState<TrainingApplicationRecord | null>(null)

  const profile: LoggedInUserProfile = getCurrentUserProfile()
  const userQcid = getLoggedInUserQcid() || profile.qcidNo || "110000116932100"

  // Step 2: Form Details State
  const [civilStatus, setCivilStatus] = useState<string>("Single")
  const [sex, setSex] = useState<string>(profile.sex || "Female")
  const [dateOfBirth, setDateOfBirth] = useState<string>(profile.birthDate || "1998-05-12")
  const [age, setAge] = useState<string | number>(profile.age || 26)
  const [completeAddress, setCompleteAddress] = useState<string>(
    `${profile.houseNo || ""} ${profile.street || ""}, Brgy. ${profile.barangay || "Sauyo"}, Quezon City`.trim()
  )
  const [barangay, setBarangay] = useState<string>(profile.barangay || "Sauyo")

  // II. Educational Background
  const [highestEducation, setHighestEducation] = useState<string>("Senior High School")
  const [schoolInstitution, setSchoolInstitution] = useState<string>("")

  // III. Training Purpose
  const [trainingPurpose, setTrainingPurpose] = useState<string>("Skills Development")
  const [otherPurpose, setOtherPurpose] = useState<string>("")
  const [reasonForApplying, setReasonForApplying] = useState<string>("")

  // V. Previous Training / Experience
  const [hasAttendedTraining, setHasAttendedTraining] = useState<string>("No")
  const [previousTrainingCourse, setPreviousTrainingCourse] = useState<string>("")
  const [previousYearCompleted, setPreviousYearCompleted] = useState<string>("")

  // IV. Requirements (Supporting Documents)
  const [requestLetterDoc, setRequestLetterDoc] = useState<{ file: File | null; dataUrl: string; name: string } | null>(null)
  const [qcIdDoc, setQcIdDoc] = useState<{ file: File | null; dataUrl: string; name: string } | null>(null)
  const [idPicDoc, setIdPicDoc] = useState<{ file: File | null; dataUrl: string; name: string } | null>(null)
  const [cameraModalDocType, setCameraModalDocType] = useState<"requestLetter" | "qcId" | "idPic" | null>(null)
  const [sampleDocModal, setSampleDocModal] = useState<{
    title: string
    label: string
    description?: string
    image: string
  } | null>(null)

  const fetchTrainingData = async () => {
    try {

      try {
        const resProg = await fetch(`${API_BASE}/api/training/programs`)
        if (resProg.ok) {
          const data = await resProg.json()
          if (data.success && Array.isArray(data.programs) && data.programs.length > 0) {
            setCourses(data.programs)
          }
        }
      } catch (_) {}

      try {
        const resApps = await fetch(`${API_BASE}/api/training/applications?qcid=${userQcid}`)
        if (resApps.ok) {
          const data = await resApps.json()
          if (data.success && Array.isArray(data.applications)) {
            const userApps = data.applications.filter(
              (a: any) =>
                a.qcid === userQcid ||
                a.userId === userQcid ||
                a.referenceNumber === userQcid ||
                a.referenceNumber?.startsWith(`${userQcid}-`) ||
                a.applicantInfo?.email?.toLowerCase() === profile.email?.toLowerCase()
            )
            setAllUserApplications(userApps)
            if (userApps.length > 0) {
              const ongoing = userApps.find((a: any) => a.status !== "rejected" && !a.attendance?.completed)
              setActiveApplication((prev) => {
                if (prev) {
                  const refreshed = userApps.find((a: any) => String(a.id) === String(prev.id) || a.referenceNumber === prev.referenceNumber)
                  if (refreshed) return refreshed
                }
                return ongoing || userApps[0]
              })
              return
            }
          }
        }
      } catch (_) {}

      const local = JSON.parse(localStorage.getItem("training_applications") || "[]")
      if (Array.isArray(local) && local.length > 0) {
        const match = local.filter(
          (a: any) =>
            a.qcid === userQcid ||
            a.userId === userQcid ||
            a.referenceNumber === userQcid ||
            a.referenceNumber?.startsWith(`${userQcid}-`) ||
            a.applicantInfo?.email?.toLowerCase() === profile.email?.toLowerCase()
        )
        setAllUserApplications(match)
        if (match.length > 0) {
          const ongoing = match.find((a: any) => a.status !== "rejected" && !a.attendance?.completed)
          setActiveApplication((prev) => {
            if (prev) {
              const refreshed = match.find((a: any) => String(a.id) === String(prev.id) || a.referenceNumber === prev.referenceNumber)
              if (refreshed) return refreshed
            }
            return ongoing || match[0]
          })
          return
        }
      }
    } catch (e) {
      console.error("Failed to load training data:", e)
    }
  }

  useEffect(() => {
    fetchTrainingData()
    const interval = setInterval(fetchTrainingData, 8000)
    return () => clearInterval(interval)
  }, [userQcid])

  const getCourseIcon = (id: string) => {
    if (id.includes("bread") || id.includes("pastry")) return <ChefHat className="h-6 w-6 text-amber-600" />
    if (id.includes("barista")) return <Coffee className="h-6 w-6 text-amber-700" />
    if (id.includes("computer") || id.includes("call-center")) return <Headphones className="h-6 w-6 text-blue-600" />
    if (id.includes("hairdressing")) return <Scissors className="h-6 w-6 text-purple-600" />
    if (id.includes("beauty")) return <Sparkles className="h-6 w-6 text-pink-600" />
    if (id.includes("dressmaking") || id.includes("sewing")) return <Scissors className="h-6 w-6 text-indigo-600" />
    if (id.includes("housekeeping")) return <Home className="h-6 w-6 text-emerald-600" />
    if (id.includes("health")) return <HeartPulse className="h-6 w-6 text-rose-600" />
    if (id.includes("welding")) return <Flame className="h-6 w-6 text-orange-600" />
    if (id.includes("food") || id.includes("catering")) return <UtensilsCrossed className="h-6 w-6 text-emerald-600" />
    return <Laptop className="h-6 w-6 text-blue-600" />
  }

  const handleOpenDetails = (course: TrainingCourse) => {
    setSelectedCourse(course)
    setIsDetailModalOpen(true)
  }

  const hasActiveOngoingTraining = Boolean(
    allUserApplications.some(
      (a) => a.status !== "rejected" && !a.attendance?.completed
    )
  )

  const handleSelectToApply = (course: TrainingCourse) => {
    if (hasActiveOngoingTraining) {
      const activeRunning = allUserApplications.find((a) => a.status !== "rejected" && !a.attendance?.completed)
      alert(
        isEn
          ? `You currently have an active training program (${activeRunning?.trainingName || activeApplication?.trainingName}). You can enroll in a new training course once your current training is completed and certified.`
          : isBis
          ? `Aduna kay aktibong training karon (${activeRunning?.trainingName || activeApplication?.trainingName}). Makapa-enroll ka sa bag-ong kurso kung mahuman na nimo ang imong kasamtangang pagbansay.`
          : `May kasalukuyan kang aktibong training program (${activeRunning?.trainingName || activeApplication?.trainingName}). Maaari ka lamang mag-apply sa panibagong kurso kapag natapos mo na ang iyong kasalukuyang pagsasanay at nakuha ang iyong sertipiko.`
      )
      return
    }
    setSelectedCourse(course)
    setApplyCourseId(course.id)
    setIsDetailModalOpen(false)
    setIsRevising(true)
    setActiveTab("apply")
    setFormStep("profile")
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAttested) {
      alert(
        isEn
          ? "Please check the confirmation box before submitting your application."
          : isBis
          ? "Palihug i-tsek ang kumpirmasyon sa dili pa isumite ang aplikasyon."
          : "Paki-tsek ang kumpirmasyon bago isumite ang aplikasyon."
      )
      return
    }

    setIsSubmitting(true)
    const rawMatched = courses.find((c) => c.id === applyCourseId) || courses[0]
    const matched = getLocalizedCourse(rawMatched)

    const payload = {
      trainingId: matched.id,
      trainingName: matched.title,
      qcid: userQcid,
      applicantInfo: {
        fullName: `${profile.firstName} ${profile.middleName ? profile.middleName + " " : ""}${profile.lastName} ${profile.suffix || ""}`.trim(),
        firstName: profile.firstName,
        middleName: profile.middleName || "",
        lastName: profile.lastName,
        suffix: profile.suffix || "",
        email: profile.email || "resident@quezoncity.gov.ph",
        contactNo: profile.contactNo || profile.mobileNumber || "09172345678",
        dateOfBirth: dateOfBirth || profile.birthDate || "1998-05-12",
        age: age || profile.age || 26,
        sex: sex || profile.sex || "Female",
        civilStatus: civilStatus || "Single",
        completeAddress: completeAddress || `${profile.houseNo || ""} ${profile.street || ""}, Brgy. ${profile.barangay || "Sauyo"}, Quezon City`.trim(),
        address: completeAddress || `${profile.houseNo || ""} ${profile.street || ""}, Brgy. ${profile.barangay || "Sauyo"}, Quezon City`.trim(),
        barangay: barangay || profile.barangay || "Sauyo",
        city: "Quezon City",
        highestEducation: highestEducation || "Senior High School",
        schoolInstitution: schoolInstitution || "Quezon City School",
        trainingPurpose: trainingPurpose === "Other" && otherPurpose ? `Other: ${otherPurpose}` : trainingPurpose,
        reasonForApplying: reasonForApplying || "",
        hasAttendedTraining: hasAttendedTraining || "No",
        previousTrainingCourse: hasAttendedTraining === "Yes" ? previousTrainingCourse : "",
        previousYearCompleted: hasAttendedTraining === "Yes" ? previousYearCompleted : "",
        documents: {
          requestLetter: requestLetterDoc?.name || null,
          qcIdProof: qcIdDoc?.name || null,
          idPicProof: idPicDoc?.name || null,
        },
      },
    }

    try {
      const res = await fetch(`${API_BASE}/api/training/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.application) {
          const newApp = data.application
          setActiveApplication(newApp)
          setAllUserApplications((prev) => [newApp, ...prev.filter((a) => String(a.id) !== String(newApp.id) && a.referenceNumber !== newApp.referenceNumber)])

          const existing = JSON.parse(localStorage.getItem("training_applications") || "[]")
          const filtered = existing.filter((a: any) => String(a.id) !== String(newApp.id) && a.referenceNumber !== newApp.referenceNumber)
          localStorage.setItem("training_applications", JSON.stringify([newApp, ...filtered]))
        }
      } else {

        const candidateSuffix = allUserApplications.length > 0 ? `-${allUserApplications.length}` : ""
        const fallbackApp: TrainingApplicationRecord = {
          id: Date.now(),
          referenceNumber: `${userQcid}${candidateSuffix}`,
          qcid: userQcid,
          trainingId: matched.id,
          trainingName: matched.title,
          applicantInfo: payload.applicantInfo,
          status: "pending",
          submittedAt: new Date().toISOString(),
          schedule: {
            trainingName: matched.title,
            trainingDate: matched.date,
            trainingTime: matched.time,
            trainingLocation: matched.location,
            landmark: matched.landmark,
            trainingStatus: "Upcoming",
          },
          attendance: {
            totalHours: matched.durationHours,
            hoursCompleted: 0,
            completed: false,
            sessions: [
              { day: 1, topic: "Orientation & Fundamental Skills", attended: false, date: matched.date.split("-")[0]?.trim() || "Day 1" },
              { day: 2, topic: "Hands-on Application & Laboratory Work", attended: false, date: "Day 2" },
              { day: 3, topic: "Specialized Techniques & Practical Assessment", attended: false, date: "Day 3" },
              { day: 4, topic: "Final Evaluation, Livelihood Integration & Completion", attended: false, date: matched.date.split("-")[1]?.trim() || "Day 4" },
            ],
          },
          certificate: null,
        }
        setActiveApplication(fallbackApp)
        setAllUserApplications((prev) => [fallbackApp, ...prev])
        const existing = JSON.parse(localStorage.getItem("training_applications") || "[]")
        localStorage.setItem("training_applications", JSON.stringify([fallbackApp, ...existing]))
      }
    } catch (err) {
      console.error("Submit application error:", err)
    } finally {
      setIsSubmitting(false)
      setIsRevising(false)
      setActiveTab("apply")
    }
  }

  const handleUserCheckin = async (dayNumber: number) => {
    if (!activeApplication) return
    const currentSessions = activeApplication.attendance?.sessions || [
      { day: 1, topic: "Orientation & Fundamental Skills", hours: 3, attended: false, date: "Day 1" },
      { day: 2, topic: "Hands-on Application & Practical Work", hours: 3, attended: false, date: "Day 2" },
      { day: 3, topic: "Specialized Techniques & Practical Assessment", hours: 3, attended: false, date: "Day 3" },
      { day: 4, topic: "Final Evaluation, Livelihood Integration & Completion", hours: 3, attended: false, date: "Day 4" },
    ]

    const targetSession = currentSessions.find((s) => s.day === dayNumber)
    if (targetSession && targetSession.attended) {
      return
    }

    const updatedSessions = currentSessions.map((s) => {
      if (s.day === dayNumber) {
        return { ...s, attended: true }
      }
      return s
    })

    const attendedCount = updatedSessions.filter((s) => s.attended).length
    const hoursCompleted = attendedCount * 3
    const isComplete = attendedCount === updatedSessions.length || hoursCompleted >= (activeApplication.attendance?.totalHours || 12)

    const updated: TrainingApplicationRecord = {
      ...activeApplication,
      attendance: {
        ...activeApplication.attendance,
        totalHours: activeApplication.attendance?.totalHours || 12,
        sessions: updatedSessions,
        hoursCompleted,
        completed: isComplete,
      },
      schedule: {
        ...activeApplication.schedule,
        trainingStatus: isComplete ? "Completed" : attendedCount > 0 ? "Ongoing" : "Upcoming",
      },
      certificate: isComplete
        ? activeApplication.certificate || {
            certificateNo: `GOV-CERT-2026-${Math.floor(10000 + Math.random() * 90000)}`,
            issueDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            title: `Certificate of Completion in ${activeApplication.trainingName}`,
            recipientName: activeApplication.applicantInfo?.fullName || "Resident Beneficiary",
            trainingName: activeApplication.trainingName,
            hoursCompleted: 12,
            status: "Issued",
          }
        : null,
    }

    setActiveApplication(updated)
    setAllUserApplications((prev) => {
      const exists = prev.some((a) => String(a.id) === String(updated.id) || a.referenceNumber === updated.referenceNumber)
      const list = exists
        ? prev.map((a) => (String(a.id) === String(updated.id) || a.referenceNumber === updated.referenceNumber ? updated : a))
        : [updated, ...prev]
      try {
        localStorage.setItem("training_applications", JSON.stringify(list))
        window.dispatchEvent(new Event("storage"))
      } catch (_) {}
      return list
    })

    try {
      await fetch(`${API_BASE}/api/training/applications/${updated.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updated.status,
          attendance: updated.attendance,
          trainingStatus: updated.schedule?.trainingStatus,
          approvedBy: updated.approvedBy || "Gov Services Skills Development Division",
        }),
      })
    } catch (_) {}

    notifyApplicationChange(isComplete ? "APPLICATION_APPROVED" : "STATUS_CHANGED", "livelihood", updated.referenceNumber)
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {isEn ? "APPROVED" : isBis ? "NAAPROBAHAN" : "NAAPRUBAHAN"}
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            {isEn ? "REJECTED" : isBis ? "GIBALIBARAN" : "HINDI NAAPRUBAHAN"}
          </span>
        )
      case "needs_revision":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            {isEn ? "NEEDS REVISION" : isBis ? "KINAHANGLAN OG PAG-USAB" : "KAILANGAN NG PAG-EDIT"}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            <Clock3 className="h-3.5 w-3.5 text-blue-600" />
            {isEn ? "PENDING / UNDER REVIEW" : isBis ? "NAGPAABOT SA PAGSUSI" : "KASALUKUYANG SINUSURI"}
          </span>
        )
    }
  }

  const completedTrainings = allUserApplications.filter((a) => a.attendance?.completed || a.schedule?.trainingStatus === "Completed" || a.certificate)

  return (
    <div className="space-y-6">
      {}
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white tracking-wide uppercase">
                {isEn ? "Gov Services" : isBis ? "Gov Services" : "Gov Services"}
              </span>
              <span className="text-xs text-muted-foreground">
                {isEn ? "Livelihood & Training Program Sub-Module" : isBis ? "Sub-Module sa Panginabuhi ug Pagsasanay" : "Sub-Module ng Kabuhayan at Pagsasanay"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {isEn ? "Gov Services Skills Training Program" : isBis ? "Gov Services Programa sa Pagbansay" : "Gov Services Programa sa Pagsasanay at Kasanayan"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              {isEn
                ? "Free skills training and certification for residents. Gain NC II/Skills credentials for livelihood capital assistance and employment opportunities."
                : isBis
                ? "Libreng bansay sa kahanas ug sertipikasyon alang sa mga residente. Pagkuha og NC II/Skills certificate alang sa ayuda sa panginabuhi ug trabaho."
                : "Libreng skills training at sertipikasyon para sa mga residente. Kumuha ng NC II/Skills certificate para sa livelihood assistance at hanapbuhay."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchTrainingData}
              className="p-2 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title={isEn ? "Refresh data" : isBis ? "I-refresh ang datos" : "I-refresh ang data"}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {activeApplication && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {isEn ? "Current Application" : isBis ? "Kasamtangang Aplikasyon" : "Kasalukuyang Aplikasyon"}
                </p>
                <div className="mt-0.5">{renderStatusBadge(activeApplication.status)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="bg-card border border-border rounded-2xl p-1.5 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {}
          <button
            type="button"
            onClick={() => setActiveTab("available")}
            id="tab-available-training"
            className={`px-3 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "available"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>{isEn ? "1. AVAILABLE TRAINING" : isBis ? "1. MGA BUKAS NGA PAGBANSAY" : "1. MGA BUKAS NA PAGSASANAY"}</span>
          </button>

          {}
          <button
            type="button"
            onClick={() => setActiveTab("apply")}
            id="tab-apply-training"
            className={`px-3 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "apply"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <FileEdit className="h-4 w-4 shrink-0" />
            <span>{isEn ? "2. APPLY FOR TRAINING" : isBis ? "2. MAG-APPLY SA PAGBANSAY" : "2. MAG-APPLY SA PAGSASANAY"}</span>
          </button>

          {}
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            id="tab-training-schedule"
            className={`px-3 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "schedule"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{isEn ? "3. TRAINING SCHEDULE" : isBis ? "3. ISKEDYUL SA PAGBANSAY" : "3. ISKEDYUL NG PAGSASANAY"}</span>
          </button>

          {}
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            id="tab-training-history"
            className={`px-3 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "history"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Award className="h-4 w-4 shrink-0" />
            <span>{isEn ? "4. TRAINING HISTORY" : isBis ? "4. KASAYSAYAN SA PAGBANSAY" : "4. KASAYSAYAN NG PAGSASANAY"}</span>
          </button>
        </div>
      </div>

      {}
      {}
      {}
      {activeTab === "available" && (
        <div className="space-y-6">
          {}
          {hasActiveOngoingTraining && (
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-200 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">
                    Active Training in Progress: {activeApplication?.trainingName}
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Only one active training program is allowed at a time. Please complete all 4 daily sessions (12 hours) and receive your Certificate of Completion before applying for a new course.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab(activeApplication?.status === "approved" ? "schedule" : "apply")}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 shadow-xs cursor-pointer flex items-center justify-center gap-1.5 text-xs"
              >
                <span>View Training Progress</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {isEn ? "Available Training Programs" : isBis ? "Mga Bukas nga Pagbansay" : "Mga Bukas na Pagsasanay"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isEn
                  ? "Choose a training program suited to your interest and schedule before applying."
                  : isBis
                  ? "Pilia ang programa sa pagbansay nga angay sa imong interes ug iskedyul sa dili pa mag-apply."
                  : "Pumili ng training program na angkop sa iyong interes at schedule bago mag-apply."}
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 w-fit">
              {courses.length} {isEn ? "Open Programs" : isBis ? "Bukas nga Programa" : "Bukas na Programa"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((rawCourse) => {
              const course = getLocalizedCourse(rawCourse)

              const allStoredApps: TrainingApplicationRecord[] = (() => {
                try {
                  const stored = localStorage.getItem("training_applications")
                  return stored ? JSON.parse(stored) : []
                } catch {
                  return []
                }
              })()

              const courseApps = allStoredApps.filter(
                (a) =>
                  (a.trainingId === course.id ||
                    a.trainingName?.toLowerCase() === course.title?.toLowerCase() ||
                    a.schedule?.trainingName?.toLowerCase() === course.title?.toLowerCase()) &&
                  a.status !== "rejected"
              )

              const enrolledCount = Math.max(
                courseApps.length,
                course.enrolledCount || 0
              )
              const totalSlots = course.totalSlots || 25
              const availableSlots = Math.max(0, totalSlots - enrolledCount)

              const isUserEnrolledInThis = allUserApplications.some(
                (a) =>
                  (a.trainingId === course.id ||
                    a.trainingName?.toLowerCase() === course.title?.toLowerCase() ||
                    a.schedule?.trainingName?.toLowerCase() === course.title?.toLowerCase()) &&
                  a.status !== "rejected"
              )

              const isBlockedByOngoingOtherTraining = hasActiveOngoingTraining && !isUserEnrolledInThis

              return (
                <div
                  key={course.id}
                  className={`bg-card border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                    isUserEnrolledInThis ? "border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20" : "border-border"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center border border-border shrink-0 group-hover:scale-105 transition-transform">
                          {getCourseIcon(course.id)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-base text-foreground group-hover:text-blue-600 transition-colors">
                              {course.title}
                            </h4>
                            {isUserEnrolledInThis && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300">
                                {isEn ? "ENROLLED" : isBis ? "NAKA-ENROLL" : "NAKA-ENROLL"}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {localizeDuration(course.duration)}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap ${
                          availableSlots === 0
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            : availableSlots < totalSlots
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        }`}
                      >
                        {availableSlots === 0
                          ? isEn
                            ? "Full (0 slots left)"
                            : isBis
                            ? "Puno na (0 slots)"
                            : "Puno na (0 slots)"
                          : availableSlots < totalSlots
                          ? `${availableSlots} ${isEn ? "slots left" : isBis ? "slot nahabilin" : "slots natitira"}`
                          : `${totalSlots} ${isEn ? "slots" : isBis ? "ka slot" : "slots"}`}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Training Schedule Details (Requested replacement) */}
                    <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span>
                          <strong className="text-foreground">
                            {isEn ? "Training Batch:" : isBis ? "Batch sa Pagbansay:" : "Batch ng Pagsasanay:"}
                          </strong>{" "}
                          {localizeBatch(course.batch)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>
                          <strong className="text-foreground">
                            {isEn ? "Application Opens:" : isBis ? "Bukas ang Aplikasyon:" : "Bukas ang Aplikasyon:"}
                          </strong>{" "}
                          {localizeDateStr(course.applicationOpens || "July 1, 2026")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>
                          <strong className="text-foreground">
                            {isEn ? "Application Deadline:" : isBis ? "Kataposang Adlaw:" : "Huling Araw ng Aplikasyon:"}
                          </strong>{" "}
                          {localizeDateStr(course.applicationDeadline || "July 15, 2026")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span>
                          <strong className="text-foreground">
                            {isEn ? "Training Starts:" : isBis ? "Pagsugod sa Pagbansay:" : "Simula ng Pagsasanay:"}
                          </strong>{" "}
                          {localizeDateStr(course.trainingStarts || "August 1 - 30, 2026")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="grid grid-cols-2 gap-2 pt-4 mt-2 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(course)}
                      className="px-3 py-2 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 text-foreground text-xs font-semibold transition-all cursor-pointer text-center"
                    >
                      {isEn ? "View Details" : isBis ? "Tan-awa ang Detalye" : "Tingnan ang Detalye"}
                    </button>
                    {isUserEnrolledInThis ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab(activeApplication?.status === "approved" ? "schedule" : "apply")}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{isEn ? "View Status" : isBis ? "Tan-awa ang Status" : "Tingnan ang Status"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : isBlockedByOngoingOtherTraining ? (
                      <button
                        type="button"
                        disabled
                        title={isEn ? "Complete your active training first before applying for another course" : "Kumpletuhin muna ang kasalukuyang training bago mag-apply sa iba"}
                        className="px-3 py-2 rounded-xl bg-muted/60 text-muted-foreground border border-border/70 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60"
                      >
                        <span>{isEn ? "In Training" : isBis ? "Ga-training Pa" : "Nagsasanay Pa"}</span>
                      </button>
                    ) : availableSlots === 0 ? (
                      <button
                        type="button"
                        disabled
                        className="px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60"
                      >
                        <span>{isEn ? "Slots Full" : "Puno na ang Slots"}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectToApply(course)}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{isEn ? "Apply Now" : isBis ? "Mag-apply Karon" : "Mag-apply Na"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {}
      {}
      {}
      {activeTab === "apply" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {}
          {allUserApplications.length > 1 && (
            <div className="bg-card border border-border rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                {isEn ? "Your Applications History:" : isBis ? "Imong mga Aplikasyon:" : "Iyong mga Aplikasyon:"}
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {allUserApplications.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      setActiveApplication(app)
                      setIsRevising(false)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeApplication?.id === app.id && !isRevising
                        ? "bg-blue-600 text-white shadow-xs"
                        : "border border-border bg-muted/20 hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <span>{app.trainingName}</span>
                    <span className="text-[10px] font-mono opacity-80">({app.referenceNumber})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {}
          {activeApplication && !isRevising && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {isEn ? "Training Application Status" : isBis ? "Status sa Aplikasyon sa Pagbansay" : "Status ng Aplikasyon sa Pagsasanay"}
                    </h3>
                    {renderStatusBadge(activeApplication.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isEn ? "Reference Number:" : "Reference Number:"} <span className="font-mono font-bold text-foreground">{activeApplication.referenceNumber}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!hasActiveOngoingTraining && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRevising(true)
                        setFormStep("select")
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isEn ? "Apply for Another Course" : isBis ? "Mag-apply og Bag-ong Kurso" : "Mag-apply ng Bagong Kurso"}</span>
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {isEn ? "Submitted:" : isBis ? "Gisumite:" : "Naisumite:"} {new Date(activeApplication.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {}
              {activeApplication.status === "pending" && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-sm">
                    <Clock3 className="h-4 w-4" />
                    <span>{isEn ? "PENDING / UNDER REVIEW" : isBis ? "NAGPAABOT SA PAGSUSI" : "KASALUKUYANG SINUSURI"}</span>
                  </div>
                  <p className="text-xs text-blue-900/80 dark:text-blue-200 leading-relaxed">
                    {isEn ? (
                      <>
                        Your application for <strong>{activeApplication.trainingName}</strong> is currently under review by the Gov Services Skills Development Coordinator. Please allow 1-2 business days for schedule verification.
                      </>
                    ) : isBis ? (
                      <>
                        Ang imong aplikasyon alang sa <strong>{activeApplication.trainingName}</strong> kasamtangang gisusi sa Gov Services Skills Development Coordinator. Palihug paghulat og 1-2 ka adlaw alang sa beripikasyon.
                      </>
                    ) : (
                      <>
                        Ang inyong aplikasyon para sa <strong>{activeApplication.trainingName}</strong> ay kasalukuyang sinusuri ng Gov Services Skills Development Coordinator. Maghintay ng 1-2 araw para sa beripikasyon at pinal na iskedyul.
                      </>
                    )}
                  </p>
                </div>
              )}

              {activeApplication.status === "approved" && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {activeApplication.attendance?.completed
                        ? isEn
                          ? "COMPLETED – 100% Training Completed & Certified!"
                          : isBis
                          ? "NAHUMAN – 100% Nakompleto ang Pagbansay!"
                          : "NAKUMPLETO – 100% Natapos ang Pagsasanay at Sertipikado!"
                        : isEn
                        ? "APPROVED – Your Training Slot is Confirmed!"
                        : isBis
                        ? "NAAPROBAHAN – Kumpirmado ang imong Training Slot!"
                        : "APPROVED – Kumpirmado ang inyong Training Slot!"}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900/80 dark:text-emerald-200 leading-relaxed">
                    {activeApplication.attendance?.completed ? (
                      isEn ? (
                        <>
                          You have completed all 4 daily sessions in <strong>{activeApplication.trainingName}</strong>. You may view or print your Certificate of Completion in Tab 4, or apply for another training program.
                        </>
                      ) : isBis ? (
                        <>
                          Nahuman nimo ang tanang 4 ka adlaw sa <strong>{activeApplication.trainingName}</strong>. Mahimo nimong tan-awon ang imong sertipiko sa Tab 4 o mag-apply sa laing kurso.
                        </>
                      ) : (
                        <>
                          Natapos mo ang lahat ng 4 na araw sa <strong>{activeApplication.trainingName}</strong>. Maaari mong tingnan o i-print ang iyong Certificate of Completion sa Tab 4, o mag-apply sa panibagong kurso.
                        </>
                      )
                    ) : isEn ? (
                      <>
                        You may now attend <strong>{activeApplication.trainingName}</strong>. Your assigned schedule is below and you can track your live session attendance in Tab 3.
                      </>
                    ) : isBis ? (
                      <>
                        Mahimo ka nang moapil sa <strong>{activeApplication.trainingName}</strong>. Gitakda ang imong iskedyul sa ubos ug mahimo nimong subayon ang imong attendance sa Tab 3.
                      </>
                    ) : (
                      <>
                        Maaari ka nang sumali sa <strong>{activeApplication.trainingName}</strong>. Nakatakda ang iyong schedule sa ibaba at maaari mong subaybayan ang iyong attendance sa Tab 3.
                      </>
                    )}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setActiveTab("schedule")}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer w-fit"
                    >
                      <span>{isEn ? "Go to Training Schedule" : isBis ? "Adto sa Iskedyul sa Pagbansay" : "Pumunta sa Training Schedule"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    {activeApplication.attendance?.completed && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("history")
                          setCertificateModalApp(activeApplication)
                        }}
                        className="px-4 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Award className="h-4 w-4" />
                        <span>{isEn ? "View Certificate" : "Tingnan ang Sertipiko"}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeApplication.status === "rejected" && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                    <XCircle className="h-4 w-4" />
                    <span>{isEn ? "APPLICATION REJECTED" : isBis ? "GIBALIBARAN ANG APLIKASYON" : "HINDI NAAPRUBAHAN ANG APLIKASYON"}</span>
                  </div>
                  <p className="text-xs text-rose-900/80 dark:text-rose-200 leading-relaxed">
                    {isEn ? "Reason:" : isBis ? "Rason:" : "Dahilan:"} {activeApplication.rejectionReason || (isEn ? "Did not meet residency requirements or slots for this batch are full." : "Hindi pumasok sa residency validation o puno na ang slots sa naturang batch.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRevising(true)
                      setFormStep("select")
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer w-fit"
                  >
                    {isEn ? "Apply for Another Course" : isBis ? "Mag-apply sa Laing Kurso" : "Mag-apply sa Ibang Kurso"}
                  </button>
                </div>
              )}

              {}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/20 p-4 rounded-xl border border-border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">{isEn ? "Selected Program:" : isBis ? "Napiling Programa:" : "Napiling Programa:"}</span>
                  <span className="font-bold text-foreground">{activeApplication.trainingName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">{isEn ? "Applicant Name:" : isBis ? "Ngalan sa Aplikante:" : "Pangalan ng Aplikante:"}</span>
                  <span className="font-bold text-foreground">{activeApplication.applicantInfo?.fullName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">{isEn ? "QC ID Number:" : "QC ID Number:"}</span>
                  <span className="font-mono font-bold text-foreground">{activeApplication.qcid}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">{isEn ? "Contact & Barangay:" : "Contact & Barangay:"}</span>
                  <span className="font-semibold text-foreground">{activeApplication.applicantInfo?.contactNo} • Brgy. {activeApplication.applicantInfo?.barangay}</span>
                </div>
              </div>
            </div>
          )}

          {}
          {(!activeApplication || isRevising) && (
            <form onSubmit={handleSubmitApplication} className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
              {/* Stepper Header (Full Width Clean Layout) */}
              <div className="border-b border-border pb-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h3 className="text-xl font-bold text-foreground">
                    {isEn ? "Apply for Training Program" : isBis ? "Mag-apply sa Programa sa Pagbansay" : "Mag-apply sa Programa ng Pagsasanay"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isEn
                      ? "Complete applicant details and requirements for skills training."
                      : isBis
                      ? "Kompletuha ang impormasyon sa aplikante ug mga dokumento."
                      : "Kumpletuhin ang impormasyon ng aplikante at mga dokumento."}
                  </p>
                </div>

                {/* Full-width Responsive Stepper Bar (Non-clickable progress indicators) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1 select-none">
                  <div
                    className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      formStep === "select"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : formStep === "profile" || formStep === "review"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-muted/40 text-muted-foreground border-border"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        formStep === "select"
                          ? "bg-white text-blue-600"
                          : formStep === "profile" || formStep === "review"
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-foreground border border-border"
                      }`}
                    >
                      {formStep === "profile" || formStep === "review" ? "✓" : "1"}
                    </span>
                    <span className="truncate">{isEn ? "Course" : "Kurso"}</span>
                  </div>

                  <div
                    className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      formStep === "profile"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : formStep === "review"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-muted/40 text-muted-foreground border-border"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        formStep === "profile"
                          ? "bg-white text-blue-600"
                          : formStep === "review"
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-foreground border border-border"
                      }`}
                    >
                      {formStep === "review" ? "✓" : "2"}
                    </span>
                    <span className="truncate">{isEn ? "Applicant Info" : "Impormasyon"}</span>
                  </div>

                  <div
                    className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      formStep === "review"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-muted/40 text-muted-foreground border-border"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        formStep === "review" ? "bg-white text-blue-600" : "bg-muted text-foreground border border-border"
                      }`}
                    >
                      3
                    </span>
                    <span className="truncate">{isEn ? "Requirements" : "Dokumento"}</span>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* STEP 1: COURSE SELECTION */}
              {/* ======================================================== */}
              {formStep === "select" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                      {isEn ? "Step 1. Selected Training Program" : isBis ? "Step 1. Napiling Kurso sa Pagbansay" : "Step 1. Napiling Kursong Pagsasanay"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab("available")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      {isEn ? "Change Course →" : isBis ? "Ilisi ang Kurso →" : "Palitan ang Kurso →"}
                    </button>
                  </div>

                  {(() => {
                    const rawCourse = courses.find((c) => c.id === applyCourseId) || courses[0]
                    const selectedCourse = getLocalizedCourse(rawCourse)
                    return (
                      <div className="p-5 rounded-2xl border-2 border-blue-600/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs space-y-3">
                        <div className="flex items-center gap-3.5">
                          <div className="p-3 rounded-xl bg-card border border-blue-200 dark:border-blue-800 shadow-xs">
                            {getCourseIcon(selectedCourse.id)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-bold text-foreground">{selectedCourse.title}</h4>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white">
                                {isEn ? "Selected" : "Napili"}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                              {localizeDuration(selectedCourse.duration)}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedCourse.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-border/60 text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <span><strong className="text-foreground">{isEn ? "Training Batch:" : "Batch ng Pagsasanay:"}</strong> {localizeBatch(selectedCourse.batch)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span><strong className="text-foreground">{isEn ? "Application Opens:" : "Bukas ang Aplikasyon:"}</strong> {localizeDateStr(selectedCourse.applicationOpens || "July 1, 2026")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span><strong className="text-foreground">{isEn ? "Application Deadline:" : "Huling Araw:"}</strong> {localizeDateStr(selectedCourse.applicationDeadline || "July 15, 2026")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                            <span><strong className="text-foreground">{isEn ? "Training Starts:" : "Simula ng Pagsasanay:"}</strong> {localizeDateStr(selectedCourse.trainingStarts || "August 1 - 30, 2026")}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  <div className="pt-3 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setFormStep("profile")}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>{isEn ? "Continue to Applicant Information" : isBis ? "Padayon sa Impormasyon sa Aplikante" : "Magpatuloy sa Impormasyon ng Aplikante"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 2: APPLICANT INFORMATION & BACKGROUND (I, II, III, V) */}
              {/* ======================================================== */}
              {formStep === "profile" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* I. APPLICANT INFORMATION */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                          I. {isEn ? "Applicant Information" : "Impormasyon ng Aplikante"}
                        </h4>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {isEn ? "Auto-filled from QCID" : "Naka-autofill mula sa QCID"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      {/* Full Name (Locked) */}
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{isEn ? "Full Name" : "Buong Pangalan"}</span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={`${profile.firstName} ${profile.middleName ? profile.middleName + " " : ""}${profile.lastName} ${profile.suffix || ""}`.trim()}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border text-foreground font-semibold cursor-not-allowed select-none opacity-85 shadow-xs"
                        />
                      </div>

                      {/* QC ID (Locked) */}
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>QC ID / Reference Number</span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={userQcid}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border font-mono font-bold text-foreground cursor-not-allowed select-none opacity-85 shadow-xs"
                        />
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          {isEn ? "Date of Birth" : "Petsa ng Kapanganakan"}
                        </label>
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                        />
                      </div>

                      {/* Age */}
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          {isEn ? "Age" : "Edad"}
                        </label>
                        <input
                          type="number"
                          min="15"
                          max="100"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                        />
                      </div>

                      {/* Sex (Dropdown) */}
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          {isEn ? "Sex" : "Kasarian"}
                        </label>
                        <select
                          value={sex}
                          onChange={(e) => setSex(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs cursor-pointer"
                        >
                          <option value="Male">{isEn ? "Male" : "Lalaki"}</option>
                          <option value="Female">{isEn ? "Female" : "Babae"}</option>
                        </select>
                      </div>

                      {/* Civil Status (Dropdown) */}
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          {isEn ? "Civil Status" : "Katayuang Sibil (Civil Status)"}
                        </label>
                        <select
                          value={civilStatus}
                          onChange={(e) => setCivilStatus(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs cursor-pointer"
                        >
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Widowed">Widowed</option>
                          <option value="Separated">Separated</option>
                        </select>
                      </div>

                      {/* Contact Number (Locked) */}
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{isEn ? "Contact Number" : "Numero ng Telepono"}</span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={profile.contactNo || profile.mobileNumber || "0917 234 5678"}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border text-foreground font-semibold cursor-not-allowed select-none opacity-85 shadow-xs"
                        />
                      </div>

                      {/* Email Address (Locked) */}
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Email Address</span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={profile.email || "resident@quezoncity.gov.ph"}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border text-foreground cursor-not-allowed select-none opacity-85 shadow-xs truncate"
                        />
                      </div>

                      {/* Barangay */}
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          Barangay
                        </label>
                        <input
                          type="text"
                          value={barangay}
                          onChange={(e) => setBarangay(e.target.value)}
                          placeholder="e.g. Batasan Hills"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                        />
                      </div>

                      {/* Complete Address */}
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          {isEn ? "Complete Address" : "Kumpletong Tirahan"}
                        </label>
                        <input
                          type="text"
                          value={completeAddress}
                          onChange={(e) => setCompleteAddress(e.target.value)}
                          placeholder="House No., Street, Subdivision/Area"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* II. EDUCATIONAL BACKGROUND */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        II. {isEn ? "Educational Background" : "Pinag-aralan / Educational Background"}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          {isEn ? "Highest Educational Attainment" : "Pinakamataas na Antas ng Edukasyon"}
                        </label>
                        <select
                          value={highestEducation}
                          onChange={(e) => setHighestEducation(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs cursor-pointer"
                        >
                          <option value="Elementary">Elementary</option>
                          <option value="Junior High School">Junior High School</option>
                          <option value="Senior High School">Senior High School</option>
                          <option value="ALS">Alternative Learning System (ALS)</option>
                          <option value="College">College</option>
                          <option value="Vocational/Technical">Vocational / Technical</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          {isEn ? "School / Institution" : "Paaralan / Institusyon"}
                        </label>
                        <input
                          type="text"
                          value={schoolInstitution}
                          onChange={(e) => setSchoolInstitution(e.target.value)}
                          placeholder={isEn ? "e.g. Batasan Hills National High School" : "Hal. Batasan Hills National High School"}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* III. TRAINING PURPOSE */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <Target className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        III. {isEn ? "Training Purpose" : "Layunin sa Pagsasanay"}
                      </h4>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold text-muted-foreground mb-1.5">
                            {isEn ? "Why are you applying for the training?" : "Bakit ka nag-a-apply sa pagsasanay na ito?"}
                          </label>
                          <select
                            value={trainingPurpose}
                            onChange={(e) => setTrainingPurpose(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs cursor-pointer"
                          >
                            <option value="Employment">{isEn ? "Employment (Trabaho / Pagtatrabaho)" : "Employment (Trabaho / Pagtatrabaho)"}</option>
                            <option value="Self-Employment">{isEn ? "Self-Employment (Sariling Hanapbuhay)" : "Self-Employment (Sariling Hanapbuhay)"}</option>
                            <option value="Start/Improve a Small Business">{isEn ? "Start / Improve a Small Business (Pagtatayo o Pagpapalago ng Negosyo)" : "Start / Improve a Small Business (Pagtatayo o Pagpapalago ng Negosyo)"}</option>
                            <option value="Skills Development">{isEn ? "Skills Development (Pagpapalawak ng Kasanayan)" : "Skills Development (Pagpapalawak ng Kasanayan)"}</option>
                            <option value="Other">{isEn ? "Other (Iba pang dahilan)" : "Other (Iba pang dahilan)"}</option>
                          </select>
                        </div>

                        {trainingPurpose === "Other" && (
                          <div className="animate-in fade-in duration-150">
                            <label className="block font-semibold text-muted-foreground mb-1.5">
                              {isEn ? "Please specify other purpose:" : "Tukuyin ang ibang dahilan:"}
                            </label>
                            <input
                              type="text"
                              value={otherPurpose}
                              onChange={(e) => setOtherPurpose(e.target.value)}
                              placeholder={isEn ? "Specify your purpose" : "Ilagay ang iyong partikular na layunin"}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          {isEn ? "Briefly state your reason for applying:" : "Maikling paliwanag sa dahilan ng pag-aapply:"}
                        </label>
                        <textarea
                          rows={3}
                          value={reasonForApplying}
                          onChange={(e) => setReasonForApplying(e.target.value)}
                          placeholder={isEn ? "Provide brief details about your motivation or livelihood plans..." : "Magbigay ng maikling detalye tungkol sa iyong motibasyon o planong pangkabuhayan..."}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* V. PREVIOUS TRAINING / EXPERIENCE */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        V. {isEn ? "Previous Training / Experience" : "Nakaraang Pagsasanay / Karanasan"}
                      </h4>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          {isEn ? "Have you attended a similar skills training before?" : "Nakarating o nakadalo ka na ba sa kahalintulad na skills training dati?"}
                        </label>
                        <select
                          value={hasAttendedTraining}
                          onChange={(e) => setHasAttendedTraining(e.target.value)}
                          className="w-full max-w-xs px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs cursor-pointer"
                        >
                          <option value="No">{isEn ? "No (Hindi pa)" : "No (Hindi pa)"}</option>
                          <option value="Yes">{isEn ? "Yes (Oo, nakadalo na)" : "Yes (Oo, nakadalo na)"}</option>
                        </select>
                      </div>

                      {hasAttendedTraining === "Yes" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 animate-in fade-in duration-150">
                          <div>
                            <label className="block font-semibold text-muted-foreground mb-1.5">
                              {isEn ? "Training / Course Attended:" : "Pangalan ng Kursong Dinaluhan:"}
                            </label>
                            <input
                              type="text"
                              value={previousTrainingCourse}
                              onChange={(e) => setPreviousTrainingCourse(e.target.value)}
                              placeholder="e.g. Basic Baking / Culinary / TESDA SMAW"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-muted-foreground mb-1.5">
                              {isEn ? "Year Completed:" : "Taon Kung Kailan Natapos:"}
                            </label>
                            <input
                              type="text"
                              value={previousYearCompleted}
                              onChange={(e) => setPreviousYearCompleted(e.target.value)}
                              placeholder="e.g. 2024"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation Buttons for Step 2 */}
                  <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setFormStep("select")}
                      className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted/40 text-xs font-bold text-foreground cursor-pointer transition-colors shadow-xs"
                    >
                      {isEn ? "Back" : "Bumalik"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStep("review")}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>{isEn ? "Continue to Requirements & Review" : "Magpatuloy sa Requirements at Review"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 3: REQUIREMENTS (DOCUMENTS) & REVIEW CONFIRMATION */}
              {/* ======================================================== */}
              {formStep === "review" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* IV. REQUIREMENTS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <FolderCheck className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        IV. {isEn ? "Requirements / Supporting Documents" : "Mga Kinakailangang Dokumento (SSDD Requirements)"}
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {/* Document 1: Request Letter */}
                      <div className="border border-border dark:border-slate-800 bg-card/60 dark:bg-slate-900/40 rounded-xl p-5 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <p className="flex items-center gap-1.5 text-sm font-bold text-foreground uppercase tracking-wide">
                            <span>REQUEST LETTER</span>
                            <span className="text-red-500">*</span>
                            {requestLetterDoc && (
                              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white shrink-0 ml-1">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </span>
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setSampleDocModal({
                                title: isEn ? "Sample Request Letter" : "Halimbawa ng Liham Kahilingan (Request Letter)",
                                label: isEn ? "Sample Request Letter / Letter of Intent" : "Sample Request Letter / Letter of Intent",
                                description: isEn
                                  ? "Sample formal request letter addressed to SSDD indicating intent to participate in the skills training program."
                                  : "Halimbawa ng pormal na liham kahilingan na nakadirekta sa SSDD para sa skills training program.",
                                image: "/samples/LETTER OF INTENT.png",
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 text-foreground text-xs font-semibold tracking-wide cursor-pointer transition-colors shadow-xs"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            <span>SAMPLE DOCUMENT</span>
                          </button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          {isEn
                            ? "Attached formal request letter addressed to SSDD / City Mayor."
                            : "Kalakip na liham kahilingan para sa skills training program."}
                        </p>

                        <p className="text-xs text-muted-foreground mt-2">
                          Allowed file types: JPG, JPEG, PNG, WEBP (o kumuha gamit ang Camera)
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          <input
                            type="file"
                            id="upload-request-letter"
                            accept=".jpg,.jpeg,.png,.webp,.pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) {
                                setRequestLetterDoc({ file: f, dataUrl: URL.createObjectURL(f), name: f.name })
                              }
                              e.target.value = ""
                            }}
                          />
                          <label
                            htmlFor="upload-request-letter"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold tracking-wide cursor-pointer hover:bg-blue-700 transition-colors shadow-xs"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>UPLOAD PHOTO</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setCameraModalDocType("requestLetter")}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide cursor-pointer transition-colors shadow-xs"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>TAKE PHOTO (CAMERA)</span>
                          </button>
                        </div>

                        {requestLetterDoc && (
                          <div className="mt-3.5 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs max-w-md">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                                {requestLetterDoc.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setRequestLetterDoc(null)}
                              className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remove"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Document 2: Proof of QC Residency / QC ID */}
                      <div className="border border-border dark:border-slate-800 bg-card/60 dark:bg-slate-900/40 rounded-xl p-5 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <p className="flex items-center gap-1.5 text-sm font-bold text-foreground uppercase tracking-wide">
                            <span>QC ID / PROOF OF QC RESIDENCY</span>
                            <span className="text-red-500">*</span>
                            {qcIdDoc && (
                              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white shrink-0 ml-1">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </span>
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setSampleDocModal({
                                title: isEn ? "Sample QC ID / Proof of Residency" : "Halimbawa ng QC ID / Katunayan ng Paninirahan",
                                label: isEn ? "Sample QCitizen ID / Proof of QC Residency" : "Sample QCitizen ID / Barangay Certificate of Residency",
                                description: isEn
                                  ? "Sample Quezon City QCitizen ID card or Barangay Certificate proving residency in Quezon City."
                                  : "Halimbawa ng QCitizen ID o Barangay Certificate na nagpapatunay ng paninirahan sa Quezon City.",
                                image: "/samples/PROOF OF RESIDENCE.webp",
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 text-foreground text-xs font-semibold tracking-wide cursor-pointer transition-colors shadow-xs"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            <span>SAMPLE DOCUMENT</span>
                          </button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          {isEn
                            ? "Clear photo of your QCitizen ID, Barangay Certificate of Residency, or Valid ID (front and back)."
                            : "Malinaw na kopya ng QCitizen ID, Barangay Certificate of Residency, o Valid ID."}
                        </p>

                        <p className="text-xs text-muted-foreground mt-2">
                          Allowed file types: JPG, JPEG, PNG, WEBP (o kumuha gamit ang Camera)
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          <input
                            type="file"
                            id="upload-qc-id"
                            accept=".jpg,.jpeg,.png,.webp,.pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) {
                                setQcIdDoc({ file: f, dataUrl: URL.createObjectURL(f), name: f.name })
                              }
                              e.target.value = ""
                            }}
                          />
                          <label
                            htmlFor="upload-qc-id"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold tracking-wide cursor-pointer hover:bg-blue-700 transition-colors shadow-xs"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>UPLOAD PHOTO</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setCameraModalDocType("qcId")}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide cursor-pointer transition-colors shadow-xs"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>TAKE PHOTO (CAMERA)</span>
                          </button>
                        </div>

                        {qcIdDoc && (
                          <div className="mt-3.5 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs max-w-md">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                                {qcIdDoc.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setQcIdDoc(null)}
                              className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remove"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Document 3: 2x2 ID Picture / Barangay Certificate */}
                      <div className="border border-border dark:border-slate-800 bg-card/60 dark:bg-slate-900/40 rounded-xl p-5 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <p className="flex items-center gap-1.5 text-sm font-bold text-foreground uppercase tracking-wide">
                            <span>2X2 ID PICTURE / BARANGAY CERTIFICATE</span>
                            <span className="text-red-500">*</span>
                            {idPicDoc && (
                              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white shrink-0 ml-1">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </span>
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setSampleDocModal({
                                title: isEn ? "Sample 2x2 ID Picture / Barangay Certificate" : "Halimbawa ng 2x2 ID Picture / Barangay Certificate",
                                label: isEn ? "Sample 2x2 ID Picture (White Background)" : "Sample 2x2 ID Picture / Barangay Certificate",
                                description: isEn
                                  ? "Sample recent 2x2 ID picture on white background or Barangay Certificate of Indigency."
                                  : "Halimbawa ng 2x2 ID picture na may puting background o Barangay Certificate.",
                                image: "/samples/ID PICTURE (2X2).webp",
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 text-foreground text-xs font-semibold tracking-wide cursor-pointer transition-colors shadow-xs"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            <span>SAMPLE DOCUMENT</span>
                          </button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          {isEn
                            ? "Recent 2x2 ID picture (white background) or Barangay Certificate of Indigency."
                            : "Kamakailang 2x2 ID picture (puting background) o Barangay Certificate."}
                        </p>

                        <p className="text-xs text-muted-foreground mt-2">
                          Allowed file types: JPG, JPEG, PNG, WEBP (o kumuha gamit ang Camera)
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          <input
                            type="file"
                            id="upload-id-pic"
                            accept=".jpg,.jpeg,.png,.webp,.pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) {
                                setIdPicDoc({ file: f, dataUrl: URL.createObjectURL(f), name: f.name })
                              }
                              e.target.value = ""
                            }}
                          />
                          <label
                            htmlFor="upload-id-pic"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold tracking-wide cursor-pointer hover:bg-blue-700 transition-colors shadow-xs"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>UPLOAD PHOTO</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setCameraModalDocType("idPic")}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide cursor-pointer transition-colors shadow-xs"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>TAKE PHOTO (CAMERA)</span>
                          </button>
                        </div>

                        {idPicDoc && (
                          <div className="mt-3.5 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs max-w-md">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                                {idPicDoc.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIdPicDoc(null)}
                              className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remove"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Review Card */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                      {isEn ? "Review Application Summary" : "Repasuhin ang Buod ng Aplikasyon"}
                    </label>
                    {(() => {
                      const rawPicked = courses.find((c) => c.id === applyCourseId) || courses[0]
                      const picked = getLocalizedCourse(rawPicked)
                      return (
                        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2 text-xs">
                          <div className="flex justify-between font-bold text-sm text-foreground">
                            <span>{picked.title}</span>
                            <span className="text-blue-600">{localizeDuration(picked.duration)}</span>
                          </div>
                          <p className="text-muted-foreground"><strong className="text-foreground">{isEn ? "Training Batch:" : "Batch ng Pagsasanay:"}</strong> {localizeBatch(picked.batch)}</p>
                          <p className="text-muted-foreground"><strong className="text-foreground">{isEn ? "Application Period:" : "Panahon ng Aplikasyon:"}</strong> {localizeDateStr(picked.applicationOpens || "July 1, 2026")} - {localizeDateStr(picked.applicationDeadline || "July 15, 2026")}</p>
                          <p className="text-muted-foreground"><strong className="text-foreground">{isEn ? "Training Schedule:" : "Simula ng Pagsasanay:"}</strong> {localizeDateStr(picked.trainingStarts || "August 1 - 30, 2026")}</p>
                          <p className="text-muted-foreground"><strong className="text-foreground">{isEn ? "Applicant:" : "Aplikante:"}</strong> {profile.firstName} {profile.lastName} • {sex}, {age} • {civilStatus} • Brgy. {barangay}</p>
                          <p className="text-muted-foreground"><strong className="text-foreground">{isEn ? "Education & Purpose:" : "Edukasyon at Layunin:"}</strong> {highestEducation} • {trainingPurpose === "Other" && otherPurpose ? otherPurpose : trainingPurpose}</p>
                        </div>
                      )
                    })()}

                    <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAttested}
                        onChange={(e) => setIsAttested(e.target.checked)}
                        className="mt-0.5 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        {isEn
                          ? "I hereby certify that all information provided is true and correct, and I commit to faithfully attend all scheduled training sessions for this course."
                          : isBis
                          ? "Gipamatud-an nako nga tinuod ang tanang impormasyon ug ako matinud-anong motambong sa tanang adlaw sa pagbansay."
                          : "Pinatutunayan ko na totoo ang lahat ng impormasyong nakatala at ako ay tapat na dadalo sa lahat ng takdang araw ng pagsasanay sa kursong ito."}
                      </span>
                    </label>
                  </div>

                  {/* Submit & Navigation Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setFormStep("profile")}
                      className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted/40 text-xs font-bold text-foreground cursor-pointer transition-colors shadow-xs"
                    >
                      {isEn ? "Back" : "Bumalik"}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !isAttested}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>{isEn ? "Submitting..." : "Isinusumite..."}</span>
                        </>
                      ) : (
                        <>
                          <span>{isEn ? "Submit Application" : "Isumite ang Aplikasyon"}</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {}
      {}
      {}
      {activeTab === "schedule" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {isEn ? "Training Schedule & Attendance Tracker" : isBis ? "Iskedyul sa Pagbansay ug Attendance" : "Training Schedule & Attendance Record"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isEn
                ? "View your confirmed date, time, venue, and track live session attendance."
                : isBis
                ? "Tan-awa ang mga detalye sa adlaw, oras, lugar, ug subaya ang imong attendance."
                : "Tingnan ang detalye ng takdang araw, oras, venue, at subaybayan ang iyong attendance."}
            </p>
          </div>

          {!activeApplication || activeApplication.status !== "approved" ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Calendar className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                {isEn ? "No Approved Training Schedule Yet" : isBis ? "Wala pay Naaprobahang Iskedyul" : "Wala Pang Naaprubahang Training Schedule"}
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {isEn
                  ? "This section will be activated once your application has been APPROVED by the Gov Services Skills Development Division."
                  : isBis
                  ? "Mahimong aktibo kini nga seksyon kung APPROVED na ang imong aplikasyon gikan sa Gov Services Skills Development Division."
                  : "Magiging aktibo ang seksyong ito kapag APPROVED na ang iyong Training Application mula sa Gov Services Skills Development Division."}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab(activeApplication ? "apply" : "available")}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2 mt-2"
              >
                <span>
                  {activeApplication
                    ? isEn ? "View Application Status" : isBis ? "Tan-awa ang Status" : "Tingnan ang Application Status"
                    : isEn ? "View Available Trainings" : isBis ? "Tan-awa ang mga Pagbansay" : "Tingnan ang Available Trainings"}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                      {isEn ? "Confirmed Batch Schedule" : isBis ? "Kumpirmadong Iskedyul" : "Confirmed Batch Schedule"}
                    </span>
                    <h4 className="text-xl font-bold text-foreground mt-0.5">
                      {activeApplication.schedule?.trainingName || activeApplication.trainingName}
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-700 border border-blue-500/30 w-fit">
                    Status: {activeApplication.schedule?.trainingStatus || "Upcoming"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                    <Calendar className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-muted-foreground block text-[11px]">{isEn ? "Training Date" : isBis ? "Petsa sa Pagbansay" : "Petsa ng Pagsasanay"}</span>
                      <span className="font-bold text-foreground text-sm">{activeApplication.schedule?.trainingDate}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                    <Clock className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-muted-foreground block text-[11px]">{isEn ? "Training Time" : isBis ? "Oras sa Pagbansay" : "Oras ng Pagsasanay"}</span>
                      <span className="font-bold text-foreground text-sm">{activeApplication.schedule?.trainingTime}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border sm:col-span-2">
                    <MapPin className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-muted-foreground block text-[11px]">{isEn ? "Location & Venue" : isBis ? "Lugar ug Landmark" : "Lokasyon at Landmark"}</span>
                      <span className="font-bold text-foreground text-sm block">{activeApplication.schedule?.trainingLocation}</span>
                      <span className="text-muted-foreground text-xs mt-0.5 block italic">
                        Landmark: {activeApplication.schedule?.landmark || "Across Puregold Batasan, Beside Batasan Hills Barangay Hall"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <h4 className="text-base font-bold text-foreground">
                        {isEn ? "Daily Attendance & 3-Hour Goal Tracker" : isBis ? "Adlaw-adlaw nga Attendance & 3-Oras nga Tumong" : "Araw-araw na Attendance & 3-Oras na Goal Tracker"}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isEn
                        ? "Attend 3 hours per day for 4 days (12 hours total). Complete all 4 daily sessions to unlock your official Certificate of Completion."
                        : isBis
                        ? "Tambong og 3 ka oras kada adlaw sulod sa 4 ka adlaw (12 ka oras tanan). Humanon ang tanang 4 ka adlaw aron ma-unlock ang imong Sertipiko."
                        : "Dumalo ng 3 oras bawat araw sa loob ng 4 na araw (12 oras kabuuan). Kumpletuhin ang lahat ng 4 araw para ma-unlock ang iyong Certificate of Completion."}
                    </p>
                  </div>
                  <div className="text-right shrink-0 bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 rounded-xl">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block">
                      {activeApplication.attendance?.hoursCompleted || 0} / 12 {isEn ? "Hours" : "Oras"}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {Math.min(4, Math.floor((activeApplication.attendance?.hoursCompleted || 0) / 3))} of 4 Days Completed
                    </span>
                  </div>
                </div>

                {}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span>{isEn ? "Training Progress" : "Progreso sa Pagsasanay"}</span>
                    <span className="text-blue-600 font-mono">
                      {Math.min(
                        100,
                        Math.round(((activeApplication.attendance?.hoursCompleted || 0) / 12) * 100)
                      )}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-muted/60 overflow-hidden p-0.5 border border-border">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-300 shadow-xs"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            4,
                            Math.round(((activeApplication.attendance?.hoursCompleted || 0) / 12) * 100)
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {}
                <div className="space-y-2.5 pt-2">
                  {(activeApplication.attendance?.sessions || [
                    { day: 1, topic: "Orientation & Fundamental Skills", hours: 3, attended: false, date: "Day 1" },
                    { day: 2, topic: "Hands-on Application & Practical Work", hours: 3, attended: false, date: "Day 2" },
                    { day: 3, topic: "Specialized Techniques & Daily Assessment", hours: 3, attended: false, date: "Day 3" },
                    { day: 4, topic: "Final Output, Evaluation & Certificate Grant", hours: 3, attended: false, date: "Day 4" },
                  ]).map((sess) => (
                    <div
                      key={sess.day}
                      onClick={() => {
                        if (!sess.attended) {
                          handleUserCheckin(sess.day)
                        }
                      }}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                        sess.attended
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200 shadow-2xs cursor-default"
                          : "bg-muted/15 border-border hover:bg-blue-500/10 hover:border-blue-500/40 cursor-pointer group"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {sess.attended ? (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs bg-emerald-600 text-white ring-2 ring-emerald-500/30 select-none"
                            title={isEn ? "Session Completed (3 Hours)" : "Natapos na ang Sesyon (3 Oras)"}
                          >
                            <Check className="h-4 w-4 stroke-[3]" />
                          </div>
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 shadow-xs bg-muted border border-border text-muted-foreground group-hover:border-blue-500 group-hover:bg-blue-500 group-hover:text-white"
                            title={isEn ? "Click to check-in 3 hours" : "I-click para mag-check in (3 oras)"}
                          >
                            D{sess.day}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-foreground group-hover:text-blue-600 transition-colors">
                            Day {sess.day}: {sess.topic}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span><strong>3 Hours Daily Goal</strong> • {activeApplication.schedule?.trainingTime || "9:00 AM - 12:00 PM"}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {sess.attended ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs select-none cursor-default inline-flex items-center justify-center">
                            Attended (3hrs)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUserCheckin(sess.day)
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center border border-blue-600 text-blue-600 group-hover:bg-blue-600 group-hover:text-white shadow-xs"
                          >
                            <span>{isEn ? "Check-in Day " + sess.day + " (3h)" : isBis ? "I-check-in Adlaw " + sess.day + " (3h)" : "I-check-in Araw " + sess.day + " (3h)"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {}
                {activeApplication.attendance?.completed ? (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-start gap-3.5">
                      <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-xs">
                        <Award className="h-6 w-6" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wide">
                          <Unlock className="h-3.5 w-3.5" />
                          <span>{isEn ? "Certificate Unlocked!" : isBis ? "Na-unlock ang Sertipiko!" : "Na-unlock ang Sertipiko!"}</span>
                        </div>
                        <p className="font-extrabold text-foreground text-sm sm:text-base">
                          {isEn ? "Congratulations! 100% Training Goal Completed." : isBis ? "Pahalipay! 100% Nakompleto ang Pagbansay." : "Binabati kita! 100% Nakumpleto ang Training Goal."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isEn ? "You have completed all 4 days (12 hours). Your official Certificate of Completion is ready to view and print." : isBis ? "Nahuman nimo ang tanang 4 ka adlaw (12 ka oras). Andam na ang imong opisyal nga sertipiko." : "Natapos mo ang lahat ng 4 na araw (12 oras). Handa na ang iyong opisyal na Certificate of Completion."}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("history")
                        setCertificateModalApp(activeApplication)
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-sm flex items-center justify-center gap-2"
                    >
                      <Award className="h-4 w-4" />
                      <span>{isEn ? "View & Print Certificate" : isBis ? "Tan-awa ang Sertipiko" : "Tingnan & I-print ang Sertipiko"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-amber-900 dark:text-amber-200">
                          {isEn ? "Official Certificate is Locked" : isBis ? "Naka-lock ang Opisyal nga Sertipiko" : "Naka-lock ang Opisyal na Sertipiko"}
                        </p>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300">
                          {isEn
                            ? `Complete all 4 daily sessions (${12 - (activeApplication.attendance?.hoursCompleted || 0)} hours remaining) to unlock and receive your official Certificate.`
                            : isBis
                            ? `Kumpletuhon ang tanang 4 ka adlaw (${12 - (activeApplication.attendance?.hoursCompleted || 0)} ka oras ang nahabilin) aron makuha ang sertipiko.`
                            : `Kumpletuhin ang lahat ng 4 araw (${12 - (activeApplication.attendance?.hoursCompleted || 0)} oras ang natitira) para ma-unlock at makuha ang iyong Certificate of Completion.`}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold text-[11px] shrink-0 border border-amber-500/40 w-fit">
                      {Math.min(4, Math.floor((activeApplication.attendance?.hoursCompleted || 0) / 3))}/4 Days Done
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {}
      {}
      {}
      {activeTab === "history" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {isEn ? "Training History & Official Certificates" : isBis ? "Kasaysayan sa Pagbansay ug Sertipiko" : "Kasaysayan ng Pagsasanay at Sertipiko"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isEn
                ? "Registry of your completed skills training programs and official Certificates of Completion. Certificates are unlocked only after finishing all 4 daily attendance sessions (3 hours/day)."
                : isBis
                ? "Talaan sa mga nahuman nimong training ug na-isyu nga mga Certificate of Completion. Ma-unlock lang kini human sa 4 ka adlaw nga pagbansay."
                : "Talaan ng mga natapos mong training program at mga naisyung Certificate of Completion. Mada-download o matitingnan lamang ang sertipiko kapag nakumpleto ang 4-Day Daily Attendance (3 oras bawat araw)."}
            </p>
          </div>

          {}
          {activeApplication && activeApplication.status === "approved" && !activeApplication.attendance?.completed && (
            <div className="bg-card border border-amber-500/30 bg-amber-500/5 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                    {isEn ? "TRAINING IN PROGRESS" : "KASALUKUYANG PAGSASANAY"}
                  </span>
                  <h4 className="font-bold text-base text-foreground">
                    {activeApplication.trainingName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {isEn
                      ? `Attendance Progress: ${Math.min(4, Math.floor((activeApplication.attendance?.hoursCompleted || 0) / 3))}/4 Days (${activeApplication.attendance?.hoursCompleted || 0}/12 Hours). Complete remaining sessions to unlock Certificate.`
                      : `Progreso: ${Math.min(4, Math.floor((activeApplication.attendance?.hoursCompleted || 0) / 3))}/4 Araw (${activeApplication.attendance?.hoursCompleted || 0}/12 Oras). Kumpletuhin ang mga natitirang araw para makuha ang Sertipiko.`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Target className="h-4 w-4" />
                <span>{isEn ? "Go to Daily Attendance" : "Pumunta sa Daily Attendance"}</span>
              </button>
            </div>
          )}

          {completedTrainings.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto">
                <Award className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                {isEn ? "No Completed Training Records Yet" : isBis ? "Wala pay Nahuman nga Pagbansay" : "Wala Pang Natapos na Pagsasanay"}
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {isEn
                  ? "When you finish all 4 days (3 hours per day • 12 hours total) of skills training, your official Certificate of Completion will automatically appear and unlock here."
                  : isBis
                  ? "Kung mahuman nimo ang tanang 4 ka adlaw (3 ka oras kada adlaw) nga skills training, dinhi nimo makita ug ma-download ang imong opisyal nga sertipiko."
                  : "Kapag natapos mo ang lahat ng 4 na araw (3 oras bawat araw • 12 oras kabuuan) ng skills training, dito mo makikita at mada-download ang iyong opisyal na sertipiko."}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab(activeApplication ? "schedule" : "available")}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2 mt-2"
              >
                <span>{activeApplication ? (isEn ? "Complete Daily Attendance" : "Kumpletuhin ang Attendance") : (isEn ? "Explore Available Trainings" : "Maghanap ng Training Program")}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {completedTrainings.map((app) => (
                <div
                  key={app.id}
                  className="bg-card border border-emerald-500/30 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-500/5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                        {isEn ? "COMPLETED (12 HOURS • 4 DAYS)" : isBis ? "NAHUMAN (12 KA ORAS • 4 KA ADLAW)" : "NAKUMPLETO (12 ORAS • 4 NA ARAW)"}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">REF {app.referenceNumber}</span>
                    </div>
                    <h4 className="font-bold text-base text-foreground">
                      {app.trainingName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {isEn ? "Completed on:" : isBis ? "Nahuman niadtong:" : "Natapos noong:"} <strong>{app.schedule?.trainingDate || "Recent"}</strong> {isEn ? "at" : "sa"} {app.schedule?.trainingLocation}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCertificateModalApp(app)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span>{isEn ? "View & Print Certificate" : isBis ? "Tan-awa ug I-print ang Sertipiko" : "Tingnan at I-print ang Sertipiko"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {}
      {}
      {}
      {isDetailModalOpen && selectedCourse && (() => {
        const localizedModalCourse = getLocalizedCourse(selectedCourse)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    {getCourseIcon(localizedModalCourse.id)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{localizedModalCourse.title}</h3>
                    <p className="text-xs text-muted-foreground">{localizeDuration(localizedModalCourse.duration)} {isEn ? "Skills Training Course" : isBis ? "Kurso sa Pagbansay" : "Pagsasanay sa Kasanayan"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-lg font-bold px-2 py-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px]">{isEn ? "What You Will Learn:" : isBis ? "Unsay Imong Makat-onan:" : "Ano ang Matututunan:"}</span>
                  <p className="text-foreground leading-relaxed mt-0.5">{localizedModalCourse.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px]">{isEn ? "Training Batch:" : isBis ? "Batch sa Pagbansay:" : "Batch ng Pagsasanay:"}</span>
                    <span className="font-bold text-foreground">{localizeBatch(localizedModalCourse.batch)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px]">{isEn ? "Duration:" : isBis ? "Gidugayon:" : "Tagal / Duration:"}</span>
                    <span className="font-bold text-foreground">{localizeDuration(localizedModalCourse.duration)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px]">{isEn ? "Application Opens:" : isBis ? "Bukas ang Aplikasyon:" : "Bukas ang Aplikasyon:"}</span>
                    <span className="font-bold text-emerald-600">{localizeDateStr(localizedModalCourse.applicationOpens || "July 1, 2026")}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px]">{isEn ? "Application Deadline:" : isBis ? "Kataposang Adlaw:" : "Huling Araw ng Aplikasyon:"}</span>
                    <span className="font-bold text-amber-600">{localizeDateStr(localizedModalCourse.applicationDeadline || "July 15, 2026")}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-muted-foreground block text-[11px]">{isEn ? "Training Starts:" : isBis ? "Pagsugod sa Pagbansay:" : "Simula ng Pagsasanay:"}</span>
                    <span className="font-bold text-blue-600">{localizeDateStr(localizedModalCourse.trainingStarts || "August 1 - 30, 2026")}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="font-semibold text-muted-foreground block text-[11px]">{isEn ? "Location & Landmark:" : isBis ? "Lugar ug Landmark:" : "Lokasyon at Landmark:"}</span>
                  <span className="font-bold text-foreground block">{localizedModalCourse.location}</span>
                  <span className="text-muted-foreground italic text-[11px] mt-0.5 block">{localizedModalCourse.landmark}</span>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="font-semibold text-muted-foreground block text-[11px]">{isEn ? "Instructor & Materials:" : isBis ? "Tigtudlo ug Gamit:" : "Instructor & Materials:"}</span>
                  <p className="text-foreground font-medium">{localizedModalCourse.instructor}</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">{isEn ? "Provided materials:" : isBis ? "Libreng gamit:" : "Libreng gamit:"} {localizedModalCourse.materialsProvided}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                {allUserApplications.some(
                  (a) =>
                    (a.trainingId === selectedCourse.id ||
                      a.trainingName?.toLowerCase() === selectedCourse.title?.toLowerCase() ||
                      a.schedule?.trainingName?.toLowerCase() === selectedCourse.title?.toLowerCase()) &&
                    a.status !== "rejected"
                ) ? (
                  <button
                    type="button"
                    onClick={() => {
                    setIsDetailModalOpen(false)
                    setActiveTab(activeApplication?.status === "approved" ? "schedule" : "apply")
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isEn ? "View Training Status" : "Tingnan ang Status"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : hasActiveOngoingTraining ? (
                <button
                  type="button"
                  disabled
                  className="px-5 py-2 rounded-xl bg-muted text-muted-foreground border border-border text-xs font-bold shadow-xs cursor-not-allowed opacity-60"
                  title={isEn ? "Complete your active training first" : "Kumpletuhin muna ang kasalukuyang training"}
                >
                  <span>{isEn ? "Currently in Training" : "May Aktibong Training"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelectToApply(selectedCourse)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isEn ? "Apply for This Training" : isBis ? "Mag-apply niining Pagbansay" : "Mag-apply sa Training na Ito"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )})()}

      {}
      {}
      {}
      {certificateModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            {}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span className="font-bold text-sm text-foreground">Official Certificate Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setCertificateModalApp(null)}
                className="text-muted-foreground hover:text-foreground text-base font-bold px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {}
            <div
              id="qc-official-certificate"
              className="bg-white text-slate-900 border-8 border-double border-amber-600/60 rounded-xl p-6 sm:p-8 text-center space-y-4 shadow-md relative"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {}
              <div className="flex items-center justify-center gap-3">
                <img
                  src="/samples/Government Service Integrity Seal.png"
                  alt="QC Seal"
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none"
                  }}
                />
                <div>
                  <h5 className="text-[11px] font-bold tracking-widest text-slate-700 uppercase">
                    Republic of the Philippines
                  </h5>
                  <h4 className="text-base font-extrabold tracking-wide text-[#0F172A]">
                    GOV SERVICES
                  </h4>
                  <p className="text-[10px] text-slate-600 tracking-wider uppercase">
                    Social Services Development Department • Skills Training Division
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[11px] tracking-widest text-amber-700 font-bold uppercase block">
                  Certificate of Completion
                </span>
                <div className="w-24 h-0.5 bg-amber-600 mx-auto mt-1 mb-3" />
                <p className="text-xs text-slate-600 italic">
                  {isEn
                    ? "This certificate is proudly presented to"
                    : isBis
                    ? "Kini nga sertipiko mapasigarbohong gihatag kang"
                    : "Ipinagkakaloob ang katibayang ito kay"}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 underline decoration-amber-600 underline-offset-8 mt-1.5 mb-3">
                  {certificateModalApp.applicantInfo?.fullName || "CLARISA MAE GALIAS DIMAL"}
                </h3>
                <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed">
                  {isEn ? (
                    <>
                      for the successful completion of <strong>12 Hours of Intensive Skills Training (4 Days • 3 hrs/day)</strong> in the course of{" "}
                      <strong>{certificateModalApp.trainingName}</strong> held at Gov Services Skills Development Center, Batasan Hills.
                    </>
                  ) : isBis ? (
                    <>
                      alang sa malamposong paghuman sa <strong>12 ka Oras sa Pagsasanay (4 ka Adlaw • 3 ka oras/adlaw)</strong> sa ilalom sa{" "}
                      kursong <strong>{certificateModalApp.trainingName}</strong> nga gipahigayon sa Gov Services Skills Development Center, Batasan Hills.
                    </>
                  ) : (
                    <>
                      para sa matagumpay na pagtatapos ng <strong>12 Oras ng Masinsinang Pagsasanay (4 na Araw • 3 oras/araw)</strong> sa ilalim ng{" "}
                      kursong <strong>{certificateModalApp.trainingName}</strong> na ginanap sa Gov Services Skills Development Center, Batasan Hills.
                    </>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 text-left text-[10px] text-slate-600 border-t border-slate-200">
                <div>
                  <p>Certificate No: <strong className="font-mono text-slate-900">{certificateModalApp.certificate?.certificateNo || `GOV-CERT-2026-${Math.floor(10000 + Math.random() * 90000)}`}</strong></p>
                  <p>{isEn ? "Issue Date:" : isBis ? "Petsa sa Pag-isyu:" : "Petsa ng Pag-isyu:"} <strong className="text-slate-900">{certificateModalApp.certificate?.issueDate || new Date().toLocaleDateString()}</strong></p>
                  <p>QC ID: <strong className="font-mono text-slate-900">{certificateModalApp.qcid}</strong></p>
                </div>

                <div className="text-right">
                  <div className="w-32 h-10 border-b border-slate-400 ml-auto mb-1 flex items-end justify-center">
                    <span className="font-script text-xs text-slate-700 italic">Gov Services Skills Director</span>
                  </div>
                  <p className="font-bold text-slate-800">ATTY. MARIQUITA BELMONTE</p>
                  <p className="text-[9px] text-slate-500">SSDD Department Head</p>
                </div>
              </div>
            </div>

            {}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setCertificateModalApp(null)}
                className="px-4 py-2 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 text-foreground text-xs font-semibold cursor-pointer"
              >
                {isEn ? "Close" : isBis ? "Isira" : "Isara"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>{isEn ? "Print Certificate" : isBis ? "I-print ang Sertipiko" : "I-print ang Sertipiko"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {cameraModalDocType && (
        <DocumentCameraModal
          isOpen={!!cameraModalDocType}
          docTitle={
            cameraModalDocType === "requestLetter"
              ? isEn
                ? "Request Letter"
                : "Liham Kahilingan (Request Letter)"
              : cameraModalDocType === "qcId"
              ? isEn
                ? "Proof of QC Residency / QC ID"
                : "Katunayan ng Paninirahan / QC ID"
              : isEn
              ? "2x2 ID Picture / Barangay Certificate"
              : "2x2 ID Picture / Barangay Certificate"
          }
          onClose={() => setCameraModalDocType(null)}
          onCapture={(file, dataUrl) => {
            if (cameraModalDocType === "requestLetter") {
              setRequestLetterDoc({
                file,
                dataUrl: dataUrl || URL.createObjectURL(file),
                name: file.name || "request-letter-camera.jpg",
              })
            } else if (cameraModalDocType === "qcId") {
              setQcIdDoc({
                file,
                dataUrl: dataUrl || URL.createObjectURL(file),
                name: file.name || "qcid-proof-camera.jpg",
              })
            } else if (cameraModalDocType === "idPic") {
              setIdPicDoc({
                file,
                dataUrl: dataUrl || URL.createObjectURL(file),
                name: file.name || "id-pic-camera.jpg",
              })
            }
            setCameraModalDocType(null)
          }}
        />
      )}

      {sampleDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">{sampleDocModal.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{sampleDocModal.label}</p>
              </div>
              <button
                type="button"
                onClick={() => setSampleDocModal(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 text-center bg-muted/10">
              <div className="max-h-[65vh] overflow-y-auto rounded-xl border border-border bg-white dark:bg-slate-900 flex items-center justify-center p-3 shadow-inner">
                <img
                  src={sampleDocModal.image}
                  alt={sampleDocModal.title}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-xs"
                />
              </div>
              {sampleDocModal.description && (
                <p className="text-xs text-blue-800 dark:text-blue-300 text-left bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl leading-relaxed">
                  {sampleDocModal.description}
                </p>
              )}
            </div>
            <div className="p-4 border-t border-border flex items-center justify-between gap-2">
              <a
                href={sampleDocModal.image}
                download
                className="px-4 py-2 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 text-foreground text-xs font-semibold transition-colors"
              >
                Download Sample
              </a>
              <button
                type="button"
                onClick={() => setSampleDocModal(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isEn ? "Close" : isBis ? "Isira" : "Isara"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

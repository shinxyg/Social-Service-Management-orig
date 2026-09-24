import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Award,
  Scissors,
  Laptop,
  ArrowRight,
  Printer,
  Coffee,
  ChefHat,
  FileText,
  User,
  Briefcase,
  Sparkles,
  Send,
} from "lucide-react"
import { API_BASE } from "../../config/api"
import { getCurrentUserProfile, getLoggedInUserQcid, type LoggedInUserProfile } from "../../utils/userProfile"
import { notifyApplicationChange } from "../../utils/realtimeSync"
import { useLanguage } from "../ui/language-context"

export type TrainingProgramTab = "available" | "schedule" | "history"

export interface TrainingCourse {
  id: string
  title: string
  category: string
  description: string
  duration: string
  durationHours?: number
  batch: string
  applicationOpens: string
  applicationDeadline: string
  trainingStarts: string
  date?: string
  time?: string
  location?: string
  landmark?: string
  totalSlots: number
  availableSlots: number
  enrolledCount?: number
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
    documents?: {
      requestLetter?: string | null
      qcIdProof?: string | null
      indigencyProof?: string | null
    }
  }
  status: "pending" | "under_review" | "qualified" | "scheduled" | "enrolled" | "in_progress" | "completed" | "rejected" | "approved"
  submittedAt: string
  approvedBy?: string
  approvedDate?: string
  rejectionReason?: string
  revisionNotes?: string
  schedule: {
    batchName?: string
    trainingName: string
    trainingDate: string
    trainingTime: string
    trainingLocation: string
    landmark?: string
    instructor?: string
    orientationDate?: string
    orientationTime?: string
    orientationVenue?: string
    trainingStatus: "Upcoming" | "Ongoing" | "Completed"
  }
  attendance: {
    totalHours: number
    hoursCompleted: number
    completed: boolean
    sessions: Array<{
      day: number
      topic: string
      hours: number
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
  }
}

const COURSES: TrainingCourse[] = [
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
    instructor: "Chef Melissa Ramos (Master Baker & Pastry Chef)",
    prerequisites: "Gov Services Resident (18 years old and above), interest in commercial baking and pastry production.",
    materialsProvided: "Baking ingredients starter kit, apron, hairnet, baking tools set, and recipe manual.",
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
    instructor: "Mr. Dave Navarro (Certified Master Barista)",
    prerequisites: "Gov Services Resident (18 years old and above), interest in coffee shop operations.",
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
    instructor: "Mrs. Rosa Dimaculangan (Master Tailor & Dressmaker)",
    prerequisites: "Gov Services Resident (18 years old and above), interest in sewing, dressmaking, or alterations.",
    materialsProvided: "Sewing fabric, thread kit, pattern paper, tracing wheel, measuring tape, and tailoring scissors.",
  },
]

export default function TrainingProgramView() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const isEn = language === "en"
  const isBis = language === "bis"

  const [activeTab, setActiveTab] = useState<TrainingProgramTab>("available")
  const [courses, setCourses] = useState<TrainingCourse[]>(COURSES)
  const [allUserApplications, setAllUserApplications] = useState<TrainingApplicationRecord[]>([])
  const [activeApplication, setActiveApplication] = useState<TrainingApplicationRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal State for Applying
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<TrainingCourse | null>(null)

  // Form Fields
  const [userProfile, setUserProfile] = useState<LoggedInUserProfile | null>(null)
  const [uploadedId, setUploadedId] = useState<string | null>("QCID_Jefferson_Verified.pdf")
  const [uploadedIndigency, setUploadedIndigency] = useState<string | null>("Brgy_Indigency_Certificate.pdf")
  const [customRemarks, setCustomRemarks] = useState("")

  // Fetch applications
  const fetchMyTrainingApps = async () => {
    try {
      setIsLoading(true)
      const userQcid = getLoggedInUserQcid()
      const prof = getCurrentUserProfile()
      setUserProfile(prof)

      const res = await fetch(`${API_BASE}/api/training/applications`)
      if (res.ok) {
        const data = await res.json()
        const list: TrainingApplicationRecord[] = Array.isArray(data) ? data : data.applications || []
        if (Array.isArray(list)) {
          const myApps = list.filter(
            (a) =>
              String(a.qcid || "").trim() === String(userQcid || "").trim() ||
              String(a.userId || "").trim() === String(userQcid || "").trim() ||
              a.applicantInfo?.email === prof.email
          )
          setAllUserApplications(myApps)
          if (myApps.length > 0) {
            // Pick most recent active or last application
            const active = myApps.find((a) => a.status !== "rejected") || myApps[0]
            setActiveApplication(active)
          }
        }
      }
    } catch (_) {
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMyTrainingApps()
    const interval = setInterval(fetchMyTrainingApps, 8000)
    const handleSync = () => fetchMyTrainingApps()
    window.addEventListener("storage", handleSync)
    window.addEventListener("application_status_updated", handleSync)
    window.addEventListener("training_applications_updated", handleSync)
    window.addEventListener("user_notifications_updated", handleSync)
    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleSync)
      window.removeEventListener("application_status_updated", handleSync)
      window.removeEventListener("training_applications_updated", handleSync)
      window.removeEventListener("user_notifications_updated", handleSync)
    }
  }, [])

  const hasActiveOngoingTraining =
    activeApplication &&
    activeApplication.status !== "rejected" &&
    activeApplication.status !== "completed"

  const handleOpenApplyModal = (course: TrainingCourse) => {
    setSelectedCourseForModal(course)
    setIsApplyModalOpen(true)
  }

  const handleSubmitModalApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseForModal) return

    setIsSubmitting(true)
    const userQcid = getLoggedInUserQcid() || "110000116932100"
    const prof = getCurrentUserProfile()

    const newAppPayload = {
      trainingId: selectedCourseForModal.id,
      trainingName: selectedCourseForModal.title,
      qcid: userQcid,
      referenceNumber: `TR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      applicantInfo: {
        fullName: `${prof.firstName || "JEFFERSON"} ${prof.lastName || "SANTOS"}`.trim(),
        firstName: prof.firstName || "JEFFERSON",
        middleName: prof.middleName || "",
        lastName: prof.lastName || "SANTOS",
        email: prof.email || "applicant@example.com",
        contactNo: prof.mobileNumber || prof.contactNo || "0917 123 4567",
        barangay: prof.barangay || "Sauyo",
        city: "Quezon City",
        sex: prof.gender || "Male",
        dateOfBirth: prof.birthDate || prof.birthDateDisplay || "01/01/1995",
        age: prof.age || 28,
        documents: {
          qcIdProof: uploadedId,
          indigencyProof: uploadedIndigency,
          requestLetter: customRemarks,
        },
      },
    }

    try {
      const res = await fetch(`${API_BASE}/api/training/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAppPayload),
      })

      if (res.ok) {
        const data = await res.json()
        if (data && data.application) {
          setActiveApplication(data.application)
          setAllUserApplications((prev) => [data.application, ...prev])
        }
      }
    } catch (err) {
      console.warn("Submit error:", err)
    } finally {
      setIsSubmitting(false)
      setIsApplyModalOpen(false)
      setActiveTab("history")
      notifyApplicationChange("APPLICATION_SUBMITTED", "livelihood", newAppPayload.referenceNumber)
    }
  }

  const getCourseIcon = (courseId: string) => {
    switch (courseId) {
      case "tr-bread-pastry":
        return <ChefHat className="h-6 w-6 text-amber-500" />
      case "tr-barista":
        return <Coffee className="h-6 w-6 text-amber-700" />
      case "tr-computer-call-center":
        return <Laptop className="h-6 w-6 text-blue-500" />
      case "tr-hairdressing":
      case "tr-beauty-care":
        return <Scissors className="h-6 w-6 text-rose-500" />
      case "tr-dressmaking-sewing":
        return <Sparkles className="h-6 w-6 text-indigo-500" />
      default:
        return <BookOpen className="h-6 w-6 text-purple-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-card border border-border rounded-2xl p-4.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">
              {isEn
                ? "SSDD Livelihood & Skills Training Program"
                : isBis
                ? "Programa sa Pagbansay ug Panginabuhi sa SSDD"
                : "Programa sa Pagsasanay at Kasanayan ng SSDD"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEn
                ? "Official government skills training, orientation, certification, and livelihood starter kit endorsement."
                : "Libreng pagsasanay, oryentasyon, opisyal na sertipikasyon, at tulong pampuhunan mula sa Lungsod Quezon."}
            </p>
          </div>
        </div>

        {activeApplication && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
              Ref: {activeApplication.referenceNumber}
            </span>
          </div>
        )}
      </div>

      {/* 3 CLEAN TABS HEADER */}
      <div className="bg-card border border-border rounded-2xl p-1.5 shadow-xs">
        <div className="grid grid-cols-3 gap-1.5">
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

          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            id="tab-training-schedule"
            className={`px-3 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "schedule"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{isEn ? "2. TRAINING SCHEDULE" : isBis ? "2. ISKEDYUL SA PAGBANSAY" : "2. ISKEDYUL NG PAGSASANAY"}</span>
          </button>

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
            <span>{isEn ? "3. TRAINING HISTORY" : isBis ? "3. KASAYSAYAN SA PAGBANSAY" : "3. KASAYSAYAN NG PAGSASANAY"}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AVAILABLE TRAINING */}
      {activeTab === "available" && (
        <div className="space-y-6">
          {hasActiveOngoingTraining && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-foreground">
                    Active Training Application: {activeApplication?.trainingName}
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Mayroon kang kasalukuyang aktibong aplikasyon. Tingnan ang iyong iskedyul o history para sa mga susunod na hakbang.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shrink-0 shadow-xs cursor-pointer flex items-center justify-center gap-1 text-xs"
              >
                <span>View Progress</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => {
              const isEnrolledInThis =
                activeApplication &&
                activeApplication.trainingId === course.id &&
                activeApplication.status !== "rejected"

              return (
                <div
                  key={course.id}
                  className={`bg-card border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                    isEnrolledInThis ? "border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20" : "border-border"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center border border-border shrink-0 group-hover:scale-105 transition-transform">
                          {getCourseIcon(course.id)}
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-foreground group-hover:text-blue-600 transition-colors">
                            {course.title}
                          </h4>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {course.duration} ({course.durationHours || 54} Hours)
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20 whitespace-nowrap">
                        25 slots
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span><strong>Training Batch:</strong> {course.batch}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span><strong>Schedule:</strong> {course.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span><strong>Venue:</strong> {course.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground font-medium">Free Government Training</span>

                    {isEnrolledInThis ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab("history")}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>View Status</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : hasActiveOngoingTraining ? (
                      <button
                        type="button"
                        disabled
                        className="px-3.5 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold transition-all cursor-not-allowed opacity-60"
                      >
                        <span>Application Active</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenApplyModal(course)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Apply Now</span>
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

      {/* TAB 2: TRAINING SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {activeApplication &&
          (activeApplication.status === "scheduled" ||
            activeApplication.status === "enrolled" ||
            activeApplication.status === "in_progress" ||
            activeApplication.status === "completed") ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-5 animate-in fade-in duration-150">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block">
                    Official Training Schedule & Appointment Pass
                  </span>
                  <h3 className="text-xl font-bold text-foreground mt-0.5">
                    {activeApplication.trainingName}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Reference Number: <strong className="font-mono text-foreground">{activeApplication.referenceNumber}</strong>
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 self-start sm:self-auto">
                  SCHEDULE CONFIRMED
                </span>
              </div>

              {/* 1-Week Advance Reminder Box */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5">
                  <p className="font-bold">⏰ Automated 1-Week Advance Reminder Active</p>
                  <p className="text-[11px] opacity-90">
                    Makakatanggap ka ng paalala sa iyong Email at SMS pitong (7) araw bago magsimula ang klase.
                  </p>
                </div>
              </div>

              {/* Orientation Schedule (Day 0) */}
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider text-[11px]">
                    1. Araw ng Oryentasyon (Face-to-Face)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Petsa ng Oryentasyon:</span>
                    <span className="font-bold text-foreground text-sm">
                      {activeApplication.schedule?.orientationDate || "October 12, 2026"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Oras:</span>
                    <span className="font-bold text-foreground text-sm">
                      {activeApplication.schedule?.orientationTime || "9:00 AM – 11:00 AM"}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-[10px]">Lugar / Venue:</span>
                    <span className="font-bold text-foreground">
                      {activeApplication.schedule?.orientationVenue || activeApplication.schedule?.trainingLocation || "SSDD Skills Training Center, Main AVR"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Training Classes Schedule */}
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider text-[11px]">
                    2. Iskedyul ng Regular na Klase (18 Working Days)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Batch Name:</span>
                    <span className="font-bold text-foreground">{activeApplication.schedule?.batchName || "3rd Batch 2026"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Petsa ng Klase:</span>
                    <span className="font-bold text-foreground">{activeApplication.schedule?.trainingDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Oras ng Klase:</span>
                    <span className="font-bold text-foreground">{activeApplication.schedule?.trainingTime}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Silid / Room:</span>
                    <span className="font-bold text-foreground">{activeApplication.schedule?.trainingLocation}</span>
                  </div>
                  {activeApplication.schedule?.instructor && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block text-[10px]">Assigned Trainer:</span>
                      <span className="font-bold text-foreground">{activeApplication.schedule.instructor}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Printable Appointment Pass (No QR Code) */}
              <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Official Appointment Pass</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-foreground text-background font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Appointment Pass</span>
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Dalhin ang kopya ng Appointment Pass na ito at isang (1) Valid ID sa araw ng Oryentasyon. Si Admin ang magmamarka ng inyong opisyal na pagka-enroll sa center.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
              <h4 className="font-bold text-base text-foreground">Wala pang Naka-iskedyul na Pagsasanay</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Magiging aktibo ang tab na ito kapag naaprubahan na ng Social Worker ang inyong aplikasyon at na-assignan ka na ng Batch Schedule.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("available")}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Mag-browse ng Available Trainings</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRAINING HISTORY & PROGRESS */}
      {activeTab === "history" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {activeApplication ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-6">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-500/10 px-2.5 py-0.5 rounded-md">
                    Ref: {activeApplication.referenceNumber}
                  </span>
                  <h3 className="text-xl font-bold text-foreground mt-1.5">
                    {activeApplication.trainingName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Submitted on {new Date(activeApplication.submittedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Status Badges */}
                <div>
                  {activeApplication.status === "pending" && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      1. PENDING VALIDATION
                    </span>
                  )}
                  {activeApplication.status === "under_review" && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30 animate-pulse">
                      2. UNDER DOCUMENT REVIEW
                    </span>
                  )}
                  {activeApplication.status === "qualified" && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      3. QUALIFIED (FOR SCHEDULING)
                    </span>
                  )}
                  {activeApplication.status === "scheduled" && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                      4. SCHEDULED (BATCH SET)
                    </span>
                  )}
                  {activeApplication.status === "enrolled" && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                      5. ORIENTED & ENROLLED
                    </span>
                  )}
                  {activeApplication.status === "in_progress" && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      6. TRAINING IN PROGRESS
                    </span>
                  )}
                  {activeApplication.status === "completed" && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      7. COMPLETED & GRADUATED
                    </span>
                  )}
                  {activeApplication.status === "rejected" && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                      ❌ NOT QUALIFIED / REJECTED
                    </span>
                  )}
                </div>
              </div>

              {/* Rejection Details if rejected */}
              {activeApplication.status === "rejected" && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs text-rose-900 dark:text-rose-200">
                  <div className="flex items-center gap-2 font-bold">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span>Dahilan ng Hindi Pag-apruba (Disqualification):</span>
                  </div>
                  <p className="leading-relaxed pl-6">
                    {activeApplication.rejectionReason || "Incomplete requirements or expired residency proof."}
                  </p>
                  <div className="pt-2 pl-6">
                    <button
                      type="button"
                      onClick={() => setActiveTab("available")}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Mag-apply sa Ibang Kurso
                    </button>
                  </div>
                </div>
              )}

              {/* Live Attendance Tracker if In Progress */}
              {(activeApplication.status === "enrolled" ||
                activeApplication.status === "in_progress" ||
                activeApplication.status === "completed") && (
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                      Live Class Attendance
                    </span>
                    <span className="font-bold text-foreground">
                      {activeApplication.attendance?.hoursCompleted || 0} / {activeApplication.attendance?.totalHours || 12} Hours Completed
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((activeApplication.attendance?.hoursCompleted || 0) /
                              (activeApplication.attendance?.totalHours || 12)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 7-STEP INTERACTIVE TIMELINE */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  📍 7-Step SSDD Application Timeline Tracker
                </span>

                <div className="space-y-2.5 text-xs">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">1. Application Submitted (PENDING)</p>
                      <span className="text-[11px] text-muted-foreground">
                        Naisumite ang application form at mga dokumento (ID at Indigency).
                      </span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      activeApplication.status !== "pending"
                        ? "bg-muted/20 border-border"
                        : "bg-orange-500/5 border-orange-500/30"
                    }`}
                  >
                    {activeApplication.status !== "pending" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-foreground">2. SSDD Validation (UNDER REVIEW)</p>
                      <span className="text-[11px] text-muted-foreground">
                        Sinusuri ng Social Worker ang katumpakan ng QCID at Barangay Indigency.
                      </span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      activeApplication.status === "rejected"
                        ? "bg-rose-500/5 border-rose-500/30"
                        : activeApplication.status !== "pending" && activeApplication.status !== "under_review"
                        ? "bg-muted/20 border-border"
                        : "bg-muted/10 border-border/60 opacity-60"
                    }`}
                  >
                    {activeApplication.status === "rejected" ? (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : activeApplication.status !== "pending" && activeApplication.status !== "under_review" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-foreground">3. Qualification Result (QUALIFIED / REJECTED)</p>
                      <span className="text-[11px] text-muted-foreground">
                        {activeApplication.status === "rejected"
                          ? "Disqualified sa requirements screening."
                          : activeApplication.status !== "pending" && activeApplication.status !== "under_review"
                          ? "Pasado sa documentary screening. Nakatala sa Qualified Pool."
                          : "Naghihintay ng validation result."}
                      </span>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      activeApplication.status === "scheduled" ||
                      activeApplication.status === "enrolled" ||
                      activeApplication.status === "in_progress" ||
                      activeApplication.status === "completed"
                        ? "bg-muted/20 border-border"
                        : "bg-muted/10 border-border/60 opacity-60"
                    }`}
                  >
                    {activeApplication.status === "scheduled" ||
                    activeApplication.status === "enrolled" ||
                    activeApplication.status === "in_progress" ||
                    activeApplication.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-foreground">4. Batch & Training Schedule (SCHEDULED)</p>
                      <span className="text-[11px] text-muted-foreground">
                        {activeApplication.schedule?.batchName
                          ? `Assigned: ${activeApplication.schedule.batchName} (${activeApplication.schedule.trainingDate})`
                          : "Ise-set ng Admin ang batch schedule at appointment pass."}
                      </span>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      activeApplication.status === "enrolled" ||
                      activeApplication.status === "in_progress" ||
                      activeApplication.status === "completed"
                        ? "bg-muted/20 border-border"
                        : "bg-muted/10 border-border/60 opacity-60"
                    }`}
                  >
                    {activeApplication.status === "enrolled" ||
                    activeApplication.status === "in_progress" ||
                    activeApplication.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-foreground">5. Face-to-Face Orientation (ENROLLED)</p>
                      <span className="text-[11px] text-muted-foreground">
                        Minarkahan ng Admin bilang Orientation Completed sa center.
                      </span>
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      activeApplication.status === "in_progress" || activeApplication.status === "completed"
                        ? "bg-muted/20 border-border"
                        : "bg-muted/10 border-border/60 opacity-60"
                    }`}
                  >
                    {activeApplication.status === "in_progress" || activeApplication.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-foreground">6. Training Classes (TRAINING IN PROGRESS)</p>
                      <span className="text-[11px] text-muted-foreground">
                        Araw-araw na sesyon ng kasanayan at attendance record.
                      </span>
                    </div>
                  </div>

                  {/* Step 7 */}
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      activeApplication.status === "completed"
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-muted/10 border-border/60 opacity-60"
                    }`}
                  >
                    {activeApplication.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Award className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-foreground">7. Completion & Graduation (COMPLETED 🎓)</p>
                      <span className="text-[11px] text-muted-foreground">
                        Natapos ang 18 working days. Si Admin ang mag-i-issue ng physical certificate sa center.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Completion Action: Apply for Livelihood Capital / Starter Kit */}
              {activeApplication.status === "completed" && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-500/30 space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-emerald-600" />
                      <span>Mag-apply para sa Pangkabuhayang Puhunan o Starter Kit</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dahil matagumpay mong natapos ang kurso, kwalipikado ka nang magsumite ng aplikasyon para sa Capital Grant o Kagamitan (Starter Kit) upang magsimula ng sariling negosyo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/portal/apply-livelihood?category=livelihood")}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Briefcase className="h-4 w-4" />
                    <span>Mag-apply para sa Puhunan / Starter Kit Assistance →</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3">
              <Award className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
              <h4 className="font-bold text-base text-foreground">Wala pang Kasaysayan ng Pagsasanay</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Pumunta sa Tab 1 (Available Training) upang pumili ng kurso at mag-apply.
              </p>
            </div>
          )}
        </div>
      )}

      {/* POP-UP APPLICATION MODAL WIZARD */}
      {isApplyModalOpen && selectedCourseForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  Online Training Application Form
                </span>
                <h3 className="text-lg font-bold text-foreground mt-0.5">
                  {selectedCourseForModal.title}
                </h3>
                <p className="text-xs text-muted-foreground">{selectedCourseForModal.duration} • Free Government Training</p>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitModalApplication} className="space-y-4 text-xs">
              {/* Profile Preview */}
              <div className="p-3 bg-muted/30 rounded-xl border border-border space-y-1.5">
                <span className="font-bold text-[11px] text-foreground uppercase tracking-wider block">
                  Beneficiary Profile (Auto-filled)
                </span>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>Name: <strong className="text-foreground">{userProfile?.firstName || "JEFFERSON"} {userProfile?.lastName || "SANTOS"}</strong></div>
                  <div>QCID: <strong className="text-foreground">{getLoggedInUserQcid() || "110000116932100"}</strong></div>
                  <div>Barangay: <strong className="text-foreground">{userProfile?.barangay || "Sauyo"}</strong></div>
                  <div>Contact: <strong className="text-foreground">{userProfile?.mobileNumber || userProfile?.contactNo || "0917 123 4567"}</strong></div>
                </div>
              </div>

              {/* Uploads */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">1. Government Valid ID / QC ID *</label>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-border bg-background">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-mono text-[11px] text-foreground flex-1 truncate">
                      {uploadedId || "No file selected"}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      Attached
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">2. Barangay Indigency / Certificate of Residency *</label>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-border bg-background">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-mono text-[11px] text-foreground flex-1 truncate">
                      {uploadedIndigency || "No file selected"}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      Attached
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Reason / Purpose for Taking Training (Optional)</label>
                  <textarea
                    rows={2}
                    value={customRemarks}
                    onChange={(e) => setCustomRemarks(e.target.value)}
                    placeholder="Halimbawa: Nais kong magtayo ng maliit na panaderya o magtrabaho sa coffee shop."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs"
                  />
                </div>
              </div>

              {/* Guidelines Confirmation */}
              <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 text-[11px] text-blue-900 dark:text-blue-200">
                📌 <strong>Paalala:</strong> Sa pag-click ng Submit, papasok ang iyong aplikasyon sa <strong>SSDD Validation</strong>. Kapag naaprubahan, makakatanggap ka ng opisyal na iskedyul para sa Oryentasyon at Klase.
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-foreground text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? "Submitting..." : "Submit Application"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

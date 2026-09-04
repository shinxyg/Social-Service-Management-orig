import React, { useState, useEffect } from "react"
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Clock3,
  AlertCircle,
  XCircle,
  FileEdit,
  Award,
  Download,
  Printer,
  ChevronRight,
  Sparkles,
  Scissors,
  UtensilsCrossed,
  Laptop,
  Check,
  ArrowRight,
  Info,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Home,
  RefreshCw,
} from "lucide-react"
import { API_BASE } from "../../config/api"
import { getCurrentUserProfile, getLoggedInUserQcid, type LoggedInUserProfile } from "../../utils/userProfile"

export type TrainingProgramTab = "available" | "apply" | "schedule" | "history"

export interface TrainingCourse {
  id: string
  title: string
  category: string
  description: string
  date: string
  time: string
  location: string
  landmark: string
  totalSlots: number
  availableSlots: number
  durationHours: number
  instructor: string
  prerequisites: string
  materialsProvided: string
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
    address: string
    barangay: string
    city: string
    sex: string
    dateOfBirth: string
    age: string | number
    occupation?: string
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
    id: "tr-sewing",
    title: "Sewing Training",
    category: "Livelihood & Skills Development",
    description: "Matutunan ang pattern drafting, pananahi ng mga damit at kurtina, paggamit at pag-aalaga ng sewing machine, at paglikha ng mga produktong maaaring ibenta sa komunidad.",
    date: "September 15, 2026 - September 18, 2026",
    time: "9:00 AM - 12:00 PM",
    location: "QC Skills Development Center, Batasan Hills",
    landmark: "Tapat ng Puregold Batasan / Katabi ng Batasan Hills Barangay Hall",
    totalSlots: 25,
    availableSlots: 18,
    durationHours: 16,
    instructor: "Gng. Rosa Dimaculangan (Master Tailor)",
    prerequisites: "QC Resident (18 taong gulang pataas), may interes sa pananahi.",
    materialsProvided: "Sewing fabric, thread kit, pattern paper, tracing wheel, measuring tape.",
  },
  {
    id: "tr-cooking",
    title: "Cooking Training",
    category: "Livelihood & Skills Development",
    description: "Matutunan ang commercial cooking, food safety & sanitation, paghahanda ng merienda at lutong ulam na patok sa karenderya, at tamang costing at pagpepresyo.",
    date: "September 20, 2026 - September 23, 2026",
    time: "1:00 PM - 4:00 PM",
    location: "QC Skills Development Center, Batasan Hills",
    landmark: "3rd Floor Culinary Lab, malapit sa Batasan Hills Barangay Hall",
    totalSlots: 25,
    availableSlots: 12,
    durationHours: 16,
    instructor: "Chef Anthony Santos (Culinary Specialist)",
    prerequisites: "QC Resident, handang sumunod sa kitchen hygiene & food safety guidelines.",
    materialsProvided: "Ingredients kit, cooking apron, hairnet, recipe guide booklet.",
  },
  {
    id: "tr-beauty",
    title: "Beauty Services Training",
    category: "Livelihood & Skills Development",
    description: "Pangunahing kasanayan sa haircutting at hairstyling, manicure/pedicure na may nail art, facial cleansing at basic cosmetology para sa salon o home-service livelihood.",
    date: "September 24, 2026 - September 27, 2026",
    time: "9:00 AM - 12:00 PM",
    location: "QC Skills Development Center, Batasan Hills",
    landmark: "Ground Floor Wellness Studio, tapat ng Puregold Batasan",
    totalSlots: 25,
    availableSlots: 15,
    durationHours: 16,
    instructor: "Bb. Cheryl Mendez (Certified Cosmetologist)",
    prerequisites: "QC Resident (18 taong gulang pataas), masigasig matuto ng beauty care.",
    materialsProvided: "Nail grooming kit, salon cape, hair clips, sanitizer and manicure tools.",
  },
  {
    id: "tr-computer",
    title: "Basic Computer Training",
    category: "Livelihood & Skills Development",
    description: "Pagsasanay sa computer navigation, Microsoft Word document typing, Excel spreadsheet budgeting, internet search, email communication, at online job preparation.",
    date: "September 28, 2026 - October 01, 2026",
    time: "1:00 PM - 4:00 PM",
    location: "QC Skills Development Center, Batasan Hills",
    landmark: "2nd Floor Computer Laboratory, Batasan Hills Center",
    totalSlots: 30,
    availableSlots: 22,
    durationHours: 16,
    instructor: "G. Mark Villanueva (IT Skills Coordinator)",
    prerequisites: "QC Resident na nais matuto ng computer mula sa basic navigation hanggang office tools.",
    materialsProvided: "Computer workstation with internet, digital handouts, practice USB drive.",
  },
]

interface TrainingProgramViewProps {
  initialTab?: TrainingProgramTab
}

export default function TrainingProgramView({ initialTab = "available" }: TrainingProgramViewProps) {
  const [activeTab, setActiveTab] = useState<TrainingProgramTab>(initialTab)
  const [courses, setCourses] = useState<TrainingCourse[]>(DEFAULT_COURSES)
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Current active user application state
  const [activeApplication, setActiveApplication] = useState<TrainingApplicationRecord | null>(null)
  const [allUserApplications, setAllUserApplications] = useState<TrainingApplicationRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Apply Form State
  const [applyCourseId, setApplyCourseId] = useState<string>("tr-sewing")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formStep, setFormStep] = useState<"select" | "profile" | "review">("select")
  const [isAttested, setIsAttested] = useState(false)
  const [isRevising, setIsRevising] = useState(false)

  // Certificate Modal State
  const [certificateModalApp, setCertificateModalApp] = useState<TrainingApplicationRecord | null>(null)

  // User Profile
  const profile: LoggedInUserProfile = getCurrentUserProfile()
  const userQcid = getLoggedInUserQcid() || profile.qcidNo || "110000116932100"

  // Fetch available courses and user applications
  const fetchTrainingData = async () => {
    try {
      // 1. Fetch available programs
      try {
        const resProg = await fetch(`${API_BASE}/api/training/programs`)
        if (resProg.ok) {
          const data = await resProg.json()
          if (data.success && Array.isArray(data.programs) && data.programs.length > 0) {
            setCourses(data.programs)
          }
        }
      } catch (_) {}

      // 2. Fetch user applications
      try {
        const resApps = await fetch(`${API_BASE}/api/training/applications?qcid=${userQcid}`)
        if (resApps.ok) {
          const data = await resApps.json()
          if (data.success && Array.isArray(data.applications)) {
            const userApps = data.applications.filter(
              (a: any) =>
                a.qcid === userQcid ||
                a.userId === userQcid ||
                a.applicantInfo?.email?.toLowerCase() === profile.email?.toLowerCase()
            )
            setAllUserApplications(userApps)
            if (userApps.length > 0) {
              setActiveApplication(userApps[0])
              return
            }
          }
        }
      } catch (_) {}

      // Fallback: localStorage
      const local = JSON.parse(localStorage.getItem("training_applications") || "[]")
      if (Array.isArray(local) && local.length > 0) {
        const match = local.filter(
          (a: any) =>
            a.qcid === userQcid ||
            a.userId === userQcid ||
            a.applicantInfo?.email?.toLowerCase() === profile.email?.toLowerCase()
        )
        setAllUserApplications(match)
        if (match.length > 0) {
          setActiveApplication(match[0])
          return
        }
      }
    } catch (e) {
      console.error("Failed to load training data:", e)
    }
  }

  useEffect(() => {
    fetchTrainingData()
    const interval = setInterval(fetchTrainingData, 3000)
    return () => clearInterval(interval)
  }, [userQcid])

  // Get icon for training course
  const getCourseIcon = (id: string) => {
    if (id.includes("sewing")) return <Scissors className="h-6 w-6 text-indigo-600" />
    if (id.includes("cooking")) return <UtensilsCrossed className="h-6 w-6 text-amber-600" />
    if (id.includes("beauty")) return <Sparkles className="h-6 w-6 text-pink-600" />
    return <Laptop className="h-6 w-6 text-blue-600" />
  }

  // Handle open details modal
  const handleOpenDetails = (course: TrainingCourse) => {
    setSelectedCourse(course)
    setIsDetailModalOpen(true)
  }

  // Handle jump from course to Apply tab
  const handleSelectToApply = (course: TrainingCourse) => {
    setSelectedCourse(course)
    setApplyCourseId(course.id)
    setIsDetailModalOpen(false)
    setActiveTab("apply")
    setFormStep("profile")
  }

  // Handle submit application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAttested) {
      alert("Paki-tsek ang kumpirmasyon bago isumite ang aplikasyon.")
      return
    }

    setIsSubmitting(true)
    const matched = courses.find((c) => c.id === applyCourseId) || courses[0]

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
        email: profile.email || "",
        contactNo: profile.contactNo || profile.mobileNumber || "09172345678",
        address: `${profile.houseNo || ""} ${profile.street || ""}`.trim() || "Quezon City Resident Address",
        barangay: profile.barangay || "Central",
        city: profile.city || "Quezon City",
        sex: profile.sex || "Female",
        dateOfBirth: profile.birthDate || "1998-05-12",
        age: profile.age || 26,
        occupation: profile.occupation || "Resident",
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
          setActiveApplication(data.application)
          setAllUserApplications((prev) => [data.application, ...prev])
          // Save in local storage
          const existing = JSON.parse(localStorage.getItem("training_applications") || "[]")
          localStorage.setItem("training_applications", JSON.stringify([data.application, ...existing]))
        }
      } else {
        // Fallback local creation
        const fallbackApp: TrainingApplicationRecord = {
          id: Date.now(),
          referenceNumber: `TP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
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

  // Active status badge helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            APPROVED
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            REJECTED
          </span>
        )
      case "needs_revision":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            NEEDS REVISION
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            <Clock3 className="h-3.5 w-3.5 text-blue-600" />
            PENDING / UNDER REVIEW
          </span>
        )
    }
  }

  const isApproved = activeApplication?.status === "approved"
  const completedTrainings = allUserApplications.filter((a) => a.attendance?.completed || a.schedule?.trainingStatus === "Completed" || a.certificate)

  return (
    <div className="space-y-6">
      {/* Sub-Module Top Header */}
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white tracking-wide uppercase">
                QC Skills Development
              </span>
              <span className="text-xs text-muted-foreground">Livelihood &amp; Training Program Sub-Module</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Quezon City Training Program
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              Libreng skills training at sertipikasyon para sa mga residente ng Quezon City.
              Kumuha ng NC II/Skills certificate para sa livelihood assistance at hanapbuhay.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchTrainingData}
              className="p-2 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="I-refresh ang data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {activeApplication && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Current Application</p>
                <div className="mt-0.5">{renderStatusBadge(activeApplication.status)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4-Stage Navigation Tabs */}
      <div className="bg-card border border-border rounded-2xl p-1.5 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {/* Tab 1: Available Training */}
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
            <span>1. AVAILABLE TRAINING</span>
          </button>

          {/* Tab 2: Apply for Training */}
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
            <span>2. APPLY FOR TRAINING</span>
          </button>

          {/* Tab 3: Training Schedule */}
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
            <span>3. TRAINING SCHEDULE</span>
          </button>

          {/* Tab 4: Training History */}
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
            <span>4. TRAINING HISTORY</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. AVAILABLE TRAINING CONTENT                                */}
      {/* ============================================================ */}
      {activeTab === "available" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Mga Bukas na Pagsasanay (Available Trainings)
              </h3>
              <p className="text-xs text-muted-foreground">
                Pumili ng training program na angkop sa iyong interes at schedule bago mag-apply.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 w-fit">
              {courses.length} Open Programs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => {
              const slotPercent = Math.round(((course.totalSlots - course.availableSlots) / course.totalSlots) * 100)
              return (
                <div
                  key={course.id}
                  className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
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
                            {course.durationHours} Hours Intensive Training
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 whitespace-nowrap">
                        {course.availableSlots} slots left
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Schedule & Location summary */}
                    <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="font-medium text-foreground">{course.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span>{course.time}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{course.location} • <span className="italic text-[11px]">{course.landmark}</span></span>
                      </div>
                    </div>

                    {/* Slots progress */}
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                        <span>Slots filled</span>
                        <span>{course.totalSlots - course.availableSlots} / {course.totalSlots} slots ({slotPercent}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${slotPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-4 mt-2 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(course)}
                      className="px-3 py-2 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 text-foreground text-xs font-semibold transition-all cursor-pointer text-center"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectToApply(course)}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. APPLY FOR TRAINING & APPLICATION STATUS                   */}
      {/* ============================================================ */}
      {activeTab === "apply" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Active Application Status Tracker Banner (if any) */}
          {activeApplication && !isRevising && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">
                      Training Application Status
                    </h3>
                    {renderStatusBadge(activeApplication.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Reference Number: <span className="font-mono font-bold text-foreground">{activeApplication.referenceNumber}</span>
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Submitted: {new Date(activeApplication.submittedAt).toLocaleDateString()}
                </div>
              </div>

              {/* Status specific detailed explanation card */}
              {activeApplication.status === "pending" && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-sm">
                    <Clock3 className="h-4 w-4" />
                    <span>PENDING / UNDER REVIEW</span>
                  </div>
                  <p className="text-xs text-blue-900/80 dark:text-blue-200 leading-relaxed">
                    Ang inyong aplikasyon para sa <strong>{activeApplication.trainingName}</strong> ay kasalukuyang sinusuri ng QC Skills Development Coordinator.
                    Maghintay ng 1-2 araw para sa beripikasyon at pinal na iskedyul.
                  </p>
                </div>
              )}

              {activeApplication.status === "approved" && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>APPROVED – Kumpirmado ang inyong Training Slot!</span>
                  </div>
                  <p className="text-xs text-emerald-900/80 dark:text-emerald-200 leading-relaxed">
                    Maaari ka nang sumali sa <strong>{activeApplication.trainingName}</strong>. Nakatakda ang iyong schedule sa ibaba at maaari mong subaybayan ang iyong attendance sa Tab 3.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("schedule")}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer w-fit"
                  >
                    <span>Pumunta sa Training Schedule</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {activeApplication.status === "rejected" && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                    <XCircle className="h-4 w-4" />
                    <span>APPLICATION REJECTED</span>
                  </div>
                  <p className="text-xs text-rose-900/80 dark:text-rose-200 leading-relaxed">
                    Dahilan: {activeApplication.rejectionReason || "Hindi pumasok sa residency validation o puno na ang slots sa naturang batch."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRevising(true)
                      setFormStep("select")
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer w-fit"
                  >
                    Mag-apply sa Ibang Kurso
                  </button>
                </div>
              )}

              {activeApplication.status === "needs_revision" && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>NEEDS REVISION – May kailangang i-edit sa inyong application</span>
                  </div>
                  <p className="text-xs text-amber-900/80 dark:text-amber-200 leading-relaxed">
                    Paalala mula sa Admin: <em>"{activeApplication.revisionNotes || "Paki-update ang inyong contact information o tirahan."}"</em>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRevising(true)
                      setFormStep("profile")
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer w-fit"
                  >
                    <FileEdit className="h-3.5 w-3.5" />
                    <span>I-edit at I-resubmit ang Aplikasyon</span>
                  </button>
                </div>
              )}

              {/* Application Summary details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/20 p-4 rounded-xl border border-border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Selected Program:</span>
                  <span className="font-bold text-foreground">{activeApplication.trainingName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Applicant Name:</span>
                  <span className="font-bold text-foreground">{activeApplication.applicantInfo?.fullName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">QC ID Number:</span>
                  <span className="font-mono font-bold text-foreground">{activeApplication.qcid}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Contact &amp; Barangay:</span>
                  <span className="font-semibold text-foreground">{activeApplication.applicantInfo?.contactNo} • Brgy. {activeApplication.applicantInfo?.barangay}</span>
                </div>
              </div>
            </div>
          )}

          {/* APPLICATION FORM (shown if no application yet, or if revising/re-applying) */}
          {(!activeApplication || isRevising) && (
            <form onSubmit={handleSubmitApplication} className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-xl font-bold text-foreground">
                  Apply for Training Program
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Mabilisang aplikasyon para sa mga programang pangkabuhayan at skills training ng Quezon City.
                </p>
              </div>

              {/* Step 1: Select Training */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                  Step 1. Pumili ng Kursong Nais Salihan (Select Training) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {courses.map((c) => {
                    const isSelected = applyCourseId === c.id
                    return (
                      <div
                        key={c.id}
                        onClick={() => setApplyCourseId(c.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-blue-600 bg-blue-500/10 text-foreground ring-2 ring-blue-500/20"
                            : "border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background border border-border">
                            {getCourseIcon(c.id)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{c.title}</p>
                            <p className="text-[11px] text-muted-foreground">{c.durationHours} Hours • {c.availableSlots} slots</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Step 2: Auto-filled Applicant Information from User Profile */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                    Step 2. Impormasyon ng Aplikante (Auto-filled from User Profile)
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified QC Profile
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/20 border border-border text-xs text-muted-foreground flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    Ang sumusunod na impormasyon ay <strong>kusang kinuha mula sa iyong QC eServices User Profile</strong> upang hindi mo na kailangang mag-type muli.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">QC ID Reference Number</label>
                    <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border font-mono font-bold text-foreground">
                      {userQcid}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Buong Pangalan (Full Name)</label>
                    <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border font-bold text-foreground">
                      {profile.firstName} {profile.middleName} {profile.lastName} {profile.suffix}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Email Address</label>
                    <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border text-foreground">
                      {profile.email || "resident@quezoncity.gov.ph"}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Contact / Mobile Number</label>
                    <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border font-semibold text-foreground">
                      {profile.contactNo || profile.mobileNumber || "0917 234 5678"}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Kasarian (Sex) &amp; Edad</label>
                    <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border text-foreground">
                      {profile.sex || "Female"} • {profile.age || "24"} taong gulang
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Barangay &amp; Lungsod</label>
                    <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border font-medium text-foreground">
                      Brgy. {profile.barangay || "Sauyo"}, Quezon City
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Review Application */}
              <div className="space-y-3 pt-4 border-t border-border">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                  Step 3. Repasuhin ang Aplikasyon (Review Application)
                </label>
                {(() => {
                  const picked = courses.find((c) => c.id === applyCourseId) || courses[0]
                  return (
                    <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-sm text-foreground">
                        <span>{picked.title}</span>
                        <span className="text-blue-600">{picked.durationHours} Hours</span>
                      </div>
                      <p className="text-muted-foreground">Petsa: <strong className="text-foreground">{picked.date}</strong> ({picked.time})</p>
                      <p className="text-muted-foreground">Lokasyon: <strong className="text-foreground">{picked.location}</strong></p>
                      <p className="text-muted-foreground italic">Landmark: {picked.landmark}</p>
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
                  <span className="text-xs text-muted-foreground">
                    Pinatutunayan ko na totoo ang lahat ng impormasyong nakatala at ako ay tapat na dadalo sa buong takdang oras ng pagsasanay.
                  </span>
                </label>
              </div>

              {/* Step 4: Submit Application */}
              <div className="pt-2 flex items-center justify-end gap-3">
                {isRevising && (
                  <button
                    type="button"
                    onClick={() => setIsRevising(false)}
                    className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted/40 text-xs font-bold text-muted-foreground cursor-pointer"
                  >
                    Kanselahin
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !isAttested}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Isinusumite...</span>
                    </>
                  ) : (
                    <>
                      <span>Isumite ang Aplikasyon (Submit Application)</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TRAINING SCHEDULE CONTENT                                 */}
      {/* ============================================================ */}
      {activeTab === "schedule" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Training Schedule &amp; Attendance Record
            </h3>
            <p className="text-xs text-muted-foreground">
              Tingnan ang detalye ng takdang araw, oras, venue, at subaybayan ang iyong attendance.
            </p>
          </div>

          {!activeApplication || activeApplication.status !== "approved" ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Calendar className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                Wala Pang Naaprubahang Training Schedule
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Magiging aktibo ang seksyong ito kapag <strong>APPROVED</strong> na ang iyong Training Application mula sa QC Skills Development Division.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab(activeApplication ? "apply" : "available")}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2 mt-2"
              >
                <span>{activeApplication ? "Tingnan ang Application Status" : "Tingnan ang Available Trainings"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Schedule Main Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                      Confirmed Batch Schedule
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
                      <span className="font-semibold text-muted-foreground block text-[11px]">Training Date</span>
                      <span className="font-bold text-foreground text-sm">{activeApplication.schedule?.trainingDate}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                    <Clock className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-muted-foreground block text-[11px]">Training Time</span>
                      <span className="font-bold text-foreground text-sm">{activeApplication.schedule?.trainingTime}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border sm:col-span-2">
                    <MapPin className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-muted-foreground block text-[11px]">Training Location &amp; Landmark</span>
                      <span className="font-bold text-foreground text-sm block">{activeApplication.schedule?.trainingLocation}</span>
                      <span className="text-muted-foreground text-xs mt-0.5 block italic">
                        Landmark: {activeApplication.schedule?.landmark || "Tapat ng Puregold Batasan, Katabi ng Batasan Hills Barangay Hall"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance / Completion Record Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      Attendance &amp; Completion Tracker
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Kailangang makumpleto ang 16 oras para ma-isyu ang Certificate of Completion.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-blue-600">
                      {activeApplication.attendance?.hoursCompleted || 0} / {activeApplication.attendance?.totalHours || 16} Hours
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((activeApplication.attendance?.hoursCompleted || 0) / (activeApplication.attendance?.totalHours || 16)) * 100)
                      )}%`,
                    }}
                  />
                </div>

                {/* Sessions list */}
                <div className="space-y-2 pt-2">
                  {activeApplication.attendance?.sessions?.map((sess) => (
                    <div
                      key={sess.day}
                      className="p-3 rounded-xl border border-border bg-muted/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            sess.attended ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {sess.attended ? <Check className="h-4 w-4" /> : sess.day}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Day {sess.day}: {sess.topic}</p>
                          <p className="text-[11px] text-muted-foreground">{sess.date || "Scheduled session"}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          sess.attended
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {sess.attended ? "Attended ✓" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>

                {activeApplication.attendance?.completed && (
                  <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Award className="h-6 w-6 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
                          Binabati kita! Nakumpleto mo ang Training Program.
                        </p>
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                          Handa na ang iyong opisyal na Certificate of Completion.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("history")
                        setCertificateModalApp(activeApplication)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      View Certificate
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. TRAINING HISTORY & CERTIFICATES                           */}
      {/* ============================================================ */}
      {activeTab === "history" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Training History &amp; Official Certificates
            </h3>
            <p className="text-xs text-muted-foreground">
              Talaan ng mga natapos mong training program at mga naisyung Certificate of Completion.
              Magagamit ito bilang requirements sa Livelihood Capital Assistance at trabaho.
            </p>
          </div>

          {completedTrainings.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto">
                <Award className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                Wala Pang Natapos na Training
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Kapag natapos mo ang iyong 16-hour skills training, dito mo makikita at mada-download ang iyong opisyal na sertipiko mula sa Quezon City Government.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("available")}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2 mt-2"
              >
                <span>Maghanap ng Training Program</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {completedTrainings.map((app) => (
                <div
                  key={app.id}
                  className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                        COMPLETED (16 HOURS)
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">REF {app.referenceNumber}</span>
                    </div>
                    <h4 className="font-bold text-base text-foreground">
                      {app.trainingName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Natapos noong: <strong>{app.schedule?.trainingDate || "Recent"}</strong> sa {app.schedule?.trainingLocation}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCertificateModalApp(app)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Award className="h-4 w-4" />
                      <span>Tingnan ang Sertipiko</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TRAINING DETAILS                                      */}
      {/* ============================================================ */}
      {isDetailModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  {getCourseIcon(selectedCourse.id)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedCourse.title}</h3>
                  <p className="text-xs text-muted-foreground">{selectedCourse.durationHours} Hours Skills Development Program</p>
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
                <span className="font-semibold text-muted-foreground block text-[11px]">Ano ang Matututunan:</span>
                <p className="text-foreground leading-relaxed mt-0.5">{selectedCourse.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px]">Petsa (Date):</span>
                  <span className="font-bold text-foreground">{selectedCourse.date}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px]">Oras (Time):</span>
                  <span className="font-bold text-foreground">{selectedCourse.time}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="font-semibold text-muted-foreground block text-[11px]">Lokasyon at Landmark:</span>
                <span className="font-bold text-foreground block">{selectedCourse.location}</span>
                <span className="text-muted-foreground italic text-[11px] mt-0.5 block">{selectedCourse.landmark}</span>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="font-semibold text-muted-foreground block text-[11px]">Instructor &amp; Materials:</span>
                <p className="text-foreground font-medium">{selectedCourse.instructor}</p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">Libreng gamit: {selectedCourse.materialsProvided}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Isara
              </button>
              <button
                type="button"
                onClick={() => handleSelectToApply(selectedCourse)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Mag-apply sa Training na Ito</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: OFFICIAL CERTIFICATE OF COMPLETION                    */}
      {/* ============================================================ */}
      {certificateModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header controls */}
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

            {/* Printable Certificate Canvas */}
            <div
              id="qc-official-certificate"
              className="bg-white text-slate-900 border-8 border-double border-amber-600/60 rounded-xl p-6 sm:p-8 text-center space-y-4 shadow-md relative"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {/* Seal and headers */}
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
                    QUEZON CITY GOVERNMENT
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
                  Ipinagkakaloob ang katibayang ito kay
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 underline decoration-amber-600 underline-offset-8 mt-1.5 mb-3">
                  {certificateModalApp.applicantInfo?.fullName || "CLARISA MAE GALIAS DIMAL"}
                </h3>
                <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed">
                  para sa matagumpay na pagtatapos ng <strong>16 Oras ng Masinsinang Pagsasanay</strong> sa ilalim ng
                  kursong <strong>{certificateModalApp.trainingName}</strong> na ginanap sa QC Skills Development Center, Batasan Hills, Quezon City.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 text-left text-[10px] text-slate-600 border-t border-slate-200">
                <div>
                  <p>Certificate No: <strong className="font-mono text-slate-900">{certificateModalApp.certificate?.certificateNo || `QC-CERT-2026-${Math.floor(10000 + Math.random() * 90000)}`}</strong></p>
                  <p>Petsa ng Pag-isyu: <strong className="text-slate-900">{certificateModalApp.certificate?.issueDate || new Date().toLocaleDateString()}</strong></p>
                  <p>QC ID: <strong className="font-mono text-slate-900">{certificateModalApp.qcid}</strong></p>
                </div>

                <div className="text-right">
                  <div className="w-32 h-10 border-b border-slate-400 ml-auto mb-1 flex items-end justify-center">
                    <span className="font-script text-xs text-slate-700 italic">QC Skills Director</span>
                  </div>
                  <p className="font-bold text-slate-800">ATTY. MARIQUITA BELMONTE</p>
                  <p className="text-[9px] text-slate-500">SSDD Department Head</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Certificate</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print()
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from "react"
import {
  Award,
  Search,
  CheckCircle2,
  Check,
  RefreshCw,
  Calendar,
  User,
  Send,
  Eye,
} from "lucide-react"
import { API_BASE } from "../../config/api"
import { useLanguage } from "../ui/language-context"
import { notifyApplicationChange } from "../../utils/realtimeSync"
import type { TrainingApplicationRecord } from "../user-portal/training-program-view"
import MaskedText from "../ui/masked-text"

export default function TrainingProgramAdmin() {
  const { language } = useLanguage()
  const isEn = language === "en"
  const isBis = language === "bis"

  const [applications, setApplications] = useState<TrainingApplicationRecord[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedApp, setSelectedApp] = useState<TrainingApplicationRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Scheduling Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [schedulingApp, setSchedulingApp] = useState<TrainingApplicationRecord | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    batchName: "3rd Batch 2026",
    orientationDate: "October 12, 2026",
    orientationTime: "9:00 AM – 11:00 AM",
    orientationVenue: "SSDD Skills Training Center, Main AVR",
    startDate: "October 15, 2026",
    endDate: "November 5, 2026",
    trainingTime: "8:00 AM – 12:00 PM (Monday to Friday)",
    venue: "QC Skills Development Center, Room 204",
    trainerName: "Chef Maria Santos (Master Assessor)",
  })

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingApp, setRejectingApp] = useState<TrainingApplicationRecord | null>(null)
  const [selectedRejectReason, setSelectedRejectReason] = useState("Incomplete or expired Barangay Indigency / proof of residency")
  const [customRejectNote, setCustomRejectNote] = useState("")

  const fetchTrainingApplications = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/training/applications`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.applications || []
        if (Array.isArray(list)) {
          setApplications(list)
          if (selectedApp) {
            const currentSelected = list.find(
              (a: TrainingApplicationRecord) =>
                String(a.id) === String(selectedApp.id) || a.referenceNumber === selectedApp.referenceNumber
            )
            if (currentSelected) setSelectedApp(currentSelected)
          }
          try {
            localStorage.setItem("training_applications", JSON.stringify(list))
          } catch (_) {}
          return
        }
      }
    } catch (_) {
    } finally {
      setIsLoading(false)
    }

    try {
      const stored = localStorage.getItem("training_applications")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setApplications(parsed)
          if (selectedApp) {
            const currentSelected = parsed.find(
              (a: TrainingApplicationRecord) =>
                String(a.id) === String(selectedApp.id) || a.referenceNumber === selectedApp.referenceNumber
            )
            if (currentSelected) setSelectedApp(currentSelected)
          }
        }
      }
    } catch (_) {}
  }

  useEffect(() => {
    fetchTrainingApplications()
    const interval = setInterval(fetchTrainingApplications, 8000)
    const handleSync = () => fetchTrainingApplications()
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
  }, [selectedApp?.id, selectedApp?.referenceNumber])

  const persistAppUpdate = async (updated: TrainingApplicationRecord) => {
    setIsProcessing(true)
    const updatedList = applications.map((a) =>
      String(a.id) === String(updated.id) || a.referenceNumber === updated.referenceNumber ? updated : a
    )
    setApplications(updatedList)
    setSelectedApp(updated)

    try {
      localStorage.setItem("training_applications", JSON.stringify(updatedList))
    } catch (_) {}

    try {
      const res = await fetch(`${API_BASE}/api/training/applications/${updated.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updated.status,
          rejectionReason: updated.rejectionReason,
          attendance: updated.attendance,
          schedule: updated.schedule,
          trainingStatus: updated.schedule?.trainingStatus,
          approvedBy: updated.approvedBy || "SSDD Skills Development Division",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data && data.application) {
          const finalApp = data.application
          const refreshed = updatedList.map((a) =>
            String(a.id) === String(finalApp.id) || a.referenceNumber === finalApp.referenceNumber ? finalApp : a
          )
          setApplications(refreshed)
          setSelectedApp(finalApp)
          try {
            localStorage.setItem("training_applications", JSON.stringify(refreshed))
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn("persistAppUpdate fetch error:", err)
    } finally {
      setIsProcessing(false)
    }

    window.dispatchEvent(new Event("storage"))
    const syncType =
      updated.status === "approved" || updated.status === "qualified"
        ? "APPLICATION_APPROVED"
        : updated.status === "rejected"
        ? "APPLICATION_REJECTED"
        : "STATUS_CHANGED"
    notifyApplicationChange(syncType, "livelihood", updated.referenceNumber)
  }

  // Step 2: Open Docs -> Mark as Under Review
  const handleViewApp = async (app: TrainingApplicationRecord) => {
    setSelectedApp(app)
    if (app.status === "pending") {
      const updated: TrainingApplicationRecord = {
        ...app,
        status: "under_review",
      }
      await persistAppUpdate(updated)
    }
  }

  // Step 3: Screening -> Approve as Qualified
  const handleApproveQualified = async (app: TrainingApplicationRecord) => {
    const updated: TrainingApplicationRecord = {
      ...app,
      status: "qualified",
      approvedBy: "SSDD Social Worker Evaluator",
      approvedDate: new Date().toISOString(),
      rejectionReason: undefined,
    }
    await persistAppUpdate(updated)
  }

  // Step 3: Screening -> Reject
  const handleOpenReject = (app: TrainingApplicationRecord) => {
    setRejectingApp(app)
    setSelectedRejectReason("Incomplete or expired Barangay Indigency / proof of residency")
    setCustomRejectNote("")
    setShowRejectModal(true)
  }

  const handleConfirmReject = async () => {
    if (!rejectingApp) return
    const finalReason = customRejectNote.trim()
      ? `${selectedRejectReason} — ${customRejectNote.trim()}`
      : selectedRejectReason

    const updated: TrainingApplicationRecord = {
      ...rejectingApp,
      status: "rejected",
      rejectionReason: finalReason,
    }
    await persistAppUpdate(updated)
    setShowRejectModal(false)
    setRejectingApp(null)
  }

  // Step 4: Scheduling Modal
  const handleOpenSchedule = (app: TrainingApplicationRecord) => {
    setSchedulingApp(app)
    setScheduleForm({
      batchName: app.schedule?.batchName || "3rd Batch 2026",
      orientationDate: app.schedule?.orientationDate || "October 12, 2026",
      orientationTime: app.schedule?.orientationTime || "9:00 AM – 11:00 AM",
      orientationVenue: app.schedule?.orientationVenue || "SSDD Skills Training Center, Main AVR",
      startDate: app.schedule?.trainingDate?.split("-")[0]?.trim() || "October 15, 2026",
      endDate: app.schedule?.trainingDate?.split("-")[1]?.trim() || "November 5, 2026",
      trainingTime: app.schedule?.trainingTime || "8:00 AM – 12:00 PM (Monday to Friday)",
      venue: app.schedule?.trainingLocation || "QC Skills Development Center, Room 204",
      trainerName: app.schedule?.instructor || "Chef Maria Santos (Master Assessor)",
    })
    setShowScheduleModal(true)
  }

  const handleConfirmSchedule = async () => {
    if (!schedulingApp) return
    const updatedSchedule = {
      ...schedulingApp.schedule,
      batchName: scheduleForm.batchName,
      trainingName: schedulingApp.trainingName,
      trainingDate: `${scheduleForm.startDate} – ${scheduleForm.endDate}`,
      trainingTime: scheduleForm.trainingTime,
      trainingLocation: scheduleForm.venue,
      instructor: scheduleForm.trainerName,
      orientationDate: scheduleForm.orientationDate,
      orientationTime: scheduleForm.orientationTime,
      orientationVenue: scheduleForm.orientationVenue,
      trainingStatus: "Upcoming" as const,
    }

    const updated: TrainingApplicationRecord = {
      ...schedulingApp,
      status: "scheduled",
      schedule: updatedSchedule,
    }

    await persistAppUpdate(updated)

    // Dispatch Schedule Confirmation Email
    try {
      const recipientEmail = schedulingApp.applicantInfo?.email
      if (recipientEmail) {
        await fetch(`${API_BASE}/api/email/send-training-scheduled`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientEmail,
            recipientName: schedulingApp.applicantInfo?.fullName || "Valued Resident",
            referenceNumber: schedulingApp.referenceNumber,
            trainingProgram: schedulingApp.trainingName,
            batchName: scheduleForm.batchName,
            startDate: scheduleForm.startDate,
            endDate: scheduleForm.endDate,
            trainingTime: scheduleForm.trainingTime,
            venue: scheduleForm.venue,
            trainerName: scheduleForm.trainerName,
            orientationDate: scheduleForm.orientationDate,
            orientationTime: scheduleForm.orientationTime,
            orientationVenue: scheduleForm.orientationVenue,
          }),
        })
      }
    } catch (e) {
      console.warn("Email dispatch error:", e)
    }

    setShowScheduleModal(false)
    setSchedulingApp(null)
  }

  // Step 5: Orientation Completed -> Mark Enrolled
  const handleMarkOrientationDone = async (app: TrainingApplicationRecord) => {
    const updated: TrainingApplicationRecord = {
      ...app,
      status: "enrolled",
    }
    await persistAppUpdate(updated)
  }

  // Step 6: Toggle Attendance -> Mark In Progress
  const handleToggleAttendanceDay = async (app: TrainingApplicationRecord, sessionIndex: number) => {
    const currentSessions = app.attendance?.sessions || [
      { day: 1, topic: "Module 1: Orientation & Sanitation", hours: 3, attended: false, date: "Day 1" },
      { day: 2, topic: "Module 2: Practical Techniques", hours: 3, attended: false, date: "Day 2" },
      { day: 3, topic: "Module 3: Hands-on Laboratory", hours: 3, attended: false, date: "Day 3" },
      { day: 4, topic: "Module 4: Final Practical Assessment", hours: 3, attended: false, date: "Day 4" },
    ]

    const updatedSessions = currentSessions.map((s, idx) =>
      idx === sessionIndex ? { ...s, attended: !s.attended } : s
    )
    const attendedCount = updatedSessions.filter((s) => s.attended).length
    const totalHours = app.attendance?.totalHours || 12
    const hoursCompleted = attendedCount * 3
    const isCompleted = attendedCount === updatedSessions.length

    const updated: TrainingApplicationRecord = {
      ...app,
      status: isCompleted ? "completed" : attendedCount > 0 ? "in_progress" : "enrolled",
      attendance: {
        totalHours,
        hoursCompleted,
        completed: isCompleted,
        sessions: updatedSessions,
      },
      schedule: {
        ...app.schedule,
        trainingStatus: isCompleted ? "Completed" : attendedCount > 0 ? "Ongoing" : "Upcoming",
      },
    }
    await persistAppUpdate(updated)
  }

  // Step 7: Final Completion -> Mark as Completed
  const handleMarkCompleted = async (app: TrainingApplicationRecord) => {
    const totalHours = app.attendance?.totalHours || 12
    const sessions = (app.attendance?.sessions || []).map((s) => ({ ...s, attended: true }))
    const updated: TrainingApplicationRecord = {
      ...app,
      status: "completed",
      attendance: {
        totalHours,
        hoursCompleted: totalHours,
        completed: true,
        sessions,
      },
      schedule: {
        ...app.schedule,
        trainingStatus: "Completed",
      },
      certificate: {
        certificateNo: `QC-SSDD-TR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        issueDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        title: `Certificate of Training Completion in ${app.trainingName}`,
        recipientName: app.applicantInfo?.fullName || "Resident Beneficiary",
        trainingName: app.trainingName,
        hoursCompleted: totalHours,
        status: "Issued",
      },
    }
    await persistAppUpdate(updated)
  }

  // Counters
  const pendingCount = applications.filter((a) => a.status === "pending" || a.status === "under_review").length
  const qualifiedCount = applications.filter((a) => a.status === "qualified").length
  const scheduledCount = applications.filter((a) => a.status === "scheduled" || a.status === "enrolled").length
  const inProgressCount = applications.filter((a) => a.status === "in_progress").length
  const completedCount = applications.filter((a) => a.status === "completed" || a.attendance?.completed).length
  const rejectedCount = applications.filter((a) => a.status === "rejected").length

  const filteredApps = applications.filter((a) => {
    const matchStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "pending"
        ? a.status === "pending" || a.status === "under_review"
        : filterStatus === "qualified"
        ? a.status === "qualified"
        : filterStatus === "scheduled"
        ? a.status === "scheduled" || a.status === "enrolled"
        : filterStatus === "in_progress"
        ? a.status === "in_progress"
        : filterStatus === "completed"
        ? a.status === "completed" || a.attendance?.completed
        : filterStatus === "rejected"
        ? a.status === "rejected"
        : a.status === filterStatus

    const matchSearch =
      searchTerm === "" ||
      a.applicantInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.qcid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.trainingName?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {isEn
              ? "Training Program Administration (SSDD 7-Step Pipeline)"
              : isBis
              ? "Administrasyon sa Training Program (SSDD 7-Step Pipeline)"
              : "Pangasiwaan ng Training Program (SSDD 7-Hakbang Pipeline)"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            SSDD Validation ➔ Qualified ➔ Batch Scheduling ➔ Face-to-Face Orientation ➔ Training Classes ➔ Completion
          </p>
        </div>
        <button
          type="button"
          onClick={fetchTrainingApplications}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-foreground text-xs font-bold border border-border flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isEn ? "Refresh Data" : "I-refresh"}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setFilterStatus("pending")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === "pending"
              ? "bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30"
              : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
          }`}
        >
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">1. Validation</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          <span className="text-[10px] text-muted-foreground">Pending / Review</span>
        </div>

        <div
          onClick={() => setFilterStatus("qualified")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === "qualified"
              ? "bg-blue-500/15 border-blue-500/40 ring-1 ring-blue-500/30"
              : "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40"
          }`}
        >
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">2. Qualified</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{qualifiedCount}</p>
          <span className="text-[10px] text-muted-foreground">Ready to Schedule</span>
        </div>

        <div
          onClick={() => setFilterStatus("scheduled")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === "scheduled"
              ? "bg-indigo-500/15 border-indigo-500/40 ring-1 ring-indigo-500/30"
              : "bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40"
          }`}
        >
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">3. Scheduled</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{scheduledCount}</p>
          <span className="text-[10px] text-muted-foreground">Batch & Orientation</span>
        </div>

        <div
          onClick={() => setFilterStatus("in_progress")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === "in_progress"
              ? "bg-purple-500/15 border-purple-500/40 ring-1 ring-purple-500/30"
              : "bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40"
          }`}
        >
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">4. In Progress</span>
          <p className="text-2xl font-black text-purple-600 mt-1">{inProgressCount}</p>
          <span className="text-[10px] text-muted-foreground">Class Attendance</span>
        </div>

        <div
          onClick={() => setFilterStatus("completed")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === "completed"
              ? "bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30"
              : "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">5. Completed</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</p>
          <span className="text-[10px] text-muted-foreground">Graduates / Certified</span>
        </div>

        <div
          onClick={() => setFilterStatus("rejected")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === "rejected"
              ? "bg-rose-500/15 border-rose-500/40 ring-1 ring-rose-500/30"
              : "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40"
          }`}
        >
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Disqualified</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{rejectedCount}</p>
          <span className="text-[10px] text-muted-foreground">Rejected Docs</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All Records", count: applications.length },
              { id: "pending", label: "For Validation", count: pendingCount },
              { id: "qualified", label: "Qualified Pool", count: qualifiedCount },
              { id: "scheduled", label: "Scheduled / Enrolled", count: scheduledCount },
              { id: "in_progress", label: "In Progress", count: inProgressCount },
              { id: "completed", label: "Completed", count: completedCount },
              { id: "rejected", label: "Rejected", count: rejectedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filterStatus === tab.id
                    ? "bg-foreground text-background shadow-xs"
                    : "bg-muted/20 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isEn ? "Search applicant, ref, QCID..." : "Maghanap ng pangalan, ref..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Main List */}
      {filteredApps.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-2">
          <Award className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
          <p className="text-sm font-bold text-foreground">No Applications Found</p>
          <p className="text-xs text-muted-foreground">Walang rekord na tumutugma sa filter na ito.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => {
            const isPending = app.status === "pending" || app.status === "under_review"
            const isQualified = app.status === "qualified"
            const isScheduled = app.status === "scheduled"
            const isEnrolled = app.status === "enrolled"
            const isInProgress = app.status === "in_progress"
            const isCompleted = app.status === "completed" || app.attendance?.completed
            const isRejected = app.status === "rejected"

            return (
              <div
                key={app.id}
                onClick={() => handleViewApp(app)}
                className={`bg-card border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer group ${
                  selectedApp?.id === app.id ? "border-blue-500 ring-1 ring-blue-500/20 bg-blue-500/5" : "border-border hover:border-blue-500/40"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-500/10 px-2.5 py-0.5 rounded-md">
                      <MaskedText value={app.referenceNumber} type="id" />
                    </span>

                    {/* Status Badges */}
                    {app.status === "pending" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        1. PENDING VALIDATION
                      </span>
                    )}
                    {app.status === "under_review" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30 animate-pulse">
                        2. UNDER REVIEW
                      </span>
                    )}
                    {isQualified && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                        3. QUALIFIED (FOR SCHEDULING)
                      </span>
                    )}
                    {isScheduled && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                        4. SCHEDULED (BATCH SET)
                      </span>
                    )}
                    {isEnrolled && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                        5. ORIENTED & ENROLLED
                      </span>
                    )}
                    {isInProgress && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        6. TRAINING IN PROGRESS
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        7. COMPLETED & GRADUATED
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        ❌ NOT QUALIFIED / REJECTED
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-foreground group-hover:text-blue-600 transition-colors">
                      {app.applicantInfo?.fullName || "Valued Applicant"}
                    </h4>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                      <span>QCID: <strong>{app.qcid}</strong></span>
                      <span>•</span>
                      <span>Brgy. {app.applicantInfo?.barangay || "Quezon City"}</span>
                      <span>•</span>
                      <span>Contact: {app.applicantInfo?.contactNo || "N/A"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 flex-wrap">
                    <span className="font-bold text-foreground">Program: {app.trainingName}</span>
                    <span>•</span>
                    {app.schedule?.batchName && <span>Batch: <strong>{app.schedule.batchName}</strong></span>}
                    {app.schedule?.orientationDate && <span>Orientation: <strong>{app.schedule.orientationDate}</strong></span>}
                    {app.schedule?.trainingDate && <span>Classes: <strong>{app.schedule.trainingDate}</strong></span>}
                  </div>
                </div>

                {/* Quick Action Buttons on List */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApproveQualified(app)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Qualify</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReject(app)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {isQualified && (
                    <button
                      type="button"
                      onClick={() => handleOpenSchedule(app)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Assign Schedule</span>
                    </button>
                  )}

                  {isScheduled && (
                    <button
                      type="button"
                      onClick={() => handleMarkOrientationDone(app)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark Orientation Done</span>
                    </button>
                  )}

                  {(isEnrolled || isInProgress) && (
                    <button
                      type="button"
                      onClick={() => handleViewApp(app)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>Take Attendance</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleViewApp(app)}
                    className="px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-muted/70 text-foreground border border-border text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DETAILS & ATTENDANCE MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-border">
              <div>
                <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md">
                  Ref: {selectedApp.referenceNumber}
                </span>
                <h3 className="text-xl font-bold text-foreground mt-1">
                  {selectedApp.applicantInfo?.fullName}
                </h3>
                <p className="text-xs text-muted-foreground">Course: <strong>{selectedApp.trainingName}</strong></p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="text-muted-foreground hover:text-foreground text-lg font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Applicant Information & Documentary Requirements */}
            <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-3 text-xs">
              <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider block border-b border-border/60 pb-1.5">
                Full Applicant Information & Background
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-muted-foreground block text-[10px]">QC ID Number:</span>
                  <span className="font-bold font-mono text-foreground">{selectedApp.qcid}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Birthdate & Age:</span>
                  <span className="font-bold text-foreground">{selectedApp.applicantInfo?.dateOfBirth || "N/A"} ({selectedApp.applicantInfo?.age || "N/A"} y/o)</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Gender & Civil Status:</span>
                  <span className="font-bold text-foreground">{selectedApp.applicantInfo?.sex || "N/A"} • {selectedApp.applicantInfo?.civilStatus || "Single"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Contact Phone:</span>
                  <span className="font-bold text-foreground">{selectedApp.applicantInfo?.contactNo || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Email Address:</span>
                  <span className="font-bold text-foreground">{selectedApp.applicantInfo?.email || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Barangay & City:</span>
                  <span className="font-bold text-foreground">Brgy. {selectedApp.applicantInfo?.barangay || "Sauyo"}, {selectedApp.applicantInfo?.city || "Quezon City"}</span>
                </div>
                <div className="sm:col-span-3">
                  <span className="text-muted-foreground block text-[10px]">Complete Residential Address:</span>
                  <span className="font-bold text-foreground">{selectedApp.applicantInfo?.completeAddress || selectedApp.applicantInfo?.address || `Brgy. ${selectedApp.applicantInfo?.barangay || "Sauyo"}, Quezon City`}</span>
                </div>
              </div>

              {/* Educational & Employment Background */}
              <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Highest Educational Attainment:</span>
                  <span className="font-bold text-foreground">{selectedApp.applicantInfo?.highestEducation || "College Level / High School Graduate"}</span>
                  {selectedApp.applicantInfo?.schoolInstitution && (
                    <span className="text-[10px] text-muted-foreground block italic">School: {selectedApp.applicantInfo.schoolInstitution}</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Occupation / Employment Status:</span>
                  <span className="font-bold text-foreground">{selectedApp.applicantInfo?.occupation || "Self-employed / Unemployed"}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground block text-[10px]">Reason & Purpose for Applying:</span>
                  <p className="font-medium text-foreground bg-background/50 p-2 rounded-lg border border-border/50 text-[11px] mt-0.5 leading-relaxed">
                    {selectedApp.applicantInfo?.reasonForApplying || selectedApp.applicantInfo?.trainingPurpose || "Nais matuto ng kasanayan upang makapagsimula ng sariling negosyo pangkabuhayan o makahanap ng trabaho."}
                  </p>
                </div>
                {selectedApp.applicantInfo?.hasAttendedTraining === "Yes" && (
                  <div className="sm:col-span-2 text-[10px] text-muted-foreground bg-blue-500/5 p-2 rounded-lg border border-blue-500/20">
                    Previous Course Completed: <strong>{selectedApp.applicantInfo?.previousTrainingCourse || "N/A"}</strong> ({selectedApp.applicantInfo?.previousYearCompleted || "Year N/A"})
                  </div>
                )}
              </div>

              {/* Documentary Attachments */}
              <div className="pt-2 border-t border-border/60">
                <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Attached Documentary Proofs:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-background">
                    <span className="truncate text-[11px] font-medium text-foreground">
                      🪪 {selectedApp.applicantInfo?.documents?.qcIdProof || "QCID_Verified.pdf"}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-background">
                    <span className="truncate text-[11px] font-medium text-foreground">
                      📄 {selectedApp.applicantInfo?.documents?.requestLetter || "Barangay_Indigency_Cert.pdf"}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Attached
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Details if exists */}
            {selectedApp.schedule?.batchName && (
              <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20 space-y-2 text-xs">
                <span className="font-bold text-[11px] text-indigo-600 uppercase tracking-wider block">
                  Assigned Training & Orientation Schedule
                </span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Batch Name:</span>
                    <span className="font-bold text-foreground">{selectedApp.schedule.batchName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Orientation (Day 0):</span>
                    <span className="font-bold text-foreground">{selectedApp.schedule.orientationDate || "Scheduled"} ({selectedApp.schedule.orientationTime || "9:00 AM"})</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Class Dates:</span>
                    <span className="font-bold text-foreground">{selectedApp.schedule.trainingDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Venue & Room:</span>
                    <span className="font-bold text-foreground">{selectedApp.schedule.trainingLocation}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Checklist (for Enrolled & In Progress) */}
            {(selectedApp.status === "enrolled" || selectedApp.status === "in_progress" || selectedApp.status === "completed") && (
              <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-purple-600 uppercase tracking-wider">
                    Digital Attendance Tracker
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    Hours Completed: {selectedApp.attendance?.hoursCompleted || 0} / {selectedApp.attendance?.totalHours || 12} Hours
                  </span>
                </div>

                <div className="space-y-2">
                  {(selectedApp.attendance?.sessions || [
                    { day: 1, topic: "Module 1: Orientation & Sanitation", hours: 3, attended: false, date: "Day 1" },
                    { day: 2, topic: "Module 2: Practical Techniques", hours: 3, attended: false, date: "Day 2" },
                    { day: 3, topic: "Module 3: Hands-on Laboratory", hours: 3, attended: false, date: "Day 3" },
                    { day: 4, topic: "Module 4: Final Practical Assessment", hours: 3, attended: false, date: "Day 4" },
                  ]).map((session, sIdx) => (
                    <div
                      key={sIdx}
                      onClick={() => handleToggleAttendanceDay(selectedApp, sIdx)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
                        session.attended
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                          : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            session.attended ? "bg-emerald-600 text-white border-emerald-600" : "border-border bg-background"
                          }`}
                        >
                          {session.attended && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">Day {session.day}: {session.topic}</p>
                          <span className="text-[10px] opacity-75">{session.hours} Hours • {session.date}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase">
                        {session.attended ? "PRESENT" : "ABSENT"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              {selectedApp.status === "pending" || selectedApp.status === "under_review" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedApp(null)
                      handleOpenReject(selectedApp)
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-500/30 cursor-pointer"
                  >
                    Reject Application
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleApproveQualified(selectedApp)
                      setSelectedApp(null)
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>Mark as Qualified</span>
                  </button>
                </>
              ) : selectedApp.status === "qualified" ? (
                <button
                  type="button"
                  onClick={() => {
                    const appToSchedule = selectedApp
                    setSelectedApp(null)
                    handleOpenSchedule(appToSchedule)
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Assign Schedule & Batch</span>
                </button>
              ) : selectedApp.status === "scheduled" ? (
                <button
                  type="button"
                  onClick={() => {
                    handleMarkOrientationDone(selectedApp)
                    setSelectedApp(null)
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mark Orientation Completed</span>
                </button>
              ) : (selectedApp.status === "enrolled" || selectedApp.status === "in_progress") ? (
                <button
                  type="button"
                  onClick={() => {
                    handleMarkCompleted(selectedApp)
                    setSelectedApp(null)
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Award className="h-4 w-4" />
                  <span>Graduate & Mark Completed</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULING MODAL */}
      {showScheduleModal && schedulingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Assign Training Schedule & Batch</h3>
                <p className="text-xs text-muted-foreground">{schedulingApp.applicantInfo?.fullName} — {schedulingApp.trainingName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-muted-foreground hover:text-foreground text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Batch Name / Code</label>
                <input
                  type="text"
                  value={scheduleForm.batchName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, batchName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              {/* Orientation Schedule */}
              <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 space-y-2">
                <span className="font-bold text-blue-600 uppercase tracking-wider text-[11px] block">
                  📌 Face-to-Face Orientation (Day 0)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Orientation Date</label>
                    <input
                      type="text"
                      value={scheduleForm.orientationDate}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, orientationDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Orientation Time</label>
                    <input
                      type="text"
                      value={scheduleForm.orientationTime}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, orientationTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Orientation Venue</label>
                  <input
                    type="text"
                    value={scheduleForm.orientationVenue}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, orientationVenue: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>
              </div>

              {/* Training Classes Schedule */}
              <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/20 space-y-2">
                <span className="font-bold text-indigo-600 uppercase tracking-wider text-[11px] block">
                  🍞 Regular Class Schedule (18 Working Days)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Start Date</label>
                    <input
                      type="text"
                      value={scheduleForm.startDate}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">End Date</label>
                    <input
                      type="text"
                      value={scheduleForm.endDate}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Daily Hours</label>
                  <input
                    type="text"
                    value={scheduleForm.trainingTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, trainingTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Room & Venue</label>
                  <input
                    type="text"
                    value={scheduleForm.venue}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, venue: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Assigned Trainer</label>
                  <input
                    type="text"
                    value={scheduleForm.trainerName}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, trainerName: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-3.5 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-foreground text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmSchedule}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isProcessing ? "Assigning..." : "Confirm & Send Notice"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {showRejectModal && rejectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Reject / Disqualify Application</h3>
                <p className="text-xs text-muted-foreground">{rejectingApp.applicantInfo?.fullName} — Ref: {rejectingApp.referenceNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-muted-foreground hover:text-foreground text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Primary Reason for Disqualification</label>
                <select
                  value={selectedRejectReason}
                  onChange={(e) => setSelectedRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs cursor-pointer"
                >
                  <option value="Incomplete or expired Barangay Indigency / proof of residency">Incomplete or expired Barangay Indigency / proof of residency</option>
                  <option value="Non-resident of Quezon City based on submitted documents">Non-resident of Quezon City based on submitted documents</option>
                  <option value="Invalid or unreadable photo of government-issued ID / QCID">Invalid or unreadable photo of government-issued ID / QCID</option>
                  <option value="Duplicate active enrollment in another training program">Duplicate active enrollment in another training program</option>
                  <option value="Age requirement (18 years old and above) not met">Age requirement (18 years old and above) not met</option>
                  <option value="Batch slots currently filled / program quota reached">Batch slots currently filled / program quota reached</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Additional Notes / Remarks for Applicant (Optional)</label>
                <textarea
                  rows={3}
                  value={customRejectNote}
                  onChange={(e) => setCustomRejectNote(e.target.value)}
                  placeholder="Example: Paki-upload po muli ang malinaw na litrato ng inyong Barangay Certificate para makapag-apply sa susunod na batch."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3.5 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-foreground text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isProcessing ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

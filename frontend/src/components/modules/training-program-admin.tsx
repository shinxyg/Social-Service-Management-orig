import { useState, useEffect } from "react"
import {
  Award,
  Search,
  CheckCircle2,
  Printer,
  Trash2,
  RefreshCw,
  Check,
  Eye,
} from "lucide-react"
import { API_BASE } from "../../config/api"
import type { TrainingApplicationRecord } from "../user-portal/training-program-view"

export default function TrainingProgramAdmin() {
  const [applications, setApplications] = useState<TrainingApplicationRecord[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedApp, setSelectedApp] = useState<TrainingApplicationRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Review modal form state
  const [rejectReason, setRejectReason] = useState("")
  const [revisionNotes, setRevisionNotes] = useState("")
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [showRevisionInput, setShowRevisionInput] = useState(false)
  const [previewCertApp, setPreviewCertApp] = useState<TrainingApplicationRecord | null>(null)

  const fetchTrainingApplications = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/training/applications`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.applications)) {
          setApplications(data.applications)
          try {
            localStorage.setItem("training_applications", JSON.stringify(data.applications))
          } catch (_) {}
          return
        }
      }
    } catch (_) {
    } finally {
      setIsLoading(false)
    }

    // Fallback: localStorage
    try {
      const stored = localStorage.getItem("training_applications")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setApplications(parsed)
        }
      }
    } catch (_) {}
  }

  useEffect(() => {
    fetchTrainingApplications()
    const interval = setInterval(fetchTrainingApplications, 3000)
    return () => clearInterval(interval)
  }, [])

  // Sync and persist application changes
  const persistAppUpdate = async (updated: TrainingApplicationRecord) => {
    const updatedList = applications.map((a) => (String(a.id) === String(updated.id) ? updated : a))
    setApplications(updatedList)
    setSelectedApp(updated)

    try {
      localStorage.setItem("training_applications", JSON.stringify(updatedList))
      window.dispatchEvent(new Event("storage"))
    } catch (_) {}

    try {
      await fetch(`${API_BASE}/api/training/applications/${updated.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updated.status,
          rejectionReason: updated.rejectionReason,
          revisionNotes: updated.revisionNotes,
          attendance: updated.attendance,
          trainingStatus: updated.schedule?.trainingStatus,
          approvedBy: updated.approvedBy || "QC Skills Development Division",
        }),
      })
    } catch (_) {}
  }

  // Handle Approve
  const handleApprove = async (app: TrainingApplicationRecord) => {
    const updated: TrainingApplicationRecord = {
      ...app,
      status: "approved",
      approvedBy: "QC Skills Development Division",
      approvedDate: new Date().toISOString(),
      rejectionReason: undefined,
      revisionNotes: undefined,
      schedule: {
        ...app.schedule,
        trainingStatus: "Upcoming",
      },
    }
    await persistAppUpdate(updated)
  }

  // Handle Reject
  const handleReject = async (app: TrainingApplicationRecord) => {
    if (!rejectReason.trim()) {
      alert("Paki-lagay ang dahilan ng pag-reject.")
      return
    }
    const updated: TrainingApplicationRecord = {
      ...app,
      status: "rejected",
      rejectionReason: rejectReason,
    }
    await persistAppUpdate(updated)
    setShowRejectInput(false)
    setRejectReason("")
  }

  // Handle Request Revision
  const handleRequestRevision = async (app: TrainingApplicationRecord) => {
    if (!revisionNotes.trim()) {
      alert("Paki-lagay ang mga detalye o impormasyong kailangang i-edit ng aplikante.")
      return
    }
    const updated: TrainingApplicationRecord = {
      ...app,
      status: "needs_revision",
      revisionNotes: revisionNotes,
    }
    await persistAppUpdate(updated)
    setShowRevisionInput(false)
    setRevisionNotes("")
  }

  // Toggle Session Attendance
  const handleToggleSession = async (app: TrainingApplicationRecord, dayNumber: number) => {
    const sessions = (app.attendance?.sessions || []).map((s) => {
      if (s.day === dayNumber) {
        return { ...s, attended: !s.attended }
      }
      return s
    })

    const attendedCount = sessions.filter((s) => s.attended).length
    const hoursCompleted = attendedCount * 4
    const isComplete = hoursCompleted >= 16

    const updated: TrainingApplicationRecord = {
      ...app,
      attendance: {
        ...app.attendance,
        sessions,
        hoursCompleted,
        completed: isComplete,
      },
      schedule: {
        ...app.schedule,
        trainingStatus: isComplete ? "Completed" : attendedCount > 0 ? "Ongoing" : "Upcoming",
      },
      certificate: isComplete && !app.certificate ? {
        certificateNo: `QC-CERT-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        issueDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        title: `Certificate of Completion in ${app.trainingName}`,
        recipientName: app.applicantInfo?.fullName || "Beneficiary",
        trainingName: app.trainingName,
        hoursCompleted: 16,
        status: "Issued",
      } : app.certificate,
    }

    await persistAppUpdate(updated)
  }

  // Reset all training applications (Testing)
  const handleResetTraining = async () => {
    if (!window.confirm("Sigurado ka bang nais mong i-reset ang lahat ng Training Program applications sa Admin?")) {
      return
    }
    setApplications([])
    setSelectedApp(null)
    try {
      localStorage.removeItem("training_applications")
      await fetch(`${API_BASE}/api/training/reset`, { method: "POST" })
    } catch (_) {}
  }

  // Counters
  const pendingCount = applications.filter((a) => a.status === "pending" || a.status === "under_review").length
  const approvedCount = applications.filter((a) => a.status === "approved").length
  const completedCount = applications.filter((a) => a.attendance?.completed || a.schedule?.trainingStatus === "Completed").length
  const rejectedCount = applications.filter((a) => a.status === "rejected").length

  // Filtered applications
  const filteredApps = applications.filter((a) => {
    const matchStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "pending"
        ? a.status === "pending" || a.status === "under_review"
        : filterStatus === "completed"
        ? a.attendance?.completed || a.schedule?.trainingStatus === "Completed"
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
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            Training Program Administration &amp; Skills Registry
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluate resident applications, confirm training schedules, track live attendance, and issue official Certificates of Completion.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={fetchTrainingApplications}
            disabled={isLoading}
            className="p-2 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleResetTraining}
            className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Reset Training Data</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Applications</span>
          <p className="text-2xl font-bold text-foreground mt-1">{applications.length}</p>
          <span className="text-[11px] text-muted-foreground">All time submissions</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Pending Review</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          <span className="text-[11px] text-muted-foreground">Needs evaluation</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Approved / Enrolled</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
          <span className="text-[11px] text-muted-foreground">Active in training</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Certificates Issued</span>
          <p className="text-2xl font-bold text-purple-600 mt-1">{completedCount}</p>
          <span className="text-[11px] text-muted-foreground">16 hours completed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "approved", label: `Approved (${approvedCount})` },
            { id: "completed", label: `Completed (${completedCount})` },
            { id: "needs_revision", label: "Needs Revision" },
            { id: "rejected", label: `Rejected (${rejectedCount})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === f.id
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or ref..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-muted/20 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-2">
          <Award className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-bold text-foreground">No Training Applications Found</p>
          <p className="text-xs text-muted-foreground">Walang tugmang records para sa filter o search term na ito.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => {
            const isCompleted = app.attendance?.completed || app.schedule?.trainingStatus === "Completed"
            return (
              <div
                key={app.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md">
                      {app.referenceNumber}
                    </span>
                    {app.status === "approved" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                        APPROVED
                      </span>
                    )}
                    {app.status === "pending" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-700 border border-blue-500/30">
                        PENDING EVALUATION
                      </span>
                    )}
                    {app.status === "needs_revision" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30">
                        NEEDS REVISION
                      </span>
                    )}
                    {app.status === "rejected" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 border border-rose-500/30">
                        REJECTED
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-700 border border-purple-500/30 flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        CERTIFICATE ISSUED
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-foreground">
                      {app.applicantInfo?.fullName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      QC ID: <span className="font-mono font-medium text-foreground">{app.qcid}</span> • Brgy. {app.applicantInfo?.barangay} • {app.applicantInfo?.contactNo}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="font-semibold text-foreground">Program: {app.trainingName}</span>
                    <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                    <span>Attendance: <strong>{app.attendance?.hoursCompleted || 0} / 16 Hours</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isCompleted && (
                    <button
                      type="button"
                      onClick={() => setPreviewCertApp(app)}
                      className="px-3.5 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Award className="h-4 w-4" />
                      <span>View Certificate</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedApp(app)
                      setShowRejectInput(false)
                      setShowRevisionInput(false)
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Manage / Evaluate</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* EVALUATION & MANAGEMENT MODAL                                */}
      {/* ============================================================ */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-border">
              <div>
                <span className="text-[11px] font-mono font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md">
                  {selectedApp.referenceNumber}
                </span>
                <h3 className="text-xl font-bold text-foreground mt-1">
                  Evaluate Training Application
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

            {/* Applicant Profile Grid */}
            <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-2 text-xs">
              <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wide">Applicant Information</span>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Full Name:</span>
                  <span className="font-bold text-foreground">{selectedApp.applicantInfo?.fullName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">QC ID:</span>
                  <span className="font-mono font-bold text-foreground">{selectedApp.qcid}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Contact &amp; Email:</span>
                  <span className="font-semibold text-foreground">{selectedApp.applicantInfo?.contactNo} • {selectedApp.applicantInfo?.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Barangay &amp; City:</span>
                  <span className="font-semibold text-foreground">Brgy. {selectedApp.applicantInfo?.barangay}, {selectedApp.applicantInfo?.city}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Sex &amp; Age:</span>
                  <span className="text-foreground">{selectedApp.applicantInfo?.sex} • {selectedApp.applicantInfo?.age} years old</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Occupation:</span>
                  <span className="text-foreground">{selectedApp.applicantInfo?.occupation || "Resident"}</span>
                </div>
              </div>
            </div>

            {/* Schedule Info */}
            <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-2 text-xs">
              <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wide">Assigned Schedule</span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <p><strong>Date:</strong> {selectedApp.schedule?.trainingDate}</p>
                <p><strong>Time:</strong> {selectedApp.schedule?.trainingTime}</p>
                <p className="col-span-2"><strong>Venue:</strong> {selectedApp.schedule?.trainingLocation} (<em>{selectedApp.schedule?.landmark}</em>)</p>
              </div>
            </div>

            {/* Attendance & Session Checkers (Available if Approved) */}
            {selectedApp.status === "approved" && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Attendance &amp; Session Check-in (16 Hours Target)</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">
                    {selectedApp.attendance?.hoursCompleted || 0} / 16 Hours
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedApp.attendance?.sessions?.map((sess) => (
                    <div
                      key={sess.day}
                      onClick={() => handleToggleSession(selectedApp, sess.day)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        sess.attended
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-semibold"
                          : "bg-background border-border text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                            sess.attended ? "bg-emerald-600 text-white" : "border border-border"
                          }`}
                        >
                          {sess.attended && <Check className="h-3 w-3" />}
                        </div>
                        <span>Day {sess.day}: {sess.topic}</span>
                      </div>
                      <span className="text-[11px]">{sess.attended ? "Attended (4h)" : "Mark Present"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2 border-t border-border">
              {showRejectInput && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                  <label className="block text-xs font-bold text-rose-700 dark:text-rose-300">
                    Dahilan ng Pag-reject:
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    placeholder="Ilagay ang dahilan kung bakit hindi pumasa..."
                    className="w-full p-2 text-xs rounded-lg border border-rose-300 bg-background focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(false)}
                      className="px-3 py-1 rounded-md text-xs text-muted-foreground hover:bg-muted/40 cursor-pointer"
                    >
                      Kanselahin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedApp)}
                      className="px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Kumpirmahin ang Reject
                    </button>
                  </div>
                </div>
              )}

              {showRevisionInput && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <label className="block text-xs font-bold text-amber-800 dark:text-amber-300">
                    Paalala sa Pag-edit (Revision Notes):
                  </label>
                  <textarea
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    rows={2}
                    placeholder="Halimbawa: Paki-update ang iyong contact number..."
                    className="w-full p-2 text-xs rounded-lg border border-amber-300 bg-background focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRevisionInput(false)}
                      className="px-3 py-1 rounded-md text-xs text-muted-foreground hover:bg-muted/40 cursor-pointer"
                    >
                      Kanselahin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestRevision(selectedApp)}
                      className="px-3 py-1 rounded-md bg-amber-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Ipadala sa Aplikante
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {selectedApp.status !== "rejected" && !showRejectInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowRejectInput(true)
                        setShowRevisionInput(false)
                      }}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer"
                    >
                      Reject
                    </button>
                  )}
                  {selectedApp.status !== "needs_revision" && !showRevisionInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowRevisionInput(true)
                        setShowRejectInput(false)
                      }}
                      className="px-3 py-1.5 rounded-xl border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 text-xs font-semibold cursor-pointer"
                    >
                      Request Revision
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedApp.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedApp)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve Application</span>
                    </button>
                  )}

                  {selectedApp.attendance?.completed && (
                    <button
                      type="button"
                      onClick={() => setPreviewCertApp(selectedApp)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Award className="h-4 w-4" />
                      <span>Print Certificate</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CERTIFICATE PREVIEW MODAL                                    */}
      {/* ============================================================ */}
      {previewCertApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span className="font-bold text-sm text-foreground">Official Certificate Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCertApp(null)}
                className="text-muted-foreground hover:text-foreground text-base font-bold px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div
              className="bg-white text-slate-900 border-8 border-double border-amber-600/60 rounded-xl p-6 sm:p-8 text-center space-y-4 shadow-md relative"
              style={{ fontFamily: "Georgia, serif" }}
            >
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
                  {previewCertApp.applicantInfo?.fullName}
                </h3>
                <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed">
                  para sa matagumpay na pagtatapos ng <strong>16 Oras ng Masinsinang Pagsasanay</strong> sa ilalim ng
                  kursong <strong>{previewCertApp.trainingName}</strong> na ginanap sa QC Skills Development Center, Batasan Hills, Quezon City.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 text-left text-[10px] text-slate-600 border-t border-slate-200">
                <div>
                  <p>Certificate No: <strong className="font-mono text-slate-900">{previewCertApp.certificate?.certificateNo || `QC-CERT-2026-${Math.floor(10000 + Math.random() * 90000)}`}</strong></p>
                  <p>Petsa ng Pag-isyu: <strong className="text-slate-900">{previewCertApp.certificate?.issueDate || new Date().toLocaleDateString()}</strong></p>
                  <p>QC ID: <strong className="font-mono text-slate-900">{previewCertApp.qcid}</strong></p>
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

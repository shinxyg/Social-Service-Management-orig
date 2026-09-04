import { useState, useEffect } from "react"
import {
  FileText,
  Search,
  ArrowLeft,
  Clock,
  CheckCircle2,
  User,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Copy,
  Check,
  Banknote,
  MapPin,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react"
import { API_BASE } from "../../config/api"
import { getCurrentUserProfile } from "../../utils/userProfile"
import {
  FIXED_ASSISTANCE_AMOUNTS,
  getSavedDisbursements,
  checkAndAutoReleaseScheduledDisbursements,
} from "../../utils/financialAidSync"
import { useLanguage } from "../ui/language-context"

export type ApplicationStatus =
  | "Pending"
  | "Under Review"
  | "For Assessment"
  | "Approved"
  | "For Release"
  | "Released"

export interface ApplicationRecord {
  applicationNo: string
  assistance: string
  assistanceCategory: string
  dateApplied: string
  status: ApplicationStatus
  applicantName: string
  dateOfBirth: string
  address: string
  contactNumber: string
  email?: string
  remarks?: string
  deletedAt?: string
}

export default function MyApplications() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active")
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [deletedApplications, setDeletedApplications] = useState<ApplicationRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null)
  const [copied, setCopied] = useState(false)

  // Dialog modal states
  const [appToDelete, setAppToDelete] = useState<ApplicationRecord | null>(null)
  const [appToPermanentDelete, setAppToPermanentDelete] = useState<ApplicationRecord | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: "success" | "danger" } | null>(null)

  const showToast = (text: string, type: "success" | "danger" = "success") => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // 1. SOFT DELETE (Move to Deleted)
  const handleConfirmDelete = async () => {
    if (!appToDelete) return
    setIsProcessing(true)
    const appNo = appToDelete.applicationNo
    const appAssistance = appToDelete.assistance
    const deletedRecord: ApplicationRecord = {
      ...appToDelete,
      deletedAt: new Date().toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    try {
      await fetch(`${API_BASE}/api/user-applications/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationNo: appNo,
          referenceNo: appNo,
          category: appToDelete.assistanceCategory,
          assistance: appAssistance,
          applicantName: appToDelete.applicantName,
          email: appToDelete.email,
          dateOfBirth: appToDelete.dateOfBirth,
          address: appToDelete.address,
          contactNumber: appToDelete.contactNumber,
          status: appToDelete.status,
          dateApplied: appToDelete.dateApplied,
          reason: "Deleted by user from History Application",
          payload: deletedRecord,
        }),
      })

      // Update LocalStorage deleted items
      try {
        const storedDeleted: ApplicationRecord[] = JSON.parse(
          localStorage.getItem("deleted_user_applications") || "[]"
        )
        const updatedDeleted = [
          deletedRecord,
          ...storedDeleted.filter((d) => d.applicationNo !== appNo || d.assistance !== appAssistance),
        ]
        localStorage.setItem("deleted_user_applications", JSON.stringify(updatedDeleted))
      } catch {}

      // Update UI state immediately
      setApplications((prev) => prev.filter((a) => !(a.applicationNo === appNo && a.assistance === appAssistance)))
      setDeletedApplications((prev) => [
        deletedRecord,
        ...prev.filter((d) => !(d.applicationNo === appNo && d.assistance === appAssistance)),
      ])

      if (selectedApp?.applicationNo === appNo && selectedApp?.assistance === appAssistance) {
        setSelectedApp(null)
      }
      showToast(`Moved ${appAssistance} to Deleted Applications.`)
    } catch (err) {
      console.error("Failed deleting application:", err)
      showToast("An error occurred while deleting application.", "danger")
    } finally {
      setIsProcessing(false)
      setAppToDelete(null)
    }
  }

  // 2. RESTORE APPLICATION
  const handleRestore = async (app: ApplicationRecord) => {
    setIsProcessing(true)
    const appNo = app.applicationNo
    const appAssistance = app.assistance

    try {
      await fetch(`${API_BASE}/api/user-applications/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationNo: appNo,
          referenceNo: appNo,
          category: app.assistanceCategory,
          assistance: appAssistance,
          applicantName: app.applicantName,
        }),
      })

      // Clean from LocalStorage deleted
      try {
        const storedDeleted: ApplicationRecord[] = JSON.parse(
          localStorage.getItem("deleted_user_applications") || "[]"
        )
        const updatedDeleted = storedDeleted.filter(
          (d) => !(d.applicationNo === appNo && d.assistance === appAssistance)
        )
        localStorage.setItem("deleted_user_applications", JSON.stringify(updatedDeleted))
      } catch {}

      // Update UI state
      setDeletedApplications((prev) =>
        prev.filter((d) => !(d.applicationNo === appNo && d.assistance === appAssistance))
      )
      setApplications((prev) => [
        app,
        ...prev.filter((a) => !(a.applicationNo === appNo && a.assistance === appAssistance)),
      ])

      if (selectedApp?.applicationNo === appNo && selectedApp?.assistance === appAssistance) {
        setSelectedApp(null)
      }
      showToast(`Successfully restored ${appAssistance} to active applications.`)
    } catch (err) {
      console.error("Failed restoring application:", err)
      showToast("Could not restore application at this time.", "danger")
    } finally {
      setIsProcessing(false)
    }
  }

  // 3. PERMANENT DELETE (Hard Delete from Database)
  const handleConfirmPermanentDelete = async () => {
    if (!appToPermanentDelete) return
    setIsProcessing(true)
    const appNo = appToPermanentDelete.applicationNo
    const appAssistance = appToPermanentDelete.assistance

    try {
      await fetch(`${API_BASE}/api/user-applications/permanent-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationNo: appNo,
          referenceNo: appNo,
          category: appToPermanentDelete.assistanceCategory,
          assistance: appAssistance,
          applicantName: appToPermanentDelete.applicantName,
        }),
      })

      // Clean local storage caches completely
      try {
        const localPwd = JSON.parse(localStorage.getItem("pwd_senior_applications") || "[]")
        localStorage.setItem(
          "pwd_senior_applications",
          JSON.stringify(
            localPwd.filter((p: any) => p.assignedIdNumber !== appNo && p.referenceNumber !== appNo && p.id !== appNo)
          )
        )
      } catch {}

      try {
        const localLiv = JSON.parse(localStorage.getItem("livelihood_applications") || "[]")
        localStorage.setItem(
          "livelihood_applications",
          JSON.stringify(localLiv.filter((l: any) => l.reference_number !== appNo && l.qcid !== appNo))
        )
      } catch {}

      try {
        const localTrn = JSON.parse(localStorage.getItem("training_applications") || "[]")
        localStorage.setItem(
          "training_applications",
          JSON.stringify(localTrn.filter((t: any) => t.reference_number !== appNo && t.qcid !== appNo))
        )
      } catch {}

      try {
        const storedDeleted: ApplicationRecord[] = JSON.parse(
          localStorage.getItem("deleted_user_applications") || "[]"
        )
        const updatedDeleted = storedDeleted.filter(
          (d) => !(d.applicationNo === appNo && d.assistance === appAssistance)
        )
        localStorage.setItem("deleted_user_applications", JSON.stringify(updatedDeleted))
      } catch {}

      // Update UI state
      setDeletedApplications((prev) =>
        prev.filter((d) => !(d.applicationNo === appNo && d.assistance === appAssistance))
      )
      setApplications((prev) => prev.filter((a) => !(a.applicationNo === appNo && a.assistance === appAssistance)))

      if (selectedApp?.applicationNo === appNo && selectedApp?.assistance === appAssistance) {
        setSelectedApp(null)
      }
      showToast(`Permanently deleted ${appAssistance} from database.`, "danger")
    } catch (err) {
      console.error("Failed permanent deletion:", err)
      showToast("An error occurred during permanent deletion.", "danger")
    } finally {
      setIsProcessing(false)
      setAppToPermanentDelete(null)
    }
  }

  // Load active and deleted applications
  useEffect(() => {
    const fetchUserApps = async () => {
      checkAndAutoReleaseScheduledDisbursements()

      const userProfile = getCurrentUserProfile()
      const qcId = (userProfile.qcidNo || "").trim()
      const userId = userProfile.id || localStorage.getItem("userId") || "1"
      const userEmail = (userProfile.email || "").trim().toLowerCase()
      const userFirst = (userProfile.firstName || "").trim().toLowerCase()
      const userLast = (userProfile.lastName || "").trim().toLowerCase()

      // Fetch deleted list from backend & local storage
      let initialDeleted: ApplicationRecord[] = []
      try {
        const storedDel = localStorage.getItem("deleted_user_applications")
        if (storedDel) initialDeleted = JSON.parse(storedDel)
      } catch {}

      try {
        const delRes = await fetch(
          `${API_BASE}/api/user-applications/deleted?email=${encodeURIComponent(userEmail)}&qcid=${encodeURIComponent(
            qcId
          )}&name=${encodeURIComponent(userFirst + " " + userLast)}`
        )
        if (delRes.ok) {
          const delData = await delRes.json()
          if (delData.applications && Array.isArray(delData.applications)) {
            const mappedDel: ApplicationRecord[] = delData.applications.map((d: any) => ({
              applicationNo: d.referenceNo || d.applicationId || "N/A",
              assistance: d.assistanceTitle || d.payload?.assistance || "Social Assistance",
              assistanceCategory: d.category || d.payload?.assistanceCategory || "General",
              dateApplied: d.payload?.dateApplied || new Date(d.archivedAt || Date.now()).toLocaleDateString("en-PH"),
              status: d.status || d.payload?.status || "Approved",
              applicantName:
                d.applicantName || d.payload?.applicantName || `${userProfile.firstName} ${userProfile.lastName}`,
              dateOfBirth: d.payload?.dateOfBirth || userProfile.birthDateDisplay,
              address:
                d.payload?.address ||
                `${userProfile.houseNo} ${userProfile.street}, ${userProfile.barangay}, ${userProfile.city}`,
              contactNumber: d.payload?.contactNumber || userProfile.mobileNumber,
              email: d.email || userProfile.email,
              deletedAt: new Date(d.archivedAt || Date.now()).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            }))

            // Merge unique
            const mapKeys = new Set(initialDeleted.map((i) => i.applicationNo + i.assistance))
            mappedDel.forEach((m) => {
              if (!mapKeys.has(m.applicationNo + m.assistance)) {
                initialDeleted.push(m)
              }
            })
          }
        }
      } catch (err) {
        console.warn("Could not fetch deleted applications:", err)
      }

      setDeletedApplications(initialDeleted)
      const deletedKeySet = new Set(initialDeleted.map((d) => (d.applicationNo + "::" + d.assistance).toLowerCase()))

      let allFoundApps: ApplicationRecord[] = []

      // 1. AICS Applications
      try {
        const res = await fetch(`${API_BASE}/api/aics/applications?qcId=${encodeURIComponent(qcId)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.applications && Array.isArray(data.applications)) {
            const mappedAics: ApplicationRecord[] = data.applications
              .filter((app: any) => {
                if (app.is_archived === true) return false
                const appQc = String(app.qc_id || app.reference_no || app.reference_number || "").trim().toLowerCase()
                const appEmail = String(app.email || "").trim().toLowerCase()
                const appName = String(app.full_name || "").trim().toLowerCase()
                const matchQc = qcId !== "" && appQc === qcId.toLowerCase()
                const matchEmail = userEmail !== "" && appEmail === userEmail
                const matchName = userFirst !== "" && userLast !== "" && appName.includes(userFirst) && appName.includes(userLast)
                return Boolean(matchQc || matchEmail || matchName)
              })
              .map((app: any) => {
                const rawType = (app.assistance_type || "Transportation").replace(/\s*assistance/gi, "").trim()
                const cleanAssistance = rawType.charAt(0).toUpperCase() + rawType.slice(1) + " Assistance"

                return {
                  applicationNo: app.qc_id || app.reference_no || app.reference_number || qcId,
                  assistance: cleanAssistance,
                  assistanceCategory: "AICS",
                  dateApplied: new Date(app.created_at || Date.now()).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                  status:
                    app.status === "approved"
                      ? "Approved"
                      : app.status === "released"
                      ? "Released"
                      : app.status === "for_release"
                      ? "For Release"
                      : app.status === "assessment"
                      ? "For Assessment"
                      : "Under Review",
                  applicantName: app.full_name || `${userProfile.firstName} ${userProfile.lastName}`,
                  dateOfBirth: app.birth_date || userProfile.birthDateDisplay,
                  address:
                    app.address ||
                    `${userProfile.houseNo} ${userProfile.street}, ${userProfile.barangay}, ${userProfile.city}`,
                  contactNumber: app.contact_number || userProfile.mobileNumber,
                  email: app.email || userProfile.email,
                }
              })
            allFoundApps.push(...mappedAics)
          }
        }
      } catch (err) {
        console.warn("Could not fetch AICS applications:", err)
      }

      // 2. PWD & Senior Citizen Applications
      try {
        let pwdApps: any[] = []
        try {
          const pwdRes = await fetch(`${API_BASE}/api/pwd-senior/applications`)
          if (pwdRes.ok) {
            pwdApps = await pwdRes.json()
          }
        } catch {}
        if (!pwdApps || pwdApps.length === 0) {
          try {
            pwdApps = JSON.parse(localStorage.getItem("pwd_senior_applications") || "[]")
          } catch {}
        }

        const mappedPwd: ApplicationRecord[] = (pwdApps || [])
          .filter((p: any) => {
            if (p.is_archived === true) return false
            const pRef = String(p.referenceNumber || "").trim().toLowerCase()
            const pEmail = String(p.email || "").trim().toLowerCase()
            const pQc = String(p.qcidNo || "").trim().toLowerCase()
            const pFirst = String(p.firstName || "").trim().toLowerCase()
            const pLast = String(p.lastName || "").trim().toLowerCase()

            const matchQc = qcId !== "" && (pRef === qcId.toLowerCase() || pQc === qcId.toLowerCase())
            const matchEmail = userEmail !== "" && pEmail === userEmail
            const matchName = userFirst !== "" && userLast !== "" && pFirst.includes(userFirst) && pLast.includes(userLast)

            return Boolean(matchQc || matchEmail || matchName)
          })
          .map((p: any) => {
            const isPwd =
              String(p.category || "").toUpperCase() === "PWD" ||
              String(p.category || "").toLowerCase().includes("disability")
            const typeStr = String(p.type || "new").toLowerCase()
            const serviceTitle = isPwd
              ? typeStr === "assistance"
                ? "PWD Social Assistance"
                : typeStr === "renewal"
                ? "Persons with Disability (PWD) ID Renewal"
                : typeStr === "loss" || typeStr === "replacement"
                ? "Persons with Disability (PWD) ID Replacement"
                : "Persons with Disability (PWD) ID"
              : typeStr === "medicine-booklet"
              ? "Senior Citizen Medicine Booklet"
              : typeStr === "movie-booklet"
              ? "Senior Citizen Movie Booklet"
              : typeStr === "social-assistance"
              ? "Senior Citizen Social Assistance"
              : typeStr === "renewal"
              ? "Senior Citizen ID Renewal"
              : typeStr === "loss" || typeStr === "replacement"
              ? "Senior Citizen ID Replacement"
              : "Senior Citizen ID"

            let appStatus: ApplicationStatus = "Pending"
            if (p.status === "approved") appStatus = "Approved"
            else if (p.status === "released") appStatus = "Released"
            else if (p.status === "for_release") appStatus = "For Release"
            else if (p.status === "under_review" || p.status === "review") appStatus = "Under Review"

            return {
              applicationNo: p.assignedIdNumber || p.referenceNumber || p.qcidNo || qcId,
              assistance: serviceTitle,
              assistanceCategory: isPwd ? "PWD" : "Senior Citizen",
              dateApplied: new Date(p.submittedAt || p.created_at || Date.now()).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              status: appStatus,
              applicantName: [p.firstName, p.middleName, p.lastName, p.suffix].filter(Boolean).join(" "),
              dateOfBirth: p.dateOfBirth || userProfile.birthDateDisplay,
              address:
                p.address ||
                `${userProfile.houseNo} ${userProfile.street}, ${userProfile.barangay}, ${userProfile.city}`,
              contactNumber: p.contactNo || p.cellphoneNo || userProfile.mobileNumber,
              email: p.email || userProfile.email,
              remarks:
                p.status === "approved"
                  ? `Approved. Assigned ID Number: ${p.assignedIdNumber || "Available at office"}`
                  : p.status === "rejected"
                  ? `Review required: ${p.rejectionReason || "Incomplete documentation."}`
                  : "Currently being reviewed by social worker.",
            }
          })
        allFoundApps.push(...mappedPwd)
      } catch (err) {
        console.warn("Could not fetch PWD/Senior applications:", err)
      }

      // 3. Solo Parent Applications
      try {
        const spRes = await fetch(`${API_BASE}/api/solo-parent/user/${userId}`)
        if (spRes.ok) {
          const spData = await spRes.json()
          if (spData.applications && Array.isArray(spData.applications)) {
            const mappedSp: ApplicationRecord[] = spData.applications
              .filter((app: any) => {
                if (app.is_archived === true) return false
                const appQc = String(app.qcid_number || app.qc_id || app.reference_number || "").trim().toLowerCase()
                const appEmail = String(app.email || "").trim().toLowerCase()
                const uQc = qcId.toLowerCase()
                return (
                  (uQc !== "" && appQc === uQc) ||
                  (userEmail !== "" && appEmail === userEmail) ||
                  (app.user_id && String(app.user_id) === String(userId))
                )
              })
              .map((app: any) => ({
                applicationNo: app.qcid_number || app.qc_id || app.reference_number || qcId,
                assistance: `Solo Parent ID (${app.application_type || "New"})`,
                assistanceCategory: "Solo Parent",
                dateApplied: new Date(app.created_at || Date.now()).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                status:
                  app.application_status === "approved"
                    ? "Approved"
                    : app.application_status === "released"
                    ? "Released"
                    : app.application_status === "for_release"
                    ? "For Release"
                    : "Under Review",
                applicantName:
                  [app.first_name, app.last_name].filter(Boolean).join(" ") ||
                  `${userProfile.firstName} ${userProfile.lastName}`,
                dateOfBirth: userProfile.birthDateDisplay,
                address:
                  app.address ||
                  `${userProfile.houseNo} ${userProfile.street}, ${userProfile.barangay}, ${userProfile.city}`,
                contactNumber: app.contact_number || userProfile.mobileNumber,
                email: app.email || userProfile.email,
                remarks:
                  app.admin_notes || (app.application_status === "approved" ? "Application approved" : "Under review"),
              }))
            allFoundApps.push(...mappedSp)
          }
        }
      } catch (err) {
        console.warn("Could not fetch Solo Parent applications:", err)
      }

      // 4. Child Welfare Applications
      try {
        const cwRes = await fetch(`${API_BASE}/api/child-welfare/user/${userId}`)
        if (cwRes.ok) {
          const cwData = await cwRes.json()
          if (cwData.applications && Array.isArray(cwData.applications)) {
            const mappedCw: ApplicationRecord[] = cwData.applications
              .filter((app: any) => {
                if (app.is_archived === true) return false
                const appQc = String(app.reference_number || app.qc_id || "").trim().toLowerCase()
                const appEmail = String(app.email || "").trim().toLowerCase()
                const uQc = qcId.toLowerCase()
                return (
                  (uQc !== "" && appQc === uQc) ||
                  (userEmail !== "" && appEmail === userEmail) ||
                  (app.user_id && String(app.user_id) === String(userId))
                )
              })
              .map((app: any) => ({
                applicationNo: app.reference_number || qcId,
                assistance: app.category_title || "Child Welfare Assistance",
                assistanceCategory: "Child Welfare",
                dateApplied: new Date(app.created_at || Date.now()).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                status:
                  app.application_status === "approved"
                    ? "Approved"
                    : app.application_status === "released"
                    ? "Released"
                    : "Under Review",
                applicantName: app.child_name || "Beneficiary Child",
                dateOfBirth: userProfile.birthDateDisplay,
                address:
                  app.address ||
                  `${userProfile.houseNo} ${userProfile.street}, ${userProfile.barangay}, ${userProfile.city}`,
                contactNumber: app.contact_number || userProfile.mobileNumber,
                email: app.email || userProfile.email,
                remarks: app.application_status === "approved" ? "Approved by Child Welfare" : "Under review",
              }))
            allFoundApps.push(...mappedCw)
          }
        }
      } catch (err) {
        console.warn("Could not fetch Child Welfare applications:", err)
      }

      // 5. Livelihood Applications
      try {
        let livApps: any[] = []
        try {
          const livRes = await fetch(`${API_BASE}/api/livelihood/applications`)
          if (livRes.ok) {
            const lData = await livRes.json()
            livApps = Array.isArray(lData) ? lData : lData.applications || []
          }
        } catch {}
        if (!livApps || livApps.length === 0) {
          try {
            livApps = JSON.parse(localStorage.getItem("livelihood_applications") || "[]")
          } catch {}
        }
        if (Array.isArray(livApps) && livApps.length > 0) {
          const mappedLiv: ApplicationRecord[] = livApps
            .filter((l: any) => {
              if (l.is_archived === true) return false
              const lQc = String(l.qcid || l.reference_number || "").trim().toLowerCase()
              const lEmail = String(l.email || "").trim().toLowerCase()
              const uQc = qcId.toLowerCase()
              return (uQc !== "" && lQc === uQc) || (userEmail !== "" && lEmail === userEmail)
            })
            .map((l: any) => ({
              applicationNo: l.qcid || l.reference_number || qcId,
              assistance: l.proposed_business_name
                ? `Livelihood Assistance: ${l.proposed_business_name}`
                : "Livelihood Assistance",
              assistanceCategory: "Livelihood",
              dateApplied: new Date(l.created_at || Date.now()).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              status:
                l.status === "Approved" || l.status === "approved"
                  ? "Approved"
                  : l.status === "Released" || l.status === "released"
                  ? "Released"
                  : "Under Review",
              applicantName:
                l.applicant_name ||
                [l.first_name, l.last_name].filter(Boolean).join(" ") ||
                `${userProfile.firstName} ${userProfile.lastName}`,
              dateOfBirth: userProfile.birthDateDisplay,
              address:
                l.address ||
                `${userProfile.houseNo} ${userProfile.street}, ${userProfile.barangay}, ${userProfile.city}`,
              contactNumber: l.contact_number || userProfile.mobileNumber,
              email: l.email || userProfile.email,
              remarks: l.remarks || "Livelihood capital assistance application",
            }))
          allFoundApps.push(...mappedLiv)
        }
      } catch (err) {
        console.warn("Could not fetch Livelihood applications:", err)
      }

      // 6. Training Applications
      try {
        let trnApps: any[] = []
        try {
          const trnRes = await fetch(`${API_BASE}/api/training/applications`)
          if (trnRes.ok) {
            const tData = await trnRes.json()
            trnApps = Array.isArray(tData) ? tData : tData.applications || []
          }
        } catch {}
        if (!trnApps || trnApps.length === 0) {
          try {
            trnApps = JSON.parse(localStorage.getItem("training_applications") || "[]")
          } catch {}
        }
        if (Array.isArray(trnApps) && trnApps.length > 0) {
          const mappedTrn: ApplicationRecord[] = trnApps
            .filter((t: any) => {
              if (t.is_archived === true) return false
              const tQc = String(t.qcid || t.reference_number || "").trim().toLowerCase()
              const tEmail = String(t.email || "").trim().toLowerCase()
              const uQc = qcId.toLowerCase()
              return (uQc !== "" && tQc === uQc) || (userEmail !== "" && tEmail === userEmail)
            })
            .map((t: any) => ({
              applicationNo: t.qcid || t.reference_number || qcId,
              assistance: `Training: ${t.program_title || t.course_title || t.training_course || "Skills Training"}`,
              assistanceCategory: "Livelihood",
              dateApplied: new Date(t.created_at || Date.now()).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              status:
                t.status === "Enrolled" || t.status === "approved"
                  ? "Approved"
                  : t.status === "Completed"
                  ? "Released"
                  : "Under Review",
              applicantName:
                t.applicant_name ||
                [t.first_name, t.last_name].filter(Boolean).join(" ") ||
                `${userProfile.firstName} ${userProfile.lastName}`,
              dateOfBirth: userProfile.birthDateDisplay,
              address: `${userProfile.houseNo} ${userProfile.street}, ${userProfile.barangay}, ${userProfile.city}`,
              contactNumber: t.contact_number || userProfile.mobileNumber,
              email: t.email || userProfile.email,
              remarks: `Training course application for ${t.program_title || "Skills Program"}`,
            }))
          allFoundApps.push(...mappedTrn)
        }
      } catch (err) {
        console.warn("Could not fetch Training applications:", err)
      }

      // Filter out any active applications that are already in deleted list
      const filteredActive = allFoundApps.filter(
        (app) => !deletedKeySet.has((app.applicationNo + "::" + app.assistance).toLowerCase())
      )

      setApplications(filteredActive)
    }

    fetchUserApps()
  }, [])

  const currentList = activeTab === "active" ? applications : deletedApplications

  const filteredApplications = currentList.filter((app) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      app.applicationNo.toLowerCase().includes(q) ||
      app.assistance.toLowerCase().includes(q) ||
      app.applicantName.toLowerCase().includes(q) ||
      app.status.toLowerCase().includes(q) ||
      app.assistanceCategory.toLowerCase().includes(q)
    )
  })

  const handleCopyNo = (text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // STATUS HELPERS
  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "Under Review":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />,
          label: "Under Review",
        }
      case "For Assessment":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          icon: <FileText className="w-3.5 h-3.5 text-blue-600" />,
          label: "For Assessment",
        }
      case "Approved":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          label: "Approved",
        }
      case "For Release":
        return {
          bg: "bg-purple-50 text-purple-800 border-purple-200",
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-600" />,
          label: "For Release",
        }
      case "Released":
        return {
          bg: "bg-teal-50 text-teal-800 border-teal-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
          label: "Released",
        }
      case "Pending":
      default:
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          label: "Pending",
        }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ── VIEW APPLICATION PAGE (Detail Screen)
  // ═══════════════════════════════════════════════════════════════════════
  if (selectedApp) {
    const currentStatus = selectedApp.status
    const isDeletedItem = deletedApplications.some(
      (d) => d.applicationNo === selectedApp.applicationNo && d.assistance === selectedApp.assistance
    )
    const badge = getStatusBadge(currentStatus)

    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Top Back Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <button
            onClick={() => setSelectedApp(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("backToMyApplications") || "Back to My Applications"}</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Application Status:</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
            >
              {badge.icon}
              {badge.label}
            </span>

            {isDeletedItem ? (
              <div className="flex items-center gap-2 ml-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleRestore(selectedApp)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setAppToPermanentDelete(selectedApp)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanent Delete</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAppToDelete(selectedApp)}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                title="Delete Application"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Page Title */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            {t("applicationDetailsTitle") || "View Application Details"}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {selectedApp.assistance}
          </h1>
          <p className="text-sm text-gray-500">
            Detailed information and official status of your submitted social service request.
          </p>
        </div>

        {/* Card 1: Overview & Ref No */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Reference / QC ID Number
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-mono font-black text-blue-700">
                  {selectedApp.applicationNo}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyNo(selectedApp.applicationNo)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  title="Copy Reference Number"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 border border-gray-200">
                {selectedApp.assistanceCategory}
              </span>
              <span className="text-xs text-gray-400">
                Date Applied: <strong>{selectedApp.dateApplied}</strong>
              </span>
            </div>
          </div>

          {/* Applicant Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
            <div>
              <span className="text-gray-400 block font-medium">Full Name:</span>
              <span className="font-bold text-gray-900 text-sm uppercase">{selectedApp.applicantName}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Date of Birth:</span>
              <span className="font-medium text-gray-900">{selectedApp.dateOfBirth}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Contact Number:</span>
              <span className="font-mono font-medium text-gray-900">{selectedApp.contactNumber}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Email Address:</span>
              <span className="font-medium text-gray-900 truncate block">{selectedApp.email || "N/A"}</span>
            </div>
          </div>

          <div className="text-xs pt-2 border-t border-gray-100">
            <span className="text-gray-400 block font-medium">Address:</span>
            <span className="font-medium text-gray-900">{selectedApp.address}</span>
          </div>
        </div>

        {/* Card 2: Financial Aid & Payout Appointment */}
        {(() => {
          const rawType = (selectedApp.assistance || "").replace(/\s*assistance/gi, "").trim()
          const formattedType = rawType.charAt(0).toUpperCase() + rawType.slice(1) + " Assistance"
          const fixedAmt = FIXED_ASSISTANCE_AMOUNTS[formattedType] || FIXED_ASSISTANCE_AMOUNTS[selectedApp.assistance] || 1000

          const savedDisbursements = getSavedDisbursements()
          const matchDisb = savedDisbursements.find(
            (d) =>
              d.applicationRef === selectedApp.applicationNo ||
              d.applicantName.toLowerCase().trim() === selectedApp.applicantName.toLowerCase().trim()
          )

          const apptDate = matchDisb?.appointmentDate || "August 31, 2026"
          const apptTime = matchDisb?.appointmentTime || "10:00 AM"
          const payoutVenue = matchDisb?.venue || "Quezon City Hall"

          return (
            <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-blue-50/90 border border-emerald-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  FINANCIAL AID & PAYOUT APPOINTMENT
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Automatically Linked
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white/80 rounded-xl p-3.5 border border-emerald-100 space-y-1">
                  <span className="text-gray-500 block uppercase font-bold text-[10px]">Approved Fixed Amount</span>
                  <span className="text-2xl font-black text-emerald-700">₱{fixedAmt.toLocaleString()}</span>
                  <p className="text-[10px] text-gray-500">Standard rate based on assistance category</p>
                </div>

                <div className="bg-white/80 rounded-xl p-3.5 border border-emerald-100 space-y-1">
                  <span className="text-gray-500 block uppercase font-bold text-[10px]">Appointment Schedule</span>
                  <span className="text-sm font-extrabold text-blue-950 block">{apptDate}</span>
                  <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {apptTime}
                  </span>
                </div>

                <div className="bg-white/80 rounded-xl p-3.5 border border-emerald-100 space-y-1">
                  <span className="text-gray-500 block uppercase font-bold text-[10px]">Payout Location</span>
                  <span className="text-sm font-bold text-gray-900 block">{payoutVenue}</span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500" /> SSDD Payout Counter
                  </span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSelectedApp(null)}
            className="w-full sm:w-auto px-6 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold transition-colors cursor-pointer"
          >
            ← {t("backToMyApplications") || "Back to Applications"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 h-11 rounded-xl bg-[#3b82f6] hover:bg-blue-600 text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Print Receipt / Details
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ── MY APPLICATIONS LIST (Main View & Deleted View)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* ── TOP HEADER (Main View vs Deleted View) ── */}
      {activeTab === "deleted" ? (
        <div className="space-y-4 border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t("backToMyApplications") || "Back to History Application"}</span>
            </button>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Deleted Applications ({deletedApplications.length})</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                Trash / Deleted Items
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Deleted Applications
              </h1>
              <p className="text-sm text-gray-500">
                You can restore deleted applications or permanently remove them from the database.
              </p>
            </div>

            {/* Search Input for Deleted View */}
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("searchApplicationsPlaceholder") || "Search deleted applications..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 h-10 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white shadow-xs"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              User Application Portal
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t("myApplicationsTitle") || "History Application"}
            </h1>
            <p className="text-sm text-gray-500">
              {t("myApplicationsSubtitle") || "Track the status, schedule, and details of all your submitted social service requests."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("searchApplicationsPlaceholder") || "Search application no., assistance, or name..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 h-10 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-xs"
              />
            </div>

            {/* Deleted Applications Entry Button */}
            <button
              type="button"
              onClick={() => setActiveTab("deleted")}
              className="shrink-0 flex items-center gap-2 px-3.5 h-10 rounded-xl text-xs font-bold bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 border border-gray-200 hover:border-red-200 transition-all cursor-pointer shadow-2xs"
              title="View deleted applications"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="hidden md:inline">Deleted Applications</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-700 border border-red-200">
                {deletedApplications.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── APPLICATION CARDS LIST ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>
            {activeTab === "active" ? "Total Applications" : "Total Deleted"}:{" "}
            <strong>{filteredApplications.length}</strong>
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Clear search
            </button>
          )}
        </div>

        {filteredApplications.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              {activeTab === "active" ? <FileText className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
            </div>
            <h3 className="text-sm font-bold text-gray-700">
              {activeTab === "active" ? "No Applications Found" : "No Deleted Applications"}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {activeTab === "active"
                ? "You have no submitted applications or no records match your search."
                : "No applications found in the trash."}
            </p>
          </div>
        ) : (
          filteredApplications.map((app) => {
            const badge = getStatusBadge(app.status)
            const isDeleted = activeTab === "deleted"

            return (
              <div
                key={app.applicationNo + app.assistance}
                className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-xs transition-all space-y-4 ${
                  isDeleted ? "border-red-200/80 hover:border-red-300 bg-red-50/10" : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-blue-700">
                        {app.applicationNo}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                        {app.assistanceCategory}
                      </span>
                      {isDeleted && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                          Deleted on: {app.deletedAt || "Recently"}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{app.assistance}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block">Applicant:</span>
                    <span className="font-semibold text-gray-900 uppercase">{app.applicantName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Date Applied:</span>
                    <span className="font-medium text-gray-900">{app.dateApplied}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Contact Number:</span>
                    <span className="font-mono text-gray-900">{app.contactNumber}</span>
                  </div>
                </div>

                {/* ── CONNECTED FINANCIAL AID & PAYOUT APPOINTMENT BANNER ── */}
                {(() => {
                  const rawType = (app.assistance || "").replace(/\s*assistance/gi, "").trim()
                  const formattedType = rawType.charAt(0).toUpperCase() + rawType.slice(1) + " Assistance"
                  const fixedAmt = FIXED_ASSISTANCE_AMOUNTS[formattedType] || FIXED_ASSISTANCE_AMOUNTS[app.assistance] || 1000

                  const savedDisbursements = getSavedDisbursements()
                  const matchDisb = savedDisbursements.find(
                    (d) =>
                      d.applicationRef === app.applicationNo ||
                      d.applicantName.toLowerCase().trim() === app.applicantName.toLowerCase().trim()
                  )

                  const apptDate = matchDisb?.appointmentDate || "August 31, 2026"
                  const apptTime = matchDisb?.appointmentTime || "10:00 AM"
                  const payoutVenue = matchDisb?.venue || "Quezon City Hall"

                  return (
                    <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-blue-50/90 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Banknote className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              Financial Aid Record
                            </span>
                            <span className="text-[11px] font-mono text-blue-700 font-bold">
                              {matchDisb?.disbursementId || "DISB-2026-0001"}
                            </span>
                          </div>
                          <p className="font-bold text-gray-900">
                            Approved Fixed Amount: <span className="text-emerald-700 font-black text-sm">₱{fixedAmt.toLocaleString()}</span>
                          </p>
                          <p className="text-[11px] text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Payout Appointment: <strong className="text-blue-950">{apptDate} – {apptTime}</strong> ({payoutVenue})</span>
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Fixed Amount</span>
                        <span className="text-lg font-black text-emerald-700">₱{fixedAmt.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })()}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official record of Quezon City Social Services</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {isDeleted ? (
                      /* ── DELETED ACTIONS (RESTORE & PERMANENT DELETE) ── */
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRestore(app)}
                          className="px-4 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
                          title="Restore application to active list"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setAppToPermanentDelete(app)}
                          className="px-4 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm"
                          title="Permanently delete from database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Permanent Delete</span>
                        </button>
                      </>
                    ) : (
                      /* ── ACTIVE ACTIONS (DELETE & VIEW) ── */
                      <>
                        <button
                          type="button"
                          onClick={() => setAppToDelete(app)}
                          className="px-3.5 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="flex-1 sm:flex-initial px-5 h-10 rounded-xl bg-[#3b82f6] hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-sm"
                        >
                          <span>VIEW APPLICATION</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── 1. SOFT DELETE CONFIRMATION MODAL ── */}
      {appToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.7)" }}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-gray-900">Delete Application?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to delete the application for <strong className="text-gray-900">{appToDelete.assistance}</strong> ({appToDelete.applicationNo})?
              </p>
              <p className="text-[11px] text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-left">
                Note: This application will be moved to <strong>"Deleted Applications"</strong> where you can restore it or permanently delete it.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setAppToDelete(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. PERMANENT DELETE CONFIRMATION MODAL ── */}
      {appToPermanentDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.75)" }}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-red-300 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-red-950">Permanently Delete Application?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-gray-900">{appToPermanentDelete.assistance}</strong> ({appToPermanentDelete.applicationNo})?
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 text-left font-medium space-y-1">
                <span className="font-bold flex items-center gap-1 text-red-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Warning: This action cannot be undone!
                </span>
                <p>
                  This record will be permanently purged from the PostgreSQL database, storage, and official portal.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setAppToPermanentDelete(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmPermanentDelete}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Permanently deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanent Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION BANNER ── */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl text-white text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastMessage.type === "danger" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toastMessage.type === "danger" ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  )
}

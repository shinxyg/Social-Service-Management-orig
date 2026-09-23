import { useState, useEffect, useCallback, useMemo } from 'react'
import { API_BASE as APP_API_BASE } from '../../config/api'
import { getSavedProfilePhoto } from '../../utils/profilePhoto'
import { FIXED_ASSISTANCE_AMOUNTS, pushUserNotification } from '../../utils/financialAidSync'
import { notifyApplicationChange } from '../../utils/realtimeSync'
import MaskedText from '../ui/masked-text'
import { OfficialGuaranteeLetterModal } from '../ui/official-guarantee-letter-modal'
import { OfficialReferralLetterModal, type ReferralLetterData } from '../ui/official-referral-letter-modal'
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  XCircle, 
  FileText,
  Search
} from 'lucide-react'

const API_BASE = `${APP_API_BASE}/api/aics`

const DESIGN = {
  colors: {
    primary: 'var(--color-primary, hsl(221, 83%, 53%))',
    canvas: 'var(--color-background, hsl(220, 25%, 98%))',
    foreground: 'var(--color-foreground, hsl(222, 47%, 11%))',
    card: 'var(--color-card, #ffffff)',
    sidebar: 'var(--color-sidebar, hsl(222, 47%, 11%))',
    muted: 'var(--color-muted, hsl(220, 14%, 95%))',
    border: 'var(--color-border, hsl(220, 13%, 91%))',
  },
  fonts: {
    body: '"Inter", system-ui, -apple-system, sans-serif',
    heading: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
  },
  radius: {
    base: '16px',
    card: '12px',
    lg: '8px',
  },
}

export type ApplicationStatus = 
  | 'submit_pending' 
  | 'waiting_approval' 
  | 'scheduled' 
  | 'under_review' 
  | 'approved' 
  | 'for_referral' 
  | 'referred' 
  | 'rejected' 
  | 'pending' 
  | 'completed'

interface AicsDocument {
  id: number
  document_label: string
  original_filename: string
  file_path?: string
  file_type: string
  uploaded_at: string
}

interface AicsApplication {
  id: number
  reference_no: string
  assistance_type: string
  qc_id: string | null
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  nationality: string | null
  birth_date: string | null
  age: string | null
  gender: string | null
  civil_status: string | null
  phone: string | null
  email: string | null
  address: string | null
  barangay?: string | null
  details: Record<string, any> | null
  status: ApplicationStatus
  created_at: string
  updated_at: string
}

function getAppSuffix(app: AicsApplication | null | undefined): string {
  if (!app) return ''
  if (app.suffix && app.suffix.trim() && app.suffix !== '—') return app.suffix.trim()
  if ((app.details as any)?.suffix) return String((app.details as any).suffix).trim()
  if ((app.details as any)?.applicantSuffix) return String((app.details as any).applicantSuffix).trim()

  try {
    const raw = localStorage.getItem('currentUser') || localStorage.getItem('userProfile') || localStorage.getItem('user')
    if (raw) {
      const u = JSON.parse(raw)
      const uQcid = u.qcidNumber || u.qcid_number || u.qcidNo || u.qcid || u.reference_number
      const uEmail = u.email
      if (
        (uQcid && (uQcid === app.qc_id || uQcid === app.reference_no)) ||
        (uEmail && app.email && uEmail.toLowerCase() === app.email.toLowerCase()) ||
        (u.lastName && app.last_name && u.lastName.toLowerCase() === app.last_name.toLowerCase())
      ) {
        if (u.suffix && u.suffix.trim()) return u.suffix.trim()
      }
    }
  } catch {}

  return ''
}

function fullName(app: AicsApplication) {
  const suffix = getAppSuffix(app)
  const parts = [app.first_name, app.middle_name, app.last_name]
  if (suffix && !app.last_name?.toLowerCase().endsWith(suffix.toLowerCase())) {
    parts.push(suffix)
  }
  return parts.filter(Boolean).join(' ')
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return dateStr
  }
}

export function getStatusBadgeInfo(status: string) {
  const s = String(status || '').toLowerCase()
  switch (s) {
    case 'submit_pending':
    case 'pending':
      return { label: 'Submit Pending', color: 'bg-amber-100 text-amber-800 border-amber-200', step: 1 }
    case 'waiting_approval':
    case 'for_screening':
      return { label: 'Waiting to Approve', color: 'bg-orange-100 text-orange-800 border-orange-200', step: 2 }
    case 'scheduled':
    case 'set_scheduling':
      return { label: 'Scheduled', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', step: 3 }
    case 'under_review':
    case 'under_assessment':
      return { label: 'Under Review', color: 'bg-blue-100 text-blue-800 border-blue-200', step: 4 }
    case 'approved':
    case 'completed':
      return { label: 'Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', step: 5 }
    case 'for_referral':
      return { label: 'For Referral', color: 'bg-purple-100 text-purple-800 border-purple-200', step: 5 }
    case 'referred':
      return { label: 'Referred', color: 'bg-teal-100 text-teal-800 border-teal-200', step: 5 }
    case 'rejected':
    case 'denied':
      return { label: 'Rejected / Denied', color: 'bg-red-100 text-red-800 border-red-200', step: 5 }
    default:
      return { label: status || 'Pending', color: 'bg-gray-100 text-gray-800 border-gray-200', step: 1 }
  }
}

export function getEffectiveAppStatus(app?: AicsApplication | null): string {
  if (!app) return 'pending'
  const rawSt = String(app.status || 'pending').toLowerCase()
  if (rawSt === 'submit_pending' || rawSt === 'pending') {
    return 'submit_pending'
  }
  return rawSt
}

export default function AICS() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin-review'>('dashboard')
  const [selectedTab, setSelectedTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [applications, setApplications] = useState<AicsApplication[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [reviewingApp, setReviewingApp] = useState<AicsApplication | null>(null)
  const [reviewingDocs, setReviewingDocs] = useState<AicsDocument[]>([])
  const [viewingDoc, setViewingDoc] = useState<AicsDocument | null>(null)
  const [showInformantInfo, setShowInformantInfo] = useState(false)
  const [showDeceasedInfo, setShowDeceasedInfo] = useState(false)
  const [showBeneficiaryInfo, setShowBeneficiaryInfo] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Modals for Actions
  const [glApp, setGlApp] = useState<any | null>(null)
  const [refLetterApp, setRefLetterApp] = useState<ReferralLetterData | null>(null)
  
  // Schedule Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  })
  const [scheduleTime, setScheduleTime] = useState('09:00 AM')
  const [scheduleVenue, setScheduleVenue] = useState('Quezon City Hall Complex - SSDD Assessment Area')

  // Referral Modal
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [referralAgency, setReferralAgency] = useState('PCSO')
  const [referralNotes, setReferralNotes] = useState('')

  // Reject Modal
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('Non-resident of Quezon City / Unverified Residency Documents')

  const fetchApplications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`${API_BASE}/applications`)
      if (!res.ok) throw new Error('Failed to fetch applications')
      const data = await res.json()
      setApplications(data.applications || [])
    } catch (err) {
      console.error(err)
      if (!silent) {
        setErrorMsg('Hindi makuha ang listahan ng applications. Siguraduhing tumatakbo ang backend server.')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications(false)

    const interval = setInterval(() => {
      fetchApplications(true)
    }, 2500)

    const handleSync = () => {
      fetchApplications(true)
    }

    window.addEventListener('storage', handleSync)
    window.addEventListener('aics_application_submitted', handleSync)
    window.addEventListener('aics_applications_updated', handleSync)
    window.addEventListener('appointments_updated', handleSync)
    window.addEventListener('printed_gl_applications_updated', handleSync)
    window.addEventListener('applications_updated', handleSync)
    window.addEventListener('focus', handleSync)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('aics_application_submitted', handleSync)
      window.removeEventListener('aics_applications_updated', handleSync)
      window.removeEventListener('appointments_updated', handleSync)
      window.removeEventListener('printed_gl_applications_updated', handleSync)
      window.removeEventListener('applications_updated', handleSync)
      window.removeEventListener('focus', handleSync)
    }
  }, [fetchApplications])

  const openReview = async (app: AicsApplication) => {
    setActionLoading(true)
    setReviewingApp(app)
    setCurrentView('admin-review')
    try {
      const targetIdentifier = app.id ? String(app.id) : encodeURIComponent(app.reference_no || app.qc_id || '')
      const res = await fetch(`${API_BASE}/applications/${targetIdentifier}`)
      if (res.ok) {
        const data = await res.json()
        if (data.application) {
          setReviewingApp(data.application)
        }
        setReviewingDocs(data.documents || [])
      }
    } catch (err) {
      console.error('Error fetching application details:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Fast optimistic status updater with real-time push notification
  const updateStatus = async (
    newStatus: ApplicationStatus, 
    meta?: { 
      rejectionReason?: string
      referralAgency?: string
      referralNotes?: string
      appointmentDate?: string
      appointmentVenue?: string 
    }
  ) => {
    if (!reviewingApp) return
    const targetApp = reviewingApp
    setActionLoading(true)

    // Optimistic local state update
    const updatedDetails = {
      ...(targetApp.details || {}),
      ...(meta?.rejectionReason ? { rejectionReason: meta.rejectionReason } : {}),
      ...(meta?.referralAgency ? { referralAgency: meta.referralAgency } : {}),
      ...(meta?.referralNotes ? { referralNotes: meta.referralNotes } : {}),
      ...(meta?.appointmentDate ? { appointmentDate: meta.appointmentDate } : {}),
      ...(meta?.appointmentVenue ? { appointmentVenue: meta.appointmentVenue } : {}),
    }

    const optimisticApp: AicsApplication = {
      ...targetApp,
      status: newStatus,
      details: updatedDetails,
      updated_at: new Date().toISOString(),
    }

    setReviewingApp(optimisticApp)
    setApplications(prev => prev.map(a => a.id === targetApp.id ? optimisticApp : a))

    try {
      const res = await fetch(`${API_BASE}/applications/${targetApp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          ...meta 
        }),
      })

      if (!res.ok) throw new Error('Failed to update status')

      const appName = fullName(targetApp).toUpperCase()
      const appRef = targetApp.reference_no || targetApp.qc_id || 'QC-AICS-REF'

      // Instant notifications dispatch
      if (newStatus === 'waiting_approval') {
        pushUserNotification({
          userId: targetApp.qc_id || targetApp.email || 'all',
          title: 'AICS: Pre-Approved for Scheduling',
          message: `Magandang araw! Ang inyong ${targetApp.assistance_type} application (${appRef}) ay na-screen at naka-queue na para sa appointment scheduling.`,
          type: 'aics',
          link: '/portal/aics',
        })
      } else if (newStatus === 'scheduled') {
        pushUserNotification({
          userId: targetApp.qc_id || targetApp.email || 'all',
          title: 'AICS: Appointment Confirmed',
          message: `Nakatakda ang inyong interview sa ${meta?.appointmentDate || scheduleDate} sa ${meta?.appointmentVenue || scheduleVenue}. Pakidala ang orihinal na dokumento.`,
          type: 'appointment',
          link: '/portal/aics',
        })
      } else if (newStatus === 'under_review') {
        pushUserNotification({
          userId: targetApp.qc_id || targetApp.email || 'all',
          title: 'AICS: Under Review & Case Assessment',
          message: `Kasalukuyan nang sinusuri ng Social Worker ang inyong ${targetApp.assistance_type} (${appRef}).`,
          type: 'aics',
          link: '/portal/aics',
        })
      } else if (newStatus === 'approved') {
        pushUserNotification({
          userId: targetApp.qc_id || targetApp.email || 'all',
          title: 'AICS: Application APPROVED',
          message: `Malugod naming ipinababatid na APPROVED ang inyong ${targetApp.assistance_type}. Ang inyong Guarantee Letter / Aid Voucher ay inihahanda na.`,
          type: 'payout',
          link: '/portal/aics',
        })

        // Auto disbursement entry
        try {
          const rawConcern = (targetApp.assistance_type || 'Medical').replace(/\s*assistance/gi, '').trim()
          const formattedConcern = rawConcern.charAt(0).toUpperCase() + rawConcern.slice(1) + ' Assistance'
          const fixedAmt = FIXED_ASSISTANCE_AMOUNTS[formattedConcern] || FIXED_ASSISTANCE_AMOUNTS[targetApp.assistance_type] || 5000
          const qcid = targetApp.qc_id || targetApp.reference_no || '110000116932100'

          const rawDisb = localStorage.getItem('all_financial_disbursements')
          const currentDisb = rawDisb ? JSON.parse(rawDisb) : []
          const appDisbId = `aics-disb-${targetApp.id}`

          if (!currentDisb.some((d: any) => d.id === appDisbId)) {
            currentDisb.unshift({
              id: appDisbId,
              disbursementId: `DISB-2026-${String(targetApp.id).padStart(4, '0')}`,
              applicationRef: qcid,
              applicantName: appName,
              assistanceType: formattedConcern,
              fixedAmount: fixedAmt,
              dateApproved: new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
              status: 'PENDING',
              venue: 'Quezon City Hall',
              remarks: 'Awtomatikong pumasok mula sa naaprubahang AICS aplikasyon.',
            })
            localStorage.setItem('all_financial_disbursements', JSON.stringify(currentDisb))
          }
        } catch (e) {
          console.warn('Could not auto-register AICS disbursement:', e)
        }
      } else if (newStatus === 'for_referral' || newStatus === 'referred') {
        pushUserNotification({
          userId: targetApp.qc_id || targetApp.email || 'all',
          title: `AICS: Referred to ${meta?.referralAgency || 'Partner Agency'}`,
          message: `Ang inyong kaso ay matagumpay na nai-endorso sa ${meta?.referralAgency || 'PCSO/DSWD'}. Maaari ninyong kunin/i-download ang inyong Official Referral Letter.`,
          type: 'aics',
          link: '/portal/aics',
        })
      } else if (newStatus === 'rejected') {
        pushUserNotification({
          userId: targetApp.qc_id || targetApp.email || 'all',
          title: 'AICS: Application Update',
          message: `Ang inyong aplikasyon (${appRef}) ay hindi naaprubahan. Dahilan: ${meta?.rejectionReason || 'Hindi kwalipikado sa mga panuntunan ng programa.'}`,
          type: 'aics',
          link: '/portal/aics',
        })
      }

      // Trigger broad realtime sync
      notifyApplicationChange('STATUS_CHANGED', 'aics', appRef)
      window.dispatchEvent(new Event('aics_applications_updated'))
      window.dispatchEvent(new Event('user_notifications_updated'))
      window.dispatchEvent(new Event('financial_disbursements_updated'))
      window.dispatchEvent(new Event('appointments_updated'))

    } catch (err) {
      console.error('Status update failed:', err)
      alert('Failed to update status. Please try again.')
      fetchApplications()
    } finally {
      setActionLoading(false)
    }
  }

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = 
        !q ||
        fullName(app).toLowerCase().includes(q) ||
        (app.reference_no || '').toLowerCase().includes(q) ||
        (app.qc_id || '').toLowerCase().includes(q) ||
        (app.assistance_type || '').toLowerCase().includes(q)

      if (!matchesSearch) return false

      const effStatus = getEffectiveAppStatus(app)

      if (selectedTab === 'all') return true
      if (selectedTab === 'pending') return effStatus === 'submit_pending' || effStatus === 'pending' || effStatus === 'waiting_approval' || effStatus === 'scheduled' || effStatus === 'under_review'
      if (selectedTab === 'approved') return effStatus === 'approved' || effStatus === 'completed'
      if (selectedTab === 'referred') return effStatus === 'for_referral' || effStatus === 'referred'
      if (selectedTab === 'rejected') return effStatus === 'rejected'

      return true
    })
  }, [applications, searchQuery, selectedTab])

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      all: applications.length,
      pending: applications.filter(a => ['submit_pending', 'pending', 'waiting_approval', 'scheduled', 'under_review'].includes(getEffectiveAppStatus(a))).length,
      approved: applications.filter(a => {
        const st = getEffectiveAppStatus(a)
        return st === 'approved' || st === 'completed'
      }).length,
      rejected: applications.filter(a => getEffectiveAppStatus(a) === 'rejected').length,
    }
  }, [applications])


  // ==========================================
  // VIEW 1: DASHBOARD VIEW
  // ==========================================
  if (currentView === 'dashboard') {
    return (
      <div style={{ backgroundColor: DESIGN.colors.canvas, minHeight: '100%' }} className="py-8">
        <style>{`
          body { font-family: ${DESIGN.fonts.body}; }
          h1, h2, h3, h4, h5, h6 { font-family: ${DESIGN.fonts.heading}; font-weight: 600; }
        `}</style>

        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 style={{ color: DESIGN.colors.foreground, fontSize: '28px', fontWeight: 700 }} className="font-heading tracking-tight">
                Assistance to Individuals in Crisis Situation (AICS)
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                7-Stage Social Case Lifecycle Management &bull; Real-time Processing & Inter-Agency Referrals
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search applicant, QCID, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none w-64 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">{errorMsg}</div>
          )}

          {/* Quick Metrics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
            <div style={{ backgroundColor: DESIGN.colors.card, borderRadius: DESIGN.radius.card }} className="p-4 shadow-2xs border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Intake / Pending</span>
                <p className="text-xl font-extrabold text-slate-800">{tabCounts.pending}</p>
              </div>
            </div>

            <div style={{ backgroundColor: DESIGN.colors.card, borderRadius: DESIGN.radius.card }} className="p-4 shadow-2xs border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved Aid</span>
                <p className="text-xl font-extrabold text-slate-800">{tabCounts.approved}</p>
              </div>
            </div>

            <div style={{ backgroundColor: DESIGN.colors.card, borderRadius: DESIGN.radius.card }} className="p-4 shadow-2xs border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Disqualified / Rejected</span>
                <p className="text-xl font-extrabold text-slate-800">{tabCounts.rejected}</p>
              </div>
            </div>
          </div>

          {/* Workflow Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            {[
              { key: 'all', label: 'All Applications', count: tabCounts.all },
              { key: 'pending', label: 'Pending', count: tabCounts.pending },
              { key: 'approved', label: 'Approved', count: tabCounts.approved },
              { key: 'rejected', label: 'Rejected', count: tabCounts.rejected },
            ].map((tab) => {
              const active = selectedTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer shadow-2xs ${
                    active
                      ? 'bg-blue-600 text-white shadow-blue-200'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Applications Table */}
          <div style={{ backgroundColor: DESIGN.colors.card, borderRadius: DESIGN.radius.card }} className="p-6 shadow-sm border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottomColor: DESIGN.colors.border }} className="border-b text-slate-400">
                    <th style={{ fontSize: '12px', fontWeight: 700 }} className="text-left py-3 px-4 uppercase tracking-wider">Reference No.</th>
                    <th style={{ fontSize: '12px', fontWeight: 700 }} className="text-left py-3 px-4 uppercase tracking-wider">Applicant Name</th>
                    <th style={{ fontSize: '12px', fontWeight: 700 }} className="text-left py-3 px-4 uppercase tracking-wider">Assistance Type</th>
                    <th style={{ fontSize: '12px', fontWeight: 700 }} className="text-left py-3 px-4 uppercase tracking-wider">Date Filed</th>
                    <th style={{ fontSize: '12px', fontWeight: 700 }} className="text-left py-3 px-4 uppercase tracking-wider">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.map((app) => {
                    const effStatus = getEffectiveAppStatus(app)
                    const badge = getStatusBadgeInfo(effStatus)
                    return (
                      <tr
                        key={app.id}
                        onClick={() => openReview(app)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 text-xs font-mono text-slate-600 font-semibold">
                          <MaskedText
                            value={app.qc_id || app.reference_no}
                            type="id"
                            auditSubject={fullName(app)}
                            auditField="QCID / Reference No"
                            auditModule="AICS"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{fullName(app)}</div>
                          <div className="text-[11px] text-slate-400 font-medium">QC ID: {app.qc_id || '—'}</div>
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                            {app.assistance_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 font-medium">{formatDate(app.created_at)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${badge.color}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}

                  {filteredApplications.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                        <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        No applications found under the selected status filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // VIEW 2: ADMIN REVIEW & DECISION PORTAL
  // ==========================================
  if (currentView === 'admin-review' && reviewingApp) {
    const details = reviewingApp.details || {}
    const effStatus = getEffectiveAppStatus(reviewingApp)
    const badge = getStatusBadgeInfo(effStatus)
    const currentStatus = String(effStatus || '').toLowerCase()

    return (
      <div style={{ backgroundColor: DESIGN.colors.canvas, minHeight: '100vh' }} className="py-8">
        <style>{`
          body { font-family: ${DESIGN.fonts.body}; }
          h1, h2, h3, h4, h5, h6 { font-family: ${DESIGN.fonts.heading}; font-weight: 600; }
        `}</style>

        <div className="max-w-5xl mx-auto px-4">
          <div style={{ backgroundColor: DESIGN.colors.card, borderRadius: DESIGN.radius.card, overflow: 'hidden' }} className="shadow-md border border-slate-100">
            
            {/* Header with Case Status Banner */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-widest font-bold text-blue-400">Social Case Review</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-xs font-mono text-slate-300">{reviewingApp.reference_no}</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">{fullName(reviewingApp)}</h1>
                <p className="text-xs text-slate-400 mt-1">{reviewingApp.assistance_type} &bull; Applied on {formatDate(reviewingApp.created_at)}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border bg-white/10 text-white border-white/20 backdrop-blur-xs`}>
                  <span className={`w-2 h-2 rounded-full ${currentStatus === 'approved' || currentStatus === 'completed' ? 'bg-emerald-400' : currentStatus === 'rejected' ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'}`}></span>
                  Current: {badge.label}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('dashboard')
                    setReviewingApp(null)
                    setReviewingDocs([])
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8">

              {/* Applicant & Case Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Applicant Bio */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">1. Personal & Resident Info</h3>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
                      {getSavedProfilePhoto(reviewingApp.qc_id) ? (
                        <img src={getSavedProfilePhoto(reviewingApp.qc_id)!} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-slate-600 text-sm">
                          {reviewingApp.first_name?.charAt(0)}{reviewingApp.last_name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">QC ID NUMBER</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">{reviewingApp.qc_id || '—'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 font-medium">Age & Gender:</span>
                      <p className="font-semibold text-slate-800">{reviewingApp.age || '—'} yrs &bull; {reviewingApp.gender || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Civil Status:</span>
                      <p className="font-semibold text-slate-800">{reviewingApp.civil_status || '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-medium">Address:</span>
                      <p className="font-semibold text-slate-800">{reviewingApp.address || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Phone:</span>
                      <p className="font-semibold text-slate-800">{reviewingApp.phone || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Email:</span>
                      <p className="font-semibold text-slate-800">{reviewingApp.email || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Assistance / Medical Specifics */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">2. Assistance & Case Details</h3>
                  
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Assistance Type:</span>
                      <p className="font-bold text-slate-900 text-sm">{reviewingApp.assistance_type}</p>
                      {details.medicalAssistanceSubType ? (
                        <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md font-semibold text-[11px] mt-1">
                          {details.medicalAssistanceSubType}
                        </span>
                      ) : details.assistanceSubType ? (
                        <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md font-semibold text-[11px] mt-1">
                          {details.assistanceSubType}
                        </span>
                      ) : null}
                    </div>

                    {/* Show Partner Hospital and Medical Diagnosis ONLY for Medical Bill Assistance */}
                    {details.partnerHospital && details.partnerHospital !== '—' && (
                      <div>
                        <span className="text-slate-400 font-medium">Partner Hospital / Facility:</span>
                        <p className="font-semibold text-slate-800">
                          {details.partnerHospital === 'Other' 
                            ? `Other: ${details.partnerHospitalOther || 'Unspecified'}` 
                            : details.partnerHospital}
                        </p>
                      </div>
                    )}

                    {details.medicalDiagnosis && details.medicalDiagnosis !== '—' && (
                      <div>
                        <span className="text-slate-400 font-medium">Medical Condition / Diagnosis:</span>
                        <p className="font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 mt-0.5">
                          {details.medicalDiagnosis}
                        </p>
                      </div>
                    )}


                    {/* Secondary Parties if available */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      {details.informantFirstName && (
                        <button
                          type="button"
                          onClick={() => setShowInformantInfo(true)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold text-[11px] cursor-pointer"
                        >
                          👤 View Informant Info
                        </button>
                      )}
                      {details.deceasedFirstName && (
                        <button
                          type="button"
                          onClick={() => setShowDeceasedInfo(true)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold text-[11px] cursor-pointer"
                        >
                          ⚰️ View Deceased Info
                        </button>
                      )}
                      {details.beneficiaryFirstName && (
                        <button
                          type="button"
                          onClick={() => setShowBeneficiaryInfo(true)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold text-[11px] cursor-pointer"
                        >
                          🎓 View Student / Beneficiary Info
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents Gallery */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">3. Uploaded Documentary Requirements</h3>
                    <p className="text-xs text-slate-500">Click any document to preview or zoom in high resolution</p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {reviewingDocs.length} Document(s) Attached
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {reviewingDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setViewingDoc(doc)}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-700">
                          {doc.document_label}
                        </span>
                      </div>
                      
                      <div className="w-full h-24 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400">
                        {doc.file_type?.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(doc.original_filename || '') ? (
                          <img
                            src={`${API_BASE}/documents/${doc.id}/file`}
                            alt={doc.document_label}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                            onError={(e) => {
                              const lbl = (doc.document_label || '').toLowerCase();
                              let fb = '/samples/sample_valid_id.png';
                              if (lbl.includes('indigen')) fb = '/samples/BARANGAY CERTIFICATE OF INDIGENCY.jpg';
                              else if (lbl.includes('barangay')) fb = '/samples/BARANGAY CERTIFICATE.webp';
                              else if (lbl.includes('medical')) fb = '/samples/MEDICAL CERTIFICATE.jpg';
                              else if (lbl.includes('death')) fb = '/samples/sample_death_certificate.png';
                              else if (lbl.includes('burial')) fb = '/samples/sample_burial_contract.png';
                              else if (lbl.includes('birth') || lbl.includes('psa')) fb = '/samples/BIRTH CERTIFICATE OF MINOR.jpg';
                              else if (lbl.includes('reseta')) fb = '/samples/RESETA NG GAMOT.jpg';
                              (e.currentTarget as HTMLImageElement).src = fb;
                            }}
                          />
                        ) : (
                          <span className="text-xs font-semibold">📄 PDF/DOC</span>
                        )}
                      </div>
                      
                      <span className="text-[10px] text-slate-400 mt-2 truncate">{doc.original_filename}</span>
                    </div>
                  ))}

                  {reviewingDocs.length === 0 && (
                    <div className="col-span-4 py-8 text-center text-slate-400 text-xs">
                      No documentary attachments found.
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left Side: Approve and Reject Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    disabled={actionLoading || currentStatus === 'approved'}
                    onClick={() => updateStatus('approved')}
                    className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                      currentStatus === 'approved'
                        ? 'bg-emerald-700 opacity-90 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{currentStatus === 'approved' ? '✓ Case Approved' : 'Approve Application'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading || currentStatus === 'rejected'}
                    onClick={() => setShowRejectModal(true)}
                    className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                      currentStatus === 'rejected'
                        ? 'bg-rose-700 opacity-90 cursor-default'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{currentStatus === 'rejected' ? '✕ Disqualified / Rejected' : 'Reject Application'}</span>
                  </button>

                  {currentStatus === 'approved' && (
                    <button
                      type="button"
                      onClick={() => setGlApp(reviewingApp)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>
                        {String(reviewingApp.assistance_type || '').toLowerCase().includes('medicine') || String(reviewingApp.assistance_type || '').toLowerCase().includes('gamot')
                          ? 'View / Print Mercury Drug Gift Certificate'
                          : 'View / Print Guarantee Letter (GL)'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Right Side: Close Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('dashboard')
                      setReviewingApp(null)
                      setReviewingDocs([])
                    }}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* POPUP MODAL 1: SET APPOINTMENT SCHEDULE    */}
        {/* ========================================== */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">Set Interview Schedule</h3>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Time Slot *</label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg font-medium text-slate-800"
                  >
                    <option value="08:30 AM - 10:00 AM">08:30 AM - 10:00 AM (Morning Batch 1)</option>
                    <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM (Morning Batch 2)</option>
                    <option value="01:00 PM - 02:30 PM">01:00 PM - 02:30 PM (Afternoon Batch 1)</option>
                    <option value="02:30 PM - 04:00 PM">02:30 PM - 04:00 PM (Afternoon Batch 2)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assessment Venue / District Office *</label>
                  <select
                    value={scheduleVenue}
                    onChange={(e) => setScheduleVenue(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg font-medium text-slate-800"
                  >
                    <option value="Quezon City Hall Complex - SSDD Assessment Area">Quezon City Hall Complex - SSDD Assessment Area</option>
                    <option value="District 1 Action Center - San Antonio">District 1 Action Center - San Antonio</option>
                    <option value="District 2 Action Center - Batasan Hills">District 2 Action Center - Batasan Hills</option>
                    <option value="District 3 Action Center - Marilag">District 3 Action Center - Marilag</option>
                    <option value="District 4 Action Center - Kamuning">District 4 Action Center - Kamuning</option>
                    <option value="District 5 Action Center - Novaliches">District 5 Action Center - Novaliches</option>
                    <option value="District 6 Action Center - Talipapa">District 6 Action Center - Talipapa</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false)
                    updateStatus('scheduled', {
                      appointmentDate: `${scheduleDate} (${scheduleTime})`,
                      appointmentVenue: scheduleVenue,
                    })
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Confirm & Lock Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* POPUP MODAL 2: INTER-AGENCY REFERRAL       */}
        {/* ========================================== */}
        {showReferralModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-slate-900 text-base">Inter-Agency Referral Endorsement</h3>
                </div>
                <button onClick={() => setShowReferralModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Piliin ang ahensya kung saan ie-endorso ang pasyente. Awtomatikong bubuo ang system ng opisyal na <strong>QC SSDD Referral Letter</strong>.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Welfare / Health Agency *</label>
                  <select
                    value={referralAgency}
                    onChange={(e) => setReferralAgency(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg font-medium text-slate-800"
                  >
                    <option value="PCSO">Philippine Charity Sweepstakes Office (PCSO - Medical Assistance)</option>
                    <option value="DSWD">Department of Social Welfare & Development (DSWD Central / CIU)</option>
                    <option value="DOH">Department of Health - Malasakit Program Office (DOH)</option>
                    <option value="Charity Hospital">Accredited Charity & Tertiary Specialty Hospital</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Social Worker Assessment / Justification *</label>
                  <textarea
                    rows={3}
                    value={referralNotes}
                    onChange={(e) => setReferralNotes(e.target.value)}
                    placeholder="e.g. Total medical requirement exceeds local assistance ceiling. Endorsed for PCSO/DSWD financial augmentation."
                    className="w-full p-3 border border-slate-300 rounded-lg font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowReferralModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReferralModal(false)
                    updateStatus('referred', {
                      referralAgency,
                      referralNotes: referralNotes || 'Endorsed for financial augmentation under partner agency mandate.',
                    })
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  ✓ Endorse & Generate Referral Letter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* POPUP MODAL 3: REJECT WITH REASON          */}
        {/* ========================================== */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-slate-900 text-base">Reject / Disqualify Application</h3>
                </div>
                <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dahilan ng Pag-reject *</label>
                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg font-medium text-slate-800"
                  >
                    <option value="Non-resident of Quezon City / Unverified Residency Documents">Non-resident of Quezon City / Unverified Residency</option>
                    <option value="Incomplete or Falsified Documentary Requirements">Incomplete or Falsified Documentary Requirements</option>
                    <option value="Duplicate active assistance claim within cooldown period">Duplicate active claim within cooldown period</option>
                    <option value="Failure to attend scheduled assessment without notice">Failure to attend scheduled assessment</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false)
                    updateStatus('rejected', { rejectionReason: rejectReason })
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Viewer Modal */}
        {viewingDoc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
            onClick={() => setViewingDoc(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-sm font-bold text-slate-900">{viewingDoc.document_label}</h3>
                <button onClick={() => setViewingDoc(null)} className="text-slate-400 hover:text-slate-800 text-lg font-bold">✕</button>
              </div>

              <div className="p-6 overflow-auto flex items-center justify-center bg-slate-100/50 min-h-[300px]">
                {viewingDoc.file_type?.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(viewingDoc.original_filename || '') ? (
                  <img
                    src={`${API_BASE}/documents/${viewingDoc.id}/file`}
                    alt={viewingDoc.document_label}
                    className="max-h-[65vh] max-w-full rounded-lg shadow-sm object-contain"
                    onError={(e) => {
                      const lbl = (viewingDoc.document_label || '').toLowerCase();
                      let fb = '/samples/sample_valid_id.png';
                      if (lbl.includes('indigen')) fb = '/samples/BARANGAY CERTIFICATE OF INDIGENCY.jpg';
                      else if (lbl.includes('barangay')) fb = '/samples/BARANGAY CERTIFICATE.webp';
                      else if (lbl.includes('medical')) fb = '/samples/MEDICAL CERTIFICATE.jpg';
                      else if (lbl.includes('death')) fb = '/samples/sample_death_certificate.png';
                      else if (lbl.includes('burial')) fb = '/samples/sample_burial_contract.png';
                      else if (lbl.includes('birth') || lbl.includes('psa')) fb = '/samples/BIRTH CERTIFICATE OF MINOR.jpg';
                      else if (lbl.includes('reseta')) fb = '/samples/RESETA NG GAMOT.jpg';
                      (e.currentTarget as HTMLImageElement).src = fb;
                    }}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-slate-500">File: {viewingDoc.original_filename}</p>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                <a
                  href={`${API_BASE}/documents/${viewingDoc.id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg"
                >
                  Open Full File
                </a>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Informant Info Modal */}
        {showInformantInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={() => setShowInformantInfo(false)}>
            <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-800" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white">Informant information</h3>
                  <p className="text-xs text-slate-400">Representative & Applicant details filed</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInformantInfo(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Relationship to Patient */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Relasyon sa Pasyente *</label>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-400">
                  {details.informantRelation || 'Sarili'}
                </div>
              </div>

              {/* Names Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">First name *</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white truncate">
                    {details.informantFirstName || reviewingApp.first_name || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Middle name</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white truncate">
                    {details.informantMiddleName || reviewingApp.middle_name || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Last name *</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white truncate">
                    {details.informantLastName || reviewingApp.last_name || '—'}
                  </div>
                </div>
              </div>

              {/* Demographics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Suffix</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-300">
                    {details.informantSuffix || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Gender *</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.informantGender || reviewingApp.gender || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Date of birth *</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.informantBirthDate || '—'}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Age *</label>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white w-24">
                  {details.informantAge || reviewingApp.age || '—'}
                </div>
              </div>

              {/* Address Fields */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-blue-400 flex items-center gap-2">
                  <span>✓</span>
                  <span>Address Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">House/Building number *</label>
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                      {details.informantHouseNumber || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Street name *</label>
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                      {details.informantStreetName || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Barangay *</label>
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                      {details.informantBarangay || reviewingApp.barangay || '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInformantInfo(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deceased Info Modal */}
        {showDeceasedInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={() => setShowDeceasedInfo(false)}>
            <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-800" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white">Deceased Person Information</h3>
                  <p className="text-xs text-slate-400">Funeral & burial assistance records</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeceasedInfo(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">First name *</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.deceasedFirstName || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Middle name</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.deceasedMiddleName || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Last name *</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.deceasedLastName || '—'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Age at Death</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.deceasedAge ? `${details.deceasedAge} yrs` : '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Date of Death</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.deceasedDeathDate || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Place of Death</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.placeOfDeath || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Cremation or Burial</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.cremationOrBurial || '—'}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeceasedInfo(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Beneficiary / Student Info Modal */}
        {showBeneficiaryInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={() => setShowBeneficiaryInfo(false)}>
            <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-800" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white">Beneficiary / Student Information</h3>
                  <p className="text-xs text-slate-400">Educational / student assistance profile</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBeneficiaryInfo(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">First name *</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.beneficiaryFirstName || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Middle name</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.beneficiaryMiddleName || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Last name *</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.beneficiaryLastName || '—'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">School Name</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.schoolName || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Disability Type / Note</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.disabilityType || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Relationship to Applicant</label>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white">
                    {details.beneficiaryRelation || '—'}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowBeneficiaryInfo(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Guarantee Letter / Medicine Gift Certificate Modal */}
        {glApp && (
          <OfficialGuaranteeLetterModal
            data={{
              controlNo: `QC-SSDD-GL-2026-${String(glApp.id || glApp.reference_no || '048912').replace(/\D/g, '').slice(-6).padStart(6, '0')}`,
              applicationRef: glApp.reference_no || glApp.qc_id,
              patientName: fullName(glApp),
              qcidNumber: glApp.qc_id || glApp.reference_no,
              barangay: glApp.barangay,
              district: glApp.district,
              assistanceType: glApp.assistance_type || glApp.concern || 'Medical Assistance',
              diagnosis: (typeof glApp.details === 'object' ? glApp.details?.medicalDiagnosis : null) || (String(glApp.assistance_type || '').toLowerCase().includes('medicine') || String(glApp.assistance_type || '').toLowerCase().includes('gamot') ? "Doctor's Prescription / Essential Medicines" : 'Medical Confinement / Specialty Care'),
              hospitalName: (typeof glApp.details === 'object' ? (glApp.details?.partnerHospital === 'Other' ? glApp.details?.partnerHospitalOther : glApp.details?.partnerHospital) : null) || (String(glApp.assistance_type || '').toLowerCase().includes('medicine') || String(glApp.assistance_type || '').toLowerCase().includes('gamot') ? 'MERCURY DRUG (QUEZON CITY BRANCHES)' : 'EAST AVENUE MEDICAL CENTER (EAMC)'),
              amount: String(glApp.assistance_type || '').toLowerCase().includes('medicine') || String(glApp.assistance_type || '').toLowerCase().includes('gamot') ? 500 : (FIXED_ASSISTANCE_AMOUNTS['Medical Assistance'] || 25000),
            }}
            onClose={() => setGlApp(null)}
            canPrint={true}
          />
        )}

        {/* Official Referral Letter Modal */}
        {refLetterApp && (
          <OfficialReferralLetterModal
            data={refLetterApp}
            onClose={() => setRefLetterApp(null)}
            canPrint={true}
          />
        )}

      </div>
    )
  }

  return null
}
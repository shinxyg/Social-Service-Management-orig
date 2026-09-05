import React, { useState, useEffect } from "react"
import {
  Check,
  X,
  FileText,
  Image as ImageIcon,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Paperclip,
  Users,
  HeartHandshake,
  Baby,
  Home,
  ClipboardList,
  Landmark,
} from "lucide-react"
import { API_BASE as APP_API_BASE } from "../../config/api"
import { getSavedProfilePhoto } from "../../utils/profilePhoto"

interface ApplicationDocument {
  name: string
  filename: string
  fileUrl: string
  fileSize: number
  uploadedAt: string
  status: "verified" | "pending" | "rejected"
}

interface FamilyMember {
  id: string
  name: string
  relationship: string
  age: string
  birthday: string
  status: string
  educationalAttainment: string
  occupationMonthlyIncome: string
}

interface SoloParentSubmission {
  id: string
  submittedAt: string
  referenceNumber: string
  category: "Solo Parent"
  applicationType: "new" | "renewal" | "loss"
  classification: string

  firstName: string
  middleName: string
  lastName: string
  suffix: string
  age: string
  sex: string
  dobMonth: string
  dobDay: string
  dobYear: string
  civilStatus?: string
  qcidNumber?: string
  email?: string
  placeOfBirth: string
  educationalAttainment: string
  occupation: string
  companyAgency: string
  monthlyIncome: string
  totalFamilyIncome: string
  contactNo: string

  addressHouseNo: string
  addressStreet: string
  addressBarangay: string
  addressCityMunicipality: string

  familyMembers: FamilyMember[]

  emergencyName: string
  emergencyAddress: string
  emergencyContactNo: string

  circumstanceDetails: string
  needsProblems: string
  familyResources: string

  documents: ApplicationDocument[]

  status: "pending" | "approved" | "rejected" | "needs_revision"
  soloParentIdNumber?: string
  assignedIdNumber?: string
  rejectionReason?: string
  approvedBy?: string
  approvedDate?: string
  notes?: string
}

interface ChildWelfareSubmission {
  id: string
  submittedAt: string
  referenceNumber: string
  category: "Child Welfare"
  supportCategory: string

  guardianFirstName: string
  guardianMiddleName: string
  guardianLastName: string
  guardianSex: string
  guardianDateOfBirth: string
  guardianAge: string
  guardianCivilStatus: string
  guardianRelationshipToChild: string
  guardianContactNo: string
  guardianEmail: string
  guardianValidId: string

  addressHouseNo: string
  addressStreet: string
  addressBarangay: string
  addressCityMunicipality: string

  childName: string
  childSex: string
  childBirthday: string
  childAge: string
  childSchoolDaycare: string
  childBirthCertificate: string
  childGradeLevel: string
  childSchoolAddress: string
  childEnrollmentStatus: string
  childSpecialNeeds: string
  childSpecialNeedsSpecify: string

  householdMembers: string
  childrenStudying: string
  monthlyHouseholdIncome: string
  mainSourceIncome: string
  employmentStatus: string
  otherFinancialSupport: string

  supportTypes: string[]
  supportOther: string

  primaryReasonForAssistance: string
  specificNeeds: string
  estimatedAmountNeeded: string
  urgency: string

  childLivingArrangement: string
  otherChildrenNeedingAssistance: string
  otherChildrenCount: string
  otherGovtAssistanceReceived: string
  otherGovtProgram: string
  additionalInfo: string

  documents: ApplicationDocument[]

  status: "pending" | "approved" | "rejected" | "needs_revision"
  approvedAmount?: string
  rejectionReason?: string
  approvedBy?: string
  approvedDate?: string
  notes?: string
}

type WelfareSubmission = SoloParentSubmission | ChildWelfareSubmission

function isSoloParent(app: WelfareSubmission): app is SoloParentSubmission {
  return app.category === "Solo Parent"
}

// =====================================================================================
// Backend wiring — fetch mula sa PostgreSQL via Express API
// =====================================================================================

const API_BASE = `${APP_API_BASE}/api`

function getAuthToken() {
  // Iakma kung saan mo talaga sini-save ang admin token (localStorage, cookie, atbp.)
  return localStorage.getItem("token") || ""
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAuthToken()}`,
  }
}

function mapUploadedDocuments(raw: any): ApplicationDocument[] {
  const uploaded = raw?.uploaded_documents || []
  const docs: ApplicationDocument[] = []
  for (const group of uploaded) {
    for (const f of group.files || []) {
      docs.push({
        name: group.documentLabel || group.documentId,
        filename: f.filename,
        fileUrl: `${APP_API_BASE}${f.fileUrl}`,
        fileSize: f.fileSize,
        uploadedAt: f.uploadedAt,
        status: "verified", // wala pang per-document verification sa backend ngayon
      })
    }
  }
  return docs
}

function mapSoloParentRow(row: any): SoloParentSubmission {
  return {
    id: `SP-${row.id}`,
    submittedAt: row.created_at,
    referenceNumber: row.reference_number,
    category: "Solo Parent",
    applicationType: row.application_type,
    classification: row.classification_title || "",
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    suffix: row.suffix,
    age: row.age,
    sex: row.sex,
    dobMonth: row.dob_month,
    dobDay: row.dob_day,
    dobYear: row.dob_year,
    placeOfBirth: row.place_of_birth,
    educationalAttainment: row.educational_attainment,
    occupation: row.occupation,
    companyAgency: row.company_agency,
    monthlyIncome: row.monthly_income,
    totalFamilyIncome: row.total_family_income,
    contactNo: row.contact_no,
    addressHouseNo: row.address_house_no,
    addressStreet: row.address_street,
    addressBarangay: row.address_barangay,
    addressCityMunicipality: row.address_city_municipality,
    civilStatus: row.civil_status || "",
    qcidNumber: row.qcid_number || "",
    email: row.email || "",
    familyMembers: row.family_members || [],
    emergencyName: row.emergency_name,
    emergencyAddress: row.emergency_address,
    emergencyContactNo: row.emergency_contact_no,
    circumstanceDetails: row.circumstance_details,
    needsProblems: row.needs_problems,
    familyResources: row.family_resources,
    documents: mapUploadedDocuments(row),
    status: row.application_status,
    soloParentIdNumber: row.solo_parent_id_number || undefined,
    assignedIdNumber: row.assigned_id_number || undefined,
    rejectionReason: row.rejection_reason || undefined,
    approvedBy: row.approved_by ? String(row.approved_by) : undefined,
    approvedDate: row.updated_at,
    notes: row.admin_notes || undefined,
  }
}

function mapChildWelfareRow(row: any): ChildWelfareSubmission {
  return {
    id: `CW-${row.id}`,
    submittedAt: row.created_at,
    referenceNumber: row.reference_number,
    category: "Child Welfare",
    supportCategory: row.category_title || "",
    guardianFirstName: row.guardian_first_name,
    guardianMiddleName: row.guardian_middle_name,
    guardianLastName: row.guardian_last_name,
    guardianSex: row.guardian_sex,
    guardianDateOfBirth: row.guardian_date_of_birth,
    guardianAge: row.guardian_age,
    guardianCivilStatus: row.guardian_civil_status,
    guardianRelationshipToChild: row.guardian_relationship_to_child,
    guardianContactNo: row.guardian_contact_no,
    guardianEmail: row.guardian_email,
    guardianValidId: row.guardian_valid_id,
    addressHouseNo: row.address_house_no,
    addressStreet: row.address_street,
    addressBarangay: row.address_barangay,
    addressCityMunicipality: row.address_city_municipality,
    childName: row.child_name,
    childSex: row.child_sex,
    childBirthday: row.child_birthday,
    childAge: row.child_age,
    childSchoolDaycare: row.child_school_daycare,
    childBirthCertificate: row.child_birth_certificate,
    childGradeLevel: row.child_grade_level,
    childSchoolAddress: row.child_school_address,
    childEnrollmentStatus: row.child_enrollment_status,
    childSpecialNeeds: row.child_special_needs,
    childSpecialNeedsSpecify: row.child_special_needs_specify,
    householdMembers: row.household_members,
    childrenStudying: row.children_studying,
    monthlyHouseholdIncome: row.monthly_household_income,
    mainSourceIncome: row.main_source_income,
    employmentStatus: row.employment_status,
    otherFinancialSupport: row.other_financial_support,
    supportTypes: row.support_types || [],
    supportOther: row.support_other,
    primaryReasonForAssistance: row.primary_reason_for_assistance,
    specificNeeds: row.specific_needs,
    estimatedAmountNeeded: row.estimated_amount_needed,
    urgency: row.urgency,
    childLivingArrangement: row.child_living_arrangement,
    otherChildrenNeedingAssistance: row.other_children_needing_assistance,
    otherChildrenCount: row.other_children_count,
    otherGovtAssistanceReceived: row.other_govt_assistance_received,
    otherGovtProgram: row.other_govt_program,
    additionalInfo: row.additional_info,
    documents: mapUploadedDocuments(row),
    status: row.application_status,
    approvedAmount: row.approved_amount || undefined,
    rejectionReason: row.rejection_reason || undefined,
    approvedBy: row.approved_by ? String(row.approved_by) : undefined,
    approvedDate: row.updated_at,
    notes: row.admin_notes || undefined,
  }
}

async function fetchAllSubmissions(): Promise<WelfareSubmission[]> {
  const [soloRes, childRes] = await Promise.all([
    fetch(`${API_BASE}/solo-parent/admin/all?limit=100`, { headers: authHeaders() }),
    fetch(`${API_BASE}/child-welfare/admin/all?limit=100`, { headers: authHeaders() }),
  ])

  const soloData = soloRes.ok ? await soloRes.json() : { applications: [] }
  const childData = childRes.ok ? await childRes.json() : { applications: [] }

  const soloApps = (soloData.applications || []).map(mapSoloParentRow)
  const childApps = (childData.applications || []).map(mapChildWelfareRow)

  return [...soloApps, ...childApps].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )
}

async function approveSubmission(app: WelfareSubmission, value: string) {
  const isSolo = isSoloParent(app)
  const rawId = app.id.replace(/^(SP|CW)-/, "")
  const url = isSolo
    ? `${API_BASE}/solo-parent/${rawId}/admin/update-status`
    : `${API_BASE}/child-welfare/${rawId}/admin/update-status`

  const body = isSolo
    ? { status: "approved", assignedIdNumber: value }
    : { status: "approved", approvedAmount: value }

  const res = await fetch(url, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) })
  if (!res.ok) throw new Error("Failed to approve application")
}

async function rejectSubmission(app: WelfareSubmission, reason: string) {
  const isSolo = isSoloParent(app)
  const rawId = app.id.replace(/^(SP|CW)-/, "")
  const url = isSolo
    ? `${API_BASE}/solo-parent/${rawId}/admin/update-status`
    : `${API_BASE}/child-welfare/${rawId}/admin/update-status`

  const res = await fetch(url, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status: "rejected", rejectionReason: reason }),
  })
  if (!res.ok) throw new Error("Failed to reject application")
}

const Tokens = React.memo(function Tokens() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

      /* Palette, radius and shadow tokens lifted from the GOVCHECK / UPZH WEB
         frontend design review: cool light-gray canvas, white cards, deep-navy
         text, blue primary actions, semantic success/warning/info/destructive,
         rounded-xl/2xl surfaces and soft elevation. Structure (pennant tag /
         stamp dot / numbered sections) is unchanged — only color + surface. */
      .gw-root{
        --ink:#0f172a; --ink-soft:#6b7280; --ink-faint:#94a3b8;
        --paper:#f9fafb; --surface:#ffffff; --surface-sunk:#f1f3f5;
        --line:#e5e7eb; --line-soft:#eef0f2;
        --plum:#2563eb; --plum-ink:#1d4ed8; --plum-soft:#eaf1ff; --plum-line:#c7dbff;
        --brick:#0ea5e9; --brick-ink:#0284c7; --brick-soft:#e6f6fd; --brick-line:#bae6fd;
        --gold:#f59e0b; --gold-ink:#b45309; --gold-soft:#fef6e7; --gold-line:#fde7be;
        --forest:#22c55e; --forest-ink:#15803d; --forest-soft:#e9fbef; --forest-line:#bbf7d0;
        --redwood:#ef4444; --redwood-ink:#b91c1c; --redwood-soft:#fdeded; --redwood-line:#fcc9c9;
        --shadow-soft:0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.06);
        --shadow-medium:0 4px 6px rgba(15,23,42,.05), 0 10px 15px rgba(15,23,42,.08);
        font-family:'Inter',sans-serif; color:var(--ink); background:var(--paper);
      }
      .gw-serif{ font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; letter-spacing:-0.01em; }
      .gw-mono{ font-family:'Inter',sans-serif; font-weight:600; letter-spacing:.04em; text-transform:uppercase; }

      .gw-eyebrow{ font-family:'Inter',sans-serif; font-size:.68rem; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-faint); }

      /* pennant tag — encodes case TYPE */
      .gw-tag{ display:inline-flex; align-items:center; gap:.4rem; padding:.34rem .85rem .34rem .65rem; font-size:.68rem; font-weight:600; letter-spacing:.03em; text-transform:uppercase; color:#fff; white-space:nowrap; clip-path:polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%); }
      .gw-tag--solo{ background:var(--plum); }
      .gw-tag--child{ background:var(--brick); }
      .gw-tag--ghost{ background:var(--surface-sunk); color:var(--ink-soft); border:1px solid var(--line); clip-path:none; padding:.34rem .7rem; border-radius:8px; }
      .gw-tag--btn{ cursor:pointer; border:none; opacity:.5; transition:opacity .15s, transform .1s; }
      .gw-tag--btn:hover{ opacity:.8; }
      .gw-tag--btn.is-active{ opacity:1; }

      /* stamp dot — encodes case DECISION */
      .gw-dot{ width:18px; height:18px; border-radius:50%; flex-shrink:0; display:inline-block; }
      .gw-dot--pending{ background:var(--gold-soft); border:2px dashed var(--gold); }
      .gw-dot--approved{ background:var(--forest); }
      .gw-dot--rejected{ background:var(--redwood); }
      .gw-dot--revision{ background:var(--surface); border:2px dashed var(--ink-faint); }

      .gw-status{ display:inline-flex; align-items:center; gap:.5rem; font-size:.76rem; font-weight:600; }
      .gw-status--pending{ color:var(--gold-ink); }
      .gw-status--approved{ color:var(--forest-ink); }
      .gw-status--rejected{ color:var(--redwood-ink); }
      .gw-status--revision{ color:var(--ink-soft); }

      .gw-card{ background:var(--surface); border:1px solid var(--line); border-radius:16px; box-shadow:var(--shadow-soft); transition:box-shadow .15s ease, transform .15s ease; }
      .gw-card:hover{ box-shadow:var(--shadow-medium); transform:translateY(-1px); }
      .gw-card--solo{ border-left:4px solid var(--plum); }
      .gw-card--child{ border-left:4px solid var(--brick); }

      .gw-avatar{ display:flex; align-items:center; justify-content:center; border-radius:12px; color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; }
      .gw-avatar--solo{ background:linear-gradient(135deg, var(--plum), var(--plum-ink)); }
      .gw-avatar--child{ background:linear-gradient(135deg, var(--brick), var(--brick-ink)); }

      .gw-btn-primary{ background:var(--plum); color:#fff; border:1px solid var(--plum); border-radius:12px; font-weight:600; box-shadow:var(--shadow-soft); transition:background .15s, transform .15s; }
      .gw-btn-primary:hover{ background:var(--plum-ink); transform:translateY(-1px); }
      .gw-btn-ghost{ background:var(--surface); color:var(--ink); border:1px solid var(--line); border-radius:12px; font-weight:600; transition:background .15s, transform .15s; }
      .gw-btn-ghost:hover{ background:var(--surface-sunk); transform:translateY(-1px); }
      .gw-btn-approve{ background:var(--forest); color:#fff; border:1px solid var(--forest); border-radius:12px; font-weight:600; box-shadow:var(--shadow-soft); transition:background .15s, transform .15s; }
      .gw-btn-approve:hover{ background:var(--forest-ink); transform:translateY(-1px); }
      .gw-btn-reject{ background:var(--redwood); color:#fff; border:1px solid var(--redwood); border-radius:12px; font-weight:600; box-shadow:var(--shadow-soft); transition:background .15s, transform .15s; }
      .gw-btn-reject:hover{ background:var(--redwood-ink); transform:translateY(-1px); }

      .gw-input{ background:var(--surface-sunk); border:1px solid var(--line); border-radius:10px; color:var(--ink); }
      .gw-input:focus{ outline:none; border-color:var(--plum); box-shadow:0 0 0 3px var(--plum-soft); }
      .gw-input::placeholder{ color:var(--ink-faint); }

      .gw-section-num{ font-family:'Inter',sans-serif; font-weight:700; font-size:.68rem; color:var(--plum-ink); background:var(--plum-soft); padding:.2rem .5rem; border-radius:6px; }
      .gw-section-rule{ height:1px; background:var(--line); flex:1; }

      .gw-stat{ background:var(--surface); border:1px solid var(--line); border-top:3px solid var(--stat-color, var(--ink)); border-radius:16px; box-shadow:var(--shadow-soft); }
    `}</style>
  )
  })

function displayName(app: WelfareSubmission) {
  if (isSoloParent(app)) {
    return [app.firstName, app.middleName, app.lastName, app.suffix]
      .filter(Boolean)
      .filter((s) => s !== "null" && s !== "undefined")
      .join(" ")
  }
  return [app.guardianFirstName, app.guardianMiddleName, app.guardianLastName]
    .filter(Boolean)
    .filter((s) => s !== "null" && s !== "undefined")
    .join(" ")
}

function initials(app: WelfareSubmission) {
  const first = (isSoloParent(app) ? app.firstName : app.guardianFirstName) || ""
  const last = (isSoloParent(app) ? app.lastName : app.guardianLastName) || ""
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "SP"
}
function getAvatarUrl(app: WelfareSubmission): string | null {
  const idPhoto = app.documents.find((doc) =>
    /id picture|2x2/i.test(doc.name)
  )
  return idPhoto ? idPhoto.fileUrl : null
}
function AvatarCircle({ app, sizeClass }: { app: WelfareSubmission; sizeClass: string }) {
  const [imgError, setImgError] = useState(false)
  const qcid = isSoloParent(app) ? app.qcidNumber : undefined
  const savedPhoto = getSavedProfilePhoto(qcid)
  const docPhoto = getAvatarUrl(app)
  const photoSrc = !imgError ? (savedPhoto || docPhoto) : null

  if (photoSrc) {
    return (
      <img
        src={photoSrc}
        alt={displayName(app)}
        onError={() => setImgError(true)}
        className={`${sizeClass} shrink-0 rounded-xl object-cover`}
      />
    )
  }
  return (
    <div className={`${sizeClass} shrink-0 gw-avatar ${isSoloParent(app) ? "gw-avatar--solo" : "gw-avatar--child"} text-sm`}>
      {initials(app)}
    </div>
  )
}

function getAddress(app: WelfareSubmission) {
  return `${[app.addressHouseNo, app.addressStreet].filter(Boolean).join(" ")}, Brgy. ${app.addressBarangay}, ${app.addressCityMunicipality}`
}

function isImageFile(filename: string) {
  return /\.(jpe?g|png|webp|gif)$/i.test(filename)
}

function DocumentPreviewModal({
  doc,
  onClose,
}: {
  doc: ApplicationDocument | null
  onClose: () => void
}) {
  if (!doc) return null
  const isImage = isImageFile(doc.filename)

  return (
    <div
  className="fixed inset-0 z-60 flex items-center justify-center p-4"
>
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 pb-4 border-b border-gray-200 shrink-0">
          <h3 className="text-lg font-bold" style={{ color: "var(--ink)" }}>{doc.name}</h3>
        </div>

        <div className="p-6 overflow-y-auto flex items-center justify-center">
          {isImage ? (
            <img
              src={doc.fileUrl}
              alt={doc.name}
              className="max-h-[60vh] rounded-lg border border-border object-contain"
            />
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 text-center text-muted-foreground w-full">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-semibold">{doc.filename}</p>
              <p className="text-xs mt-1">Preview not available for this file type.</p>
            </div>
          )}
        </div>

        <div className="p-6 pt-4 border-t border-gray-200 flex items-center justify-between gap-4 shrink-0">
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 h-10 flex items-center rounded-xl bg-gray-100 text-foreground text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            OPEN IN NEW TAB
          </a>
          <button
            onClick={onClose}
            className="px-6 h-10 rounded-xl bg-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}

function docIcon(fileName: string) {
  const isImage = /\.(jpe?g|png)$/i.test(fileName)
  return isImage ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />
}

const docStatusMeta = {
  verified: { dot: "gw-dot--approved", text: "gw-status--approved" },
  pending: { dot: "gw-dot--pending", text: "gw-status--pending" },
  rejected: { dot: "gw-dot--rejected", text: "gw-status--rejected" },
} as const

const statusMeta = {
  pending: { dot: "gw-dot--pending", text: "gw-status--pending", label: "Pending" },
  approved: { dot: "gw-dot--approved", text: "gw-status--approved", label: "Approved" },
  rejected: { dot: "gw-dot--rejected", text: "gw-status--rejected", label: "Rejected" },
  needs_revision: { dot: "gw-dot--revision", text: "gw-status--revision", label: "Needs Revision" },
} as const


function StatusBadge({ status }: { status: WelfareSubmission["status"] }) {
  const m = statusMeta[status] ?? statusMeta.pending
  return (
    <span className={`gw-status ${m.text}`}>
      <span className={`gw-dot ${m.dot}`} />
      {m.label}
    </span>
  )
}
function CategoryTag({ category }: { category: WelfareSubmission["category"] }) {
  return <span className={`gw-tag ${category === "Solo Parent" ? "gw-tag--solo" : "gw-tag--child"}`}>{category}</span>
}



function SectionHeading({ icon, number, children }: { icon: React.ReactNode; number: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="gw-section-num">{number}</span>
      <span style={{ color: "var(--ink-faint)" }}>{icon}</span>
      <h3 className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>{children}</h3>
      <span className="gw-section-rule" />
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>{label}</p>
      <p className="font-medium mt-1 text-sm" style={{ color: "var(--ink)" }}>{value || "—"}</p>
    </div>
  )
}

// =====================================================================================
// Application card (list row)
// =====================================================================================

interface CardProps {
  app: WelfareSubmission
  onView: (app: WelfareSubmission) => void
}

function ApplicationCard({ app, onView }: CardProps) {
  const subLabel = isSoloParent(app)
    ? app.applicationType === "new" ? "New application" : app.applicationType === "renewal" ? "Renewal" : "Lost ID replacement"
    : app.supportCategory.replace(/^\d+\.\s*/, "")

  return (
    <div
      onClick={() => onView(app)}
      className={`gw-card ${isSoloParent(app) ? "gw-card--solo" : "gw-card--child"} p-4 transition-shadow hover:shadow-sm cursor-pointer`}
    >
      <div className="flex items-start gap-4">
          <div className="hidden sm:flex">
            <AvatarCircle app={app} sizeClass="h-11 w-11 flex items-center justify-center" />
          </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="gw-serif text-base font-semibold" style={{ color: "var(--ink)" }}>{displayName(app)}</p>
            <CategoryTag category={app.category} />
            <span className="gw-tag gw-tag--ghost truncate max-w-56">{subLabel}</span>
          </div>
          <p className="gw-mono text-xs mb-1" style={{ color: "var(--ink-faint)" }}>REF {app.referenceNumber}</p>
          <p className="text-xs mb-3" style={{ color: "var(--ink-soft)" }}>
            Submitted {new Date(app.submittedAt).toLocaleDateString()} ·{" "}
            {new Date(app.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-soft)" }}>
              <Paperclip className="h-3.5 w-3.5" />
              {app.documents.length} documents
            </span>
            {isSoloParent(app)
              ? app.status === "approved" && app.assignedIdNumber && (
                  <span className="gw-mono text-xs font-semibold" style={{ color: "var(--forest-ink)" }}>ID {app.assignedIdNumber}</span>
                )
              : app.status === "approved" && app.approvedAmount && (
                  <span className="gw-mono text-xs font-semibold" style={{ color: "var(--forest-ink)" }}>₱{app.approvedAmount} approved</span>
                )}
          </div>
        </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            <StatusBadge status={app.status} />
          </div>
      </div>
    </div>
  )
}


interface DetailedViewProps {
  app: WelfareSubmission
  onClose: () => void
  onApprove: (id: string, value: string) => void
  onReject: (id: string, reason: string) => void
}

function DetailedView({ app, onClose, onApprove, onReject }: DetailedViewProps) {
  const [approveValue, setApproveValue] = useState(
    isSoloParent(app) ? app.assignedIdNumber || "" : app.approvedAmount || ""
  )
  const [rejectionReason, setRejectionReason] = useState(app.rejectionReason || "")
  const [actionMode, setActionMode] = useState<"view" | "approve" | "reject">("view")
  const [previewDoc, setPreviewDoc] = useState<ApplicationDocument | null>(null)

  const address = getAddress(app)
  const subLabel = isSoloParent(app)
    ? app.applicationType === "new"
      ? "New application"
      : app.applicationType === "renewal"
      ? "Renewal"
      : "Lost ID replacement"
    : app.supportCategory

  let sectionNum = 0
  const nextNum = () => String(++sectionNum).padStart(2, "0")

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(2px)" }}
    >
      <div
  className="w-full max-w-3xl my-8 flex flex-col max-h-[90vh] overflow-hidden rounded-2xl"
  style={{
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderLeft: "1px solid var(--line)",
    boxShadow: "var(--shadow-medium)",
  }}
>
      
        {/* Header */}
        <div className="px-6 pt-5 pb-4" style={{ background: "var(--surface-sunk)", borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <AvatarCircle app={app} sizeClass="h-12 w-12" />
              <div className="min-w-0">
                <h2 className="gw-serif text-xl font-semibold truncate" style={{ color: "var(--ink)" }}>{displayName(app)}</h2>
                <p className="gw-mono text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>REF {app.referenceNumber}</p>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <CategoryTag category={app.category} />
                  <span className="gw-tag gw-tag--ghost max-w-64 truncate">{subLabel}</span>
                  <StatusBadge status={app.status} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="h-8 w-8 flex items-center justify-center shrink-0 rounded-full text-xl font-light transition-colors"
              style={{ color: "var(--ink-soft)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto space-y-7">
          {isSoloParent(app) ? (
            <>
              {/* Section 01: Personal Information */}
              <div>
                <SectionHeading number={nextNum()} icon={<User className="h-4 w-4" />}>Personal information</SectionHeading>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm p-4 rounded-lg" style={{ background: "var(--surface-sunk)" }}>
                  <Field label="Full name" value={displayName(app)} />
                  <Field
                    label="Date of birth"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" style={{ color: "var(--ink-faint)" }} />
                        {[app.dobMonth, app.dobDay, app.dobYear].filter(Boolean).join(" ")}
                      </span>
                    }
                  />
                  <Field label="Age / sex" value={`${app.age || "—"} / ${app.sex || "—"}`} />
                  <Field label="Civil status" value={app.civilStatus || "—"} />
                  <Field
                    label="Contact number"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" style={{ color: "var(--ink-faint)" }} />
                        {app.contactNo || "—"}
                      </span>
                    }
                  />
                  <Field label="QCID number" value={app.qcidNumber || "—"} />
                  <Field
                    label="Email address"
                    value={
                      app.email ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" style={{ color: "var(--ink-faint)" }} />
                          {app.email}
                        </span>
                      ) : (
                        "—"
                      )
                    }
                  />
                  <Field label="Barangay" value={app.addressBarangay || "—"} />
                  <div className="col-span-2">
                    <Field
                      label="Complete address"
                      value={
                        <span className="inline-flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--ink-faint)" }} />
                          {address}
                        </span>
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Section 02: Application Details & Basis */}
              <div>
                <SectionHeading number={nextNum()} icon={<ClipboardList className="h-4 w-4" />}>
                  {app.applicationType === "new" ? "Application details & basis" : "Record verification details"}
                </SectionHeading>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm p-4 rounded-lg" style={{ background: "var(--surface-sunk)" }}>
                  <Field
                    label="Application type"
                    value={
                      app.applicationType === "new"
                        ? "New Solo Parent ID"
                        : app.applicationType === "renewal"
                        ? "Renewal Solo Parent ID"
                        : "Replacement / Lost Solo Parent ID"
                    }
                  />
                  <Field
                    label={app.applicationType === "new" ? "Solo parent ID status" : "Solo parent ID / QCID number"}
                    value={
                      app.applicationType === "new"
                        ? "Wala pa (Bagong aplikasyon)"
                        : app.soloParentIdNumber || app.assignedIdNumber || app.qcidNumber || "Existing Record Verified"
                    }
                  />
                  {app.classification && (
                    <div className="col-span-2">
                      <Field label="Solo parent category / reason" value={app.classification} />
                    </div>
                  )}
                </div>
              </div>

              {/* Only show family composition if it has actual data */}
              {app.familyMembers && app.familyMembers.length > 0 && (
                <div>
                  <SectionHeading number={nextNum()} icon={<Users className="h-4 w-4" />}>Family composition</SectionHeading>
                  <div className="space-y-2">
                    {app.familyMembers.map((m, idx) => (
                      <div key={m.id} className="p-4 rounded-lg text-sm" style={{ background: "var(--surface-sunk)" }}>
                        <p className="gw-serif font-semibold mb-2" style={{ color: "var(--ink)" }}>Member {idx + 1} — {m.name || "—"}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                          <Field label="Relationship" value={m.relationship} />
                          <Field label="Age" value={m.age} />
                          <Field label="Birthday" value={m.birthday} />
                          <Field label="Status" value={m.status} />
                          <Field label="Education" value={m.educationalAttainment} />
                          <Field label="Occupation / income" value={m.occupationMonthlyIncome} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Only show emergency contact if it has actual data */}
              {app.emergencyName && (
                <div>
                  <SectionHeading number={nextNum()} icon={<Phone className="h-4 w-4" />}>Emergency contact</SectionHeading>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm p-4 rounded-lg" style={{ background: "var(--surface-sunk)" }}>
                    <Field label="Name" value={app.emergencyName} />
                    <Field label="Contact number" value={app.emergencyContactNo} />
                    <div className="col-span-2">
                      <Field label="Address" value={app.emergencyAddress} />
                    </div>
                  </div>
                </div>
              )}

              {/* Only show circumstances if it has actual data */}
              {(app.circumstanceDetails || app.needsProblems || app.familyResources) && (
                <div>
                  <SectionHeading number={nextNum()} icon={<HeartHandshake className="h-4 w-4" />}>Circumstances and needs</SectionHeading>
                  <div className="space-y-4 p-4 rounded-lg text-sm" style={{ background: "var(--surface-sunk)" }}>
                    {app.circumstanceDetails && <Field label="Situation described" value={app.circumstanceDetails} />}
                    {app.needsProblems && <Field label="Needs / problems" value={app.needsProblems} />}
                    {app.familyResources && <Field label="Family resources" value={app.familyResources} />}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <SectionHeading number={nextNum()} icon={<User className="h-4 w-4" />}>Guardian information</SectionHeading>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm p-4 rounded-lg" style={{ background: "var(--surface-sunk)" }}>
                  <Field label="Full name" value={`${app.guardianFirstName} ${app.guardianMiddleName} ${app.guardianLastName}`} />
                  <Field label="Relationship to child" value={app.guardianRelationshipToChild} />
                  <Field label="Sex / civil status" value={`${app.guardianSex} / ${app.guardianCivilStatus}`} />
                  <Field label="Date of birth / age" value={`${app.guardianDateOfBirth} / ${app.guardianAge}`} />
                  <Field
                    label="Contact number"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" style={{ color: "var(--ink-faint)" }} />
                        {app.guardianContactNo}
                      </span>
                    }
                  />
                  <Field
                    label="Email"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" style={{ color: "var(--ink-faint)" }} />
                        {app.guardianEmail}
                      </span>
                    }
                  />
                  <Field label="Valid ID" value={app.guardianValidId} />
                  <div className="col-span-2">
                    <Field
                      label="Address"
                      value={
                        <span className="inline-flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--ink-faint)" }} />
                          {address}
                        </span>
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <SectionHeading number={nextNum()} icon={<Baby className="h-4 w-4" />}>Child information</SectionHeading>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm p-4 rounded-lg" style={{ background: "var(--surface-sunk)" }}>
                  <Field label="Full name" value={app.childName} />
                  <Field label="Sex / age" value={`${app.childSex} / ${app.childAge}`} />
                  <Field label="Date of birth" value={app.childBirthday} />
                  <Field label="Has birth certificate" value={app.childBirthCertificate} />
                  <Field label="School / daycare" value={app.childSchoolDaycare} />
                  <Field label="Grade level" value={app.childGradeLevel} />
                  <Field label="Enrollment status" value={app.childEnrollmentStatus} />
                  <Field label="School address" value={app.childSchoolAddress} />
                  <div className="col-span-2">
                    <Field
                      label="Special needs / disability"
                      value={app.childSpecialNeeds === "Yes" ? `Yes — ${app.childSpecialNeedsSpecify}` : app.childSpecialNeeds}
                    />
                  </div>
                </div>
              </div>

              <div>
                <SectionHeading number={nextNum()} icon={<Home className="h-4 w-4" />}>Household information</SectionHeading>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm p-4 rounded-lg" style={{ background: "var(--surface-sunk)" }}>
                  <Field label="Household members" value={app.householdMembers} />
                  <Field label="Children studying" value={app.childrenStudying} />
                  <Field label="Monthly household income" value={app.monthlyHouseholdIncome ? `₱${app.monthlyHouseholdIncome}` : ""} />
                  <Field label="Main source of income" value={app.mainSourceIncome} />
                  <Field label="Employment status" value={app.employmentStatus} />
                  <Field label="Other financial support" value={app.otherFinancialSupport} />
                </div>
              </div>

              <div>
                <SectionHeading number={nextNum()} icon={<HeartHandshake className="h-4 w-4" />}>Support requested and current needs</SectionHeading>
                <div className="space-y-4 p-4 rounded-lg text-sm" style={{ background: "var(--surface-sunk)" }}>
                  <Field
                    label="Support requested"
                    value={app.supportTypes.join(", ") + (app.supportOther ? ` (${app.supportOther})` : "")}
                  />
                  <Field label="Primary reason for assistance" value={app.primaryReasonForAssistance} />
                  <Field label="Specific needs" value={app.specificNeeds} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Estimated amount needed" value={app.estimatedAmountNeeded ? `₱${app.estimatedAmountNeeded}` : ""} />
                    <Field label="Urgency" value={app.urgency} />
                  </div>
                </div>
              </div>

              <div>
                <SectionHeading number={nextNum()} icon={<Users className="h-4 w-4" />}>Family / household situation</SectionHeading>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm p-4 rounded-lg" style={{ background: "var(--surface-sunk)" }}>
                  <Field label="Child's living arrangement" value={app.childLivingArrangement} />
                  <Field
                    label="Other children needing assistance"
                    value={app.otherChildrenNeedingAssistance === "Yes" ? `Yes — ${app.otherChildrenCount}` : app.otherChildrenNeedingAssistance}
                  />
                  <Field
                    label="Other govt. assistance received"
                    value={app.otherGovtAssistanceReceived === "Yes" ? `Yes — ${app.otherGovtProgram}` : app.otherGovtAssistanceReceived}
                  />
                  <Field label="Additional info" value={app.additionalInfo} />
                </div>
              </div>
            </>
          )}

          {/* Submitted Documents (shared) */}
          <div>
            <SectionHeading number={nextNum()} icon={<Paperclip className="h-4 w-4" />}>Documents on file ({app.documents?.length || 0})</SectionHeading>
            <div className="space-y-2">
              {app.documents.map((doc, idx) => {
  const m = docStatusMeta[doc.status] ?? docStatusMeta.pending
  return (
      <button
  key={idx}
  type="button"
  onClick={() => setPreviewDoc(doc)}
  className="w-full flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition-opacity text-left"
  style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
>
  <span className="gw-mono text-xs w-5 shrink-0" style={{ color: "var(--ink-faint)" }}>{String(idx + 1).padStart(2, "0")}</span>
  <span style={{ color: "var(--ink-soft)" }}>{docIcon(doc.filename)}</span>
  <div className="min-w-0 flex-1">
    <p className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>{doc.name}</p>
    <p className="text-xs" style={{ color: "var(--ink-faint)" }}>{new Date(doc.uploadedAt).toLocaleString()}</p>
  </div>
  <span className={`gw-status ${m.text} shrink-0`}>
    <span className={`gw-dot ${m.dot}`} />
    {doc.status}
  </span>
</button>
  )
})}
            </div>
          </div>

          {/* Actions */}
           <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
          {app.status === "pending" && (
            <div className="pt-6" style={{ borderTop: "1px solid var(--line)" }}>
              {actionMode === "view" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setActionMode("approve")}
                    className="gw-btn-approve flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5"
                  >
                    <Check className="h-4 w-4" />
                    Approve application
                  </button>
                  <button
                    onClick={() => setActionMode("reject")}
                    className="gw-btn-reject flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5"
                  >
                    <X className="h-4 w-4" />
                    Reject application
                  </button>
                </div>
              )}

              {actionMode === "approve" && (
                <div className="space-y-4 rounded-lg p-4" style={{ background: "var(--forest-soft)", border: "1px solid var(--forest-line)" }}>
                  <div>
                    <label className="text-sm font-semibold" style={{ color: "var(--forest-ink)" }}>
                      {isSoloParent(app) ? "Assign solo parent ID number" : "Approved support amount (₱)"}
                    </label>
                    <input
                      type="text"
                      value={approveValue}
                      onChange={(e) => setApproveValue(e.target.value)}
                      placeholder={isSoloParent(app) ? "SP-2026-XXXXX" : "e.g. 5,000"}
                      className="gw-input w-full mt-2 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setActionMode("view")} className="gw-btn-ghost flex-1 px-4 py-2">
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (approveValue.trim()) {
                          onApprove(app.id, approveValue)
                          onClose()
                        }
                      }}
                      className="gw-btn-approve flex-1 px-4 py-2"
                    >
                      Confirm approval
                    </button>
                  </div>
                </div>
              )}

              {actionMode === "reject" && (
                <div className="space-y-4 rounded-lg p-4" style={{ background: "var(--redwood-soft)", border: "1px solid var(--redwood-line)" }}>
                  <div>
                    <label className="text-sm font-semibold" style={{ color: "var(--redwood-ink)" }}>Reason for rejection</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="gw-input w-full mt-2 px-3 py-2 text-sm"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setActionMode("view")} className="gw-btn-ghost flex-1 px-4 py-2">
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (rejectionReason.trim()) {
                          onReject(app.id, rejectionReason)
                          onClose()
                        }
                      }}
                      className="gw-btn-reject flex-1 px-4 py-2"
                    >
                      Confirm rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {app.status === "approved" && (
            <div className="rounded-lg p-4" style={{ background: "var(--forest-soft)", border: "1px solid var(--forest-line)" }}>
              <p className="text-sm" style={{ color: "var(--forest-ink)" }}>
                <strong>Approved</strong> on {new Date(app.approvedDate!).toLocaleDateString()} by {app.approvedBy}
              </p>
              {isSoloParent(app) && app.assignedIdNumber && (
                <p className="text-sm mt-2 gw-mono" style={{ color: "var(--forest-ink)" }}>
                  <strong className="gw-mono">ID number:</strong> {app.assignedIdNumber}
                </p>
              )}
              {!isSoloParent(app) && app.approvedAmount && (
                <p className="text-sm mt-2" style={{ color: "var(--forest-ink)" }}>
                  <strong>Approved amount:</strong> ₱{app.approvedAmount}
                </p>
              )}
              {app.notes && (
                <p className="text-sm mt-2" style={{ color: "var(--forest-ink)" }}>
                  <strong>Notes:</strong> {app.notes}
                </p>
              )}
            </div>
          )}

          {app.status === "rejected" && (
            <div className="rounded-lg p-4" style={{ background: "var(--redwood-soft)", border: "1px solid var(--redwood-line)" }}>
              <p className="text-sm" style={{ color: "var(--redwood-ink)" }}>
                <strong>Rejected:</strong> {app.rejectionReason}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3 shrink-0" style={{ borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
          <button onClick={onClose} className="gw-btn-ghost px-6 py-2">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================================================
// Main Admin Component
// =====================================================================================

export default function SoloParentChildWelfareAdmin() {
  const [applications, setApplications] = useState<WelfareSubmission[]>([])
const [isLoading, setIsLoading] = useState(true)
const [loadError, setLoadError] = useState("")

const loadApplications = async (silent = false) => {
  if (!silent) setIsLoading(true)
  setLoadError("")
  try {
    const apps = await fetchAllSubmissions()
    setApplications(apps)
  } catch (err) {
    console.error("Failed to load applications:", err)
    if (!silent) setLoadError("Hindi makuha ang mga application. Subukan ulit.")
  } finally {
    if (!silent) setIsLoading(false)
  }
}

useEffect(() => {
  loadApplications(false)

  const interval = setInterval(() => {
    loadApplications(true)
  }, 2500)

  const handleSync = () => loadApplications(true)
  window.addEventListener("storage", handleSync)
  window.addEventListener("focus", handleSync)

  return () => {
    clearInterval(interval)
    window.removeEventListener("storage", handleSync)
    window.removeEventListener("focus", handleSync)
  }
}, [])
const [selectedApp, setSelectedApp] = useState<WelfareSubmission | null>(null)
const [filterCategory, setFilterCategory] = useState<"all" | "Solo Parent" | "Child Welfare">("all")
const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected" | "needs_revision">("all")
const [searchTerm, setSearchTerm] = useState("")

  const handleApprove = async (id: string, value: string) => {
  const app = applications.find((a) => a.id === id)
  if (!app) return
  try {
    await approveSubmission(app, value)
    await loadApplications()
  } catch (err) {
    console.error(err)
    alert("Hindi na-approve ang application. Subukan ulit.")
  }
}

const handleReject = async (id: string, reason: string) => {
  const app = applications.find((a) => a.id === id)
  if (!app) return
  try {
    await rejectSubmission(app, reason)
    await loadApplications()
  } catch (err) {
    console.error(err)
    alert("Hindi na-reject ang application. Subukan ulit.")
  }
}

  const filteredApps = applications.filter((app) => {
    const matchCategory = filterCategory === "all" || app.category === filterCategory
    const matchStatus = filterStatus === "all" || app.status === filterStatus
    const name = displayName(app).toLowerCase()
    const matchSearch =
      searchTerm === "" ||
      name.includes(searchTerm.toLowerCase()) ||
      app.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCategory && matchStatus && matchSearch
  })

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }

  const categoryOptions: Array<{ value: typeof filterCategory; label: string }> = [
    { value: "all", label: "All categories" },
    { value: "Solo Parent", label: "Solo Parent" },
    { value: "Child Welfare", label: "Child Welfare" },
  ]
  const statusOptions: Array<{ value: typeof filterStatus; label: string }> = [
    { value: "all", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ]

  return (
    <div className="gw-root">
      <Tokens />
      <div className="p-4 md:p-8 space-y-7 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="h-3.5 w-3.5" style={{ color: "var(--plum)" }} />
            <span className="gw-eyebrow">Case registry · social welfare intake</span>
          </div>
          <h1 className="gw-serif text-[2.1rem] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
            Solo Parent &amp; Child Welfare
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--ink-soft)" }}>
            Review submitted applications, verify documents, and record a decision on each case.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total applications", value: stats.total, color: "var(--ink)" },
            { label: "Pending review", value: stats.pending, color: "var(--gold)" },
            { label: "Approved", value: stats.approved, color: "var(--forest)" },
            { label: "Rejected", value: stats.rejected, color: "var(--redwood)" },
          ].map((stat) => (
            <div key={stat.label} className="gw-stat p-4" style={{ "--stat-color": stat.color } as React.CSSProperties}>
              <p className="gw-eyebrow" style={{ color: "var(--ink-faint)" }}>{stat.label}</p>
              <p className="gw-serif text-3xl font-semibold mt-2" style={{ color: "var(--ink)" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="gw-card p-4 space-y-4">
          <div className="flex items-center gap-2 rounded-lg px-3" style={{ border: "1px solid var(--line)", background: "var(--surface-sunk)" }}>
            <Search className="h-4 w-4 shrink-0" style={{ color: "var(--ink-faint)" }} />
            <input
              type="text"
              placeholder="Search by name or reference number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 py-2.5 text-sm bg-transparent focus:outline-none"
              style={{ color: "var(--ink)" }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="gw-eyebrow mb-2" style={{ color: "var(--ink-faint)" }}>Category</p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterCategory(opt.value)}
                    className={`gw-tag gw-tag--btn ${
                      opt.value === "all" ? "gw-tag--ghost" : opt.value === "Solo Parent" ? "gw-tag--solo" : "gw-tag--child"
                    } ${filterCategory === opt.value ? "is-active" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="gw-eyebrow mb-2" style={{ color: "var(--ink-faint)" }}>Status</p>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value)}
                    className="gw-tag gw-tag--ghost gw-tag--btn"
                    style={filterStatus === opt.value ? { opacity: 1, borderColor: "var(--ink-soft)" } : undefined}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="gw-serif text-lg font-semibold" style={{ color: "var(--ink)" }}>Applications</h2>
            <span className="gw-mono text-sm" style={{ color: "var(--ink-faint)" }}>({filteredApps.length})</span>
          </div>

                {isLoading ? (
              <div className="text-center py-16 gw-card">
                <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Naglo-load ng mga application...</p>
              </div>
            ) : loadError ? (
              <div className="text-center py-16 gw-card">
                <p className="text-sm" style={{ color: "var(--redwood-ink)" }}>{loadError}</p>
                <button onClick={loadApplications} className="gw-btn-ghost px-4 py-2 mt-3">Subukan Ulit</button>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-16 gw-card">
                <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--ink-faint)" }} />
                <p className="gw-serif text-base font-semibold" style={{ color: "var(--ink)" }}>No applications found</p>
                <p className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>Try a different search term or filter.</p>
              </div>
            ) : (
            <div className="space-y-3">
              {filteredApps.map((app) => (
                <ApplicationCard key={app.id} app={app} onView={() => setSelectedApp(app)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedApp && (
        <DetailedView
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  )
}
import { useState, useEffect } from "react"
import {
  Check,
  ChevronRight,
  Upload,
  Camera,
  FileText,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  Info,
  Pencil,
} from "lucide-react"
import DocumentCameraModal from "../ui/document-camera-modal"
import { useLanguage } from "../ui/language-context"

export interface UserProfile {
  qcidNo?: string
  firstName?: string
  middleName?: string
  lastName?: string
  suffix?: string
  nationality?: string
  dobMonth?: string
  dobDay?: string
  dobYear?: string
  age?: string
  sex?: string
  civilStatus?: string
  addressHouseNo?: string
  addressStreet?: string
  addressBarangay?: string
  addressCity?: string
  contactNo?: string
  email?: string
  emergencyFirstName?: string
  emergencyLastName?: string
  emergencyContactNo?: string
  emergencyRelationship?: string
}

import { getCurrentUserProfile } from "../../utils/userProfile"

const MOCK_USER_PROFILE: UserProfile = getCurrentUserProfile() as any

export interface SeniorBookletWizardProps {
  bookletType?: "medicine" | "movie"
  onBack?: () => void
  userProfile?: UserProfile
}

interface RequiredDoc {
  id: string
  label: string
  description: string
  required: boolean
}

const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
]

function calculateAge(monthStr: string, dayStr: string, yearStr: string): string {
  if (!monthStr || !dayStr || !yearStr) return ""
  let mIdx = MONTHS.indexOf(monthStr.toUpperCase())
  if (mIdx === -1 && !isNaN(parseInt(monthStr, 10))) {
    mIdx = parseInt(monthStr, 10) - 1
  }
  if (mIdx === -1) return ""
  const birthDate = new Date(parseInt(yearStr), mIdx, parseInt(dayStr))
  const today = new Date(2026, 7, 29)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age > 0 ? String(age) : ""
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0.0 KB"
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export default function SeniorBookletWizard({
  bookletType = "medicine",
  onBack,
  userProfile = MOCK_USER_PROFILE,
}: SeniorBookletWizardProps) {
  const { t } = useLanguage()
  const isMedicine = bookletType === "medicine"
  const title = isMedicine ? (t("navSeniorMedicineBooklet") || "Medicine Discount Booklet") : (t("navSeniorMovieBooklet") || "Free Movie Booklet")

  const STEPS = [
    { id: 1, label: t("wizardChecklist") || "COMPLETE CHECKLIST" },
    { id: 2, label: t("wizardPersonal") || "PERSONAL INFORMATION" },
    { id: 3, label: t("pwdStepDocuments")?.toUpperCase() || "SAMPLE DOCUMENTS" },
    { id: 4, label: t("wizardReview") || "REVIEW & SUBMIT" },
  ]

  const [step, setStep] = useState(1)
  const [attemptedNext, setAttemptedNext] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3)
  const [referenceNumber, setReferenceNumber] = useState("")
  const [submissionDate, setSubmissionDate] = useState("")

  // Reload / Navigation warning protection
  useEffect(() => {
    if (step > 1 && !submitted) {
      ;(window as any).__isFormDirty = true
    } else {
      ;(window as any).__isFormDirty = false
    }
    return () => {
      ;(window as any).__isFormDirty = false
    }
  }, [step, submitted])

  // Auto-redirect to pending status screen (Pic 2) after 3 seconds on submitted
  useEffect(() => {
    if (!submitted) return

    setRedirectCountdown(3)
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsBlocked(true)
          setSubmitted(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [submitted])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step > 1 && !submitted) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [step, submitted])

  // STEP 1 Checklist
  const [isResident, setIsResident] = useState(false)
  const [isSenior, setIsSenior] = useState(false)
  const [hasSeniorId, setHasSeniorId] = useState(false)
  const [hasPriorBooklet, setHasPriorBooklet] = useState<"yes" | "no" | "">("")
  const [applicationType, setApplicationType] = useState<"new" | "renewal" | "replacement">("new")

  // ID Verification state
  const [oscaIdInput, setOscaIdInput] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isIdVerified, setIsIdVerified] = useState(false)
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; file: File } | null>(null)

  // Renewal / Replacement fields
  const [bookletNumber, setBookletNumber] = useState("")
  const [renewalReason, setRenewalReason] = useState("Booklet pages are full")
  const [replacementReason, setReplacementReason] = useState("Lost")

  // STEP 2 Personal Information
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [formData, setFormData] = useState({
    qcidNo: userProfile?.qcidNo || "110000116932100",
    firstName: userProfile?.firstName || "CLARISA MAE",
    middleName: userProfile?.middleName || "GALIAS",
    lastName: userProfile?.lastName || "DIMAL",
    suffix: userProfile?.suffix || "",
    nationality: userProfile?.nationality || "FILIPINO",
    dobMonth: userProfile?.dobMonth || "10",
    dobDay: userProfile?.dobDay || "29",
    dobYear: userProfile?.dobYear || "1960",
    age: userProfile?.age || "65",
    sex: userProfile?.sex || "Female",
    civilStatus: userProfile?.civilStatus || "Single",
    addressHouseNo: userProfile?.addressHouseNo || "11",
    addressStreet: userProfile?.addressStreet || "OLD CABUYAO SAMPALOK ST",
    addressBarangay: userProfile?.addressBarangay || "Sauyo",
    addressCity: userProfile?.addressCity || "QUEZON CITY",
    contactNumber: userProfile?.contactNo || "09000000000",
    emailAddress: userProfile?.email || "dimalmae@gmail.com",
    emergencyFirstName: userProfile?.emergencyFirstName || "JUAN",
    emergencyLastName: userProfile?.emergencyLastName || "DIMAL",
    emergencyContactNo: userProfile?.emergencyContactNo || "09123456789",
    emergencyRelationship: userProfile?.emergencyRelationship || "Child",
    certified: false,
  })

  // STEP 3 Uploaded Files
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({})
  const [cameraDoc, setCameraDoc] = useState<{ id: string; label: string } | null>(null)

  // Dynamic Required Documents according to application type
  const getRequiredDocuments = (): RequiredDoc[] => {
    if (isMedicine) {
      if (applicationType === "new") {
        return [
          {
            id: "seniorId",
            label: "Senior Citizen / OSCA ID",
            description: "Malinaw na kopya ng inyong OSCA / QC Senior Citizen ID (harapan at likod).",
            required: true,
          },
          {
            id: "validGovId",
            label: "Valid Government-issued ID",
            description: "Passport, UMID, Driver's License, Postal ID, o Voter's Certificate.",
            required: true,
          },
          {
            id: "idPhoto",
            label: "Recent 2×2 / ID Picture",
            description: "Kamakailang 2x2 colored photo na may puting background.",
            required: true,
          },
          {
            id: "proofOfResidency",
            label: "Proof of Residency (kung required)",
            description: "Barangay Certificate of Residency o kamakailang utility bill sa Quezon City.",
            required: true,
          },
          {
            id: "prescription",
            label: "Prescription / Medical Document",
            description: "Kasalukuyang reseta ng doktor o medical certificate para sa maintenance medications.",
            required: true,
          },
        ]
      } else if (applicationType === "renewal") {
        return [
          {
            id: "seniorId",
            label: "Senior Citizen / OSCA ID",
            description: "Malinaw na kopya ng inyong OSCA / QC Senior Citizen ID (harapan at likod).",
            required: true,
          },
          {
            id: "existingBooklet",
            label: "Existing Medicine Discount Booklet",
            description: "Kopya o larawan ng inyong lumang booklet na puno na ang pahina o paso na.",
            required: true,
          },
          {
            id: "prescription",
            label: "Updated / Valid Prescription",
            description: "Reseta ng doktor para sa kasalukuyang maintenance medications.",
            required: true,
          },
        ]
      } else {
        // replacement
        return [
          {
            id: "seniorId",
            label: "Senior Citizen / OSCA ID",
            description: "Malinaw na kopya ng inyong OSCA / QC Senior Citizen ID (harapan at likod).",
            required: true,
          },
          {
            id: "validGovId",
            label: "Valid Government-issued ID",
            description: "Passport, UMID, Driver's License, Postal ID, o Voter's Certificate.",
            required: true,
          },
          {
            id: "affidavitOrDamaged",
            label: replacementReason === "Lost" ? "Affidavit of Loss" : "Damaged Medicine Discount Booklet",
            description:
              replacementReason === "Lost"
                ? "Notarized Affidavit of Loss na nagpapatunay na nawala ang booklet."
                : "Malinaw na larawan ng nasirang Medicine Discount Booklet.",
            required: true,
          },
          {
            id: "idPhoto",
            label: "Recent 2×2 / ID Picture",
            description: "Recent photo para sa paglalabas ng bagong booklet.",
            required: true,
          },
        ]
      }
    } else {
      // Movie Booklet
      return [
        {
          id: "seniorId",
          label: "Senior Citizen / OSCA ID",
          description: "Kopya ng inyong QC Senior Citizen ID.",
          required: true,
        },
        {
          id: "validGovId",
          label: "Valid Government-issued ID",
          description: "Valid ID na may larawan at address.",
          required: true,
        },
        {
          id: "idPhoto",
          label: "Recent 2×2 / ID Picture",
          description: "Recent 2x2 ID picture na may white background.",
          required: true,
        },
        {
          id: "proofOfResidency",
          label: "Proof of Residency",
          description: "Barangay Certificate of Residency o Indigency.",
          required: true,
        },
      ]
    }
  }

  const currentRequiredDocs = getRequiredDocuments()

  const updateField = (field: string, val: string | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: val }
      if (field === "dobMonth" || field === "dobDay" || field === "dobYear") {
        next.age = calculateAge(
          field === "dobMonth" ? (val as string) : next.dobMonth,
          field === "dobDay" ? (val as string) : next.dobDay,
          field === "dobYear" ? (val as string) : next.dobYear
        )
      }
      return next
    })
  }

  const handleFileUpload = (docId: string, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [docId]: file }))
  }

  const removeFile = (docId: string) => {
    setUploadedFiles((prev) => {
      const copy = { ...prev }
      delete copy[docId]
      return copy
    })
  }

  const handleVerifyId = () => {
    if (!oscaIdInput.trim()) return
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      setIsIdVerified(true)
    }, 600)
  }

  // Step validations
  const isStep1Valid =
    isResident &&
    isSenior &&
    hasSeniorId &&
    hasPriorBooklet !== "" &&
    oscaIdInput.trim() !== "" &&
    isIdVerified &&
    (hasPriorBooklet === "no" || bookletNumber.trim() !== "")

  const isStep2Valid =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.dobMonth !== "" &&
    formData.dobDay !== "" &&
    formData.dobYear !== "" &&
    formData.sex !== "" &&
    formData.civilStatus !== "" &&
    formData.contactNumber.trim() !== "" &&
    formData.addressBarangay !== ""

  const isStep3Valid = currentRequiredDocs.every((doc) => !doc.required || !!uploadedFiles[doc.id])

  const isStep4Valid = formData.certified

  const canGoNext =
    step === 1
      ? isStep1Valid
      : step === 2
      ? isStep2Valid
      : step === 3
      ? isStep3Valid
      : isStep4Valid

  const goNext = () => {
    setAttemptedNext(true)
    if (step === 1 && !isStep1Valid) return
    if (step === 2 && !isStep2Valid) return
    if (step === 3 && !isStep3Valid) return
    setAttemptedNext(false)
    setStep((prev) => Math.min(prev + 1, 4))
  }

  const goBack = () => {
    setAttemptedNext(false)
    if (step === 1) {
      onBack?.()
      return
    }
    setStep((prev) => Math.max(prev - 1, 1))
  }

  // Submits after modal confirmation
  const handleConfirmSubmit = () => {
    setShowConfirmModal(false)
    setIsSubmitting(true)
    setTimeout(() => {
      const qcid = userProfile?.qcidNo || "110000116932100"
      setReferenceNumber(qcid)
      setSubmissionDate(
        new Date().toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      )
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1000)
  }

  // Submitted Screen
  if (isBlocked) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            ← Bumalik
          </button>
        )}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Info className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            May Kasalukuyang Application Ka Pa
          </h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Mayroon ka pang nakabinbing aplikasyon para sa {title}. Maghintay
            ng pagsusuri bago magsumite ng panibagong aplikasyon.
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
        <div className="bg-white border border-border rounded-2xl p-6 md:p-8 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <Check className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" /> Application Submitted Successfully!
            </span>
            <h2 className="text-2xl font-bold text-foreground">
              Mabuhay! Ang inyong aplikasyon ay Natanggap Na
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Ang inyong {title} application ay matagumpay na naisumite at kasalukuyang sinusuri.
            </p>
          </div>

          {/* Reference Card */}
          <div className="border border-border rounded-xl p-5 max-w-md mx-auto space-y-2.5 text-left bg-gray-50/60">
            <div className="flex justify-between items-center text-xs text-foreground border-b border-border/80 pb-2">
              <span className="font-semibold text-muted-foreground">Application Reference No.:</span>
              <span className="font-mono font-bold text-blue-700 text-sm">{referenceNumber}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-semibold text-foreground">{title}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">Application Type:</span>
              <span className="font-semibold text-foreground uppercase">
                {applicationType === "new" ? "BAGONG BOOKLET" : applicationType === "renewal" ? "RENEWAL" : "REPLACEMENT"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">OSCA ID No.:</span>
              <span className="font-mono font-semibold text-foreground">{oscaIdInput}</span>
            </div>
            {applicationType !== "new" && bookletNumber && (
              <div className="flex justify-between items-center text-xs text-foreground">
                <span className="text-muted-foreground">Booklet Number:</span>
                <span className="font-mono text-foreground">{bookletNumber}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">Aplikante:</span>
              <span className="font-semibold text-foreground">
                {formData.firstName} {formData.middleName ? `${formData.middleName} ` : ""}{formData.lastName}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-foreground">
              <span className="text-muted-foreground">Petsa:</span>
              <span className="text-foreground">{submissionDate}</span>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 max-w-md mx-auto flex items-center justify-center gap-2.5 text-center">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <p>
              Maaari ninyong tingnan ang Notifications para sa mga update sa inyong aplikasyon.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3b82f6]" />
            <span>
              Awtomatikong lilipat sa application status sa loob ng {redirectCountdown} segundo...
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Main Wizard Card matching Pic 2 */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white relative shadow-xs">
        {/* Step indicator connected numbered circles */}
        <div className="flex items-center px-6 pt-6 pb-4">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div
                className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  s.id === step
                    ? "bg-blue-600 text-white"
                    : s.id < step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s.id < step ? <Check className="h-4 w-4 stroke-[3]" /> : s.id}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-2 ${s.id < step ? "bg-blue-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Tab labels bar */}
        <div className="flex gap-2 border-b border-border bg-gray-50 p-2 overflow-x-auto">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex-1 px-4 py-3 rounded-lg text-xs font-semibold whitespace-nowrap text-center transition-colors ${
                s.id === step
                  ? "bg-blue-600 text-white"
                  : s.id < step
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Step Body */}
        <div className="p-6 sm:p-8 space-y-7 border-t border-gray-100">
          {/* ──────────────── STEP 1: COMPLETE CHECKLIST ──────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-wide uppercase">
                  SERVICE AND PRIMARY REQUIREMENTS
                </h2>
              </div>

              <div className="space-y-4">
                <CustomCheckbox
                  checked={isResident}
                  onChange={setIsResident}
                  label="Are you a resident of Quezon City? *"
                />
                <CustomCheckbox
                  checked={isSenior}
                  onChange={setIsSenior}
                  label="Are you 60 years old or above (Senior Citizen)? *"
                />
                <CustomCheckbox
                  checked={hasSeniorId}
                  onChange={setHasSeniorId}
                  label="Do you have a valid Senior Citizen / OSCA ID? *"
                />
              </div>

              {/* Blue Info Alert Banner */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    {title.toUpperCase()} — PRIMARY REQUIREMENTS
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Kumpletuhin ang mga pangunahing kwalipikasyon at ihanda ang inyong Senior Citizen / OSCA ID upang makapag-apply.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-foreground mb-1 font-bold uppercase tracking-wide">
                  {`HAVE YOU ALREADY RECEIVED ${title.toUpperCase()}? *`}
                </p>
                <label className="text-xs mb-2 block font-medium text-blue-700">
                  Choose Status **
                </label>
                <div className="flex items-center gap-8">
                  <label className="flex items-center gap-2 text-sm text-[#3b82f6] cursor-pointer select-none">
                    <input
                      type="radio"
                      name="hasPriorBooklet"
                      checked={hasPriorBooklet === "yes"}
                      onChange={() => {
                        setHasPriorBooklet("yes")
                        setApplicationType("renewal")
                      }}
                      className="h-4 w-4 accent-[#3b82f6]"
                    />
                    <span className="text-gray-900">Yes, I already received {title.toLowerCase()}</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#3b82f6] cursor-pointer select-none">
                    <input
                      type="radio"
                      name="hasPriorBooklet"
                      checked={hasPriorBooklet === "no"}
                      onChange={() => {
                        setHasPriorBooklet("no")
                        setApplicationType("new")
                      }}
                      className="h-4 w-4 accent-[#3b82f6]"
                    />
                    <span className="text-gray-900">Not yet</span>
                  </label>
                </div>
              </div>

              {hasPriorBooklet !== "" && (
                <div className="space-y-4 pt-2">
                  {hasPriorBooklet === "yes" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                        Select Type of Request *
                      </label>
                      <div className="flex items-center gap-8">
                        <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="bookletSubtype"
                            checked={applicationType === "renewal"}
                            onChange={() => setApplicationType("renewal")}
                            className="h-4 w-4 accent-[#3b82f6]"
                          />
                          Renewal (Booklet pages full / Expired)
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="bookletSubtype"
                            checked={applicationType === "replacement"}
                            onChange={() => setApplicationType("replacement")}
                            className="h-4 w-4 accent-[#3b82f6]"
                          />
                          Replacement (Lost / Damaged)
                        </label>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                      SENIOR CITIZEN / OSCA ID NUMBER *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2.5 max-w-md">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={oscaIdInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "")
                          setOscaIdInput(val)
                          setIsIdVerified(false)
                        }}
                        placeholder="Enter OSCA ID Number"
                        className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6] font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyId}
                        disabled={isVerifying || !oscaIdInput.trim()}
                        className="px-5 h-11 rounded-lg bg-[#3b82f6] hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>VERIFYING...</span>
                          </>
                        ) : (
                          <span>VERIFY ID</span>
                        )}
                      </button>
                    </div>

                    {isIdVerified && (
                      <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3 flex items-center gap-2.5 text-xs font-semibold text-emerald-800 max-w-md mt-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Senior Citizen Record Found: {[userProfile?.firstName, userProfile?.middleName, userProfile?.lastName].filter(Boolean).join(" ") || "CLARISA MAE GALIAS DIMAL"}</span>
                      </div>
                    )}
                  </div>

                  {hasPriorBooklet === "yes" && isIdVerified && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                          Existing Booklet Number *
                        </label>
                        <input
                          type="text"
                          value={bookletNumber}
                          onChange={(e) => setBookletNumber(e.target.value)}
                          placeholder="MB-XXXXXX"
                          className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                          Reason *
                        </label>
                        <select
                          value={applicationType === "renewal" ? renewalReason : replacementReason}
                          onChange={(e) => {
                            if (applicationType === "renewal") setRenewalReason(e.target.value)
                            else setReplacementReason(e.target.value)
                          }}
                          className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                        >
                          {applicationType === "renewal" ? (
                            <>
                              <option value="Booklet pages are full">Booklet pages are full</option>
                              <option value="Renewal due">Renewal due</option>
                              <option value="Other">Other</option>
                            </>
                          ) : (
                            <>
                              <option value="Lost">Lost</option>
                              <option value="Damaged">Damaged / Torn</option>
                              <option value="Stolen">Stolen</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ──────────────── STEP 2: PERSONAL INFORMATION ──────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 tracking-wide uppercase">
                    Personal Information
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Please review your personal information from your QCID profile. Fill in the additional details below.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <Check className="w-3.5 h-3.5" /> Auto-filled from QCID Record
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{isEditingInfo ? "Lock Information" : "Edit Information"}</span>
                  </button>
                </div>
              </div>

              {/* IMPORTANT REMINDER BOX matching Pic 3 */}
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-600">Important reminder</p>
                  <p className="text-blue-600/90 mt-0.5">
                    Please make sure the information on your QCID is correct and complete. If any detail is missing or incorrect, contact the QCID Team to update your QCID records before continuing your application. Accurate information is important for fast and smooth processing of your service.
                  </p>
                </div>
              </div>

              {/* Applicant QCID Profile Information Grid matching Pic 3 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">QC ID *</label>
                    <input
                      type="text"
                      value={formData.qcidNo}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">First name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Middle name</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Last name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Suffix (Jr., Sr., III, etc.)</label>
                    <input
                      type="text"
                      value={formData.suffix}
                      placeholder="Suffix (Jr., Sr., III, etc.)"
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Nationality *</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Date of birth *</label>
                    <input
                      type="text"
                      value={`${formData.dobMonth}/${formData.dobDay}/${formData.dobYear}`}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Age *</label>
                    <input
                      type="text"
                      value={formData.age}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Gender *</label>
                    <input
                      type="text"
                      value={formData.sex}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Civil status *</label>
                    <input
                      type="text"
                      value={formData.civilStatus}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">House/Building number *</label>
                    <input
                      type="text"
                      value={formData.addressHouseNo}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Street name *</label>
                    <input
                      type="text"
                      value={formData.addressStreet}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Barangay *</label>
                    <input
                      type="text"
                      value={formData.addressBarangay}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Phone number *</label>
                    <input
                      type="text"
                      value={formData.contactNumber}
                      readOnly
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Email *</label>
                  <input
                    type="text"
                    value={formData.emailAddress}
                    readOnly
                    disabled
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed mt-1"
                  />
                </div>

                {/* Existing Senior Citizen ID / OSCA ID */}
                <div className="pt-4 border-t border-gray-200 space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Existing Senior Citizen ID / OSCA ID *
                  </label>
                  <input
                    type="text"
                    value={oscaIdInput || "110000116932100"}
                    readOnly
                    disabled
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed font-mono mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: REQUIREMENTS / DOCUMENT UPLOAD ──────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">
                  Document Requirements ({applicationType === "new" ? "Bagong Booklet" : applicationType === "renewal" ? "Renewal" : "Replacement"})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  I-upload ang mga kaukulang dokumento. Tiyaking malinaw at madaling mabasa ang mga ito.
                </p>
              </div>

              {/* Renewal photo note */}
              {applicationType === "renewal" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Pinadaling Dokumento para sa Renewal:</span>
                    Hindi na kailangang mag-upload ng bagong 2×2 ID photo dahil rehistrado na ang inyong verified profile sa talaan ng OSCA.
                  </div>
                </div>
              )}

              {attemptedNext && !isStep3Valid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Kailangang i-upload ang lahat ng required na dokumento bago magpatuloy.</span>
                </div>
              )}

              <div className="space-y-4">
                {currentRequiredDocs.map((doc) => {
                  const file = uploadedFiles[doc.id]
                  const inputId = `upload-doc-${doc.id}`

                  return (
                    <div
                      key={doc.id}
                      className={`border rounded-xl p-4 md:p-5 transition-colors ${
                        file ? "border-emerald-300 bg-emerald-50/30" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                        <p className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                          {doc.label} {doc.required && <span className="text-red-500">*</span>}
                          {file && (
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white shrink-0">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </span>
                          )}
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground">{doc.description}</p>

                      <p className="text-[11px] text-muted-foreground mt-2">
                        Allowed file types: JPG, JPEG, PNG, WEBP (o kumuha gamit ang Camera)
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        <input
                          type="file"
                          id={inputId}
                          accept=".jpg,.jpeg,.png,.webp,image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleFileUpload(doc.id, f)
                            e.target.value = ""
                          }}
                        />
                        <label
                          htmlFor={inputId}
                          className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          UPLOAD PHOTO
                        </label>

                        <button
                          type="button"
                          onClick={() => setCameraDoc(doc)}
                          className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          KUMUHA NG LARAWAN (CAMERA)
                        </button>
                      </div>

                      {file && (
                        <div className="flex flex-wrap gap-3 pt-4">
                          <div className="relative w-40 border border-border rounded-lg bg-white p-3 flex flex-col items-center text-center shadow-xs">
                            <button
                              type="button"
                              onClick={() => removeFile(doc.id)}
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                              aria-label={`Alisin ang ${file.name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="h-12 w-12 rounded-md overflow-hidden border border-border mb-2 flex items-center justify-center bg-gray-50">
                              <FileThumbnail file={file} className="h-full w-full object-cover" />
                            </div>
                            <p className="text-xs font-medium text-foreground truncate w-full">{file.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ──────────────── STEP 4: REVIEW & SUBMIT ──────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">SURIIN ANG IYONG APLIKASYON</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pakisuri ang buod ng inyong aplikasyon bago mag-submit.
                </p>
              </div>

              {/* Application Details */}
              <div className="border border-border rounded-xl p-4 md:p-5 bg-white space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700">Application Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Service:</span>
                    <span className="font-bold text-foreground">{title}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Application Type:</span>
                    <span className="font-bold text-foreground uppercase">
                      {applicationType === "new" ? "Bagong Booklet" : applicationType === "renewal" ? "Renewal" : "Replacement"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">OSCA ID:</span>
                    <span className="font-mono font-bold text-foreground">{oscaIdInput}</span>
                  </div>
                  {applicationType !== "new" && (
                    <div>
                      <span className="text-muted-foreground block">Booklet Number:</span>
                      <span className="font-mono font-bold text-foreground">{bookletNumber}</span>
                    </div>
                  )}
                  {applicationType === "renewal" && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block">Reason for Renewal:</span>
                      <span className="font-semibold text-foreground">{renewalReason}</span>
                    </div>
                  )}
                  {applicationType === "replacement" && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block">Reason for Replacement:</span>
                      <span className="font-semibold text-foreground">{replacementReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="border border-border rounded-xl p-4 md:p-5 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700">Personal Information</h4>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    I-edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Name:</span>
                    <span className="font-bold text-foreground">{formData.firstName} {formData.middleName} {formData.lastName} {formData.suffix}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Birth Date:</span>
                    <span className="font-semibold text-foreground">{formData.dobMonth}/{formData.dobDay}/{formData.dobYear}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Age &amp; Gender:</span>
                    <span className="font-semibold text-foreground">{formData.age} yrs old, {formData.sex}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Contact Number:</span>
                    <span className="font-semibold text-foreground">{formData.contactNumber}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block">Address:</span>
                    <span className="font-semibold text-foreground">{formData.addressHouseNo} {formData.addressStreet}, Brgy. ${formData.addressBarangay}, ${formData.addressCity}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block">Senior Citizen / OSCA ID:</span>
                    <span className="font-semibold text-foreground font-mono">{oscaIdInput || "110000116932100"} (Verified)</span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="border border-border rounded-xl p-4 md:p-5 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700">Documents</h4>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    I-edit
                  </button>
                </div>
                <div className="space-y-4">
                  {currentRequiredDocs.map((doc) => {
                    const file = uploadedFiles[doc.id]
                    const uploaded = Boolean(file)
                    return (
                      <div key={doc.id}>
                        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                          {doc.label} {doc.required && <span className="text-red-500">*</span>}
                          {uploaded ? (
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-500 shrink-0">
                              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                            </span>
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                        </p>
                        {uploaded ? (
                          <div className="mt-2 space-y-2">
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: doc.label, file })}
                              className="w-full max-w-md border border-border hover:border-blue-400 rounded-lg overflow-hidden text-left bg-white cursor-pointer transition-colors shadow-xs"
                            >
                              <div className="h-28 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                <FileThumbnail file={file} className="h-full w-full object-cover" />
                              </div>
                              <div className="px-3 py-2 text-center border-t border-border bg-white">
                                <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
                              </div>
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-red-500 mt-1">Walang nai-upload na dokumento</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Certification Checkbox */}
              <div className="border border-border rounded-xl p-5 bg-gray-50/70 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.certified}
                    onChange={(e) => updateField("certified", e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-600 rounded"
                  />
                  <span className={`text-xs md:text-sm font-semibold leading-relaxed ${attemptedNext && !formData.certified ? "text-red-600" : "text-foreground"}`}>
                    I certify that the information provided is true and correct. <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 sm:px-8 py-5">
          {step === 1 ? (
            <div />
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="px-6 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 uppercase tracking-wider transition-colors cursor-pointer"
            >
              BACK
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className={`flex items-center gap-1.5 px-6 py-2 rounded-lg text-sm font-semibold transition-colors select-none ${
                canGoNext
                  ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span>NEXT</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAttemptedNext(true)
                if (!formData.certified) return
                setShowConfirmModal(true)
              }}
              disabled={!formData.certified}
              className={`px-8 h-10 rounded-lg text-xs font-bold transition-colors shadow-sm select-none ${
                formData.certified
                  ? "bg-[#3b82f6] text-white hover:bg-blue-700 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              SUBMIT APPLICATION
            </button>
          )}
        </div>
      </div>

      {/* 🔔 CONFIRMATION DIALOG / MODAL BEFORE SUBMIT */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-border"
          >
            {/* Modal Header */}
            <div className="p-6 pb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Review Before Submission</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Please make sure that all information and uploaded documents are correct. You can still go back and make changes before submitting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                aria-label="Isara"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-gray-50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                  setStep(4)
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-white transition-colors cursor-pointer"
              >
                ← GO BACK &amp; EDIT
              </button>

              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>YES, SUBMIT APPLICATION</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📸 Document Camera Capture Modal */}
      <DocumentCameraModal
        isOpen={Boolean(cameraDoc)}
        onClose={() => setCameraDoc(null)}
        docTitle={cameraDoc?.label}
        onCapture={(file) => {
          if (cameraDoc) {
            handleFileUpload(cameraDoc.id, file)
          }
        }}
      />

      {/* 👁️ UPLOADED DOCUMENT FULL PREVIEW MODAL */}
      {previewDocModal && (
        <UploadedDocPreviewModal
          title={previewDocModal.title}
          file={previewDocModal.file}
          onClose={() => setPreviewDocModal(null)}
        />
      )}
    </div>
  )
}

function CustomCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
}) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-[#3b82f6] cursor-pointer select-none group">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={`flex items-center justify-center h-4.5 w-4.5 mt-0.5 rounded-[3px] shrink-0 border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 ${
          checked ? "bg-[#3b82f6] border-[#3b82f6]" : "bg-white border-gray-300 group-hover:border-blue-400"
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
      </span>
      <span className="leading-snug text-blue-700 font-medium text-sm">{label}</span>
    </label>
  )
}

function FileThumbnail({ file, className }: { file: File; className?: string }) {
  const [src, setSrc] = useState<string>("")
  const isImg = file.type.startsWith("image/") || /\.(jpe?g|png|webp|jfif|bmp|gif)$/i.test(file.name)

  useEffect(() => {
    if (!isImg) return
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file, isImg])

  if (isImg && src) {
    return <img src={src} alt={file.name} className={className || "h-full w-full object-cover"} />
  }
  return <FileText className="h-8 w-8 text-muted-foreground" />
}

function UploadedDocPreviewModal({
  title,
  file,
  onClose,
}: {
  title: string
  file: File | null
  onClose: () => void
}) {
  if (!file) return null
  const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|jfif|bmp|gif)$/i.test(file.name)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  useEffect(() => {
    if (!isImage) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file, isImage])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wide truncate pr-2">{title}</h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 max-h-[65vh] overflow-y-auto bg-gray-50 flex items-center justify-center">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt={title} className="max-w-full max-h-[55vh] rounded-lg border border-border object-contain shadow-xs" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <FileText className="h-12 w-12 text-blue-500" />
              <p className="text-sm font-medium">{file.name}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground truncate bg-white">
          {file.name}
        </div>
      </div>
    </div>
  )
}

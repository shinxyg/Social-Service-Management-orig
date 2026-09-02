import React, { useState, useEffect } from "react"
import {
  Check,
  Upload,
  Camera,
  FileText,
  X,
  Loader2,
  Info,
  Pencil,
  ChevronUp,
  Sparkles,
} from "lucide-react"
import RequirementsModal, { AICS_REQUIREMENTS } from "./Requirements-modal"
import DocumentCameraModal from "../ui/document-camera-modal"
import { useLanguage } from "../ui/language-context"
import { API_BASE } from "../../config/api"
import { FIXED_ASSISTANCE_AMOUNTS } from "../modules/financial-aid-disbursement"

export type AICSServiceType = "material" | "food" | "transportation"

interface AICSServiceWizardProps {
  serviceType: AICSServiceType
  onBack?: () => void
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0.0 KB"
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

const SAMPLE_DOC_IMAGES: Record<string, string> = {
  "BARANGAY CERTIFICATE OF INDIGENCY / RESIDENCY": "/samples/BARANGAY CERTIFICATE OF INDIGENCY.jpg",
  "QCITIZEN ID O VALID GOVERNMENT-ISSUED ID": "/samples/QC ID NG PASYENTE.jpg",
  "SUPPORTING DOCUMENT": "/samples/AUTHORIZATION  PERSONAL LETTER.jpg",
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
    <label className="flex items-start gap-2.5 text-sm text-[#3b82f6] cursor-pointer select-none">
      <span
        onClick={() => onChange(!checked)}
        className={`flex items-center justify-center h-4.5 w-4.5 mt-0.5 rounded-[3px] shrink-0 border-2 transition-colors ${
          checked ? "bg-[#3b82f6] border-[#3b82f6]" : "bg-white border-gray-300"
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
      <div className="flex items-center justify-between bg-gray-50/80 border-b border-gray-200 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer"
        >
          <ChevronUp
            className={`h-4 w-4 text-gray-500 transition-transform ${
              open ? "" : "rotate-180"
            }`}
          />
          <span>• {title}</span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#3b82f6] hover:underline cursor-pointer"
        >
          <Pencil className="h-3 w-3" />
          EDIT
        </button>
      </div>
      {open && children}
    </div>
  )
}

function ReviewCheckItem({
  ok = true,
  label,
  bullet = false,
}: {
  ok?: boolean
  label: React.ReactNode
  bullet?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 text-sm text-gray-800">
      {bullet ? (
        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1.5 ml-1" />
      ) : (
        <span
          className={`flex items-center justify-center h-4 w-4 rounded-full shrink-0 mt-0.5 ${
            ok ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {ok ? (
            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          ) : (
            <X className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          )}
        </span>
      )}
      <div className="leading-snug">{label}</div>
    </div>
  )
}

function ReviewField({
  label,
  value,
}: {
  label: string
  value: string | number | undefined | null
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{value || "—"}</p>
    </div>
  )
}

function Field({
  label,
  children,
  full,
}: {
  label: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? "sm:col-span-3" : ""}>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

const disabledInputCls =
  "w-full h-10 rounded-lg bg-gray-100/90 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 border-0 outline-none disabled:cursor-not-allowed disabled:opacity-85"

const editableInputCls =
  "w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"

export default function AICSServiceWizard({
  serviceType,
  onBack,
}: AICSServiceWizardProps) {
  const { t } = useLanguage()

  // Requirements Modal state
  const reqKey =
    serviceType === "material"
      ? "aicsMaterial"
      : serviceType === "food"
      ? "aicsFood"
      : "aicsTransportation"

  const programRequirements = AICS_REQUIREMENTS[reqKey]
  const [showRequirementsModal, setShowRequirementsModal] = useState(true)
  const [reqAccepted, setReqAccepted] = useState(false)
  const [showInfoBanner, setShowInfoBanner] = useState(true)
  const [showSlotBanner, setShowSlotBanner] = useState(true)

  // Current Step: 1 = checklist, 2 = personal, 3 = documents, 4 = review, 5 = submitted, 6 = pending review
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3)

  // Eligibility check state
  const [isBlocked, setIsBlocked] = useState(false)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [referenceNo, setReferenceNo] = useState("")
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Camera modal state
  const [cameraModalOpen, setCameraModalOpen] = useState(false)
  const [cameraTargetField, setCameraTargetField] = useState<string>("")
  const [sampleDocOpen, setSampleDocOpen] = useState<string | null>(null)

  // ===================== FORM DATA =====================
  // Step 1: Checklist & Primary Requirements
  const [qcResident, setQcResident] = useState(false)
  const [crisisSituation, setCrisisSituation] = useState(false)

  // Material specific checklist
  const [receivedMaterialPrior, setReceivedMaterialPrior] = useState<"yes" | "no" | "">("")
  const [materialAgainReason, setMaterialAgainReason] = useState("")
  const [materialType, setMaterialType] = useState("")

  // Food specific checklist
  const [receivedFoodPrior, setReceivedFoodPrior] = useState<"yes" | "no" | "">("")
  const [foodAgainReason, setFoodAgainReason] = useState("")
  const [foodType, setFoodType] = useState("")

  // Transportation specific checklist
  const [transportationPurpose, setTransportationPurpose] = useState("")

  // Step 2: Personal Information (Auto-filled from account / QCID & disabled like Pic 4)
  const [qcIdNumber, setQcIdNumber] = useState("110000116932100")
  const [firstName, setFirstName] = useState("CLARISA MAE")
  const [middleName, setMiddleName] = useState("GALIAS")
  const [lastName, setLastName] = useState("DIMAL")
  const [suffix, setSuffix] = useState("")
  const [nationality, setNationality] = useState("FILIPINO")
  const [birthDate, setBirthDate] = useState("10/29/2004")
  const [age, setAge] = useState("21")
  const [sex, setSex] = useState("Female")
  const [civilStatus, setCivilStatus] = useState("Single")
  const [houseNumber, setHouseNumber] = useState("11")
  const [streetName, setStreetName] = useState("OLD CABUYAO SAMPALOK ST")
  const [barangay, setBarangay] = useState("Sauyo")
  const [contactNumber, setContactNumber] = useState("0900 000 0000")
  const [email, setEmail] = useState("dimalmae@gmail.com")
  const completeAddress = `${houseNumber} ${streetName}, Brgy. ${barangay}, Quezon City`

  // Auto-fill from authenticated account if available in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user") || localStorage.getItem("userProfile")
      if (stored) {
        const u = JSON.parse(stored)
        if (u.qcId || u.qcid) setQcIdNumber(u.qcId || u.qcid)
        if (u.firstName) setFirstName(u.firstName)
        if (u.middleName) setMiddleName(u.middleName)
        if (u.lastName) setLastName(u.lastName)
        if (u.suffix) setSuffix(u.suffix)
        if (u.nationality) setNationality(u.nationality)
        if (u.phone || u.phoneNumber) setContactNumber(u.phone || u.phoneNumber)
        if (u.email) setEmail(u.email)
        if (u.birthDate) setBirthDate(u.birthDate)
        if (u.age) setAge(String(u.age))
        if (u.gender) setSex(u.gender === "Lalaki" || u.gender === "Male" ? "Male" : "Female")
        if (u.civilStatus) setCivilStatus(u.civilStatus)
        if (u.houseNumber) setHouseNumber(u.houseNumber)
        if (u.streetName) setStreetName(u.streetName)
        if (u.barangay) setBarangay(u.barangay)
      }
    } catch {}
  }, [])

  // Material Step 2 details
  const [materialReason, setMaterialReason] = useState("")

  // Food Step 2 details
  const [householdMembers, setHouseholdMembers] = useState("5")
  const [householdChildren, setHouseholdChildren] = useState("2")
  const [foodReason, setFoodReason] = useState("")

  // Transportation Step 2 details
  const [destination, setDestination] = useState("")
  const [personsTraveling, setPersonsTraveling] = useState("1")
  const [travelDate, setTravelDate] = useState("")
  const [transportationReason, setTransportationReason] = useState("")

  // Step 3: Documents
  const [validIdFiles, setValidIdFiles] = useState<File[]>([])
  const [barangayCertFiles, setBarangayCertFiles] = useState<File[]>([])
  const [supportingDocFiles, setSupportingDocFiles] = useState<File[]>([])
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; file: File } | null>(null)

  // Step 4: Declaration
  const [declarationCertified, setDeclarationCertified] = useState(false)


  // Title strings
  const serviceTitle =
    serviceType === "material"
      ? "Material Assistance"
      : serviceType === "food"
      ? "Food Assistance"
      : "Transportation Assistance"

  // Material choices
  const MATERIAL_CHOICES = [
    "Hygiene Kit",
    "Sleeping Kit",
    "Clothing Assistance",
    "School Supplies",
    "Starter Kit",
    "Assistive Devices",
  ]

  // Reasons for requesting material assistance again
  const MATERIAL_AGAIN_REASONS = [
    "Family Financial Hardship",
    "Loss of Income / Unemployment",
    "Basic Household Needs",
    "Emergency or Unexpected Expenses",
    "Loss or Damage of Essential Items",
    "Natural Disaster / Calamity",
  ]

  // Food choices
  const FOOD_CHOICES = ["Food Pack", "Emergency Food Assistance"]

  // Reasons for requesting food assistance again
  const FOOD_AGAIN_REASONS = [
    "Family Financial Hardship",
    "Loss of Income / Unemployment",
    "Insufficient Food Supply",
    "Emergency or Unexpected Expenses",
    "Large Number of Dependents",
    "Natural Disaster / Calamity",
  ]

  // Transportation choices
  const TRANSPORT_CHOICES = [
    { value: "Balik-Probinsya", label: "Balik-Probinsya" },
    { value: "Medical-related Travel", label: "Medical-related Travel" },
    { value: "Emergency Transportation", label: "Emergency Transportation" },
  ]

  // Check eligibility against backend
  useEffect(() => {
    const checkEligibility = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/aics/applications?qcId=${qcIdNumber}`)
        if (res.ok) {
          const data = await res.json()
          const hasPendingForThisType = (data.applications || []).some(
            (app: any) =>
              app.status === "pending" &&
              app.assistance_type?.toLowerCase().includes(serviceType)
          )
          setIsBlocked(hasPendingForThisType)
        }
      } catch (err) {
        console.warn("AICS Eligibility check offline/skipped:", err)
      }
    }

    if (qcIdNumber) {
      checkEligibility()
    }
  }, [qcIdNumber, serviceType])

  // Auto-redirect to pending status screen after 3 seconds on Step 5
  useEffect(() => {
    if (currentStep !== 5) return

    setRedirectCountdown(3)
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsBlocked(true)
          setCurrentStep(1)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentStep])

  // Reload / Navigation warning protection — active in steps 1, 2, 3, 4
  const isFormDirty = currentStep >= 1 && currentStep <= 4 && !showRequirementsModal

  useEffect(() => {
    if (isFormDirty) {
      ;(window as any).__isFormDirty = true
    } else {
      ;(window as any).__isFormDirty = false
    }
    return () => {
      ;(window as any).__isFormDirty = false
    }
  }, [isFormDirty])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isFormDirty])

  // Validation helpers
  const canProceedStep1 = () => {
    if (!qcResident) return false
    if (serviceType !== "food" && !crisisSituation) return false

    if (serviceType === "material") {
      if (receivedMaterialPrior === "yes") {
        return materialAgainReason !== "" && materialType !== ""
      }
      if (receivedMaterialPrior === "no") {
        return materialType !== ""
      }
      return false
    }
    if (serviceType === "food") {
      if (receivedFoodPrior === "yes") {
        return foodAgainReason !== "" && foodType !== ""
      }
      if (receivedFoodPrior === "no") {
        return foodType !== ""
      }
      return false
    }
    if (serviceType === "transportation") {
      return transportationPurpose !== ""
    }
    return false
  }

  const canProceedStep2 = () => {
    if (serviceType === "material") {
      return Boolean(materialReason.trim())
    }
    if (serviceType === "food") {
      return Boolean(householdMembers.trim() && foodReason.trim())
    }
    if (serviceType === "transportation") {
      return Boolean(
        destination.trim() &&
          personsTraveling.trim() &&
          travelDate.trim() &&
          transportationReason.trim()
      )
    }
    return false
  }

  const canProceedStep3 = () => {
    return (
      barangayCertFiles.length > 0 &&
      validIdFiles.length > 0 &&
      supportingDocFiles.length > 0
    )
  }

  // Handle files selected via file input reliably
  const handleFilesSelected = (
    field: "validId" | "barangayCert" | "supportingDoc",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    const filesArray = Array.from(fileList)
    if (field === "barangayCert") {
      setBarangayCertFiles((prev) => [...prev, ...filesArray])
    } else if (field === "validId") {
      setValidIdFiles((prev) => [...prev, ...filesArray])
    } else if (field === "supportingDoc") {
      setSupportingDocFiles((prev) => [...prev, ...filesArray])
    }
    e.target.value = ""
  }

  // File capture from camera
  const handleCameraCapture = (file: File) => {
    if (cameraTargetField === "validId") {
      setValidIdFiles((prev) => [...prev, file])
    } else if (cameraTargetField === "barangayCert") {
      setBarangayCertFiles((prev) => [...prev, file])
    } else if (cameraTargetField === "supportingDoc") {
      setSupportingDocFiles((prev) => [...prev, file])
    }
    setCameraModalOpen(false)
  }

  const handleRemoveFile = (
    field: "validId" | "barangayCert" | "supportingDoc",
    index: number
  ) => {
    if (field === "validId") {
      setValidIdFiles((prev) => prev.filter((_, i) => i !== index))
    } else if (field === "barangayCert") {
      setBarangayCertFiles((prev) => prev.filter((_, i) => i !== index))
    } else if (field === "supportingDoc") {
      setSupportingDocFiles((prev) => prev.filter((_, i) => i !== index))
    }
  }

  // Form submit handler
  const handleSubmit = async () => {
    if (!declarationCertified || isSubmitting) return

    setIsSubmitting(true)
    const generatedRef = qcIdNumber || "110000116932100"

    try {
      const formData = new FormData()
      formData.append("assistanceType", serviceTitle)
      formData.append("qcId", qcIdNumber)
      formData.append("firstName", firstName)
      formData.append("middleName", middleName)
      formData.append("lastName", lastName)
      formData.append("nationality", "FILIPINO")
      formData.append("birthDate", birthDate)
      formData.append("gender", sex)
      formData.append("phone", contactNumber)
      formData.append("address", completeAddress)

      let detailsObj: Record<string, any> = {
        qcResident,
        crisisSituation,
      }

      if (serviceType === "material") {
        detailsObj = {
          ...detailsObj,
          receivedMaterialPrior,
          materialAgainReason: receivedMaterialPrior === "yes" ? materialAgainReason : undefined,
          materialType,
          reasonForRequest: materialReason,
        }
      } else if (serviceType === "food") {
        detailsObj = {
          ...detailsObj,
          receivedFoodPrior,
          foodAgainReason: receivedFoodPrior === "yes" ? foodAgainReason : undefined,
          foodType,
          householdMembers,
          householdChildren,
          reasonForRequest: foodReason,
        }
      } else if (serviceType === "transportation") {
        detailsObj = {
          ...detailsObj,
          transportationPurpose,
          destination,
          personsTraveling,
          travelDate,
          reasonForRequest: transportationReason,
        }
      }

      formData.append("details", JSON.stringify(detailsObj))

      const uploadedFiles: File[] = []
      const uploadedLabels: string[] = []

      validIdFiles.forEach((f) => {
        uploadedFiles.push(f)
        uploadedLabels.push("Valid Government-Issued ID / QCitizen ID")
      })
      barangayCertFiles.forEach((f) => {
        uploadedFiles.push(f)
        uploadedLabels.push("Barangay Certificate of Indigency / Residency")
      })
      supportingDocFiles.forEach((f) => {
        uploadedFiles.push(f)
        uploadedLabels.push("Supporting Document")
      })

      uploadedFiles.forEach((file) => {
        formData.append("documents", file)
      })
      formData.append("documentLabels", JSON.stringify(uploadedLabels))

      const res = await fetch(`${API_BASE}/api/aics/applications`, {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setReferenceNo(data.application?.reference_no || generatedRef)
      } else {
        setReferenceNo(generatedRef)
      }
    } catch (err) {
      console.warn("Backend unavailable, saving offline reference:", err)
      setReferenceNo(generatedRef)
    } finally {
      // Automatically register to Financial Aid Disbursement
      try {
        const titleFormatted = serviceTitle.includes("Assistance") ? serviceTitle : `${serviceTitle} Assistance`
        const fixedAmt = FIXED_ASSISTANCE_AMOUNTS[titleFormatted] || FIXED_ASSISTANCE_AMOUNTS[serviceTitle] || 1000
        const applicantFullName = `${firstName || "CLARISA MAE"} ${middleName || "GALIAS"} ${lastName || "DIMAL"}`.trim().toUpperCase()

        const newDisbursement = {
          id: `disb-${Date.now()}`,
          disbursementId: `DISB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          applicationRef: generatedRef,
          applicantName: applicantFullName,
          assistanceType: titleFormatted,
          fixedAmount: fixedAmt,
          dateApproved: new Date().toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          status: "PENDING",
          venue: "Quezon City Hall — Social Services Payout Counter",
          remarks: "Awtomatikong pumasok mula sa isinumiteng aplikasyon.",
        }

        const existingRaw = localStorage.getItem("all_financial_disbursements")
        const existingList = existingRaw ? JSON.parse(existingRaw) : []
        const updatedList = [newDisbursement, ...existingList.filter((item: any) => item.applicationRef !== generatedRef)]
        localStorage.setItem("all_financial_disbursements", JSON.stringify(updatedList))
        window.dispatchEvent(new Event("financial_disbursements_updated"))
      } catch (errDisb) {
        console.warn("Could not save auto-disbursement entry:", errDisb)
      }

      setIsSubmitting(false)
      setCurrentStep(5)
    }
  }

  // WIZARD TABS
  const WIZARD_TABS = [
    "COMPLETE CHECKLIST",
    "PERSONAL INFORMATION",
    "SUBMIT DOCUMENTS",
    "REVIEW & SUBMIT",
  ]

  // If blocked
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
            Matagumpay nang naisumite ang inyong aplikasyon para sa <strong>{serviceTitle}</strong>! Maghintay lamang ng pagsusuri o pag-apruba ng Social Worker sa Admin Panel.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 w-full justify-center">
            <a
              href="/portal/my-applications"
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs"
            >
              Tingnan ang Aking Aplikasyon
            </a>
            <a
              href="/portal/dashboard"
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-xs transition-colors"
            >
              Bumalik sa Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (isSubmitting) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-[#3b82f6] animate-spin" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-gray-900">Isinusumite ang Aplikasyon...</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Mangyaring maghintay habang pinoproseso ang inyong aplikasyon.
          </p>
        </div>
      </div>
    )
  }

  if (currentStep === 5) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <Check className="w-8 h-8 text-emerald-600" strokeWidth={3} />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" /> Application Submitted Successfully!
            </span>
            <h2 className="text-2xl font-bold text-gray-900">
              Mabuhay! Ang inyong aplikasyon ay Natanggap Na
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Ang inyong {serviceTitle} application ay matagumpay na naisumite at kasalukuyang sinusuri.
            </p>
          </div>

          {/* Reference Card */}
          <div className="border border-gray-200 rounded-xl p-5 max-w-md mx-auto space-y-2.5 text-left bg-gray-50/60">
            <div className="flex justify-between items-center text-xs text-gray-900 border-b border-gray-200 pb-2">
              <span className="font-semibold text-gray-500">Application Reference No.:</span>
              <span className="font-mono font-bold text-blue-700 text-sm">{referenceNo}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-900">
              <span className="text-gray-500">Service:</span>
              <span className="font-semibold text-gray-900">{serviceTitle}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-900">
              <span className="text-gray-500">Aplikante:</span>
              <span className="font-semibold text-gray-900">
                {[firstName, middleName, lastName, suffix].filter(Boolean).join(" ")}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-900">
              <span className="text-gray-500">Petsa:</span>
              <span className="text-gray-900">
                {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
              </span>
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
      {/* Requirements Modal Popup */}
      {showRequirementsModal && programRequirements && (
        <RequirementsModal
          requirements={programRequirements}
          accepted={reqAccepted}
          onAcceptedChange={setReqAccepted}
          onContinue={() => setShowRequirementsModal(false)}
          showInfoBanner={showInfoBanner}
          onCloseInfoBanner={() => setShowInfoBanner(false)}
          showSlotBanner={showSlotBanner}
          onCloseSlotBanner={() => setShowSlotBanner(false)}
          onClose={onBack}
        />
      )}

      {/* Document Camera Modal */}
      <DocumentCameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        docTitle={
          cameraTargetField === "validId"
            ? "Valid Government ID / QCitizen ID"
            : cameraTargetField === "barangayCert"
            ? "Barangay Certificate"
            : "Supporting Document"
        }
      />

      {/* Main Single Card - Matches Pic 2 Exactly */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white relative">
        {/* Step Indicator Badges and Tab Bars */}
        <div className="flex items-center px-6 pt-6 pb-4">
          {WIZARD_TABS.map((_, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div
                className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i === currentStep - 1
                    ? "bg-[#3b82f6] text-white"
                    : currentStep > i + 1
                    ? "bg-[#3b82f6]/80 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {currentStep > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < WIZARD_TABS.length - 1 && (
                <div className="flex-1 h-px bg-gray-200 mx-2" />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 px-6 pb-4">
          {WIZARD_TABS.map((label, i) => (
            <div
              key={label}
              className={`flex-1 text-center text-xs font-bold py-3 rounded-lg tracking-wide uppercase ${
                i === currentStep - 1
                  ? "bg-[#3b82f6] text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Card Content */}
        <div className="p-6 sm:p-8 space-y-7">
            {/* ================= STEP 1: COMPLETE CHECKLIST ================= */}
            {currentStep === 1 && (
              <>
                <div>
                  <h2 className="text-base font-bold text-gray-900 tracking-wide uppercase">
                    SERVICE AND PRIMARY REQUIREMENTS
                  </h2>
                </div>

                <div className="space-y-4">
                  <CustomCheckbox
                    checked={qcResident}
                    onChange={setQcResident}
                    label="Are you a resident of Quezon City? *"
                  />
                  {serviceType !== "food" && (
                    <CustomCheckbox
                      checked={crisisSituation}
                      onChange={setCrisisSituation}
                      label={`Are you currently experiencing a crisis situation and in need of ${
                        serviceType === "material"
                          ? "material assistance"
                          : "transportation assistance"
                      }? *`}
                    />
                  )}
                </div>

                {/* Material Checklist Questions */}
                {serviceType === "material" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-3">
                        HAVE YOU ALREADY RECEIVED MATERIAL ASSISTANCE? *
                      </p>
                      <div className="flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-2 text-sm text-[#3b82f6] cursor-pointer select-none">
                          <input
                            type="radio"
                            name="receivedMaterial"
                            checked={receivedMaterialPrior === "yes"}
                            onChange={() => {
                              setReceivedMaterialPrior("yes")
                            }}
                            className="h-4 w-4 accent-[#3b82f6]"
                          />
                          Yes, I already received material assistance
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#3b82f6] cursor-pointer select-none">
                          <input
                            type="radio"
                            name="receivedMaterial"
                            checked={receivedMaterialPrior === "no"}
                            onChange={() => {
                              setReceivedMaterialPrior("no")
                              setMaterialAgainReason("")
                            }}
                            className="h-4 w-4 accent-[#3b82f6]"
                          />
                          Not yet
                        </label>
                      </div>
                    </div>

                    {/* Kapag YES -> Reason for requesting material assistance again */}
                    {receivedMaterialPrior === "yes" && (
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          REASON FOR REQUESTING MATERIAL ASSISTANCE AGAIN? *
                        </label>
                        <div className="relative">
                          <select
                            value={materialAgainReason}
                            onChange={(e) => setMaterialAgainReason(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                          >
                            <option value="" disabled>
                              Select reason
                            </option>
                            {MATERIAL_AGAIN_REASONS.map((choice) => (
                              <option key={choice} value={choice}>
                                {choice}
                              </option>
                            ))}
                          </select>
                        </div>

                        {materialAgainReason && (
                          <div className="flex items-center gap-2 pt-1 text-xs text-blue-700 font-medium">
                            <span className="text-gray-500">Selected Reason:</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs">
                              {materialAgainReason}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SELECT TYPE OF MATERIAL ASSISTANCE:
                        Diretso kapag "Not yet", o kapag "Yes" at nakapili na ng reason */}
                    {(receivedMaterialPrior === "no" || (receivedMaterialPrior === "yes" && materialAgainReason !== "")) && (
                      <div className="pt-2 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 mb-2 tracking-wide uppercase">
                          SELECT TYPE OF MATERIAL ASSISTANCE *
                        </h3>
                        <div className="relative">
                          <select
                            value={materialType}
                            onChange={(e) => setMaterialType(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                          >
                            <option value="" disabled>
                              Select Material Assistance
                            </option>
                            {MATERIAL_CHOICES.map((choice) => (
                              <option key={choice} value={choice}>
                                {choice}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                          Note: Ang actual assistance ay dapat pa ring dumaan sa assessment ng
                          social worker; hindi ibig sabihin na automatic na makukuha ang napiling item.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Food Checklist Questions */}
                {serviceType === "food" && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-3">
                        HAVE YOU ALREADY RECEIVED FOOD ASSISTANCE? *
                      </p>
                      <div className="flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-2 text-sm text-[#3b82f6] cursor-pointer select-none">
                          <input
                            type="radio"
                            name="receivedFood"
                            checked={receivedFoodPrior === "yes"}
                            onChange={() => {
                              setReceivedFoodPrior("yes")
                            }}
                            className="h-4 w-4 accent-[#3b82f6]"
                          />
                          Yes, I already received food assistance
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#3b82f6] cursor-pointer select-none">
                          <input
                            type="radio"
                            name="receivedFood"
                            checked={receivedFoodPrior === "no"}
                            onChange={() => {
                              setReceivedFoodPrior("no")
                              setFoodAgainReason("")
                            }}
                            className="h-4 w-4 accent-[#3b82f6]"
                          />
                          Not yet
                        </label>
                      </div>
                    </div>

                    {/* Kapag YES -> Reason for requesting food assistance again */}
                    {receivedFoodPrior === "yes" && (
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          REASON FOR REQUESTING FOOD ASSISTANCE AGAIN? *
                        </label>
                        <div className="relative">
                          <select
                            value={foodAgainReason}
                            onChange={(e) => setFoodAgainReason(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                          >
                            <option value="" disabled>
                              Select reason
                            </option>
                            {FOOD_AGAIN_REASONS.map((choice) => (
                              <option key={choice} value={choice}>
                                {choice}
                              </option>
                            ))}
                          </select>
                        </div>

                        {foodAgainReason && (
                          <div className="flex items-center gap-2 pt-1 text-xs text-blue-700 font-medium">
                            <span className="text-gray-500">Selected Reason:</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs">
                              {foodAgainReason}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SELECT TYPE OF FOOD ASSISTANCE */}
                    {(receivedFoodPrior === "no" || (receivedFoodPrior === "yes" && foodAgainReason !== "")) && (
                      <div className="pt-4 border-t border-gray-100 space-y-2">
                        <h3 className="text-sm font-bold text-gray-900 tracking-wide uppercase">
                          SELECT TYPE OF FOOD ASSISTANCE *
                        </h3>
                        <div className="relative">
                          <select
                            value={foodType}
                            onChange={(e) => setFoodType(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                          >
                            <option value="" disabled>
                              Select assistance type
                            </option>
                            {FOOD_CHOICES.map((choice) => (
                              <option key={choice} value={choice}>
                                {choice}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Transportation Checklist Questions */}
                {serviceType === "transportation" && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2 tracking-wide uppercase">
                      SELECT PURPOSE OF TRANSPORTATION *
                    </h3>
                    <div className="relative">
                      <select
                        value={transportationPurpose}
                        onChange={(e) => setTransportationPurpose(e.target.value)}
                        className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                      >
                        <option value="" disabled>
                          Select Purpose
                        </option>
                        {TRANSPORT_CHOICES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 1 Next Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={!canProceedStep1()}
                    onClick={() => setCurrentStep(2)}
                    className={`px-6 h-10 rounded-lg text-sm font-semibold transition-all ${
                      canProceedStep1()
                        ? "bg-[#3b82f6] text-white hover:opacity-90 cursor-pointer shadow-sm"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    NEXT
                  </button>
                </div>
              </>
            )}

            {/* ================= STEP 2: PERSONAL INFORMATION ================= */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-600">IMPORTANT REMINDER</p>
                    <p className="text-blue-600/90 mt-0.5">
                      Please make sure the information on your QCID is correct and complete. If any detail is missing or incorrect, contact the QCID Team to update your QCID records before continuing your application. Accurate information is important for fast and smooth processing of your service.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="QC ID *" full>
                    <input value={qcIdNumber} disabled className={disabledInputCls} />
                  </Field>

                  <Field label="First name *">
                    <input value={firstName} disabled className={disabledInputCls} placeholder="First name" />
                  </Field>
                  <Field label="Middle name">
                    <input value={middleName} disabled className={disabledInputCls} placeholder="Middle name" />
                  </Field>
                  <Field label="Last name *">
                    <input value={lastName} disabled className={disabledInputCls} placeholder="Last name" />
                  </Field>

                  <Field label="Suffix (Jr., Sr., III, etc.)">
                    <input value={suffix} disabled className={disabledInputCls} placeholder="Suffix (Jr., Sr., III, etc.)" />
                  </Field>
                  <Field label="Nationality *">
                    <input value={nationality} disabled className={disabledInputCls} placeholder="Nationality" />
                  </Field>
                  <Field label="Date of birth *">
                    <input value={birthDate} disabled className={disabledInputCls} />
                  </Field>

                  <Field label="Age *">
                    <input value={age} disabled className={disabledInputCls} placeholder="Age" inputMode="numeric" />
                  </Field>
                  <Field label="Gender *">
                    <select value={sex} disabled className={disabledInputCls}>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </Field>
                  <Field label="Civil status *">
                    <select value={civilStatus} disabled className={disabledInputCls}>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                    </select>
                  </Field>

                  <Field label="House/Building number *">
                    <input value={houseNumber} disabled autoComplete="off" className={disabledInputCls} placeholder="House/Building number" />
                  </Field>
                  <Field label="Street name *">
                    <input value={streetName} disabled autoComplete="off" className={disabledInputCls} placeholder="Street name" />
                  </Field>
                  <Field label="Barangay *">
                    <input value={barangay} disabled autoComplete="off" className={disabledInputCls} placeholder="Barangay" />
                  </Field>

                  <Field label="Phone number *">
                    <input value={contactNumber} disabled className={disabledInputCls} placeholder="0900 000 0000" />
                  </Field>
                  <Field label="Email *" full>
                    <input type="email" value={email} disabled className={disabledInputCls} placeholder="email@example.com" />
                  </Field>
                </div>

                {/* Sub-sections per assistance type */}
                {serviceType === "material" && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="text-base font-bold text-gray-900 tracking-wide uppercase">
                      ASSISTANCE DETAILS
                    </h3>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Reason for Request *
                      </label>
                      <textarea
                        rows={3}
                        value={materialReason}
                        onChange={(e) => setMaterialReason(e.target.value)}
                        placeholder="Briefly explain why you need material assistance..."
                        className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                      />
                    </div>
                  </div>
                )}

                {serviceType === "food" && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="text-base font-bold text-gray-900 tracking-wide uppercase">
                      HOUSEHOLD INFORMATION
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Number of Household Members *">
                        <input
                          type="number"
                          min="1"
                          value={householdMembers}
                          onChange={(e) => setHouseholdMembers(e.target.value)}
                          placeholder="Enter Number"
                          className={editableInputCls}
                        />
                      </Field>
                      <Field label="Number of Children">
                        <input
                          type="number"
                          min="0"
                          value={householdChildren}
                          onChange={(e) => setHouseholdChildren(e.target.value)}
                          placeholder="Enter Number"
                          className={editableInputCls}
                        />
                      </Field>
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        REASON FOR REQUEST *
                      </label>
                      <textarea
                        rows={3}
                        value={foodReason}
                        onChange={(e) => setFoodReason(e.target.value)}
                        placeholder="Briefly explain why you need food assistance..."
                        className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                      />
                    </div>
                  </div>
                )}

                {serviceType === "transportation" && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="text-base font-bold text-gray-900 tracking-wide uppercase">
                      TRAVEL INFORMATION
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Destination *">
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          placeholder="Enter Destination"
                          className={editableInputCls}
                        />
                      </Field>

                      <Field label="Number of Persons Traveling *">
                        <input
                          type="number"
                          min="1"
                          value={personsTraveling}
                          onChange={(e) => setPersonsTraveling(e.target.value)}
                          placeholder="Enter Number"
                          className={editableInputCls}
                        />
                      </Field>

                      <Field label="Preferred Travel Date *">
                        <input
                          type="date"
                          value={travelDate}
                          onChange={(e) => setTravelDate(e.target.value)}
                          className={editableInputCls}
                        />
                      </Field>
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        REASON FOR REQUEST *
                      </label>
                      <textarea
                        rows={3}
                        value={transportationReason}
                        onChange={(e) => setTransportationReason(e.target.value)}
                        placeholder="Briefly explain why you need transportation assistance..."
                        className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#3b82f6]/40 focus:border-[#3b82f6]"
                      />
                    </div>
                  </div>
                )}

                {/* Back and Next */}
                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 h-10 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    BACK
                  </button>
                  <button
                    type="button"
                    disabled={!canProceedStep2()}
                    onClick={() => setCurrentStep(3)}
                    className={`px-6 h-10 rounded-lg text-sm font-semibold transition-all ${
                      canProceedStep2()
                        ? "bg-[#3b82f6] text-white hover:opacity-90 cursor-pointer shadow-sm"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    NEXT
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: SUBMIT DOCUMENTS ================= */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {t("fileUploadHeader") || "File upload"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                    {t("fileUploadDesc1") || "Make sure to upload the appropriate documents for each category and verify that all details—such as your full name (first, middle, and last name) and address—match the information on your QC ID."}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                    {t("fileUploadDesc2") || 'Click the "Sample Document" button above each file upload to see a sample file and make sure your upload matches the required format.'}
                  </p>
                </div>

                {/* Document 1: Barangay Certificate */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSampleDocOpen("BARANGAY CERTIFICATE OF INDIGENCY / RESIDENCY")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b82f6] hover:underline cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    SAMPLE DOCUMENT
                  </button>

                  <div
                    className={`border rounded-lg px-4 py-4 space-y-3 transition-colors ${
                      barangayCertFiles.length > 0
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-dashed border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      BARANGAY CERTIFICATE OF INDIGENCY / RESIDENCY *
                      {barangayCertFiles.length > 0 && (
                        <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 shrink-0 text-white">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      Allowed file types: JPG, JPEG, PNG, WEBP
                    </p>

                    <input
                      type="file"
                      id="upload-barangay-cert"
                      accept=".jpg,.jpeg,.png,.webp,image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => handleFilesSelected("barangayCert", e)}
                    />

                    <div className="flex flex-wrap items-center gap-2.5">
                      <label
                        htmlFor="upload-barangay-cert"
                        className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-[#3b82f6] text-white text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity shadow-xs select-none"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        UPLOAD PHOTO
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCameraTargetField("barangayCert")
                          setCameraModalOpen(true)
                        }}
                        className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        KUMUHA NG LARAWAN (CAMERA)
                      </button>
                    </div>

                    {barangayCertFiles.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-3">
                        {barangayCertFiles.map((file, i) => (
                          <div
                            key={`${file.name}-${i}`}
                            className="relative w-40 border border-border rounded-lg bg-white p-3 flex flex-col items-center text-center shadow-xs"
                          >
                            <button
                              type="button"
                              onClick={() => handleRemoveFile("barangayCert", i)}
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="h-12 w-12 rounded-md overflow-hidden border border-border mb-2 flex items-center justify-center bg-gray-50">
                              <FileThumbnail file={file} className="h-full w-full object-cover" />
                            </div>
                            <p className="text-xs font-medium text-gray-800 truncate w-full">{file.name}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Document 2: QCitizen ID / Valid Government-Issued ID */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSampleDocOpen("QCITIZEN ID O VALID GOVERNMENT-ISSUED ID")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b82f6] hover:underline cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    SAMPLE DOCUMENT
                  </button>

                  <div
                    className={`border rounded-lg px-4 py-4 space-y-3 transition-colors ${
                      validIdFiles.length > 0
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-dashed border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      QCITIZEN ID O VALID GOVERNMENT-ISSUED ID *
                      {validIdFiles.length > 0 && (
                        <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 shrink-0 text-white">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      Allowed file types: JPG, JPEG, PNG, WEBP
                    </p>

                    <input
                      type="file"
                      id="upload-valid-id"
                      accept=".jpg,.jpeg,.png,.webp,image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => handleFilesSelected("validId", e)}
                    />

                    <div className="flex flex-wrap items-center gap-2.5">
                      <label
                        htmlFor="upload-valid-id"
                        className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-[#3b82f6] text-white text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity shadow-xs select-none"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        UPLOAD PHOTO
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCameraTargetField("validId")
                          setCameraModalOpen(true)
                        }}
                        className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        KUMUHA NG LARAWAN (CAMERA)
                      </button>
                    </div>

                    {validIdFiles.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-3">
                        {validIdFiles.map((file, i) => (
                          <div
                            key={`${file.name}-${i}`}
                            className="relative w-40 border border-border rounded-lg bg-white p-3 flex flex-col items-center text-center shadow-xs"
                          >
                            <button
                              type="button"
                              onClick={() => handleRemoveFile("validId", i)}
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="h-12 w-12 rounded-md overflow-hidden border border-border mb-2 flex items-center justify-center bg-gray-50">
                              <FileThumbnail file={file} className="h-full w-full object-cover" />
                            </div>
                            <p className="text-xs font-medium text-gray-800 truncate w-full">{file.name}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Document 3: Supporting Document (Kung Applicable) */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSampleDocOpen("SUPPORTING DOCUMENT")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b82f6] hover:underline cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    SAMPLE DOCUMENT
                  </button>

                  <div
                    className={`border rounded-lg px-4 py-4 space-y-3 transition-colors ${
                      supportingDocFiles.length > 0
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-dashed border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      SUPPORTING DOCUMENT *
                      {supportingDocFiles.length > 0 && (
                        <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 shrink-0 text-white">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      Allowed file types: JPG, JPEG, PNG, WEBP
                    </p>

                    <input
                      type="file"
                      id="upload-supporting-doc"
                      accept=".jpg,.jpeg,.png,.webp,image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => handleFilesSelected("supportingDoc", e)}
                    />

                    <div className="flex flex-wrap items-center gap-2.5">
                      <label
                        htmlFor="upload-supporting-doc"
                        className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-[#3b82f6] text-white text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity shadow-xs select-none"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        UPLOAD PHOTO
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCameraTargetField("supportingDoc")
                          setCameraModalOpen(true)
                        }}
                        className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        KUMUHA NG LARAWAN (CAMERA)
                      </button>
                    </div>

                    {supportingDocFiles.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-3">
                        {supportingDocFiles.map((file, i) => (
                          <div
                            key={`${file.name}-${i}`}
                            className="relative w-40 border border-border rounded-lg bg-white p-3 flex flex-col items-center text-center shadow-xs"
                          >
                            <button
                              type="button"
                              onClick={() => handleRemoveFile("supportingDoc", i)}
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="h-12 w-12 rounded-md overflow-hidden border border-border mb-2 flex items-center justify-center bg-gray-50">
                              <FileThumbnail file={file} className="h-full w-full object-cover" />
                            </div>
                            <p className="text-xs font-medium text-gray-800 truncate w-full">{file.name}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Back and Next */}
                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 h-10 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    BACK
                  </button>
                  <button
                    type="button"
                    disabled={!canProceedStep3()}
                    onClick={() => setCurrentStep(4)}
                    className={`px-6 h-10 rounded-lg text-sm font-semibold transition-all ${
                      canProceedStep3()
                        ? "bg-[#3b82f6] text-white hover:opacity-90 cursor-pointer shadow-sm"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    NEXT
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 4: REVIEW & SUBMIT ================= */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {(t("pwdReviewHeader") || "REVIEW APPLICATION").toUpperCase()}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t("pwdReviewDesc") || "Pakisuri nang mabuti ang lahat ng impormasyon at uploaded documents bago isumite ang aplikasyon."}
                  </p>
                </div>

                {/* Section 1: Requirements */}
                <ReviewSection title="Requirements" onEdit={() => setCurrentStep(1)}>
                  <div className="divide-y divide-gray-100">
                    <ReviewCheckItem
                      ok={qcResident}
                      label="Are you a legitimate resident of Quezon City?"
                    />
                    {serviceType !== "food" && (
                      <ReviewCheckItem
                        ok={crisisSituation}
                        label={`Are you currently experiencing a crisis situation and in need of ${
                          serviceType === "material" ? "material assistance" : "transportation assistance"
                        }?`}
                      />
                    )}
                    {serviceType === "material" && (
                      <>
                        <ReviewCheckItem
                          ok={true}
                          label={
                            <span>
                              Have you already received material assistance from Quezon City?{" "}
                              <strong className="font-semibold text-gray-900">
                                {receivedMaterialPrior === "yes"
                                  ? "Yes, I already received material assistance"
                                  : "Not yet"}
                              </strong>
                            </span>
                          }
                        />
                        {receivedMaterialPrior === "yes" && materialAgainReason && (
                          <ReviewCheckItem
                            bullet
                            label={
                              <span>
                                Reason for requesting material assistance again:{" "}
                                <strong className="font-semibold text-[#3b82f6]">
                                  {materialAgainReason}
                                </strong>
                              </span>
                            }
                          />
                        )}
                        <ReviewCheckItem
                          bullet
                          label={
                            <span>
                              Type of assistance:{" "}
                              <strong className="font-semibold text-[#3b82f6]">
                                {materialType}
                              </strong>
                            </span>
                          }
                        />
                      </>
                    )}
                    {serviceType === "food" && (
                      <>
                        <ReviewCheckItem
                          ok={true}
                          label={
                            <span>
                              Have you already received food assistance?{" "}
                              <strong className="font-semibold text-gray-900">
                                {receivedFoodPrior === "yes"
                                  ? "Yes, I already received food assistance"
                                  : "Not yet"}
                              </strong>
                            </span>
                          }
                        />
                        {receivedFoodPrior === "yes" && foodAgainReason && (
                          <ReviewCheckItem
                            bullet
                            label={
                              <span>
                                Reason for requesting food assistance again:{" "}
                                <strong className="font-semibold text-[#3b82f6]">
                                  {foodAgainReason}
                                </strong>
                              </span>
                            }
                          />
                        )}
                        <ReviewCheckItem
                          bullet
                          label={
                            <span>
                              Type of assistance:{" "}
                              <strong className="font-semibold text-[#3b82f6]">
                                {foodType}
                              </strong>
                            </span>
                          }
                        />
                      </>
                    )}
                    {serviceType === "transportation" && (
                      <ReviewCheckItem
                        bullet
                        label={
                          <span>
                            Purpose of transportation:{" "}
                            <strong className="font-semibold text-[#3b82f6]">
                              {transportationPurpose}
                            </strong>
                          </span>
                        }
                      />
                    )}
                  </div>
                </ReviewSection>

                {/* Section 2: Personal Information */}
                <ReviewSection title="Personal Information" onEdit={() => setCurrentStep(2)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-5 text-xs sm:text-sm">
                    <ReviewField label="QC ID NUMBER" value={qcIdNumber} />
                    <ReviewField
                      label="FULL NAME"
                      value={`${firstName} ${middleName ? middleName + " " : ""}${lastName}${suffix ? " " + suffix : ""}`}
                    />
                    <ReviewField label="NATIONALITY" value={nationality} />
                    <ReviewField label="DATE OF BIRTH" value={birthDate} />
                    <ReviewField label="AGE" value={age} />
                    <ReviewField label="GENDER" value={sex} />
                    <ReviewField label="CIVIL STATUS" value={civilStatus} />
                    <ReviewField label="COMPLETE ADDRESS" value={completeAddress} />
                    <ReviewField label="PHONE NUMBER" value={contactNumber} />
                    <ReviewField label="EMAIL" value={email} />

                    {serviceType === "material" && (
                      <div className="sm:col-span-2 pt-3 border-t border-gray-100">
                        <ReviewField label="REASON FOR REQUEST" value={materialReason} />
                      </div>
                    )}

                    {serviceType === "food" && (
                      <>
                        <div className="sm:col-span-2 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <ReviewField label="NUMBER OF HOUSEHOLD MEMBERS" value={householdMembers} />
                          <ReviewField label="NUMBER OF CHILDREN (0-17)" value={householdChildren || "0"} />
                        </div>
                        <div className="sm:col-span-2">
                          <ReviewField label="REASON FOR REQUEST" value={foodReason} />
                        </div>
                      </>
                    )}

                    {serviceType === "transportation" && (
                      <div className="sm:col-span-2 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ReviewField label="DESTINATION" value={destination} />
                        <ReviewField label="PERSONS TRAVELING" value={personsTraveling} />
                        <ReviewField label="TRAVEL DATE" value={travelDate} />
                        <ReviewField label="REASON FOR REQUEST" value={transportationReason} />
                      </div>
                    )}
                  </div>
                </ReviewSection>

                {/* Section 3: Required Documents */}
                <ReviewSection title="Required Documents" onEdit={() => setCurrentStep(3)}>
                  <div className="p-5 space-y-6">
                    {[
                      {
                        name: "BARANGAY CERTIFICATE OF INDIGENCY / RESIDENCY",
                        files: barangayCertFiles,
                        required: true,
                      },
                      {
                        name: "QCITIZEN ID O VALID GOVERNMENT-ISSUED ID",
                        files: validIdFiles,
                        required: true,
                      },
                      ...(supportingDocFiles.length > 0
                        ? [
                            {
                              name: "SUPPORTING DOCUMENT",
                              files: supportingDocFiles,
                              required: false,
                            },
                          ]
                        : []),
                    ].map((doc) => {
                      const uploaded = doc.files.length > 0
                      return (
                        <div key={doc.name}>
                          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            {doc.name} {doc.required && "*"}
                            {uploaded && (
                              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 shrink-0">
                                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                              </span>
                            )}
                          </p>

                          {uploaded ? (
                            <div className="mt-2 space-y-2">
                              {doc.files.map((file, i) => (
                                <button
                                  key={`${file.name}-${i}`}
                                  type="button"
                                  onClick={() => setPreviewDocModal({ title: doc.name, file })}
                                  className="w-full max-w-md border border-border hover:border-blue-400 rounded-lg overflow-hidden text-left bg-white cursor-pointer transition-colors shadow-xs"
                                >
                                  <div className="h-28 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                    <FileThumbnail file={file} className="h-full w-full object-cover" />
                                  </div>
                                  <div className="px-3 py-2 text-center border-t border-border bg-white">
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                      {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-red-500 mt-1">Walang nai-upload na dokumento</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </ReviewSection>

                {/* Important Notice */}
                <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Ang lahat ng impormasyon at dokumentong inyong isinumite ay susuriin ng Social Worker alinsunod sa mga patakaran ng Quezon City Government.
                  </p>
                </div>

                {/* Declaration */}
                <div className="pt-2">
                  <CustomCheckbox
                    checked={declarationCertified}
                    onChange={setDeclarationCertified}
                    label={
                      <span className="font-semibold text-gray-900">
                        I certify that the information provided is true and correct. *
                      </span>
                    }
                  />
                </div>

                {/* Back and Submit Application */}
                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-6 h-10 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    ← GO BACK &amp; EDIT
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={!declarationCertified || isSubmitting}
                    className={`px-6 h-10 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                      declarationCertified && !isSubmitting
                        ? "bg-[#3b82f6] text-white hover:opacity-90 cursor-pointer shadow-sm"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    SUBMIT APPLICATION
                  </button>
                </div>
              </div>
            )}
          </div>

        {/* 🔔 CONFIRMATION DIALOG / MODAL BEFORE SUBMIT */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-gray-200 text-left"
            >
              {/* Modal Header */}
              <div className="p-6 pb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Review Before Submission</h3>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    Please make sure that all information and uploaded documents are correct. You can still go back and make changes before submitting.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Footer Buttons */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-white transition-colors cursor-pointer"
                >
                  ← GO BACK &amp; EDIT
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false)
                    handleSubmit()
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#3b82f6] hover:opacity-90 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <span>YES, SUBMIT APPLICATION</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sample Document Modal */}
        {sampleDocOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
              <div className="p-6 pb-4 border-b border-gray-200 shrink-0 flex items-center justify-between">
                <h2 className="text-lg font-heading font-semibold text-gray-900">
                  Sample Document: {sampleDocOpen}
                </h2>
                <button
                  type="button"
                  onClick={() => setSampleDocOpen(null)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex items-center justify-center bg-gray-50">
                <img
                  src={SAMPLE_DOC_IMAGES[sampleDocOpen] || "/samples/BARANGAY CERTIFICATE OF INDIGENCY.jpg"}
                  alt={sampleDocOpen}
                  className="max-h-[60vh] rounded-lg border border-gray-200 object-contain shadow-xs"
                />
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSampleDocOpen(null)}
                  className="px-6 h-10 rounded-xl bg-[#3b82f6] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Modal */}
        <DocumentCameraModal
          isOpen={cameraModalOpen}
          onClose={() => {
            setCameraModalOpen(false)
            setCameraTargetField("")
          }}
          docTitle={
            cameraTargetField === "barangayCert"
              ? "BARANGAY CERTIFICATE OF INDIGENCY / RESIDENCY"
              : cameraTargetField === "validId"
              ? "QCITIZEN ID O VALID GOVERNMENT-ISSUED ID"
              : "SUPPORTING DOCUMENT"
          }
          onCapture={(file) => {
            handleCameraCapture(file)
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
    </div>
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

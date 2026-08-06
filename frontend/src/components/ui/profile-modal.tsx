import { useState } from "react"
import { X, ShieldCheck, AlertTriangle, CheckCircle2, IdCard, Eye, EyeOff } from "lucide-react"

interface ProfileModalProps {
  open: boolean
  onClose: () => void
  name: string
  email: string
  role: string
  qcidNo?: string
  registeredVia?: string
}

interface FormData {
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  birthMonth: string
  birthDay: string
  birthYear: string
  city: string
  houseNo: string
  street: string
  barangay: string
  workingInCity: boolean
  occupation: string
  sex: string
  mobileNumber: string
}

export function ProfileModal({
  open,
  onClose,
  name,
  email,
  role,
  qcidNo = "11000001169321",
  registeredVia = "Email / Password",
}: ProfileModalProps) {
  const [tab, setTab] = useState<"account" | "personal">("account")
  const [showQcid, setShowQcid] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    firstName: "CLARISA MAE",
    middleName: "GALIAS",
    lastName: "DIMAL",
    suffix: "",
    birthMonth: "OCTOBER",
    birthDay: "29",
    birthYear: "2004",
    city: "QUEZON CITY",
    houseNo: "11",
    street: "SAMPALOC STREET",
    barangay: "SAUYO",
    workingInCity: false,
    occupation: "",
    sex: "FEMALE",
    mobileNumber: "0900 000 0000",
  })

  if (!open) return null

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDeactivate = () => {
    const confirmed = window.confirm(
      "Deactivating your account is a permanent action. All your data will be removed and you will lose access to the portal. Continue?"
    )
    if (confirmed) {
      console.log("Account deactivated")
    }
  }

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Deleting your account cannot be undone. All your data will be permanently removed. Continue?"
    )
    if (confirmed) {
      console.log("Account deleted")
    }
  }

  const handleUpdateProfile = () => {
    console.log("Profile updated:", formData)
    // TODO: hook up to real update-profile API call
    alert("Profile updated successfully!")
  }

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  const maskQcid = (value: string) => {
    // keep the last 4 digits visible, mask the rest, preserving spacing groups of 5
    const visibleCount = 4
    const masked = value
      .split("")
      .map((char, idx) =>
        idx < value.length - visibleCount && /\d/.test(char) ? "•" : char
      )
      .join("")
    return masked.replace(/(.{5})/g, "$1 ").trim()
  }

  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Greeting + QCID Section */}
        <div className="px-8 pt-6 pb-4">
          <h2 className="text-xl font-bold text-gray-900">Hi, {name}!</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <IdCard className="h-4 w-4 text-gray-500 shrink-0" />
            <span className="text-sm text-gray-600">
              QCID No:{" "}
              <span className="font-semibold text-gray-800 tracking-wide">
                {showQcid ? qcidNo : maskQcid(qcidNo)}
              </span>
            </span>
            <button
              onClick={() => setShowQcid((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-900 text-white px-3 py-1.5 rounded-md hover:bg-blue-800 transition-colors"
            >
              {showQcid ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {showQcid ? "Hide QCID" : "View QCID"}
            </button>
          </div>
        </div>

        {/* Header Banner */}
        <div className="bg-linear-to-r from-blue-600 to-blue-500 px-8 py-8 flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-blue-400/30 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-2xl truncate">{name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <ShieldCheck className="h-4 w-4 text-blue-100" />
              <span className="inline-flex items-center gap-1 text-sm font-medium bg-blue-400/30 text-blue-50 px-3 py-1 rounded-full">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-8 pt-0">
          <button
            onClick={() => setTab("account")}
            className={`py-4 px-0 text-sm font-semibold border-b-2 transition-colors ${
              tab === "account"
                ? "border-blue-600 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Account Information
          </button>
          <button
            onClick={() => setTab("personal")}
            className={`py-4 px-6 text-sm font-semibold border-b-2 transition-colors ${
              tab === "personal"
                ? "border-blue-600 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Personal Information
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {tab === "account" && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2.5 block uppercase tracking-wide">
                  Email Address
                </label>
                <div className="w-full rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-800 font-medium flex items-center justify-between">
                  <span>{email}</span>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2.5 block uppercase tracking-wide">
                  Role
                </label>
                <div className="w-full rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-800 font-medium">
                  {role}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2.5 block uppercase tracking-wide">
                  Registered Via
                </label>
                <div className="w-full rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-800 font-medium">
                  {registeredVia}
                </div>
              </div>
            </div>
          )}

          {tab === "personal" && (
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Full Name</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      First Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      Middle Name (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.middleName}
                        onChange={(e) =>
                          handleInputChange("middleName", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      Last Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      Suffix
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.suffix}
                        onChange={(e) =>
                          handleInputChange("suffix", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Birth Date */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Birth Date</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      Month
                    </label>
                    <div className="relative">
                      <select
                        value={formData.birthMonth}
                        onChange={(e) =>
                          handleInputChange("birthMonth", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      Day
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.birthDay}
                        onChange={(e) =>
                          handleInputChange("birthDay", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      Year
                    </label>
                    <div className="relative">
                      <select
                        value={formData.birthYear}
                        onChange={(e) =>
                          handleInputChange("birthYear", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Address</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      City
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      House No. (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.houseNo}
                        onChange={(e) =>
                          handleInputChange("houseNo", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      Street
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) =>
                          handleInputChange("street", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      Barangay
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.barangay}
                        onChange={(e) =>
                          handleInputChange("barangay", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">
                  Employment Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-3 block">
                      Are you working in Quezon City?
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="working"
                          checked={formData.workingInCity === true}
                          onChange={() =>
                            handleInputChange("workingInCity", true)
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="working"
                          checked={formData.workingInCity === false}
                          onChange={() =>
                            handleInputChange("workingInCity", false)
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) =>
                        handleInputChange("occupation", e.target.value)
                      }
                      placeholder="Enter your occupation"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Sex */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">
                  Sex
                </label>
                <div className="relative">
                  <select
                    value={formData.sex}
                    onChange={(e) => handleInputChange("sex", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                  <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500 pointer-events-none" />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">
                  Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) =>
                      handleInputChange("mobileNumber", e.target.value)
                    }
                    className="w-full border-2 border-blue-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="flex-1 h-11 rounded-lg border-2 border-blue-600 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  className="flex-1 h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Update Profile
                </button>
              </div>
            </div>
          )}

          {/* Danger Zone - shown on both Account and Personal tabs */}
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-bold text-red-700">Danger Zone</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Deactivating your account is a permanent action. All your data
              will be removed and you will lose access to the portal.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeactivate}
                className="flex-1 h-11 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors active:scale-95"
              >
                Deactivate Account
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-11 rounded-lg border-2 border-red-600 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors active:scale-95"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
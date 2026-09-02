import { useState } from "react"
import { X, User, AlertTriangle, IdCard, Eye, EyeOff, Languages, Check, Camera } from "lucide-react"
import { useLanguage, type Language } from "./language-context"

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

const initialFormData: FormData = {
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
}

import { getSavedProfilePhoto, saveProfilePhoto } from "../../utils/profilePhoto"

export function ProfileModal({
  open,
  onClose,
  name,
  email,
  qcidNo = "110000116932100",
  registeredVia = "Email / Password",
}: ProfileModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => getSavedProfilePhoto(qcidNo))
  const [tab, setTab] = useState<"account" | "personal" | "preferences">("account")
  const [showQcid, setShowQcid] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const { language, setLanguage, t } = useLanguage()

  const languageOptions: { value: Language; label: string }[] = [
    { value: "en", label: t("english") },
    { value: "tl", label: t("tagalog") },
    { value: "bis", label: t("bisaya") },
  ]
  const [isEditing, setIsEditing] = useState(false)
  const [savedFormData, setSavedFormData] = useState<FormData>(initialFormData)

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Pumili lang ng image file (JPG, PNG, atbp).")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Masyadong malaki ang file. 2MB pababa lang ang pwede.")
      return
    }

    const reader = new FileReader()
        reader.onload = () => {
      const dataUrl = reader.result as string
      setPhotoUrl(dataUrl)
      try {
        saveProfilePhoto(dataUrl, qcidNo)
      } catch (err) {
        console.error("Hindi na-save ang photo sa localStorage:", err)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleStartEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setFormData(savedFormData)
    setIsEditing(false)
  }

  // Shared classes for personal-info fields: locked/greyed out until
  // "Edit Profile" is clicked, editable (white bg, blue focus ring) after.
  const fieldClass = (extra = "") =>
    `w-full border rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isEditing
        ? `border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${extra}`
        : "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
    }`

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
    setSavedFormData(formData)
    setIsEditing(false)
    alert(t("profileUpdatedSuccess"))
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

  // Full display name built from the last SAVED form fields only.
  // Falls back to the `name` prop if the fields are somehow empty.
  // Uses savedFormData (not formData) so it does NOT update live while typing —
  // it only reflects changes after "Update Profile" is clicked.
  const displayName =
    [
      savedFormData.firstName,
      savedFormData.middleName,
      savedFormData.lastName,
      savedFormData.suffix,
    ]
      .filter((part) => part && part.trim().length > 0)
      .join(" ") || name

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
        </button>        {/* Greeting + QCID Section */}
        <div className="px-8 pt-6 pb-4">
          <h2 className="text-xl font-bold text-gray-900">{t("hiUser", { name: displayName })}</h2>
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              {showQcid ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {showQcid ? t("hideQcid") : t("viewQcid")}
            </button>
          </div>
        </div>

        {/* Header Banner */}
        <div className="bg-slate-900 px-8 py-6 flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 group">
            <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-7 w-7 text-gray-400" />
              )}
            </div>
            <label
              htmlFor="profile-photo-upload"
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              aria-label="Palitan ang profile photo"
            >
              <Camera className="h-5 w-5 text-white" />
            </label>
            <input
              id="profile-photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-xl truncate">{displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-300">{t("statusLabel")}</span>
              <span className="inline-flex items-center text-xs font-semibold bg-green-500 text-white px-3 py-1 rounded-full">
                {t("statusActive")}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-8 border-b border-gray-200 px-8 pt-0">
          <button
            onClick={() => setTab("account")}
            className={`py-4 px-0 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === "account"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("accountInformation")}
          </button>
          <button
            onClick={() => setTab("personal")}
            className={`py-4 px-0 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === "personal"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("personalInformation")}
          </button>
          <button
            onClick={() => setTab("preferences")}
            className={`py-4 px-0 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === "preferences"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("languageTab")}
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {tab === "account" && (
            <div className="space-y-5">
              <div>
                <label className="text-sm text-gray-700 mb-2 block">
                  {t("emailAddress")}
                </label>
                <div className="w-full rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-800">
                  {email}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-1 block">
                  {t("registrationBy")}
                </label>
                <div className="text-sm text-gray-500">{registeredVia}</div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  className="rounded-xl bg-blue-600 text-white text-sm font-semibold px-8 py-3 hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {t("changePassword")}
                </button>
              </div>
            </div>
          )}

          {tab === "personal" && (
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">{t("fullNameHeading")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      {t("firstName")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        value={formData.firstName}
                        disabled={!isEditing}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className={fieldClass()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      {t("middleNameOptional")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        value={formData.middleName}
                        disabled={!isEditing}
                        onChange={(e) =>
                          handleInputChange("middleName", e.target.value)
                        }
                        className={fieldClass()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      {t("lastName")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        value={formData.lastName}
                        disabled={!isEditing}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className={fieldClass()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      {t("suffix")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        value={formData.suffix}
                        disabled={!isEditing}
                        onChange={(e) =>
                          handleInputChange("suffix", e.target.value)
                        }
                        className={fieldClass()}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Birth Date */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">{t("birthDateHeading")}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      {t("month")}
                    </label>
                    <div className="relative">
                      <select
                        value={formData.birthMonth}
                        disabled={!isEditing}
                        onChange={(e) =>
                          handleInputChange("birthMonth", e.target.value)
                        }
                        className={fieldClass()}
                      >
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      {t("day")}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        autoComplete="off"
                        min="1"
                        max="31"
                        value={formData.birthDay}
                        disabled={!isEditing}
                        onChange={(e) =>
                          handleInputChange("birthDay", e.target.value)
                        }
                        className={fieldClass()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      {t("year")}
                    </label>
                    <div className="relative">
                      <select
                        value={formData.birthYear}
                        disabled={!isEditing}
                        onChange={(e) =>
                          handleInputChange("birthYear", e.target.value)
                        }
                        className={fieldClass()}
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">{t("addressHeading")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      {t("city")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        value={formData.city}
                        disabled={!isEditing}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        className={fieldClass()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      {t("houseNoOptional")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        value={formData.houseNo}
                        disabled={!isEditing}
                        onChange={(e) =>
                          handleInputChange("houseNo", e.target.value)
                        }
                        className={fieldClass()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      {t("street")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        value={formData.street}
                        disabled={!isEditing}
                        onChange={(e) =>
                          handleInputChange("street", e.target.value)
                        }
                        className={fieldClass()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      {t("barangay")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        value={formData.barangay}
                        disabled={!isEditing}
                        onChange={(e) =>
                          handleInputChange("barangay", e.target.value)
                        }
                        className={fieldClass()}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">
                  {t("employmentDetails")}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-3 block">
                      {t("workingInQcQuestion")}
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          autoComplete="off"
                          name="working"
                          checked={formData.workingInCity === true}
                          disabled={!isEditing}
                          onChange={() =>
                            handleInputChange("workingInCity", true)
                          }
                          className="w-4 h-4 disabled:cursor-not-allowed cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">{t("yes")}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          autoComplete="off"
                          name="working"
                          checked={formData.workingInCity === false}
                          disabled={!isEditing}
                          onChange={() =>
                            handleInputChange("workingInCity", false)
                          }
                          className="w-4 h-4 disabled:cursor-not-allowed cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">{t("no")}</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      {t("occupation")}
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={formData.occupation}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleInputChange("occupation", e.target.value)
                      }
                      placeholder={t("enterOccupation")}
                      className={fieldClass()}
                    />
                  </div>
                </div>
              </div>

              {/* Sex */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">
                  {t("sex")}
                </label>
                <div className="relative">
                  <select
                    value={formData.sex}
                    disabled={!isEditing}
                    onChange={(e) => handleInputChange("sex", e.target.value)}
                    className={fieldClass()}
                  >
                    <option value="MALE">{t("genderMale")}</option>
                    <option value="FEMALE">{t("genderFemale")}</option>
                    <option value="OTHER">{t("otherOption")}</option>
                  </select>
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">
                  {t("mobileNumber")}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    autoComplete="off"
                    value={formData.mobileNumber}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleInputChange("mobileNumber", e.target.value)
                    }
                    className={fieldClass()}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 h-11 rounded-lg border-2 border-blue-600 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      {t("cancelBtn")}
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      {t("updateProfile")}
                    </button>
                  </>
                ) : (
                  <div className="w-full flex justify-center">
                    <button
                      onClick={handleStartEdit}
                      className="rounded-xl bg-blue-600 text-white text-sm font-semibold px-8 py-3 hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      {t("editProfile")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "preferences" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Languages className="h-4 w-4 text-gray-500" />
                  {t("languageTab")}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {t("chooseLanguageDesc")}
                </p>
                <div className="space-y-2">
                  {languageOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLanguage(option.value)}
                      className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
                        language === option.value
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                      {language === option.value && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone - shown on all tabs */}
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-bold text-red-700">{t("dangerZone")}</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t("dangerZoneDesc")}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeactivate}
                className="flex-1 h-11 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors active:scale-95 cursor-pointer"
              >
                {t("deactivateAccount")}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-11 rounded-lg border-2 border-red-600 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors active:scale-95 cursor-pointer"
              >
                {t("deleteAccount")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
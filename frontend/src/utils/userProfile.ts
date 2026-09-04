// Centralized Dynamic User Profile & Unique QCID Manager

export interface LoggedInUserProfile {
  id?: string | number
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  birthMonth?: string
  birthDay?: string
  birthYear?: string
  birthDate?: string
  age?: string | number
  city?: string
  barangay?: string
  street?: string
  houseNo?: string
  workingInQC?: string
  occupation?: string
  sex?: string
  civilStatus?: string
  mobileNumber?: string
  contactNo?: string
  email?: string
  qcidNo: string
  qcidNumber: string
  role?: string
  profilePhotoUrl?: string | null
}

export function getCurrentUser(): any {
  try {
    const raw = localStorage.getItem("currentUser")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Generates a random unique 15-digit QCID starting with 110000
 */
export function generateUniqueQcid(): string {
  const random9 = Math.floor(100000000 + Math.random() * 900000000).toString()
  return `110000${random9}`
}

/**
 * Returns the currently authenticated user's profile.
 * Automatically ensures a unique, persistent QCID is attached to the user.
 */
export function getCurrentUserProfile(): LoggedInUserProfile {
  const u = getCurrentUser()

  let qcid = u?.qcidNumber || u?.qcid_number || u?.qcidNo || u?.qcid
  if (!qcid || qcid === "110000116932100" || qcid === "11000015952309") {
    // If QCID is missing or hardcoded sample, generate a unique one and persist it
    qcid = u?.email ? generateUniqueQcid() : "110000116932100"
    if (u && u.email) {
      u.qcidNumber = qcid
      u.qcidNo = qcid
      localStorage.setItem("currentUser", JSON.stringify(u))
    }
  }

  const birthYear = u?.birthYear || u?.birth_year || (u?.birthDate ? u.birthDate.split(',')[1]?.trim() : '') || '2000'
  const calculatedAge = birthYear ? String(Math.max(18, new Date().getFullYear() - parseInt(birthYear))) : '24'

  return {
    id: u?.id || '1',
    firstName: (u?.firstName || u?.first_name || 'Resident').toUpperCase(),
    middleName: (u?.middleName || u?.middle_name || '').toUpperCase(),
    lastName: (u?.lastName || u?.last_name || '').toUpperCase(),
    suffix: (u?.suffix || '').toUpperCase(),
    birthMonth: (u?.birthMonth || u?.birth_month || 'JANUARY').toUpperCase(),
    birthDay: u?.birthDay || u?.birth_day || '1',
    birthYear: birthYear,
    birthDate: u?.birthDate || u?.birth_date || `${u?.birthMonth || 'JANUARY'} ${u?.birthDay || '1'}, ${birthYear}`,
    age: calculatedAge,
    city: (u?.city || 'QUEZON CITY').toUpperCase(),
    barangay: (u?.barangay || 'SAUYO').toUpperCase(),
    street: (u?.street || '').toUpperCase(),
    houseNo: u?.houseNo || u?.house_no || '',
    workingInQC: u?.workingInQC || u?.working_in_qc || 'No',
    occupation: (u?.occupation || '').toUpperCase(),
    sex: (u?.sex || 'FEMALE').toUpperCase(),
    civilStatus: u?.civilStatus || 'Single',
    mobileNumber: u?.mobileNumber || u?.mobile_number || u?.contactNo || '09000000000',
    contactNo: u?.mobileNumber || u?.mobile_number || u?.contactNo || '09000000000',
    email: u?.email || 'resident@gmail.com',
    qcidNo: qcid,
    qcidNumber: qcid,
    role: u?.role || 'user',
    profilePhotoUrl: u?.profilePhotoUrl || null,
  }
}

export function getLoggedInUserQcid(): string {
  return getCurrentUserProfile().qcidNo
}

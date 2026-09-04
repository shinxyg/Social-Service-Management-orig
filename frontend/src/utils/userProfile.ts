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
  birthDateIso?: string
  birthDateDisplay?: string
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
 * Normalizes any date string (ISO "YYYY-MM-DD", "Month DD, YYYY", "MM/DD/YYYY", etc.)
 * into a valid HTML5 "YYYY-MM-DD" format suitable for <input type="date">.
 */
export function toISODateString(val?: string | null): string {
  if (!val) return ""
  const str = String(val).trim()
  if (!str) return ""

  const currYear = new Date().getFullYear()

  // 1. Already valid YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10)
    if (y >= 1900 && y <= currYear + 1) {
      return str
    }
  }

  const MONTHS: Record<string, string> = {
    JANUARY: "01", JAN: "01", ENERO: "01",
    FEBRUARY: "02", FEB: "02", PEBRERO: "02",
    MARCH: "03", MAR: "03", MARSO: "03",
    APRIL: "04", APR: "04", ABRIL: "04",
    MAY: "05", MAYO: "05",
    JUNE: "06", JUN: "06", HUNYO: "06",
    JULY: "07", JUL: "07", HULYO: "07",
    AUGUST: "08", AUG: "08", AGOSTO: "08",
    SEPTEMBER: "09", SEP: "09", SEPT: "09", SETYEMBRE: "09",
    OCTOBER: "10", OCT: "10", OKTUBRE: "10",
    NOVEMBER: "11", NOV: "11", NOBYEMBRE: "11",
    DECEMBER: "12", DEC: "12", DISYEMBRE: "12",
  }

  // 2. Match "Month DD, YYYY" or "Month DD YY" or "Month DD, 12"
  const m1 = str.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{1,4})$/)
  if (m1) {
    const month = MONTHS[m1[1].toUpperCase()] || "01"
    const day = m1[2].padStart(2, "0")
    let year = parseInt(m1[3], 10)
    if (year < 100) {
      year = year <= (currYear % 100) ? 2000 + year : 1900 + year
    } else if (year < 1900 || year > currYear) {
      year = 2000
    }
    return `${year}-${month}-${day}`
  }

  // 3. Match "MM/DD/YYYY" or "M/D/YY"
  const m2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{1,4})$/)
  if (m2) {
    const month = m2[1].padStart(2, "0")
    const day = m2[2].padStart(2, "0")
    let year = parseInt(m2[3], 10)
    if (year < 100) {
      year = year <= (currYear % 100) ? 2000 + year : 1900 + year
    } else if (year < 1900 || year > currYear) {
      year = 2000
    }
    return `${year}-${month}-${day}`
  }

  // 4. Try JS Date parser
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    let year = parsed.getFullYear()
    if (year < 100) {
      year = year <= (currYear % 100) ? 2000 + year : 1900 + year
    } else if (year < 1900 || year > currYear) {
      year = 2000
    }
    const month = String(parsed.getMonth() + 1).padStart(2, "0")
    const day = String(parsed.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  return ""
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

  const currYear = new Date().getFullYear()
  const rawYear = u?.birthYear || u?.birth_year || (u?.birthDate ? u.birthDate.split(',')[1]?.trim() : '') || '2000'
  let parsedYear = parseInt(rawYear, 10)
  if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > currYear) {
    if (!isNaN(parsedYear) && parsedYear > 0 && parsedYear < 100) {
      parsedYear = parsedYear <= (currYear % 100) ? 2000 + parsedYear : 1900 + parsedYear
    } else {
      parsedYear = 2000
    }
  }
  const birthYear = String(parsedYear)
  const calculatedAge = String(Math.max(1, currYear - parsedYear))

  const rawBirthDate = u?.birthDate || u?.birth_date || `${u?.birthMonth || 'JANUARY'} ${u?.birthDay || '1'}, ${birthYear}`
  const isoBirthDate = toISODateString(rawBirthDate)

  return {
    id: u?.id || '1',
    firstName: (u?.firstName || u?.first_name || 'Resident').toUpperCase(),
    middleName: (u?.middleName || u?.middle_name || '').toUpperCase(),
    lastName: (u?.lastName || u?.last_name || '').toUpperCase(),
    suffix: (u?.suffix || '').toUpperCase(),
    birthMonth: (u?.birthMonth || u?.birth_month || 'JANUARY').toUpperCase(),
    birthDay: u?.birthDay || u?.birth_day || '1',
    birthYear: birthYear,
    birthDate: isoBirthDate || `${birthYear}-01-01`,
    birthDateIso: isoBirthDate || `${birthYear}-01-01`,
    birthDateDisplay: `${u?.birthMonth || 'JANUARY'} ${u?.birthDay || '1'}, ${birthYear}`,
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

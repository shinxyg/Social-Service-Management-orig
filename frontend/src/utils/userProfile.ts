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
 * Clamps year, month, and day to a real, valid date in the Gregorian calendar.
 * (e.g. Feb 32 in 1932 becomes Feb 29, 1932; Feb 32 in 2023 becomes Feb 28, 2023; Apr 31 becomes Apr 30)
 */
export function clampValidDate(year: number, month: number, day: number): string {
  const currYear = new Date().getFullYear()
  let y = Math.floor(year)
  if (isNaN(y)) y = 2000
  if (y < 100) {
    y = y <= (currYear % 100) ? 2000 + y : 1900 + y
  } else if (y < 1900 || y > currYear) {
    y = 2000
  }

  let m = Math.floor(month)
  if (isNaN(m) || m < 1) m = 1
  if (m > 12) m = 12

  // Exact maximum days in this month of this year
  const maxDays = new Date(y, m, 0).getDate()
  let d = Math.floor(day)
  if (isNaN(d) || d < 1) d = 1
  if (d > maxDays) d = maxDays

  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

/**
 * Normalizes any date string (ISO "YYYY-MM-DD", "Month DD, YYYY", "MM/DD/YYYY", etc.)
 * into a valid HTML5 "YYYY-MM-DD" format suitable for <input type="date">.
 * Ensures the date is valid on the Gregorian calendar (e.g. prevents Feb 32).
 */
export function toISODateString(val?: string | null): string {
  if (!val) return ""
  const str = String(val).trim()
  if (!str) return ""

  // 1. Matches YYYY-MM-DD or YYYY-M-D
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    return clampValidDate(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10),
      parseInt(isoMatch[3], 10)
    )
  }

  const MONTHS: Record<string, number> = {
    JANUARY: 1, JAN: 1, ENERO: 1,
    FEBRUARY: 2, FEB: 2, PEBRERO: 2,
    MARCH: 3, MAR: 3, MARSO: 3,
    APRIL: 4, APR: 4, ABRIL: 4,
    MAY: 5, MAYO: 5,
    JUNE: 6, JUN: 6, HUNYO: 6,
    JULY: 7, JUL: 7, HULYO: 7,
    AUGUST: 8, AUG: 8, AGOSTO: 8,
    SEPTEMBER: 9, SEP: 9, SEPT: 9, SETYEMBRE: 9,
    OCTOBER: 10, OCT: 10, OKTUBRE: 10,
    NOVEMBER: 11, NOV: 11, NOBYEMBRE: 11,
    DECEMBER: 12, DEC: 12, DISYEMBRE: 12,
  }

  // 2. Match "Month DD, YYYY" or "Month DD YY" or "Month DD, 12"
  const m1 = str.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{1,4})$/)
  if (m1) {
    const monthNum = MONTHS[m1[1].toUpperCase()] || 1
    const day = parseInt(m1[2], 10)
    const year = parseInt(m1[3], 10)
    return clampValidDate(year, monthNum, day)
  }

  // 3. Match "MM/DD/YYYY" or "M/D/YY"
  const m2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{1,4})$/)
  if (m2) {
    const monthNum = parseInt(m2[1], 10)
    const day = parseInt(m2[2], 10)
    const year = parseInt(m2[3], 10)
    return clampValidDate(year, monthNum, day)
  }

  // 4. Try JS Date parser
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    return clampValidDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate())
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

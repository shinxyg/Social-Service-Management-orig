import { createContext, useContext, useState, type ReactNode } from "react"

/*
  Language context — English / Tagalog / Bisaya toggle.
  Wrap the app with <LanguageProvider> (done in App.tsx) and call
  useLanguage() anywhere to read `language`, call `setLanguage`, or
  translate a known key with `t("someKey")`.

  Add more keys here as more pages get wired up. If a key is missing,
  t() just falls back to the key itself so nothing breaks.
*/

export type Language = "en" | "tl" | "bis"

const translations: Record<string, { en: string; tl: string; bis: string }> = {
  // Common
  settings: { en: "Settings", tl: "Mga Setting", bis: "Mga Setting" },
  profile: { en: "Profile", tl: "Profile", bis: "Profile" },
  logOut: { en: "Log Out", tl: "Mag-logout", bis: "Mag-logout" },
  language: { en: "Language", tl: "Wika", bis: "Pinulongan" },
  english: { en: "English", tl: "Ingles", bis: "Ingles" },
  tagalog: { en: "Tagalog", tl: "Tagalog", bis: "Tagalog" },
  bisaya: { en: "Bisaya", tl: "Bisaya", bis: "Binisaya" },
  darkMode: { en: "Dark Mode", tl: "Dark Mode", bis: "Dark Mode" },
  close: { en: "Close", tl: "Isara", bis: "Isira" },
  save: { en: "Save", tl: "I-save", bis: "I-save" },
  cancel: { en: "Cancel", tl: "Kanselahin", bis: "Kanselaha" },
  notifications: { en: "Notifications", tl: "Mga Abiso", bis: "Mga Pahibalo" },
  helpAndGuides: { en: "Help & guides", tl: "Tulong at Gabay", bis: "Tabang ug Giya" },

  // Brand / sidebar shell
  socialServicesManagement: { en: "Social Services Management", tl: "Pangasiwaan ng Serbisyong Panlipunan", bis: "Pagdumala sa Serbisyo Sosyal" },
  socialServices: { en: "Social Services", tl: "Serbisyong Panlipunan", bis: "Serbisyo Sosyal" },
  residentPortal: { en: "Resident Portal", tl: "Portal ng Residente", bis: "Portal sa Residente" },
  applyForAssistance: { en: "Apply for Assistance", tl: "Mag-apply ng Tulong", bis: "Mag-apply og Tabang" },
  modules: { en: "Modules", tl: "Mga Module", bis: "Mga Module" },
  views: { en: "Views", tl: "Mga View", bis: "Mga View" },

  // Resident sidebar nav
  navAICS: { en: "AICS", tl: "AICS", bis: "AICS" },
  navOtherPrograms: { en: "Other Programs", tl: "Ibang Programa", bis: "Ubang Programa" },
  navTrackApplication: { en: "Track Application", tl: "Subaybayan ang Aplikasyon", bis: "Subaya ang Aplikasyon" },

  // Staff sidebar nav (module labels)
  navPWDSenior: { en: "PWD & Senior Citizen Services", tl: "Serbisyo para sa PWD at Senior Citizen", bis: "Serbisyo para sa PWD ug Senior Citizen" },
  navSoloParent: { en: "Solo Parent & Child Welfare", tl: "Solo Parent at Kapakanan ng Bata", bis: "Solo Parent ug Kaayohan sa Bata" },
  navLivelihood: { en: "Livelihood & Training Program", tl: "Programa sa Kabuhayan at Pagsasanay", bis: "Programa sa Panginabuhi ug Pagbansay" },
  navFinancialAid: { en: "Financial Aid Disbursement", tl: "Paglabas ng Tulong Pinansyal", bis: "Paghatag og Tabang Pinansyal" },

  // App header (staff)
  toggleSidebar: { en: "Toggle sidebar", tl: "I-toggle ang sidebar", bis: "I-toggle ang sidebar" },
  switchToLightMode: { en: "Switch to light mode", tl: "Lumipat sa light mode", bis: "Balhin sa light mode" },
  switchToDarkMode: { en: "Switch to dark mode", tl: "Lumipat sa dark mode", bis: "Balhin sa dark mode" },
  viewFullDocumentation: { en: "View full documentation", tl: "Tingnan ang buong dokumentasyon", bis: "Tan-awa ang tibuok dokumentasyon" },
  viewAllNotifications: { en: "View all notifications", tl: "Tingnan lahat ng abiso", bis: "Tan-awa tanang pahibalo" },
  newLabel: { en: "new", tl: "bago", bis: "bag-o" },
  socialWorker: { en: "Social Worker", tl: "Social Worker", bis: "Social Worker" },
  staffRole: { en: "Staff", tl: "Staff", bis: "Staff" },
  residentRole: { en: "Resident", tl: "Residente", bis: "Residente" },
  applicantRole: { en: "Applicant", tl: "Aplikante", bis: "Aplikante" },

  // Help topics (staff header)
  helpAicsTitle: { en: "Processing AICS applications", tl: "Pagpoproseso ng aplikasyon sa AICS", bis: "Pagproseso sa aplikasyon sa AICS" },
  helpAicsDesc: { en: "How to review submissions, run verification, and release assistance.", tl: "Paano suriin ang mga isinumite, mag-verify, at maglabas ng tulong.", bis: "Giunsa pagrepaso sa mga isumite, pag-verify, ug paghatag og tabang." },
  helpPwdTitle: { en: "PWD & Senior Citizen ID issuance", tl: "Pagbigay ng ID sa PWD at Senior Citizen", bis: "Pagpagawas og ID sa PWD ug Senior Citizen" },
  helpPwdDesc: { en: "Registration, medical verification, and benefits activation steps.", tl: "Mga hakbang sa pagpaparehistro, medical verification, at pag-activate ng benepisyo.", bis: "Mga lakang sa pagparehistro, medical verification, ug pag-activate sa benepisyo." },
  helpSoloTitle: { en: "Solo Parent ID & child welfare cases", tl: "Solo Parent ID at kaso ng kapakanan ng bata", bis: "Solo Parent ID ug mga kaso sa kaayohan sa bata" },
  helpSoloDesc: { en: "Document review, interview, and approval workflow.", tl: "Pagsusuri ng dokumento, panayam, at proseso ng pag-apruba.", bis: "Pagrepaso sa dokumento, pakigsulti, ug proseso sa pag-apruba." },
  helpLivelihoodTitle: { en: "Livelihood & training enrollment", tl: "Pagpapatala sa kabuhayan at pagsasanay", bis: "Pagpatala sa panginabuhi ug pagbansay" },
  helpLivelihoodDesc: { en: "Skills assessment, batch assignment, and certification.", tl: "Pagsusuri ng kasanayan, pagtalaga ng batch, at sertipikasyon.", bis: "Pagsusi sa kahanas, pagtudlo og batch, ug sertipikasyon." },
  helpDisbursementTitle: { en: "Tracking disbursements", tl: "Pagsubaybay sa paglabas ng tulong", bis: "Pagsubay sa paghatag og tabang" },
  helpDisbursementDesc: { en: "How releases are logged across all assistance programs.", tl: "Paano naitala ang mga paglabas sa lahat ng programa ng tulong.", bis: "Giunsa pagtala ang mga paghatag sa tanang programa sa tabang." },

  // Notifications mock (staff header)
  notifAicsTitle: { en: "New AICS submission", tl: "Bagong isinumiteng AICS", bis: "Bag-ong isumite nga AICS" },
  notifAicsDesc: { en: "Liza P. Gonzales filed a medical assistance request.", tl: "Nag-file si Liza P. Gonzales ng kahilingan sa tulong medikal.", bis: "Si Liza P. Gonzales nag-file og hangyo sa tabang medikal." },
  notifPwdTitle: { en: "PWD application approved", tl: "Naaprubahan ang aplikasyon ng PWD", bis: "Naaprubahan ang aplikasyon sa PWD" },
  notifPwdDesc: { en: "Julius P. Cabrera's PWD ID has been approved.", tl: "Naaprubahan na ang PWD ID ni Julius P. Cabrera.", bis: "Naaprubahan na ang PWD ID ni Julius P. Cabrera." },
  notifFinancialTitle: { en: "Financial aid released", tl: "Nailabas na ang tulong pinansyal", bis: "Nahatag na ang tabang pinansyal" },
  notifFinancialDesc: { en: "₱8,500 released to Marites A. Bautista.", tl: "₱8,500 ang nailabas kay Marites A. Bautista.", bis: "₱8,500 ang nahatag kang Marites A. Bautista." },
  notifTime5min: { en: "5 min ago", tl: "5 minuto ang nakalipas", bis: "5 minuto ang milabay" },
  notifTime1hour: { en: "1 hour ago", tl: "1 oras ang nakalipas", bis: "1 oras ang milabay" },
  notifTimeYesterday: { en: "Yesterday", tl: "Kahapon", bis: "Kagahapon" },

  // Resident AICS page (aics-user.tsx)
  aicsWelcome: { en: "Welcome back, {name}. Here's what you can apply for.", tl: "Maligayang pagbabalik, {name}. Ito ang mga puwede mong i-apply.", bis: "Maayong pagbalik, {name}. Kini ang imong mahimong i-apply." },
  aicsAssistance: { en: "AICS ASSISTANCE", tl: "TULONG NG AICS", bis: "TABANG SA AICS" },
  aicsMedical: { en: "Medical Assistance", tl: "Tulong Medikal", bis: "Tabang Medikal" },
  aicsFuneral: { en: "Funeral Assistance", tl: "Tulong sa Libing", bis: "Tabang sa Lubong" },
  aicsTransportation: { en: "Transportation Assistance", tl: "Tulong sa Pamasahe", bis: "Tabang sa Pamasahe" },
  aicsMaterial: { en: "Material Assistance", tl: "Tulong na Materyales", bis: "Tabang nga Materyales" },
  aicsFood: { en: "Food Assistance", tl: "Tulong na Pagkain", bis: "Tabang nga Pagkaon" },
  aicsCashRelief: { en: "Cash Relief Assistance", tl: "Tulong na Pera", bis: "Tabang nga Kwarta" },
  aicsFooterNote: {
    en: "Pick the type of assistance above to start your application. Bring a valid government-issued ID and Barangay Certificate of Indigency, plus the specific requirements for your assistance type, when a social worker asks you to visit for verification.",
    tl: "Piliin ang uri ng tulong sa itaas para simulan ang iyong application. Magdala ng valid na government ID at Barangay Certificate of Indigency, kasama ang mga partikular na kailangan para sa uri ng tulong mo, kapag hinilingan ka ng social worker na bisitahin sila para sa verification.",
    bis: "Pilia ang matang sa tabang sa taas para magsugod sa imong aplikasyon. Pagdala og balido nga government ID ug Barangay Certificate of Indigency, dugang sa mga espesipikong kinahanglanon para sa imong matang sa tabang, kung hangyoon ka sa social worker nga mobisita para sa verification.",
  },
  back: { en: "← Back to AICS", tl: "← Bumalik sa AICS", bis: "← Balik sa AICS" },

  // apply-aics.tsx form
  applyAicsTitle: { en: "Apply for AICS assistance", tl: "Mag-apply ng tulong sa AICS", bis: "Mag-apply og tabang sa AICS" },
  applyAicsDesc: {
    en: "Fill out this form to request Assistance to Individuals in Crisis Situations. A social worker will review your application and contact you for the next steps.",
    tl: "Punan ang form na ito para humingi ng Tulong sa mga Taong Nasa Krisis. Susuriin ng social worker ang iyong aplikasyon at kokontakin ka para sa susunod na hakbang.",
    bis: "Sudlan kini nga porma aron mangayo og Tabang sa mga Tawo nga Naa sa Krisis. Susihon sa social worker ang imong aplikasyon ug kontakon ka para sa sunod nga lakang.",
  },
  applicantInformation: { en: "Applicant information", tl: "Impormasyon ng Aplikante", bis: "Impormasyon sa Aplikante" },
  fullName: { en: "Full name", tl: "Buong Pangalan", bis: "Tibuok Ngalan" },
  contactNumber: { en: "Contact number", tl: "Numero ng Contact", bis: "Numero sa Kontak" },
  address: { en: "Address", tl: "Address", bis: "Address" },
  typeOfAssistance: { en: "Type of assistance", tl: "Uri ng Tulong", bis: "Matang sa Tabang" },
  situationReason: { en: "Situation / reason for request", tl: "Sitwasyon / Dahilan ng Kahilingan", bis: "Sitwasyon / Rason sa Hangyo" },
  situationPlaceholder: { en: "Briefly describe your crisis situation...", tl: "Ilarawan nang maikli ang iyong sitwasyon...", bis: "Ihulagway sa mubo ang imong sitwasyon sa krisis..." },
  submitApplication: { en: "Submit application", tl: "Isumite ang Aplikasyon", bis: "Isumite ang Aplikasyon" },
  applicationSubmittedTitle: { en: "Application submitted", tl: "Naisumite na ang Aplikasyon", bis: "Naisumite na ang Aplikasyon" },
  referenceNumber: { en: "Reference number", tl: "Numero ng Reference", bis: "Numero sa Reference" },
  saveReferenceNote: { en: "Save this reference number to track your application status.", tl: "I-save ang reference number na ito para masubaybayan ang status ng aplikasyon mo.", bis: "I-save kini nga reference number para masubay ang status sa imong aplikasyon." },
  appSubmittedMsg: {
    en: "Thank you, {name}. Your {type} request has been received and is now pending review by a social worker.",
    tl: "Salamat, {name}. Natanggap na ang kahilingan mong {type} at nakabinbin na para masuri ng social worker.",
    bis: "Salamat, {name}. Nadawat na ang imong hangyo nga {type} ug naghulat na kini nga repasohon sa social worker.",
  },
  bringDocsNote: {
    en: "You will need to bring supporting documents (valid ID, Barangay Certificate of Indigency, and type-specific requirements) when you visit your barangay social welfare office for verification.",
    tl: "Kailangan mong magdala ng mga kailangang dokumento (valid ID, Barangay Certificate of Indigency, at mga partikular na kailangan) kapag bumisita ka sa barangay social welfare office para sa verification.",
    bis: "Kinahanglan nimo dad-on ang mga suporta nga dokumento (balido nga ID, Barangay Certificate of Indigency, ug mga espesipikong kinahanglanon) kung mobisita ka sa barangay social welfare office para sa verification.",
  },
  attachSupportingDocument: { en: "Attach supporting document (optional)", tl: "Maglakip ng suportang dokumento (opsyonal)", bis: "Idugang ang suporta nga dokumento (opsyonal)" },
  attachHint: { en: "Upload a photo of your valid ID or requirement (JPG or PNG, max 5MB).", tl: "Mag-upload ng larawan ng iyong valid ID o requirement (JPG o PNG, max 5MB).", bis: "I-upload ang litrato sa imong balido nga ID o requirement (JPG o PNG, max 5MB)." },
  chooseImage: { en: "Choose image", tl: "Pumili ng larawan", bis: "Pagpili og litrato" },
  changeImage: { en: "Change image", tl: "Palitan ang larawan", bis: "Ilisi ang litrato" },
  removeImage: { en: "Remove", tl: "Alisin", bis: "Tangtanga" },
  assistMedical: { en: "Medical assistance", tl: "Tulong medikal", bis: "Tabang medikal" },
  assistBurial: { en: "Burial assistance", tl: "Tulong sa libing", bis: "Tabang sa lubong" },
  assistEducational: { en: "Educational assistance", tl: "Tulong pang-edukasyon", bis: "Tabang pang-edukasyon" },
  assistTransportationLower: { en: "Transportation assistance", tl: "Tulong sa pamasahe", bis: "Tabang sa pamasahe" },
}

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: (key: string, vars?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const LANGUAGE_ORDER: Language[] = ["en", "tl", "bis"]

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("appLanguage") : null
    return stored === "tl" || stored === "bis" ? stored : "en"
  })

  const updateLanguage = (lang: Language) => {
    setLanguage(lang)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("appLanguage", lang)
    }
  }

  const toggleLanguage = () => {
    const nextIndex = (LANGUAGE_ORDER.indexOf(language) + 1) % LANGUAGE_ORDER.length
    updateLanguage(LANGUAGE_ORDER[nextIndex])
  }

  const t = (key: string, vars?: Record<string, string>) => {
    const entry = translations[key]
    let text = entry ? entry[language] : key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, v)
      }
    }
    return text
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider")
  return ctx
}
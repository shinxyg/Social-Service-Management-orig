import { ShieldAlert, Users, Baby, GraduationCap, Calendar, Wallet, History, FolderKanban, IdCard, UserCog, type LucideIcon } from "lucide-react"
import AICS from "../modules/aics"
import PWDSeniorCitizen from "../modules/pwd-senior-citizen"
import SoloParentChildWelfare from "../modules/solo-parent-child-welfare"
import LivelihoodTraining from "../modules/livelihood-training"
import Appointments from "../modules/appointments"
import FinancialAidDisbursement from "../modules/financial-aid-disbursement"
import { BarChart3 } from "lucide-react"
import Reports from "../modules/reports"
import ActivityLog from "../modules/activity-log"
import CaseManagement from "../modules/case-management"
import BeneficiaryManagement from "../modules/beneficiary-management"
import UserManagement from "../modules/user-management"

export type ModuleRoute = {
  path: string
  label: string
  icon: LucideIcon
  Component: React.ComponentType
}


export const moduleRoutes: ModuleRoute[] = [
  { path: "/aics", label: "Assistance to Individual In Crisis", icon: ShieldAlert, Component: AICS },
  { path: "/pwd-senior", label: "PWD & Senior Citizen Services", icon: Users, Component: PWDSeniorCitizen },
  { path: "/solo-parent", label: "Solo Parent & Child Welfare", icon: Baby, Component: SoloParentChildWelfare },
  { path: "/livelihood", label: "Livelihood & Training Program", icon: GraduationCap, Component: LivelihoodTraining },
  { path: "/financial-aid", label: "Financial Aid Disbursement", icon: Wallet, Component: FinancialAidDisbursement },
  { path: "/beneficiaries", label: "Beneficiary Management", icon: IdCard, Component: BeneficiaryManagement },
  { path: "/case-management", label: "Case Management", icon: FolderKanban, Component: CaseManagement },
  { path: "/appointments", label: "Appointments", icon: Calendar, Component: Appointments },
  { path: "/activity-log", label: "Activity Log", icon: History, Component: ActivityLog },
  { path: "/reports", label: "Reports & Analytics", icon: BarChart3, Component: Reports },
  { path: "/users", label: "User Management", icon: UserCog, Component: UserManagement },

]

export const defaultModulePath = moduleRoutes[0].path
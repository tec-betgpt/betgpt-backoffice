import {CostCenter} from "@/contracts/costCenter";
import {Project} from "@/contracts/project";
import {User} from "@/contracts/user";

export interface Sector {
  id: number
  name: string
  project_id: number
  user_id: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  project: Project
  user: User
  costCenters: CostCenter[]
}

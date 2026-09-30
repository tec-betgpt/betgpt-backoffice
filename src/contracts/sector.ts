import {CostCenter} from "@/contracts/costCenter";
import {Project} from "@/contracts/project";
import {User} from "@/contracts/user";

/**
 * O model esconde user_id/created_at/updated_at/deleted_at — nunca são enviados.
 * `project` vem no index; `user` e `costCenters` só no show.
 */
export interface Sector {
  id: number
  name: string
  project_id: number
  project: Project | null
  user?: User | null
  costCenters?: CostCenter[]
}

import {Sector} from "@/contracts/sector";
import {Project} from "@/contracts/project";
import {User} from "@/contracts/user";
import {FinancialTransaction} from "@/contracts/financialTransaction";

/**
 * O model esconde user_id/created_at/updated_at/deleted_at — nunca são enviados.
 * `sector` e `project` vêm no index; `user` e `financialTransactions` só no show.
 */
export interface CostCenter {
  id: number
  name: string
  project_id: number
  sector_id: number | null
  sector: Sector | null
  project: Project | null
  user?: User | null
  financialTransactions?: FinancialTransaction[]
}

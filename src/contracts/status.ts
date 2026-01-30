import {Integration} from "@/contracts/integration";
import {Project} from "@/contracts/project";
import {ProjectIntegration} from "@/contracts/projectIntegration";
import {User} from "@/contracts/user";

export interface Status {
  id: number
  name: string
  reason: string | null
  model_type: string
  model_id: number
  created_at: string | null
  updated_at: string | null
  model: Integration|Project|ProjectIntegration|User
}

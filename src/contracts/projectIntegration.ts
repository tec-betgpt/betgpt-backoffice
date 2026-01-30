import {Project} from "@/contracts/project";
import {Integration} from "@/contracts/integration";

export interface ProjectIntegration {
  id: number
  project_id: number
  integration_id: number
  config: any[]
  created_at: string
  updated_at: string
  deleted_at: string | null
  integration: Integration
  project: Project
}

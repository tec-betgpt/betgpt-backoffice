import {ProjectIntegration} from "@/contracts/projectIntegration";

export interface Integration {
  id: number
  name: string
  slug: string
  fields: any[]
  created_at: string
  updated_at: string
  deleted_at: string | null
  project_integrations: ProjectIntegration[]
  integration: ProjectIntegration | null
}

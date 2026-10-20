import { Status } from "@/contracts/status";

export interface ProjectLastPostbackLog {
  id: number;
  project_id: number;
  created_at: string;
}

/**
 * Payload enxuto retornado por GET /v1/projects (index).
 * O backend seleciona apenas estes campos.
 */
export interface ProjectListItem {
  id: number;
  name: string;
  created_at: string;
  logo_url: string | null;
  webhook_url: string | null;
  is_sync_google_analytics: boolean | number;
  statuses: Status[];
  users_count: number;
  last_postback_log: ProjectLastPostbackLog | null;
}

/**
 * Modelo completo retornado por POST /v1/projects (store) e
 * POST /v1/projects/{id} (update — inclui `statuses`).
 */
export interface Project {
  id: number;
  name: string;
  uuid: string;
  user_id: number;
  is_sync_google_analytics: boolean | number;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
  statuses?: Status[];
}

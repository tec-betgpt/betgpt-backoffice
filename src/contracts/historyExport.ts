import {Project} from "@/contracts/project";
import {User} from "@/contracts/user";
import {ProjectSummary} from "@/contracts/projectSummary";

export interface HistoryExport {
  id: number
  project_id: number
  history: any[]
  user_id: number
  created_at: string | null
  updated_at: string | null
  user: User
  project: Project
}

/**
 * Linha achatada do histórico de exportações (GET /v1/export index).
 */
export interface HistoryData {
  id: string;
  url: string;
  type: string;
  status: string;
  filter: Array<string>;
  user_id: number;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  created_at: string;
  target_id?: number | number[];
  target_title: string;
  project?: ProjectSummary | null;
}

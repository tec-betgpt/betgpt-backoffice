import type { Project } from "@/contracts/project";
import type { GroupMember } from "@/contracts/groupMember";

export type GroupStatus = "active" | "archived";
export type GroupRole = "owner" | "admin" | "editor" | "viewer";

export interface GroupProjectPivot {
  group_id: number;
  project_id: number;
}

export interface GroupProject extends Project {
  pivot: GroupProjectPivot;
}

export interface Group {
  id: number;
  uuid: string;
  owner_user_id: number;
  name: string;
  description: string | null;
  status: GroupStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  projects: GroupProject[];
  members?: GroupMember[];
}

export interface CreateGroupPayload {
  name: string;
  description?: string | null;
  project_ids: number[];
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string | null;
  status?: GroupStatus;
}

export interface ReplaceGroupProjectsPayload {
  project_ids: number[];
}

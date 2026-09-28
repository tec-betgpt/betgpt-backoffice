import type { GroupRole } from "@/contracts/group";

export interface GroupMemberUser {
  id: number;
  name: string;
  email: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: GroupRole;
  access_projects: boolean;
  project_roles?: Record<string, string> | null;
  invited_by: number | null;
  accepted_at: string | null;
  user?: GroupMemberUser;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateGroupMemberPayload {
  role?: Exclude<GroupRole, "owner">;
  access_projects?: boolean;
  project_roles?: Record<string, string> | null;
}

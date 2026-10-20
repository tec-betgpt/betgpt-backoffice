import type { GroupRole } from "@/contracts/group";

export type GroupInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "revoked"
  | "expired";

export interface GroupInvitationGroup {
  id: number;
  name: string;
}

export interface GroupInvitation {
  id: number;
  uuid: string;
  group_id: number;
  email: string;
  user_id: number | null;
  role: Exclude<GroupRole, "owner">;
  access_projects: boolean;
  status: GroupInvitationStatus;
  invited_by: number | null;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  group?: GroupInvitationGroup;
}

export interface CreateGroupInvitationPayload {
  email: string;
  role: Exclude<GroupRole, "owner">;
  access_projects: boolean;
  project_roles?: Record<string, string> | null;
}

/** Resposta pública da validação do convite (link do e-mail). */
export interface GroupInvitationPublic {
  group: GroupInvitationGroup;
  role: Exclude<GroupRole, "owner">;
  access_projects: boolean;
  status: GroupInvitationStatus;
  email: string;
  expires_at: string | null;
  email_matches_current_user: boolean | null;
}

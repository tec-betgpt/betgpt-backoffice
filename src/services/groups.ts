import api from "./base";
import type { SpaApiResponse } from "@/contracts/api";
import type {
  CreateGroupPayload,
  Group,
  ReplaceGroupProjectsPayload,
  UpdateGroupPayload,
} from "@/contracts/group";
import type {
  GroupMember,
  UpdateGroupMemberPayload,
} from "@/contracts/groupMember";
import type {
  CreateGroupInvitationPayload,
  GroupInvitation,
} from "@/contracts/groupInvitation";

export function unwrap<T>(payload: SpaApiResponse<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return (payload as SpaApiResponse<T>).data;
  }
  return payload as T;
}

export async function listGroups(): Promise<Group[]> {
  const { data } = await api.get<SpaApiResponse<Group[]>>("/groups");
  return unwrap(data);
}

export async function createGroup(
  payload: CreateGroupPayload,
): Promise<Group> {
  const { data } = await api.post<SpaApiResponse<Group>>("/groups", payload);
  return unwrap(data);
}

export async function getGroup(id: number): Promise<Group> {
  const { data } = await api.get<SpaApiResponse<Group>>(`/groups/${id}`);
  return unwrap(data);
}

export async function updateGroup(
  id: number,
  payload: UpdateGroupPayload,
): Promise<Group> {
  const { data } = await api.patch<SpaApiResponse<Group>>(
    `/groups/${id}`,
    payload,
  );
  return unwrap(data);
}

export async function deleteGroup(id: number): Promise<void> {
  await api.delete(`/groups/${id}`);
}

export async function replaceGroupProjects(
  id: number,
  payload: ReplaceGroupProjectsPayload,
): Promise<Group> {
  const { data } = await api.put<SpaApiResponse<Group>>(
    `/groups/${id}/projects`,
    payload,
  );
  return unwrap(data);
}

export async function listMembers(groupId: number): Promise<GroupMember[]> {
  const { data } = await api.get<SpaApiResponse<GroupMember[]>>(
    `/groups/${groupId}/members`,
  );
  return unwrap(data);
}

export async function updateMember(
  groupId: number,
  userId: number,
  payload: UpdateGroupMemberPayload,
): Promise<GroupMember> {
  const { data } = await api.patch<SpaApiResponse<GroupMember>>(
    `/groups/${groupId}/members/${userId}`,
    payload,
  );
  return unwrap(data);
}

export async function removeMember(
  groupId: number,
  userId: number,
): Promise<void> {
  await api.delete(`/groups/${groupId}/members/${userId}`);
}

export async function createInvitation(
  groupId: number,
  payload: CreateGroupInvitationPayload,
): Promise<GroupInvitation> {
  const { data } = await api.post<SpaApiResponse<GroupInvitation>>(
    `/groups/${groupId}/invitations`,
    payload,
  );
  return unwrap(data);
}

export async function listInvitations(
  groupId: number,
): Promise<GroupInvitation[]> {
  const { data } = await api.get<SpaApiResponse<GroupInvitation[]>>(
    `/groups/${groupId}/invitations`,
  );
  return unwrap(data);
}

export async function revokeInvitation(invitationId: number): Promise<void> {
  await api.delete(`/groups/invitations/${invitationId}`);
}

export async function acceptInvitation(uuid: string): Promise<void> {
  await api.post(`/groups/invitations/${uuid}/accept`);
}

export async function declineInvitation(uuid: string): Promise<void> {
  await api.post(`/groups/invitations/${uuid}/decline`);
}

export async function listMyInvitations(): Promise<GroupInvitation[]> {
  const { data } = await api.get<SpaApiResponse<GroupInvitation[]>>(
    "/auth/invitations",
  );
  return unwrap(data);
}

const groupsService = {
  listGroups,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  replaceGroupProjects,
  listMembers,
  updateMember,
  removeMember,
  createInvitation,
  listInvitations,
  revokeInvitation,
  acceptInvitation,
  declineInvitation,
  listMyInvitations,
  unwrap,
};

export default groupsService;

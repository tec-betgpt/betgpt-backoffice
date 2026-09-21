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
  GroupInvitationPublic,
} from "@/contracts/groupInvitation";
import type {
  GroupFinancialDashboard,
  GroupFinancialListParams,
  GroupFinancialListResponse,
  GroupFinancialTransaction,
  GroupFinancialTransactionPayload,
  GroupFinancialsPayload,
} from "@/contracts/groupFinancial";

export type GroupConsolidatedList =
  | "campaigns"
  | "players"
  | "links"
  | "segments"
  | "target-audiences";

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

export async function transferGroup(
  groupId: number,
  userId: number,
): Promise<Group> {
  const { data } = await api.post<SpaApiResponse<Group>>(
    `/groups/${groupId}/transfer`,
    { user_id: userId },
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

export async function acceptInvitation(
  uuid: string,
  token: string,
): Promise<void> {
  await api.post(`/groups/invitations/${uuid}/accept`, { token });
}

export async function declineInvitation(
  uuid: string,
  token: string,
): Promise<void> {
  await api.post(`/groups/invitations/${uuid}/decline`, { token });
}

/** GET /groups/invitations/{uuid}?token=... — validação pública do convite. */
export async function validateInvitation(
  uuid: string,
  token: string,
): Promise<GroupInvitationPublic> {
  const { data } = await api.get<SpaApiResponse<GroupInvitationPublic>>(
    `/groups/invitations/${uuid}`,
    { params: { token } },
  );
  return unwrap(data);
}

export async function listMyInvitations(): Promise<GroupInvitation[]> {
  const { data } = await api.get<SpaApiResponse<GroupInvitation[]>>(
    "/auth/invitations",
  );
  return unwrap(data);
}

// ---------------------------------------------------------------------------
// Fase B — consolidado do Grupo (dashboards + listas)
// ---------------------------------------------------------------------------

/** GET /groups/{group}/home — dashboard inicial consolidado. */
export async function getGroupHome<T = Record<string, unknown>>(
  groupId: number,
  params: { start_date?: string; end_date?: string } = {},
): Promise<T> {
  const { data } = await api.get<SpaApiResponse<T>>(
    `/groups/${groupId}/home`,
    { params },
  );
  return unwrap(data);
}

/** GET /groups/{group}/analytics — KPIs de analytics consolidados. */
export async function getGroupAnalytics<T = Record<string, unknown>>(
  groupId: number,
  params: { start_date?: string; end_date?: string } = {},
): Promise<T> {
  const { data } = await api.get<SpaApiResponse<T>>(
    `/groups/${groupId}/analytics`,
    { params },
  );
  return unwrap(data);
}

/** GET /groups/{group}/financials — DRE consolidado (máx. 28 dias). */
export async function getGroupFinancials(
  groupId: number,
  params: { start_date?: string; end_date?: string } = {},
): Promise<GroupFinancialsPayload> {
  const { data } = await api.get<SpaApiResponse<GroupFinancialsPayload>>(
    `/groups/${groupId}/financials`,
    { params },
  );
  return unwrap(data);
}

/**
 * GET /groups/{group}/financial-transactions/dashboard — dashboard
 * consolidado dos lançamentos do Grupo.
 */
export async function getGroupFinancialDashboard(
  groupId: number,
  params: { start_date?: string; end_date?: string } = {},
): Promise<GroupFinancialDashboard> {
  const { data } = await api.get<SpaApiResponse<GroupFinancialDashboard>>(
    `/groups/${groupId}/financial-transactions/dashboard`,
    { params },
  );
  return unwrap(data);
}

/**
 * GET /groups/{group}/{resource} — listas consolidadas.
 * Reusa os mesmos filtros/paginação das rotas originais, sem `filter_id`.
 */
export async function listGroupConsolidated<T = Record<string, unknown>>(
  groupId: number,
  resource: GroupConsolidatedList,
  params: Record<string, unknown> = {},
): Promise<T> {
  const { data } = await api.get<SpaApiResponse<T>>(
    `/groups/${groupId}/${resource}`,
    { params },
  );
  return unwrap(data);
}

// ---------------------------------------------------------------------------
// Fase C — lançamentos financeiros próprios do Grupo
// ---------------------------------------------------------------------------

/** GET /groups/{group}/financial-transactions */
export async function listGroupFinancialTransactions(
  groupId: number,
  params: GroupFinancialListParams = {},
): Promise<GroupFinancialListResponse> {
  const { data } = await api.get<SpaApiResponse<GroupFinancialListResponse>>(
    `/groups/${groupId}/financial-transactions`,
    { params },
  );
  return unwrap(data);
}

/** POST /groups/{group}/financial-transactions — `edit` (editor+). */
export async function createGroupFinancialTransaction(
  groupId: number,
  payload: GroupFinancialTransactionPayload,
): Promise<GroupFinancialTransaction> {
  const { data } = await api.post<SpaApiResponse<GroupFinancialTransaction>>(
    `/groups/${groupId}/financial-transactions`,
    payload,
  );
  return unwrap(data);
}

/** PATCH /groups/{group}/financial-transactions/{transaction} */
export async function updateGroupFinancialTransaction(
  groupId: number,
  transactionId: number,
  payload: Partial<GroupFinancialTransactionPayload>,
): Promise<GroupFinancialTransaction> {
  const { data } = await api.patch<SpaApiResponse<GroupFinancialTransaction>>(
    `/groups/${groupId}/financial-transactions/${transactionId}`,
    payload,
  );
  return unwrap(data);
}

/** DELETE /groups/{group}/financial-transactions/{transaction} */
export async function deleteGroupFinancialTransaction(
  groupId: number,
  transactionId: number,
): Promise<void> {
  await api.delete(
    `/groups/${groupId}/financial-transactions/${transactionId}`,
  );
}

const groupsService = {
  listGroups,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  replaceGroupProjects,
  transferGroup,
  listMembers,
  updateMember,
  removeMember,
  createInvitation,
  listInvitations,
  revokeInvitation,
  acceptInvitation,
  declineInvitation,
  listMyInvitations,
  getGroupHome,
  getGroupAnalytics,
  getGroupFinancials,
  getGroupFinancialDashboard,
  listGroupConsolidated,
  listGroupFinancialTransactions,
  createGroupFinancialTransaction,
  updateGroupFinancialTransaction,
  deleteGroupFinancialTransaction,
  unwrap,
};

export default groupsService;

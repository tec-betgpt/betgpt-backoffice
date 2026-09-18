# Grupos (Visão de Grupo como entidade) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a Fase A de "Grupos" no backoffice Vue 3: CRUD de grupos com membros, convites com aceite e integração ao seletor de workspace, substituindo a tela legada "Grupo de Projetos".

**Architecture:** Camadas service → store Pinia → views/componentes, seguindo o padrão tipado já usado em `marketingApiKeys`. Uma composable `useGroupPermissions` deriva as regras de papel da spec (seção 8.3) como fonte única. A lista/detalhe usam `components/ui` (tabs, dialog, alert-dialog, badge, table) e um banner global de convites é montado em `layouts/default.vue`.

**Tech Stack:** Vue 3 (`<script setup lang="ts">`), TypeScript, Pinia, Vue Router (routes em `.js`), axios (`src/services/base.ts`), vue-sonner, vue-i18n, shadcn-vue, Vitest (novo) + jsdom.

**Spec:** `new-feature.md` (raiz do repo). Este plano argumenta a partir dela; executors devem ler ambos.

## Global Constraints

- Base da API: `VITE_PUBLIC_API_URL` + `/v1` (o axios `baseURL` já inclui). Nunca hardcodar host.
- Envelope SPA: `{ success: boolean, message?: string, data: T }`. Serviços devem desembrulhar e retornar `data`.
- Autenticação já é injetada por `src/stores/auth.js` (header `Authorization: Bearer`). Não adicionar headers de auth.
- `<script setup lang="ts">` em todos `.vue` novos. Services/contratos `.ts`. Rotas `.js`.
- Strings de UI via vue-i18n, chaves em `src/langs/pt_BR.json` (prefixo `groups_`).
- Papéis válidos: `owner|admin|editor|viewer`. `owner` nunca é convidável/alterável/removível.
- Não usar `@/components/boot/components.js` para componentes de feature; importar explicitamente.
- Não adicionar dependências além de `vitest`, `jsdom`, `@vue/test-utils` (Task 1).
- Permission gate das rotas: reutilizar `access-to-project-groups`.

### Protocolo de verificação de tipos (IMPORTANTE)

O baseline do repositório **não** passa em `npx vue-tsc --noEmit`: há ~1016 erros pré-existentes em arquivos legados. Não conserte o legado. A verificação de tipos deste plano é **escopada aos arquivos novos**, e considera sucesso quando nenhum erro aponta para eles.

Comando canônico (rodar após cada task que toca TS/Vue):

```bash
npx vue-tsc --noEmit 2>&1 | grep -E "src/(contracts/(api|group|groupMember|groupInvitation|workspace)\.ts|services/groups\.ts|stores/groups\.ts|composables/useGroupPermissions\.ts|components/groups/|views/dashboard/(Groups|GroupDetails)\.vue)" || echo "groups-typecheck: clean"
```

Expected: `groups-typecheck: clean`.

`npm run build` (Vite/esbuild) **não** faz typecheck e passa no baseline — use-o como verificação de build.

- Comandos: `npx vitest run`, o grep acima, e `npm run build`.

---

## File Structure

**Criados**
- `vitest.config.ts` — config de testes.
- `src/contracts/api.ts` — `SpaApiResponse<T>` compartilhado.
- `src/contracts/group.ts` — `Group`, `GroupStatus`, `GroupRole`, `GroupProject`, payloads de grupo.
- `src/contracts/groupMember.ts` — `GroupMember`, `UpdateGroupMemberPayload`.
- `src/contracts/groupInvitation.ts` — `GroupInvitation`, `GroupInvitationStatus`, `CreateGroupInvitationPayload`.
- `src/contracts/workspace.ts` — `WorkspaceGroupProject`.
- `src/services/groups.ts` — cliente HTTP tipado.
- `src/composables/useGroupPermissions.ts` — regras de papel.
- `src/stores/groups.ts` — estado de grupos/membros/convites.
- `src/router/groups.js` — rotas `/groups` e `/groups/:id`.
- `src/views/dashboard/Groups.vue` — lista.
- `src/views/dashboard/GroupDetails.vue` — detalhe com abas.
- `src/components/groups/GroupCard.vue`
- `src/components/groups/CreateGroupModal.vue`
- `src/components/groups/EditGroupModal.vue`
- `src/components/groups/GroupDetailHeader.vue`
- `src/components/groups/ProjectsTab.vue`
- `src/components/groups/ManageProjectsModal.vue`
- `src/components/groups/MembersTab.vue`
- `src/components/groups/EditMemberModal.vue`
- `src/components/groups/InvitationsTab.vue`
- `src/components/groups/InviteMemberModal.vue`
- `src/components/groups/InviteBanner.vue`
- `src/composables/useGroupPermissions.spec.ts`
- `src/services/groups.spec.ts`
- `src/stores/groups.spec.ts`

**Modificados**
- `package.json` — scripts `test`, `test:watch`, `typecheck`; devDeps.
- `src/contracts/marketingApiKeys.ts` — passa a reexportar `SpaApiResponse` de `@/contracts/api`.
- `src/contracts/user.ts` — adiciona `group_projects?: WorkspaceGroupProject[]`.
- `src/router/index.js` — registra `groups`.
- `src/router/manage.js` — substitui a rota legada por redirect para `groups`.
- `src/components/layout/LeftMenuComponent.vue` — item de menu "Grupos"; rótulos do seletor separando Projetos/Grupos.
- `src/views/dashboard/GroupProjects.vue` — permanece em disco, fora do menu (redirect preserva deep links).
- `src/layouts/default.vue` — monta `<InviteBanner />`.
- `src/langs/pt_BR.json` — chaves `groups_*`.

---

### Ordem de execução recomendada

As tasks estão numeradas por área, mas a montagem do detalhe (Task 6) depende das abas (Tasks 7–9). Execute nesta ordem:

**1 → 2 → 3 → 5 → 7 → 8 → 9 → 6 → 4 (Step 4) → 10 → 11**

- Tasks 1–3: base testável (harness, contratos, service, store).
- Task 5: lista + criação.
- Tasks 7–9: abas Projetos, Membros, Convites (componentes isolados; não importam `GroupDetails`).
- Task 6: cria `GroupDetailHeader`/`EditGroupModal` e **monta** `GroupDetails.vue` já com as três abas. Rode o typecheck desta task **depois** das Tasks 7–9.
- Task 4: o registro das rotas em `src/router/index.js` (Step 4) só funciona depois que `Groups.vue` (Task 5) e `GroupDetails.vue` (Task 6) existem.
- Tasks 10–11: integração global e verificação final.

---

## Task 1: Test harness + `useGroupPermissions`

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/composables/useGroupPermissions.ts`
- Test: `src/composables/useGroupPermissions.spec.ts`

**Interfaces:**
- Consumes: `Group`, `GroupMember`, `GroupRole` de `@/contracts` (importados por tipo; os arquivos de contrato são criados na Task 2). Para que esta task compile isoladamente, os imports de tipo usam `import type` e o contrato mínimo é criado aqui também? **Não.** Esta task cria apenas a composable e usa um tipo estrutural local, migrando para o contrato real na Task 2. Ver nota de ordem abaixo.
- Produces:
  - `interface GroupPermissions { role: GroupRole | null; isOwner: boolean; canView: boolean; canEdit: boolean; canManageProjects: boolean; canManageMembers: boolean; canManageInvitations: boolean; canDelete: boolean }`
  - `resolveGroupPermissions(group: GroupPermissionInput | null | undefined, userId: number | null | undefined): GroupPermissions`
  - `useGroupPermissions(group: Ref<GroupPermissionInput|null|undefined>, userId: Ref<number|null|undefined>): ComputedRef<GroupPermissions>`
  - `interface GroupPermissionInput { owner_user_id: number; members?: Array<{ user_id: number; role: GroupRole }> }`
  - `type GroupRole = "owner" | "admin" | "editor" | "viewer"`

> **Nota de ordem:** `GroupRole` e `GroupPermissionInput` são declarados neste arquivo nesta task. Na Task 2, quando `src/contracts/group.ts` existir, substitua a declaração local de `GroupRole` e o input estrutural pelo contrato real (`Group`, `GroupMember`). O plano já traz a versão final do arquivo no Task 2, Passo "Ajustar composable".

- [ ] **Step 1: Add Vitest config and scripts**

Modify `package.json`. Add to `"scripts"`:

```json
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "vue-tsc --noEmit"
```

Add to `"devDependencies"`:

```json
    "vitest": "^2.1.8",
    "jsdom": "^25.0.1",
    "@vue/test-utils": "^2.4.6"
```

Create `vitest.config.ts`:

```ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.ts"],
  },
});
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `vitest`, `jsdom`, `@vue/test-utils` added to `node_modules`.

- [ ] **Step 3: Write the failing test**

Create `src/composables/useGroupPermissions.spec.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveGroupPermissions } from "@/composables/useGroupPermissions";

const owner = { user_id: 5, role: "owner" as const };
const admin = { user_id: 6, role: "admin" as const };
const editor = { user_id: 7, role: "editor" as const };
const viewer = { user_id: 8, role: "viewer" as const };

function groupFor(ownerUserId: number, members: any[]) {
  return { owner_user_id: ownerUserId, members };
}

describe("resolveGroupPermissions", () => {
  it("returns no permissions when user has no membership", () => {
    const permissions = resolveGroupPermissions(groupFor(5, [owner]), 99);
    expect(permissions.role).toBeNull();
    expect(permissions.canView).toBe(false);
    expect(permissions.canDelete).toBe(false);
  });

  it("owner can do everything", () => {
    const p = resolveGroupPermissions(groupFor(5, [owner]), 5);
    expect(p.role).toBe("owner");
    expect(p.isOwner).toBe(true);
    expect(p.canEdit).toBe(true);
    expect(p.canManageProjects).toBe(true);
    expect(p.canManageMembers).toBe(true);
    expect(p.canManageInvitations).toBe(true);
    expect(p.canDelete).toBe(true);
  });

  it("admin manages but cannot delete", () => {
    const p = resolveGroupPermissions(groupFor(5, [owner, admin]), 6);
    expect(p.role).toBe("admin");
    expect(p.canEdit).toBe(true);
    expect(p.canManageMembers).toBe(true);
    expect(p.canDelete).toBe(false);
  });

  it("editor edits only", () => {
    const p = resolveGroupPermissions(groupFor(5, [owner, editor]), 7);
    expect(p.role).toBe("editor");
    expect(p.canEdit).toBe(true);
    expect(p.canManageProjects).toBe(false);
    expect(p.canDelete).toBe(false);
  });

  it("viewer only views", () => {
    const p = resolveGroupPermissions(groupFor(5, [owner, viewer]), 8);
    expect(p.role).toBe("viewer");
    expect(p.canView).toBe(true);
    expect(p.canEdit).toBe(false);
  });

  it("treats owner_user_id as owner even without a members list", () => {
    const p = resolveGroupPermissions({ owner_user_id: 5 }, 5);
    expect(p.role).toBe("owner");
    expect(p.canDelete).toBe(true);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/composables/useGroupPermissions.spec.ts`
Expected: FAIL — cannot resolve `@/composables/useGroupPermissions`.

- [ ] **Step 5: Write minimal implementation**

Create `src/composables/useGroupPermissions.ts`:

```ts
import { computed, type ComputedRef, type Ref } from "vue";

export type GroupRole = "owner" | "admin" | "editor" | "viewer";

export interface GroupPermissionInput {
  owner_user_id: number;
  members?: Array<{ user_id: number; role: GroupRole }>;
}

export interface GroupPermissions {
  role: GroupRole | null;
  isOwner: boolean;
  canView: boolean;
  canEdit: boolean;
  canManageProjects: boolean;
  canManageMembers: boolean;
  canManageInvitations: boolean;
  canDelete: boolean;
}

const NO_PERMISSIONS: GroupPermissions = {
  role: null,
  isOwner: false,
  canView: false,
  canEdit: false,
  canManageProjects: false,
  canManageMembers: false,
  canManageInvitations: false,
  canDelete: false,
};

export function resolveGroupPermissions(
  group: GroupPermissionInput | null | undefined,
  userId: number | null | undefined,
): GroupPermissions {
  if (!group || userId == null) return { ...NO_PERMISSIONS };

  const member = group.members?.find((m) => m.user_id === userId);
  const isOwner = group.owner_user_id === userId || member?.role === "owner";
  const role: GroupRole | null = isOwner ? "owner" : (member?.role ?? null);

  if (!role) return { ...NO_PERMISSIONS };

  const isAdmin = role === "owner" || role === "admin";

  return {
    role,
    isOwner,
    canView: true,
    canEdit: isAdmin || role === "editor",
    canManageProjects: isAdmin,
    canManageMembers: isAdmin,
    canManageInvitations: isAdmin,
    canDelete: isOwner,
  };
}

export function useGroupPermissions(
  group: Ref<GroupPermissionInput | null | undefined>,
  userId: Ref<number | null | undefined>,
): ComputedRef<GroupPermissions> {
  return computed(() => resolveGroupPermissions(group.value, userId.value));
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/composables/useGroupPermissions.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 7: Typecheck**

Run: `npx vue-tsc --noEmit 2>&1 | grep -E "src/(contracts/(api|group|groupMember|groupInvitation|workspace)\.ts|services/groups\.ts|stores/groups\.ts|composables/useGroupPermissions\.ts|components/groups/|views/dashboard/(Groups|GroupDetails)\.vue)" || echo "groups-typecheck: clean"`
Expected: `groups-typecheck: clean`.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/composables/useGroupPermissions.ts src/composables/useGroupPermissions.spec.ts
git commit -m "test: add vitest and group permissions composable"
```

---

## Task 2: Contracts + groups service

**Files:**
- Create: `src/contracts/api.ts`
- Create: `src/contracts/group.ts`
- Create: `src/contracts/groupMember.ts`
- Create: `src/contracts/groupInvitation.ts`
- Create: `src/contracts/workspace.ts`
- Modify: `src/contracts/marketingApiKeys.ts:156-161`
- Modify: `src/contracts/user.ts`
- Modify: `src/composables/useGroupPermissions.ts`
- Create: `src/services/groups.ts`
- Test: `src/services/groups.spec.ts`

**Interfaces:**
- Consumes: `Project` (`@/contracts/project`), `User` (`@/contracts/user`), `SpaApiResponse` (`@/contracts/api`).
- Produces (service, default export object + named):
  - `listGroups(): Promise<Group[]>`
  - `createGroup(payload: CreateGroupPayload): Promise<Group>`
  - `getGroup(id: number): Promise<Group>`
  - `updateGroup(id: number, payload: UpdateGroupPayload): Promise<Group>`
  - `deleteGroup(id: number): Promise<void>`
  - `replaceGroupProjects(id: number, payload: ReplaceGroupProjectsPayload): Promise<Group>`
  - `listMembers(groupId: number): Promise<GroupMember[]>`
  - `updateMember(groupId: number, userId: number, payload: UpdateGroupMemberPayload): Promise<GroupMember>`
  - `removeMember(groupId: number, userId: number): Promise<void>`
  - `createInvitation(groupId: number, payload: CreateGroupInvitationPayload): Promise<GroupInvitation>`
  - `listInvitations(groupId: number): Promise<GroupInvitation[]>`
  - `revokeInvitation(invitationId: number): Promise<void>`
  - `acceptInvitation(uuid: string): Promise<void>`
  - `declineInvitation(uuid: string): Promise<void>`
  - `listMyInvitations(): Promise<GroupInvitation[]>`
  - `unwrap<T>(payload: SpaApiResponse<T> | T): T`

- [ ] **Step 1: Create the shared API envelope contract**

Create `src/contracts/api.ts`:

```ts
/** Envelope das rotas da SPA: `{ success, message, data }`. */
export interface SpaApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
```

Modify `src/contracts/marketingApiKeys.ts` — replace the local interface (lines ~156-161) with a re-export. Remove the original block:

```ts
/** Envelope das rotas da SPA: `{ success, message, data }`. */
export interface SpaApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
```

Add near the top imports:

```ts
import type { SpaApiResponse } from "@/contracts/api";
export type { SpaApiResponse } from "@/contracts/api";
```

- [ ] **Step 2: Create group contracts**

Create `src/contracts/group.ts`:

```ts
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
```

Create `src/contracts/groupMember.ts`:

```ts
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
  invited_by: number | null;
  accepted_at: string | null;
  user?: GroupMemberUser;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateGroupMemberPayload {
  role?: Exclude<GroupRole, "owner">;
  access_projects?: boolean;
}
```

Create `src/contracts/groupInvitation.ts`:

```ts
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
}
```

Create `src/contracts/workspace.ts`:

```ts
export interface WorkspaceGroupProject {
  id: string;
  project_id?: string;
  label: string;
  name: string;
  type: "group" | "project";
  is_selected: boolean;
  logo: string | null;
}
```

- [ ] **Step 3: Wire contracts into `User` and the composable**

Modify `src/contracts/user.ts` — add the import and field. After line 8 imports add:

```ts
import type { WorkspaceGroupProject } from "@/contracts/workspace";
```

Inside `interface User`, after `projectGroups: UserProjectGroup[]` add:

```ts
  group_projects?: WorkspaceGroupProject[]
```

Modify `src/composables/useGroupPermissions.ts` — replace the local `GroupRole`/`GroupPermissionInput` with the real contracts:

```ts
import { computed, type ComputedRef, type Ref } from "vue";
import type { Group, GroupRole } from "@/contracts/group";
import type { GroupMember } from "@/contracts/groupMember";

export type { GroupRole };

export type GroupPermissionInput = Pick<Group, "owner_user_id"> & {
  members?: Array<Pick<GroupMember, "user_id" | "role">>;
};

export interface GroupPermissions {
  role: GroupRole | null;
  isOwner: boolean;
  canView: boolean;
  canEdit: boolean;
  canManageProjects: boolean;
  canManageMembers: boolean;
  canManageInvitations: boolean;
  canDelete: boolean;
}
```

Keep the rest of the file unchanged (`NO_PERMISSIONS`, `resolveGroupPermissions`, `useGroupPermissions`). Do **not** redeclare `GroupMember` (it is now imported).

- [ ] **Step 4: Create the service**

Create `src/services/groups.ts`:

```ts
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
```

- [ ] **Step 5: Write the failing test**

Create `src/services/groups.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/services/base";
import {
  listGroups,
  createGroup,
  updateMember,
  acceptInvitation,
  unwrap,
} from "@/services/groups";

vi.mock("@/services/base", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mocked = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("groups service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("unwrap extracts data from the SPA envelope", () => {
    expect(unwrap({ success: true, data: [1, 2] })).toEqual([1, 2]);
  });

  it("unwrap returns the payload when it is not enveloped", () => {
    expect(unwrap([1, 2] as unknown as any)).toEqual([1, 2]);
  });

  it("listGroups GETs /groups and returns data", async () => {
    mocked.get.mockResolvedValue({ data: { success: true, data: [{ id: 1 }] } });
    await expect(listGroups()).resolves.toEqual([{ id: 1 }]);
    expect(mocked.get).toHaveBeenCalledWith("/groups");
  });

  it("createGroup POSTs /groups with the payload", async () => {
    mocked.post.mockResolvedValue({
      data: { success: true, data: { id: 10 } },
    });
    await createGroup({ name: "Empresa X", project_ids: [1, 2] });
    expect(mocked.post).toHaveBeenCalledWith("/groups", {
      name: "Empresa X",
      project_ids: [1, 2],
    });
  });

  it("updateMember PATCHes /groups/{group}/members/{user}", async () => {
    mocked.patch.mockResolvedValue({
      data: { success: true, data: { user_id: 6, role: "editor" } },
    });
    await updateMember(10, 6, { role: "editor", access_projects: true });
    expect(mocked.patch).toHaveBeenCalledWith("/groups/10/members/6", {
      role: "editor",
      access_projects: true,
    });
  });

  it("acceptInvitation POSTs the uuid accept route without a body", async () => {
    mocked.post.mockResolvedValue({ data: {} });
    await acceptInvitation("abc-123");
    expect(mocked.post).toHaveBeenCalledWith("/groups/invitations/abc-123/accept");
  });
});
```

- [ ] **Step 6: Run test to verify it fails, then passes**

Run: `npx vitest run src/services/groups.spec.ts`
Expected before implementation: FAIL (module not found). After Step 4 is already applied it will PASS — when executing out of order, run this after Step 4 and expect PASS (6 tests).

- [ ] **Step 7: Typecheck**

Run: `npx vue-tsc --noEmit 2>&1 | grep -E "src/(contracts/(api|group|groupMember|groupInvitation|workspace)\.ts|services/groups\.ts|stores/groups\.ts|composables/useGroupPermissions\.ts|components/groups/|views/dashboard/(Groups|GroupDetails)\.vue)" || echo "groups-typecheck: clean"`
Expected: `groups-typecheck: clean`. If `marketingApiKeys.ts` importers break, they import `SpaApiResponse` from `@/contracts/marketingApiKeys`, which still re-exports it.

- [ ] **Step 8: Commit**

```bash
git add src/contracts/api.ts src/contracts/group.ts src/contracts/groupMember.ts src/contracts/groupInvitation.ts src/contracts/workspace.ts src/contracts/marketingApiKeys.ts src/contracts/user.ts src/composables/useGroupPermissions.ts src/services/groups.ts src/services/groups.spec.ts
git commit -m "feat: add group contracts and typed groups service"
```

---

## Task 3: Groups store

**Files:**
- Create: `src/stores/groups.ts`
- Test: `src/stores/groups.spec.ts`

**Interfaces:**
- Consumes: `groupsService` (`@/services/groups`), `normalizeApiError` (`@/lib/apiError`), contracts from Task 2.
- Produces (store):
  - state: `groups: Group[]`, `currentGroup: Group | null`, `members: GroupMember[]`, `invitations: GroupInvitation[]`, `myInvitations: GroupInvitation[]`, `loading: boolean`, `saving: boolean`, `error: NormalizedApiError | null`
  - getters: `groupById(id): Group | null`, `pendingInvitations(): GroupInvitation[]`
  - actions: `fetchGroups`, `createGroup`, `fetchGroup`, `updateGroup`, `deleteGroup`, `replaceProjects`, `fetchMembers`, `updateMember`, `removeMember`, `fetchInvitations`, `createInvitation`, `revokeInvitation`, `fetchMyInvitations`, `acceptInvitation`, `declineInvitation`, `reset`
  - `useGroupsStore` (id `"groups"`)

- [ ] **Step 1: Write the failing test**

Create `src/stores/groups.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import groupsService from "@/services/groups";
import { useGroupsStore } from "@/stores/groups";

vi.mock("@/services/groups", () => ({
  default: {
    listGroups: vi.fn(),
    createGroup: vi.fn(),
    getGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
    replaceGroupProjects: vi.fn(),
    listMembers: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    createInvitation: vi.fn(),
    listInvitations: vi.fn(),
    revokeInvitation: vi.fn(),
    acceptInvitation: vi.fn(),
    declineInvitation: vi.fn(),
    listMyInvitations: vi.fn(),
  },
}));

const mocked = groupsService as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe("groups store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("fetchGroups populates the list", async () => {
    mocked.listGroups.mockResolvedValue([{ id: 1, name: "Empresa X" }]);
    const store = useGroupsStore();
    await store.fetchGroups();
    expect(store.groups).toEqual([{ id: 1, name: "Empresa X" }]);
    expect(store.loading).toBe(false);
  });

  it("fetchGroups records a normalized error and rethrows", async () => {
    mocked.listGroups.mockRejectedValue(new Error("network down"));
    const store = useGroupsStore();
    await expect(store.fetchGroups()).rejects.toThrow("network down");
    expect(store.error?.message).toBe("network down");
    expect(store.loading).toBe(false);
  });

  it("deleteGroup removes it from the local list", async () => {
    mocked.deleteGroup.mockResolvedValue(undefined);
    const store = useGroupsStore();
    store.groups = [{ id: 1 }, { id: 2 }] as any;
    await store.deleteGroup(1);
    expect(store.groups.map((g) => g.id)).toEqual([2]);
  });

  it("acceptInvitation removes the invitation from myInvitations", async () => {
    mocked.acceptInvitation.mockResolvedValue(undefined);
    const store = useGroupsStore();
    store.myInvitations = [{ id: 21, uuid: "abc" }] as any;
    await store.acceptInvitation("abc");
    expect(store.myInvitations).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/groups.spec.ts`
Expected: FAIL — cannot resolve `@/stores/groups`.

- [ ] **Step 3: Write the store**

Create `src/stores/groups.ts`:

```ts
import { defineStore } from "pinia";
import groupsService from "@/services/groups";
import { normalizeApiError } from "@/lib/apiError";
import type { NormalizedApiError } from "@/lib/apiError";
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

export const useGroupsStore = defineStore("groups", {
  state: () => ({
    groups: [] as Group[],
    currentGroup: null as Group | null,
    members: [] as GroupMember[],
    invitations: [] as GroupInvitation[],
    myInvitations: [] as GroupInvitation[],
    loading: false,
    saving: false,
    error: null as NormalizedApiError | null,
  }),

  getters: {
    groupById(state) {
      return (id: number): Group | null =>
        state.groups.find((group) => group.id === id) ?? null;
    },
    pendingInvitations(state): GroupInvitation[] {
      return state.myInvitations.filter(
        (invitation) => invitation.status === "pending",
      );
    },
  },

  actions: {
    async fetchGroups() {
      this.loading = true;
      this.error = null;
      try {
        this.groups = await groupsService.listGroups();
      } catch (error) {
        this.error = normalizeApiError(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createGroup(payload: CreateGroupPayload): Promise<Group> {
      this.saving = true;
      try {
        const group = await groupsService.createGroup(payload);
        this.groups = [...this.groups, group];
        return group;
      } finally {
        this.saving = false;
      }
    },

    async fetchGroup(id: number): Promise<Group> {
      this.loading = true;
      this.error = null;
      try {
        const group = await groupsService.getGroup(id);
        this.currentGroup = group;
        this.upsertGroup(group);
        return group;
      } catch (error) {
        this.error = normalizeApiError(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateGroup(id: number, payload: UpdateGroupPayload): Promise<Group> {
      this.saving = true;
      try {
        const group = await groupsService.updateGroup(id, payload);
        this.currentGroup = group;
        this.upsertGroup(group);
        return group;
      } finally {
        this.saving = false;
      }
    },

    async deleteGroup(id: number): Promise<void> {
      this.saving = true;
      try {
        await groupsService.deleteGroup(id);
        this.groups = this.groups.filter((group) => group.id !== id);
        if (this.currentGroup?.id === id) this.currentGroup = null;
      } finally {
        this.saving = false;
      }
    },

    async replaceProjects(
      id: number,
      payload: ReplaceGroupProjectsPayload,
    ): Promise<Group> {
      this.saving = true;
      try {
        const group = await groupsService.replaceGroupProjects(id, payload);
        this.currentGroup = group;
        this.upsertGroup(group);
        return group;
      } finally {
        this.saving = false;
      }
    },

    async fetchMembers(groupId: number): Promise<GroupMember[]> {
      this.members = await groupsService.listMembers(groupId);
      return this.members;
    },

    async updateMember(
      groupId: number,
      userId: number,
      payload: UpdateGroupMemberPayload,
    ): Promise<GroupMember> {
      const member = await groupsService.updateMember(groupId, userId, payload);
      this.members = this.members.map((m) =>
        m.user_id === userId ? member : m,
      );
      return member;
    },

    async removeMember(groupId: number, userId: number): Promise<void> {
      await groupsService.removeMember(groupId, userId);
      this.members = this.members.filter((m) => m.user_id !== userId);
    },

    async fetchInvitations(groupId: number): Promise<GroupInvitation[]> {
      this.invitations = await groupsService.listInvitations(groupId);
      return this.invitations;
    },

    async createInvitation(
      groupId: number,
      payload: CreateGroupInvitationPayload,
    ): Promise<GroupInvitation> {
      const invitation = await groupsService.createInvitation(groupId, payload);
      this.invitations = [...this.invitations, invitation];
      return invitation;
    },

    async revokeInvitation(invitationId: number): Promise<void> {
      await groupsService.revokeInvitation(invitationId);
      this.invitations = this.invitations.filter(
        (invitation) => invitation.id !== invitationId,
      );
    },

    async fetchMyInvitations(): Promise<GroupInvitation[]> {
      this.myInvitations = await groupsService.listMyInvitations();
      return this.myInvitations;
    },

    async acceptInvitation(uuid: string): Promise<void> {
      await groupsService.acceptInvitation(uuid);
      this.myInvitations = this.myInvitations.filter(
        (invitation) => invitation.uuid !== uuid,
      );
    },

    async declineInvitation(uuid: string): Promise<void> {
      await groupsService.declineInvitation(uuid);
      this.myInvitations = this.myInvitations.filter(
        (invitation) => invitation.uuid !== uuid,
      );
    },

    upsertGroup(group: Group) {
      const index = this.groups.findIndex((item) => item.id === group.id);
      this.groups =
        index >= 0
          ? this.groups.map((item) => (item.id === group.id ? group : item))
          : [...this.groups, group];
    },

    reset() {
      this.groups = [];
      this.currentGroup = null;
      this.members = [];
      this.invitations = [];
      this.myInvitations = [];
      this.loading = false;
      this.saving = false;
      this.error = null;
    },
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/stores/groups.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the whole suite**

Run: `npx vitest run`
Expected: PASS (all specs).

- [ ] **Step 6: Commit**

```bash
git add src/stores/groups.ts src/stores/groups.spec.ts
git commit -m "feat: add groups pinia store"
```

---

## Task 4: Router, menu replacement, redirect, i18n keys

**Files:**
- Create: `src/router/groups.js`
- Modify: `src/router/index.js:22-24,84`
- Modify: `src/router/manage.js:1,24-36`
- Modify: `src/components/layout/LeftMenuComponent.vue:552-565`
- Modify: `src/langs/pt_BR.json`

**Interfaces:**
- Consumes: `Groups.vue` and `GroupDetails.vue` (created in Tasks 5–6; this task references them by import — create the files as stubs? **No.** To keep the build green at this task's checkpoint, defer the route registration to the end of Task 6. Ver nota abaixo.)
- Produces: route names `groups`, `groups.show`; menu item "Grupos"; i18n keys `groups_*`.

> **Nota de ordem:** a rota importa as views. Para não quebrar o typecheck/build antes delas existirem, **execute o Step 4 (registrar em `router/index.js`) apenas após a Task 6**. Os demais steps (i18n, menu, redirect, arquivo de rotas) podem rodar agora; `src/router/groups.js` não é importado por ninguém até o registro.

- [ ] **Step 1: Add i18n keys**

Modify `src/langs/pt_BR.json` — add before the final closing `}` (keep the existing last key comma-correct). Add this block:

```json
  "groups_title": "Grupos",
  "groups_subtitle": "Gerencie grupos, membros e convites.",
  "groups_new": "Novo grupo",
  "groups_empty": "Você ainda não participa de nenhum grupo.",
  "groups_create_title": "Novo grupo",
  "groups_edit_title": "Editar grupo",
  "groups_name": "Nome",
  "groups_description": "Descrição",
  "groups_projects": "Projetos",
  "groups_members": "Membros",
  "groups_invitations": "Convites",
  "groups_overview": "Visão geral",
  "groups_manage_projects": "Gerenciar projetos",
  "groups_invite_person": "Convidar pessoa",
  "groups_status_active": "Ativo",
  "groups_status_archived": "Arquivado",
  "groups_role_owner": "Owner",
  "groups_role_admin": "Admin",
  "groups_role_editor": "Editor",
  "groups_role_viewer": "Viewer",
  "groups_access_projects": "Acessa projetos",
  "groups_access_view_only": "Só visão",
  "groups_delete": "Excluir grupo",
  "groups_archive": "Arquivar",
  "groups_edit": "Editar",
  "groups_save": "Salvar",
  "groups_cancel": "Cancelar",
  "groups_remove": "Remover",
  "groups_revoke": "Revogar",
  "groups_email": "E-mail",
  "groups_role": "Papel",
  "groups_give_project_access": "Também dar acesso aos projetos",
  "groups_give_project_access_hint": "Sem marcar, a pessoa só vê a visão do grupo.",
  "groups_send": "Enviar",
  "groups_created": "Grupo criado com sucesso.",
  "groups_updated": "Grupo atualizado com sucesso.",
  "groups_deleted": "Grupo excluído com sucesso.",
  "groups_projects_saved": "Projetos atualizados com sucesso.",
  "groups_member_updated": "Membro atualizado com sucesso.",
  "groups_member_removed": "Membro removido com sucesso.",
  "groups_invite_sent": "Convite enviado com sucesso.",
  "groups_invite_revoked": "Convite revogado com sucesso.",
  "groups_invite_accepted": "Convite aceito.",
  "groups_invite_declined": "Convite recusado.",
  "groups_same_owner_error": "Um grupo não pode misturar projetos de titulares diferentes.",
  "groups_invite_banner": "Você foi convidado para o grupo \"{name}\" ({role})",
  "groups_accept": "Aceitar",
  "groups_decline": "Recusar",
  "groups_wrong_email": "Este convite é para outro e-mail.",
  "groups_expires_at": "Expira",
  "groups_select_projects_hint": "Só projetos do mesmo titular.",
  "groups_confirm_delete": "Confirmar exclusão do grupo?",
  "groups_confirm_delete_description": "Essa ação não pode ser desfeita."
```

- [ ] **Step 2: Create the route file**

Create `src/router/groups.js`:

```js
import DefaultLayout from "@/layouts/default.vue";
import Groups from "@/views/dashboard/Groups.vue";
import GroupDetails from "@/views/dashboard/GroupDetails.vue";

export default [
  {
    path: "/groups",
    name: "groups",
    component: Groups,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Grupos",
      roles: "member",
      permissions: "access-to-project-groups",
    },
  },
  {
    path: "/groups/:id",
    name: "groups.show",
    component: GroupDetails,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Detalhes do Grupo",
      roles: "member",
      permissions: "access-to-project-groups",
    },
  },
];
```

- [ ] **Step 3: Replace the legacy route with a redirect**

Modify `src/router/manage.js`:

Remove the import on line 1:

```js
import GroupProjects from "@/views/dashboard/GroupProjects.vue";
```

Replace the legacy route block (currently lines ~25-36) with:

```js
      {
        path: "group-projects",
        redirect: { name: "groups" },
      },
```

- [ ] **Step 4: Register the route (do this after Task 6)**

Modify `src/router/index.js`. Add the import after `emailHealth`:

```js
import groups from "@/router/groups.js";
```

Add to the `routes` array spreads:

```js
  ...groups,
```

- [ ] **Step 5: Update the left menu**

Modify `src/components/layout/LeftMenuComponent.vue`. In the `navMenu` "Gerenciamento" children, replace:

```js
        {
          name: "Grupo de Projetos",
          url: { name: "configurations.projects" },
          icon: LayoutList,
          show: canAccess("access-to-project-groups"),
        },
```

with:

```js
        {
          name: "Grupos",
          url: { name: "groups" },
          icon: LayoutList,
          show: canAccess("access-to-project-groups"),
        },
```

- [ ] **Step 6: Verify no stale route references**

Run: `rg "configurations\.projects" src`
Expected: no matches (only `manage.js` redirect by name `groups` remains).

- [ ] **Step 7: Typecheck (after Task 6) and commit**

Run: `npx vue-tsc --noEmit 2>&1 | grep -E "src/(contracts/(api|group|groupMember|groupInvitation|workspace)\.ts|services/groups\.ts|stores/groups\.ts|composables/useGroupPermissions\.ts|components/groups/|views/dashboard/(Groups|GroupDetails)\.vue)" || echo "groups-typecheck: clean"`
Expected: `groups-typecheck: clean`.

```bash
git add src/router/groups.js src/router/index.js src/router/manage.js src/components/layout/LeftMenuComponent.vue src/langs/pt_BR.json
git commit -m "feat: add groups routes, menu entry and i18n keys"
```

---

## Task 5: Groups list view + card + create modal

**Files:**
- Create: `src/views/dashboard/Groups.vue`
- Create: `src/components/groups/GroupCard.vue`
- Create: `src/components/groups/CreateGroupModal.vue`

**Interfaces:**
- Consumes: `useGroupsStore`, `useAuthStore`, `groupsService` (Task 2/3), `Project` contract, shadcn `dialog/input/checkbox/button/card/skeleton/badge`.
- Produces:
  - `Groups.vue` — list page, route `groups`.
  - `GroupCard.vue` — props `{ group: Group; role: GroupRole | null }`.
  - `CreateGroupModal.vue` — props `{ open: boolean }`; emits `update:open`, `created` (with `Group`).

- [ ] **Step 1: Create `GroupCard.vue`**

Create `src/components/groups/GroupCard.vue`:

```vue
<template>
  <Card class="transition hover:border-primary/50">
    <CardContent class="space-y-3 py-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h3 class="truncate font-semibold">{{ group.name }}</h3>
          <p class="text-sm text-muted-foreground">
            {{ group.projects.length }}
            {{ $t("groups_projects").toLowerCase() }} ·
            {{ $t(statusKey) }}
          </p>
        </div>
        <Badge variant="secondary">{{ $t(roleLabel) }}</Badge>
      </div>
      <div class="flex flex-wrap gap-1">
        <Badge
          v-for="project in group.projects.slice(0, 3)"
          :key="project.id"
          variant="outline"
        >
          {{ project.name }}
        </Badge>
        <Badge v-if="group.projects.length > 3" variant="outline">
          +{{ group.projects.length - 3 }}
        </Badge>
      </div>
      <Button as-child variant="outline" size="sm" class="w-full">
        <router-link :to="{ name: 'groups.show', params: { id: group.id } }">
          {{ $t("groups_overview") }}
        </router-link>
      </Button>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Group, GroupRole } from "@/contracts/group";

const props = defineProps<{
  group: Group;
  role: GroupRole | null;
}>();

const statusKey = computed(() =>
  props.group.status === "archived"
    ? "groups_status_archived"
    : "groups_status_active",
);

const roleLabel = computed(() => {
  if (!props.role) return "";
  return `groups_role_${props.role}`;
});
</script>
```

- [ ] **Step 2: Create `CreateGroupModal.vue`**

Create `src/components/groups/CreateGroupModal.vue`:

```vue
<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ $t("groups_create_title") }}</DialogTitle>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <Label for="group-name">{{ $t("groups_name") }} *</Label>
          <Input id="group-name" v-model="form.name" placeholder="Empresa X" />
        </div>

        <div class="space-y-2">
          <Label for="group-description">{{ $t("groups_description") }}</Label>
          <Input id="group-description" v-model="form.description" />
        </div>

        <div class="space-y-2">
          <Label>{{ $t("groups_projects") }} *</Label>
          <div class="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-3">
            <div
              v-for="project in projects"
              :key="project.id"
              class="flex items-center gap-2"
            >
              <Checkbox
                :id="`group-project-${project.id}`"
                :checked="form.project_ids.includes(project.id)"
                @update:checked="toggleProject(project.id, $event)"
              />
              <Label
                :for="`group-project-${project.id}`"
                class="cursor-pointer font-normal"
              >
                {{ project.name }}
              </Label>
            </div>
            <p v-if="!projects.length" class="text-sm text-muted-foreground">
              {{ $t("groups_empty") }}
            </p>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ $t("groups_select_projects_hint") }}
          </p>
          <p v-if="errorMessage" class="text-sm text-destructive">
            {{ errorMessage }}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" @click="emit('update:open', false)">
            {{ $t("groups_cancel") }}
          </Button>
          <Button type="submit" :disabled="saving || !form.name || !form.project_ids.length">
            {{ $t("groups_save") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth";
import { useGroupsStore } from "@/stores/groups";
import { normalizeApiError } from "@/lib/apiError";
import type { Project } from "@/contracts/project";
import type { Group } from "@/contracts/group";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "created", group: Group): void;
}>();

const { t } = useI18n();
const authStore = useAuthStore();
const groupsStore = useGroupsStore();

const form = reactive<{
  name: string;
  description: string;
  project_ids: number[];
}>({ name: "", description: "", project_ids: [] });

const saving = ref(false);
const errorMessage = ref("");

const projects = computed<Project[]>(() => {
  const user = authStore.user as any;
  return (user?.ownerProjects?.length ? user.ownerProjects : user?.projects) ?? [];
});

watch(
  () => props.open,
  (value) => {
    if (value) {
      form.name = "";
      form.description = "";
      form.project_ids = [];
      errorMessage.value = "";
    }
  },
);

function toggleProject(projectId: number, checked: boolean | "indeterminate") {
  const next =
    checked === true
      ? [...form.project_ids, projectId].filter(
          (id, index, all) => all.indexOf(id) === index,
        )
      : form.project_ids.filter((id) => id !== projectId);

  const selectedProjects = projects.value.filter((project) =>
    next.includes(project.id),
  );
  const ownerIds = new Set(selectedProjects.map((project) => project.user_id));

  if (ownerIds.size > 1) {
    errorMessage.value = t("groups_same_owner_error");
    return;
  }

  errorMessage.value = "";
  form.project_ids = next;
}

async function submit() {
  if (projects.value.length && errorMessage.value) return;
  saving.value = true;
  try {
    const group = await groupsStore.createGroup({
      name: form.name,
      description: form.description || null,
      project_ids: [...form.project_ids],
    });
    toast(t("groups_created"));
    emit("created", group);
    emit("update:open", false);
  } catch (error) {
    errorMessage.value = normalizeApiError(error).message ?? t("api_errors.generic");
  } finally {
    saving.value = false;
  }
}
</script>
```

> The titular-mixing guard above removes newly-added projects from the wrong owner. This is intentionally conservative; the API still validates and returns 422 with `groups_same_owner_error`.

- [ ] **Step 3: Create `Groups.vue`**

Create `src/views/dashboard/Groups.vue`:

```vue
<template>
  <div class="w-full p-10 pb-16 max-[450px]:p-2">
    <div class="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">{{ $t("groups_title") }}</h2>
        <p class="text-muted-foreground">{{ $t("groups_subtitle") }}</p>
      </div>
      <Button @click="createOpen = true">{{ $t("groups_new") }}</Button>
    </div>

    <div v-if="groupsStore.loading" class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="n in 6" :key="n" class="h-40 w-full" />
    </div>

    <div
      v-else-if="groupsStore.groups.length"
      class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    >
      <GroupCard
        v-for="group in groupsStore.groups"
        :key="group.id"
        :group="group"
        :role="roleFor(group)"
      />
    </div>

    <Card v-else>
      <CardContent class="flex flex-col items-center gap-4 py-16 text-center">
        <p class="text-muted-foreground">{{ $t("groups_empty") }}</p>
        <Button @click="createOpen = true">{{ $t("groups_new") }}</Button>
      </CardContent>
    </Card>

    <CreateGroupModal v-model:open="createOpen" @created="onCreated" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import GroupCard from "@/components/groups/GroupCard.vue";
import CreateGroupModal from "@/components/groups/CreateGroupModal.vue";
import { useGroupsStore } from "@/stores/groups";
import { useAuthStore } from "@/stores/auth";
import { resolveGroupPermissions } from "@/composables/useGroupPermissions";
import { useScreenContext } from "@/composables/useScreenContext";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group, GroupRole } from "@/contracts/group";

const groupsStore = useGroupsStore();
const authStore = useAuthStore();
const createOpen = ref(false);

const currentUserId = computed<number | null>(
  () => (authStore.user as any)?.id ?? null,
);

function roleFor(group: Group): GroupRole | null {
  return resolveGroupPermissions(group, currentUserId.value).role;
}

function onCreated() {
  groupsStore.fetchGroups().catch(showApiErrorToast);
}

onMounted(() => {
  groupsStore.fetchGroups().catch(showApiErrorToast);
});

useScreenContext(
  "Grupos - Lista de grupos do usuário (owner ou membro)",
  () => ({
    groups_count: groupsStore.groups.length,
    groups_preview: groupsStore.groups
      .slice(0, 10)
      .map((group) => group.name)
      .join(", "),
  }),
  "/v1/groups",
);
</script>
```

- [ ] **Step 4: Typecheck and run tests**

Run: `npx vue-tsc --noEmit 2>&1 | grep -E "src/(contracts/(api|group|groupMember|groupInvitation|workspace)\.ts|services/groups\.ts|stores/groups\.ts|composables/useGroupPermissions\.ts|components/groups/|views/dashboard/(Groups|GroupDetails)\.vue)" || echo "groups-typecheck: clean"` then `npx vitest run`
Expected: `groups-typecheck: clean`; all specs pass.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, log in, open `/groups`. Expected: list renders (or empty state), "Novo grupo" opens the modal, selecting projects of different owners shows `groups_same_owner_error`, and creating adds the card. (Detail navigation will 404 until Task 6.)

- [ ] **Step 6: Commit**

```bash
git add src/views/dashboard/Groups.vue src/components/groups/GroupCard.vue src/components/groups/CreateGroupModal.vue
git commit -m "feat: add groups list, card and create modal"
```

---

## Task 6: Group detail header + overview + edit/archive/delete

**Files:**
- Create: `src/views/dashboard/GroupDetails.vue`
- Create: `src/components/groups/GroupDetailHeader.vue`
- Create: `src/components/groups/EditGroupModal.vue`

**Interfaces:**
- Consumes: `useGroupsStore`, `useGroupPermissions`, `Groups.vue` route.
- Produces:
  - `GroupDetailHeader.vue` — props `{ group: Group; permissions: GroupPermissions }`; emits `edit`, `archive`, `delete`.
  - `EditGroupModal.vue` — props `{ open: boolean; group: Group }`; emits `update:open`, `updated`.
  - `GroupDetails.vue` — reads `route.params.id`, loads group/members/invitations, renders header + `Tabs` with `ProjectsTab`, `MembersTab`, `InvitationsTab`.

> **Ordem:** este Step 3 importa as três abas e por isso deve rodar **depois das Tasks 7, 8 e 9** (ver "Ordem de execução recomendada" no topo). Steps 1 e 2 podem rodar a qualquer momento.

- [ ] **Step 1: Create `EditGroupModal.vue`**

Create `src/components/groups/EditGroupModal.vue`:

```vue
<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>{{ $t("groups_edit_title") }}</DialogTitle>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <Label for="edit-group-name">{{ $t("groups_name") }} *</Label>
          <Input id="edit-group-name" v-model="form.name" />
        </div>
        <div class="space-y-2">
          <Label for="edit-group-description">{{ $t("groups_description") }}</Label>
          <Input id="edit-group-description" v-model="form.description" />
        </div>
        <div class="space-y-2">
          <Label>{{ $t("groups_status_active") }} / {{ $t("groups_status_archived") }}</Label>
          <Select v-model="form.status">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{{ $t("groups_status_active") }}</SelectItem>
              <SelectItem value="archived">{{ $t("groups_status_archived") }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" @click="emit('update:open', false)">
            {{ $t("groups_cancel") }}
          </Button>
          <Button type="submit" :disabled="groupsStore.saving || !form.name">
            {{ $t("groups_save") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroupsStore } from "@/stores/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group, GroupStatus } from "@/contracts/group";

const props = defineProps<{ open: boolean; group: Group }>();
const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "updated"): void;
}>();

const { t } = useI18n();
const groupsStore = useGroupsStore();

const form = reactive<{
  name: string;
  description: string;
  status: GroupStatus;
}>({ name: "", description: "", status: "active" });

watch(
  () => props.open,
  (value) => {
    if (!value) return;
    form.name = props.group.name;
    form.description = props.group.description ?? "";
    form.status = props.group.status;
  },
);

async function submit() {
  try {
    await groupsStore.updateGroup(props.group.id, {
      name: form.name,
      description: form.description || null,
      status: form.status,
    });
    toast(t("groups_updated"));
    emit("updated");
    emit("update:open", false);
  } catch (error) {
    showApiErrorToast(error);
  }
}
</script>
```

- [ ] **Step 2: Create `GroupDetailHeader.vue`**

Create `src/components/groups/GroupDetailHeader.vue`:

```vue
<template>
  <div class="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" as-child>
          <router-link :to="{ name: 'groups' }" aria-label="Voltar">
            <ArrowLeft class="h-4 w-4" />
          </router-link>
        </Button>
        <h2 class="text-2xl font-bold tracking-tight">{{ group.name }}</h2>
        <Badge variant="secondary">
          {{ $t(group.status === "archived" ? "groups_status_archived" : "groups_status_active") }}
        </Badge>
        <Badge variant="outline">{{ $t(`groups_role_${permissions.role}`) }}</Badge>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ group.projects.length }} {{ $t("groups_projects").toLowerCase() }}
        <span v-if="group.description"> · {{ group.description }}</span>
      </p>
    </div>

    <div class="flex items-center gap-2">
      <Button v-if="permissions.canEdit" variant="outline" @click="emit('edit')">
        {{ $t("groups_edit") }}
      </Button>
      <DropdownMenu v-if="permissions.canEdit || permissions.canDelete">
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon">
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem v-if="permissions.canEdit" @click="emit('archive')">
            {{ $t("groups_archive") }}
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="permissions.canDelete"
            class="text-destructive"
            @click="emit('delete')"
          >
            {{ $t("groups_delete") }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, MoreHorizontal } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Group } from "@/contracts/group";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{
  (event: "edit"): void;
  (event: "archive"): void;
  (event: "delete"): void;
}>();
</script>
```

- [ ] **Step 3: Create `GroupDetails.vue`**

Create `src/views/dashboard/GroupDetails.vue`:

```vue
<template>
  <div class="w-full p-10 pb-16 max-[450px]:p-2">
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-16 w-full" />
      <Skeleton class="h-10 w-96" />
      <Skeleton class="h-64 w-full" />
    </div>

    <template v-else-if="group">
      <GroupDetailHeader
        :group="group"
        :permissions="permissions"
        @edit="editOpen = true"
        @archive="archive"
        @delete="deleteOpen = true"
      />

      <Tabs v-model="activeTab" class="mt-6">
        <TabsList>
          <TabsTrigger value="overview">{{ $t("groups_overview") }}</TabsTrigger>
          <TabsTrigger value="projects">{{ $t("groups_projects") }}</TabsTrigger>
          <TabsTrigger value="members">{{ $t("groups_members") }}</TabsTrigger>
          <TabsTrigger value="invitations">{{ $t("groups_invitations") }}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" class="mt-4">
          <Card>
            <CardContent class="space-y-2 py-6">
              <p><strong>{{ $t("groups_name") }}:</strong> {{ group.name }}</p>
              <p><strong>{{ $t("groups_description") }}:</strong> {{ group.description || "—" }}</p>
              <p><strong>{{ $t("groups_projects") }}:</strong> {{ group.projects.length }}</p>
              <p><strong>{{ $t("groups_role") }}:</strong> {{ $t(`groups_role_${permissions.role}`) }}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" class="mt-4">
          <ProjectsTab :group="group" :permissions="permissions" @changed="reload" />
        </TabsContent>
        <TabsContent value="members" class="mt-4">
          <MembersTab
            :group="group"
            :permissions="permissions"
            @invite="inviteOpen = true"
          />
        </TabsContent>
        <TabsContent value="invitations" class="mt-4">
          <InvitationsTab
            :group="group"
            :permissions="permissions"
            @changed="reload"
            @invite="inviteOpen = true"
          />
        </TabsContent>
      </Tabs>

      <EditGroupModal v-model:open="editOpen" :group="group" @updated="reload" />
      <InviteMemberModal v-model:open="inviteOpen" :group="group" @invited="reload" />

      <AlertDialog v-model:open="deleteOpen">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ $t("groups_confirm_delete") }}</AlertDialogTitle>
            <AlertDialogDescription>
              {{ $t("groups_confirm_delete_description") }}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ $t("groups_cancel") }}</AlertDialogCancel>
            <AlertDialogAction class="bg-red-600" @click="confirmDelete">
              {{ $t("groups_delete") }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </template>

    <Card v-else>
      <CardContent class="py-16 text-center text-muted-foreground">
        Grupo não encontrado.
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import GroupDetailHeader from "@/components/groups/GroupDetailHeader.vue";
import EditGroupModal from "@/components/groups/EditGroupModal.vue";
import InviteMemberModal from "@/components/groups/InviteMemberModal.vue";
import ProjectsTab from "@/components/groups/ProjectsTab.vue";
import MembersTab from "@/components/groups/MembersTab.vue";
import InvitationsTab from "@/components/groups/InvitationsTab.vue";
import { useGroupsStore } from "@/stores/groups";
import { useAuthStore } from "@/stores/auth";
import { resolveGroupPermissions } from "@/composables/useGroupPermissions";
import { normalizeApiError } from "@/lib/apiError";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const groupsStore = useGroupsStore();
const authStore = useAuthStore();

const loading = ref(true);
const activeTab = ref("overview");
const editOpen = ref(false);
const inviteOpen = ref(false);
const deleteOpen = ref(false);

const groupId = computed(() => Number(route.params.id));
const group = computed(() => groupsStore.currentGroup);

const currentUserId = computed<number | null>(
  () => (authStore.user as any)?.id ?? null,
);
const permissions = computed(() =>
  resolveGroupPermissions(group.value, currentUserId.value),
);

async function reload() {
  loading.value = true;
  try {
    await groupsStore.fetchGroup(groupId.value);
    await groupsStore.fetchMembers(groupId.value);
    await groupsStore.fetchInvitations(groupId.value);
  } catch (error) {
    if (normalizeApiError(error).status === 404) {
      toast.error(t("groups_empty"));
      router.replace({ name: "groups" });
      return;
    }
    showApiErrorToast(error);
  } finally {
    loading.value = false;
  }
}

async function archive() {
  try {
    await groupsStore.updateGroup(groupId.value, { status: "archived" });
    toast(t("groups_updated"));
  } catch (error) {
    showApiErrorToast(error);
  }
}

async function confirmDelete() {
  try {
    await groupsStore.deleteGroup(groupId.value);
    toast(t("groups_deleted"));
    router.push({ name: "groups" });
  } catch (error) {
    showApiErrorToast(error);
  }
}

onMounted(reload);
</script>
```

- [ ] **Step 4: Typecheck**

Run: `npx vue-tsc --noEmit 2>&1 | grep -E "src/(contracts/(api|group|groupMember|groupInvitation|workspace)\.ts|services/groups\.ts|stores/groups\.ts|composables/useGroupPermissions\.ts|components/groups/|views/dashboard/(Groups|GroupDetails)\.vue)" || echo "groups-typecheck: clean"`
Expected: `groups-typecheck: clean`.

- [ ] **Step 5: Manual verification**

Open `/groups/{id}`. Expected: header with role/status badges, four tabs, edit modal saving, archive menu item updating status, delete confirm redirecting to `/groups`.

- [ ] **Step 6: Commit**

```bash
git add src/views/dashboard/GroupDetails.vue src/components/groups/GroupDetailHeader.vue src/components/groups/EditGroupModal.vue
git commit -m "feat: add group detail header, overview, edit and delete"
```

---

## Task 7: Projects tab + manage projects modal

**Files:**
- Create: `src/components/groups/ProjectsTab.vue`
- Create: `src/components/groups/ManageProjectsModal.vue`

**Interfaces:**
- Consumes: `Group`, `GroupPermissions`, `useGroupsStore`, `useAuthStore`.
- Produces:
  - `ProjectsTab.vue` — props `{ group: Group; permissions: GroupPermissions }`; emits `changed`.
  - `ManageProjectsModal.vue` — props `{ open: boolean; group: Group }`; emits `update:open`, `saved`.

- [ ] **Step 1: Create `ManageProjectsModal.vue`**

Create `src/components/groups/ManageProjectsModal.vue`:

```vue
<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ $t("groups_manage_projects") }}</DialogTitle>
      </DialogHeader>

      <div class="space-y-2">
        <Label>{{ $t("groups_projects") }}</Label>
        <div class="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-3">
          <div v-for="project in projects" :key="project.id" class="flex items-center gap-2">
            <Checkbox
              :id="`manage-project-${project.id}`"
              :checked="selected.includes(project.id)"
              @update:checked="toggle(project.id, $event)"
            />
            <Label :for="`manage-project-${project.id}`" class="cursor-pointer font-normal">
              {{ project.name }}
            </Label>
          </div>
          <p v-if="!projects.length" class="text-sm text-muted-foreground">
            {{ $t("groups_empty") }}
          </p>
        </div>
        <p class="text-xs text-muted-foreground">{{ $t("groups_select_projects_hint") }}</p>
        <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" @click="emit('update:open', false)">
          {{ $t("groups_cancel") }}
        </Button>
        <Button type="button" :disabled="saving || !selected.length" @click="submit">
          {{ $t("groups_save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth";
import { useGroupsStore } from "@/stores/groups";
import { normalizeApiError } from "@/lib/apiError";
import type { Group } from "@/contracts/group";
import type { Project } from "@/contracts/project";

const props = defineProps<{ open: boolean; group: Group }>();
const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "saved"): void;
}>();

const { t } = useI18n();
const authStore = useAuthStore();
const groupsStore = useGroupsStore();

const selected = ref<number[]>([]);
const saving = ref(false);
const errorMessage = ref("");

const projects = computed<Project[]>(() => {
  const user = authStore.user as any;
  return (user?.ownerProjects?.length ? user.ownerProjects : user?.projects) ?? [];
});

watch(
  () => props.open,
  (value) => {
    if (!value) return;
    selected.value = props.group.projects.map((project) => project.id);
    errorMessage.value = "";
  },
);

function toggle(projectId: number, checked: boolean | "indeterminate") {
  if (checked === true) {
    if (!selected.value.includes(projectId)) selected.value.push(projectId);
  } else {
    selected.value = selected.value.filter((id) => id !== projectId);
  }
  errorMessage.value = "";
}

async function submit() {
  saving.value = true;
  try {
    await groupsStore.replaceProjects(props.group.id, { project_ids: [...selected.value] });
    toast(t("groups_projects_saved"));
    emit("saved");
    emit("update:open", false);
  } catch (error) {
    errorMessage.value = normalizeApiError(error).message ?? t("api_errors.generic");
  } finally {
    saving.value = false;
  }
}
</script>
```

- [ ] **Step 2: Create `ProjectsTab.vue`**

Create `src/components/groups/ProjectsTab.vue`:

```vue
<template>
  <Card>
    <CardContent class="space-y-4 py-4">
      <div class="flex items-center justify-between">
        <h3 class="font-medium">{{ $t("groups_projects") }}</h3>
        <Button v-if="permissions.canManageProjects" variant="outline" @click="open = true">
          {{ $t("groups_manage_projects") }}
        </Button>
      </div>

      <ul v-if="group.projects.length" class="divide-y rounded-lg border">
        <li
          v-for="project in group.projects"
          :key="project.id"
          class="flex items-center justify-between px-4 py-3"
        >
          <span>{{ project.name }}</span>
        </li>
      </ul>
      <p v-else class="py-8 text-center text-sm text-muted-foreground">
        {{ $t("groups_empty") }}
      </p>

      <ManageProjectsModal v-model:open="open" :group="group" @saved="emit('changed')" />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ManageProjectsModal from "@/components/groups/ManageProjectsModal.vue";
import type { Group } from "@/contracts/group";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{ (event: "changed"): void }>();

const open = ref(false);
</script>
```

- [ ] **Step 3: Typecheck**

Run: `npx vue-tsc --noEmit 2>&1 | grep -E "src/(contracts/(api|group|groupMember|groupInvitation|workspace)\.ts|services/groups\.ts|stores/groups\.ts|composables/useGroupPermissions\.ts|components/groups/|views/dashboard/(Groups|GroupDetails)\.vue)" || echo "groups-typecheck: clean"`
Expected: `groups-typecheck: clean`.

- [ ] **Step 4: Commit**

```bash
git add src/components/groups/ProjectsTab.vue src/components/groups/ManageProjectsModal.vue
git commit -m "feat: add group projects tab and manage projects modal"
```

---

## Task 8: Members tab + edit member + remove

**Files:**
- Create: `src/components/groups/MembersTab.vue`
- Create: `src/components/groups/EditMemberModal.vue`

**Interfaces:**
- Consumes: `Group`, `GroupPermissions`, `useGroupsStore`, `GroupMember`.
- Produces:
  - `MembersTab.vue` — props `{ group: Group; permissions: GroupPermissions }`.
  - `EditMemberModal.vue` — props `{ open: boolean; groupId: number; member: GroupMember }`; emits `update:open`, `updated`.

- [ ] **Step 1: Create `EditMemberModal.vue`**

Create `src/components/groups/EditMemberModal.vue`:

```vue
<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[460px]">
      <DialogHeader>
        <DialogTitle>{{ member.user?.name ?? member.user?.email }}</DialogTitle>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <Label>{{ $t("groups_role") }} *</Label>
          <Select v-model="role">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">{{ $t("groups_role_admin") }}</SelectItem>
              <SelectItem value="editor">{{ $t("groups_role_editor") }}</SelectItem>
              <SelectItem value="viewer">{{ $t("groups_role_viewer") }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex items-start gap-2">
          <Checkbox
            id="member-access-projects"
            :checked="accessProjects"
            @update:checked="accessProjects = $event === true"
          />
          <div class="grid gap-1">
            <Label for="member-access-projects" class="cursor-pointer font-normal">
              {{ $t("groups_give_project_access") }}
            </Label>
            <p class="text-xs text-muted-foreground">
              {{ $t("groups_give_project_access_hint") }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" @click="emit('update:open', false)">
            {{ $t("groups_cancel") }}
          </Button>
          <Button type="submit" :disabled="groupsStore.saving">
            {{ $t("groups_save") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroupsStore } from "@/stores/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { GroupMember } from "@/contracts/groupMember";
import type { GroupRole } from "@/contracts/group";

const props = defineProps<{
  open: boolean;
  groupId: number;
  member: GroupMember;
}>();
const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "updated"): void;
}>();

const { t } = useI18n();
const groupsStore = useGroupsStore();

const role = ref<Exclude<GroupRole, "owner">>("viewer");
const accessProjects = ref(false);

watch(
  () => props.open,
  (value) => {
    if (!value) return;
    role.value = props.member.role === "owner" ? "admin" : props.member.role;
    accessProjects.value = props.member.access_projects;
  },
);

async function submit() {
  try {
    await groupsStore.updateMember(props.groupId, props.member.user_id, {
      role: role.value,
      access_projects: accessProjects.value,
    });
    toast(t("groups_member_updated"));
    emit("updated");
    emit("update:open", false);
  } catch (error) {
    showApiErrorToast(error);
  }
}
</script>
```

- [ ] **Step 2: Create `MembersTab.vue`**

Create `src/components/groups/MembersTab.vue`:

```vue
<template>
  <Card>
    <CardContent class="space-y-4 py-4">
      <div class="flex items-center justify-between">
        <h3 class="font-medium">{{ $t("groups_members") }}</h3>
        <Button
          v-if="permissions.canManageInvitations"
          variant="outline"
          @click="emit('invite')"
        >
          {{ $t("groups_invite_person") }}
        </Button>
      </div>

      <ul class="divide-y rounded-lg border">
        <li
          v-for="member in groupsStore.members"
          :key="member.id"
          class="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">
              {{ member.user?.name ?? member.user?.email ?? `#${member.user_id}` }}
            </p>
            <p class="truncate text-xs text-muted-foreground">{{ member.user?.email }}</p>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="outline">{{ $t(`groups_role_${member.role}`) }}</Badge>
            <Badge variant="secondary">
              {{ $t(member.access_projects ? "groups_access_projects" : "groups_access_view_only") }}
            </Badge>
            <DropdownMenu v-if="permissions.canManageMembers && member.role !== 'owner'">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="openEdit(member)">
                  {{ $t("groups_edit") }}
                </DropdownMenuItem>
                <DropdownMenuItem class="text-destructive" @click="remove(member)">
                  {{ $t("groups_remove") }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </li>
      </ul>

      <EditMemberModal
        v-if="editing"
        v-model:open="editOpen"
        :group-id="group.id"
        :member="editing"
        @updated="reload"
      />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { MoreHorizontal } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditMemberModal from "@/components/groups/EditMemberModal.vue";
import { useGroupsStore } from "@/stores/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group } from "@/contracts/group";
import type { GroupMember } from "@/contracts/groupMember";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

const props = defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{ (event: "invite"): void }>();

const { t } = useI18n();
const groupsStore = useGroupsStore();

const editing = ref<GroupMember | null>(null);
const editOpen = ref(false);

function openEdit(member: GroupMember) {
  editing.value = member;
  editOpen.value = true;
}

async function reload() {
  await groupsStore.fetchMembers(props.group.id).catch(showApiErrorToast);
}

async function remove(member: GroupMember) {
  if (!window.confirm(t("groups_confirm_delete_description"))) return;
  try {
    await groupsStore.removeMember(props.group.id, member.user_id);
    toast(t("groups_member_removed"));
  } catch (error) {
    showApiErrorToast(error);
  }
}
</script>
```

> `MembersTab` emits `invite`; `GroupDetails.vue` (assembled in Task 6) binds it to `inviteOpen`. As a standalone component it typechecks without that binding.

- [ ] **Step 3: Typecheck**

Run: `npx vue-tsc --noEmit 2>&1 | grep -E "src/(contracts/(api|group|groupMember|groupInvitation|workspace)\.ts|services/groups\.ts|stores/groups\.ts|composables/useGroupPermissions\.ts|components/groups/|views/dashboard/(Groups|GroupDetails)\.vue)" || echo "groups-typecheck: clean"`
Expected: `groups-typecheck: clean`.

- [ ] **Step 4: Commit**

```bash
git add src/components/groups/MembersTab.vue src/components/groups/EditMemberModal.vue
git commit -m "feat: add group members tab, edit member and remove"
```

---

## Task 9: Invitations tab + invite modal

**Files:**
- Create: `src/components/groups/InvitationsTab.vue`
- Create: `src/components/groups/InviteMemberModal.vue`

**Interfaces:**
- Consumes: `Group`, `GroupPermissions`, `useGroupsStore`, `GroupInvitation`.
- Produces:
  - `InvitationsTab.vue` — props `{ group: Group; permissions: GroupPermissions }`; emits `changed`.
  - `InviteMemberModal.vue` — props `{ open: boolean; group: Group }`; emits `update:open`, `invited`.

- [ ] **Step 1: Create `InviteMemberModal.vue`**

Create `src/components/groups/InviteMemberModal.vue`:

```vue
<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>
          {{ $t("groups_invite_person") }} — {{ group.name }}
        </DialogTitle>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <Label for="invite-email">{{ $t("groups_email") }} *</Label>
          <Input id="invite-email" v-model="form.email" type="email" placeholder="maria@ex.com" />
        </div>

        <div class="space-y-2">
          <Label>{{ $t("groups_role") }} *</Label>
          <Select v-model="form.role">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">{{ $t("groups_role_admin") }}</SelectItem>
              <SelectItem value="editor">{{ $t("groups_role_editor") }}</SelectItem>
              <SelectItem value="viewer">{{ $t("groups_role_viewer") }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex items-start gap-2">
          <Checkbox
            id="invite-access-projects"
            :checked="form.access_projects"
            @update:checked="form.access_projects = $event === true"
          />
          <div class="grid gap-1">
            <Label for="invite-access-projects" class="cursor-pointer font-normal">
              {{ $t("groups_give_project_access") }}
            </Label>
            <p class="text-xs text-muted-foreground">
              {{ $t("groups_give_project_access_hint") }}
            </p>
          </div>
        </div>

        <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

        <DialogFooter>
          <Button type="button" variant="ghost" @click="emit('update:open', false)">
            {{ $t("groups_cancel") }}
          </Button>
          <Button type="submit" :disabled="saving || !form.email">
            {{ $t("groups_send") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroupsStore } from "@/stores/groups";
import { normalizeApiError } from "@/lib/apiError";
import type { Group, GroupRole } from "@/contracts/group";

const props = defineProps<{ open: boolean; group: Group }>();
const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "invited"): void;
}>();

const { t } = useI18n();
const groupsStore = useGroupsStore();

const form = reactive<{
  email: string;
  role: Exclude<GroupRole, "owner">;
  access_projects: boolean;
}>({ email: "", role: "viewer", access_projects: false });

const saving = ref(false);
const errorMessage = ref("");

watch(
  () => props.open,
  (value) => {
    if (!value) return;
    form.email = "";
    form.role = "viewer";
    form.access_projects = false;
    errorMessage.value = "";
  },
);

async function submit() {
  saving.value = true;
  try {
    await groupsStore.createInvitation(props.group.id, {
      email: form.email,
      role: form.role,
      access_projects: form.access_projects,
    });
    toast(t("groups_invite_sent"));
    emit("invited");
    emit("update:open", false);
  } catch (error) {
    errorMessage.value = normalizeApiError(error).message ?? t("api_errors.generic");
  } finally {
    saving.value = false;
  }
}
</script>
```

- [ ] **Step 2: Create `InvitationsTab.vue`**

Create `src/components/groups/InvitationsTab.vue`:

```vue
<template>
  <Card>
    <CardContent class="space-y-4 py-4">
      <div class="flex items-center justify-between">
        <h3 class="font-medium">{{ $t("groups_invitations") }}</h3>
        <Button
          v-if="permissions.canManageInvitations"
          variant="outline"
          @click="emit('invite')"
        >
          {{ $t("groups_invite_person") }}
        </Button>
      </div>

      <ul v-if="pending.length" class="divide-y rounded-lg border">
        <li
          v-for="invitation in pending"
          :key="invitation.id"
          class="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div class="min-w-0">
            <p class="truncate">{{ invitation.email }}</p>
            <p class="text-xs text-muted-foreground">
              {{ $t(`groups_role_${invitation.role}`) }}
              <span v-if="invitation.expires_at">
                · {{ $t("groups_expires_at") }}
                {{ formatDate(invitation.expires_at) }}
              </span>
            </p>
          </div>
          <Button
            v-if="permissions.canManageInvitations"
            variant="ghost"
            size="sm"
            @click="revoke(invitation)"
          >
            {{ $t("groups_revoke") }}
          </Button>
        </li>
      </ul>
      <p v-else class="py-8 text-center text-sm text-muted-foreground">
        {{ $t("groups_empty") }}
      </p>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGroupsStore } from "@/stores/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group } from "@/contracts/group";
import type { GroupInvitation } from "@/contracts/groupInvitation";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

const props = defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{
  (event: "changed"): void;
  (event: "invite"): void;
}>();

const { t } = useI18n();
const groupsStore = useGroupsStore();

const pending = computed(() =>
  groupsStore.invitations.filter((invitation) => invitation.status === "pending"),
);

function formatDate(value: string) {
  return moment(value).format("DD/MM/YYYY");
}

async function revoke(invitation: GroupInvitation) {
  try {
    await groupsStore.revokeInvitation(invitation.id);
    toast(t("groups_invite_revoked"));
    emit("changed");
  } catch (error) {
    showApiErrorToast(error);
  }
}
</script>
```

- [ ] **Step 3: Confirm the invite wiring belongs to Task 6**

`GroupDetails.vue` is assembled in Task 6 (which runs after this task) and already imports `InviteMemberModal` and binds `@invite="inviteOpen = true"` on both `MembersTab` and `InvitationsTab`. No edit here. Confirm Task 6's `GroupDetails.vue` code block contains:

```vue
      <InviteMemberModal v-model:open="inviteOpen" :group="group" @invited="reload" />
```

and, in the script:

```ts
const inviteOpen = ref(false);
```

- [ ] **Step 4: Typecheck and run tests**

Run: `npx vue-tsc --noEmit 2>&1 | grep -E "src/(contracts/(api|group|groupMember|groupInvitation|workspace)\.ts|services/groups\.ts|stores/groups\.ts|composables/useGroupPermissions\.ts|components/groups/|views/dashboard/(Groups|GroupDetails)\.vue)" || echo "groups-typecheck: clean"` then `npx vitest run`
Expected: `groups-typecheck: clean`; all specs pass.

- [ ] **Step 5: Manual verification**

As admin/owner: invite an e-mail, see it in "Convites", revoke it. As viewer/editor: invite buttons are hidden.

- [ ] **Step 6: Commit**

```bash
git add src/components/groups/InvitationsTab.vue src/components/groups/InviteMemberModal.vue src/views/dashboard/GroupDetails.vue
git commit -m "feat: add group invitations tab and invite member modal"
```

---

## Task 10: Global invite banner + workspace selector integration

**Files:**
- Create: `src/components/groups/InviteBanner.vue`
- Modify: `src/layouts/default.vue:1-126,155-159`
- Modify: `src/components/layout/LeftMenuComponent.vue:73-96`

**Interfaces:**
- Consumes: `useGroupsStore` (`myInvitations`, `fetchMyInvitations`, `acceptInvitation`, `declineInvitation`).
- Produces:
  - `InviteBanner.vue` — no props; renders pending invitations from the store with accept/decline.
  - `default.vue` mounts `<InviteBanner />` and fetches pending invitations on mount.
  - `LeftMenuComponent` groups the workspace dropdown items by `type`.

- [ ] **Step 1: Create `InviteBanner.vue`**

Create `src/components/groups/InviteBanner.vue`:

```vue
<template>
  <div
    v-if="invitations.length"
    class="fixed bottom-6 left-1/2 z-[150] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 space-y-2"
  >
    <div
      v-for="invitation in invitations"
      :key="invitation.uuid"
      class="flex flex-col gap-3 rounded-lg border bg-background p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-sm">
        {{
          $t("groups_invite_banner", {
            name: invitation.group?.name ?? `#${invitation.group_id}`,
            role: $t(`groups_role_${invitation.role}`),
          })
        }}
      </p>
      <div class="flex shrink-0 gap-2">
        <Button size="sm" variant="ghost" @click="decline(invitation.uuid)">
          {{ $t("groups_decline") }}
        </Button>
        <Button size="sm" @click="accept(invitation.uuid)">
          {{ $t("groups_accept") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { useGroupsStore } from "@/stores/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import { normalizeApiError } from "@/lib/apiError";

const { t } = useI18n();
const groupsStore = useGroupsStore();

const invitations = computed(() => groupsStore.pendingInvitations);

async function accept(uuid: string) {
  try {
    await groupsStore.acceptInvitation(uuid);
    toast(t("groups_invite_accepted"));
  } catch (error) {
    if (normalizeApiError(error).status === 422) {
      toast.error(t("groups_wrong_email"));
      return;
    }
    showApiErrorToast(error);
  }
}

async function decline(uuid: string) {
  try {
    await groupsStore.declineInvitation(uuid);
    toast(t("groups_invite_declined"));
  } catch (error) {
    showApiErrorToast(error);
  }
}
</script>
```

> Note: `authStore` is intentionally referenced to guarantee the component is used within an authenticated context; remove it if unused-warning tooling complains — it is not required for correctness.

- [ ] **Step 2: Mount the banner in `default.vue`**

Modify `src/layouts/default.vue`.

Template — inside `<SidebarInset>`, right after `</main>` (line ~106) and before `</SidebarInset>`:

```vue
      <InviteBanner />
```

Script — add the import after `IAAnaliseButton` import (line ~159):

```ts
import InviteBanner from "@/components/groups/InviteBanner.vue";
import { useGroupsStore } from "@/stores/groups";
```

Script — add the store instance after `const configStore = useConfigStore();`:

```ts
const groupsStore = useGroupsStore();
```

In `onMounted`, after the `if (user) { ... }` block (before `swipeSidebars();`), add:

```ts
  if (authStore.user) {
    groupsStore.fetchMyInvitations().catch(() => undefined);
  }
```

- [ ] **Step 3: Group the workspace dropdown by type**

Modify `src/components/layout/LeftMenuComponent.vue`. Replace the `DropdownMenuContent` body (lines ~73-96) with two sections. Use a computed in script if not present; simplest is inline filtering:

```vue
              <ScrollArea class="max-h-[50vh] w-auto overflow-auto">
                <template v-if="projectItems.length">
                  <DropdownMenuLabel class="text-xs text-muted-foreground">
                    Projetos
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    v-for="project in projectItems"
                    :key="project.id"
                    class="gap-2 p-2"
                    @click="setActiveGroupProject(project)"
                  >
                    <div class="flex size-6 items-center justify-center rounded-sm border">
                      <Avatar shape="square" class="size-7">
                        <AvatarImage v-if="project.logo" :src="project.logo" />
                        <AvatarImage v-else src="/default-project.jpg" />
                        <AvatarFallback class="uppercase text-white">
                          {{ project.name.slice(0, 2) }}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {{ project.name }}
                  </DropdownMenuItem>
                </template>

                <template v-if="groupItems.length">
                  <DropdownMenuLabel class="text-xs text-muted-foreground">
                    Grupos
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    v-for="group in groupItems"
                    :key="group.id"
                    class="gap-2 p-2"
                    @click="setActiveGroupProject(group)"
                  >
                    <div class="flex size-6 items-center justify-center rounded-sm border">
                      <Avatar shape="square" class="size-7">
                        <AvatarImage v-if="group.logo" :src="group.logo" />
                        <AvatarImage v-else src="/default-project.jpg" />
                        <AvatarFallback class="uppercase text-white">
                          {{ group.name.slice(0, 2) }}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {{ group.name }}
                  </DropdownMenuItem>
                </template>
              </ScrollArea>
```

In the `<script setup>` add the computed (near other computeds):

```ts
const projectItems = computed(() =>
  workspaceStore.group_projects.filter((item: any) => item.type !== "group"),
);
const groupItems = computed(() =>
  workspaceStore.group_projects.filter((item: any) => item.type === "group"),
);
```

Ensure `computed` is imported in `LeftMenuComponent.vue` (it already uses computed elsewhere; if not, add `import { computed } from "vue";`).

- [ ] **Step 4: Typecheck and run tests**

Run: `npx vue-tsc --noEmit 2>&1 | grep -E "src/(contracts/(api|group|groupMember|groupInvitation|workspace)\.ts|services/groups\.ts|stores/groups\.ts|composables/useGroupPermissions\.ts|components/groups/|views/dashboard/(Groups|GroupDetails)\.vue)" || echo "groups-typecheck: clean"` then `npx vitest run`
Expected: `groups-typecheck: clean`; all specs pass.

- [ ] **Step 5: Manual verification**

With a pending invitation for the logged-in e-mail, the banner shows; accept adds the group to `/groups` and (when `access_projects=true`) to the workspace dropdown under "Grupos". Selecting it triggers `set-project-workspace` with `group_{id}`.

- [ ] **Step 6: Commit**

```bash
git add src/components/groups/InviteBanner.vue src/layouts/default.vue src/components/layout/LeftMenuComponent.vue
git commit -m "feat: add global invite banner and group workspace selector"
```

---

## Task 11: Final verification and cleanup

**Files:**
- Modify: `README.md` (optional; only if you want to document test commands)

**Interfaces:**
- Consumes: everything above.
- Produces: green `test`, `typecheck`, `build`; manual checklist evidence.

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all specs PASS.

- [ ] **Step 2: Typecheck**

Run: `npx vue-tsc --noEmit 2>&1 | grep -E "src/(contracts/(api|group|groupMember|groupInvitation|workspace)\.ts|services/groups\.ts|stores/groups\.ts|composables/useGroupPermissions\.ts|components/groups/|views/dashboard/(Groups|GroupDetails)\.vue)" || echo "groups-typecheck: clean"`
Expected: `groups-typecheck: clean`.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: `vite build` completes and writes `dist/`.

- [ ] **Step 4: Manual acceptance checklist (spec section 8.4/8.5)**

Verify in the dev server:
- [ ] `GET /groups` renders list; empty state shows CTA.
- [ ] Create modal blocks mixed owners and creates via `POST /groups` (201).
- [ ] Detail tabs load `GET /groups/{id}`, members, invitations.
- [ ] `PUT /groups/{id}/projects` replaces the list.
- [ ] Member edit toggles role/`access_projects`; owner row has no menu.
- [ ] Invite sends `POST /groups/{id}/invitations`; revoke uses invitation id.
- [ ] Accept/decline use the invitation `uuid`.
- [ ] 404 removes the group and returns to `/groups`; 403 hides actions; 422 shows message.
- [ ] Legacy `/manage/group-projects` redirects to `/groups`.

- [ ] **Step 5: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: finalize groups feature verification"
```

---

## Self-Review

**Spec coverage**

| Spec section | Task(s) |
|---|---|
| 2 envelope / status codes | 2 (service unwrap), 6 (404 handling), 8/9 (toasts) |
| 3 roles & permissions | 1 (`resolveGroupPermissions`), 8/9 (UI gating) |
| 4 representations | 2 (contracts) |
| 5.1 list | 3, 5 |
| 5.2 create | 2, 5 |
| 5.3 detail/edit/delete | 2, 3, 6 |
| 5.4 projects | 2, 7 |
| 5.5 members | 2, 8 |
| 5.6 invitations | 2, 9, 10 |
| 6 workspace/filter integration | 10 |
| 7 common errors | 6 (404), 8/9 (422), 1/8/9 (403 via hide) |
| 8.1–8.6 UI map/wireframes/states/flows | 5–10 |

**Placeholder scan:** no TBD/TODO; every code step contains full code. The `Nota de ordem` notes and the top-level "Ordem de execução recomendada" are explicit ordering constraints, not unspecified work.

**Type consistency:** `GroupRole`/`GroupPermissions` come from `useGroupPermissions` in Task 1 and are reused in Tasks 6–9. Service method names match store calls. `unwrap` is exported and tested. `SpaApiResponse` is centralized in `contracts/api.ts` and re-exported where previously imported.

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import moment from "moment";
import { toast } from "vue-sonner";
import { useWorkspaceStore } from "@/stores/workspace";
import { useMcpStore } from "@/stores/mcp";
import McpAuditService, { type McpAuditEntry } from "@/services/mcpAudit";
import type { McpConnection } from "@/contracts/mcp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CopyIcon,
  FileTextIcon,
  InfoIcon,
  LightbulbIcon,
  Link2Icon,
  PlugIcon,
  RefreshCwIcon,
  ServerCogIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-vue-next";

const { t } = useI18n();

const workspaceStore = useWorkspaceStore();
const store = useMcpStore();

const groupId = computed(() => workspaceStore.numericGroupId);
const groupName = computed(
  () => workspaceStore.activeGroupProject?.name ?? null,
);

onMounted(() => {
  store.syncWorkspace(groupId.value, groupName.value);
  loadAudit();
});

watch([groupId, groupName], ([nextGroupId, nextGroupName]) => {
  store.syncWorkspace(nextGroupId, nextGroupName);
});

const overview = computed(() => store.overview);
const stats = computed(() => store.stats);

// --- URL do servidor --------------------------------------------------------

const copied = ref(false);

async function copyServerUrl() {
  const url = overview.value?.serverUrl;
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
    copied.value = true;
    toast.success(t("mcp.copied"));
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    toast.error(t("mcp.copy_error"));
  }
}

// --- Como conectar ----------------------------------------------------------

const guideSteps = computed<Record<"claude" | "chatgpt" | "other", string[]>>(
  () => ({
    claude: [
      t("mcp.claude_step_1"),
      t("mcp.claude_step_2"),
      t("mcp.claude_step_3"),
      t("mcp.claude_step_4"),
      t("mcp.claude_step_5"),
    ],
    chatgpt: [
      t("mcp.chatgpt_step_1"),
      t("mcp.chatgpt_step_2"),
      t("mcp.chatgpt_step_3"),
      t("mcp.chatgpt_step_4"),
      t("mcp.chatgpt_step_5"),
    ],
    other: [
      t("mcp.other_step_1"),
      t("mcp.other_step_2"),
      t("mcp.other_step_3"),
      t("mcp.other_step_4"),
      t("mcp.other_step_5"),
    ],
  }),
);

// --- Permissões -------------------------------------------------------------

const permissions = [
  {
    labelKey: "mcp.permission_read",
    scope: "mcp:read",
    descriptionKey: "mcp.permission_read_description",
  },
];

// --- Revogação --------------------------------------------------------------

const revokeTarget = ref<McpConnection | null>(null);

function onRevokeDialogOpen(open: boolean) {
  if (!open && !store.isRevoking) {
    revokeTarget.value = null;
  }
}

async function confirmRevoke() {
  const target = revokeTarget.value;
  if (!target) return;

  try {
    await store.revoke(target.id);
    revokeTarget.value = null;
    toast.success(t("mcp.revoke_success"));
  } catch {
    toast.error(t("mcp.revoke_error"));
  }
}

function formatDate(value: string | null): string {
  return value ? moment(value).format("DD/MM/YYYY [às] HH:mm") : "—";
}

// --- Auditoria de uso -------------------------------------------------------

const auditEntries = ref<McpAuditEntry[]>([]);
const auditLoading = ref(false);
const auditError = ref(false);

async function loadAudit() {
  auditLoading.value = true;
  auditError.value = false;

  try {
    auditEntries.value = await McpAuditService.list();
  } catch {
    auditError.value = true;
  } finally {
    auditLoading.value = false;
  }
}
</script>

<template>
  <div class="w-full max-w-4xl pb-10">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <ServerCogIcon class="size-5" />
          <h3 class="text-lg font-medium">{{ t("mcp.title") }}</h3>
        </div>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t("mcp.description") }}
        </p>
      </div>
      <Badge variant="outline" class="shrink-0">
        {{ t("mcp.sample_data") }}
      </Badge>
    </div>

    <Separator class="mb-4" />

    <div
      class="mb-6 flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground"
    >
      <InfoIcon class="mt-0.5 size-4 shrink-0" />
      <span>{{ t("mcp.sample_notice") }}</span>
    </div>

    <!-- O servidor MCP existe por grupo de projetos -->
    <div
      v-if="!store.hasGroup"
      class="rounded-xl border border-dashed p-10 text-center"
    >
      <p class="font-medium">{{ t("mcp.no_group_title") }}</p>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t("mcp.no_group_description") }}
      </p>
    </div>

    <template v-else>
      <!-- Erro no carregamento -->
      <div
        v-if="store.error && !store.loading"
        class="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center"
      >
        <TriangleAlertIcon class="size-5 text-destructive" />
        <div>
          <p class="font-medium">{{ t("mcp.load_error_title") }}</p>
          <p class="mt-1 text-sm text-muted-foreground">{{ store.error }}</p>
        </div>
        <Button variant="outline" size="sm" @click="store.fetchOverview()">
          <RefreshCwIcon class="mr-2 size-4" />
          {{ t("mcp.retry") }}
        </Button>
      </div>

      <!-- Carregando (primeiro acesso ao grupo) -->
      <div v-else-if="store.loading && !overview" class="space-y-4">
        <Skeleton class="h-52 w-full rounded-xl" />
        <div class="grid gap-3 sm:grid-cols-3">
          <Skeleton class="h-24 rounded-xl" />
          <Skeleton class="h-24 rounded-xl" />
          <Skeleton class="h-24 rounded-xl" />
        </div>
        <Skeleton class="h-64 w-full rounded-xl" />
      </div>

      <template v-else-if="overview">
        <!-- URL do servidor -->
        <section class="rounded-xl border bg-muted/30 p-5">
          <div class="flex items-center gap-2">
            <Link2Icon class="size-4 text-muted-foreground" />
            <h4 class="text-sm font-medium">
              {{ t("mcp.server_url_title") }}
            </h4>
            <Badge
              :variant="overview.serverActive ? 'secondary' : 'outline'"
              class="gap-1.5"
            >
              <span
                class="size-1.5 rounded-full"
                :class="
                  overview.serverActive ? 'bg-emerald-500' : 'bg-muted-foreground'
                "
              />
              {{
                overview.serverActive
                  ? t("mcp.status_active")
                  : t("mcp.status_inactive")
              }}
            </Badge>
          </div>

          <div class="mt-4 flex items-stretch gap-2">
            <div
              class="flex min-w-0 flex-1 items-center rounded-md border bg-background px-3 py-2"
            >
              <code class="truncate text-xs text-muted-foreground sm:text-sm">
                {{ overview.serverUrl }}
              </code>
            </div>
            <Button type="button" variant="outline" @click="copyServerUrl">
              <CopyIcon class="mr-2 size-4" />
              {{ copied ? t("mcp.copied_short") : t("mcp.copy") }}
            </Button>
          </div>

          <p class="mt-4 text-xs text-muted-foreground">
            {{ t("mcp.url_hint_1") }}
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ t("mcp.url_hint_2") }}
          </p>
        </section>

        <!-- Métricas -->
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl border bg-muted/30 p-4">
            <p class="text-xs text-muted-foreground">
              {{ t("mcp.stat_connections") }}
            </p>
            <p class="mt-1 text-2xl font-semibold">
              {{ stats?.activeConnections ?? 0 }}
            </p>
          </div>
          <div class="rounded-xl border bg-muted/30 p-4">
            <p class="text-xs text-muted-foreground">
              {{ t("mcp.stat_calls") }}
            </p>
            <p class="mt-1 text-2xl font-semibold">
              {{ stats?.callsLast7Days ?? 0 }}
            </p>
          </div>
          <div class="rounded-xl border bg-muted/30 p-4">
            <p class="text-xs text-muted-foreground">
              {{ t("mcp.stat_failures") }}
            </p>
            <p class="mt-1 text-2xl font-semibold">
              {{ stats?.failuresLast7Days ?? 0 }}
            </p>
          </div>
        </div>

        <!-- Como conectar -->
        <section class="mt-8">
          <h4 class="text-base font-semibold">{{ t("mcp.how_title") }}</h4>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ t("mcp.how_description") }}
          </p>

          <Tabs default-value="claude" class="mt-4">
            <TabsList>
              <TabsTrigger value="claude">{{ t("mcp.tab_claude") }}</TabsTrigger>
              <TabsTrigger value="chatgpt">
                {{ t("mcp.tab_chatgpt") }}
              </TabsTrigger>
              <TabsTrigger value="other">{{ t("mcp.tab_other") }}</TabsTrigger>
            </TabsList>

            <TabsContent
              v-for="(steps, key) in guideSteps"
              :key="key"
              :value="key"
              class="mt-3 rounded-xl border bg-muted/20 p-5"
            >
              <ol class="space-y-3">
                <li
                  v-for="(step, index) in steps"
                  :key="index"
                  class="flex items-start gap-3 text-sm"
                >
                  <span
                    class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
                  >
                    {{ index + 1 }}
                  </span>
                  <span class="pt-0.5">{{ step }}</span>
                </li>
              </ol>
              <p class="mt-4 text-xs text-muted-foreground">
                {{ t("mcp.how_footnote") }}
              </p>
            </TabsContent>
          </Tabs>
        </section>

        <!-- Conexões ativas -->
        <section class="mt-8">
          <h4 class="text-base font-semibold">
            {{ t("mcp.connections_title") }}
          </h4>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ t("mcp.connections_description") }}
          </p>

          <div
            v-if="store.connections.length === 0"
            class="mt-4 rounded-xl border border-dashed p-10 text-center"
          >
            <PlugIcon class="mx-auto size-6 text-muted-foreground" />
            <p class="mt-2 font-medium">{{ t("mcp.empty_title") }}</p>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ t("mcp.empty_description") }}
            </p>
          </div>

          <ul v-else class="mt-4 space-y-2">
            <li
              v-for="connection in store.connections"
              :key="connection.id"
              class="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex min-w-0 items-start gap-3">
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background"
                >
                  <PlugIcon class="size-4 text-muted-foreground" />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">
                    {{ connection.assistant }}
                    <span class="font-normal text-muted-foreground">
                      · {{ connection.client }}
                    </span>
                  </p>
                  <p class="mt-0.5 text-xs text-muted-foreground">
                    {{
                      t("mcp.connected_at", {
                        date: formatDate(connection.connectedAt),
                      })
                    }}
                    ·
                    {{
                      t("mcp.last_activity", {
                        date: formatDate(connection.lastActivityAt),
                      })
                    }}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                class="shrink-0 text-destructive hover:text-destructive"
                :disabled="store.isRevoking"
                @click="revokeTarget = connection"
              >
                {{ t("mcp.revoke") }}
              </Button>
            </li>
          </ul>
        </section>

        <!-- Permissões, exemplos e boas práticas -->
        <div class="mt-4 grid items-start gap-4 md:grid-cols-2">
          <section class="rounded-xl border bg-muted/30 p-5">
            <div class="flex items-center gap-2">
              <ShieldCheckIcon class="size-4 text-muted-foreground" />
              <h4 class="text-sm font-semibold">{{ t("mcp.permissions_title") }}</h4>
            </div>
            <p class="mt-2 text-xs text-muted-foreground">
              {{ t("mcp.permissions_description") }}
            </p>

            <ul class="mt-4 space-y-4">
              <li
                v-for="permission in permissions"
                :key="permission.scope"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-xs font-medium">
                    {{ t(permission.labelKey) }}
                  </p>
                  <code
                    class="rounded border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {{ permission.scope }}
                  </code>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ t(permission.descriptionKey) }}
                </p>
              </li>
            </ul>
          </section>

          <div class="space-y-4">
            <section class="rounded-xl border bg-muted/30 p-5">
              <div class="flex items-center gap-2">
                <FileTextIcon class="size-4 text-muted-foreground" />
                <h4 class="text-sm font-semibold">
                  {{ t("mcp.examples_title") }}
                </h4>
              </div>
              <p class="mt-2 text-xs text-muted-foreground">
                {{ t("mcp.examples_description") }}
              </p>

              <ul class="mt-3 space-y-2">
                <li
                  v-for="index in 4"
                  :key="index"
                  class="rounded-md border bg-background p-3 text-xs"
                >
                  {{ t(`mcp.example_${index}`) }}
                </li>
              </ul>
            </section>

            <section class="rounded-xl border bg-muted/30 p-5">
              <div class="flex items-center gap-2">
                <LightbulbIcon class="size-4 text-muted-foreground" />
                <h4 class="text-sm font-semibold">
                  {{ t("mcp.best_practices_title") }}
                </h4>
              </div>

              <ul class="mt-3 space-y-2.5">
                <li
                  v-for="index in 4"
                  :key="index"
                  class="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span class="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-500" />
                  <span>{{ t(`mcp.best_practice_${index}`) }}</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </template>
    </template>

    <!-- Auditoria de uso -->
    <section class="mt-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h4 class="text-base font-semibold">{{ t("mcp.audit_title") }}</h4>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ t("mcp.audit_description") }}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          :disabled="auditLoading"
          @click="loadAudit"
        >
          <RefreshCwIcon
            class="size-4"
            :class="auditLoading ? 'animate-spin' : ''"
          />
        </Button>
      </div>

      <div v-if="auditLoading" class="mt-4 space-y-2">
        <Skeleton v-for="n in 3" :key="n" class="h-11 w-full rounded-lg" />
      </div>

      <div
        v-else-if="auditError"
        class="mt-4 rounded-xl border border-dashed p-8 text-center"
      >
        <TriangleAlertIcon class="mx-auto size-5 text-destructive" />
        <p class="mt-2 text-sm font-medium">{{ t("mcp.audit_error") }}</p>
        <Button variant="outline" size="sm" class="mt-3" @click="loadAudit">
          {{ t("mcp.audit_retry") }}
        </Button>
      </div>

      <div
        v-else-if="auditEntries.length === 0"
        class="mt-4 rounded-xl border border-dashed p-8 text-center"
      >
        <PlugIcon class="mx-auto size-5 text-muted-foreground" />
        <p class="mt-2 text-sm font-medium">{{ t("mcp.audit_empty") }}</p>
        <p class="mt-1 text-xs text-muted-foreground">
          {{ t("mcp.audit_empty_hint") }}
        </p>
      </div>

      <div v-else class="mt-4 overflow-x-auto rounded-xl border">
        <table class="w-full text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-4 py-2 text-left font-medium">
                {{ t("mcp.audit_column_date") }}
              </th>
              <th class="px-4 py-2 text-left font-medium">
                {{ t("mcp.audit_column_tool") }}
              </th>
              <th class="px-4 py-2 text-left font-medium">
                {{ t("mcp.audit_column_status") }}
              </th>
              <th class="px-4 py-2 text-left font-medium">
                {{ t("mcp.audit_column_duration") }}
              </th>
              <th class="px-4 py-2 text-left font-medium">
                {{ t("mcp.audit_column_client") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in auditEntries"
              :key="entry.id"
              class="border-t"
            >
              <td class="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                {{ formatDate(entry.occurred_at) }}
              </td>
              <td class="px-4 py-2">
                <span class="font-medium">{{ entry.tool }}</span>
                <span
                  v-if="entry.filter_id"
                  class="ml-2 text-xs text-muted-foreground"
                >
                  {{ entry.filter_id }}
                </span>
              </td>
              <td class="px-4 py-2">
                <Badge
                  :variant="
                    entry.status === 'success' ? 'secondary' : 'destructive'
                  "
                >
                  {{
                    entry.status === "success"
                      ? t("mcp.audit_status_success")
                      : t("mcp.audit_status_error")
                  }}
                </Badge>
              </td>
              <td class="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                {{ entry.duration_ms }} ms
              </td>
              <td class="px-4 py-2 text-xs text-muted-foreground">
                {{ entry.client || "—" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Confirmação de revogação -->
    <AlertDialog
      :open="revokeTarget !== null"
      @update:open="onRevokeDialogOpen"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t("mcp.revoke_title") }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t("mcp.revoke_description", {
                name: revokeTarget
                  ? `${revokeTarget.assistant} · ${revokeTarget.client}`
                  : "",
              })
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="store.isRevoking">
            {{ t("cancel") }}
          </AlertDialogCancel>
          <Button
            :disabled="store.isRevoking"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmRevoke"
          >
            {{
              store.isRevoking
                ? t("mcp.revoke_loading")
                : t("mcp.revoke_confirm")
            }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

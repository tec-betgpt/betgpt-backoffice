<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import moment from "moment";
import { toast } from "vue-sonner";
import { buildMcpServerUrl } from "@/lib/mcp";
import McpAuditService, {
  type McpAuditEntry,
  type McpAuditStats,
} from "@/services/mcpAudit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CopyIcon,
  LightbulbIcon,
  Link2Icon,
  PlugIcon,
  RefreshCwIcon,
  ServerCogIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-vue-next";

const { t } = useI18n();

const serverUrl = buildMcpServerUrl();

// --- URL do servidor --------------------------------------------------------

const copied = ref(false);

async function copyServerUrl() {
  try {
    await navigator.clipboard.writeText(serverUrl);
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

// --- Auditoria de uso -------------------------------------------------------

const auditEntries = ref<McpAuditEntry[]>([]);
const auditStats = ref<McpAuditStats>({
  calls_last_7_days: 0,
  failures_last_7_days: 0,
});
const auditLoading = ref(false);
const auditError = ref(false);

async function loadAudit() {
  auditLoading.value = true;
  auditError.value = false;

  try {
    const result = await McpAuditService.list();
    auditEntries.value = result.items;
    auditStats.value = result.stats;
  } catch {
    auditError.value = true;
  } finally {
    auditLoading.value = false;
  }
}

function formatDate(value: string | null): string {
  return value ? moment(value).format("DD/MM/YYYY [às] HH:mm") : "—";
}

onMounted(loadAudit);
</script>

<template>
  <div class="mx-auto w-full max-w-5xl space-y-6 p-10 pb-16 max-[450px]:p-2">
    <div class="space-y-0.5">
      <div class="flex items-center gap-2">
        <ServerCogIcon class="size-6" />
        <h2 class="text-2xl font-bold tracking-tight">{{ t("mcp.title") }}</h2>
      </div>
      <p class="text-muted-foreground">
        {{ t("mcp.description") }}
      </p>
    </div>

    <div class="space-y-4">
      <div class="grid items-start gap-4 lg:grid-cols-3">
        <!-- URL do servidor -->
        <section class="rounded-xl border bg-muted/30 p-5 lg:col-span-2">
          <div class="flex items-center gap-2">
            <Link2Icon class="size-4 text-muted-foreground" />
            <h4 class="text-sm font-medium">{{ t("mcp.server_url_title") }}</h4>
          </div>

          <div class="mt-4 flex items-stretch gap-2">
            <div
              class="flex min-w-0 flex-1 items-center rounded-md border bg-background px-3 py-2"
            >
              <code class="truncate text-xs text-muted-foreground sm:text-sm">
                {{ serverUrl }}
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

        <!-- Métricas reais (auditoria) -->
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div class="rounded-xl border bg-muted/30 p-4">
            <p class="text-xs text-muted-foreground">
              {{ t("mcp.stat_calls") }}
            </p>
            <Skeleton v-if="auditLoading" class="mt-2 h-7 w-16" />
            <p v-else class="mt-1 text-2xl font-semibold">
              {{ auditError ? "—" : auditStats.calls_last_7_days }}
            </p>
          </div>
          <div class="rounded-xl border bg-muted/30 p-4">
            <p class="text-xs text-muted-foreground">
              {{ t("mcp.stat_failures") }}
            </p>
            <Skeleton v-if="auditLoading" class="mt-2 h-7 w-16" />
            <p v-else class="mt-1 text-2xl font-semibold">
              {{ auditError ? "—" : auditStats.failures_last_7_days }}
            </p>
          </div>
        </div>
      </div>

      <!-- Como conectar -->
      <section class="pt-4">
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

      <!-- Auditoria + informações -->
      <div class="grid items-start gap-4 lg:grid-cols-3">
        <!-- Auditoria de uso -->
        <section class="lg:col-span-2">
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
                  <td
                    class="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground"
                  >
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
                  <td
                    class="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground"
                  >
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

        <!-- Permissões e boas práticas -->
        <div class="space-y-4">
          <section class="rounded-xl border bg-muted/30 p-5">
            <div class="flex items-center gap-2">
              <ShieldCheckIcon class="size-4 text-muted-foreground" />
              <h4 class="text-sm font-semibold">
                {{ t("mcp.permissions_title") }}
              </h4>
            </div>
            <p class="mt-2 text-xs text-muted-foreground">
              {{ t("mcp.permissions_description") }}
            </p>

            <ul class="mt-4 space-y-4">
              <li v-for="permission in permissions" :key="permission.scope">
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
    </div>
  </div>
</template>

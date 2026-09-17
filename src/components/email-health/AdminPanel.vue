<template>
  <Card v-if="isMember" class="overflow-hidden">
    <CardHeader class="py-4">
      <div class="flex items-start justify-between gap-2">
        <div>
          <CardTitle class="text-base">{{ t("email_health.admin.title") }}</CardTitle>
          <p class="text-xs text-muted-foreground mt-0.5">{{ t("email_health.admin.subtitle") }}</p>
        </div>
        <Button
          size="sm"
          :disabled="syncing"
          @click="onSyncNow"
        >
          <RefreshCw class="h-4 w-4 mr-1" :class="{ 'animate-spin': syncing }" />
          {{ syncing ? t("email_health.admin.sync_running") : t("email_health.admin.sync_now") }}
        </Button>
      </div>
    </CardHeader>
    <Separator />
    <CardContent class="pt-6">
      <EmailHealthEmptyState
        v-if="forbidden"
        variant="error"
        :message="t('email_health.admin.no_permission')"
      />

      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t("email_health.admin.column_domain") }}</TableHead>
            <TableHead>{{ t("email_health.admin.column_project") }}</TableHead>
            <TableHead>{{ t("email_health.admin.column_last_sync") }}</TableHead>
            <TableHead class="text-right">{{ t("email_health.admin.column_active") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="domain in store.domains" :key="domain.id">
            <TableCell class="font-medium">{{ domain.domain }}</TableCell>
            <TableCell>
              <Select
                :model-value="domain.project_id ? String(domain.project_id) : NONE_VALUE"
                :disabled="updatingId === domain.id"
                @update:model-value="(value) => onProjectChange(domain, value)"
              >
                <SelectTrigger class="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="NONE_VALUE">{{ t("email_health.admin.no_project") }}</SelectItem>
                  <SelectItem
                    v-for="project in projects"
                    :key="project.id"
                    :value="String(project.id)"
                  >
                    {{ project.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell class="text-nowrap text-muted-foreground text-sm">
              {{ domain.last_successful_sync_at ? formatDateTime(domain.last_successful_sync_at) : "—" }}
            </TableCell>
            <TableCell class="text-right">
              <Switch
                :model-value="domain.active"
                :disabled="updatingId === domain.id"
                @update:model-value="(value) => onActiveChange(domain, value)"
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div class="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{{ t("email_health.admin.connect_hint") }}</span>
        <router-link :to="{ name: 'data-sources' }">
          <Button variant="outline" size="sm">
            <ExternalLink class="h-3.5 w-3.5 mr-1" />
            {{ t("email_health.admin.connect_action") }}
          </Button>
        </router-link>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import moment from "moment";
import { toast } from "vue-sonner";
import { RefreshCw, ExternalLink } from "lucide-vue-next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmailHealthEmptyState from "@/components/email-health/EmailHealthEmptyState.vue";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { useEmailHealthStore } from "@/stores/emailHealth";
import { listSyncRuns, triggerManualSync, updateDomain } from "@/services/emailHealth";
import type { EmailHealthDomain } from "@/contracts/emailHealth";

const NONE_VALUE = "none";
const POLL_INTERVAL_MS = 8000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const { t } = useI18n();
const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();
const store = useEmailHealthStore();

const isMember = computed(() => (authStore.user as any)?.access_type === "member");

const forbidden = ref(false);
const updatingId = ref<number | null>(null);
const syncing = ref(false);

let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollStartedAt = 0;

const projects = computed(() =>
  (workspaceStore.group_projects as Array<{ type: string; project_id: string; name: string }>)
    .filter((item) => item.type === "project" && item.project_id)
    .map((item) => ({ id: Number(item.project_id), name: item.name }))
    .filter((item) => Number.isFinite(item.id)),
);

function isForbiddenError(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403;
}

async function onProjectChange(domain: EmailHealthDomain, value: unknown) {
  const projectId = value === NONE_VALUE ? null : Number(value);
  await patchDomain(domain, { project_id: projectId });
}

async function onActiveChange(domain: EmailHealthDomain, value: unknown) {
  await patchDomain(domain, { active: Boolean(value) });
}

async function patchDomain(
  domain: EmailHealthDomain,
  payload: { project_id?: number | null; active?: boolean },
) {
  updatingId.value = domain.id;

  try {
    const updated = await updateDomain(domain.id, payload);
    const index = store.domains.findIndex((d) => d.id === domain.id);
    if (index >= 0) store.domains.splice(index, 1, updated);
    toast.success(t("email_health.admin.update_success"));
  } catch (error) {
    if (isForbiddenError(error)) {
      forbidden.value = true;
    } else {
      toast.error(t("email_health.admin.update_error"));
    }
  } finally {
    updatingId.value = null;
  }
}

async function onSyncNow() {
  if (syncing.value) return;

  try {
    const response = await triggerManualSync({});
    syncing.value = true;
    toast.success(t("email_health.admin.sync_queued"), {
      description: t("email_health.admin.sync_queued_description"),
    });
    startPolling(response.sync_run_id);
  } catch (error) {
    if (isForbiddenError(error)) {
      forbidden.value = true;
    }
  }
}

function startPolling(syncRunId: number) {
  stopPolling();
  pollStartedAt = Date.now();

  pollTimer = setInterval(async () => {
    if (Date.now() - pollStartedAt > POLL_TIMEOUT_MS) {
      stopPolling();
      syncing.value = false;
      return;
    }

    try {
      const runs = await listSyncRuns();
      const run = runs.find((item) => item.id === syncRunId);
      if (!run || run.status === "running") return;

      stopPolling();
      syncing.value = false;

      if (run.status === "failed") {
        toast.error(t("email_health.admin.sync_failed"));
      } else {
        toast.success(t("email_health.admin.sync_finished"));
      }

      await store.refreshAll();
    } catch (error) {
      if (isForbiddenError(error)) {
        forbidden.value = true;
        stopPolling();
        syncing.value = false;
      }
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function formatDateTime(value: string) {
  return moment(value).format("DD/MM/YYYY HH:mm");
}

onBeforeUnmount(stopPolling);
</script>

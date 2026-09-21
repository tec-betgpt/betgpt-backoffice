<template>
  <Card>
    <CardContent class="space-y-4 py-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 class="font-medium">{{ $t("groups_consolidated") }}</h3>
        <div class="flex items-center gap-2">
          <Input
            v-model="search"
            class="w-[220px]"
            :placeholder="$t('groups_search_by_name')"
            @keydown.enter="applySearch"
          />
          <Button variant="outline" size="sm" :disabled="loading" @click="applySearch">
            {{ $t("groups_search") }}
          </Button>
          <Label class="text-sm text-muted-foreground">
            {{ $t("groups_consolidated_resource") }}
          </Label>
          <Select v-model="resource">
            <SelectTrigger class="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="campaigns">
                {{ $t("groups_consolidated_campaigns") }}
              </SelectItem>
              <SelectItem value="players">
                {{ $t("groups_consolidated_players") }}
              </SelectItem>
              <SelectItem value="links">
                {{ $t("groups_consolidated_links") }}
              </SelectItem>
              <SelectItem value="segments">
                {{ $t("groups_consolidated_segments") }}
              </SelectItem>
              <SelectItem value="target-audiences">
                {{ $t("groups_consolidated_target_audiences") }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table class="w-full">
        <TableHeader>
          <TableRow>
            <TableHead
              v-for="col in columns"
              :key="col.key"
              :class="col.align === 'right' ? 'text-right' : undefined"
            >
              {{ $t(col.label) }}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody v-if="loading">
          <TableRow v-for="n in 6" :key="n">
            <TableCell :colspan="columns.length">
              <Skeleton class="h-6 w-full" />
            </TableCell>
          </TableRow>
        </TableBody>
        <TableBody v-else-if="rows.length">
          <TableRow v-for="(row, index) in rows" :key="row.id ?? index">
            <TableCell
              v-for="col in columns"
              :key="col.key"
              :class="col.align === 'right' ? 'text-right' : undefined"
            >
              {{ renderCell(row, col) }}
            </TableCell>
          </TableRow>
        </TableBody>
        <TableBody v-else>
          <TableRow>
            <TableCell
              :colspan="columns.length"
              class="py-8 text-center text-muted-foreground"
            >
              {{ $t("groups_consolidated_empty") }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div class="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          :disabled="page <= 1"
          @click="goToPage(page - 1)"
        >
          ‹
        </Button>
        <span class="text-sm text-muted-foreground">
          {{ page }} / {{ lastPage }}
        </span>
        <Button
          variant="outline"
          size="sm"
          :disabled="page >= lastPage"
          @click="goToPage(page + 1)"
        >
          ›
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
import { listGroupConsolidated } from "@/services/groups";
import type { GroupConsolidatedList } from "@/services/groups";
import { CAMPAIGN_STATUS_LABELS } from "@/contracts/campaigns";
import type { CampaignStatus } from "@/contracts/campaigns";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group } from "@/contracts/group";

const props = defineProps<{ group: Group }>();

type Row = Record<string, any>;
interface Column {
  key: string;
  label: string;
  align?: "left" | "right";
  format?: (row: Row) => string;
}

const resource = ref<GroupConsolidatedList>("players");
const search = ref("");
const rows = ref<Row[]>([]);
const page = ref(1);
const lastPage = ref(1);
const loading = ref(false);

/** id do projeto -> nome, a partir dos projetos vinculados ao grupo. */
const projectNameById = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  for (const project of props.group.projects ?? []) {
    map[String(project.id)] = project.name;
  }
  return map;
});

function projectName(row: Row): string {
  const direct = row.project?.name;
  if (direct) return direct;
  const id = row.project_id ?? row.project?.id ?? row.identity_project_id;
  if (id == null) return "—";
  return projectNameById.value[String(id)] ?? `#${id}`;
}

function formatDate(value: unknown): string {
  return value ? moment(String(value)).format("DD/MM/YYYY") : "—";
}

function formatDateTime(value: unknown): string {
  return value ? moment(String(value)).format("DD/MM/YYYY HH:mm") : "—";
}

function formatCurrency(value: unknown): string {
  return (Number(value) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatNumber(value: unknown): string {
  if (value == null || value === "") return "—";
  return Number(value).toLocaleString("pt-BR");
}

function text(value: unknown): string {
  return value == null || value === "" ? "—" : String(value);
}

function campaignStatus(row: Row): string {
  return CAMPAIGN_STATUS_LABELS[row.status as CampaignStatus] ?? text(row.status);
}

function channelLabel(row: Row): string {
  if (row.channel === "sms") return "SMS";
  if (row.channel === "email") return "E-mail";
  return "—";
}

const COLUMNS: Record<GroupConsolidatedList, Column[]> = {
  campaigns: [
    { key: "name", label: "groups_name", format: (r) => text(r.name) },
    { key: "status", label: "groups_status", format: campaignStatus },
    { key: "channel", label: "groups_col_channel", format: channelLabel },
    { key: "project", label: "groups_col_project", format: projectName },
    { key: "created_at", label: "groups_created_at", format: (r) => formatDate(r.created_at) },
  ],
  players: [
    { key: "name", label: "groups_name", format: (r) => text(r.name) },
    { key: "email", label: "groups_col_email", format: (r) => text(r.email) },
    {
      key: "project_status",
      label: "groups_col_project_status",
      format: (r) => text(r.project_status),
    },
    { key: "ggr", label: "groups_col_ggr", align: "right", format: (r) => formatCurrency(r.ggr) },
    {
      key: "deposit_approved",
      label: "groups_col_deposited",
      align: "right",
      format: (r) => formatCurrency(r.deposit_approved),
    },
    { key: "project", label: "groups_col_project", format: projectName },
    { key: "created_at", label: "groups_created_at", format: (r) => formatDate(r.created_at) },
  ],
  links: [
    {
      key: "short_url",
      label: "groups_col_link",
      format: (r) => text(r.short_url ?? r.code ?? r.slug),
    },
    { key: "domain", label: "groups_col_domain", format: (r) => text(r.domain) },
    { key: "status", label: "groups_status", format: (r) => text(r.status) },
    { key: "project", label: "groups_col_project", format: projectName },
    { key: "created_at", label: "groups_created_at", format: (r) => formatDate(r.created_at) },
  ],
  segments: [
    { key: "name", label: "groups_name", format: (r) => text(r.name) },
    { key: "description", label: "groups_description", format: (r) => text(r.description) },
    { key: "players", label: "groups_col_players", align: "right", format: (r) => formatNumber(r.players) },
    { key: "status", label: "groups_status", format: (r) => text(r.status) },
    { key: "project", label: "groups_col_project", format: projectName },
    {
      key: "last_job_execute_at",
      label: "groups_col_last_run",
      format: (r) => formatDateTime(r.last_job_execute_at),
    },
    { key: "created_at", label: "groups_created_at", format: (r) => formatDate(r.created_at) },
  ],
  "target-audiences": [
    { key: "name", label: "groups_name", format: (r) => text(r.name) },
    { key: "description", label: "groups_description", format: (r) => text(r.description) },
    { key: "players", label: "groups_col_players", align: "right", format: (r) => formatNumber(r.players) },
    { key: "status", label: "groups_status", format: (r) => text(r.status) },
    { key: "project", label: "groups_col_project", format: projectName },
    { key: "created_at", label: "groups_created_at", format: (r) => formatDate(r.created_at) },
  ],
};

const columns = computed<Column[]>(() => COLUMNS[resource.value]);

function renderCell(row: Row, col: Column): string {
  if (col.format) return col.format(row);
  return text(row[col.key]);
}

/** Normaliza os formatos de resposta de cada recurso (ver rota-grupos-respostas.md §6). */
function extract(payload: any): { rows: Row[]; lastPage: number } {
  if (resource.value === "segments" || resource.value === "target-audiences") {
    const body = payload?.target_audiences ? payload : (payload?.data ?? payload);
    return {
      rows: body?.target_audiences ?? [],
      lastPage: Math.max(1, Number(body?.pagination?.last_page) || 1),
    };
  }

  // campaigns/players vêm como paginator cru; links vem como paginator no envelope.
  const body = payload ?? {};
  const total = Number(body.total) || 0;
  const perPage = Number(body.per_page) || 0;
  const last =
    Number(body.last_page) ||
    (total && perPage ? Math.ceil(total / perPage) : 1);
  return { rows: body.data ?? [], lastPage: Math.max(1, last) };
}

async function reload() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: page.value,
      per_page: 15,
    };
    if (search.value.trim()) params.search = search.value.trim();

    const payload = await listGroupConsolidated<Record<string, any>>(
      props.group.id,
      resource.value,
      params,
    );
    const result = extract(payload);
    rows.value = result.rows;
    lastPage.value = result.lastPage;
  } catch (error) {
    rows.value = [];
    lastPage.value = 1;
    showApiErrorToast(error);
  } finally {
    loading.value = false;
  }
}

function goToPage(next: number) {
  if (next < 1 || next > lastPage.value) return;
  page.value = next;
}

function applySearch() {
  if (page.value !== 1) {
    page.value = 1;
  } else {
    reload();
  }
}

watch(resource, () => {
  search.value = "";
  if (page.value !== 1) {
    page.value = 1;
  } else {
    reload();
  }
});
watch(page, reload);
watch(
  () => props.group.id,
  () => {
    page.value = 1;
    reload();
  },
);

onMounted(reload);
</script>

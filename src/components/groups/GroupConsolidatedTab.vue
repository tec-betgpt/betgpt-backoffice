<template>
  <Card>
    <CardContent class="space-y-4 py-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 class="font-medium">{{ $t("groups_consolidated") }}</h3>
        <div class="flex items-center gap-2">
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
            <TableHead>{{ $t("groups_name") }}</TableHead>
            <TableHead>{{ $t("groups_status_active") }}</TableHead>
            <TableHead class="text-right">{{ $t("groups_fin_date") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody v-if="loading">
          <TableRow v-for="n in 6" :key="n">
            <TableCell colspan="3">
              <Skeleton class="h-6 w-full" />
            </TableCell>
          </TableRow>
        </TableBody>
        <TableBody v-else-if="rows.length">
          <TableRow v-for="(row, index) in rows" :key="row.id ?? index">
            <TableCell>{{ row.name ?? row.title ?? "—" }}</TableCell>
            <TableCell>{{ row.status ?? "—" }}</TableCell>
            <TableCell class="text-right">
              {{ formatDate(row.created_at) }}
            </TableCell>
          </TableRow>
        </TableBody>
        <TableBody v-else>
          <TableRow>
            <TableCell :colspan="3" class="py-8 text-center text-muted-foreground">
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
import { onMounted, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group } from "@/contracts/group";

const props = defineProps<{ group: Group }>();

const resource = ref<GroupConsolidatedList>("players");
const rows = ref<Array<Record<string, any>>>([]);
const page = ref(1);
const lastPage = ref(1);
const loading = ref(false);

function formatDate(value: unknown): string {
  if (!value) return "—";
  return new Date(String(value)).toLocaleDateString("pt-BR");
}

/** Normaliza os formatos variados de lista entre os recursos. */
function extractRows(payload: any): Array<Record<string, any>> {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.target_audiences)) return payload.target_audiences;
  if (Array.isArray(payload?.data?.target_audiences)) {
    return payload.data.target_audiences;
  }
  return [];
}

function extractLastPage(payload: any): number {
  return (
    payload?.last_page ??
    payload?.meta?.last_page ??
    payload?.pagination?.last_page ??
    payload?.data?.pagination?.last_page ??
    1
  );
}

async function reload() {
  loading.value = true;
  try {
    const payload = await listGroupConsolidated<Record<string, any>>(
      props.group.id,
      resource.value,
      { page: page.value, per_page: 15 },
    );
    rows.value = extractRows(payload);
    lastPage.value = Math.max(1, Number(extractLastPage(payload)) || 1);
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

watch(resource, () => {
  page.value = 1;
  reload();
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

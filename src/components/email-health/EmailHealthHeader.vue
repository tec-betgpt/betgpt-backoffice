<template>
  <div class="flex flex-col gap-4 pb-6">
    <div class="grid min-[900px]:grid-cols-2 gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">{{ t("email_health.title") }}</h2>
        <p class="text-muted-foreground text-sm">
          {{ t("email_health.last_update") }}:
          <span class="font-medium text-foreground">{{ lastUpdateLabel }}</span>
        </p>
      </div>

      <div class="flex flex-col items-start sm:flex-row sm:items-center justify-end gap-3 w-full">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="text-sm text-muted-foreground text-nowrap">
            {{ t("email_health.select_domain") }}
          </span>
          <Select
            :model-value="selectedDomainValue"
            @update:model-value="onDomainChange"
          >
            <SelectTrigger class="w-full sm:w-[220px]">
              <SelectValue :placeholder="t('email_health.select_domain_placeholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="domain in store.domains"
                :key="domain.id"
                :value="String(domain.id)"
              >
                {{ domain.domain }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex items-center gap-1">
          <Button
            v-for="option in rangeOptions"
            :key="option"
            size="sm"
            :variant="store.range === option ? 'default' : 'outline'"
            class="px-2.5"
            @click="store.setRange(option)"
          >
            {{ t(`email_health.period.${option}`) }}
          </Button>
        </div>
      </div>
    </div>

    <div v-if="sources" class="flex flex-wrap items-center gap-4 text-sm">
      <div
        v-for="sourceKey in (['v1', 'v2'] as const)"
        :key="sourceKey"
        class="flex items-center gap-1.5"
      >
        <span
          class="inline-block h-2.5 w-2.5 rounded-full"
          :class="dotClass(sources[sourceKey].status)"
        />
        <span class="font-medium">{{ t(`email_health.source_health.title_${sourceKey}`) }}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <span class="text-muted-foreground text-xs cursor-default underline decoration-dotted underline-offset-2">
                {{ statusLabel(sources[sourceKey].status) }}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p v-if="sources[sourceKey].last_success_at">
                {{ t("email_health.source_health.last_success", { date: formatDateTime(sources[sourceKey].last_success_at) }) }}
              </p>
              <p v-if="sources[sourceKey].last_data_date">
                {{ t("email_health.source_health.last_data", { date: formatDate(sources[sourceKey].last_data_date) }) }}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import moment from "moment";
import { storeToRefs } from "pinia";
import { useEmailHealthStore } from "@/stores/emailHealth";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EmailHealthRange, SourceHealth } from "@/contracts/emailHealth";

const { t } = useI18n();
const store = useEmailHealthStore();
const { overview } = storeToRefs(store);

const rangeOptions: EmailHealthRange[] = ["7d", "30d", "60d", "90d", "120d"];

const selectedDomainValue = computed(() =>
  store.selectedDomainId ? String(store.selectedDomainId) : "",
);

const sources = computed(() => overview.value?.sources ?? null);

const lastUpdateLabel = computed(() => {
  const value = overview.value?.last_successful_sync_at;
  return value ? formatDateTime(value) : "—";
});

function onDomainChange(value: unknown) {
  const id = Number(value);
  if (Number.isFinite(id)) store.selectDomain(id);
}

function dotClass(status: SourceHealth["status"]) {
  if (status === "ok") return "bg-green-500";
  if (status === "no_data") return "bg-amber-500";
  return "bg-red-500";
}

function statusLabel(status: SourceHealth["status"]) {
  return t(`email_health.source_health.${status}`);
}

function formatDateTime(value: string) {
  return moment(value).format("DD/MM/YYYY HH:mm");
}

function formatDate(value: string) {
  return moment(value).format("DD/MM/YYYY");
}
</script>

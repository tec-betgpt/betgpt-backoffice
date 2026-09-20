<template>
  <div class="flex flex-col gap-4 pb-6">
    <div class="grid min-[900px]:grid-cols-2 gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">{{ t("email_health.title") }}</h2>
        <p v-if="domainName" class="text-sm font-medium mt-0.5">{{ domainName }}</p>
        <p class="text-muted-foreground text-sm">
          {{ t("email_health.last_update") }}:
          <span class="font-medium text-foreground">{{ lastUpdateLabel }}</span>
        </p>
      </div>

      <div class="flex items-center justify-end gap-1 w-full">
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

    <div v-if="sources" class="flex flex-wrap items-center gap-4 text-sm">
      <div
        v-for="sourceKey in (['v2'] as const)"
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

const domainName = computed(() => store.selectedDomain?.domain ?? overview.value?.domain?.domain ?? "");

const sources = computed(() => overview.value?.sources?.v2 ? overview.value.sources : null);

const lastUpdateLabel = computed(() => {
  const value = overview.value?.last_successful_sync_at;
  return value ? formatDateTime(value) : "—";
});

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

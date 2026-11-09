<template>
  <div
    class="relative rounded-lg border bg-card text-card-foreground shadow-sm"
    :class="[widthClass, selected ? 'border-primary ring-1 ring-primary' : 'border-border']"
  >
    <div
      v-if="nodeStats"
      class="absolute -top-9 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/60 bg-background px-2 py-1 text-xs font-semibold shadow-sm"
      :title="statsTooltip"
    >
      <Users class="size-3.5 text-muted-foreground" />
      <span>{{ formatCount(nodeStats.reached) }}</span>
      <span v-if="nodeStats.waiting > 0" class="font-normal text-muted-foreground">
        · {{ formatCount(nodeStats.waiting) }} aguardando
      </span>
    </div>

    <div class="flex items-start gap-2.5 px-3 py-2.5">
      <span class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md" :class="iconBackgroundClass">
        <component :is="icon" class="size-4" :class="iconColorClass" />
      </span>
      <div class="min-w-0">
        <div class="truncate text-xs font-semibold">{{ title }}</div>
        <p v-if="description" class="mt-0.5 text-[11px] leading-snug text-muted-foreground">
          {{ description }}
        </p>
      </div>
    </div>

    <div v-if="$slots.default" class="border-t border-border px-3 py-2">
      <slot />
    </div>

    <slot name="handles" />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, type Component, type Ref } from "vue";
import { Users } from "lucide-vue-next";
import type { FlowNodeStats } from "@/contracts/campaignFlow";

const props = withDefaults(
  defineProps<{
    icon: Component;
    title: string;
    description?: string;
    selected?: boolean;
    iconColorClass: string;
    iconBackgroundClass: string;
    widthClass?: string;
    nodeId?: string;
  }>(),
  { widthClass: "w-[240px]", nodeId: undefined, description: undefined },
);

const stats = inject<Ref<Record<string, FlowNodeStats> | null | undefined> | null>("flowNodeStats", null);

const nodeStats = computed(() => (props.nodeId && stats?.value ? stats.value[props.nodeId] ?? null : null));

const statsTooltip = computed(() => {
  const item = nodeStats.value;
  if (!item) return "";

  const parts = [`Passaram: ${item.reached}`, `Aguardando: ${item.waiting}`];
  if (item.yes || item.no) parts.push(`SIM: ${item.yes}`, `NÃO: ${item.no}`);
  if (item.skipped) parts.push(`Pulados: ${item.skipped}`);
  if (item.failed) parts.push(`Falhas: ${item.failed}`);

  return parts.join(" · ");
});

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}
</script>

<script setup lang="ts">
import { computed } from "vue";
import { Tag } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import type { LinkTrackingSummary } from "@/contracts/link";

const props = defineProps<{
  tracking?: LinkTrackingSummary | null;
}>();

const enabled = computed(() => Boolean(props.tracking?.enabled));

const tooltip = computed(() => {
  if (!enabled.value) return "UTMs básicas não configuradas";

  return [
    `source: ${props.tracking?.source || "—"}`,
    `medium: ${props.tracking?.medium || "—"}`,
    `campaign: ${props.tracking?.campaign || "—"}`,
  ].join(" · ");
});
</script>

<template>
  <Badge
    variant="outline"
    :class="[
      'gap-1.5 whitespace-nowrap',
      enabled
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
        : 'text-muted-foreground',
    ]"
    :title="tooltip"
  >
    <Tag class="h-3 w-3" />
    {{ enabled ? "UTMs ativas" : "Sem UTMs" }}
  </Badge>
</template>

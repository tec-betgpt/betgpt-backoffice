<template>
  <Badge :variant="variant">{{ label }}</Badge>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import {
  CAMPAIGN_RUN_RECIPIENT_STATUS_LABELS,
  type CampaignRunRecipientStatus,
} from "@/contracts/campaignExecution";

/**
 * Badge de status interno do recipient de campanha (broadcast_recipients).
 * Ciclo sem `delivered` — a entrega consolida como `sent` (sucesso final).
 * Terminais: sent, failed, dead_letter, canceled.
 */
const props = defineProps<{ status: string | null | undefined }>();

const variant = computed(() => {
  switch (props.status) {
    case "sent":
      return "default" as const;
    case "failed":
    case "dead_letter":
    case "canceled":
      return "destructive" as const;
    case "processing":
      return "secondary" as const;
    default:
      // pending, queued e status desconhecidos
      return "outline" as const;
  }
});

const label = computed(() => {
  if (!props.status) {
    return "—";
  }

  return (
    CAMPAIGN_RUN_RECIPIENT_STATUS_LABELS[props.status as CampaignRunRecipientStatus] ??
    props.status
  );
});
</script>

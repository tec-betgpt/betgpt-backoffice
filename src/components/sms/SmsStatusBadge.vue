<template>
  <Badge :variant="variant">{{ label }}</Badge>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import {
  SMS_MESSAGE_STATUS_LABELS,
  type SmsMessageStatus,
} from "@/contracts/smsMessages";

/**
 * Badge de status consolidado de SMS (ciclo sms_messages — Fase 4).
 * Mapa visual único, reutilizado pelas telas de envio direto, operação de
 * campanha e histórico técnico.
 */
const props = defineProps<{ status: string | null | undefined }>();

const variant = computed(() => {
  switch (props.status) {
    case "delivered":
      return "default" as const;
    case "failed":
    case "rejected":
    case "canceled":
      return "destructive" as const;
    case "sent":
      return "secondary" as const;
    default:
      // accepted, queued, processing e status desconhecidos
      return "outline" as const;
  }
});

const label = computed(() => {
  if (!props.status) {
    return "—";
  }

  return SMS_MESSAGE_STATUS_LABELS[props.status as SmsMessageStatus] ?? props.status;
});
</script>

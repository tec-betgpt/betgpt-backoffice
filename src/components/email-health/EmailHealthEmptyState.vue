<template>
  <div class="flex flex-col items-center justify-center gap-2 py-10 text-center">
    <component :is="icon" class="h-8 w-8 text-muted-foreground" />
    <p class="text-sm font-medium text-muted-foreground">{{ resolvedMessage }}</p>
    <Button
      v-if="variant === 'error'"
      variant="outline"
      size="sm"
      class="mt-1"
      @click="emit('retry')"
    >
      {{ t("email_health.common.retry") }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { AlertCircle, CloudOff, Inbox } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const props = withDefaults(
  defineProps<{
    variant?: "empty" | "unavailable" | "error";
    message?: string;
  }>(),
  { variant: "empty", message: "" },
);

const emit = defineEmits<{ retry: [] }>();

const { t } = useI18n();

const icon = computed(() => {
  if (props.variant === "unavailable") return CloudOff;
  if (props.variant === "error") return AlertCircle;
  return Inbox;
});

const resolvedMessage = computed(() => {
  if (props.message) return props.message;
  if (props.variant === "unavailable") return t("email_health.unavailable");
  if (props.variant === "error") return t("email_health.error_title");
  return t("email_health.empty");
});
</script>

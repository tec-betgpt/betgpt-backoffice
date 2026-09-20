<template>
  <Card class="overflow-hidden flex flex-col">
    <CardHeader class="py-4">
      <div class="flex items-start justify-between gap-2">
        <div>
          <CardTitle class="text-base">{{ title }}</CardTitle>
          <p v-if="subtitle" class="text-xs text-muted-foreground mt-0.5">{{ subtitle }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <slot name="actions" />
          <SourceBadge v-if="source" :source="source" />
        </div>
      </div>
    </CardHeader>
    <Separator />
    <CardContent class="pt-6 flex-1">
      <div v-if="loading" class="space-y-3">
        <Skeleton class="h-5 w-1/3" />
        <Skeleton class="h-40 w-full" />
      </div>

      <EmailHealthEmptyState
        v-else-if="error"
        variant="error"
        :message="errorMessage"
        @retry="emit('retry')"
      />

      <EmailHealthEmptyState
        v-else-if="isEmpty"
        :variant="emptyVariant"
        :message="emptyMessage"
      />

      <slot v-else />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import SourceBadge from "@/components/email-health/SourceBadge.vue";
import EmailHealthEmptyState from "@/components/email-health/EmailHealthEmptyState.vue";
import type { PostmasterSourceVersion } from "@/contracts/emailHealth";

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    source?: PostmasterSourceVersion;
    loading: boolean;
    error?: string | null;
    isEmpty?: boolean;
    emptyVariant?: "empty" | "unavailable";
    emptyMessage?: string;
  }>(),
  {
    subtitle: "",
    error: null,
    isEmpty: false,
    emptyVariant: "empty",
    emptyMessage: "",
  },
);

const emit = defineEmits<{ retry: [] }>();

const { t } = useI18n();

const errorMessage = computed(() => {
  if (props.error === "forbidden") return t("api_errors.forbidden");
  return t("email_health.error_title");
});
</script>

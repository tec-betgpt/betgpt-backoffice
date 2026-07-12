<template>
  <div v-if="hasItems" class="space-y-2">
    <Alert v-if="errors.length" variant="destructive">
      <AlertTitle>Erros desta etapa</AlertTitle>
      <AlertDescription>
        <ul class="mt-2 list-disc space-y-1 pl-4">
          <li v-for="item in errors" :key="`${item.field}-${item.message}`">
            <strong>{{ item.field }}:</strong> {{ item.message }}
          </li>
        </ul>
      </AlertDescription>
    </Alert>

    <Alert v-if="warnings.length">
      <AlertTitle>Avisos desta etapa</AlertTitle>
      <AlertDescription>
        <ul class="mt-2 list-disc space-y-1 pl-4">
          <li v-for="item in warnings" :key="`${item.field}-${item.message}`">
            <strong>{{ item.field }}:</strong> {{ item.message }}
          </li>
        </ul>
      </AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CampaignValidationItem } from "@/contracts/campaigns";

const props = withDefaults(
  defineProps<{
    errors?: CampaignValidationItem[];
    warnings?: CampaignValidationItem[];
  }>(),
  {
    errors: () => [],
    warnings: () => [],
  },
);

const hasItems = computed(() => props.errors.length > 0 || props.warnings.length > 0);
</script>

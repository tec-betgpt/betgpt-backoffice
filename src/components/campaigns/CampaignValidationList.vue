<template>
  <div v-if="hasItems" class="space-y-2">
    <Alert v-if="errorGroups.length" variant="destructive">
      <AlertTitle>Erros desta etapa</AlertTitle>
      <AlertDescription class="space-y-3">
        <div v-for="group in errorGroups" :key="group.step">
          <button type="button" class="text-left font-semibold underline-offset-4 hover:underline" @click="navigate(group.step)">
            {{ group.label }} ({{ group.items.length }})
          </button>
          <ul class="mt-1 list-disc space-y-1 pl-4">
            <li v-for="item in group.items" :key="`${item.field}-${item.message}`">
              <strong>{{ item.field }}:</strong> {{ item.message }}
            </li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>

    <Alert v-if="warningGroups.length">
      <AlertTitle>Avisos desta etapa</AlertTitle>
      <AlertDescription class="space-y-3">
        <div v-for="group in warningGroups" :key="group.step">
          <button type="button" class="text-left font-semibold underline-offset-4 hover:underline" @click="navigate(group.step)">
            {{ group.label }} ({{ group.items.length }})
          </button>
          <ul class="mt-1 list-disc space-y-1 pl-4">
            <li v-for="item in group.items" :key="`${item.field}-${item.message}`">
              <strong>{{ item.field }}:</strong> {{ item.message }}
            </li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CampaignValidationItem } from "@/contracts/campaigns";
import { groupCampaignValidationItems } from "./campaignValidation";

const props = withDefaults(
  defineProps<{
    errors?: CampaignValidationItem[];
    warnings?: CampaignValidationItem[];
  }>(),
  { errors: () => [], warnings: () => [] },
);
const emit = defineEmits<{ (event: "navigate", step: string): void }>();
const injectedNavigate = inject<((step: string) => void) | null>("campaignValidationNavigate", null);
const hasItems = computed(() => props.errors.length > 0 || props.warnings.length > 0);
const errorGroups = computed(() => groupCampaignValidationItems(props.errors));
const warningGroups = computed(() => groupCampaignValidationItems(props.warnings));

function navigate(step: string) {
  if (injectedNavigate) injectedNavigate(step);
  else emit("navigate", step);
}
</script>

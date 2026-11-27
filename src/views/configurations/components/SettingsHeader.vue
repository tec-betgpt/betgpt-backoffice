<script setup lang="ts">
import { Separator } from "@/components/ui/separator";

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
        <h3 class="text-lg font-medium">{{ title }}</h3>
        <p v-if="description" class="text-sm text-muted-foreground">
          {{ description }}
        </p>
      </div>
      <slot name="actions" />
    </div>
    <Separator />
  </div>
</template>

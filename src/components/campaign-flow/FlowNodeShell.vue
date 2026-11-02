<template>
  <div
    class="rounded-lg border bg-card text-card-foreground shadow-sm"
    :class="[widthClass, selected ? 'border-primary ring-1 ring-primary' : 'border-border']"
  >
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
import type { Component } from "vue";

withDefaults(
  defineProps<{
    icon: Component;
    title: string;
    description?: string;
    selected?: boolean;
    iconColorClass: string;
    iconBackgroundClass: string;
    widthClass?: string;
  }>(),
  { widthClass: "w-[240px]" },
);
</script>

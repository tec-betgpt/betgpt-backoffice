<template>
  <Avatar :shape="shape" :class="props.class">
    <AvatarImage v-if="logoUrl" :src="logoUrl" />
    <AvatarFallback :class="cn('uppercase', props.fallbackClass)">{{ initials }}</AvatarFallback>
  </Avatar>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { HTMLAttributes } from "vue";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<{
  name: string
  logoUrl?: string | null
  shape?: "circle" | "square"
  class?: HTMLAttributes["class"]
  fallbackClass?: HTMLAttributes["class"]
}>(), {
  logoUrl: null,
  shape: "square",
  fallbackClass: "",
});

const initials = computed(() => {
  const value = (props.name || "").trim();
  return value ? value.slice(0, 2).toUpperCase() : "?";
});
</script>

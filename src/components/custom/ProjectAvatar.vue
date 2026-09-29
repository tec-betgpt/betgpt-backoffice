<template>
  <Avatar :shape="shape" :class="props.class">
    <AvatarImage v-if="logoUrl" :src="logoUrl" />
    <AvatarFallback class="uppercase">{{ initials }}</AvatarFallback>
  </Avatar>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { HTMLAttributes } from "vue";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const props = withDefaults(defineProps<{
  name: string
  logoUrl?: string | null
  shape?: "circle" | "square"
  class?: HTMLAttributes["class"]
}>(), {
  logoUrl: null,
  shape: "square",
});

const initials = computed(() => {
  const value = (props.name || "").trim();
  return value ? value.slice(0, 2).toUpperCase() : "?";
});
</script>

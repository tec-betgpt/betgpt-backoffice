<script setup lang="ts">
import { computed, HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelRight} from "lucide-vue-next";
import { useSidebar } from "./utils";
import { useColorMode } from "@vueuse/core";

const props = defineProps<{
  logo?:boolean;
  class?: HTMLAttributes["class"];
  toggle?: () => void;
}>();
const mode = useColorMode();
const logoSrc = computed(() => {
  return mode.value === "dark"
    ? "/logo-elevate-square-white.png"
    : "/logo-elevate-square-black.png";
});
const { toggleSidebar } = useSidebar();
</script>

<template>
  <div class="flex gap-2">
    <img
        v-if="logo"
      :src="logoSrc"
      alt="Logo"
      class="h-7 w-7 mr-3 md:hidden"
      @click="
        () => {
          toggle?.();
          toggleSidebar();
        }
      "
    />
    <Button
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      :class="cn('h-7 w-7', props.class)"
      @click="
        () => {
          toggle?.();
          toggleSidebar();
        }
      "
    >
      <PanelLeft  v-if="logo"/>
      <PanelRight  v-else   />
      <span class="sr-only">Toggle Sidebar</span>
    </Button>
  </div>
</template>

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
  logoCustom?: string;
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
      class="h-9 w-9 mr-2 md:hidden"
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
      :class="cn('h-9 w-9', props.class)"
      @click="
        () => {
          toggle?.();
          toggleSidebar();
        }
      "
    >
      <template v-if="logoCustom">
        <img :src="logoCustom" alt="Logo" class="h-9 w-9" />
      </template>
      <template v-else>
        <PanelLeft  v-if="logo"/>
        <PanelRight  v-else   />
        <span class="sr-only">Toggle Sidebar</span>
      </template>
    </Button>
  </div>
</template>

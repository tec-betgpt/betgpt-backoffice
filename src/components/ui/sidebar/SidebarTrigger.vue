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
      class="h-12 w-12 mr-2 md:hidden cursor-pointer"
      @click="
        () => {
          toggle?.();
          toggleSidebar();
        }
      "
    />
  </div>
</template>

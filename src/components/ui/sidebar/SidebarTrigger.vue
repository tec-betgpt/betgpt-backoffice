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
  open?: boolean;
}>();
const mode = useColorMode();
const { toggleSidebar } = useSidebar();

</script>

<template>
  <div class="flex gap-2" :class="cn(props.class)">
    <img
      v-if="logo"
      :src="logoCustom"
      alt="Logo"
      class="h-8 w-8 mr-2  cursor-pointer"
      @click="
        () => {
          toggle?.();
          toggleSidebar();
        }
      "
    />
    <Button v-else variant="ghost" size="icon" @click="toggle?.()">
      <PanelRight v-if="open" class="h-5 w-5" />
      <PanelLeft v-else class="h-5 w-5" />
    </Button>
  </div>
</template>

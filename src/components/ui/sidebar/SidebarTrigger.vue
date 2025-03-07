<script setup lang="ts">
import {computed, HTMLAttributes} from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PanelLeft } from 'lucide-vue-next'
import { useSidebar } from './utils'
import {useColorMode} from "@vueuse/core";

const props = defineProps<{
  class?: HTMLAttributes['class'],
  toggle?:()=>void
}>()
const mode = useColorMode()
const logoSrc = computed(() => {
  return mode.value === "dark"
      ? "/logo-elevate-square-white.png"
      : "/logo-elevate-square-black.png";
});
const { toggleSidebar } = useSidebar()
</script>

<template>
  <div class="flex gap-2">
    <img :src="logoSrc" alt="Logo" class="h-7 w-7 mr-3 md:hidden" />
    <Button
        data-sidebar="trigger"
        variant="ghost"
        size="icon"
        :class="cn('h-7 w-7', props.class)"
        @click="()=>{ toggle?.()
        toggleSidebar();
          }"
    >
      <PanelLeft />
      <span class="sr-only">Toggle Sidebar</span>
    </Button>

  </div>

</template>

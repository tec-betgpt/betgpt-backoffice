<script setup lang="ts">
import { computed } from 'vue';
import { Badge } from '@/components/ui/badge';

const props = defineProps<{
  player: any;
}>();

const segments = computed(() => props.player?.segments || []);
</script>

<template>
  <div class="flex flex-wrap gap-2 items-center">
    <div v-if="segments.length === 0" class="text-sm text-muted-foreground py-1">
      Nenhum segmento vinculado
    </div>
    <Badge

      v-for="segment in segments"
      :key="segment.id || segment.name"
      variant="outline"
      class="pl-2 pr-1 py-1 flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
    >
      {{ segment.name }}
    </Badge>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import { Progress } from "@/components/ui/progress"

const progress = ref(1)
const interval = ref()

const start = () => {
  interval.value = setInterval(() => {
    if (progress.value === 100) {
      progress.value = 1
    }

    progress.value += 1
  }, 100)
}

onMounted(() => {
  start()
})

onBeforeUnmount(() => {
  clearInterval(interval.value)
  progress.value = 1
})
</script>

<template>
  <Progress v-model="progress" class="w-3/5 h-1 white:bg-background/90 dark:bg-gray-300" />
</template>

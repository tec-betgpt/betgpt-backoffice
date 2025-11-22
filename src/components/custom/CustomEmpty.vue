<script setup lang="ts">
import { FolderCode } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

defineProps({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  buttonText: {
    type: String,
  },
  showButton: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['buttonClick'])

const handleButtonClick = () => {
  emit('buttonClick')
}
</script>

<template>
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <FolderCode />
      </EmptyMedia>
      <EmptyTitle>{{ title }}</EmptyTitle>
      <EmptyDescription>
        {{ description }}
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="showButton">
      <div class="flex gap-2">
        <Button @click="handleButtonClick">{{ buttonText }}</Button>
      </div>
    </EmptyContent>
  </Empty>
</template>
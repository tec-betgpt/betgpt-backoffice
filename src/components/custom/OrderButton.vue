<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-vue-next";
import { CaretSortIcon } from "@radix-icons/vue";

const props = defineProps<{
  label: string
  column: string
  orderId: string
  order: boolean
  onOrder: (c: string, asc: boolean) => void
  align?: 'left' | 'center' | 'right'
}>();
</script>

<template>
  <Button
    variant="ghost"
    :class="[
      '!p-0 font-medium cursor-pointer mx-2',
      align === 'right' ? 'justify-end flex w-full' : '',
      align === 'center' ? 'justify-center flex w-full' : '',
      align === 'left' ? 'justify-start flex w-full' : '',
      !align ? 'flex w-full justify-start' : ''
    ]"
    @click="onOrder(column, orderId !== column ? true : !order)"
  >
    {{ label }}
    <ArrowDown v-if="orderId === column && order" class="ml-1 h-4 w-4" />
    <ArrowUp v-if="orderId === column && !order" class="ml-1 h-4 w-4" />
    <CaretSortIcon v-if="orderId !== column" class="ml-1 h-4 w-4" />
  </Button>
</template>

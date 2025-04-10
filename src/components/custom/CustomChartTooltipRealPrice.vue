<script lang="ts">
import { Card, CardContent } from '@/components/ui/card'

export default {
  components: {
    Card,
    CardContent,
  },

  methods: {
    formatToMoney(value: number) {
      return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
    }
  },

  props: {
    title: String,
    data: Array<{
      name: string
      color: string
      value: any
    }>
  }
}
</script>

<template>
  <Card class="text-sm">
    <div class="flex flex-col gap-y-1.5 p-3 border-b">
      <h3 class="font-semibold leading-none tracking-tight">{{ title }}</h3>
    </div>
    <CardContent class="p-3 min-w-[180px] flex flex-col gap-2">
      <div
        v-for="(item, key) in data"
        :key="key"
        class="flex justify-between items-center"
      >
        <div class="flex items-center">
          <span
            class="w-2 h-2 mr-4 rounded-full"
            :style="{ background: item.color }"
          />
          <span>{{ item.name }}</span>
        </div>
        <span class="font-semibold ml-4">
          R$ {{ formatToMoney(item.value) }}
        </span>
      </div>
    </CardContent>
  </Card>
</template>

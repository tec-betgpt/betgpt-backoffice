<template>
  <Card>
    <CardHeader>
      <CardTitle>Usuários Recorrentes</CardTitle>
    </CardHeader>

    <Separator />

    <CardContent>
      <div class="mb-10">
        <div class="text-sm text-gray-400 pt-3">Usuários Recorrentes</div>
        <div class="variation-horizontal">
          <div class="value flex align-baseline justify-start items-center bg-green-700 text-green-200">
            <ArrowUp class="h-4 w-4 mr-1" /> Máx: {{ calculateStats('Usuários Recorrentes', returningUsersPeriod).max }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-red-700 text-red-200 text-green-200">
            <ArrowDown class="h-4 w-4 mr-1" /> Mín: {{ calculateStats('Usuários Recorrentes', returningUsersPeriod).min }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-gray-700 text-white">
            <ChartLine class="h-4 w-4 mr-1" /> Média: {{ calculateStats('Usuários Recorrentes', returningUsersPeriod).avg }}
          </div>
        </div>
      </div>

      <LineChart
          :data="returningUsersPeriod"
          index="date"
          :categories="['Usuários Recorrentes']"
          :custom-tooltip="CustomChartTooltip"
      />
    </CardContent>
  </Card>
</template>
<script>
import CustomChartTooltip from '@/components/custom/CustomChartTooltip.vue'
import { ArrowDown, ArrowUp, ChartLine } from 'lucide-vue-next'

export default {
  components: {
    ArrowUp,
    ChartLine,
    ArrowDown,
    CustomChartTooltip,
  },

  methods: {
    calculateStats(key, data) {
      if (!data.length) return {}

      const values = data.map(item => item[key])
      const max = Math.max(...values)
      const min = Math.min(...values)
      const avg = values.reduce((acc, val) => acc + val, 0) / values.length

      return { max, min, avg: parseFloat(avg).toFixed(2) }
    }
  },

  props: {
    returningUsersPeriod: {
      type: Array,
      default: () => []
    }
  }
}
</script>

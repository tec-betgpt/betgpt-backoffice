<template>
  <Card>
    <CardHeader>
      <CardTitle>Usuários Ativos Pagantes por período</CardTitle>
    </CardHeader>

    <Separator />

    <CardContent>
      <div class="grid sm:grid-cols-1 md:grid-cols-3 gap-2 mb-10">
        <div class="variation">
          <div class="text-sm text-gray-400 pb-3">28D Pagantes Ativos</div>
          <div class="value flex align-baseline justify-start items-center bg-green-700 text-green-200">
            <ArrowUp class="h-4 w-4 mr-1" /> Máx: {{ calculateStats('28D Pagantes Ativos', payingActivePeriod).max }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-red-700 text-red-200 text-green-200">
            <ArrowDown class="h-4 w-4 mr-1" /> Mín: {{ calculateStats('28D Pagantes Ativos', payingActivePeriod).min }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-gray-700 text-white">
            <ChartLine class="h-4 w-4 mr-1" /> Média: {{ calculateStats('28D Pagantes Ativos', payingActivePeriod).avg }}
          </div>
        </div>

        <div class="variation">
          <div class="text-sm text-gray-400 pb-3">14D Pagantes Ativos</div>
          <div class="value flex align-baseline justify-start items-center bg-green-700 text-green-200">
            <ArrowUp class="h-4 w-4 mr-1" /> Máx: {{ calculateStats('14D Pagantes Ativos', payingActivePeriod).max }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-red-700 text-red-200 text-green-200">
            <ArrowDown class="h-4 w-4 mr-1" /> Mín: {{ calculateStats('14D Pagantes Ativos', payingActivePeriod).min }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-gray-700 text-white">
            <ChartLine class="h-4 w-4 mr-1" /> Média: {{ calculateStats('14D Pagantes Ativos', payingActivePeriod).avg }}
          </div>
        </div>

        <div class="variation">
          <div class="text-sm text-gray-400 pb-3">7D Pagantes Ativos</div>
          <div class="value flex align-baseline justify-start items-center bg-green-700 text-green-200">
            <ArrowUp class="h-4 w-4 mr-1" /> Máx: {{ calculateStats('7D Pagantes Ativos', payingActivePeriod).max }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-red-700 text-red-200 text-green-200">
            <ArrowDown class="h-4 w-4 mr-1" /> Mín: {{ calculateStats('7D Pagantes Ativos', payingActivePeriod).min }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-gray-700 text-white">
            <ChartLine class="h-4 w-4 mr-1" /> Média: {{ calculateStats('7D Pagantes Ativos', payingActivePeriod).avg }}
          </div>
        </div>
      </div>

      <LineChart
          :data="payingActivePeriod"
          index="date"
          :categories="[
              '7D Pagantes Ativos',
              '14D Pagantes Ativos',
              '28D Pagantes Ativos',
            ]"
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
    payingActivePeriod: {
      type: Array,
      default: () => []
    }
  }
}
</script>

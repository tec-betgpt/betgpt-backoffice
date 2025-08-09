<template>
  <Card>
    <CardHeader>
      <CardTitle>Total de Primeiros Compradores</CardTitle>
    </CardHeader>

    <Separator />

    <CardContent>
      <div class="mb-10">
        <div class="text-sm text-gray-400 pt-3">Primeiros Compradores</div>
        <div class="variation-horizontal">
          <div class="value flex align-baseline justify-start items-center bg-[#947c2c] text-green-200">
            <ArrowUp class="h-4 w-4 mr-1" /> Máx: {{ calculateStats('Primeiros Compradores', firstTimePurchasersPeriod).max }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-red-700 text-red-200 text-green-200">
            <ArrowDown class="h-4 w-4 mr-1" /> Mín: {{ calculateStats('Primeiros Compradores', firstTimePurchasersPeriod).min }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-gray-700 text-white">
            <ChartLine class="h-4 w-4 mr-1" /> Média: {{ calculateStats('Primeiros Compradores', firstTimePurchasersPeriod).avg }}
          </div>
        </div>
      </div>

      <LineChart
          :colors="['white','#947c2c']"
          :data="firstTimePurchasersPeriod"
          index="date"
          :categories="['Primeiros Compradores']"
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
    firstTimePurchasersPeriod: {
      type: Array,
      default: () => []
    }
  }
}
</script>

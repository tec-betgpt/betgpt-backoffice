<template>
  <Card>
    <CardHeader>
      <CardTitle>ARPPU</CardTitle>
    </CardHeader>

    <Separator />

    <CardContent>
      <div class="mb-10">
        <div class="text-sm text-gray-400 pt-3">ARPPU</div>
        <div class="variation-horizontal">
          <div class="value flex align-baseline justify-start items-center bg-green-700 text-green-200">
            <ArrowUp class="h-4 w-4 mr-1" /> Máx: {{ calculateStats('ARPPU', arppuPeriod).max }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-red-700 text-red-200 text-green-200">
            <ArrowDown class="h-4 w-4 mr-1" /> Mín: {{ calculateStats('ARPPU', arppuPeriod).min }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-gray-700 text-white">
            <ChartLine class="h-4 w-4 mr-1" /> Média: {{ calculateStats('ARPPU', arppuPeriod).avg }}
          </div>
        </div>
      </div>

      <LineChart
          :data="arppuPeriod"
          index="date"
          :categories="['ARPPU']"
          :y-formatter="
              (tick, i) =>
                typeof tick === 'number'
                  ? `R$ ${new Intl.NumberFormat('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                      .format(tick / 100)
                      .toString()}`
                  : ''
            "
          :custom-tooltip="CustomChartTooltipPrice"
      />
    </CardContent>
  </Card>
</template>
<script>
import CustomChartTooltipPrice from '@/components/custom/CustomChartTooltipPrice.vue';
import { ArrowDown, ArrowUp, ChartLine } from 'lucide-vue-next'

export default {
  components: {
    ArrowUp,
    ChartLine,
    ArrowDown,
    CustomChartTooltipPrice
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
    arppuPeriod: {
      type: Array,
      default: () => []
    }
  }
}
</script>

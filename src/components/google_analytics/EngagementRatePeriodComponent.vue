<template>
  <Card>
    <CardHeader>
      <CardTitle>Taxa de Engajamento por período</CardTitle>
    </CardHeader>

    <Separator />

    <CardContent>
      <div class="mb-10">
        <div class="text-sm text-gray-400 pt-3">% Taxa de Engajamento</div>
        <div class="variation-horizontal">
          <div class="value flex align-baseline justify-start items-center bg-green-700 text-green-200">
            <ArrowUp class="h-4 w-4 mr-1" /> Máx: {{ calculateStats('% Taxa de Engajamento', engagementRatePeriod).max }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-red-700 text-red-200 text-green-200">
            <ArrowDown class="h-4 w-4 mr-1" /> Mín: {{ calculateStats('% Taxa de Engajamento', engagementRatePeriod).min }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-gray-700 text-white">
            <ChartLine class="h-4 w-4 mr-1" /> Média: {{ calculateStats('% Taxa de Engajamento', engagementRatePeriod).avg }}
          </div>
        </div>
      </div>

      <LineChart
          :data="engagementRatePeriod"
          index="date"
          :categories="['% Taxa de Engajamento']"
          :y-formatter="
              (tick, i) =>
                typeof tick === 'number'
                  ? `${(tick / 100).toFixed(2)}%`
                  : ''
            "
          :custom-tooltip="CustomChartTooltipPercent"
      />
    </CardContent>
  </Card>
</template>
<script>
import CustomChartTooltipPercent from '@/components/custom/CustomChartTooltipPercent.vue'
import { ArrowDown, ArrowUp, ChartLine } from 'lucide-vue-next'

export default {
  components: {
    ArrowUp,
    ChartLine,
    ArrowDown,
    CustomChartTooltipPercent,
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
    engagementRatePeriod: {
      type: Array,
      default: () => []
    }
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Total de Usuários</CardTitle>
    </CardHeader>

    <Separator />

    <CardContent>
      <div class="mb-10">
        <div class="text-sm text-gray-400 pt-3">Total de Usuários</div>
        <div class="variation-horizontal">
          <div class="value flex align-baseline justify-start items-center bg-[#947c2c] text-green-200">
            <ArrowUp class="h-4 w-4 mr-1" />
            Máx: <br>
            {{ calculateStats('Total de Usuários', totalUsersPeriod).max }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-red-700 text-red-200 text-green-200">
            <ArrowDown class="h-4 w-4 mr-1" />
            Mín: <br>
            {{ calculateStats('Total de Usuários', totalUsersPeriod).min }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-gray-700 text-white">
            <ChartLine class="h-4 w-4 mr-1" />
            Média: <br>
            {{ calculateStats('Total de Usuários', totalUsersPeriod).avg }}
          </div>
        </div>
      </div>

      <LineChart
          :colors="['white','#947c2c']"
          :data="totalUsersPeriod"
          index="date"
          :categories="['Total de Usuários']"
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
    CustomChartTooltip
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
    totalUsersPeriod: {
      type: Array,
      required: true
    }
  },


  watch: {
    totalUsersPeriod: {
      handler(val) {
        console.group('totalUsersPeriod')
        console.log(val)
        console.groupEnd()
      },
      deep: true
    }
  }
}
</script>

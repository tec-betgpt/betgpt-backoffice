<template>
  <Card>
    <CardHeader>
      <CardTitle>Usuários</CardTitle>
    </CardHeader>

    <Separator />

    <CardContent>
      <div class="grid sm:grid-cols-1 md:grid-cols-3 gap-2 mb-10">
        <div class="variation">
          <div class="text-sm text-gray-400 pb-3">Usuários Novos</div>
          <div class="value flex align-baseline justify-start items-center bg-[#947c2c] text-green-200">
            <ArrowUp class="h-4 w-4 mr-1" />
            Máx: <br>
            {{ calculateStats('Usuários Novos', usersPeriod).max }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-red-700 text-red-200 text-green-200">
            <ArrowDown class="h-4 w-4 mr-1" />
            Mín: <br>{{ calculateStats('Usuários Novos', usersPeriod).min }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-gray-700 text-white">
            <ChartLine class="h-4 w-4 mr-1" />
            Média: <br>
            {{ calculateStats('Usuários Novos', usersPeriod).avg }}
          </div>
        </div>

        <div class="variation">
          <div class="text-sm text-gray-400 pb-3">Usuários Ativos</div>
          <div class="value flex align-baseline justify-start items-center bg-[#947c2c] text-green-200">
            <ArrowUp class="h-4 w-4 mr-1" />
            Máx: <br>
            {{ calculateStats('Usuários Ativos', usersPeriod).max }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-red-700 text-red-200 text-green-200">
            <ArrowDown class="h-4 w-4 mr-1" />
            Mín: <br>
            {{ calculateStats('Usuários Ativos', usersPeriod).min }}
          </div>
          <div class="value flex align-baseline justify-start items-center bg-gray-700 text-white">
            <ChartLine class="h-4 w-4 mr-1" />
            Média: <br>
            {{ calculateStats('Usuários Ativos', usersPeriod).avg }}
          </div>
        </div>
      </div>

      <LineChart
          :colors="['white','#947c2c']"
          :data="usersPeriod"
        index="date"
        :categories="['Usuários Novos', 'Usuários Ativos']"
        :y-formatter="
          (tick, i) =>
            typeof tick === 'number'
              ? `${new Intl.NumberFormat('pt-BR')
                  .format(tick)
                  .toString()}`
              : ''
        "
        :custom-tooltip="CustomChartTooltip"
      />
    </CardContent>
  </Card>
</template>
<script>
import CustomChartTooltip from '@/components/custom/CustomChartTooltip.vue'
import { ArrowUp, ChartLine, ArrowDown } from 'lucide-vue-next'

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
    usersPeriod: {
      type: Array,
      required: true
    }
  }
}
</script>

<template>
  <Card v-if="isLoading">
    <CardHeader>
      <Skeleton class="h-6 w-full" />
    </CardHeader>
    <CardContent>
      <Skeleton class="pl-5 h-80 w-full" />
    </CardContent>
  </Card>
  <Card v-else>
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
    </CardHeader>
    <Separator />
    <CardContent>
      <div class="grid sm:grid-cols-1 md:grid-cols-3 gap-2 mb-10 ">
          <div  v-for="p in period" :key="p.name">
          <div class="text-sm text-gray-400 my-3   ">{{ p.name }}</div>
            <div :class="{'variation-horizontal': period.length <= 1, 'variation': period.length > 1}">
              <div class="value flex  align-baseline justify-start items-center bg-green-700 text-green-200">
                <ArrowUp class="h-4 w-4 mr-1" /> Máx: {{ calculateStats(p.name, p.value).max }}
              </div>
              <div class="value flex align-baseline justify-start items-center bg-red-700 text-red-200">
                <ArrowDown class="h-4 w-4 mr-1" /> Mín: {{ calculateStats(p.name, p.value).min }}
              </div>
              <div class="value flex align-baseline justify-start items-center w-full bg-gray-700 text-white">
                <ChartLine class="h-4 w-4 mr-1" /> Média: {{ calculateStats(p.name, p.value).avg }}
              </div>
            </div>
        </div>
      </div>
      <LineChart
          v-if="categories.length > 0"
          :data="chartData"
          index="date"
          :categories="categories"
          :y-formatter="(tick: number) => typeof tick === 'number' ? new Intl.NumberFormat('pt-BR').format(tick) : ''"
          :custom-tooltip="CustomChartTooltip"
      />
    </CardContent>
  </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ArrowDown, ArrowUp, ChartLine } from "lucide-vue-next";
import CustomChartTooltip from "@/components/custom/CustomChartTooltip.vue";

export default defineComponent({
  name: "PeriodComponent",
  components: {
    ArrowUp,
    ChartLine,
    ArrowDown,
    CustomChartTooltip
  },
  props: {
    period: {
      type: Array as () => Array<{ name: string; value: number[] }>,
      required: true
    },
    title: {
      type: String,
      required: false
    },
    isLoading:{
      type: Boolean,
      required: true
    }
  },
  computed: {
   categories(): string[] {
      console.log('Categorias:', this.period.map(p => p.name));
      return this.period.map(p => p.name)
   },
    chartData(): number[] {
      return this.period.length ? this.period[0].value : []
    }
  },
  methods:{
    calculateStats(key, data) {
      if (!data.length) return {}

      const values = data.map(item => item[key])
      const max = Math.max(...values)
      const min = Math.min(...values)
      const avg = values.reduce((acc, val) => acc + val, 0) / values.length
      return { max, min, avg: parseFloat(avg).toFixed(2) }
    }
  }
})
</script>
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
    <CardHeader class="py-4">
      <div class="flex justify-between items-center align-middle">
        <CardTitle>
          {{ title }}
        </CardTitle>
        <GlossaryTooltipComponent v-if="glossary" :description="glossary"/>
      </div>
    </CardHeader>

    <Separator />

    <CardContent>
      <div :class="`gap-2 md:grid-cols-1 sm:grid-cols-1 grid mb-10 w-2/3 mx-auto`">
        <div v-for="(p, index) in period" :key="p.name" class="mx-auto mt-5 md:text-left sm:text-center">
          <div class="flex sm:flex-row flex-col items-center justify-center w-full gap-2">
            <div class="text-sm text-gray-400 flex items-center justify-center w-full">
              <div :style="`background: ${colors[index]}`" class="rounded-full w-3 h-3 inline-block mr-1 text-nowrap"></div>
              {{ p.name }}
            </div>
            <div class="flex justify-between flex-nowrap gap-5">
              <Badge
                  :title="`Mínimo: ${calculateStats(p.name, p.value).min}`"
                  class="shadow-none w-fit bg-transparent hover:bg-transparent text-primary/70 p-0 flex max-sm:items-center max-sm:justify-center">
                <img src="/svg/down.svg" class="w-4 h-4 mr-1" alt="down" />
                {{ calculateStats(p.name, p.value).min }}
              </Badge>
              <Badge
                  :title="`Média: ${calculateStats(p.name, p.value).avg}`"
                  class="shadow-none w-fit bg-transparent hover:bg-transparent text-primary/70 p-0 flex max-sm:items-center max-sm:justify-center"
              >
                <img src="/svg/middle.svg" class="w-4 h-4 mr-1" alt="middle" />
                {{ calculateStats(p.name, p.value).avg }}
              </Badge>
              <Badge
                :title="`Máximo: ${calculateStats(p.name, p.value).max}`"
                class="shadow-none w-fit bg-transparent hover:bg-transparent text-primary/70 p-0 flex max-sm:items-center max-sm:justify-center"
              >
                <img src="/svg/up.svg" class="w-4 h-4 mr-1" alt="up" />
                {{ calculateStats(p.name, p.value).max }}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <LineChart
        :colors="colors"
        v-if="categories.length > 0"
        :data="chartData"
        index="date"
        :show-legend="false"
        :categories="categories"
        :y-formatter="yFormatter"
        :custom-tooltip="tooltip"
      />
    </CardContent>
  </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { formatLargeNumber } from "@/filters/formatLargeNumber";
import CustomChartTooltip from "@/components/custom/CustomChartTooltip.vue";
import CustomChartTooltipPercent from "@/components/custom/CustomChartTooltipPercent.vue";
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";
import CustomChartTooltipPrice from "@/components/custom/CustomChartTooltipPrice.vue";

export default defineComponent({
  components: {
    GlossaryTooltipComponent,
    CustomChartTooltip
  },

  computed: {
    CustomChartTooltipPercent() {
      return CustomChartTooltipPercent
    },
    CustomChartTooltip() {
      return CustomChartTooltip
    },
    CustomChartTooltipPrice() {
      return CustomChartTooltipPrice
    },
    categories(): string[] {
      return this.period.map(p => p.name)
   },
    chartData(): any[] {
      if (this.type === 'currency') {
        return this.period.length ? this.period[0].value.map((v: any) => {

          const metricName = Object.keys(v).find(key => key !== 'date');

          if (metricName) {
            const rawValue = v[metricName];
            const valueInReais = Number((rawValue / 100).toFixed(2));
            return {
              [metricName]: valueInReais,
              date: v.date
            };
          }

          return v;
        }): []
      }
      if (this.type === 'percent'){

      }
      return this.period.length ? this.period[0].value : []
    },
    tooltip(){
      if (this.type === 'percent') return this.CustomChartTooltipPercent
      if (this.type === 'currency') return this.CustomChartTooltipPrice
      return this.CustomChartTooltip
    },
    yFormatter(): (tick: number) => string {
    if (this.type === 'percent') {
      return (tick: number) => `${(tick).toFixed(2)}%`


    }
    if (this.type ==='currency'){
      return (tick:number) =>
        `R$ ${new Intl.NumberFormat('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
                  .format(tick )
                  .toString()}`

    }
    return (tick: number) => new Intl.NumberFormat('pt-BR').format(tick)

  },

  },

  data: () => ({
    windowWidth: window.innerWidth,
    colors: ['#947c2c','#f4a261','#c3c3c3']
  }),

  methods:{
    getVarName(obj: Record<string, any>): string {
      return Object.keys(obj)[0];
    },
    calculateStats(key, data) {
      if (!data.length) return {}
      const values = data.map(item => item[key])
      const max = Math.max(...values)
      const min = Math.min(...values)
      const avg = values.reduce((acc, val) => acc + val, 0) / values.length
      if(this.type == "percent")
      {
        return {max: (max ).toFixed(2), min: (min ).toFixed(2), avg: (avg ).toFixed(2)}
      }
      if (this.type =="currency")
      {
        return {max: (max / 100).toFixed(2), min: (min / 100).toFixed(2), avg: (avg / 100).toFixed(2)}

      }
      if (this.windowWidth < 640) {
        return { max: formatLargeNumber(max).content + formatLargeNumber(max).separator  ,
          min: formatLargeNumber(min).content + formatLargeNumber(min).separator,
          avg: formatLargeNumber(parseFloat(avg).toFixed(2)).content + formatLargeNumber(parseFloat(avg).toFixed(2)).separator }
      }
      return { max, min, avg: parseFloat(avg).toFixed(2) }
    }
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
    },
    type: {
      type: String as () => 'numeric' | 'percent' | 'currency',
      default: 'numeric'
    },
    glossary:{
      type: String,
      required:false
    }
  }
})
</script>

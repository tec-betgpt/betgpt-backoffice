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
      <div class="gap-2 mb-10">
        <div v-for="p in period" :key="p.name">
          <div class="text-sm text-gray-400 mb-3 mt-5">
            {{ p.name }}
          </div>
          <div class="flex justify-start gap-5 flex-wrap variation-horizontal">
            <Badge class="bg-transparent hover:bg-transparent text-primary/70">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#947c2c"><path d="m280-400 200-200 200 200H280Z"/></svg>
              {{ calculateStats(p.name, p.value).max }}
            </Badge>
            <Badge class="bg-transparent hover:bg-transparent text-primary/70">
              <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#B91C1C"><path d="M480-360 280-560h400L480-360Z"/></svg>
              {{ calculateStats(p.name, p.value).min }}
            </Badge>
            <Badge class="bg-transparent hover:bg-transparent text-primary/70">
              <ChartLine class="h-4 w-4 mr-2" /> {{ calculateStats(p.name, p.value).avg }}
            </Badge>
          </div>
        </div>
      </div>

      <LineChart
        :colors="['#947c2c','#f4a261','#023e8a']"
        v-if="categories.length > 0"
        :data="chartData"
        index="date"
        :categories="categories"
        :y-formatter="yFormatter"
        :custom-tooltip="tooltip"
      />
    </CardContent>
  </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ArrowDown, ArrowUp, ChartLine } from "lucide-vue-next";
import CustomChartTooltip from "@/components/custom/CustomChartTooltip.vue";
import CustomChartTooltipPercent from "@/components/custom/CustomChartTooltipPercent.vue";
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";

export default defineComponent({
  name: "PeriodComponent",
  components: {
    GlossaryTooltipComponent,
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
    },
    type: {
      type: String as () => 'numeric' | 'percent' | 'currency',
      default: 'numeric'
    },
    glossary:{
      type: String,
      required:false
    }
  },
  computed: {
    CustomChartTooltipPercent() {
      return CustomChartTooltipPercent
    },
    CustomChartTooltip() {
      return CustomChartTooltip
    },
   categories(): string[] {
      return this.period.map(p => p.name)
   },
    chartData(): number[] {
      return this.period.length ? this.period[0].value : []
    },
    tooltip(){
      return this.type === 'percent' ? this.CustomChartTooltipPercent : this.CustomChartTooltip
    },
    yFormatter(): (tick: number) => string {
    if (this.type === 'percent') {
      return (tick: number) => {
        return   typeof tick === 'number'
            ? `${(tick / 100).toFixed(2)}%`
            : ''
      }
    }
    if (this.type ==='currency'){
      return (tick:number) =>
          typeof tick === 'number'
              ? `R$ ${new Intl.NumberFormat('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
                  .format(tick / 100)
                  .toString()}`
              : ''
    }
    return (tick: number) => {
      return typeof tick === 'number'
        ? new Intl.NumberFormat('pt-BR').format(tick)
        : '';
    }
  },

  },
  methods:{
    calculateStats(key, data) {
      if (!data.length) return {}

      const values = data.map(item => item[key])
      const max = Math.max(...values)
      const min = Math.min(...values)
      const avg = values.reduce((acc, val) => acc + val, 0) / values.length
      if(this.type == "percent")
      {
        return {max: (max / 100).toFixed(2), min: (min / 100).toFixed(2), avg: (avg / 100).toFixed(2)}
      }
      return { max, min, avg: parseFloat(avg).toFixed(2) }
    }
  }
})
</script>

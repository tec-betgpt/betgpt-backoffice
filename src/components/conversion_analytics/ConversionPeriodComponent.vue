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
      <div class="flex flex-wrap items-center justify-center gap-4 mb-6">
        <div 
          v-for="(name, index) in names" 
          :key="name"
          class="flex items-center gap-2"
        >
          <div 
            :style="`background: ${colors[index % colors.length]}`" 
            class="rounded-full w-3 h-3"
          ></div>
          <span class="text-sm text-gray-400">{{ name }}</span>
        </div>
      </div>

      <div class="flex items-center justify-center gap-5 mb-10 mt-5">
        <Badge
            :title="`Mínimo`"
            class="shadow-none bg-transparent hover:bg-transparent text-primary/70 p-0 flex items-center gap-1">
          <img src="/svg/down.svg" class="w-4 h-4" alt="down" />
          {{ formatStatValue(globalStats.min) }}
        </Badge>
        <Badge
            :title="`Média`"
            class="shadow-none bg-transparent hover:bg-transparent text-primary/70 p-0 flex items-center gap-1"
        >
          <img src="/svg/middle.svg" class="w-4 h-4" alt="middle" />
          {{ formatStatValue(globalStats.avg) }}
        </Badge>
        <Badge
          :title="`Máximo`"
          class="shadow-none bg-transparent hover:bg-transparent text-primary/70 p-0 flex items-center gap-1"
        >
          <img src="/svg/up.svg" class="w-4 h-4" alt="up" />
          {{ formatStatValue(globalStats.max) }}
        </Badge>
      </div>

      <LineChart
        :colors="colors"
        v-if="categories.length > 0"
        :data="chartData"
        index="channel_name"
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
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {Skeleton} from "@/components/ui/skeleton";
import {LineChart} from "@/components/ui/chart-line";

export default defineComponent({
  components: {
    LineChart,
    Skeleton,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Badge,
    Separator,
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
    names(): string[] {
      return [...new Set(this.period.map(p => p.name))]
    },
    globalStats(): { max: number; min: number; avg: number } {
      const values = this.period
        .map((p: any) => Number(p.value))
        .filter((v: number) => !isNaN(v));

      if (!values.length) return { max: 0, min: 0, avg: 0 };

      return {
        max: Math.max(...values),
        min: Math.min(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length
      };
    },
    categories(): string[] {
      return this.names
    },
    chartData(): any[] {
      if (!this.period || !this.period.length) {
        return [];
      }

      const groupedByDate: Record<string, any> = {};

      this.period.forEach((item: any) => {
        const date = item.date;
        if (!groupedByDate[date]) {
          groupedByDate[date] = { channel_name: date };
        }
        const rawValue = Number(item.value);
        groupedByDate[date][item.name] = !isNaN(rawValue) ? Number(rawValue.toFixed(2)) : item.value;
      });

      return Object.values(groupedByDate).sort((a: any, b: any) => {
        const dateA = this.parseDate(a.channel_name);
        const dateB = this.parseDate(b.channel_name);
        return dateA.getTime() - dateB.getTime();
      });
    },
    tooltip(){
      if (this.type === 'percent') return this.CustomChartTooltipPercent
      if (this.type === 'currency') return this.CustomChartTooltipPrice
      return this.CustomChartTooltip
    },
    yFormatter(): (tick: number | Date, i: number, ticks: number[] | Date[]) => string {
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
    parseDate(dateStr: string): Date {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    },
    formatStatValue(value: number): string {
      if (this.type === 'percent') {
        return `${value.toFixed(2)}%`;
      }
      if (this.type === 'currency') {
        return `R$ ${new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value)}`;
      }
      if (this.windowWidth < 640) {
        return formatLargeNumber(value).content + formatLargeNumber(value).separator;
      }
      return new Intl.NumberFormat('pt-BR').format(value);
    },
    getVarName(obj: Record<string, any>): string {
      return Object.keys(obj)[0];
    }
  },

  props: {
    period: {
      type: Array as () => Array<{ name: string; value: string | number; date: string }>,
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
    },
    isGroup:{
      type:Boolean,
      required:false
    }
  }
})
</script>

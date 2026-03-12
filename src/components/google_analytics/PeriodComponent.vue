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
        <div class="flex items-center gap-2">
          <GlossaryTooltipComponent v-if="glossary" :description="glossary"/>
          <Popover v-if="chartName">
            <PopoverTrigger as-child>
              <Button variant="ghost" size="icon" class="h-8 w-8">
                <MessageSquare class="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-80 max-w-[400px]">
              <AnnotationList
                ref="annotationListRef"
                :chart-name="chartName"
                :project-id="workspaceStore.activeGroupProject?.id"
              />
            </PopoverContent>
          </Popover>
        </div>
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
        :annotations="annotations"
        @point-click="handlePointClick"
        @selection="handleSelection"
      />

      <div v-if="chartName" class="text-xs text-right text-muted-foreground">
        Clique no gráfico para adicionar uma anotação
      </div>
    </CardContent>
  </Card>

  <AnnotationDialog
    v-if="chartName"
    v-model:open="dialogOpen"
    :date="selectedDate"
    :end-date="selectedEndDate"
    :chart-name="chartName"
    @saved="onAnnotationSaved"
  />
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue'
import { formatLargeNumber } from "@/filters/formatLargeNumber";
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";
import { LineChart } from "@/components/ui/chart-line";
import { MessageSquare } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AnnotationList from '@/components/project_annotations/AnnotationList.vue';
import AnnotationDialog from '@/components/project_annotations/AnnotationDialog.vue';
import ProjectAnnotations from '@/services/projectAnnotations';
import { useWorkspaceStore } from '@/stores/workspace';
import moment from 'moment';

export default defineComponent({
  components: {
    GlossaryTooltipComponent,
    LineChart,
    MessageSquare,
    Button,
    Popover,
    PopoverContent,
    PopoverTrigger,
    AnnotationList,
    AnnotationDialog
  },

  setup() {
    const workspaceStore = useWorkspaceStore()
    const dialogOpen = ref(false)
    const selectedDate = ref('')
    const selectedEndDate = ref('')
    const annotations = ref<any[]>([])
    const annotationListRef = ref<any>(null)

    return {
      workspaceStore,
      dialogOpen,
      selectedDate,
      selectedEndDate,
      annotations,
      annotationListRef
    }
  },

  computed: {
    categories(): string[] {
      return this.period.map(p => p.name)
   },
    chartData(): any[] {
      if (!this.period || !this.period.length || !this.period[0]?.value) {
        return [];
      }

      const rawData = this.period[0].value;

      if (this.type === 'currency') {
        return rawData.map((item: any) => {
          return Object.keys(item).reduce((newObject: any, key) => {
            if (key === 'date') {
              newObject[key] = item[key];
            }
            else {
              const rawValue = Number(item[key]);
              if (!isNaN(rawValue)) {
                newObject[key] = Number((rawValue / 100).toFixed(2));
              } else {
                newObject[key] = item[key];
              }
            }
            return newObject;
          }, {});
        });
      }
      return rawData;
    },
    yFormatter(): (tick: number) => string {
      if (this.type === 'percent') {
        return (tick: number) => `${(tick).toFixed(2)}%`
      }
      if (this.type ==='currency'){
        return (tick:number) =>
          `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .format(tick )
            .toString()}`
      }
      return (tick: number) => new Intl.NumberFormat('pt-BR').format(tick)
    },
  },

  data: () => ({
    windowWidth: window.innerWidth,
    colors: ['#947c2c', '#f4a261', '#c3c3c3', '#2a9d8f']
  }),

  methods:{
    calculateStats(key: any, data: any) {
      if (!data.length) return {}
      const values = data.map(item => item[key])
      let max = Math.max(...values)
      let min = Math.min(...values)
      let avg = values.reduce((acc, val) => {
       return Number.parseInt(acc) + Number.parseInt(val)
      }, 0) / values.length
      if(this.type == "percent")
      {
        return {max: (max ).toFixed(2), min: (min ).toFixed(2), avg: (avg).toFixed(2)}
      }
      if (this.type =="currency")
      {
        return {max: (max / 100).toFixed(2), min: (min / 100).toFixed(2), avg: (avg / 100).toFixed(2)}
      }
      if (this.windowWidth < 640) {
        return { max: formatLargeNumber(max).content + formatLargeNumber(max).separator  ,
          min: formatLargeNumber(min).content + formatLargeNumber(min).separator,
          avg: formatLargeNumber(parseFloat(String(avg)).toFixed(2)).content + formatLargeNumber(parseFloat(String(avg)).toFixed(2)).separator }
      }
      return { max, min, avg: parseFloat(String(avg)).toFixed(2) }
    },
    async fetchAnnotations() {
      if (!this.chartName || !this.workspaceStore.activeGroupProject?.id) return
      try {
        const response = await ProjectAnnotations.index({
          filter_id: this.workspaceStore.activeGroupProject.id,
          chart_name: this.chartName,
          perPage: 100
        })
        this.annotations = response || []
      } catch (error) {
        console.error(error)
      }
    },
    handlePointClick(data: any) {
      if (!this.chartName) return
      this.selectedDate = data.date
      this.selectedEndDate = ''
      this.dialogOpen = true
    },
    handleSelection({ start, end }: { start: number, end: number }) {
      if (!this.chartName) return
      
      this.selectedDate = moment(start).format('YYYY-MM-DD')
      this.selectedEndDate = moment(end).format('YYYY-MM-DD')
      this.dialogOpen = true
    },
    onAnnotationSaved() {
      this.fetchAnnotations()
      if (this.annotationListRef) {
        this.annotationListRef.refresh()
      }
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
    },
    isGroup:{
      type:Boolean,
      required:false
    },
    chartName: {
      type: String,
      required: false
    }
  },

  mounted() {
    this.fetchAnnotations()
  },

  watch: {
    chartName: 'fetchAnnotations',
    'workspaceStore.activeGroupProject.id': 'fetchAnnotations'
  }
})
</script>

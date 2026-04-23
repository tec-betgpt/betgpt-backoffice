<template>
  <Card v-if="isLoading">
    <CardHeader>
      <Skeleton class="h-6 w-full" />
    </CardHeader>
    <CardContent>
      <Skeleton class="h-80 w-full" />
    </CardContent>
  </Card>

  <Card v-else>
    <CardHeader class="py-4">
      <div class="flex justify-between items-center align-middle">
        <CardTitle>Composição de Clientes Ativos</CardTitle>
        <div class="flex items-center gap-2">
          <GlossaryTooltipComponent description="Visão mensal da composição de clientes ativos (Novos + Recuperados + Retidos) e métricas de perda." />
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
                :chart-resource="chartResource"
                :project-id="workspaceStore.activeGroupProject?.id"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </CardHeader>
    <Separator />
    <CardContent class="pt-6">
      <div class="h-[380px] w-full">
        <apexchart
          v-if="series"
          width="100%"
          height="100%"
          type="line"
          :options="chartOptions"
          :series="series"
        />
      </div>
    </CardContent>
  </Card>

  <AnnotationDialog
    v-if="chartName"
    v-model:open="dialogOpen"
    :date="selectedDate"
    :end-date="selectedEndDate"
    :chart-name="chartName"
    :chart-resource="chartResource"
    @saved="onAnnotationSaved"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MessageSquare } from 'lucide-vue-next'
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue"
import AnnotationList from '@/components/project_annotations/AnnotationList.vue'
import AnnotationDialog from '@/components/project_annotations/AnnotationDialog.vue'
import ProjectAnnotations from '@/services/projectAnnotations'
import { useWorkspaceStore } from '@/stores/workspace'
import VueApexCharts from 'vue3-apexcharts'
import { useColorMode } from '@vueuse/core'
import moment from 'moment'
import { formatMinifiedNumber } from "@/filters/formatNumbers"

const props = defineProps<{
  data: any[]
  isLoading: boolean
}>()

const workspaceStore = useWorkspaceStore()
const mode = useColorMode()
const apexchart = VueApexCharts

const dialogOpen = ref(false)
const selectedDate = ref('')
const selectedEndDate = ref('')
const annotations = ref<any[]>([])
const annotationListRef = ref<any>(null)

const chartName = 'composition-active-clients'
const chartResource = 'retention_period'

async function fetchAnnotations() {
  if (!chartName || !workspaceStore.activeGroupProject?.id) return

  try {
    const response = await ProjectAnnotations.index({
      filter_id: workspaceStore.activeGroupProject.id,
      chart_name: chartName,
      resource: chartResource,
      perPage: 100
    })
    annotations.value = response || []
  } catch (error) {
    console.error(error)
  }
}

function handlePointClick(data: any) {
  if (!chartName) return
  selectedDate.value = data.date
  selectedEndDate.value = ''
  dialogOpen.value = true
}

const chartCategories = [
  'Novos Clientes',
  'Novos Clientes D0',
  'Novos Clientes Pós D0',
  'Clientes Recuperados',
  'Clientes Retidos',
  'Churn',
  'Total Ativos',
]
const chartColors = ['#f4a261', '#e9c46a', '#dda15e', '#2a9d8f', '#457b9d', '#e63946', '#1d3557']

const sortedData = computed(() => {
  return [...props.data].sort((a, b) => {
    const timeA = moment(a.date, 'DD/MM/YYYY').valueOf()
    const timeB = moment(b.date, 'DD/MM/YYYY').valueOf()
    return timeA - timeB
  })
})

const series = computed(() => {
  return chartCategories.map(cat => ({
    name: cat,
    data: sortedData.value.map(d => ({
      x: moment(d.date, 'DD/MM/YYYY').valueOf(),
      y: d[cat]
    }))
  }))
})

const chartOptions = computed(() => {
  return {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
      fontFamily: 'inherit',
      events: {
        markerClick: (event: any, chartContext: any, { seriesIndex, dataPointIndex, config }: any) => {
          const dataPoint = sortedData.value[dataPointIndex]
          if (dataPoint) {
            handlePointClick(dataPoint)
          }
        },
        selection: (chartContext: any, { xaxis }: any) => {
          if (xaxis) {
            const minTime = xaxis.min
            const maxTime = xaxis.max
            const startData = sortedData.value.find(d => moment(d.date, 'DD/MM/YYYY').valueOf() >= minTime)
            const endData = [...sortedData.value].reverse().find(d => moment(d.date, 'DD/MM/YYYY').valueOf() <= maxTime)

            if (startData && endData) {
              selectedDate.value = startData.date
              selectedEndDate.value = endData.date
              dialogOpen.value = true
            }
          }
        }
      },
      selection: {
        enabled: true,
        type: 'x',
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    dataLabels: { enabled: false },
    xaxis: {
      type: 'datetime',
      tooltip: { enabled: false },
      labels: {
        datetimeUTC: false,
      }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatMinifiedNumber(val)
      }
    },
    legend: { 
      position: 'top',
      labels: {
        colors: mode.value === 'dark' ? '#f8fafc' : '#1e293b'
      }
    },
    colors: chartColors,
    tooltip: {
      theme: mode.value === 'dark' ? 'dark' : 'light',
      shared: true,
      intersect: false,
      x: { format: 'dd/MM/yyyy' }
    },
    annotations: {
      xaxis: annotations.value.map(ann => ({
        x: moment(ann.date, ['DD/MM/YYYY', 'YYYY-MM-DD']).valueOf(),
        x2: ann.date_end ? moment(ann.date_end, ['DD/MM/YYYY', 'YYYY-MM-DD']).valueOf() : undefined,
        borderColor: ann.color || '#775DD0',
        label: {
          borderColor: ann.color || '#775DD0',
          style: {
            color: '#fff',
            background: ann.color || '#775DD0',
          },
          text: ann.title,
        }
      }))
    }
  }
})

function onAnnotationSaved() {
  fetchAnnotations()
  if (annotationListRef.value) {
    annotationListRef.value.refresh()
  }
  workspaceStore.notifyAnnotationUpdate()
}

watch(() => workspaceStore.lastAnnotationUpdate, () => {
  fetchAnnotations()
})

watch(() => workspaceStore.activeGroupProject?.id, () => {
  fetchAnnotations()
})

onMounted(() => {
  fetchAnnotations()
})
</script>

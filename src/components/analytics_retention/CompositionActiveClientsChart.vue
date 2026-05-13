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
          <Button
              variant="ghost"
              size="icon"
              class="h-4 w-4"
              @click="handlePointClick()"
          >
            <Plus class="h-3 w-3" />
          </Button>
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
      <div class="h-[380px] w-full relative">
        <apexchart
          v-if="series"
          ref="chartRef"
          width="100%"
          height="100%"
          type="line"
          :options="chartOptions"
          :series="series"
        />
        <div
          v-if="annotationPopover.visible"
          ref="popoverEl"
          class="annotation-popover"
          :style="popoverStyle"
        >
          <div class="annotation-popover-header">
            <span>{{ annotationPopover.date }}</span>
            <button @click="annotationPopover.visible = false">&times;</button>
          </div>
          <ul class="annotation-popover-list">
            <li v-for="(note, idx) in annotationPopover.notes" :key="idx">
              <span class="annotation-dot" :style="{ background: note.color }"></span>
              {{ note.title }}
            </li>
          </ul>
        </div>
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
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {MessageSquare, Plus} from 'lucide-vue-next'
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

const chartRef = ref(null)
const dialogOpen = ref(false)
const selectedDate = ref('')
const selectedEndDate = ref('')
const annotations = ref<any[]>([])
const annotationListRef = ref<any>(null)

const chartName = 'composition-active-clients'
const chartResource = 'retention_period'

const annotationPopover = ref({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  notes: [] as { title: string; color: string }[]
})

const popoverEl = ref<HTMLElement | null>(null)

const popoverStyle = computed(() => {
  return {
    top: annotationPopover.value.y + 'px',
    left: annotationPopover.value.x + 'px'
  }
})

function adjustPopoverPosition() {
  nextTick(() => {
    const el = popoverEl.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const pad = 8

    if (rect.right > vw - pad) {
      annotationPopover.value.x -= (rect.right - vw + pad)
    }
    if (rect.left < pad) {
      annotationPopover.value.x += (pad - rect.left)
    }
    if (rect.top < pad) {
      annotationPopover.value.y += rect.height + 16
    }
    if (rect.bottom > vh - pad) {
      annotationPopover.value.y -= (rect.bottom - vh + pad)
    }
  })
}

function handleOutsideClick(e: MouseEvent) {
  if (!annotationPopover.value.visible) return
  const target = e.target as HTMLElement
  if (target.closest('.annotation-popover') || target.closest('.apexcharts-point-annotations')) return
  annotationPopover.value.visible = false
}

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

function handlePointClick() {
  if (!chartName) return
  selectedDate.value = moment().format('DD/MM/YYYY')
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

const groupedAnnotations = computed(() => {
  const groups: Record<number, any[]> = {}
  annotations.value.forEach(ann => {
    const dateVal = moment(ann.date, ['DD/MM/YYYY', 'YYYY-MM-DD']).valueOf()
    if (!groups[dateVal]) groups[dateVal] = []
    groups[dateVal].push(ann)
  })
  return groups
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
        click: (event: MouseEvent, chartContext: any, opts: any) => {
          const target = event.target as SVGElement
          if (!target.closest('.apexcharts-point-annotations')) {
            annotationPopover.value.visible = false
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
      points: Object.entries(groupedAnnotations.value).map(([dateVal, anns]) => {
        let yVal = 0
        const cat = chartCategories[0]
        const dataPoint = sortedData.value.find(d => moment(d.date, 'DD/MM/YYYY').valueOf() === Number(dateVal))
        if (dataPoint) {
          yVal = dataPoint[cat]
        }

        const isMultiple = anns.length > 1
        const baseColor = anns[0].color || chartColors[0]

        return {
          x: Number(dateVal),
          y: yVal,
          marker: {
            size: isMultiple ? 6 : 5,
            fillColor: isMultiple ? (mode.value === 'dark' ? '#1e293b' : '#334155') : baseColor,
            strokeColor: isMultiple ? '#ffffff' : baseColor,
            strokeWidth: isMultiple ? 2 : 0,
            cssClass: 'annotation-marker'
          },
          label: {
            text: '',
            borderWidth: 0,
            style: {
              background: 'transparent',
              color: 'transparent',
              padding: { left: 0, right: 0, top: 0, bottom: 0 },
              fontSize: '0px'
            }
          },
          click: (annotation: any, event: MouseEvent) => {
            const target = event.target as SVGElement
            const circle = target.closest('g')?.querySelector('circle') || target
            const cx = parseFloat(circle.getAttribute?.('cx') || '0')
            const cy = parseFloat(circle.getAttribute?.('cy') || '0')
            const chartEl = (chartRef.value as any)?.$el || (chartRef.value as any)?.chart?.el
            const svgEl = chartEl?.querySelector('svg')
            const containerEl = chartEl?.parentElement
            const svgRect = svgEl?.getBoundingClientRect() || { left: 0, top: 0 }
            const containerRect = containerEl?.getBoundingClientRect() || svgRect

            annotationPopover.value = {
              visible: true,
              x: svgRect.left - containerRect.left + cx,
              y: svgRect.top - containerRect.top + cy - 10,
              date: moment(Number(dateVal)).format('DD/MM/YYYY'),
              notes: anns.map((a: any) => ({ title: a.title, color: a.color || '#eab308' }))
            }
            adjustPopoverPosition()
          }
        }
      })
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
  document.addEventListener('click', handleOutsideClick, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick, true)
})
</script>

<style scoped>
:deep(.apexcharts-point-annotations .apexcharts-point-annotation-label) {
  display: none !important;
}

:deep(.apexcharts-point-annotations g) {
  cursor: pointer;
}

.annotation-popover {
  position: absolute;
  z-index: 50;
  transform: translate(-50%, -100%) translateY(-8px);
  background: var(--popover-bg, #ffffff);
  color: var(--popover-color, #1e293b);
  border: 1px solid var(--popover-border, #e2e8f0);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  max-width: 300px;
  font-size: 13px;
  pointer-events: auto;
}

:root.dark .annotation-popover,
.dark .annotation-popover {
  --popover-bg: #1e293b;
  --popover-color: #f8fafc;
  --popover-border: #334155;
}

.annotation-popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid var(--popover-border, #e2e8f0);
  font-weight: 600;
  font-size: 12px;
}

.annotation-popover-header button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: inherit;
  padding: 0 2px;
}

.annotation-popover-list {
  list-style: none;
  margin: 0;
  padding: 6px 10px;
}

.annotation-popover-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
}

.annotation-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>

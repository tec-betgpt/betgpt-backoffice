<template>
  <div :class="cn('w-full h-[400px] relative', $attrs.class ?? '')">
    <apexchart
        ref="chartRef"
        width="100%"
        height="100%"
        :type="type"
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
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { cn } from '@/lib/utils'
import { defaultColors } from '@/components/ui/chart'
import { useColorMode } from '@vueuse/core'
import moment from 'moment'
import { formatMinifiedNumber } from '@/filters/formatNumbers'

const props = withDefaults(defineProps<{
  data: T[]
  categories: string[]
  index: string
  colors?: string[]
  showLegend?: boolean
  showGridLine?: boolean
  yFormatter?: (val: number) => string
  annotations?: any[]
  type?: 'line' | 'area'
}>(), {
  showLegend: true,
  showGridLine: false,
  type: 'area',
  annotations: () => []
})

const emit = defineEmits(['pointClick', 'selection'])

const chartRef = ref(null)
const mode = useColorMode()

const annotationPopover = ref({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  notes: [] as { title: string; color: string }[]
})

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

    // If overflowing right
    if (rect.right > vw - pad) {
      annotationPopover.value.x -= (rect.right - vw + pad)
    }
    // If overflowing left
    if (rect.left < pad) {
      annotationPopover.value.x += (pad - rect.left)
    }
    // If overflowing top (popover renders above the point via transform)
    if (rect.top < pad) {
      // Flip below the point instead
      annotationPopover.value.y += rect.height + 16
    }
    // If overflowing bottom
    if (rect.bottom > vh - pad) {
      annotationPopover.value.y -= (rect.bottom - vh + pad)
    }
  })
}

const popoverEl = ref<HTMLElement | null>(null)

function handleOutsideClick(e: MouseEvent) {
  if (!annotationPopover.value.visible) return
  const target = e.target as HTMLElement
  if (target.closest('.annotation-popover') || target.closest('.apexcharts-point-annotations')) return
  annotationPopover.value.visible = false
}

onMounted(() => document.addEventListener('click', handleOutsideClick, true))
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick, true))

const sortedData = computed(() => {
  return [...props.data].sort((a, b) => {
    const timeA = moment(a[props.index], 'DD/MM/YYYY').valueOf()
    const timeB = moment(b[props.index], 'DD/MM/YYYY').valueOf()
    return timeA - timeB
  })
})

const series = computed(() => {
  return props.categories.map(cat => ({
    name: cat,
    // Nota: sortedData para evitar que a linha "dobre"
    data: sortedData.value.map(d => ({
      x: moment(d[props.index], 'DD/MM/YYYY').valueOf(),
      y: d[cat]
    }))
  }))
})

const groupedAnnotations = computed(() => {
  const groups: Record<number, any[]> = {}
  props.annotations.forEach(ann => {
    const dateVal = moment(ann.date, ['DD/MM/YYYY', 'YYYY-MM-DD']).valueOf()
    if (!groups[dateVal]) groups[dateVal] = []
    groups[dateVal].push(ann)
  })
  return groups
})

const chartOptions = computed(() => {
  return {
    chart: {
      id: 'chart-annotations',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      pan: {
        enabled: false
      },
      background: 'transparent',
      fontFamily: 'inherit',
      events: {
        click: (event: MouseEvent, chartContext: any, opts: any) => {
          const target = event.target as SVGElement
          if (!target.closest('.apexcharts-point-annotations')) {
            annotationPopover.value.visible = false
          }
        },
        markerClick: (event: any, chartContext: any, { seriesIndex, dataPointIndex, config }: any) => {
          const dataPoint = sortedData.value[dataPointIndex]
          emit('pointClick', dataPoint)
        },
        selection: (chartContext, { xaxis }) => {
          if (xaxis) {
            const minTime = xaxis.min
            const maxTime = xaxis.max
            const startData = sortedData.value.find(d => moment(d[props.index], 'DD/MM/YYYY').valueOf() >= minTime)
            const endData = [...sortedData.value].reverse().find(d => moment(d[props.index], 'DD/MM/YYYY').valueOf() <= maxTime)

            if (startData && endData) {
              emit('selection', {
                start: startData[props.index],
                end: endData[props.index]
              })
            }
          }
        }
      },
      selection: {
        enabled: true,
        type: 'x',
        fill: {
          color: mode.value === 'dark' ? '#ffffff' : '#24292e',
          opacity: 0.1
        },
        stroke: {
          width: 1,
          dashArray: 3,
          color: mode.value === 'dark' ? '#ffffff' : '#24292e',
          opacity: 0.4
        }
      }
    },
    theme: {
      mode: mode.value === 'dark' ? 'dark' : 'light'
    },
    colors: props.colors || defaultColors(props.categories.length),
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0
      }
    },
    xaxis: {
      type: 'datetime',
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      crosshairs: { show: true }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          if (props.yFormatter) {
            return props.yFormatter(val)
          }
          return formatMinifiedNumber(val)
        },
        style: {
          colors: mode.value === 'dark' ? '#94a3b8' : '#64748b'
        }
      }
    },
    legend: {
      show: props.showLegend,
      position: 'top',
      labels: {
        colors: mode.value === 'dark' ? '#f8fafc' : '#1e293b'
      }
    },
    tooltip: {
      theme: mode.value === 'dark' ? 'dark' : 'light',
      shared: true,
      intersect: false,
      x: {
        format: 'dd/MM/yyyy'
      },
      y: {
        formatter: (val: number) => {
          if (props.yFormatter) {
            return props.yFormatter(val)
          }
          return formatMinifiedNumber(val)
        }
      }
    },
    annotations: {
      points: Object.entries(groupedAnnotations.value).map(([dateVal, anns]) => {
        let yVal = 0
        if (props.categories && props.categories.length > 0) {
          const cat = props.categories[0]
          const dataPoint = sortedData.value.find(d => moment(d[props.index], 'DD/MM/YYYY').valueOf() === Number(dateVal))
          if (dataPoint) {
            yVal = dataPoint[cat]
          }
        }
        
        const isMultiple = anns.length > 1
        const titleText = anns.map(a => a.title).join(' | ')
        const baseColor = anns[0].color || (props.colors && props.colors.length > 0 ? props.colors[0] : '#eab308')
        
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

const apexchart = VueApexCharts
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
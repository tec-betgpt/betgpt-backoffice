<template>
  <div :class="cn('w-full h-[400px]', $attrs.class ?? '')">
    <apexchart
        ref="chartRef"
        width="100%"
        height="100%"
        :type="type"
        :options="chartOptions"
        :series="series"
    />
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { cn } from '@/lib/utils'
import { defaultColors } from '@/components/ui/chart'
import { useColorMode } from '@vueuse/core'
import moment from 'moment'

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

// 1. DADO ORDENADO: Garantimos que o array está em ordem cronológica (do mais antigo para o mais novo)
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
    // Usamos o sortedData aqui para evitar que a linha "dobre" ou volte para trás
    data: sortedData.value.map(d => ({
      x: moment(d[props.index], 'DD/MM/YYYY').valueOf(),
      y: d[cat]
    }))
  }))
})

const chartOptions = computed(() => {
  return {
    chart: {
      id: 'chart-annotations',
      toolbar: {
        show: false
      },
      background: 'transparent',
      fontFamily: 'inherit',
      events: {
        markerClick: (event, chartContext, { seriesIndex, dataPointIndex, config }) => {
          // Alterado para buscar do array ordenado
          const dataPoint = sortedData.value[dataPointIndex]
          emit('pointClick', dataPoint)
        },
        selection: (chartContext, { xaxis }) => {
          if (xaxis) {
            // 2. SELEÇÃO CORRIGIDA: No 'datetime', xaxis.min e max são TIMESTAMPS, não mais índices (0, 1, 2)
            const minTime = xaxis.min
            const maxTime = xaxis.max

            // Encontramos o primeiro dado que seja maior ou igual ao tempo mínimo selecionado
            const startData = sortedData.value.find(d => moment(d[props.index], 'DD/MM/YYYY').valueOf() >= minTime)

            // Encontramos o último dado que seja menor ou igual ao tempo máximo (usamos reverse para achar o mais próximo do final)
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
      type: 'datetime', // Mantido como datetime
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      crosshairs: { show: true }
      // Removida a propriedade 'categories' que estava aqui
    },
    yaxis: {
      labels: {
        formatter: props.yFormatter,
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
        formatter: props.yFormatter
      }
    },
    annotations: {
      xaxis: props.annotations.map(ann => {
        return {
          x: moment(ann.date, ['DD/MM/YYYY', 'YYYY-MM-DD']).valueOf(),
          strokeDashArray: 0,
          borderColor: ann.color || '#775DD0',
          label: {
            borderColor: ann.color || '#775DD0',
            style: {
              color: '#fff',
              background: ann.color || '#775DD0',
            },
            text: ann.annotation,
          }
        }
      })
    }
  }
})

const apexchart = VueApexCharts
</script>
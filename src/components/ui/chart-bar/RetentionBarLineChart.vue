<script setup lang="ts" generic="T extends Record<string, any>">
import type { BulletLegendItemInterface } from '@unovis/ts'
import type { BaseChartProps } from './index'
import { ChartCrosshair, ChartLegend } from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import { Axis, StackedBar, Line, Scatter } from '@unovis/ts'
import { VisAxis, VisStackedBar, VisLine, VisXYContainer, VisScatter } from '@unovis/vue'
import { useMounted } from '@vueuse/core'
import { type Component, computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { formatMinifiedNumber } from '@/filters/formatNumbers'
import RetentionChartTooltip from './RetentionChartTooltip.vue'

const props = withDefaults(defineProps<BaseChartProps<T> & {
  customTooltip?: Component
  barCategories: string[]
  lineCategories: string[]
  roundedCorners?: number
  linesOnly?: boolean
  annotations?: any[]
}>(), {
  margin: () => ({ top: 20, bottom: 20, left: 20, right: 20 }),
  filterOpacity: 0.2,
  roundedCorners: 0,
  showXAxis: true,
  showYAxis: true,
  showTooltip: true,
  showLegend: true,
  showGridLine: true,
  linesOnly: false,
  yFormatter: (tick: number) => formatMinifiedNumber(tick),
  customTooltip: RetentionChartTooltip,
  annotations: () => []
})

const emits = defineEmits(['pointClick'])

type KeyOfT = Extract<keyof T, string>
type Data = typeof props.data[number]

const index = computed(() => props.index as KeyOfT)
const colors = computed(() => props.colors || [])

/** Séries desenhadas como linha: no modo padrão só `lineCategories`; com `linesOnly`, todas as `categories`. */
const lineSeriesCategories = computed(() =>
  props.linesOnly ? props.categories : props.lineCategories,
)

const legendItems = ref<BulletLegendItemInterface[]>([])

function syncLegendFromProps() {
  legendItems.value = props.categories.map((category, i) => ({
    name: category,
    color: colors.value[i] ?? 'transparent',
    inactive: false,
  }))
}

syncLegendFromProps()
watch(
  () => [props.categories, props.colors] as const,
  () => syncLegendFromProps(),
  { deep: true },
)

const isMounted = useMounted()

function handleLegendItemClick(d: BulletLegendItemInterface, i: number) {
  legendItems.value[i].inactive = !legendItems.value[i].inactive
}

// --- Annotation popover logic ---
const annotationPopover = ref({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  notes: [] as { title: string; color: string }[]
})

const popoverEl = ref<HTMLElement | null>(null)

const popoverStyle = computed(() => ({
  top: annotationPopover.value.y + 'px',
  left: annotationPopover.value.x + 'px'
}))

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
  if (target.closest('.annotation-popover') || target.closest('.annotation-scatter-point')) return
  annotationPopover.value.visible = false
}

onMounted(() => document.addEventListener('click', handleOutsideClick, true))
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick, true))

// --- Grouped annotations ---
const groupedAnnotations = computed(() => {
  const groups: Record<number, any[]> = {}
  props.annotations.forEach(ann => {
    const idx = props.data.findIndex(d => d[props.index] === ann.date)
    if (idx === -1) return
    if (!groups[idx]) groups[idx] = []
    groups[idx].push(ann)
  })
  return groups
})

// Build annotation data array aligned with props.data indices
// Each entry has a y value (from first line category) or null if no annotation at that index
const annotationScatterData = computed(() => {
  const firstCat = lineSeriesCategories.value[0] || props.categories[0]
  return props.data.map((d, i) => {
    if (groupedAnnotations.value[i]) {
      return { ...d, _annY: d[firstCat] ?? 0, _annIdx: i }
    }
    return { ...d, _annY: null, _annIdx: i }
  })
})

function getAnnotationColor(dataIndex: number): string {
  const anns = groupedAnnotations.value[dataIndex]
  if (!anns) return 'transparent'
  const isMultiple = anns.length > 1
  const baseColor = anns[0].color || (colors.value.length > 0 ? colors.value[0] : '#eab308')
  return isMultiple ? '#334155' : baseColor
}

function getAnnotationStrokeColor(dataIndex: number): string {
  const anns = groupedAnnotations.value[dataIndex]
  if (!anns) return 'transparent'
  const isMultiple = anns.length > 1
  const baseColor = anns[0].color || (colors.value.length > 0 ? colors.value[0] : '#eab308')
  return isMultiple ? '#ffffff' : baseColor
}

function getAnnotationStrokeWidth(dataIndex: number): number {
  const anns = groupedAnnotations.value[dataIndex]
  if (!anns) return 0
  return anns.length > 1 ? 2 : 0
}

const hasAnnotations = computed(() => Object.keys(groupedAnnotations.value).length > 0)

function handleAnnotationClick(d: Data, i: number, event: PointerEvent) {
  const anns = groupedAnnotations.value[i]
  if (!anns) return

  const target = event.target as SVGElement
  const svgEl = target.closest('svg')
  const containerEl = target.closest('.vis-xy-container')?.parentElement
  if (!svgEl || !containerEl) return

  const circle = target.closest('circle') || target
  const bbox = circle.getBoundingClientRect()
  const containerRect = containerEl.getBoundingClientRect()

  annotationPopover.value = {
    visible: true,
    x: bbox.left - containerRect.left + bbox.width / 2,
    y: bbox.top - containerRect.top,
    date: d[props.index] || '',
    notes: anns.map((a: any) => ({ title: a.title, color: a.color || '#eab308' }))
  }
  adjustPopoverPosition()
}
</script>

<template>
  <div :class="cn('w-full h-full md:h-[400px] flex flex-col items-end relative', $attrs.class ?? '')">
    <ChartLegend v-if="showLegend" v-model:items="legendItems" @legend-item-click="handleLegendItemClick" />

    <VisXYContainer
      :data="data"
      :style="{ height: isMounted ? '100%' : 'auto' }"
      :margin="margin"
    >
      <ChartCrosshair 
        v-if="showTooltip" 
        :colors="colors" 
        :items="legendItems" 
        :custom-tooltip="customTooltip" 
        :index="index" 
      />

      <VisStackedBar
        v-if="!linesOnly"
        :x="(d: Data, i: number) => i"
        :y="barCategories.map(cat => (d: Data) => d[cat])"
        :color="barCategories.map(cat => colors[categories.indexOf(cat)])"
        :rounded-corners="roundedCorners"
        :bar-padding="0.1"
      />

      <template v-for="cat in lineSeriesCategories" :key="cat">
        <VisLine
          :x="(d: Data, i: number) => i"
          :y="(d: Data) => d[cat]"
          :color="colors[categories.indexOf(cat)]"
          :line-width="3"
          :attributes="{
            [Line.selectors.line]: {
              cursor: 'pointer'
            }
          }"
          @click="(d: Data) => emits('pointClick', d)"
        />
        <VisScatter
          :x="(d: Data, i: number) => i"
          :y="(d: Data) => d[cat]"
          :color="colors[categories.indexOf(cat)]"
          :size="6"
          :attributes="{
            [Line.selectors.line]: {
              cursor: 'pointer'
            }
          }"
          @click="(d: Data) => emits('pointClick', d)"
        />
      </template>

      <!-- Annotation scatter points -->
      <VisScatter
        v-if="hasAnnotations"
        :x="(d: Data, i: number) => i"
        :y="(d: Data) => d._annY"
        :size="(d: Data, i: number) => groupedAnnotations[i] ? (groupedAnnotations[i].length > 1 ? 7 : 6) : 0"
        :color="(d: Data, i: number) => getAnnotationColor(i)"
        :stroke-color="(d: Data, i: number) => getAnnotationStrokeColor(i)"
        :stroke-width="(d: Data, i: number) => getAnnotationStrokeWidth(i)"
        :attributes="{
          [Scatter.selectors.point]: {
            cursor: 'pointer',
            class: 'annotation-scatter-point'
          }
        }"
        @click="handleAnnotationClick"
      />

      <VisAxis
        v-if="showXAxis"
        type="x"
        :tick-format="xFormatter ?? ((v: number) => data[v]?.[index])"
        :grid-line="false"
        :tick-line="false"
        tick-text-color="hsl(var(--vis-text-color))"
      />
      <VisAxis
        v-if="showYAxis"
        type="y"
        :tick-line="false"
        :tick-format="yFormatter"
        :domain-line="false"
        :grid-line="showGridLine"
        :attributes="{
          [Axis.selectors.grid]: {
            class: 'text-muted',
          },
        }"
        tick-text-color="hsl(var(--vis-text-color))"
      />
    </VisXYContainer>

    <!-- Annotation popover -->
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

<style scoped>
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

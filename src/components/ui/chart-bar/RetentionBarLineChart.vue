<script setup lang="ts" generic="T extends Record<string, any>">
import type { BulletLegendItemInterface } from '@unovis/ts'
import type { BaseChartProps } from './index'
import { ChartCrosshair, ChartLegend } from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import { Axis, StackedBar, Line } from '@unovis/ts'
import { VisAxis, VisStackedBar, VisLine, VisXYContainer, VisScatter } from '@unovis/vue'
import { useMounted } from '@vueuse/core'
import { type Component, computed, ref, watch } from 'vue'
import { formatMinifiedNumber } from '@/filters/formatNumbers'
import RetentionChartTooltip from './RetentionChartTooltip.vue'

const props = withDefaults(defineProps<BaseChartProps<T> & {
  customTooltip?: Component
  barCategories: string[]
  lineCategories: string[]
  roundedCorners?: number
  linesOnly?: boolean
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
})

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
  // Simple toggle logic for demo/basic use
  legendItems.value[i].inactive = !legendItems.value[i].inactive
}
</script>

<template>
  <div :class="cn('w-full h-full md:h-[400px] flex flex-col items-end', $attrs.class ?? '')">
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
        />
        <VisScatter
          :x="(d: Data, i: number) => i"
          :y="(d: Data) => d[cat]"
          :color="colors[categories.indexOf(cat)]"
          :size="6"
        />
      </template>

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
  </div>
</template>

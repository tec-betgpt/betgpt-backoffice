<template>
  <Card>
    <CardHeader>
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <CardTitle>{{ title }}</CardTitle>
          <GlossaryTooltipComponent v-if="glossary" :description="glossary" />
        </div>
        <div class="w-52">
          <Popover v-model:open="open">
            <PopoverTrigger as-child>
              <Button
                  variant="outline"
                  role="combobox"
                  :aria-expanded="open"
                  class="w-full justify-between"
              >
                <span class="truncate">
                  {{ selectedDefinitions.length === 0 ? 'Selecione as definições...' : selectedDefinitions.map(c => c.label).join(', ') }}
                </span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[--radix-popover-trigger-width] p-0">
              <Command :filter-function="(list, search) => list.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))">
                <CommandInput placeholder="Buscar definição..." />
                <CommandEmpty>Nenhuma definição encontrada.</CommandEmpty>
                <CommandGroup>
                  <CommandList>
                    <CommandItem
                        v-for="option in definitionOptions"
                        :key="option.value"
                        :value="option"
                        @select.prevent="() => toggleOption(option)"
                    >
                      <Checkbox
                          :checked="isSelected(option)"
                          class="mr-2"
                      />
                      {{ option.label }}
                    </CommandItem>
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </CardHeader>

    <Separator />

    <CardContent class="py-4">
      <apexchart type="pie" :options="chartOptions" :series="series" />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown } from 'lucide-vue-next';
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";

type DefinitionOption = {
  label: string;
  value: string;
};

const props = defineProps({
  chartData: {
    type: Object as () => ({ series: (string | number)[], labels: string[] }),
    required: true,
    default: () => ({ series: [], labels: [] }),
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String as () => 'currency' | 'numeric',
    default: 'numeric',
  },
  glossary: {
    type: String,
    required: false,
  },
});

const open = ref(false);

const combinedData = computed(() => {
  if (!props.chartData || !props.chartData.labels || !props.chartData.series) {
    return [];
  }
  return props.chartData.labels.map((label, index) => ({
    label: label,
    value: parseFloat(props.chartData.series[index] as string),
  }));
});

const sortedData = computed(() =>
    [...combinedData.value].sort((a, b) => b.value - a.value)
);

const definitionOptions = computed<DefinitionOption[]>(() =>
    combinedData.value.map(item => ({ label: item.label, value: item.label }))
);

const selectedDefinitions = ref<DefinitionOption[]>([]);

watch(() => sortedData.value, (newData) => {
  if (newData.length > 0) {
    selectedDefinitions.value = newData.slice(0, 5).map(item => ({ label: item.label, value: item.label }));
  }
}, { immediate: true, deep: true });

const filteredData = computed(() =>
    combinedData.value.filter(item => selectedDefinitions.value.some(c => c.value === item.label))
);

const series = computed(() =>
    filteredData.value.map(item => item.value)
);

const isDarkMode = computed(() => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
});

const chartOptions = computed(() => ({
  labels: filteredData.value.map(item => item.label),
  legend: {
    position: 'bottom',
    labels: {
      colors: isDarkMode.value ? '#fff' : '#000',
    }
  },
  tooltip: {
    y: {
      formatter: function (val: number) {
        if (props.type === 'currency') {
          return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
        }
        return new Intl.NumberFormat('pt-BR', {}).format(val);
      }
    }
  },
  dataLabels: {
    formatter: (val: number, { seriesIndex, w }) => {
      const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
      const percentage = (w.globals.series[seriesIndex] / total) * 100;
      return percentage.toFixed(1) + '%';
    }
  },
  responsive: [{
    breakpoint: 480,
    options: {
      legend: {
        position: 'bottom'
      }
    }
  }]
}));

function toggleOption(option: DefinitionOption) {
  const index = selectedDefinitions.value.findIndex(o => o.value === option.value);
  if (index > -1) {
    selectedDefinitions.value = selectedDefinitions.value.filter(o => o.value !== option.value);
  } else {
    selectedDefinitions.value = [...selectedDefinitions.value, option];
  }
}

function isSelected(option: DefinitionOption) {
  return selectedDefinitions.value.some(o => o.value === option.value);
}
</script>

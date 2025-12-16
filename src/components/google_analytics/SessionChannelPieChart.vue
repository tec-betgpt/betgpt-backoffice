<template>
  <Card>
    <CardHeader>
      <div class="flex justify-between items-center">
        <CardTitle>Sessões por Canal</CardTitle>
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
                  {{ selectedChannels.length === 0 ? 'Selecione os canais...' : selectedChannels.map(c => c.label).join(', ') }}
                </span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[--radix-popover-trigger-width] p-0">
              <Command :filter-function="(list, search) => list.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))">
                <CommandInput placeholder="Buscar canal..." />
                <CommandEmpty>Nenhum canal encontrado.</CommandEmpty>
                <CommandGroup>
                  <CommandList>
                    <CommandItem
                      v-for="option in channelOptions"
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
import { defineProps, computed, ref, watch } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown } from 'lucide-vue-next';
import VueApexCharts from 'vue3-apexcharts';

type ChannelOption = {
  label: string;
  value: string;
};

const props = defineProps({
  groupSessionData: {
    type: Array as () => any[],
    required: true,
    default: () => [],
  },
});

const open = ref(false);

const sortedData = computed(() =>
  [...props.groupSessionData].sort((a, b) => b.sessions - a.sessions)
);

const channelOptions = computed<ChannelOption[]>(() =>
  props.groupSessionData.map(item => ({ label: item.channel, value: item.channel }))
);

const selectedChannels = ref<ChannelOption[]>([]);

watch(() => sortedData.value, (newData) => {
  if (newData.length > 0) {
    selectedChannels.value = newData.slice(0, 5).map(item => ({ label: item.channel, value: item.channel }));
  }
}, { immediate: true, deep: true });

const filteredData = computed(() =>
  props.groupSessionData.filter(item => selectedChannels.value.some(c => c.value === item.channel))
);

const series = computed(() =>
  filteredData.value.map(item => item.sessions)
);

const isDarkMode = computed(() => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
});

const chartOptions = computed(() => ({
  labels: filteredData.value.map(item => item.channel),
  legend: {
    position: 'bottom',
    labels: {
      colors: isDarkMode.value ? '#fff' : '#000',
    }
  },
  tooltip: {
    y: {
      formatter: function (val: number) {
        return new Intl.NumberFormat('pt-BR', {}).format(val);
      }
    }
  },
  dataLabels: {
    formatter: function (val: number) {
      return new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(val);
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

function toggleOption(option: ChannelOption) {
  const index = selectedChannels.value.findIndex(o => o.value === option.value);
  if (index > -1) {
    selectedChannels.value = selectedChannels.value.filter(o => o.value !== option.value);
  } else {
    selectedChannels.value = [...selectedChannels.value, option];
  }
}

function isSelected(option: ChannelOption) {
  return selectedChannels.value.some(o => o.value === option.value);
}
</script>

<script setup lang="ts">
import type { DateRange } from "radix-vue";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { RangeCalendar } from "@/components/ui/range-calendar";
import {
  DateFormatter,
  today,
  CalendarDate,
} from "@internationalized/date";
import { Calendar as CalendarIcon } from "lucide-vue-next";
import {
  ref,
  defineProps,
  defineEmits,
  watch,
  onMounted,
  onUnmounted,
} from "vue";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {useWorkspaceStore} from "@/stores/workspace";

const props = defineProps<{ modelValue: DateRange }>();
const emit = defineEmits(["update:modelValue"]);

// Configurações de Localização e Fuso
const TIMEZONE = "America/Sao_Paulo";
const locale = Intl.DateTimeFormat().resolvedOptions().locale || "pt-BR";
const df = new DateFormatter(locale, { dateStyle: "short" });

const STORAGE_KEY = "user_date_range_preset";
const RANGE_KEY = "user_date_range_custom_range";

const workspace = useWorkspaceStore();
const popoverOpen = ref(false);
const selectedPreset = ref("today");
const calendarRef = ref<DateRange | undefined>();
const value = ref<DateRange>(props.modelValue);
const width = ref(window.innerWidth);

// Atualiza o tamanho da tela para o modo responsivo do calendário
function updateSize() {
  width.value = window.innerWidth;
}

watch(value, (newVal) => {
  workspace.setDate(newVal)
  emit("update:modelValue", newVal)
});

const handleCalendar = () => {
  if (!calendarRef.value) return;
  value.value = calendarRef.value;
  selectedPreset.value = "custom";
  localStorage.setItem(STORAGE_KEY, "custom");

  const { start, end } = calendarRef.value;
  if (start && end) {
    localStorage.setItem(
        RANGE_KEY,
        JSON.stringify({
          start: { year: start.year, month: start.month, day: start.day },
          end: { year: end.year, month: end.month, day: end.day },
        })
    );
  }

  popoverOpen.value = false;
};

const applyPreset = (preset: string) => {
  const brToday = today(TIMEZONE);
  let start = brToday;
  let end = brToday;

  switch (preset) {
    case "today":
      start = end = brToday;
      break;
    case "yesterday":
      start = end = brToday.subtract({ days: 1 });
      break;
    case "7days":
      start = brToday.subtract({ days: 7 });
      end = brToday.subtract({ days: 1 });
      break;
    case "14days":
      start = brToday.subtract({ days: 14 });
      end = brToday.subtract({ days: 1 });
      break;
    case "28days":
      start = brToday.subtract({ days: 28 });
      end = brToday.subtract({ days: 1 });
      break;
    case "month":
      start = brToday.set({ day: 1 });
      end = brToday;
      break;
  }
  value.value = { start, end };
};

const triggerSelection = (preset: string) => {
  selectedPreset.value = preset;
  localStorage.setItem(STORAGE_KEY, preset);

  if (preset === "custom") {
    popoverOpen.value = true;
    const saved = localStorage.getItem(RANGE_KEY);
    if (saved) {
      try {
        const { start: s, end: e } = JSON.parse(saved);
        const start = new CalendarDate(s.year, s.month, s.day);
        const end = new CalendarDate(e.year, e.month, e.day);
        value.value = { start, end };
        calendarRef.value = { start, end };
      } catch (err) {
        console.error("Erro ao carregar range customizado", err);
      }
    }
    return;
  }

  applyPreset(preset);
  localStorage.removeItem(RANGE_KEY);
  popoverOpen.value = false;
};

const getDaysDiff = (start: any, end: any) => {
  if (!start || !end) return -1;
  const s = new CalendarDate(start.year, start.month, start.day);
  const e = new CalendarDate(end.year, end.month, end.day);
  return Math.abs(e.compare(s));
};

onMounted(() => {
  window.addEventListener("resize", updateSize);
  const savedPreset = localStorage.getItem(STORAGE_KEY);

  if (savedPreset === "custom") {
    selectedPreset.value = "custom";
    const saved = localStorage.getItem(RANGE_KEY);
    if (saved) {
      try {
        const { start: s, end: e } = JSON.parse(saved);
        const start = new CalendarDate(s.year, s.month, s.day);
        const end = new CalendarDate(e.year, e.month, e.day);
        value.value = { start, end };
        calendarRef.value = { start, end };
      } catch {
        if (props.modelValue) value.value = props.modelValue;
      }
    }
  } else if (savedPreset) {
    selectedPreset.value = savedPreset;
    applyPreset(savedPreset);
  } else {
    if (props.modelValue?.start && props.modelValue?.end) {
      const diff = getDaysDiff(props.modelValue.start, props.modelValue.end);

      if (diff === 0) selectedPreset.value = "custom";
      else if (diff === 6) selectedPreset.value = "7days";
      else if (diff === 13) selectedPreset.value = "14days";
      else if (diff === 27) selectedPreset.value = "28days";
      else selectedPreset.value = "custom";

      value.value = props.modelValue;
    } else {
      selectedPreset.value = "today";
      applyPreset("today");
    }
  }

  emit("update:modelValue", value.value);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateSize);
});

const openS = ref(false);
watch(openS, (newV) => {
  if (newV && popoverOpen.value) {
    popoverOpen.value = false;
  }
});
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverAnchor as-child>
      <Select
          v-model:open="openS"
          :modelValue="selectedPreset"
          @update:modelValue="triggerSelection"
      >
        <SelectTrigger class="md:w-60 w-full">
          <CalendarIcon class="mr-2 h-4 w-4" />
          <template v-if="selectedPreset !== 'custom'">
            {{
              selectedPreset === "today"
                  ? "Hoje"
                  : selectedPreset === "yesterday"
                      ? "Ontem"
                      : selectedPreset === "month"
                          ? "Este mês"
                          : `Últimos ${selectedPreset.replace("days", "")} dias`
            }}
          </template>
          <template v-else-if="value.start">
            <template v-if="value.end && value.start.toDate(TIMEZONE).getTime() !== value.end.toDate(TIMEZONE).getTime()">
              {{ df.format(value.start.toDate(TIMEZONE)) }} –
              {{ df.format(value.end.toDate(TIMEZONE)) }}
            </template>
            <template v-else>
              {{ df.format(value.start.toDate(TIMEZONE)) }}
            </template>
          </template>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="custom">Personalizado</SelectItem>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="yesterday">Ontem</SelectItem>
          <SelectItem value="7days">Últimos 7 dias</SelectItem>
          <SelectItem value="14days">Últimos 14 dias</SelectItem>
          <SelectItem value="28days">Últimos 28 dias</SelectItem>
          <SelectItem value="month">Este mês</SelectItem>
        </SelectContent>
      </Select>
    </PopoverAnchor>

    <PopoverContent class="w-full p-4" align="center">
      <RangeCalendar
          v-model="calendarRef"
          weekday-format="short"
          :locale="locale"
          initial-focus
          :number-of-months="width > 768 ? 2 : 1"
          :placeholder="value.start"
      />
      <Button class="w-full mt-2" @click="handleCalendar"> Aplicar </Button>
    </PopoverContent>
  </Popover>
</template>
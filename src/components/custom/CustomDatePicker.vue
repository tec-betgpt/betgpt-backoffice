<script setup lang="ts">
import type { DateRange } from "radix-vue";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RangeCalendar } from "@/components/ui/range-calendar";
import {
  DateFormatter,
  getLocalTimeZone,
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

const props = defineProps<{ modelValue: DateRange }>();
const emit = defineEmits(["update:modelValue"]);

const locale = Intl.DateTimeFormat().resolvedOptions().locale;
const df = new DateFormatter(locale, { dateStyle: "short" });

const STORAGE_KEY = "user_date_range_preset";
const RANGE_KEY = "user_date_range_custom_range";

const popoverOpen = ref(false);
const selectedPreset = ref("today");
const calendarRef = ref<DateRange | undefined>();
const value = ref<DateRange>(props.modelValue);
const width = ref(window.innerWidth);

watch(value, (newVal) => emit("update:modelValue", newVal));

const handleCalendar = () => {
  if (!calendarRef.value) return;
  value.value = calendarRef.value;
  selectedPreset.value = "custom";
  localStorage.setItem(STORAGE_KEY, "custom");

  const { start, end } = calendarRef.value;
  localStorage.setItem(
    RANGE_KEY,
    JSON.stringify({
      start: { year: start.year, month: start.month, day: start.day },
      end: { year: end.year, month: end.month, day: end.day },
    })
  );

  popoverOpen.value = false;
};
function updateSize() {
  width.value = window.innerWidth;
}
onMounted(() => {
  window.addEventListener("resize", updateSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateSize);
});
const applyPreset = (preset: string) => {
  const todayDate = today(getLocalTimeZone());
  let end = today(getLocalTimeZone());
  let start = end;
  switch (preset) {
    case "today":
      start = end;
      break;
    case "yesterday":
      start = end = todayDate.subtract({ days: 1 });
      break;
    case "7days":
      start = end.subtract({ days: 7 });
      break;
    case "14days":
      start = end.subtract({ days: 14 });
      break;
    case "28days":
      start = end.subtract({ days: 28 });
      break;
  }
  value.value = { start, end };
};

const triggerSelection = (preset: string) => {
  selectedPreset.value = "";
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
      } catch {}
    }

    return;
  }

  applyPreset(preset);
  localStorage.removeItem(RANGE_KEY);
  popoverOpen.value = false;
};

onMounted(() => {
  const savedPreset = localStorage.getItem(STORAGE_KEY) || "today";
  selectedPreset.value = savedPreset;

  if (savedPreset === "custom") {
    const saved = localStorage.getItem(RANGE_KEY);
    if (saved) {
      try {
        const { start: s, end: e } = JSON.parse(saved);
        const start = new CalendarDate(s.year, s.month, s.day);
        const end = new CalendarDate(e.year, e.month, e.day);
        value.value = { start, end };
        calendarRef.value = { start, end };
      } catch {}
    }
  } else {
    applyPreset(savedPreset);
  }
});
const openS = ref();
watch(openS, (newV) => {
  if (newV && popoverOpen.value) {
    popoverOpen.value = false;
  }
});
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <Select
        v-model:open="openS"
        :modelValue="selectedPreset"
        @update:modelValue="triggerSelection"
      >
        <SelectTrigger class="md:w-96 w-full">
          <CalendarIcon class="mr-2 h-4 w-4" />
          <template v-if="selectedPreset !== 'custom'">
            {{
              selectedPreset === "today"
                ? "Hoje"
                : selectedPreset === "yesterday"
                ? "Ontem"
                : `Últimos ${selectedPreset.replace("days", "")} dias`
            }}
          </template>
          <template v-else-if="value.start">
            <template v-if="value.end">
              {{ df.format(value.start.toDate(getLocalTimeZone())) }} –
              {{ df.format(value.end.toDate(getLocalTimeZone())) }}
            </template>
            <template v-else>
              {{ df.format(value.start.toDate(getLocalTimeZone())) }}
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
        </SelectContent>
      </Select>
    </PopoverTrigger>

    <PopoverContent class="w-full p-4" align="center">
      <RangeCalendar
        v-model="calendarRef"
        weekday-format="short"
        :locale="locale"
        initial-focus
        :number-of-months="width > 600 ? 2 : 1"
        :placeholder="value.start"
      />
      <Button class="w-full mt-2" @click="handleCalendar"> Aplicar </Button>
    </PopoverContent>
  </Popover>
</template>

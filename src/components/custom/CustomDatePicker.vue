<script setup lang="ts">
import type { DateRange } from "radix-vue";
//import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { RangeCalendar } from "@/components/ui/range-calendar";

import {
  DateFormatter,
  getLocalTimeZone, today,
} from "@internationalized/date";
import { Calendar as CalendarIcon } from "lucide-vue-next";
import { ref, defineProps, defineEmits, watch } from "vue";
import {Select, SelectContent, SelectTrigger, SelectValue} from "@/components/ui/select";

const props = defineProps<{
  modelValue: DateRange;
}>();

const emit = defineEmits(["update:modelValue"]);
const locale = Intl.DateTimeFormat().resolvedOptions().locale
const df = new DateFormatter(locale, {
  dateStyle: "medium",
});
const set = ref()
const value = ref(props.modelValue);
const calendarRef = ref<DateRange>()
watch(value, (newValue) => {
  emit("update:modelValue", newValue);
});
const handleCalendar = ()=>{
  if (calendarRef.value) {
    value.value = calendarRef.value
  }
  set.value = false
}
const sel = ref("")
watch(sel, (newValue) => {
  set.value = false
  if (newValue === "custom") {
    set.value = true
  }
  if (newValue === "today") {
    value.value = {
      start: today(getLocalTimeZone()).subtract({ days: 0 }),
      end: today(getLocalTimeZone()).subtract({ days: 0 }),
    }
  } else if (newValue === "yesterday") {
    value.value = {
      start: today(getLocalTimeZone()).subtract({ days: 1 }),
      end: today(getLocalTimeZone()).subtract({ days: 0 }),
    }
  } else if (newValue === "7days") {
    value.value = {
      start: today(getLocalTimeZone()).subtract({ days: 7 }),
      end: today(getLocalTimeZone()).subtract({ days: 0 }),
    }
  } else if (newValue === "14days") {
    value.value = {
      start: today(getLocalTimeZone()).subtract({ days: 14 }),
      end: today(getLocalTimeZone()).subtract({ days: 0 }),
    }
  } else if (newValue === "28days") {
    value.value = {
      start: today(getLocalTimeZone()).subtract({ days: 28 }),
      end: today(getLocalTimeZone()).subtract({ days: 0 }),
    }
  }
})
</script>

<template>
  <Popover :open="set">
    <PopoverTrigger as-child>
      <Select v-model="sel">
        <SelectTrigger>
          <CalendarIcon class="mr-2 h-4 w-4" />

          <template v-if="value.start">
            <template v-if="value.end">
              {{ df.format(value.start.toDate(getLocalTimeZone())) }} -
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
    <PopoverContent class="w-auto p-2" align="center">
      <RangeCalendar
          v-model="calendarRef"
          weekday-format="short"
          :number-of-months="1"
          :locale="locale"
          initial-focus
          :placeholder="value.start"
      />
      <Button
          class="w-full mt-2"
          @click="handleCalendar"
      >
        Aplicar
      </Button>
    </PopoverContent>
  </Popover>
</template>

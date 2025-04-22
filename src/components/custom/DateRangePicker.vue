<script setup lang="ts">
import type { DateRange } from "radix-vue";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { RangeCalendar } from "@/components/ui/range-calendar";
import { cn } from "@/lib/utils";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";
import { Calendar as CalendarIcon } from "lucide-vue-next";
import { ref, defineProps, defineEmits, watch } from "vue";

const props = defineProps<{
  modelValue: DateRange;
}>();

const emit = defineEmits(["update:modelValue"]);

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});

const value = ref(props.modelValue);

watch(value, (newValue) => {
  emit("update:modelValue", newValue);
});
</script>

<template>
  <div :class="cn('grid gap-2', $attrs.class ?? '')">
    <Popover>
      <PopoverTrigger as-child>
        <Button
          id="date"
          :variant="'outline'"
          :class="
            cn(
              'w-[300px] justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )
          "
        >
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
          <template v-else> Selecionar data </template>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="end">
        <RangeCalendar
          v-model="value"
          weekday-format="short"
          :number-of-months="2"
          locale="pt-BR"
          initial-focus
          :placeholder="value.start"
        />
      </PopoverContent>
    </Popover>
  </div>
</template>

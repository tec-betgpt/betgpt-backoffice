<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ref, defineProps, defineEmits, watch } from "vue";
import { Calendar as CalendarIcon } from "lucide-vue-next";
import {
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
} from "@internationalized/date";

const props = defineProps<{
  modelValue: Date;
}>();

const emit = defineEmits(["update:modelValue"]);

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});

const value = ref(props.modelValue);

// Atualiza o valor interno e emite para o componente pai
const updateDate = (date: any) => {
  value.value = date;
  emit("update:modelValue", date);
};
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="
          cn(
            'w-[200px] justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )
        "
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{
          value
            ? df.format(value.toDate(getLocalTimeZone()))
            : "Escolha uma data"
        }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar
        :v-model="value"
        @update:modelValue="updateDate"
        locale="pt-BR"
        initial-focus
      />
    </PopoverContent>
  </Popover>
</template>

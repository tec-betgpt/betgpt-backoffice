<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="gap-2 text-muted-foreground"
        title="Selecionar colunas visíveis"
      >
        <SlidersHorizontal class="h-4 w-4" />
        <span class="hidden sm:inline">Colunas</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="max-h-80 overflow-y-auto">
      <DropdownMenuLabel>Exibir colunas</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem
        v-for="column in toggleableColumns"
        :key="column.id"
        :model-value="modelValue[column.id] !== false"
        @select.prevent
        @update:model-value="(value) => toggle(column.id, value)"
      >
        {{ column.label }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { computed, toRef, type PropType } from "vue";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-vue-next";
import { useColumnVisibilityStorage } from "@/composables/useColumnVisibilityStorage";
import { isActionsColumn } from "@/components/custom/columnLabel";

const props = defineProps({
  columns: {
    type: Array as PropType<Array<{ id: string; label: string }>>,
    required: true,
  },
  modelValue: {
    type: Object as PropType<Record<string, boolean>>,
    default: () => ({}),
  },
  table: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(["update:modelValue"]);

const columnsRef = computed(() => props.columns);
const modelValueRef = computed(() => props.modelValue);
const toggleableColumns = computed(() => props.columns.filter((column) => !isActionsColumn(column)));
const { persist } = useColumnVisibilityStorage(
  columnsRef,
  modelValueRef,
  (value) => emit("update:modelValue", value),
  toRef(props, "table"),
);

function toggle(id: string, value: boolean) {
  const column = props.columns.find((item) => item.id === id);
  if (column && isActionsColumn(column)) return;
  const next = { ...props.modelValue, [id]: value };
  emit("update:modelValue", next);
  persist(next);
}
</script>

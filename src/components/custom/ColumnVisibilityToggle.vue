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
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Exibir colunas</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem
        v-for="column in columns"
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
import { PropType } from "vue";
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

const props = defineProps({
  columns: {
    type: Array as PropType<Array<{ id: string; label: string }>>,
    required: true,
  },
  modelValue: {
    type: Object as PropType<Record<string, boolean>>,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:modelValue"]);

function toggle(id: string, value: boolean) {
  emit("update:modelValue", { ...props.modelValue, [id]: value });
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="gap-2 text-muted-foreground"
        title="Selecionar colunas visíveis"
      >
        <SlidersHorizontal class="h-4 w-4" />
        <span class="hidden sm:inline">Colunas</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" class="w-[250px] p-0">
      <Command v-if="open" :filter-results="false">
        <CommandInput placeholder="Buscar coluna..." @input="onSearch" />
        <div v-if="filteredColumns.length === 0" class="py-6 text-center text-sm text-muted-foreground">
          Nenhuma coluna encontrada.
        </div>
        <CommandList v-else>
          <CommandGroup heading="Exibir colunas">
            <button
              v-for="column in filteredColumns"
              :key="column.id"
              type="button"
              class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              @click="toggle(column.id, modelValue[column.id] === false)"
            >
              <Check
                :class="[
                  'mr-2 h-4 w-4 shrink-0',
                  modelValue[column.id] !== false ? 'opacity-100' : 'opacity-0',
                ]"
              />
              <span class="truncate">{{ column.label }}</span>
            </button>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch, type PropType } from "vue";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, SlidersHorizontal } from "lucide-vue-next";
import { useColumnVisibilityStorage } from "@/composables/useColumnVisibilityStorage";
import { columnMatchesSearch, isActionsColumn } from "@/components/custom/columnLabel";

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

const open = ref(false);
const searchQuery = ref("");

const columnsRef = computed(() => props.columns);
const modelValueRef = computed(() => props.modelValue);
const toggleableColumns = computed(() => props.columns.filter((column) => !isActionsColumn(column)));
const filteredColumns = computed(() =>
  toggleableColumns.value.filter((column) => columnMatchesSearch(column.label, searchQuery.value)),
);
const { persist } = useColumnVisibilityStorage(
  columnsRef,
  modelValueRef,
  (value) => emit("update:modelValue", value),
  toRef(props, "table"),
);

function onSearch(e: Event | string) {
  const query = typeof e === "string" ? e : (e.target as HTMLInputElement | null)?.value;
  if (query === undefined) return;
  searchQuery.value = query;
}

function toggle(id: string, value: boolean) {
  const column = props.columns.find((item) => item.id === id);
  if (column && isActionsColumn(column)) return;
  const next = { ...props.modelValue, [id]: value };
  emit("update:modelValue", next);
  persist(next);
}

watch(open, (value) => {
  if (!value) searchQuery.value = "";
});
</script>

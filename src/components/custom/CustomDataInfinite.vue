<template>
  <div class="w-full">
    <div v-if="updateText" class="flex flex-col sm:flex-row gap-2">
      <div
        v-for="(field, index) in searchFields"
        :key="field.key"
        class="grid w-full max-w-sm items-center gap-1.5"
      >
        <Label v-if="field.label" :for="'input-' + field.key">
          {{ field.label }}
        </Label>
        <Input
          :id="'input-' + field.key"
          class="sm:max-w-sm w-full"
          :placeholder="field.placeholder"
          v-model="searchValues[`search[${index}][${field.key}]`]"
          @input="checkIfEmpty"
        />
      </div>

      <Button
        :class="hasLabel ? 'mt-0 lg:mt-6' : ''"
        @click="resetAndFetch"
        :disabled="loading"
      >
        Buscar
      </Button>

      <div class="flex-1 flex items-end justify-end">
        <Button
          v-if="exportable"
          variant="ghost"
          :disabled="loading"
          @click="$emit('export')"
        >
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <ColumnVisibilityToggle
          v-model="columnVisibility"
          :columns="hideableColumns"
        />
      </div>

      <slot></slot>
    </div>

    <div v-if="!updateText" class="flex justify-end">
      <ColumnVisibilityToggle
        v-model="columnVisibility"
        :columns="hideableColumns"
      />
    </div>

    <Table class="w-full my-2">
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <template v-if="loading || isInitialLoading">
          <TableRow v-for="i in 5" :key="`skeleton-${i}`">
            <TableCell v-for="(col, colIndex) in visibleColumns" :key="colIndex">
              <Skeleton class="h-4 w-full bg-gray-300 my-4" />
            </TableCell>
          </TableRow>
        </template>

        <template v-else>
          <template v-if="data.length > 0">
            <TableRow v-for="row in data" :key="row.id">
              <TableCell v-for="col in visibleColumns" :key="col.accessorKey">
                <FlexRender
                  v-if="col.cell"
                  :render="col.cell"
                  :props="{ row: { original: row } }"
                />
                <template v-else>
                  {{ row[col.accessorKey] }}
                </template>
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-if="data.length === 0">
            <TableCell :colspan="visibleColumns.length" class="text-center">
              Nenhum registro encontrado
            </TableCell>
          </TableRow>

        </template>
      </TableBody>
    </Table>

    <div v-if="isLoadingMore">
      <div class="text-center w-full pt-4">
        Carregando mais dados...
      </div>
    </div>

    <div v-if="hasMore && !isLoadingMore && data.length > 0">
      <div class="text-center w-full pt-4">
        <Button variant="ghost" @click="loadMore">Carregar mais</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FlexRender, useVueTable, getCoreRowModel } from "@tanstack/vue-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-vue-next";
import ColumnVisibilityToggle from "@/components/custom/ColumnVisibilityToggle.vue";

const props = defineProps({
  columns: {
    type: Array as PropType<Array<any>>,
    required: true,
  },
  data: {
    type: Array as PropType<Array<Record<string, any>>>,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
  loadingInitial: {
    type: Boolean,
    required: false,
    default: true,
  },
  hasMore: {
    type: Boolean,
    required: true,
  },
  updateText: {
    type: Function,
  },
  find: {
    type: Function,
    required: true,
  },
  searchFields: {
    type: Array as PropType<
      Array<{ key: string; label?: string; placeholder: string }>
    >,
    default: () => [],
  },
  currentPage: {
    type: Number,
    required: true,
  },
  exportable: Boolean,
});

const emit = defineEmits(["load-more", "reset", "export"]);

const isLoadingMore = ref(false);
const isInitialLoading = ref(props.loadingInitial);
const searchValues = ref<Record<string, string>>({});
const columnVisibility = ref<Record<string, boolean>>({});

const columnId = (col: any) => col.accessorKey ?? col.id;

const hideableColumns = computed(() =>
  props.columns.map((col: any) => {
    const id = columnId(col);
    return {
      id,
      label: typeof col.header === "string" ? col.header : id,
    };
  })
);

const visibleColumns = computed(() =>
  props.columns.filter((col: any) => columnVisibility.value[columnId(col)] !== false)
);

const table = useVueTable({
  data: props.data,
  columns: props.columns,
  state: {
    get columnVisibility() {
      return columnVisibility.value;
    },
  },
  onColumnVisibilityChange: (updater: any) => {
    columnVisibility.value =
      typeof updater === "function" ? updater(columnVisibility.value) : updater;
  },
  getCoreRowModel: getCoreRowModel(),
});

const hasLabel = computed(() => {
  return props.searchFields?.some((field) => field?.label) ?? false;
});

const checkIfEmpty = () => {
  if (Object.values(searchValues.value).every((value) => !value)) {
    resetAndFetch();
  }
};

watch(
  searchValues,
  () => {
    if (props.updateText) {
      props.updateText(searchValues.value);
    }
  },
  { deep: true }
);

const resetAndFetch = () => {
  emit("reset");
  props.find(1);
};

const loadMore = () => {
  if (!props.loading && !isLoadingMore.value && props.hasMore) {
    isLoadingMore.value = true;
    emit("load-more", props.currentPage + 1);
  }
};

watch(
  () => props.data,
  (newData) => {
    if (newData.length > 0) {
      isInitialLoading.value = false;
    }
  },
  { immediate: true }
);

watch(
  () => props.loading,
  (loading) => {
    if (!loading) {
      isLoadingMore.value = false;
    }
  }
);
</script>

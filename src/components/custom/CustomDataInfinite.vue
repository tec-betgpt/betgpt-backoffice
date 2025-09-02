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
      </div>

      <slot></slot>
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
            <TableCell v-for="(col, colIndex) in columns" :key="colIndex">
              <Skeleton class="h-4 w-full bg-gray-300 my-4" />
            </TableCell>
          </TableRow>
        </template>

        <template v-else>
          <template v-if="data.length > 0">
            <TableRow v-for="row in data" :key="row.id">
              <TableCell v-for="col in columns" :key="col.accessorKey">
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
            <TableCell :colspan="columns.length" class="text-center">
              Nenhum registro encontrado
            </TableCell>
          </TableRow>

          <TableRow v-if="isLoadingMore">
            <TableCell :colspan="columns.length" class="text-center">
              Carregando mais dados...
            </TableCell>
          </TableRow>

          <TableRow v-if="hasMore && !isLoadingMore && data.length > 0">
            <TableCell :colspan="columns.length" class="text-center">
              <Button variant="ghost" @click="loadMore">Carregar mais</Button>
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
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

const table = useVueTable({
  data: props.data,
  columns: props.columns,
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

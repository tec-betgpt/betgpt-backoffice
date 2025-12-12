<template>
  <div v-if="updateText" class="flex flex-col sm:flex-row gap-2">
    <div
      v-for="(field, index) in searchFields"
      :key="field.key"
      class="grid w-full max-w-sm items-center gap-1.5"
    >
      <Label v-if="field.label" :for="'input-' + field.key">{{
          field.label
        }}</Label>

      <Input
        v-if="!field.type || field.type === 'text'"
        :id="'input-' + field.key"
        class="sm:max-w-sm w-full"
        :placeholder="field.placeholder"
        v-model="searchValues[`search[${index}][${field.key}]`]"
      />

      <Select
        v-else-if="field.type === 'date-range'"
        v-model="searchValues[`search[${index}][${field.key}]`]"
      >
        <SelectTrigger class="sm:max-w-sm w-full">
          <SelectValue :placeholder="field.placeholder" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="yesterday">Ontem</SelectItem>
          <SelectItem value="last_7_days">Últimos 7 Dias</SelectItem>
          <SelectItem value="last_14_days">Últimos 14 Dias</SelectItem>
          <SelectItem value="last_30_days">Últimos 30 Dias</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <Button
      :class="hasLabel ? 'mt-0 lg:mt-6' : ''"
      @click="find()"
      :disabled="loading"
    >
      Buscar
    </Button>
    <div class="flex flex-1 gap-2"></div>
    <slot></slot>
  </div>

  <Table class="w-full my-2">
    <TableHeader>
      <TableRow
        v-for="headerGroup in table.getHeaderGroups()"
        :key="headerGroup.id"
      >
        <TableHead v-if="props.select">
          <input type="checkbox" disabled />
        </TableHead>

        <TableHead v-for="header in headerGroup.headers" :key="header.id">
          <FlexRender
            :render="header.column.columnDef.header"
            :props="header.getContext()"
          />
        </TableHead>
      </TableRow>
      <TableRow
        v-if="props.head"
        class="bg-gray-50/10"
        v-for="headerGroup in table.getHeaderGroups()"
        :key="headerGroup.id"
      >
        <TableHead
          v-for="(header, index) in headerGroup.headers"
          :key="header.id"
          :class="index === 0 ? 'text-left font-bold' : 'text-right font-bold'"
        >
          {{
            formatHeadValue(
              header.column.id,
              props.head?.[header.column.id],
              header.column.columnDef.format
            )
          }}
        </TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      <template v-if="loading">
        <TableRow>
          <TableCell :colspan="columns.length + 1">
            <div class="flex justify-center items-center h-24">
              <Skeleton v-for="index in 5" class="h-4 w-full bg-gray-300 my-4" />
            </div>
          </TableCell>
        </TableRow>
      </template>
      <template v-else-if="table.getRowModel().rows.length">
        <template v-for="row in table.getRowModel().rows" :key="row.id">
          <TableRow>
            <TableCell v-if="props.select">
              <input
                type="checkbox"
                :checked="selectedRowIds.has(row.id)"
                @change="toggleRowSelection(row.id)"
              />
            </TableCell>
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </TableRow>
          <TableRow v-if="row.getIsExpanded()">
            <TableCell :colspan="row.getVisibleCells().length + (props.select ? 1 : 0)">
              <slot name="accordion-content" :row="row.original" />
            </TableCell>
          </TableRow>
        </template>
      </template>
      <TableRow v-else>
        <TableCell :colspan="columns.length + (props.select ? 1 : 0)" class="h-24 text-center">
          Nenhum resultado.
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="footer">
      <TableRow>
        <TableCell
          v-for="(column, index) in columns"
          :key="column.accessorKey"
          :class="index === 0 ? 'text-left font-bold' : 'text-right font-bold'"
        >
          {{
            formatFooterValue(
              column.accessorKey,
              props.result && props.result[column.accessorKey] !== undefined
                ? props.result[column.accessorKey]
                : footerData[column.accessorKey],
              column.footer,
              column.format
            )
          }}
        </TableCell>
      </TableRow>
    </TableFooter>
  </Table>

  <CustomPagination
    v-if="pages"
    :pages="pages"
    :select-page="selectPage"
    :per_pages="per_pages"
    @update:perPages="$emit('update:perPages', $event)"
  />
</template>

<script setup lang="ts">
import { PropType, ref, watch, computed, h } from "vue";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-vue-next";

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
  updateText: {
    type: Function,
  },
  find: {
    type: Function,
    required: false,
  },
  searchFields: {
    type: Array as PropType<
      Array<{
        key: string;
        label?: string;
        placeholder: string;
        type?: string;
        options?: Array<{ value: string; label: string }>;
      }>
    >,
    required: false,
  },
  footer: {
    type: Boolean,
    default: false,
  },
  head: {
    type: Object as PropType<Record<string, any>>,
    required: false,
  },
  select: {
    type: Boolean,
    default: false,
  },
  result: {
    type: Object as PropType<Record<string, any>>,
    required: false,
  },
  formatters: {
    type: Object as PropType<Record<string, Function>>,
    default: () => ({}),
  },
  pages: {
    type: Object as PropType<{ current: number; total: number; last: number }>,
    required: false,
  },
  selectPage: {
    type: Function as PropType<(page: number) => void>,
    required: false,
  },
  per_pages: {
    required: false,
  },
  getRowCanExpand: {
    type: Function as PropType<(row: any) => boolean>,
    default: () => true,
  },
});

const emit = defineEmits(["update:selected", "update:perPages"]);
const dataTable = ref([...props.data]);
const searchValues = ref<Record<string, string>>({});
const expanded = ref({});

const tableColumns = computed(() => [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => h(Button, {
        variant: 'ghost',
        size: 'sm',
        onClick: (e) => {
          e.stopPropagation();
          row.toggleExpanded();
        },
      },
      () => row.getIsExpanded() ? h(ChevronDownIcon, { class: 'h-4 w-4' }) : h(ChevronRightIcon, { class: 'h-4 w-4' })
    ),
  },
  ...props.columns,
]);

const table = ref(
  useVueTable({
    data: dataTable.value,
    columns: tableColumns.value,
    state: {
      get expanded() {
        return expanded.value
      },
    },
    onExpandedChange: updater => {
      expanded.value = typeof updater === 'function' ? updater(expanded.value) : updater
    },
    getRowCanExpand: props.getRowCanExpand,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })
);

const selectedRowIds = ref(new Set());
const selectedRows = computed(() =>
  table.value
    .getRowModel()
    .rows.filter((row) => selectedRowIds.value.has(row.id))
);

function toggleRowSelection(rowId) {
  if (selectedRowIds.value.has(rowId)) {
    selectedRowIds.value.delete(rowId);
  } else {
    selectedRowIds.value.add(rowId);
  }
  emit(
    "update:selected",
    selectedRows.value.map((r) => r.original)
  );
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("pt-BR").format(value);
};

const formatDecimal = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return `${(value || 0).toFixed(2)}%`;
};

const formatHeadValue = (
  columnKey: string,
  value: any,
  formatType?: string
) => {
  if (value === undefined || value === null || value === "") return "";

  if (props.formatters[columnKey]) {
    return props.formatters[columnKey](value);
  }

  if (formatType) {
    return applyFormatting(value, formatType);
  }

  return value;
};

const formatFooterValue = (
  columnKey: string,
  value: any,
  footerType: string,
  formatType?: string
) => {
  if (value === undefined || value === null || value === "") return "";

  if (props.formatters[columnKey]) {
    return props.formatters[columnKey](value);
  }

  if (formatType) {
    return applyFormatting(value, formatType);
  }

  if (typeof value === "number") {
    if (footerType === "avg") {
      return formatDecimal(value);
    } else {
      return formatNumber(Math.round(value));
    }
  }

  return value;
};

const applyFormatting = (value: any, formatType: string) => {
  const numValue = typeof value === "number" ? value : parseFloat(value || 0);

  switch (formatType) {
    case "currency":
      return formatCurrency(numValue);
    case "percentage":
      return formatPercentage(numValue);
    case "number":
      return formatNumber(Math.round(numValue));
    case "decimal":
      return formatDecimal(numValue);
    case "integer":
      return Math.round(numValue).toString();
    default:
      return value;
  }
};

const footerData = computed(() => {
  const footerResult: Record<string, string | number> = {};

  props.columns.forEach((col: any) => {
    const footerType = col.footer;
    if (footerType) {
      const values = props.data.map((row) => Number(row[col.accessorKey]) || 0);

      if (footerType === "sum") {
        footerResult[col.accessorKey] = values.reduce((a, b) => a + b, 0);
      } else if (footerType === "avg") {
        const total = values.reduce((a, b) => a + b, 0);
        const avg = values.length ? total / values.length : 0;
        footerResult[col.accessorKey] = avg;
      }
    } else {
      footerResult[col.accessorKey] = "";
    }
  });

  return footerResult;
});

watch(
  searchValues,
  () => {
    if(props.updateText) {
      props.updateText(searchValues.value);
    }
  },
  { deep: true }
);

watch(
  () => props.data,
  (newData) => {
    const data = Array.isArray(newData) ? newData : [];
    dataTable.value = [...data];
    table.value = useVueTable({
      data: dataTable.value,
      columns: tableColumns.value,
      state: {
        get expanded() {
          return expanded.value
        },
      },
      onExpandedChange: updater => {
        expanded.value = typeof updater === 'function' ? updater(expanded.value) : updater
      },
      getRowCanExpand: props.getRowCanExpand,
      getCoreRowModel: getCoreRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
    });
  },
  { deep: true }
);

const hasLabel = computed(() => {
  return props.searchFields && props.searchFields.some((field) => field.label);
});
</script>

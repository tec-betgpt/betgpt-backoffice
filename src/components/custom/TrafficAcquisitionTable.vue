<template>
  <Card class="w-full">
    <CardHeader>
      <div class="flex justify-between items-center gap-4">
        <CardTitle>{{ title }}</CardTitle>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="ml-auto">
              Colunas <ChevronDown class="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
                v-for="column in columns"
                :key="column.id"
                class="capitalize"
                :checked="columnVisibility[column.id]"
                @update:checked="(value) => $emit('update:columnVisibility', { ...columnVisibility, [column.id]: value })"
            >
              {{ column.label }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>

    <Separator />

    <CardContent class="mt-5">
      <div class="flex flex-col justify-end sm:flex-row gap-2 mb-4">
        <slot name="filters" :searchValues="searchValues" :loading="loading" :apply-filter="() => $emit('apply-filter')">
          <!-- Default filter slot can be defined here if needed -->
        </slot>
      </div>

      <div class="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead v-for="column in columns.filter(c => columnVisibility[c.id])" :key="column.id" :class="column.class">
                <Button
                    :variant="orderId === column.id ? 'default' : 'ghost'"
                    @click="$emit('update:order', column.id)"
                    class="px-3 text-nowrap"
                    :title="column.tooltip"
                >
                  <slot :name="`header-cell-${column.id}`" :column="column">
                    {{ column.label }}
                  </slot>
                  <component :is="orderId === column.id ? (order ? ArrowDown : ArrowUp) : ChevronsUpDown" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="loading">
              <TableRow v-for="i in 5" :key="i">
                <TableCell v-for="key in columns.filter(c => columnVisibility[c.id]).map(c => c.id)" :key="key">
                  <Skeleton class="h-4 w-full bg-gray-300" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else-if="data.length">
              <TableRow v-for="(row, index) in data" :key="index">
                <TableCell v-for="column in columns.filter(c => columnVisibility[c.id])" :key="column.id" :class="column.class">
                  <slot :name="`body-cell-${column.id}`" :row="row">
                    {{ column.formatter ? column.formatter(row[column.id]) : row[column.id] }}
                  </slot>
                </TableCell>
              </TableRow>
            </template>
            <template v-else>
              <TableRow>
                <TableCell :colspan="columns.filter(c => columnVisibility[c.id]).length" class="h-24 text-center">
                  Sem resultados.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
          <TableFooter>
            <TableRow v-if="pageTotal">
              <TableCell v-for="column in columns.filter(c => columnVisibility[c.id])" :key="column.id" :class="column.class" class="font-bold">
                <slot :name="`footer-cell-${column.id}`" :total="pageTotal">
                  {{ column.formatter ? column.formatter(pageTotal[column.id]) : pageTotal[column.id] }}
                </slot>
              </TableCell>
            </TableRow>
            <TableRow v-if="grandTotal" class="bg-gray-50/10">
              <TableCell v-for="column in columns.filter(c => columnVisibility[c.id])" :key="column.id" :class="column.class" class="font-bold">
                 <slot :name="`grand-total-cell-${column.id}`" :total="grandTotal">
                    {{ column.formatter ? column.formatter(grandTotal[column.id]) : grandTotal[column.id] }}
                  </slot>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </CardContent>

    <CardFooter class="py-4 w-full">
      <CustomPagination
          :pages="pages"
          :select-page="(page) => $emit('apply-filter', page)"
          @update:perPages="(value) => $emit('update:per-pages', value)"
          :per_pages="perPages"
      />
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import {
  ChevronsUpDown,
  ArrowDown,
  ArrowUp,
  ChevronDown,
} from "lucide-vue-next";
import CustomPagination from "@/components/custom/CustomPagination.vue";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type Column = {
  id: string;
  label: string;
  tooltip?: string;
  class?: string;
  formatter?: (value: any) => string;
  type?: 'text' | 'numeric' | 'currency';
};

const props = defineProps<{
  title: string;
  loading: boolean;
  data: Array<Record<string, any>>;
  grandTotal: Record<string, any> | null;
  pageTotal: Record<string, any>;
  pages: {
    current: number;
    last: number;
    total: number;
  };
  perPages: number;
  columns: Column[];
  columnVisibility: Record<string, boolean>;
  orderId: string;
  order: boolean;
  searchValues: Record<string, string>;
}>();

const emit = defineEmits([
  'apply-filter',
  'update:columnVisibility',
  'update:order',
  'update:searchValues',
  'update:per-pages',
]);

</script>

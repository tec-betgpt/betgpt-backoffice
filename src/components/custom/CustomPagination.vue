<script setup lang="ts">
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { reactive, toRefs, watch } from "vue";

// Definição das props
const props = defineProps({
  pages: {
    type: Object as () => {
      current: number;
      total: number;
      last: number;
    },
    required: true,
  },
  selectPage: {
    type: Function as () => (page: number) => void,
    required: true,
  },
  per_pages: {
    required: false,
  },
});

// Estado reativo local para "p", sincronizado com as props
const p = reactive({
  current: props.pages.current,
  total: props.pages.total,
  last: props.pages.last,
});

// Atualiza "p" sempre que as props mudarem
watch(
  () => props.pages,
  (newPages) => {
    p.current = newPages.current;
    p.total = newPages.total;
    p.last = newPages.last;
  },
  { deep: true }
);

// Função para aplicar a lógica de filtro e alterar a página
const applyFilter = (page: number) => {
  if (props.selectPage) {
    props.selectPage(page);
  }
};
</script>

<template>
  <Pagination
    class="w-full"
    v-if="p.last > 1"
    :total="p.total"
    :items-per-page="per_pages ? per_pages : 10"
    :sibling-count="1"
    show-edges
    :default-page="1"
  >
    <PaginationList v-slot="{ items }" class="flex items-center gap-2">
      <PaginationFirst as-child @click="applyFilter(1)" />
      <PaginationPrev as-child @click="applyFilter(p.current - 1)" />
      <template v-for="(item, index) in items" :key="index">
        <PaginationListItem
          v-if="item.type === 'page'"
          :value="item.value"
          as-child
        >
          <Button
            class="min-w-9 min-h-9 p-2"
            :variant="item.value === p.current ? 'default' : 'outline'"
            @click="applyFilter(item.value)"
          >
            {{ item.value }}
          </Button>
        </PaginationListItem>
        <PaginationEllipsis v-else :index="index" />
      </template>

      <PaginationNext as-child @click="applyFilter(p.current + 1)" />
      <PaginationLast as-child @click="applyFilter(p.last)" />
    </PaginationList>
  </Pagination>
</template>

<style scoped></style>

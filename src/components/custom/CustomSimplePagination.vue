<script setup lang="ts">
import {
  Pagination,
  PaginationList,
  PaginationNext,
  PaginationPrev,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { computed, defineProps, defineEmits, ref, watch } from "vue";

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  hasNextPage: {
    type: Boolean,
    required: false,
    default: true,
  },
  perPage: {
    type: [Number, String],
    required: false,
    default: 15,
  },
});

const emit = defineEmits(["page-changed", "update:perPage"]);

const localPerPage = ref(String(props.perPage));

watch(localPerPage, (newValue) => {
  emit("update:perPage", Number(newValue));
});

const isPrevDisabled = computed(() => props.currentPage <= 1);
const isNextDisabled = computed(() => !props.hasNextPage);

const goToPrevious = () => {
  if (!isPrevDisabled.value) {
    emit("page-changed", props.currentPage - 1);
  }
};

const goToNext = () => {
  if (!isNextDisabled.value) {
    emit("page-changed", props.currentPage + 1);
  }
};
</script>

<template>
  <div class="flex items-center justify-between gap-4 w-full max-sm:flex-col max-sm:items-start">
    <Pagination>
      <PaginationList class="flex items-center gap-2">
        <PaginationPrev
          as-child
          :disabled="isPrevDisabled"
          @click="goToPrevious"
        >
          <Button size="icon" variant="outline" :class="{ 'cursor-not-allowed': isPrevDisabled }">
            <ChevronLeft class="h-4 w-4" />
          </Button>
        </PaginationPrev>

        <span class="text-sm font-medium text-muted-foreground">
          Página {{ currentPage }}
        </span>

        <PaginationNext
          as-child
          :disabled="isNextDisabled"
          @click="goToNext"
        >
          <Button size="icon" variant="outline" :class="{ 'cursor-not-allowed': isNextDisabled }">
            <ChevronRight class="h-4 w-4" />
          </Button>
        </PaginationNext>
      </PaginationList>
    </Pagination>

    <Select v-model="localPerPage">
      <SelectTrigger class="w-fit">
        <span>{{ perPage }} por página</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="15">15 por página</SelectItem>
        <SelectItem value="30">30 por página</SelectItem>
        <SelectItem value="50">50 por página</SelectItem>
        <SelectItem value="50">100 por página</SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

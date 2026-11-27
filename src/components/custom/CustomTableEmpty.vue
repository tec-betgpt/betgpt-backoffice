<script setup lang="ts">
import { Inbox } from "lucide-vue-next";
import { TableCell, TableRow } from "@/components/ui/table";

withDefaults(
  defineProps<{
    colspan: number;
    title?: string;
    description?: string;
  }>(),
  { title: "Nenhum registro encontrado" },
);
</script>

<template>
  <TableRow class="hover:bg-transparent">
    <TableCell :colspan="colspan" class="py-12">
      <div class="flex flex-col items-center justify-center gap-2 text-center">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox class="size-5" />
        </span>
        <p class="text-sm font-medium text-foreground">{{ title }}</p>
        <p v-if="description" class="max-w-sm text-xs text-muted-foreground">{{ description }}</p>
        <slot />
      </div>
    </TableCell>
  </TableRow>
</template>

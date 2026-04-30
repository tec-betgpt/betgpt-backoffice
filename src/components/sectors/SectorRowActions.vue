<template>
  <TableCell class="text-right">
    <div class="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button size="icon" variant="ghost">
            <MoreHorizontal class="h-4 w-4" />
            <span class="sr-only">Ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem @click="editRef?.openDialog()">
            <Pencil class="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @click="destroyRef?.openDialog()"
          >
            <Trash2 class="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditDialogComponent
        ref="editRef"
        :hide-trigger="true"
        :row="row"
        :reload="reload"
      />
      <DestroyDialogComponent
        ref="destroyRef"
        triggerless
        :reload="reload"
        :destroy="destroy"
        :row="row"
      />
    </div>
  </TableCell>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell } from "@/components/ui/table";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import EditDialogComponent from "@/components/sectors/EditDialogComponent.vue";

type OpenDialogRef = { openDialog: () => void };

defineProps<{
  row: Record<string, unknown>;
  reload: () => void | Promise<void>;
  destroy: (id: number) => Promise<void>;
}>();

const editRef = ref<OpenDialogRef | null>(null);
const destroyRef = ref<OpenDialogRef | null>(null);
</script>

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
        :reload="reload"
        :row="row"
        :costs="costs"
        :sectors="sectors"
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
import EditDialogComponent from "@/components/financial/EditDialogComponent.vue";

interface FinancialRow {
  id: number;
  costCenter: string;
  cost_center_id: number;
  sectorId: number | null;
  sectorName: string;
  category_type: string;
  amount: string;
  date: string;
  description: string;
  percentage: string;
  type: string;
  createdByName: string;
}

type CostOption = {
  id: number;
  name: string;
  sector: string;
  sector_id: number | null;
};

type OpenDialogRef = { openDialog: () => void };

defineProps<{
  row: FinancialRow;
  costs: CostOption[];
  sectors: Array<{ id: number; name: string }>;
  reload: () => void | Promise<void>;
  destroy: (id: number) => Promise<void>;
}>();

const editRef = ref<OpenDialogRef | null>(null);
const destroyRef = ref<OpenDialogRef | null>(null);
</script>

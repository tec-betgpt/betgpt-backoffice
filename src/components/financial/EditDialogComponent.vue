<template>
  <Button size="icon" variant="ghost" class="dark:bg-yellow-400" @click="isDialog = true">
    <Pencil />
  </Button>

  <Dialog :open="isDialog" @update:open="isDialog = $event">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>
          Editar Registro
        </DialogTitle>
        <DialogDescription>
          Ajuste e gerencie custos, receitas e métricas financeiras.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="onSubmit()">
        <div class="grid gap-4 py-4">
          <div class="grid items-center gap-1.5">
            <Label for="cost_center_id">Centro de Custo</Label>
            <Select v-model="financialForm.cost_center_id">
              <SelectTrigger>
                <SelectValue placeholder="Selecione um centro de custo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(cost, index) in props.costs" :key="index" :value="cost.id">
                  {{ cost.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid items-center gap-1.5">
            <Label for="type">Tipo</Label>
            <Select v-model="financialForm.type">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cost">Custo</SelectItem>
                <SelectItem value="revenue">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid items-center gap-1.5">
            <Label for="category_type">Categoria</Label>
            <Select v-model="financialForm.category_type">
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixo</SelectItem>
                <SelectItem value="variable">Variável</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid items-center gap-1.5">
            <Label for="percentage">Porcentagem (%)</Label>
            <Input
              id="percentage"
              v-model="financialForm.percentage"
              type="number"
              placeholder="Opcional"
              min="0"
            />
            <p class="text-xs text-muted-foreground">
              Opcional
            </p>
          </div>

          <div class="grid items-center gap-1.5">
            <Label for="amount">Valor</Label>
            <Input
              id="amount"
              v-model="financialForm.amount"
              type="number"
              placeholder="Digite o valor"
              required
            />
          </div>

          <div class="grid items-center gap-1.5">
            <Label for="description">Descrição</Label>
            <Textarea
              id="description"
              v-model="financialForm.description"
              placeholder="Digite uma descrição"
            />
            <p class="text-xs text-muted-foreground">
              Opcional
            </p>
          </div>
          <div>
            <Label for="date">Data</Label>
            <DatePicker id="date"
                :model-value="date" @update:model-value="args => date =  args" />
          </div>
        </div>

        <SheetFooter>
          <Button type="button" variant="secondary" @click="isDialog = false">
            Cancelar
          </Button>

          <Button type="submit" :disabled="loading">
            <LucideSpinner v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? "Atualizando..." : "Atualizar" }}
          </Button>
        </SheetFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Pencil } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import FinancialTransaction from "@/services/financialTransactions";
import DatePicker from "@/components/custom/DatePicker.vue";

interface FinancialData {
  id: number;
  costCenter: string;
  cost_center_id: number;
  category_type: string;
  amount: string;
  date: string;
  description: string;
  percentage: string;
  type: string;
}

const props = defineProps<{
  reload: () => void,
  row: FinancialData,
  costs: Array<{
    id: number,
    name: string,
    sector: string,
  }>
}>();

const activeGroupProjectId = useWorkspaceStore().activeGroupProject?.id ?? null;
const financialForm = ref<FinancialData>(props.row);
const showModal = ref(false);
const isDialog = ref(false);
const loading = ref(false);
const date = ref(new Date());
const onSubmit = async () => {
  loading.value = true;
  financialForm.value.date = date.value.toLocaleDateString();
  try {
    await FinancialTransaction.update(financialForm.value.id, financialForm.value)
    isDialog.value = false;

    await props.reload();
  } catch (error) {
    console.error("Erro ao salvar transação financeira:", error);
  }

  loading.value = false;
}

onMounted(() => {
  financialForm.value = props.row
})
</script>

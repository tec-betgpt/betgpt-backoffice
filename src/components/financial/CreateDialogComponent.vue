<template>
  <Button class="dark:bg-yellow-400" @click="isDialog = true">
    <PlusSquareIcon />
    Novo Registro
  </Button>

  <Dialog :open="isDialog" @update:open="isDialog = $event">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>
          Novo Registro
        </DialogTitle>
        <DialogDescription>
          Adicione e gerencie custos, receitas e métricas financeiras.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="onSubmit()">
        <div class="grid gap-4 py-2">
          <div>
            <Select v-model="financialForm.cost_center_id" required>
              <SelectTrigger class="col-span-3">
                <SelectValue placeholder="Centro de Custo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="cost in props.costs" :key="cost.id" :value="cost.id">
                  {{ cost.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs mt-1 text-right text-muted-foreground">
              Obrigatório
            </p>
          </div>

          <div>
            <Select v-model="financialForm.type" required>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cost">Custo</SelectItem>
                <SelectItem value="revenue">Receita</SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs mt-1 text-right text-muted-foreground">
              Obrigatório
            </p>
          </div>

          <div>
            <Select v-model="financialForm.category_type" required>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixo</SelectItem>
                <SelectItem value="variable">Variável</SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs mt-1 text-right text-muted-foreground">
              Obrigatório
            </p>
          </div>

          <div>
            <Select v-model="financialForm.related">
              <SelectTrigger>
                <SelectValue placeholder="Adicionar à" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deposits">Entradas</SelectItem>
                <SelectItem value="withdraws">Saídas</SelectItem>
                <SelectItem value="none">Nenhum</SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs mt-1 text-right text-muted-foreground">
              Vincule a entradas ou saídas, opcional.
            </p>
          </div>

          <div>
            <Input
              placeholder="Porcentagem (%)"
              id="percentage"
              v-model="financialForm.percentage"
              type="number"
              min="0"
            />
            <p class="text-xs mt-1 text-right text-muted-foreground">
              Opcional
            </p>
          </div>

          <div>
            <Input
              placeholder="Valor"
              id="amount"
              v-model="financialForm.amount"
              type="number"
              required
            />
            <p class="text-xs mt-1 text-right text-muted-foreground">
              Ex.: 1000
            </p>
          </div>

          <div>
            <Textarea
              placeholder="Descrição"
              id="description"
              v-model="financialForm.description"
            />
            <p class="text-xs mt-1 text-right text-muted-foreground">
              Opcional
            </p>
          </div>
        </div>
        <div>
          <DatePicker id="date"
                      :model-value="date" @update:model-value="args => date =  args" />
          <p class="text-xs mt-1 text-right text-muted-foreground">
            Obrigatório
          </p>
        </div>

        <SheetFooter class="mt-4">
          <Button type="button" variant="secondary" @click="isDialog = false">
            Cancelar
          </Button>

          <Button type="submit" :disabled="loading">
            <LucideSpinner v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? "Salvando..." : "Salvar" }}
          </Button>
        </SheetFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {Ref, ref, watch} from "vue";
import { PlusSquareIcon } from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import FinancialTransaction from "@/services/financialTransactions";
import {Calendar} from "@/components/ui/calendar";
import {CalendarDate, DateValue, fromDate, getLocalTimeZone} from '@internationalized/date'
import DatePicker from "@/components/custom/DatePicker.vue";
import {Dialog} from "@/components/ui/dialog";
const props = defineProps<{
  reload: () => void,
  costs: Array<{
    id: number,
    name: string,
    sector: string,
  }>
}>();
// data
const activeGroupProjectId = useWorkspaceStore().activeGroupProject?.id ?? null;
const costs = ref([]);
const isDialog = ref(false);
const loading = ref(false);
const financialForm = ref({
  cost_center_id: null,
  type: "",
  category_type: "",
  percentage: null,
  amount: null,
  date: "",
  description: "",
  related: null,
});
const date = ref<Date>(new Date());

// methods
const onSubmit = async () => {
  loading.value = true;
  financialForm.value.date = date.value.toLocaleDateString();
  try {
    await FinancialTransaction.store({
      ...financialForm.value,
      project_id: activeGroupProjectId,
    })

    isDialog.value = false;
    reset()
    await props.reload();
  } catch (error) {
    console.error("Erro ao salvar transação financeira:", error);
  }

  loading.value = false;
}

const reset = () => {
  financialForm.value = {
    cost_center_id: null,
    type: "",
    category_type: "",
    percentage: null,
    amount: null,
    date: "",
    description: "",
    related: null,
  };
}
</script>

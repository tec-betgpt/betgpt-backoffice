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
              <SelectTrigger id="cost_center_id">
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
            <Label for="sector_id">Setor</Label>
            <div class="flex flex-col gap-2">
              <Select v-model="sectorId">
                <SelectTrigger id="sector_id">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="s in props.sectors" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" class="self-end" @click="sectorId = null">
                Limpar setor
              </Button>
              <p class="text-xs text-muted-foreground">
                Opcional.
              </p>
            </div>
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
import { ref, watch } from "vue";
import { Pencil } from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import financialTransactionsApi from "@/services/financialTransactions";
import DatePicker from "@/components/custom/DatePicker.vue";
import { toast } from "@/components/ui/toast";

interface FinancialData {
  id: number;
  costCenter: string;
  cost_center_id: number | null;
  sectorId: number | null;
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
    sector_id: number | null,
  }>,
  sectors: Array<{ id: number; name: string }>,
}>();

const financialForm = ref<FinancialData>({ ...props.row });
const isDialog = ref(false);
const loading = ref(false);
const date = ref(new Date());
const sectorId = ref<number | null>(props.row.sectorId ?? null);

const formatDateForApi = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

watch(
  () => financialForm.value.cost_center_id,
  (id) => {
    if (id == null) {
      return;
    }
    const cost = props.costs.find((c) => c.id === id);
    if (cost) {
      sectorId.value = cost.sector_id ?? null;
    }
  }
);

watch(sectorId, (sid) => {
  const ccid = financialForm.value.cost_center_id;
  if (ccid == null || sid == null) {
    return;
  }
  const cost = props.costs.find((c) => c.id === ccid);
  if (cost && cost.sector_id !== sid) {
    financialForm.value.cost_center_id = null;
  }
});

const onSubmit = async () => {
  loading.value = true;
  financialForm.value.date = formatDateForApi(date.value);
  const cost = props.costs.find((c) => c.id === financialForm.value.cost_center_id);
  if (!cost) {
    loading.value = false;
    toast({
      title: "Centro de custo obrigatório",
      description: "Selecione um centro de custo.",
      variant: "destructive",
    });
    return;
  }
  if (sectorId.value != null) {
    if (cost.sector_id == null || cost.sector_id !== sectorId.value) {
      loading.value = false;
      toast({
        title: "Setor incompatível",
        description:
          cost.sector_id == null
            ? "Este centro de custo não possui setor; deixe o setor em branco."
            : "O setor selecionado não corresponde ao centro de custo.",
        variant: "destructive",
      });
      return;
    }
  }
  try {
    await financialTransactionsApi.update(financialForm.value.id, {
      cost_center_id: financialForm.value.cost_center_id,
      sector_id: sectorId.value,
      type: financialForm.value.type,
      category_type: financialForm.value.category_type,
      percentage: financialForm.value.percentage,
      amount: financialForm.value.amount,
      date: financialForm.value.date,
      description: financialForm.value.description,
    });
    isDialog.value = false;

    await props.reload();
  } catch (error) {
    console.error("Erro ao salvar transação financeira:", error);
  }

  loading.value = false;
};

watch(isDialog, (open) => {
  if (!open) {
    return;
  }
  financialForm.value = { ...props.row };
  sectorId.value = props.row.sectorId ?? null;
  date.value = props.row.date ? new Date(props.row.date) : new Date();
});
</script>

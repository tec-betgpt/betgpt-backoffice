<template>
  <Button size="icon" variant="ghost" @click="openDialog">
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
            <Label for="edit_project_scope">Projeto</Label>
            <ProjectScopeSelect v-model="selectedScope" />
          </div>

          <div class="grid items-center gap-1.5">
            <Label for="cost_center_id">Centro de Custo</Label>

            <div class="flex flex-row gap-2">
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

              <Button type="button" variant="ghost" @click="financialForm.cost_center_id = null">
                Limpar
              </Button>
            </div>
            <p v-if="errorFor('cost_center_id')" class="text-sm text-destructive mt-1">
              {{ errorFor('cost_center_id') }}
            </p>
          </div>

          <div class="grid items-center gap-1.5">
            <Label for="sector_id">Setor</Label>
            <div class="flex flex-row gap-2">
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
              <Button type="button" variant="ghost" @click="sectorId = null">
                Limpar
              </Button>
            </div>
            <p v-if="errorFor('sector_id')" class="text-sm text-destructive mt-1">
              {{ errorFor('sector_id') }}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">

            <div>
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
              <p v-if="errorFor('type')" class="text-sm text-destructive mt-1">
                {{ errorFor('type') }}
              </p>
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
              <p v-if="errorFor('category_type')" class="text-sm text-destructive mt-1">
                {{ errorFor('category_type') }}
              </p>
            </div>

            <div>
              <Label for="percentage">Porcentagem (%)</Label>
              <Input
                id="percentage"
                v-model="financialForm.percentage"
                type="number"
                placeholder="Opcional"
                min="0"
              />
              <p v-if="errorFor('percentage')" class="text-sm text-destructive mt-1">
                {{ errorFor('percentage') }}
              </p>
            </div>

            <div class="grid items-center gap-1.5">
              <Label for="amount">Valor</Label>
              <Input
                id="amount"
                v-model="displayAmount"
                type="text"
                placeholder="Digite o valor"
                required
              />
              <p v-if="errorFor('amount')" class="text-sm text-destructive mt-1">
                {{ errorFor('amount') }}
              </p>
            </div>
          </div>

          <div class="grid items-center gap-1.5">
            <Label for="description">Descrição</Label>
            <Textarea
              id="description"
              v-model="financialForm.description"
              placeholder="Digite uma descrição"
            />
            <p v-if="errorFor('description')" class="text-sm text-destructive mt-1">
              {{ errorFor('description') }}
            </p>
            <p class="text-xs text-muted-foreground">
              Opcional
            </p>
          </div>
          <div>
            <Label for="date">Data</Label>
            <DatePicker id="date"
                :model-value="date" @update:model-value="args => date =  args" />
            <p v-if="errorFor('date')" class="text-sm text-destructive mt-1">
              {{ errorFor('date') }}
            </p>
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
import { ref, watch, computed } from "vue";
import { Pencil } from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { Dialog } from "@/components/ui/dialog";
import DatePicker from "@/components/custom/DatePicker.vue";
import ProjectScopeSelect from "@/components/financial/ProjectScopeSelect.vue";
import FinancialTransactions from "@/services/financialTransactions";
import { useWorkspaceStore } from "@/stores/workspace";
import { useFormErrors } from "@/composables/useFormErrors";

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
  project_id?: number | null;
}

const props = withDefaults(
  defineProps<{
    reload: () => void;
    row: FinancialData;
    costs: Array<{
      id: number;
      name: string;
      sector: string;
      sector_id: number | null;
    }>;
    sectors: Array<{ id: number; name: string }>;
    hideTrigger?: boolean;
  }>(),
  { hideTrigger: false },
);

const financialForm = ref<FinancialData>({ ...props.row });
const isDialog = ref(false);
const loading = ref(false);
const date = ref(new Date());
const sectorId = ref<number | null>(props.row.sectorId ?? null);
const selectedScope = ref("group");
const { handleError, clearErrors, errorFor } = useFormErrors();

const workspaceStore = useWorkspaceStore();
const isGroupWorkspace = computed(() => workspaceStore.activeGroupProject?.type === "group");

const displayAmount = computed({
  get() {
    if (!financialForm.value.amount) return "";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(financialForm.value.amount));
  },
  set(val: string) {
    const numericValue = val.replace(/\D/g, "");
    if (!numericValue) {
      financialForm.value.amount = "";
      return;
    }
    financialForm.value.amount = (Number(numericValue) / 100).toFixed(2);
  }
});

const formatDateForApi = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const openDialog = () => {
  isDialog.value = true;
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


const onSubmit = async () => {
  loading.value = true;
  clearErrors();
  financialForm.value.date = formatDateForApi(date.value);
  const cost = props.costs.find((c) => c.id === financialForm.value.cost_center_id);

  const payload: Record<string, unknown> = {
    cost_center_id: financialForm.value.cost_center_id,
    sector_id: sectorId.value,
    type: financialForm.value.type,
    category_type: financialForm.value.category_type,
    percentage: financialForm.value.percentage,
    amount: financialForm.value.amount,
    date: financialForm.value.date,
    description: financialForm.value.description,
  };

  // O update aceita apenas project_id (nunca group_id): projeto selecionado envia o id,
  // "Grupo (sem projeto)" omite o campo e mantém o escopo atual.
  if (isGroupWorkspace.value && selectedScope.value !== "group") {
    payload.project_id = Number(selectedScope.value);
  }

  try {
    await FinancialTransactions.update(financialForm.value.id, payload);

    isDialog.value = false;
    toast("Custo Atualizado!", { description: "Registro atualizado com sucesso" });

    await props.reload();
  } catch (error: any) {
    // 422: erros de campo exibidos inline; o interceptor global já faz o toast.
    if (!handleError(error)) {
      if (error?.response?.status === 403) {
        toast.error("Sem permissão", { description: "Você não tem permissão para mover o registro para este projeto." });
      } else {
        console.error("Erro ao salvar transação financeira:", error);
        toast.error("Erro ao atualizar", {
          description: error?.response?.data?.message ?? "Não foi possível atualizar o registro.",
        });
      }
    }
  }

  loading.value = false;
};

watch(isDialog, (open) => {
  if (!open) {
    return;
  }
  clearErrors();
  financialForm.value = { ...props.row };
  sectorId.value = props.row.sectorId ?? null;
  selectedScope.value = props.row.project_id != null ? String(props.row.project_id) : "group";
  date.value = props.row.date ? new Date(props.row.date) : new Date();
});

defineExpose({ openDialog });
</script>

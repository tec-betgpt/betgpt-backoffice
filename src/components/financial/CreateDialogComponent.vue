<template>
  <Button class="dark:bg-yellow-400" @click="openDialog()">
    Novo Registro
  </Button>

  <Dialog :open="isDialog" @update:open="isDialog = $event">
    <DialogContent class="sm:max-w-[450px]">
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
          <div class="grid items-center gap-1.5">
            <Label for="project_scope">Projeto</Label>
            <ProjectScopeSelect v-model="selectedScope" />
            <p class="text-xs mt-1 text-right text-muted-foreground">
              Obrigatório
            </p>
          </div>

          <div class="gap-1.5">
            <Label for="cost_center_id">Centro de Custo</Label>
            <div class="flex flex-row gap-2">
              <Select v-model="financialForm.cost_center_id">
                <SelectTrigger id="cost_center_id" class="col-span-3">
                  <SelectValue placeholder="Centro de Custo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="cost in props.costs" :key="cost.id" :value="cost.id">
                    {{ cost.name }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button type="button" variant="ghost" @click="financialForm.cost_center_id = null">
                Limpar
              </Button>
            </div>
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
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
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

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                v-model="displayAmount"
                type="text"
                required
              />
              <p class="text-xs mt-1 text-right text-muted-foreground">
                Ex.: 1000
              </p>
            </div>
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
import { ref, watch, computed } from "vue";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import financialTransactionsApi from "@/services/financialTransactions";
import DatePicker from "@/components/custom/DatePicker.vue";
import ProjectScopeSelect from "@/components/financial/ProjectScopeSelect.vue";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "vue-sonner";

const props = defineProps<{
  reload: () => void,
  costs: Array<{
    id: number,
    name: string,
    sector: string,
    sector_id: number | null,
  }>,
  sectors: Array<{ id: number; name: string }>,
}>();

const workspaceStore = useWorkspaceStore();
const activeGroupProject = computed(() => workspaceStore.activeGroupProject);
const isGroupWorkspace = computed(() => activeGroupProject.value?.type === "group");
const isDialog = ref(false);
const loading = ref(false);
const sectorId = ref<number | null>(null);
const selectedScope = ref("group");
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

const displayAmount = computed({
  get() {
    if (financialForm.value.amount === null || financialForm.value.amount === "") return "";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(financialForm.value.amount));
  },
  set(val: string) {
    const numericValue = val.replace(/\D/g, "");
    if (!numericValue) {
      financialForm.value.amount = null as any;
      return;
    }
    financialForm.value.amount = (Number(numericValue) / 100).toFixed(2) as any;
  }
});

const formatDateForApi = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const openDialog = () => {
  selectedScope.value = "group";
  isDialog.value = true;
}

const scopePayload = (): { project_id: number } | { group_id: number } => {
  if (!isGroupWorkspace.value) {
    return { project_id: Number(activeGroupProject.value?.project_id) };
  }

  if (selectedScope.value === "group") {
    const groupNumericId = Number(String(activeGroupProject.value?.id ?? "").split("_")[1] ?? 0);
    return { group_id: groupNumericId };
  }

  return { project_id: Number(selectedScope.value) };
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


watch(isDialog, (open) => {
  if (!open) {
    reset();
  }
});

const onSubmit = async () => {
  loading.value = true;
  financialForm.value.date = formatDateForApi(date.value);
  const cost = props.costs.find((c) => c.id === financialForm.value.cost_center_id);

  try {
    await financialTransactionsApi.store({
      ...financialForm.value,
      ...scopePayload(),
      ...(sectorId.value != null ? { sector_id: sectorId.value } : {}),
    });

    isDialog.value = false;
    toast("Novo Custo Adicionado!", { description: "Registro salvo com sucesso" });

    await props.reload();
  } catch (error: any) {
    console.error("Erro ao salvar transação financeira:", error);
    if (error?.response?.status === 403) {
      toast.error("Sem permissão", { description: "Você não tem permissão para lançar neste projeto." });
    } else {
      toast.error("Erro ao salvar", {
        description: error?.response?.data?.message ?? "Não foi possível salvar o registro.",
      });
    }
  }

  loading.value = false;
}

const reset = () => {
  sectorId.value = null;
  selectedScope.value = "group";
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

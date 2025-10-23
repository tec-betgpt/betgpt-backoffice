<template>
  <Button @click="openDialog" class="bg-yellow-300" :disabled="isLoadingSectors">
    <Spinner v-if="isLoadingSectors" class="mr-2 h-4 w-4 animate-spin" />
    <Plus v-else />
    Novo Custo
  </Button>

  <Dialog v-model:open="isDialog">
    <DialogContent position="right" size="lg">
      <DialogHeader>
        <DialogTitle>Novo Custo</DialogTitle>
        <DialogDescription>
          Crie um novo centro de custos
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit">
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name">Categoria</Label>
            <div class="col-span-3">
              <Select v-model="costForm.name">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Marketing e Vendas">Marketing e Vendas</SelectItem>
                  <SelectItem value="Pessoal">Pessoal</SelectItem>
                  <SelectItem value="Administrativas">Administrativas</SelectItem>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              <Input
                v-if="costForm.name === 'Outros'"
                v-model="costForm.otherName"
                placeholder="Digite o nome"
                class="mt-2"
              />
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="sector_id">Setor</Label>
            <Select v-model="costForm.sector_id">
              <SelectTrigger class="col-span-3">
                <SelectValue placeholder="Selecione um setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="sector in sectors" :key="sector.id" :value="sector.id">
                  {{ sector.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" :disabled="loadingSub">
            {{ loadingSub ? "Salvando..." : "Salvar" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Plus } from "lucide-vue-next";
import { useToast} from "@/components/ui/toast";
import { useWorkspaceStore } from "@/stores/workspace";
import { Spinner } from "@/components/ui/spinner";
import CostCenter from "@/services/costCenters";
import Sector from "@/services/sector";

const props = defineProps<{ reload: () => Promise<void> }>();
const { toast } = useToast();

const sectors = ref<{ id: number; name: string; }[]>([]);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const isLoadingSectors = ref(false);
const isDialog = ref(false);
const isEditing = ref(false);
const form = ref({ type: "" });
const costForm = ref<{
  name: string;
  sector_id: number | null;
  user_id: number | null;
  otherName?: string;
  type: string;
}>();
const loadingSub = ref(false);

const onSubmit = async () => {
  try {
    await CostCenter.store(costForm.value)
    await props.reload();
    isDialog.value = false;
    toast({
      title: "Sucesso",
      description: "Centro de custo salvo com sucesso.",
    });
  } catch (error) {
    toast({
      title: "Ops!",
      description: error.response.data.message,
      duration: 3000,
      variant: "destructive",
    });
  }

  loadingSub.value = false;
}

const openDialog = async () => {
  await fetchSectors();
  form.value.type = "custo";
  isEditing.value = false;
  costForm.value = { name: "", user_id: null };
  isDialog.value = true;
};

const fetchSectors = async () => {
  isLoadingSectors.value = true;

  try {
    const { data } = await Sector.index({ filter_id: activeGroupProjectId })

    sectors.value = data.data.map((sector: any) => ({
      id: sector.id,
      name: sector.name,
    }));
  } catch (error) {
    console.error("Erro ao buscar setores:", error);
  }

  isLoadingSectors.value = false;
}
</script>

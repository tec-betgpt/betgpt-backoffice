<template>
  <Button variant="ghost" size="icon" @click="openDialog()">
    <Spinner v-if="isLoading" class="mr-2 h-4 w-4" />
    <PenLine v-else />
  </Button>

  <Dialog v-model:open="isDialog">
    <DialogContent size="lg">
      <DialogHeader>
        <DialogTitle>Editar</DialogTitle>
        <DialogDescription>
          Edite as informações do centro de custo
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
            {{ loadingSub ? "Atualizar..." : "Atualizar" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { PenLine } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast";
import { useWorkspaceStore } from "@/stores/workspace";
import CostCenter from '@/services/costCenters'
import Sector from "@/services/sector"
import i18n from "@/i18n";
import {Spinner} from "@/components/ui/spinner";

const { toast } = useToast();

const props = defineProps<{ reload: () => Promise<void>, row: any }>();
const sectors = ref([]);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const loadingSectors = ref(true);
const isDialog = ref(false);
const isLoading = ref(false);
const costForm = ref({});
const loadingSub = ref(false);

const onSubmit = async () => {
  loadingSub.value = true;

  try {
    await CostCenter.update(props.row.id, costForm.value)
    await props.reload();
    isDialog.value = false;
    toast({
      title: i18n.global.t("success"),
      description: "Centro de custo atualizado com sucesso.",
      duration: 3000,
    });
  } catch (error) {
    console.error("Erro ao salvar centro de custo:", error);
  }

  loadingSub.value = false;
};

const openDialog = async () => {
  isLoading.value = true;
  await fetchSectors();
  costForm.value = {
    type: "custo",
    name: "",
    user_id: null,
    ...props.row,
  };
  console.log(props.row)
  isDialog.value = true;
  isLoading.value = false;
};

const fetchSectors = async () => {
  loadingSectors.value = true;

  try {
    const { data } = await Sector.index({ filter_id: activeGroupProjectId })

    sectors.value = data.data.map((sector: any) => ({
      id: sector.id,
      name: sector.name,
    }));
  } catch (error) {
    console.error("Erro ao buscar setores:", error);
  }

  loadingSectors.value = false;
}
</script>

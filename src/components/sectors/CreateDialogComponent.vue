<template>
  <Button @click="openDialog" class="bg-yellow-300">
    <Plus /> Novo Setor
  </Button>

  <Dialog v-model:open="dialog">
    <DialogContent position="right" size="lg">
      <DialogHeader>
        <DialogTitle>Novo Setor</DialogTitle>
        <DialogDescription>Crie um novo setor</DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit">
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name">Nome</Label>
            <Input
              id="name"
              v-model="form.name"
              placeholder="Digite o nome"
              class="col-span-3"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" :disabled="isLoading">
            {{ isLoading ? "Salvando..." : "Salvar" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "@/components/ui/toast";
import { useWorkspaceStore } from "@/stores/workspace";
import Sector from "@/services/sector"
import { Plus } from "lucide-vue-next";

const { toast } = useToast();
const props = defineProps<{ reload: () => void }>();
const dialog = ref(false);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const isLoading = ref(false);
const form = ref({
  name: "",
  type: "setor",
  project_id: activeGroupProjectId,
  user_id: null,
});

const onSubmit = async () => {
  isLoading.value = true;

  try {
    await Sector.store({
      ...form.value,
      project_id: activeGroupProjectId.split('_')[1],
    })

    dialog.value = false;
    props.reload();

    toast({
      title: "Sucesso",
      description: "Setor criado com sucesso.",
      duration: 3000,
    });
  } catch (error) {
    console.error("Erro ao salvar setor:", error);
  }

  isLoading.value = false;
}

const openDialog = () => {
  dialog.value = true;
}
</script>

<template>
  <Button @click="openDialog" class="bg-yellow-300">
    <Plus /> Novo Setor
  </Button>

  <Dialog v-model:open="dialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo Setor</DialogTitle>
        <DialogDescription>Crie um novo setor</DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit">
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name">Nome</Label>
            <div class="col-span-3">
              <Input
                id="name"
                v-model="form.name"
                placeholder="Digite o nome"
                required
              />
              <p v-if="errorFor('name')" class="text-sm text-destructive mt-1">
                {{ errorFor('name') }}
              </p>
            </div>
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
import { toast } from "vue-sonner";
import { useWorkspaceStore } from "@/stores/workspace";
import { useFormErrors } from "@/composables/useFormErrors";
import Sector from "@/services/sector"
import { Plus } from "lucide-vue-next";

const props = defineProps<{ reload: () => void }>();
const dialog = ref(false);
const workspaceStore = useWorkspaceStore();
const isLoading = ref(false);
const { handleError, clearErrors, errorFor } = useFormErrors();
const form = ref({
  name: "",
  type: "setor",
  project_id: workspaceStore.numericProjectId,
  user_id: null,
});

const onSubmit = async () => {
  const projectId = workspaceStore.numericProjectId;
  if (!projectId) {
    toast.error("Projeto não selecionado", {
      description: "Selecione um projeto específico no workspace para criar um setor.",
      duration: 3000,
    });
    return;
  }

  isLoading.value = true;
  clearErrors();

  try {
    await Sector.store({
      ...form.value,
      project_id: projectId,
    })

    dialog.value = false;
    props.reload();

    toast("Sucesso", { description: "Setor criado com sucesso.", duration: 3000 });
  } catch (error) {
    // 422: erros de campo exibidos inline; o interceptor global já faz o toast.
    if (!handleError(error)) {
      console.error("Erro ao salvar setor:", error);
    }
  }

  isLoading.value = false;
}

const openDialog = () => {
  dialog.value = true;
}
</script>

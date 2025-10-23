<template>
  <Button variant="ghost" size="icon" @click="openDialog()">
    <PenLine />
  </Button>

  <Dialog v-model:open="dialog">
    <DialogContent position="right" size="lg">
      <DialogHeader>
        <DialogTitle>
          Editar Setor
        </DialogTitle>
        <DialogDescription>
          Atualize as informações do setor
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="submitSector">
        <div class="gap-4 py-4">
          <div class="flex-1">
            <Label for="name">Nome</Label>
            <Input
              id="name"
              v-model="form.name"
              placeholder="Digite o nome"
              class="mt-2"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" :disabled="isLoading">
            {{ isLoading ? "Atualizando..." : "Atualizar" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "@/components/ui/toast";
import { PenLine, X } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import Sector from "@/services/sector"
import i18n from "@/i18n";

const props = defineProps<{ reload: () => void, row: any }>();
const { toast } = useToast();
const dialog = ref(false);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const isLoading = ref(false);
const form = ref<any>({
  name: "",
  type: "setor",
  project_id: activeGroupProjectId,
  user_id: null,
});

const openDialog = () => {
  form.value = { ...props.row };
  dialog.value = true;
}

const submitSector = async () => {
  isLoading.value = true;

  try {
    await Sector.update(props.row.id, form.value)
    dialog.value = false;
    toast({
      title: i18n.global.t("success"),
      description: "Setor atualizado com sucesso.",
      duration: 3000,
    });
  } catch (error) {
    toast({
      title: i18n.global.t("error"),
      description: i18n.global.t(error.response.data.message),
      duration: 3000,
      variant: "destructive",
    });
  }

  props.reload();
  isLoading.value = false;
}
</script>

<template>
  <Button v-if="!hideTrigger" variant="ghost" size="icon" @click="openDialog()">
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
            <p v-if="errorFor('name')" class="text-sm text-destructive mt-1">
              {{ errorFor('name') }}
            </p>
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
import { toast } from "vue-sonner";
import { PenLine, X } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import { useFormErrors } from "@/composables/useFormErrors";
import Sector from "@/services/sector"
import i18n from "@/i18n";

const props = withDefaults(
  defineProps<{ reload: () => void; row: any; hideTrigger?: boolean }>(),
  { hideTrigger: false },
);
const dialog = ref(false);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const isLoading = ref(false);
const { handleError, clearErrors, errorFor } = useFormErrors();
const form = ref<any>({
  name: "",
  type: "setor",
  project_id: activeGroupProjectId,
  user_id: null,
});

const openDialog = () => {
  form.value = { ...props.row };
  clearErrors();
  dialog.value = true;
}

const submitSector = async () => {
  isLoading.value = true;
  clearErrors();

  try {
    await Sector.update(props.row.id, form.value)
    dialog.value = false;
    toast(i18n.global.t("success"), { description: "Setor atualizado com sucesso.", duration: 3000 });
  } catch (error: any) {
    // 422: erros de campo exibidos inline; o interceptor global já faz o toast.
    if (!handleError(error)) {
      toast.error(i18n.global.t("error"), { description: i18n.global.t(error?.response?.data?.message || "error_ocurried"), duration: 3000 });
    }
  }

  props.reload();
  isLoading.value = false;
}

defineExpose({ openDialog });
</script>

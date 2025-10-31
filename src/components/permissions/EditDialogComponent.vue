<template>
  <Button variant="ghost" size="icon" @click="openDialog()":disabled="isLoading.dialog">
    <Spinner v-if="isLoading.dialog" class="h-4 w-4 animate-spin" />
    <PenLine v-else />
  </Button>

  <Dialog v-model:open="dialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Editar Permissão
        </DialogTitle>
        <DialogDescription>
          Atualize as informações da permissão, certifique-se de usar apenas o guarda 'web'.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit">
        <div class="gap-4 py-4">
          <div class="py-1">
            <Label for="name">Nome</Label>
            <Input id="name" v-model="form.name" placeholder="Digite o nome" required />
          </div>

          <div class="py-1">
            <Label for="name">Guarda</Label>
            <Input id="name" v-model="form.guard_name" placeholder="Ex.: web" required />
            <p class="text-xs mt-1 text-muted-foreground">Há apenas o guarda 'web' ativo</p>
          </div>

          <div class="py-1">
            <Label for="name">Escopo/Acesso</Label>
            <Input id="name" v-model="form.scope_access" />
          </div>

          <div class="py-1">
            <Label for="name">Escopo/Ordem</Label>
            <Input id="name" v-model="form.scope_order" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" :disabled="isLoading.submit">
            {{ isLoading.submit ? "Atualizando..." : "Atualizar" }}
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
import Permissions from "@/services/permissions"
import {Spinner} from "@/components/ui/spinner";

const props = defineProps<{ reload: () => void, row: any }>();
const { toast } = useToast();
const dialog = ref(false);
const isLoading = ref({
  dialog: false,
  submit: false
});
const form = ref<any>({
  name: "",
  guard_name: "web",
  scope_access: "",
  scope_order: ""
});

const openDialog = async () => {
  isLoading.value.dialog = true
  await show()
  isLoading.value.dialog = false

  dialog.value = true;
}

const onSubmit = async () => {
  isLoading.value.submit = true;

  try {
    await Permissions.update(props.row.id, form.value)
    dialog.value = false;
    props.reload();
    toast({
      title: "Sucesso",
      description: "Permissão atualizada com sucesso.",
      duration: 3000,
    });
  } catch (error) {
    toast({
      title: "Ops!",
      description: error.response.data.message,
      variant: "destructive",
    });
  }

  isLoading.value.submit = false;
}

const show = async () => {
  try {
    form.value = await Permissions.show(props.row.id)
  } catch (e) {
    toast({
      title: "Error",
      description: "Permissão não encontrada",
      duration: 3000,
      variant: "destructive",
    });
  }
}
</script>

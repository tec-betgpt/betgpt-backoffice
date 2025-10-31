<template>
  <Button @click="openDialog" class="bg-yellow-300 text-black hover:text-white dark:hover:text-black">
    <Plus /> Nova Permissão
  </Button>

  <Dialog v-model:open="dialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova Permissão</DialogTitle>
        <DialogDescription>
          Este controle de permissão permite ajustes granular de acesso, onde é possível definir exatamente o que cada usuário pode fazer no sistema através de uma estrutura hierárquica e flexível.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit">
        <div class="grid gap-4 py-4">
          <div class="py-1">
            <Label for="name">Nome</Label>
            <Input id="name" v-model="form.name" placeholder="Digite o nome" required />
          </div>

          <div class="py-1">
            <Label for="name">Guarda</Label>
            <Input id="name" disabled v-model="form.guard_name" placeholder="Ex.: web" required />
            <p class="text-xs mt-1 text-muted-foreground">Há apenas o guarda 'web' ativo.</p>
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
import { Plus } from "lucide-vue-next";
import Permissions from "@/services/permissions"

const { toast } = useToast();

const props = defineProps<{ reload: () => void }>();
const dialog = ref(false);
const isLoading = ref(false);
const form = ref({
  name: "",
  guard_name: "web",
  scope_access: "",
  scope_order: ""
});

const onSubmit = async () => {
  isLoading.value = true;

  try {
    await Permissions.store(form.value)

    dialog.value = false;
    props.reload();

    toast({
      title: "Sucesso",
      description: "Permissão salvo com sucesso.",
      duration: 3000,
    });
  } catch (error) {
    console.error(error)
    toast({
      title: "Erro",
      description: error.response.data.message,
      variant: "destructive",
    });
  }

  isLoading.value = false;
}

const openDialog = () => {
  form.value = {
    name: "",
    guard_name: "web",
    scope_access: "",
    scope_order: ""
  }
  dialog.value = true;
}
</script>

<template>
  <Button @click="openDialog()" size="icon" variant="ghost" :disabled="isLoading.show">
    <Spinner v-if="isLoading.show" class="h-4 w-4 animate-spin" />
    <PencilLine v-else />
  </Button>

  <Dialog v-model:open="isDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar Cliente</DialogTitle>
        <DialogDescription>
          Modifique os dados básicos desse cliente
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit">
        <div class="grid gap-4 py-4">
          <div class="gap-4">
            <Label for="name">Nome</Label>
            <Input v-model="form.name" class="mt-2" />
          </div>

          <div class="gap-4">
            <Label for="name">E-mail</Label>
            <Input v-model="form.email" class="mt-2" />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" :disabled="isLoading.onSubmit">
            {{ isLoading.onSubmit ? "Atualizando..." : "Atualizar" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { PencilLine } from "lucide-vue-next";
import { useToast} from "@/components/ui/toast";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import Players from "@/services/players";

const props = defineProps<{
  row: any,
  filterId: any,
  reload: () => Promise<void>
}>();
const { toast } = useToast();

const isLoading = ref({
  onSubmit: false,
  show: false
});
const isDialog = ref(false);
const form = ref({
  name: '',
  email: '',
});

const onSubmit = async () => {
  isLoading.value.onSubmit = true

  try {
    await Players.update(props.row.id, form.value, { filter_id: props.filterId })
    await props.reload();
    isDialog.value = false;

    toast({
      title: "Sucesso",
      description: "Cliente atualizado com sucesso.",
    });
  } catch (error: any) {
    toast({
      title: "Ops!",
      description: error.response.data.message,
      duration: 3000,
      variant: "destructive",
    });
  }

  isLoading.value.onSubmit = false;
}

const show = async () => {
  isLoading.value.show = true

  try {
    form.value = await Players.show(props.row.id, {
      filter_id: props.filterId
    })
  } catch (e) {
    console.error(e)
  }

  isLoading.value.show = false
}

const openDialog = async () => {
  await show()
  isDialog.value = true;
}
</script>

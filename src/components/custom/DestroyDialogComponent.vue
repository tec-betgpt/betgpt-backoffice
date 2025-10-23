<template>
  <Button size="icon" variant="ghost" class="text-red-400 hover:text-white hover:bg-red-400" @click="isDialog = true">
    <Trash />
  </Button>

  <AlertDialog :open="isDialog" @close="isDialog = false">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle>
        <AlertDialogDescription>
          Esse procedimento não pode ser desfeito.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="isDialog = false">Cancelar</AlertDialogCancel>
        <AlertDialogAction class="bg-red-600" @click="confirm()">Continuar</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
<script setup lang="ts">
import { Trash } from "lucide-vue-next";
import {ref} from "vue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const props = defineProps<{
  /**
   * Após exclusão, a tabela/lista pode ser atualizada
   */
  reload: Function,

  /**
   * Função que será invocada para deletar o registro
   */
  destroy: Function,

  /**
   * Objeto que representa o registro a ser deletado, importante ter o id
   */
  row: Object,
}>();

const isDialog = ref(false);
const confirm = async () => {
  isDialog.value = false;
  await props.destroy(props.row.id);
  await props.reload();
}
</script>

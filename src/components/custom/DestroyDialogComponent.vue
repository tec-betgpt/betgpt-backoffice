<template>
  <AlertDialog v-model:open="isDialog">
    <AlertDialogTrigger v-if="$slots.default" as-child>
      <slot :open="openDialog">
        <Button size="icon" variant="ghost" class="text-red-400 hover:text-white hover:bg-red-400">
          <Trash />
        </Button>
      </slot>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle>
        <AlertDialogDescription>
          Esse procedimento não pode ser desfeito.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction class="bg-red-600" @click="confirm()">Continuar</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { Trash } from "lucide-vue-next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {Button} from "@/components/ui/button";

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
  row: any,
}>();

const isDialog = ref(false);

const openDialog = () => {
  isDialog.value = true;
}

const confirm = async () => {
  await props.destroy(props.row.id);
  await props.reload();
}

defineExpose({
  openDialog
});
</script>

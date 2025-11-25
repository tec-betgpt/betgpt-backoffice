<template>
  <Button variant="outline" title="Pagar" :size="loading ? 'icon' : 'sm'" :disabled="loading" @click="open()">
    <Spinner v-if="loading" class="h-4 w-4 animate-spin" />
    <span v-else>Pagar</span>
  </Button>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import Invoices from "@/services/invoices";

const { toast } = useToast();

const props = defineProps<{ row: any, user: any }>();
const dialog = ref(false);
const loading = ref(false);

const open = () => {
  dialog.value = true;

  if (verifyAccount()) {
    getLink()
  }
};

const verifyAccount = () => {
  if (props.user && props.user.asaas_costumer === null) {
    toast({
      title: "Ops! Conta incompleta",
      description: "Atualize suas informações em seu Perfil",
    });

    return false
  }

  return true
};

const openNewWindow = (url: string) => {
  window.open(url, '_blank');
}

const getLink = async () => {
  try {
    const data = await Invoices.getLink(props.row.id)
    openNewWindow(data.external.invoiceUrl)
  } catch (e) {
    console.error(e)
    toast({
      title: "Ops! Houve um problema",
      description: "Tente novamente mais tarde",
      variant: "destructive"
    });
  }
};
</script>

<template>
  <Button variant="outline" size="sm" @click="open()">
    Ver consumo
  </Button>

  <Dialog :open="dialog" @update:open="dialog = false">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Detalhes do Consumo</DialogTitle>
        <DialogDescription>
          Detalhes do consumo para a fatura {{ invoice?.name }}.
        </DialogDescription>
      </DialogHeader>
      <div v-if="invoice" class="grid gap-4 pt-4 text-sm">
        <p><strong>Período:</strong> {{ $moment(invoice.period_started_at).format('DD/MM/YYYY') }} a {{ $moment(invoice.period_ended_at).format('DD/MM/YYYY') }}</p>
        <p><strong>Valor:</strong> {{ formatCurrency(invoice.amount) }}</p>
        <p><strong>Status:</strong> {{ invoice.status }}</p>
      </div>

      <div v-if="invoice.service_consumed" class="grid gap-4 pb-4 text-sm">
        <p><strong>ActiveCampaign®:</strong> {{ invoice.service_consumed.active_campaign }}</p>
        <p><strong>AI Tokens:</strong> {{ invoice.service_consumed.ai_token }}</p>
        <p><strong>Depósitos:</strong> {{ invoice.service_consumed.deposits }}</p>
        <p><strong>E-mails:</strong> {{ invoice.service_consumed.email }}</p>
        <p><strong>Google Analytics®:</strong> {{ invoice.service_consumed.google_analytics }}</p>
        <p><strong>Projetos:</strong> {{ invoice.service_consumed.project }}</p>
        <p><strong>SMS Funnel®:</strong> {{ invoice.service_consumed.sms_funnel }}</p>
        <p><strong>Usuários:</strong> {{ invoice.service_consumed.user }}</p>
      </div>
      <DialogFooter>
        <Button @click="dialog = false">Fechar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ref, defineProps } from "vue";
import Invoices from "@/services/invoices";

const props = defineProps<{ row: any }>()

const dialog = ref(false);
const invoice = ref();

const open = async () => {
  await show();
  dialog.value = true;
};

const show = async () => {
  try {
    invoice.value = await Invoices.show(props.row.id);
  } catch(e) {
    console.error(e);
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
</script>

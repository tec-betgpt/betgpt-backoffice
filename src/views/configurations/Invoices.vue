<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold">Faturas</h1>

    <Table v-if="isLoading">
      <TableRow v-for="i in 5" :key="i">
        <TableCell v-for="j in 5" :key="i">
          <Skeleton :key="j" class="h-4 w-full bg-gray-300 my-1" />
        </TableCell>
      </TableRow>
    </Table>

    <div v-else-if="services && services.data && services.data.length > 0">
      <div class="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Período</TableHead>
              <TableHead class="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="invoice in services.data" :key="invoice.id">
              <TableCell>{{ invoice.name }}</TableCell>
              <TableCell>{{ formatDate(invoice.period_started_at) }} - {{ formatDate(invoice.period_ended_at) }}</TableCell>
              <TableCell class="text-right">{{ formatCurrency(invoice.amount) }}</TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(invoice.status)">
                  {{ invoice.status }}
                </Badge>
              </TableCell>
              <TableCell class="flex items-center justify-end space-x-2">
                <ShowComponent :row="invoice" />
                <!-- Dpende de integração com gateway de pagamento
                <Button variant="ghost" size="icon" @click="sendInvoiceByEmail(invoice)">
                  <Mail class="w-4 h-4" />
                </Button>
                -->
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <CustomPagination
        :select-page="fetchInvoices"
        :pages="pages"
        :per_pages="perPage"
        @update:perPages="(value) => perPage = value"
      />
    </div>

    <div v-else>
      <p>Nenhuma fatura encontrada.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import Invoices from "@/services/invoices";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ShowComponent from "@/components/invoices/ShowComponent.vue";

const { toast } = useToast();

const services = ref<any>(null);
const isLoading = ref(true);
const currentPage = ref(1);
const perPage = ref(15);
const pages = ref({
  current: 1,
  last: 1,
  total: 0
});

const fetchInvoices = async (page = 1) => {
  isLoading.value = true;

  try {
    const response = await Invoices.index({
      page,
      per_page: perPage.value
    });

    services.value = response;
    currentPage.value = response.current_page;
    pages.value = {
      current: response.current_page,
      last: response.last_page,
      total: response.total,
    };
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar as faturas.",
      variant: "destructive",
    });
  }

  isLoading.value = false;
};

/**
 * @todo Requer integração com gateway de pagamento
 */
const sendInvoiceByEmail = (invoice: any) => {
  toast({
    title: "E-mail enviado",
    description: `A fatura ${invoice.name} foi enviada por e-mail.`,
  });
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'default';
    case 'PAID':
      return 'success';
    case 'OVERDUE':
      return 'destructive';
    default:
      return 'secondary';
  }
};

onMounted(async () => {
  await fetchInvoices();
});
</script>

<template>
  <div class="space-y-4 w-full">
    <div class="mb-4">
      <h1 class="text-lg font-medium">Faturas</h1>
      <p class="text-sm text-muted-foreground">
        Veja a lista em detalhes de todas as suas faturas.
      </p>
    </div>

    <Table v-if="isLoading">
      <TableRow v-for="i in 5" :key="i">
        <TableCell v-for="j in 5" :key="i">
          <Skeleton :key="j" class="h-4 w-full bg-gray-300 my-1" />
        </TableCell>
      </TableRow>
    </Table>

    <div class="flex justify-start items-start  gap-8 flex-wrap w-full border rounded-lg">
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
        <TableBody v-if="services && services.data && services.data.length > 0">
          <TableRow v-for="row in services.data" :key="row.id">
            <TableCell>{{ row.name }}</TableCell>
            <TableCell>{{ formatDate(row.period_started_at) }} - {{ formatDate(row.period_ended_at) }}</TableCell>
            <TableCell class="text-right">{{ currencyFilter(row.amount) }}</TableCell>
            <TableCell>
              <Badge :variant="getStatusVariant(row.status)">
                {{ row.status }}
              </Badge>
            </TableCell>
            <TableCell class="flex items-center justify-end space-x-2">
              <ShowComponent :row="row" />
              <GetLinkComponent :row="row" :user="user" />
            </TableCell>
          </TableRow>
        </TableBody>
        <TableBody v-else>
          <TableRow>
            <TableCell :colspan="4" class="text-center py-5">
              Nenhuma fatura encontrada.
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
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import Auth from "@/services/auth";
import Invoices from "@/services/invoices";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import ShowComponent from "@/components/invoices/ShowComponent.vue";
import GetLinkComponent from "@/components/invoices/GetLinkComponent.vue";
import currencyFilter from "@/filters/currencyFilter";

const { toast } = useToast();

const user = ref<any>(null);
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

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
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

const fetchUser = async () => {
  try {
    const response = await Auth.user();
    user.value = response.data
  } catch (e) {
    console.error(e)
  }
};

onMounted(async () => {
  await fetchUser();
  await fetchInvoices();
});
</script>

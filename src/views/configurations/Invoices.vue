<template>
  <div class="space-y-4 w-full">
    <div class="mb-4">
      <h1 class="text-lg font-medium">Faturas</h1>
      <p class="text-sm text-muted-foreground">
        Veja a lista em detalhes de todas as suas faturas.
      </p>
    </div>

    <div v-if="isLoading" class="flex justify-end mb-2">
      <ColumnVisibilityToggle v-model="loadingColumnVisibility" :columns="loadingColumns" />
    </div>

    <Table v-if="isLoading">
      <TableRow v-for="i in 5" :key="i">
        <template v-for="col in loadingColumns" :key="col.id">
          <TableCell v-if="loadingColumnVisibility[col.id] !== false">
            <Skeleton class="h-4 w-full bg-gray-300 my-1" />
          </TableCell>
        </template>
      </TableRow>
    </Table>

    <div class="flex justify-start items-start  gap-8 flex-wrap w-full border rounded-lg">
      <div class="flex justify-end mb-2 w-full">
        <ColumnVisibilityToggle v-model="invoicesColumnVisibility" :columns="invoicesColumns" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead v-if="invoicesColumnVisibility.nome !== false">Nome</TableHead>
            <TableHead v-if="invoicesColumnVisibility.periodo !== false">Período</TableHead>
            <TableHead v-if="invoicesColumnVisibility.valor !== false" class="text-right">Valor</TableHead>
            <TableHead v-if="invoicesColumnVisibility.status !== false">Status</TableHead>
            <TableHead v-if="invoicesColumnVisibility.acoes !== false" class="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody v-if="services && services.data && services.data.length > 0">
          <TableRow v-for="row in services.data" :key="row.id">
            <TableCell v-if="invoicesColumnVisibility.nome !== false">{{ row.name }}</TableCell>
            <TableCell v-if="invoicesColumnVisibility.periodo !== false">{{ formatDate(row.period_started_at) }} - {{ formatDate(row.period_ended_at) }}</TableCell>
            <TableCell v-if="invoicesColumnVisibility.valor !== false" class="text-right">{{ currencyFilter(row.amount) }}</TableCell>
            <TableCell v-if="invoicesColumnVisibility.status !== false">
              <Badge :variant="getStatusVariant(row.status)">
                {{ row.status }}
              </Badge>
            </TableCell>
            <TableCell v-if="invoicesColumnVisibility.acoes !== false" class="flex items-center justify-end space-x-2">
              <ShowComponent :row="row" />
              <GetLinkComponent :row="row" :user="user" />
            </TableCell>
          </TableRow>
        </TableBody>
        <TableBody v-else>
          <TableRow>
            <TableCell :colspan="visibleInvoicesColumns.length" class="text-center py-5">
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
import { ref, computed, onMounted } from "vue";
import { toast } from "vue-sonner";
import Auth from "@/services/auth";
import Invoices from "@/services/invoices";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import ShowComponent from "@/components/invoices/ShowComponent.vue";
import GetLinkComponent from "@/components/invoices/GetLinkComponent.vue";
import currencyFilter from "@/filters/currencyFilter";
import ColumnVisibilityToggle from "@/components/custom/ColumnVisibilityToggle.vue";


const loadingColumns = [
  { id: "nome", label: "Nome" },
  { id: "periodo", label: "Período" },
  { id: "valor", label: "Valor" },
  { id: "status", label: "Status" },
  { id: "acoes", label: "Ações" },
];
const loadingColumnVisibility = ref<Record<string, boolean>>({});
const visibleLoadingColumns = computed(() =>
  loadingColumns.filter((c) => loadingColumnVisibility.value[c.id] !== false)
);

const invoicesColumns = [
  { id: "nome", label: "Nome" },
  { id: "periodo", label: "Período" },
  { id: "valor", label: "Valor" },
  { id: "status", label: "Status" },
  { id: "acoes", label: "Ações" },
];
const invoicesColumnVisibility = ref<Record<string, boolean>>({});
const visibleInvoicesColumns = computed(() =>
  invoicesColumns.filter((c) => invoicesColumnVisibility.value[c.id] !== false)
);

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
    toast.error("Erro", { description: "Erro ao carregar as faturas." });
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

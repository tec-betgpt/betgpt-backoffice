<template>
  <div class="w-full">
    <div class="mb-4">
      <h3 class="text-lg font-medium">Consumo</h3>
      <p class="text-sm text-muted-foreground">
        Veja a lista em detalhes de todos os recursos utilizados pelo seu projeto durante o período.
      </p>
    </div>

    <Separator class="mb-3" />

    <div class="flex justify-start items-start  gap-8 flex-wrap w-full border rounded-lg">
      <div class="flex justify-end mb-2 w-full">
        <ColumnVisibilityToggle v-model="columnVisibility" :columns="tableColumns" />
      </div>
      <Table class="w-full">
        <TableHeader>
          <TableRow>
            <TableHead v-if="columnVisibility.plano !== false">Plano</TableHead>
            <TableHead v-if="columnVisibility.activeCampaign !== false" class="text-right">ActiveCampaign</TableHead>
            <TableHead v-if="columnVisibility.ai !== false" class="text-right">AI</TableHead>
            <TableHead v-if="columnVisibility.entradas !== false" class="text-right">Entradas</TableHead>
            <TableHead v-if="columnVisibility.email !== false" class="text-right">E-mail</TableHead>
            <TableHead v-if="columnVisibility.googleAnalytics !== false" class="text-right">GoogleAnalytics</TableHead>
            <TableHead v-if="columnVisibility.smsFunnel !== false" class="text-right">SMS Funnel</TableHead>
            <TableHead v-if="columnVisibility.workspaces !== false" class="text-right">Workspaces</TableHead>
            <TableHead v-if="columnVisibility.referenteA !== false" class="text-right">Referente a</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in services" :key="row.id">
            <TableCell v-if="columnVisibility.plano !== false">
              {{ row.service ? row.service.name : '-' }}
            </TableCell>
            <TableCell v-if="columnVisibility.activeCampaign !== false" class="text-right">
              <Badge variant="secondary">
                {{ row.active_campaign }}
              </Badge>
            </TableCell>
            <TableCell v-if="columnVisibility.ai !== false" class="text-right">
              <Badge variant="secondary">
                {{ row.ai_token }}
              </Badge>
            </TableCell>
            <TableCell v-if="columnVisibility.entradas !== false" class="text-right">
              <Badge variant="secondary">
                {{ row.deposits }}
              </Badge>
            </TableCell>
            <TableCell v-if="columnVisibility.email !== false" class="text-right">
              <Badge variant="secondary">
                {{ row.email }}
              </Badge>
            </TableCell>
            <TableCell v-if="columnVisibility.googleAnalytics !== false" class="text-right">
              <Badge variant="secondary">
                {{ row.google_analytics }}
              </Badge>
            </TableCell>
            <TableCell v-if="columnVisibility.smsFunnel !== false" class="text-right">
              <Badge variant="secondary">
                {{ row.sms_funnel }}
              </Badge>
            </TableCell>
            <TableCell v-if="columnVisibility.workspaces !== false" class="text-right">
              <Badge variant="secondary">
                {{ row.project }}
              </Badge>
            </TableCell>
            <TableCell v-if="columnVisibility.referenteA !== false" class="text-right text-nowrap capitalize">
              {{ $moment(row.created_at).format('MMM/YYYY') }}
            </TableCell>
          </TableRow>

          <template v-if="isLoading">
            <TableRow v-for="i in 5" :key="i">
              <template v-for="col in tableColumns" :key="col.id">
                <TableCell v-if="columnVisibility[col.id] !== false">
                  <Skeleton class="h-4 w-full bg-gray-300 my-1" />
                </TableCell>
              </template>
            </TableRow>
          </template>

          <template v-if="!isLoading && (!services || !services.length)">
            <TableRow>
              <TableCell :colspan="visibleTableColumns.length" class="text-center py-5">
                Nenhum serviço encontrado.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>

      <CustomPagination
        :select-page="fetchServiceConsumeds"
        :pages="pages"
        :per_pages="perPage"
        @update:perPages="(value) => perPage = value"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { toast } from "vue-sonner";
import ServiceConsumeds from "@/services/serviceConsumeds";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import ColumnVisibilityToggle from "@/components/custom/ColumnVisibilityToggle.vue";


const tableColumns = [
  { id: "plano", label: "Plano" },
  { id: "activeCampaign", label: "ActiveCampaign" },
  { id: "ai", label: "AI" },
  { id: "entradas", label: "Entradas" },
  { id: "email", label: "E-mail" },
  { id: "googleAnalytics", label: "GoogleAnalytics" },
  { id: "smsFunnel", label: "SMS Funnel" },
  { id: "workspaces", label: "Workspaces" },
  { id: "referenteA", label: "Referente a" },
];
const columnVisibility = ref<Record<string, boolean>>({});
const visibleTableColumns = computed(() =>
  tableColumns.filter((c) => columnVisibility.value[c.id] !== false)
);

const services = ref();
const isLoading = ref(true);
const search = ref(null);
const currentPage = ref(1);
const perPage = ref(15);
const pages = ref({
  current: 1,
  last: 1,
  total: 0
})

const fetchServiceConsumeds = async (page = 1) => {
  try {
    const response = await ServiceConsumeds.index({
      page,
      per_page: 15
    });

    services.value = response.data
    currentPage.value = response.data.current_page;
    pages.value = {
      current: response.current_page,
      last: response.last_page,
      total: response.total,
    };
  } catch (error) {
    toast.error("Erro", { description: "Erro ao carregar os dados." });
  }
}

onMounted(async () => {
  isLoading.value = true;
  await fetchServiceConsumeds()
  isLoading.value = false;
});
</script>

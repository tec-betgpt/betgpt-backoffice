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
      <Table class="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Plano</TableHead>
            <TableHead class="text-right">ActiveCampaign</TableHead>
            <TableHead class="text-right">AI</TableHead>
            <TableHead class="text-right">Depósitos</TableHead>
            <TableHead class="text-right">E-mail</TableHead>
            <TableHead class="text-right">GoogleAnalytics</TableHead>
            <TableHead class="text-right">SMS Funnel</TableHead>
            <TableHead class="text-right">Workspaces</TableHead>
            <TableHead class="text-right">Referente a</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <transition-group
            appear
            enter-active-class="enter-active"
            enter-from-class="enter"
            enter-to-class="enter-to"
          >
            <TableRow v-for="(row, index) in services" :key="row.id" :style="`--delay: ${getMs(index)}`">
              <TableCell>
                {{ row.service ? row.service.name : '-' }}
              </TableCell>
              <TableCell class="text-right">
                <Badge variant="secondary">
                  {{ row.active_campaign }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <Badge variant="secondary">
                  {{ row.ai_token }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <Badge variant="secondary">
                  {{ row.deposits }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <Badge variant="secondary">
                  {{ row.email }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <Badge variant="secondary">
                  {{ row.google_analytics }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <Badge variant="secondary">
                  {{ row.sms_funnel }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <Badge variant="secondary">
                  {{ row.project }}
                </Badge>
              </TableCell>
              <TableCell class="text-right text-nowrap capitalize">
                {{ $moment(row.created_at).format('MMM/YYYY') }}
              </TableCell>
            </TableRow>
          </transition-group>

          <template v-if="isLoading">
            <TableRow v-for="i in 5" :key="i">
              <TableCell v-for="j in 9" :key="i">
                <Skeleton :key="j" class="h-4 w-full bg-gray-300 my-1" />
              </TableCell>
            </TableRow>
          </template>

          <template v-if="!isLoading && (!services || !services.length)">
            <TableRow>
              <TableCell :colspan="4" class="text-center py-5">
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
import { ref, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { getMs } from "@/filters/formatNumbers";
import ServiceConsumeds from "@/services/serviceConsumeds";
import CustomPagination from "@/components/custom/CustomPagination.vue";

const { toast } = useToast();

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
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  }
}

onMounted(async () => {
  isLoading.value = true;
  await fetchServiceConsumeds()
  isLoading.value = false;
});
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Serviços</h2>
        <p class="text-muted-foreground">
          Crie serviços como pacote de planos que os Usuários podem adquirir.
        </p>
      </div>

      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CreateDialogComponent :reload="fetchServices" />
      </div>
    </div>

    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <Table class="w-full overflow-hidden">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Contratado por</TableHead>
              <TableHead class="text-right">Criado em</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <transition-group
              appear
              enter-active-class="enter-active"
              leave-active-class="leave-active"
              enter-from-class="enter"
              enter-to-class="enter-to"
              leave-from-class="leave"
              leave-to-class="leave-to"
            >
              <TableRow v-for="(row, index) in services" :key="row.id" :style="`--delay: ${getMs(index)}`">
                <TableCell>
                  {{ row.name }}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" v-if="row.is_active" class="bg-green-200 text-green-800">Ativo</Badge>
                  <Badge variant="secondary" v-else class="bg-red-200 text-red-800">Inativo</Badge>
                </TableCell>
                <TableCell class="text-right">
                  -
                </TableCell>
                <TableCell class="text-right text-nowrap">
                  {{ $moment(row.created_at).format('DD/MM/YYYY') }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="gap-1 flex flex-nowrap justify-end">
                    <ToggleActivatedComponent :row="row" :reload="fetchServices" class="mr-1" />
                    <EditDialogComponent :row="row" :reload="fetchServices" />
                    <DestroyDialogComponent :destroy="destroy" :row="row" :reload="fetchServices" />
                  </div>
                </TableCell>
              </TableRow>
            </transition-group>

            <template v-if="isLoading">
              <TableRow v-for="i in 5" :key="i">
                <TableCell v-for="j in 4" :key="i">
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
          :select-page="fetchServices"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="(value) => perPage = value"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { getMs } from "@/filters/formatNumbers";
import Services from "@/services/services";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CreateDialogComponent from "@/components/services/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/services/EditDialogComponent.vue";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import ToggleActivatedComponent from "@/components/services/ToggleActivatedComponent.vue";

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

const fetchServices = async (page = 1) => {
  try {
    const response = await Services.index({
      page,
      per_page: 15,
      search: search.value
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

const destroy = async (id: number) => {
  try {
    await Services.destroy(id);
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao remover os dados.",
      variant: "destructive",
    });
  }
}

onMounted(async () => {
  isLoading.value = true;
  await fetchServices()
  isLoading.value = false;
});
</script>

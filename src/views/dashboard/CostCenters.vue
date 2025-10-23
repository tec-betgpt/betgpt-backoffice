<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Gerenciamento de Custos</h2>
        <p class="text-muted-foreground">
          Gerencie os centros de custo financeiros, adicionando ou editando
          informações para otimizar o controle e organização do orçamento.
        </p>
      </div>

      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CreateDialogComponent :reload="fetchCosts" />
      </div>
    </div>
    <Card>
      <CardContent>
      </CardContent>

      <CardContent>
        <Table v-if="isLoading">
          <TableRow v-for="a in 10" :key="a">
            <TableCell v-for="b in 3" :key="b">
              <Skeleton class="h-4 w-full dark:bg-gray-600 bg-gray-500 my-2" />
            </TableCell>
          </TableRow>
        </Table>

        <Table v-else class="w-full overflow-hidden">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Setor</TableHead>
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
              <TableRow v-for="(row, index) in costs" :key="row.id" :style="`--delay: ${getMs(index)}`">
                <TableCell>
                  {{ row.name }}
                </TableCell>
                <TableCell>
                  {{ row.sector?.name }}
                </TableCell>
                <TableCell>
                  <div class="flex flex-nowrap justify-end">
                    <EditDialogComponent :row="row" :reload="fetchCosts" />
                    <DestroyDialogComponent :reload="fetchCosts" :destroy="remove" :row="row" />
                  </div>
                </TableCell>
              </TableRow>
            </transition-group>
          </TableBody>
        </Table>
      </CardContent>

      <CardFooter>
        <CustomPagination
          :select-page="fetchCosts"
          :pages="pages"
          :per-pages="perPages"
          @update:perPages="(value)=>{perPages = value}"
        />
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { toast } from "@/components/ui/toast";
import { useWorkspaceStore } from "@/stores/workspace";
import { getMs } from "@/filters/formatNumbers";
import CostCenter from "@/services/costCenters";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CreateDialogComponent from "@/components/cost_centers/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/cost_centers/EditDialogComponent.vue";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";

interface CostData {
  id: number;
  name: string;
  sector: any;
}

const isLoading = ref(false);
const costs = ref<CostData[]>([]);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const nameCost = ref();
const perPages = ref('10');
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

watch(perPages, (newPerPage) => {
  if (newPerPage) {
    fetchCosts(1);
  }
});

const fetchCosts = async (current: number = pages.value.current) => {
  try {
    const page = nameCost.value && current
        ? current
        : nameCost.value
            ? 1
            : current
                ? current
                : pages.value.current

    const { data } = await CostCenter.index({
      filter_id: activeGroupProjectId,
      find_name: nameCost.value,
      sort_by: "id",
      sort_order: "desc",
      per_page: perPages.value,
      page,
    })

    costs.value = data.data
    pages.value = {
      current: data.current_page,
      total: data.total,
      last: data.last_page,
    };
  } catch (error) {
    console.error("Erro ao buscar centros de custo:", error);
  }
}

const remove = async (id: number) => {
  try {
    await CostCenter.destroy(id)
    await fetchCosts();

    toast({
      title: "Removido",
      description: "Centro de custo removido com sucesso",
      duration: 3000
    })
  } catch (error) {
    toast({
      title: "Falha",
      description: "Não foi possível remover o centro de custo.",
      duration: 3000,
      variant: "destructive"
    });
  }
}

onMounted(async () => {
  isLoading.value = true;
  await fetchCosts()
  isLoading.value = false;
});
</script>

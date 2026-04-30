<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">
          Gerenciamento de Setores
        </h2>
        <p class="text-muted-foreground">
          Gerencie os setores financeiros, adicionando ou editando informações
          para otimizar o controle do orçamento.
        </p>
      </div>

      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CreateDialogComponent :reload="fetchSectors" />
        <IAAnaliseButton />
      </div>

    </div>

    <Card>
      <CardContent class="pt-5">
        <div class="flex flex-col sm:flex-row gap-2 justify-end">
          <div class="grid w-full max-w-sm items-center">
            <Input
              type="search"
              class="sm:max-w-sm w-full"
              placeholder="Pesquisar"
              v-model="search"
            />
          </div>
          <Button v-if="search" size="icon" variant="ghost" @click="clearSearch">
            <X />
          </Button>
          <Button @click="fetchSectors()">
            Buscar
          </Button>
        </div>
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
              <TableHead>Projeto</TableHead>
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
              <TableRow v-for="(row, index) in sectors" :key="row.id" :style="`--delay: ${getMs(index)}`">
                <TableCell>
                  {{ row.name }}
                </TableCell>
                <TableCell>
                  {{ row.project?.name }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal class="h-4 w-4" />
                          <span class="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem @click="sectorEditRefs[row.id]?.openDialog()">
                          <Pencil class="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          class="text-destructive focus:text-destructive"
                          @click="sectorDestroyRefs[row.id]?.openDialog()"
                        >
                          <Trash2 class="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <EditDialogComponent
                      :ref="(el) => setSectorEditRef(row.id, el)"
                      :hide-trigger="true"
                      :row="row"
                      :reload="fetchSectors"
                    />
                    <DestroyDialogComponent
                      :ref="(el) => setSectorDestroyRef(row.id, el)"
                      triggerless
                      :reload="fetchSectors"
                      :destroy="remove"
                      :row="row"
                    />
                  </div>
                </TableCell>
              </TableRow>
            </transition-group>
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <CustomPagination
          :select-page="fetchSectors"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="args => perPage = args"
        />
      </CardFooter>
    </Card>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { toast } from "@/components/ui/toast";
import { MoreHorizontal, Pencil, Trash2, X } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMs } from "@/filters/formatNumbers";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import Sector from "@/services/sector"
import CustomPagination from "@/components/custom/CustomPagination.vue";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import EditDialogComponent from "@/components/sectors/EditDialogComponent.vue";
import CreateDialogComponent from "@/components/sectors/CreateDialogComponent.vue";

import IAAnaliseButton from "@/components/custom/IAAnaliseButton.vue";
import {TableCell, TableRow} from "@/components/ui/table";
import {Skeleton} from "@/components/ui/skeleton";

interface SectorData {
  id: number;
  name: string;
  project: string;
}
const isLoading = ref(true);
const search = ref(null);
const sectors = ref<SectorData[]>([]);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const perPage = ref(10);
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

type RowActionRef = { openDialog: () => void };
const sectorEditRefs = ref<Record<number, RowActionRef>>({});
const sectorDestroyRefs = ref<Record<number, RowActionRef>>({});

const setSectorEditRef = (id: number, el: unknown) => {
  const c = el as { openDialog?: () => void } | null;
  if (c && typeof c.openDialog === "function") {
    sectorEditRefs.value = { ...sectorEditRefs.value, [id]: c as RowActionRef };
  } else {
    const next = { ...sectorEditRefs.value };
    delete next[id];
    sectorEditRefs.value = next;
  }
};

const setSectorDestroyRef = (id: number, el: unknown) => {
  const c = el as { openDialog?: () => void } | null;
  if (c && typeof c.openDialog === "function") {
    sectorDestroyRefs.value = { ...sectorDestroyRefs.value, [id]: c as RowActionRef };
  } else {
    const next = { ...sectorDestroyRefs.value };
    delete next[id];
    sectorDestroyRefs.value = next;
  }
};

const clearSearch = () => {
  search.value = null;
  fetchSectors();
}

const remove = async (id: number) => {
  try {
    await Sector.destroy(id)
    await fetchSectors();

    toast({
      title: "Apagado",
      description: "Setor removido com sucesso.",
    });
  } catch (error) {
    toast({
      title: "Erro ao apagar",
      description: "Não foi possível remover, tente novamente mais tarde.",
      variant: "destructive",
    });
  }
}

const fetchSectors = async (current: number = pages.value.current) => {
  try {
    const { data } = await Sector.index({
      page: current,
      filter_id: activeGroupProjectId,
      find_name: [{ name: search.value }],
      sort_by: "id",
      sort_order: "desc",
      per_page: perPage.value
    })

    sectors.value = data.data;
    pages.value = {
      current: data.current_page,
      total: data.total,
      last: data.last_page,
    };
  } catch (error) {
    console.error("Erro ao buscar setores:", error);
  }
}

onMounted(async () => {
  isLoading.value = true;
  await fetchSectors()
  isLoading.value = false;
});

useScreenContext(
  "Tela de setores - Gerencia setores do sistema",
  () => ({
    "page": pages.value.current,
    "last_page": pages.value.last,
    "per_page": perPage.value,
  }),
  "/v1/sectors"
);

watch(perPage,() => fetchSectors(1));
</script>

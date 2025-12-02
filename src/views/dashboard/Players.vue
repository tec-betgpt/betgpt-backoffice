<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Lista de Clientes</h2>
      <p class="text-muted-foreground">Veja a relação de clientes associados ao projeto.</p>
    </div>

    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <div class="flex w-full max-w-sm items-center space-x-2">
          <Input v-model="searchInput" type="text" placeholder="Pesquisar por nome ou e-mail..." @keydown.enter="handleSearch" />
          <Button @click="handleSearch">Pesquisar</Button>
        </div>

        <Table class="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead class="text-right">
                <Button class="p-0" variant="ghost" @click="handleSort('created_at')">
                  Criado em
                  <ArrowUp v-if="order === 'created_at' && direction" class="ml-2 h-4 w-4" />
                  <ArrowDown v-else-if="order === 'created_at' && !direction" class="ml-2 h-4 w-4" />
                  <CaretSortIcon v-else class="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <transition-group appear enter-active-class="enter-active" enter-from-class="enter" enter-to-class="enter-to">
              <TableRow v-for="(row, index) in players" :key="row.id" :style="`--delay: ${getMs(index)}`">
                <TableCell>
                  {{ row.name ?? 'Não Informado'}}
                </TableCell>
                <TableCell>
                  {{ row.email }}
                </TableCell>
                <TableCell class="text-right text-nowrap">
                  {{ $moment(row.created_at).format('DD/MM/YYYY') }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="gap-1 flex flex-nowrap justify-end">
                    <ShowDialogComponent :row="row" :filter-id="activeGroupProjectId" />
                    <EditDialogComponent :row="row" :reload="fetchPlayers" :filter-id="activeGroupProjectId" />
                  </div>
                </TableCell>
              </TableRow>
            </transition-group>

            <template v-if="isLoading">
              <TableRow v-for="i in perPage" :key="i">
                <TableCell v-for="j in 4" :key="i">
                  <Skeleton :key="j" class="h-4 w-full bg-gray-300 my-1" />
                </TableCell>
              </TableRow>
            </template>

            <template v-if="!isLoading && (!players || !players.length)">
              <TableRow>
                <TableCell :colspan="4" class="text-center py-5">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>

        <CustomSimplePagination
          :current-page="currentPage"
          :per-page="perPage"
          @page-changed="fetchPlayers"
          @update:per-page="(val) => perPage = val"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import { getMs } from "@/filters/formatNumbers";
import Players from "@/services/players";
import EditDialogComponent from "@/components/players/EditDialogComponent.vue";
import CustomSimplePagination from "@/components/custom/CustomSimplePagination.vue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-vue-next";
import { CaretSortIcon } from "@radix-icons/vue";
import ShowDialogComponent from "@/components/players/ShowDialogComponent.vue";

const { toast } = useToast();

type Player = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

const players = ref<Player[]>([]);
const isLoading = ref(true);
const currentPage = ref(1);
const pages = ref({
  current: 1,
  last: 1,
  total: 0
});
const searchValues = ref<Record<string, string>>({});
const order = ref('id');
const direction = ref(false); // false = desc, true = asc
const perPage = ref(15);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const searchInput = ref('');

const fetchPlayers = async (page = currentPage.value) => {
  currentPage.value = page;

  try {
    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      acc[key] = searchValues.value[key];
      return acc;
    }, {} as Record<string, string>);

    const response = await Players.index({
      page: currentPage.value,
      perPage: perPage.value,
      ...searchParams,
      orderBy: order.value,
      orderDirection: direction.value ? "asc" : "desc",
      filter_id: activeGroupProjectId,
    });

    players.value = response.data
  } catch (error) {
    toast({
      title: "Ops",
      description: "Não foi possível carregar os dados dos Clientes",
      variant: "destructive",
    });
  }
};

const handleSearch = async () => {
  isLoading.value = true
  players.value = []
  searchValues.value = { search: searchInput.value };
  await fetchPlayers(1);
  isLoading.value = false
};

const handleSort = (column: string) => {
  if (order.value === column) {
    direction.value = !direction.value;
  } else {
    order.value = column;
    direction.value = false;
  }

  fetchPlayers(currentPage.value);
};

onMounted(async () => {
  isLoading.value = true
  await fetchPlayers()
  isLoading.value = false
});
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Lista de Clientes</h2>
      <p class="text-muted-foreground">Veja a relação de clientes associados ao projeto.</p>
    </div>

    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <div class="flex w-full items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-2">
            <Input v-model="searchInput" type="text" placeholder="Pesquisar por nome ou e-mail..." class="w-[300px]" @keydown.enter="handleSearch" />
            <Button @click="handleSearch">Pesquisar</Button>
          </div>

          <div class="flex items-center gap-2">
            <Label class="text-nowrap">Filtrar por Tag:</Label>
            <Combobox v-model="selectedTagName">
              <ComboboxAnchor class="relative w-[200px] flex items-center">
                <ComboboxInput placeholder="Selecione uma tag" />
                <ComboboxTrigger class="absolute right-2 h-full flex items-center">
                  <ChevronsUpDown class="h-4 w-4 opacity-50" />
                </ComboboxTrigger>
              </ComboboxAnchor>
              <ComboboxList>
                <ComboboxEmpty>Nenhuma tag encontrada.</ComboboxEmpty>
                <ComboboxGroup>
                  <ComboboxItem value="Todas as Tags">
                    Todas as Tags
                  </ComboboxItem>
                  <ComboboxItem v-for="tag in tags" :key="tag.id" :value="tag.name">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: tag.color || '#e2e8f0' }"></div>
                      {{ tag.name }}
                    </div>
                  </ComboboxItem>
                </ComboboxGroup>
              </ComboboxList>
            </Combobox>
          </div>
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
                    <Button size="icon" variant="ghost" @click="showPlayer(row.id)">
                      <Eye class="h-4 w-4" />
                    </Button>
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
import { ref, onMounted, watch } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import { getMs } from "@/filters/formatNumbers";
import { ArrowDown, ArrowUp, Eye, Check, ChevronsUpDown } from "lucide-vue-next";
import { CaretSortIcon } from "@radix-icons/vue";
import Players from "@/services/players";
import TagsService from "@/services/tags";
import { Tag } from "@/contracts/tag";
import EditDialogComponent from "@/components/players/EditDialogComponent.vue";
import CustomSimplePagination from "@/components/custom/CustomSimplePagination.vue";
import { useRouter } from "vue-router";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const { toast } = useToast();
const router = useRouter();

type Player = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

const showPlayer = (id: string) => {
  router.push({ name: 'clients.show', params: { id } });
};

const players = ref<Player[]>([]);
const tags = ref<Tag[]>([]);
const selectedTagName = ref('Todas as Tags');
const isLoading = ref(true);
const currentPage = ref(1);
const searchValues = ref<Record<string, string>>({});
const order = ref('id');
const direction = ref(false);
const perPage = ref(15);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const searchInput = ref('');

const fetchTags = async () => {
  try {
    const response = await TagsService.index({
      filter_id: activeGroupProjectId,
      per_page: 100
    });
    tags.value = response.data || [];
  } catch (error) {
    console.error("Error loading tags:", error);
  }
};

const fetchPlayers = async (page = currentPage.value) => {
  currentPage.value = page;

  try {
    const params: any = {
      page: currentPage.value,
      perPage: perPage.value,
      orderBy: order.value,
      orderDirection: direction.value ? "asc" : "desc",
      filter_id: activeGroupProjectId,
      ...searchValues.value,
    };

    if (selectedTagName.value && selectedTagName.value !== 'Todas as Tags') {
      params.tag_name = selectedTagName.value;
    }

    const response = await Players.index(params);
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

watch(selectedTagName, () => {
  fetchPlayers(1);
});

const handleSort = (column: string) => {
  if (order.value === column) {
    if (direction.value === false) {
      direction.value = true;
    } else {
      order.value = "id";
      direction.value = false;
    }
  } else {
    order.value = column;
    direction.value = false;
  }

  fetchPlayers(currentPage.value);
};

onMounted(async () => {
  isLoading.value = true
  await Promise.all([
    fetchPlayers(),
    fetchTags()
  ]);
  isLoading.value = false
});
</script>

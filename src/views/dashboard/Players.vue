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
            <SearchableCombobox
              v-model="selectedTagName"
              :load-options="loadTagOptions"
              placeholder="Selecione uma tag"
              search-placeholder="Buscar tag..."
              empty-text="Nenhuma tag encontrada."
              class="w-[200px]"
              content-class="w-[250px]"
            />
          </div>
        </div>

        <Table class="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Referrer ID</TableHead>
              <TableHead class="text-right">
                <Button class="p-0" variant="ghost" @click="handleSort('created_at')">
                  Criado em
                  <ArrowUp v-if="order === 'created_at' && direction" class="ml-2 h-4 w-4" />
                  <ArrowDown v-else-if="order === 'created_at' && !direction" class="ml-2 h-4 w-4" />
                  <ChevronsUpDown v-else class="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="row in players" :key="row.id">
              <TableCell>
                {{ row.name ?? 'Não Informado'}}
              </TableCell>
              <TableCell>
                {{ row.email }}
              </TableCell>
              <TableCell>
                <template v-if="row.referrer_id">
                  <router-link
                    v-if="canAccessClientManagement && row.referrer_player"
                    :to="{ name: 'clients.show', params: { id: String(row.referrer_player.id) } }"
                    class="text-primary hover:underline"
                  >
                    {{ row.referrer_id }}
                  </router-link>
                  <span v-else>{{ row.referrer_id }}</span>
                </template>
                <span v-else class="text-muted-foreground">—</span>
              </TableCell>
              <TableCell class="text-right text-nowrap">
                {{ $moment(row.created_at).format('DD/MM/YYYY HH:mm') }}h
              </TableCell>
              <TableCell class="text-right">
                <div class="gap-1 flex flex-nowrap justify-end">
                  <Button
                    v-if="canAccessClientManagement"
                    size="icon"
                    variant="ghost"
                    @click="showPlayer(row.id)"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                  <EditDialogComponent :row="row" :reload="fetchPlayers" :filter-id="activeGroupProjectId" />
                </div>
              </TableCell>
            </TableRow>

            <template v-if="isLoading">
              <TableRow v-for="i in perPage" :key="i">
                <TableCell v-for="j in 5" :key="i">
                  <Skeleton :key="j" class="h-4 w-full bg-gray-300 my-1" />
                </TableCell>
              </TableRow>
            </template>

            <template v-if="!isLoading && (!players || !players.length)">
              <TableRow>
                <TableCell :colspan="5" class="text-center py-5">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>

        <CustomSimplePagination
          :current-page="currentPage"
          :has-next-page="hasNextPage"
          :per-page="perPage"
          @page-changed="fetchPlayers"
          @update:per-page="(val) => { perPage = val; fetchPlayers(1); }"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { toast } from "vue-sonner";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import { ArrowDown, ArrowUp, Eye, ChevronsUpDown } from 'lucide-vue-next'
import Players from "@/services/players";
import TagsService from "@/services/tags";
import { Tag } from "@/contracts/tag";
import EditDialogComponent from "@/components/players/EditDialogComponent.vue";
import CustomSimplePagination from "@/components/custom/CustomSimplePagination.vue";
import SearchableCombobox from "@/components/custom/SearchableCombobox.vue";
import { useRouter } from "vue-router";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const hasPermission = (permissionName: string) =>
  Boolean((authStore.user as any)?.roles?.some((role: any) =>
    role.permissions?.some((permission: any) => permission.name === permissionName),
  ));

type ReferrerPlayerSnippet = {
  id: number;
  name: string | null;
  email: string;
  external_id: string | null;
};

type Player = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  referrer_id?: string | null;
  external_id?: string | null;
  referrer_player?: ReferrerPlayerSnippet | null;
};

const showPlayer = (id: string) => {
  if (!canAccessClientManagement.value) return;
  router.push({ name: 'clients.show', params: { id } });
};
const canAccessClientManagement = ref(
  hasPermission("access-to-client-management"),
);

const players = ref<Player[]>([]);
const selectedTagName = ref('Todas as Tags');
const isLoading = ref(true);
const currentPage = ref(1);
const hasNextPage = ref(false);
const searchValues = ref<Record<string, string>>({});
const order = ref('id');
const direction = ref(false);
const perPage = ref(15);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const searchInput = ref('');

const loadTagOptions = async (search = '') => {
  try {
    const response = await TagsService.index({
      filter_id: activeGroupProjectId,
      per_page: 20,
      search,
    });
    const list: Tag[] = response.data || [];
    const options = list.map((tag: Tag) => ({
      value: tag.name,
      label: tag.name,
      color: tag.color || undefined,
    }));

    return search
      ? options
      : [{ value: 'Todas as Tags', label: 'Todas as Tags' }, ...options];
  } catch (error) {
    console.error("Error loading tags:", error);
    return [];
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
    players.value = response.data ?? [];
    currentPage.value = response.current_page ?? page;
    perPage.value = Number(response.per_page ?? perPage.value);
    hasNextPage.value = Boolean(response.next_page_url);
  } catch (error) {
    toast.error("Ops", { description: "Não foi possível carregar os dados dos Clientes" });
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
  await fetchPlayers();
  isLoading.value = false
});

useScreenContext(
  "Tela de jogadores - Lista todos os jogadores do sistema",
  () => ({
    "tag_name": selectedTagName.value,
    "page": currentPage.value,
    "per_page": perPage.value,
    "orderBy": order.value,
    "orderDirection": direction.value ? "asc" : "desc",
  }),
  "/v1/players"
);
</script>

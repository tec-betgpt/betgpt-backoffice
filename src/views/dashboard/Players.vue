<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Lista de Jogadores</h2>
      <p class="text-muted-foreground">Os jogadores vinculados ao projeto.</p>
    </div>
    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <CustomDataInfinite
          :loading="isLoading"
          :columns="columns"
          :data="players"
          :update-text="setSearch"
          :find="fetchPlayers"
          :has-more="hasMore"
          :current-page="currentPage"
          :search-fields="[
            { key: 'name', placeholder: 'Buscar por nome do jogador...' },
          ]"
          @load-more="loadMore"
          @reset="resetData"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-vue-next";
import Players from "@/services/players";
import { createColumnHelper } from "@tanstack/vue-table";
import CustomDataInfinite from "@/components/custom/CustomDataInfinite.vue";
import { CaretSortIcon } from "@radix-icons/vue";
import { useWorkspaceStore } from "@/stores/workspace";

const { toast } = useToast();
const players = ref<Player[]>([]);
const isLoading = ref(true);
const hasMore = ref(false);
const currentPage = ref(1);

const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

const fetchPlayers = async (page = 1) => {
  const isInitialLoad = page === 1;
  isLoading.value = true;

  try {
    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      acc[key] = searchValues.value[key];
      return acc;
    }, {} as Record<string, string>);

    const response = await Players.index({
      page,
      perPage: 10,
      ...searchParams,
      orderBy: order.value ? order.value : "id",
      orderDirection: direction.value ? "asc" : "desc",
      filter_id: activeGroupProjectId,
    });

    if (isInitialLoad) {
      players.value = response.data.players;
    } else {
      players.value = [...players.value, ...response.data.players];
    }

    hasMore.value = response.data.hasMore;
    currentPage.value = response.data.currentPage;
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const resetData = () => {
  players.value = [];
  currentPage.value = 1;
  hasMore.value = false;
};

const loadMore = (page: number) => {
  fetchPlayers(page);
};

onMounted(() => fetchPlayers(1));

const searchValues = ref<Record<string, string>>({});
const setSearch = (values: Record<string, string>) => {
  searchValues.value = values;
};

const order = ref();
const direction = ref(false);
const columnHelper = createColumnHelper<User>();
function createHeaderButton(label: string, columnKey: string) {
  return h(
    Button,
    {
      variant: order.value === columnKey ? "default" : "ghost",
      onClick: () => {
        order.value = columnKey;
        direction.value = !direction.value;
        fetchPlayers();
      },
      class: "h-fit text-pretty my-1",
    },
    () => [
      label,
      h(
        order.value === columnKey
          ? direction.value
            ? ArrowDown
            : ArrowUp
          : CaretSortIcon,
        { class: "" }
      ),
    ]
  );
}
const columns = [
  columnHelper.accessor("id", {
    header({ column }) {
      return createHeaderButton("ID", "id");
    },
    cell: ({ row }) => h("div", {}, row.original.id),
  }),
  columnHelper.accessor("name", {
    header({ column }) {
      return createHeaderButton("Nome", "name");
    },
    cell: ({ row }) =>
      h("div", { class: "capitalize" }, `${row.original.name}`),
  }),
  columnHelper.accessor("email", {
    header({ column }) {
      return createHeaderButton("E-mail", "email");
    },
    cell: ({ row }) => h("div", {}, row.original.email),
  }),
];

type Player = {
  id: string;
  name: string;
  email: string;
};
</script>

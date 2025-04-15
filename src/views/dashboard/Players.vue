<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Lista de Jogadores</h2>
      <p class="text-muted-foreground">Os jogadores vinculados ao projeto.</p>
    </div>
    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <CustomDataTable
          :loading="isLoading"
          :columns="columns"
          :data="players"
          :update-text="setSearch"
          :find="fetchPlayers"
          :search-fields="[
            { key: 'name', placeholder: 'Buscar por nome do jogador...' },
          ]"
        >
        </CustomDataTable>
        <CustomPagination :select-page="fetchPlayers" :pages="pages" />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-vue-next";
import api from "@/services/base";
import Players from "@/services/players";
import { createColumnHelper } from "@tanstack/vue-table";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { CaretSortIcon } from "@radix-icons/vue";
import { useWorkspaceStore } from "@/stores/workspace";

const { toast } = useToast();
const players = ref<Player[]>([]);
const isLoading = ref(true);
const pages = ref({
  current: 1,
  last: 0,
  total: 0,
});

const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

const fetchPlayers = async (current = pages.value.current) => {
  isLoading.value = true;

  try {
    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      acc[key] = searchValues.value[key];
      return acc;
    }, {} as Record<string, string>);

    const [playerResponse] = await Promise.all([
      Players.index({
        page: current,
        ...searchParams,
        orderBy: order.value ? order.value : "id",
        orderDirection: direction.value ? "asc" : "desc",
        filter_id: activeGroupProjectId,
      }),
    ]);

    players.value = playerResponse.data;
    pages.value = {
      current: playerResponse.pagination.current_page,
      last: playerResponse.pagination.last_page,
      total: playerResponse.pagination.total_records,
    };
  } catch (error) {
    console.error(error)
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  }

  isLoading.value = false;
};

onMounted(fetchPlayers);

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
  columnHelper.accessor("model_id", {
    header({ column }) {
      return createHeaderButton("ID", "id");
    },
    cell: ({ row }) => h("div", {}, row.getValue("model_id")),
  }),
  columnHelper.accessor("title", {
    header({ column }) {
      return createHeaderButton("Nome", "name");
    },
    cell: ({ row }) =>
      h("div", { class: "capitalize" }, `${row.getValue("title")}`),
  }),
  columnHelper.accessor("email", {
    header({ column }) {
      return createHeaderButton("E-mail", "email");
    },
    cell: ({ row }) => h("div", {}, row.getValue("email")),
  }),
];

type Player = {
  id: string;
  name: string;
  email: string;
};
</script>

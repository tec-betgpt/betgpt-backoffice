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
import { ref, onMounted, h, watch, computed } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  ChevronDownIcon,
  ArrowDown,
  ArrowUp,
} from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import api from "@/services/api";
import { createColumnHelper } from "@tanstack/vue-table";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { CaretSortIcon } from "@radix-icons/vue";
import { useWorkspaceStore } from "@/stores/workspace";
import moment from "moment";

const { toast } = useToast();
const processingAction = ref(null);
const players = ref<Player[]>([]);
const isLoading = ref(true);
const isProcessing = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const processingStatusId = ref(null);
const pages = ref({
  current: 1,
  last: 0,
  total: 0,
});

const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

const fetchPlayers = async (current = pages.value.current) => {
  try {
    isLoading.value = true;

    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      acc[key] = searchValues.value[key];
      return acc;
    }, {} as Record<string, string>);

    const [playerResponse] = await Promise.all([
      api.get(`/players?page=${current}`, {
        params: {
          ...searchParams,
          orderBy: order.value ? order.value : "id",
          orderDirection: direction.value ? "asc" : "desc",
          filter_id: activeGroupProjectId,
        },
      }),
    ]);
    players.value = playerResponse.data.data;
    pages.value = {
      current: playerResponse.data.pagination.current_page,
      last: playerResponse.data.pagination.last_page,
      total: playerResponse.data.pagination.total_records,
    };
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
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

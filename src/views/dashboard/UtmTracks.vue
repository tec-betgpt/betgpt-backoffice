<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Rastreamentos UTM</h2>
      <p class="text-muted-foreground">
        Os rastreamentos UTM de todos os segmentos.
      </p>
    </div>
    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <CustomDataTable
          :loading="isLoading"
          :columns="columns"
          :data="utmTracks"
          :update-text="setSearch"
          :find="fetchUtmTracks"
        >
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="ml-auto">
                Tipo <ChevronDownIcon class="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                :checked="typeFilter.includes('deposit')"
                @update:checked="setType('deposit')"
                class="capitalize"
              >
                Depósito
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                :checked="typeFilter.includes('player')"
                @update:checked="setType('player')"
              >
                Cadastro
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CustomDataTable>
        <CustomPagination :select-page="fetchUtmTracks" :pages="pages" />
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
const utmTracks = ref<UtmTrack[]>([]);
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
const typeFilter = ref<Array<String>>(["deposit", "player"]);
const setType = (type: any) => {
  const index = typeFilter.value.indexOf(type);
  if (index === -1) {
    typeFilter.value.push(type);
  } else {
    typeFilter.value.splice(index, 1);
  }
};

watch(typeFilter.value, () => {
  fetchUtmTracks(1);
});

const workspaceStore = useWorkspaceStore();
const projectId = workspaceStore.activeProject?.id ?? null;

const fetchUtmTracks = async (current = pages.value.current) => {
  try {
    isLoading.value = true;
    const [utmTracksResponse] = await Promise.all([
      api.get(`/utm-tracks?page=${current}`, {
        params: {
          searchName: search.value,
          type: typeFilter.value,
          orderBy: order.value ? order.value : "id",
          orderDirection: direction.value ? "asc" : "desc",
          project_id: projectId,
        },
      }),
    ]);
    utmTracks.value = utmTracksResponse.data.data.utm_tracks;
    pages.value = {
      current: utmTracksResponse.data.data.pagination.current_page,
      last: utmTracksResponse.data.data.pagination.last_page,
      total: utmTracksResponse.data.data.pagination.total,
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

onMounted(fetchUtmTracks);

const search = ref();
const setSearch = (text) => {
  search.value = text;
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
        fetchUtmTracks();
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
    cell: ({ row }) => h("div", {}, row.getValue("id")),
  }),
  columnHelper.accessor("name", {
    header({ column }) {
      return createHeaderButton("Nome", "name");
    },
    cell: ({ row }) => h("div", {}, `${row.getValue("name")}`),
  }),
  columnHelper.accessor("value", {
    header({ column }) {
      return createHeaderButton("Valor", "value");
    },
    cell: ({ row }) => h("div", {}, `${row.getValue("value")}`),
  }),
  columnHelper.accessor("type", {
    header({ header }) {
      return "Tipo";
    },
    cell: ({ row }) =>
      h(
        "div",
        { class: "capitalize" },
        row.original.model_type == "Deposit" ? "Depósito" : "Cadastro"
      ),
  }),
  columnHelper.accessor("created_at", {
    header({ header }) {
      return createHeaderButton("Data", "created_at");
    },
    cell: ({ row }) =>
      h(
        "div",
        {},
        moment(row.getValue("created_at")).format("DD/MM/YYYY HH:mm:ss")
      ),
  }),
];

type Player = {
  id: string;
  name: string;
  value: string;
  source_id: int;
  source_type: string;
  project_id: int;
  model: object;
};
</script>

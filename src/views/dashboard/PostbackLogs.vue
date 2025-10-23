<template>
  <div class="space-y-6 sm:p-10 p-1 max-w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Elevate API</h2>
        <p class="text-muted-foreground">
          Registros de postbacks recebidos e seu status de processamento.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CustomDatePicker v-model="selectedRange" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Select v-model="selectedType">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="Selecione o tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="PostbackLogService.types.PLAYER"
            >Cliente</SelectItem
          >
          <SelectItem :value="PostbackLogService.types.DEPOSIT"
            >Depósito</SelectItem
          >
          <SelectItem :value="PostbackLogService.types.WITHDRAW"
            >Saque</SelectItem
          >
          <SelectItem :value="PostbackLogService.types.LOGIN"
            >Logins</SelectItem
          >
          <SelectItem :value="PostbackLogService.types.STATUS_CHANGE"
            >Alteração de Status</SelectItem
          >
          <SelectItem value="all">Todos</SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="selectedStatus">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="Selecione o status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="processed">Processado</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="failed">Falhou</SelectItem>
          <SelectItem value="all">Todos</SelectItem>
        </SelectContent>
      </Select>

      <Button @click="handleSearch" :disabled="loading" class="h-10">
        <span v-if="!loading">Buscar</span>
        <span v-else class="flex items-center gap-2">
          <svg
            class="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Carregando...
        </span>
      </Button>
    </div>

    <div>
      <Card class="w-full">
        <CardHeader>
          <CardTitle>Postback Logs</CardTitle>
        </CardHeader>

        <Separator />

        <CardContent>
          <CustomDataInfinite
            :data="logs"
            :columns="columns"
            :loading="loading"
            :has-more="hasMore"
            :current-page="currentPage"
            @load-more="loadMore"
            :loadingInitial="false"
          />
        </CardContent>

        <!--<CardFooter class="border-t" v-if="pages.total > 0">
          <div class="grid grid-cols-3 gap-4 w-full px-4">
            <div class="text-center p-3">
              <p class="text-sm text-gray-600">Processados</p>
              <p class="text-xl font-bold text-green-600">
                {{ totalLogs.processed }}
              </p>
            </div>
            <div class="text-center p-3">
              <p class="text-sm text-gray-600">Pendentes</p>
              <p class="text-xl font-bold text-yellow-600">
                {{ totalLogs.pending }}
              </p>
            </div>
            <div class="text-center p-3">
              <p class="text-sm text-gray-600">Falhas</p>
              <p class="text-xl font-bold text-red-600">
                {{ totalLogs.failed }}
              </p>
            </div>
          </div>
        </CardFooter>-->
      </Card>
    </div>

    <Dialog v-model:open="isPayloadModalOpen">
      <DialogContent class="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payload do Postback</DialogTitle>
          <DialogDescription>
            Detalhes completos do postback recebido
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div
            v-if="selectedPayload?.error"
            class="bg-red-50 p-4 rounded-md border border-red-200"
          >
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-red-800">
                  Erro no processamento
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  {{ selectedPayload.error }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md max-h-[60vh] overflow-y-auto"
          >
            <pre
              class="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap break-all"
              >{{ formattedPayload }}</pre
            >
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, watch } from "vue";
import { getLocalTimeZone, today } from "@internationalized/date";
import moment from "moment";
import "moment/dist/locale/pt-br";
import { useToast } from "@/components/ui/toast/use-toast";
import { createColumnHelper } from "@tanstack/vue-table";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CustomDataInfinite from "@/components/custom/CustomDataInfinite.vue";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import PostbackLogService from "@/services/postbackLog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowDown, ArrowUp } from "lucide-vue-next";
import { CaretSortIcon } from "@radix-icons/vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const currentDate = today(getLocalTimeZone()).subtract({ days: 0 });
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });
const selectedType = ref<string>("");
const selectedStatus = ref<string>("processed");
const { toast } = useToast();
const workspaceStore = useWorkspaceStore();

const loading = ref(false);
const logs = ref<PostbackLog[]>([]);
const totalLogs = ref({
  processed: 0,
  pending: 0,
  failed: 0,
});
const order = ref();
const direction = ref(false);
const perPage = ref(10);
const isPayloadModalOpen = ref(false);
const selectedPayload = ref<any>(null);
const formattedPayload = computed(() => {
  return selectedPayload.value
    ? JSON.stringify(selectedPayload.value, null, 2)
    : "Nenhum payload selecionado";
});

const handleSearch = () => {
  fetchPostbackLogs(1);
};

watch(perPage, () => fetchPostbackLogs(1));
const fetchPostbackLogs = async (page = 1) => {
  const isInitialLoad = page === 1;

  if (!selectedType.value) {
    toast({
      title: "Atenção",
      description: "Selecione um tipo de postback para filtrar.",
      variant: "destructive",
    });
    return;
  }

  if (!workspaceStore.activeGroupProject?.id) {
    toast({
      title: "Erro",
      description: "Selecione um grupo ou projeto antes de filtrar.",
      variant: "destructive",
    });
    return;
  }

  loading.value = true;

  try {
    const { data } = await PostbackLogService.index({
      page: page,
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
      filter_id: workspaceStore.activeGroupProject.id,
      type: selectedType.value,
      status: selectedStatus.value,
      orderBy: order.value ? order.value : "id",
      orderDirection: direction.value ? "asc" : "desc",
      per_page: perPage.value,
    });

    if (isInitialLoad) {
      logs.value = data.logs.data;
    } else {
      logs.value = [...logs.value, ...data.logs.data];
    }

    hasMore.value = data.logs.hasMore;
    currentPage.value = data.logs.currentPage;
  } catch (error) {
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const showPayload = async (logId: number) => {
  try {
    const { data } = await PostbackLogService.payload(logId);
    selectedPayload.value = data.payload;
    isPayloadModalOpen.value = true;
  } catch (error) {
    toast({
      title: "Erro ao carregar payload",
      description: "Não foi possível carregar o payload do postback.",
      variant: "destructive",
    });
  }
};

const loadMore = (page: number) => {
  fetchPostbackLogs(page);
};

const hasMore = ref(false);
const currentPage = ref(1);

const columnHelper = createColumnHelper<PostbackLog>();

function createHeaderButton(label: string, columnKey: string) {
  return h(
    Button,
    {
      variant: order.value === columnKey ? "default" : "ghost",
      onClick: () => {
        order.value = columnKey;
        direction.value = !direction.value;
        fetchPostbackLogs();
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
  columnHelper.accessor("type", {
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.original.type
      const t = {
        deposit: "Depósito",
        withdraw: "Saque",
        player: "Cliente",
        status_change: "Alteração de Status",
      }[type] || type;
      return h("div", {class: "capitalize"}, t)
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;

      const color = {
        pending: "text-yellow-600",
        processed: "text-green-600",
        failed: "text-red-600",
      }[status as string];
      const s = {
        pending: "Pendente",
        processed: "Processado",
        failed: "Falha",
      }[status];

      return h("div", { class: `capitalize ${color}` }, s);
    },
  }),
  columnHelper.accessor("created_at", {
    header: "Recebido em",
    cell: ({ row }) =>
      h("div", moment(row.original.created_at).format("DD/MM/YYYY HH:mm:ss")),
  }),
  columnHelper.accessor("processed_at", {
    header: "Processado em",
    cell: ({ row }) => {
      const processedAt = row.original.processed_at;
      return h(
        "div",
        processedAt ? moment(processedAt).format("DD/MM/YYYY HH:mm:ss") : "-"
      );
    },
  }),
  columnHelper.accessor("actions", {
    header: "Ações",
    cell: ({ row }) =>
      h(DropdownMenu, {}, [
        h(
          DropdownMenuTrigger,
          { asChild: true },
          h(Button, { size: "icon", variant: "ghost" }, [
            h(MoreHorizontal, { class: "h-4 w-4" }),
            h("span", { class: "sr-only" }, "Ações"),
          ])
        ),
        h(DropdownMenuContent, { align: "end" }, [
          h(DropdownMenuLabel, {}, "Ações"),
          h(DropdownMenuSeparator, {}),
          h(
            DropdownMenuItem,
            {
              onClick: () => showPayload(row.original.id),
            },
            "Ver Payload"
          ),
        ]),
      ]),
  }),
];

type PostbackLog = {
  id: number;
  project_id: number;
  type: string;
  status: "pending" | "processed" | "failed";
  error: string | null;
  created_at: string;
  processed_at: string | null;
};
</script>

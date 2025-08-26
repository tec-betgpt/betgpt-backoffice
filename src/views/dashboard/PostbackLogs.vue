<template>
  <div class="space-y-6 sm:p-10 p-1 max-w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Logs de Postback</h2>
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
          <CustomDataTable
            :data="logs"
            :columns="columns"
            :loading="loading"
            :footer="false"
          />
        </CardContent>

        <CardFooter class="py-4 w-full">
          <CustomPagination
            :pages="{
              current: pages.current,
              last: pages.last,
              total: pages.total,
            }"
            :select-page="applyFilter"
            :per_pages="perPage"
            @update:perPages="args => perPage = args"
          />
        </CardFooter>

        <CardFooter class="border-t" v-if="pages.total > 0">
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
        </CardFooter>
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
import {ref, computed, h, watch} from "vue";
import { getLocalTimeZone, today } from "@internationalized/date";
import moment from "moment";
import "moment/dist/locale/pt-br";
import { useToast } from "@/components/ui/toast/use-toast";
import { createColumnHelper } from "@tanstack/vue-table";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
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
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const perPage = ref(10)
const isPayloadModalOpen = ref(false);
const selectedPayload = ref<any>(null);
const formattedPayload = computed(() => {
  return selectedPayload.value
    ? JSON.stringify(selectedPayload.value, null, 2)
    : "Nenhum payload selecionado";
});

const handleSearch = () => {
  applyFilter(1);
};

watch(perPage,()=>applyFilter(1))
const applyFilter = async (page = pages.value.current) => {
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
      orderBy: order.value,
      orderDirection: direction.value ? "asc" : "desc",
      per_page: perPage.value
    });

    logs.value = data.logs.data;
    totalLogs.value = {
      processed: data.logs.total?.processed || 0,
      pending: data.logs.total?.pending || 0,
      failed: data.logs.total?.failed || 0,
    };
    pages.value = {
      current: data.logs.pagination.current_page,
      total: data.logs.pagination.total,
      last: data.logs.pagination.last_page,
    };
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

const columnHelper = createColumnHelper<PostbackLog>();

function createHeaderButton(label: string, columnKey: string) {
  return {
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: order.value === columnKey ? "default" : "ghost",
          onClick: () => {
            order.value = columnKey;
            direction.value = !direction.value;
            applyFilter();
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
    },
  };
}

const columns = [
  columnHelper.accessor("id", {
    ...createHeaderButton("ID", "id"),
    cell: ({ row }) => h("div", row.getValue("id")),
  }),
  columnHelper.accessor("type", {
    header: "Tipo",
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("type")),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      const color = {
        pending: "text-yellow-600",
        processed: "text-green-600",
        failed: "text-red-600",
      }[status as string];

      return h("div", { class: `capitalize ${color}` }, status);
    },
  }),
  columnHelper.accessor("created_at", {
    header: "Recebido em",
    cell: ({ row }) =>
      h(
        "div",
        moment(row.getValue("created_at")).format("DD/MM/YYYY HH:mm:ss")
      ),
  }),
  columnHelper.accessor("processed_at", {
    header: "Processado em",
    cell: ({ row }) => {
      const processedAt = row.getValue("processed_at");
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

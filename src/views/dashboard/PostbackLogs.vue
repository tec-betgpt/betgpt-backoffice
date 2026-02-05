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

    <div class="grid gap-4 md:grid-cols-3 sm:grid-cols-1">
      <Card v-if="loading" v-for="n in 3" :key="n">
        <div class="p-4 rounded shadow">
          <div class="flex justify-between items-center mb-2">
            <Skeleton class="h-4 w-1/3" />
            <Skeleton class="h-4 w-5" />
          </div>
          <Skeleton class="h-8 w-2/3 mb-2" />
        </div>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <div class="flex justify-between items-center">
            <Avatar class="mr-3 border-gray-900 bg-green-100 h-8 w-8 p-2" shape="square">
              <Check class="text-green-500-600" />
            </Avatar>
            <CardTitle class="text-md font-medium">Processados</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ totalLogs.processed }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <div class="flex justify-between items-center">
            <Avatar class="mr-3 bg-yellow-100 text-yellow-600 border-gray-900 h-8 w-8 p-2" shape="square">
              <Hourglass class="text-muted-foreground" />
            </Avatar>
            <CardTitle class="text-sm font-medium">Pendentes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ totalLogs.pending }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <div class="flex justify-between items-center">
            <Avatar class="mr-3 text-red-600 bg-red-100 border-gray-900 h-9 w-9 p-2" shape="square">
              <CircleX class="text-muted-foreground" />
            </Avatar>
            <CardTitle class="text-sm font-medium">Falhas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ totalLogs.failed }}
          </div>
        </CardContent>
      </Card>
    </div>

    <div>
      <Card class="w-full">
        <CardContent class="py-6 flex justify-end w-full flex-col sm:flex-row">
          <div class="flex gap-2">
            <Select v-model="selectedType">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="PostbackLogService.types.PLAYER">Cliente</SelectItem>
                <SelectItem :value="PostbackLogService.types.DEPOSIT">Entrada</SelectItem>
                <SelectItem :value="PostbackLogService.types.WITHDRAW">Saída</SelectItem>
                <SelectItem :value="PostbackLogService.types.LOGIN">Logins</SelectItem>
                <SelectItem :value="PostbackLogService.types.STATUS_CHANGE">Alteração de Status</SelectItem>
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
            <div>
              <Button @click="handleSearch" :disabled="loading" size="icon">
                <Search />
              </Button>
            </div>

          </div>
        </CardContent>

        <CardContent class="pb-6">
          <Table class="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="text-right">
                  <Button class="p-0" variant="ghost" @click="handleSort('created_at')">
                    Recebido em
                    <ArrowUp v-if="order === 'created_at' && direction" class="ml-2 h-4 w-4" />
                    <ArrowDown v-else-if="order === 'created_at' && !direction" class="ml-2 h-4 w-4" />
                    <CaretSortIcon v-else class="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead class="text-right">
                  <Button class="p-0" variant="ghost" @click="handleSort('processed_at')">
                    Processado em
                    <ArrowUp v-if="order === 'processed_at' && direction" class="ml-2 h-4 w-4" />
                    <ArrowDown v-else-if="order === 'processed_at' && !direction" class="ml-2 h-4 w-4" />
                    <CaretSortIcon v-else class="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead class="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody v-if="loading">
              <TableRow v-for="i in perPage" :key="i">
                <TableCell v-for="j in 5" :key="i">
                  <Skeleton :key="j" class="h-4 w-full bg-gray-300 my-1" />
                </TableCell>
              </TableRow>
            </TableBody>

            <TableBody v-else>
              <transition-group appear enter-active-class="enter-active" enter-from-class="enter" enter-to-class="enter-to">
                <TableRow v-for="(row, index) in logs" :key="row.id" :style="`--delay: ${getMs(index)}`">
                  <TableCell>
                    {{ getType(row.type) }}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" :class="getStatus(row.status).color">
                      {{ getStatus(row.status).name }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-right">
                    {{ $moment(row.created_at).format("DD/MM/YYYY HH:mm:ss") }}
                  </TableCell>
                  <TableCell class="text-right">
                    {{ row.processed_at ? $moment(row.processed_at).format("DD/MM/YYYY HH:mm:ss") : "-" }}
                  </TableCell>
                  <TableCell class="text-right">
                    <ShowDialogComponent :row="row" />
                  </TableCell>
                </TableRow>
              </transition-group>
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter>
          <CustomSimplePagination
            :current-page="currentPage"
            :per-page="perPage"
            @page-changed="fetchPostbackLogs"
            @update:per-page="(val) => perPage = val"
          />
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import {ArrowDown, ArrowUp, Check, Hourglass, Mail, Search, CircleX } from "lucide-vue-next";
import { CaretSortIcon } from "@radix-icons/vue";
import { getMs } from "@/filters/formatNumbers";
import { Spinner } from "@/components/ui/spinner";
import "moment/dist/locale/pt-br";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import PostbackLogService from "@/services/postbackLog";
import CustomSimplePagination from "@/components/custom/CustomSimplePagination.vue";
import ShowDialogComponent from "@/components/postback_logs/ShowDialogComponent.vue";
import {Skeleton} from "@/components/ui/skeleton";
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";

const { toast } = useToast();

const selectedRange = ref({ start: null, end: null });
const selectedType = ref<string>("all");
const selectedStatus = ref<string>("all");
const workspaceStore = useWorkspaceStore();
const loading = ref(false);
const logs = ref<PostbackLog[]>([]);
const totalLogs = ref({
  processed: 0,
  pending: 0,
  failed: 0,
});
const currentPage = ref(1);
const order = ref('id');
const direction = ref(false);
const perPage = ref(15);

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

  fetchPostbackLogs(currentPage.value);
};

const handleSearch = () => {
  fetchPostbackLogs(1);
};

const hasTotals = computed(() => {
  return (
    totalLogs.value.processed +
      totalLogs.value.pending +
      totalLogs.value.failed >
    0
  );
});

const fetchPostbackLogs = async (page = 1) => {
  loading.value = true;

  try {
    const response = await PostbackLogService.index({
      page: page,
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
      filter_id: workspaceStore.activeGroupProject!.id,
      type: selectedType.value,
      status: selectedStatus.value,
      orderBy: order.value,
      orderDirection: direction.value ? "asc" : "desc",
      per_page: perPage.value,
    });

    logs.value = response.logs.data;
    currentPage.value = response.logs.current_page;
    totalLogs.value = {
      processed: response.total.processed || 0,
      pending: response.total.pending || 0,
      failed: response.total.failed || 0,
    };
  } catch (error) {
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  }

  loading.value = false;
};

const getType = (type: string) => {
  const name = {
    deposit: "Depósito",
    withdraw: "Saque",
    player: "Cliente",
    status_change: "Alteração de Status",
  };

  return name[type as keyof typeof name] || type;
}

const getStatus = (status: string) => {
  const color = {
    pending: "text-yellow-600",
    processed: "text-green-600",
    failed: "text-red-600",
  };

  const name = {
    pending: "Pendente",
    processed: "Processado",
    failed: "Falha",
  };

  return {
    name: name[status as keyof typeof name],
    color: color[status as keyof typeof color],
  };
}

onMounted(async () => {
  //await fetchPostbackLogs()
})

watch(selectedRange, (value) => {
  if (value?.start && value?.end) {
    fetchPostbackLogs(1);
  }
});

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

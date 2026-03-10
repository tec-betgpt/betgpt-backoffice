<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Listas de Proteção</h2>
        <p class="text-muted-foreground">Gerencie os registros de proteção.</p>
      </div>

      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CreateDialogComponent :reload="fetchProtectionLists" />
      </div>
    </div>

    <Card>
      <CardHeader>
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <Label for="player_name">Jogador</Label>
            <Input
              id="player_name"
              v-model="filters.player_name"
              placeholder="Nome do jogador"
              @input="fetchProtectionLists(1)"
            />
          </div>
          <div class="flex-1">
            <Label for="protectionType">Tipo de Proteção</Label>
            <Select
              v-model="filters.event_type"
              @update:modelValue="fetchProtectionLists(1)"
            >
              <SelectTrigger id="protectionType">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forced">Forçada</SelectItem>
                <SelectItem value="exclusion">Exclusão</SelectItem>
                <SelectItem value="temp_suspension"
                  >Suspensão temporária</SelectItem
                >
              </SelectContent>
            </Select>
          </div>
          <div class="flex-1">
            <Label for="channel">Canal</Label>
            <Input
              id="channel"
              v-model="filters.channel"
              placeholder="Filtrar por canal"
              @input="fetchProtectionLists(1)"
            />
          </div>
          <div class="flex-1">
            <Label for="date">Data</Label>
            <DateRangePicker v-model="selectedRange" />
          </div>
          <div class="flex items-end">
            <Button variant="outline" @click="clearFilters"
              >Limpar Filtros</Button
            >
          </div>
        </div>
      </CardHeader>
      <CardContent class="py-4 flex flex-col gap-4">
        <Table class="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Jogador</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Movimentação</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="cursor-pointer select-none" @click="toggleSort">
                <div class="flex items-center gap-1">
                  Criado em
                  <ArrowUpDown v-if="!filters.orderDirection" class="h-4 w-4" />
                  <ArrowUp
                    v-else-if="filters.orderDirection === 'asc'"
                    class="h-4 w-4"
                  />
                  <ArrowDown v-else class="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <transition-group
              appear
              enter-active-class="enter-active"
              enter-from-class="enter"
              enter-to-class="enter-to"
            >
              <TableRow
                v-for="(row, index) in protectionLists"
                :key="row.id"
                :style="`--delay: ${getMs(index)}`"
              >
                <TableCell>
                  {{ row.player?.name }}
                </TableCell>
                <TableCell>
                  {{ eventTypeMap[row.event_type] || row.event_type }}
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="
                      row.dispatch_type === 'LP_ENTERED' ? 'default' : 'outline'
                    "
                    :class="
                      row.dispatch_type === 'LP_ENTERED'
                        ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
                        : 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100'
                    "
                  >
                    {{
                      dispatchTypeMap[row.dispatch_type] || row.dispatch_type
                    }}
                  </Badge>
                </TableCell>
                <TableCell>
                  {{ row.channel || "-" }}
                </TableCell>
                <TableCell class="whitespace-nowrap">
                  <span v-if="row.start_at"
                    >{{ $moment(row.start_at).format("DD/MM/YYYY") }} -
                    {{ $moment(row.end_at).format("DD/MM/YYYY") }}</span
                  >
                  <span v-else class="text-muted-foreground italic"> - </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" class="bg-blue-200 text-blue-800">
                    {{
                      row.user_id === null ? "Regra do Sistema" : "Regra Manual"
                    }}</Badge
                  >
                </TableCell>
                <TableCell>
                  {{ $moment(row.created_at).format("DD/MM/YYYY HH:mm") }}
                </TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" class="h-8 w-8 p-0">
                        <span class="sr-only">Abrir menu</span>
                        <MoreHorizontal class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        @click="$router.push({ name: 'clients.show', params: { id: row.player?.id } })"
                      >
                        <Eye class="mr-2 h-4 w-4" />
                        Ver Jogador
                      </DropdownMenuItem>

                      <DropdownMenuItem @click.prevent="openEdit(row)">
                        <Pencil class="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        @click.prevent="openDestroy(row)"
                        class="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash class="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </transition-group>

            <template v-if="isLoading">
              <TableRow v-for="i in 5" :key="i">
                <TableCell v-for="j in 8" :key="i">
                  <Skeleton :key="j" class="h-4 w-full bg-gray-300 my-1" />
                </TableCell>
              </TableRow>
            </template>

            <template
              v-if="!isLoading && (!protectionLists || !protectionLists.length)"
            >
              <TableRow>
                <TableCell :colspan="8" class="text-center py-5">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>

        <CustomPagination
          :select-page="fetchProtectionLists"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="(value) => (perPage = value)"
        />
      </CardContent>
    </Card>

    <!-- Diálogos fora do loop da tabela -->
    <EditDialogComponent
      ref="editDialogRef"
      :row="selectedRow"
      :reload="fetchProtectionLists"
    />
    <DestroyDialogComponent
      ref="destroyDialogRef"
      :destroy="destroy"
      :row="selectedRow"
      :reload="fetchProtectionLists"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, nextTick } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { getMs } from "@/filters/formatNumbers";
import { useWorkspaceStore } from "@/stores/workspace";
import ProtectionLists from "@/services/protectionLists";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CreateDialogComponent from "@/components/protection-lists/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/protection-lists/EditDialogComponent.vue";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-vue-next";

const { toast } = useToast();

const workspaceStore = useWorkspaceStore();
const protectionLists = ref([]);
const isLoading = ref(true);
const perPage = ref(15);
const pages = ref({
  current: 1,
  last: 1,
  total: 0,
});

const selectedRange = ref({ start: undefined, end: undefined });
const selectedRow = ref<any>(null);
const editDialogRef = ref<any>(null);
const destroyDialogRef = ref<any>(null);

const eventTypeMap = {
  forced: "Forçada",
  exclusion: "Exclusão",
  temp_suspension: "Suspensão Temporária",
};

const dispatchTypeMap = {
  LP_ENTERED: "Bloqueado",
  LP_EXITED: "Desbloqueado",
  LP_UPDATED: "Atualizando",
};

const filters = reactive({
  player_name: "",
  event_type: "",
  channel: "",
  orderBy: "created_at",
  orderDirection: "",
});

const openEdit = (row: any) => {
  selectedRow.value = row;
  setTimeout(() => {
    editDialogRef.value?.openDialog();
  }, 200);
};

const openDestroy = (row: any) => {
  selectedRow.value = row;
  setTimeout(() => {
    destroyDialogRef.value?.openDialog();
  }, 200);
};

const toggleSort = () => {
  if (filters.orderDirection === "") {
    filters.orderDirection = "asc";
  } else if (filters.orderDirection === "asc") {
    filters.orderDirection = "desc";
  } else {
    filters.orderDirection = "";
  }
  fetchProtectionLists(1);
};

const fetchProtectionLists = async (page = 1) => {
  isLoading.value = true;
  try {
    const params = {
      project_id: workspaceStore.activeGroupProject?.id!,
      page,
      per_page: perPage.value,
      ...filters,
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
    };

    Object.keys(params).forEach((key) => {
      if (
        params[key] === "" ||
        params[key] === null ||
        params[key] === undefined
      ) {
        delete params[key];
      }
    });

    const response = await ProtectionLists.index(params);

    protectionLists.value = response.data;
    pages.value = {
      current: response.current_page,
      last: response.last_page,
      total: response.total,
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

const destroy = async (id: number) => {
  try {
    await ProtectionLists.destroy(id);
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao remover os dados.",
      variant: "destructive",
    });
  }
};

const clearFilters = () => {
  filters.player_name = "";
  filters.event_type = "";
  filters.channel = "";
  filters.orderDirection = "";
  selectedRange.value = { start: undefined, end: undefined };
  fetchProtectionLists(1);
};

watch(selectedRange, () => {
  if (selectedRange.value.start && selectedRange.value.end) {
    fetchProtectionLists(1);
  }
});

onMounted(async () => {
  await fetchProtectionLists();
});
</script>

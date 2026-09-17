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
            <Input v-model="searchInput" type="text" placeholder="Pesquisar por nome, e-mail ou external id..." class="w-[300px]" @keydown.enter="handleSearch" />
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
            <ColumnVisibilityToggle
              v-model="columnVisibility"
              :columns="tableColumns"
              table="clients"
            />
          </div>
        </div>

        <div class="overflow-x-auto">
        <Table class="w-full">
          <TableHeader>
            <TableRow>
              <TableHead v-if="columnVisibility.nome !== false">
                <Button class="p-0" variant="ghost" @click="handleSort('name')">
                  Nome
                  <component :is="sortIcon('name')" class="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead v-if="columnVisibility.email !== false">
                <Button class="p-0" variant="ghost" @click="handleSort('email')">
                  E-mail
                  <component :is="sortIcon('email')" class="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead v-if="columnVisibility.referrerId !== false">
                <Button class="p-0" variant="ghost" @click="handleSort('referrer_id')">
                  Referrer ID
                  <component :is="sortIcon('referrer_id')" class="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead v-if="columnVisibility.criadoEm !== false" class="text-right">
                <Button class="p-0" variant="ghost" @click="handleSort('created_at')">
                  Criado em
                  <component :is="sortIcon('created_at')" class="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <template v-for="column in extraColumns" :key="column.id">
                <TableHead
                  v-if="columnVisibility[column.id] === true"
                  :class="column.align === 'right' ? 'text-right' : ''"
                >
                  <Button class="p-0" variant="ghost" @click="handleSort(column.key)">
                    {{ column.label }}
                    <component :is="sortIcon(column.key)" class="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </template>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="!isLoading">
            <TableRow v-for="row in players" :key="row.id">
              <TableCell v-if="columnVisibility.nome !== false">
                {{ row.name ?? 'Não Informado'}}
              </TableCell>
              <TableCell v-if="columnVisibility.email !== false">
                {{ row.email }}
              </TableCell>
              <TableCell v-if="columnVisibility.referrerId !== false">
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
              <TableCell v-if="columnVisibility.criadoEm !== false" class="text-right text-nowrap">
                {{ $moment(row.created_at).format('DD/MM/YYYY HH:mm') }}h
              </TableCell>
              <template v-for="column in extraColumns" :key="column.id">
                <TableCell
                  v-if="columnVisibility[column.id] === true"
                  :class="column.align === 'right' ? 'text-right text-nowrap' : 'text-nowrap'"
                >
                  {{ formatExtraCell(row, column) }}
                </TableCell>
              </template>
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
            </template>

            <template v-if="isLoading">
              <TableRow v-for="i in perPage" :key="'sk-'+i">
                <TableCell v-for="j in visibleTableColumns.length" :key="'sk-'+i+'-'+j">
                  <Skeleton class="h-4 w-full bg-gray-300 my-1" />
                </TableCell>
              </TableRow>
            </template>

            <template v-if="!isLoading && (!players || !players.length)">
              <TableRow>
                <TableCell :colspan="visibleTableColumns.length" class="text-center py-5">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
        </div>

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
import { ref, computed, onMounted, watch } from "vue";
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
import ColumnVisibilityToggle from "@/components/custom/ColumnVisibilityToggle.vue";
import { useRouter } from "vue-router";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth";
import moment from "moment";

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
  [key: string]: unknown;
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

type ExtraColumn = {
  id: string;
  label: string;
  key: string;
  type: "text" | "date" | "datetime" | "currency" | "number" | "percent" | "boolean";
  align?: "right";
  hiddenByDefault?: boolean;
};

const extraColumns: ExtraColumn[] = [
  { id: "externalId", label: "External ID", key: "external_id", type: "text", hiddenByDefault: true },
  { id: "cpf", label: "CPF / Documento", key: "cpf", type: "text", hiddenByDefault: true },
  { id: "phone", label: "Telefone", key: "phone", type: "text", hiddenByDefault: true },
  { id: "gender", label: "Gênero", key: "gender", type: "text", hiddenByDefault: true },
  { id: "birthday", label: "Data de nascimento", key: "birthday", type: "date", hiddenByDefault: true },
  { id: "zipCode", label: "CEP", key: "zip_code", type: "text", hiddenByDefault: true },
  { id: "street", label: "Rua", key: "street", type: "text", hiddenByDefault: true },
  { id: "addressNumber", label: "Número", key: "address_number", type: "text", hiddenByDefault: true },
  { id: "neighborhood", label: "Bairro", key: "neighborhood", type: "text", hiddenByDefault: true },
  { id: "city", label: "Cidade", key: "city", type: "text", hiddenByDefault: true },
  { id: "state", label: "Estado", key: "state", type: "text", hiddenByDefault: true },
  { id: "updatedAt", label: "Atualizado em", key: "updated_at", type: "datetime", align: "right", hiddenByDefault: true },
  { id: "projectStatus", label: "Status no projeto", key: "project_status", type: "text", hiddenByDefault: true },
  { id: "depositApproved", label: "Total depositado", key: "deposit_approved", type: "currency", align: "right", hiddenByDefault: true },
  { id: "depositPending", label: "Depósitos pendentes", key: "deposit_pending", type: "currency", align: "right", hiddenByDefault: true },
  { id: "depositQtyApproved", label: "Qtd. depósitos aprovados", key: "deposit_quantity_approved", type: "number", align: "right", hiddenByDefault: true },
  { id: "depositQtyPending", label: "Qtd. depósitos pendentes", key: "deposit_quantity_pending", type: "number", align: "right", hiddenByDefault: true },
  { id: "withdrawApproved", label: "Total sacado", key: "withdraw_approved", type: "currency", align: "right", hiddenByDefault: true },
  { id: "withdrawPending", label: "Saques pendentes", key: "withdraw_pending", type: "currency", align: "right", hiddenByDefault: true },
  { id: "withdrawQtyApproved", label: "Qtd. saques aprovados", key: "withdraw_quantity_approved", type: "number", align: "right", hiddenByDefault: true },
  { id: "withdrawQtyPending", label: "Qtd. saques pendentes", key: "withdraw_quantity_pending", type: "number", align: "right", hiddenByDefault: true },
  { id: "ggr", label: "GGR", key: "ggr", type: "currency", align: "right", hiddenByDefault: true },
  { id: "firstLoginAt", label: "Primeiro login", key: "first_login_at", type: "datetime", align: "right", hiddenByDefault: true },
  { id: "lastLoginAt", label: "Último login", key: "last_login_at", type: "datetime", align: "right", hiddenByDefault: true },
  { id: "firstDepositValue", label: "Valor FTD", key: "first_deposit_value", type: "currency", align: "right", hiddenByDefault: true },
  { id: "firstDepositDate", label: "Data FTD", key: "first_deposit_date", type: "date", align: "right", hiddenByDefault: true },
  { id: "firstWithdrawValue", label: "Valor do primeiro saque", key: "first_withdraw_value", type: "currency", align: "right", hiddenByDefault: true },
  { id: "firstWithdrawDate", label: "Data do primeiro saque", key: "first_withdraw_date", type: "date", align: "right", hiddenByDefault: true },
  { id: "lastDepositValue", label: "Valor do último depósito", key: "last_deposit_value", type: "currency", align: "right", hiddenByDefault: true },
  { id: "lastDepositDate", label: "Data do último depósito", key: "last_deposit_date", type: "datetime", align: "right", hiddenByDefault: true },
  { id: "lastWithdrawValue", label: "Valor do último saque", key: "last_withdraw_value", type: "currency", align: "right", hiddenByDefault: true },
  { id: "lastWithdrawDate", label: "Data do último saque", key: "last_withdraw_date", type: "datetime", align: "right", hiddenByDefault: true },
  { id: "averageTransactionValue", label: "Ticket médio", key: "average_transaction_value", type: "currency", align: "right", hiddenByDefault: true },
  { id: "transactionFrequency", label: "Frequência de depósitos", key: "transaction_frequency", type: "number", align: "right", hiddenByDefault: true },
  { id: "customerRetentionTime", label: "Tempo de retenção (dias)", key: "customer_retention_time", type: "number", align: "right", hiddenByDefault: true },
  { id: "retentionRate", label: "Taxa de retenção", key: "retention_rate", type: "percent", align: "right", hiddenByDefault: true },
  { id: "lastIp", label: "Último IP", key: "last_ip", type: "text", hiddenByDefault: true },
  { id: "lastDevice", label: "Dispositivo", key: "last_device", type: "text", hiddenByDefault: true },
  { id: "hasTags", label: "Possui tags", key: "has_tags", type: "boolean", hiddenByDefault: true },
  { id: "conset", label: "Consentimento", key: "conset", type: "boolean", hiddenByDefault: true },
];

const tableColumns = [
  { id: "nome", label: "Nome" },
  { id: "email", label: "E-mail" },
  { id: "referrerId", label: "Referrer ID" },
  { id: "criadoEm", label: "Criado em" },
  ...extraColumns.map(({ id, label }) => ({ id, label })),
  { id: "acoes", label: "Ações" },
];
const columnVisibility = ref<Record<string, boolean>>(
  Object.fromEntries(extraColumns.map((column) => [column.id, false])),
);
const visibleTableColumns = computed(() =>
  tableColumns.filter((c) => c.id === "acoes" || columnVisibility.value[c.id] !== false)
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(value);

const formatDate = (value: string) => {
  const raw = value.trim();
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly && !raw.includes("T") && raw.length <= 10) {
    return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  }

  const parsed = moment(raw);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY") : "—";
};

const formatDateTime = (value: string) => {
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : "—";
};

const formatGender = (gender?: string | null) => {
  const value = String(gender || "").toLowerCase().trim();
  if (["m", "male", "masculino"].includes(value)) return "Masculino";
  if (["f", "female", "feminino"].includes(value)) return "Feminino";
  return gender || "—";
};

const formatExtraCell = (row: Player, column: ExtraColumn) => {
  const raw = row[column.key as keyof Player] as unknown;
  if (raw === null || raw === undefined || raw === "") return "—";

  if (column.key === "gender") return formatGender(String(raw));

  switch (column.type) {
    case "currency":
      return formatCurrency(Number(raw) || 0);
    case "number":
      return formatNumber(Number(raw));
    case "percent":
      return `${formatNumber(Number(raw))}%`;
    case "date":
      return formatDate(String(raw));
    case "datetime":
      return formatDateTime(String(raw));
    case "boolean":
      return raw === true || raw === 1 || raw === "1" ? "Sim" : "Não";
    default:
      return String(raw);
  }
};

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
  isLoading.value = true;
  players.value = [];

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
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = async () => {
  searchValues.value = { search: searchInput.value.trim() };
  await fetchPlayers(1);

  if (players.value.length === 1 && canAccessClientManagement.value) {
    showPlayer(players.value[0].id);
  }
};

watch(selectedTagName, () => {
  fetchPlayers(1);
});

const sortIcon = (column: string) => {
  if (order.value !== column) return ChevronsUpDown;
  return direction.value ? ArrowUp : ArrowDown;
};

const handleSort = async (column: string) => {
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

  await fetchPlayers(currentPage.value);
};

onMounted(async () => {
  await fetchPlayers();
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

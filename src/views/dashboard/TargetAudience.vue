<template>
  <div class="space-y-6 p-10 max-[450px]:p-4 pb-16 w-full bg-slate-50/30 dark:bg-transparent min-h-screen transition-colors">
    <!-- Header -->
    <div class="w-full flex justify-between items-center max-sm:flex-col gap-4 text-foreground">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Dashboard de Públicos Alvo</h2>
        <p class="text-muted-foreground mt-1">
          Analise a performance e sincronização dos seus públicos entre o Elevate e plataformas de anúncios.
        </p>
      </div>

      <div class="w-full sm:w-auto flex justify-end">
        <Button @click="openCreateSheet" class="max-sm:w-full shadow-sm">
          <PlusIcon class="mr-2 h-4 w-4" />
          Novo Público Alvo
        </Button>
      </div>
    </div>

    <!-- KPIs Component -->
    <TargetAudienceKPIs :kpis="kpis" />

    <!-- Charts Component -->
    <TargetAudienceCharts 
      :bar-series="barChartSeries" 
      :bar-options="barChartOptions"
      :donut-series="donutChartSeries"
      :donut-options="donutChartOptions"
    />

    <!-- Data Tables in Tabs -->
    <Tabs v-model="activeTab" class="w-full text-foreground">
      <div class="flex justify-between items-center mb-4">
        <TabsList class="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="elevate">Elevate</TabsTrigger>
          <TabsTrigger value="meta">Meta Ads</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="elevate" class="mt-0">
        <Card class="shadow-sm">
          <CardHeader class="pb-3 border-b">
            <CardTitle class="text-lg">Gestão de Públicos Elevate</CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <CustomDataTable
              :loading="isLoading"
              :data="audiences"
              :columns="columns"
              :find="fetchAudiences"
              @row-click="handleRowClick"
              :search-fields="[{ key: 'name', placeholder: 'Buscar público Elevate...' }]"
              class="border-0"
            />
            <div class="p-4 border-t">
              <CustomPagination
                :select-page="fetchAudiences"
                :pages="pages"
                :per_pages="perPage"
                @update:perPages="args => (perPage = args)"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="meta" class="mt-0">
        <Card class="shadow-sm">
          <CardHeader class="pb-3 border-b">
            <CardTitle class="text-lg">Públicos no Meta Ads</CardTitle>
            <CardDescription>Lista de públicos customizados identificados na conta do Meta</CardDescription>
          </CardHeader>
          <CardContent class="p-0">
            <CustomDataTable
                :loading="isLoadingMeta"
                :data="metaAudiences"
                :columns="metaColumns"
                :find="fetchMetaAudiences"
                @row-click="handleMetaRowClick"
                :update-text="handleMetaName"
                :search-fields="[{ key: 'name', placeholder: 'Buscar público no Meta...' }]"
                class="border-0"
            />
            <div class="p-4 border-t">
              <CustomPagination 
                :select-page="fetchMetaAudiences"
                @update:per-pages="args => { perPageMeta = args; fetchMetaAudiences(); }"
                :per_pages="perPageMeta"
                :pages="pageMeta"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <!-- Dialogs -->
    <TargetAudienceDialog ref="targetAudienceDialogRef" @saved="fetchAudiences" />
    <TargetAudienceDetailsDialog ref="detailsDialogRef" @edit="openEditSheet" />
    <MetaAudienceDetailsDialog ref="metaDetailsDialogRef" />

    <AlertDialog v-model:open="showSyncConfirmDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Sincronização?</AlertDialogTitle>
          <AlertDialogDescription>
            Este público possui sincronizações externas ativas. 
            Ao sincronizar agora, ocorrerá uma <span class="font-bold text-slate-900 dark:text-white">substituição total</span> dos dados nos provedores configurados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="showSyncConfirmDialog = false">Cancelar</AlertDialogCancel>
          <AlertDialogAction @click="confirmSyncNow" class="bg-indigo-600 hover:bg-indigo-700 text-white">
            Sincronizar e Substituir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o público alvo
            e removerá seus dados de nossos servidores.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="showDeleteDialog = false">Cancelar</AlertDialogCancel>
          <AlertDialogAction @click="deleteTargetAudience" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { h, ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRoute } from 'vue-router';
import TargetAudience from "@/services/targetAudience";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlusIcon,
  MoreHorizontalIcon,
  RefreshCcwIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import TargetAudienceDialog from "@/components/target_audience/TargetAudienceDialog.vue";
import TargetAudienceKPIs from "@/components/target_audience/TargetAudienceKPIs.vue";
import TargetAudienceCharts from "@/components/target_audience/TargetAudienceCharts.vue";
import TargetAudienceDetailsDialog from "@/components/target_audience/TargetAudienceDetailsDialog.vue";
import MetaAudienceDetailsDialog from "@/components/target_audience/MetaAudienceDetailsDialog.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { createColumnHelper } from "@tanstack/vue-table";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const { toast } = useToast();
const isLoading = ref(false);
const targetAudienceDialogRef = ref();
const detailsDialogRef = ref();
const metaDetailsDialogRef = ref();
const showDeleteDialog = ref(false);
const showSyncConfirmDialog = ref(false);
const audienceToSync = ref<number | null>(null);
const activeTab = ref('elevate');
const audienceToDelete = ref<number | null>(null);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = computed(() => workspaceStore.activeGroupProject?.id ?? null);
let refreshInterval: any = null;

const handleSyncClick = (row: any) => {
  const syncs = row.syncs || [];
  console.log(syncs);
  if (Array.isArray(syncs) && syncs.length > 0) {
    audienceToSync.value = row.id;
    showSyncConfirmDialog.value = true;
  } else {
   reloadTargetAudience(row.id);
  }
};

const confirmSyncNow = () => {
  if (audienceToSync.value) {
    reloadTargetAudience(audienceToSync.value);
    showSyncConfirmDialog.value = false;
    audienceToSync.value = null;
  }
};

const kpis = ref({
  totalElevate: 0,
  activeSyncs: 0,
  metaReach: '0'
});

const barChartSeries = ref([
  { name: 'Tamanho Elevate', data: [] },
  { name: 'Alcance Meta Ads', data: [] }
]);

const barChartOptions = ref({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
  colors: ['#3b82f6', '#4f46e5'],
  plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  xaxis: {
    categories: [],
    labels: { style: { cssClass: 'text-xs font-medium fill-slate-500' } }
  },
  yaxis: { labels: { formatter: (val: number) => val >= 1000 ? (val / 1000) + 'K' : val, style: { cssClass: 'text-xs fill-slate-500' } } },
  fill: { opacity: 1 },
  tooltip: { y: { formatter: (val: number) => val.toLocaleString('pt-BR') + ' contatos' } },
  legend: { position: 'top', horizontalAlign: 'right' },
  grid: { strokeDashArray: 4, borderColor: '#e2e8f0' }
});

const donutChartSeries = ref([]);

const donutChartOptions = ref({
  chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
  labels: ['Sincronizado (Meta)', 'Apenas Elevate'],
  colors: ['#4f46e5', '#cbd5e1'],
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          name: { show: true, fontSize: '14px', color: '#64748b' },
          value: { show: true, fontSize: '24px', fontWeight: 600, color: '#0f172a' },
          total: { show: true, label: 'Total', color: '#64748b', fontSize: '14px' }
        }
      }
    }
  },
  dataLabels: { enabled: false },
  stroke: { width: 0 },
  legend: { position: 'bottom', horizontalAlign: 'center', fontSize: '13px', markers: { radius: 12 } }
});

const fetchDashboardStats = async (showLoading = true) => {
  if (!activeGroupProjectId.value) return;
  try {
    const response = await TargetAudience.dashboardStats({ filter_id: activeGroupProjectId.value });
    const data = response.data || response;
    
    if (data) {
      kpis.value = {
        totalElevate: data.kpis.total_elevate || 0,
        activeSyncs: data.kpis.active_syncs || 0,
        metaReach: formatLargeNumber(data.kpis.total_meta_reach || 0)
      };

      barChartSeries.value = [
        { name: 'Tamanho Elevate', data: data.charts.match_rate.elevate_series || [] },
        { name: 'Alcance Meta Ads', data: data.charts.match_rate.meta_series || [] }
      ];
      barChartOptions.value.xaxis.categories = data.charts.match_rate.categories || [];

      donutChartSeries.value = [
        data.charts.distribution.synced || 0, 
        data.charts.distribution.local_only || 0
      ];
    }
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
  }
};

const formatLargeNumber = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
  return val.toString();
};

// --- Lógica das Tabelas e Ações ---
const audiences = ref<Array<any>>([]);
const perPage = ref(10);
const isLoadingMeta = ref(false);
const metaAudiences = ref<Array<any>>([]);
const metaNameSearch = ref("");
const pageMeta = ref({ current: 1, total: 0, last:0 });
const perPageMeta = ref(10);
const pages = ref({ current: 1, total: 0, last: 0 });

const handleMetaName = (text: string) => {
  metaNameSearch.value = text;
};

const handleRowClick = (row: any) => {
  detailsDialogRef.value.open(row);
};

const handleMetaRowClick = (row: any) => {
  metaDetailsDialogRef.value.open(row);
};

const fetchMetaAudiences = async (page:number = 1, showLoading = true) => {
  if (!activeGroupProjectId.value) return;
  if (showLoading) isLoadingMeta.value = true;
  try {
    const params: any = { filter_id: activeGroupProjectId.value, page: page, per_page: perPageMeta.value, name: metaNameSearch.value };
    const response = await TargetAudience.metaList(params);
    metaAudiences.value = response.data || [];
    pageMeta.value.current = response.current_page;
    pageMeta.value.total = response.total;
    pageMeta.value.last = response.last_page;
    perPageMeta.value = response.per_page;
  } catch (error) {
    console.error("Error loading Meta audiences:", error);
    if (showLoading) {
      toast({ title: "Erro", description: "Não foi possível carregar os públicos do Meta Ads.", variant: "destructive" });
    }
  } finally {
    if (showLoading) isLoadingMeta.value = false;
  }
};

const fetchAudiences = async (current = pages.value.current, showLoading = true) => {
  if (!activeGroupProjectId.value) return;
  if (showLoading) isLoading.value = true;
  try {
    const params = { page: current, per_page: perPage.value, filter_id: activeGroupProjectId.value };
    const response = await TargetAudience.index(params);
    audiences.value = response.data || [];
    pages.value = { current: response.current_page, last: response.last_page, total: response.total };
  } catch (error) {
    console.error("Error loading target audiences:", error);
    if (showLoading) {
      toast({ title: "Erro", description: "Não foi possível carregar os públicos alvo.", variant: "destructive" });
    }
  } finally {
    if (showLoading) isLoading.value = false;
  }
};

const loadAllData = async (showLoading = true) => {
  if (!activeGroupProjectId.value) return;
  await Promise.all([
    fetchAudiences(1, showLoading), 
    fetchMetaAudiences(1, showLoading), 
    fetchDashboardStats(showLoading)
  ]);
};

const startRefreshInterval = () => {
  stopRefreshInterval();
  refreshInterval = setInterval(() => {
    loadAllData(false);
  }, 60000);
};

const stopRefreshInterval = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

watch(perPage, ()=> fetchAudiences(1));
watch(activeGroupProjectId, () => {
  loadAllData();
  startRefreshInterval();
});

const openCreateSheet = () => {
  targetAudienceDialogRef.value.open();
};

const openEditSheet = (audience) => {
  if (audience.segments && audience.segments.length > 0) {
    targetAudienceDialogRef.value.openWithSegment(audience.segments[0].id, audience.id);
    return;
  }
  targetAudienceDialogRef.value.open(audience.id);
};

const reloadTargetAudience = async (id: number) => {
  try {
    await TargetAudience.reload({id})
    toast({title:'Sucesso!',description:'Publico alvo recarregado'})
  }catch (error: any) {
    console.error(error);
    const message = error.response?.data.message || "Falha ao recarregar o Público alvo";
    toast({ 
      title: "Aviso", 
      description: message,
      variant: "destructive"
    });
  }
}

const deleteTargetAudience = async () => {
  if (!audienceToDelete.value) return;
  try {
    isLoading.value = true;
    await TargetAudience.destroy(audienceToDelete.value);
    toast({ title: "Sucesso!", description: "Público alvo excluído com sucesso." });
    await fetchAudiences();
  } catch (error) {
    console.error("Error deleting target audience:", error);
    toast({ title: "Erro", description: "Não foi possível excluir o público alvo.", variant: "destructive" });
  } finally {
    isLoading.value = false;
    showDeleteDialog.value = false;
    audienceToDelete.value = null;
  }
};

// --- Colunas das Tabelas ---
const columnHelper = createColumnHelper<any>();
const columns = [
  columnHelper.accessor("name", {
    header: "Nome",
    cell: ({ row }) => h("div", { class: "font-medium text-slate-900 dark:text-slate-100 capitalize" }, row.getValue("name")),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status || "processing";
      const statusMap: any = {
        processing: { label: "Processando", variant: "default", icon: Loader2Icon, spin: true },
        sending: { label: "Enviando", variant: "default", icon: RefreshCcwIcon, spin: true, class: "bg-blue-500 hover:bg-blue-600" },
        completed: { label: "Concluído", variant: "outline", icon: CheckCircle2Icon, class: "text-emerald-600 border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10" },
        error: { label: "Erro", variant: "destructive", icon: AlertCircleIcon },
      };
      const config = statusMap[status] || statusMap.processing;
      return h(Badge, { variant: config.variant, class: ["flex items-center gap-1.5 w-fit px-2 py-0.5", config.class] }, () => [
        h(config.icon, { class: ["h-3.5 w-3.5", config.spin ? "animate-spin" : ""] }),
        config.label
      ]);
    },
  }),
  columnHelper.accessor("description", {
    header: "Descrição",
    cell: ({ row }) => h("div", { class: "text-muted-foreground truncate max-w-[200px]" }, row.getValue("description") || "-"),
  }),
  columnHelper.accessor("players", {
    header: "Tamanho (Elevate)",
    cell: ({ row }) => h("div", { class: "font-semibold text-slate-900 dark:text-slate-200" }, (row.getValue("players") ?? 0).toLocaleString('pt-BR')),
  }),
  columnHelper.accessor("updated_at", {
    header: "Sincronização",
    cell: ({ row }) => {
      const dateValue = row.getValue("updated_at");
      const formattedDate = dateValue ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(dateValue)) : "-";

      const syncs = row.original.syncs || [];
      const hasSyncError = syncs.some((s: any) => s.status === 'error');

      return h("div", { class: "flex items-center gap-2" }, [
        hasSyncError ? h(Badge, { variant: "destructive", class: "h-5 px-1.5 text-[10px] uppercase animate-pulse shrink-0" }, "Erro Sync") : null,
        h("span", { class: "text-xs text-slate-500 dark:text-slate-400 truncate" }, formattedDate),
        h(Button, {
          variant: "outline",
          size: "icon",
          class: "h-7 w-7 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 shrink-0",
          onClick: (e) => { e.stopPropagation(); handleSyncClick(row.original); },
          title: "Sincronizar agora"
        }, [h(RefreshCcwIcon, { class: "h-3.5 w-3.5" })])
      ]);
    },
  }),
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => h(DropdownMenu, {}, [
      h(DropdownMenuTrigger, { asChild: true }, h(Button, { onClick: (e) => e.stopPropagation(), size: "icon", variant: "ghost", class: "h-8 w-8" }, [h(MoreHorizontalIcon, { class: "h-4 w-4" }), h("span", { class: "sr-only" }, "Ações")])),
      h(DropdownMenuContent, { align: "end" }, [
        h(DropdownMenuLabel, {}, "Ações"),
        h(DropdownMenuItem, { onClick: () => openEditSheet(row.original) }, "Editar Público"),
        h(DropdownMenuItem, { onClick: () => { audienceToDelete.value = row.original.id; showDeleteDialog.value = true; }, class: "text-destructive" }, "Excluir Definitivamente"),
      ]),
    ]),
  },
];

const metaColumnHelper = createColumnHelper<any>();
const metaColumns = [
  metaColumnHelper.accessor("name", {
    header: "Nome no Meta Ads",
    cell: ({ row }) => h("div", { class: "font-medium text-slate-900 dark:text-slate-100 capitalize" }, row.getValue("name")),
  }),
  metaColumnHelper.accessor("approximate_count_lower_bound", {
    header: "Alcance Estimado",
    cell: ({ row }) => {
      const lower = row.original.approximate_count_lower_bound;
      const upper = row.original.approximate_count_upper_bound;
      if(lower === -1 || upper === -1) return h("div", { class: "text-slate-500 dark:text-slate-400 italic text-xs" }, "Processando / Indisponível");
      return h("div", { class: "font-semibold text-indigo-700 dark:text-indigo-400" }, `${lower.toLocaleString('pt-BR')} - ${upper.toLocaleString('pt-BR')}`);
    },
  }),
  metaColumnHelper.accessor("time_created", {
    header: "Criado em",
    cell: ({ row }) => {
      const time = row.getValue("time_created");
      return h("div", { class: "text-sm text-slate-700 dark:text-slate-300" }, time ? new Date(time * 1000).toLocaleDateString("pt-BR") : "-");
    },
  }),
];

onMounted(async () => {
  await loadAllData();
  startRefreshInterval();
  
  const audienceIdToOpen = route.query.openAudienceId;
  if (audienceIdToOpen) { openEditSheet({ id: audienceIdToOpen }); }
});

onUnmounted(() => {
  stopRefreshInterval();
});
</script>

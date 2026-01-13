<template>
  <div class="space-y-6 sm:p-10 p-1 max-w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Relatórios</h2>
        <p class="text-muted-foreground">
          Gere e gerencie seus relatórios de dados.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <GenerateReportDialog @report-generated="fetchReports" />
      </div>
    </div>

    <Card class="w-full">
      <CardHeader>
        <CardTitle>Relatórios de Retorno do Projeto</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent class="mt-5">
        <CustomDataTable
            :data="projectReturnReports"
            :columns="projectReturnColumns"
            :loading="projectReturnLoading"
            :footer="false"
            :update-text="setProjectReturnSearch"
            :find="() => fetchProjectReturnReports(1)"
            :search-fields="[
              {
                key: 'channel_group',
                placeholder: 'Buscar por grupo de canal...',
                type:'select',
                label: 'Grupo de Canal',
                options: channelGroups,
                multiple:true
              },
            ]"
        />
      </CardContent>
      <CardFooter class="py-4 w-full">
        <CustomPagination
            :pages="{
              current: projectReturnPages.current,
              last: projectReturnPages.last,
              total: projectReturnPages.total,
            }"
            :select-page="fetchProjectReturnReports"
            @update:perPages="(value) => (projectReturnPerPages = value)"
            :per_pages="projectReturnPerPages"
        />
      </CardFooter>
    </Card>

    <div>
      <Card class="w-full">
        <CardHeader>
          <CardTitle>Lista de Relatórios</CardTitle>
        </CardHeader>

        <Separator />

        <CardContent class="mt-5">
          <CustomDataTable
            :data="reports"
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
            :select-page="fetchReports"
            @update:perPages="(value) => (perPages = value)"
            :per_pages="perPages"
          />
        </CardFooter>
      </Card>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = false">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle>
          <AlertDialogDescription>
            Esse procedimento não pode ser desfeito. O relatório será removido permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="showDeleteDialog = false">Cancelar</AlertDialogCancel>
          <AlertDialogAction class="bg-red-600" @click="confirmDelete()">Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, watch } from "vue";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast/use-toast";
import { createColumnHelper } from "@tanstack/vue-table";
import { MoreHorizontal, Download, Trash } from "lucide-vue-next";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import ReportsService from "@/services/reports";
import ConversionDefinitions from "@/services/conversionDefinitions";
import moment from "moment";
import "moment/dist/locale/pt-br";
import GenerateReportDialog from "@/components/reports/GenerateReportDialog.vue";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
} from "@/components/ui/alert-dialog";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {useWorkspaceStore} from "@/stores/workspace";

const { toast } = useToast();

type Report = {
  id: number;
  name: string;
  date: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
};

type ProjectReturnReport = {
  id: number;
  date: string;
  channel_group: string;
  channel_name: string;
  total_value: string;
  conversion_count: number;
};

const loading = ref(true);
const reports = ref<Report[]>([]);
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const perPages = ref(10);
const showDeleteDialog = ref(false);
const reportToDeleteId = ref<number | null>(null);
const workspaceStore = useWorkspaceStore();

const projectReturnLoading = ref(true);
const projectReturnReports = ref<ProjectReturnReport[]>([]);
const projectReturnPages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const projectReturnPerPages = ref(10);
const projectReturnSearchValues = ref({});
const isProjectReturnFirstLoad = ref(true);
const channelGroups = ref([])

const setProjectReturnSearch = (values: Record<string, string>) => {
  const searchParams: Record<string, string> = {};
  for (const key in values) {
    const newKey = key.replace(/search\[\d+\]\[(\w+)\]/, '$1');
    searchParams[newKey] = values[key];
  }
  projectReturnSearchValues.value = searchParams;
};


const fetchProjectReturnReports = async (page = 1) => {
  projectReturnLoading.value = true;
  try {
    const params = {
      page,
      per_page: projectReturnPerPages.value,
      project_id: workspaceStore.activeGroupProject.project_id,
      ...projectReturnSearchValues.value
    };
    const data = await ReportsService.projectReturnReports(params);
    projectReturnReports.value = data.data;
    projectReturnPages.value = {
      current: data.current_page,
      total: data.total,
      last: data.last_page,
    };
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível carregar os relatórios de retorno do projeto.",
      variant: "destructive",
    });
  } finally {
    projectReturnLoading.value = false;
  }
};


const fetchReports = async (page = 1) => {
  loading.value = true;
  try {
    const data = await ReportsService.index({ page, per_page: perPages.value, project_id: workspaceStore.activeGroupProject.project_id });
    reports.value = data.data;
    pages.value = {
      current: data.current_page,
      total: data.total,
      last: data.last_page,
    };
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível carregar os relatórios.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};
const fetchChannelGroups = async () => {
  try {
    const response = await ConversionDefinitions.channelGroups({ project_id: workspaceStore.activeGroupProject.project_id });
    channelGroups.value = response.data;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Falha ao buscar os grupos de canal.",
      variant: "destructive",
    });
  }
};

const downloadReport = (url:string) => {
  ReportsService.download(url);
  toast({
    title: "Download Iniciado",
    description: `O download do relatório foi iniciado.`,
  });
};

const promptDelete = (id: number) => {
  reportToDeleteId.value = id;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (reportToDeleteId.value === null) return;
  try {
    await ReportsService.destroy(reportToDeleteId.value);
    toast({
      title: "Sucesso",
      description: "Relatório removido com sucesso.",
    });
    await fetchReports(pages.value.current);
  } catch (error) {
     toast({
      title: "Erro",
      description: "Não foi possível remover o relatório.",
      variant: "destructive",
    });
  } finally {
    showDeleteDialog.value = false;
    reportToDeleteId.value = null;
  }
};


const columnHelper = createColumnHelper<Report>();
const projectReturnColumnHelper = createColumnHelper<ProjectReturnReport>();

const statusMapping = {
  pending: { text: "Pendente", variant: "outline" },
  processing: { text: "Processando", variant: "default" },
  completed: { text: "Concluído", variant: "secondary" },
  failed: { text: "Falhou", variant: "destructive" },
};

const projectReturnColumns = [
    projectReturnColumnHelper.accessor("date", {
        header: "Data",
        cell: ({ row }) => h("div", moment(row.original.date).format("DD/MM/YYYY")),
    }),
    projectReturnColumnHelper.accessor("channel_group", {
        header: "Grupo de Canal",
        cell: ({ row }) => h("div", row.original.channel_group),
    }),
    projectReturnColumnHelper.accessor("channel_name", {
        header: "Nome do Canal",
        cell: ({ row }) => h("div", row.original.channel_name),
    }),
    projectReturnColumnHelper.accessor("total_value", {
        header: "Valor Total",
        cell: ({ row }) => h("div", new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(row.original.total_value))),
    }),
    projectReturnColumnHelper.accessor("conversion_count", {
        header: "Conversões",
        cell: ({ row }) => h("div", row.original.conversion_count),
    }),
];

const columns = [
    columnHelper.accessor("name", {
  header: "Nome",
  cell: ({ row }) => h("div", row.original.name || 'N/A'),
}),
  columnHelper.accessor("date", {
    header: "Data de criação",
    cell: ({ row }) => h("div", moment(row.original.date).format("DD/MM/YYYY")),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => {
      const statusInfo = statusMapping[row.original.status] || { text: 'Desconhecido', variant: 'outline' };
      return h(Badge, { variant: statusInfo.variant }, () => statusInfo.text);
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => h("div", { class: "text-right" }, "Ações"),
    cell: ({ row }) =>
      h("div", { class: "relative text-right" }, [
        h(DropdownMenu, {}, () => [
          h(
            DropdownMenuTrigger,
            { asChild: true },
            h(Button, { size: "icon", variant: "ghost" }, () => [
              h(MoreHorizontal, { class: "h-4 w-4" }),
            ])
          ),
          h(DropdownMenuContent, { align: "end" }, () => [
            h(DropdownMenuLabel, {}, "Ações"),
            h(DropdownMenuSeparator),
            h(
              DropdownMenuItem,
              { onClick: () => downloadReport(row.original.url),disabled: row.original.status !== "completed" },
              [h(Download, { class: "mr-2 h-4 w-4",
              }), "Baixar"]
            ),
             h(
              DropdownMenuItem,
              {
                class: 'text-red-600',
                onClick: () => promptDelete(row.original.id)
              },
              [h(Trash, { class: "mr-2 h-4 w-4" }), "Remover"]
            ),
          ]),
        ]),
      ]),
  }),
];

watch(projectReturnPerPages, (newValue) => {
  if (!isProjectReturnFirstLoad.value && newValue) {
    fetchProjectReturnReports(1);
  }
});


onMounted(() => {
  fetchReports();
  fetchChannelGroups()
  fetchProjectReturnReports().then(() => {
    isProjectReturnFirstLoad.value = false;
  });
});
</script>

<style scoped>
/* Add any specific styles for this view here */
</style>
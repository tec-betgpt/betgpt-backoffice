<template>
  <div class="space-y-6 sm:p-10 p-1 max-w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Exportações de Dados</h2>
        <p class="text-muted-foreground">
          Aqui você pode exportar diferentes tipos de dados de um projeto.
        </p>
      </div>
    </div>
    <div class="grid grid-cols-1 gap-4 mb-6">
      <div>
        <div class=" ">
          <Badge
            class="flex-row flex gap-2 mt-2 items-center justify-between align-middle"
          >
            <span class="text-lg"> Segmentos </span>
            <div>
              <Button variant="secondary" @click="showDialog">
                <span>Exportar</span>
              </Button>
            </div>
          </Badge>
        </div>
      </div>
      <Card>
        <CardHeader class="flex flex-row w-full justify-between items-center">
          <CardTitle> Histórico </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomDataTable
            :loading="isLoading"
            :data="history"
            :columns="columnsHistory"
          />
          <CustomPagination :select-page="selectPage" :pages="pages" />
        </CardContent>
      </Card>
    </div>
  </div>
  <Dialog v-model:open="openDialog">
    <DialogContent class="max-h-[70dvh]">
      <DialogHeader>
        <DialogTitle> Selecione as opções para exportar </DialogTitle>
      </DialogHeader>

      <div v-if="isLoadingSeg" class="flex items-center justify-center py-8">
        <span>Carregando as opções...</span>
      </div>

      <div v-else>
        <div
          v-for="value in values"
          class="flex items-start justify-start align-top gap-2 mb-2"
        >
          <Checkbox
            :id="'opt-' + value.id"
            :checked="targetId.includes(value.id)"
            @update:checked="
              (check) =>
                check
                  ? targetId.push(value.id)
                  : targetId.splice(targetId.indexOf(value.id), 1)
            "
            :disabled="isExporting"
          />
          <Label :for="'opt-' + value.id">{{ value.name }}</Label>
        </div>
      </div>

      <DialogFooter class="flex flex-row justify-between items-center">
        <Button
          variant="outline"
          @click="targetId = []"
          :disabled="targetId.length === 0"
        >
          Limpar seleção
        </Button>
        <Button
          @click="exportData"
          :disabled="isExporting || targetId.length === 0"
        >
          <span v-if="!isExporting">Exportar</span>
          <span v-else>Exportando...</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import { h, onMounted, ref, watch, nextTick } from "vue";
import { Separator } from "@/components/ui/separator";
import { createColumnHelper } from "@tanstack/vue-table";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/stores/workspace";
import Export from "@/services/export";
import { Accordion } from "@/components/ui/accordion";
import { RefreshCcw } from "lucide-vue-next";
import { useRoute } from "vue-router";

import { createHeaderButton } from "@/components/custom/CustomHeaderButton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import Segments from "@/services/segments";
import { Sheet } from "@/components/ui/sheet";
import { Dialog, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const openDialog = ref(false);
const isLoading = ref(true);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const pages = ref({ current: 1, total: 0, last: 0 });
const paginate = ref(1);
const route = useRoute();
onMounted(async () => {
  await loadExportsHistory();

  if (route.query.type === "segments" && route.query.target_id) {
    const targetIds = Array.isArray(route.query.target_id)
      ? route.query.target_id.map((id) => Number(id))
      : [Number(route.query.target_id)];

    targetId.value = targetIds.filter((id) => !isNaN(id));

    if (targetId.value.length > 0) {
      await showDialog(true); // Passamos true para indicar que é auto-abertura
    }
  }
});
const loadExportsHistory = async () => {
  isLoading.value = true;
  const response = await Export.index({
    filter_id: activeGroupProjectId,
    page: paginate.value,
    per_page: 20,
  });

  history.value = response.data.history;
  pages.value = {
    current: response.data.pagination.current_page + 1,
    total: response.data.pagination.total,
    last: response.data.pagination.last_page,
  };
  isLoading.value = false;
};
const orderId = ref("");
const order = ref(false);
const history = ref([]);
const handlerOrder = () => {};
const selectPage = async (value) => {
  paginate.value = value;
  await loadExportsHistory();
};
const segmentColumnHelper = createColumnHelper<SegmentData>();
const columns = [
  segmentColumnHelper.accessor("name", {
    header({ column }) {
      return createHeaderButton(
        "Nome",
        "name",
        orderId.value,
        order.value,
        handlerOrder
      );
    },
    cell: ({ row }) => {
      return h("div", { class: "flex flex-col" }, [
        h("div", { class: "capitalize" }, row.getValue("name")),
        h(
          "div",
          {
            class: "text-xs text-muted-foreground mt-1 line-clamp-2",
            title: row.original.description,
          },
          row.original.description || "Sem descrição"
        ),
      ]);
    },
  }),
  {
    accessorKey: "total_contacts",
    header: "Total de Contatos",
    cell: ({ row }) => {
      const total = row.original.total_contacts;
      const hasContacts = total > 0;
      const lastExecuted = row.original.last_job_execute_at;

      return h(
        "div",
        {
          class: "flex items-center gap-2",
          onClick: hasContacts
            ? () => openContactsDialog(row.original.id)
            : undefined,
          style: {
            cursor: hasContacts ? "pointer" : "default",
            textDecoration: hasContacts ? "underline" : "none",
            opacity: hasContacts ? 1 : 0.5,
          },
        },
        [
          h("span", total || "0"),
          !lastExecuted &&
            h(
              "span",
              { class: "text-muted-foreground text-xs" },
              "(não executado)"
            ),
        ]
      );
    },
  },
  ,
  {
    accessorKey: "last_job_execute_at",
    header: "Última Atualização",
    cell: ({ row }) => {
      const date = row.original.last_job_execute_at;
      return h("div", { class: "flex items-center gap-2" }, [
        h("div", date ? formatDate(date) : "-"),
        h(
          Button,
          {
            variant: "ghost",
            size: "icon",
            class: "h-8 w-8",
            onClick: (e) => {
              e.stopPropagation();
              forceSegmentUpdate(row.original.id);
            },
            disabled: isUpdating.value === row.original.id,
          },
          [
            h(RefreshCcw, {
              class: "h-4 w-4",
              class: {
                "animate-spin": isUpdating.value === row.original.id,
              },
            }),
          ]
        ),
      ]);
    },
  },
];
const values = ref<Array<any>>([]);
const isLoadingSeg = ref(true);
const isExporting = ref(false);
const historyColumnHelper = createColumnHelper<HistoryData>();

const targetId = ref([]);
const exportData = async () => {
  try {
    isExporting.value = true;
    await Export.exportData({
      filter_id: activeGroupProjectId,
      type_export: "segment",
      target_id: targetId.value,
    });

    toast({
      title: "Sucesso",
      description: "Exportação iniciada...",
      variant: "default",
    });

    openDialog.value = false;
    await loadExportsHistory();
  } catch (error) {
    toast({
      title: "Erro",
      description: "Falha ao iniciar exportação",
      variant: "destructive",
    });
  } finally {
    isExporting.value = false;
  }
};
const fetchSegments = async (current: number = pages.value.current) => {
  try {
    isLoadingSeg.value = true;
    const params = {
      page: 1,
      filter_id: activeGroupProjectId,
      sort_by: orderId.value,
      sort_order: "asc",
      per_page: -1,
    };
    const response = await Segments.index(params);
    values.value = response.data.segments || [];
  } catch (error) {
    console.error("Error loading segments:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os segmentos",
      variant: "destructive",
    });
  } finally {
    isLoadingSeg.value = false;
  }
};
const columnsHistory = [
  historyColumnHelper.accessor("type", {
    header: "Tipo",
    cell: ({ row }) => {
      let label = "";
      if (row.original.type === "segment") {
        label = "Segmentos";
      }
      return h("span", { class: "capitalize" }, label);
    },
  }),

  historyColumnHelper.accessor("title", {
    header: "Titulo",
    cell: ({ row }) => {
      return h("span", { class: "capitalize" }, row.original.target_title);
    },
  }),

  historyColumnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let label = "";
      let color = "";
      let textColor = "";
      switch (status) {
        case "processing":
          label = "Processando";
          color = "bg-yellow-500";
          textColor = "text-black";
          break;
        case "ready":
          label = "Concluido";
          color = "bg-green-600";
          textColor = "text-white";
          break;
        case "expired":
          label = "Expirado";
          color = "bg-red-500";
          textColor = "text-white";
          break;
        default:
          label = "Desconhecido";
          color = "bg-foreground";
          break;
      }
      return h(Badge, { class: `font-medium ${color} ${textColor}` }, label);
    },
  }),

  // historyColumnHelper.accessor("filter", {
  //   header: "Filtros",
  //   cell: ({ row }) => {
  //     const filters = row.original.filter;
  //     return filters.length
  //         ? h("ul", { class: "text-xs text-muted-foreground list-disc pl-4" }, filters.map(f => h("li", f)))
  //         : h("span", { class: "text-muted-foreground" }, "Nenhum");
  //   },
  // }),

  historyColumnHelper.accessor("created_at", {
    header: "Data Exportação",
    cell: ({ row }) => {
      return h("span", {}, row.original.created_at.replace(/-/g, "/"));
    },
  }),
  historyColumnHelper.accessor("url", {
    header: "",
    cell: ({ row }) => {
      const url = row.original.url;
      const type = row.original.type;
      return url
        ? h(
            Button,
            {
              onClick: () => onDownload(url, type),
              target: "_blank",
            },
            "Download"
          )
        : h(
            Button,
            { variant: "ghost", class: "text-muted-foreground" },
            "Não disponível"
          );
    },
  }),
];

const onDownload = (url: string, type: string) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `relatorio${type}.csv`;
  anchor.style.display = "none";
  anchor.click();
  window.URL.revokeObjectURL(url);
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const showDialog = async (isAutoOpen = false) => {
  if (!isAutoOpen) {
    targetId.value = [];
  }

  await fetchSegments();
  openDialog.value = true;

  if (isAutoOpen && targetId.value.length > 0) {
    await nextTick();
    const firstSelectedId = targetId.value[0];
    const element = document.getElementById(`opt-${firstSelectedId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
};

watch(
  values,
  (newValues) => {
    if (newValues.length > 0 && targetId.value.length > 0) {
      const exists = newValues.some(
        (segment) => segment.id === targetId.value[0]
      );
      if (!exists) {
        targetId.value = [];
        toast({
          title: "Aviso",
          description: "O segmento selecionado não foi encontrado",
          variant: "default",
        });
      }
    }
  },
  { immediate: true }
);

interface SegmentData {
  id: number;
  name: string;
  description: string;
}

interface HistoryData {
  id: string;
  url: string;
  type: string;
  status: string;
  filter: Array<string>;
  user_id: number;
  created_at: string;
  target_title: string;
}
</script>

<style scoped></style>

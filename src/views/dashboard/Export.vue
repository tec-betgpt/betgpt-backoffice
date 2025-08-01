
<template>
<div class="space-y-6 sm:p-10 p-1 max-w-full">
  <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Exportação de dados</h2>
      <p class="text-muted-foreground">
        Aqui você pode exportar dados de um projeto.
      </p>
    </div>
  </div>
  <div class="grid grid-cols-1 gap-4 mb-6">
    <div>
      <div class=" ">

        <Badge class="flex-row flex gap-2 mt-2 items-center justify-between align-middle">

          <span class="text-lg">
            Segmentos
          </span>
          <div >
            <Button variant="secondary" @click="showDialog">
              <span>Exportar</span>
            </Button>
          </div>

        </Badge>
      </div>
    </div>
    <Card>
      <CardHeader class="flex  flex-row w-full justify-between items-center">
        <CardTitle>
          Histórico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CustomDataTable :loading="isLoading" :data="history" :columns="columnsHistory"/>
        <CustomPagination :select-page="selectPage" :pages="pages"/>
      </CardContent>
    </Card>
  </div>
</div>
<Dialog v-model:open="openDialog">
  <DialogContent class="max-h-[70dvh]" >
    <DialogHeader>
      <DialogTitle>
        Selecione os valores para exportar
      </DialogTitle>
    </DialogHeader>
    <div v-for="value in values" class="flex items-start justify-start align-top gap-2 ">
      <Checkbox :id="values.id"
                :checked="targetId.includes(value.id)"
                @update:checked="(check) => check? targetId.push(value.id): targetId.splice(targetId.indexOf(value.id), 1)"
      />
      <Label :for="values.id">{{value.name}}</Label>
    </div>
    <CustomPagination :select-page="selectPageSeg" :pages="pagesSeg"/>
    <DialogFooter>
      <Button @click="exportData">Exportar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
</template>
<script setup lang="ts">

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import {h, onMounted, ref, watch} from "vue";
import {Separator} from "@/components/ui/separator";
import {createColumnHelper} from "@tanstack/vue-table";
import {Button} from "@/components/ui/button";
import {useWorkspaceStore} from "@/stores/workspace";
import Export from "@/services/export";
import {Accordion} from "@/components/ui/accordion";
import { RefreshCcw} from "lucide-vue-next";

import {createHeaderButton} from "@/components/custom/CustomHeaderButton";
import {Badge} from "@/components/ui/badge";
import {toast} from "@/components/ui/toast";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import Segments from "@/services/segments";
import {Sheet} from "@/components/ui/sheet";
import {Dialog, DialogFooter, DialogHeader} from "@/components/ui/dialog";
import {Checkbox} from "@/components/ui/checkbox";

const openDialog = ref(false)
const isLoading = ref(true)
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const pages = ref({current:1,total:0,last:0})
const paginate = ref(0)
const paginateSeg = ref(1)
const pagesSeg = ref({current:1,total:0,last:0})
onMounted(()=>{
  exportTest()
})
const exportTest = async ()=>{
  isLoading.value = true
  const response = await Export.index({filter_id:activeGroupProjectId,paginate:paginate.value-1})

  history.value = response.data.history
  pages.value = {current: response.data.pagination.current_page+1,total: response.data.pagination.total,last: response.data.pagination.last_page}
  isLoading.value = false
  console.log(pages.value)
}
const orderId = ref("");
const order = ref(false);
const history = ref([])
const handlerOrder = ()=>{
}
const selectPage = (value)=>{
  paginate.value = value
  exportTest()
}
const selectPageSeg = (value)=>{
  fetchSegments(value)
}
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
const isLoadingSeg = ref(true)
const historyColumnHelper = createColumnHelper<HistoryData>();

const targetId = ref([])
const exportData = async ()=>{
  await Export.exportData({filter_id:activeGroupProjectId,type_export:"segment",target_id:targetId.value})
  toast({
    title:"Exportação iniciada"
  })
  exportTest()
}
const fetchSegments = async (current: number = pages.value.current) => {
  try {
    isLoadingSeg.value = true;
    const params = {
      page: current,
      filter_id: activeGroupProjectId,
      sort_by: orderId.value,
      sort_order: order.value ? "asc" : "desc",
    };
    const response = await Segments.index(params);
    values.value = response.data.segments || [];
    pagesSeg.value = {
      current: response.data.pagination.current_page,
      last: response.data.pagination.last_page,
      total: response.data.pagination.total,
    };


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
      let label = ""
      if (row.original.type === "segment") {
        label = "Segmetos"
      }
      return h("span", { class: "capitalize" }, label);
    },
  }),

  historyColumnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let label = "";
      let color = "";
      let textColor = ""
      switch (status) {
        case "processing":
          label = "Processando";
             color = "bg-yellow-500";
            textColor = "text-black"
          break;
        case "ready":
          label = "Concluido";
          color = "bg-green-600";
          textColor = "text-white"
          break;
        case "expired":
          label = "Expirado";
          color = "bg-red-500";
          textColor = "text-white"
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
    header: "Criado em",
    cell: ({ row }) => {
      return h("span", {}, row.original.created_at.replace(/-/g, '/'));
    },
  }),
  historyColumnHelper.accessor("url", {
    header: "",
    cell: ({ row }) => {
      const url = row.original.url;
      const type = row.original.type
      return url
          ? h(Button, {
            onClick: () => onDownload(url,type),
            target: "_blank",
          },"Download" )
          : h(Button, { variant: "ghost", class: "text-muted-foreground" }, "Não disponível");
    },
  }),

];

const onDownload = (url: string,type:string) => {
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

const showDialog = ()=>{
  targetId.value = []
  fetchSegments()
  openDialog.value = true

}
interface SegmentData {
  id: number;
  name: string;
  description: string;
}
interface HistoryData {
  id:string,
  url:string,
  type:string,
  status:string,
  filter:Array<string>,
  user_id:number,
  created_at:string
}

</script>

<style scoped>

</style>
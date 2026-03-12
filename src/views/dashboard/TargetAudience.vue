<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="w-full flex justify-between items-center max-sm:flex-col">
      <div class="space-y-0.">
        <h2 class="text-2xl font-bold tracking-tight">Gerenciar Públicos Alvo</h2>
        <p class="text-muted-foreground">
          Crie e gerencie seus públicos alvo.
        </p>
      </div>

      <div class="w-full flex max-sm:justify-center justify-end max-sm:flex-col gap-2 max-sm:mt-3 items-center">
        <Button @click="openCreateSheet" class="max-sm:w-full">
          <PlusIcon class="mr-2 h-4 w-4" />
          Novo Público Alvo
        </Button>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Públicos Alvo Elevate</CardTitle>
      </CardHeader>
      <CardContent class="py-4">
        <CustomDataTable
          :loading="isLoading"
          :data="audiences"
          :columns="columns"
          :find="fetchAudiences"
          :search-fields="[{ key: 'name', placeholder: 'Buscar por nome...' }]"
        />
        <CustomPagination
          class="mt-4"
          :select-page="fetchAudiences"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="args => (perPage = args)"
        />
      </CardContent>

    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Publico Alvo Meta Ads</CardTitle>
      </CardHeader>
      <CardContent class="py-4">
        <CustomDataTable
            :loading="isLoadingMeta"
            :data="metaAudiences"
            :columns="metaColumns"
            :find="fetchMetaAudiences"
            :update-text="handleMetaName"
            :search-fields="[{ key: 'name', placeholder: 'Buscar por nome...' }]"
        />
        <CustomPagination :select-page="fetchMetaAudiences"
                          @update:per-pages="args => {perPageMeta = args
                            fetchMetaAudiences()
                          }"
                          :per_pages="perPageMeta"
                          :pages="pageMeta"/>

      </CardContent>
    </Card>
    <TargetAudienceDialog ref="targetAudienceDialogRef" @saved="fetchAudiences" />

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
import { h, ref, onMounted, watch } from "vue";
import { useRoute } from 'vue-router';
import TargetAudience from "@/services/targetAudience";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusIcon,
  MoreHorizontalIcon,
  RefreshCcwIcon,
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
import { useWorkspaceStore } from "@/stores/workspace";
import { createColumnHelper } from "@tanstack/vue-table";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const { toast } = useToast();
const isLoading = ref(false);
const targetAudienceDialogRef = ref();
const showDeleteDialog = ref(false);
const audienceToDelete = ref<number | null>(null);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

const audiences = ref<Array<any>>([]);
const perPage = ref(10);

const isLoadingMeta = ref(false);
const metaAudiences = ref<Array<any>>([]);
const metaNameSearch = ref("");
const pageMeta = ref({
  current: 1,
  total: 0,
  last:0
});
const perPageMeta = ref(10);
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

const handleMetaName = (text: string) => {
  metaNameSearch.value = text;
};

const fetchMetaAudiences = async (page:number = 1) => {
  if (!activeGroupProjectId) return;
  isLoadingMeta.value = true;
  try {
    const params: any = {
      filter_id: activeGroupProjectId,
      page: page,
      per_page: perPageMeta.value,
      name: metaNameSearch.value
    };

    const response = await TargetAudience.metaList(params);
    metaAudiences.value = response.data || [];
    pageMeta.value.current = response.current_page;
    pageMeta.value.total = response.total;
    pageMeta.value.last = response.last_page;
    perPageMeta.value = response.per_page;
  } catch (error) {
    console.error("Error loading Meta audiences:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os públicos do Meta Ads.",
      variant: "destructive",
    });
  } finally {
    isLoadingMeta.value = false;
  }
};

const fetchAudiences = async (current = pages.value.current) => {
  if (!activeGroupProjectId) return;
  isLoading.value = true;
  try {
    const params = {
      page: current,
      per_page: perPage.value,
      filter_id: workspaceStore.activeGroupProject.id,
    };
    const response = await TargetAudience.index(params);
    audiences.value = response.data || [];
    pages.value = {
      current: response.current_page,
      last: response.last_page,
      total: response.total,
    };
  } catch (error) {
    console.error("Error loading target audiences:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os públicos alvo.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};
watch(perPage, ()=> fetchAudiences(1));

const openCreateSheet = () => {
  targetAudienceDialogRef.value.open();
};

const openEditSheet = (audience) => {

  if (audience.segments.length > 0) {
    targetAudienceDialogRef.value.openWithSegment(audience.segments[0].id,audience.id);
    return;
  }
  targetAudienceDialogRef.value.open(audience.id);
};

const confirmDelete = (id: number) => {
    audienceToDelete.value = id;
    showDeleteDialog.value = true;
};
const reloadTargetAudience = async (id: number) => {
  try {
    await TargetAudience.reload({id})
    toast({title:'Sucesso!',description:'Publico alvo recarregado'})
  }catch (error) {
    console.error(error);
    toast({
      title: "Erro",
      description: "Falha ao recarregar o Publicdo alvo",
    })
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
    toast({
      title: "Erro",
      description: "Não foi possível excluir o público alvo.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
    showDeleteDialog.value = false;
    audienceToDelete.value = null;
  }
};

const columnHelper = createColumnHelper<any>();
const columns = [
  columnHelper.accessor("name", {
    header: "Nome",
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  columnHelper.accessor("description", {
    header: "Descrição",
    cell: ({ row }) => h("div", {}, row.getValue("description") || "-"),
  }),
  columnHelper.accessor("segments", {
    header: "Segmento",
    cell: ({ row }) => {
      const segments = row.original.segments || row.original.segment;
      return h("div", {}, (Array.isArray(segments) && segments.length > 0) ? segments[0].name : "-");
    },
  }),
  columnHelper.accessor("players", {
    header: "Alvos",
    cell: ({ row }) => h("div", {}, row.getValue("players") ?? 0),
  }),
    columnHelper.accessor("duration", {
    header: "Duração (dias)",
    cell: ({ row }) => h("div", {}, row.getValue("duration") ? `${row.getValue("duration")} dias` : 'Permanente'),
  }),
  columnHelper.accessor("updated_at", {
    header: "Ultima atualização",
    cell: ({ row }) => {
      const dateValue = row.getValue("updated_at");
      const formattedDate = dateValue 
        ? new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(dateValue))
        : "-";

      return h("div", { class: "flex items-center gap-2" }, [
        h("span", {}, formattedDate),
        h(Button, {
          variant: "ghost",
          size: "icon",
          class: "h-8 w-8",
          onClick: () => reloadTargetAudience(row.original.id)
        }, [
          h(RefreshCcwIcon, { class: "h-4 w-4" })
        ])
      ]);
    },
  }),
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row }) => h(DropdownMenu, {}, [
      h(DropdownMenuTrigger, { asChild: true }, h(Button, { "aria-haspopup": "true", size: "icon", variant: "ghost" }, [h(MoreHorizontalIcon, { class: "h-4 w-4" }), h("span", { class: "sr-only" }, "Ações")])),
      h(DropdownMenuContent, { align: "end" }, [
        h(DropdownMenuLabel, {}, "Ações"),
        h(DropdownMenuItem, { onClick: () => openEditSheet(row.original) }, "Editar"),
        h(DropdownMenuItem, { onClick: () => confirmDelete(row.original.id), class: "text-destructive" }, "Excluir"),
      ]),
    ]),
  },
];

const metaColumnHelper = createColumnHelper<any>();
const metaColumns = [
  metaColumnHelper.accessor("name", {
    header: "Nome",
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  metaColumnHelper.accessor("description", {
    header: "Descrição",
    cell: ({ row }) => h("div", {}, row.getValue("description") || "-"),
  }),
  metaColumnHelper.accessor("approximate_count_lower_bound", {
    header: "Estimativa",
    cell: ({ row }) => {
      const lower = row.original.approximate_count_lower_bound;
      const upper = row.original.approximate_count_upper_bound;
      return h("div", {}, `(${lower}-${upper})`);
    },
  }),
  metaColumnHelper.accessor("time_created", {
    header: "Criado em",
    cell: ({ row }) => {
      const time = row.getValue("time_created");
      return h("div", {}, time ? new Date(time * 1000).toLocaleDateString("pt-BR") : "-");
    },
  }),
];

onMounted(async () => {
  await Promise.all([
    fetchAudiences(),
    fetchMetaAudiences()
  ]);
  
  const audienceIdToOpen = route.query.openAudienceId;
  if (audienceIdToOpen) {
    openEditSheet({ id: audienceIdToOpen });
  }
});

</script>

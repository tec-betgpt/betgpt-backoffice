<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="w-full flex justify-between items-center max-sm:flex-col">
      <div class="space-y-0.">
        <h2 class="text-2xl font-bold tracking-tight">Gerenciar Segmentos</h2>
        <p class="text-muted-foreground">
          Crie e gerencie segmentos dinâmicos com regras personalizadas.
        </p>
      </div>

      <div
        class="w-full flex max-sm:justify-center justify-end max-sm:flex-col gap-2 max-sm:mt-3 items-center"
      >
        <IAAnaliseButton />
        <Button v-if="canEditSegment" @click="openCreateModal" class="max-sm:w-full">
          <PlusIcon class="mr-2 h-4 w-4" />
          Novo Segmento
        </Button>
        <Button
          @click="openExportModal"
          :disabled="!exportSeg.length"
          class="max-sm:w-full"
        >
          <Download /> Exportar
          {{ exportSeg.length > 1 ? "Segmentos" : "Segmento" }}
        </Button>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Segmentos</CardTitle>
      </CardHeader>
      <CardContent class="py-4">
        <CustomDataTable
          :select="true"
          @update:selected="onSelectedChanged"
          :loading="isLoading"
          :data="segments"
          :columns="columns"
          :find="fetchSegments"
          :update-text="handleName"
          :search-fields="[{ key: 'name', placeholder: 'Buscar por nome...' }]"
        />

        <CustomPagination
          class="mt-4"
          :select-page="fetchSegments"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="(args) => (perPage = args)"
        />
      </CardContent>
    </Card>

    <SegmentDialog
      ref="segmentDialogRef"
      @saved="fetchSegments"
    />
    <SegmentContactsDialog ref="contactsDialogRef" />
    <SegmentExportDialog
      ref="segmentExportDialogRef"
      :segment-ids="exportSeg"
    />

    <Dialog v-model:open="showTagsDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Tags do Segmento</DialogTitle>
          <DialogDescription>
            Adicione ou remova etiquetas para organizar seus segmentos.
          </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <TagManager
            v-if="segmentForTags"
            :model-id="segmentForTags.id"
            model-type="targetAudience"
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" @click="showTagsDialog = false"
            >Fechar</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { h, ref, onMounted, watch, computed } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";

import IAAnaliseButton from "@/components/custom/IAAnaliseButton.vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDown,
  ArrowUp,
  RefreshCcw,
  Download,
} from "lucide-vue-next";
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
  PlusIcon,
  MoreHorizontalIcon,
} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import SegmentDialog from "@/components/segments/SegmentDialog.vue";
import SegmentExportDialog from "@/components/segments/SegmentExportDialog.vue";
import TagManager from "@/components/custom/TagManager.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import { createColumnHelper } from "@tanstack/vue-table";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import SegmentContactsDialog from "@/components/segments/SegmentContactsDialog.vue";
import { useAuthStore } from "@/stores/auth";
import TargetAudience from "@/services/targetAudience";

const { t } = useI18n();
const { toast } = useToast();
const router = useRouter();
const isLoading = ref(false);
const showTagsDialog = ref(false);
const segmentForTags = ref<any>(null);
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const activeGroupProjectId = computed(() => workspaceStore.activeGroupProject?.id ?? null);
const hasPermission = (permissionName: string) =>
  Boolean((authStore.user as any)?.roles?.some((role: any) =>
    role.permissions?.some((permission: any) => permission.name === permissionName),
  ));
const canEditSegment = computed(() => {
  return hasPermission("edit-segment");
});

const segmentDialogRef = ref();
const segmentExportDialogRef = ref();
const contactsDialogRef = ref();

const exportSeg = ref([]);
const segments = ref<Array<any>>([]);
const nameSegment = ref<Record<string, string>>({});
const orderId = ref("");
const order = ref(false);
const segmentColumnHelper = createColumnHelper<SegmentData>();
const isUpdating = ref<number | null>(null);
const perPage = ref(15);
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

interface SegmentData {
  id: number;
  name: string;
  description: string;
  total_contacts: number;
  last_job_execute_at: string;
  updated_at: string;
  audiences: any[];
  initial_contacts: any[];
}

const onSelectedChanged = (value) => {
  exportSeg.value = value.map((v) => v.id);
};

const openCreateModal = () => {
  segmentDialogRef.value.open(null, segments.value);
};

const openExportModal = () => {
  segmentExportDialogRef.value.open();
};

const handleName = (values: Record<string, string>) => {
  nameSegment.value = values;
};

function handlerOrder(column: string, direction: boolean) {
  if (column) {
    orderId.value = column;
    order.value = direction;
  }
  fetchSegments();
}

const fetchSegments = async (current: number = pages.value.current) => {
  isLoading.value = true;

  try {
    const searchParams = Object.keys(nameSegment.value).reduce(
        (acc, key) => {
          acc[key] = nameSegment.value[key];
          return acc;
        },
        {} as Record<string, string>,
    );
    const params = {
      is_segment: true,
      page: current,
      filter_id: activeGroupProjectId.value,
      ...searchParams,
      order_by: orderId.value,
      type_order: order.value ? "asc" : "desc",
      per_page: perPage.value,
    };

    const response = await TargetAudience.index(params);
    segments.value = response.target_audiences || [];

    segments.value = response.data.target_audiences || [];
    pages.value = {
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
  }

  isLoading.value = false;
};

const deleteSegment = async (segmentId: number) => {
  try {
    isLoading.value = true;
    await TargetAudience.destroy(segmentId);
    await fetchSegments();
    toast({
      title: "Sucesso",
      description: "Segmento removido com sucesso",
      variant: "default",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível remover o segmento",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = (segment: any) => {
  segmentDialogRef.value.open(segment, segments.value);
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("pt-BR", options);
};

const openContactsDialog = (segmentId: number) => {
  const segment = segments.value.find((s) => s.id === segmentId);

  if (!segment || segment.total_contacts <= 0) {
    toast({
      title: "Aviso",
      description: "Este segmento não possui contatos",
      variant: "default",
    });
    return;
  }

  contactsDialogRef.value.open(segmentId, segment.initial_contacts, segment.total_contacts)
};

const importSegment = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  try {
    const files = input.files;
    var f = [];
    for (const file of files) {
      const fileContent = await file.text();
      var json = JSON.parse(fileContent);
      if (Array.isArray(json)) {
        json.forEach((v) => f.push(v));
      } else {
        f.push(json);
      }
    }
    const importedForms = f.map((segmentData) => ({
      id: null,
      name: segmentData.name + " (Importado)",
      description: segmentData.description,
      globalOperator: segmentData.conditions.global_operator,
      conditionGroups: segmentData.conditions.groups.map((group: any) => ({
        name: "Grupo Importado",
        groupOperator: group.group_operator,
        fields: [],
        conditions: group.conditions.map((condition: any) => ({
          conditionOperator: condition.condition_operator,
          field: condition.field,
          operator: condition.operator,
          value: condition.value,
          modifier: condition.modifier || "exact",
          dateType: condition.dateType,
          dateModifier: condition.dateModifier,
          dateFilter: condition.dateFilter,
          daysOffset: condition.daysOffset,
        })),
      })),
    }));
    segmentDialogRef.value.importData(importedForms);
  } catch (error) {
    console.error("Error importing segment:", error);
    toast({
      title: "Erro",
      description: "Não foi possível importar o segmento. Verifique o arquivo.",
      variant: "destructive",
    });
  } finally {
    input.value = "";
  }
};

function createHeaderButton(label: string, columnKey: string, activeId: string, activeOrder: boolean, handler: Function) {
  return h(
    Button,
    {
      variant: activeId === columnKey ? "default" : "ghost",
      onClick: () => {
        handler(columnKey, !activeOrder);
      },
      class: "h-fit text-pretty my-1",
    },
    () => [
      label,
      h(
        activeId === columnKey
          ? activeOrder
            ? ArrowDown
            : ArrowUp
          : CaretSortIcon,
        { class: "ml-2 h-4 w-4" },
      ),
    ],
  );
}

const forceSegmentUpdate = async (segmentId: number) => {
  isUpdating.value = segmentId;
  try {
    toast({
      title: "Sucesso",
      description: "Atualização do segmento iniciada...",
      variant: "default",
    });
    await TargetAudience.reload({ id: segmentId });
  } catch (error) {
    toast({
      title: "Erro",
      description:
        error.response?.data?.message || "Falha ao forçar atualização",
      variant: "destructive",
    });
  } finally {
    isUpdating.value = null;
  }
};

function viewTargetAudience(segment) {
  if (segment.audiences && segment.audiences.length > 0) {
    const audienceId = segment.audiences[0].id;
    router.push({
      name: "target-audiences",
      query: { openAudienceId: audienceId },
    });
  }
}

function openTagsManager(segment) {
  segmentForTags.value = segment;
  showTagsDialog.value = true;
}

const columns = [
  segmentColumnHelper.accessor("name", {
    header({ column }) {
      return createHeaderButton(
        "Nome",
        "name",
        orderId.value,
        order.value,
        handlerOrder,
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
          row.original.description || "Sem descrição",
        ),
      ]);
    },
  }),
  {
    accessorKey: "players",
    header: "Total de Contatos",
    cell: ({ row }) => {
      const total = row.original.players;
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
              "(não executado)",
            ),
        ],
      );
    },
  },
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
          ],
        ),
      ]);
    },
  },
  {
    accessorKey: "updated_at",
    header: "Editado pela última vez",
    cell: ({ row }) => {
      const date = row.original.updated_at;
      return h("div", date ? formatDate(date) : "-");
    },
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const menuItems: any[] = [];
      if (canEditSegment.value) {
        menuItems.push(
          h(DropdownMenuItem, { onClick: () => handleEdit(row.original) }, "Editar"),
        );
      }
      if (row.original.audiences && row.original.audiences.length > 0) {
        menuItems.push(
          h(DropdownMenuItem, { onClick: () => viewTargetAudience(row.original) }, "Ver Publico Alvo"),
        );
      }
      if (canEditSegment.value) {
        menuItems.push(
          h(DropdownMenuItem, { onClick: () => openTagsManager(row.original) }, "Gerenciar Tags"),
          h(
            DropdownMenuItem,
            { onClick: () => deleteSegment(row.original.id) },
            h("div", { class: "flex items-center text-destructive" }, "Remover"),
          ),
        );
      }
      if (menuItems.length === 0) {
        return h("span", { class: "text-muted-foreground text-sm" }, "—");
      }
      return h(DropdownMenu, {}, [
        h(
          DropdownMenuTrigger,
          { asChild: true },
          h(
            Button,
            {
              "aria-haspopup": "true",
              size: "icon",
              variant: "ghost",
              disabled: isLoading.value,
            },
            [
              h(MoreHorizontalIcon, { class: "h-4 w-4" }),
              h("span", { class: "sr-only" }, "Ações"),
            ],
          ),
        ),
        h(DropdownMenuContent, { align: "end" }, [
          h(DropdownMenuLabel, {}, "Ações"),
          h(DropdownMenuSeparator, {}),
          ...menuItems,
        ]),
      ]);
    },
  },
];

onMounted(async () => await fetchSegments());

useScreenContext(
  "Tela de segmentos - Gerencia segmentos de audiência",
  () => ({
    "page": pages.value.current,
    "last_page": pages.value.last,
    "per_page": perPage.value,
  }),
  "/v1/target-audience"
);

watch(perPage, () => fetchSegments(1));
watch(activeGroupProjectId, () => fetchSegments(1));
</script>

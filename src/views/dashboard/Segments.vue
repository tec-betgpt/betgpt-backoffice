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
        <Button @click="openCreateModal" class="max-sm:w-full">
          <PlusIcon class="mr-2 h-4 w-4" />
          Novo Segmento
        </Button>
        <Button
          @click="showExport = true"
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

    <TargetAudienceDialog
      ref="targetAudienceDialogRef"
      @saved="fetchSegments"
    />

    <SegmentDialog
      ref="segmentDialogRef"
      @saved="fetchSegments"
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
            model-type="segment"
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
import { h, ref, onMounted, watch } from "vue";
import Segments from "@/services/segments";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDown,
  ArrowUp,
  RefreshCcw,
  UploadIcon,
  Download,
  Eye,
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  PlusIcon,
  XIcon,
  Trash2Icon,
  Loader2Icon,
  CalendarIcon,
  MoreHorizontalIcon,
  InfoIcon,
  CheckIcon,
  ChevronsUpDownIcon,
} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CustomDataInfinite from "@/components/custom/CustomDataInfinite.vue";
import TargetAudienceDialog from "@/components/target_audience/TargetAudienceDialog.vue";
import SegmentDialog from "@/components/segments/SegmentDialog.vue";
import TagManager from "@/components/custom/TagManager.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { createColumnHelper } from "@tanstack/vue-table";
import { useI18n } from "vue-i18n";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "vue-router";
import { RouterLink } from "vue-router";

const { t } = useI18n();
const { toast } = useToast();
const router = useRouter();
const isLoading = ref(false);
const currentSegment = ref(null);
const showExport = ref(false);
const showTagsDialog = ref(false);
const segmentForTags = ref<any>(null);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const listGroupProject = workspaceStore.group_projects.filter(
  (value) => value.id !== activeGroupProjectId,
);

const showContactsDialog = ref(false);
const isLoadingContacts = ref(false);
const hasMoreContacts = ref(false);
const currentContactsPage = ref(1);
const contacts = ref<any[]>([]);
const currentSegmentId = ref<number | null>(null);

const targetAudienceDialogRef = ref();
const segmentDialogRef = ref();

const exportSeg = ref([]);
const selectProjects = ref([]);

const segments = ref<Array<any>>([]);
const nameSegment = ref();
const orderId = ref("");
const order = ref(false);
const segmentColumnHelper = createColumnHelper<SegmentData>();
const perPage = ref(10);
interface SegmentData {
  id: number;
  name: string;
  description: string;
}
const onSelectedChanged = (value) => {
  exportSeg.value = value.map((v) => v.id);
};

const openCreateModal = () => {
  segmentDialogRef.value.open(null, segments.value);
};

const handleName = (text: string) => {
  nameSegment.value = text;
};

function handlerOrder(column: string, direction: boolean) {
  if (column) {
    orderId.value = column;
    order.value = direction;
  }
  fetchSegments();
}

const fetchSegments = async (current: number = pages.value.current) => {
  try {
    isLoading.value = true;
    const params = {
      page: current,
      filter_id: activeGroupProjectId,
      find_name: nameSegment.value,
      sort_by: orderId.value,
      sort_order: order.value ? "asc" : "desc",
      per_page: perPage.value,
    };
    const response = await Segments.index(params);
    segments.value = response.data.segments || [];
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
  } finally {
    isLoading.value = false;
  }
};
watch(perPage, () => fetchSegments(1));

const deleteSegment = async (segmentId: number) => {
  try {
    isLoading.value = true;
    await Segments.delete(segmentId);
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

const handleExportContacts = async () => {
  if (!currentSegmentId.value) {
    console.error("currentSegmentId is not defined");
    return;
  }

  router.push({
    name: "exports",
    query: {
      type: "segments",
      target_id: currentSegmentId.value,
    },
  });
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

const loadMoreContacts = async () => {
  if (!hasMoreContacts.value || isLoadingContacts.value) return;

  const nextPage = currentContactsPage.value + 1;
  await fetchContacts(nextPage);
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

  currentSegmentId.value = segmentId;
  showContactsDialog.value = true;

  contacts.value = segment.initial_contacts || [];
  currentContactsPage.value = 1;
  hasMoreContacts.value = segment.total_contacts > contacts.value.length;
};

const resetContactsData = () => {
  contacts.value = [];
  currentContactsPage.value = 1;
  hasMoreContacts.value = false;
};

const exportSegment = async () => {
  try {
    await Segments.export({
      project_id: activeGroupProjectId,
      segment_ids: exportSeg.value,
      target_project_ids: selectProjects.value,
    });
    toast({
      title: "Exportação iniciada",
      description: "Exportação do Segmento em andamento...",
      variant: "default",
    });

    showExport.value = false;
    toast({
      title: "Sucesso",
      description: "Segmento exportado com sucesso",
      variant: "default",
    });
  } catch (error) {
    console.error("Error exporting segment:", error);
    toast({
      title: "Erro",
      description: "Não foi possível exportar o segmento",
      variant: "destructive",
    });
  }
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
        fields: [], // Será preenchido pelo diálogo ao abrir
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

const getInitialContacts = (segmentId: number) => {
  const segment = segments.value.find((s) => s.id === segmentId);
  return segment?.initial_contacts || [];
};

const orderContacts = ref();
const directionContacts = ref(false);
const columnHelperContacts = createColumnHelper<User>();
function createHeaderButton(label: string, columnKey: string) {
  return h(
    Button,
    {
      variant: orderContacts.value === columnKey ? "default" : "ghost",
      onClick: () => {
        orderContacts.value = columnKey;
        directionContacts.value = !directionContacts.value;
        fetchContacts(1);
      },
      class: "h-fit text-pretty my-1",
    },
    () => [
      label,
      h(
        orderContacts.value === columnKey
          ? directionContacts.value
            ? ArrowDown
            : ArrowUp
          : CaretSortIcon,
        { class: "" },
      ),
    ],
  );
}

const searchValues = ref<Record<string, string>>({});
const setSearch = (values: Record<string, string>) => {
  searchValues.value = values;
};

const fetchContacts = async (page: number) => {
  if (!currentSegmentId.value) return;

  isLoadingContacts.value = true;

  try {
    const searchParams = Object.keys(searchValues.value).reduce(
      (acc, key) => {
        if (searchValues.value[key]) {
          acc[key] = searchValues.value[key];
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const response = await Segments.contacts(currentSegmentId.value, {
      page,
      perPage: 20,
      ...searchParams,
      orderBy: orderContacts.value || "id",
      orderDirection: directionContacts.value ? "asc" : "desc",
    });

    if (page === 1) {
      contacts.value = response.data.players;
    } else {
      contacts.value = [...contacts.value, ...response.data.players];
    }

    hasMoreContacts.value = response.data.hasMore;
    currentContactsPage.value = page; // Atualiza a página atual

    if (page === 1) {
      const segmentIndex = segments.value.findIndex(
        (s) => s.id === currentSegmentId.value,
      );
      if (segmentIndex !== -1) {
        segments.value[segmentIndex].initial_contacts = [
          ...response.data.players,
        ];
      }
    }
  } catch (error) {
    console.error("Error loading contacts:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os contatos",
      variant: "destructive",
    });
  } finally {
    isLoadingContacts.value = false;
  }
};

const isUpdating = ref<number | null>(null);

const forceSegmentUpdate = async (segmentId: number) => {
  isUpdating.value = segmentId;
  try {
    toast({
      title: "Sucesso",
      description: "Atualização do segmento iniciada...",
      variant: "default",
    });
    await Segments.forceUpdate(segmentId);
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

function createTargetAudience(segment) {
  targetAudienceDialogRef.value.openWithSegment(segment.id);
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
              "(não executado)",
            ),
        ],
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
          h(
            DropdownMenuItem,
            {
              onClick: () => handleEdit(row.original),
            },
            "Editar",
          ),
          row.original.audiences && row.original.audiences.length > 0
            ? h(
                DropdownMenuItem,
                { onClick: () => viewTargetAudience(row.original) },
                "Ver Publico Alvo",
              )
            : h(
                DropdownMenuItem,
                { onClick: () => createTargetAudience(row.original) },
                "Criar Publico Alvo",
              ),
          h(
            DropdownMenuItem,
            { onClick: () => openTagsManager(row.original) },
            "Gerenciar Tags",
          ),
          h(
            DropdownMenuItem,
            {
              onClick: () => deleteSegment(row.original.id),
            },
            h(
              "div",
              { class: "flex items-center text-destructive" },
              "Remover",
            ),
          ),
        ]),
      ]);
    },
  },
];

const contactsColumns = [
  columnHelperContacts.accessor("id", {
    header({ column }) {
      return createHeaderButton("ID", "id");
    },
    cell: ({ row }) => h("div", {}, row.original.id),
  }),
  columnHelperContacts.accessor("name", {
    header({ column }) {
      return createHeaderButton("Nome", "name");
    },
    cell: ({ row }) =>
      h("div", { class: "capitalize" }, `${row.original.name}`),
  }),
  columnHelperContacts.accessor("email", {
    header({ column }) {
      return createHeaderButton("E-mail", "email");
    },
    cell: ({ row }) => h("div", {}, row.original.email),
  }),
  columnHelperContacts.display({
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      return h(
        RouterLink,
        {
          to: { name: "clients.show", params: { id: row.original.id } },
          target: "_blank",
          class:
            "inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent",
          title: "Ver detalhes do cliente",
        },
        {
          default: () => h(Eye, { class: "h-4 w-4" }),
        },
      );
    },
  }),
];

const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

onMounted(async () => {
  isLoading.value = true;
  try {
    await fetchSegments();
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    isLoading.value = false;
  }
});




</script>

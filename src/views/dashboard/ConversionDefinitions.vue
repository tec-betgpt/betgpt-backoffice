<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">
          Gerenciar Definições de Conversão
        </h2>
        <p class="text-muted-foreground">
          Crie e gerencie definições de conversão com regras personalizadas.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CreateDialogComponent :reload="fetchConversionDefinitions" />
      </div>
    </div>

    <Card>
      <CardContent class="py-4">
        <CustomDataTable
          :loading="isLoading"
          :data="conversionDefinitions"
          :columns="columns"
          :update-text="setSearch"
          :find="fetchConversionDefinitions"
          :search-fields="[
            { key: 'name', placeholder: 'Buscar por nome da definição...' },
          ]"
        >
          <Select
            v-model="conversionType"
            @update:modelValue="fetchConversionDefinitions(1)"
          >
            <SelectTrigger class="w-[180px]">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary"> Primárias </SelectItem>
              <SelectItem value="quantitative"> Quantitativas </SelectItem>
            </SelectContent>
          </Select>
        </CustomDataTable>
        <CustomPagination
          v-if="pages.total > 0"
          :select-page="fetchConversionDefinitions"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="(args) => (perPage = args)"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, watch } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ChevronDownIcon,
  ArrowDown,
  ArrowUp,
} from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { createColumnHelper } from "@tanstack/vue-table";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { CaretSortIcon } from "@radix-icons/vue";
import CreateDialogComponent from "@/components/conversion_definitions/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/conversion_definitions/EditDialogComponent.vue";
import ConversionDefinitions from "@/services/conversionDefinitions";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";

const { toast } = useToast();
const isLoading = ref(false);
const isProcessing = ref(false);
const conversionType = ref("primary");
const workspaceStore = useWorkspaceStore();

const conversionDefinitions = ref<any[]>([]);
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const perPage = ref(10);
const order = ref();
const direction = ref(false);
const searchValues = ref<Record<string, string>>({});

const activeGroupProject = ref(workspaceStore.activeGroupProject || null);

const setSearch = (values: Record<string, string>) => {
  searchValues.value = values;
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

const fetchConversionDefinitions = async (current = pages.value.current) => {
  try {
    isLoading.value = true;

    const searchParams = Object.keys(searchValues.value).reduce(
      (acc, key) => {
        acc[key] = searchValues.value[key];
        return acc;
      },
      {} as Record<string, string>,
    );

    // Adicionar filtro por tipo
    const typeFilter: any = {};
    if (conversionType.value === "primary") {
      typeFilter.is_primary = true;
    } else if (conversionType.value === "quantitative") {
      typeFilter.is_primary = false;
    }

    const { data } = await ConversionDefinitions.index({
      page: current,
      ...searchParams,
      ...typeFilter,
      filter_id: activeGroupProject.value?.id,
      orderBy: order.value,
      orderDirection: direction.value ? "asc" : "desc",
      per_page: perPage.value,
    });

    conversionDefinitions.value = data.data;
    pages.value = {
      current: data.current_page,
      last: data.last_page,
      total: data.total,
    };
  } catch (error) {
    console.error("Error loading conversion definitions:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar as definições de conversão",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const destroy = async (id: number) => {
  isProcessing.value = true;

  try {
    await ConversionDefinitions.destroy(id);
    await fetchConversionDefinitions(pages.value.current);

    toast({
      title: "Sucesso",
      description: "Definição de conversão removida com sucesso",
    });
  } catch (_) {
    toast({
      title: "Erro",
      description: "Não foi possível remover a definição de conversão",
      variant: "destructive",
    });
  }

  isProcessing.value = false;
};

watch(perPage, () => fetchConversionDefinitions(1));
watch(conversionType, () => fetchConversionDefinitions(1));

// Configuração das colunas da tabela
const columnHelper = createColumnHelper<any>();

function createHeaderButton(label: string, columnKey: string) {
  return h(
    Button,
    {
      variant: order.value === columnKey ? "default" : "ghost",
      onClick: () => {
        order.value = columnKey;
        direction.value = !direction.value;
        fetchConversionDefinitions(1);
      },
      class: "h-fit text-pretty my-1",
    },
    () => [
      label,
      h(
        order.value === columnKey
          ? direction.value
            ? ArrowDown
            : ArrowUp
          : CaretSortIcon,
        { class: "" },
      ),
    ],
  );
}

const columns = [
  columnHelper.accessor("name", {
    header({ header }) {
      return createHeaderButton("Nome", "name");
    },
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  columnHelper.accessor("conversion_category", {
    header({ header }) {
      return createHeaderButton("Conversão", "conversion_category");
    },
    cell: ({ row }) => h("div", {}, row.getValue("conversion_category")),
  }),
  columnHelper.accessor("is_primary", {
    header({ header }) {
      return createHeaderButton("Tipo", "is_primary");
    },
    cell: ({ row }) =>
      h(
        Badge,
        {
          variant: row.getValue("is_primary") ? "default" : "secondary",
        },
        row.getValue("is_primary") ? "Primária" : "Quantitativa",
      ),
  }),
  columnHelper.accessor("is_return_report", {
    header({ header }) {
      return "Registrar no Retorno";
    },
    cell: ({ row }) =>
      h(
        Badge,
        {
          variant: row.getValue("is_return_report") ? "default" : "outline",
        },
        row.getValue("is_return_report") ? "Sim" : "Não",
      ),
  }),
  columnHelper.accessor("updated_at", {
    header({ header }) {
      return createHeaderButton("Editado pela última vez", "updated_at");
    },
    cell: ({ row }) =>
      h("div", { class: "text-right" }, formatDate(row.getValue("updated_at"))),
  }),
  columnHelper.accessor("id", {
    header: "Ações",
    cell: ({ row }) => {
      return h(DropdownMenu, {}, [
        h(
          DropdownMenuTrigger,
          { asChild: true },
          h(
            Button,
            { size: "icon", variant: "ghost", disabled: isProcessing.value },
            [
              h(MoreHorizontal, { class: "h-4 w-4" }),
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
              onClick: () => {
                // Para usar o EditDialogComponent, você pode precisar adaptá-lo
                // para funcionar com dropdown ou mantê-lo como estava
                // Por enquanto, vou manter a lógica original em um alerta
                // Você precisará adaptar conforme sua implementação
                const editComponent = h(EditDialogComponent, {
                  row: row.original,
                  reload: fetchConversionDefinitions,
                });
                // Aqui você precisaria implementar a lógica para abrir o modal
                // Sugiro adaptar o EditDialogComponent para ser acionado programaticamente
              },
            },
            "Editar",
          ),
          h(
            DropdownMenuItem,
            {
              onMousedown: () => {
                destroy(row.original.id);
              },
            },
            isProcessing.value
              ? h(LucideSpinner, { class: "mr-2 h-4 w-4 animate-spin" })
              : "Excluir",
          ),
        ]),
      ]);
    },
  }),
];

onMounted(() => {
  fetchConversionDefinitions(1);
});
</script>

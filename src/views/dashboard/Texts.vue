<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">MyElevate Insights</h2>
      <p class="text-muted-foreground">
        Gerencie os insights e edite informações.
      </p>
    </div>
    <Card>
      <CardContent class="py-4">
        <CustomDataTable
          :loading="isLoading"
          :data="valuesTable"
          :columns="columns"
          :update-text="setSearch"
          :find="fetchMessages"
          :search-fields="[
            { key: 'message', placeholder: 'Buscar por texto motivacional...' },
          ]"
        />

        <CustomPagination :select-page="fetchMessages"
                          :pages="pages"
                          :per-pages="perPage"
                          @update:perPages="(value) => perPage = value"

        />
      </CardContent>
      <CardFooter>
        <Button @click="openModal()">
          {{ loadingSave ? "Carregando..." : "Novo Texto" }}
        </Button>
      </CardFooter>
    </Card>

    <Sheet v-model:open="showModal">
      <SheetContent position="right" size="lg">
        <SheetHeader>
          <SheetTitle>
            {{ isEditing ? "Editar Texto" : "Novo Texto" }}
          </SheetTitle>
          <SheetDescription>
            {{
              isEditing ? "Edite as informações do Texto" : "Crie um novo Texto"
            }}
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="isEditing ? edit(isEditing) : submit()">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="name">Texto</Label>
              <Input
                id="name"
                v-model="form.message"
                placeholder="Digite o Texto"
                class="col-span-3"
                required
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="name">Assinatura</Label>
              <Input
                id="name"
                v-model="form.signature"
                placeholder="Digite a Assinatura"
                class="col-span-3"
                required
              />
            </div>
          </div>
          <SheetFooter>
            <Button type="submit" :disabled="loading">
              <LucideSpinner v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              {{
                loading ? "Salvando..." : isEditing ? "Salvar" : "Criar Texto"
              }}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import {h, onMounted, ref, watch} from "vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Insights from "@/services/insights";
import { ArrowDown, ArrowUp, MoreHorizontal, X } from "lucide-vue-next";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import i18n from "@/i18n";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { createColumnHelper } from "@tanstack/vue-table";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import { CaretSortIcon } from "@radix-icons/vue";

const { toast } = useToast();

const valuesTable = ref([]);
const form = ref({
  message: "",
  signature: "",
})

const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const perPage = ref(10);
const showModal = ref(false);
const isLoading = ref(true);
const loading = ref(false);
const loadingSave = ref(false);
const loadingRemove = ref(false);
const isEditing = ref(false);
const order = ref();
const direction = ref(false);

async function fetchMessages(pageId: number = pages.value.current) {
  isLoading.value = true;

  try {
    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      acc[key] = searchValues.value[key];
      return acc;
    }, {} as Record<string, string>);

    const data = await Insights.index({
      page: pageId,
      ...searchParams,
      orderBy: order.value,
      orderDirection: direction.value ? "asc" : "desc",
      per_page: perPage.value,
    })

    pages.value.current = data.data.current_page;
    pages.value.total = data.data.total;
    pages.value.last = data.data.last_page;
    valuesTable.value = data.data.data;
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
  }

  isLoading.value = false;
}

watch(perPage,()=>fetchMessages(1))
async function submit() {
  loading.value = true;

  try {
    const data = await Insights.store(form.value)

    resetForm();
    toast({
      title: i18n.global.t("success"),
      description: i18n.global.t(data.message),
      duration: 3000,
    });
    await fetchMessages();
  } catch (error) {
    console.error("Erro ao enviar formulário:", error);
    toast({
      title: i18n.global.t("error"),
      description: i18n.global.t(error.response.data.message),
      duration: 3000,
      variant: "destructive",
    });
  }

  loading.value = false;
  showModal.value = false;
}

const searchValues = ref<Record<string, string>>({});
const setSearch = (values: Record<string, string>) => {
  searchValues.value = values;
};

async function remove(id: number) {
  loadingRemove.value = true;

  try {
    const data = await Insights.destroy(id)

    await fetchMessages();
    toast({
      title: i18n.global.t("success"),
      description: i18n.global.t(data.message),
      duration: 3000,
    });
  } catch (error) {
    toast({
      title: i18n.global.t("error"),
      description: i18n.global.t(error.response.data.message),
      duration: 3000,
      variant: "destructive",
    });
    console.error("Erro ao remover mensagem:", error);
  }

  loadingRemove.value = false;
}

async function edit(id) {
  loading.value = true;

  try {
    const data = await Insights.update(id, form.value)

    resetForm()
    await fetchMessages();
    showModal.value = false;
    toast({
      title: i18n.global.t("success"),
      description: i18n.global.t(data.message),
      duration: 3000,
    });
  } catch (error) {
    console.error("Erro ao editar mensagem:", error);
    toast({
      title: i18n.global.t("error"),
      description: i18n.global.t(error.response.data.message),
      duration: 3000,
      variant: "destructive",
    });
  }

  loading.value = false;
  showModal.value = false;
}

const resetForm = () => {
  form.value.message = ""
  form.value.signature = ""
}

function openModal(item) {
  if (item) {
    form.value.message = item.message;
    form.value.signature = item.signature;
    isEditing.value = item.id;
    showModal.value = true;
  } else {
    isEditing.value = false;
    showModal.value = true;
  }
}

onMounted(() => {
  fetchMessages();
});

type TableItem = {
  id: string;
  message: string;
  signature: string;
};

function createHeaderButton(label: string, columnKey: string) {
  return h(
    Button,
    {
      variant: order.value === columnKey ? "default" : "ghost",
      onClick: () => {
        order.value = columnKey;
        direction.value = !direction.value;
        fetchMessages();
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
        { class: "" }
      ),
    ]
  );
}
const columnHelper = createColumnHelper<TableItem>();

const columns = [
  columnHelper.accessor("message", {
    header({ column }) {
      return "Texto";
    },
    cell: ({ row }) =>
      h(
        "div",
        { class: "sm:w-2/4 text-ellipsis text-wrap font-medium" },
        row.getValue("message")
      ),
  }),
  columnHelper.accessor("signature", {
    header({ column }) {
      return createHeaderButton("Assinatura", "signature");
    },
    cell: ({ row }) =>
      h(
        "div",
        { class: "sm:w-1/4 text-ellipsis text-wrap font-medium" },
        row.getValue("signature")
      ),
  }),
  columnHelper.display({
    id: "actions",
    header({ column }) {
      return "Ações";
    },
    cell: ({ row }) =>
      h(DropdownMenu, {}, [
        h(
          DropdownMenuTrigger,
          { asChild: true },
          h(
            Button,
            {
              "aria-haspopup": "true",
              size: "icon",
              variant: "ghost",
              disabled: loadingRemove.value || loading.value,
            },
            [
              h(MoreHorizontal, { class: "h-4 w-4" }),
              h("span", { class: "sr-only" }, "Ações"),
            ]
          )
        ),
        h(DropdownMenuContent, { align: "end" }, [
          h(DropdownMenuLabel, {}, "Ações"),
          h(DropdownMenuSeparator, {}),
          h(
            DropdownMenuItem,
            {
              onClick: () => {
                const item = row.original;
                openModal(item); // Função para abrir o modal de edição
              },
            },
            "Editar"
          ),
          h(
            DropdownMenuItem,
            {
              onClick: () => {
                const itemId = row.original.id;
                remove(itemId); // Função para remover o item pelo ID
              },
            },
            h("div", { class: "flex items-center" }, "Remover")
          ),
        ]),
      ]),
  }),
];
</script>

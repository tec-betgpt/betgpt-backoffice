<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">
        Gerenciamento de Setores
      </h2>
      <p class="text-muted-foreground">
        Gerencie os setores financeiros, adicionando ou editando informações
        para otimizar o controle do orçamento.
      </p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Setores</CardTitle>
      </CardHeader>
      <CardContent>
        <CustomDataTable
          :loading="loadingSectors"
          :data="sectors"
          :columns="sectorColumns"
          :find="fetchSectors"
          :update-text="handleName"
          :search-fields="[{ key: 'name', placeholder: 'Buscar por nome...' }]"
        />
        <CustomPagination :select-page="fetchSectors" :pages="pages" />
      </CardContent>
      <CardFooter class="flex justify-start">
        <div class="flex gap-4 my-4 items-center">
          <Button @click="openSheet">Criar Setor</Button>
        </div>
      </CardFooter>
    </Card>
    <Sheet v-model:open="showModal">
      <SheetContent position="right" size="lg">
        <SheetHeader>
          <SheetTitle>
            {{ isEditing ? `Editar ${form.type}` : `Novo ${form.type}` }}
          </SheetTitle>
          <SheetDescription>
            {{
              isEditing
                ? `Edite as informações do ${form.type}.`
                : `Crie um novo ${form.type}.`
            }}
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="submitSector">
          <div class="grid gap-4 py-4">
            <template v-if="form.type === 'setor'">
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="name">Nome</Label>
                <Input
                  id="name"
                  v-model="sectorForm.name"
                  placeholder="Digite o nome"
                  class="col-span-3"
                  required
                />
              </div>
            </template>
          </div>
          <SheetFooter>
            <Button type="submit" :disabled="loadingSub">
              {{ loadingSub ? "Salvando..." : isEditing ? "Salvar" : "Criar" }}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import { toast } from "@/components/ui/toast";
import { createColumnHelper } from "@tanstack/vue-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowDown, ArrowUp, MoreHorizontal } from "lucide-vue-next";

import CustomPagination from "@/components/custom/CustomPagination.vue";
import { createHeaderButton } from "@/components/custom/CustomHeaderButton";
import { useWorkspaceStore } from "@/stores/workspace";

interface SectorData {
  id: number;
  name: string;
  project: string;
}

const loadingSectors = ref(true);
const showModal = ref(false);
const sectors = ref<SectorData[]>([]);
const nameSector = ref();
const orderId = ref("");
const order = ref(false);
const sectorColumnHelper = createColumnHelper<SectorData>();
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const form = ref({ type: "" });
const isEditing = ref(false);
const sectorForm = ref({
  name: "",
  project_id: activeGroupProjectId,
  user_id: null,
});
const loadingSub = ref(false);

const handleEdit = (item: SectorData) => {
  form.value.type = "setor";
  isEditing.value = true;
  sectorForm.value = { ...item };
  showModal.value = true;
};

const deleteSector = async (id: number) => {
  try {
    loadingSectors.value = true;
    await api.delete(`/financial/sectors/${id}`);
    toast({
      title: "Setor deletado com sucesso!",
      description: `O setor com ID ${id} foi removido.`,
      variant: "success",
    });
    await fetchSectors();
  } catch (error) {
    console.error("Erro ao deletar setor:", error);
    toast({
      title: "Erro ao deletar setor",
      description: "Não foi possível remover o setor. Tente novamente.",
      variant: "destructive",
    });
  } finally {
    loadingSectors.value = false;
  }
};
const submitSector = async () => {
  try {
    loadingSub.value = true;
    if (isEditing.value) {
      await api.put(
        `/financial/sectors/${sectorForm.value.id}`,
        sectorForm.value
      );
    } else {
      await api.post("/financial/sectors", sectorForm.value);
    }
    showModal.value = false;
  } catch (error) {
    console.error("Erro ao salvar setor:", error);
  } finally {
    loadingSub.value = false;
    await fetchSectors();
  }
};
const sectorColumns = [
  sectorColumnHelper.accessor("id", {
    header({ column }) {
      return createHeaderButton(
        "ID",
        "id",
        orderId.value,
        order.value,
        handlerOrder
      );
    },
    cell: ({ row }) => h("div", {}, row.getValue("id")),
  }),
  sectorColumnHelper.accessor("name", {
    header({ column }) {
      return createHeaderButton(
        "Nome",
        "name",
        orderId.value,
        order.value,
        handlerOrder
      );
    },
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  sectorColumnHelper.accessor("project", {
    header: "Projeto",
    cell: ({ row }) => h("div", {}, row.getValue("project")),
  }),
  sectorColumnHelper.display({
    id: "actions",
    header() {
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
              // Supondo que loadingRemove seja outra referência, caso não exista, pode ser removida.
              disabled: loadingSectors.value,
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
                handleEdit(item);
              },
            },
            "Editar"
          ),
          h(
            DropdownMenuItem,
            {
              onClick: () => {
                const itemId = row.original.id;
                deleteSector(itemId);
              },
            },
            h("div", { class: "flex items-center" }, "Remover")
          ),
        ]),
      ]),
  }),
];

const handleName = (text: string) => {
  nameSector.value = text;
};

function handlerOrder(column: string, direction: boolean) {
  if (column) {
    orderId.value = column;
    order.value = direction;
  }
  fetchSectors();
}

const fetchSectors = async (current: number = pages.value.current) => {
  try {
    loadingSectors.value = true;
    const response = await api.get(`/financial/sectors?page=${current}`, {
      params: {
        filter_id: activeGroupProjectId,
        find_name: nameSector.value,
        sort_by: orderId.value,
        sort_order: order.value ? "asc" : "desc",
      },
    });
    sectors.value = response.data.data.data.map((sector: any) => ({
      id: sector.id,
      name: sector.name,
      project: sector.project.name,
    }));
    pages.value = {
      current: response.data.data.current_page,
      total: response.data.data.total,
      last: response.data.data.last_page,
    };
  } catch (error) {
    console.error("Erro ao buscar setores:", error);
  } finally {
    loadingSectors.value = false;
  }
};

const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

onMounted(async () => {
  await fetchSectors();
});

const openSheet = () => {
  form.value.type = "setor";
  isEditing.value = false;
  sectorForm.value = {
    name: "",
    project_id: activeGroupProjectId,
    user_id: null,
  };
  showModal.value = true;
};
</script>

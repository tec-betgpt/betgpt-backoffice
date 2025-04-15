<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Gerenciar Projetos</h2>
      <p class="text-muted-foreground">
        Gerencie seus projetos, altere status e edite informações.
      </p>
    </div>
    <Card>
      <CardContent class="py-4">
        <CustomDataTable
          :loading="isLoading"
          :data="projects"
          :columns="columns"
          :update-text="setSearch"
          :find="fetchProjects"
          :search-fields="[
            { key: 'name', placeholder: 'Buscar por nome do projeto...' },
          ]"
        >
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="ml-auto">
                Status
                <ChevronDownIcon class="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                :checked="statusFilter.includes('active')"
                @update:checked="setStatus('active')"
                class="capitalize"
              >
                Ativo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                :checked="statusFilter.includes('inactive')"
                @update:checked="setStatus('inactive')"
              >
                Inativo
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CustomDataTable>
        <CustomPagination :select-page="fetchProjects" :pages="pages" />
      </CardContent>
      <CardFooter>
        <Button @click="openCreateModal">
          {{ isProcessing ? "Carregando..." : "Novo Projeto" }}
        </Button>
      </CardFooter>
    </Card>

    <Sheet v-model:open="showModal">
      <SheetContent position="right" size="lg">
        <SheetHeader>
          <SheetTitle>
            {{ isEditing ? "Editar Projeto" : "Novo Projeto" }}
          </SheetTitle>
          <SheetDescription>
            {{
              isEditing
                ? "Edite as informações do projeto"
                : "Crie um novo projeto"
            }}
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="isEditing ? updateProject() : createProject()">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="name">Nome do Projeto</Label>
              <Input
                id="name"
                v-model="form.name"
                placeholder="Digite o nome do projeto"
                class="col-span-3"
                required
              />
            </div>
            <div class="flex items-center gap-4">
              <Label for="picture">Logo do Projeto</Label>
              <Input id="picture" type="file" @change="handleFileChange" />
            </div>
            <p v-if="errorMessage" class="text-red-500">{{ errorMessage }}</p>
            <Label v-if="form.image">Logo Atual</Label>
            <img
              v-if="form.image"
              :src="imagePreview"
              class="w-full"
              alt="Pré-visualização da imagem"
            />
          </div>
          <SheetFooter>
            <Button
              type="submit"
              :disabled="isProcessing || errorMessage !== ''"
            >
              <LucideSpinner
                v-if="isProcessing"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{
                isProcessing
                  ? "Carregando..."
                  : isEditing
                  ? "Salvar"
                  : "Criar Projeto"
              }}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, watch } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import moment from "moment";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { CaretSortIcon } from "@radix-icons/vue";
import Projects from '@/services/projects'
const imagePreview = ref();
const errorMessage = ref("");

const statusFilter = ref<Array<string>>(["active"]);
watch(statusFilter.value, () => {
  fetchProjects(1);
});
const { toast } = useToast();
const processingAction = ref(null);
const projects = ref<Project[]>([]);
const isLoading = ref(true);
const isProcessing = ref(false);
const processingStatusId = ref(null);
const showModal = ref(false);
const isEditing = ref(false);
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const form = ref({
  id: null,
  name: "",
  image: "",
})
const order = ref();
const direction = ref(false);
const searchValues = ref<Record<string, string>>({});

const handleFileChange = (event) => {
  const file = event.target.files[0];

  if (!file) return;
  if (file.size > 1024 * 1024) {
    errorMessage.value = "A imagem deve ter no máximo 1MB.";
    return;
  }

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    if (img.width !== img.height) {
      errorMessage.value =
        "A imagem deve ser quadrada (largura igual à altura).";
      imagePreview.value = "";
      form.value.image = "";
      URL.revokeObjectURL(img.src);
      return;
    }
    if (img.width > 512 || img.height > 512) {
      errorMessage.value = "A imagem deve ter no máximo 512x512 pixels.";
      imagePreview.value = "";
      form.value.image = "";
      URL.revokeObjectURL(img.src);
      return;
    }
    errorMessage.value = "";
    form.value.image = file;
    imagePreview.value = img.src;
  };

  img.onerror = () => {
    errorMessage.value = "Erro ao carregar a imagem.";
  };
};
const setSearch = (values: Record<string, string>) => {
  searchValues.value = values;
};
const setStatus = (status) => {
  const index = statusFilter.value.indexOf(status);
  if (index === -1) {
    statusFilter.value.push(status);
  } else {
    statusFilter.value.splice(index, 1);
  }
};
const getStatus = (project) => {
  return project.statuses?.[0]?.name || "inactive";
};

const fetchProjects = async (current = pages.value.current) => {
  try {
    isLoading.value = true;

    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      acc[key] = searchValues.value[key];
      return acc;
    }, {} as Record<string, string>);

    const { data } = await Projects.getProjects({
      page: current,
      ...searchParams,
      status: statusFilter.value,
      orderBy: order.value,
      orderDirection: direction.value ? "asc" : "desc",
    })

    projects.value = data.data;
    pages.value = {
      current: data.current_page,
      last: data.last_page,
      total: data.total,
    };
  } catch {
    toast({
      title: "Erro",
      description: "Erro ao carregar os projetos.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const toggleStatus = async (project) => {
  isProcessing.value = true;
  processingAction.value = `status-${project.id}`;
  processingStatusId.value = project.id;

  try {
    await Projects.toogleProject(project.id)

    const currentStatus = getStatus(project);
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    project.statuses[0].name = newStatus;

    toast({
      title: "Sucesso",
      description: `Projeto ${
        newStatus === "active" ? "ativado" : "inativado"
      } com sucesso.`,
      variant: "success",
    });
  } catch (_) {
    toast({
      title: "Erro",
      description: "Erro ao alterar o status do projeto.",
      variant: "destructive",
    });
  }

  isProcessing.value = false;
  processingStatusId.value = null;
  processingAction.value = null;
};

const openEditModal = (project) => {
  form.value = { id: project.id, name: project.name, image: project.logo_url };
  imagePreview.value = project.logo_url;
  isEditing.value = true;
  showModal.value = true;
};

const openCreateModal = () => {
  form.value = { id: null, name: "" };
  isEditing.value = false;
  showModal.value = true;
};

const createProject = async () => {
  isProcessing.value = true;

  try {
    const data = await Projects.storeProject(form.value)

    projects.value.push(data.data);
    toast({
      title: "Sucesso",
      description: "Projeto criado com sucesso.",
      variant: "default",
    });
    showModal.value = false;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao criar o projeto.",
      variant: "destructive",
    });
  }

  isProcessing.value = false;
};

const updateProject = async () => {
  isProcessing.value = true;
  try {
    const data = await Projects.storeProjectWithId(form.value.id, form.value)

    const projectIndex = projects.value.findIndex(
      (p) => p.id === form.value.id
    );
    projects.value[projectIndex] = data.data;
    toast({
      title: "Sucesso",
      description: "Projeto atualizado com sucesso.",
      variant: "default",
    });

    showModal.value = false;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao atualizar o projeto.",
      variant: "destructive",
    });
  }

  isProcessing.value = false;
  form.value = { id: null, name: "", image: "" };
};

const columnHelper = createColumnHelper<Project>();

function createHeaderButton(label: string, columnKey: string) {
  return h(
    Button,
    {
      variant: order.value === columnKey ? "default" : "ghost",
      onClick: () => {
        order.value = columnKey;
        direction.value = !direction.value;
        fetchProjects();
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

const columns = [
  columnHelper.accessor("id", {
    header({ column }) {
      return createHeaderButton("ID", "id");
    },
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("id")),
  }),
  columnHelper.accessor("name", {
    header({ header }) {
      return createHeaderButton("Nome", "name");
    },
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  columnHelper.accessor("created_at", {
    header({ header }) {
      return createHeaderButton("Data", "created_at");
    },
    cell: ({ row }) =>
      h(
        "div",
        {},
        moment(row.getValue("created_at")).format("DD/MM/YYYY HH:mm:ss")
      ),
  }),
  columnHelper.accessor("statuses", {
    header({ header }) {
      return "Status";
    },
    cell: ({ row }) =>
      h(
        "div",
        { class: "capitalize" },
        processingStatusId.value === row.getValue("id")
          ? h(LucideSpinner, { class: "mr-2 h-4 w-4 animate-spin" })
          : h(
              Badge,
              {
                variant:
                  row.getValue("statuses")?.[0]?.name === "active"
                    ? "default"
                    : "destructive",
              },
              row.getValue("statuses")?.[0]?.name === "active"
                ? "Ativo"
                : "Inativo"
            )
      ),
  }),
  columnHelper.accessor("statuses", {
    header({ header }) {
      return "Ações";
    },
    cell: ({ row, table }) =>
      h(DropdownMenu, {}, [
        h(
          DropdownMenuTrigger,
          { asChild: true },
          h(
            Button,
            { size: "icon", variant: "ghost", disabled: isProcessing.value },
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
                const project = row.original;
                openEditModal(project);
              },
            },
            "Editar"
          ),
          h(
            DropdownMenuItem,
            {
              onMousedown: () => {
                const project = row.original;
                toggleStatus(project);
              },
              disable:
                processingAction.value === `status-${row.getValue("id")}`,
            },

            processingAction.value === `status-${row.getValue("id")}`
              ? h(LucideSpinner, { class: "mr-2 h-4 w-4 animate-spin" })
              : h(
                  "div",
                  {},
                  processingAction.value === `status-${row.getValue("id")}`
                    ? row.getValue("statuses")?.[0]?.name === "active"
                      ? "Desativando..."
                      : "Ativando..."
                    : row.getValue("statuses")?.[0]?.name === "active"
                    ? "Inativar"
                    : "Ativar"
                )
          ),
        ]),
      ]),
  }),
];
type ProjectStatus = {
  id: number;
  name: string;
  reason: string | null;
  model_type: string;
  model_id: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
};

type Project = {
  id: number;
  name: string;
  created_at: string;
  image_url: string;
  statuses: ProjectStatus[];
};

onMounted(fetchProjects);
</script>

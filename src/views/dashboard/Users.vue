<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Gerenciar Usuários</h2>
      <p class="text-muted-foreground">
        Liste, edite, gerencie usuários e altere status.
      </p>
    </div>
    <Card>
      <CardContent class="py-4 flex flex-col gap-4">

        <CustomDataTable
                         :loading="isLoading"
                         :columns="columns"
                         :data="users"
                         :update-text="setSearch"
                         :find="fetchUsersAndProjects"
        >

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="ml-auto">
                Acesso  <ChevronDownIcon class="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem     :checked="accessFilter.includes('member')"
                                            @update:checked="setAccess('member')"  class="capitalize">
                Membro
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem :checked="accessFilter.includes('client')"
                                        @update:checked="setAccess('client')" >
                Cliente
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="ml-auto">
                Status  <ChevronDownIcon class="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem     :checked="statusFilter.includes('active')"
                                            @update:checked="setStatus('active')"  class="capitalize">
                Ativo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem :checked="statusFilter.includes('inactive')"
                                        @update:checked="setStatus('inactive')" >
                Inativo
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CustomDataTable>
        <CustomPagination :select-page="fetchUsersAndProjects" :pages="pages"/>
      </CardContent>
      <CardFooter>
        <Button @click="openCreateModal">Novo Usuário</Button>
      </CardFooter>
    </Card>

    <Sheet v-model:open="showModal">
      <SheetContent position="right" size="lg">
        <SheetHeader>
          <SheetTitle>
            {{ isEditing ? "Editar Usuário" : "Novo Usuário" }}
          </SheetTitle>
          <SheetDescription>
            {{
              isEditing
                ? "Edite as informações do usuário"
                : "Crie um novo usuário"
            }}
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="isEditing ? updateUser() : createUser()">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="first_name">Nome</Label>
              <Input
                id="first_name"
                v-model="form.first_name"
                placeholder="Digite o primeiro nome"
                class="col-span-3"
                required
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="last_name">Sobrenome</Label>
              <Input
                id="last_name"
                v-model="form.last_name"
                placeholder="Digite o sobrenome"
                class="col-span-3"
                required
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="form.email"
                placeholder="Digite o email"
                class="col-span-3"
                required
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="role">Acesso</Label>
              <Select id="role" v-model="form.role">
                <SelectTrigger class="col-span-3">
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="member">Membro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-4 gap-4" v-if="form.role === 'client'">
              <Label>Projetos</Label>
              <div class="space-y-2 max-h-72 overflow-y-auto col-span-3">
                <div
                  v-for="project in projects"
                  :key="project.id"
                  class="flex items-center"
                >
                  <Checkbox
                    :checked="form.project_ids.includes(project.id)"
                    @update:checked="onCheckboxChange(project.id, $event)"
                    :id="'project-' + project.id"
                  />
                  <Label
                    class="ml-2 font-normal"
                    :for="'project-' + project.id"
                    >{{ project.name }}</Label
                  >
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button type="submit" :disabled="isProcessing">
                <LucideSpinner
                  v-if="isProcessing"
                  class="mr-2 h-4 w-4 animate-spin"
                />
                {{
                  isProcessing
                    ? "Carregando..."
                    : isEditing
                    ? "Salvar"
                    : "Criar Usuário"
                }}
              </Button>
            </SheetFooter>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, h, watch} from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {MoreHorizontal, ChevronDownIcon, ArrowDown, ArrowUp} from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import api from "@/services/api";
import {createColumnHelper} from "@tanstack/vue-table";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import {CaretSortIcon} from "@radix-icons/vue";

const { toast } = useToast();
const processingAction = ref(null);
const users = ref<User[]>([]);
const projects = ref([]);
const isLoading = ref(true);
const isProcessing = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const processingStatusId = ref(null);
const form = ref({
  id: null,
  first_name: "",
  last_name: "",
  email: "",
  role: "client",
  project_ids: [],
});
const pages = ref({
  current:1,
  last:0,
  total:0
})
const accessFilter = ref<Array<String>>(['client','member'])
const statusFilter = ref<Array<string>>(["active",'inactive'])
const setStatus = (status) => {
  const index = statusFilter.value.indexOf(status);
  if (index === -1) {
    statusFilter.value.push(status);
  } else {
    statusFilter.value.splice(index, 1);
  }
};
const setAccess = (access) => {
  const index = accessFilter.value.indexOf(access);
  if (index === -1) {
    accessFilter.value.push(access);
  } else {
    accessFilter.value.splice(index, 1);
  }
};
watch(statusFilter.value,()=>{fetchUsersAndProjects(1)})
watch(accessFilter.value,()=>{fetchUsersAndProjects(1)})
const fetchUsersAndProjects = async (current = pages.value.current) => {
  try {
    isLoading.value = true
    const [userResponse, projectResponse] = await Promise.all([
      api.get(`/users?page=${current}`,{
        params:{
          searchName:search.value,
          status:statusFilter.value,
          orderBy:order.value,
          orderDirection:direction.value?"asc":"desc",
          access:accessFilter.value

        }
      }),
      api.get("/projects"),
    ]);
    users.value = userResponse.data.data.user;
    pages.value = {
      current: userResponse.data.data.pagination.current_page,
      last: userResponse.data.data.pagination.last_page,
      total: userResponse.data.data.pagination.total,
    };

    projects.value = projectResponse.data.data;

  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const openEditModal = (user) => {
  form.value = {
    ...user,
    role: user.role,
    project_ids: user.project_ids || [],
  };
  isEditing.value = true;
  showModal.value = true;
};

const openCreateModal = () => {
  form.value = {
    id: null,
    first_name: "",
    last_name: "",
    email: "",
    role: "client",
    project_ids: [],
  };
  isEditing.value = false;
  showModal.value = true;
};

const createUser = async () => {
  isProcessing.value = true;
  try {
    const response = await api.post("/users", form.value);
    users.value.push(response.data.data);
    toast({
      title: "Sucesso",
      description: "Usuário criado com sucesso.",
      variant: "success",
    });
    showModal.value = false;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao criar o usuário.",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

const updateUser = async () => {
  isProcessing.value = true;
  try {
    const response = await api.put(`/users/${form.value.id}`, form.value);
    const index = users.value.findIndex((u) => u.id === form.value.id);
    users.value[index] = response.data.data;
    toast({
      title: "Sucesso",
      description: "Usuário atualizado com sucesso.",
      variant: "success",
    });
    showModal.value = false;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao atualizar o usuário.",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

const resetPassword = async (user) => {
  processingAction.value = `reset-${user.id}`;
  try {
    await api.post(`/users/${user.id}/reset-password`);
    toast({
      title: "Senha Resetada",
      description: `Uma nova senha foi enviada para o email de ${user.first_name} ${user.last_name}.`,
      variant: "success",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível resetar a senha. Tente novamente.",
      variant: "destructive",
    });
  } finally {
    processingAction.value = null;
  }
};

const toggleStatus = async (user) => {
  processingAction.value = `status-${user.id}`;
  try {
    const response = await api.patch(`/users/${user.id}/toggle`);
    if (response.status === 200) {
      const currentStatus = getStatus(user);
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      user.statuses[0].name = newStatus;
      toast({
        title: "Sucesso",
        description: `Usuário ${
          newStatus === "active" ? "ativado" : "inativado"
        } com sucesso.`,
        variant: "success",
      });
    }
  } catch {
    toast({
      title: "Erro",
      description: "Erro ao alterar o status do usuário.",
      variant: "destructive",
    });
  } finally {
    processingAction.value = null;
  }
};

const getStatus = (user) => {
  return user.statuses?.[0]?.name || "inactive";
};

const onCheckboxChange = (id, checked) => {
  if (checked) {
    form.value.project_ids.push(id);
  } else {
    form.value.project_ids = form.value.project_ids.filter((pid) => pid !== id);
  }
};

onMounted(fetchUsersAndProjects);

const search = ref()
const setSearch = (text)=>{
  search.value = text;
}

const order = ref()
const direction = ref(false)
const columnHelper = createColumnHelper<User>()
function createHeaderButton(label: string, columnKey: string) {
  return h(
      Button,
      {
        variant: order.value === columnKey ? "default" : "ghost",
        onClick: () => {
          order.value = columnKey;
          direction.value = !direction.value;
          fetchUsersAndProjects();
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
      return createHeaderButton('ID',"id")
    },
    cell: ({ row }) =>
        h("div", {}, row.getValue("id")),
  }),
  columnHelper.accessor('first_name', {

    header({ column }) {
      return "Nome";
    },
    cell: ({ row }) =>
        h("div", { class: "capitalize" },`${row.getValue("first_name")} ${row.original.last_name}`),
  }),
  columnHelper.accessor("email", {
    header({ column }) {
      return "Email";
    },
    cell: ({ row }) =>
        h("div", {}, row.getValue("email")),
  }),
  columnHelper.accessor("statuses", {
    header({ column }) {
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
  columnHelper.accessor("role", {
    header({ column }) {
      return "Acesso";
    },
    cell: ({ row }) =>
        h("div", { class: "capitalize" }, row.getValue("role")=="member"?"Membro":"Cliente"),
  }),


  columnHelper.accessor("statuses", {
    header({ column }) {
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
                    const user = row.original; // Obtém o usuário da linha
                    resetPassword(user);
                  },
                  disabled:
                      processingAction.value === `reset-${row.getValue("id")}`,
                },
                h(
                    "div",
                    { class: "flex items-center" },
                    processingAction.value === `reset-${row.getValue("id")}`
                        ? [
                          h(LucideSpinner, {
                            class: "mr-2 h-4 w-4 animate-spin",
                          }),
                          "Resetando senha...",
                        ]
                        : "Resetar Senha"
                )
            ),
            h(
                DropdownMenuItem,
                {
                  onMousedown: () => {
                    const project = row.original;
                    toggleStatus(project);
                  },
                  disabled:
                      processingAction.value === `status-${row.getValue("id")}`,
                },
                processingAction.value === `status-${row.getValue("id")}`
                    ? h(LucideSpinner, { class: "mr-2 h-4 w-4 animate-spin" })
                    : h(
                        "div",
                        {},
                        row.getValue("statuses")?.[0]?.name === "active"
                            ? "Inativar"
                            : "Ativar"
                    )
            ),
          ]),
        ]),
  }),
];



// Primeiro, defina um tipo para a interface status
interface Status {
  id: string; // ID do status
  name: string; // Nome do status (ex: 'Ativo', 'Inativo')
  reason?: string; // Rationale de inatividade (opcional)
  model_type?: string; // Tipos do modelo associado (ex: 'App\Models\User')
  model_id?: number; // ID do modelo associado
  created_at: string; // Tempo de criação (formato ISO 8601, ex: "2024-11-20T19:15:47Z")
  updated_at?: string; // Tempo de atualização (formato ISO 8601, ex: "2024-11-20T19:15:47Z")
}

type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  project_ids: number[];
  statuses: Status[];
};


</script>

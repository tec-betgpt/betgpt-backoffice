<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Usuários</h2>
        <p class="text-muted-foreground">
          Liste, edite, gerencie usuários e altere status.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <Button class="bg-yellow-400" @click="openCreateModal">
          <Plus />
          Novo Usuário
        </Button>
      </div>
    </div>

    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <CustomDataTable
          :loading="isLoading"
          :columns="columns"
          :data="users"
          :update-text="setSearch"
          :find="fetchUsersAndProjects"
          :search-fields="[
            { key: 'name', placeholder: 'Buscar por nome do usuário...' },
          ]"
        >
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="ml-auto">
                Acesso <ChevronDownIcon class="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                :checked="accessFilter.includes('member')"
                @update:checked="setAccess('member')"
                class="capitalize"
              >
                Membro
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                :checked="accessFilter.includes('client')"
                @update:checked="setAccess('client')"
              >
                Cliente
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="ml-auto">
                Status <ChevronDownIcon class="ml-2 h-4 w-4" />
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

        <CustomPagination
          :select-page="fetchUsersAndProjects"
          :pages="pages"
          :per-pages="perPage"
          @update:perPages="(value) => perPage = value"
        />
      </CardContent>
    </Card>

    <Dialog v-model:open="showModal">
      <DialogContent position="right" size="lg">
        <DialogHeader>
          <DialogTitle>
            {{ isEditing ? "Editar Usuário" : "Novo Usuário" }}
          </DialogTitle>
          <DialogDescription>
            {{
              isEditing
                ? "Edite as informações do usuário"
                : "Crie um novo usuário"
            }}
          </DialogDescription>
        </DialogHeader>
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
              <Label for="access_type">Acesso</Label>
              <Select id="access_type" v-model="form.access_type">
                <SelectTrigger class="col-span-3">
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="member">Membro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div
              class="grid grid-cols-4 gap-4"
              v-if="form.access_type === 'member'"
            >
              <Label>Perfil</Label>
              <div class="space-y-2 max-h-72 overflow-y-auto col-span-3">
                <div
                  v-for="role in globalRoles"
                  :key="role.id"
                  class="flex items-center"
                >
                  <Checkbox
                    :checked="
                      form.admin_roles && form.admin_roles.includes(role.name)
                    "
                    @update:checked="onProfileCheckboxChange(role.name, $event)"
                    :id="'role-' + role.name"
                  />
                  <Label class="ml-2 font-normal" :for="'role-' + role.name">
                    {{ role.title ? role.title : $t("role-" + role.name) }}
                  </Label>
                </div>
              </div>
            </div>
            <div
              class="grid grid-cols-4 gap-4"
              v-if="form.access_type === 'client'"
            >
              <Label>Projetos e Perfis</Label>
              <div class="space-y-2 max-h-72 overflow-y-auto col-span-3">
                <div
                  v-for="project in projects"
                  :key="project.id"
                  class="space-y-2"
                >
                  <div class="flex items-center">
                    <Checkbox
                      :checked="isProjectSelected(project.id)"
                      @update:checked="toggleProject(project.id, $event)"
                      :id="'project-' + project.id"
                    />
                    <Label
                      class="ml-2 font-medium"
                      :for="'project-' + project.id"
                    >
                      {{ project.name }}
                    </Label>
                  </div>

                  <div
                    v-if="isProjectSelected(project.id)"
                    class="ml-6 space-y-2"
                  >
                    <div
                      v-for="role in getProjectRoles(project.id)"
                      :key="role.id"
                      class="flex items-center"
                    >
                      <Checkbox
                        :checked="isRoleSelected(project.id, role.name)"
                        @update:checked="
                          toggleRole(project.id, role.name, $event)
                        "
                        :id="'project-' + project.id + '-role-' + role.name"
                      />
                      <Label
                        class="ml-2 font-normal"
                        :for="'project-' + project.id + '-role-' + role.name"
                      >
                        {{ role.title || $t("role-" + role.name) }}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter class="pt-2">
              <Button
                variant="ghost"
                @click="showModal = false"
              >
                Cancelar
              </Button>
              <Button class="bg-yellow-300" type="submit" :disabled="isProcessing">
                <LucideSpinner
                  v-if="isProcessing"
                  class="animate-spin"
                />
                {{
                  isProcessing
                    ? "Carregando..."
                    : isEditing
                    ? "Salvar"
                    : "Criar Usuário"
                }}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, watch, computed } from "vue";
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
  Plus
} from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import Users from "@/services/users";
import Projects from "@/services/projects";
import { createColumnHelper } from "@tanstack/vue-table";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { CaretSortIcon } from "@radix-icons/vue";
import { useWorkspaceStore } from "@/stores/workspace";
import {Avatar, AvatarImage, AvatarFallback} from "@/components/ui/avatar";
import moment from "moment";

const { toast } = useToast();
const processingAction = ref(null);
const users = ref<User[]>([]);
const projects = ref([]);
const roles = ref([]);
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
  access_type: "client",
  roles: [],
  admin_roles: [],
  project_ids: [],
  projects: [],
  filter_id: null,
});
const pages = ref({
  current: 1,
  last: 0,
  total: 0,
});
const perPage = ref(10);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

if (activeGroupProjectId) {
  form.value.filter_id = activeGroupProjectId;
}

const accessFilter = ref<Array<String>>(["client", "member"]);
const statusFilter = ref<Array<string>>(["active"]);
const setStatus = (status: any) => {
  const index = statusFilter.value.indexOf(status);
  if (index === -1) {
    statusFilter.value.push(status);
  } else {
    statusFilter.value.splice(index, 1);
  }
};
const setAccess = (access: any) => {
  const index = accessFilter.value.indexOf(access);
  if (index === -1) {
    accessFilter.value.push(access);
  } else {
    accessFilter.value.splice(index, 1);
  }
};
watch(statusFilter.value, () => {
  fetchUsersAndProjects(1);
});
watch(accessFilter.value, () => {
  fetchUsersAndProjects(1);
});
watch(
  () => form.value.access_type,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      form.value.roles = [];
    }
  }
);
const globalRoles = computed(() => {
  return roles.value.filter((role) => role.scope_access === "member");
});
const onProfileCheckboxChange = (roleId, checked) => {
  if (checked) {
    form.value.admin_roles.push(roleId);
  } else {
    form.value.admin_roles = form.value.admin_roles.filter(
      (id) => id !== roleId
    );
  }
};

const isProjectSelected = (projectId: number) => {
  return (
    form.value.projects?.some((p) => p.id === projectId && p.selected) || false
  );
};
const toggleProject = (projectId: number, checked: boolean) => {
  if (!Array.isArray(form.value.projects)) {
    form.value.projects = []; // Inicializa como array vazio se não for um array
  }

  const projectIndex = form.value.projects.findIndex((p) => p.id === projectId);

  if (checked) {
    if (projectIndex === -1) {
      form.value.projects.push({
        id: projectId,
        selected: true,
        roles: [],
      });
    } else {
      form.value.projects[projectIndex].selected = true;
    }
  } else {
    if (projectIndex !== -1) {
      form.value.projects[projectIndex].selected = false;
      form.value.projects[projectIndex].roles = [];
    }
  }
};

const getProjectRoles = (projectId: number) => {
  return Array.isArray(roles.value)
    ? roles.value.filter(
        (role) =>
          role.project_id === projectId || role.scope_access === "client"
      )
    : [];
};

const isRoleSelected = (projectId: number, roleName: string) => {
  if (!Array.isArray(form.value.projects)) return false;

  const project = form.value.projects.find((p) => p.id === projectId);

  return project ? project.roles.includes(roleName) : false;
};

const toggleRole = (projectId: number, roleName: string, checked: boolean) => {
  if (!Array.isArray(form.value.projects)) return;

  const projectIndex = form.value.projects.findIndex((p) => p.id === projectId);

  if (projectIndex === -1) return;

  if (checked) {
    if (!form.value.projects[projectIndex].roles.includes(roleName)) {
      form.value.projects[projectIndex].roles.push(roleName);
    }
  } else {
    form.value.projects[projectIndex].roles = form.value.projects[
      projectIndex
    ].roles.filter((r) => r !== roleName);
  }
};
const fetchUsersAndProjects = async (current = pages.value.current) => {
  isLoading.value = true;

  try {
    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      acc[key] = searchValues.value[key];
      return acc;
    }, {} as Record<string, string>);

    const [userResponse, projectResponse] = await Promise.all([
      Users.index({
        page: current,
        filter_id: form.value.filter_id,
        ...searchParams,
        status: statusFilter.value,
        orderBy: order.value,
        orderDirection: direction.value ? "asc" : "desc",
        access: accessFilter.value,
        per_page: perPage.value,
      }),
      Projects.index({}),
    ]);
    users.value = userResponse.data.users;
    roles.value = userResponse.data.roles;
    pages.value = {
      current: userResponse.data.pagination.current_page,
      last: userResponse.data.pagination.last_page,
      total: userResponse.data.pagination.total,
    };

    projects.value = projectResponse.data;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  }

  isLoading.value = false;
};
watch(perPage,()=>fetchUsersAndProjects(1));
const openEditModal = (user: any) => {
  const projectsWithRoles = projects.value
    .filter((project) => user.project_ids.includes(project.id))
    .map((project) => ({
      id: project.id,
      selected: true,
      roles: user.roles
        .filter(
          (role) =>
            role.project_id === project.id || role.scope_access === "client"
        )
        .map((role) => role.name),
    }));

  form.value = {
    ...user,
    access_type: user.access_type,
    projects: projectsWithRoles,
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
    access_type: "client",
    project_ids: [],
    roles: [],
    admin_roles: [],
    projects: [],
  };
  isEditing.value = false;
  showModal.value = true;
};

const createUser = async () => {
  isProcessing.value = true;

  try {
    const data = await Users.storeUser(form.value);

    users.value.push(data.data);
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
  }

  isProcessing.value = false;
};

const updateUser = async () => {
  isProcessing.value = true;

  try {
    const data = await Users.updateUser(form.value.id, form.value);
    const index = users.value.findIndex((u) => u.id === form.value.id);

    users.value[index] = data.data;
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
  }

  isProcessing.value = false;
};

const resetPassword = async (user) => {
  processingAction.value = `reset-${user.id}`;

  try {
    await Users.resetPassword(user.id);

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
  }

  processingAction.value = null;
};

const toggleStatus = async (user) => {
  processingAction.value = `status-${user.id}`;

  try {
    await Users.toggleUser(user.id)
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
  } catch (_) {
    toast({
      title: "Erro",
      description: "Erro ao alterar o status do usuário.",
      variant: "destructive",
    });
  }

  processingAction.value = null;
};

const getStatus = (user) => {
  return user.statuses?.[0]?.name || "inactive";
};

onMounted(fetchUsersAndProjects);

const searchValues = ref<Record<string, string>>({});
const setSearch = (values: Record<string, string>) => {
  searchValues.value = values;
};

const order = ref();
const direction = ref(false);
const columnHelper = createColumnHelper<User>();
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
      class: "text-pretty p-0 text-left hover:bg-transparent",
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
  columnHelper.accessor(
    "photo",
    {
      header: () => "Perfil",
      cell: ({ row }) => h(
        h(
          Avatar,
          { class: "h-10 w-10 rounded-lg" },
          [
            h(AvatarImage, { src: row.getValue("photo") || undefined }),
            h(AvatarFallback, { class: "p-10 rounded-lg" }, row.original.first_name.charAt(0) + row.original.last_name.charAt(0))
          ]
        )
      )
    }
  ),
  columnHelper.accessor("first_name", {
    header({ column }) {
      return createHeaderButton("Nome", "first_name");
    },
    cell: ({ row }) =>
      h(
        "div",
        { class: "capitalize" },
        `${row.getValue("first_name")} ${row.original.last_name}`
      ),
  }),
  columnHelper.accessor("email", {
    header({ column }) {
      return "Email";
    },
    cell: ({ row }) => h("div", {}, row.getValue("email")),
  }),
  columnHelper.accessor("statuses", {
    header({ column }) {
      return "Status";
    },
    cell: ({ row }) =>
      h(
        "div",
        { class: "capitalize" },
        processingStatusId.value === row.id
          ? h(LucideSpinner, { class: "mr-2 h-4 w-4 animate-spin" })
          : h(
              Badge,
              {
                variant:
                  row.getValue("statuses")?.[0]?.name === "active"
                    ? "default"
                    : "destructive",
                class: "shadow-none"
              },
              row.getValue("statuses")?.[0]?.name === "active"
                ? "Ativo"
                : "Inativo"
            )
      ),
  }),
  columnHelper.accessor("auth2fa", {
    header({ column }) {
      return "2FA";
    },
    cell: ({ row }) => {
      const is = row.getValue("auth2fa")
      return h(
        "div",
        {class: "capitalize"},
        is && is !== 'pending'
          ? h(Badge, {variant: "default", class: "bg-green-500 shadow-none"}, "Habilitado")
          : h(Badge, {variant: "destructive", class: "shadow-none"}, "Desabilitado")
      )
    }
  }),
  columnHelper.accessor("access_type", {
    header({ column }) {
      return "Acesso";
    },
    cell: ({ row }) =>
      h(
        "div",
        { class: "capitalize" },
        row.getValue("access_type") == "member" ? "Membro" : "Cliente"
      ),
  }),
  columnHelper.accessor("last_login_at", {
    header({ column }) {
      return "Último Login";
    },
    cell: ({ row }) =>
      h(
        "div",
        { class: "capitalize" },
        row.getValue("last_login_at")
          ? moment(row.getValue("last_login_at")).format("DD/MM/YYYY HH:mm").concat("h")
          : "-"
      ),
  }),

  columnHelper.accessor("statuses", {
    header({ column }) {
      return "Ações";
    },
    cell: ({ row, table }) => {
      return h(DropdownMenu, {}, [
        h(
          DropdownMenuTrigger,
          {asChild: true},
          h(
            Button,
            {size: "icon", variant: "ghost", disabled: isProcessing.value},
            [
              h(MoreHorizontal, {class: "h-4 w-4"}),
              h("span", {class: "sr-only"}, "Ações"),
            ]
          )
        ),
        h(DropdownMenuContent, {align: "end"}, [
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
                processingAction.value === `reset-${row.id}`,
            },
            h(
              "div",
              {class: "flex items-center"},
              processingAction.value === `reset-${row.id}`
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
                processingAction.value === `status-${row.id}`,
            },
            processingAction.value === `status-${row.id}`
              ? h(LucideSpinner, {class: "mr-2 h-4 w-4 animate-spin"})
              : h(
                "div",
                {},
                row.getValue("statuses")?.[0]?.name === "active"
                  ? "Inativar"
                  : "Ativar"
              )
          ),
        ]),
      ])
    }
  }),
];

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
  photo: string | null;
  first_name: string;
  last_name: string;
  email: string;
  access_type: string;
  auth2fa: string | null;
  last_login_at: string | null;
  project_ids: number[];
  statuses: Status[];
};
</script>

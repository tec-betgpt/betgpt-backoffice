<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Gerenciar Perfis</h2>
      <p class="text-muted-foreground">
        Liste, edite e gerencie perfis e suas permissões.
      </p>
    </div>
    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <CustomDataTable
          :loading="isLoading"
          :columns="columns"
          :data="roles"
          :find="fetchRolesAndPermissions"
        >
        </CustomDataTable>
        <CustomPagination
          :select-page="fetchRolesAndPermissions"
          :pages="pages"
        />
      </CardContent>
      <CardFooter>
        <Button @click="openCreateModal">Novo Perfil</Button>
      </CardFooter>
    </Card>

    <Sheet v-model:open="showModal">
      <SheetContent position="right" size="lg">
        <SheetHeader>
          <SheetTitle>
            {{ isEditing ? "Editar Perfil" : "Novo Perfil" }}
          </SheetTitle>
          <SheetDescription>
            {{
              isEditing
                ? "Edite as informações do perfil"
                : "Crie um novo perfil"
            }}
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="isEditing ? updateRole() : createRole()">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="title">Título</Label>
              <Input
                id="title"
                v-model="form.title"
                placeholder="Digite o título do perfil"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label>Permissões</Label>
              <div class="space-y-2 max-h-72 overflow-y-auto col-span-3">
                <div
                  v-for="permission in permissions"
                  :key="permission.id"
                  class="flex items-center"
                >
                  <Checkbox
                    :checked="form.permissions.includes(permission.id)"
                    @update:checked="togglePermission(permission.id, $event)"
                    :id="'permission-' + permission.id"
                  />
                  <Label
                    class="ml-2 font-normal"
                    :for="'permission-' + permission.id"
                  >
                    {{ $t(permission.name) }}
                  </Label>
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
                    : "Criar Perfil"
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
import { ref, onMounted, h, watch, computed } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDownIcon, ArrowDown, ArrowUp } from "lucide-vue-next";
import { CaretSortIcon } from "@radix-icons/vue";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import api from "@/services/api";
import i18n from "@/i18n";
import moment from "moment";
import { createColumnHelper } from "@tanstack/vue-table";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { useWorkspaceStore } from "@/stores/workspace";

const { toast } = useToast();
const roles = ref([]);
const permissions = ref([]);
const isLoading = ref(true);
const isProcessing = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const form = ref({
  id: null,
  title: "",
  permissions: [],
  filter_id: null,
});
const pages = ref({
  current: 1,
  last: 0,
  total: 0,
});

const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

if (activeGroupProjectId) {
  form.value.filter_id = activeGroupProjectId;
}

const togglePermission = (permissionId, checked) => {
  if (checked) {
    form.value.permissions.push(permissionId);
  } else {
    form.value.permissions = form.value.permissions.filter(
      (id) => id !== permissionId
    );
  }
};

const fetchRolesAndPermissions = async (current = pages.value.current) => {
  try {
    isLoading.value = true;
    const [rolesResponse, permissionsResponse] = await Promise.all([
      api.get(`/roles?page=${current}`),
      api.get("/permissions"),
    ]);
    roles.value = rolesResponse.data.data.roles;
    permissions.value = permissionsResponse.data.data;
    pages.value = {
      current: rolesResponse.data.data.pagination.current_page,
      last: rolesResponse.data.data.pagination.last_page,
      total: rolesResponse.data.data.pagination.total,
    };
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

const openEditModal = (role) => {
  form.value = {
    ...role,
    permissions: role.permissions.map((p) => p.id),
  };
  isEditing.value = true;
  showModal.value = true;
};

const openCreateModal = () => {
  form.value = {
    id: null,
    title: "",
    permissions: [],
    filter_id: null,
  };
  isEditing.value = false;
  showModal.value = true;

  if (activeGroupProjectId) {
    form.value.filter_id = activeGroupProjectId;
  }
};

const createRole = async () => {
  isProcessing.value = true;
  try {
    const response = await api.post("/roles", form.value);
    roles.value.push(response.data.data);
    toast({
      title: "Sucesso",
      description: "Perfil criada com sucesso.",
      variant: "success",
    });
    showModal.value = false;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao criar perfil.",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

const updateRole = async () => {
  isProcessing.value = true;
  try {
    const response = await api.put(`/roles/${form.value.id}`, form.value);
    const index = roles.value.findIndex((r) => r.id === form.value.id);
    roles.value[index] = response.data.data;
    toast({
      title: "Sucesso",
      description: "Perfil atualizado com sucesso.",
      variant: "success",
    });
    showModal.value = false;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao atualizar o perfil.",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

onMounted(fetchRolesAndPermissions);

const search = ref();
const order = ref();
const direction = ref(false);

const columnHelper = createColumnHelper();

function createHeaderButton(label: string, columnKey: string) {
  return h(
    Button,
    {
      variant: order.value === columnKey ? "default" : "ghost",
      onClick: () => {
        order.value = columnKey;
        direction.value = !direction.value;
        fetchRolesAndPermissions();
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
  columnHelper.accessor("name", {
    header: "Nome",
    cell: ({ row }) =>
      h(
        "div",
        {},
        row.original.title
          ? row.original.title
          : i18n.global.t("role-" + row.original.name)
      ),
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
  columnHelper.accessor("actions", {
    header: "Ações",
    cell: ({ row }) => {
      if (row.original.scope_default === 1) {
        return h("div", {}, "-");
      }

      return h(
        Button,
        {
          onClick: () => openEditModal(row.original),
        },
        "Editar"
      );
    },
  }),
];
</script>

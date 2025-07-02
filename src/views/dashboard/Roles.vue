<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Perfis</h2>
        <p class="text-muted-foreground">
          Liste, edite e gerencie perfis e suas permissões.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <Button class="bg-yellow-300" @click="openCreateModal">
          <Plus />
          Novo Perfil
        </Button>
      </div>
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
    </Card>

    <Dialog v-model:open="showModal">
      <DialogContent position="right" size="lg">
        <DialogHeader>
          <DialogTitle>
            {{
              isEditing
                ? "Editar " +
                  (form.title ? form.title : $t("role-" + form.name))
                : "Novo Perfil"
            }}
          </DialogTitle>
          <DialogDescription>
            {{
              isEditing
                ? "Edite as informações do perfil"
                : "Crie um novo perfil"
            }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="isEditing ? updateRole() : createRole()">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="title">Título</Label>
              <Input
                id="title"
                v-model="form.title"
                placeholder="Digite o título do perfil"
                class="col-span-3"
                :disabled="form.scope_default == 1"
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
                    :disabled="form.scope_default == 1"
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
            <DialogFooter>
              <Button
                variant="link"
                @click="showModal = false"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                :disabled="isProcessing || form.scope_default == 1"
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
                    : "Criar Perfil"
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowDown,
  ArrowUp,
  MoreHorizontal, Plus,
} from "lucide-vue-next";
import { CaretSortIcon } from "@radix-icons/vue";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import Roles from '@/services/roles'
import Permissions from '@/services/permissions'
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
  isLoading.value = true;

  try {
    const [rolesResponse, permissionsResponse] = await Promise.all([
      Roles.index({ page: current, filter_id: form.value.filter_id }),
      Permissions.index(),
    ]);

    roles.value = rolesResponse.data.roles;
    permissions.value = permissionsResponse.data;
    pages.value = {
      current: rolesResponse.data.pagination.current_page,
      last: rolesResponse.data.pagination.last_page,
      total: rolesResponse.data.pagination.total,
    };
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  }

  isLoading.value = false;
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
    const data = await Roles.store({
      ...form.value,
      filter_id: form.value.filter_id.split('_')[1],
    });

    roles.value.push(data);
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
  }

  isProcessing.value = false;
};

const updateRole = async () => {
  isProcessing.value = true;

  try {
    const data = await Roles.update(form.value.id, form.value);
    const index = roles.value.findIndex((r) => r.id === form.value.id);

    roles.value[index] = data;
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
  }

  isProcessing.value = false;
};

onMounted(fetchRolesAndPermissions);

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
  columnHelper.accessor("scope_access", {
    header: "Acesso",
    cell: ({ row }) =>
      h("div", {}, i18n.global.t("role-" + row.original.scope_access)),
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
                openEditModal(row.original);
              },
            },
            "Editar"
          ),
        ]),
      ]),
  }),
];
</script>

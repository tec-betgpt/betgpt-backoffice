<template>
  <Button variant="ghost" size="icon" @click="openDialog()":disabled="isLoading.dialog">
    <Spinner v-if="isLoading.dialog" class="h-4 w-4 animate-spin" />
    <PenLine v-else />
  </Button>

  <Dialog v-model:open="showModal">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Editar Perfil
        </DialogTitle>
        <DialogDescription>
          Edite as informações do perfil
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit()">
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

          <div class="grid grid-cols-4 items-start gap-4">
            <Label>Permissões</Label>
            <div class="space-y-2 col-span-3">
              <div class="relative w-full max-w-sm items-center">
                <Input v-model="search" type="search" placeholder="Buscar..." class="pl-10" />
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Search class="size-6 text-muted-foreground" />
                </span>
              </div>

              <div class="space-y-2 h-40 max-h-40 overflow-y-auto col-span-3">
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
                    {{ permission.name }}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="link" @click="cancel">
              Cancelar
            </Button>
            <Button type="submit" :disabled="isProcessing">
              <LucideSpinner v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
              {{ isProcessing ? "Salvando..." :  "Atualizar" }}
            </Button>
          </DialogFooter>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, defineProps } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { PenLine, Search } from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import { Spinner } from "@/components/ui/spinner";
import { watchDebounced } from "@vueuse/core/index";
import Roles from '@/services/roles'
import Permissions from '@/services/permissions'

const { toast } = useToast();
const props = defineProps<{
  reload: () => void,
  row: any
}>()

const role = ref();
const search = ref("");
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
  scope_default: 0
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

const fetchPermissions = async (params = {}) => {
  isLoading.value = true;

  try {
    permissions.value = await Permissions.list(params);
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  }

  isLoading.value = false;
}

const openDialog = async () => {
  await fetchPermissions()
  form.value = {
    ...props.row,
    title: props.row.title ?? props.row.name,
    permissions: props.row.permissions.map((p) => p.id),
  };
  showModal.value = true;
}

const onSubmit = async () => {
  isProcessing.value = true;

  try {
    const data = await Roles.update(props.row.id, form.value);
    await props.reload()
    toast({
      title: "Sucesso",
      description: "Perfil atualizado com sucesso.",
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
}

const cancel = (e: Event) => {
  e.preventDefault();
  showModal.value = false;
}

watchDebounced(
  search,
  async (search) => await fetchPermissions({ search }),
  { debounce: 300 }
);
</script>

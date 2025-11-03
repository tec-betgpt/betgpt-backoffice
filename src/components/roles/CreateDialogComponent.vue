<template>
  <Button class="bg-yellow-400 dark:text-black hover:text-white" @click="openDialog()">
    <Plus />
    Novo Perfil
  </Button>

  <Dialog v-model:open="showModal">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo Perfil</DialogTitle>
        <DialogDescription>
          Crie um novo perfil e vincule permissões a ele.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit()">
        <div class="grid gap-4">
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
            <Button
              type="submit"
              :disabled="isProcessing"
            >
              <LucideSpinner
                v-if="isProcessing"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{ isProcessing ? "Salvando..." : "Salvar" }}
            </Button>
          </DialogFooter>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { ref, onMounted, defineProps } from "vue";
import { watchDebounced } from "@vueuse/core";
import { useToast } from "@/components/ui/toast/use-toast";
import { Plus, Search } from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import Roles from '@/services/roles'
import Permissions from '@/services/permissions'

const props = defineProps<{
  reload: () => void
}>()

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

const search = ref("");
const permissions = ref([]);
const isProcessing = ref(false);
const showModal = ref(false);
const form = ref({
  id: null,
  title: "",
  permissions: [],
  filter_id: null,
  scope_default: 1
});

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
  try {
    permissions.value = await Permissions.list(params);
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar as permissões.",
      variant: "destructive",
    });
  }
}

const openDialog = () => {
  form.value = {
    id: null,
    title: "",
    permissions: [],
    filter_id: null,
    scope_default: 1
  };
  showModal.value = true;

  if (activeGroupProjectId) {
    form.value.filter_id = activeGroupProjectId;
  }
}

const onSubmit = async () => {
  isProcessing.value = true;

  try {
    const data = await Roles.store({
      ...form.value,
      filter_id: form.value.filter_id?.split('_')[1],
    });
    await props.reload();
    showModal.value = false;
    toast({
      title: "Sucesso",
      description: "Perfil criado com sucesso.",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao criar perfil.",
      variant: "destructive",
    });
  }

  isProcessing.value = false;
}

const cancel = (e: Event) => {
  e.preventDefault();
  showModal.value = false;
}

onMounted(() => {
  fetchPermissions()
});

watchDebounced(
  search,
  async (search) => await fetchPermissions({ search }),
  { debounce: 300 }
);
</script>


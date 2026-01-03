<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="w-full flex justify-between items-center max-sm:flex-col">
      <div class="space-y-0.">
        <h2 class="text-2xl font-bold tracking-tight">Gerenciar Conversões</h2>
        <p class="text-muted-foreground">
          Crie e gerencie suas conversões primárias e quantitativas.
        </p>
      </div>
      <div class="w-full flex max-sm:justify-center justify-end max-sm:flex-col gap-2 max-sm:mt-3 items-center">
        <Button @click="openCreateModal" class="max-sm:w-full" v-if="canAccess('create-edit-conversions')">
          <PlusIcon class="mr-2 h-4 w-4" />
          Nova Conversão
        </Button>
      </div>
    </div>

    <Tabs v-model="activeTab">
      <TabsList>
        <TabsTrigger value="primary">Primárias</TabsTrigger>
        <TabsTrigger value="quantitative">Quantitativas</TabsTrigger>
      </TabsList>
      <TabsContent value="primary">
        <Card>
          <CardHeader>
            <CardTitle>Conversões Primárias</CardTitle>
          </CardHeader>
          <CardContent class="py-4">
            <CustomDataTable
              :loading="isLoading"
              :data="primaryConversions"
              :columns="columns"
              :search-fields="[{ key: 'name', placeholder: 'Buscar por nome...' }]"
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="quantitative">
        <Card>
          <CardHeader>
            <CardTitle>Conversões Quantitativas</CardTitle>
          </CardHeader>
          <CardContent class="py-4">
            <CustomDataTable
              :loading="isLoading"
              :data="quantitativeConversions"
              :columns="columns"
              :search-fields="[{ key: 'name', placeholder: 'Buscar por nome...' }]"
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <Dialog v-model:open="showModal">
      <DialogContent class="sm:max-w-2xl max-h-[90dvh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>
            {{ isEditing ? "Editar Conversão" : "Criar Nova Conversão" }}
          </DialogTitle>
          <DialogDescription>
            Defina as regras para sua conversão.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name" class="text-right">Nome</Label>
            <Input id="name" v-model="form.name" class="col-span-3" />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="description" class="text-right">Descrição</Label>
            <Textarea id="description" v-model="form.description" class="col-span-3" />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="is_primary" class="text-right">Tipo</Label>
            <Select v-model="form.is_primary">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="true">Primária</SelectItem>
                <SelectItem :value="false">Quantitativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="channel_group" class="text-right">Grupo de Canais</Label>
            <Select v-model="form.channel_group">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grupo de canais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="group in channelGroups" :key="group.value" :value="group.value">
                  {{ group.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="event" class="text-right">Evento Associado</Label>
             <Select v-model="form.event_id">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="event in events" :key="event.id" :value="event.id">
                  {{ event.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="include_in_report" class="text-right">Registrar no Retorno</Label>
            <Switch id="include_in_report" v-model="form.include_in_report" :disabled="!canAccess('member-proprietor') && !canAccess('member-admin')" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showModal = false">
            Cancelar
          </Button>
          <Button type="submit" @click="saveConversion" :disabled="isProcessing">
            <Loader2Icon
              v-if="isProcessing"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isEditing ? "Salvar Alterações" : "Criar Conversão" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { h, ref, onMounted, computed } from "vue";
import conversionDefinitions from "@/services/conversionDefinitions";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  PlusIcon,
  Loader2Icon,
  MoreHorizontalIcon,
} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import { createColumnHelper } from "@tanstack/vue-table";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";

const { toast } = useToast();
const isLoading = ref(false);
const isProcessing = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const activeTab = ref("primary");

const allConversions = ref([]);
const events = ref([]);
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const activeGroupProjectId = computed(() => workspaceStore.activeGroupProject?.id ?? null);

const hasPermission = (permissionName: string) => {
  return !!authStore.user?.roles.some((role: any) =>
    role.permissions.some((permission: any) => {
      return permission.name === permissionName;
    })
  );
};
const hasRole = (roleName: string): Boolean => {
  return (
    authStore.user?.roles?.some((role: any) => role.name === roleName) ?? false
  );
};

const hasPermissionInActiveProject = (permissionName: string) => {
  return !!authStore.user?.roles
    .filter(
      (role: any) =>
        workspaceStore.activeGroupProject &&
        role.pivot.project_id === workspaceStore.activeGroupProject.project_id!
    )
    .some((role: any) =>
      role.permissions.some(
        (permission: any) => permission.name === permissionName
      )
    );
};

const canAccess = (permissionName: string) => {
  return (
    hasPermission(permissionName) ||
    hasPermissionInActiveProject(permissionName) ||
    hasRole(permissionName)
  );
};


const form = ref({
  id: null,
  name: "",
  description: "",
  is_primary: true,
  include_in_report: false,
  channel_group: "",
  event_id: null,
});

const channelGroups = ref([
  { value: 'sessionDefaultChannelGroup', label: 'Grupo de canais padrão da sessão' },
  { value: 'sessionPrimaryChannelGroup', label: 'Grupo principal de canais da sessão' },
  { value: 'sessionSourceMedium', label: 'Origem / mídia da sessão' },
  { value: 'sessionMedium', label: 'Meio da sessão' },
  { value: 'sessionSource', label: 'Origem da sessão' },
  { value: 'sessionTrafficOrigin', label: 'Plataforma de origem da sessão' },
  { value: 'sessionCampaignName', label: 'Campanha da sessão' },
]);

const primaryConversions = computed(() => allConversions.value.filter(c => c.is_primary));
const quantitativeConversions = computed(() => allConversions.value.filter(c => !c.is_primary));

const columnHelper = createColumnHelper<any>();

const columns = [
  columnHelper.accessor("name", {
    header: "Nome",
    cell: ({ row }) => h("div", row.getValue("name")),
  }),
  columnHelper.accessor("description", {
    header: "Descrição",
    cell: ({ row }) => h("div", row.getValue("description")),
  }),
  columnHelper.accessor("include_in_report", {
    header: "Registrar no Retorno",
    cell: ({ row }) => h("div", row.getValue("include_in_report") ? 'Sim' : 'Não'),
  }),
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row }) => {
      if (canAccess('create-edit-conversions')) {
        return h(DropdownMenu, {}, [
          h(
            DropdownMenuTrigger,
            { asChild: true },
            h(
              Button,
              {
                "aria-haspopup": "true",
                size: "icon",
                variant: "ghost",
              },
              [
                h(MoreHorizontalIcon, { class: "h-4 w-4" }),
                h("span", { class: "sr-only" }, "Ações"),
              ]
            )
          ),
          h(DropdownMenuContent, { align: "end" }, [
            h(DropdownMenuLabel, {}, "Ações"),
            h(DropdownMenuSeparator, {}),
            h(
              DropdownMenuItem,
              { onClick: () => handleEdit(row.original) },
              "Editar"
            ),
            h(
              DropdownMenuItem,
              { onClick: () => deleteConversion(row.original.id) },
              h("div", { class: "flex items-center text-destructive" }, "Remover")
            ),
          ]),
        ]);
      }
      return null;
    },
  },
];

const fetchConversions = async () => {
  try {
    isLoading.value = true;
    const params = {
      filter_id: activeGroupProjectId.value,
    };
    const response = await conversionDefinitions.index(params);
    allConversions.value = response.data;
  } catch (error) {
    console.error("Error loading conversions:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar as conversões",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const fetchEvents = async () => {
  try {
    const response = await conversionDefinitions.index({ filter_id: activeGroupProjectId.value });
    events.value = response.data;
  } catch (error) {
    console.error("Error loading events:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os eventos associados.",
      variant: "destructive",
    });
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  form.value = {
    id: null,
    name: "",
    description: "",
    is_primary: true,
    include_in_report: false,
    channel_group: "",
    event_id: null,
  };
  showModal.value = true;
};

const handleEdit = (conversion) => {
  isEditing.value = true;
  form.value = { ...conversion };
  showModal.value = true;
};

const saveConversion = async () => {
  isProcessing.value = true;
  try {
    const payload = {
      ...form.value,
      project_id: activeGroupProjectId.value,
    };

    if (isEditing.value) {
      await conversionDefinitions.update(form.value.id, payload);
    } else {
      await conversionDefinitions.store(payload);
    }
    await fetchConversions();
    showModal.value = false;
    toast({
      title: "Sucesso",
      description: `Conversão ${isEditing.value ? 'atualizada' : 'criada'} com sucesso.`,
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: `Não foi possível ${isEditing.value ? 'atualizar' : 'criar'} a conversão.`,
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

const deleteConversion = async (id) => {
  try {
    isProcessing.value = true;
    await conversionDefinitions.destroy(id);
    await fetchConversions();
    toast({
      title: "Sucesso",
      description: "Conversão removida com sucesso",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível remover a conversão",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

onMounted(() => {
  // fetchConversions();
  // fetchEvents();
});
</script>

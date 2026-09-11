<template>
  <div class="google-analytics-page p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Grupos de Projetos</h2>
        <p class="text-muted-foreground">
          Gerencie seus grupos e selecione seu projeto favorito.
        </p>
      </div>

      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CreateDialogComponent :reload="fetchUserProjectGroups" />
      </div>
    </div>

    <div class="space-y-4">
      <Card>
        <CardContent class="py-4">
          <div class="flex justify-end mb-2">
            <ColumnVisibilityToggle v-model="columnVisibility" :columns="tableColumns" />
          </div>
          <Table class="w-full">
            <TableHeader>
              <TableRow>
                <TableHead v-if="columnVisibility.nome !== false">Nome</TableHead>
                <TableHead v-if="columnVisibility.projetos !== false">Projetos</TableHead>
                <TableHead v-if="columnVisibility.criadoEm !== false" class="text-right">Criado em</TableHead>
                <TableHead v-if="columnVisibility.acoes !== false" class="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody v-if="groups.length">
              <TableRow v-for="row in groups" :key="row.id">
                <TableCell v-if="columnVisibility.nome !== false">
                  {{ row.name }}
                </TableCell>
                <TableCell v-if="columnVisibility.projetos !== false">
                  <Badge variant="secondary" class="m-1 py-2 " v-for="(item, index) in row.projects.slice(0, 3)" :key="index">
                    {{ item.name }}
                  </Badge>
                  <DropdownMenu v-if="row.projects.length > 3" class="overflow-y-scroll">
                    <DropdownMenuTrigger as-child>
                      <Button size="sm" variant="secondary" class="py-0">
                        +{{ row.projects.length - 3 }}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent class="w-56" align="start">
                      <DropdownMenuGroup>
                        <DropdownMenuItem v-for="(item, index) in row.projects.slice(3)">
                          {{ item.name }}
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell v-if="columnVisibility.criadoEm !== false" class="text-right text-nowrap">
                  {{ $moment(row.created_at).format('DD/MM/YYYY') }}
                </TableCell>
                <TableCell v-if="columnVisibility.acoes !== false" class="text-right">
                  <EditDialogComponent :row="row" :reload="fetchUserProjectGroups" />

                  <DestroyDialogComponent
                    v-if="workspaceStore.activeGroupProject?.id !== `group_${row.id}`"
                    :destroy="deleteGroup"
                    :row="row"
                    :reload="fetchUserProjectGroups"
                  />
                  <Button v-else size="icon" variant="ghost" disabled>
                    <Trash />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>

            <TableBody v-else>
              <TableRow>
                <TableCell :colspan="visibleTableColumns.length" class="text-center py-5">
                  Nenhum grupo encontrado.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { toast } from "vue-sonner";
import { useScreenContext } from "@/composables/useScreenContext";
import { Trash } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import { Card, CardContent } from "@/components/ui/card";
import { TableBody } from "@/components/ui/table";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import CreateDialogComponent from "@/components/projects/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/projects/EditDialogComponent.vue";
import UserProjectGroup from '@/services/userProjectGroup'
import ColumnVisibilityToggle from "@/components/custom/ColumnVisibilityToggle.vue";


const workspaceStore = useWorkspaceStore();
const loading = ref(false);
const groups: any = ref([]);

const tableColumns = [
  { id: "nome", label: "Nome" },
  { id: "projetos", label: "Projetos" },
  { id: "criadoEm", label: "Criado em" },
  { id: "acoes", label: "Ações" },
];
const columnVisibility = ref<Record<string, boolean>>({});
const visibleTableColumns = computed(() =>
  tableColumns.filter((c) => columnVisibility.value[c.id] !== false)
);

const fetchUserProjectGroups = async () => {
  loading.value = true;

  try {
    const groupsResponse = await UserProjectGroup.index()
    groups.value = groupsResponse.data;
  } catch (error) {
    toast.error("Erro", { description: "Erro ao carregar os dados." });
  }

  loading.value = false;
};

const deleteGroup = async (groupId: number) => {
  try {
    await UserProjectGroup.destroy(groupId)
    groups.value = groups.value.filter((group) => group.id !== groupId);

    toast("Sucesso", { description: "Grupo excluído com sucesso." });
  } catch (error) {
    toast.error("Erro", { description: "Erro ao excluir o grupo." });
  }
};

// Screen Context
useScreenContext(
  "Grupos de Projetos - Lista e administra grupos de projetos do usuário",
  () => ({
    "active_group_project_id": workspaceStore.activeGroupProject?.id ?? "",
    "active_group_project_name": workspaceStore.activeGroupProject?.name ?? "",
    "groups_count": Array.isArray(groups.value) ? groups.value.length : 0,
    "groups_preview": Array.isArray(groups.value)
      ? groups.value.slice(0, 10).map((group: any) => group.name).filter(Boolean).join(", ")
      : "",
  }),
  "/v1/user-project-groups"
);

onMounted(fetchUserProjectGroups);
</script>

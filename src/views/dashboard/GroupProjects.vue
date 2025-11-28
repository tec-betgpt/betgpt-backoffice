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
          <Table class="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Projetos</TableHead>
                <TableHead class="text-right">Criado em</TableHead>
                <TableHead class="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody v-if="groups.length">
              <transition-group appear enter-active-class="enter-active" enter-from-class="enter" enter-to-class="enter-to">
                <TableRow v-for="(row, index) in groups" :key="row.id" :style="`--delay: ${getMs(index)}`">
                  <TableCell>
                    {{ row.name }}
                  </TableCell>
                  <TableCell>
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
                  <TableCell class="text-right text-nowrap">
                    {{ $moment(row.created_at).format('DD/MM/YYYY') }}
                  </TableCell>
                  <TableCell class="text-right">
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
              </transition-group>
            </TableBody>

            <TableBody v-else>
              <TableRow>
                <TableCell :colspan="4" class="text-center py-5">
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
import { ref, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Trash } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import { getMs } from "@/filters/formatNumbers";
import { Card, CardContent } from "@/components/ui/card";
import { TableBody } from "@/components/ui/table";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import CreateDialogComponent from "@/components/projects/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/projects/EditDialogComponent.vue";
import UserProjectGroup from '@/services/userProjectGroup'

const { toast } = useToast();

const workspaceStore = useWorkspaceStore();
const loading = ref(false);
const groups: any = ref([]);

const fetchUserProjectGroups = async () => {
  loading.value = true;

  try {
    const groupsResponse = await UserProjectGroup.index()
    groups.value = groupsResponse.data;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  }

  loading.value = false;
};

const deleteGroup = async (groupId: number) => {
  try {
    await UserProjectGroup.destroy(groupId)
    groups.value = groups.value.filter((group) => group.id !== groupId);

    toast({
      title: "Sucesso",
      description: "Grupo excluído com sucesso.",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao excluir o grupo.",
      variant: "destructive",
    });
  }
};

onMounted(fetchUserProjectGroups);
</script>

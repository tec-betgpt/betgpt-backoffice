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
        <CreateDialogComponent :reload="fetchRoles" />
      </div>
    </div>

    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <Table class="w-full'">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead class="text-right">Criado em</TableHead>
              <TableHead class="text-right">Ultima atualização</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <transition-group
              appear
              enter-active-class="enter-active"
              enter-from-class="enter"
              enter-to-class="enter-to"
            >
              <TableRow v-for="(row, index) in roles" :key="row.id" :style="`--delay: ${getMs(index)}`">
                <TableCell>
                  {{ row.title
                  ? row.title
                  : $t("role-" + row.name) }}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {{ $t("role-" + row.scope_access) }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right text-nowrap">
                  {{ $moment(row.created_at).format('DD/MM/YYYY') }}
                </TableCell>
                <TableCell class="text-right text-nowrap">
                  {{ $moment(row.updated_at).format('DD/MM/YYYY') }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="gap-1 flex flex-nowrap justify-end">
                    <EditDialogComponent :row="row" :reload="fetchRoles" />
                  </div>
                </TableCell>
              </TableRow>
            </transition-group>

            <template v-if="isLoading">
              <TableRow v-for="i in 5" :key="i">
                <TableCell v-for="j in 4" :key="i">
                  <Skeleton :key="j" class="h-4 w-full bg-gray-300 my-1" />
                </TableCell>
              </TableRow>
            </template>

            <template v-if="!isLoading && (!roles || !roles.length)">
              <TableRow>
                <TableCell :colspan="4" class="text-center py-5">
                  Nenhum perfil encontrado.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>

        <CustomPagination
          :select-page="fetchRoles"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="args => perPage = args"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { getMs } from "@/filters/formatNumbers";
import { useWorkspaceStore } from "@/stores/workspace";
import Roles from '@/services/roles'
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CreateDialogComponent from "@/components/roles/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/roles/EditDialogComponent.vue";
import {Card, CardContent} from "@/components/ui/card";

const { toast } = useToast();
const roles = ref([]);
const isLoading = ref(true);
const pages = ref({
  current: 1,
  last: 0,
  total: 0,
});
const perPage = ref(10);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

const fetchRoles = async (current = pages.value.current) => {
  try {
    const { data } = await Roles.index({
      page: current,
      filter_id: activeGroupProjectId,
      per_page: perPage.value,
    });
    roles.value = data.roles;
    pages.value = {
      current: data.pagination.current_page,
      last: data.pagination.last_page,
      total: data.pagination.total,
    };
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  }
}

onMounted(() => {
  isLoading.value = true;
  fetchRoles()
  isLoading.value = false;
});
watch(perPage,()=>fetchRoles(1));
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Permissões</h2>
        <p class="text-muted-foreground">
          Gerencie as permissões de acesso na plataforma.
        </p>
      </div>

      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CreateDialogComponent :reload="fetchPermissions" />
      </div>
    </div>

    <Card>
      <CardContent class="py-4 gap-4">
        <div class="flex sm:flex-row gap-2 justify-end mb-5">
          <div class="grid w-full max-w-sm items-center justify-end gap-1.5">
            <Input
              class="sm:max-w-sm w-full"
              placeholder="Pesquisar"
              v-model="search"
            />
          </div>
          <Button size="icon" @click="find()">
            <Search />
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome/Apelido</TableHead>
              <TableHead>Guarda</TableHead>
              <TableHead>Escopo/Acesso</TableHead>
              <TableHead>Escopo/Ordem</TableHead>
              <TableHead class="text-right">Criado em</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <transition-group appear enter-active-class="enter-active" enter-from-class="enter" enter-to-class="enter-to">
              <TableRow v-for="(row, index) in permissions" :key="row.id" :style="`--delay: ${getMs(index)}`">
                <TableCell>
                  {{ row.name }}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {{ row.guard_name ?? '-' }}
                  </Badge>
                </TableCell>
                <TableCell>
                  {{ row.scope_access ?? '-' }}
                </TableCell>
                <TableCell>
                  {{ row.scope_order ?? '-' }}
                </TableCell>
                <TableCell class="text-right text-nowrap">
                  {{ $moment(row.created_at).format('DD/MM/YYYY') }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="gap-1 flex flex-nowrap justify-end">
                    <EditDialogComponent :row="row" :reload="fetchPermissions" />
                    <DestroyDialogComponent :destroy="destroy" :row="row" :reload="fetchPermissions" />
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

            <template v-if="!isLoading && (!permissions || !permissions.length)">
              <TableRow>
                <TableCell :colspan="4" class="text-center py-5">
                  Nenhum serviço encontrado.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>

        <CustomPagination
          class="mt-5"
          :select-page="fetchPermissions"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="(value) => perPage = value"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { getMs } from "@/filters/formatNumbers";
import { Search } from "lucide-vue-next";
import Permissions from "@/services/permissions";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CreateDialogComponent from "@/components/permissions/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/permissions/EditDialogComponent.vue";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import {Card} from "@/components/ui/card";

const { toast } = useToast();

const permissions = ref();
const isLoading = ref(true);
const search = ref(null);
const currentPage = ref(1);
const perPage = ref("20");
const pages = ref({
  current: 1,
  last: 1,
  total: 0
})

const fetchPermissions = async (page = 1) => {
  try {
    const response = await Permissions.index({
      page,
      per_page: 15,
      search: search.value
    });

    permissions.value = response.data
    currentPage.value = response.data.current_page;
    pages.value = {
      current: response.current_page,
      last: response.last_page,
      total: response.total,
    };
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  }
}

const find = async () => {
  await fetchPermissions()
}

const destroy = async (id: number) => {
  try {
    await Permissions.destroy(id);
  } catch (error) {
    toast({
      title: "Erro",
      description: "Verifique se essa permissão está em uso",
      variant: "destructive",
    });
  }
}

onMounted(async () => {
  isLoading.value = true;
  await fetchPermissions()
  isLoading.value = false;
});
</script>

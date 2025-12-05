<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Histórico de Logins</h2>
        <p class="text-muted-foreground">
          Visualização de últimas autenticações dos usuários
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <FilterDialogComponent :setFilters="setFilters" />
      </div>
    </div>

    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <Table class="w-full overflow-hidden">
          <TableHeader>
            <TableRow>
              <TableHead>
                Usuário
              </TableHead>
              <TableHead class="text-right">
                E-mail
              </TableHead>
              <TableHead class="text-right">
                IP
              </TableHead>
              <TableHead class="text-right">
                <Button class="p-0" variant="ghost" @click="handleSort('created_at')">
                  Entrou em
                  <ArrowUp v-if="order === 'created_at' && direction" class="ml-2 h-4 w-4" />
                  <ArrowDown v-else-if="order === 'created_at' && !direction" class="ml-2 h-4 w-4" />
                  <CaretSortIcon v-else class="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <transition-group appear enter-active-class="enter-active" enter-from-class="enter" enter-to-class="enter-to">
              <TableRow v-for="(row, index) in userLogins" :key="row.id" :style="`--delay: ${getMs(index)}`">
                <TableCell>
                  {{ row.user.first_name }} {{ row.user.last_name }}
                </TableCell>
                <TableCell class="text-right">
                  {{ row.user.email }}
                </TableCell>
                <TableCell class="text-right">
                  {{ row.ip }}
                </TableCell>
                <TableCell class="text-right text-nowrap">
                  {{ $moment(row.created_at).format('DD/MM/YYYY HH:mm:ss') }}
                </TableCell>
              </TableRow>
            </transition-group>

            <template v-if="isLoading">
              <TableRow v-for="i in perPage" :key="i">
                <TableCell v-for="j in 4" :key="i">
                  <Skeleton :key="j" class="h-4 w-full bg-gray-300 my-1" />
                </TableCell>
              </TableRow>
            </template>

            <template v-if="!isLoading && (!userLogins || !userLogins.length)">
              <TableRow>
                <TableCell :colspan="4" class="text-center pt-5">
                  Nenhum histórico de login encontrado.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>

        <CustomSimplePagination
          :current-page="currentPage"
          :per-page="perPage"
          @page-changed="fetchUserLogins"
          @update:per-page="(val) => perPage = val"
        />
      </CardContent>
    </Card>

  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from "vue";
import FilterDialogComponent from "@/components/user_logins/FilterDialogComponent.vue";
import UserLogins from '@/services/userLogins';
import { getMs } from "@/filters/formatNumbers";
import CustomSimplePagination from "@/components/custom/CustomSimplePagination.vue";
import {CaretSortIcon} from "@radix-icons/vue";
import {ArrowDown, ArrowUp} from "lucide-vue-next";

const isLoading = ref(true);
const perPage = ref(15);
const currentPage = ref(1);
const userLogins: any = ref([]);
const filters = ref({});
const order = ref("id");
const direction = ref(false);

const fetchUserLogins = async (page = currentPage.value) => {
  currentPage.value = page;

  try {
    const response = await UserLogins.index({
      ...filters.value,
      orderBy: order.value,
      perPage: perPage.value,
      page: currentPage.value,
      orderDirection: direction.value ? "asc" : "desc",
    });

    userLogins.value = response.data
  } catch (e) {
    console.error(e);
  }
};

const handleSort = (column: string) => {
  if (order.value === column) {
    if (direction.value === false) {
      direction.value = true;
    } else {
      order.value = "id";
      direction.value = false;
    }
  } else {
    order.value = column;
    direction.value = false;
  }

  fetchUserLogins(currentPage.value);
};

const setFilters = async (params: any) => {
  isLoading.value = true;
  await fetchUserLogins(1);
  isLoading.value = false;
};

onMounted(async () => {
  isLoading.value = true;
  await fetchUserLogins(1);
  isLoading.value = false;
});
</script>

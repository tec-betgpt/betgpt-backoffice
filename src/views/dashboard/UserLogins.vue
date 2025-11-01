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
                Entrou em
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <transition-group
              appear
              enter-active-class="enter-active"
              leave-active-class="leave-active"
              enter-from-class="enter"
              enter-to-class="enter-to"
              leave-from-class="leave"
              leave-to-class="leave-to"
            >
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
              <TableRow v-for="i in limit" :key="i">
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

        <Button
          v-if="userLogins && userLogins.length"
          :disabled="isAllRecords"
          @click="loadMore()"
          variant="ghost"
          class=":text-yellow-400"
        >
          {{ isAllRecords ? 'Limite de registros atingido' : 'Carregar mais' }}
        </Button>
      </CardContent>
    </Card>

  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from "vue";
import FilterDialogComponent from "@/components/user_logins/FilterDialogComponent.vue";
import UserLogins from '@/services/userLogins';

// data
const isLoading = ref(true);
const isAllRecords = ref(false);
const offset = ref(0);
const limit = ref(15);
const userLogins: any = ref([]);
const filters = ref({});

// hooks
onMounted(async () => {
  await _userLogins({
    offset: offset.value,
    limit: limit.value,
  });
});

// functions
const _userLogins = async (params = {}) => {
  isLoading.value = true;

  try {
    const data: Array<any> = await UserLogins.index(params);

    if (data.length === 0) {
      isLoading.value = false;
      isAllRecords.value = true;
      return;
    }

    userLogins.value.push(...data);
  } catch (e) {
    console.error(e);
  }

  isLoading.value = false;
};

const loadMore = async () => {
  offset.value += limit.value;

  await _userLogins({
    ...filters.value,
    offset: offset.value,
    limit: limit.value,
  });
};

const setFilters = async (params: any) => {
  isLoading.value = true;
  isAllRecords.value = false;
  offset.value = 0;
  filters.value = params;
  limit.value = params.limit || limit.value;
  userLogins.value = [];

  await _userLogins({
    ...filters.value,
    offset: offset.value,
    limit: limit.value,
  });
};

const getMs = (num: number): string => {
  return (num / 10).toFixed(1) + "s";
};
</script>

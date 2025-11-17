<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Usuários Assinantes</h2>
        <p class="text-muted-foreground">
          Modifique as configurações de serviços sobre usuários que possuem um projeto vinculado
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
      </div>
    </div>

    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <Table class="w-full'">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead class="text-right">Workspaces</TableHead>
              <TableHead class="text-right">Plano/Serviço</TableHead>
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
              <TableRow v-for="(row, index) in users" :key="row.id" :style="`--delay: ${getMs(index)}`">
                <TableCell>
                  {{ row.first_name }} {{ row.last_name }}
                </TableCell>
                <TableCell>
                  {{ row.email }}
                </TableCell>
                <TableCell class="text-right">
                  <Badge variant="outline">
                    {{ row.projects_count }} workspaces
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <Badge variant="outline" v-if="row.service">
                    {{ row.service.name }}
                  </Badge>
                  <span v-else>
                    -
                  </span>
                </TableCell>
                <TableCell class="text-right">
                  <SettingsDialogComponent :reload="fetchUsers" :row="row" />
                  <ServiceDialogComponent :reload="fetchUsers" :row="row" />
                </TableCell>
              </TableRow>
            </transition-group>
          </TableBody>
        </Table>

        <CustomPagination
          :select-page="fetchUsers"
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
import Users from "@/services/users";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import {Card, CardContent} from "@/components/ui/card";
import {Table} from "@/components/ui/table";
import ServiceDialogComponent from "@/components/subscribers/ServiceDialogComponent.vue";
import SettingsDialogComponent from "@/components/subscribers/SettingsDialogComponent.vue";

const { toast } = useToast();

type User = {
  id: string;
  service_id: number | null
  first_name: string;
  last_name: string;
  email: string;
  debit_in: string | null
  expires_on: string | null
  day_to_debit: number | null
  projects_count: number
  service: {
    id: number
    name: string
  } | null
}

const users = ref<User[]>([]);
const isLoading = ref(true);
const pages = ref({
  current: 1,
  last: 0,
  total: 0,
});
const perPage = ref(20);

const fetchUsers = async (params = {}) => {
  try {
    const data = await Users.withProjects(params);

    users.value = data.data;
    pages.value = {
      current: data.current_page,
      last: data.last_page,
      total: data.total,
    };
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  isLoading.value = true
  await fetchUsers()
  isLoading.value = false
});
</script>

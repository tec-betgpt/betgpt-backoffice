<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Listas de Proteção</h2>
        <p class="text-muted-foreground">
          Gerencie os registros de proteção.
        </p>
      </div>

      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CreateDialogComponent :reload="fetchProtectionLists" />
      </div>
    </div>

    <Card>
      <CardHeader>
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <Label for="protectionType">Tipo de Proteção</Label>
            <Select v-model="filters.event_type" @update:modelValue="fetchProtectionLists(1)">
              <SelectTrigger id="protectionType">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forced">Forced</SelectItem>
                <SelectItem value="exclusion">Exclusion</SelectItem>
                <SelectItem value="temp_suspension">Temp Suspension</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex-1">
            <Label for="channel">Canal</Label>
            <Input id="channel" v-model="filters.channel" placeholder="Filtrar por canal" @input="fetchProtectionLists(1)" />
          </div>
          <div class="flex-1">
            <Label for="date">Data</Label>
            <Input id="date" type="date" v-model="filters.date" @change="fetchProtectionLists(1)" />
          </div>
          <div class="flex items-end">
             <Button variant="outline" @click="clearFilters">Limpar Filtros</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="py-4 flex flex-col gap-4">
        <Table class="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Identificador</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <transition-group appear enter-active-class="enter-active" enter-from-class="enter" enter-to-class="enter-to">
              <TableRow v-for="(row, index) in protectionLists" :key="row.id" :style="`--delay: ${getMs(index)}`">
                <TableCell>
                  {{ row.id }}
                </TableCell>
                <TableCell>
                  {{ row.event_type }}
                </TableCell>
                <TableCell>
                  {{ row.channel }}
                </TableCell>
                <TableCell>
                  {{ $moment(row.start_at).format('DD/MM/YYYY') }} - {{ row.end_at ? $moment(row.end_at).format('DD/MM/YYYY') : 'Indefinido' }}
                </TableCell>
                <TableCell>
                  <Badge v-if="row.dispatch_type === 'LP_ENTERED'" variant="secondary" class="bg-blue-200 text-blue-800">Regra Manual</Badge>
                  <Badge v-else variant="secondary" class="bg-gray-200 text-gray-800">Status do Usuário</Badge>
                </TableCell>
                <TableCell class="text-right">
                  <div class="gap-1 flex flex-nowrap justify-end">
                    <EditDialogComponent :row="row" :reload="fetchProtectionLists" />
                    <DestroyDialogComponent :destroy="destroy" :row="row" :reload="fetchProtectionLists" />
                  </div>
                </TableCell>
              </TableRow>
            </transition-group>

            <template v-if="isLoading">
              <TableRow v-for="i in 5" :key="i">
                <TableCell v-for="j in 6" :key="i">
                  <Skeleton :key="j" class="h-4 w-full bg-gray-300 my-1" />
                </TableCell>
              </TableRow>
            </template>

            <template v-if="!isLoading && (!protectionLists || !protectionLists.length)">
              <TableRow>
                <TableCell :colspan="6" class="text-center py-5">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>

        <CustomPagination
          :select-page="fetchProtectionLists"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="(value) => perPage = value"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { getMs } from "@/filters/formatNumbers";
import { useWorkspaceStore } from "@/stores/workspace";
import ProtectionLists from "@/services/protectionLists";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CreateDialogComponent from "@/components/protection-lists/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/protection-lists/EditDialogComponent.vue";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const { toast } = useToast();

const workspaceStore = useWorkspaceStore();
const protectionLists = ref([]);
const isLoading = ref(true);
const perPage = ref(15);
const pages = ref({
  current: 1,
  last: 1,
  total: 0
});

const filters = reactive({
  event_type: '',
  channel: '',
  date: ''
});

const fetchProtectionLists = async (page = 1) => {
  isLoading.value = true;
  try {
    const params = {
      project_id: workspaceStore.activeGroupProject?.id!,
      page,
      per_page: perPage.value,
      ...filters
    };

    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null) {
        delete params[key];
      }
    });

    const response = await ProtectionLists.index(params);

    protectionLists.value = response.data;
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
  } finally {
    isLoading.value = false;
  }
}

const destroy = async (id: number) => {
  try {
    await ProtectionLists.destroy(id);
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao remover os dados.",
      variant: "destructive",
    });
  }
}

const clearFilters = () => {
  filters.event_type = '';
  filters.channel = '';
  filters.date = '';
  fetchProtectionLists(1);
}

onMounted(async () => {
  await fetchProtectionLists();
});
</script>

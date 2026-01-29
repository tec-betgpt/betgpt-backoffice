<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Relatórios de Listas de Proteção</h2>
        <p class="text-muted-foreground">
          Visualize e baixe os relatórios gerados.
        </p>
      </div>
    </div>

    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <Table class="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome do Arquivo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead class="text-right">Downloads / Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <transition-group appear enter-active-class="enter-active" enter-from-class="enter" enter-to-class="enter-to">
              <TableRow v-for="(row, index) in reports" :key="row.id" :style="`--delay: ${getMs(index)}`">
                <TableCell>
                  {{ row.id }}
                </TableCell>
                <TableCell>
                  {{ row.file_name }}
                </TableCell>
                <TableCell>
                  <Badge :variant="getStatusVariant(row.status)">
                    {{ formatStatus(row.status) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  {{ $moment(row.created_at).format('DD/MM/YYYY HH:mm') }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button
                      v-if="row.file_path_csv"
                      size="sm"
                      variant="outline"
                      @click="openLink(row.file_path_csv)"
                      title="Baixar CSV"
                    >
                      <FileSpreadsheet class="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                    <Button
                      v-if="row.file_path_xls"
                      size="sm"
                      variant="outline"
                      @click="openLink(row.file_path_xls)"
                      title="Baixar XLS"
                    >
                      <FileChartColumn class="h-4 w-4 mr-1" />
                      XLS
                    </Button>
                    <DestroyDialogComponent :destroy="destroy" :row="row" :reload="fetchReports" />
                  </div>
                </TableCell>
              </TableRow>
            </transition-group>

            <template v-if="isLoading">
              <TableRow v-for="i in 5" :key="i">
                <TableCell v-for="j in 5" :key="i">
                  <Skeleton :key="j" class="h-4 w-full bg-gray-300 my-1" />
                </TableCell>
              </TableRow>
            </template>

            <template v-if="!isLoading && (!reports || !reports.length)">
              <TableRow>
                <TableCell :colspan="5" class="text-center py-5">
                  Nenhum relatório encontrado.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>

        <CustomPagination
          :select-page="fetchReports"
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
import ProtectionListReports from "@/services/protectionListReports";
import { useWorkspaceStore } from "@/stores/workspace";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileChartColumn } from "lucide-vue-next";

const { toast } = useToast();

const workspaceStore = useWorkspaceStore();
const reports = ref([]);
const isLoading = ref(true);
const perPage = ref(15);
const pages = ref({
  current: 1,
  last: 1,
  total: 0
});

const fetchReports = async (page = 1) => {
  isLoading.value = true;
  try {
    const response = await ProtectionListReports.index({
      project_id: workspaceStore.activeGroupProject?.id!,
      page,
      per_page: perPage.value
    });

    reports.value = response.data;
    pages.value = {
      current: response.current_page,
      last: response.last_page,
      total: response.total,
    };
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os relatórios.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
}

const destroy = async (id: number) => {
  try {
    await ProtectionListReports.destroy(id);
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao remover o relatório.",
      variant: "destructive",
    });
  }
}

const openLink = (url: string) => {
  if (url) {
    window.open(url, '_blank');
  }
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'default';
    case 'processing': return 'secondary';
    case 'pending': return 'outline';
    case 'failed': return 'destructive';
    default: return 'secondary';
  }
}

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    completed: 'Concluído',
    processing: 'Processando',
    pending: 'Pendente',
    failed: 'Falhou'
  };

  return map[status] || status;
}

onMounted(async () => {
  await fetchReports();
});
</script>

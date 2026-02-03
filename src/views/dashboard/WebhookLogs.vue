<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Logs de Webhook</h2>
        <p class="text-muted-foreground">
          Histórico de disparos de webhooks e reprocessamento.
        </p>
      </div>
    </div>

    <Card>
      <CardHeader>
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <Label for="statusFilter">Status</Label>
            <Select v-model="filters.status" @update:modelValue="fetchLogs(1)">
              <SelectTrigger id="statusFilter">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div class="flex-1">
            <Label for="orderFilter">Ordenação</Label>
            <Select v-model="filters.order" @update:modelValue="fetchLogs(1)">
              <SelectTrigger id="orderFilter">
                <SelectValue placeholder="Decrescente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Mais recentes</SelectItem>
                <SelectItem value="asc">Mais antigos</SelectItem>
              </SelectContent>
            </Select>
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
              <TableHead>ID</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Status HTTP</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Erro/Motivo</TableHead>
              <TableHead class="text-right">Data</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <transition-group appear enter-active-class="enter-active" enter-from-class="enter" enter-to-class="enter-to">
              <TableRow v-for="(row, index) in logs" :key="row.id" :style="`--delay: ${getMs(index)}`">
                <TableCell>
                  {{ row.id }}
                </TableCell>
                <TableCell>
                  <div v-if="row.webhookable">
                    <span class="font-medium">{{ row.webhookable_type.split('\\').pop() }}</span>
                    <span class="text-xs text-muted-foreground block">#{{ row.webhookable.id }} - {{ row.webhookable.name || 'Sem Nome' }}</span>
                  </div>
                  <div v-else>
                    <span class="text-muted-foreground text-xs">Entidade removida</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{{ row.response_status ?? 'N/A' }}</Badge>
                </TableCell>
                <TableCell>
                  <Badge v-if="row.success" class="bg-green-100 text-green-800 hover:bg-green-100">Sucesso</Badge>
                  <Badge v-else variant="destructive">Falha</Badge>
                </TableCell>
                <TableCell class="max-w-[200px] truncate" :title="row.reason">
                  {{ row.reason || '-' }}
                </TableCell>
                <TableCell class="text-right text-nowrap">
                  {{ $moment(row.created_at).format('DD/MM/YYYY HH:mm:ss') }}
                </TableCell>
                <TableCell class="text-right">
                  <Button 
                    v-if="!row.success" 
                    variant="ghost" 
                    size="sm" 
                    @click="retryWebhook(row.id)"
                    :disabled="retrying === row.id"
                  >
                    <RefreshCw v-if="retrying === row.id" class="mr-2 h-4 w-4 animate-spin" />
                    <RefreshCw v-else class="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            </transition-group>

            <template v-if="isLoading">
              <TableRow v-for="i in 5" :key="i">
                <TableCell v-for="j in 7" :key="j">
                  <Skeleton class="h-4 w-full bg-gray-300 my-1" />
                </TableCell>
              </TableRow>
            </template>

            <template v-if="!isLoading && (!logs || !logs.length)">
              <TableRow>
                <TableCell :colspan="7" class="text-center py-5">
                  Nenhum log encontrado.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>

        <CustomPagination
          :select-page="fetchLogs"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="(value) => perPage = value"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { getMs } from "@/filters/formatNumbers";
import { useWorkspaceStore } from "@/stores/workspace";
import WebhookLogs from "@/services/webhooks";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-vue-next";

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();

const logs = ref([]);
const isLoading = ref(true);
const perPage = ref(20);
const retrying = ref<number | null>(null);
const pages = ref({
  current: 1,
  last: 1,
  total: 0
});

const filters = reactive({
  status: 'all',
  order: 'desc'
});

const fetchLogs = async (page = 1) => {
  // Aguarda o workspace carregar se necessário
  if (!workspaceStore.activeGroupProject?.id) {
     return;
  }

  isLoading.value = true;
  try {
    const params = {
      filter_id: workspaceStore.activeGroupProject.id,
      page,
      per_page: perPage.value,
      order: filters.order,
      ...(filters.status !== 'all' && { status: filters.status })
    };

    const response = await WebhookLogs.indexLogs(params);

    logs.value = response.data;
    pages.value = {
      current: response.current_page,
      last: response.last_page,
      total: response.total,
    };
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar logs de webhook.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
}

const retryWebhook = async (id: number) => {
  retrying.value = id;
  try {
    await WebhookLogs.retry(id);
    toast({
      title: "Sucesso",
      description: "Reenvio agendado com sucesso.",
    });
    // Não recarrega a lista propositalmente (UX: processamento em background)
  } catch (error) {
    toast({
      title: "Erro",
      description: "Falha ao agendar reenvio.",
      variant: "destructive",
    });
  } finally {
    retrying.value = null;
  }
}

const clearFilters = () => {
  filters.status = 'all';
  filters.order = 'desc';
  fetchLogs(1);
}

watch(() => workspaceStore.activeGroupProject, (newVal) => {
    if (newVal?.id) {
        fetchLogs(1);
    }
});

onMounted(async () => {
    if (workspaceStore.activeGroupProject?.id) {
        await fetchLogs();
    }
});
</script>

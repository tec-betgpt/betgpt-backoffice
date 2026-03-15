<template>
  <div class="space-y-4 md:space-y-6 p-4 md:p-10 pb-16 w-full bg-slate-50/30 dark:bg-transparent min-h-screen transition-colors">
    <!-- Header com Navegação -->
    <div class="flex items-center gap-3 md:gap-4">
      <Button variant="outline" size="icon" @click="$router.push({ name: 'clients' })" class="h-8 w-8 md:h-10 md:w-10">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <div>
        <h2 class="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Perfil do Cliente</h2>
        <p class="text-xs md:text-sm text-muted-foreground line-clamp-1">Gerenciamento detalhado e histórico de atividade.</p>
      </div>
    </div>

    <div v-if="isLoading && !player" class="space-y-6">
      <Skeleton class="h-32 w-full rounded-xl" />
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton v-for="i in 4" :key="i" class="h-20 md:h-24 w-full rounded-xl" />
      </div>
      <Skeleton class="h-96 w-full rounded-xl" />
    </div>

    <div v-else-if="player" class="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <!-- Perfil Principal -->
      <PlayerProfileHeader 
        :player="player" 
        :reload="() => fetchHistory(1)" 
        :filter-id="activeGroupProjectId" 
      />

      <!-- KPIs Financeiros -->
      <PlayerFinancialStats :stats="financialStats" />

      <!-- Conteúdo em Abas -->
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="flex w-full overflow-x-auto justify-start md:grid md:grid-cols-3 md:max-w-[450px] mb-4 bg-transparent md:bg-muted p-0 md:p-1 h-auto gap-2 md:gap-0">
          <TabsTrigger value="activity" class="flex-1 py-2 text-xs md:text-sm border md:border-none rounded-md">Atividade</TabsTrigger>
          <TabsTrigger value="profile" class="flex-1 py-2 text-xs md:text-sm border md:border-none rounded-md">Perfil</TabsTrigger>
          <TabsTrigger value="tags" class="flex-1 py-2 text-xs md:text-sm border md:border-none rounded-md">Tags</TabsTrigger>
        </TabsList>

        <!-- Aba de Atividade (Timeline) -->
        <TabsContent value="activity" class="mt-0">
          <Card class="shadow-sm border-none md:border">
            <CardHeader class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle class="text-lg md:text-xl">Linha do Tempo</CardTitle>
                <CardDescription class="text-xs">Eventos registrados no sistema.</CardDescription>
              </div>
              <div class="w-full sm:w-auto">
                <Select v-model="selectedEventType">
                  <SelectTrigger class="w-full sm:w-[180px] h-9 text-xs">
                    <SelectValue placeholder="Filtrar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Eventos</SelectItem>
                    <SelectItem v-for="opt in filterOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent class="p-2 md:p-6">
              <div ref="timelineContainer" @scroll="handleScroll" class="max-h-[60vh] md:max-h-[600px] overflow-y-auto px-2 md:px-4">
                <PlayerTimeline :history="filteredHistory" @view-details="showHistoryEventDetails" />
                
                <div v-if="isHistoryLoading" class="flex justify-center py-6">
                  <Loader2Icon class="h-6 w-6 animate-spin text-slate-400" />
                </div>
                
                <div v-if="hasMoreHistory && !isHistoryLoading" class="flex justify-center py-4">
                  <Button variant="ghost" size="sm" class="text-xs" @click="fetchHistory(currentPage + 1)">
                    Carregar mais registros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Aba de Perfil Detalhado -->
        <TabsContent value="profile" class="mt-0 space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <Card class="lg:col-span-2 shadow-sm border-none md:border">
              <CardHeader>
                <CardTitle class="text-lg">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 md:gap-y-6 gap-x-4">
                <div class="space-y-1">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Data de Nascimento</p>
                  <p class="text-sm font-medium">{{ formatDate(player.birthday) }} ({{ getAge(player.birthday) }} anos)</p>
                </div>
                <div class="space-y-1">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Membro desde</p>
                  <p class="text-sm font-medium">{{ formatDate(player.created_at) }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">CPF / Documento</p>
                  <p class="text-sm font-medium">{{ player.document || 'Não informado' }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Gênero</p>
                  <p class="text-sm font-medium capitalize">{{ player.gender || 'Não informado' }}</p>
                </div>
              </CardContent>
            </Card>

            <Card class="shadow-sm border-none md:border">
              <CardHeader>
                <CardTitle class="text-lg">Conectividade</CardTitle>
              </CardHeader>
              <CardContent class="space-y-3 md:space-y-4">
                <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <MapPinIcon class="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                  <div>
                    <p class="text-[10px] text-slate-500 uppercase font-bold">Último IP</p>
                    <p class="text-xs md:text-sm font-mono">{{ player.last_ip || '---.---.---.---' }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <SmartphoneIcon class="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                  <div>
                    <p class="text-[10px] text-slate-500 uppercase font-bold">Dispositivo</p>
                    <p class="text-xs md:text-sm font-medium">{{ player.last_device || 'Desconhecido' }}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <!-- Aba de Tags -->
        <TabsContent value="tags" class="mt-0">
          <Card class="shadow-sm border-none md:border">
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-lg">
                <TagIcon class="h-5 w-5 text-slate-400" />
                Tags do Jogador
              </CardTitle>
              <CardDescription class="text-xs">Gerencie rótulos para segmentação e automação.</CardDescription>
            </CardHeader>
            <CardContent>
              <TagManager
                model-type="player"
                :model-id="player.id"
                :project-id="activeGroupProjectId" 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Dialog de Detalhes do Evento (Responsivo) -->
    <Dialog :open="isHistoryDetailDialogOpen" @update:open="isHistoryDetailDialogOpen = false">
      <DialogContent v-if="selectedHistoryEvent" class="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle class="text-lg md:text-xl">{{ selectedHistoryEvent.title }}</DialogTitle>
          <DialogDescription class="text-xs">
            Registrado em {{ formatDateTime(selectedHistoryEvent.date) }}
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded-lg border dark:border-slate-800">
              <p class="text-[10px] text-slate-500 uppercase font-bold mb-1">Tipo de Evento</p>
              <Badge variant="outline" class="text-xs">{{ selectedHistoryEvent.type }}</Badge>
            </div>
            <div class="p-3 rounded-lg border dark:border-slate-800">
              <p class="text-[10px] text-slate-500 uppercase font-bold mb-1">Descrição</p>
              <p class="text-xs leading-relaxed">{{ selectedHistoryEvent.description }}</p>
            </div>
          </div>

          <div v-if="selectedHistoryEvent.payload">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[10px] text-slate-500 uppercase font-bold">Payload (JSON)</p>
              <Button variant="ghost" size="sm" @click="copyPayload" class="h-7 text-[10px]">
                Copiar
              </Button>
            </div>
            <pre class="bg-slate-950 text-slate-100 p-3 md:p-4 rounded-xl text-[10px] md:text-xs overflow-auto max-h-48 md:max-h-64 border border-slate-800 shadow-inner"><code>{{ JSON.stringify(selectedHistoryEvent.payload, null, 2) }}</code></pre>
          </div>
        </div>

        <DialogFooter class="flex-col sm:flex-row gap-2">
          <Button variant="outline" @click="isHistoryDetailDialogOpen = false" class="w-full sm:w-auto">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { 
  ChevronLeft, Loader2Icon, MapPinIcon, 
  SmartphoneIcon, TagIcon 
} from "lucide-vue-next";
import Players from "@/services/players";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TagManager from "@/components/custom/TagManager.vue";
import PlayerProfileHeader from "@/components/players/PlayerProfileHeader.vue";
import PlayerFinancialStats from "@/components/players/PlayerFinancialStats.vue";
import PlayerTimeline from "@/components/players/PlayerTimeline.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const route = useRoute();
const { toast } = useToast();
const player = ref();
const history = ref([]);
const isLoading = ref(true);
const isHistoryLoading = ref(false);
const currentPage = ref(1);
const lastPage = ref(1);
const timelineContainer = ref(null);
const activeTab = ref('activity');

const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

// KPIs financeiros (Idealmente viriam do backend, senão calculamos do histórico se houver tudo lá)
const financialStats = computed(() => {
  if (!player.value) return { total_deposits: 0, total_withdrawals: 0, deposits_count: 0, withdrawals_count: 0, ggr: 0, current_balance: 0 };
  
  return {
    total_deposits: player.value.total_deposits || 0,
    total_withdrawals: player.value.total_withdrawals || 0,
    deposits_count: player.value.deposits_count || 0,
    withdrawals_count: player.value.withdrawals_count || 0,
    ggr: (player.value.total_deposits || 0) - (player.value.total_withdrawals || 0),
    current_balance: player.value.current_balance || 0
  };
});

const isHistoryDetailDialogOpen = ref(false);
const selectedHistoryEvent = ref(null);

const showHistoryEventDetails = (event) => {
  selectedHistoryEvent.value = event;
  isHistoryDetailDialogOpen.value = true;
};

const selectedEventType = ref('all');

const filterOptions = computed(() => {
  const uniqueTypes = new Set(history.value.map(event => event.type));
  return Array.from(uniqueTypes).map(type => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
  }));
});

const filteredHistory = computed(() => {
  if (selectedEventType.value === 'all') return history.value;
  return history.value.filter(event => event.type === selectedEventType.value);
});

const hasMoreHistory = computed(() => currentPage.value < lastPage.value);

const fetchHistory = async (page = 1) => {
  if (page > 1 && (isHistoryLoading.value || !hasMoreHistory.value)) return;

  if (page > 1) isHistoryLoading.value = true;
  else isLoading.value = true;

  try {
    const params = {
      filter_id: activeGroupProjectId,
      include: 'history',
      page: page,
    };
    const data = await Players.show(route.params.id as string, params);

    if (page === 1) {
      player.value = data;
      history.value = data.history.data;
    } else {
      history.value.push(...data.history.data);
    }

    currentPage.value = data.history.current_page;
    lastPage.value = data.history.last_page;
  } catch (e) {
    console.error(e);
    toast({ title: "Erro", description: "Falha ao carregar dados do cliente.", variant: "destructive" });
  } finally {
    isLoading.value = false;
    isHistoryLoading.value = false;
  }
};

const handleScroll = () => {
  const el = timelineContainer.value;
  if (el) {
    const bottomOfWindow = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    if (bottomOfWindow && hasMoreHistory.value && !isHistoryLoading.value) {
      fetchHistory(currentPage.value + 1);
    }
  }
};

onMounted(() => fetchHistory(1));

const getAge = (value: string) => {
  if (!value) return 0;
  const today = new Date();
  const birthDate = new Date(value);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const formatDate = (date: any) => {
  if (!date) return '---';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
};

const formatDateTime = (date: any) => {
  if (!date) return '---';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(date));
};

const copyPayload = () => {
  if (selectedHistoryEvent.value?.payload) {
    navigator.clipboard.writeText(JSON.stringify(selectedHistoryEvent.value.payload, null, 2));
    toast({ title: "Copiado!", description: "Payload copiado para a área de transferência." });
  }
};
</script>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #334155;
}
</style>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <UsersIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <DialogTitle class="text-xl font-bold">{{ selectedAudience?.name }}</DialogTitle>
            <DialogDescription>Detalhes e configurações do público alvo</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div v-if="selectedAudience" class="space-y-6 py-4">
        <!-- Status e KPIs Rápidos -->
        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tamanho Atual</span>
            <div v-if="isLoading" class="mt-1">
              <Skeleton class="h-8 w-24" />
            </div>
            <p v-else class="text-2xl font-bold dark:text-slate-100 mt-1">
              {{ selectedAudience.players?.toLocaleString('pt-BR') || 0 }} 
              <small class="text-sm font-normal text-slate-500">players</small>
            </p>
          </div>
          <div class="p-4 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status de Processamento</span>
            <div class="mt-2">
              <Skeleton v-if="isLoading" class="h-6 w-28" />
              <Badge v-else :variant="getStatusConfig(selectedAudience.status).variant" class="flex items-center gap-1.5 w-fit px-2 py-0.5">
                <component :is="getStatusConfig(selectedAudience.status).icon" :class="['h-3.5 w-3.5', getStatusConfig(selectedAudience.status).spin ? 'animate-spin' : '']" />
                {{ getStatusConfig(selectedAudience.status).label }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- Informações Gerais -->
        <div class="space-y-3 text-foreground">
          <h4 class="text-sm font-bold flex items-center gap-2">
            <InfoIcon class="h-4 w-4 text-slate-400" />
            Informações Gerais
          </h4>
          <div class="grid grid-cols-1 gap-2 text-sm">
            <div class="flex justify-between py-2 border-b dark:border-slate-800 gap-4">
              <span class="text-slate-500 dark:text-slate-400 shrink-0">Descrição:</span>
              <Skeleton v-if="isLoading" class="h-4 w-48" />
              <span v-else class="text-slate-900 dark:text-slate-200 font-medium text-right">{{ selectedAudience.description || 'Nenhuma descrição' }}</span>
            </div>
            <div class="flex justify-between py-2 border-b dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400">Duração da Adesão:</span>
              <Skeleton v-if="isLoading" class="h-4 w-20" />
              <span v-else class="text-slate-900 dark:text-slate-200 font-medium">{{ selectedAudience.duration ? `${selectedAudience.duration} dias` : 'Permanente' }}</span>
            </div>
            <div class="flex justify-between py-2 border-b dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400">Última Atualização:</span>
              <Skeleton v-if="isLoading" class="h-4 w-32" />
              <span v-else class="text-slate-900 dark:text-slate-200 font-medium">{{ formatDate(selectedAudience.updated_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Segmento Base -->
        <div v-if="isLoading" class="p-4 rounded-xl border dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 space-y-2">
          <Skeleton class="h-5 w-48" />
          <Skeleton class="h-4 w-full" />
        </div>
        <div v-else-if="selectedAudience.segments && selectedAudience.segments.length > 0" class="space-y-3 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 text-foreground">
          <h4 class="text-sm font-bold text-blue-900 dark:text-blue-400 flex items-center gap-2">
            <FilterIcon class="h-4 w-4" />
            Segmento Vinculado: {{ selectedAudience.segments[0].name }}
          </h4>
          <p class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            Este público alvo é alimentado dinamicamente pelas regras do segmento acima. 
            Qualquer alteração no segmento refletirá automaticamente neste público após o próximo processamento.
          </p>
        </div>

        <!-- Sincronização com Provedores -->
        <div class="space-y-3 text-foreground">
          <h4 class="text-sm font-bold flex items-center gap-2">
            <RefreshCcwIcon class="h-4 w-4 text-slate-400" />
            Sincronização Externa
          </h4>
          
          <div v-if="isLoading" class="space-y-2">
            <Skeleton v-for="i in 2" :key="i" class="h-16 w-full rounded-lg" />
          </div>
          <template v-else>
            <div v-if="selectedAudience.syncs && selectedAudience.syncs.length > 0" class="space-y-3">
              <div v-for="sync in selectedAudience.syncs" :key="sync.id" class="flex flex-col gap-3 p-3 rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm transition-colors">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-3">
                    <div class="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                      <component :is="getProviderIcon(sync.provider)" class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p class="text-sm font-semibold">{{ getProviderLabel(sync.provider) }}</p>
                      <Badge :variant="sync.status === 'error' ? 'destructive' : 'outline'" class="text-[9px] h-4 px-1 uppercase font-bold tracking-tighter">
                        {{ sync.status || 'Ativo' }}
                      </Badge>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">ID Externo</p>
                    <p class="text-[10px] font-mono text-slate-500 dark:text-slate-400">{{ sync.provider_audience_id || '---' }}</p>
                  </div>
                </div>

                <!-- Error Message -->
                <div v-if="sync.status === 'error' && sync.last_sync_error" class="bg-destructive/10 dark:bg-destructive/20 p-2 rounded-md border border-destructive/20 mt-1">
                  <p class="text-[10px] font-bold text-destructive uppercase flex items-center gap-1 mb-1">
                    <AlertCircleIcon class="h-3 w-3" /> Detalhes do Erro
                  </p>
                  <p class="text-xs text-destructive dark:text-red-400 leading-tight">
                    {{ sync.last_sync_error.message }} <span class="font-bold underline ml-1">Reporte ao suporte.</span>
                  </p>
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-slate-500 dark:text-slate-400 italic p-4 text-center border-2 border-dashed dark:border-slate-800 rounded-xl">
              Nenhuma sincronização externa configurada para este público.
            </div>
          </template>
        </div>
      </div>

      <DialogFooter class="border-t dark:border-slate-800 pt-4 gap-2">
        <Button variant="outline" @click="isOpen = false">Fechar</Button>
        <Button @click="handleEdit">Editar Público</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TargetAudience from "@/services/targetAudience";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UsersIcon, InfoIcon, FilterIcon, RefreshCcwIcon, ClockIcon, 
  Loader2Icon, CheckCircle2Icon, AlertCircleIcon, TargetIcon 
} from "lucide-vue-next";

const isOpen = ref(false);
const isLoading = ref(false);
const selectedAudience = ref<any>(null);

const emit = defineEmits(['edit']);

const open = async (audience: any) => {
  isOpen.value = true;
  isLoading.value = true;
  selectedAudience.value = audience; // Set initial data from row
  
  try {
    const response = await TargetAudience.show({ id: audience.id });
    selectedAudience.value = response;
  } catch (error) {
    console.error("Error fetching audience details:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = () => {
  isOpen.value = false;
  emit('edit', selectedAudience.value);
};

const getStatusConfig = (status: string) => {
  const statusMap: any = {
    pending: { label: "Pendente", variant: "secondary", icon: ClockIcon },
    processing: { label: "Processando", variant: "default", icon: Loader2Icon, spin: true },
    completed: { label: "Concluído", variant: "outline", icon: CheckCircle2Icon, class: "text-emerald-600 border-emerald-200 bg-emerald-50" },
    failed: { label: "Erro", variant: "destructive", icon: AlertCircleIcon },
  };
  return statusMap[status] || statusMap.pending;
};

const formatDate = (date: any) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
};

const getProviderIcon = (provider: string) => {
  return provider === 'meta' ? TargetIcon : RefreshCcwIcon;
};

const getProviderLabel = (provider: string) => {
  return provider === 'meta' ? 'Meta Ads' : provider;
};

defineExpose({ open });
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <TargetIcon class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <DialogTitle class="text-xl font-bold">{{ metaData?.name || initialData?.name }}</DialogTitle>
            <DialogDescription>Detalhes do Público Customizado no Meta Ads</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <!-- Status e Alcance Rápidos -->
        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alcance Estimado</span>
            <div v-if="isLoading" class="mt-1">
              <Skeleton class="h-8 w-32" />
            </div>
            <p v-else class="text-2xl font-bold text-indigo-900 dark:text-indigo-400 mt-1">
              {{ formatReach(metaData) }}
            </p>
          </div>
          <div class="p-4 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status de Entrega</span>
            <div class="mt-2">
              <Skeleton v-if="isLoading" class="h-6 w-28" />
              <Badge v-else variant="outline" class="flex items-center gap-1.5 w-fit px-2 py-0.5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10">
                <CheckCircle2Icon class="h-3.5 w-3.5" />
                {{ metaData?.delivery_status?.description || 'Pronto para uso' }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- Informações Técnicas -->
        <div class="space-y-3 text-foreground">
          <h4 class="text-sm font-bold flex items-center gap-2">
            <InfoIcon class="h-4 w-4 text-slate-400" />
            Detalhes da Conta e Operação
          </h4>
          <div class="grid grid-cols-1 gap-2 text-sm">
            <div class="flex justify-between py-2 border-b dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400">ID do Público:</span>
              <Skeleton v-if="isLoading" class="h-4 w-32" />
              <span v-else class="font-mono text-xs dark:text-slate-300">{{ metaData?.id }}</span>
            </div>
            <div class="flex justify-between py-2 border-b dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400">ID da Conta de Anúncios:</span>
              <Skeleton v-if="isLoading" class="h-4 w-32" />
              <span v-else class="font-mono text-xs dark:text-slate-300">{{ metaData?.account_id }}</span>
            </div>
            <div class="flex justify-between py-2 border-b dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400">Status de Operação:</span>
              <Skeleton v-if="isLoading" class="h-4 w-20" />
              <span v-else class="dark:text-slate-200 font-medium">{{ metaData?.operation_status?.description || 'Normal' }}</span>
            </div>
            <div class="flex justify-between py-2 border-b dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400">Subtipo:</span>
              <Skeleton v-if="isLoading" class="h-4 w-16" />
              <span v-else class="dark:text-slate-200 font-medium">{{ metaData?.subtype }}</span>
            </div>
          </div>
        </div>

        <!-- Datas -->
        <div class="grid grid-cols-2 gap-6 text-foreground">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Criado em</span>
            <div v-if="isLoading"><Skeleton class="h-4 w-24" /></div>
            <p v-else class="text-sm text-slate-700 dark:text-slate-300 font-medium">{{ formatDate(metaData?.time_created) }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Última Atualização</span>
            <div v-if="isLoading"><Skeleton class="h-4 w-24" /></div>
            <p v-else class="text-sm text-slate-700 dark:text-slate-300 font-medium">{{ formatDate(metaData?.time_updated) }}</p>
          </div>
        </div>

        <!-- Configurações Adicionais -->
        <div class="p-4 rounded-xl border dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 space-y-3">
          <h4 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Metadados</h4>
          <div class="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
            <div>
              <p class="text-slate-400">Base de Valor (Value Based)</p>
              <p class="font-medium dark:text-slate-200">{{ metaData?.is_value_based ? 'Sim' : 'Não' }}</p>
            </div>
            <div>
              <p class="text-slate-400">Fonte dos Dados</p>
              <p class="font-medium dark:text-slate-200">{{ metaData?.customer_file_source || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-slate-400">Dias de Retenção</p>
              <p class="font-medium dark:text-slate-200">{{ metaData?.retention_days || 0 }} dias</p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="border-t dark:border-slate-800 pt-4">
        <Button variant="outline" @click="isOpen = false">Fechar Visualização</Button>
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
  TargetIcon, InfoIcon, CheckCircle2Icon
} from "lucide-vue-next";

const isOpen = ref(false);
const isLoading = ref(false);
const metaData = ref<any>(null);
const initialData = ref<any>(null);

const open = async (data: any) => {
  initialData.value = data;
  isOpen.value = true;
  isLoading.value = true;
  
  try {
    const response = await TargetAudience.metaShow({ id: data.id });
    // A estrutura informada tem um campo .data
    metaData.value = response.data || response;
  } catch (error) {
    console.error("Error fetching meta audience details:", error);
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return "-";
  return new Date(timestamp * 1000).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatReach = (data: any) => {
  if (!data) return "---";
  const lower = data.approximate_count_lower_bound;
  const upper = data.approximate_count_upper_bound;
  
  if (lower === -1 || upper === -1) return "Processando";
  
  return `${lower?.toLocaleString('pt-BR')} - ${upper?.toLocaleString('pt-BR')}`;
};

defineExpose({ open });
</script>

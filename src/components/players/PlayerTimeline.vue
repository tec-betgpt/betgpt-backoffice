<template>
  <div class="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
    <div v-for="(event, index) in history" :key="event.id || `${event.type}-${event.date}-${index}`" class="relative flex items-start gap-6 group">
      <!-- Icon indicator -->
      <div class="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 shadow-sm z-10 transition-transform group-hover:scale-110" :class="getEventConfig(event.type).bgColor">
        <component :is="getEventConfig(event.type).icon" class="h-4 w-4" :class="getEventConfig(event.type).iconColor" />
      </div>

      <div class="flex-1 ml-12 pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-1">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm">
            {{ event.title }}
          </h4>
          <time class="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            {{ formatDate(event.date) }}
          </time>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
          {{ event.description }}
        </p>
        
        <div class="flex items-center gap-2">
          <Badge variant="outline" class="text-[10px] h-5 px-1.5 font-semibold uppercase tracking-tighter">
            {{ event.type }}
          </Badge>
          <Button 
            v-if="event.payload" 
            variant="ghost" 
            size="sm" 
            class="h-6 px-2 text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            @click="$emit('view-details', event)"
          >
            <CodeIcon class="h-3 w-3 mr-1" /> Ver Detalhes
          </Button>
        </div>
      </div>
    </div>

    <div v-if="history.length === 0" class="flex flex-col items-center justify-center py-12 text-muted-foreground bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
      <HistoryIcon class="h-12 w-12 mb-4 opacity-20" />
      <p class="text-sm font-medium">Nenhuma atividade registrada ainda.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  ArrowDownCircleIcon, ArrowUpCircleIcon, LogInIcon, 
  UserCircleIcon, FilterIcon, HistoryIcon, CodeIcon,
  CircleIcon
} from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

defineProps<{
  history: any[];
}>();

defineEmits(['view-details']);

const formatDate = (date: any) => {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
};

const getEventConfig = (type: string) => {
  const configs: any = {
    deposit: { icon: ArrowDownCircleIcon, bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    withdrawal: { icon: ArrowUpCircleIcon, bgColor: 'bg-rose-100 dark:bg-rose-900/30', iconColor: 'text-rose-600 dark:text-rose-400' },
    login: { icon: LogInIcon, bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    profile_update: { icon: UserCircleIcon, bgColor: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
    segment: { icon: FilterIcon, bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
  };
  return configs[type] || { icon: CircleIcon, bgColor: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-500' };
};
</script>

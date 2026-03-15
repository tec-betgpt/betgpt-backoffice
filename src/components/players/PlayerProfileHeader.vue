<template>
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors text-foreground overflow-hidden">
    <div class="flex items-center gap-3 md:gap-4 w-full md:w-auto">
      <div class="h-12 w-12 md:h-16 md:w-16 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
        <UserIcon class="h-6 w-6 md:h-8 md:w-8" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap mb-1">
          <h2 class="text-lg md:text-2xl font-bold truncate max-w-[180px] sm:max-w-none">{{ player?.name || 'Cliente Sem Nome' }}</h2>
          <Badge :variant="getStatusVariant(player?.status)" class="capitalize text-[10px] md:text-xs">
            {{ player?.status || 'Ativo' }}
          </Badge>
          <Badge v-if="player?.is_vip" variant="default" class="bg-amber-500 hover:bg-amber-600 text-white border-none text-[10px] md:text-xs px-1.5 py-0">
            <CrownIcon class="h-3 w-3 mr-1" /> VIP
          </Badge>
        </div>
        <div class="flex flex-col space-y-0.5">
          <p class="text-muted-foreground flex items-center gap-1.5 text-[11px] md:text-sm truncate">
            <MailIcon class="h-3 w-3 shrink-0" /> <span class="truncate">{{ player?.email }}</span>
          </p>
          <p class="text-muted-foreground flex items-center gap-1.5 text-[11px] md:text-sm">
            <PhoneIcon class="h-3 w-3 shrink-0" /> {{ formatPhone(player?.phone) }}
          </p>
        </div>
      </div>
    </div>

    <div class="flex gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
      <EditDialogComponent 
        v-if="player"
        :row="player" 
        :reload="reload" 
        :filter-id="filterId" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  UserIcon, MailIcon, PhoneIcon, CrownIcon
} from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import EditDialogComponent from "@/components/players/EditDialogComponent.vue";

defineProps<{
  player: any;
  reload: Function;
  filterId: string | number | null;
}>();

const getStatusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'default';
    case 'inactive': return 'secondary';
    case 'blocked': return 'destructive';
    default: return 'outline';
  }
};

const formatPhone = (phone: string) => {
  if (!phone) return 'N/A';
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
  if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
  return phone;
};
</script>

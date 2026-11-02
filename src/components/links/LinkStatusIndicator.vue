<script setup lang="ts">
import { computed } from "vue";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const props = defineProps<{
  status?: string | null;
}>();

const config = computed(() => {
  switch (props.status) {
    case "active":
      return { label: "Ativo", dot: "bg-emerald-500", ring: "ring-emerald-500/20" };
    case "paused":
      return { label: "Pausado", dot: "bg-amber-500", ring: "ring-amber-500/20" };
    case "draft":
      return { label: "Rascunho", dot: "bg-slate-400", ring: "ring-slate-400/20" };
    case "inactive":
      return { label: "Inativo", dot: "bg-red-500", ring: "ring-red-500/20" };
    case "archived":
      return { label: "Arquivado", dot: "bg-zinc-500", ring: "ring-zinc-500/20" };
    default:
      return { label: "Sem status", dot: "bg-muted-foreground", ring: "ring-muted-foreground/20" };
  }
});
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <span
          class="inline-flex h-6 w-6 items-center justify-center rounded-full"
          :aria-label="config.label"
          :title="config.label"
        >
          <span
            :class="['h-2.5 w-2.5 rounded-full ring-4', config.dot, config.ring]"
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>{{ config.label }}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="flex h-[85vh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
      <DialogHeader class="space-y-1 border-b border-border px-6 py-5 text-left">
        <DialogTitle class="text-xl">Bem-vindo ao Editor de Fluxos</DialogTitle>
        <DialogDescription>
          Escolha um template para começar ou monte o fluxo do seu jeito.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 border-b border-border px-6 py-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="search" placeholder="Buscar template por nome, canal ou objetivo..." class="h-11 pl-9" />
        </div>

        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="category in categories"
            :key="category.value"
            :variant="activeCategory === category.value ? 'default' : 'outline'"
            class="cursor-pointer gap-1"
            @click="activeCategory = category.value"
          >
            {{ category.label }}
            <span class="opacity-70">{{ category.count }}</span>
          </Badge>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <p v-if="loading" class="text-sm text-muted-foreground">Carregando templates...</p>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            class="flex flex-col gap-3 rounded-lg border border-dashed border-border p-5 text-left transition-colors hover:border-primary hover:bg-accent/40"
            @click="selectBlank"
          >
            <div class="flex items-start justify-between gap-2">
              <span class="flex size-9 items-center justify-center rounded-md bg-muted">
                <Plus class="size-4 text-muted-foreground" />
              </span>
            </div>
            <div>
              <div class="text-sm font-semibold">Fluxo em branco</div>
              <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                Comece do zero e monte o fluxo do seu jeito.
              </p>
            </div>
          </button>

          <button
            v-for="template in filteredTemplates"
            :key="template.key"
            type="button"
            class="flex flex-col gap-3 rounded-lg border border-border p-5 text-left transition-colors hover:border-primary hover:bg-accent/40"
            @click="selectTemplate(template)"
          >
            <div class="flex items-start justify-between gap-2">
              <span class="flex size-9 items-center justify-center rounded-md" :class="categoryBackgroundClass(template.category)">
                <component :is="categoryIcon(template.category)" class="size-4" :class="categoryColorClass(template.category)" />
              </span>
              <Badge variant="secondary">{{ template.node_count }} nós</Badge>
            </div>
            <div>
              <div class="text-sm font-semibold">{{ template.name }}</div>
              <p class="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {{ template.description }}
              </p>
            </div>
          </button>
        </div>

        <p v-if="!loading && filteredTemplates.length === 0" class="mt-2 text-sm text-muted-foreground">
          Nenhum template encontrado para os filtros aplicados.
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Plus, RotateCcw, Search, Sparkles, Target, TrendingUp, Workflow } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { FlowTemplate } from "@/contracts/campaignFlow";

const props = defineProps<{
  open: boolean;
  templates: FlowTemplate[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "select-template", template: FlowTemplate): void;
  (e: "select-blank"): void;
}>();

const search = ref("");
const ALL_CATEGORY = "__all__";
const activeCategory = ref(ALL_CATEGORY);

const TEMPLATE_CATEGORY_LABELS: Record<string, string> = {
  onboarding: "Boas-vindas",
  conversao: "Conversão",
  retencao: "Retenção",
  reativacao: "Reativação",
  engajamento: "Engajamento",
};

const categories = computed(() => {
  const counts = new Map<string, number>();
  for (const template of props.templates) {
    counts.set(template.category, (counts.get(template.category) || 0) + 1);
  }

  return [
    { value: ALL_CATEGORY, label: "Todas", count: props.templates.length },
    ...Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value, count]) => ({ value, label: TEMPLATE_CATEGORY_LABELS[value] || value, count })),
  ];
});

const filteredTemplates = computed(() => {
  const term = search.value.trim().toLowerCase();
  return props.templates.filter((template) => {
    if (activeCategory.value !== ALL_CATEGORY && template.category !== activeCategory.value) {
      return false;
    }
    if (!term) return true;
    return (
      template.name.toLowerCase().includes(term) ||
      template.description.toLowerCase().includes(term)
    );
  });
});

function categoryIcon(category: string) {
  if (category === "onboarding") return Sparkles;
  if (category === "conversao") return Target;
  if (category === "retencao" || category === "reativacao") return RotateCcw;
  if (category === "engajamento") return TrendingUp;
  return Workflow;
}

function categoryColorClass(category: string) {
  if (category === "onboarding") return "text-violet-500 dark:text-violet-400";
  if (category === "conversao") return "text-emerald-500 dark:text-emerald-400";
  if (category === "retencao" || category === "reativacao") return "text-amber-500 dark:text-amber-400";
  if (category === "engajamento") return "text-sky-500 dark:text-sky-400";
  return "text-muted-foreground";
}

function categoryBackgroundClass(category: string) {
  if (category === "onboarding") return "bg-violet-500/15";
  if (category === "conversao") return "bg-emerald-500/15";
  if (category === "retencao" || category === "reativacao") return "bg-amber-500/15";
  if (category === "engajamento") return "bg-sky-500/15";
  return "bg-muted";
}

function selectTemplate(template: FlowTemplate) {
  emit("select-template", template);
  emit("update:open", false);
}

function selectBlank() {
  emit("select-blank");
  emit("update:open", false);
}
</script>

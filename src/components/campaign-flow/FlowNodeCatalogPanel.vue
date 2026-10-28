<template>
  <div class="flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-background">
    <div class="space-y-3 border-b border-border p-3">
      <div class="text-sm font-semibold">Adicionar</div>
      <Input v-model="search" placeholder="Buscar nó..." class="h-8 text-sm" :disabled="disabled" />
    </div>

    <ScrollArea class="min-h-0 flex-1">
      <div class="space-y-4 p-3">
        <div v-for="group in groupedCatalog" :key="group.category" class="space-y-2">
          <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {{ FLOW_NODE_CATEGORY_LABELS[group.category] }}
          </div>
          <button
            v-for="item in group.items"
            :key="item.key"
            type="button"
            class="w-full rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="disabled || (item.category === 'trigger' && hasTrigger && !isCurrentTrigger(String(item.key)))"
            @click="emit('add-node', item)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium">{{ item.label }}</span>
              <span
                v-if="item.category === 'trigger' && hasTrigger && !isCurrentTrigger(String(item.key))"
                class="text-[10px] text-muted-foreground"
              >
                1 por fluxo
              </span>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">{{ item.description }}</p>
          </button>
        </div>

        <p v-if="groupedCatalog.length === 0" class="text-sm text-muted-foreground">
          {{ loading ? "Carregando catálogo..." : "Nenhum nó encontrado para a busca." }}
        </p>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FLOW_NODE_CATEGORY_LABELS,
  type FlowNodeCategory,
  type FlowNodeTypeCatalogItem,
} from "@/contracts/campaignFlow";

const props = defineProps<{
  catalog: FlowNodeTypeCatalogItem[];
  loading?: boolean;
  disabled?: boolean;
  /** Tipos de gatilho já presentes no canvas (máximo 1 gatilho por fluxo). */
  triggerTypes?: string[];
}>();

const emit = defineEmits<{
  (e: "add-node", item: FlowNodeTypeCatalogItem): void;
}>();

const search = ref("");

const CATEGORY_ORDER: FlowNodeCategory[] = ["trigger", "condition", "action"];

const hasTrigger = computed(() => (props.triggerTypes || []).length > 0);

const groupedCatalog = computed(() => {
  const term = search.value.trim().toLowerCase();
  const filtered = props.catalog.filter((item) => {
    if (!term) return true;
    return (
      item.label.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      String(item.key).toLowerCase().includes(term)
    );
  });

  return CATEGORY_ORDER.map((category) => ({
    category,
    items: filtered.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
});

function isCurrentTrigger(type: string) {
  return (props.triggerTypes || []).includes(type);
}
</script>

<template>
  <div class="flex max-h-[70vh] flex-col">
    <div class="border-b border-border p-3">
      <Input ref="searchInput" v-model="search" placeholder="Pesquisar..." class="h-9" :disabled="disabled" />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div class="space-y-5 p-3">
        <section v-for="group in groupedCatalog" :key="group.category">
          <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {{ FLOW_NODE_CATEGORY_LABELS[group.category] }}
          </h4>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="item in group.items"
              :key="String(item.key)"
              type="button"
              class="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-center transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="disabled || (item.category === 'trigger' && hasTrigger && !isCurrentTrigger(String(item.key)))"
              :title="item.description"
              @click="emit('add-node', item)"
            >
              <span
                class="flex size-9 items-center justify-center rounded-md"
                :class="iconBackgroundClass(group.category)"
              >
                <component :is="iconFor(String(item.key))" class="size-4" :class="iconColorClass(group.category)" />
              </span>
              <span class="text-xs font-medium">{{ item.label }}</span>
              <span
                v-if="item.category === 'trigger' && hasTrigger && !isCurrentTrigger(String(item.key))"
                class="text-[10px] text-muted-foreground"
              >
                1 por fluxo
              </span>
            </button>
          </div>
        </section>

        <p v-if="groupedCatalog.length === 0" class="text-sm text-muted-foreground">
          {{ loading ? "Carregando catálogo..." : "Nenhum nó encontrado para a busca." }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  GitBranch,
  Mail,
  MessageSquare,
  Zap,
} from "lucide-vue-next";
import { Input } from "@/components/ui/input";
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
const searchInput = ref<InstanceType<typeof Input> | null>(null);

onMounted(() => {
  const el = (searchInput.value?.$el || searchInput.value) as HTMLInputElement | undefined;
  el?.focus?.();
});

const CATEGORY_ORDER: FlowNodeCategory[] = ["trigger", "condition", "action"];

const NODE_ICONS: Record<string, typeof Zap> = {
  campaign_started: Zap,
  user_registered: Zap,
  first_deposit: Zap,
  deposit_made: Zap,
  wait_for_deposit: DollarSign,
  delay: Clock,
  send_sms: MessageSquare,
  send_email: Mail,
  mark_converted: CheckCircle2,
};

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

function isCurrentTrigger(key: string) {
  return (props.triggerTypes || []).includes(key);
}

function iconFor(key: string) {
  return NODE_ICONS[key] || GitBranch;
}

function iconColorClass(category: FlowNodeCategory) {
  if (category === "trigger") return "text-violet-500 dark:text-violet-400";
  if (category === "condition") return "text-sky-500 dark:text-sky-400";
  return "text-rose-500 dark:text-rose-400";
}

function iconBackgroundClass(category: FlowNodeCategory) {
  if (category === "trigger") return "bg-violet-500/15";
  if (category === "condition") return "bg-sky-500/15";
  return "bg-rose-500/15";
}
</script>

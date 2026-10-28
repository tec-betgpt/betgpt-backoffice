<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Templates de fluxo</DialogTitle>
        <DialogDescription>
          Comece de um modelo pronto ou de um fluxo em branco. Você pode editar tudo depois no canvas.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <Input v-model="search" placeholder="Buscar template..." />

        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="category in categories"
            :key="category"
            :variant="activeCategory === category ? 'default' : 'outline'"
            class="cursor-pointer"
            @click="activeCategory = category"
          >
            {{ category }}
          </Badge>
        </div>

        <p v-if="loading" class="text-sm text-muted-foreground">Carregando templates...</p>

        <div v-else class="grid max-h-[420px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          <button
            type="button"
            class="rounded-md border border-dashed border-border p-4 text-left transition-colors hover:bg-accent"
            @click="selectBlank"
          >
            <div class="flex items-center gap-2">
              <Plus class="size-4 text-muted-foreground" />
              <span class="text-sm font-medium">Fluxo em branco</span>
            </div>
            <p class="mt-2 text-xs text-muted-foreground">
              Comece do zero e monte o fluxo adicionando gatilhos, condições e ações no canvas.
            </p>
          </button>

          <button
            v-for="template in filteredTemplates"
            :key="template.key"
            type="button"
            class="rounded-md border border-border p-4 text-left transition-colors hover:bg-accent"
            @click="selectTemplate(template)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium">{{ template.name }}</span>
              <Badge variant="secondary">{{ template.node_count }} nós</Badge>
            </div>
            <p class="mt-2 text-xs text-muted-foreground">{{ template.description }}</p>
            <div class="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              {{ template.category }}
            </div>
          </button>
        </div>

        <p v-if="!loading && filteredTemplates.length === 0" class="text-sm text-muted-foreground">
          Nenhum template encontrado para os filtros aplicados.
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Plus } from "lucide-vue-next";
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
const ALL_CATEGORY = "Todas";
const activeCategory = ref(ALL_CATEGORY);

const categories = computed(() => {
  const unique = Array.from(new Set(props.templates.map((template) => template.category))).sort();
  return [ALL_CATEGORY, ...unique];
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

function selectTemplate(template: FlowTemplate) {
  emit("select-template", template);
  emit("update:open", false);
}

function selectBlank() {
  emit("select-blank");
  emit("update:open", false);
}
</script>

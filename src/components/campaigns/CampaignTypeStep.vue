<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">Tipo de campanha</h3>
      <p class="text-sm text-muted-foreground">
        Defina a identidade da campanha e escolha como a jornada será construída.
      </p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <div class="rounded-md border border-border p-3 text-sm">
      <span class="text-muted-foreground">Projeto ativo: </span>
      <span class="font-medium">{{ activeProjectLabel }}</span>
    </div>

    <div class="grid gap-4">
      <div class="space-y-2">
        <Label>Nome</Label>
        <Input v-model="model.name" :disabled="readonly" placeholder="Campanha de retenção" />
      </div>
      <div class="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          :model-value="model.description ?? ''"
          :disabled="readonly"
          placeholder="Contexto interno do rascunho"
          @update:model-value="model.description = $event ? String($event) : null"
        />
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <button
        v-for="option in typeOptions"
        :key="option.value"
        type="button"
        class="rounded-lg border-2 p-5 text-left transition-colors"
        :class="[
          model.type === option.value ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50',
          selectionLocked && model.type !== option.value ? 'cursor-not-allowed opacity-50' : '',
        ]"
        :disabled="readonly || (selectionLocked && model.type !== option.value)"
        @click="selectType(option.value)"
      >
        <div class="flex items-center justify-between gap-2">
          <component :is="option.icon" class="size-5 text-muted-foreground" />
          <Badge v-if="model.type === option.value" variant="default">Selecionado</Badge>
        </div>
        <div class="mt-3 text-base font-semibold">{{ option.label }}</div>
        <p class="mt-1 text-sm text-muted-foreground">{{ option.description }}</p>
      </button>
    </div>

    <p v-if="selectionLocked" class="text-xs text-muted-foreground">
      O tipo da campanha não pode ser alterado após a criação.
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <Button v-if="onSave" variant="outline" :disabled="readonly || loading" @click="onSave">
        {{ loading ? "Salvando..." : "Salvar etapa" }}
      </Button>
      <Button :disabled="readonly || loading" @click="emit('continue')">Continuar</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { GitBranch, Megaphone } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CampaignValidationList from "@/components/campaigns/CampaignValidationList.vue";
import type { CampaignFormState, CampaignType, CampaignValidationItem } from "@/contracts/campaigns";
import { useWorkspaceStore } from "@/stores/workspace";

defineProps<{
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  /** Em edição, o tipo já foi persistido e não pode mudar. */
  selectionLocked?: boolean;
  onSave?: () => void | Promise<void>;
}>();

const emit = defineEmits<{
  (e: "continue"): void;
}>();

const model = defineModel<CampaignFormState>({ required: true });

const workspaceStore = useWorkspaceStore();

const activeProjectLabel = computed(
  () => workspaceStore.activeGroupProject?.name || "Nenhum projeto ativo selecionado",
);

const typeOptions: { value: CampaignType; label: string; description: string; icon: typeof Megaphone }[] = [
  {
    value: "broadcast",
    label: "Estágio único",
    description: "Disparo único (ou recorrente) de SMS/e-mail para uma audiência, com agenda, janelas e warmup.",
    icon: Megaphone,
  },
  {
    value: "flow",
    label: "Multi-estágio",
    description: "Jornada visual com gatilhos, condições e múltiplas ações encadeadas no editor de fluxo.",
    icon: GitBranch,
  },
];

function selectType(type: CampaignType) {
  model.value.type = type;
}
</script>

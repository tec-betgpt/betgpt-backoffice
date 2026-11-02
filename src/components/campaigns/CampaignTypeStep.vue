<template>
  <div class="space-y-8">
    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <div class="mx-auto grid w-full max-w-2xl gap-4">
      <div class="space-y-2">
        <Label>Nome</Label>
        <Input v-model="model.name" :disabled="readonly" placeholder="Campanha de retenção" />
      </div>
      <div class="space-y-2">
        <Label>Descrição (opcional)</Label>
        <Textarea
          :model-value="model.description ?? ''"
          :disabled="readonly"
          placeholder="Contexto interno do rascunho"
          @update:model-value="model.description = $event ? String($event) : null"
        />
      </div>
    </div>

    <div class="mx-auto grid w-full max-w-2xl gap-6 sm:grid-cols-2">
      <button
        v-for="option in typeOptions"
        :key="option.value"
        type="button"
        class="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 p-8 text-center transition-colors"
        :class="[
          selectedType === option.value
            ? 'border-primary bg-accent/60'
            : 'border-border hover:bg-accent/40',
          selectionLocked && selectedType !== option.value ? 'cursor-not-allowed opacity-50' : '',
        ]"
        :disabled="readonly || (selectionLocked && selectedType !== option.value)"
        @click="selectType(option.value)"
      >
        <component
          :is="option.icon"
          class="size-10"
          :class="selectedType === option.value ? 'text-primary' : 'text-muted-foreground'"
        />
        <div class="text-lg font-semibold">{{ option.label }}</div>
        <p class="text-sm text-muted-foreground">{{ option.description }}</p>
      </button>
    </div>

    <p v-if="selectionLocked" class="text-center text-xs text-muted-foreground">
      O tipo da campanha não pode ser alterado após a criação.
    </p>

    <div class="mx-auto flex w-full max-w-2xl items-center justify-between">
      <Button variant="outline" :disabled="loading" @click="emit('back')">
        <ArrowLeft class="mr-2 size-4" />
        Voltar
      </Button>
      <Button v-if="onSave" variant="outline" :disabled="readonly || loading" @click="onSave">
        {{ loading ? "Salvando..." : "Salvar etapa" }}
      </Button>
      <Button :disabled="!selectedType || readonly || loading" @click="emit('continue')">
        Próxima etapa
        <ArrowRight class="ml-2 size-4" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ArrowLeft, ArrowRight, GitFork, Send } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CampaignValidationList from "@/components/campaigns/CampaignValidationList.vue";
import type { CampaignFormState, CampaignType, CampaignValidationItem } from "@/contracts/campaigns";

const props = defineProps<{
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  /** Em edição, o tipo já foi persistido e não pode mudar. */
  selectionLocked?: boolean;
  /** Tipo já escolhido anteriormente (edição ou retorno à etapa). Null = exige clique. */
  initialSelected?: CampaignType | null;
  onSave?: () => void | Promise<void>;
}>();

const emit = defineEmits<{
  (e: "continue"): void;
  (e: "back"): void;
  (e: "select", type: CampaignType): void;
}>();

const model = defineModel<CampaignFormState>({ required: true });

const selectedType = ref<CampaignType | null>(props.initialSelected ?? null);

const typeOptions: { value: CampaignType; label: string; description: string; icon: typeof Send }[] = [
  {
    value: "broadcast",
    label: "Estágio único",
    description: "Crie uma campanha com um único estágio, ideal para enviar mensagens únicas.",
    icon: Send,
  },
  {
    value: "flow",
    label: "Multi-estágio",
    description: "Campanhas baseadas em fluxos, excelente para criar jornadas de usuário.",
    icon: GitFork,
  },
];

function selectType(type: CampaignType) {
  selectedType.value = type;
  model.value.type = type;
  emit("select", type);
}
</script>

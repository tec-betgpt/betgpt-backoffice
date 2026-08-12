<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">Links da campanha</h3>
      <p class="text-sm text-muted-foreground">
        Esta etapa revisa os links encontrados na mensagem SMS. Cada URL original deve ser associada a um link rastreável do Link Engine. Isso permite tracking, UTM e medição de cliques. Links sem associação podem impedir a validação final da campanha quando a mensagem contém URLs.
      </p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <div class="flex flex-wrap gap-2">
      <Button variant="outline" :disabled="readonly" @click="addLink()">Adicionar link</Button>
    </div>

    <div v-if="model.length === 0" class="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
      Nenhum link adicionado.
    </div>

    <div v-for="(link, index) in model" :key="`${link.original_url}-${index}`" class="space-y-4 rounded-md border p-4">
      <div class="flex items-center justify-between gap-3">
        <Badge variant="outline">Link {{ index + 1 }}</Badge>
        <Button variant="ghost" size="sm" :disabled="readonly" @click="removeLink(index)">Remover</Button>
      </div>
      <div class="grid gap-4 md:grid-cols-3">
        <div class="space-y-2 md:col-span-2">
          <Label>URL original</Label>
          <Input v-model="link.original_url" :disabled="readonly" />
        </div>
        <div class="space-y-2">
          <Label>Link Engine ID</Label>
          <Select
            :model-value="link.link_id == null ? SELECT_NONE_VALUE : String(link.link_id)"
            :disabled="readonly || loadingLinks"
            @update:model-value="value => setLinkId(link, value)"
          >
            <SelectTrigger>
              <SelectValue :placeholder="loadingLinks ? 'Carregando links...' : 'Selecione um link'" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="SELECT_NONE_VALUE">Sem link</SelectItem>
              <SelectItem v-for="option in linkOptions" :key="option.id" :value="String(option.id)">
                {{ option.slug }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>Placeholder</Label>
          <Input v-model="link.placeholder_key" :disabled="readonly" placeholder="link_1" />
        </div>
        <div class="space-y-2">
          <Label>Posição</Label>
          <Input v-model.number="link.position" type="number" min="0" :disabled="readonly" />
        </div>
        <div class="space-y-2">
          <Label>Status</Label>
          <select v-model="link.status" :disabled="readonly" class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="detected">Detectado</option>
            <option value="linked">Associado</option>
            <option value="ignored">Ignorado</option>
            <option value="invalid">Inválido</option>
          </select>
        </div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <CampaignJsonField v-model="link.utm_context" label="UTM context" :readonly="readonly" />
        <CampaignJsonField v-model="link.metadata" label="Metadata" :readonly="readonly" />
      </div>
    </div>

    <Button v-if="onSave" variant="outline" :disabled="readonly || loading" @click="onSave">
      {{ loading ? "Salvando..." : "Salvar etapa" }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CampaignJsonField from "./CampaignJsonField.vue";
import CampaignValidationList from "./CampaignValidationList.vue";
import type { CampaignLinkPayload, CampaignValidationItem } from "@/contracts/campaigns";
import LinkService from "@/services/links";
import {useWorkspaceStore} from "@/stores/workspace";

const SELECT_NONE_VALUE = "__none__";

type LinkOption = {
  id: number;
  slug: string;
};

const props = withDefaults(
  defineProps<{
    detectedLinks?: string[];
    errors?: CampaignValidationItem[];
    warnings?: CampaignValidationItem[];
    loading?: boolean;
    readonly?: boolean;
    onSave?: () => void | Promise<void>;
  }>(),
  {
    detectedLinks: () => [],
  },
);

const model = defineModel<CampaignLinkPayload[]>({ required: true });
const linkOptions = ref<LinkOption[]>([]);
const loadingLinks = ref(false);

const addLink = (originalUrl = "") => {
  model.value.push({
    original_url: originalUrl,
    link_id: null,
    placeholder_key: `link_${model.value.length + 1}`,
    position: model.value.length,
    status: "detected",
    utm_context: null,
    metadata: null,
  });
};

const removeLink = (index: number) => {
  model.value.splice(index, 1);
};

const setLinkId = (link: CampaignLinkPayload, value?: string) => {
  link.link_id = !value || value === SELECT_NONE_VALUE ? null : Number(value);
};

const loadLinkOptions = async () => {
  loadingLinks.value = true;

  try {
    const filter_id = useWorkspaceStore().activeGroupProject!.id
    linkOptions.value = await LinkService.list({ filter_id });
  } catch (error) {
    console.error("Erro ao carregar links", error);
    linkOptions.value = [];
  } finally {
    loadingLinks.value = false;
  }
};

onMounted(() => {
  void loadLinkOptions();
});
</script>

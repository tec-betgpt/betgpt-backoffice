<template>
  <Card>
    <CardHeader>
      <CardTitle>Checklist pre-launch</CardTitle>
      <CardDescription>Itens técnicos e financeiros retornados pelo backend durante a validação.</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <p v-if="disabled" class="text-sm text-muted-foreground">
        Salve a campanha para habilitar a validação.
      </p>
      <p v-else-if="loading" class="text-sm text-muted-foreground">
        Validando campanha...
      </p>
      <p v-else-if="!validation" class="text-sm text-muted-foreground">
        Nenhuma validação executada ainda.
      </p>
      <template v-else>
        <div class="flex flex-wrap items-center gap-2">
          <Badge :variant="validation.valid ? 'default' : 'destructive'">
            {{ validation.valid ? "Configuração válida" : "Configuração inválida" }}
          </Badge>
          <Badge variant="outline">{{ validation.status }}</Badge>
        </div>

        <div class="space-y-3">
          <div v-for="item in validation.pre_launch_checklist" :key="item.key" class="rounded-md border p-4">
            <div class="flex flex-wrap items-center gap-2">
              <div class="text-sm font-medium">{{ item.label }}</div>
              <Badge :variant="statusVariant(item.status)">{{ statusLabel(item.status) }}</Badge>
              <Badge v-if="item.blocking" variant="destructive">Bloqueia continuidade</Badge>
            </div>
            <ul class="mt-3 space-y-1 text-sm text-muted-foreground">
              <li v-for="message in item.messages" :key="message">{{ message }}</li>
            </ul>
          </div>
        </div>

        <div class="space-y-2">
          <h4 class="text-sm font-medium">Erros por seção</h4>
          <div v-if="!hasErrors" class="text-sm text-muted-foreground">Nenhum erro retornado.</div>
          <div v-for="(messages, section) in validation.errors" :key="section" class="rounded-md border p-3">
            <div class="text-xs font-medium uppercase text-muted-foreground">{{ section }}</div>
            <ul class="mt-2 space-y-1 text-sm">
              <li v-for="item in messages" :key="`${item.field}-${item.message}`">{{ item.field }}: {{ item.message }}</li>
            </ul>
          </div>
        </div>

        <div class="space-y-2">
          <h4 class="text-sm font-medium">Avisos por seção</h4>
          <div v-if="!hasWarnings" class="text-sm text-muted-foreground">Nenhum aviso retornado.</div>
          <div v-for="(messages, section) in validation.warnings" :key="section" class="rounded-md border p-3">
            <div class="text-xs font-medium uppercase text-muted-foreground">{{ section }}</div>
            <ul class="mt-2 space-y-1 text-sm">
              <li v-for="item in messages" :key="`${item.field}-${item.message}`">{{ item.field }}: {{ item.message }}</li>
            </ul>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CAMPAIGN_CHECKLIST_STATUS_LABELS, type CampaignPreLaunchChecklistItem, type CampaignValidationResponse } from "@/contracts/campaigns";

const props = defineProps<{
  validation: CampaignValidationResponse | null;
  loading?: boolean;
  disabled?: boolean;
}>();

const hasErrors = computed(() =>
  Boolean(props.validation && Object.values(props.validation.errors).some((items) => items.length > 0)),
);
const hasWarnings = computed(() =>
  Boolean(props.validation && Object.values(props.validation.warnings).some((items) => items.length > 0)),
);

const statusVariant = (status: CampaignPreLaunchChecklistItem["status"]) => {
  if (status === "invalid") return "destructive";
  if (status === "warning") return "secondary";
  return "default";
};

const statusLabel = (status: CampaignPreLaunchChecklistItem["status"]) => CAMPAIGN_CHECKLIST_STATUS_LABELS[status];
</script>

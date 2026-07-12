<template>
  <Card>
    <CardHeader class="flex flex-row items-start justify-between gap-3 space-y-0">
      <div class="space-y-1">
        <CardTitle>Estimativa operacional</CardTitle>
        <CardDescription>Viabilidade de audiência, volume e custo sem recalcular regras no front.</CardDescription>
      </div>
      <Button v-if="onRefresh" size="sm" variant="outline" :disabled="loading || disabled" @click="onRefresh">
        {{ loading ? "Atualizando..." : "Atualizar" }}
      </Button>
    </CardHeader>
    <CardContent class="space-y-6">
      <p v-if="disabled" class="text-sm text-muted-foreground">
        Salve a campanha para consultar a estimativa.
      </p>
      <p v-else-if="loading" class="text-sm text-muted-foreground">
        Carregando estimativa...
      </p>
      <Alert v-else-if="errorMessage" variant="destructive">
        <AlertTitle>Estimativa indisponível</AlertTitle>
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>
      <template v-else-if="estimate">
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-md border p-4">
            <div class="text-xs uppercase text-muted-foreground">Volume elegível</div>
            <div class="mt-1 text-2xl font-semibold">{{ formatNumber(estimate.audience.eligible) }}</div>
            <div class="mt-2 text-xs text-muted-foreground">
              {{ formatNumber(estimate.audience.estimated_recipients) }} destinatários estimados
            </div>
          </div>
          <div class="rounded-md border p-4">
            <div class="text-xs uppercase text-muted-foreground">Status da estimativa</div>
            <div class="mt-2 flex flex-wrap gap-2">
              <Badge :variant="estimate.status === 'blocked' ? 'destructive' : 'default'">
                {{ estimate.status === "blocked" ? "Bloqueada" : "Estimado" }}
              </Badge>
              <Badge :variant="estimate.can_continue ? 'outline' : 'secondary'">
                {{ estimate.can_continue ? "Pode continuar" : "Com restrições" }}
              </Badge>
            </div>
          </div>
        </div>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Audiência</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <StatBlock label="Total" :value="formatNumber(estimate.audience.total)" />
            <StatBlock label="Com telefone" :value="formatNumber(estimate.audience.with_phone)" />
            <StatBlock label="Sem telefone" :value="formatNumber(estimate.audience.without_phone)" />
            <StatBlock label="Source" :value="estimate.audience.source || '—'" />
            <StatBlock label="Protegidos" :value="formatNumber(estimate.audience.protected)" />
            <StatBlock label="Suppressed" :value="formatNumber(estimate.audience.suppressed)" />
            <StatBlock label="Opt-out" :value="formatNumber(estimate.audience.opted_out)" />
            <StatBlock label="Público alvo" :value="estimate.audience.target_audience_name || '—'" />
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <StatBlock
              label="Redução por proteção"
              :value="`${formatNumber(estimate.audience.protected)} contatos protegidos`"
            />
            <StatBlock
              label="Redução total de elegibilidade"
              :value="formatNumber(estimate.audience.protected + estimate.audience.suppressed + estimate.audience.opted_out)"
            />
          </div>
        </section>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Mensagem</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <StatBlock label="Caracteres" :value="formatNumber(estimate.message.character_count)" />
            <StatBlock label="Segmentos por destinatário" :value="formatNumber(estimate.message.sms_segments_per_recipient)" />
            <StatBlock label="Mensagens estimadas" :value="formatNumber(estimate.message.estimated_messages)" />
            <StatBlock label="Segmentos estimados" :value="formatNumber(estimate.message.estimated_sms_segments)" />
          </div>
        </section>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Links</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <StatBlock label="URLs detectadas" :value="formatNumber(estimate.links.detected_urls)" />
            <StatBlock label="Links da campanha" :value="formatNumber(estimate.links.campaign_links)" />
            <StatBlock label="Links rastreados" :value="formatNumber(estimate.links.tracked_links)" />
            <StatBlock label="Links sem tracking" :value="formatNumber(estimate.links.untracked_links)" />
          </div>
        </section>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Agenda</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <StatBlock label="Tipo" :value="estimate.schedule.schedule_type || '—'" />
            <StatBlock label="Timezone" :value="estimate.schedule.timezone || '—'" />
            <StatBlock label="Início" :value="formatDateTime(estimate.schedule.starts_at)" />
            <StatBlock label="Fim" :value="formatDateTime(estimate.schedule.ends_at)" />
            <StatBlock
              label="Janelas ativas"
              :value="formatNumber(estimate.schedule.active_delivery_windows)"
            />
            <StatBlock
              label="Respeita janelas"
              :value="estimate.schedule.respect_delivery_windows ? 'Sim' : 'Não'"
            />
          </div>
        </section>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Warmup</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <StatBlock label="Ativo" :value="estimate.warmup.enabled ? 'Sim' : 'Não'" />
            <StatBlock label="Limite inicial" :value="formatNullableNumber(estimate.warmup.initial_limit)" />
            <StatBlock label="Incremento" :value="formatNullableNumber(estimate.warmup.increment_amount)" />
            <StatBlock label="Tipo" :value="estimate.warmup.increment_type || '—'" />
            <StatBlock label="Intervalo" :value="formatInterval(estimate.warmup.interval_value, estimate.warmup.interval_unit)" />
            <StatBlock label="Limite máximo" :value="formatNullableNumber(estimate.warmup.max_limit)" />
          </div>
        </section>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Financeiro</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <StatBlock label="Moeda" :value="estimate.financial.currency || '—'" />
            <StatBlock
              label="Preço por segmento"
              :value="formatMoney(estimate.financial.price_per_sms_segment, estimate.financial.currency)"
            />
            <StatBlock label="Segmentos" :value="formatNumber(estimate.financial.estimated_sms_segments)" />
            <StatBlock
              label="Custo estimado"
              :value="estimate.financial.estimated_cost === null ? 'Estimativa financeira indisponível' : formatMoney(estimate.financial.estimated_cost, estimate.financial.currency)"
            />
          </div>
        </section>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Erros</h4>
          <SectionMessages :sections="estimate.errors" empty-label="Nenhum erro retornado." />
        </section>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Avisos</h4>
          <SectionMessages :sections="estimate.warnings" empty-label="Nenhum aviso retornado." />
        </section>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { h, defineComponent } from "vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignEstimateResponse, CampaignMessageLike } from "@/contracts/campaigns";

defineProps<{
  estimate: CampaignEstimateResponse | null;
  loading?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  onRefresh?: () => void | Promise<void>;
}>();

const numberFormatter = new Intl.NumberFormat("pt-BR");

const moneyFormatter = (currency: string) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });

const formatNumber = (value: number) => numberFormatter.format(value);
const formatNullableNumber = (value: number | null) => (value === null ? "—" : formatNumber(value));
const formatDateTime = (value: string | null) =>
  value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const formatInterval = (value: number | null, unit: string | null) => {
  if (value === null || !unit) return "—";
  return `${formatNumber(value)} ${unit}`;
};
const formatMoney = (value: number | null, currency: string | null) => {
  if (value === null || !currency) return "—";
  return moneyFormatter(currency).format(value);
};

const StatBlock = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h("div", { class: "rounded-md border p-3" }, [
        h("div", { class: "text-xs uppercase text-muted-foreground" }, props.label),
        h("div", { class: "mt-1 text-sm font-medium break-words" }, props.value),
      ]);
  },
});

const SectionMessages = defineComponent({
  props: {
    sections: {
      type: Object as () => Record<string, CampaignMessageLike[]>,
      required: true,
    },
    emptyLabel: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const entries = Object.entries(props.sections || {}).filter(([, items]) => items.length > 0);
      if (entries.length === 0) {
        return h("p", { class: "text-sm text-muted-foreground" }, props.emptyLabel);
      }

      return h(
        "div",
        { class: "space-y-3" },
        entries.map(([section, items]) =>
          h("div", { class: "rounded-md border p-3" }, [
            h("div", { class: "text-xs font-medium uppercase text-muted-foreground" }, section),
            h(
              "ul",
              { class: "mt-2 space-y-1 text-sm" },
              items.map((item) =>
                h("li", { class: "break-words" }, `${item.field}: ${item.message}`),
              ),
            ),
          ]),
        ),
      );
    };
  },
});
</script>

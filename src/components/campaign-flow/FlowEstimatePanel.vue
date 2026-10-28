<template>
  <Card>
    <CardHeader class="flex flex-row items-start justify-between gap-3 space-y-0">
      <div class="space-y-1">
        <CardTitle>Estimativa do fluxo</CardTitle>
        <CardDescription>Resumo estrutural calculado pelo backend (sem estimativa financeira nesta fase).</CardDescription>
      </div>
      <Button v-if="onRefresh" size="sm" variant="outline" :disabled="loading || disabled" @click="onRefresh">
        {{ loading ? "Atualizando..." : "Atualizar" }}
      </Button>
    </CardHeader>
    <CardContent class="space-y-4">
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
        <div class="flex flex-wrap items-center gap-2">
          <Badge :variant="estimate.status === 'blocked' ? 'destructive' : 'default'">
            {{ estimate.status === "blocked" ? "Bloqueada" : "Estimado" }}
          </Badge>
          <Badge :variant="estimate.can_continue ? 'outline' : 'secondary'">
            {{ estimate.can_continue ? "Pode continuar" : "Com restrições" }}
          </Badge>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-md border p-3">
            <div class="text-xs uppercase text-muted-foreground">Nós no fluxo</div>
            <div class="mt-1 text-sm font-medium">{{ estimate.flow.node_count }}</div>
          </div>
          <div class="rounded-md border p-3">
            <div class="text-xs uppercase text-muted-foreground">Mensagens por destinatário</div>
            <div class="mt-1 text-sm font-medium">{{ estimate.flow.estimated_messages_per_recipient }}</div>
          </div>
          <div class="rounded-md border p-3">
            <div class="text-xs uppercase text-muted-foreground">Ações de SMS</div>
            <div class="mt-1 text-sm font-medium">{{ estimate.flow.actions_by_channel.sms ?? 0 }}</div>
          </div>
          <div class="rounded-md border p-3">
            <div class="text-xs uppercase text-muted-foreground">Ações de e-mail</div>
            <div class="mt-1 text-sm font-medium">{{ estimate.flow.actions_by_channel.email ?? 0 }}</div>
          </div>
        </div>

        <p class="text-xs text-muted-foreground">
          Estimativa financeira não aplicável a campanhas multi-estágio nesta fase.
        </p>
      </template>
      <p v-else class="text-sm text-muted-foreground">Nenhuma estimativa calculada ainda.</p>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignFlowEstimateResponse } from "@/contracts/campaigns";

defineProps<{
  estimate: CampaignFlowEstimateResponse | null;
  loading?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  onRefresh?: () => void | Promise<void>;
}>();
</script>

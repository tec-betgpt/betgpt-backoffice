<template>
  <Card>
    <CardHeader>
      <CardTitle>Relatório de recuperação</CardTitle>
      <CardDescription>
        Jogadores que entraram na jornada no período. Conta como recuperado o depósito aprovado em até
        {{ report?.attribution_hours ?? 24 }}h depois da primeira mensagem.
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-5">
      <div class="flex flex-wrap items-end gap-3">
        <div class="space-y-1">
          <Label for="report-start" class="text-xs">De</Label>
          <Input id="report-start" v-model="startDate" type="date" class="h-9 w-[150px]" />
        </div>
        <div class="space-y-1">
          <Label for="report-end" class="text-xs">Até</Label>
          <Input id="report-end" v-model="endDate" type="date" class="h-9 w-[150px]" />
        </div>
        <div class="space-y-1">
          <Label for="report-fee" class="text-xs">Comissão (%)</Label>
          <Input id="report-fee" v-model="feePercent" type="number" min="0" max="100" step="0.1" class="h-9 w-[110px]" />
        </div>
        <Button size="sm" class="h-9" :disabled="loading" @click="load">
          {{ loading ? "Carregando..." : "Atualizar" }}
        </Button>
        <Button size="sm" variant="outline" class="h-9" :disabled="!report || loading" @click="exportCsv">
          Exportar CSV
        </Button>
      </div>

      <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

      <template v-if="report">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div v-for="item in kpis" :key="item.label" class="rounded-md border border-border p-3">
            <div class="text-xs text-muted-foreground">{{ item.label }}</div>
            <div class="mt-1 text-lg font-semibold">{{ item.value }}</div>
            <div v-if="item.hint" class="text-[11px] text-muted-foreground">{{ item.hint }}</div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dia</TableHead>
              <TableHead class="text-right">Entraram</TableHead>
              <TableHead class="text-right">Pagaram antes</TableHead>
              <TableHead class="text-right">Receberam mensagem</TableHead>
              <TableHead class="text-right">Abriram o link</TableHead>
              <TableHead class="text-right">Recuperados</TableHead>
              <TableHead class="text-right">Valor recuperado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="day in report.daily" :key="day.date">
              <TableCell>{{ formatDay(day.date) }}</TableCell>
              <TableCell class="text-right">{{ formatCount(day.entered) }}</TableCell>
              <TableCell class="text-right">{{ formatCount(day.paid_before_message) }}</TableCell>
              <TableCell class="text-right">{{ formatCount(day.messaged) }}</TableCell>
              <TableCell class="text-right">{{ formatCount(day.links_opened) }}</TableCell>
              <TableCell class="text-right">{{ formatCount(day.recovered) }}</TableCell>
              <TableCell class="text-right">{{ formatMoney(day.recovered_value) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FlowRecoveryReport } from "@/contracts/campaignFlow";
import { getFlowReport } from "@/services/campaigns";

const props = defineProps<{
  campaignId: number;
}>();

const report = ref<FlowRecoveryReport | null>(null);
const loading = ref(false);
const errorMessage = ref("");
const endDate = ref(toIsoDate(new Date()));
const startDate = ref(toIsoDate(new Date(Date.now() - 6 * 86400000)));
const feePercent = ref<string | number>(3);

const kpis = computed(() => {
  const totals = report.value?.totals;
  if (!totals) return [];

  return [
    { label: "Pix gerados no projeto", value: formatCount(totals.pix_generated), hint: formatMoney(totals.pix_generated_value) },
    { label: "Entraram na jornada", value: formatCount(totals.entered) },
    { label: "Pagaram antes da mensagem", value: formatCount(totals.paid_before_message) },
    {
      label: "Receberam mensagem",
      value: formatCount(totals.messaged),
      hint: `${formatCount(totals.sms_sent)} SMS · ${formatCount(totals.emails_sent)} e-mails`,
    },
    {
      label: "Abriram o link",
      value: formatCount(totals.links_opened),
      hint: `${formatCount(totals.link_opens)} aberturas`,
    },
    { label: "Recuperados", value: formatCount(totals.recovered) },
    { label: "Valor recuperado", value: formatMoney(totals.recovered_value) },
    { label: "Taxa de recuperação", value: `${formatDecimal(totals.recovery_rate)}%`, hint: "sobre quem recebeu mensagem" },
    {
      label: `Comissão (${formatDecimal(report.value?.fee_percent ?? 0)}%)`,
      value: formatMoney(totals.fee_value),
    },
  ];
});

onMounted(load);

async function load() {
  loading.value = true;
  errorMessage.value = "";

  try {
    report.value = await getFlowReport(props.campaignId, {
      start_date: startDate.value,
      end_date: endDate.value,
      fee_percent: Number(feePercent.value) || 0,
    });
  } catch (error) {
    const response = (error as { response?: { data?: { message?: string } } })?.response;
    errorMessage.value = response?.data?.message || "Não foi possível carregar o relatório.";
  } finally {
    loading.value = false;
  }
}

function exportCsv() {
  if (!report.value) return;

  const header = ["dia", "entraram", "pagaram_antes", "receberam_mensagem", "abriram_link", "recuperados", "valor_recuperado"];
  const rows = report.value.daily.map((day) => [
    day.date,
    day.entered,
    day.paid_before_message,
    day.messaged,
    day.links_opened,
    day.recovered,
    (day.recovered_value / 100).toFixed(2).replace(".", ","),
  ]);
  const totals = report.value.totals;
  rows.push([
    "total",
    totals.entered,
    totals.paid_before_message,
    totals.messaged,
    totals.links_opened,
    totals.recovered,
    (totals.recovered_value / 100).toFixed(2).replace(".", ","),
  ]);

  const csv = [header, ...rows].map((row) => row.join(";")).join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `recuperacao-${report.value.period.start}-a-${report.value.period.end}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function toIsoDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDay(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
</script>

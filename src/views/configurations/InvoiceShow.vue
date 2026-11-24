<template>
  <div class="mx-auto w-full max-w-3xl space-y-6 pb-10">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="space-y-1.5">
        <Breadcrumb class="print:hidden">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink as-child>
                <router-link :to="{ name: 'invoices.index' }">Faturas</router-link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Ver Fatura</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Receipt class="size-6" />
          Fatura
        </h1>
      </div>
      <Button variant="outline" size="sm" class="print:hidden" :disabled="!invoice" @click="print">
        <Printer />
        Imprimir Fatura
      </Button>
    </div>

    <template v-if="loading">
      <Skeleton class="h-56 w-full" />
      <Skeleton class="h-96 w-full" />
    </template>

    <Card v-else-if="!invoice">
      <CardContent class="flex flex-col items-center gap-3 p-10 text-center">
        <FileText class="size-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Fatura não encontrada.</p>
        <Button variant="outline" size="sm" as-child>
          <router-link :to="{ name: 'invoices.index' }">Voltar para Faturas</router-link>
        </Button>
      </CardContent>
    </Card>

    <template v-else>
      <Card>
        <CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle class="flex items-center gap-2 text-base">
            <FileText class="size-5 text-blue-500" />
            Detalhes da Fatura
          </CardTitle>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            Status:
            <Badge variant="outline" :class="INVOICE_STATUS_CLASSES[status.tone]">{{ status.label }}</Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Wallet class="size-4" />
                Valor
              </div>
              <div class="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
                {{ currencyFilter(Number(invoice.amount)) }}
              </div>
            </div>
            <div>
              <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays class="size-4" />
                Vencimento
              </div>
              <div class="mt-1 text-xl font-semibold">{{ formatDate(invoice.due_at) }}</div>
            </div>
          </div>
          <div class="rounded-md bg-muted/60 p-3 text-sm">
            <div class="mb-1 font-medium">Observações</div>
            <p class="text-muted-foreground">{{ invoice.name }}</p>
            <p class="text-muted-foreground">
              Período: {{ formatDate(invoice.period_started_at) }} a {{ formatDate(invoice.period_ended_at) }}
            </p>
          </div>
        </CardContent>
      </Card>

      <div
        v-if="paid"
        class="flex items-start gap-3 rounded-lg border border-emerald-500/40 bg-emerald-50 p-4 dark:bg-emerald-950/40"
      >
        <CircleCheck class="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <div class="font-medium text-emerald-700 dark:text-emerald-400">Fatura paga</div>
          <p class="text-sm text-emerald-700/80 dark:text-emerald-300/80">
            Recebemos o pagamento desta fatura. Obrigado!
          </p>
        </div>
      </div>

      <Card v-else class="overflow-hidden">
        <div class="border-b bg-emerald-50 px-6 py-4 dark:bg-emerald-950/40">
          <div class="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
            <CreditCard class="size-5" />
            Pagamento via PIX
          </div>
          <p class="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">
            Use o QR Code ou copie o código PIX para fazer o pagamento
          </p>
        </div>

        <CardContent class="space-y-6 p-6">
          <div v-if="receiverName || pixKey" class="rounded-md border p-4">
            <div class="flex items-center gap-2 font-medium">
              <Landmark class="size-4" />
              Dados para Pagamento
            </div>
            <p class="text-sm text-muted-foreground">Faça um PIX com o valor exato da fatura</p>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <div v-if="receiverName">
                <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Razão social</div>
                <div class="font-medium">{{ receiverName }}</div>
              </div>
              <div v-if="pixKey">
                <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chave PIX</div>
                <div class="break-all font-mono font-medium">{{ pixKey }}</div>
              </div>
            </div>
          </div>

          <div
            v-if="!hasCustomer"
            class="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300"
          >
            <div class="font-medium">Ops! Conta incompleta</div>
            <p>Atualize suas informações em seu Perfil para gerar o QR Code de pagamento.</p>
            <Button size="sm" variant="outline" class="mt-3 print:hidden" as-child>
              <router-link :to="{ name: 'configurations.profile' }">Ir para o Perfil</router-link>
            </Button>
          </div>

          <div v-else-if="pixLoading" class="grid gap-6 md:grid-cols-2">
            <Skeleton class="mx-auto size-56" />
            <div class="space-y-4">
              <Skeleton class="h-20 w-full" />
              <Skeleton class="h-36 w-full" />
            </div>
          </div>

          <div v-else-if="pixError" class="rounded-md border border-destructive/50 p-4 text-sm">
            <p class="text-destructive">{{ pixError }}</p>
            <Button size="sm" variant="outline" class="mt-3 print:hidden" @click="loadPix">
              <RefreshCcw />
              Tentar novamente
            </Button>
          </div>

          <div v-else-if="pix" class="grid gap-6 md:grid-cols-2">
            <div class="flex flex-col items-center gap-3 text-center">
              <div class="rounded-lg bg-white p-3 shadow-sm">
                <img :src="pix.qr_code_image" alt="QR Code PIX" class="size-52" />
              </div>
              <p class="max-w-xs text-sm text-muted-foreground">
                Abra o app do seu banco e escaneie o código QR para pagar
              </p>
              <p v-if="pix.expires_at" class="text-xs text-muted-foreground">
                Válido até {{ formatDateTime(pix.expires_at) }}
              </p>
            </div>

            <div class="space-y-4">
              <div>
                <div class="mb-1.5 text-sm font-medium">Código PIX Copia e Cola</div>
                <div class="flex items-start gap-2">
                  <div
                    class="max-h-28 min-w-0 flex-1 overflow-y-auto break-all rounded-md border bg-muted/60 p-2.5 font-mono text-xs leading-relaxed"
                  >
                    {{ pix.copy_paste }}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    class="shrink-0 print:hidden"
                    title="Copiar código PIX"
                    @click="copyPix"
                  >
                    <Check v-if="copied" class="text-emerald-500" />
                    <Copy v-else />
                  </Button>
                </div>
              </div>

              <div class="rounded-md border border-blue-500/30 bg-blue-50 p-4 text-sm dark:bg-blue-950/40">
                <div class="mb-2 font-medium text-blue-700 dark:text-blue-300">Como pagar:</div>
                <ol class="space-y-1.5 text-blue-700/90 dark:text-blue-200/90">
                  <li v-for="(step, index) in paymentSteps" :key="index" class="flex gap-2">
                    <span class="font-semibold">{{ index + 1 }}.</span>
                    <span>{{ step }}</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div
            v-if="whatsappUrl"
            class="rounded-md border border-emerald-500/40 bg-emerald-50 p-4 dark:bg-emerald-950/40"
          >
            <div class="font-medium text-emerald-700 dark:text-emerald-400">Já realizou o pagamento?</div>
            <p class="text-sm text-emerald-700/80 dark:text-emerald-300/80">
              Se a confirmação não aparecer em alguns minutos, envie o comprovante para o nosso financeiro.
            </p>
            <Button size="sm" class="mt-3 bg-emerald-600 text-white hover:bg-emerald-700 print:hidden" as-child>
              <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer">
                <MessageCircle />
                Enviar comprovante no WhatsApp
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";
import moment from "moment";
import { useClipboard } from "@vueuse/core";
import {
  CalendarDays,
  Check,
  CircleCheck,
  Copy,
  CreditCard,
  FileText,
  Landmark,
  MessageCircle,
  Printer,
  Receipt,
  RefreshCcw,
  Wallet,
} from "lucide-vue-next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Invoices from "@/services/invoices";
import { useAuthStore } from "@/stores/auth";
import currencyFilter from "@/filters/currencyFilter";
import { INVOICE_STATUS_CLASSES, invoiceStatusInfo, isInvoicePaid } from "@/lib/invoiceStatus";
import type { Invoice, InvoicePix } from "@/contracts/invoice";

const STATUS_POLL_MS = 15_000;

const route = useRoute();
const authStore = useAuthStore();

const invoice = ref<Invoice | null>(null);
const loading = ref(true);
const pix = ref<InvoicePix | null>(null);
const pixLoading = ref(false);
const pixError = ref<string | null>(null);
let pollTimer: ReturnType<typeof setInterval> | undefined;
const { copy, copied } = useClipboard({ legacy: true });

const receiverName = import.meta.env.VITE_PIX_RECEIVER_NAME as string | undefined;
const pixKey = import.meta.env.VITE_PIX_KEY as string | undefined;
const financeWhatsapp = String(import.meta.env.VITE_FINANCE_WHATSAPP ?? "").replace(/\D/g, "");

const paymentSteps = [
  "Abra o app do seu banco e acesse a área PIX",
  "Escaneie o QR Code ou use o PIX Copia e Cola",
  "Confira o valor e o recebedor e confirme o pagamento",
  "O pagamento é confirmado automaticamente em alguns instantes",
];

const status = computed(() => invoiceStatusInfo(invoice.value ?? {}));
const paid = computed(() => isInvoicePaid(invoice.value?.status));
const hasCustomer = computed(() => {
  const user = authStore.user as { asaas_costumer?: string | null } | null;
  return !!user?.asaas_costumer;
});

const whatsappUrl = computed(() => {
  if (!financeWhatsapp || !invoice.value) return null;

  const text = `Olá! Segue o comprovante de pagamento da ${invoice.value.name} (${currencyFilter(Number(invoice.value.amount))}).`;
  return `https://wa.me/${financeWhatsapp}?text=${encodeURIComponent(text)}`;
});

const formatDate = (value?: string | null) => (value ? moment.parseZone(value).format("DD/MM/YYYY") : "-");
const formatDateTime = (value: string) => moment(value).format("DD/MM/YYYY [às] HH:mm");

const loadInvoice = async () => {
  try {
    invoice.value = await Invoices.show(String(route.params.id));
  } catch (e) {
    console.error(e);
    invoice.value = null;
  } finally {
    loading.value = false;
  }
};

const loadPix = async () => {
  if (!invoice.value || paid.value || !hasCustomer.value) return;

  pixLoading.value = true;
  pixError.value = null;
  try {
    pix.value = await Invoices.pix(invoice.value.id);
    startPolling();
  } catch (e: any) {
    pixError.value = e?.response?.data?.message ?? "Não foi possível gerar o PIX agora. Tente novamente em instantes.";
  } finally {
    pixLoading.value = false;
  }
};

const startPolling = () => {
  stopPolling();
  pollTimer = setInterval(async () => {
    try {
      const fresh = await Invoices.show(String(route.params.id));
      if (isInvoicePaid(fresh.status)) {
        invoice.value = fresh;
        stopPolling();
        toast.success("Pagamento confirmado", { description: "Obrigado! Sua fatura foi paga." });
        authStore.fetchUser();
      }
    } catch (e) {
      console.error(e);
    }
  }, STATUS_POLL_MS);
};

const stopPolling = () => clearInterval(pollTimer);

const copyPix = async () => {
  if (!pix.value) return;

  try {
    await copy(pix.value.copy_paste);
    toast.success("Código PIX copiado");
  } catch (e) {
    console.error(e);
    toast.error("Não foi possível copiar", { description: "Selecione o código e copie manualmente." });
  }
};

const print = () => window.print();

onMounted(async () => {
  await loadInvoice();
  await loadPix();
});

onBeforeUnmount(stopPolling);
</script>

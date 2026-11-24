<template>
  <Alert
    v-if="invoice && notice"
    class="mb-4 flex gap-2.5 rounded-lg border border-amber-500/50 bg-amber-500/10 px-2.5 py-2 text-sm"
  >
    <div class="pt-0.5">
      <TriangleAlert class="size-4 text-amber-500" />
    </div>
    <div class="min-w-0 flex-1">
      <AlertTitle class="font-medium text-amber-700 dark:text-amber-400">
        {{ notice.overdue ? "Mensalidade vencida" : "Mensalidade próxima do vencimento" }}
      </AlertTitle>
      <AlertDescription class="text-amber-600 dark:text-amber-300">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <Clock class="size-4 shrink-0" />
            <span v-if="notice.overdue">Sua mensalidade venceu há <strong>{{ notice.distance }}</strong></span>
            <span v-else>Sua mensalidade vence em <strong>{{ notice.distance }}</strong></span>
          </div>
          <p class="text-sm opacity-80">
            {{
              suspended
                ? "Seu acesso está suspenso até a regularização do pagamento."
                : "Após o vencimento, seu acesso será suspenso até a regularização do pagamento."
            }}
          </p>
          <div class="flex flex-wrap gap-2 pt-1">
            <Button
              size="xs"
              class="h-7 text-[0.8rem] bg-amber-500 text-amber-950 hover:bg-amber-500/90"
              as-child
            >
              <router-link :to="{ name: 'invoices.show', params: { id: invoice.id } }">
                <CreditCard />
                Ver fatura pendente
                <ExternalLink />
              </router-link>
            </Button>
            <Button
              v-if="invoice.can_trust_release"
              size="xs"
              variant="outline"
              class="h-7 text-[0.8rem] border-amber-500/50 bg-transparent text-amber-700 hover:bg-amber-500/15 hover:text-amber-700 dark:text-amber-300 dark:hover:text-amber-200"
              :disabled="releasing"
              @click="trustRelease"
            >
              <Spinner v-if="releasing" />
              <Handshake v-else />
              Liberar na confiança (+3 dias)
            </Button>
          </div>
        </div>
      </AlertDescription>
    </div>
  </Alert>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import { Clock, CreditCard, ExternalLink, Handshake, TriangleAlert } from "lucide-vue-next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import Invoices from "@/services/invoices";
import { useAuthStore } from "@/stores/auth";
import { dueNoticeState } from "@/lib/invoiceStatus";
import type { Invoice } from "@/contracts/invoice";

const emit = defineEmits<{ released: [] }>();

const authStore = useAuthStore();
const invoice = ref<Invoice | null>(null);
const releasing = ref(false);
const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | undefined;

const suspended = computed(() => {
  const user = authStore.user as { is_available?: boolean | number } | null;
  return !!user && !user.is_available;
});

const notice = computed(() => dueNoticeState(invoice.value?.due_at, now.value));

const load = async () => {
  try {
    const data = await Invoices.nextDue();
    invoice.value = data.invoice;
  } catch (e) {
    console.error(e);
  }
};

const trustRelease = async () => {
  if (!invoice.value) return;

  releasing.value = true;
  try {
    const data = await Invoices.trustRelease(invoice.value.id);
    invoice.value = data.invoice;
    toast.success("Acesso liberado", { description: data.message });
    await authStore.fetchUser();
    emit("released");
  } catch (e) {
    console.error(e);
  } finally {
    releasing.value = false;
  }
};

onMounted(() => {
  load();
  timer = setInterval(() => (now.value = new Date()), 60_000);
});

onBeforeUnmount(() => clearInterval(timer));
</script>

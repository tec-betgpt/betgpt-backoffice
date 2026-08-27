<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Button } from "@/components/ui/button";
import { toast } from "vue-sonner";
import {
  CircleAlertIcon,
  CopyIcon,
  ShieldAlertIcon,
  TimerIcon,
} from "lucide-vue-next";
import { normalizeApiError } from "@/lib/apiError";
import { resolveApiErrorMessage } from "@/lib/apiErrorFeedback";

/**
 * Alerta inline padronizado para erros operacionais de tela (Fase 6, tarefa 7):
 * mensagem mapeada por código/status, `request_id` copiável quando presente e
 * contagem regressiva de rate limit (429) baseada em `Retry-After` — o retry
 * só é liberado ao fim da contagem, evitando loop de requisições.
 */

const props = withDefaults(
  defineProps<{
    /** Erro bruto (axios) ou já normalizado por uma store. */
    error: unknown;
    /** Exibe botão de retry (liberado após a contagem do 429). */
    showRetry?: boolean;
  }>(),
  { showRetry: true },
);

const emit = defineEmits<{
  retry: [];
}>();

const { t } = useI18n();

const normalized = computed(() => normalizeApiError(props.error));
const message = computed(() => resolveApiErrorMessage(normalized.value));
const isForbidden = computed(() => normalized.value.status === 403);
const isRateLimited = computed(() => normalized.value.status === 429);

// --- Contagem regressiva do rate limit ---------------------------------------

const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

watch(
  () => normalized.value.retryAfterSeconds,
  (seconds) => {
    stopCountdown();
    if (!isRateLimited.value || !seconds) return;

    countdown.value = seconds;
    countdownTimer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) stopCountdown();
    }, 1000);
  },
  { immediate: true },
);

onBeforeUnmount(stopCountdown);

const retryDisabled = computed(
  () => isRateLimited.value && countdown.value > 0,
);

async function copyRequestId() {
  if (!normalized.value.requestId) return;

  try {
    await navigator.clipboard.writeText(normalized.value.requestId);
    toast(t("api_errors.request_id_copied"));
  } catch {
    // Clipboard indisponível: o ID permanece visível para cópia manual.
  }
}
</script>

<template>
  <div class="border rounded-lg p-8 text-center space-y-3">
    <div class="flex justify-center">
      <ShieldAlertIcon v-if="isForbidden" class="size-6 text-destructive" />
      <TimerIcon v-else-if="isRateLimited" class="size-6 text-amber-600" />
      <CircleAlertIcon v-else class="size-6 text-destructive" />
    </div>

    <p class="text-sm text-muted-foreground max-w-md mx-auto">
      {{ message }}
    </p>

    <div
      v-if="normalized.requestId"
      class="flex items-center justify-center gap-2 text-xs text-muted-foreground"
    >
      <span>
        {{ t("api_errors.request_id_label") }}:
        <code class="bg-muted px-1.5 py-0.5 rounded select-all">
          {{ normalized.requestId }}
        </code>
      </span>
      <Button variant="ghost" size="icon" class="size-7" @click="copyRequestId">
        <CopyIcon class="size-3.5" />
      </Button>
    </div>

    <Button
      v-if="showRetry && !isForbidden"
      variant="outline"
      :disabled="retryDisabled"
      @click="emit('retry')"
    >
      <template v-if="retryDisabled">
        {{ t("api_errors.retry_in", { seconds: countdown }) }}
      </template>
      <template v-else>
        {{ t("api_errors.retry") }}
      </template>
    </Button>
  </div>
</template>

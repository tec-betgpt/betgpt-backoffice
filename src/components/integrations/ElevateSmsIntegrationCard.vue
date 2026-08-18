<template>
  <Card class="p-5">
    <div class="flex items-start justify-between mb-5">
      <div class="flex items-center gap-3">
        <div class="flex h-14 w-14 items-center justify-center rounded bg-muted">
          <MessageSquare class="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p class="font-medium">Elevate SMS</p>
          <p class="mt-1 text-sm text-muted-foreground">
            Envio de SMS transacionais e de campanha pela infraestrutura Elevate.
          </p>
        </div>
      </div>
      <Badge :variant="statusBadgeVariant">{{ statusBadgeLabel }}</Badge>
    </div>

    <div v-if="store.loading" class="space-y-4">
      <Skeleton class="h-9 w-full" />
      <Skeleton class="h-9 w-full" />
      <Skeleton class="h-9 w-full" />
    </div>

    <div v-else-if="loadError" class="space-y-3">
      <p class="text-sm text-destructive">{{ loadError }}</p>
      <Button variant="outline" size="sm" @click="emit('retry')">
        <RefreshCw class="mr-2 h-4 w-4" />
        Tentar novamente
      </Button>
    </div>

    <form v-else class="space-y-4" @submit.prevent="submit">
      <div class="space-y-2">
        <Label for="elevate-sms-api-key">Chave de API</Label>
        <div class="relative">
          <Input
            id="elevate-sms-api-key"
            v-model="store.form.api_key"
            :type="showApiKey ? 'text' : 'password'"
            maxlength="255"
            placeholder="Chave de API da integração"
            class="pr-10"
            autocomplete="off"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            :title="showApiKey ? 'Ocultar chave' : 'Exibir chave'"
            @click="showApiKey = !showApiKey"
          >
            <EyeOff v-if="showApiKey" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </Button>
        </div>
        <p v-if="isApiKeyMasked" class="text-xs text-muted-foreground">
          A chave atual está mascarada por segurança. Mantenha o valor para
          preservá-la ou digite uma nova chave para substituí-la.
        </p>
        <p v-if="fieldError('api_key')" class="text-xs text-destructive">
          {{ fieldError("api_key") }}
        </p>
      </div>

      <div class="space-y-2">
        <Label for="elevate-sms-email">E-mail</Label>
        <Input
          id="elevate-sms-email"
          v-model="store.form.email"
          type="email"
          maxlength="150"
          placeholder="partner@dominio.com"
        />
        <p v-if="fieldError('email')" class="text-xs text-destructive">
          {{ fieldError("email") }}
        </p>
      </div>

      <div class="space-y-2">
        <Label for="elevate-sms-sender">Remetente (Sender ID)</Label>
        <Input
          id="elevate-sms-sender"
          v-model="store.form.sender"
          maxlength="20"
          placeholder="ELEVATE"
        />
        <p class="text-xs text-muted-foreground">
          Opcional, até 20 caracteres. Identificador exibido como remetente da
          mensagem.
        </p>
        <p v-if="fieldError('sender')" class="text-xs text-destructive">
          {{ fieldError("sender") }}
        </p>
      </div>

      <div class="space-y-2">
        <Label for="elevate-sms-callback-url">URL de callback de status</Label>
        <Input
          id="elevate-sms-callback-url"
          v-model="store.form.status_callback_url"
          type="url"
          maxlength="255"
          placeholder="Reservado"
          disabled
        />
        <p class="text-xs text-muted-foreground">
          Reservado — será habilitado quando o supplier formalizar o callback
          de status.
        </p>
      </div>

      <div class="flex items-center space-x-2">
        <Switch id="elevate-sms-is-active" v-model:checked="store.form.is_active" />
        <Label for="elevate-sms-is-active" class="font-medium">Integração ativa</Label>
      </div>

      <div class="flex items-center justify-end gap-3 pt-2">
        <span v-if="store.saved" class="text-sm text-green-600">
          Configuração salva com sucesso.
        </span>
        <Button type="submit" :disabled="store.saving">
          <LucideSpinner v-if="store.saving" class="mr-2 h-4 w-4 animate-spin" />
          Salvar
        </Button>
      </div>
    </form>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import {
  Loader2 as LucideSpinner,
  Eye,
  EyeOff,
  MessageSquare,
  RefreshCw,
} from "lucide-vue-next";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useSmsIntegrationsStore } from "@/stores/smsIntegrations";
import type { ElevateSmsFieldErrors } from "@/stores/smsIntegrations";

const emit = defineEmits<{ (e: "retry"): void }>();

const { toast } = useToast();
const store = useSmsIntegrationsStore();

const showApiKey = ref(false);
const localErrors = ref<ElevateSmsFieldErrors>({});

const loadError = computed(() => (store.loadFailed ? store.error : null));

const isApiKeyMasked = computed(() => store.form.api_key.includes("*"));

const statusBadgeVariant = computed(() => {
  switch (store.statusBadge) {
    case "active":
      return "default" as const;
    case "inactive":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
});

const statusBadgeLabel = computed(() => {
  switch (store.statusBadge) {
    case "active":
      return "Ativa";
    case "inactive":
      return "Inativa";
    default:
      return "Não configurada";
  }
});

function fieldError(field: keyof ElevateSmsFieldErrors) {
  return localErrors.value[field] ?? store.fieldErrors[field] ?? null;
}

function validate(): boolean {
  const errors: ElevateSmsFieldErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!store.form.api_key.trim()) {
    errors.api_key = "A chave de API é obrigatória.";
  } else if (store.form.api_key.length > 255) {
    errors.api_key = "A chave de API deve ter no máximo 255 caracteres.";
  }

  if (!store.form.email.trim()) {
    errors.email = "O e-mail é obrigatório.";
  } else if (store.form.email.length > 150) {
    errors.email = "O e-mail deve ter no máximo 150 caracteres.";
  } else if (!emailPattern.test(store.form.email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (store.form.sender.length > 20) {
    errors.sender = "O remetente deve ter no máximo 20 caracteres.";
  }

  localErrors.value = errors;
  return Object.keys(errors).length === 0;
}

async function submit() {
  if (!validate()) {
    return;
  }

  try {
    await store.saveConfig();
    toast({
      title: "Sucesso",
      description: "Integração Elevate SMS salva com sucesso.",
    });
  } catch {
    if (!store.error) {
      return;
    }

    toast({
      title: "Erro",
      description: store.error,
      variant: "destructive",
    });
  }
}
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div>
      <h2 class="text-2xl font-bold tracking-tight">Envio Direto de SMS</h2>
      <p class="text-muted-foreground">
        Envie mensagens SMS pela integração Elevate SMS. Também serve como
        ferramenta de homologação da integração.
      </p>
    </div>

    <Alert v-if="store.status === 'error' && store.errorMessage" variant="destructive">
      <AlertTitle>Não foi possível enviar a mensagem</AlertTitle>
      <AlertDescription>{{ store.errorMessage }}</AlertDescription>
    </Alert>

    <div class="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Nova mensagem</CardTitle>
          <CardDescription>
            O destinatário pode ser informado com qualquer formatação — o
            backend normaliza (BR sem DDI recebe 55 automaticamente).
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="sms-direct-project">Projeto</Label>
            <Input
              v-if="isSingleProject"
              id="sms-direct-project"
              :model-value="activeGroupProject?.name"
              disabled
            />
            <Select v-else v-model="selectedProjectId" :disabled="store.isSending">
              <SelectTrigger id="sms-direct-project">
                <SelectValue placeholder="Selecione o projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="project in projectOptions"
                  :key="project.id"
                  :value="String(project.project_id)"
                >
                  {{ project.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="fieldError('project_id')" class="text-xs text-destructive">
              {{ fieldError("project_id") }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="sms-direct-phone">Telefone do destinatário</Label>
            <Input
              id="sms-direct-phone"
              v-model="phone"
              placeholder="(11) 99998-8888"
              :disabled="store.isSending"
            />
            <p class="text-xs text-muted-foreground">
              De 10 a 15 dígitos, com ou sem formatação.
            </p>
            <p v-if="fieldError('recipient_phone')" class="text-xs text-destructive">
              {{ fieldError("recipient_phone") }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="sms-direct-message">Mensagem</Label>
            <Textarea
              id="sms-direct-message"
              v-model="messageBody"
              rows="6"
              maxlength="1530"
              placeholder="Digite a mensagem a ser enviada"
              :disabled="store.isSending"
            />
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>{{ messageBody.length }} / 1530 caracteres</span>
              <span v-if="hasMeuLink">Contém {meu_link} — exige URL válida no supplier</span>
            </div>
            <p v-if="fieldError('message_body')" class="text-xs text-destructive">
              {{ fieldError("message_body") }}
            </p>
          </div>

          <div class="flex justify-end">
            <Button :disabled="store.isSending" @click="submit">
              <LucideSpinner v-if="store.isSending" class="mr-2 h-4 w-4 animate-spin" />
              {{ store.isSending ? "Enviando..." : "Enviar SMS" }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card v-if="store.status === 'success' && store.result">
        <CardHeader>
          <CardTitle>Resultado do envio</CardTitle>
          <CardDescription>
            Mensagem aceita. Em caso de falha posterior, consulte o histórico
            técnico para a trilha completa.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Status consolidado</span>
            <SmsStatusBadge :status="store.result.status" />
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-muted-foreground">Status no supplier</span>
            <span class="text-sm font-mono">{{ store.result.supplier_status || "—" }}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-muted-foreground">ID da mensagem (supplier)</span>
            <span class="text-sm font-mono break-all text-right">
              {{ store.result.supplier_message_id || "—" }}
            </span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-muted-foreground">ID do disparo (supplier)</span>
            <span class="text-sm font-mono break-all text-right">
              {{ store.result.supplier_dispatch_id || "—" }}
            </span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-muted-foreground">Solicitado em</span>
            <span class="text-sm">{{ formatDateTime(store.result.requested_at) }}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import SmsStatusBadge from "@/components/sms/SmsStatusBadge.vue";
import { useSmsDirectSendStore } from "@/stores/smsDirectSend";
import type { SmsDirectSendFieldErrors } from "@/stores/smsDirectSend";
import { useWorkspaceStore } from "@/stores/workspace";

const store = useSmsDirectSendStore();
const workspaceStore = useWorkspaceStore();

const phone = ref("");
const messageBody = ref("");
const selectedProjectId = ref("");
const localErrors = ref<SmsDirectSendFieldErrors>({});

const activeGroupProject = computed(() => workspaceStore.activeGroupProject);
const isSingleProject = computed(() => activeGroupProject.value?.type === "project");

const projectOptions = computed(() =>
  (workspaceStore.group_projects as Array<{ id: string; project_id: string; name: string; type: string }>)
    .filter((project) => project.type === "project"),
);

const hasMeuLink = computed(() => messageBody.value.includes("{meu_link}"));

function fieldError(field: keyof SmsDirectSendFieldErrors) {
  return localErrors.value[field] ?? store.fieldErrors[field] ?? null;
}

function validate(): boolean {
  const errors: SmsDirectSendFieldErrors = {};
  const digits = phone.value.replace(/\D/g, "");

  if (!resolvedProjectId()) {
    errors.project_id = "Selecione um projeto para o envio.";
  }

  if (!phone.value.trim()) {
    errors.recipient_phone = "O telefone do destinatário é obrigatório.";
  } else if (digits.length < 10 || digits.length > 15) {
    errors.recipient_phone = "O telefone deve ter de 10 a 15 dígitos.";
  }

  if (!messageBody.value.trim()) {
    errors.message_body = "A mensagem é obrigatória.";
  } else if (messageBody.value.length > 1530) {
    errors.message_body = "A mensagem deve ter no máximo 1530 caracteres.";
  }

  localErrors.value = errors;
  return Object.keys(errors).length === 0;
}

function resolvedProjectId(): string | null {
  if (isSingleProject.value) {
    return activeGroupProject.value?.project_id ?? null;
  }

  return selectedProjectId.value || null;
}

async function submit() {
  if (!validate()) {
    return;
  }

  const projectId = resolvedProjectId();
  if (!projectId) {
    return;
  }

  try {
    await store.send({
      project_id: Number(projectId),
      recipient_phone: phone.value.trim(),
      message_body: messageBody.value,
    });
  } catch {
    // Feedback exibido inline via store.errorMessage / store.fieldErrors.
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(
    new Date(value),
  );
}
</script>

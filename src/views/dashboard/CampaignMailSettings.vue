<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div>
      <h1 class="text-2xl font-semibold">E-mail SMTP (Campanhas)</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Configuração global Elevate para disparo de campanhas por e-mail. Não é por projeto — o envio sai da infraestrutura Elevate.
        No futuro pode migrar para ActiveCampaign ou outra API.
      </p>
    </div>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Erro</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <CardTitle>SMTP</CardTitle>
        <CardDescription>
          Quando habilitado, estas credenciais têm prioridade sobre as variáveis <code>MAIL_*</code> do ambiente.
          <span v-if="form.resolved">
            Atualmente o provedor está
            <strong>{{ form.resolved.is_ready ? "pronto" : "incompleto" }}</strong>
            (fonte: {{ form.resolved.source }}).
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-center gap-3">
          <Switch v-model:checked="form.is_enabled" :disabled="loading || saving" />
          <Label>Habilitar SMTP de campanhas</Label>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label>Host</Label>
            <Input v-model="form.host" :disabled="loading || saving" placeholder="smtp.seudominio.com" />
          </div>
          <div class="space-y-2">
            <Label>Porta</Label>
            <Input v-model.number="form.port" type="number" :disabled="loading || saving" placeholder="587" />
          </div>
          <div class="space-y-2">
            <Label>Criptografia</Label>
            <select
              v-model="form.encryption"
              :disabled="loading || saving"
              class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
              <option value="null">Nenhuma</option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>Usuário</Label>
            <Input v-model="form.username" :disabled="loading || saving" autocomplete="off" />
          </div>
          <div class="space-y-2">
            <Label>Senha {{ form.has_password ? "(já configurada — deixe em branco para manter)" : "" }}</Label>
            <Input v-model="form.password" type="password" :disabled="loading || saving" autocomplete="new-password" />
          </div>
          <div class="space-y-2">
            <Label>Remetente (from)</Label>
            <Input v-model="form.from_address" :disabled="loading || saving" placeholder="noreply@elevate.com" />
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label>Nome do remetente</Label>
            <Input v-model="form.from_name" :disabled="loading || saving" placeholder="Elevate" />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" :disabled="loading || saving" @click="load">Recarregar</Button>
          <Button :disabled="loading || saving" @click="save">
            {{ saving ? "Salvando..." : "Salvar" }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import CampaignMailSettingsService from "@/services/campaignMailSettings";

const { toast } = useToast();
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");

const form = reactive({
  is_enabled: false,
  host: "",
  port: 587 as number | null,
  encryption: "tls" as string | null,
  username: "",
  password: "",
  from_address: "",
  from_name: "",
  has_password: false,
  resolved: null as null | {
    is_ready: boolean;
    source: string;
    host: string | null;
    port: number | null;
    encryption: string | null;
    from_address: string | null;
    from_name: string | null;
  },
});

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const data = await CampaignMailSettingsService.get();
    form.is_enabled = Boolean(data.is_enabled);
    form.host = data.host || "";
    form.port = data.port ?? 587;
    form.encryption = data.encryption || "tls";
    form.username = data.username || "";
    form.password = "";
    form.from_address = data.from_address || "";
    form.from_name = data.from_name || "";
    form.has_password = Boolean(data.has_password);
    form.resolved = data.resolved || null;
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || "Falha ao carregar configuração SMTP.";
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  errorMessage.value = "";
  try {
    const payload: Record<string, unknown> = {
      is_enabled: form.is_enabled,
      host: form.host || null,
      port: form.port || null,
      encryption: form.encryption || null,
      username: form.username || null,
      from_address: form.from_address || null,
      from_name: form.from_name || null,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    const data = await CampaignMailSettingsService.save(payload as any);
    form.has_password = Boolean(data.has_password);
    form.password = "";
    form.resolved = data.resolved || null;
    toast({ title: "Configuração SMTP salva." });
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || "Falha ao salvar configuração SMTP.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

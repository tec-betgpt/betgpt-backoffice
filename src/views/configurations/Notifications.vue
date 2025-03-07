<template>
  <div>
    <div class="mb-4">
      <h3 class="text-lg font-medium">Notificações</h3>
      <p class="text-sm text-muted-foreground">
        Configure como você recebe as notificações.
      </p>
    </div>
    <Separator class="mb-3" />
    <form @submit.prevent="submit">
      <div>
        <div class="space-y-4">
          <div class="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label for="communication_emails">E-mails de comunicação</Label>
              <p class="text-sm text-muted-foreground">
                Receber e-mails sobre a atividade da sua conta.
              </p>
            </div>
            <Checkbox
              :checked="form.communication_emails"
              @update:checked="
                (checked) => (form.communication_emails = checked)
              "
              id="communication_emails"
            />
          </div>
          <HasError :form="form" field="communication_emails" />

          <div class="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label for="marketing_emails">E-mails de marketing</Label>
              <p class="text-sm text-muted-foreground">
                Receber e-mails sobre novos produtos, recursos e mais.
              </p>
            </div>
            <Checkbox
              :checked="form.marketing_emails"
              @update:checked="(checked) => (form.marketing_emails = checked)"
              id="marketing_emails"
            />
          </div>
          <HasError :form="form" field="marketing_emails" />

          <div class="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label for="social_emails">E-mails sociais</Label>
              <p class="text-sm text-muted-foreground">
                Receber e-mails para solicitações enviadas ao seu perfil.
              </p>
            </div>
            <Checkbox
              :checked="form.social_emails"
              @update:checked="(checked) => (form.social_emails = checked)"
              id="social_emails"
            />
          </div>
          <HasError :form="form" field="social_emails" />

          <div class="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label for="security_emails">E-mails de segurança</Label>
              <p class="text-sm text-muted-foreground">
                Receber e-mails sobre sua atividade de conta e segurança.
              </p>
            </div>
            <Checkbox
              :checked="form.security_emails"
              @update:checked="(checked) => (form.security_emails = checked)"
              id="security_emails"
            />
          </div>
          <HasError :form="form" field="security_emails" />
        </div>
      </div>

      <div class="flex gap-2 justify-start mt-4">
        <Button :disabled="loading" type="submit">
          <LucideSpinner v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          Atualizar Notificações
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";
import Form from "vform";
Form.axios = api;

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 as LucideSpinner } from "lucide-vue-next";

const { toast } = useToast();
const authStore = useAuthStore();
const loading = ref(false);

const form = ref(
  new Form({
    communication_emails: false,
    marketing_emails: false,
    social_emails: false,
    security_emails: false,
  })
);

onMounted(() => {
  const settings = authStore.user?.preferences;
  if (settings) {
    form.value.communication_emails = Boolean(settings.communication_emails);
    form.value.marketing_emails = Boolean(settings.marketing_emails);
    form.value.social_emails = Boolean(settings.social_emails);
    form.value.security_emails = Boolean(settings.security_emails);
  }
});

const submit = async () => {
  loading.value = true;
  try {
    await form.value.post("/user/configurations/update-notifications");
    toast({
      title: "Sucesso",
      description: "Configurações de notificações atualizadas.",
      variant: "success",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao atualizar as configurações de notificações.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};
</script>

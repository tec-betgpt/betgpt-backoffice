<template>
  <div class="space-y-6">
    <SettingsHeader
      title="Notificações"
      description="Escolha quais e-mails você quer receber."
    />

    <form @submit.prevent="submit">
      <div class="divide-y rounded-lg border">
        <div
          v-for="option in options"
          :key="option.key"
          class="flex items-center justify-between gap-4 p-4"
        >
          <div class="space-y-1">
            <Label :for="option.key">{{ option.label }}</Label>
            <p class="text-sm text-muted-foreground">{{ option.description }}</p>
          </div>
          <Switch
            :id="option.key"
            :checked="form[option.key]"
            @update:checked="(checked: boolean) => (form[option.key] = checked)"
          />
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <Button :disabled="loading" type="submit">
          <LucideSpinner v-if="loading" class="size-4 animate-spin" />
          Salvar preferências
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { toast } from "vue-sonner";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import Users from '@/services/users'
import SettingsHeader from "@/views/configurations/components/SettingsHeader.vue";

type NotificationKey = "communication_emails" | "marketing_emails" | "social_emails" | "security_emails";

const options: { key: NotificationKey; label: string; description: string }[] = [
  { key: "communication_emails", label: "E-mails de comunicação", description: "Avisos sobre a atividade da sua conta." },
  { key: "marketing_emails", label: "E-mails de marketing", description: "Novidades sobre produtos e recursos." },
  { key: "social_emails", label: "E-mails sociais", description: "Solicitações enviadas ao seu perfil." },
  { key: "security_emails", label: "E-mails de segurança", description: "Alertas de acesso e de segurança da conta." },
];

const authStore = useAuthStore();

const loading = ref(false);
const form = ref<Record<NotificationKey, boolean>>({
  communication_emails: false,
  marketing_emails: false,
  social_emails: false,
  security_emails: false,
})

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
    await Users.updateNotifications(form.value)

    toast.success("Sucesso", { description: "Configurações de notificações atualizadas." });
  } catch (error) {
    toast.error("Erro", { description: "Erro ao atualizar as configurações de notificações." });
  }

  loading.value = false;
};
</script>

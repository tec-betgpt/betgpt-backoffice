<template>
  <div class="space-y-6">
    <SettingsHeader
      title="Segurança"
      description="Senha e verificação em duas etapas da sua conta."
    />

    <form class="rounded-lg border" @submit.prevent="submit">
      <div class="border-b px-4 py-3 sm:px-6">
        <h4 class="font-medium">Senha</h4>
        <p class="text-sm text-muted-foreground">
          Use uma senha forte, que você não usa em outros sites.
        </p>
      </div>

      <div class="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <div class="space-y-2">
          <Label for="current_password">Senha atual</Label>
          <Input
            id="current_password"
            v-model="form.current_password"
            type="password"
            autocomplete="current-password"
            placeholder="Digite sua senha atual"
          />
        </div>
        <div class="hidden sm:block" />
        <div class="space-y-2">
          <Label for="new_password">Nova senha</Label>
          <Input
            id="new_password"
            v-model="form.new_password"
            type="password"
            autocomplete="new-password"
            placeholder="Digite a nova senha"
          />
        </div>
        <div class="space-y-2">
          <Label for="new_password_confirmation">Confirme a nova senha</Label>
          <Input
            id="new_password_confirmation"
            v-model="form.new_password_confirmation"
            type="password"
            autocomplete="new-password"
            placeholder="Repita a nova senha"
          />
        </div>
      </div>

      <div class="flex justify-end border-t px-4 py-3 sm:px-6">
        <Button :disabled="loading" type="submit">
          <LucideSpinner v-if="loading" class="size-4 animate-spin" />
          Alterar senha
        </Button>
      </div>
    </form>

    <TwoFactorAuth />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Users from '@/services/users'

import { toast } from "vue-sonner";
import { Loader2 as LucideSpinner } from "lucide-vue-next";

import TwoFactorAuth from "@/views/configurations/SecurityTwoFactor/TwoFactorAuth.vue";
import SettingsHeader from "@/views/configurations/components/SettingsHeader.vue";

const loading = ref(false);

const form = ref({
  current_password: "",
  new_password: "",
  new_password_confirmation: "",
})

const submit = async () => {
  loading.value = true;
  try {
    if (form.value.new_password !== form.value.new_password_confirmation) {
      toast.error("Erro", { description: "Confirme a nova senha." });
      loading.value = false;
      return
    }
    await Users.changePassword(form.value)

    toast("Sucesso", { description: "Senha alterada com sucesso." });

    reset();
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    toast.error("Erro", { description: "Não foi possível alterar sua senha. Verifique os dados." });
  }

  loading.value = false;
};

const reset = () => {
  form.value.current_password = ''
  form.value.new_password = ''
  form.value.new_password_confirmation = ''
}

</script>

<template>


    <div class="grid sm:grid-cols-1 md:grid-cols-2 gap-8 ">
      <div>
        <div class="mb-4">
          <h3 class="text-lg font-medium">Alteração de Senha</h3>
          <p class="text-sm text-muted-foreground">Atualize sua senha de acesso.</p>
        </div>
        <Separator class="mb-3" />
        <form @submit.prevent="submit">
          <div class="mb-3">
            <Label for="current_password">Senha Atual</Label>
            <Input
                type="password"
                id="current_password"
                placeholder="Digite sua senha atual"
                v-model="form.current_password"
                class="mt-1"
            />
          </div>
          <div class="mb-3">
            <Label for="new_password">Nova Senha</Label>
            <Input
                type="password"
                id="new_password"
                placeholder="Digite a nova senha"
                v-model="form.new_password"
                class="mt-1"
            />
          </div>
          <div class="mb-3">
            <Label for="new_password_confirmation">Confirme a Nova Senha</Label>
            <Input
                type="password"
                id="new_password_confirmation"
                placeholder="Confirme a nova senha"
                v-model="form.new_password_confirmation"
                class="mt-1"
            />
          </div>
          <div class="flex gap-2 justify-start">
            <Button :disabled="loading" type="submit">
              <LucideSpinner v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              Alterar Senha
            </Button>
          </div>
        </form>
      </div>

      <TwoFactorAuth/>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Users from '@/services/users'

import { useToast } from "@/components/ui/toast/use-toast";
import { Loader2 as LucideSpinner } from "lucide-vue-next";

import TwoFactorAuth from "@/views/configurations/SecurityTwoFactor/TwoFactorAuth.vue";

const { toast } = useToast();
const loading = ref(false);

const form = ref({
  current_password: "",
  new_password: "",
  new_password_confirmation: "",
})

const submit = async () => {
  loading.value = true;
  try {
    await Users.changePassword(form.value)

    toast({
      title: "Sucesso",
      description: "Senha alterada com sucesso.",
    });

    reset();
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    toast({
      title: "Erro",
      description: "Não foi possível alterar sua senha. Verifique os dados.",
      variant: "destructive",
    });
  }

  loading.value = false;
};

const reset = () => {
  form.value.current_password = ''
  form.value.new_password = ''
  form.value.new_password_confirmation = ''
}

</script>

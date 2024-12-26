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
            <HasError :form="form" field="current_password" />
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
            <HasError :form="form" field="new_password" />
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
            <HasError :form="form" field="new_password_confirmation" />
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
import api from "@/services/api";
import Form from "vform";
import { ShieldCheck,CopyIcon } from 'lucide-vue-next';

Form.axios = api;
import {useAuthStore} from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input, HasError } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast/use-toast";
import { Loader2 as LucideSpinner } from "lucide-vue-next";

import TwoFactorAuth from "@/views/configurations/SecurityTwoFactor/TwoFactorAuth.vue";
const codeTwoFactor = ref([])
const { toast } = useToast();
const loading = ref(false);
const loading2fa = ref(false)
const qrCode = ref("")
const authStore = useAuthStore();
const isDialog = ref(false);
const step = ref(true)


const form = ref(
  new Form({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  })
);

const form2fa = ref(new Form({
      two_factor_code:"",
      type:""
    }))

const submit = async () => {
  loading.value = true;
  try {
    await form.value.post("/user/configurations/change-password");
    toast({
      title: "Sucesso",
      description: "Senha alterada com sucesso.",
      variant: "success",
    });
    form.value.reset();
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    toast({
      title: "Erro",
      description: "Não foi possível alterar sua senha. Verifique os dados.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};
//Disable
const disable2fa = async () => {
  loading2fa.value = true
  try {
    if (codeTwoFactor.value.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira o código de dois fatores.",
        variant: "destructive",
      });
      return;
    }

    form2fa.value.two_factor_code = codeTwoFactor.value.join("");
    await form2fa.value.post("/user/configurations/disable-two-factor");

    toast({
      title: "Sucesso",
      description: "Autenticação de dois fatores desativada com sucesso.",
      variant: "success",
    });

    codeTwoFactor.value = [];
    step.value = true;
    isDialog.value = false
  } catch (error: any) {
    console.error("Erro ao desativar 2FA:", error);
    toast({
      title: "Erro",
      description:
          error?.response?.data?.message || "Não foi possível desativar o 2FA. Tente novamente.",
      variant: "destructive",
    });
  }finally {
    loading2fa.value = false
    codeTwoFactor.value = []

  }
};
const nextStep = async () => {
  loading2fa.value = true
  try {

    if (authStore.user.preferences.auth2fa === "email") {
      await api.get(`/auth/login/two-factor/${authStore.user.id}`);
    }
    step.value = false;
  } catch (error: any) {
    console.error("Erro ao avançar para o próximo passo do 2FA:", error);
    toast({
      title: "Erro",
      description: "Não foi possível avançar para o próximo passo.",
      variant: "destructive",
    });
  }finally {
    loading2fa.value = false

  }
};

const openDialog = async ()=>{
  console.log(isDialog.value)
  isDialog.value = !isDialog.value;
  console.log(isDialog.value)
}
//Active
const active2fa = async (type: string) => {
  step.value = false;
  loading2fa.value = true;
  try {
    form2fa.value.type = type;
    qrCode.value = "";
    const response = await form2fa.value.post("/user/configurations/active-two-factor");
    console.log(response.data);
    if (response.data.message === "Scan this QR code with your authenticator app.") {
      qrCode.value = response.data.data;
    }
  } catch (error: any) {
    isDialog.value = false
    step.value = true
    console.error("Erro ao ativar 2FA:", error);
    toast({
      title: "Erro",
      description: "Não foi possível ativar o 2FA. Tente novamente.",
      variant: "destructive",
    });
  } finally {
    loading2fa.value = false;
  }
};
const validate2fa = async ()=>{
  loading2fa.value = true
  try {
    form2fa.value.two_factor_code = codeTwoFactor.value.join("");
    console.log(form2fa.value)
     await form2fa.value.post("/user/configurations/validate-two-factor")
    toast({
      title: "Sucesso",
      description: "Autenticação de dois fatores validada com sucesso.",
      variant: "success",
    });
  }catch (error){
    console.error("Erro ao validar 2FA:", error);
    toast({
      title: "Erro",
      description: "Não foi possível validar o 2FA. Tente novamente.",
      variant: "destructive",
    });
  }finally {
    loading2fa.value = false
    codeTwoFactor.value = []
  }
}
const status2fa = async ()=>{

}
</script>

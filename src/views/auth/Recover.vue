<template>
  <div
    class=" h-screen w-screen flex-col flex p-6 items-center align-middle relative "
  >
    <div class="w-full  h-16 flex justify-center items-center absolute  align-middle">
      <Progress v-model="progress"  class="sm:w-2/5 w-2/4 max-w-80" />
    </div>
    <div class="h-full w-full  flex flex-col justify-center align-middle items-center">
      <div class="w-full flex h-fit justify-center items-center animate-in animate-out  align-middle ">
        <img :src="mode == 'light' ? '/logo-elevate-square-black.png':'/logo-elevate-square-white.png'" class="h-20" alt=""/>
      </div>
      <div class="flex w-full  h-fit flex-col justify-center align-middle items-center space-y-6 sm:w-[350px] py-20">
        <template v-if="step === 1">
          <div class="flex flex-col w-full space-y-1 text-center">
            <h1 class="text-2xl font-semibold tracking-tight">
              {{ $t("recover_password") }}
            </h1>
            <p class="text-sm text-muted-foreground">
              {{ $t("recover_text") }}
            </p>
          </div>
          <form @submit.prevent="recover" class="w-full">
            <div class="grid gap-2">
                <div class="grid gap-1 mb-2">
                  <Label class="font-semibold text-xs" for="email"> {{ $t("email") }} </Label>
                  <Input
                      id="email"
                      type="email"
                      v-model="formStep1.key"
                      :disabled="loading"
                  />
                </div>
                <Button :disabled="loading" type="submit">
                  <LucideSpinner
                      v-if="loading"
                      class="mr-2 h-4 w-4 animate-spin"
                  />
                  {{ $t("recover") }}
                </Button>
              </div>
          </form>
        </template>

        <template v-if="step === 2">
          <div class="flex flex-col space-y-1 text-center">
            <h1 class="text-2xl font-semibold tracking-tight">
              {{ $t("sended_email") }}
            </h1>
            <p class="text-sm text-muted-foreground">
              {{ $t("insert_code_to_your_email") }}
            </p>
          </div>
          <div :class="cn('grid gap-6 w-full')">
            <form @submit.prevent="nextStep">
              <div class="grid gap-2">
                <div class="grid gap-1 mb-2">
                  <Label class="text-xs font-semibold" for="token">
                    {{ $t("verification_code") }}
                  </Label>
                  <Input
                      id="token"
                      type="text"
                      v-model="token"
                      :disabled="loading"
                  />
                </div>
                <Button :disabled="loading" type="submit">
                  <LucideSpinner
                      v-if="loading"
                      class="mr-2 h-4 w-4 animate-spin"
                  />
                  {{ $t("confirm") }}
                </Button>
              </div>
            </form>
          </div>
        </template>

        <template v-if="step === 3">
          <div class="flex flex-col space-y-2 text-center">
            <h1 class="text-2xl font-semibold tracking-tight">
              {{ $t("create_new_password") }}
            </h1>
            <p class="text-sm text-muted-foreground">
              {{ $t("new_password_instructions") }}
            </p>
          </div>
          <div :class="cn('grid gap-6 w-full')">
            <form @submit.prevent="confirmNewPassword">
              <div class="grid gap-2">
                <div class="grid gap-1 mb-2">
                  <Label class="sr-only" for="new_password">
                    {{ $t("new_password") }}
                  </Label>
                  <Input
                      id="new_password"
                      placeholder="Nova Senha"
                      type="password"
                      v-model="formStep3.password"
                      required
                      :disabled="loading"
                  />
                </div>
                <div class="grid gap-1 mb-2">
                  <Label class="sr-only" for="password_confirmation">
                    {{ $t("confirm_password") }}
                  </Label>
                  <Input
                      id="password_confirmation"
                      placeholder="Confirmação de senha"
                      type="password"
                      v-model="formStep3.password_confirmation"
                      required
                      :disabled="loading"
                  />
                </div>
                <Button :disabled="loading" type="submit">
                  <LucideSpinner
                      v-if="loading"
                      class="mr-2 h-4 w-4 animate-spin"
                  />
                  {{ $t("confirm") }}
                </Button>
              </div>
            </form>
          </div>
        </template>

        <template v-if="step === 4">
          <div class="flex flex-col space-y-2 text-center">
            <h1 class="text-2xl font-semibold tracking-tight">
              {{ $t("finish") }}
            </h1>
            <p class="text-sm text-muted-foreground">
              {{ $t("recover_finish_text") }}

            </p>

          </div>
        </template>
        <Button @click="goBack" v-if="step !== 4" class="sm:w-full w-3/4" variant="outline">
          Voltar
        </Button>
        <Button v-else @click="finish" class="sm:w-full w-3/4" >
            Sair
        </Button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import {ref, watch} from "vue";
import { useRouter } from "vue-router";
import Recover from '@/services/recover'
import Tokens from '@/services/tokens'
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { Progress } from '@/components/ui/progress'
import {useColorMode} from "@vueuse/core";
import {useToast} from "@/components/ui/toast";

const router = useRouter();
const step = ref(1);
const loading = ref(false);
const token = ref("");
const mode = useColorMode()
const formStep1 = ref({
  key: "",
  action: "password_recovery",
  type: "email",
});
const formStep3 = ref({
  email: "",
  password: "",
  password_confirmation: "",
  token: "",
})
const progress = ref(0)

watch(step, () => {
  switch (step.value) {
    case 1: progress.value = 33; break;
    case 2: progress.value = 66; break;
    case 3: progress.value = 80; break;
    case 4: progress.value = 100; break;
  }
},{immediate: true})
const setStep = (value) => {
  step.value = value;
};

/**
 * Avança para o próximo passo no processo de recuperação de senha.
 *
 * - Verifica se o token foi informado.
 * - Exibe uma mensagem de erro caso o token esteja ausente.
 * - Valida o token utilizando a API e, em caso de sucesso, avança para o próximo passo.
 * - Exibe uma mensagem de erro caso a validação do token falhe.
 * - Garante que o estado de carregamento seja desativado ao final.
 */
const nextStep = async () => {
  if (!token.value) {
    Swal.fire({
      title: "Token não informado",
      text: "O token enviado no e-mail não foi informado",
      icon: "error",
    });
    return;
  }

  loading.value = true;

  try {
    await Tokens.check({
      key: formStep1.value.key,
      token: token.value,
    });

    setStep(3);
  } catch (error) {
    Swal.fire({
      title: "Erro na validação",
      text: "O token informado está incorreto ou expirou.",
      icon: "error",
    });
  } finally {
    loading.value = false;
  }
};

/**
 * Envia o pedido de recuperação de senha.
 *
 * - Define o estado de carregamento como ativo.
 * - Envia os dados do formulário para a API.
 * - Em caso de sucesso, avança para o próximo passo.
 * - Garante que o estado de carregamento seja desativado ao final.
 */
const recover = async () => {
  loading.value = true;
  try {
    await Tokens.send({
      key: formStep1.value.key,
      action: formStep1.value.action,
      type: formStep1.value.type,
    });
    setStep(2);
  } catch (error) {
    useToast().toast({
      title:"Falha na solicitação",
      description: error.message,
    })
    console.log(error);
  } finally {
    loading.value = false;
  }
};

/**
 * Retorna ao passo anterior ou à página de login.
 *
 * - Se estiver no primeiro passo, redireciona para a página de login.
 * - Caso contrário, redefine o formulário e retorna ao primeiro passo.
 */
const goBack = () => {
  if (step.value === 1) {
    router.push("/login");
  } else {
    setStep(1);
    formStep1.value.key ="";
    formStep3.value.token = "";
    loading.value = false;
  }
};

/**
 * Confirma a nova senha no processo de recuperação.
 *
 * - Define o estado de carregamento como ativo.
 * - Envia os dados da nova senha para a API.
 * - Em caso de sucesso, avança para o passo final.
 * - Garante que o estado de carregamento seja desativado ao final.
 */
const confirmNewPassword = async () => {
  loading.value = true;
  try {
    await Recover.finish(formStep3.value);
    setStep(4);
  } catch (error) {
    useToast().toast({
      title:"Falha na solicitação",
      description: error.message,
    })
    console.log(error);
  } finally {
    loading.value = false;
  }
};

/**
 * Finaliza o processo de recuperação de senha e redireciona para a página de login.
 */
const finish = () => {
  router.push("/login");
};
</script>

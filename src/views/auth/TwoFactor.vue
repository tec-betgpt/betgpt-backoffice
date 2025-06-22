<template>
  <div class="h-screen w-full flex-col flex p-6 items-center align-middle relative">
    <div class="w-full h-16 absolute z-10 ">
      <img :src="mode == 'light' ? '/logo-elevate-square-black.png':'/logo-elevate-square-white.png'"
           class=" h-16 ml-6"
           alt="Logo Elevate"/>
    </div>
    <!-- Tela de Inserção de Código PIN -->
    <div
        v-if="recoveryScreen"
        class="mx-10 flex w-full h-screen flex-col justify-center space-y-6 sm:w-[350px]"
    >
      <div class="flex flex-col space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ $t("login_used_two_factor") }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ $t("login_info_two_factor") }}
        </p>
      </div>
      <div class="flex flex-col justify-center align-middle gap-2">
        <Pin
            :finish="twoFactorLogin"
            class="flex justify-center"
            :loading="loading"
        />
        <p
            class="text-xs text-end text-gray-500 font-normal cursor-pointer"
            @click="getRecoveryCode"
        >
          {{ $t("no_access_two_factor") }}
        </p>
      </div>
      <div class="flex flex-col justify-center align-middle gap-3">
        <!-- Botão de Reenviar Código (aparece apenas para método 'email') -->
        <Button
            v-if="authMethod == 'email'"
            @click="resendTwoFactorLogin"
            :disabled="!resend"
            class="flex gap-1"
        >
          <p>{{ time > 1 ? $t("resend_code_in") : $t("resend") }}</p>
          <p>{{ time == 0 ? "" : time }}</p>
        </Button>
        <Button @click="goBack" variant="outline">
          <p>{{ $t("back") }}</p>
        </Button>
      </div>
    </div>

    <!-- Tela de Recuperação de Conta com Palavras-Chave -->
    <div
        v-else
        class="mx-10 flex w-full flex-col h-screen justify-center space-y-6 sm:w-[400px]"
    >
      <div class="flex flex-col space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ $t("account_recovery") }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ $t("account_recovery_info") }}
        </p>
      </div>
      <Card>
        <CardContent
            class="flex flex-wrap gap-2 p-6 justify-center align-middle h-30"
        >
          <Badge
              v-for="(value, key) in previewCode"
              :key="key"
              class="cursor-pointer"
              @click="selectCode(value)"
          >
            {{ value }}
          </Badge>
        </CardContent>
      </Card>
      <p class="text-sm font-medium text-center text-primary">
        {{ $t("click_keywords_order") }}
      </p>

      <Card>
        <CardContent
            class="flex flex-wrap gap-2 p-6 justify-center align-middle h-30"
        >
          <Badge
              v-for="(value, key) in securityCode"
              :key="key"
              class="cursor-pointer"
              @click="removeCode(value)"
          >
            {{ value }}
          </Badge>
        </CardContent>
      </Card>
      <div class="flex flex-col justify-center align-middle gap-3">
        <Button @click="submitRecoveryCode" :disabled="loadingRecovery">
          <p v-if="!loadingRecovery">{{ $t("confirm") }}</p>
          <LucideSpinner v-else class="mr-2 h-4 w-4 animate-spin" />
        </Button>
        <Button @click="recoveryScreen = !recoveryScreen" variant="outline">
          <p>{{ $t("back") }}</p>
        </Button>
      </div>

      <!-- Dialog de Sucesso na Recuperação -->
      <Dialog :open="isDialog">
        <DialogContent>
          <DialogHeader>
            {{ $t("two_factor_disabled") }}
          </DialogHeader>
          <DialogDescription>
            {{ $t("two_factor_disabled_success") }}
          </DialogDescription>
          <DialogDescription>
            {{ $t("redirect_to_login") }}
          </DialogDescription>
          <DialogFooter>
            <Button @click="handleRecoverySuccess">
              <p>{{ $t("continue") }}</p>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Auth from '@/services/auth';
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast/use-toast";
import i18n from "@/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Pin from "@/components/custom/CustomPinInput.vue";
import {useColorMode} from "@vueuse/core";
import {useWorkspaceStore} from "@/stores/workspace";

const { toast } = useToast();
const router = useRouter();
const authStore = useAuthStore();
const userId = computed(() => authStore.twoFactorData.userId);
const authMethod = computed(() => authStore.twoFactorData.authMethod);
const workspaceStore = useWorkspaceStore();
const loading = ref(false);
const loadingRecovery = ref(false);
const recoveryScreen = ref(true);
const time = ref(0);
const resend = ref(false);
const isDialog = ref(false);
const previewCode = ref<Array<string>>([]);
const securityCode = ref<Array<string>>([]);
const mode = useColorMode()

/**
 * Navega de volta para a tela anterior (login).
 */
function goBack() {
  router.back();
}

/**
 * Lida com o sucesso da recuperação, limpando os dados e navegando para o login.
 */
function handleRecoverySuccess() {
  isDialog.value = false;
  authStore.clearTwoFactorData();
  router.push("/login");
}

/**
 * Realiza o login utilizando autenticação de dois fatores.
 *
 * @param {Array<string>} code - O código de autenticação de dois fatores inserido pelo usuário.
 *
 * - Verifica se o código possui pelo menos 6 caracteres.
 * - Exibe uma mensagem de erro caso o código seja inválido.
 * - Envia o código para o servidor para validação.
 * - Em caso de sucesso, armazena os dados do usuário e redireciona para a página inicial.
 * - Em caso de falha, exibe uma mensagem de erro no console.
 */
const twoFactorLogin = async (code: Array<string>) => {
  if (code.length < 6) {
    toast({
      title: i18n.global.t("warning"), description: i18n.global.t("error_not_code"),
      duration: 3000, variant: "destructive",
    });
    return;
  }
  loading.value = true;
  try {
    const { data } = await Auth.twoFactor({id:userId.value,two_factor_code:code.join("")});

    const tokenAuth = data ? data.token : null;
    const userAuth = data ? data.user : null;

    if (tokenAuth && userAuth) {
      authStore.setUserData(userAuth, tokenAuth);
      authStore.clearTwoFactorData();
      await workspaceStore.loadInitialData(
          userAuth?.preferences,
          userAuth?.group_projects
      );
      router.push("/");
    } else {
      toast({ title: "Erro", description: "Resposta inesperada do servidor.", variant: "destructive" });
    }
  } catch (error) {
    console.error("Erro ao fazer login com dois fatores:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * Reenvia o código de dois fatores.
 */
const resendTwoFactorLogin = async () => {
  resend.value = false;
  try {
    const data = await Auth.getResendTwoFactor(userId.value);
    time.value = 60;
    startResendTimer();
    toast({
      title: i18n.global.t("success"),
      description: data.message,
      duration: 3000,
    });
  } catch (error) {
    console.error("Erro ao reenviar o código:", error);
  }
};

/**
 * Busca os códigos de recuperação para iniciar o processo.
 */
const getRecoveryCode = async () => {
  try {
    const data = await Auth.getValidateRecoveryCode(userId.value);
    previewCode.value = data.data;
    recoveryScreen.value = false;
  } catch (error) {
    console.error("Erro ao buscar código de recuperação:", error);
  }
};

/**
 * Submete o código de recuperação para desativar o 2FA.
 */
const submitRecoveryCode = async () => {
  if (securityCode.value.length < 10) {
    toast({
      title: i18n.global.t("warning"), description: i18n.global.t("error_not_code"),
      duration: 3000, variant: "destructive",
    });
    return;
  }



  try {
    loadingRecovery.value = true;
    await Auth.validateRecoveryCode({id:userId.value,recovery_code:securityCode.value.join("-")});
    isDialog.value = true;
  } catch (error) {
    console.error("Erro ao validar código de recuperação:", error);
  } finally {
    loadingRecovery.value = false;
  }
};

/**
 * Adiciona um código à lista de códigos de segurança, caso ele ainda não esteja presente.
 *
 * @param {string} value - O código a ser adicionado.
 */
function selectCode(value: string) {
  if (securityCode.value.includes(value)) return;
  securityCode.value.push(value);
}

/**
 * Remove um código da lista de códigos de segurança.
 *
 * @param {string} value - O código a ser removido.
 */
function removeCode(value: string) {
  securityCode.value = securityCode.value.filter((v) => v !== value);
}

/**
 * Inicia um temporizador para habilitar o reenvio do código de autenticação após 60 segundos.
 *
 * - Define `resend` como `false` para desativar o botão de reenvio.
 * - Decrementa o valor de `time` a cada segundo.
 * - Quando o tempo chega a 0, o temporizador é limpo e o botão de reenvio é reativado.
 */
function startResendTimer() {
  resend.value = false;
  const intervalId = setInterval(() => {
    time.value--;
    if (time.value < 1) {
      clearInterval(intervalId);
      resend.value = true;
      time.value = 0;
    }
  }, 1000);
}

onMounted(() => {
  if (!userId.value) {
    console.error("Dados de 2FA não encontrados. Redirecionando para o login.");
    router.push('/login');
    return;
  }

  if (authMethod.value === 'email') {
    time.value = 60;
    startResendTimer();
  }
});
</script>

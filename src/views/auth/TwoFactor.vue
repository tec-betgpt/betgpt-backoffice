<template>
  <div
      class="flex justify-center items-center align-middle min-h-screen lg:w-1/2 w-full"
  >
    <!-- Tela de Inserção de Código PIN -->
    <div
        v-if="recoveryScreen"
        class="mx-10 flex w-full flex-col justify-center space-y-6 sm:w-[350px]"
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
        class="mx-10 flex w-full flex-col justify-center space-y-6 sm:w-[400px]"
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
import { useAuthStore } from "@/stores/auth"; // Assumindo que você tem uma store Pinia
import Auth from '@/services/auth';
import { cn } from "@/lib/utils";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast/use-toast";
import i18n from "@/i18n";

// Importe os componentes de UI que você utiliza
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Pin from "@/components/custom/CustomPinInput.vue";

const { toast } = useToast();
const router = useRouter();
const authStore = useAuthStore();

// Obtenha os dados da store.
// A tela de login deve salvar esses dados na store antes de navegar para esta rota.
const form = computed(() => authStore.twoFactorData.form);
const userId = computed(() => authStore.twoFactorData.userId);
const authMethod = computed(() => authStore.twoFactorData.authMethod);


// Variáveis de estado do componente
const loading = ref(false);
const loadingRecovery = ref(false);
const recoveryScreen = ref(true);
const time = ref(0);
const resend = ref(false);
const isDialog = ref(false);
const previewCode = ref<Array<string>>([]);
const securityCode = ref<Array<string>>([]);

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
  authStore.clearTwoFactorData(); // Limpa os dados temporários da store
  router.push("/login");
}

/**
 * Submete o código PIN para o login e, em caso de sucesso, lida com a sessão do usuário.
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
    const localForm = { ...form.value };
    localForm.two_factor_code = code.join("");
    const { data } = await Auth.getLoginTwoFactor(localForm);

    // Lógica de sucesso do login
    const tokenAuth = data ? data.token : null;
    const userAuth = data ? data.user : null;

    if (tokenAuth && userAuth) {
      authStore.setUserData(userAuth, tokenAuth);
      authStore.clearTwoFactorData(); // Limpa os dados temporários
      router.push("/"); // Redireciona para a página principal
    } else {
      // Tratar caso de erro inesperado, se necessário
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
    const data = await Auth.getTwoFactor(userId.value);
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

  const localForm = { ...form.value };
  localForm.recovery_code = securityCode.value.join("-");

  try {
    loadingRecovery.value = true;
    await Auth.validateRecoveryCode(localForm);
    isDialog.value = true;
  } catch (error) {
    console.error("Erro ao validar código de recuperação:", error);
  } finally {
    loadingRecovery.value = false;
  }
};

function selectCode(value: string) {
  if (securityCode.value.includes(value)) return;
  securityCode.value.push(value);
}

function removeCode(value: string) {
  securityCode.value = securityCode.value.filter((v) => v !== value);
}

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
  // Verifica se os dados necessários existem, caso contrário, volta ao login.
  if (!userId.value || !form.value) {
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

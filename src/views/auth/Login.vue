<template>
  <div
      class="relative flex flex-col items-center lg:max-w-none lg:flex-row lg:px-0 min-h-screen"
  >
    <!--<router-link
      :to="'/register'"
      :class="
        cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute right-4 top-4 md:right-8 md:top-8'
        )
      "
    >
      {{ $t("signup") }}
    </router-link>-->
    <div
        class="relative min-h-screen flex-col bg-muted text-white dark:border-r lg:flex hidden overflow-hidden transition-all duration-1000"
        :class="{ 'w-0 p-0': loading, ' p-10 w-1/2': !loading }"
        ref="animatedDiv"
    >
      <div class="absolute inset-0 bg-zinc-900" />
      <div
          :class="{ 'opacity-0': loading, 'opacity-100	': !loading }"
          class="relative z-20 flex items-center text-lg font-medium"
      >
        <img src="/logo-elevate-white.png" class="mr-2 w-28" />
      </div>
      <div
          :class="{ 'opacity-0': loading, 'opacity-100	': !loading }"
          class="relative z-20 mt-auto"
      >
        <blockquote class="space-y-2">
          <p class="text-lg">{{ $t("slogan") }}</p>
        </blockquote>
      </div>
    </div>

    <div
        v-if="!ScreenTwoFactor && !loading"
        class="w-full flex px-10 justify-center items-center align-middle min-h-screen lg:w-1/2"
    >
      <div class="flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div class="sm:hidden">
          <img
              v-if="mode == 'light'"
              src="/logo-elevate-black.png"
              class="w-64 mx-auto mb-5"
              alt="Logo Mobile"
          />
          <img
              v-else
              src="/logo-elevate-white.png"
              class="w-64 mx-auto mb-5"
              alt="Logo Mobile"
          />
        </div>

        <div class="flex flex-col space-y-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ $t("login_your_account") }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ $t("login_info1") }}
          </p>
        </div>
        <div :class="cn('grid gap-6')">
          <form @submit.prevent="login">
            <div class="grid gap-2">
              <div class="grid gap-1 mb-2">
                <Label class="sr-only" for="email"> Email </Label>
                <Input
                    id="email"
                    placeholder="email@betgpt.com.br"
                    type="email"
                    autocomplete="email"
                    v-model="form.email"
                    :disabled="loading"
                />
              </div>
              <div class="grid gap-1">
                <Label class="sr-only" for="password"> Password </Label>
                <Input
                    id="password"
                    placeholder="******"
                    autocomplete="current-password"
                    required
                    type="password"
                    v-model="form.password"
                    :disabled="loading"
                />
              </div>
              <div class="text-right mb-3">
                <router-link class="text-sm" :to="'/recover'">
                  {{ $t("forget_password") }}
                </router-link>
              </div>

              <Button :disabled="loading" class="" type="submit">
                <LucideSpinner
                    v-if="loading"
                    class="mr-2 h-4 w-4 animate-spin"
                />
                {{ $t("enter") }}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div
        v-else-if="loading"
        class="items-center justify-center align-middle flex min-h-screen mx-10 sm:w-full"
    >
      <div class="flex flex-col justify-center items-center flex-1">
        <DotLottieVue
            v-if="useColorMode().value == 'dark'"
            style="height: 300px; width: 300px"
            autoplay
            loop
            src="/animation_logo_black.lottie"
        />
        <DotLottieVue
            v-else
            style="height: 300px; width: 300px"
            autoplay
            loop
            src="/animation_logo_white.lottie"
        />

        <div
            :class="{
            'opacity-0': !message.message,
            'opacity-100	': message.message,
          }"
            class="flex flex-col gap-2 sm:max-w-[440px] w-6/7 transition-opacity duration-1000"
        >
          <div class="flex items-start justify-center">
            <Quote :size="20" :stroke-width="1.75" absoluteStrokeWidth />
            <p class="sm:text-lg text-sm font-sans text-center">
              {{ message.message }}
            </p>
          </div>
          <p class="text-left font-serif text-xs sm:text-sm opacity-70">
            {{ message.signature }}
          </p>
        </div>
      </div>
    </div>

    <div
        v-else
        class="flex justify-center items-center align-middle min-h-screen lg:w-1/2 w-full"
    >
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
          <Button
              v-if="id[1] == 'email'"
              @click="resendTwoFactorLogin"
              :disabled="!resend"
              class="flex gap-1"
          >
            <p>{{ time > 1 ? $t("resend_code_in") : $t("resend") }}</p>
            <p>{{ time == 0 ? "" : time }}</p>
          </Button>
          <Button @click="back" variant="outline">
            <p>{{ $t("back") }}</p>
          </Button>
        </div>
      </div>

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
          <Button @click="recoveryCode" :disabled="loadingRecovery">
            <p v-if="!loadingRecovery">{{ $t("confirm") }}</p>
            <LucideSpinner v-else class="mr-2 h-4 w-4 animate-spin" />
          </Button>
          <Button @click="recoveryScreen = !recoveryScreen" variant="outline">
            <p>{{ $t("back") }}</p>
          </Button>
        </div>
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
              <Button @click="ScreenTwoFactor = false">
                <p v-if="!loadingRecovery">{{ $t("continue") }}</p>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Auth from '@/services/auth';
import api from "@/services/base";
import { cn } from "@/lib/utils";
import { Loader2 as LucideSpinner, Quote } from "lucide-vue-next";
import Pin from "@/components/custom/CustomPinInput.vue";
import axios from "axios";
import { useToast } from "@/components/ui/toast/use-toast";
const { toast } = useToast();
import i18n from "@/i18n";
import { useColorMode } from "@vueuse/core";
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";

const mode = useColorMode();

import { useConfigStore } from "@/stores/config";
import { useWorkspaceStore } from "@/stores/workspace";

const workspaceStore = useWorkspaceStore();

const isDialog = ref(false);
const previewCode = ref<Array<string>>([]);
const securityCode = ref<Array<string>>([]);
const recoveryScreen = ref(true);
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const loadingRecovery = ref(false);
const time = ref(0);
const ScreenTwoFactor = ref(false);
const id = ref([]);
const resend = ref(false);
const form = ref({
  email: "",
  password: "",
  two_factor_code: "",
  recovery_code: "",
})

function selectCode(value: string) {
  if (securityCode.value.filter((v: string) => v == value).length > 0) {
    return;
  }
  securityCode.value.push(value);
}

function removeCode(value: string) {
  securityCode.value = securityCode.value.filter((v: string) => v !== value);
}

function timeTwoFactor() {
  resend.value = false;
  const intervalId = setInterval(() => {
    time.value--;
    if (time.value < 1) {
      clearInterval(intervalId); // Use o identificador aqui
      resend.value = true;
      time.value = 0;
    }
  }, 1000);
}

function back() {
  ScreenTwoFactor.value = false;
}

const handleLoginResponse = async ({ data }: any) => {
  const tokenAuth = data ? data.token : null;
  const userAuth = data ? data.user : null;

  if (tokenAuth && userAuth) {
    authStore.setUserData(userAuth, tokenAuth);
    router.push("/");

    // Vamos fazer login no sistema de IA
    if (import.meta.env.VITE_PUBLIC_IA_URL) {
      axios
          .post(`${import.meta.env.VITE_PUBLIC_IA_URL}/auth/login`, {
            email: userAuth.email,
            password: form.value.password,
          })
          .then((response) => {
            if (response.data.token) {
              localStorage.setItem("token", response.data.token);
            }
          });
    }

    await workspaceStore.loadInitialData(
        userAuth?.preferences,
        userAuth?.group_projects
    );
  } else {
    if (data[1]) {
      id.value = data;
      ScreenTwoFactor.value = true;
      if (id.value[1] == "email") {
        time.value = 60;
        timeTwoFactor();
      }
    }
  }
};

const login = async () => {
  loading.value = true;

  try {
    const data = await Auth.login(form.value)

    await delay(2000);
    handleLoginResponse(data);
  } catch (error) {
    console.error("Erro ao fazer login:", error);
  } finally {
    loading.value = false;
  }
};
const twoFactorLogin = async (code: Array<string>) => {
  if (code.length < 6) {
    toast({
      title: i18n.global.t("warning"),
      description: i18n.global.t("error_not_code"),
      duration: 3000,
      variant: "destructive",
    });
    return;
  }
  loading.value = true;
  try {
    form.value.two_factor_code = "";
    form.value.two_factor_code = code.join("");
    const data = await Auth.twoFactor(form.value)

    handleLoginResponse(data);
  } catch (error) {
    console.error("Erro ao fazer login com dois fatores:", error);
  } finally {
    loading.value = false;
  }
};
const resendTwoFactorLogin = async () => {
  resend.value = false;
  try {
    const data = await Auth.getTwoFactor(id.value[0]);
    time.value = 60;
    timeTwoFactor();
    toast({
      title: i18n.global.t("success"),
      description: data.message,
      duration: 3000,
    });
  } catch (error) {
    console.error("Erro ao reenviar o código:", error);
  }
};

const getRecoveryCode = async () => {
  try {
    const response = await api.get(
        `/auth/validate-recovery-code/${id.value[0]}`
    );
    previewCode.value = response.data.data;
    recoveryScreen.value = false;
  } catch (error) {
    console.error("Erro ao reenviar o código:", error);
  }
};

const recoveryCode = async () => {
  if (securityCode.value.length < 10) {
    toast({
      title: i18n.global.t("warning"),
      description: i18n.global.t("error_not_code"),
      duration: 3000,
      variant: "destructive",
    });
    return;
  }
  form.value.recovery_code = securityCode.value.join("-");

  try {
    loadingRecovery.value = true;
    const data = await Auth.validateRecoveryCode(form.value)
    isDialog.value = true;
  } catch (error) {
    console.error("Erro ao reenviar o código:", error);
  } finally {
    loadingRecovery.value = false;
  }
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const animatedDiv = ref(null);
const configStore = useConfigStore();
const message = computed(() => configStore.message);

onMounted(() => {});
</script>

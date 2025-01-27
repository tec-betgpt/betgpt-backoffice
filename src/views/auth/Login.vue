<template>
  <div
    class=" relative flex flex-col items-center   lg:max-w-none lg:flex-row lg:px-0 min-h-screen"
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

        class="relative min-h-screen flex-col bg-muted  text-white dark:border-r lg:flex hidden overflow-hidden transition-all duration-1000"
        :class="{ 'w-0 p-0': loading, ' p-10 w-1/2': !loading }"
        ref="animatedDiv"
    >
      <div class="absolute inset-0 bg-zinc-900" />
      <div
          :class="{ 'opacity-0': loading, 'opacity-100	': !loading }"
          class="relative z-20 flex items-center text-lg font-medium">
        <img src="/logo-elevate-white.png" class="mr-2 w-28" />
      </div>
      <div
          :class="{ 'opacity-0': loading, 'opacity-100	': !loading }"
          class="relative z-20 mt-auto" >
        <blockquote class="space-y-2">
          <p class="text-lg">{{ $t("slogan") }}</p>
        </blockquote>
      </div>
    </div>

    <div v-if="!ScreenTwoFactor && !loading" class="  w-full flex px-10 justify-center items-center align-middle min-h-screen lg:w-1/2">
      <div
        class=" flex w-full flex-col justify-center space-y-6 sm:w-[350px]  "
      >
        <div class="sm:hidden">
          <img v-if="mode =='light'" src="/logo-elevate-black.png" class="w-64 mx-auto mb-5" alt="Logo Mobile" />
          <img v-else src="/logo-elevate-white.png" class="w-64 mx-auto mb-5" alt="Logo Mobile" />

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
          <form @submit.prevent="login" @keydown="form.onKeydown($event)">
            <div class="grid gap-2">
              <div class="grid gap-1 mb-2">
                <Label class="sr-only" for="email"> Email </Label>
                <Input
                  id="email"
                  placeholder="email@betgpt.com.br"
                  type="email"
                  auto-capitalize="none"
                  auto-complete="email"
                  auto-correct="off"
                  v-model="form.email"
                  :class="{
                    'is-invalid': form.errors.has('email'),
                  }"
                  :disabled="loading"
                />
                <p
                  role="alert"
                  v-if="form.errors.get('email')"
                  class="text-sm font-medium text-destructive"
                >
                  {{ form.errors.get("email") }}
                </p>
              </div>
              <div class="grid gap-1">
                <Label class="sr-only" for="password"> Password </Label>
                <Input
                  id="password"
                  placeholder="******"
                  type="password"
                  v-model="form.password"
                  :class="{
                    'is-invalid': form.errors.has('password'),
                  }"
                  :disabled="loading"
                />
                <p
                  role="alert"
                  v-if="form.errors.get('password')"
                  class="text-sm font-medium text-destructive"
                >
                  {{ form.errors.get("password") }}
                </p>
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

      <div   v-else-if="loading" class="items-center justify-center align-middle  flex min-h-screen mx-10 sm:w-full">

          <div class="flex flex-col justify-center items-center flex-1">
            <video class="w-[300px] h-fit"    loop muted autoplay >
              <source v-if="mode =='light'" src="/animation.mp4" type="video/mp4"/>
              <source v-else src="/elevate_preta.mp4" type="video/mp4"/>
            </video>
            <div
                :class="{ 'opacity-0': !message.message, 'opacity-100	': message.message }"
                class="flex flex-col gap-3 transition-opacity duration-1000 ">
              <div  class="flex gap-1">
                <Quote :size="20" :stroke-width="1.75" absoluteStrokeWidth />
                <p class="max-w-[440px]">
                  {{ message.message }}
                </p>
              </div>
              <p class="text-left font-serif text-gray-700">{{ message.signature }}</p>
            </div>
          </div>


      </div>

    <div v-else class="flex justify-center items-center align-middle min-h-screen lg:w-1/2 w-full">
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
import {onBeforeMount, onMounted, ref} from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";
import Form from "vform";
import { cn } from "@/lib/utils";
import {Loader2 as LucideSpinner, Quote} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Pin from "@/components/custom/CustomPinInput.vue";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast/use-toast";
const { toast } = useToast();
import i18n from "@/i18n";
import CustomLoading from "@/components/custom/CustomLoading.vue";
import {useColorMode} from "@vueuse/core";
Form.axios = api;
const mode = useColorMode()

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
const form = ref(
  new Form({
    email: "",
    password: "",
    two_factor_code: "",
    recovery_code: "",
  })
);

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
const handleLoginResponse = (response) => {
  const tokenAuth = response.data.data ? response.data.data.token : null;
  const userAuth = response.data.data ? response.data.data.user : null;

  if (tokenAuth && userAuth) {
    authStore.setUserData(userAuth, tokenAuth);
    router.push("/");
  } else {
    if (response.data.data[1]) {
      id.value = response.data.data;
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
    const response = await form.value.post(
      "/auth/login",
      {},
      { withCredentials: true }
    );

    handleLoginResponse(response);
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
    const response = await form.value.post(
      "/auth/login/two-factor",
      {},
      { withCredentials: true }
    );

    handleLoginResponse(response);
  } catch (error) {
    console.error("Erro ao fazer login com dois fatores:", error);
  } finally {
    loading.value = false;
  }
};
const resendTwoFactorLogin = async () => {
  resend.value = false;
  try {
    const response = await api.get(`/auth/login/two-factor/${id.value[0]}`);
    time.value = 60;
    timeTwoFactor();
    toast({
      title: i18n.global.t("success"),
      description: response.data.message,
      duration: 3000,
    });
  } catch (error) {
    console.error("Erro ao reenviar o código:", error);
  } finally {
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
    const response = await form.value.post(`/auth/validate-recovery-code`);
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
const message = ref({
  id: "",
  message: "",
  signature: ""
})

async function getMessage() {
  const response = await api.get('/message-loading')
  message.value = response.data.data
}

onMounted(()=>{
  getMessage()
})

</script>

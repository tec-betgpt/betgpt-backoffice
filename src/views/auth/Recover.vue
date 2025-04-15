<template>
  <div
    class="container relative h-[800px] flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 min-h-screen"
  >
    <a
      href="#"
      :class="
        cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute right-4 top-4 md:right-8 md:top-8'
        )
      "
      @click.prevent="goBack"
    >
      {{ $t("back") }}
    </a>
    <div
      class="relative h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex hidden lg:block"
    >
      <div class="absolute inset-0 bg-zinc-900" />
      <div class="relative z-20 flex items-center text-lg font-medium">
        <img src="/logo-elevate-square-white.png" class="mr-2 w-28" />
      </div>
      <div class="relative z-20 mt-auto">
        <blockquote class="space-y-2">
          <p class="text-lg">{{ $t("slogan") }}</p>
        </blockquote>
      </div>
    </div>
    <div class="lg:p-8">
      <div
        class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]"
      >
        <template v-if="step === 1">
          <div class="flex flex-col space-y-2 text-center">
            <h1 class="text-2xl font-semibold tracking-tight">
              {{ $t("recover_password") }}
            </h1>
            <p class="text-sm text-muted-foreground">
              {{ $t("slogan") }}
            </p>
          </div>
          <div :class="cn('grid gap-6')">
            <form @submit.prevent="recover">
              <div class="grid gap-2">
                <div class="grid gap-1 mb-2">
                  <Label class="sr-only" for="email"> {{ $t("email") }} </Label>
                  <Input
                    id="email"
                    placeholder="email@betgpt.com.br"
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
          </div>
        </template>

        <template v-if="step === 2">
          <div class="flex flex-col space-y-2 text-center">
            <h1 class="text-2xl font-semibold tracking-tight">
              {{ $t("sended_email") }}
            </h1>
            <p class="text-sm text-muted-foreground">
              {{ $t("insert_code_to_your_email") }}
            </p>
          </div>
          <div :class="cn('grid gap-6')">
            <form @submit.prevent="nextStep">
              <div class="grid gap-2">
                <div class="grid gap-1 mb-2">
                  <Label class="sr-only" for="token">
                    {{ $t("verification_code") }}
                  </Label>
                  <Input
                    id="token"
                    placeholder="Token recebido no e-mail"
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
          <div :class="cn('grid gap-6')">
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/base";
import Auth from '@/services/auth'
import Recover from '@/services/recover'
import Tokens from '@/services/tokens'
import { buttonVariants } from "@/components/ui/button";
import Swal from "sweetalert2";
import Form from "vform";
Form.axios = api;

import { cn } from "@/lib/utils";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
const router = useRouter();
const authStore = useAuthStore();

const step = ref(1);
const loading = ref(false);
const token = ref("");

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

const setStep = (value) => {
  step.value = value;
};

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
    })

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

const recover = async () => {
  loading.value = true;
  try {
    await Tokens.send({
      key: formStep1.value.key,
      action: formStep1.value.action,
      type: formStep1.value.type,
    })
    setStep(2);
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  if (step.value === 1) {
    router.push("/login");
  } else {
    setStep(1);
    formStep1.value.reset();
    formStep3.value.token = "";
    loading.value = false;
  }
};

const confirmNewPassword = async () => {
  loading.value = true;
  try {
    await Recover.finish({
      email: formStep1.value.key,
      token: token.value,
    })

    const { data } = await Auth.login({
      email: formStep1.value.key,
      password: formStep3.value.password,
    })

    const tokenAuth = data.token;
    const userAuth = data.user;

    if (tokenAuth && userAuth) {
      authStore.setUserData(userAuth, tokenAuth);
      router.push("/");
    } else {
      router.push("/login");
    }
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
};
</script>

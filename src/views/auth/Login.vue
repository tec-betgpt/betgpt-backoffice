<template>
  <div
    class="container relative h-[800px] flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 min-h-screen"
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

              <Button :disabled="loading" type="submit">
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
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";
import Form from "vform";
Form.axios = api;

import { cn } from "@/lib/utils";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);

const form = ref(
  new Form({
    email: "",
    password: "",
  })
);

const login = async () => {
  loading.value = true;
  try {
    const response = await form.value.post(
      "/auth/login",
      {},
      { withCredentials: true }
    );

    const tokenAuth = response.data.data.token;
    const userAuth = response.data.data.user;

    if (tokenAuth && userAuth) {
      authStore.setUserData(userAuth, tokenAuth);
      router.push("/");
    } else {
      console.error(
        "Token ou usuário não encontrados no response:",
        response.data
      );
    }
  } catch (error) {
    console.error("Erro ao fazer login:", error);
  } finally {
    loading.value = false;
  }
};
</script>

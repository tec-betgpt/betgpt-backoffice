<template>
  <div class="grid xl:grid-cols-2 grid-cols-1 w-screen">
    <div class="h-screen w-full flex-col flex p-6 items-center align-middle relative">
      <div class="w-full h-16 absolute z-10">
        <img
          :src="
            mode == 'light'
              ? '/logo-elevate-square-black.png'
              : '/logo-elevate-square-white.png'
          "
          class="h-16 ml-6"
          alt="Logo Elevate"
        />
      </div>

      <div
        class="h-full sm:p-0 w-full flex flex-col justify-center align-middle items-center"
      >
        <div class="flex flex-col text-center my-8 space-y-2">
          <h1 class="text-2xl font-semibold font-sans tracking-tight">
            {{ $t("login_your_account") }}
          </h1>
          <p class="text-balance text-sm text-muted-foreground">
            {{ $t("login_info1") }}
          </p>
        </div>
        <div class="w-full sm:w-2/5">
          <form @submit.prevent="login">
            <div class="grid gap-6">
              <div class="grid gap-1">
                <Label class="text-xs font-semibold" for="email">Email</Label>
                <Input
                  id="email"
                  placeholder="email@elevate.com.br"
                  type="email"
                  autocomplete="email"
                  v-model="form.email"
                  :disabled="loading"
                />
              </div>
              <div class="grid gap-1">
                <div class="flex justify-between items-end">
                  <Label class="text-xs font-semibold" for="password"
                    >Senha</Label
                  >
                  <div
                    class="ml-auto text-xs underline-offset-4 hover:underline"
                  >
                    <router-link cmb-3lass="text-xs" :to="'/recover'">
                      {{ $t("forget_password") }}
                    </router-link>
                  </div>
                </div>
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
              <Button :disabled="loading" class="" type="submit">
                <LucideSpinner
                  v-if="loading"
                  class="mr-2 h-4 w-4 animate-spin"
                />
                {{ $t("enter") }}
              </Button>
            </div>
            <div
              style="
                margin-top: 15px;
                font-size: 0.8em;
                text-decoration: underline;
              "
            >
              <center>
                <a
                  href="https://myelevate.ai/politica-de-privacidade/"
                  target="_BLANK"
                  >Política de Privacidade</a
                >
              </center>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="xl:flex xsl:flex-col px-20 hidden h-screen w-full items-center bg-transparent/10 relative">

      <div class="relative w-full max-w-3xl mx-auto overflow-hidden">
        <div
          class="flex transition-transform duration-500 mb-10"
          :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
        >
          <div
            v-for="(slide, index) in slides"
            :key="index"
            class="min-w-full flex flex-col items-center justify-center mb-20"
          >
            <img
              :src="slide.src"
              :alt="slide.alt"
              class="w-full h-auto"
            />

            <h2 class="text-lg font-bold leading-tight">
              {{ slide.title }}
            </h2>
            <h3 class="text-md leading-tight text-center">
              {{ slide.description }}
            </h3>
          </div>
        </div>

        <div class="absolute bottom-10 w-full flex items-center justify-center">
          <Button
            @click="prev"
            variant="outline"
            size="icon"
            class="absolute top-1/2 left-4 -translate-y-1/2"
          >
            <ChevronLeft class="w-4 h-4" />
          </Button>

          <Button
            @click="next"
            variant="outline"
            size="icon"
            class="absolute top-1/2 right-4 -translate-y-1/2"
          >
            <ChevronRight class="w-4 h-4" />
          </Button>

          <div class="bottom-4 translate-x-1/4 flex gap-3">
            <button
              v-for="(_, index) in slides"
              :key="index"
              @click="goTo(index)"
              class="w-3 h-3 rounded-full"
              :class="currentIndex === index ? 'bg-transparent/40' : 'bg-gray-300'"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
}
</style>
<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Auth from "@/services/auth";
import {
  ChevronRight,
  ChevronLeft,
  Loader2 as LucideSpinner } from "lucide-vue-next";
import { useColorMode } from "@vueuse/core";
import { useConfigStore } from "@/stores/config";
import { useWorkspaceStore } from "@/stores/workspace";

const slides = [
  {
    src: "/mockups/device-0.png",
    title: "Retenção que Gera Lealdade",
    description: "Descubra quem fica, por que fica e como manter seus usuários sempre engajados."
  },
  {
    src: "/mockups/device-1.png",
    title: "Aquisição que Impulsiona Crescimento",
    description: "Acompanhe a jornada de novos clientes, saiba de onde eles vêm e transforme visitantes em resultados."
  },
  {
    src: "/mockups/device-2.png",
    title: "Performance sem Gargalos",
    description: "Identifique falhas, otimize processos e mantenha seu negócio operando no máximo desempenho."
  }
]
const currentIndex = ref(0)

function next() {
  currentIndex.value = (currentIndex.value + 1) % slides.length
}

function prev() {
  currentIndex.value =
    (currentIndex.value - 1 + slides.length) % slides.length
}

function goTo(index: number) {
  currentIndex.value = index
}


const workspaceStore = useWorkspaceStore();
const mode = useColorMode();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const form = ref({
  email: "",
  password: "",
});

/**
 * Lida com a resposta do login, armazenando os dados do usuário e redirecionando conforme necessário.
 *
 * @param {Object} param - O objeto contendo os dados da resposta.
 * @param {any} param.data - Os dados retornados pela API de login.
 *
 * - Se o token e os dados do usuário forem válidos, armazena as informações do usuário,
 *   redireciona para a página inicial e realiza uma chamada adicional para autenticação externa, se configurada.
 * - Caso contrário, verifica se há dados para autenticação de dois fatores e redireciona para a página correspondente.
 */
const handleLoginResponse = async ({ data }) => {
  const tokenAuth = data ? data.token : null;
  const userAuth = data ? data.user : null;

  if (tokenAuth && userAuth) {
    authStore.setUserData(userAuth, tokenAuth);
    router.push("/");
    await workspaceStore.loadInitialData(
      userAuth?.preferences,
      userAuth?.group_projects
    );
  } else {
    if (data[1]) {
      authStore.setTwoFactorData(data[0], data[1]);
      router.push("/two-factor");
    }
  }
};

/**
 * Realiza o processo de login, chamando a API e lidando com a resposta.
 *
 * - Define o estado de carregamento como ativo durante a execução.
 * - Em caso de sucesso, delega o tratamento da resposta para `handleLoginResponse`.
 * - Em caso de erro, exibe a mensagem de erro no console.
 * - Garante que o estado de carregamento seja desativado ao final.
 */
const login = async () => {
  loading.value = true;

  try {
    const data = await Auth.login(form.value);
    handleLoginResponse(data);
  } catch (error) {
    console.error("Erro ao fazer login:", error);
  } finally {
    loading.value = false;
  }
};
const configStore = useConfigStore();
const message = computed(() => configStore.message);
</script>

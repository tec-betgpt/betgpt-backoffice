<template>
  <div class="grid xl:grid-cols-2 grid-cols-1 w-screen">
    <div class="  h-screen w-full flex-col flex p-6 items-center align-middle relative">
      <!--Logo-->
      <div class="w-full h-16 absolute z-10">
        <img :src="mode == 'light' ? '/logo-elevate-square-black.png':'/logo-elevate-square-white.png'"
             class=" h-16 ml-6"
             alt="Logo Elevate"/>
      </div>
      <!--Form-->
      <div class="h-full sm:p-0 w-full flex flex-col justify-center align-middle items-center">
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
                <div class="flex justify-between items-end ">
                  <Label class="text-xs font-semibold" for="password">Senha</Label>
                  <div class="ml-auto text-xs underline-offset-4 hover:underline">
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
          </form>
        </div>
      </div>
    </div>

    <div class="xl:flex xsl:flex-col hidden h-screen w-full items-end bg-black relative">
      <video-background
        src="/movies/mpeg/login.mp4"
        poster="/movies/poster/login.jpg"
        style="width: 100%; position:absolute; top: 0; left: 0; height: 100%;"
        :playsinline="true"
        :sources="[
          { src: '/movies/mpeg/login_720p.mp4', res: 1200, autoplay: true, type: 'video/mp4' },
          { src: '/movies/mpeg/login_480p.mp4', res: 800, autoplay: true, type: 'video/mp4' },
          { src: '/movies/mpeg/login_360p.mp4', res: 600, autoplay: true, type: 'video/mp4' },
          { src: '/movies/mpeg/login_240p.mp4', res: 400, autoplay: true, type: 'video/mp4' },
          { src: '/movies/webm/login_720p.webm', res: 1200, autoplay: true, type: 'video/webm' },
          { src: '/movies/webm/login_480p.webm', res: 800, autoplay: true, type: 'video/webm' },
          { src: '/movies/webm/login_360p.webm', res: 600, autoplay: true, type: 'video/webm' },
          { src: '/movies/webm/login_240p.webm', res: 400, autoplay: true, type: 'video/webm' },
        ]"
      />

      <div class="h-full w-full bg-black opacity-80 absolute z-10"></div>

      <div class="p-8 mb-10 pr-24 space-y-4 absolute z-20">
        <p class="text-white font-normal font-sans text-wrap animate-fade-in" style="animation-delay: 0.2s;">{{ message.message }}</p>
        <p class="text-gray-500 font-normal animate-fade-in" style="animation-delay: 0.5s;">{{ message.signature }}</p>
      </div>
    </div>
  </div>
</template>
<style>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px);}
  to { opacity: 1; transform: translateY(0);}
}
.animate-fade-in {
  animation: fade-in 0.8s cubic-bezier(0.4,0,0.2,1) both;
}
</style>
<script setup>
import { ref, computed} from "vue";
import {useRouter} from "vue-router";
import {useAuthStore} from "@/stores/auth";
import Auth from '@/services/auth';
import {Loader2 as LucideSpinner} from "lucide-vue-next";
import axios from "axios";
import {useColorMode} from "@vueuse/core";
import {useConfigStore} from "@/stores/config";
import {useWorkspaceStore} from "@/stores/workspace";
import VideoBackground from 'vue-responsive-video-background-player'

const workspaceStore = useWorkspaceStore();
const mode = useColorMode();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const form = ref({
  email: "",
  password: "",
})


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
const handleLoginResponse = async ({data}) => {
  const tokenAuth = data ? data.token : null;
  const userAuth = data ? data.user : null;

  if (tokenAuth && userAuth) {
    authStore.setUserData(userAuth, tokenAuth);
    router.push("/");

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

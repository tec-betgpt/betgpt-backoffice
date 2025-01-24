<template>
  <div>
    <div class="mb-4">
      <h3 class="text-lg font-medium">Perfil</h3>
      <p class="text-sm text-muted-foreground">
        Aqui estão as informações principais do seu perfil.
      </p>
    </div>
    <Separator class="mb-3" />
    <div class="my-2">
      <Label for="theme">Tema</Label>
      <Select v-model="theme" id="theme">
        <SelectTrigger class="col-span-3">
          <SelectValue placeholder="Selecione um Tema" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Sistema</SelectItem>
          <SelectItem value="dark">Preto</SelectItem>
          <SelectItem value="light">Claro</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <form @submit.prevent="submit" @keydown="form.onKeydown($event)">
      <div class="mb-3">
        <Label for="first_name">Primeiro nome</Label>
        <Input
          type="text"
          id="first_name"
          placeholder="Informe o seu primeiro nome"
          v-model="form.first_name"
          class="mt-1"
        />
        <HasError :form="form" field="first_name" />
      </div>
      <div class="mb-3">
        <Label for="last_name">Sobrenome</Label>
        <Input
          type="text"
          id="last_name"
          placeholder="Informe o seu sobrenome"
          v-model="form.last_name"
          class="mt-1"
        />
        <HasError :form="form" field="last_name" />
      </div>
      <div class="mb-3">
        <Label for="email">E-mail</Label>
        <Input
          type="text"
          id="email"
          placeholder="Informe o seu e-mail"
          v-model="form.email"
          class="mt-1"
          :disabled="emailChangeRequest"
        />
        <HasError :form="form" field="email" />

        <div
          class="flex align-items-center text-sm font-medium mt-2"
          v-if="emailChangeRequest"
        >
          Existe uma solicitação de troca de e-mail, você poderá cancelar a
          solicitação clicando a seguir:
          <Button
            variant="outline"
            @click="cancelEmailChange"
            :disabled="loadingCancelEmailChange"
            class="mt-2"
          >
            <LucideSpinner
              v-if="loadingCancelEmailChange"
              class="mr-2 h-4 w-4 animate-spin"
            />
            Cancelar Solicitação
          </Button>
        </div>
      </div>
      <div class="mb-3">
        <Label for="language_id">Idioma</Label>
        <Select id="language_id" v-model="form.language_id">
          <SelectTrigger class="col-span-3">
            <SelectValue placeholder="Selecione um idioma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="1">Português</SelectItem>
          </SelectContent>
        </Select>
        <HasError :form="form" field="language_id" />
      </div>
      <div class="flex gap-2 justify-start">
        <Button :disabled="loading" type="submit">
          <LucideSpinner v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          Atualizar perfil
        </Button>
      </div>
    </form>




  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";
import Form from "vform";
Form.axios = api;

import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input, HasError } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {useColorMode} from "@vueuse/core";
const theme = ref(localStorage.getItem('theme') || 'auto')
const { toast } = useToast();
const authStore = useAuthStore();
const loading = ref(false);
const loadingCancelEmailChange = ref(false);
const emailChangeRequest = ref(false);

const mode = useColorMode()
const form = ref(
  new Form({
    first_name: "",
    last_name: "",
    email: "",
    language_id: "",
  })
);

watch(theme,()=>{
      setTheme()
})
const setTheme = async ()=>{
  localStorage.setItem('theme', theme.value);
  const mode = useColorMode()
  mode.value = theme.value;
}
const submit = async () => {
  loading.value = true;
  try {
    const response = await form.value.post(
      "/user/configurations/update-profile"
    );

    if (response.data.data.has_change_email) {
      emailChangeRequest.value = true;
      toast({
        title: "Sucesso",
        description:
          "Perfil atualizado e a solicitação de troca de e-mail enviada. Verifique seu e-mail.",
        variant: "success",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso.",
        variant: "success",
      });
    }
  } catch (error) {
    console.error("Erro ao enviar requisição:", error);
  } finally {
    loading.value = false;
  }
};

const fetchEmailChangeRequest = async () => {
  try {
    const response = await api.get("/user/configurations/email-change-request");

    if (response.data.data) {
      emailChangeRequest.value = true;
    }
  } catch {
    emailChangeRequest.value = false;
  }
};

const cancelEmailChange = async () => {
  loadingCancelEmailChange.value = true;
  try {
    await api.delete("/user/configurations/email-change-request");
    loadingCancelEmailChange.value = false;
    emailChangeRequest.value = false;
    form.value.email = authStore.user.email;
    toast({
      title: "Sucesso",
      description: "Solicitação de troca de e-mail cancelada.",
      variant: "success",
    });
  } catch (error) {
    console.error("Erro ao cancelar a solicitação:", error);
  } finally {
    loadingCancelEmailChange.value = false;
  }
};

onMounted(fetchEmailChangeRequest);

watch(
  () => authStore.user,
  (user) => {
    if (user) {
      form.value.first_name = user.first_name || "";
      form.value.last_name = user.last_name || "";
      form.value.email = user.email || "";
      form.value.language_id = user.language_id || 1;

      if (user.email_change_request) {
        emailChangeRequest.value = true;
        form.value.email = user.email_change_request.new_email;
      }
    }
  },
  { immediate: true }
);
</script>

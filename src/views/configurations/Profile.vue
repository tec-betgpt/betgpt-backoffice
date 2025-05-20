<template>
  <div>
    <div class="mb-4">
      <h3 class="text-lg font-medium">Perfil</h3>
      <p class="text-sm text-muted-foreground">
        Aqui estão as informações principais do seu perfil.
      </p>
    </div>
    <Separator class="mb-3" />
    <div class="flex justify-start gap-8 flex-wrap w-full">
      <div class="flex-1">
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
                <SelectItem value="1">Português</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex gap-2 justify-start">
            <Button :disabled="loading" type="submit">
              <LucideSpinner v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              Atualizar perfil
            </Button>
          </div>
        </form>
      </div>
      <div class="flex-1">
        <div class="my-2 flex flex-col items-center justify-center gap-2">
          <div class="mb-4 flex items-center justify-center gap-2">
            <p class="text-lg font-medium">Foto de Perfil</p>
            <Pencil
              :size="20"
              :stroke-width="1.55"
              @click="openSheet"
              class="cursor-pointer"
            />
          </div>
          <div class="mb-4 flex flex-col items-center justify-center gap-2">
            <Avatar size="lg">
              <AvatarImage
                v-if="authStore.user.icon"
                :src="authStore.user?.icon"
              />
              <AvatarFallback>
                {{ authStore.user?.initials }}
              </AvatarFallback>
            </Avatar>
            <div>
              <p>
                {{ authStore.user.name }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Sheet v-model:open="imageSheet" position="right" size="lg">
    <SheetContent class="flex flex-col gap-6">
      <SheetHeader>
        <SheetTitle> Atualizar Imagem de Perfil </SheetTitle>
      </SheetHeader>
      <form @submit.prevent="updateImage" class="space-y-4">
        <div>
          <Label for="profileImage">Imagem de Perfil</Label>
          <Input
            type="file"
            id="profileImage"
            ref="fileInput"
            @change="handleFileChange"
            accept="image/*"
            class="mt-2"
          />
        </div>
        <SheetFooter>
          <Button :disabled="loading || !selectedImagePreview" type="submit">
            <LucideSpinner v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ hasImage ? "Atualizar Imagem" : "Salvar Imagem" }}
          </Button>
        </SheetFooter>
      </form>
      <div
        v-if="selectedImagePreview"
        class="mt-4 text-sm flex items-center justify-center gap-4 flex-col"
      >
        <p>Pré-visualização:</p>
        <Avatar size="lg">
          <AvatarImage :src="selectedImagePreview" />>
        </Avatar>
      </div>
      <div v-if="error" class="text-red-500 mt-2">
        {{ error }}
      </div>
    </SheetContent>
  </Sheet>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import Users from '@/services/users'
import { useToast } from "@/components/ui/toast/use-toast";
import { useAuthStore } from "@/stores/auth";

import { Loader2 as LucideSpinner, Pencil } from "lucide-vue-next";
import { useColorMode } from "@vueuse/core";
const theme = ref(localStorage.getItem("theme") || "auto");
const { toast } = useToast();
const authStore = useAuthStore();
const loading = ref(false);
const loadingCancelEmailChange = ref(false);
const emailChangeRequest = ref(false);

const form = ref({
  first_name: "",
  last_name: "",
  email: "",
  language_id: "",
  image: "",
})

watch(theme, () => {
  setTheme();
});

const setTheme = async () => {
  localStorage.setItem("theme", theme.value);
  const mode = useColorMode();
  mode.value = theme.value;
};

const submit = async () => {
  loading.value = true;
  try {
    const { data } = await Users.updateProfile(form.value)

    if (data.has_change_email) {
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
    const { data } = await Users.emailChangeRequest()

    if (data) {
      emailChangeRequest.value = true;
    }
  } catch {
    emailChangeRequest.value = false;
  }
};

const cancelEmailChange = async () => {
  loadingCancelEmailChange.value = true;
  try {
    await Users.emailChangeRequestCancel()

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

const openSheet = () => {
  form.value.image = "";
  selectedImagePreview.value = null;
  imageSheet.value = true;
};

const imageSheet = ref(false);
const fileInput = ref();
const selectedImagePreview = ref<string | null>(null);
const error = ref();
const hasImage = computed(() =>
  authStore.user?.media ? !!authStore.user.media[0]?.original_url : false
);
const handleFileChange = (event) => {
  const file = event.target.files[0];

  if (!file) return;
  if (file.size > 4196 * 1024) {
    error.value = "A imagem deve ter no máximo 4MB.";
    return;
  }

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    if (img.width > 4096 || img.height > 2160) {
      error.value = "A imagem deve ter no máximo 4096 x 2160 pixels.";
      selectedImagePreview.value = "";
      form.value.image = "";
      URL.revokeObjectURL(img.src);
      return;
    }
    error.value = "";
    form.value.image = file;
    selectedImagePreview.value = img.src;
  };

  img.onerror = () => {
    error.value = "Erro ao carregar a imagem.";
  };
};

const updateImage = async () => {
  if (!form.value.image) {
    error.value = "Nenhum arquivo selecionado.";
    console.log(form.value);
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    await Users.updatePhoto({ image: form.value.image });

    toast({
      title: "Sucesso",
      description: hasImage
        ? "Imagem atualizada com sucesso."
        : "Imagem adicionada com sucesso.",
    });

    // Refresh user data or update authStore.avatar...
    authStore.fetchUser();
    selectedImagePreview.value = null;
    imageSheet.value = false;
  } catch (err) {
    error.value = "Falha ao atualizar a imagem.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>

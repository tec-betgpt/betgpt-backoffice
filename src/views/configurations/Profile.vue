<template>
  <div class="space-y-6">
    <SettingsHeader
      title="Perfil"
      description="Seus dados de identificação na plataforma."
    />

    <div class="flex flex-wrap items-center gap-4 rounded-lg border p-4">
      <Avatar size="base">
        <AvatarImage v-if="authStore.user?.icon" :src="authStore.user.icon" />
        <AvatarFallback>{{ authStore.user?.initials }}</AvatarFallback>
      </Avatar>
      <div class="min-w-0 flex-1">
        <p class="truncate font-medium">{{ authStore.user?.name }}</p>
        <p class="truncate text-sm text-muted-foreground">{{ authStore.user?.email }}</p>
      </div>
      <Button type="button" variant="outline" size="sm" @click="openSheet">
        <Camera class="size-4" />
        {{ hasImage ? "Trocar foto" : "Adicionar foto" }}
      </Button>
    </div>

    <form class="rounded-lg border" @submit.prevent="submit">
      <div class="border-b px-4 py-3 sm:px-6">
        <h4 class="font-medium">Dados pessoais</h4>
        <p class="text-sm text-muted-foreground">
          Usados nas faturas e na comunicação com você.
        </p>
      </div>

      <div class="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <div class="space-y-2">
          <Label for="first_name">Nome</Label>
          <Input id="first_name" v-model="form.first_name" placeholder="Seu nome" />
        </div>
        <div class="space-y-2">
          <Label for="last_name">Sobrenome</Label>
          <Input id="last_name" v-model="form.last_name" placeholder="Seu sobrenome" />
        </div>
        <div class="space-y-2">
          <Label for="kind_person">Tipo de pessoa</Label>
          <Select v-model="form.kind_person">
            <SelectTrigger id="kind_person">
              <SelectValue placeholder="Selecione um tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PF">Pessoa física</SelectItem>
              <SelectItem value="PJ">Pessoa jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label for="document_number">{{ form.kind_person === "PJ" ? "CNPJ" : "CPF" }}</Label>
          <Input
            id="document_number"
            v-model="form.document_number"
            :placeholder="form.kind_person === 'PJ' ? 'Digite o CNPJ' : 'Digite o CPF'"
            required
          />
        </div>
        <div class="space-y-2 sm:col-span-2">
          <Label for="email">E-mail</Label>
          <Input
            id="email"
            v-model="form.email"
            placeholder="Seu e-mail"
            :disabled="emailChangeRequest"
          />
          <div
            v-if="emailChangeRequest"
            class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed p-3 text-sm"
          >
            <p class="text-muted-foreground">
              A troca para este e-mail aguarda confirmação no novo endereço.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              :disabled="loadingCancelEmailChange"
              @click="cancelEmailChange"
            >
              <LucideSpinner v-if="loadingCancelEmailChange" class="size-4 animate-spin" />
              Cancelar solicitação
            </Button>
          </div>
        </div>
      </div>

      <div class="flex justify-end border-t px-4 py-3 sm:px-6">
        <Button :disabled="loading" type="submit">
          <LucideSpinner v-if="loading" class="size-4 animate-spin" />
          Salvar alterações
        </Button>
      </div>
    </form>
  </div>

  <Sheet v-model:open="imageSheet">
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
          <AvatarImage :src="selectedImagePreview" />
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
import { toast } from "vue-sonner";
import { useAuthStore } from "@/stores/auth";

import { Loader2 as LucideSpinner, Camera } from "lucide-vue-next";
import SettingsHeader from "@/views/configurations/components/SettingsHeader.vue";

const authStore = useAuthStore();
const loading = ref(false);
const loadingCancelEmailChange = ref(false);
const emailChangeRequest = ref(false);

const form = ref({
  first_name: "",
  last_name: "",
  kind_person: "PF",
  document_number: "",
  email: "",
  language_id: "",
  image: "",
})

const submit = async () => {
  loading.value = true;
  try {
    const { data } = await Users.updateProfile(form.value)

    if (data.has_change_email) {
      emailChangeRequest.value = true;
      toast.success("Sucesso", { description: "Perfil atualizado e a solicitação de troca de e-mail enviada. Verifique seu e-mail." });
    } else {
      toast.success("Sucesso", { description: "Perfil atualizado com sucesso." });
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

    toast.success("Sucesso", { description: "Solicitação de troca de e-mail cancelada." });
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
      form.value.document_number = user.document_number || "";
      form.value.kind_person = user.kind_person || "PF";

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
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    await Users.updatePhoto({ image: form.value.image });

    toast("Sucesso", { description: hasImage
        ? "Imagem atualizada com sucesso."
        : "Imagem adicionada com sucesso." });

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

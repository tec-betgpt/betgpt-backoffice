<template>
  <Button @click="openDialog" class="bg-yellow-300 text-black hover:text-white dark:hover:text-black">
    <Plus />
    Novo Serviço
  </Button>

  <Dialog v-model:open="isDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo Serviço</DialogTitle>
        <DialogDescription>
          Adicione um novo serviço/plano ao portfólio, abaixo você irá definir
          os preços unitários por cada recurso da plataforma.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit">
        <div class="grid gap-4 py-4">
          <div class="gap-4">
            <Label for="name">Nome</Label>
            <Input v-model="form.name" placeholder="Digite aqui" class="mt-2" />
          </div>

          <NumberField
            :model-value="form.price_user_project"
            class="grid grid-cols-2 items-center gap-4 my-2"
            id="price_user_project"
            :step="0.01"
            :default-value="1"
            :format-options="{
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2
            }"
            v-model="form.price_project"
          >
            <Label for="price_user_project" class="mb-2">Preço por Projeto</Label>
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>

          <NumberField
            id="price_user_project"
            class="grid grid-cols-2 items-center gap-4 my-2"
            :step="0.01"
            :default-value="1"
            :format-options="{
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2
            }"
            v-model="form.price_user_project"
          >
            <Label for="price_user_project" class="mb-2">Usuário por Projeto</Label>
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>

          <NumberField
            id="price_ai_token"
            class="grid grid-cols-2 items-center gap-4 my-2"
            :step="0.01"
            :default-value="1"
            :format-options="{
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2
            }"
            v-model="form.price_ai_token"
          >
            <Label for="price_ai_token" class="mb-2">Token/I.A.</Label>
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>

          <NumberField
            id="price_email"
            class="grid grid-cols-2 items-center gap-4 my-2"
            :step="0.01"
            :default-value="1"
            :format-options="{
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2
            }"
            v-model="form.price_email"
          >
            <Label for="price_email" class="mb-2">Preço por E-mail</Label>
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>

          <NumberField
            id="price_sync_google_analytics"
            class="grid grid-cols-2 items-center gap-4 my-2"
            :step="0.01"
            :default-value="1"
            :format-options="{
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2
            }"
            v-model="form.price_sync_google_analytics"
          >
            <Label for="price_sync_google_analytics" class="mb-2">Sincronização Google Analytics</Label>
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>

          <NumberField
            id="price_sms_funnel"
            :step="0.01"
            :min="0"
            class="grid grid-cols-2 items-center gap-4 my-2"
            :default-value="0.01"
            :format-options="{
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2
            }"
            v-model="form.price_sms_funnel"
          >
            <Label for="price_sms_funnel" class="mb-2">Sincronização SMS Funnel®</Label>
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>

          <NumberField
            id="price_percent_by_deposit"
            class="grid grid-cols-2 items-center gap-4 my-2"
            :step="0.01"
            :min="0"
            :default-value="0.05"
            :format-options="{
              minimumFractionDigits: 2
            }"
            v-model="form.price_percent_by_deposit"
          >
            <Label for="price_percent_by_deposit" class="mb-2">Percentual por Depósito (%)</Label>
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>
        <DialogFooter>
          <Button type="submit" :disabled="isLoading">
            {{ isLoading ? "Salvando..." : "Salvar" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {ref, watch} from "vue";
import { Plus } from "lucide-vue-next";
import { useToast} from "@/components/ui/toast";
import Services from "@/services/services";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement, NumberFieldInput
} from "@/components/ui/number-field";
import {Dialog} from "@/components/ui/dialog";

const props = defineProps<{ reload: () => Promise<void> }>();
const { toast } = useToast();

const isLoading = ref(false);
const isDialog = ref(false);
const form = ref({
  name: '',
  is_active: 1,
  price_project: 0,
  price_user_project: 0,
  price_ai_token: 0,
  price_email: 0,
  price_sync_google_analytics: 0,
  price_sms_funnel: 0,
  price_percent_by_deposit: 0.01
});

const onSubmit = async () => {
  isLoading.value = true

  try {
    await Services.store(form.value)
    await props.reload();
    isDialog.value = false;
    toast({
      title: "Sucesso",
      description: "Serviço salvo com sucesso.",
    });
  } catch (error) {
    toast({
      title: "Ops!",
      description: error.response.data.message,
      duration: 3000,
      variant: "destructive",
    });
  }

  isLoading.value = false;
}

const openDialog = async () => {
  form.value = {
    name: '',
    is_active: 1,
    price_user_project: 0,
    price_project: 0,
    price_ai_token: 0,
    price_email: 0,
    price_sync_google_analytics: 0,
    price_sms_funnel: 0,
    price_percent_by_deposit: 0
  }
  isDialog.value = true;
}
</script>

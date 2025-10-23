<template>
  <Button @click="openDialog" class="bg-yellow-300">
    <Plus /> Novo Insight
  </Button>

  <Dialog v-model:open="showModal">
    <DialogContent class="sm:max-w-[425px] p-0 max-h-[90dvh]">
      <DialogHeader class="px-6 pt-6">
        <DialogTitle>
          Novo Insight
        </DialogTitle>
        <DialogDescription>
          Preencha os detalhes para criar um novo insight.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="onSubmit">
        <div class="grid gap-4 py-4">
          <div class="flex-1 px-6">
            <Label for="name">Texto</Label>
            <Input
              id="name"
              v-model="form.message"
              placeholder="Digite o Texto"
              class="mt-2"
              required
            />
          </div>
          <div class="flex-1 px-6">
            <Label for="name">Assinatura</Label>
            <Textarea
              id="name"
              v-model="form.signature"
              placeholder="Digite a Assinatura"
              class="mt-2"
              required
              rows="4"
            />
          </div>
        </div>

        <DialogFooter class="px-6 pb-6 pt-2">
          <Button variant="ghost" @click="cancel" class="mr-2">
            Cancelar
          </Button>

          <Button type="submit" :disabled="isLoading">
            <Spinner v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isLoading ? "Salvando..." : "Salvar" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ref } from "vue";
import Insights from "@/services/insights";
import i18n from "@/i18n";
import { Plus } from "lucide-vue-next";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

const { toast } = useToast();
const props = defineProps<{ reload: () => void }>();

const form = ref({
  message: "",
  signature: "",
})
const showModal = ref(false);
const isLoading = ref(false);

function cancel(e) {
  e.preventDefault();
  showModal.value = false;
  reset();
}

async function onSubmit() {
  isLoading.value = true;

  try {
    const data = await Insights.store(form.value)

    reset();
    toast({
      title: i18n.global.t("success"),
      description: i18n.global.t(data.message),
      duration: 3000,
    });
    props.reload();
  } catch (error) {
    toast({
      title: i18n.global.t("error"),
      description: i18n.global.t(error.response.data.message),
      duration: 3000,
      variant: "destructive",
    });
  }

  isLoading.value = false;
  showModal.value = false;
}

const reset = () => {
  form.value.message = ""
  form.value.signature = ""
}

function openDialog() {
  showModal.value = true;
}
</script>

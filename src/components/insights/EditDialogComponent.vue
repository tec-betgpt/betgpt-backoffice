<template>
  <Button variant="ghost" size="icon" @click="openDialog()">
    <PenLine />
  </Button>

  <Dialog v-model:open="isDialog">
    <DialogContent position="right" size="lg">
      <DialogHeader>
        <DialogTitle>
          Editar Insight
        </DialogTitle>
        <DialogDescription>
          Edite as informações do insight
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit()">
        <div class="grid gap-4 py-4">
          <div class="flex-1">
            <Label for="name">Texto</Label>
            <Textarea
              id="name"
              v-model="form.message"
              placeholder="Digite a Assinatura"
              class="mt-2"
              required
              rows="4"
            />
          </div>
          <div class="flex-1">
            <Label for="name">Assinatura</Label>
            <Input
              id="name"
              v-model="form.signature"
              placeholder="Digite o Texto"
              class="mt-2"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" :disabled="isLoading">
            <Spinner v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isLoading ? "Atualizando..." : "Atualizar" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { PenLine } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import i18n from "@/i18n";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import Insights from "@/services/insights";

const props = defineProps<{
  row: any,
  reload: Function
}>();

const { toast } = useToast();
const isDialog = ref(false);
const isLoading = ref(false);
const form = ref({
  message: "",
  signature: "",
})

const onSubmit = async () => {
  isLoading.value = true;

  try {
    const data = await Insights.update(props.row.id, form.value)

    toast({
      title: i18n.global.t("success"),
      description: i18n.global.t(data.message),
      duration: 3000,
    });

    reset()
    props.reload();
    isDialog.value = false;
  } catch (error) {
    console.error("Erro ao editar mensagem:", error);
    toast({
      title: i18n.global.t("error"),
      description: i18n.global.t(error.response.data.message),
      duration: 3000,
      variant: "destructive",
    });
  }

  isLoading.value = false;
  isDialog.value = false;
}

const reset = () => {
  form.value.message = ""
  form.value.signature = ""
}

const openDialog = () => {
  form.value.id = props.row.id;
  form.value.message = props.row.message;
  form.value.signature = props.row.signature;
  isDialog.value = true;
}
</script>

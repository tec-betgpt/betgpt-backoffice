<template>
  <Button @click="openDialog()" size="icon" variant="ghost" :disabled="isLoading.show">
    <Spinner v-if="isLoading.show" class="h-4 w-4 animate-spin" />
    <PencilLine v-else />
  </Button>

  <Dialog v-model:open="isDialog">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Editar Proteção</DialogTitle>
        <DialogDescription>
          Atualize os dados do registro de proteção.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit">
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="gap-2">
              <Label for="dispatch_type">Tipo de Despacho</Label>
              <Select v-model="form.dispatch_type">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LP_ENTERED">LP_ENTERED</SelectItem>
                  <SelectItem value="LP_EXITED">LP_EXITED</SelectItem>
                  <SelectItem value="LP_UPDATED">LP_UPDATED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="gap-2">
              <Label for="event_type">Tipo de Evento</Label>
              <Select v-model="form.event_type">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forced">Forced</SelectItem>
                  <SelectItem value="exclusion">Exclusion</SelectItem>
                  <SelectItem value="temp_suspension">Temp Suspension</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="gap-2">
            <Label for="channel">Canal</Label>
            <Input v-model="form.channel" placeholder="Canal" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="gap-2">
              <Label for="start_at">Início</Label>
              <Input type="datetime-local" v-model="form.start_at" />
            </div>
            <div class="gap-2">
              <Label for="end_at">Fim</Label>
              <Input type="datetime-local" v-model="form.end_at" />
            </div>
          </div>

          <div class="gap-2">
            <Label for="reason">Motivo</Label>
            <Textarea v-model="form.reason" placeholder="Motivo da proteção" />
          </div>

        </div>
        <DialogFooter>
          <Button type="submit" :disabled="isLoading.onSubmit">
            {{ isLoading.onSubmit ? "Atualizando..." : "Atualizar" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { PencilLine } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast";
import ProtectionLists from "@/services/protectionLists";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

const props = defineProps<{
  row: any,
  reload: () => Promise<void>
}>();
const { toast } = useToast();

const isLoading = ref({
  onSubmit: false,
  show: false
});
const isDialog = ref(false);
const form = ref({
  project_id: null,
  dispatch_type: '',
  event_type: '',
  channel: '',
  start_at: '',
  end_at: '',
  reason: ''
});

const onSubmit = async () => {
  isLoading.value.onSubmit = true

  try {
    await ProtectionLists.update(props.row.id, form.value)
    await props.reload();
    isDialog.value = false;
    toast({
      title: "Sucesso",
      description: "Proteção atualizada com sucesso.",
    });
  } catch (error: any) {
    toast({
      title: "Ops!",
      description: error.response?.data?.message || "Erro ao atualizar.",
      duration: 3000,
      variant: "destructive",
    });
  }

  isLoading.value.onSubmit = false;
}

const show = async () => {
  isLoading.value.show = true

  try {
    const data = await ProtectionLists.show(props.row.id);
    form.value = {
        ...data,
        start_at: data.start_at ? data.start_at.slice(0, 16) : '',
        end_at: data.end_at ? data.end_at.slice(0, 16) : ''
    };
  } catch (e) {
    console.error(e)
    toast({
      title: "Erro",
      description: "Erro ao carregar dados.",
      variant: "destructive",
    });
  }

  isLoading.value.show = false
}

const openDialog = async () => {
  await show()
  isDialog.value = true;
}
</script>

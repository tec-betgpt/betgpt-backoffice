<template>
  <Button
    title="Alterar Serviço"
    size="icon"
    variant="ghost"
    @click="openDialog()"
  >
    <Briefcase />
  </Button>

  <Dialog v-model:open="showModal">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Modificar Serviço</DialogTitle>
        <DialogDescription>
          Altere qual serviço deve estar vinculado a esta conta.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit()">
        <div class="grid grid-cols-4 items-center gap-4 py-4">
          <Label for="name">Serviço</Label>
          <div class="col-span-3">
            <Select v-model="service_id">
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço/plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="row in services" :value="row.id" :key="row.id">
                  {{ row.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="link" @click="cancel">
            Cancelar
          </Button>
          <Button
            type="submit"
            :disabled="isProcessing"
          >
            <LucideSpinner
              v-if="isProcessing"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isProcessing ? "Salvando..." : "Salvar" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { ref, onMounted, defineProps } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Briefcase } from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import Users from '@/services/users'
import Services from '@/services/services'

type Service = {
  id: number
  name: string
}

const props = defineProps<{
  reload: () => void,
  row: any
}>()

const { toast } = useToast();

const isProcessing = ref(false);
const showModal = ref(false);
const service_id = ref();
const services = ref<Service[]>([]);

const openDialog = async () => {
  await fetchServices();
  service_id.value = props.row.service_id;
  showModal.value = true;
}

const fetchServices = async () => {
  try {
    services.value = await Services.list()
  } catch (e) {
    console.error(e)
  }
}

const onSubmit = async () => {
  isProcessing.value = true;

  try {
    const data = await Users.changeService(props.row.id, { service_id: service_id.value });
    await props.reload();
    showModal.value = false;
    toast({
      title: "Sucesso",
      description: "Serviço aplicado com sucesso.",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao modificar a conta.",
      variant: "destructive",
    });
  }

  isProcessing.value = false;
}

const cancel = (e: Event) => {
  e.preventDefault();
  showModal.value = false;
}
</script>


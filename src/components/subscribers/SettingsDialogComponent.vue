<template>
  <Button
    title="Configurações de Cobrança"
    size="icon"
    variant="ghost"
    @click="openDialog()"
  >
    <CalendarIcon />
  </Button>

  <Dialog v-model:open="showModal">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Configurações</DialogTitle>
        <DialogDescription>
          Configurações de cobrança ao usuário responsável
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit()">
        <div class="grid py-4">
          <div class="grid grid-cols-4 items-center gap-4 py-4">
            <Label for="name">Dia de Cobrança</Label>
            <div class="col-span-3">
              <Select v-model="form.day_to_debit">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço/plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="row in 25" :value="row.toString()" :key="row">
                    {{ row }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-4 items-center gap-4 py-4">
            <Label for="name">Próxima Cobrança</Label>
            <div class="col-span-3">
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    @click="(e: Event) => e.preventDefault()"
                    variant="outline"
                    class="text-left font-normal"
                  >
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{ form.debit_in ? $moment(form.debit_in, 'YYYY-MM-DD').format('DD/MM/YYYY') : "Selecionar" }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0">
                  <Calendar v-model="form.debit_in" initial-focus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div class="grid grid-cols-4 items-center gap-4 py-4">
            <Label for="name">Acesso expira em</Label>
            <div class="col-span-3">
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    @click="(e: Event) => e.preventDefault()"
                    variant="outline"
                    class="text-left font-normal"
                  >
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{ form.expires_on ? $moment(form.expires_on, 'YYYY-MM-DD').format('DD/MM/YYYY') : "Selecionar" }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0">
                  <Calendar v-model="form.expires_on" initial-focus />
                </PopoverContent>
              </Popover>
            </div>
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
            {{ isProcessing ? "Aplicando..." : "Aplicar" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { ref, defineProps } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { CalendarIcon } from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import Users from '@/services/users'
import Services from '@/services/services'
import moment from "moment";

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
const form = ref({
  day_to_debit: "1",
  debit_in: "",
  expires_on: ""
});
const services = ref<Service[]>([]);

const openDialog = async () => {
  await fetchServices();
  form.value = {
    ...props.row,
    day_to_debit: String(props.row.day_to_debit)
  }

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
    const data = await Users.updateSignatureService(props.row.id, {
      day_to_debit: form.value.day_to_debit,
      debit_in: moment(form.value.debit_in).format('YYYY-MM-DD'),
      expires_on: moment(form.value.expires_on).format('YYYY-MM-DD'),
    });

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


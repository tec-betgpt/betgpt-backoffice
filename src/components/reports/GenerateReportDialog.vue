<template>
  <div>
    <Button @click="openDialog" class="bg-blue-500 hover:bg-blue-700 text-white">
      <Plus class="mr-2 h-4 w-4" />
      Gerar Relatório
    </Button>

    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerar Novo Relatório</DialogTitle>
          <DialogDescription>
            Configure as opções para o novo relatório.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="grid items-center gap-1.5">
            <Label for="reportName">Nome do Relatório</Label>
            <Input id="reportName" v-model="form.name" placeholder="Opcional" />
          </div>
          <div class="grid items-center gap-1.5">
            <Label for="startDate">Data de Início</Label>
            <DatePicker id="startDate" v-model="form.start_date" />
          </div>
          <div class="grid items-center gap-1.5">
            <Label for="endDate">Data de Fim</Label>
            <DatePicker id="endDate" v-model="form.end_date" />
          </div>
          <div class="grid items-center gap-1.5">
            <Label for="channel_group">Grupo de Canal</Label>
            <Select v-model="form.channel_group" multiple>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um grupo de canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Grupos de Canal</SelectLabel>
                  <SelectItem v-for="group in channelGroups" :key="group.id" :value="group.displayName">
                    {{ group.displayName }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox id="send_email" v-model:checked="form.send_email" />
            <label
              for="send_email"
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enviar por E-mail
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isDialogOpen = false">Cancelar</Button>
          <Button @click="handleGenerate" :disabled="isGenerating">
             <LucideSpinner v-if="isGenerating" class="mr-2 h-4 w-4 animate-spin" />
            {{ isGenerating ? 'Gerando...' : 'Gerar' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, defineEmits, computed, onMounted} from 'vue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import DatePicker from '@/components/custom/DatePicker.vue';
import ReportsService from '@/services/reports';
import { useToast } from '@/components/ui/toast';
import { Plus, Loader2 as LucideSpinner } from 'lucide-vue-next';
import { useWorkspaceStore } from '@/stores/workspace';
import moment from 'moment';
import ConversionDefinitions from "@/services/conversionDefinitions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const emit = defineEmits(['report-generated']);
const { toast } = useToast();
const workspaceStore = useWorkspaceStore();
const channelGroups = ref([]);

const activeProjectId = computed(() => workspaceStore.activeGroupProject?.project_id);

const isDialogOpen = ref(false);
const isGenerating = ref(false);

const form = ref({
  name: '',
  start_date: new Date(),
  end_date: new Date(),
  channel_group: [],
  send_email: false,
});

const openDialog = () => {
  form.value = {
    start_date: new Date(),
    end_date: new Date(),
    channel_group: [],
    send_email: false,
    name: '',
  };
  isDialogOpen.value = true;
  fetchChannelGroups()
};

const handleGenerate = async () => {
  if (!form.value.start_date || !form.value.end_date) {
    toast({
      title: "Erro de Validação",
      description: "As datas de início e fim são obrigatórias.",
      variant: "destructive",
    });
    return;
  }
  
  isGenerating.value = true;
  try {
    const payload = {
      ...form.value,
      project_id: activeProjectId.value,
      start_date: moment(form.value.start_date).format('YYYY-MM-DD'),
      end_date: moment(form.value.end_date).format('YYYY-MM-DD'),
      name: form.value.name, // Adiciona o campo de nome ao payload
    };

    await ReportsService.store(payload);
    toast({
      title: "Sucesso",
      description: "Relatório está sendo processado e logo aparecerá na lista.",
    });
    emit('report-generated');
    isDialogOpen.value = false;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Falha ao gerar o relatório.",
      variant: "destructive",
    });
  } finally {
    isGenerating.value = false;
  }
};
const fetchChannelGroups = async () => {
  try {
    const response = await ConversionDefinitions.channelGroups({ project_id: activeProjectId.value });
    channelGroups.value = response.data;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Falha ao buscar os grupos de canal.",
      variant: "destructive",
    });
  }
};

</script>
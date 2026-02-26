<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Importar Tags</DialogTitle>
        <DialogDescription>
          Faça o upload de um arquivo CSV, TXT ou XLSX para criar tags em massa.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <div class="space-y-2">
          <Label for="file">Arquivo</Label>
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
            @click="$refs.fileInput.click()"
          >
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept=".csv,.txt,.xlsx"
              @change="onFileChange"
            />
            <div v-if="!selectedFile" class="flex flex-col items-center gap-2">
              <Upload class="h-8 w-8 text-muted-foreground" />
              <p class="text-sm font-medium">Clique para selecionar ou arraste o arquivo</p>
              <p class="text-xs text-muted-foreground">Formatos suportados: .csv, .txt, .xlsx</p>
            </div>
            <div v-else class="flex flex-col items-center gap-2">
              <FileSpreadsheet class="h-8 w-8 text-primary" />
              <p class="text-sm font-medium">{{ selectedFile.name }}</p>
              <Button variant="ghost" size="sm" @click.stop="selectedFile = null" class="text-destructive h-7">
                Remover arquivo
              </Button>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-semibold flex items-center gap-2">
            <Info class="h-4 w-4" /> Estrutura do Arquivo CSV
          </h4>
          <p class="text-xs text-muted-foreground">
            O arquivo deve conter as colunas abaixo. Apenas <strong>name</strong> é obrigatória.
          </p>
          <div class="bg-muted p-3 rounded-md font-mono text-[10px] overflow-x-auto">
            <pre>name,slug,description,color,has_webhook,parent_id
VIP Ouro,vip-ouro,Jogadores VIP,#FFD700,true,
Churn Risco,churn-risco,Risco de abandono,#FF0000,false,</pre>
          </div>
          <ul class="text-[11px] space-y-1 list-disc list-inside text-muted-foreground">
            <li><strong>name:</strong> Nome de exibição da tag.</li>
            <li><strong>slug:</strong> Identificador (opcional).</li>
            <li><strong>color:</strong> Código hexadecimal (opcional).</li>
            <li><strong>has_webhook:</strong> true/false (opcional).</li>
          </ul>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isOpen = false" :disabled="isLoading">Cancelar</Button>
        <Button @click="handleImport" :disabled="!selectedFile || isLoading">
          <Spinner v-if="isLoading" class="mr-2 h-4 w-4" />
          {{ isLoading ? 'Importando...' : 'Iniciar Importação' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Upload, FileSpreadsheet, Info } from 'lucide-vue-next';
import { useToast } from '@/components/ui/toast/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import TagsService from '@/services/tags';
import { useWorkspaceStore } from '@/stores/workspace';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits(['update:open', 'imported']);

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();
const isLoading = ref(false);
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
});

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
  }
};

const handleImport = async () => {
  if (!selectedFile.value) return;

  isLoading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    
    const projectId = workspaceStore.activeGroupProject?.project_id;
    if (projectId) {
      formData.append('project_id', projectId.toString());
    }

    await TagsService.importTags(formData);

    toast({
      title: "Sucesso",
      description: "Tags importadas com sucesso.",
    });

    emit('imported');
    isOpen.value = false;
    selectedFile.value = null;
  } catch (error: any) {
    toast({
      title: "Erro na Importação",
      description: error.response?.data?.message || "Ocorreu um erro ao processar o arquivo.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

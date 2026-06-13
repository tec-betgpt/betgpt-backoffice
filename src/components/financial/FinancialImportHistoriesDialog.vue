<template>
  <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
    <Button type="button" variant="outline" @click="openDialog">
      <Upload class="mr-2 h-4 w-4" />
      Importar
    </Button>

    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-[920px]">
      <DialogHeader>
        <DialogTitle>Importar transações financeiras</DialogTitle>
        <DialogDescription>
          Envie uma planilha .xlsx ou .csv para validar os registros antes da importação.
        </DialogDescription>
      </DialogHeader>

      <div v-if="step === 'upload'" class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-sm font-medium">Arquivo de importação</h3>
            <p class="text-sm text-muted-foreground">
              Baixe o modelo para garantir que as colunas estejam no formato esperado.
            </p>
          </div>

          <Button type="button" variant="secondary" :disabled="templateLoading" @click="downloadTemplate">
            <Loader2 v-if="templateLoading" class="mr-2 h-4 w-4 animate-spin" />
            <Download v-else class="mr-2 h-4 w-4" />
            Baixar modelo
          </Button>
        </div>

        <Label
          for="financial-import-file"
          class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 px-6 py-10 text-center transition hover:bg-muted/40"
          :class="previewLoading ? 'pointer-events-none opacity-70' : ''"
          @dragover.prevent
          @drop.prevent="onDropFile"
        >
          <div class="mb-4 rounded-full bg-background p-4 shadow-sm">
            <FileSpreadsheet class="h-8 w-8 text-muted-foreground" />
          </div>
          <span class="text-sm font-medium">
            Arraste sua planilha aqui ou clique para selecionar
          </span>
          <span class="mt-1 text-xs text-muted-foreground">
            Formatos aceitos: .xlsx e .csv
          </span>
          <span v-if="selectedFile" class="mt-3 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
            {{ selectedFile.name }}
          </span>
          <span v-if="previewLoading" class="mt-4 flex items-center text-sm text-muted-foreground">
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Validando arquivo...
          </span>
        </Label>

        <Input
          id="financial-import-file"
          ref="fileInput"
          type="file"
          class="hidden"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          :disabled="previewLoading"
          @change="onSelectFile"
        />
      </div>

      <div v-else class="space-y-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-sm font-medium">Pré-visualização da importação</h3>
            <p class="text-sm text-muted-foreground">
              {{ validRowsCount }} de {{ previewRows.length }} linhas prontas para importação.
            </p>
          </div>
          <Badge v-if="hasErrors" variant="destructive">
            {{ errorRowsCount }} linha(s) com erro
          </Badge>
        </div>

        <div class="max-h-[420px] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[120px]">Status</TableHead>
                <TableHead v-for="header in previewHeaders" :key="header">
                  {{ header }}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <TableRow
                v-for="(row, rowIndex) in previewRows"
                :key="rowIndex"
                :class="row.errors.length ? 'bg-red-50 hover:bg-red-50/80 dark:bg-red-950/20' : ''"
              >
                <TableCell>
                  <Badge v-if="row.errors.length" variant="destructive" :title="row.errors.join('\n')">
                    <AlertCircle class="mr-1 h-3 w-3" />
                    Erro
                  </Badge>
                  <Badge v-else variant="outline" class="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                    OK
                  </Badge>
                </TableCell>
                <TableCell v-for="header in previewHeaders" :key="`${rowIndex}-${header}`">
                  {{ formatCell(row.data[headerKey(header)]) }}
                </TableCell>
              </TableRow>

              <TableRow v-if="!previewRows.length">
                <TableCell :colspan="previewHeaders.length + 1" class="h-24 text-center text-muted-foreground">
                  Nenhuma linha encontrada no arquivo.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div v-if="hasErrors" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <div class="mb-1 flex items-center font-medium">
            <AlertCircle class="mr-2 h-4 w-4" />
            Linhas com inconsistências
          </div>
          <ul class="list-inside list-disc space-y-1">
            <li v-for="(message, index) in errorMessages" :key="index">
              {{ message }}
            </li>
          </ul>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" :disabled="processLoading" @click="resetToUpload">
            Cancelar
          </Button>
          <Button type="button" :disabled="processLoading || !canConfirmImport" @click="confirmImport">
            <Loader2 v-if="processLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ processLoading ? 'Importando...' : 'Confirmar Importação' }}
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { AlertCircle, Download, FileSpreadsheet, Loader2, Upload } from "lucide-vue-next";
import financialImportHistories from "@/services/financialImportHistories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";

type Step = "upload" | "preview" | "processing";

interface PreviewRow {
  line: number;
  data: Record<string, any>;
  status: string;
  errors: string[];
}

interface PreviewResponse {
  headers: string[];
  preview_rows: PreviewRow[];
}

const props = defineProps<{
  projectId: string | number | null;
  reload: () => void | Promise<void>;
}>();

const isDialogOpen = ref(false);
const step = ref<Step>("upload");
const selectedFile = ref<File | null>(null);
const preview = ref<PreviewResponse | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const templateLoading = ref(false);
const previewLoading = ref(false);
const processLoading = ref(false);

const previewHeaders = computed(() => preview.value?.headers ?? []);
const previewRows = computed(() => preview.value?.preview_rows ?? []);
const errorRowsCount = computed(() => previewRows.value.filter((row) => row.errors.length).length);
const validRowsCount = computed(() => previewRows.value.length - errorRowsCount.value);
const hasErrors = computed(() => errorRowsCount.value > 0);
const canConfirmImport = computed(() => previewRows.value.length > 0 && validRowsCount.value > 0 && !hasErrors.value && Boolean(selectedFile.value));
const errorMessages = computed(() => previewRows.value
  .map((row) => row.errors.map((error) => error.includes(`Linha ${row.line}:`) ? error : `Linha ${row.line}: ${error}`))
  .flat()
  .slice(0, 5));

const headerKey = (header: string) => header
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "");

const normalizeProjectId = (projectId: string | number | null) => {
  if (typeof projectId === "number") return String(projectId);
  if (!projectId) return "";

  return projectId.includes("_") ? projectId.split("_").pop() ?? "" : projectId;
};

const openDialog = () => {
  if (!normalizeProjectId(props.projectId)) {
    toast({
      title: "Projeto obrigatório",
      description: "Selecione um projeto antes de importar transações financeiras.",
      variant: "destructive",
    });
    return;
  }

  isDialogOpen.value = true;
};

const downloadTemplate = async () => {
  templateLoading.value = true;

  try {
    const response = await financialImportHistories.template();

    const blob = new Blob([response], {
      type: response.type || "application/octet-stream",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-importacao-financeira.xlsx";
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Modelo solicitado",
      description: "O download do modelo foi iniciado.",
    });
  } catch (error) {
    toast({
      title: "Erro ao baixar modelo",
      description: "Tente novamente mais tarde.",
      variant: "destructive",
    });
  }

  templateLoading.value = false;
};

const onSelectFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file) {
    handleFile(file);
  }
};

const onDropFile = (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0];

  if (file) {
    handleFile(file);
  }
};

const handleFile = async (file: File) => {
  if (!isAcceptedFile(file)) {
    toast({
      title: "Formato inválido",
      description: "Envie um arquivo .xlsx ou .csv.",
      variant: "destructive",
    });
    return;
  }

  selectedFile.value = file;
  previewLoading.value = true;

  const formData = new FormData();
  formData.append("file", file);

  try {
    preview.value = await financialImportHistories.preview(formData);
    step.value = "preview";
  } catch (error) {
    toast({
      title: "Erro ao validar arquivo",
      description: "Confira a planilha e tente novamente.",
      variant: "destructive",
    });
  }

  previewLoading.value = false;
};

const confirmImport = async () => {
  if (!selectedFile.value) return;

  const projectId = normalizeProjectId(props.projectId);
  if (!projectId) return;

  step.value = "processing";
  processLoading.value = true;

  const formData = new FormData();
  formData.append("file", selectedFile.value);
  formData.append("project_id", projectId);

  try {
    await financialImportHistories.process(formData);

    isDialogOpen.value = false;
    toast({
      title: "Importação concluída!",
      description: "As transações financeiras foram importadas com sucesso.",
    });
    await props.reload();
  } catch (error) {
    toast({
      title: "Erro ao importar arquivo",
      description: "Tente novamente mais tarde.",
      variant: "destructive",
    });
    step.value = "preview";
  }

  processLoading.value = false;
};

const resetToUpload = () => {
  reset();
  step.value = "upload";
};

const reset = () => {
  selectedFile.value = null;
  preview.value = null;
  previewLoading.value = false;
  processLoading.value = false;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const isAcceptedFile = (file: File) => {
  const name = file.name.toLowerCase();

  return name.endsWith(".xlsx") || name.endsWith(".csv");
};

const formatCell = (value: any) => {
  if (value === null || value === undefined || value === "") return "—";

  return String(value);
};

watch(isDialogOpen, (open) => {
  if (!open) {
    step.value = "upload";
    reset();
  }
});
</script>

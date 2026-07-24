<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Automações de SMS</h2>
        <p class="text-muted-foreground">
          Campanhas automáticas do SMS Funnel: sequências disparadas quando um lead entra na lista vinculada.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" :disabled="isLoading" @click="fetchCampaigns(1)">Atualizar</Button>
        <Button @click="openCreateDialog">Nova automação</Button>
      </div>
    </div>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Não foi possível concluir a ação</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Card>
      <CardContent class="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Automação</TableHead>
              <TableHead>Ativa</TableHead>
              <TableHead>Lista vinculada</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell colspan="5" class="py-8 text-center text-muted-foreground">Carregando automações...</TableCell>
            </TableRow>
            <TableRow v-else-if="campaigns.length === 0">
              <TableCell colspan="5" class="py-8 text-center text-muted-foreground">
                Nenhuma automação encontrada no SMS Funnel.
              </TableCell>
            </TableRow>
            <TableRow v-for="item in campaigns" :key="item.id">
              <TableCell>
                <div class="font-medium">{{ item.name }}</div>
                <div class="font-mono text-xs text-muted-foreground">{{ item.id }}</div>
              </TableCell>
              <TableCell>
                <Badge :variant="item.active ? 'default' : 'secondary'">
                  {{ item.active ? "Ativa" : "Inativa" }}
                </Badge>
              </TableCell>
              <TableCell class="font-mono text-xs">{{ item.lead_list_id || "—" }}</TableCell>
              <TableCell>{{ formatDateTime(item.created_at) }}</TableCell>
              <TableCell>
                <div class="flex justify-end gap-2">
                  <Button variant="outline" size="sm" @click="openSequences(item)">Sequências</Button>
                  <Button variant="outline" size="sm" :disabled="isSaving" @click="toggleActive(item)">
                    {{ item.active ? "Desativar" : "Ativar" }}
                  </Button>
                  <Button variant="destructive" size="sm" @click="openDeleteDialog(item)">Excluir</Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div class="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" :disabled="page <= 1 || isLoading" @click="fetchCampaigns(page - 1)">
            Anterior
          </Button>
          <span class="text-sm text-muted-foreground">Página {{ page }}</span>
          <Button variant="outline" size="sm" :disabled="!hasNextPage || isLoading" @click="fetchCampaigns(page + 1)">
            Próxima
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Criar automação -->
    <Dialog :open="isFormDialogOpen" @update:open="isFormDialogOpen = $event">
      <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova automação</DialogTitle>
          <DialogDescription>
            Crie a campanha do provedor com sequências de SMS. As sequências disparam após o lead entrar na lista.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label>Nome</Label>
              <Input v-model="formName" maxlength="50" placeholder="Ex.: Boas-vindas" />
            </div>
            <div class="space-y-2">
              <Label>ID da lista de leads (opcional)</Label>
              <Input v-model="formListId" placeholder="ULID da lista" />
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <Label>Sequências</Label>
              <Button variant="outline" size="sm" @click="addSequenceRow">Adicionar sequência</Button>
            </div>

            <div
              v-for="(sequence, index) in formSequences"
              :key="index"
              class="space-y-3 rounded-md border p-3"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">Sequência {{ index + 1 }}</span>
                <Button variant="ghost" size="sm" @click="formSequences.splice(index, 1)">Remover</Button>
              </div>
              <div class="grid gap-3 md:grid-cols-2">
                <div class="space-y-2">
                  <Label>Intervalo</Label>
                  <Input v-model.number="sequence.interval" type="number" min="1" />
                </div>
                <div class="space-y-2">
                  <Label>Unidade</Label>
                  <Select v-model="sequence.interval_type_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="type in intervalTypes"
                        :key="type.id"
                        :value="String(type.id)"
                      >
                        {{ type.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div class="space-y-2">
                <Label>Mensagem</Label>
                <Textarea v-model="sequence.text" rows="3" maxlength="1530" placeholder="Texto do SMS. Use {meu_link} + URL para link rastreado." />
              </div>
              <div class="space-y-2">
                <Label>URL (obrigatória se a mensagem contém {meu_link})</Label>
                <Input v-model="sequence.url" placeholder="https://exemplo.com" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isFormDialogOpen = false">Cancelar</Button>
          <Button :disabled="!formName.trim() || isSaving" @click="saveCampaign">
            {{ isSaving ? "Salvando..." : "Criar automação" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Excluir automação -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir automação</AlertDialogTitle>
          <AlertDialogDescription>
            A automação <strong>{{ selectedCampaign?.name }}</strong> e suas sequências serão removidas do SMS Funnel.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction :disabled="isSaving" @click="confirmDelete">
            {{ isSaving ? "Excluindo..." : "Confirmar exclusão" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Drawer de sequências -->
    <Sheet :open="isSequencesOpen" @update:open="isSequencesOpen = $event">
      <SheetContent class="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Sequências — {{ selectedCampaign?.name }}</SheetTitle>
          <SheetDescription>Edite as mensagens da automação diretamente no SMS Funnel.</SheetDescription>
        </SheetHeader>

        <div class="mt-4 space-y-4">
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-base">Nova sequência</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="grid gap-3 md:grid-cols-2">
                <div class="space-y-2">
                  <Label>Intervalo</Label>
                  <Input v-model.number="newSequence.interval" type="number" min="1" />
                </div>
                <div class="space-y-2">
                  <Label>Unidade</Label>
                  <Select v-model="newSequence.interval_type_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="type in intervalTypes" :key="type.id" :value="String(type.id)">
                        {{ type.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div class="space-y-2">
                <Label>Mensagem</Label>
                <Textarea v-model="newSequence.text" rows="3" maxlength="1530" />
              </div>
              <div class="space-y-2">
                <Label>URL (para {meu_link})</Label>
                <Input v-model="newSequence.url" placeholder="https://exemplo.com" />
              </div>
              <div class="flex justify-end">
                <Button size="sm" :disabled="!newSequence.text.trim() || isSaving" @click="submitSequence">
                  {{ isSaving ? "Salvando..." : "Adicionar" }}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div v-if="isLoadingSequences" class="py-6 text-center text-sm text-muted-foreground">
            Carregando sequências...
          </div>
          <div v-else-if="sequences.length === 0" class="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhuma sequência cadastrada nesta automação.
          </div>
          <Card v-for="sequence in sequences" :key="sequence.id">
            <CardContent class="space-y-2 pt-4">
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium">
                  Posição {{ sequence.position }} • {{ sequence.interval }} {{ intervalTypeLabel(sequence.interval_type_id) }}
                </div>
                <div class="flex items-center gap-2">
                  <Badge :variant="sequence.active ? 'default' : 'secondary'">
                    {{ sequence.active ? "Ativa" : "Inativa" }}
                  </Badge>
                  <Button variant="outline" size="sm" :disabled="isSaving" @click="toggleSequence(sequence)">
                    {{ sequence.active ? "Desativar" : "Ativar" }}
                  </Button>
                  <Button variant="destructive" size="sm" :disabled="isSaving" @click="removeSequence(sequence)">
                    Excluir
                  </Button>
                </div>
              </div>
              <p class="whitespace-pre-wrap text-sm text-muted-foreground">{{ sequence.text }}</p>
              <p v-if="sequence.url" class="text-xs text-muted-foreground">URL: {{ sequence.url }}</p>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  SMS_INTERVAL_TYPE_FALLBACK,
  type SmsIntervalType,
  type SmsProviderCampaign,
  type SmsSequence,
} from "@/contracts/smsProvider";
import {
  createSmsCampaign,
  createSmsSequence,
  deleteSmsCampaign,
  deleteSmsSequence,
  listSmsCampaigns,
  listSmsIntervalTypes,
  listSmsSequences,
  updateSmsCampaign,
  updateSmsSequence,
} from "@/services/smsProvider";
import { useWorkspaceStore } from "@/stores/workspace";

type SequenceForm = {
  interval: number;
  interval_type_id: string;
  text: string;
  url: string;
};

const workspaceStore = useWorkspaceStore();
const campaigns = ref<SmsProviderCampaign[]>([]);
const sequences = ref<SmsSequence[]>([]);
const intervalTypes = ref<SmsIntervalType[]>(SMS_INTERVAL_TYPE_FALLBACK);
const isLoading = ref(false);
const isLoadingSequences = ref(false);
const isSaving = ref(false);
const errorMessage = ref("");
const page = ref(1);
const hasNextPage = ref(false);

const isFormDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const isSequencesOpen = ref(false);
const selectedCampaign = ref<SmsProviderCampaign | null>(null);

const formName = ref("");
const formListId = ref("");
const formSequences = ref<SequenceForm[]>([]);
const newSequence = reactive<SequenceForm>(createSequenceForm());

function requireFilterId(): string | null {
  const id = workspaceStore.activeGroupProject?.id;
  if (!id) {
    errorMessage.value = "Selecione um projeto no workspace para operar o SMS Funnel.";
    return null;
  }
  return id;
}

onMounted(async () => {
  await fetchCampaigns(1);
  const filter_id = requireFilterId();
  if (!filter_id) return;

  try {
    const types = await listSmsIntervalTypes({ filter_id });
    if (Array.isArray(types) && types.length > 0) {
      intervalTypes.value = types;
    }
  } catch {
    // mantém o fallback local
  }
});

function createSequenceForm(): SequenceForm {
  return { interval: 1, interval_type_id: "3", text: "", url: "" };
}

async function fetchCampaigns(targetPage = 1) {
  isLoading.value = true;
  errorMessage.value = "";

  const filter_id = requireFilterId();
  if (!filter_id) {
    isLoading.value = false;
    campaigns.value = [];
    return;
  }

  try {
    const response = await listSmsCampaigns({ filter_id, per_page: 20, page: targetPage });
    campaigns.value = response.data || [];
    page.value = response.current_page || targetPage;
    hasNextPage.value = Boolean(response.next_page_url);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível carregar as automações do SMS Funnel.");
    campaigns.value = [];
  } finally {
    isLoading.value = false;
  }
}

function openCreateDialog() {
  formName.value = "";
  formListId.value = "";
  formSequences.value = [createSequenceForm()];
  isFormDialogOpen.value = true;
}

function addSequenceRow() {
  formSequences.value.push(createSequenceForm());
}

async function saveCampaign() {
  isSaving.value = true;
  errorMessage.value = "";

  const filter_id = requireFilterId();
  if (!filter_id) {
    isSaving.value = false;
    return;
  }

  try {
    const sequencesPayload = formSequences.value
      .filter((sequence) => sequence.text.trim())
      .map((sequence) => ({
        interval: sequence.interval || 1,
        interval_type_id: Number(sequence.interval_type_id),
        text: sequence.text,
        active: true,
        url: sequence.url.trim() || undefined,
      }));

    await createSmsCampaign({
      filter_id,
      name: formName.value.trim(),
      active: true,
      lead_list_id: formListId.value.trim() || undefined,
      sequences: sequencesPayload.length ? sequencesPayload : undefined,
    });

    toast({ title: "Automação criada no SMS Funnel." });
    isFormDialogOpen.value = false;
    await fetchCampaigns(1);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível criar a automação.");
  } finally {
    isSaving.value = false;
  }
}

async function toggleActive(item: SmsProviderCampaign) {
  isSaving.value = true;
  errorMessage.value = "";

  const filter_id = requireFilterId();
  if (!filter_id) {
    isSaving.value = false;
    return;
  }

  try {
    await updateSmsCampaign(item.id, { filter_id, active: !item.active });
    toast({ title: item.active ? "Automação desativada." : "Automação ativada." });
    await fetchCampaigns(page.value);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível atualizar a automação.");
  } finally {
    isSaving.value = false;
  }
}

function openDeleteDialog(item: SmsProviderCampaign) {
  selectedCampaign.value = item;
  isDeleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!selectedCampaign.value) return;

  isSaving.value = true;
  errorMessage.value = "";

  const filter_id = requireFilterId();
  if (!filter_id) {
    isSaving.value = false;
    return;
  }

  try {
    await deleteSmsCampaign(selectedCampaign.value.id, { filter_id });
    toast({ title: "Automação excluída." });
    isDeleteDialogOpen.value = false;
    await fetchCampaigns(1);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível excluir a automação.");
    isDeleteDialogOpen.value = false;
  } finally {
    isSaving.value = false;
  }
}

async function openSequences(item: SmsProviderCampaign) {
  selectedCampaign.value = item;
  Object.assign(newSequence, createSequenceForm());
  isSequencesOpen.value = true;
  await fetchSequences();
}

async function fetchSequences() {
  if (!selectedCampaign.value) return;

  const filter_id = requireFilterId();
  if (!filter_id) return;

  isLoadingSequences.value = true;

  try {
    sequences.value = await listSmsSequences(selectedCampaign.value.id, { filter_id });
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível carregar as sequências.");
    sequences.value = [];
  } finally {
    isLoadingSequences.value = false;
  }
}

async function submitSequence() {
  if (!selectedCampaign.value) return;

  const filter_id = requireFilterId();
  if (!filter_id) return;

  isSaving.value = true;
  errorMessage.value = "";

  try {
    await createSmsSequence(selectedCampaign.value.id, {
      filter_id,
      interval: newSequence.interval || 1,
      interval_type_id: Number(newSequence.interval_type_id),
      text: newSequence.text,
      active: true,
      url: newSequence.url.trim() || undefined,
    });
    toast({ title: "Sequência adicionada." });
    Object.assign(newSequence, createSequenceForm());
    await fetchSequences();
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível adicionar a sequência.");
  } finally {
    isSaving.value = false;
  }
}

async function toggleSequence(sequence: SmsSequence) {
  const filter_id = requireFilterId();
  if (!filter_id) return;

  isSaving.value = true;
  errorMessage.value = "";

  try {
    await updateSmsSequence(sequence.id, { filter_id, active: !sequence.active });
    await fetchSequences();
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível atualizar a sequência.");
  } finally {
    isSaving.value = false;
  }
}

async function removeSequence(sequence: SmsSequence) {
  const filter_id = requireFilterId();
  if (!filter_id) return;

  isSaving.value = true;
  errorMessage.value = "";

  try {
    await deleteSmsSequence(sequence.id, { filter_id });
    toast({ title: "Sequência excluída." });
    await fetchSequences();
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível excluir a sequência.");
  } finally {
    isSaving.value = false;
  }
}

function intervalTypeLabel(intervalTypeId: number) {
  return intervalTypes.value.find((type) => type.id === intervalTypeId)?.label || `tipo ${intervalTypeId}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function getHttpMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    return message || fallback;
  }

  if (error instanceof Error) return error.message;
  return fallback;
}
</script>

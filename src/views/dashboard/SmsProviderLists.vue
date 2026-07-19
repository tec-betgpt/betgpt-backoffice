<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Listas de SMS</h2>
        <p class="text-muted-foreground">
          Gerencie as listas de leads do SMS Funnel usadas pelas campanhas automáticas do provedor.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" :disabled="isLoading" @click="fetchLists(1)">Atualizar</Button>
        <Button @click="openCreateDialog">Nova lista</Button>
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
              <TableHead>Nome</TableHead>
              <TableHead class="text-right">Leads</TableHead>
              <TableHead class="text-right">Campanhas</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell colspan="5" class="py-8 text-center text-muted-foreground">Carregando listas...</TableCell>
            </TableRow>
            <TableRow v-else-if="lists.length === 0">
              <TableCell colspan="5" class="py-8 text-center text-muted-foreground">
                Nenhuma lista encontrada no SMS Funnel.
              </TableCell>
            </TableRow>
            <TableRow v-for="list in lists" :key="list.id">
              <TableCell>
                <div class="font-medium">{{ list.name }}</div>
                <div class="font-mono text-xs text-muted-foreground">{{ list.id }}</div>
              </TableCell>
              <TableCell class="text-right">{{ list.leads_count }}</TableCell>
              <TableCell class="text-right">{{ list.campaigns_count }}</TableCell>
              <TableCell>{{ formatDateTime(list.created_at) }}</TableCell>
              <TableCell>
                <div class="flex justify-end gap-2">
                  <Button variant="outline" size="sm" @click="openLeads(list)">Leads</Button>
                  <Button variant="outline" size="sm" @click="openRenameDialog(list)">Renomear</Button>
                  <Button variant="destructive" size="sm" @click="openDeleteDialog(list)">Excluir</Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div class="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" :disabled="page <= 1 || isLoading" @click="fetchLists(page - 1)">
            Anterior
          </Button>
          <span class="text-sm text-muted-foreground">Página {{ page }}</span>
          <Button variant="outline" size="sm" :disabled="!hasNextPage || isLoading" @click="fetchLists(page + 1)">
            Próxima
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Criar / renomear lista -->
    <Dialog :open="isFormDialogOpen" @update:open="isFormDialogOpen = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingList ? "Renomear lista" : "Nova lista" }}</DialogTitle>
          <DialogDescription>
            {{ editingList ? "Informe o novo nome da lista." : "A lista será criada diretamente no SMS Funnel." }}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-2">
          <Label>Nome</Label>
          <Input v-model="listName" maxlength="100" placeholder="Ex.: Leads Promoção Julho" />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isFormDialogOpen = false">Cancelar</Button>
          <Button :disabled="!listName.trim() || isSaving" @click="saveList">
            {{ isSaving ? "Salvando..." : "Salvar" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Excluir lista -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir lista</AlertDialogTitle>
          <AlertDialogDescription>
            A lista <strong>{{ selectedList?.name }}</strong> será removida do SMS Funnel.
            Listas com campanhas dependentes não podem ser excluídas (o provedor retorna conflito).
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

    <!-- Drawer de leads -->
    <Sheet :open="isLeadsOpen" @update:open="isLeadsOpen = $event">
      <SheetContent class="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Leads — {{ selectedList?.name }}</SheetTitle>
          <SheetDescription>Adicione ou remova leads desta lista do SMS Funnel.</SheetDescription>
        </SheetHeader>

        <div class="mt-4 space-y-4">
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-base">Adicionar leads</CardTitle>
              <CardDescription>Um lead por linha no formato: telefone;nome;email (email opcional).</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <Textarea
                v-model="leadsInput"
                rows="4"
                placeholder="5511999999999;Maria Silva;maria@email.com&#10;5521988888888;João Souza"
              />
              <div class="flex justify-end">
                <Button size="sm" :disabled="!leadsInput.trim() || isSaving" @click="submitLeads">
                  {{ isSaving ? "Enviando..." : "Adicionar leads" }}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Blacklist</TableHead>
                <TableHead class="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoadingLeads">
                <TableCell colspan="4" class="py-6 text-center text-muted-foreground">Carregando leads...</TableCell>
              </TableRow>
              <TableRow v-else-if="leads.length === 0">
                <TableCell colspan="4" class="py-6 text-center text-muted-foreground">Nenhum lead nesta lista.</TableCell>
              </TableRow>
              <TableRow v-for="lead in leads" :key="lead.id">
                <TableCell>
                  <div class="font-medium">{{ lead.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ lead.email || "—" }}</div>
                </TableCell>
                <TableCell class="font-mono text-sm">{{ lead.phone }}</TableCell>
                <TableCell>
                  <Badge :variant="lead.blacklisted ? 'destructive' : 'outline'">
                    {{ lead.blacklisted ? "Sim" : "Não" }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="flex justify-end">
                    <Button variant="destructive" size="sm" :disabled="isSaving" @click="removeLead(lead)">
                      Remover
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div class="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" :disabled="leadsPage <= 1 || isLoadingLeads" @click="fetchLeads(leadsPage - 1)">
              Anterior
            </Button>
            <span class="text-sm text-muted-foreground">Página {{ leadsPage }}</span>
            <Button variant="outline" size="sm" :disabled="!hasNextLeadsPage || isLoadingLeads" @click="fetchLeads(leadsPage + 1)">
              Próxima
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { SmsLead, SmsLeadPayload, SmsList } from "@/contracts/smsProvider";
import {
  addSmsLeads,
  createSmsList,
  deleteSmsList,
  listSmsLeads,
  listSmsLists,
  removeSmsLead,
  updateSmsList,
} from "@/services/smsProvider";

const lists = ref<SmsList[]>([]);
const leads = ref<SmsLead[]>([]);
const isLoading = ref(false);
const isLoadingLeads = ref(false);
const isSaving = ref(false);
const errorMessage = ref("");
const page = ref(1);
const hasNextPage = ref(false);
const leadsPage = ref(1);
const hasNextLeadsPage = ref(false);

const isFormDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const isLeadsOpen = ref(false);
const selectedList = ref<SmsList | null>(null);
const editingList = ref<SmsList | null>(null);
const listName = ref("");
const leadsInput = ref("");

onMounted(() => fetchLists(1));

async function fetchLists(targetPage = 1) {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await listSmsLists({ per_page: 20, page: targetPage });
    lists.value = response.data || [];
    page.value = response.current_page || targetPage;
    hasNextPage.value = Boolean(response.next_page_url);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível carregar as listas do SMS Funnel.");
    lists.value = [];
  } finally {
    isLoading.value = false;
  }
}

function openCreateDialog() {
  editingList.value = null;
  listName.value = "";
  isFormDialogOpen.value = true;
}

function openRenameDialog(list: SmsList) {
  editingList.value = list;
  listName.value = list.name;
  isFormDialogOpen.value = true;
}

async function saveList() {
  isSaving.value = true;
  errorMessage.value = "";

  try {
    if (editingList.value) {
      await updateSmsList(editingList.value.id, listName.value.trim());
      toast({ title: "Lista renomeada." });
    } else {
      await createSmsList(listName.value.trim());
      toast({ title: "Lista criada no SMS Funnel." });
    }
    isFormDialogOpen.value = false;
    await fetchLists(page.value);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível salvar a lista.");
  } finally {
    isSaving.value = false;
  }
}

function openDeleteDialog(list: SmsList) {
  selectedList.value = list;
  isDeleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!selectedList.value) return;

  isSaving.value = true;
  errorMessage.value = "";

  try {
    await deleteSmsList(selectedList.value.id);
    toast({ title: "Lista excluída." });
    isDeleteDialogOpen.value = false;
    await fetchLists(1);
  } catch (error) {
    errorMessage.value = getHttpMessage(
      error,
      "Não foi possível excluir a lista. Verifique se há campanhas dependentes.",
    );
    isDeleteDialogOpen.value = false;
  } finally {
    isSaving.value = false;
  }
}

async function openLeads(list: SmsList) {
  selectedList.value = list;
  leadsInput.value = "";
  isLeadsOpen.value = true;
  await fetchLeads(1);
}

async function fetchLeads(targetPage = 1) {
  if (!selectedList.value) return;

  isLoadingLeads.value = true;

  try {
    const response = await listSmsLeads(selectedList.value.id, { per_page: 20, page: targetPage });
    leads.value = response.data || [];
    leadsPage.value = response.current_page || targetPage;
    hasNextLeadsPage.value = Boolean(response.next_page_url);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível carregar os leads da lista.");
    leads.value = [];
  } finally {
    isLoadingLeads.value = false;
  }
}

async function submitLeads() {
  if (!selectedList.value) return;

  const parsed = parseLeadsInput();

  if (parsed.length === 0) {
    errorMessage.value = "Nenhum lead válido informado. Use o formato telefone;nome;email.";
    return;
  }

  isSaving.value = true;
  errorMessage.value = "";

  try {
    const result = await addSmsLeads(selectedList.value.id, parsed);
    toast({
      title: `${result.accepted_count} lead(s) aceitos` +
        (result.blacklisted_count ? `, ${result.blacklisted_count} em blacklist.` : "."),
    });
    leadsInput.value = "";
    await fetchLeads(leadsPage.value);
    await fetchLists(page.value);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível adicionar os leads.");
  } finally {
    isSaving.value = false;
  }
}

function parseLeadsInput(): SmsLeadPayload[] {
  return leadsInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [phone, name, email] = line.split(";").map((part) => part?.trim());
      if (!phone || !name) return null;
      return { phone, name, email: email || undefined };
    })
    .filter((lead): lead is SmsLeadPayload => Boolean(lead));
}

async function removeLead(lead: SmsLead) {
  if (!selectedList.value) return;

  isSaving.value = true;
  errorMessage.value = "";

  try {
    await removeSmsLead(selectedList.value.id, lead.id);
    toast({ title: "Lead removido." });
    await fetchLeads(leadsPage.value);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível remover o lead.");
  } finally {
    isSaving.value = false;
  }
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

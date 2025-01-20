<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">

    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Textos</h2>
      <p class="text-muted-foreground">
        Gerencie os textos e edite informações.
      </p>
    </div>
    <Card>
      <CardContent>
        <div v-if="isLoading" class="mt-6">
          <div class="space-y-4">
            <Skeleton class="h-6 w-full" />
            <Skeleton class="h-6 w-full" />
            <Skeleton class="h-6 w-full" />
          </div>
        </div>
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Texto</TableHead>
              <TableHead>Assinatura</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="valuesTable" v-for="item in valuesTable" :key="item.id">
              <TableCell class="sm:w-2/4 text-ellipsis	text-wrap	font-medium		 ">{{ item.message }}</TableCell>
              <TableCell class="sm:w-1/4 text-ellipsis text-wrap	font-medium			">{{ item.signature }}</TableCell>
              <TableCell class="w-1/4">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                        :disabled="loadingRemove||loading"
                    >
                      <MoreHorizontal class="h-4 w-4" />
                      <span class="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="openModal(item)">
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="remove(item.id)">
                      <div class="flex items-center">
                        Remover
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>

            </TableRow>


          </TableBody>

        </Table>
        <Pagination v-if="pages.last>1" v-slot="{ page }" :total="pages.total" :sibling-count="1" show-edges :default-page="1">
          <PaginationList v-slot="{ items }" class="flex items-center gap-2">
            <PaginationFirst as-child @click="fetchMessages(1)" />
            <PaginationPrev as-child @click="fetchMessages(pageCurrent-1)"/>

            <template v-for="(item, index) in items">
              <PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
                <Button class="w-9 h-9 p-0" :variant="item.value === page ? 'default' : 'outline'" @click="fetchMessages(index+1)">
                  {{ item.value }}
                </Button>
              </PaginationListItem>
              <PaginationEllipsis v-else :key="item.type" :index="index" />
            </template>

            <PaginationNext @click="fetchMessages(pageCurrent+1)" />
            <PaginationLast @click="fetchMessages(pages.last)" />
          </PaginationList>
        </Pagination>

      </CardContent>
      <CardFooter>
      <Button @click="openModal()">
        {{ loadingSave ? "Carregando..." : "Novo Texto" }}
      </Button>
    </CardFooter>
    </Card>



    <Sheet v-model:open="showModal">
      <SheetContent position="right" size="lg">
        <SheetHeader>
          <SheetTitle>
            {{ isEditing ? "Editar Texto" : "Novo Texto" }}
          </SheetTitle>
          <SheetDescription>
            {{
              isEditing
                  ? "Edite as informações do Texto"
                  : "Crie um novo Texto"
            }}
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="isEditing ? edit(isEditing) : submit()">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="name">Texto</Label>
              <Input
                  id="name"
                  v-model="form.message"
                  placeholder="Digite o Texto"
                  class="col-span-3"
                  required
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="name">Assinatura</Label>
              <Input
                  id="name"
                  v-model="form.signature"
                  placeholder="Digite a Assinatura"
                  class="col-span-3"
                  required
              />
            </div>
          </div>
          <SheetFooter>
            <Button type="submit" :disabled="loading">
              <LucideSpinner
                  v-if="loading"
                  class="mr-2 h-4 w-4 animate-spin"
              />
              {{
                loading
                    ? "Salvando..."
                    : isEditing
                        ? "Salvar"
                        : "Criar Texto"
              }}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

  </div>
</template>


<script setup lang="ts">

import { ref, watch } from "vue";
import Form from "vform";
import api from "@/services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {MoreHorizontal, X} from "lucide-vue-next";
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {useToast} from "@/components/ui/toast";
import i18n from "@/i18n";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Card, CardContent, CardFooter} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

const { toast } = useToast();
Form.axios = api;
const valuesTable = ref([]);
const form = ref(
    new Form({
      message: "",
      signature: "",
    })
);
const pageCurrent = ref(1);
const pages = ref({
  total: 0,
  last: 0,
});
const showModal = ref(false);
const isLoading = ref(true)
const loading = ref(false)
const loadingSave = ref(false)
const loadingRemove =  ref(false)
const isEditing = ref(false)
async function fetchMessages(pageId: number = pageCurrent.value) {
  try {
     isLoading.value = true
    const response = await form.value.get(`/utils/message-loading?page=${pageId}`);
    pageCurrent.value = pageId;
    pages.value.total = response.data.data.total;
    pages.value.last = response.data.data.last_page;
    valuesTable.value = response.data.data.data;
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
  }finally {
    isLoading.value = false;
  }
}

fetchMessages();

async function submit() {
  try {
    loading.value = true;
    const response = await form.value.post("/utils/message-loading");

    console.log(response);
    form.value.reset();
    toast({
      title: i18n.global.t("success"),
      description:  i18n.global.t(response.data.message),
      duration:3000,
    });
    await fetchMessages();

  } catch (error) {
    console.error("Erro ao enviar formulário:", error);
    toast({
      title: i18n.global.t("error"),
      description:  i18n.global.t(error.response.data.message),
      duration:3000,
      variant:'destructive'
    });
  }finally {
    loading.value = false
    showModal.value = false
  }
}
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function remove(id: number) {
  try {
    loadingRemove.value = true
    const response = await form.value.delete(`/utils/message-loading/${id}`);
    console.log(response);
    await fetchMessages();
    toast({
      title: i18n.global.t("success"),
      description:  i18n.global.t(response.data.message),
      duration:3000,
    });

  } catch (error) {
    toast({
      title: i18n.global.t("error"),
      description:  i18n.global.t(error.response.data.message),
      duration:3000,
      variant:'destructive'
    });
    console.error("Erro ao remover mensagem:", error);
  }finally {
    loadingRemove.value = false
  }
}

async function edit(id) {
  try {
    loading.value = true
    console.log(id,form.value)
    const response = await form.value.put(`/utils/message-loading/${id}`);

    console.log(response);
    form.value.reset();
    await fetchMessages();
    showModal.value = false;
    toast({
      title: i18n.global.t("success"),
      description:  i18n.global.t(response.data.message),
      duration:3000,
    });
  } catch (error) {
    console.error("Erro ao editar mensagem:", error);
    toast({
      title: i18n.global.t("error"),
      description:  i18n.global.t(error.response.data.message),
      duration:3000,
      variant:'destructive'
    });
  }finally {
    loading.value = false
    showModal.value = false
  }
}

function openModal(item){
  if(item){
    form.value.message = item.message;
    form.value.signature = item.signature
    isEditing.value = item.id;
  }
  showModal.value = true;
}
</script>


<template>
  <div class="p-6">

    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Textos</h2>
      <p class="text-muted-foreground">

      </p>
    </div>
    <form class="mb-6 space-y-4 py-4" @submit.prevent="submit">

      <div>
        <Label for="message" class="block text-sm font-medium">Texto</Label>
        <Input v-model="form.message" id="message" class="mt-1"/>
      </div>
      <div>
        <Label for="signature" class="block text-sm font-medium">Assinatura</Label>
        <Input
            id="signature"
            placeholder="Assinatura"

            v-model="form.signature"
            class="mt-1"
        />
      </div>
      <Button type="submit" :disabled="loadingSave">   <LucideSpinner
          v-if="loadingSave"
          class="mr-2 h-4 w-4 animate-spin"
      />Salvar</Button>
    </form>
    <Table >
      <TableHeader>
        <TableRow>
          <TableHead>Texto</TableHead>
          <TableHead>Assinatura</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="valuesTable" v-for="item in valuesTable" :key="item.id">
          <TableCell class="w-2/4">{{ item.message }}</TableCell>
          <TableCell class="w-1/4">{{ item.signature }}</TableCell>
          <TableCell class="w-2/4">
            <div class=" align-middle justify-start gap-4 flex ">
              <Button @click="openModal(item.id)">Editar</Button>

              <Button variant="destructive" @click="remove(item.id)">Remover</Button>
            </div>

          </TableCell>

        </TableRow>
        <TableFooter class=" flex items-center justify-start w-full py-4 bg-white">
          <Pagination v-slot="{ page }" :total="pages.total" :sibling-count="1" show-edges :default-page="1">
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

        </TableFooter>
      </TableBody>
    </Table>
    <Sheet v-model:open="showModal">
      <SheetContent  position="right" size="lg">
        <SheetHeader>
          <SheetTitle>Editar Texto</SheetTitle>
          <!--          <SheetClose-->
          <!--              class="absolute right-4 top-4"-->
          <!--              @click="closeDialog"-->
          <!--          >-->
          <!--            <X :size="18" :stroke-width="1.75" absoluteStrokeWidth/>-->
          <!--          </SheetClose>-->

        </SheetHeader>
        <form @submit.prevent="edit(editId)" class="gap-4 flex flex-col">

          <div>
            <Label for="message" class="block text-sm font-medium">Texto</Label>
            <Input v-model="form.message" id="message" class="mt-1"/>
          </div>
          <div>
            <Label for="signature" class="block text-sm font-medium">Assinatura</Label>
            <Input
                id="signature"
                placeholder="Assinatura"

                v-model="form.signature"
                class="mt-1"
            />
          </div>
          <Button type="submit" :disabled="loading">
            <LucideSpinner
                v-if="loading"
                class="mr-2 h-4 w-4 animate-spin"
            />
            Editar</Button>
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-vue-next";
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
import {Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {useToast} from "@/components/ui/toast";
import i18n from "@/i18n";
import { Loader2 as LucideSpinner } from "lucide-vue-next";

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
const editId = ref()
const loading = ref(false)
const loadingSave = ref(false)
async function fetchMessages(pageId: number = pageCurrent.value) {
  try {
    const response = await form.value.get(`/utils/message-loading?page=${pageId}`);
    pageCurrent.value = pageId;
    pages.value.total = response.data.data.total;
    pages.value.last = response.data.data.last_page;
    valuesTable.value = response.data.data.data;
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
  }
}

fetchMessages();

async function submit() {
  try {
    loadingSave.value = true;
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
    loadingSave.value = false
  }
}

async function remove(id: number) {
  try {
    const response = await form.value.delete(`/utils/message-loading/${id}`);
    console.log(response);
    toast({
      title: i18n.global.t("success"),
      description:  i18n.global.t(response.data.message),
      duration:3000,
    });
    await fetchMessages();
  } catch (error) {
    toast({
      title: i18n.global.t("error"),
      description:  i18n.global.t(error.response.data.message),
      duration:3000,
      variant:'destructive'
    });
    console.error("Erro ao remover mensagem:", error);
  }
}

async function edit(id) {
  try {
    loading.value = true
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
  }
}

function openModal(id){
  editId.value = id;
  showModal.value = true;
}
</script>


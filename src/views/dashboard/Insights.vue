<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">MyElevate Insights</h2>
        <p class="text-muted-foreground">
          Gerencie os insights e edite informações.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CreateDialogComponent :reload="fetchMessages" />
      </div>
    </div>

    <Card>
      <CardContent class="py-4 flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row gap-2 justify-end">
          <div class="grid w-full max-w-sm items-center gap-1.5">
            <Input
              type="search"
              class="sm:max-w-sm w-full"
              placeholder="Pesquisar"
              v-model="search"
            />
          </div>
          <Button v-if="search" size="icon" variant="ghost" @click="clearSearch">
            <X />
          </Button>
          <Button @click="fetchMessages()">
            Buscar
          </Button>
        </div>

        <Table class="w-full overflow-hidden">
          <TableHeader>
            <TableRow>
              <TableHead>Texto</TableHead>
              <TableHead>Assinatura</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <transition-group
              appear
              enter-active-class="enter-active"
              leave-active-class="leave-active"
              enter-from-class="enter"
              enter-to-class="enter-to"
              leave-from-class="leave"
              leave-to-class="leave-to"
            >
              <TableRow v-for="(row, index) in valuesTable" :key="row.id" :style="`--delay: ${getMs(index)}`">
                <TableCell>
                  {{ row.message }}
                </TableCell>
                <TableCell>
                  {{ row.signature }}
                </TableCell>
                <TableCell>
                  <div class="flex flex-nowrap">
                    <EditDialogComponent :row="row" :reload="fetchMessages" />
                    <DestroyDialogComponent :reload="fetchMessages" :destroy="remove" :row="row" />
                  </div>
                </TableCell>
              </TableRow>
            </transition-group>
          </TableBody>
        </Table>
      </CardContent>

      <CardFooter>
        <CustomPagination
          :select-page="fetchMessages"
          :pages="pages"
          :per-pages="perPage"
          @update:perPages="(value) => perPage = value"
        />
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import {h, onMounted, ref, watch} from "vue";
import { Button } from "@/components/ui/button";
import Insights from "@/services/insights";
import { X } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast";
import i18n from "@/i18n";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CreateDialogComponent from "@/components/insights/CreateDialogComponent.vue";
import {getMs} from "@/filters/formatNumbers";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import EditDialogComponent from "@/components/insights/EditDialogComponent.vue";

const { toast } = useToast();

interface Insight {
  id: number;
  message: string;
  signature: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

const valuesTable = ref<Insight[]>([]);
const search = ref(null);
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const perPage = ref(10);
const isLoading = ref(true);

async function fetchMessages(pageId: number = pages.value.current) {
  isLoading.value = true;

  try {
    const data = await Insights.index({
      page: pageId,
      search: [{ message: search.value }],
      orderBy: "id",
      orderDirection: "desc",
      per_page: perPage.value,
    })

    pages.value.current = data.data.current_page;
    pages.value.total = data.data.total;
    pages.value.last = data.data.last_page;
    valuesTable.value = data.data.data;
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
  }

  isLoading.value = false;
}

watch(perPage,()=>fetchMessages(1))

async function remove(id: number) {
  try {
    const data = await Insights.destroy(id)
    toast({
      title: i18n.global.t("success"),
      description: i18n.global.t(data.message),
      duration: 3000,
    });
  } catch (error) {
    toast({
      title: i18n.global.t("error"),
      description: i18n.global.t(error.response.data.message),
      duration: 3000,
      variant: "destructive",
    });
  }
}

function clearSearch (e: Event) {
  e.preventDefault();
  search.value = null;
  fetchMessages();
}

onMounted(() => fetchMessages());
</script>

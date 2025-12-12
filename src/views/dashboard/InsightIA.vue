<script setup lang="ts">
import { h, onMounted, ref } from "vue";
import CustomAccordionDataTable from "@/components/custom/CustomAccordionDataTable.vue";
import { Badge } from "@/components/ui/badge";
import IntelligenceArtificial from "@/services/intelligenceArtificial";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import CustomStarScore from "@/components/custom/CustomStarScore.vue";

const loading = ref(true);
const insightsData = ref([]);

const selectedMessages = ref([]);
const isHistoryDialogOpen = ref(false);

const columns = [
  {
    accessorKey: 'chat.title',
    header: 'Insight',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.chat.title),
  },
  {
    accessorKey: 'created_at',
    header: 'Data',
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return h('span', date.toLocaleDateString('pt-BR'));
    },
  }
];

const pagination = ref({
  current: 1,
  total: 0,
  last: 1,
});

const perPage = ref('10');

const fetchInsight = async (page: number = 1, itemsPerPage: string = '10') => {
  loading.value = true;
  try {
    const response = await IntelligenceArtificial.index();
    insightsData.value = response.data.data;
    pagination.value.total = insightsData.value.length;
    pagination.value.last = Math.ceil(insightsData.value.length / parseInt(itemsPerPage));
    pagination.value.current = page;
  } catch (error) {
    console.error("Erro ao buscar insights da IA:", error);
    insightsData.value = [];
    pagination.value.total = 0;
    pagination.value.last = 1;
  } finally {
    loading.value = false;
  }
};

const showHistory = (messages) => {
  selectedMessages.value = messages;
  isHistoryDialogOpen.value = true;
};

const selectPage = (page: number) => {
  fetchInsight(page, perPage.value);
};

const updatePerPage = (value: string) => {
  perPage.value = value;
  fetchInsight(1, value);
};

onMounted(() => {
  fetchInsight();
});
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Insights da IA</h2>
        <p class="text-muted-foreground">
          Veja os insights e planeje novos passos.
        </p>
      </div>
    </div>
    <div>
      <CustomAccordionDataTable
        :columns="columns"
        :data="insightsData"
        :loading="loading"
        :pages="pagination"
        :per_pages="perPage"
        :select-page="selectPage"
        @update:perPages="updatePerPage"
      >
        <template #accordion-content="{ row }">
          <div class="p-4 bg-muted/30 rounded-md space-y-4">
            <div>
              <p class="font-semibold mb-1">Palavras-chave:</p>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="key in row.keys" :key="key" variant="secondary">{{ key }}</Badge>
              </div>
            </div>
            <div>
              <div class="flex flex-wrap gap-2 items-center align-middle" >
                <p class="font-semibold mb-1">Feedback:</p> <CustomStarScore :readonly="true" :modelValue="row.score"/>
              </div>

              <p class="text-muted-foreground text-sm">{{ row.feedback ?? 'Nenhum feedback fornecido.' }}</p>
            </div>
            <div>
              <Button variant="outline" size="sm" @click="showHistory(row.chat.messages)">Ver histórico de conversa</Button>
            </div>
          </div>
        </template>
      </CustomAccordionDataTable>
    </div>
  </div>

  <Dialog :open="isHistoryDialogOpen" @update:open="isHistoryDialogOpen = $event">
    <DialogContent class="sm:max-w-[625px]">
      <DialogHeader>
      <DialogTitle>Histórico da Conversa</DialogTitle>
      </DialogHeader>
      <ScrollArea class="h-[50vh] w-full rounded-md border p-4">
        <div class="space-y-4">
           <div v-if="selectedMessages && selectedMessages.length">
                <div v-for="(message, index) in selectedMessages" :key="index" class="mb-2 p-3 rounded-md text-sm"
                     :class="message.role === 'user' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20'">
                  <p class="font-bold capitalize mb-1">{{ message.role === 'user' ? 'Usuário' : 'Assistente' }}</p>
                  <pre class="whitespace-pre-wrap font-sans">{{ message.message }}</pre>
                </div>
              </div>
              <p v-else class="text-muted-foreground text-center">Nenhuma mensagem disponível.</p>
        </div>
      </ScrollArea>
      <DialogFooter>
        <Button variant="outline" @click="isHistoryDialogOpen = false">Fechar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>


<style scoped>

</style>
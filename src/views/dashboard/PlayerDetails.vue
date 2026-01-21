<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" @click="$router.back()">
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Detalhes do Cliente</h2>
          <p class="text-muted-foreground">
            Detalhes e histórico do cliente {{ player?.name }}.
          </p>
        </div>
      </div>
    </div>
    <div v-if="player" class="flex gap-6 pt-4 sm:flex-row flex-col flex-wrap text-sm">
      <!-- Player Details Card -->
      <Card class="sm:w-80  ">
        <CardHeader>
          <CardTitle>Dados do Usuário</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 gap-4">
            <div>
              <div class="text-xs font-bold">Nome</div>
              <div class="text-sm">
                {{ player.name ?? 'Não Informado' }}
              </div>
            </div>

            <div>
              <div class="text-xs font-bold">Email</div>
              <div class="text-sm">
                {{ player.email }}
              </div>
            </div>

            <div>
              <div class="text-xs font-bold">Nascimento</div>
              <div class="text-sm">
                {{ $moment(player.birthday).format('DD/MM/YYYY') }} ({{ getAge(player.birthday) }} anos)
              </div>
            </div>

            <div>
              <div class="text-xs font-bold">Contato</div>
              <div class="text-sm">
                {{ formatPhoneNumber(player.phone) }}
              </div>
            </div>

            <div>
              <div class="text-xs font-bold">Cadastrado em</div>
              <div class="text-sm">
                {{ $moment(player.created_at).format('DD/MM/YYYY') }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- History Card -->
      <Card class="flex-1" >
        <CardHeader>
          <CardTitle>Histórico do Usuário</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex flex-col gap-2">
            <label for="history-filter" class="text-sm font-medium">Filtrar histórico por tipo:</label>
            <select
                id="history-filter"
                v-model="selectedEventType"
                class="block w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">Todos</option>
              <option v-for="option in filterOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div ref="timelineContainer" @scroll="handleScroll" class="relative h-[calc(100vh-24rem)] overflow-y-auto">
            <div class="absolute left-1/2 transform -translate-x-1/2 h-full border-l border-gray-300"></div>
            <div v-for="(event, index) in filteredHistory" :key="index" class="mb-8">
              <div class="flex items-center" :class="[isSameTypeAsPrevious(index) ? (getEventTypeSide(event.type) === 'left' ? 'justify-start' : 'justify-end') : (getEventTypeSide(event.type) === 'left' ? 'justify-start' : 'justify-end')]">
                <div :class="[getEventTypeSide(event.type) === 'left' ? 'w-5/12' : 'w-5/12 order-2']">
                  <Card :class="[getEventColor(event.type), 'shadow-md', 'cursor-pointer', 'hover:scale-105 transition-transform duration-200']" @click="showHistoryEventDetails(event)">
                    <CardContent class="p-3">
                      <p class="font-semibold">{{ event.title }}</p>
                      <p class="text-xs">{{ event.description }}</p>
                      <p class="text-xs mt-1 text-current opacity-75">{{ $moment(event.date).format('DD/MM/YYYY HH:mm') }}</p>
                    </CardContent>
                  </Card>
                </div>
                <div class="w-1/12 flex justify-center order-1">
                  <div class="w-3 h-3 bg-gray-500 rounded-full"></div>
                </div>
              </div>
            </div>
            <div v-if="isHistoryLoading" class="text-center p-4 text-sm text-muted-foreground">
              Carregando mais...
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    <div v-else-if="isLoading" class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
      <!-- Skeleton for Player Card -->
      <Card>
        <CardHeader>
          <Skeleton class="h-8 w-1/2" />
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="i in 5" :key="i" class="space-y-2">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-6 w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
      <!-- Skeleton for History Card -->
      <Card>
        <CardHeader>
          <Skeleton class="h-8 w-1/2" />
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex flex-col gap-2">
            <Skeleton class="h-4 w-1/4" />
            <Skeleton class="h-10 w-[200px]" />
          </div>
          <div class="space-y-4">
            <Skeleton class="h-16 w-full" />
            <Skeleton class="h-16 w-full" />
            <Skeleton class="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
     <div v-else class="text-center py-10">
      <p>Nenhum dado de jogador encontrado.</p>
    </div>

    <Dialog :open="isHistoryDetailDialogOpen" @update:open="isHistoryDetailDialogOpen = false">
      <DialogContent v-if="selectedHistoryEvent" :class="['transition-all duration-300', isPayloadVisible ? 'sm:max-w-3xl' : 'sm:max-w-[425px]']">
        <DialogHeader>
          <div class="flex justify-between items-start">
            <div>
              <DialogTitle>Detalhes do Evento</DialogTitle>
              <DialogDescription>
                Informações detalhadas sobre o evento de histórico.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div class="grid gap-4 pt-4 text-sm">
          <div>
            <div class="text-xs font-bold">Título</div>
            <div class="text-sm">
              {{ selectedHistoryEvent.title }}
            </div>
          </div>
          <div>
            <div class="text-xs font-bold">Tipo</div>
            <div class="text-sm">
              {{ selectedHistoryEvent.type }}
            </div>
          </div>
          <div>
            <div class="text-xs font-bold">Data</div>
            <div class="text-sm">
              {{ $moment(selectedHistoryEvent.date).format('DD/MM/YYYY HH:mm:ss') }}
            </div>
          </div>
          <div>
            <div class="text-xs font-bold">Descrição</div>
            <div class="text-sm">
              {{ selectedHistoryEvent.description }}
            </div>
          </div>
          <Button
              v-if="selectedHistoryEvent.payload"
              variant="outline"
              size="sm"
              @click="isPayloadVisible = !isPayloadVisible"
          >
            <Code class="h-4 w-4 mr-2" />
            {{ isPayloadVisible ? 'Ocultar' : 'Ver' }} Payload
          </Button>
        </div>

        <div v-if="isPayloadVisible && selectedHistoryEvent.payload" class="mt-4">
          <div class="text-xs font-bold mb-2">Payload</div>
          <pre class="bg-gray-900 text-white p-4 rounded-md text-xs overflow-x-auto"><code>{{ JSON.stringify(selectedHistoryEvent.payload, null, 2) }}</code></pre>
        </div>

        <DialogFooter>
          <Button @click="isHistoryDetailDialogOpen = false">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import {ChevronLeft, Code} from "lucide-vue-next";
import Players from "@/services/players";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceStore } from "@/stores/workspace";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'


const route = useRoute();
const player = ref();
const history = ref([]);
const isLoading = ref(true);
const isHistoryLoading = ref(false);
const currentPage = ref(1);
const lastPage = ref(1);
const timelineContainer = ref(null);

const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

const isHistoryDetailDialogOpen = ref(false);
const selectedHistoryEvent = ref(null);
const isPayloadVisible = ref(false);

const showHistoryEventDetails = (event) => {
  selectedHistoryEvent.value = event;
  isPayloadVisible.value = false;
  isHistoryDetailDialogOpen.value = true;
};

const selectedEventType = ref('all');

const filterOptions = computed(() => {
  const uniqueTypes = new Set(history.value.map(event => event.type));
  const options = Array.from(uniqueTypes).map(type => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '), // Basic capitalization and underscore replacement
  }));
  return options;
});

const filteredHistory = computed(() => {
  if (selectedEventType.value === 'all') {
    return history.value;
  }
  return history.value.filter(event => event.type === selectedEventType.value);
});

const eventTypeSideMap = ref({});
const availableSides = ['left', 'right'];
let sideIndex = 0;

const getEventTypeSide = (type) => {
  if (!eventTypeSideMap.value[type]) {
    eventTypeSideMap.value[type] = availableSides[sideIndex % availableSides.length];
    sideIndex++;
  }
  return eventTypeSideMap.value[type];
}

const isSameTypeAsPrevious = (index) => {
  if (index === 0) return false;
  return history.value[index].type === history.value[index - 1].type;
}

const hasMoreHistory = computed(() => currentPage.value < lastPage.value);

const fetchHistory = async (page) => {
  if (page > 1 && (isHistoryLoading.value || !hasMoreHistory.value)) {
    return;
  }

  if (page > 1) {
    isHistoryLoading.value = true;
  } else {
    isLoading.value = true;
  }

  try {
    const params = {
      filter_id: activeGroupProjectId,
      include: 'history',
      page: page,
    };
    // The API is likely structured to paginate the 'history' relationship
    const data = await Players.show(route.params.id as string, params);

    if (page === 1) {
      player.value = data;
      history.value = data.history.data;
    } else {
      // Append new history items to the existing list
      history.value.push(...data.history.data);
    }

    currentPage.value = data.history.current_page;
    lastPage.value = data.history.last_page;

  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
    isHistoryLoading.value = false;
  }
};

const handleScroll = () => {
  const el = timelineContainer.value;
  if (el) {
    const bottomOfWindow = el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
    if (bottomOfWindow && hasMoreHistory.value && !isHistoryLoading.value) {
      fetchHistory(currentPage.value + 1);
    }
  }
};

onMounted(() => {
  fetchHistory(1);
});


const getAge = (value: number) => {
  if (!value) return '';
  const today = new Date();
  const birthDate = new Date(value);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatPhoneNumber = (value: string) => {
  if (!value) return '';

  const cleaned = ('' + value).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return value;
}

const getEventColor = (type: string) => {
  switch (type) {
    case 'deposit':
      return 'bg-green-100 text-green-800';
    case 'withdrawal':
      return 'bg-red-100 text-red-800';
    case 'login':
      return 'bg-blue-100 text-blue-800';
    case 'profile_update':
      return 'bg-yellow-100 text-yellow-800';
    case 'segment':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
</script>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
</style>

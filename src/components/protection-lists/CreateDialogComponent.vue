<template>
  <Button @click="openDialog" class="bg-yellow-300 text-black hover:text-white dark:hover:text-black">
    <Plus />
    Nova Proteção
  </Button>

  <Dialog v-model:open="isDialog">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Nova Proteção</DialogTitle>
        <DialogDescription>
          Adicione um novo registro de proteção.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit">
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="gap-2">
              <Label for="player_id">Jogador</Label>
              <Popover v-model:open="openPlayer">
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    role="combobox"
                    :aria-expanded="openPlayer"
                    :disabled="!players"
                    class="w-full justify-between"
                  >
                    {{ form.player_id ? players.find((player) => player.id === form.player_id)?.name || form.player_id : "Selecione o jogador..." }}
                    <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-[300px] p-0">
                  <Command :filter-results="false">
                    <CommandInput placeholder="Buscar jogador..." @input="onSearchPlayer" />
                    <CommandEmpty v-if="!isLoadingPlayers && !players.length">Nenhum jogador encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandList @scroll="handleScroll">
                        <CommandItem
                          v-for="player in players"
                          :key="player.id"
                          :value="player.name"
                          @select="() => {
                            form.player_id = player.id
                            openPlayer = false
                          }"
                        >
                          <Check
                            :class="cn(
                              'mr-2 h-4 w-4',
                              form.player_id === player.id ? 'opacity-100' : 'opacity-0'
                            )"
                          />
                          {{ player.name }}
                        </CommandItem>
                        <div v-if="isLoadingPlayers" class="py-2 text-center text-sm text-muted-foreground">
                          Carregando...
                        </div>
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div class="gap-2">
              <Label for="dispatch_type">Tipo de Despacho</Label>
              <Select v-model="form.dispatch_type">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LP_ENTERED">LP_ENTERED</SelectItem>
                  <SelectItem value="LP_EXITED">LP_EXITED</SelectItem>
                  <SelectItem value="LP_UPDATED">LP_UPDATED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="gap-2">
              <Label for="event_type">Tipo de Evento</Label>
              <Select v-model="form.event_type">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forced">Forçada</SelectItem>
                  <SelectItem value="exclusion">Exclusão</SelectItem>
                  <SelectItem value="temp_suspension">Suspensão temporária</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="gap-2">
            <Label for="channel">Canal</Label>
            <Input v-model="form.channel" placeholder="Canal" />
          </div>

          <div class="gap-2 flex flex-col">
            <Label>Período de Proteção</Label>
            <DateRangePicker v-model="selectedRange" />
          </div>

          <div class="gap-2">
            <Label for="reason">Motivo</Label>
            <Textarea v-model="form.reason" placeholder="Motivo da proteção" />
          </div>

        </div>
        <DialogFooter>
          <Button type="submit" :disabled="isLoading">
            {{ isLoading ? "Salvando..." : "Salvar" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {ref} from "vue";
import {Check, ChevronsUpDown, Plus} from "lucide-vue-next";
import {useToast} from "@/components/ui/toast";
import ProtectionLists from "@/services/protectionLists";
import Projects from "@/services/projects";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils";
import {useWorkspaceStore} from "@/stores/workspace";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";

const props = defineProps<{ reload: () => Promise<void> }>();
const { toast } = useToast();

const isLoading = ref(false);
const isLoadingPlayers = ref(false);
const isDialog = ref(false);
const openPlayer = ref(false);
const openProject = ref(false);
const players = ref<{id: number, name: string}[]>([]);
const projects = ref<{id: number, name: string}[]>([]);
const workspaceStore = useWorkspaceStore();
const selectedRange = ref({ start: undefined, end: undefined });

const playerPages = ref({
  current: 1,
  last: 1
});
const playerSearch = ref('');
let searchTimeout: any = null;

const form = ref({
  player_id: null,
  project_id: null,
  dispatch_type: '',
  event_type: '',
  channel: '',
  start_at: '',
  end_at: '',
  reason: ''
});

const fetchPlayers = async (page = 1, append = false) => {
  if (isLoadingPlayers.value) return;
  
  isLoadingPlayers.value = true;
  try {
    const response = await ProtectionLists.getPlayersByProject(workspaceStore.activeGroupProject.project_id, {
      search: playerSearch.value,
      per_page: 15,
      page: page,
      filter_id: workspaceStore.activeGroupProject.id
    });

    if (append) {
      players.value = [...players.value, ...response.data];
    } else {
      players.value = response.data;
    }

    playerPages.value = {
      current: response.current_page,
      last: response.last_page
    };
  } catch (error) {
    console.error(error);
  } finally {
    isLoadingPlayers.value = false;
  }
}

const onSearchPlayer = (e: any) => {
  playerSearch.value = e.target.value;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchPlayers(1, false);
  }, 500);
}

const handleScroll = (e: any) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target;
  if (scrollTop + clientHeight >= scrollHeight - 5) {
    if (playerPages.value.current < playerPages.value.last && !isLoadingPlayers.value) {
      fetchPlayers(playerPages.value.current + 1, true);
    }
  }
}

const onSearchProject = async (e: any) => {
  const search = e.target.value;

  if (search.length > 2) {
    try {
      const response = await Projects.index({
        search: [search],
        per_page: 10,
      });
      projects.value = response.data;
    } catch (error) {
      console.error(error);
    }
  }
}

const fetchInitialData = async () => {
  try {
    const projectsRes = await Projects.index({ per_page: 10 });
    projects.value = projectsRes.data;
  } catch (error) {
      console.error(error);
  }
}


const onSubmit = async () => {
  isLoading.value = true

  try {
    const payload = {
      ...form.value,
      start_at: selectedRange.value.start?.toString(),
      end_at: selectedRange.value.end?.toString(),
    }

    await ProtectionLists.store(payload)
    await props.reload();
    isDialog.value = false;
    toast({
      title: "Sucesso",
      description: "Proteção salva com sucesso.",
    });
  } catch (error: any) {
    toast({
      title: "Ops!",
      description: error.response?.data?.message || "Erro ao salvar.",
      duration: 3000,
      variant: "destructive",
    });
  }

  isLoading.value = false;
}

const openDialog = async () => {
  form.value = {
    player_id: null,
    project_id: null,
    dispatch_type: '',
    event_type: '',
    channel: '',
    start_at: '',
    end_at: '',
    reason: ''
  }
  selectedRange.value = { start: undefined, end: undefined };
  players.value = [];
  playerSearch.value = '';
  playerPages.value = { current: 1, last: 1 };
  
  fetchPlayers();
  isDialog.value = true;
}
</script>

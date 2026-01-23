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
                    class="w-full justify-between"
                  >
                    {{ form.player_id ? players.find((player) => player.id === form.player_id)?.name || form.player_id : "Selecione o jogador..." }}
                    <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar jogador..." @input="onSearchPlayer" />
                    <CommandEmpty>Nenhum jogador encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
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
                          {{ player.name }} ({{ player.email }})
                        </CommandItem>
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div class="gap-2">
              <Label for="project_id">Projeto</Label>
              <Popover v-model:open="openProject">
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    role="combobox"
                    :aria-expanded="openProject"
                    class="w-full justify-between"
                  >
                    {{ form.project_id ? projects.find((project) => project.id === form.project_id)?.name || form.project_id : "Selecione o projeto..." }}
                    <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar projeto..." @input="onSearchProject" />
                    <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        <CommandItem
                          v-for="project in projects"
                          :key="project.id"
                          :value="project.name"
                          @select="() => {
                            form.project_id = project.id
                            openProject = false
                          }"
                        >
                          <Check
                            :class="cn(
                              'mr-2 h-4 w-4',
                              form.project_id === project.id ? 'opacity-100' : 'opacity-0'
                            )"
                          />
                          {{ project.name }}
                        </CommandItem>
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
                  <SelectItem value="forced">Forced</SelectItem>
                  <SelectItem value="exclusion">Exclusion</SelectItem>
                  <SelectItem value="temp_suspension">Temp Suspension</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="gap-2">
            <Label for="channel">Canal</Label>
            <Input v-model="form.channel" placeholder="Canal" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="gap-2">
              <Label for="start_at">Início</Label>
              <Input type="datetime-local" v-model="form.start_at" />
            </div>
            <div class="gap-2">
              <Label for="end_at">Fim</Label>
              <Input type="datetime-local" v-model="form.end_at" />
            </div>
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
import { ref } from "vue";
import { Plus, Check, ChevronsUpDown } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast";
import ProtectionLists from "@/services/protectionLists";
import Players from "@/services/players";
import Projects from "@/services/projects";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace";

const props = defineProps<{ reload: () => Promise<void> }>();
const { toast } = useToast();

const projectId = useWorkspaceStore().activeGroupProject!.id
const isLoading = ref(false);
const isDialog = ref(false);
const openPlayer = ref(false);
const openProject = ref(false);
const players = ref([]);
const projects = ref([]);

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

const onSearchPlayer = async (e: any) => {
  const search = e.target.value;
  if (search.length > 2) {
    try {
      const response = await Players.index({
        search: [search],
        perPage: 10,
        filter_id: projectId
      });

      players.value = response.data;
    } catch (error) {
        console.error(error);
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
    const [playersRes, projectsRes] = await Promise.all([
      Players.index({
        perPage: 10,
        filter_id: projectId
      }),
      Projects.index({ per_page: 10 })
    ]);

    players.value = playersRes.data;
    projects.value = projectsRes.data;
  } catch (error) {
      console.error(error);
  }
}


const onSubmit = async () => {
  isLoading.value = true

  try {
    await ProtectionLists.store(form.value)
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
  await fetchInitialData();
  isDialog.value = true;
}
</script>

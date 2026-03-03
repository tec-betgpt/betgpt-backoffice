<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {Loader2, Plus, Tag as TagIcon, X, Info, Globe, Bell} from 'lucide-vue-next';
import {useToast} from '@/components/ui/toast/use-toast';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from '@/components/ui/command';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import TagsService from '@/services/tags';
import {Tag} from '@/contracts/tag';
import {useWorkspaceStore} from "@/stores/workspace";

const props = defineProps<{
  playerId: string | number;
  projectId: string | number;
}>();

const { toast } = useToast();
const playerTags = ref<Tag[]>([]);
const availableTags = ref<Tag[]>([]);
const isLoading = ref(false);
const isSearching = ref(false);
const isAttaching = ref(false);
const isDetaching = ref<number | null>(null);
const open = ref(false);
const searchQuery = ref('');
const workspace = useWorkspaceStore();
let searchTimeout: any = null;

// Estados para Visualização da Tag
const isViewOpen = ref(false);
const selectedTag = ref<Tag | null>(null);

const handleViewTag = (tag: Tag) => {
  selectedTag.value = tag;
  isViewOpen.value = true;
};

const fetchPlayerTags = async () => {
  isLoading.value = true;
  try {
    const response = await TagsService.getPlayerTags(Number(props.playerId));
    playerTags.value = Array.isArray(response) ? response : (response.data || []);
  } catch (error) {
    console.error('Error fetching player tags:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchAvailableTags = async (search = '') => {
  isSearching.value = true;
  try {
    const response = await TagsService.index({
      search,
      filter_id: workspace.activeGroupProject.id,
      per_page: 20
    });
    // Filter out tags the player already has
    const allTags = Array.isArray(response) ? response : (response.data || []);
    availableTags.value = allTags.filter(
      (tag: Tag) => !playerTags.value.some(pt => pt.id === tag.id)
    );
  } catch (error) {
    console.error('Error fetching available tags:', error);
  } finally {
    isSearching.value = false;
  }
};

const handleAttach = async (tag: Tag) => {
  isAttaching.value = true;
  try {
    await TagsService.attach({
      tag_id: tag.id,
      taggable_id: Number(props.playerId),
      taggable_type: 'player'
    });
    toast({
      title: "Tag vinculada",
      description: `A tag "${tag.name}" foi vinculada ao jogador.`,
    });
    await fetchPlayerTags();
    open.value = false;
  } catch (error: any) {
    toast({
      title: "Erro ao vincular tag",
      description: error.response?.data?.message || "Ocorreu um erro.",
      variant: "destructive",
    });
  } finally {
    isAttaching.value = false;
  }
};

const handleDetach = async (tag: Tag) => {
  isDetaching.value = tag.id;
  try {
    await TagsService.detach({
      tag_id: tag.id,
      taggable_id: Number(props.playerId),
      taggable_type: 'player'
    });
    toast({
      title: "Tag desvinculada",
      description: `A tag "${tag.name}" foi removida do jogador.`,
    });
    await fetchPlayerTags();
  } catch (error: any) {
    toast({
      title: "Erro ao desvincular tag",
      description: error.response?.data?.message || "Ocorreu um erro.",
      variant: "destructive",
    });
  } finally {
    isDetaching.value = null;
  }
};

const onSearch = (e: any) => {
  const query = e.target.value;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchAvailableTags(query);
  }, 400);
};

onMounted(() => {
  fetchPlayerTags();
  fetchAvailableTags();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold flex items-center gap-2">
        <TagIcon class="h-4 w-4" />
        Tags do Jogador
      </h3>
      
      <Popover v-model:open="open">
        <PopoverTrigger as-child>
          <Button variant="outline" size="sm" class="h-8 gap-1">
            <Plus class="h-3.5 w-3.5" />
            Adicionar
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-[250px] p-0" align="end">
          <Command :filter-results="false">
            <CommandInput placeholder="Buscar tag..." @input="onSearch" />
            <CommandEmpty v-if="!isSearching && availableTags.length === 0">
              Nenhuma tag encontrada.
            </CommandEmpty>
            <div v-if="isSearching" class="flex items-center justify-center p-4">
              <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
            <CommandGroup v-else>
              <CommandList>
                <CommandItem
                  v-for="tag in availableTags"
                  :key="tag.id"
                  :value="tag.name"
                  @select="() => handleAttach(tag)"
                  class="flex items-center gap-2"
                >
                  <div 
                    class="w-2 h-2 rounded-full" 
                    :style="{ backgroundColor: tag.color || '#e2e8f0' }"
                  ></div>
                  <span>{{ tag.name }}</span>
                </CommandItem>
              </CommandList>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>

    <div class="flex flex-wrap gap-2 min-h-[2rem]">
      <div v-if="isLoading" class="flex gap-2">
        <div v-for="i in 3" :key="i" class="h-6 w-16 bg-muted animate-pulse rounded-full"></div>
      </div>
      <template v-else-if="playerTags.length > 0">
        <Badge
          v-for="tag in playerTags"
          :key="tag.id"
          variant="secondary"
          class="pl-2 pr-1 py-0.5 flex items-center gap-1 group transition-all cursor-pointer hover:opacity-80 active:scale-95 shadow-sm"
          :style="{ 
            backgroundColor: tag.color ? `${tag.color}20` : undefined,
            color: tag.color || undefined,
            borderColor: tag.color ? `${tag.color}40` : undefined
          }"
          @click="handleViewTag(tag)"
        >
          {{ tag.name }}
          <button 
            @click.stop="handleDetach(tag)" 
            class="ml-1 rounded-full hover:bg-black/10 p-0.5 transition-colors"
            :disabled="isDetaching === tag.id"
          >
            <Loader2 v-if="isDetaching === tag.id" class="h-3 w-3 animate-spin" />
            <X v-else class="h-3 w-3" />
          </button>
          <span v-if="tag.has_webhook" class="w-1.5 h-1.5 rounded-full bg-blue-500" title="Webhook ativo"></span>
        </Badge>
      </template>
      <div v-else class="text-xs text-muted-foreground italic py-1">
        Nenhuma tag vinculada.
      </div>
    </div>

    <!-- Dialog de Visualização -->
    <Dialog :open="isViewOpen" @update:open="isViewOpen = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <div class="flex items-center gap-3">
            <div 
              class="w-4 h-4 rounded-full" 
              :style="{ backgroundColor: selectedTag?.color || '#3b82f6' }"
            ></div>
            <DialogTitle>Informações da Tag</DialogTitle>
          </div>
          <DialogDescription>
            Detalhes técnicos da etiqueta aplicada ao jogador.
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedTag" class="space-y-4 py-2">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <span class="text-xs font-bold text-muted-foreground uppercase">Nome</span>
              <p class="text-sm font-medium">{{ selectedTag.name }}</p>
            </div>
            <div class="space-y-1">
              <span class="text-xs font-bold text-muted-foreground uppercase">Slug</span>
              <p class="text-sm font-mono text-muted-foreground">{{ selectedTag.slug }}</p>
            </div>
          </div>

          <div class="space-y-1">
            <span class="text-xs font-bold text-muted-foreground uppercase">Descrição</span>
            <p class="text-sm italic">
              {{ selectedTag.description || 'Sem descrição informada.' }}
            </p>
          </div>

          <div v-if="selectedTag.parent" class="space-y-1">
            <span class="text-xs font-bold text-muted-foreground uppercase">Tag Pai</span>
            <div class="flex items-center gap-2">
              <Badge variant="outline" class="text-[10px] uppercase">
                {{ selectedTag.parent.name }}
              </Badge>
            </div>
          </div>

          <Separator />

          <div class="flex flex-col gap-3">
             <div class="flex items-center gap-2 text-sm">
                <Globe class="h-4 w-4 text-muted-foreground" />
                <span class="font-medium">Status:</span>
                <Badge :variant="selectedTag.is_active ? 'default' : 'secondary'" class="h-5 text-[10px]">
                  {{ selectedTag.is_active ? 'Ativa' : 'Inativa' }}
                </Badge>
             </div>
             <div class="flex items-center gap-2 text-sm">
                <Bell class="h-4 w-4" :class="selectedTag.has_webhook ? 'text-blue-500' : 'text-muted-foreground'" />
                <span class="font-medium">Webhook:</span>
                <span :class="selectedTag.has_webhook ? 'text-blue-600 font-semibold' : 'text-muted-foreground'">
                  {{ selectedTag.has_webhook ? 'Habilitado' : 'Desabilitado' }}
                </span>
             </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" @click="isViewOpen = false">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>


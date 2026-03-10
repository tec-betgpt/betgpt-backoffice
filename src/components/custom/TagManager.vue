<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Loader2, Plus, Tag as TagIcon, X, Info, Globe, Bell } from 'lucide-vue-next';
import { useToast } from '@/components/ui/toast/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { Tag } from '@/contracts/tag';
import { useWorkspaceStore } from "@/stores/workspace";
import TagDialog from '@/components/tags/TagDialog.vue';

const props = defineProps<{
  modelId: string | number;
  modelType: string;
  projectId?: string | number;
}>();

const { toast } = useToast();
const modelTags = ref<Tag[]>([]);
const availableTags = ref<Tag[]>([]);
const isLoading = ref(false);
const isSearching = ref(false);
const isAttaching = ref(false);
const isDetaching = ref<number | null>(null);
const open = ref(false);
const searchQuery = ref('');
const workspace = useWorkspaceStore();
let searchTimeout: any = null;

const isViewOpen = ref(false);
const selectedTag = ref<Tag | null>(null);

// Estados para Criação de Tag
const isCreateDialogOpen = ref(false);
const tagToCreate = ref<Tag | null>(null);

const handleViewTag = (tag: Tag) => {
  selectedTag.value = tag;
  isViewOpen.value = true;
};

const openCreateDialog = () => {
  tagToCreate.value = {
    name: searchQuery.value,
    slug: '',
    description: '',
    color: '#3b82f6',
    is_active: true,
    //@ts-ignore
    has_webhook: false,
    metadata: { triggers: [] }
  } as unknown as Tag;
  isCreateDialogOpen.value = true;
};

const handleTagCreated = async () => {
  await fetchAvailableTags(searchQuery.value);
  // Tenta vincular automaticamente a tag recém criada
  const newTag = availableTags.value.find(t => t.name.toLowerCase() === searchQuery.value.toLowerCase());
  if (newTag) {
    await handleAttach(newTag);
  }
};

const fetchModelTags = async () => {
  isLoading.value = true;
  try {
    const response = await TagsService.getModelTags({ 
      model_type: props.modelType, 
      model_id: Number(props.modelId) 
    });
    modelTags.value = Array.isArray(response) ? response : (response.data || []);
  } catch (error) {
    console.error(`Error fetching ${props.modelType} tags:`, error);
  } finally {
    isLoading.value = false;
  }
};

const fetchAvailableTags = async (search = '') => {
  isSearching.value = true;
  try {
    const response = await TagsService.index({
      search,
      filter_id: props.projectId || workspace.activeGroupProject.id,
      per_page: 20
    });
    const allTags = Array.isArray(response) ? response : (response.data || []);
    availableTags.value = allTags.filter(
      (tag: Tag) => !modelTags.value.some(pt => pt.id === tag.id)
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
      taggable_id: Number(props.modelId),
      taggable_type: props.modelType
    });
    toast({
      title: "Tag vinculada",
      description: `A tag "${tag.name}" foi vinculada com sucesso.`,
    });
    await fetchModelTags();
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
      taggable_id: Number(props.modelId),
      taggable_type: props.modelType
    });
    toast({
      title: "Tag desvinculada",
      description: `A tag "${tag.name}" foi removida com sucesso.`,
    });
    await fetchModelTags();
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
  const query = typeof e === 'string' ? e : e.target?.value;
  if (query === undefined) return;
  
  searchQuery.value = query;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchAvailableTags(query);
  }, 400);
};

onMounted(() => {
  fetchModelTags();
  fetchAvailableTags();
});

watch(() => props.modelId, () => {
  fetchModelTags();
  fetchAvailableTags();
});
</script>

<template>
  <div class="flex flex-wrap gap-2 items-center">
    <div v-if="isLoading" class="flex gap-2">
      <div v-for="i in 2" :key="i" class="h-6 w-16 bg-muted animate-pulse rounded-full"></div>
    </div>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button variant="ghost" size="icon" class="h-7 w-7 rounded-full border border-dashed hover:border-primary">
          <Plus class="h-3.5 w-3.5" />
          <span class="sr-only">Adicionar tag</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[250px] p-0" align="start">
        <Command :filter-results="false">
          <CommandInput placeholder="Buscar tag..." @input="onSearch" />
          <CommandList>
            <div v-if="isSearching" class="flex items-center justify-center p-4">
              <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
            </div>

            <template v-else>
              <CommandGroup v-if="availableTags.length > 0">
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
              </CommandGroup>
              
              <div v-else class="flex flex-col items-center gap-2 py-6 px-4 text-center">
                <p class="text-sm text-muted-foreground">Nenhuma tag encontrada.</p>
                <Button
                    v-if="searchQuery"
                    variant="secondary"
                    size="sm"
                    class="h-7 text-xs"
                    @click="openCreateDialog"
                >
                  Criar tag "{{ searchQuery }}"
                </Button>
              </div>
            </template>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    <template v-if="modelTags.length > 0">
      <Badge
        v-for="tag in modelTags"
        :key="tag.id"
        variant="secondary"
        class="pl-2 pr-1 py-0.5 flex items-center gap-1 group transition-all cursor-pointer hover:opacity-80 active:scale-95 shadow-sm"
        :style="{ 
          backgroundColor: tag.color ? `${tag.color}20` : undefined,
          color: tag.color || undefined,
          borderColor: tag.color ? `${tag.color}40` : undefined
        }"
        @click.stop="handleViewTag(tag)"
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
      </Badge>
    </template>



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
            <p class="text-sm italic">{{ selectedTag.description || 'Sem descrição.' }}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" @click="isViewOpen = false">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Dialog de Criação -->
    <TagDialog
      v-model:open="isCreateDialogOpen"
      :tag="tagToCreate"
      @saved="handleTagCreated"
    />
  </div>
</template>
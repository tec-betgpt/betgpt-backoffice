<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { Loader2, Plus, Save, X } from 'lucide-vue-next';
import { useToast } from '@/components/ui/toast/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import TagsService from '@/services/tags';
import TargetAudience from '@/services/targetAudience';
import { Tag } from '@/contracts/tag';
import { useWorkspaceStore } from "@/stores/workspace";

const props = defineProps<{
  modelId: string | number;
  modelType: string;
  projectId?: string | number;
  existingTags?: Tag[];
}>();

const { toast } = useToast();
const workspace = useWorkspaceStore();

const activeProjectId = computed<string | number>(
  () => (props.projectId ?? workspace.activeGroupProject?.project_id) as string | number,
);

const categories = [
  {
    key: 'enter_add',
    field: 'enter_enter',
    label: 'Adicionar ao entrar',
    description: 'Tags aplicadas quando o player passa a pertencer ao segmento.',
  },
  {
    key: 'enter_remove',
    field: 'enter_exit',
    label: 'Remover ao entrar',
    description: 'Tags removidas quando o player passa a pertencer ao segmento.',
  },
  {
    key: 'exit_add',
    field: 'exit_enter',
    label: 'Adicionar ao sair',
    description: 'Tags aplicadas quando o player deixa de pertencer ao segmento.',
  },
  {
    key: 'exit_remove',
    field: 'exit_exit',
    label: 'Remover ao sair',
    description: 'Tags removidas quando o player deixa de pertencer ao segmento.',
  },
];

const tagsByCategory = reactive<Record<string, Tag[]>>({
  enter_add: [],
  enter_remove: [],
  exit_add: [],
  exit_remove: [],
});

const availableTags = ref<Tag[]>([]);
const isSearching = ref(false);
const isLoadingConfig = ref(false);
const isSaving = ref(false);
const searchQuery = ref('');
const openCategory = ref<string | null>(null);
const showDuplicateDialog = ref(false);
const pendingDuplicateTag = ref<Tag | null>(null);
let searchTimeout: any = null;

const allTagsMap = new Map<number, Tag>();

const resetCategories = () => {
  tagsByCategory.enter_add = [...(props.existingTags || [])];
  tagsByCategory.enter_remove = [];
  tagsByCategory.exit_add = [];
  tagsByCategory.exit_remove = [];
};

const fetchAllTags = async () => {
  try {
    const response = await TagsService.index({
      filter_id: workspace.activeGroupProject?.id,
      per_page: 200,
    });
    const list = Array.isArray(response) ? response : (response.data || []);
    allTagsMap.clear();
    list.forEach((tag: Tag) => allTagsMap.set(tag.id, tag));
  } catch (error) {
    console.error('Error fetching all tags:', error);
  }
};

const loadConfig = async () => {
  if (!props.modelId) return;
  isLoadingConfig.value = true;
  try {
    const response = await TargetAudience.getTags(props.modelId, activeProjectId.value);
    const config = response?.data ?? response ?? null;

    if (!config) {
      resetCategories();
      return;
    }

    const idsToTags = (ids: any) =>
      Array.isArray(ids)
        ? ids
            .map((id: number) => allTagsMap.get(id))
            .filter((t): t is Tag => Boolean(t))
        : [];

    tagsByCategory.enter_add = idsToTags(config.enter_enter);
    tagsByCategory.enter_remove = idsToTags(config.enter_exit);
    tagsByCategory.exit_add = idsToTags(config.exit_enter);
    tagsByCategory.exit_remove = idsToTags(config.exit_exit);
  } catch (error) {
    console.error('Error loading tag transitions:', error);
  } finally {
    isLoadingConfig.value = false;
  }
};

const fetchAvailableTags = async (search = '') => {
  isSearching.value = true;
  try {
    const response = await TagsService.index({
      search,
      filter_id: workspace.activeGroupProject?.id,
      per_page: 20,
    });
    availableTags.value = Array.isArray(response) ? response : (response.data || []);
  } catch (error) {
    console.error('Error fetching available tags:', error);
  } finally {
    isSearching.value = false;
  }
};

const onSearch = (e: any) => {
  const query = typeof e === 'string' ? e : e.target?.value;
  if (query === undefined) return;
  searchQuery.value = query;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchAvailableTags(query), 400);
};

const handlePopoverOpen = (categoryKey: string, value: boolean) => {
  openCategory.value = value ? categoryKey : null;
  if (value && availableTags.value.length === 0) {
    fetchAvailableTags();
  }
};

const availableFor = (categoryKey: string) =>
  availableTags.value.filter(
    (tag) => !tagsByCategory[categoryKey].some((t) => t.id === tag.id),
  );

const addTag = (categoryKey: string, tag: Tag) => {
  if (!tagsByCategory[categoryKey].some((t) => t.id === tag.id)) {
    tagsByCategory[categoryKey].push(tag);
  }
  openCategory.value = null;

  if (categoryKey === 'enter_add') {
    pendingDuplicateTag.value = tag;
    showDuplicateDialog.value = true;
  }
};

const confirmDuplicate = () => {
  const tag = pendingDuplicateTag.value;
  if (tag && !tagsByCategory.enter_remove.some((t) => t.id === tag.id)) {
    tagsByCategory.enter_remove.push(tag);
  }
  showDuplicateDialog.value = false;
  pendingDuplicateTag.value = null;
};

const cancelDuplicate = () => {
  showDuplicateDialog.value = false;
  pendingDuplicateTag.value = null;
};

const removeTag = (categoryKey: string, tag: Tag) => {
  tagsByCategory[categoryKey] = tagsByCategory[categoryKey].filter(
    (t) => t.id !== tag.id,
  );
};

const save = async () => {
  isSaving.value = true;
  try {
    await TargetAudience.updateTags(props.modelId, activeProjectId.value, {
      enter_enter: tagsByCategory.enter_add.map((t) => t.id),
      enter_exit: tagsByCategory.enter_remove.map((t) => t.id),
      exit_enter: tagsByCategory.exit_add.map((t) => t.id),
      exit_exit: tagsByCategory.exit_remove.map((t) => t.id),
    });
    toast({
      title: 'Sucesso',
      description: 'Tags de transição atualizadas com sucesso.',
    });
  } catch (error: any) {
    toast({
      title: 'Erro ao salvar tags',
      description: error.response?.data?.message || 'Não foi possível salvar as tags.',
      variant: 'destructive',
    });
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  await fetchAllTags();
  await loadConfig();
});

watch(
  () => props.modelId,
  async () => {
    await fetchAllTags();
    await loadConfig();
  },
);
</script>

<template>
  <div class="space-y-4">
    <div v-if="isLoadingConfig" class="flex items-center justify-center py-4">
      <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
    </div>

    <Tabs v-else default-value="enter_add" class="w-full">
      <TabsList class="grid w-full grid-cols-4 h-auto">
        <TabsTrigger
          v-for="cat in categories"
          :key="cat.key"
          :value="cat.key"
          class="text-xs px-1 py-2 h-auto whitespace-normal"
        >
          {{ cat.label }}
        </TabsTrigger>
      </TabsList>

      <TabsContent
        v-for="cat in categories"
        :key="cat.key"
        :value="cat.key"
        class="space-y-3 py-4"
      >
        <p class="text-sm text-muted-foreground">{{ cat.description }}</p>

        <div class="flex flex-wrap gap-2 items-center">
          <template v-if="tagsByCategory[cat.key].length > 0">
            <Badge
              v-for="tag in tagsByCategory[cat.key]"
              :key="tag.id"
              variant="secondary"
              class="pl-2 pr-1 py-0.5 flex items-center gap-1 shadow-sm"
              :style="{
                backgroundColor: tag.color ? `${tag.color}20` : undefined,
                color: tag.color || undefined,
                borderColor: tag.color ? `${tag.color}40` : undefined,
              }"
            >
              {{ tag.name }}
              <button
                @click="removeTag(cat.key, tag)"
                class="ml-1 rounded-full hover:bg-black/10 p-0.5 transition-colors"
              >
                <X class="h-3 w-3" />
              </button>
            </Badge>
          </template>
          <p v-else class="text-sm text-muted-foreground italic">
            Nenhuma tag configurada.
          </p>
        </div>

        <Popover
          :open="openCategory === cat.key"
          @update:open="(v) => handlePopoverOpen(cat.key, v)"
        >
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm">
              <Plus class="h-3.5 w-3.5 mr-1" />
              Adicionar tag
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[250px] p-0" align="start">
            <Command :filter-results="false">
              <CommandInput placeholder="Buscar tag..." @input="onSearch" />
              <CommandList>
                <div
                  v-if="isSearching"
                  class="flex items-center justify-center p-4"
                >
                  <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
                </div>

                <CommandEmpty v-else-if="availableFor(cat.key).length === 0">
                  Nenhuma tag encontrada.
                </CommandEmpty>

                <CommandGroup v-else>
                  <CommandItem
                    v-for="tag in availableFor(cat.key)"
                    :key="tag.id"
                    :value="tag.name"
                    @select="() => addTag(cat.key, tag)"
                    class="flex items-center gap-2"
                  >
                    <div
                      class="w-2 h-2 rounded-full"
                      :style="{ backgroundColor: tag.color || '#e2e8f0' }"
                    ></div>
                    <span>{{ tag.name }}</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </TabsContent>
    </Tabs>

    <div class="flex justify-end pt-2 border-t">
      <Button @click="save" :disabled="isSaving">
        <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
        <Save v-else class="mr-2 h-4 w-4" />
        Salvar
      </Button>
    </div>

    <AlertDialog :open="showDuplicateDialog" @update:open="showDuplicateDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Duplicar tag?</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja também remover a tag
            <strong>{{ pendingDuplicateTag?.name }}</strong> quando o player
            entrar no segmento?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="cancelDuplicate">Não</AlertDialogCancel>
          <AlertDialogAction @click="confirmDuplicate">Sim</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

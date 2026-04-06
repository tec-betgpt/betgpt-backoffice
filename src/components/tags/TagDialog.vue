<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? 'Editar Tag' : 'Nova Tag' }}</DialogTitle>
        <DialogDescription>
          {{ isEdit ? 'Atualize as informações da tag.' : 'Crie uma nova tag para organizar seus dados.' }}
        </DialogDescription>
      </DialogHeader>

      <Tabs default-value="general" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="triggers">Gatilhos</TabsTrigger>
        </TabsList>

        <form @submit.prevent="onSubmit">
          <TabsContent value="general" class="space-y-4 py-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="name">Nome *</Label>
                <Input id="name" v-model="form.name" @input="onNameInput" placeholder="Ex: VIP Gold" required />
              </div>
              <div class="space-y-2">
                <Label for="slug">Slug *</Label>
                <Input id="slug" v-model="form.slug" placeholder="ex-vip-gold" required />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="description">Descrição</Label>
              <Textarea id="description" v-model="form.description" placeholder="Descreva o propósito desta tag..." />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="color">Cor (Hex)</Label>
                <div class="flex gap-2">
                  <Input id="color" v-model="form.color" placeholder="#FF5733" class="flex-1" />
                  <div class="w-10 h-10 rounded border" :style="{ backgroundColor: form.color || '#e2e8f0' }"></div>
                </div>
              </div>
              <div class="space-y-2">
                <Label for="parent_id">Tag Pai</Label>
                <Popover v-model:open="openParent">
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      role="combobox"
                      :aria-expanded="openParent"
                      class="w-full justify-between"
                    >
                      {{ selectedParentName || "Nenhuma (Tag Raiz)" }}
                      <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-full p-0">
                    <Command :filter-results="false">
                      <CommandInput placeholder="Buscar tag pai..." @input="onSearchParent" />
                      <CommandEmpty v-if="!isLoadingParents && !parentTags.length">Nenhuma tag encontrada.</CommandEmpty>
                      <CommandGroup>
                        <CommandList>
                          <CommandItem
                            value=""
                            @select="() => {
                              form.parent_id = null
                              openParent = false
                            }"
                          >
                            <Check :class="cn('mr-2 h-4 w-4', !form.parent_id ? 'opacity-100' : 'opacity-0')" />
                            Nenhuma (Tag Raiz)
                          </CommandItem>
                          <CommandItem
                            v-for="tag in parentTags"
                            :key="tag.id"
                            :value="tag.name"
                            @select="() => {
                              form.parent_id = tag.id
                              openParent = false
                            }"
                          >
                            <Check :class="cn('mr-2 h-4 w-4', form.parent_id === tag.id ? 'opacity-100' : 'opacity-0')" />
                            {{ tag.name }}
                          </CommandItem>
                        </CommandList>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex items-center space-x-2">
                <Switch id="is_active" v-model="form.is_active" />
                <Label for="is_active">Tag Ativa</Label>
              </div>
            </div>

            <Separator />

            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <Switch id="has_webhook" v-model="form.has_webhook" />
                <Label for="has_webhook" class="font-medium">Habilitar Webhook</Label>
              </div>
              <p class="text-xs text-muted-foreground ml-9">
                Será usado o webhook cadastrado na conta.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="triggers" class="space-y-4 py-4">
            <div class="space-y-4">
              <div class="flex items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <Checkbox
                  id="sync_with_segments"
                  :checked="form.metadata.triggers.includes('sync_with_segments')"
                  @update:checked="(checked) => onTriggerChange('sync_with_segments', checked)"
                  :disabled="isSegmentsTriggerRequired"
                />
                <div class="grid gap-1.5 leading-none">
                  <Label for="sync_with_segments" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Sincronizar com Segmentos
                  </Label>
                  <p class="text-xs text-muted-foreground">
                    Ao vincular esta tag a um jogador, ele será automaticamente sincronizado com os segmentos que contem essa tag.
                  </p>
                </div>
              </div>
              <div class="flex items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <Checkbox
                  id="sync_with_crms"
                  :checked="form.metadata.triggers.includes('sync_with_crms')"
                  @update:checked="(checked) => onTriggerChange('sync_with_crms', checked)"
                />
                <div class="grid gap-1.5 leading-none">
                  <Label for="sync_with_crms" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Sincronizar com CRMs
                  </Label>
                  <p class="text-xs text-muted-foreground">
                    Os CRMs integrados nas fontes de dados com a sincronização ativa receberão automaticamente as informações, que serão sincronizadas com o perfil do usuário.
                  </p>
                </div>
              </div>
              <div class="flex items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <Checkbox
                  id="sync_with_protection_list"
                  :checked="form.metadata.triggers.includes('sync_with_protection_list')"
                  @update:checked="(checked) => onTriggerChange('sync_with_protection_list', checked)"
                />
                <div class="grid gap-1.5 leading-none w-full">
                  <Label for="sync_with_protection_list" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Sincronizar com Lista de Proteção
                  </Label>
                  <p class="text-xs text-muted-foreground">
                    Ao vincular esta tag a um jogador, ele será automaticamente sincronizado com a lista de proteção selecionada.
                  </p>

                  <div v-if="form.metadata.triggers.includes('sync_with_protection_list')" class="mt-4 space-y-4 border-t pt-4">
                    <div class="space-y-2">
                      <Label for="protection_list_channel">Canal</Label>
                      <Select v-model="form.metadata.protection_list_channel">
                        <SelectTrigger id="protection_list_channel">
                          <SelectValue placeholder="Selecione o canal..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="lp in tagConditions" :key="lp.id" :value="lp.id.toString()">
                            {{ lp.name }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <Checkbox
                  id="sync_remove_add_tag"
                  :checked="form.metadata.triggers.includes('sync_remove_add_tag')"
                  @update:checked="(checked) => onTriggerChange('sync_remove_add_tag', checked)"
                />
                <div class="grid gap-1.5 leading-none w-full">
                  <Label for="sync_remove_add_tag" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Adicionar Tag ao ser removido
                  </Label>
                  <p class="text-xs text-muted-foreground">
                    Quando esta tag for removida de um jogador, as tags selecionadas serão automaticamente adicionadas.
                  </p>

                  <div v-if="form.metadata.triggers.includes('sync_remove_add_tag')" class="mt-4 space-y-4 border-t pt-4">
                    <div class="space-y-2">
                      <Label>Selecione as tags</Label>
                      <div class="flex flex-wrap gap-2">
                        <Badge
                          v-for="tag in selectedTagsRemoveAdd"
                          :key="tag.id"
                          variant="secondary"
                          class="pl-2 pr-1 py-0.5 flex items-center gap-1"
                          :style="{ 
                            backgroundColor: tag.color ? `${tag.color}20` : undefined,
                            color: tag.color || undefined,
                            borderColor: tag.color ? `${tag.color}40` : undefined
                          }"
                        >
                          {{ tag.name }}
                          <button 
                            @click.stop="onRemoveTagFromSyncRemoveAdd(tag.id)" 
                            class="ml-1 rounded-full hover:bg-black/10 p-0.5 transition-colors"
                          >
                            <X class="h-3 w-3" />
                          </button>
                        </Badge>
                        <Popover>
                          <PopoverTrigger as-child>
                            <Button variant="outline" size="sm" class="h-7">
                              <Plus class="h-3 w-3 mr-1" />
                              Adicionar
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent class="w-[250px] p-0" align="start">
                            <Command :filter-results="false">
                              <CommandInput placeholder="Buscar tag..." @input="onSearchTagSelector" />
                              <CommandList>
                                <div v-if="isLoadingAvailableTags" class="flex items-center justify-center p-4">
                                  <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                                <template v-else>
                                  <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
                                  <CommandGroup v-if="availableTags.length > 0">
                                    <CommandItem
                                      v-for="tag in availableTags"
                                      :key="tag.id"
                                      :value="tag.name"
                                      @select="() => onAddTagToSyncRemoveAdd(tag)"
                                      class="flex items-center gap-2"
                                    >
                                      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: tag.color || '#e2e8f0' }"></div>
                                      <span>{{ tag.name }}</span>
                                    </CommandItem>
                                  </CommandGroup>
                                </template>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <Checkbox
                  id="sync_add_remove_tag"
                  :checked="form.metadata.triggers.includes('sync_add_remove_tag')"
                  @update:checked="(checked) => onTriggerChange('sync_add_remove_tag', checked)"
                />
                <div class="grid gap-1.5 leading-none w-full">
                  <Label for="sync_add_remove_tag" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Remover Tag ao ser adicionado
                  </Label>
                  <p class="text-xs text-muted-foreground">
                    Quando esta tag for adicionada a um jogador, as tags selecionadas serão automaticamente removidas.
                  </p>

                  <div v-if="form.metadata.triggers.includes('sync_add_remove_tag')" class="mt-4 space-y-4 border-t pt-4">
                    <div class="space-y-2">
                      <Label>Selecione as tags</Label>
                      <div class="flex flex-wrap gap-2">
                        <Badge
                          v-for="tag in selectedTagsAddRemove"
                          :key="tag.id"
                          variant="secondary"
                          class="pl-2 pr-1 py-0.5 flex items-center gap-1"
                          :style="{ 
                            backgroundColor: tag.color ? `${tag.color}20` : undefined,
                            color: tag.color || undefined,
                            borderColor: tag.color ? `${tag.color}40` : undefined
                          }"
                        >
                          {{ tag.name }}
                          <button 
                            @click.stop="onRemoveTagFromSyncAddRemove(tag.id)" 
                            class="ml-1 rounded-full hover:bg-black/10 p-0.5 transition-colors"
                          >
                            <X class="h-3 w-3" />
                          </button>
                        </Badge>
                        <Popover>
                          <PopoverTrigger as-child>
                            <Button variant="outline" size="sm" class="h-7">
                              <Plus class="h-3 w-3 mr-1" />
                              Adicionar
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent class="w-[250px] p-0" align="start">
                            <Command :filter-results="false">
                              <CommandInput placeholder="Buscar tag..." @input="onSearchTagSelector" />
                              <CommandList>
                                <div v-if="isLoadingAvailableTags" class="flex items-center justify-center p-4">
                                  <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                                <template v-else>
                                  <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
                                  <CommandGroup v-if="availableTags.length > 0">
                                    <CommandItem
                                      v-for="tag in availableTags"
                                      :key="tag.id"
                                      :value="tag.name"
                                      @select="() => onAddTagToSyncAddRemove(tag)"
                                      class="flex items-center gap-2"
                                    >
                                      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: tag.color || '#e2e8f0' }"></div>
                                      <span>{{ tag.name }}</span>
                                    </CommandItem>
                                  </CommandGroup>
                                </template>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <DialogFooter class="mt-4">
            <Button type="button" variant="outline" @click="isOpen = false" :disabled="isLoading">Cancelar</Button>
            <Button type="submit" :disabled="isLoading">
              <Spinner v-if="isLoading" class="mr-2 h-4 w-4" />
              {{ isEdit ? 'Salvar Alterações' : 'Criar Tag' }}
            </Button>
          </DialogFooter>
        </form>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Check, ChevronsUpDown, X, Plus, Loader2 } from 'lucide-vue-next';
import { useToast } from '@/components/ui/toast/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import TagsService from '@/services/tags';
import { Tag } from '@/contracts/tag';
import {useWorkspaceStore} from "@/stores/workspace";

const props = defineProps<{
  tag?: Tag | null;
  open: boolean;
}>();

const emit = defineEmits(['update:open', 'saved']);

const { toast } = useToast();
const isLoading = ref(false);
const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
});

const isEdit = computed(() => !!props.tag?.id);

const form = ref({
  name: '',
  slug: '',
  description: '',
  color: '#3b82f6',
  parent_id: null as number | null,
  is_active: true,
  has_webhook: false,
  metadata: {
    triggers: [] as string[],
    protection_list_channel: '',
    protection_list_sync_with_segments: false,
    sync_remove_add_tag: [] as number[],
    sync_add_remove_tag: [] as number[],
  }
});

const workspace = useWorkspaceStore()
const parentTags = ref<Tag[]>([]);
const isLoadingParents = ref(false);
const openParent = ref(false);
const searchParentQuery = ref('');
const tagConditions = ref<any[]>([]);
const availableTags = ref<Tag[]>([]);
const isLoadingAvailableTags = ref(false);
const selectedTagsRemoveAdd = ref<Tag[]>([]);
const selectedTagsAddRemove = ref<Tag[]>([]);
let searchTimeout: any = null;

const selectedParentName = computed(() => {
  if (!form.value.parent_id) return null;
  const found = parentTags.value.find(t => t.id === form.value.parent_id);
  if (found) return found.name;
  if (props.tag?.parent?.id === form.value.parent_id) return props.tag.parent.name;
  return "Tag Selecionada";
});

watch(() => props.open, (newVal) => {
  if (newVal) {
    if (props.tag) {
      form.value = {
        name: props.tag.name || '',
        slug: props.tag.slug || '',
        description: props.tag.description || '',
        color: props.tag.color || '#3b82f6',
        parent_id: props.tag.parent_id || null,
        is_active: props.tag.is_active ?? true,
        //@ts-ignore
        has_webhook: props.tag.has_webhook || false,
        metadata: {
          triggers: props.tag.metadata?.triggers || [],
          protection_list_channel: props.tag.metadata?.protection_list_channel || '',
          sync_remove_add_tag: props.tag.metadata?.sync_remove_add_tag || [],
          sync_add_remove_tag: props.tag.metadata?.sync_add_remove_tag || [],
        }
      };
      
      if (!isEdit.value && form.value.name && !form.value.slug) {
        onNameInput();
      }
    } else {
      form.value = {
        name: '',
        slug: '',
        description: '',
        color: '#3b82f6',
        parent_id: null,
        is_active: true,
        has_webhook: false,
        metadata: {
          triggers: [],
          protection_list_channel: '',
          protection_list_sync_with_segments: false,
          sync_remove_add_tag: [],
          sync_add_remove_tag: [],
        }
      };
    }
    fetchParentTags();
    fetchConditions();
    fetchAvailableTags();
  }
});

const fetchConditions = async () => {
  try {
    const response = await TagsService.getConditions();
    const data = response.data;
    tagConditions.value = data.lp || [];
  } catch (error) {
    console.error("Erro ao buscar condições:", error);
  }
}

const fetchAvailableTags = async () => {
  isLoadingAvailableTags.value = true;
  try {
    const response = await TagsService.index({
      filter_id: workspace.activeGroupProject.id,
      per_page: 100
    });
    const allTags = Array.isArray(response) ? response : (response.data || []);
    availableTags.value = allTags.filter((t: Tag) => t.id !== props.tag?.id);
    
    selectedTagsRemoveAdd.value = allTags.filter((t: Tag) => 
      form.value.metadata.sync_remove_add_tag.includes(t.id)
    );
    selectedTagsAddRemove.value = allTags.filter((t: Tag) => 
      form.value.metadata.sync_add_remove_tag.includes(t.id)
    );
  } catch (error) {
    console.error("Erro ao buscar tags disponíveis:", error);
  } finally {
    isLoadingAvailableTags.value = false;
  }
}

const onRemoveTagFromSyncRemoveAdd = (tagId: number) => {
  form.value.metadata.sync_remove_add_tag = form.value.metadata.sync_remove_add_tag.filter(id => id !== tagId);
  selectedTagsRemoveAdd.value = selectedTagsRemoveAdd.value.filter(t => t.id !== tagId);
};

const onRemoveTagFromSyncAddRemove = (tagId: number) => {
  form.value.metadata.sync_add_remove_tag = form.value.metadata.sync_add_remove_tag.filter(id => id !== tagId);
  selectedTagsAddRemove.value = selectedTagsAddRemove.value.filter(t => t.id !== tagId);
};

const onAddTagToSyncRemoveAdd = (tag: Tag) => {
  if (!form.value.metadata.sync_remove_add_tag.includes(tag.id)) {
    form.value.metadata.sync_remove_add_tag.push(tag.id);
    selectedTagsRemoveAdd.value.push(tag);
  }
};

const onAddTagToSyncAddRemove = (tag: Tag) => {
  if (!form.value.metadata.sync_add_remove_tag.includes(tag.id)) {
    form.value.metadata.sync_add_remove_tag.push(tag.id);
    selectedTagsAddRemove.value.push(tag);
  }
};

let searchTagTimeout: any = null;
const onSearchTagSelector = (e: any) => {
  const query = e.target.value;
  clearTimeout(searchTagTimeout);
  searchTagTimeout = setTimeout(() => {
    searchAvailableTags(query);
  }, 400);
};

const searchAvailableTags = async (search = '') => {
  isLoadingAvailableTags.value = true;
  try {
    const response = await TagsService.index({
      search,
      filter_id: workspace.activeGroupProject.id,
      per_page: 20
    });
    const allTags = Array.isArray(response) ? response : (response.data || []);
    availableTags.value = allTags.filter((t: Tag) => 
      t.id !== props.tag?.id &&
      !form.value.metadata.sync_remove_add_tag.includes(t.id) &&
      !form.value.metadata.sync_add_remove_tag.includes(t.id)
    );
  } catch (error) {
    console.error("Erro ao buscar tags:", error);
  } finally {
    isLoadingAvailableTags.value = false;
  }
};
const onNameInput = () => {
  if (!isEdit.value) {
    form.value.slug = form.value.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
};

const isSegmentsTriggerRequired = computed(() => {
  return form.value.metadata.triggers.includes('sync_with_protection_list');
});

const onTriggerChange = (trigger: string, checked: boolean) => {
  if (checked) {
    if (!form.value.metadata.triggers.includes(trigger)) {
      form.value.metadata.triggers.push(trigger);
    }
    if (trigger === 'sync_with_protection_list') {
      if (!form.value.metadata.triggers.includes('sync_with_segments')) {
        form.value.metadata.triggers.push('sync_with_segments');
      }
      form.value.metadata.protection_list_sync_with_segments = true;
    }
  } else {
    form.value.metadata.triggers = form.value.metadata.triggers.filter(t => t !== trigger);
  }
};

const fetchParentTags = async (search = '') => {
  isLoadingParents.value = true;
  try {
    const response = await TagsService.index({ search, per_page: 20,filter_id:workspace.activeGroupProject.id });
    // Filter out current tag if editing to prevent circular dependency
    parentTags.value = response.data.filter((t: Tag) => t.id !== props.tag?.id);
  } catch (error) {
    console.error(error);
  } finally {
    isLoadingParents.value = false;
  }
};

const onSearchParent = (e: any) => {
  const query = e.target.value;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchParentTags(query);
  }, 400);
};

const onSubmit = async () => {
  isLoading.value = true;
  try {
    if (form.value.metadata.sync_remove_add_tag.length > 0 && 
        !form.value.metadata.triggers.includes('sync_remove_add_tag')) {
      form.value.metadata.triggers.push('sync_remove_add_tag');
    }
    if (form.value.metadata.sync_add_remove_tag.length > 0 && 
        !form.value.metadata.triggers.includes('sync_add_remove_tag')) {
      form.value.metadata.triggers.push('sync_add_remove_tag');
    }

    const payload: any = {
      name: form.value.name,
      slug: form.value.slug,
      project_id: workspace.activeGroupProject.project_id,
      description: form.value.description,
      color: form.value.color,
      parent_id: form.value.parent_id,
      is_active: form.value.is_active,
      has_webhook: form.value.has_webhook,
      metadata: form.value.metadata,
    };

    if (isEdit.value && props.tag) {
      await TagsService.update(props.tag.id, payload);
    } else {
      await TagsService.store(payload);
    }

    toast({
      title: "Sucesso",
      description: `Tag ${isEdit.value ? 'atualizada' : 'criada'} com sucesso.`,
    });

    emit('saved');
    isOpen.value = false;
  } catch (error: any) {
    toast({
      title: "Erro",
      description: error.response?.data?.message || "Ocorreu um erro ao salvar a tag.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

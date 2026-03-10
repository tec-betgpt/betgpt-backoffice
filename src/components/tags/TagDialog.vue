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
import { Check, ChevronsUpDown } from 'lucide-vue-next';
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
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
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
    triggers: [] as string[]
  }
});

const workspace = useWorkspaceStore()
const parentTags = ref<Tag[]>([]);
const isLoadingParents = ref(false);
const openParent = ref(false);
const searchParentQuery = ref('');
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
          triggers: props.tag.metadata?.triggers || []
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
          triggers: []
        }
      };
    }
    fetchParentTags();
  }
});

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

const onTriggerChange = (trigger: string, checked: boolean) => {
  if (checked) {
    if (!form.value.metadata.triggers.includes(trigger)) {
      form.value.metadata.triggers.push(trigger);
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

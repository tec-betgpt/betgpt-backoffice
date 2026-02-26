<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex items-center justify-between">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Gerenciamento de Tags</h2>
        <p class="text-muted-foreground">
          Gerencie etiquetas, hierarquias e automações do sistema.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="isImportDialogOpen = true">
          <Upload class="mr-2 h-4 w-4" /> Importar
        </Button>
        <Button @click="openCreateDialog" class="bg-yellow-300 text-black hover:bg-yellow-400">
          <Plus class="mr-2 h-4 w-4" /> Nova Tag
        </Button>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <div class="relative flex-1 max-sm:w-full">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Buscar por nome ou slug..."
          class="pl-8"
          @input="onSearchInput"
        />
      </div>
      <Button variant="outline" @click="fetchTags" :disabled="loading">
        <RefreshCw :class="cn('h-4 w-4', loading && 'animate-spin')" />
      </Button>
    </div>

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[250px]">Nome</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Escopo</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead class="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading && !tags.length">
            <TableCell colspan="6" class="h-24 text-center">
              <div class="flex items-center justify-center gap-2">
                <Spinner class="h-4 w-4" />
                Carregando tags...
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-else-if="!tags.length">
            <TableCell colspan="6" class="h-24 text-center">
              Nenhuma tag encontrada.
            </TableCell>
          </TableRow>
          <TableRow v-for="tag in tags" :key="tag.id">
            <TableCell>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: tag.color || '#cbd5e1' }"></div>
                <span class="font-medium">{{ tag.name }}</span>
              </div>
              <p v-if="tag.parent" class="text-xs text-muted-foreground mt-0.5 ml-5">
                ↳ Subtag de: {{ tag.parent.name }}
              </p>
            </TableCell>
            <TableCell>
              <code class="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
                {{ tag.slug }}
              </code>
            </TableCell>
            <TableCell>
              <Badge :variant="tag.is_active ? 'default' : 'secondary'">
                {{ tag.is_active ? 'Ativa' : 'Inativa' }}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline" :class="!tag.project_id && 'border-yellow-500 text-yellow-600'">
                {{ tag.project_id ? 'Projeto' : 'Global' }}
              </Badge>
            </TableCell>
            <TableCell class="text-xs">
              {{ formatDate(tag.created_at) }}
            </TableCell>
            <TableCell class="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" class="h-8 w-8 p-0">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem @click="openEditDialog(tag)">
                    <Pencil class="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="confirmDelete(tag)" class="text-destructive">
                    <Trash2 class="mr-2 h-4 w-4" /> Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <Pagination
      v-if="pagination.last_page > 1"
      :total="pagination.total"
      :items-per-page="pagination.per_page"
      :current-page="pagination.current_page"
      @update:current-page="onPageChange"
    />

    <TagDialog
      v-model:open="isDialogOpen"
      :tag="selectedTag"
      @saved="fetchTags"
    />

    <ImportTagsDialog
      v-model:open="isImportDialogOpen"
      @imported="fetchTags"
    />

    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = false">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente a tag
            <strong>{{ tagToDelete?.name }}</strong> e removerá o vínculo de todas as entidades.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction @click="handleDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Deletar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Upload,
} from 'lucide-vue-next';
import { useToast } from '@/components/ui/toast/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import TagsService from '@/services/tags';
import TagDialog from '@/components/tags/TagDialog.vue';
import ImportTagsDialog from '@/components/tags/ImportTagsDialog.vue';
import { Tag } from '@/contracts/tag';
import moment from 'moment';
import {useWorkspaceStore} from "@/stores/workspace";

const { toast } = useToast();
const loading = ref(false);
const tags = ref<Tag[]>([]);
const searchQuery = ref('');
const pagination = ref({
  total: 0,
  per_page: 15,
  current_page: 1,
  last_page: 1,
});
const workspace = useWorkspaceStore()
const isDialogOpen = ref(false);
const isImportDialogOpen = ref(false);
const selectedTag = ref<Tag | null>(null);

const isDeleteDialogOpen = ref(false);
const tagToDelete = ref<Tag | null>(null);

let searchTimeout: any = null;

const fetchTags = async () => {
  loading.value = true;
  try {
    const response = await TagsService.index({
      search: searchQuery.value,
      page: pagination.value.current_page,
      per_page: pagination.value.per_page,
      filter_id: workspace.activeGroupProject.id
    });
    tags.value = response.data;
    pagination.value = {
      total: response.total,
      per_page: response.per_page,
      current_page: response.current_page,
      last_page: response.last_page,
    };
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro",
      description: "Falha ao carregar as tags.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const onSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.current_page = 1;
    fetchTags();
  }, 500);
};

const onPageChange = (page: number) => {
  pagination.value.current_page = page;
  fetchTags();
};

const openCreateDialog = () => {
  selectedTag.value = null;
  isDialogOpen.value = true;
};

const openEditDialog = (tag: Tag) => {
  selectedTag.value = tag;
  isDialogOpen.value = true;
};

const confirmDelete = (tag: Tag) => {
  tagToDelete.value = tag;
  isDeleteDialogOpen.value = true;
};

const handleDelete = async () => {
  if (!tagToDelete.value) return;
  try {
    await TagsService.destroy(tagToDelete.value.id);
    toast({
      title: "Sucesso",
      description: "Tag excluída com sucesso.",
    });
    fetchTags();
  } catch (error: any) {
    toast({
      title: "Erro",
      description: error.response?.data?.message || "Erro ao excluir a tag.",
      variant: "destructive",
    });
  } finally {
    isDeleteDialogOpen.value = false;
    tagToDelete.value = null;
  }
};

const formatDate = (date: string) => {
  return moment(date).format('DD/MM/YYYY HH:mm');
};

onMounted(() => {
  fetchTags();
});
</script>

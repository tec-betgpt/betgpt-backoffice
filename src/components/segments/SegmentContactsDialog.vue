<template>
  <Dialog v-model:open="isOpen" @update:open="(val) => !val && resetData()">
    <DialogContent class="sm:max-w-4xl max-h-[90vh] flex flex-col">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
            <UsersIcon class="h-5 w-5" />
          </div>
          <div>
            <DialogTitle>Contatos do Segmento</DialogTitle>
            <DialogDescription>
              Lista de jogadores vinculados às regras deste segmento.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="flex-1 overflow-hidden flex flex-col gap-4 py-4">
        <CustomDataTable
          :loading="isLoading"
          :data="contacts"
          :columns="columns"
          :update-text="setSearch"
          :search-fields="[
            { key: 'name', placeholder: 'Buscar por nome...' },
            { key: 'email', placeholder: 'Buscar por e-mail...' }
          ]"
          :find="() => fetchContacts(1)"
        />
      </div>

      <DialogFooter class="flex items-center justify-between border-t pt-4 gap-2">
        <div class="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            @click="handleExport"
            :disabled="isLoading || contacts.length === 0"
          >
            <Download class="h-4 w-4 md:mr-2" /> 
            <span class="hidden md:inline">Exportar Lista</span>
          </Button>
        </div>
        <div class="flex items-center gap-2">
          <Button 
            variant="secondary" 
            @click="isOpen = false"
          >
            Fechar
          </Button>
          <Button 
            v-if="hasMore" 
            @click="loadMore" 
            :disabled="isLoading"
          >
            <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            Carregar Mais
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, h, computed } from "vue";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UsersIcon, Download, Loader2Icon, Eye, ArrowDown, ArrowUp 
} from "lucide-vue-next";
import { CaretSortIcon } from "@radix-icons/vue";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import Segments from "@/services/segments";
import { createColumnHelper } from "@tanstack/vue-table";
import { useRouter, RouterLink } from "vue-router";

const router = useRouter();
const isOpen = ref(false);
const isLoading = ref(false);
const segmentId = ref<number | null>(null);
const contacts = ref<any[]>([]);
const hasMore = ref(false);
const currentPage = ref(1);
const searchValues = ref<Record<string, string>>({});
const orderField = ref('id');
const orderDirection = ref(false);

const columnHelper = createColumnHelper<any>();

const columns = [
  columnHelper.accessor("id", {
    header: () => createHeaderButton("ID", "id"),
    cell: ({ row }) => h("div", { class: "font-mono text-xs" }, row.original.id),
  }),
  columnHelper.accessor("name", {
    header: () => createHeaderButton("Nome", "name"),
    cell: ({ row }) => h("div", { class: "capitalize font-medium" }, row.original.name || "N/A"),
  }),
  columnHelper.accessor("email", {
    header: () => createHeaderButton("E-mail", "email"),
    cell: ({ row }) => h("div", { class: "text-slate-500" }, row.original.email),
  }),
  columnHelper.display({
    id: "actions",
    header: "Ações",
    cell: ({ row }) => h(
      RouterLink,
      {
        to: { name: "clients.show", params: { id: row.original.id } },
        target: "_blank",
        class: "inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors",
        title: "Ver detalhes do cliente",
      },
      { default: () => h(Eye, { class: "h-4 w-4" }) }
    ),
  }),
];

function createHeaderButton(label: string, key: string) {
  const active = orderField.value === key;
  return h(
    Button,
    {
      variant: "ghost",
      size: "sm",
      class: "-ml-3 h-8 data-[state=open]:bg-accent",
      onClick: () => {
        orderField.value = key;
        orderDirection.value = !orderDirection.value;
        fetchContacts(1);
      },
    },
    () => [
      label,
      h(active ? (orderDirection.value ? ArrowDown : ArrowUp) : CaretSortIcon, { class: "ml-2 h-4 w-4" }),
    ]
  );
}

const setSearch = (values: Record<string, string>) => {
  searchValues.value = values;
};

const fetchContacts = async (page: number) => {
  if (!segmentId.value) return;
  isLoading.value = true;

  try {
    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      if (searchValues.value[key]) acc[key] = searchValues.value[key];
      return acc;
    }, {} as any);

    const response = await Segments.contacts(segmentId.value, {
      page,
      perPage: 20,
      ...searchParams,
      orderBy: orderField.value,
      orderDirection: orderDirection.value ? "asc" : "desc",
    });

    if (page === 1) contacts.value = response.data.players;
    else contacts.value.push(...response.data.players);

    hasMore.value = response.data.hasMore;
    currentPage.value = page;
  } catch (error) {
    console.error("Error loading contacts:", error);
  } finally {
    isLoading.value = false;
  }
};

const loadMore = () => {
  if (hasMore.value && !isLoading.value) {
    fetchContacts(currentPage.value + 1);
  }
};

const open = (id: number, initialData?: any[]) => {
  segmentId.value = id;
  isOpen.value = true;
  if (initialData && initialData.length > 0) {
    contacts.value = initialData;
    currentPage.value = 1;
    hasMore.value = true;
  } else {
    fetchContacts(1);
  }
};

const resetData = () => {
  contacts.value = [];
  currentPage.value = 1;
  hasMore.value = false;
  searchValues.value = {};
};

const handleExport = () => {
  if (!segmentId.value) return;
  router.push({
    name: "exports",
    query: { type: "segments", target_id: segmentId.value },
  });
};

defineExpose({ open });
</script>

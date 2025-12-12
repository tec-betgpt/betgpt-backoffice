<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Atribuições</h2>
      <p class="text-muted-foreground">
        Os rastreamentos UTM de todos os segmentos.
      </p>
    </div>

    <div v-if="isLoading">
      <div class="grid gap-4 md:grid-cols-6 lg:grid-cols-6 mb-3">
        <Card class="col-span-3">
          <CardHeader class="pb-3">
            <Skeleton class="h-6 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton class="pl-5 h-80 w-full" />
          </CardContent>
        </Card>
        <Card class="col-span-3">
          <CardHeader class="pb-3">
            <Skeleton class="h-6 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton class="pl-5 h-80 w-full" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent class="py-4 flex flex-col gap-4">
          <Skeleton class="h-12 w-full" />
          <Skeleton class="h-96 w-full" />
        </CardContent>
      </Card>
    </div>

    <div v-else>
      <div class="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-3">
        <ChartBarComponent
          title="Cadastro por src e utm_source"
          :labels="chartRegistersUtmSource.labels"
          :series="chartRegistersUtmSource.series"
        />

        <ChartBarComponent
          title="Depósitos por src e utm_source"
          :labels="chartDepositsUtmSource.labels"
          :series="chartDepositsUtmSource.series"
        />
      </div>

      <Card>
        <CardContent class="py-4 flex flex-col gap-4">
          <CustomDataInfinite
              :loading="isLoading"
              :columns="columns"
              :data="utmTracks"
              :update-text="setSearch"
              :find="fetchUtmTracks"
              :has-more="hasMore"
              :current-page="pages.current"
              :search-fields="[
                { key: 'name', label: 'Nome', placeholder: 'Nome do Parâmetro' },
                {
                  key: 'value',
                  label: 'Valor',
                  placeholder: 'Valor do Parâmetro',
                },
              ]"
              @load-more="loadMore"
            >
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" class="ml-auto">
                  Tipo de parâmetro <ChevronDownIcon class="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                    :checked="typeFilter.includes('deposit')"
                    @update:checked="setType('deposit')"
                    class="capitalize"
                >
                  Depósito
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    :checked="typeFilter.includes('player')"
                    @update:checked="setType('player')"
                >
                  Cadastro
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CustomDataInfinite>
        </CardContent>
      </Card>
    </div>
  </div>

  <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
    <DialogContent class="sm:max-w-[625px]">
      <DialogHeader>
        <DialogTitle>Detalhes da Atribuição</DialogTitle>
      </DialogHeader>
      <div class="py-4">
        <div v-if="isDialogLoading" class="flex items-center justify-center h-48">
          <Spinner class="h-8 w-8" />
        </div>
        <div v-else-if="selectedTrackData" class="h-full">
          <pre  class="bg-gray-100 h-[600px] dark:bg-gray-800 p-4 rounded-md overflow-y-scroll">{{
              JSON.stringify(selectedTrackData, null, 2) }}
          </pre>
        </div>
         <div v-else class="text-center text-muted-foreground">
            Nenhum dado para exibir.
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="isDialogOpen = false">Fechar</Button>
      </DialogFooter>
    </DialogContent>

  </Dialog>
</template>

<script setup lang="ts">
import {h, onMounted, ref, watch} from "vue";
import {useToast} from "@/components/ui/toast/use-toast";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {ArrowDown, ArrowUp, ChevronDownIcon} from "lucide-vue-next";
import UtmTracks from "@/services/utmTracks";
import {createColumnHelper} from "@tanstack/vue-table";
import CustomDataInfinite from "@/components/custom/CustomDataInfinite.vue";
import {CaretSortIcon} from "@radix-icons/vue";
import {useWorkspaceStore} from "@/stores/workspace";
import moment from "moment";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import ChartBarComponent from "@/components/utm_tracks/ChartBarComponent.vue";
import {Skeleton} from "@/components/ui/skeleton";
import {Spinner} from "@/components/ui/spinner";

type UtmTrack = {
  id: number
  name: string
  value: string
  source_id: number
  source_type: string
  project_id: number
}

const { toast } = useToast();
const hasMore = ref(true);
const utmTracks = ref<UtmTrack[]>([]);
const chartRegistersUtmSource = ref<any>({
  labels: [],
  series: []
});
const chartDepositsUtmSource = ref<any>({
  labels: [],
  series: []
});
const isLoading = ref(true);
const pages = ref({
  current: 0,
  last: 0,
  total: 0
})
const typeFilter = ref<Array<String>>(["deposit", "player"]);

const isDialogOpen = ref(false);
const isDialogLoading = ref(false);
const selectedTrackData = ref(null);


watch(typeFilter.value, async () => {
  pages.value.current = 0;
  await fetchUtmTracks(pages.value.current);
})

const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const searchValues = ref<Record<string, string>>({});

const fetchUtmTracks = async (current = pages.value.current) => {
  isLoading.value = true;

  try {
    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      acc[key] = searchValues.value[key];
      return acc;
    }, {} as Record<string, string>);

    const { data } = await UtmTracks.index({
      page: current,
      ...searchParams,
      type: typeFilter.value,
      perPage: 100,
      orderBy: order.value ? order.value : "id",
      orderDirection: direction.value ? "asc" : "desc",
      filter_id: activeGroupProjectId,
    })

    utmTracks.value = data.utm_tracks;

    chartRegistersUtmSource.value.labels = data.registers_utm_tracks.labels
    chartRegistersUtmSource.value.series = [{
      name: 'utm_source',
      data: data.registers_utm_tracks.data || []
    }]

    chartDepositsUtmSource.value.labels = data.deposits_utm_tracks.labels;
    chartDepositsUtmSource.value.series = [{
      name: 'utm_source',
      data: data.deposits_utm_tracks.data || []
    }]
  } catch (_) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  }

  isLoading.value = false;
};

const openDialogAndFetchTrack = async (trackValue: string) => {
  isDialogOpen.value = true;
  isDialogLoading.value = true;
  selectedTrackData.value = null;
  try {
   const response = await UtmTracks.show({source_id: trackValue,filter_id:activeGroupProjectId});
    console.log(response.data);
   selectedTrackData.value = response.data;
    console.log(selectedTrackData.value);
  } catch (error) {
    console.error("Erro ao buscar detalhes da atribuição:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os detalhes da atribuição.",
      variant: "destructive",
    });
    isDialogOpen.value = false;
  } finally {
    isDialogLoading.value = false;
  }
};


const loadMore = async () => {
  pages.value.current = pages.value.current + 100
  await fetchUtmTracks(pages.value.current);
};

const setType = (type: any) => {
  const index = typeFilter.value.indexOf(type);
  if (index === -1) {
    typeFilter.value.push(type)
  } else {
    typeFilter.value.splice(index, 1);
  }
}

onMounted(async () => {
  await fetchUtmTracks();
})

const setSearch = (values: Record<string, string>) => {
  searchValues.value = values
};

const order = ref();
const direction = ref(false);
const columnHelper = createColumnHelper<any>();
function createHeaderButton(label: string, columnKey: string) {
  return h(
    Button,
    {
      variant: order.value === columnKey ? "default" : "ghost",
      onClick: () => {
        order.value = columnKey;
        direction.value = !direction.value;
        fetchUtmTracks();
      },
      class: "h-fit text-pretty my-1",
    },
    () => [
      label,
      h(
        order.value === columnKey
          ? direction.value
            ? ArrowDown
            : ArrowUp
          : CaretSortIcon,
        { class: "" }
      ),
    ]
  );
}

const columns = [
  columnHelper.accessor("type", {
    header: () => "Tipo",
    cell: ({ row }) =>
      h(
        "div",
        { class: "capitalize" },
        row.original.model_type == "Deposit" ? "Depósito" : "Cadastro"
      ),
  }),
  columnHelper.accessor("name", {
    header: () => createHeaderButton("Nome", "name"),
    cell: ({ row }) => h("div", {}, `${row.original.name}`),
  }),
  columnHelper.accessor("value", {
    header: () => createHeaderButton("Valor", "value"),
    cell: ({ row }) => h("div", {}, `${row.original.value}`),
  }),
  columnHelper.accessor("created_at", {
    header: () => createHeaderButton("Data", "created_at"),
    cell: ({ row }) =>
      h(
        "div",
        {},
        moment(row.original.created_at).format("DD/MM/YYYY HH:mm:ss")
      ),
  }),
  columnHelper.display({
    id: 'view',
    header: () => 'Visualizar',
    cell: ({ row }) => h(Button, {
      variant: 'outline',
      size: 'sm',
      onClick: () => openDialogAndFetchTrack(row.original.id)
    }, () => 'Visualizar'),
  }),
]
</script>

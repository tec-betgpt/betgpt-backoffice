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
        <Card class="">
          <CardHeader class="pb-3">
            <CardTitle>Cadastro por src e utm_source</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent class="h-[400px] w-full chart-container">
            <canvas id="registersChart"></canvas>
          </CardContent>
        </Card>

        <Card class="">
          <CardHeader class="pb-3">
            <CardTitle>Depósitos por src e utm_source</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent class="h-[400px] w-full chart-container">
            <canvas id="depositsChart"></canvas>
          </CardContent>
        </Card>
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
</template>

<script setup lang="ts">
import { ref, onMounted, h, watch, nextTick } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDownIcon, ArrowDown, ArrowUp } from "lucide-vue-next";
import UtmTracks from "@/services/utmTracks";
import { createColumnHelper } from "@tanstack/vue-table";
import CustomDataInfinite from "@/components/custom/CustomDataInfinite.vue";
import { CaretSortIcon } from "@radix-icons/vue";
import { useWorkspaceStore } from "@/stores/workspace";
import moment from "moment";
import { Chart, registerables } from "chart.js";
import {Separator} from "@/components/ui/separator";
import {Card, CardContent} from "@/components/ui/card";

type UtmTrack = {
  id: number
  name: string
  value: string
  source_id: number
  source_type: string
  project_id: number
}

Chart.register(...registerables);

const { toast } = useToast();
const hasMore = ref(true);
const currentPage = ref(0);
const utmTracks = ref<UtmTrack[]>([]);
const chartRegistersUtmSource = ref();
const chartDepositsUtmSource = ref();
const isLoading = ref(true);
const pages = ref({
  current: 0,
  last: 0,
  total: 0
})
const typeFilter = ref<Array<String>>(["deposit", "player"]);

watch(typeFilter.value, async () => {
  pages.value.current = 0;

  await fetchUtmTracks(pages.value.current);
  // await nextTick(() => renderChart());
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
    chartRegistersUtmSource.value = data.registers_utm_tracks;
    chartDepositsUtmSource.value = data.deposits_utm_tracks;
  } catch (_) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  }

  isLoading.value = false;

  nextTick(() => renderChart())
};

const loadMore = async () => {
  pages.value.current = pages.value.current + 100
  await fetchUtmTracks(pages.value.current);
  await nextTick(() => renderChart())
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

const renderChart = () => {
  const element = document.getElementById("registersChart") as HTMLCanvasElement
  const options: any = {
    indexAxis: "x",
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          maxRotation: 90,
          minRotation: 90,
          autoSkip: false,
        },
      },
    },
  }

  if (!isLoading.value && element) {
    const ctx = element.getContext("2d")
    const registersChart = new Chart(ctx!, {
      type: "bar",
      data: {
        labels: chartRegistersUtmSource.value.labels,
        datasets: [
          {
            label: "utm_source",
            data: chartRegistersUtmSource.value.data || [],
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderColor: "rgba(255, 255, 255, 1)",
            borderWidth: 1,
          },
        ],
      },
      options
    })

    const ctx2 = document.getElementById("depositsChart")!.getContext("2d") as HTMLCanvasElement
    const depositsChart = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: chartDepositsUtmSource.value.labels,
        datasets: [
          {
            label: "utm_source",
            data: chartDepositsUtmSource.value.data,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderColor: "rgba(255, 255, 255, 1)",
            borderWidth: 1,
          },
        ],
      },
      options
    })
  }
}

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
  columnHelper.accessor("id", {
    header({ column }) {
      return createHeaderButton("ID", "id");
    },
    cell: ({ row }) => h("div", {}, row.original.id),
  }),
  columnHelper.accessor("type", {
    header({ header }) {
      return "Tipo";
    },
    cell: ({ row }) =>
      h(
        "div",
        { class: "capitalize" },
        row.original.model_type == "Deposit" ? "Depósito" : "Cadastro"
      ),
  }),
  columnHelper.accessor("name", {
    header({ column }) {
      return createHeaderButton("Nome", "name");
    },
    cell: ({ row }) => h("div", {}, `${row.original.name}`),
  }),
  columnHelper.accessor("value", {
    header({ column }) {
      return createHeaderButton("Valor", "value");
    },
    cell: ({ row }) => h("div", {}, `${row.original.value}`),
  }),
  columnHelper.accessor("created_at", {
    header({ header }) {
      return createHeaderButton("Data", "created_at");
    },
    cell: ({ row }) =>
      h(
        "div",
        {},
        moment(row.original.created_at).format("DD/MM/YYYY HH:mm:ss")
      ),
  }),
]
</script>

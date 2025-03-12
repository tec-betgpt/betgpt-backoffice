<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
      <p class="text-muted-foreground">
        Métricas de um dia ou período específico.
      </p>
    </div>
    <div class="flex items-center justify-end mb-3">
      <div class="flex items-center max-[450px]:flex-col gap-2 w-full">
        <div class="flex gap-2 w-full">
          <DateRangePicker v-model="selectedRange" class="max-[450px]:flex-2" />
          <Button class="max-[450px]:flex-1" @click="applyFilter"
            >Filtrar</Button
          >
        </div>
      </div>
    </div>

    <div v-if="!hideMetricsDaily">
      <div v-if="loading" :class="responsiveClass">
        <Card v-for="n in 4" :key="n">
          <div class="p-4 rounded shadow">
            <div class="flex justify-between items-center mb-2">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-4 w-5" />
            </div>
            <Skeleton class="h-8 w-2/3 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </div>
        </Card>
      </div>
      <div :class="responsiveClass" v-else>
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">Jogadores Totais</CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ players.count }}</div>
            <p class="text-xs text-muted-foreground">
              +{{ players.change }} desde o último dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Jogadores Ativos Totais</CardTitle
            >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              class="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ activeNow.count }}</div>
            <p class="text-xs text-muted-foreground">
              +{{ activeNow.change }} desde o último dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">Depósitos 7D</CardTitle>
            <CreditCard class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(deposits.total / 100) }}
            </div>
            <p class="text-xs text-muted-foreground">
              {{
                deposits.percentage > 0
                  ? "+" + deposits.percentage
                  : deposits.percentage
              }}% desde a semana anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">Saques 7D</CardTitle>
            <HandCoins class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(withdraws.total / 100) }}
            </div>
            <p class="text-xs text-muted-foreground">
              {{
                withdraws.percentage > 0
                  ? "+" + withdraws.percentage
                  : withdraws.percentage
              }}% desde a semana anterior
            </p>
          </CardContent>
        </Card>
      </div>
    </div>

    <div>
      <div v-if="loading" class="grid gap-4 md:grid-cols-1 mb-3">
        <Card>
          <div class="col-span-4 p-4 rounded shadow">
            <div class="flex justify-between items-center mb-2">
              <Skeleton class="h-4 w-1/6" />
              <Skeleton class="h-4 w-5" />
            </div>
            <Skeleton class="h-8 w-2/3 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </div>
        </Card>
      </div>
      <div class="grid gap-1 md:grid-cols-1 mb-3" v-else>
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">Net Deposit</CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(deposits.total_net_deposits / 100) }}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div>
      <div v-if="loading" :class="responsiveClass">
        <Card v-for="n in 4" :key="n">
          <div class="p-4 rounded shadow">
            <div class="flex justify-between items-center mb-2">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-4 w-5" />
            </div>
            <Skeleton class="h-8 w-2/3 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </div>
        </Card>
      </div>
      <div :class="responsiveClass" v-else>
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Qtd. Depósitos Gerados</CardTitle
            >
            <CircleX class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              +{{ deposits.generated_deposits }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Total Depósitos Gerados</CardTitle
            >
            <CircleX class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(deposits.total_pending_deposits / 100) }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">Depósitos Pagos</CardTitle>
            <CircleCheck class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">+{{ deposits.paid_deposits }}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Total Depósitos Pagos</CardTitle
            >
            <CircleX class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(deposits.total_paid_deposits / 100) }}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div>
      <div v-if="loading" :class="responsiveClass">
        <Card v-for="n in 4" :key="n">
          <div class="p-4 rounded shadow">
            <div class="flex justify-between items-center mb-2">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-4 w-5" />
            </div>
            <Skeleton class="h-8 w-2/3 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </div>
        </Card>
      </div>
      <div :class="responsiveClass" v-else>
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Porcentagem Conversão Depósito</CardTitle
            >
            <CirclePercent class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ deposits.conversion_rate }}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Ticket Médio Depósito</CardTitle
            >
            <ChartLine class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(deposits.average_ticket / 100) }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Quantidade Primeiros Depósitantes</CardTitle
            >
            <PiggyBank class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              +{{ deposits.total_ftd_count }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Total Primeiros Depósitantes</CardTitle
            >
            <PiggyBank class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(deposits.total_ftd_amount / 100) }}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div>
      <div v-if="loading" :class="responsiveClass">
        <Card v-for="n in 4" :key="n">
          <div class="p-4 rounded shadow">
            <div class="flex justify-between items-center mb-2">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-4 w-5" />
            </div>
            <Skeleton class="h-8 w-2/3 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </div>
        </Card>
      </div>
      <div :class="responsiveClass" v-else>
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Qtd. Saques Gerados</CardTitle
            >
            <CircleX class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              +{{ withdraws.generated_withdraws }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Total Saques Gerados</CardTitle
            >
            <CircleX class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(withdraws.total_pending_withdraws / 100) }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">Qtd. Saques Pagos</CardTitle>
            <CircleCheck class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              +{{ withdraws.paid_withdraws }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Total Saques Pagos</CardTitle
            >
            <CircleX class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(withdraws.total_paid_withdraws / 100) }}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div>
      <div
        v-if="loading"
        class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2 mb-3"
      >
        <Card v-for="n in 4" :key="n">
          <div class="p-4 rounded shadow">
            <div class="flex justify-between items-center mb-2">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-4 w-5" />
            </div>
            <Skeleton class="h-8 w-2/3 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </div>
        </Card>
      </div>
      <div
        class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2 mb-3"
        v-else
      >
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Porcentagem Conversão Saques</CardTitle
            >
            <CirclePercent class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ withdraws.conversion_rate }}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Ticket Médio Saques</CardTitle
            >
            <ChartLine class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(withdraws.average_ticket / 100) }}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div>
      <div v-if="loading" :class="responsiveClass">
        <Card v-for="n in 4" :key="n">
          <div class="p-4 rounded shadow">
            <div class="flex justify-between items-center mb-2">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-4 w-5" />
            </div>
            <Skeleton class="h-8 w-2/3 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </div>
        </Card>
      </div>
      <div :class="responsiveClass" v-else>
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Quantidade de Cadastros do Dia</CardTitle
            >
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              +{{ players.registered_users_day }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Porcentagem FTD Geral</CardTitle
            >
            <CirclePercent class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ (players.ftd_general_percent / 100).toFixed(2) }}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Quantidade de Primeiros Depositantes dos Cadastros</CardTitle
            >
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              +{{ players.ftd_registered_users_count }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"
              >Porcentagem FTD Cadastros Depósitantes</CardTitle
            >
            <CirclePercent class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ (players.ftd_registered_users_percent / 100).toFixed(2) }}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div class="grid gap-4 md:gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Total de Depósitos</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-72 w-full" />
          </div>
          <div v-else>
            <BarChart
              :data="deposits.monthly_counts"
              :categories="['Total']"
              :index="'name'"
              :rounded-corners="4"
              :y-formatter="
                (tick) => (typeof tick === 'number' ? $toK(tick) : '')
              "
              :custom-tooltip="CustomChartTooltipRealPrice"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton class="h-5 w-full mb-1" v-if="loading" />
          <CardTitle v-else>Últimos Depósitos</CardTitle>
          <CardDescription>
            <Skeleton class="h-5 w-full" v-if="loading" />
            <span v-else>
              Tiveram {{ deposits.count30days }} depósitos nos últimos 30 dias.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-4">
            <div v-for="n in 6" :key="n" class="flex items-center space-x-4">
              <Skeleton class="h-9 w-9 rounded-full" />
              <div class="flex-1 space-y-1">
                <Skeleton class="h-4 w-1/2" />
                <Skeleton class="h-4 w-1/3" />
              </div>
              <Skeleton class="h-4 w-10" />
            </div>
          </div>
          <div v-else class="space-y-8">
            <div
              v-for="deposit in deposits.lasts"
              :key="deposit.id"
              class="flex items-center"
            >
              <Avatar class="h-9 w-9">
                <AvatarFallback
                  >{{ deposit.player.name.charAt(0)
                  }}{{ deposit.player.name.charAt(1) }}</AvatarFallback
                >
              </Avatar>
              <div class="ml-4 space-y-1">
                <p class="text-sm font-medium leading-none">
                  {{ deposit.player.name }}
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ deposit.player.email }}
                </p>
              </div>
              <div class="ml-auto text-right">
                <span class="font-medium"
                  >+{{ $toCurrency(deposit.value / 100) }}</span
                >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p class="text-xs text-muted-foreground text-right">
                        {{ $moment(deposit.created_at).fromNow() }}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {{
                          $moment(deposit.created_at).format(
                            "DD/MM/YYYY HH:mm:ss"
                          )
                        }}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart } from "@/components/ui/chart-bar";
import CustomChartTooltipRealPrice from "@/components/custom/CustomChartTooltipRealPrice.vue";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";
import {
  Users,
  CreditCard,
  HandCoins,
  CircleX,
  CircleCheck,
  CirclePercent,
  ChartLine,
  PiggyBank,
} from "lucide-vue-next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import DatePicker from "@/components/custom/DatePicker.vue";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
} from "@internationalized/date";
import { useToast } from "@/components/ui/toast/use-toast";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const responsiveClass =
  "grid gap-4 min-[720px]:grid-cols-2 md:gap-8  lg:grid-cols-3 xl:grid-cols-4 mb-3";
const { toast } = useToast();

const players = ref({
  count: 0,
  percentage: 0,
  ftd_general_percent: 0,
  ftd_registered_users_count: 0,
  ftd_registered_users_percent: 0,
  registered_users_day: 0,
});
const activeNow = ref({ count: 0, change: 0 });
const deposits = ref({
  total: 0,
  percentage: 0,
  last6: [],
  monthly_counts: [],
  average_ticket: 0,
  conversion_rate: 0,
  generated_deposits: 0,
  paid_deposits: 0,
  total_ftd_amount: 0,
  total_ftd_count: 0,
  total_net_deposits: 0,
  total_paid_deposits: 0,
  total_pending_deposits: 0,
});
const withdraws = ref({ total: 0, percentage: 0 });
const projects = ref([]);
const loading = ref(true);
const currentDate = today(getLocalTimeZone()).subtract({ days: 0 });
const startDate = currentDate.subtract({ days: 0 });
const selectedRange = ref({ start: startDate, end: currentDate });
const hideMetricsDaily = ref(false);
const monthlyCountsChart = ref(null);

import { useWorkspaceStore } from "@/stores/workspace";
const workspaceStore = useWorkspaceStore();

const applyFilter = async () => {
  loading.value = true;
  if (!workspaceStore.activeGroupProject?.id) {
    toast({
      title: "Erro",
      description: "Selecione um grupo ou projeto antes de filtrar.",
      variant: "destructive",
    });
    return;
  }

  try {
    if (
      selectedRange.value.start.toString() == selectedRange.value.end.toString()
    ) {
      hideMetricsDaily.value = false;
    } else {
      hideMetricsDaily.value = true;
    }

    const response = await api.get("/utils/home", {
      params: {
        filter_id: workspaceStore.activeGroupProject.id,
        start_date: selectedRange.value.start?.toString(),
        end_date: selectedRange.value.end?.toString(),
      },
    });

    players.value = response.data.data.players;
    activeNow.value = response.data.data.active_now;
    deposits.value = response.data.data.deposits;
    withdraws.value = response.data.data.withdraws;
  } catch (error) {
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }

  /*nextTick(() => {
    if (deposits.value && deposits.value.monthly_counts.length) {
      updateChart();
    }
  });*/
};

const updateChart = () => {
  const ctx = document.getElementById("monthlyCountsChart").getContext("2d");

  if (monthlyCountsChart.value) {
    monthlyCountsChart.value.destroy();
  }

  const labels = deposits.value.monthly_counts.map((item) => item.name);
  const data = deposits.value.monthly_counts.map((item) =>
    parseInt(item.Total)
  );

  monthlyCountsChart.value = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total",
          data: data,
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderColor: "rgba(255, 255, 255, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              let value = context.raw;
              return `Total: R$ ${(value / 100)
                .toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
                .slice(3)}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: function (value) {
              return (
                "R$ " +
                (value / 100)
                  .toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                  .slice(3)
              );
            },
          },
        },
      },
    },
  });
};

onMounted(async () => {
  await applyFilter();
});
</script>

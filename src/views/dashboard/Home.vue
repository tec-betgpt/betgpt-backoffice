<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid grid-cols-2 gap-4">
      <div class="">
        <h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p class="text-muted-foreground">
          Métricas de um dia ou período específico.
        </p>
      </div>

      <div class="flex items-center justify-end w-full">
        <div class="flex items-center max-[450px]:flex-col gap-2 justify-end">
          <div class="flex flex-col sm:flex-row gap-2 w-full ">
            <DateRangePicker v-model="selectedRange" />
            <Button class="max-[450px]:w-full" @click="applyFilter">Aplicar</Button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!hideMetricsDaily">
      <div v-if="loading" class="grid gap-4 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-4 mb-3">
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

      <div v-else class="grid gap-4 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-4 mb-3">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">
              Jogadores Totais
            </CardTitle>
            <Users class="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ players.count }}</div>
            <p class="text-xs text-muted-foreground">
              +{{ players.change }} desde o último dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">
              Jogadores Ativos Totais
            </CardTitle>
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
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">
              Depósitos 7D
            </CardTitle>
            <CreditCard class="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(deposits.total / 100) }}
            </div>
            <p class="text-xs text-muted-foreground">
              {{ deposits.percentage > 0 ? "+" + deposits.percentage : deposits.percentage }}% desde a semana anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Saques 7D
            </CardTitle>
            <HandCoins class="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(withdraws.total / 100) }}
            </div>
            <p class="text-xs text-muted-foreground">
              {{ withdraws.percentage > 0 ? "+" + withdraws.percentage : withdraws.percentage }}% desde a semana anterior
            </p>
          </CardContent>
        </Card>
      </div>
    </div>

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

    <div v-else class="grid gap-1 md:grid-cols-1 mb-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Net Deposit
          </CardTitle>
          <Users class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ $toCurrency(deposits.total_net_deposits / 100) }}
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="loading" class="grid gap-4 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-4 mb-3">
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

    <div v-else class="grid gap-4 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-4 mb-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Qtd. Depósitos Gerados
          </CardTitle>
          <CircleX class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            +{{ deposits.generated_deposits }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Total Depósitos Gerados
          </CardTitle>
          <CircleX class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ $toCurrency(deposits.total_pending_deposits / 100) }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">Depósitos Pagos</CardTitle>
          <CircleCheck class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            +{{ deposits.paid_deposits }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Total Depósitos Pagos
          </CardTitle>
          <CircleX class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ $toCurrency(deposits.total_paid_deposits / 100) }}
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="loading" class="grid gap-4 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-4 mb-3">
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

    <div v-else class="grid gap-4 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-4 mb-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Porcentagem Conversão Depósito
          </CardTitle>
          <CirclePercent class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ deposits.conversion_rate }}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Ticket Médio Depósito
          </CardTitle>
          <ChartLine class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ $toCurrency(deposits.average_ticket / 100) }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Quantidade Primeiros Depósitantes
          </CardTitle>
          <PiggyBank class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            +{{ deposits.total_ftd_count }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Total Primeiros Depósitantes
          </CardTitle>
          <PiggyBank class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ $toCurrency(deposits.total_ftd_amount / 100) }}
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="loading" class="grid gap-4 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-4 mb-3">
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
    <div v-else class="grid gap-4 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-4 mb-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Qtd. Saques Gerados
          </CardTitle>
          <CircleX class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            +{{ withdraws.generated_withdraws }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Total Saques Gerados
          </CardTitle>
          <CircleX class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ $toCurrency(withdraws.total_pending_withdraws / 100) }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Qtd. Saques Pagos
          </CardTitle>
          <CircleCheck class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            +{{ withdraws.paid_withdraws }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Total Saques Pagos
          </CardTitle>
          <CircleX class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ $toCurrency(withdraws.total_paid_withdraws / 100) }}
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="loading" class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2 mb-3">
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
    <div v-else class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2 mb-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Porcentagem Conversão Saques
          </CardTitle>
          <CirclePercent class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ withdraws.conversion_rate }}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Ticket Médio Saques
          </CardTitle>
          <ChartLine class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ $toCurrency(withdraws.average_ticket / 100) }}
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="loading" class="grid gap-4 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-4 mb-3">
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

    <div v-else class="grid gap-4 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-4 mb-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Quantidade de Cadastros do Dia
          </CardTitle>
          <Users class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            +{{ players.registered_users_day }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Porcentagem FTD Geral
          </CardTitle>
          <CirclePercent class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ (players.ftd_general_percent / 100).toFixed(2) }}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Quantidade de Primeiros Depositantes dos Cadastros
          </CardTitle>
          <Users class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            +{{ players.ftd_registered_users_count }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-xs font-medium">
            Porcentagem FTD Cadastros Depósitantes
          </CardTitle>
          <CirclePercent class="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ (players.ftd_registered_users_percent / 100).toFixed(2) }}%
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-2 mb-3">
      <Card>
        <CardHeader>
          <Skeleton class="h-6" v-if="loading" />
          <CardTitle v-else>Total de Depósitos</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-72 " />
          </div>
          <div v-else>
            <BarChart
              :data="deposits.monthly_counts"
              :categories="['Total']"
              :index="'name'"
              :rounded-corners="4"
              :y-formatter="(tick) => (typeof tick === 'number' ? $toK(tick) : '')"
              :custom-tooltip="CustomChartTooltip"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton class="h-5 mb-1" v-if="loading" />
          <CardTitle v-else>Últimos Depósitos</CardTitle>
          <CardDescription>
            <Skeleton class="h-5" v-if="loading" />
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
                <AvatarFallback>
                  {{ deposit.player.name ? deposit.player.name.charAt(0) : deposit.player.email.charAt(0).toUpperCase() }}
                  {{ deposit.player.name ? deposit.player.name.charAt(1) : deposit.player.email.charAt(1) }}
                </AvatarFallback>
              </Avatar>
              <div class="ml-4 space-y-1 w-1/2">
                <p class="text-sm font-medium leading-none truncate">
                  {{ deposit.player.name }}
                </p>
                <p class="text-sm text-muted-foreground truncate">
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

<script lang="ts">
import api from '@/services/api'
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
import { getLocalTimeZone, today } from "@internationalized/date";
import { useToast } from "@/components/ui/toast/use-toast";
import { Chart, registerables } from "chart.js";

const { toast } = useToast();
import { useWorkspaceStore } from "@/stores/workspace";

Chart.register(...registerables);

export default {
  computed: {
    CustomChartTooltip() {
      return CustomChartTooltipRealPrice
    }
  },

  components: {
    CustomChartTooltipRealPrice,
    DateRangePicker,
    Users,
    CreditCard,
    HandCoins,
    CircleX,
    CircleCheck,
    CirclePercent,
    ChartLine,
    PiggyBank,
  },

  data: () => ({
    workspaceStore: useWorkspaceStore(),
    players: {
      count: 0,
      percentage: 0,
      ftd_general_percent: 0,
      ftd_registered_users_count: 0,
      ftd_registered_users_percent: 0,
      registered_users_day: 0,
    },
    activeNow: { count: 0, change: 0 },
    deposits:{
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
    },
    withdraws:{ total: 0, percentage: 0 },
    projects: [],
    loading: true,
    currentDate: today(getLocalTimeZone()).subtract({ days: 0 }),
    startDate: today(getLocalTimeZone()).subtract({ days: 0 }),
    selectedRange: {},
    hideMetricsDaily: false,
    monthlyCountsChart: {},
  }),

  async mounted() {
    await this._start()
  },

  methods: {
    async _start () {
      this.selectedRange = { start: this.startDate, end: this.currentDate }
      await this.applyFilter();
    },

    async applyFilter () {
      this.loading = true

      if (!this.workspaceStore.activeGroupProject?.id) {
        toast({
          title: "Erro",
          description: "Selecione um grupo ou projeto antes de filtrar.",
          variant: "destructive",
        });
        return;
      }

      try {
        this.hideMetricsDaily = (this.selectedRange?.start.toString() === this.selectedRange?.end.toString())

        const { data } = await api.get("/utils/home", {
          params: {
            filter_id: this.workspaceStore.activeGroupProject.id,
            start_date: this.selectedRange.start?.toString(),
            end_date: this.selectedRange.end?.toString(),
          },
        });

        this.players = data.data.players;
        this.activeNow = data.data.active_now;
        this.deposits = data.data.deposits;
        this.withdraws = data.data.withdraws;
      } catch (_) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível aplicar o filtro selecionado.",
          variant: "destructive",
        })
      }
        this.loading = false;
    },
  },

  watch: {
    workspaceStore () {
      this.applyFilter()
    }
  }
}
</script>

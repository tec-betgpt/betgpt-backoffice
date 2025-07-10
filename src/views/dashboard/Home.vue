<template>
  <div class="view-home p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="banner-promo">
      <div class="inner">
        <div class="px-5 grid md:grid-cols-2 xs:grid-cols-1 gap-2 w-full">
          <div>
            <div class="text-xl font-semibold text-white">
              {{ greeting() }} {{ user ? user.first_name : '' }},
            </div>
            <div class="xs:text-xs md:text-sm text-white">
              Confira as principais atualizações
            </div>
          </div>

          <div class="flex justify-end items-center w-full">
            <div class="rounded bg-card w-full md:w-auto">
              <CustomDatePicker v-model="selectedRange"/>
            </div>
          </div>
        </div>
      </div>

      <div class="overlay"></div>
      <video-background
          src="/movies/mpeg/dashboard.mp4"
          poster="/movies/poster/dashboard.jpg"
          style="width: 100%; position:absolute; top: 0; left: 0; height: 100%;"
          :playsinline="true"
          :sources="[
          { src: '/movies/mpeg/dashboard_720p.mp4', res: 1200, autoplay: true, type: 'video/mp4' },
          { src: '/movies/mpeg/dashboard_480p.mp4', res: 800, autoplay: true, type: 'video/mp4' },
          { src: '/movies/mpeg/dashboard_360p.mp4', res: 600, autoplay: true, type: 'video/mp4' },
          { src: '/movies/mpeg/dashboard_240p.mp4', res: 400, autoplay: true, type: 'video/mp4' },
          { src: '/movies/webm/dashboard_720p.webm', res: 1200, autoplay: true, type: 'video/webm' },
          { src: '/movies/webm/dashboard_480p.webm', res: 800, autoplay: true, type: 'video/webm' },
          { src: '/movies/webm/dashboard_360p.webm', res: 600, autoplay: true, type: 'video/webm' },
          { src: '/movies/webm/dashboard_240p.webm', res: 400, autoplay: true, type: 'video/webm' },
        ]"
      />
    </div>

    <div v-if="loading">
      <Card class="w-full">
        <div class="p-4 rounded shadow">
          <div class="flex justify-between items-center mb-2">
            <Skeleton class="h-4 w-1/3" />
            <Skeleton class="h-4 w-5" />
          </div>
          <Skeleton class="h-8 w-2/3 mb-2" />
          <Skeleton class="h-4 w-1/2" />
        </div>
      </Card>

      <div class="grid gap-4 min-[720px]:grid-cols-2 xl:grid-cols-3 mb-3 mt-4">
        <Card v-for="n in 24" :key="n">
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
    </div>

    <div >

        <div>
          <h2>Arraste os itens para reordenar</h2>
          <TransitionGroup name="grid" tag="div" class="grid-container">
            <div
                v-for="item in cards"
                :key="item.id"
                class="grid-item"
                :class="{ 'drag-over': item.id === dragOverId }"
                draggable="true"
                @dragstart="onDragStart($event, item)"
                @dragover.prevent
                @dragenter="onDragEnter(item)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, item)"
            >
              {{ item.title }}
            </div>
          </TransitionGroup>
        </div>

<!--       User Information-->


<!--      Players Information-->
      <div class="pb-5 pt-10">
        <div class="text-xl">
          Visão Geral dos Jogadores
        </div>
        <div class="text-sm text-muted-foreground">
          Confira os últimos indicadores
        </div>
      </div>

      <div :class="hideMetricsDaily ? 'grid gap-4 md:grid-cols-3 sm:grid-cols-1' : 'grid gap-4 md:grid-cols-4 sm:grid-cols-1'">
        <Card v-if="hideMetricsDaily" @click="showAllRegister = !showAllRegister" class="item cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
          <CardHeader class="pb-2">
            <CardTitle class="flex-row flex justify-between items-center">
              <div class="flex justify-between items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <Users />
                </Avatar>
                <span class="text-xs font-medium ml-3">Total de Registros</span>
              </div>

              <GlossaryTooltipComponent description="Total de usuários registrados na base da Elevate" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number" v-if="showAllRegister">
              {{ players.count }}
            </div>
            <div class="number" v-else>
              {{ formatLargeNumber(players.count).content }}
              <span class="kind text-orange-300">
                {{ formatLargeNumber(players.count).separator }}
              </span>
            </div>
            <small class="text-xs">Quantidade</small>
            <div class="variation mt-3">
              <div class="value flex align-baseline justify-start items-center bg-green-700 text-green-200" v-if="players.change > 0">
                <ArrowUp class="h-4 w-4 mr-1" /> {{ players.change }}
              </div>
              <div class="value flex justify-start items-center bg-red-700 text-red-200" v-else>
                <ArrowDown class="h-4 w-4" /> {{ players.change }}
              </div>
              desde o último dia
            </div>
          </CardContent>
        </Card>

        <Card v-if="hideMetricsDaily" @click="showAllPlayersActive = !showAllPlayersActive" class="item cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
          <CardHeader class="pb-2">
            <CardTitle class="flex-row flex justify-between items-center">
              <div class="flex justify-between items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <UserRound />
                </Avatar>
                <span class="text-xs font-medium ml-3">Usuários Ativos</span>
              </div>

              <GlossaryTooltipComponent description="Total de usuários ativos com pelo menos um pagamento nos últimos 30 dias" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number" v-if="showAllPlayersActive">
              {{ activeNow.count }}
            </div>
            <div class="number" v-else>
              {{ formatLargeNumber(activeNow.count).content }}
              <span class="kind text-orange-300">
                {{ formatLargeNumber(activeNow.count).separator }}
              </span>
            </div>
            <div class="variation mt-3">
              <div class="value flex align-baseline justify-start items-center bg-green-700 text-green-200" v-if="activeNow.change > 0">
                <ArrowUp class="h-4 w-4 mr-1" /> {{ activeNow.change }}
              </div>
              <div class="value flex justify-start items-center bg-red-700 text-red-200" v-else>
                <ArrowDown class="h-4 w-4" /> {{ activeNow.change }}
              </div>
              desde o último dia
            </div>
          </CardContent>
        </Card>

        <Card class="item">
          <CardHeader class="pb-2">
            <CardTitle class="flex-row flex justify-between items-center">
              <div class="flex justify-between items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <<UserRoundPlus /> />
                </Avatar>
                <span class="text-xs font-medium ml-3">Novos Registros</span>
              </div>

              <GlossaryTooltipComponent description="Total de usuários que completaram o cadastro no sistema no periodo especifico" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              +{{ players.registered_users_day }}
            </div>
          </CardContent>
        </Card>

        <Card class="item">
          <CardHeader class="pb-2">
            <CardTitle class="flex-row flex justify-between items-center">
              <div class="flex justify-between items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <CirclePercent />
                </Avatar>
                <span class="text-xs font-medium ml-3">Taxa de Conversão Geral</span>
            </div>

            <GlossaryTooltipComponent description="Percentual de usuários cadastrados que realizaram uma primeira transação validada." />
          </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              {{ (players.ftd_general_percent / 100).toFixed(2) }}%
            </div>
          </CardContent>
        </Card>

        <Card class="item">
          <CardHeader class="pb-2">
            <CardTitle class="flex-row flex justify-between items-center">
              <div class="flex justify-between items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <Wallet />
                </Avatar>
                <span class="text-xs font-medium ml-3">Primeiros Depositantes</span>
              </div>

              <GlossaryTooltipComponent description="Usuários que realizaram sua primeira transação (compra, depósito ou equivalente) no mesmo dia do cadastro." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              +{{ players.ftd_registered_users_count }}
            </div>
          </CardContent>
        </Card>

        <Card class="item">
          <CardHeader class="pb-2">
            <CardTitle class="flex-row flex justify-between items-center">
              <div class="flex justify-between items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <CirclePercent />
                </Avatar>
                <span class="text-xs font-medium ml-3">Taxa de Conversão em D0</span>
              </div>

              <GlossaryTooltipComponent description="Percentual de usuários que realizaram sua primeira transação (compra, depósito ou equivalente) no mesmo dia do cadastro." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              {{ (players.ftd_registered_users_percent / 100).toFixed(2) }}%
            </div>
          </CardContent>
        </Card>
      </div>
<!--    Withdrawn Information-->
      <div class="pb-5 pt-10">
        <div class="text-xl">
          Visão Geral dos Saques
        </div>
        <div class="text-sm text-muted-foreground">
          Confira os últimos indicadores
        </div>
      </div>

      <div :class="hideMetricsDaily ? 'grid gap-4 md:grid-cols-3 sm:grid-cols-1' : 'grid gap-4 md:grid-cols-2 sm:grid-cols-1'">
        <Card class="item cursor-pointer hover:bg-gray-700" @click="showAllWithdrawsTotal7D = !showAllWithdrawsTotal7D" v-if="hideMetricsDaily">
          <CardHeader class="pb-2">
            <CardTitle>
              <div class="flex justify-start items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <CalendarArrowUp />
                </Avatar>
                <span class="text-xs font-medium ml-3">Saques 7D</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number" v-if="showAllWithdrawsTotal7D">
              {{ $toCurrency(withdraws.total / 100) }}
            </div>
            <div v-else class="number">
              {{ formatLargeNumber(withdraws.total / 100).content }}
              <span class="kind text-orange-300">
                {{ formatLargeNumber(withdraws.total / 100).separator }}
              </span>
            </div>

            <div class="variation mt-3">
              <div v-if="withdraws.percentage > 0" class="value flex align-baseline justify-start items-center bg-green-700 text-green-200">
                <ArrowUp class="h-4 w-4 mr-1" /> {{ withdraws.percentage }}%
              </div>
              <div v-else class="value flex justify-start items-center bg-red-700 text-red-200">
                <ArrowDown class="h-4 w-4" /> {{ withdraws.percentage }}%
              </div>
              desde a semana anterior
            </div>
          </CardContent>
        </Card>

        <Card class="item">
          <CardHeader class="pb-2">
            <CardTitle class="flex-row flex justify-between items-center">
              <div class="flex justify-between items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <ChartNoAxesColumn />
                </Avatar>
                <span class="text-xs font-medium ml-3">Ticket Médio de Saída</span>
              </div>

              <GlossaryTooltipComponent description="Valor médio por transação de saída processada." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              {{ $toCurrency(withdraws.average_ticket / 100) }}
            </div>
          </CardContent>
        </Card>

        <Card class="item">
          <CardHeader class="pb-2">
            <CardTitle class="flex-row flex justify-between items-center">
              <div class="flex justify-between items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <BadgeCheck />
                </Avatar>
                <span class="text-xs font-medium ml-3">Taxa de Aprovação</span>
              </div>

              <GlossaryTooltipComponent description="Taxa de aprovação de saídas solicitadas e saídas processadas" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              +{{ withdraws.generated_withdraws }}
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid mt-5 gap-4 md:grid-cols-2 sm:grid-cols-1">
        <Card class="item cursor-pointer hover:bg-gray-700" @click="showAllWithdrawsRequested = !showAllWithdrawsRequested">
          <CardHeader class="pb-2">
            <CardTitle class="flex-row flex justify-between items-center">
              <div class="flex justify-between items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <Check />
                </Avatar>
                <span class="text-xs font-medium ml-3">Saídas Solicitadas</span>
              </div>

              <GlossaryTooltipComponent description="Valor total de solicitações de retirada feitas pelos usuários." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              +{{ withdraws.generated_withdraws }}
            </div>
            <small class="text-xs">Quantidade</small>

            <div class="number" v-if="showAllWithdrawsRequested">
              {{ $toCurrency(withdraws.total_pending_withdraws / 100) }}
            </div>
            <div v-else class="number">
              {{ formatLargeNumber(withdraws.total_pending_withdraws / 100).content }}
              <span class="kind text-orange-300">
                {{ formatLargeNumber(withdraws.total_pending_withdraws / 100).separator }}
              </span>
            </div>
            <small class="text-xs">Total</small>
          </CardContent>
        </Card>

        <Card class="item cursor-pointer hover:bg-gray-700" @click="showAllWithdrawsProcessed = !showAllWithdrawsProcessed">
          <CardHeader class="pb-2">
            <CardTitle class="flex-row flex justify-between items-center">
              <div class="flex justify-between items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <BanknoteArrowUp />
                </Avatar>
                <span class="text-xs font-medium ml-3">Saídas Processadas</span>
              </div>

              <GlossaryTooltipComponent description="Valor total de saídas que foram processadas e pagas com sucesso." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              +{{ withdraws.paid_withdraws }}
            </div>
            <small class="text-xs">Quantidade</small>

            <div class="number " v-if="showAllWithdrawsProcessed">
              {{ $toCurrency(withdraws.total_paid_withdraws / 100) }}
            </div>
            <div v-else class="number">
              {{ formatLargeNumber(withdraws.total_paid_withdraws / 100).content }}
              <span class="kind text-orange-300">
                {{ formatLargeNumber(withdraws.total_paid_withdraws / 100).separator }}
              </span>
            </div>
            <small class="text-xs">Total</small>
          </CardContent>
        </Card>
      </div>
<!--     Retention-->
      <div class="pb-5 pt-10">
        <div class="text-xl">
          Retenção
        </div>
        <div class="text-sm text-muted-foreground">
          Veja os últimos indicadores e mais recentes
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mb-3">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="flex-row flex justify-between items-center">
              <div class="flex justify-between items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <Hourglass />
                </Avatar>
                <span class="text-xs font-medium ml-3">Tempo Médio de Retenção</span>
              </div>

              <GlossaryTooltipComponent description="Tempo médio entre a primeira transação do usuário e sua última transação." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl">
              {{ retention.time }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="flex-row flex justify-between items-center">
              <div class="flex justify-between items-center">
                <Avatar class="wrapper-avatar border-gray-900 h-9 w-9 p-2" shape="square">
                  <ChartNoAxesColumn />
                </Avatar>
                <span class="text-xs font-medium ml-3">Ticket Médio Pós-Ativação</span>
              </div>

              <GlossaryTooltipComponent description="Valor médio transacionado por usuários desde a primeira transação." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl">
              {{ $toCurrency(retention.ticket_avg / 100) }}
            </div>
          </CardContent>
        </Card>
      </div>
<!--     Depositation Information-->
      <div class="pb-5 pt-10">
        <div class="text-xl">
          Histórico e Últimas de Entradas
        </div>
        <div class="text-sm text-muted-foreground">
          Veja o gráfico e informações mais recentes
        </div>
      </div>

      <div class="sm:grid gap-4 min-[720px]:grid-cols-1 xl:grid-cols-2 mb-3">
        <Card class="mb-4">
          <CardHeader class="pb-2">
            <CardTitle class="font-medium flex justify-between items-center">
              <span>Histórico de Entradas</span>
              <GlossaryTooltipComponent description="Soma geral de todas as entradas financeiras geradas e confirmadas mês a mês." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <BarChart
                  :data="deposits.monthly_counts"
                  :categories="['Total']"
                  :index="'name'"
                  :rounded-corners="4"
                  :y-formatter="
                (tick) => (typeof tick === 'number' ? $toK(tick) : '')
              "
                  :custom-tooltip="CustomChartTooltip"
              />
            </div>
          </CardContent>
        </Card>

        <Card class="mb-4">
          <CardHeader class="pb-2">
            <CardTitle class="font-medium flex justify-between items-center">
              <span>Últimas Entradas</span>
              <GlossaryTooltipComponent description="Lista com as últimas transações de entrada efetuadas pelos usuários." />
            </CardTitle>
            <CardDescription class="pb-5">
              <span>
                Tiveram {{ deposits.count30days }} depósitos nos últimos 30 dias.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-8">
              <div
                  v-for="deposit in deposits.lasts"
                  :key="deposit.id"
                  class="flex items-center"
              >
                <Avatar class="h-9 w-9">
                  <AvatarFallback>
                    {{
                      deposit.player.name
                          ? deposit.player.name.charAt(0)
                          : deposit.player.email.charAt(0).toUpperCase()
                    }}
                    {{
                      deposit.player.name
                          ? deposit.player.name.charAt(1)
                          : deposit.player.email.charAt(1)
                    }}
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
  </div>
</template>

<script>
import Home from '@/services/home'
import Auth from '@/services/auth'
import CustomChartTooltipRealPrice from '@/components/custom/CustomChartTooltipRealPrice.vue'
import DateRangePicker from '@/components/custom/DateRangePicker.vue'
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Banknote,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarArrowUp,
  CalendarCheck2,
  ChartCandlestick,
  ChartNoAxesColumn,
  Check,
  ChevronDownIcon,
  CirclePercent,
  DollarSign,
  Hourglass,
  ListCheck,
  UserRound,
  UserRoundPlus,
  Users,
  Wallet
} from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import { Chart, registerables } from 'chart.js'
import { useWorkspaceStore } from '@/stores/workspace'
import CustomDatePicker from '@/components/custom/CustomDatePicker.vue'
import VideoBackground from 'vue-responsive-video-background-player'
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";
import {formatLargeNumber} from "@/filters/formatLargeNumber.js";
import draggable from 'vuedraggable'

const { toast } = useToast()

Chart.register(...registerables)

export default {
  computed: {
    CustomChartTooltip() {
      return CustomChartTooltipRealPrice;
    },
  },

  components: {
    ArrowDown,
    ArrowUp,
    BadgeCheck,
    Banknote,
    BanknoteArrowDown,
    BanknoteArrowUp,
    CalendarArrowUp,
    CalendarCheck2,
    ChartCandlestick,
    ChartNoAxesColumn,
    Check,
    ChevronDownIcon,
    CirclePercent,
    CustomChartTooltipRealPrice,
    CustomDatePicker,
    DateRangePicker,
    DollarSign,
    GlossaryTooltipComponent,
    Hourglass,
    ListCheck,
    UserRound,
    UserRoundPlus,
    Users,
    VideoBackground,
    Wallet,
    draggable
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
    deposits: {
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
    withdraws: { total: 0, percentage: 0 },
    projects: [],
    user: null,
    loading: true,
    selectedRange: {},
    hideMetricsDaily: false,
    monthlyCountsChart: {},
    retention: {
      time: "",
      ticket_avg: 0,
    },
    showAllRegister: false,
    showAllActiveUsers: false,
    showAllNewRegister: false,
    showAllConversionGeneral: false,
    showAllFirstDepositors: false,
    showAllConversionD0: false,
    showAllPlayersActive:false,
    showAllDepositsTotal7D: false,
    showAllDepositsNet: false,
    showAllDepositsTicket: false,
    showAllDepositsApproval: false,
    showAllDepositsGenerated: false,
    showAllDepositsPaid: false,
    showAllDepositsFTD: false,

    showAllWithdrawsTotal7D: false,
    showAllWithdrawsTicket: false,
    showAllWithdrawsApproval: false,
    showAllWithdrawsRequested: false,
    showAllWithdrawsProcessed: false,

    showAllRetentionTime: false,
    showAllRetentionTicketAvg: false,
    depositCards:[
      {
        id: 'total-7d',
        title: 'Total 7 dias',
        value: 25310.55,
        percentage: 4.32
      },
      {
        id: 'net-deposits',
        title: 'Total Líquido',
        value: 15200.0
      },
      {
        id: 'avg-ticket',
        title: 'Ticket Médio',
        value: 215.75
      },
      {
        id: 'conversion-rate',
        title: 'Taxa Conversão',
        value: 12.5,
        percentage: 2.1
      }
    ],
    cards: [


    ],
    dragOverId:null
  }),



  async mounted () {
    await this._user()
  },

  methods: {
    formatLargeNumber,
    onDragStart(event, item) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.id);
      console.log("Drag started for item:", item.id);
    },
    onDragEnter(item) {
      this.dragOverId = item.id;
      console.log("Drag entered for item:", item.id);
    },
    onDragLeave() {
      this.dragOverId = null;
      console.log("Drag left item");
    },
    onDrop(event, item) {
      event.preventDefault();
      const draggedItemId = event.dataTransfer.getData('text/plain');
      console.log("Dropped item:", draggedItemId, "on", item.id);

      if (draggedItemId && draggedItemId !== item.id) {
        const draggedItemIndex = this.cards.findIndex(i => i.id === draggedItemId);
        const targetItemIndex = this.cards.findIndex(i => i.id === item.id);

        if (draggedItemIndex !== -1 && targetItemIndex !== -1) {
          // Swap the items
          const temp = this.cards[draggedItemIndex];
          this.cards[draggedItemIndex] = this.cards[targetItemIndex];
          this.cards[targetItemIndex] = temp;
        }
      }

      this.dragOverId = null;
    },
    async _user () {
      const { data } = await Auth.user()
      this.user = data
    },

    greeting() {
      const hour = new Date().getHours()

      if (hour < 12) {
        return 'Bom dia'
      } else if (hour < 18) {
        return 'Boa tarde'
      }

      return 'Boa noite'
    },

    async applyFilter() {
      this.loading = true;

      if (!this.workspaceStore.activeGroupProject?.id) {
        toast({
          title: "Erro",
          description: "Selecione um grupo ou projeto antes de filtrar.",
          variant: "destructive",
        });
        return;
      }

      try {
        this.hideMetricsDaily =
          this.selectedRange?.start.toString() ===
          this.selectedRange?.end.toString();

        const { data } = await Home.index({
          filter_id: this.workspaceStore.activeGroupProject.id,
          start_date: this.selectedRange.start?.toString(),
          end_date: this.selectedRange.end?.toString(),
        });

        this.players = data.players;
        this.activeNow = data.active_now;
        this.deposits = data.deposits;
        this.withdraws = data.withdraws;
        this.retention = data.retention;
        this.cards = this.buildCards()
      } catch (_) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível aplicar o filtro selecionado.",
          variant: "destructive",
        });
      }

      this.loading = false;
    },
    buildCards() {
      return [
        {
          id: 'total-7d',
          icon: 'CalendarCheck2',
          title: 'Total de Entradas 7D',
          tooltip: 'Total de entradas dos últimos 7 dias.',
          value: this.deposits.total / 100,
          variation: this.deposits.percentage,
          showFull: false,
        },
        {
          id: 'net-deposits',
          icon: 'BanknoteArrowDown',
          title: 'Total Líquido',
          tooltip: 'Total de depósitos líquidos.',
          value: this.deposits.total_net_deposits / 100,
          showFull: false,
        },
        {
          id: 'avg-ticket',
          icon: 'ChartNoAxesColumn',
          title: 'Ticket Médio',
          tooltip: 'Valor médio por transação de entrada.',
          value: this.deposits.average_ticket / 100,
          showFull: false,
        },
        {
          id: 'conversion-rate',
          icon: 'CirclePercent',
          title: 'Taxa de Conversão',
          tooltip: 'Percentual de usuários'}

      ]
    },
  },

  watch: {
    workspaceStore() {
      this.applyFilter();
    },
    selectedRange: {
      handler() {
        this.applyFilter();
      },
    },
  },
};
</script>

<style scoped>
/* Estilos do container e do item permanecem os mesmos */
.container {
  font-family: sans-serif;
  padding: 20px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  padding: 15px;
  border: 2px dashed #ccc;
  border-radius: 8px;
}

.grid-item {
  padding: 30px 20px;
  background-color: #41b883;
  color: white;
  font-size: 1.2em;
  font-weight: bold;
  text-align: center;
  border-radius: 5px;
  cursor: move;
  transition: transform 0.2s ease-in-out, background-color 0.2s ease;
}

.grid-item.drag-over {
  background-color: #34495e;
  transform: scale(1.05);
}

/*
  ANIMAÇÕES DO TRANSITION GROUP
*/

/* 2. A classe 'move' é aplicada aos itens que estão mudando de posição. */
/* É aqui que a mágica da animação de inserção acontece! */
.grid-move {
  transition: transform 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

/* 3. As classes enter/leave animam a adição/remoção de itens (bônus). */
.grid-enter-active,
.grid-leave-active {
  transition: all 0.3s ease;
}

.grid-enter-from,
.grid-leave-to {
  opacity: 0;
  transform: scale(0.7);
}

/* 4. Garante que os itens que saem não atrapalhem o layout dos que ficam. */
/* Essencial para que a animação de 'move' funcione corretamente. */
.grid-leave-active {
  position: absolute;
}
</style>

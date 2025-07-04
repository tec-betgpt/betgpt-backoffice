<template>
  <div class="view-home space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid min-[900px]:grid-cols-2 gap-4 py-10">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">{{ greeting() }} {{ user ? user.first_name : '' }},</h2>
        <p class="text-muted-foreground">
          Confira as principais atualizações de hoje.
        </p>
      </div>

      <div class="flex items-center justify-start w-full">
        <div class="flex flex-col items-center justify-end sm:flex-row gap-2 w-full">
          <CustomDatePicker v-model="selectedRange" />
        </div>
      </div>
    </div>

    <div class="banner-promo">
      <div class="inner p-4 grid md:grid-cols-2 xs:grid-cols-1 gap-2">
        <div>
          <div class="title text-white">Conheça nossas soluções</div>
          <div class="subtitle text-white" :class="{}">
            Aprimore o relacionamento com seus clientes usando funcionalidades que vão levá-lo ao próximo nível.
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

    <div v-if="loading" class="grid gap-4 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-3 mb-3">
      <Card v-for="n in 16" :key="n">
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

    <div v-else>
      <div class="title-section">
        <div class="title">
          Visão Geral dos Jogadores
        </div>
        <div class="subtitle">
          Configura os últimos indicadores e mais recentes
        </div>
      </div>

      <div class="grid gap-2 md:grid-cols-3 sm:grid-cols-1">
        <Card v-if="hideMetricsDaily" class="item">
          <CardHeader class="space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              {{ formatLargeNumber(players.count).content }}
              <span class="kind text-orange-300">
                {{ formatLargeNumber(players.count).separator }}
              </span>
            </div>

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

        <Card v-if="hideMetricsDaily" class="item">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              {{ formatLargeNumber(activeNow.count).content }}
              <span class="kind text-orange-300">
                {{ formatLargeNumber(activeNow.count).separator }}
              </span>
            </div>

            <div class="variation mt-3">
              <div class="value flex align-baseline justify-start items-center bg-green-700 text-green-200" v-if="players.change > 0">
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
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">
              Cadastros do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              {{ formatLargeNumber(players.registered_users_day).content }}
              <span class="kind text-orange-300">
                {{ formatLargeNumber(players.registered_users_day).separator }}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card class="item">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">
              FTD Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              {{ (players.ftd_general_percent / 100).toFixed(2) }}
              <span class="kind text-orange-300">
                %
              </span>
            </div>
          </CardContent>
        </Card>

        <Card class="item">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">
              Primeiros Depositantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              {{ players.ftd_registered_users_count }}
            </div>
          </CardContent>
        </Card>

        <Card class="item">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">
              Converção FTD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="number">
              {{ (players.ftd_registered_users_percent / 100).toFixed(2) }}
              <span class="kind text-orange-300">
                %
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="title-section pt-10">
        <div class="title">
          Visão Geral dos Depósitos
        </div>
        <div class="subtitle">
          Configura os últimos indicadores e mais recentes
        </div>
      </div>

      <div>
        <div v-if="loading" class="grid gap-2 md:gap-8 min-[720px]:grid-cols-2 xl:grid-cols-4 mb-3">
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

        <div v-else class="grid gap-2 md:grid-cols-4 sm:grid-cols-1">
          <Card v-if="hideMetricsDaily" class="item">
            <CardHeader>
              <CardTitle class="text-xs font-medium">
                Depósitos 7D
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div :title="(deposits.total / 100)" class="number">
                R$ {{ formatLargeNumber(deposits.total / 100).content }}
                <span class="kind text-orange-300">
                  {{ formatLargeNumber(deposits.total / 100).separator }}
                </span>
              </div>

              <div class="variation mt-3">
                <div v-if="deposits.percentage > 0" class="value flex align-baseline justify-start items-center bg-green-700 text-green-200">
                  <ArrowUp class="h-4 w-4 mr-1" /> {{ deposits.percentage }}%
                </div>
                <div v-else class="value flex justify-start items-center bg-red-700 text-red-200">
                  <ArrowDown class="h-4 w-4" /> {{ deposits.percentage }}%
                </div>
                desde a semana anterior
              </div>

            </CardContent>
          </Card>

          <Card class="item">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-xs font-medium"> Net Deposit </CardTitle>
            </CardHeader>
            <CardContent>
              <div :title="deposits.total_net_deposits" class="number">
                R$ {{ formatLargeNumber(deposits.total_net_deposits).content }}
                <span class="kind text-orange-300">
                  {{ formatLargeNumber(deposits.total_net_deposits).separator }}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card class="item">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-xs font-medium">
                Ticket Médio Depósito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="number">
               R$ {{ formatLargeNumber(deposits.average_ticket || 0 / 100).content }}

                <span class="kind text-orange-300">
                  {{ formatLargeNumber(deposits.average_ticket || 0).separator }}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card class="item">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-xs font-medium">
                Porcentagem Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="number">
                {{ deposits.conversion_rate }}
                <span class="kind text-orange-300">
                  %
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div class="grid mt-2 gap-2 md:grid-cols-3 sm:grid-cols-1">
          <Card class="item">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-xs font-medium">
                Depósitos Gerados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div :title="deposits.generated_deposits" class="number">
                R$ {{ formatLargeNumber(deposits.generated_deposits).content }}
                <span class="kind text-orange-300">
                  {{ formatLargeNumber(deposits.generated_deposits).separator }}
                </span>
              </div>
              <small class="text-xs">Quantidade</small>

              <div :title="$toCurrency(deposits.total_pending_deposits / 100)" class="number mt-5">
                R$ {{ formatLargeNumber(deposits.total_pending_deposits / 100).content }}
                <span class="kind text-orange-300">
                  {{ formatLargeNumber(deposits.total_pending_deposits / 100).separator }}
                </span>
              </div>
              <small class="text-xs">Total</small>
            </CardContent>
          </Card>

          <Card class="item">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-xs font-medium">Depósitos Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div :title="deposits.paid_deposits" class="number">
                {{ formatLargeNumber(deposits.paid_deposits).content }}
                <span class="kind text-orange-300">
                  {{ formatLargeNumber(deposits.paid_deposits).separator }}
                </span>
              </div>
              <small class="text-xs">Quantidade</small>

              <div :title="$toCurrency(deposits.total_paid_deposits / 100)" class="number mt-5">
                {{ formatLargeNumber(deposits.total_paid_deposits / 100).content }}
                <span class="kind text-orange-300">
                  {{ formatLargeNumber(deposits.total_paid_deposits / 100).separator }}
                </span>
              </div>
              <small class="text-xs">Total</small>
            </CardContent>
          </Card>

          <Card class="item">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-xs font-medium">
                Primeiros Depósitantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div :title="deposits.total_ftd_count" class="number">
                {{ formatLargeNumber(deposits.total_ftd_count || 0).content }}
                <span class="kind text-orange-300">
                  {{ formatLargeNumber(deposits.total_ftd_count || 0).separator }}
                </span>
              </div>
              <small class="text-xs">Quantidade</small>

              <div :title="$toCurrency(deposits.total_ftd_amount / 100)" class="number">
                {{ formatLargeNumber(deposits.total_ftd_amount || 0 / 100).content }}
                <span class="kind text-orange-300">
                  {{ formatLargeNumber(deposits.total_ftd_amount || 0 / 100).separator }}
                </span>
              </div>
              <small class="text-xs">Total</small>
            </CardContent>
          </Card>
        </div>
      </div>

      <div class="grid mt-2 gap-2 w-full  sm:grid-cols-1 xl:grid-cols-2 ">
        <Card>
          <CardHeader>
            <Skeleton class="h-6" v-if="loading" />
            <CardTitle v-else>Total de Depósitos</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading">
              <Skeleton class="pl-5 h-72" />
            </div>
            <div v-else>
              <BarChart
                  class="w-full"
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

        <Card>
          <CardHeader>
            <Skeleton class="h-5 mb-1" v-if="loading" />
            <CardTitle v-else>Últimos Depósitos</CardTitle>
            <CardDescription>
              <Skeleton class="h-5" v-if="loading" />

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
            <div v-else class="space-y-8 ">
              <div
                  v-for="deposit in deposits.lasts"
                  :key="deposit.id"
                  class="flex "
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
                <div class=" space-y-1 w-1/3  ml-2">
                  <p class="text-sm font-medium leading-none truncate">
                    {{ deposit.player.name }}
                  </p>
                  <p class="text-sm text-muted-foreground truncate">
                    {{ deposit.player.email }}
                  </p>
                </div>
<!--                <div class="text-right">-->
<!--                  <span class="font-medium"-->
<!--                  >+{{ $toCurrency(deposit.value / 100) }}</span-->
<!--                  >-->
<!--                  <TooltipProvider>-->
<!--                    <Tooltip>-->
<!--                      <TooltipTrigger asChild>-->
<!--                        <p class="text-xs text-muted-foreground text-right">-->
<!--                          {{ $moment(deposit.created_at).fromNow() }}-->
<!--                        </p>-->
<!--                      </TooltipTrigger>-->
<!--                      <TooltipContent>-->
<!--                        <p>-->
<!--                          {{-->
<!--                            $moment(deposit.created_at).format(-->
<!--                                "DD/MM/YYYY HH:mm:ss"-->
<!--                            )-->
<!--                          }}-->
<!--                        </p>-->
<!--                      </TooltipContent>-->
<!--                    </Tooltip>-->
<!--                  </TooltipProvider>-->
<!--                </div>-->
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="title-section pt-10">
        <div class="title">
          Visão Geral dos Saques
        </div>
        <div class="subtitle">
          Configura os últimos indicadores e mais recentes
        </div>
      </div>

      <div class="grid gap-2 md:grid-cols-3 sm:grid-cols-1">
        <Card class="item" v-if="hideMetricsDaily">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium"> Saques 7D </CardTitle>
          </CardHeader>
          <CardContent>
            <div :title="$toCurrency(withdraws.total / 100)" class="number">
              R$ {{ formatLargeNumber(withdraws.total / 100).content }}

              <span class="kind text-orange-300">
                  {{ formatLargeNumber(withdraws.total / 100).separator }}
                </span>
            </div>

            <div class="variation mt-2">
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
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">
              Ticket Médio Saques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div :title="$toCurrency(withdraws.average_ticket / 100)" class="number">
              R$ {{ formatLargeNumber(withdraws.average_ticket / 100).content }}

              <span class="kind text-orange-300">
                {{ formatLargeNumber(withdraws.average_ticket / 100).separator }}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card class="item">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">
              Porcentagem Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div :title="withdraws.generated_withdraws" class="number">
              {{ withdraws.conversion_rate }}
              <span class="kind text-orange-300">%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid mt-5 gap-4 md:grid-cols-2 sm:grid-cols-1">
        <Card class="item">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">Saques Gerados</CardTitle>
          </CardHeader>
          <CardContent>
            <div :title="withdraws.generated_withdraws" class="number">
              {{ formatLargeNumber(withdraws.generated_withdraws || 0).content }}
              <span class="kind text-orange-300">
                  {{ formatLargeNumber(withdraws.generated_withdraws || 0).separator }}
                </span>
            </div>
            <small class="text-xs">Quantidade</small>

            <div :title="$toCurrency(withdraws.total_pending_withdraws / 100)" class="number">
              {{ formatLargeNumber(withdraws.total_pending_withdraws / 100).content }}
              <span class="kind text-orange-300">
                  {{ formatLargeNumber(withdraws.total_pending_withdraws / 100).separator }}
                </span>
            </div>
            <small class="text-xs">Total</small>
          </CardContent>
        </Card>

        <Card class="item">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium"> Saques Pagos </CardTitle>
          </CardHeader>
          <CardContent>
            <div :title="withdraws.paid_withdraws" class="number">
              {{ formatLargeNumber(withdraws.paid_withdraws || 0).content }}
              <span class="kind text-orange-300">
                  {{ formatLargeNumber(withdraws.paid_withdraws || 0).separator }}
                </span>
            </div>
            <small class="text-xs">Quantidade</small>

            <div :title="$toCurrency(withdraws.total_paid_withdraws / 100)" class="number">
              {{ formatLargeNumber(withdraws.total_paid_withdraws / 100).content }}
              <span class="kind text-orange-300">
                  {{ formatLargeNumber(withdraws.total_paid_withdraws / 100).separator }}
                </span>
            </div>
            <small class="text-xs">Total</small>
          </CardContent>
        </Card>
      </div>

      <div class="title-section pt-10">
        <div class="title">
          Retenção
        </div>
        <div class="subtitle">
          Veja os últimos indicadores e mais recentes
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2 mb-3">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">
              Tempo Médio de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ retention.time }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-xs font-medium">
              Ticket Médio na Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ $toCurrency(retention.ticket_avg / 100) }}
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
import {ArrowUp, ArrowDown, ChevronDownIcon} from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import { Chart, registerables } from 'chart.js'

const { toast } = useToast()
import { useWorkspaceStore } from '@/stores/workspace'
import CustomDatePicker from '@/components/custom/CustomDatePicker.vue'
import {formatLargeNumber} from '@/filters/formatLargeNumber'
import VideoBackground from 'vue-responsive-video-background-player'
import {useColorMode} from "@vueuse/core";

Chart.register(...registerables)

export default {
  computed: {
    CustomChartTooltip() {
      return CustomChartTooltipRealPrice;
    },
  },

  components: {
    ChevronDownIcon,
    CustomDatePicker,
    CustomChartTooltipRealPrice,
    DateRangePicker,
    ArrowUp,
    ArrowDown,
    VideoBackground
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
  }),

  async mounted () {
    await this._user()
  },

  methods: {
    formatLargeNumber,
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
      } catch (_) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível aplicar o filtro selecionado.",
          variant: "destructive",
        });
      }

      this.loading = false;
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

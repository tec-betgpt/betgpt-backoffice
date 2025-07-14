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
          <TransitionGroup  tag="div" class="">
            <div
                v-for="item in cards"
                :key="item.id"
                class=""
                :class="{  }"
                :draggable="true"
                @dragstart="onDragStart($event, item)"
                @dragover.prevent
                @dragenter="onDragEnter(item)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, item)"
            >
              <div class="pb-5 pt-10 flex justify-between items-center">
                <div>
                  <div class="text-xl">
                    {{item.title}}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {{item.subTitle}}
                  </div>
                </div>
                <PencilRuler @click="editLayout(item.id)" v-if="item.edit"/>
                <SquarePen @click="editLayout(item.id)" v-else/>
              </div>
              <TransitionGroup name="card-animation" tag="div" :class="hideMetricsDaily ? 'grid gap-4 md:grid-cols-3 sm:grid-cols-1' : 'grid gap-4 md:grid-cols-4 sm:grid-cols-1'">
                <Card
                    v-for="subItem in item.content"
                    :key="subItem.id"
                    :class="{  'card-animation-move':subItem.id === dragOverId,'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700':subItem.toggle }"
                    :draggable="item.edit"
                    @dragstart.stop="onDragStart($event, subItem)"
                    @dragover.prevent
                    @dragenter="onDragEnter(subItem)"
                    @dragleave="onDragLeave"
                    @drop="onDropSub($event, subItem,item.id)"
                    class="item "
                    @click="subItem.toggle? subItem.showFull = !subItem.showFull : null"

                >
                  <CardHeader class="pb-2">
                    <CardTitle class="flex-row flex justify-between items-center">
                      <div class="flex justify-between items-center">
                        <Avatar class="wrapper-avatar text-white border-gray-900 h-9 w-9 p-2" shape="square">
                          <component :is="subItem.icon" />
                        </Avatar>
                        <span class="text-xs font-medium ml-3">{{ subItem.title }}</span>
                      </div>
                      <GlossaryTooltipComponent :description="subItem.tooltip" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent  v-if="subItem.quantity">
                    <div class="number">
                      +{{subItem.quantity}}
                    </div>
                    <small class="text-xs">Quantidade</small>

                    <div class="number mt-5">
                      {{ $toCurrency(subItem.value) }}
                    </div>
                    <small class="text-xs">Total</small>
                  </CardContent>

                  <CardContent v-else>
                    <div v-if="subItem.showFull" :title="subItem.value" class="number">
                      {{ $toCurrency(subItem.value) }}{{subItem.suffix}}tes
                    </div>
                    <div v-else :title="subItem.value" class="number">
                      {{ formatLargeNumber(subItem.value).content }}
                      <span class="kind text-orange-300">
                        {{ formatLargeNumber(subItem.value).separator }}
                      </span>
                    </div>

                    <div v-if="subItem.variation != undefined" class="variation mt-3">
                      <div
                          v-if="subItem.variation > 0"
                          class="value flex align-baseline justify-start items-center bg-green-700 text-green-200"
                      >
                        <ArrowUp class="h-4 w-4 mr-1" /> {{ subItem.variation }}%
                      </div>
                      <div
                          v-else
                          class="value flex justify-start items-center bg-red-700 text-red-200"
                      >
                        <ArrowDown class="h-4 w-4" /> {{ subItem.variation }}%
                      </div>
                      desde a semana anterior
                    </div>
                  </CardContent>
                </Card>

              </TransitionGroup>
            </div>
          </TransitionGroup>
        </div>

   </div>
  </div>
</template>

<script lang="ts">
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
  Wallet,
  PencilRuler,
  SquarePen
} from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import { Chart, registerables } from 'chart.js'
import { useWorkspaceStore } from '@/stores/workspace'
import CustomDatePicker from '@/components/custom/CustomDatePicker.vue'
import VideoBackground from 'vue-responsive-video-background-player'
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";
import {formatLargeNumber} from "@/filters/formatLargeNumber.js";

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
    PencilRuler,
    SquarePen

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
    cards: Array<{
      id: string,
      title: string,
      subtitle: string,
      content: Array<{
        id: string,
        title: string,
        tooltip: string,
        value: number,
        variation?: number,
        icon: any,
        group: string,
        isConditional?: boolean,
        quantity?: number,
        suffix?: string,
        showFull?: boolean,
        toggle?: boolean
      }>,
      edit: boolean
    }>(),

    dragOverId:null,
    editDeposits: false,
    editWithdraws: false,
    editPlayers: false,
    editRetention: false,
  }),

// {
//   id: 'total-entradas-7d',
//       title: 'Total de Entradas 7D',
//     tooltip: 'Total de entradas dos últimos 7 dias.',
//     value: this.deposits.total / 100,
//     variation: this.deposits.percentage,
//     icon: CalendarCheck2,
//     group:"depositors",
//     isConditional: true // Representa o v-if="hideMetricsDaily"
// },

  async mounted () {
    await this._user()
  },

  methods: {
    formatLargeNumber,
    onDragStart(event, item) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.id);
    },
    onDragEnter(item) {
      this.dragOverId = item.id;
    },
    onDragLeave() {
      this.dragOverId = null;
    },
    onDrop(event, item,) {
      event.preventDefault();
      const draggedItemId = event.dataTransfer.getData('text/plain');
      console.log("Dropped item:", draggedItemId, "on", item.id);

      if (draggedItemId && draggedItemId !== item.id) {
        const draggedItemIndex = this.cards.findIndex(i => i.id === draggedItemId);
        const targetItemIndex = this.cards.findIndex(i => i.id === item.id);

        if (draggedItemIndex !== -1 && targetItemIndex !== -1) {
          const temp = this.cards[draggedItemIndex];
          this.cards[draggedItemIndex] = this.cards[targetItemIndex];
          this.cards[targetItemIndex] = temp;
        }
      }

      this.dragOverId = null;
    },
    onDropSub(event, item,id) {
      event.preventDefault();
      const draggedItemId = event.dataTransfer.getData('text/plain');
      console.log("Sub-item drop event:", draggedItemId, "on", item.id);
      if (draggedItemId && draggedItemId !== item.id) {
        const card = this.cards.find(i => i.id === id)
        if (card) {
          const draggedItemIndex = card.content.findIndex(i => i.id === draggedItemId);
          const targetItemIndex = card.content.findIndex(i => i.id === item.id);

          if (draggedItemIndex !== -1 && targetItemIndex !== -1) {
            const [draggedItem] = card.content.splice(draggedItemIndex, 1);
            card.content.splice(targetItemIndex, 0, draggedItem);
            console.log("Dropped item:", draggedItemId, "on", item.id);

          }
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

    editLayout(value){
      this.cards = this.cards.map(card =>
          card.id === value ? { ...card, edit: !card.edit} : card
      );
      const card = this.cards.find(card => card.id === value);

      if (card) {
        toast({
          title: card.edit? "Editando layout" : "Layout editado",
          description: `Editando layout de ${card.title}`,
          variant: "default",
          duration: 1000,
        });
      }
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
        this.cards = [
          {
            id:'depositors',
            title: 'Visão Geral dos Depósitos',
            subTitle: 'Confira os últimos indicadores',
            content: this.buildCardsDeposits(),
            edit:false
          },
          {
            id: 'players',
            title: 'Visão Geral dos Jogadores',
            subTitle: 'Confira os últimos indicadores',
            content:this.buildCardsPlayers(),
            edit:false
          },
          {
            id: 'withdraws',
            title: 'Visão Geral dos Saques',
            subTitle: 'Confira os últimos indicadores',
            content:this.buildCardsWithdraws(),
            edit:false
          },
          {
            id: 'retention',
            title: 'Retenção',
            subTitle: ' Veja os últimos indicadores e mais recentes',
            content: this.buildCardsRetention(),
            edit:false
          },
          // {
          //   id:'history',
          //   title: 'Histórico e Últimas de Entradas',
          //   subTitle: ' Veja o gráfico e informações mais recentes ',
          //   content:this.buildCards()
          // }
        ]
      } catch (_) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível aplicar o filtro selecionado.",
          variant: "destructive",
        });
      }

      this.loading = false;
    },


    buildCardsDeposits() {
      return [
        {
          id: 'total-entradas-7d',
          title: 'Total de Entradas 7D',
          tooltip: 'Total de entradas dos últimos 7 dias.',
          value: this.deposits.total / 100,
          variation: this.deposits.percentage,
          icon: CalendarCheck2,
          group:"depositors",
          showFull: false,
          toggle: true
        },
        {
          id: 'volume-liquido-entradas',
          title: 'Volume Líquido de Entradas',
          tooltip: 'Valor total líquido de entradas financeiras na plataforma (ex: depósitos, pagamentos ou compras).',
          value: this.deposits.total_net_deposits / 100,
          icon: Banknote,
          isConditional: false,
          group:"depositors",

        },
        {
          id: 'ticket-medio-entradas',
          title: 'Ticket Médio de Entradas',
          tooltip: 'Valor médio por transação de entrada confirmadas realizada pelos usuários',
          value: this.deposits.average_ticket,
          icon: ChartCandlestick,
          isConditional: false,
          group:"depositors",

        },
        {
          id: 'taxa-aprovacao-depositos',
          title: 'Taxa de Aprovação',
          tooltip: 'Taxa de aprovação de entradas geradas e entradas confirmadas',
          value: this.deposits.conversion_rate,
          suffix: '%',
          icon: CirclePercent,
          isConditional: false,
          group:"depositors",

        },
        {
          id: 'entradas-geradas',
          title: 'Entradas Geradas',
          tooltip: 'Valor total de transações de entrada iniciadas, independentemente da confirmação.',
          quantity: this.deposits.generated_deposits,
          value: this.deposits.total_pending_deposits / 100,
          icon: BanknoteArrowDown,
          isConditional: false,
          group:"depositors",
          toggle: true,
          showFull: false


        },
        {
          id: 'entradas-confirmadas',
          title: 'Entradas Confirmadas',
          tooltip: 'Valor total de transações de entrada confirmadas com sucesso.',
          quantity: this.deposits.paid_deposits,
          value: this.deposits.total_paid_deposits / 100,
          icon: DollarSign,
          isConditional: false,
          group:"depositors",
          toggle: true,
          showFull: false
        },
        {
          id: 'primeiras-entradas',
          title: 'Primeiras Entradas',
          tooltip: 'Total de entradas financeiras geradas por usuários que realizaram sua primeira transação',
          quantity: this.deposits.total_ftd_count,
          value: this.deposits.total_ftd_amount / 100,
          icon: ListCheck,
          isConditional: false,
          group:"depositors",
          toggle: true,
          showFull: false
        },

      ]
    },
    buildCardsPlayers(){
      return [
        {
          id: 'total-registros',
          title: 'Total de Registros',
          tooltip: 'Total de usuários registrados na base da Elevate',
          value: this.players.count,
          variation: this.players.change,
          icon: Users,
          isConditional: true
        },
        {
          id: 'usuarios-ativos',
          title: 'Usuários Ativos',
          tooltip: 'Total de usuários ativos com pelo menos um pagamento nos últimos 30 dias',
          value: this.activeNow.count,
          variation: this.activeNow.change,
          icon: UserRound,
          isConditional: true
        },
        {
          id: 'novos-registros',
          title: 'Novos Registros',
          tooltip: 'Total de usuários que completaram o cadastro no sistema no periodo especifico',
          value: this.players.registered_users_day,
          icon: UserRoundPlus,
          isConditional: false
        },
        {
          id: 'taxa-conversao-geral',
          title: 'Taxa de Conversão Geral',
          tooltip: 'Percentual de usuários cadastrados que realizaram uma primeira transação validada.',
          value: (this.players.ftd_general_percent / 100).toFixed(2),
          suffix: '%',
          icon: CirclePercent,
          isConditional: false
        },
        {
          id: 'primeiros-depositantes',
          title: 'Primeiros Depositantes',
          tooltip: 'Usuários que realizaram sua primeira transação (compra, depósito ou equivalente) no mesmo dia do cadastro.',
          value: this.players.ftd_registered_users_count,
          icon: Wallet,
          isConditional: false
        },
        {
          id: 'taxa-conversao-d0',
          title: 'Taxa de Conversão em D0',
          tooltip: 'Percentual de usuários que realizaram sua primeira transação (compra, depósito ou equivalente) no mesmo dia do cadastro.',
          value: (this.players.ftd_registered_users_percent / 100).toFixed(2),
          suffix: '%',
          icon: CirclePercent,
          isConditional: false
        },
      ]
    },
    buildCardsWithdraws(){
      return [
        {
          id: 'saques-7d',
          title: 'Saques 7D',
          tooltip: null,
          value: this.withdraws.total / 100,
          variation: this.withdraws.percentage,
          icon: CalendarArrowUp,
          isConditional: true
        },
        {
          id: 'ticket-medio-saida',
          title: 'Ticket Médio de Saída',
          tooltip: 'Valor médio por transação de saída processada.',
          value: this.withdraws.average_ticket / 100,
          icon: ChartNoAxesColumn,
          isConditional: false
        },
        {
          id: 'taxa-aprovacao-saques',
          title: 'Taxa de Aprovação',
          tooltip: 'Taxa de aprovação de saídas solicitadas e saídas processadas',
          value: this.withdraws.generated_withdraws,
          icon: BadgeCheck,
          isConditional: false
        },
        {
          id: 'saidas-solicitadas',
          title: 'Saídas Solicitadas',
          tooltip: 'Valor total de solicitações de retirada feitas pelos usuários.',
          value_quantity: this.withdraws.generated_withdraws,
          value_total: this.withdraws.total_pending_withdraws / 100,
          icon: Check,
          isConditional: false
        },
        {
          id: 'saidas-processadas',
          title: 'Saídas Processadas',
          tooltip: 'Valor total de saídas que foram processadas e pagas com sucesso.',
          value_quantity: this.withdraws.paid_withdraws,
          value_total: this.withdraws.total_paid_withdraws / 100,
          icon: BanknoteArrowUp,
          isConditional: false
        },

      ]
    },
    buildCardsRetention() {
      return [
        {
          id: 'tempo-medio-retencao',
          title: 'Tempo Médio de Retenção',
          tooltip: 'Tempo médio entre a primeira transação do usuário e sua última transação.',
          value: this.retention.time,
          icon: Hourglass,
          isConditional: false
        },
        {
          id: 'ticket-medio-pos-ativacao',
          title: 'Ticket Médio Pós-Ativação',
          tooltip: 'Valor médio transacionado por usuários desde a primeira transação.',
          value: this.retention.ticket_avg / 100,
          icon: ChartNoAxesColumn,
          isConditional: false
        }
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
/* Seus outros estilos permanecem aqui... */

/* --- ANIMAÇÕES PARA OS CARDS ARRASTÁVEIS --- */

/* Esta é a classe mais importante.
  Ela é aplicada aos itens que estão mudando de posição no DOM.
  A transição na propriedade 'transform' cria a animação de movimento suave.
*/
.card-animation-move {
  transition: transform 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

/* Classes para animar a entrada e saída de itens (se você adicionar/remover cards dinamicamente).
  Elas também são importantes para o bom funcionamento da animação de movimento.
*/
.card-animation-enter-active,
.card-animation-leave-active {
  transition: all 0.4s ease;
}

.card-animation-enter-from,
.card-animation-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Esta regra é CRUCIAL.
  Ela tira temporariamente os itens que estão saindo do fluxo do layout,
  permitindo que os outros itens se movam para suas novas posições sem "saltos".
*/
.card-animation-leave-active {
  position: absolute;
}
</style>

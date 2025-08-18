<template>
  <div class="view-home p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="banner-promo">
      <div class="inner">
        <div class="px-5 grid md:grid-cols-2 xs:grid-cols-1 gap-2 w-full">
          <div>
            <div class="text-xl font-semibold text-white">
              {{ greeting() }} {{ user ? user.first_name : "" }},
            </div>
            <div class="text-xs text-white">
              Confira as principais atualizações
            </div>
            <div
              class="xs:text-xs md:text-sm text-white"
              v-if="executionInfo && isToday()"
            >
              Última atualização:
              {{ formatUpdatedAt(executionInfo.updated_at) }} em
              {{ formatExecutionTime(executionInfo.seconds) }}
              <RefreshCcw
                class="h-4 w-4 ml-1 inline cursor-pointer hover:text-blue-300"
                :class="{ 'animate-spin': isRefreshing }"
                @click="refreshMetrics"
              />
            </div>
          </div>

          <div class="flex justify-end items-center w-full flex-nowrap">
            <div class="rounded bg-card w-full md:w-auto">
              <CustomDatePicker v-model="selectedRange" />
            </div>
              <button @click="toggleValues()" class="p-2 ml-2 rounded bg-yellow-400 text-black">
                <Eye v-if="isShowValues" class="w-5 h-5" />
                <EyeClosed v-else class="w-5 h-5" />
              </button>
          </div>
        </div>
      </div>

      <div class="overlay"></div>
      <video-background
        src="/movies/mpeg/dashboard.mp4"
        poster="/movies/poster/dashboard.jpg"
        style="width: 100%; position: absolute; top: 0; left: 0; height: 100%"
        :playsinline="true"
        :sources="[
          {
            src: '/movies/mpeg/dashboard_720p.mp4',
            res: 1200,
            autoplay: true,
            type: 'video/mp4',
          },
          {
            src: '/movies/mpeg/dashboard_480p.mp4',
            res: 800,
            autoplay: true,
            type: 'video/mp4',
          },
          {
            src: '/movies/mpeg/dashboard_360p.mp4',
            res: 600,
            autoplay: true,
            type: 'video/mp4',
          },
          {
            src: '/movies/mpeg/dashboard_240p.mp4',
            res: 400,
            autoplay: true,
            type: 'video/mp4',
          },
          {
            src: '/movies/webm/dashboard_720p.webm',
            res: 1200,
            autoplay: true,
            type: 'video/webm',
          },
          {
            src: '/movies/webm/dashboard_480p.webm',
            res: 800,
            autoplay: true,
            type: 'video/webm',
          },
          {
            src: '/movies/webm/dashboard_360p.webm',
            res: 600,
            autoplay: true,
            type: 'video/webm',
          },
          {
            src: '/movies/webm/dashboard_240p.webm',
            res: 400,
            autoplay: true,
            type: 'video/webm',
          },
        ]"
      />
    </div>

    <div v-if="loading" class="pt-4">
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

    <div v-else>
      <TransitionGroup tag="div">
        <div
          v-for="item in processedCards"
          :key="item.id"
          class=""
          :draggable="false"
          @dragstart="onDragStart($event, item)"
          @dragover.prevent
          @dragenter="onDragEnter(item)"
          @dragleave="onDragLeave"
          @drop="onDrop($event, item)"
        >
          <div class="pb-5 pt-10 flex justify-between items-center">
            <div>
              <div class="text-xl">{{ item.title }}</div>
              <div class="text-sm text-muted-foreground">
                {{ item.subtitle }}
              </div>
            </div>
            <div class="sm:flex hidden cursor-pointer">
              <PencilRuler @click="editLayout(item.id)" v-if="item.edit" />
              <SquarePen @click="editLayout(item.id)" v-else />
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <TransitionGroup
              v-for="(row, rowIndex) in item.content"
              :key="rowIndex"
              name="card-animation"
              tag="div"
              class="flex gap-4"
            >
              <Card
                v-for="subItem in row"
                :key="subItem.id"
                :class="{
                  'card-animation-move': subItem.id === dragOverId,
                  hidden: subItem.isConditional,
                }"
                :draggable="item.edit"
                class="flex-1 item"
                @dragstart.stop="onDragStart($event, subItem)"
                @dragover.prevent
                @dragenter="onDragEnter(subItem)"
                @dragleave="onDragLeave"
                @drop="onDropSub($event, subItem, rowIndex, item.id)"
              >
                <CardHeader class="pb-2">
                  <CardTitle class="flex-row flex justify-between items-center">
                    <div class="flex justify-between items-center">
                      <Avatar
                        v-if="subItem.icon"
                        class="wrapper-avatar mr-3 text-white border-gray-900 h-9 w-9 p-2"
                        shape="square"
                      >
                        <Component :is="subItem.icon" :color="iconColor" />
                      </Avatar>
                      <span
                        class="font-medium"
                        :class="{ 'text-xs': !subItem.layout }"
                        >{{ subItem.title }}</span
                      >
                    </div>
                    <GlossaryTooltipComponent :description="subItem.tooltip" />
                  </CardTitle>
                  <CardDescription
                    v-if="subItem.layout === 'list'"
                    class="pb-5"
                  >
                    <span>
                      Tiveram {{ isShowValues ? deposits.count30days : '--' }} depósitos nos últimos
                      30 dias.
                    </span>
                  </CardDescription>
                </CardHeader>

                <!-- LAYOUT TIPO GRÁFICO -->
                <CardContent v-if="subItem.layout === 'card'">
                  <BarChart
                    :data="deposits.monthly_counts"
                    :categories="['Total']"
                    :index="'name'"
                    :rounded-corners="4"
                    :show-tooltip="isShowValues"
                    :y-formatter="
                      (tick) => (typeof tick === 'number' ? $toK(tick) : '')
                    "
                    :custom-tooltip="CustomChartTooltip"
                  />
                </CardContent>

                <!-- LAYOUT TIPO LISTA -->
                <CardContent v-else-if="subItem.layout === 'list'">
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
                          }}{{
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
                          >+{{ isShowValues ? $toCurrency(deposit.value / 100) : '--' }}</span
                        >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p
                                class="text-xs text-muted-foreground text-right"
                              >
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

                <!-- LAYOUT TIPO QUANTIDADE -->
                <CardContent v-else-if="subItem.quantity">
                  <div class="number">+{{ isShowValues ? subItem.quantity : '--' }}</div>
                  <small class="text-xs">Quantidade</small>
                  <div class="number mt-5" v-if="isShowValues">
                    {{ $toCurrency(subItem.value) }}
                  </div>
                  <div class="number mt-5" v-else>
                    --
                  </div>
                  <small class="text-xs">Total</small>
                  <div v-if="subItem.variation" class="variation mt-3 flex">
                    <div
                      v-if="subItem.variation > 0"
                      class="value flex align-baseline justify-start items-center bg-green-700 text-green-200"
                    >
                      <ArrowUp class="h-4 w-4 mr-1" /> {{ isShowValues ? subItem.variation : '--' }}%
                    </div>
                    <div
                      v-else
                      class="value flex justify-start items-center bg-red-700 text-red-200"
                    >
                      <ArrowDown class="h-4 w-4" /> {{ isShowValues ? subItem.variation : '--' }}%
                    </div>
                    desde a semana anterior
                  </div>
                </CardContent>

                <CardContent
                  v-else-if="
                    subItem.count !== undefined && subItem.count !== null
                  "
                >
                  <div class="number">{{ isShowValues ? subItem.count : '--' }}</div>
                  <div v-if="subItem.variation" class="variation mt-3 flex">
                    <div
                      v-if="subItem.variation > 0"
                      class="value flex align-baseline justify-start items-center bg-green-700 text-green-200"
                    >
                      <ArrowUp class="h-4 w-4 mr-1" /> {{ isShowValues ? subItem.variation : '--' }}
                    </div>
                    <div
                      v-else
                      class="value flex justify-start items-center bg-red-700 text-red-200"
                    >
                      <ArrowDown class="h-4 w-4" /> {{ isShowValues ? subItem.variation : '--' }}
                    </div>
                    desde o dia anterior
                  </div>
                </CardContent>

                <!-- LAYOUT PADRÃO -->
                <CardContent v-else>
                  <div :title="subItem.value" class="number">
                    {{ isShowValues ? $toCurrency(subItem.value) : '--' }}{{ subItem.suffix }}
                  </div>
                  <div v-if="subItem.variation" class="variation mt-3 flex">
                    <div
                      v-if="subItem.variation > 0"
                      class="value flex align-baseline justify-start items-center bg-green-700 text-green-200"
                    >
                      <ArrowUp class="h-4 w-4 mr-1" /> {{ isShowValues ? subItem.variation : '--' }}%
                    </div>
                    <div
                      v-else
                      class="value flex justify-start items-center bg-red-700 text-red-200"
                    >
                      <ArrowDown class="h-4 w-4" /> {{ isShowValues ? subItem.variation : '--' }}%
                    </div>
                    desde a semana anterior
                  </div>
                </CardContent>
              </Card>
            </TransitionGroup>

            <div
              v-if="item.edit"
              class="border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-4 text-center text-gray-500 dark:text-gray-400 transition-colors"
              :class="{
                'bg-blue-100 dark:bg-blue-900/30 border-blue-400':
                  dragOverNewRow === item.id,
              }"
              @dragover.prevent
              @dragenter="onDragEnterNewRow(item.id)"
              @dragleave="onDragLeaveNewRow"
              @drop="onDropNewRow($event, item.id)"
            >
              Arraste um cartão aqui para criar uma nova linha
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script lang="ts">
import Home from "@/services/home";
import Auth from "@/services/auth";
import CustomChartTooltipRealPrice from "@/components/custom/CustomChartTooltipRealPrice.vue";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";
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
  Eye,
  EyeClosed,
  Hourglass,
  ListCheck,
  UserRound,
  UserRoundPlus,
  Users,
  Wallet,
  PencilRuler,
  SquarePen,
  RefreshCcw,
} from "lucide-vue-next";
import { useToast } from "@/components/ui/toast/use-toast";
import { Chart, registerables } from "chart.js";
import { useWorkspaceStore } from "@/stores/workspace";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import VideoBackground from "vue-responsive-video-background-player";
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";
import { useAuthStore } from "@/stores/auth";
import { useColorMode } from "@vueuse/core";
import {ref} from "vue";

const { toast } = useToast();

Chart.register(...registerables);

export default {
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
  },

  computed: {
    CustomChartTooltip() {
      return CustomChartTooltipRealPrice;
    },

    processedCards() {
      const limits = { mobile: 1, tablet: 2, desktop: 5 };
      let limit;
      if (this.windowWidth < 768) {
        limit = limits.mobile;
      } else if (this.windowWidth < 1280) {
        limit = limits.tablet;
      } else {
        limit = limits.desktop;
      }

      return this.cards.map((group) => {
        const newContent = [];

        const visibleContent = group.content
          .map((row) => row.filter((card) => !card.isConditional))
          .filter((row) => row.length > 0);

        visibleContent.forEach((originalRow) => {
          if (originalRow.length > limit) {
            for (let i = 0; i < originalRow.length; i += limit) {
              newContent.push(originalRow.slice(i, i + limit));
            }
          } else {
            newContent.push(originalRow);
          }
        });
        return { ...group, content: newContent };
      });
    },

    iconColor() {
      return this.color == "dark" ? "white" : "black";
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
    Eye,
    EyeClosed,
    GlossaryTooltipComponent,
    Hourglass,
    ListCheck,
    UserRound,
    UserRoundPlus,
    Users,
    VideoBackground,
    Wallet,
    PencilRuler,
    SquarePen,
    RefreshCcw,
  },

  data: () => ({
    color: useColorMode(),
    workspaceStore: useWorkspaceStore(),
    userStore: useAuthStore(),
    executionInfo: null,
    isRefreshing: false,
    isShowValues: ref(false),
    players: {
      count: 0,
      percentage: 0,
      ftd_general_percent: 0,
      ftd_registered_users_count: 0,
      ftd_registered_users_percent: 0,
      registered_users_day: 0,
    },
    dragOverNewRow: null,
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
      id: string;
      title: string;
      subtitle: string;
      content: Array<
        Array<{
          id: string;
          title: string;
          tooltip: string | null;
          value: number;
          icon: any;
          variation?: number;
          group?: string;
          isConditional?: boolean;
          suffix?: string;
          showFull?: boolean;
          toggle?: boolean;
          quantity?: number;
          layout: string;
        }>
      >;
      edit: boolean;
    }>(),
    dragOverId: null,
    windowWidth: window.innerWidth,
  }),

  async mounted() {
    window.addEventListener("resize", this.handleResize);
    await this._user();
  },

  methods: {
    handleResize() {
      this.windowWidth = window.innerWidth;
    },

    onDragStart(event: DragEvent, item: any) {
      event.dataTransfer!.effectAllowed = "move";
      event.dataTransfer!.setData("text/plain", item.id);
    },

    onDragEnter(item: any) {
      this.dragOverId = item.id;
    },

    onDragLeave() {
      this.dragOverId = null;
    },

    onDrop(event: DragEvent, item: any) {
      event.preventDefault();
      const draggedItemId = event.dataTransfer!.getData("text/plain");

      if (draggedItemId && draggedItemId !== item.id) {
        const draggedItemIndex = this.cards.findIndex(
          (i) => i.id === draggedItemId
        );
        const targetItemIndex = this.cards.findIndex((i) => i.id === item.id);

        if (draggedItemIndex !== -1 && targetItemIndex !== -1) {
          const temp = this.cards[draggedItemIndex];
          this.cards[draggedItemIndex] = this.cards[targetItemIndex];
          this.cards[targetItemIndex] = temp;
        }
      }

      const save = this.cards.map((group) => {
        return {
          id: group.id,
          content: group.content.map((row) => {
            return row.map((card) => card.id);
          }),
        };
      });

      Home.layout(save);
      this.dragOverId = null;
    },

    onDropSub(event: DragEvent, targetItem: any, rowIndexFromProcessed: number, parentId: string) {
      event.preventDefault();
      const draggedItemId = event.dataTransfer.getData("text/plain");
      this.dragOverId = null;

      if (!draggedItemId || draggedItemId === targetItem.id) {
        return;
      }

      const parentCard = this.cards.find((c) => c.id === parentId);
      if (!parentCard) return;

      let sourceRowIndex = -1;
      let sourceItemIndex = -1;
      for (let i = 0; i < parentCard.content.length; i++) {
        const itemIndex = parentCard.content[i].findIndex(
          (c) => c.id === draggedItemId
        );
        if (itemIndex !== -1) {
          sourceRowIndex = i;
          sourceItemIndex = itemIndex;
          break;
        }
      }
      if (sourceRowIndex === -1) return;
      let targetRowIndex = -1;
      let targetItemIndex = -1;
      for (let i = 0; i < parentCard.content.length; i++) {
        const itemIndex = parentCard.content[i].findIndex(
          (c) => c.id === targetItem.id
        );
        if (itemIndex !== -1) {
          targetRowIndex = i;
          targetItemIndex = itemIndex;
          break;
        }
      }
      if (targetRowIndex === -1) return;

      const isTargetLast =
        targetItemIndex === parentCard.content[targetRowIndex].length - 1;

      const [removedItem] = parentCard.content[sourceRowIndex].splice(
        sourceItemIndex,
        1
      );

      let finalTargetRowIndex = targetRowIndex;
      let finalTargetItemIndex = targetItemIndex;

      if (
        sourceRowIndex === targetRowIndex &&
        sourceItemIndex < targetItemIndex
      ) {
        finalTargetItemIndex--;
      }
      if (isTargetLast) {
        parentCard.content[finalTargetRowIndex].splice(
          finalTargetItemIndex + 1,
          0,
          removedItem
        );
      } else {
        parentCard.content[finalTargetRowIndex].splice(
          finalTargetItemIndex,
          0,
          removedItem
        );
      }

      parentCard.content = parentCard.content.filter((row) => row.length > 0);
    },

    onDropNewRow(event: DragEvent, parentId: string) {
      event.preventDefault();
      const draggedItemId = event.dataTransfer.getData("text/plain");
      this.dragOverNewRow = null;

      if (!draggedItemId) return;

      const parentCard = this.cards.find((c) => c.id === parentId);
      if (!parentCard) return;

      let draggedItem = null;

      for (let i = 0; i < parentCard.content.length; i++) {
        const itemIndex = parentCard.content[i].findIndex(
          (c) => c.id === draggedItemId
        );
        if (itemIndex !== -1) {
          [draggedItem] = parentCard.content[i].splice(itemIndex, 1);
          break;
        }
      }

      if (!draggedItem) return;

      parentCard.content.push([draggedItem]);

      parentCard.content = parentCard.content.filter((row) => row.length > 0);
    },

    onDragEnterNewRow(parentId: string) {
      this.dragOverNewRow = parentId;
    },

    onDragLeaveNewRow() {
      this.dragOverNewRow = null;
    },

    async _user() {
      const { data } = await Auth.user();
      this.user = data;
    },

    greeting() {
      const hour = new Date().getHours();

      if (hour < 12) {
        return "Bom dia";
      } else if (hour < 18) {
        return "Boa tarde";
      }

      return "Boa noite";
    },

    editLayout(value: string) {
      this.cards = this.cards.map((card) =>
        card.id === value ? { ...card, edit: !card.edit } : card
      );
      const card = this.cards.find((card) => card.id === value);

      if (card) {
        toast({
          title: card.edit ? "Editando layout" : "Layout editado",
          description: `Editando layout de ${card.title}`,
          variant: "default",
          duration: 1000,
        });
      }
      if (!card.edit) {
        const save = this.cards.map((group) => {
          return {
            id: group.id,
            content: group.content.map((row) => {
              return row.map((card) => card.id);
            }),
          };
        });
        Home.layout(save);
      }
    },

    formatLocalDate(date: any) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
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
          this.selectedRange?.start === this.selectedRange?.end &&
          this.selectedRange?.start.toString() ==
            this.formatLocalDate(new Date());

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
        this.executionInfo = data.execution_info;

        if (this.userStore.user.preferences.user_dashboard_layouts) {
          const savedOrder =
            this.userStore.user.preferences.user_dashboard_layouts;
          this.applySavedOrder(savedOrder);
        } else {
          this.cards = [
            {
              id: "depositors",
              title: "Visão Geral dos Depósitos",
              subtitle: "Confira os últimos indicadores",
              content: this.buildCardsDeposits(),
              edit: false,
            },
            {
              id: "players",
              title: "Visão Geral dos Jogadores",
              subtitle: "Confira os últimos indicadores",
              content: this.buildCardsPlayers(),
              edit: false,
            },
            {
              id: "withdraws",
              title: "Visão Geral dos Saques",
              subtitle: "Confira os últimos indicadores",
              content: this.buildCardsWithdraws(),
              edit: false,
              layout: "",
            },
            {
              id: "retention",
              title: "Retenção",
              subtitle: " Veja os últimos indicadores e mais recentes",
              content: this.buildCardsRetention(),
              edit: false,
            },
            {
              id: "history",
              title: "Histórico e Últimas de Entradas",
              subtitle: " Veja o gráfico e informações mais recentes ",
              content: this.buildCardsHistory(),
              edit: false,
            },
          ];
        }
      } catch (_) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível aplicar o filtro selecionado.",
          variant: "destructive",
        });
      }

      this.loading = false;
    },

    applySavedOrder(savedOrder) {
      // Primeiro, gera todos os cartões possíveis para termos os objetos completos.
      const allGroupsDefault = [
        {
          id: "depositors",
          title: "Visão Geral dos Depósitos",
          subtitle: "Confira os últimos indicadores",
          content: this.buildCardsDeposits(),
          edit: false,
        },
        {
          id: "players",
          title: "Visão Geral dos Jogadores",
          subtitle: "Confira os últimos indicadores",
          content: this.buildCardsPlayers(),
          edit: false,
        },
        {
          id: "withdraws",
          title: "Visão Geral dos Saques",
          subtitle: "Confira os últimos indicadores",
          content: this.buildCardsWithdraws(),
          edit: false,
        },
        {
          id: "retention",
          title: "Retenção",
          subtitle: " Veja os últimos indicadores e mais recentes",
          content: this.buildCardsRetention(),
          edit: false,
        },
        {
          id: "history",
          title: "Histórico e Últimas de Entradas",
          subtitle: " Veja o gráfico e informações mais recentes ",
          content: this.buildCardsHistory(),
          edit: false,
        },
      ];

      // Para performance, cria um mapa de todos os sub-itens por ID.
      const allSubItemsMap = new Map();
      allGroupsDefault.forEach((group) => {
        group.content.flat().forEach((subItem) => {
          allSubItemsMap.set(subItem.id, subItem);
        });
      });

      const orderedCards = [];
      // Itera sobre a ordem dos GRUPOS salvos
      savedOrder.forEach((savedGroup) => {
        const groupData = allGroupsDefault.find((g) => g.id === savedGroup.id);
        if (groupData) {
          const newContent = [];
          // Itera sobre a ordem das LINHAS salvas
          savedGroup.content.forEach((savedRow) => {
            const newRow = [];
            // Itera sobre a ordem dos IDs dos CARDS salvos na linha
            savedRow.forEach((cardId) => {
              const subItemData = allSubItemsMap.get(cardId);
              if (subItemData) {
                newRow.push(subItemData);
              }
            });
            if (newRow.length > 0) {
              newContent.push(newRow);
            }
          });
          groupData.content = newContent;
          orderedCards.push(groupData);
        }
      });

      this.cards = orderedCards;
    },

    buildCardsDeposits() {
      const allCards = [
        {
          id: "total-entradas-7d",
          title: "Total de Entradas 7D",
          tooltip: "Total de entradas dos últimos 7 dias.",
          value: this.deposits.total / 100,
          variation: this.deposits.percentage,
          icon: CalendarCheck2,
          isConditional: !this.hideMetricsDaily,
        },
        {
          id: "volume-liquido-entradas",
          title: "Volume Líquido de Entradas",
          tooltip:
            "Valor total líquido de entradas financeiras na plataforma (ex: depósitos, pagamentos ou compras).",
          value: this.deposits.total_net_deposits / 100,
          icon: "Banknote",
          isConditional: false,
        },
        {
          id: "ticket-medio-entradas",
          title: "Ticket Médio de Entradas",
          tooltip:
            "Valor médio por transação de entrada confirmadas realizada pelos usuários",
          value: this.deposits.average_ticket / 100,
          icon: "ChartCandlestick",
          isConditional: false,
        },
        {
          id: "taxa-aprovacao-depositos",
          title: "Taxa de Aprovação",
          tooltip:
            "Taxa de aprovação de entradas geradas e entradas confirmadas",
          value: this.deposits.conversion_rate,
          suffix: "%",
          icon: "CirclePercent",
          isConditional: false,
        },
        {
          id: "entradas-geradas",
          title: "Entradas Geradas",
          tooltip:
            "Valor total de transações de entrada iniciadas, independentemente da confirmação.",
          quantity: this.deposits.generated_deposits,
          value: this.deposits.total_pending_deposits / 100,
          icon: "BanknoteArrowDown",
          isConditional: false,
        },
        {
          id: "entradas-confirmadas",
          title: "Entradas Confirmadas",
          tooltip:
            "Valor total de transações de entrada confirmadas com sucesso.",
          quantity: this.deposits.paid_deposits,
          value: this.deposits.total_paid_deposits / 100,
          icon: "DollarSign",
          isConditional: false,
        },
        {
          id: "primeiras-entradas",
          title: "Primeiras Entradas",
          tooltip:
            "Total de entradas financeiras geradas por usuários que realizaram sua primeira transação",
          quantity: this.deposits.total_ftd_count,
          value: this.deposits.total_ftd_amount / 100,
          icon: "ListCheck",
          isConditional: false,
        },
      ];

      // Divide o array plano em linhas
      return [
        allCards.slice(0, 4), // Primeira linha com 4 cartões
        allCards.slice(4, 7), // Segunda linha com 3 cartões
      ];
    },

    buildCardsPlayers() {
      const allCards = [
        {
          id: "total-registros",
          title: "Total de Registros",
          tooltip: "Total de usuários registrados na base da Elevate",
          count: this.players.count,
          variation: this.players.change,
          icon: "Users",
          isConditional: !this.hideMetricsDaily,
        },
        {
          id: "usuarios-ativos",
          title: "Usuários Ativos",
          tooltip:
            "Total de usuários ativos com pelo menos um pagamento nos últimos 30 dias",
          count: this.activeNow.count,
          variation: this.activeNow.change,
          icon: "UserRound",
          isConditional: !this.hideMetricsDaily,
        },
        {
          id: "novos-registros",
          title: "Novos Registros",
          tooltip:
            "Total de usuários que completaram o cadastro no sistema no periodo especifico",
          value: this.players.registered_users_day,
          icon: "UserRoundPlus",
        },
        {
          id: "taxa-conversao-geral",
          title: "Taxa de Conversão Geral",
          tooltip:
            "Percentual de usuários cadastrados que realizaram uma primeira transação validada.",
          value: (this.players.ftd_general_percent / 100).toFixed(2),
          suffix: "%",
          icon: "CirclePercent",
        },
        {
          id: "primeiros-depositantes",
          title: "Primeiros Depositantes",
          tooltip:
            "Usuários que realizaram sua primeira transação (compra, depósito ou equivalente) no mesmo dia do cadastro.",
          value: this.players.ftd_registered_users_count,
          icon: "Wallet",
        },
        {
          id: "taxa-conversao-d0",
          title: "Taxa de Conversão em D0",
          tooltip:
            "Percentual de usuários que realizaram sua primeira transação (compra, depósito ou equivalente) no mesmo dia do cadastro.",
          value: (this.players.ftd_registered_users_percent / 100).toFixed(2),
          suffix: "%",
          icon: "CirclePercent",
        },
      ];

      return [
        allCards.slice(0, 3), // Primeira linha
        allCards.slice(3, 6), // Segunda linha
      ];
    },

    buildCardsWithdraws() {
      const allCards = [
        {
          id: "saques-7d",
          title: "Saques 7D",
          tooltip: null,
          value: this.withdraws.total / 100,
          variation: this.withdraws.percentage,
          icon: "CalendarArrowUp",
          isConditional: !this.hideMetricsDaily,
        },
        {
          id: "ticket-medio-saida",
          title: "Ticket Médio de Saída",
          tooltip: "Valor médio por transação de saída processada.",
          value: this.withdraws.average_ticket / 100,
          icon: "ChartNoAxesColumn",
        },
        {
          id: "taxa-aprovacao-saques",
          title: "Taxa de Aprovação",
          tooltip:
            "Taxa de aprovação de saídas solicitadas e saídas processadas",
          value: this.withdraws.generated_withdraws, // Assumindo que este é o valor correto
          icon: "BadgeCheck",
        },
        {
          id: "saidas-solicitadas",
          title: "Saídas Solicitadas",
          tooltip:
            "Valor total de solicitações de retirada feitas pelos usuários.",
          quantity: this.withdraws.generated_withdraws,
          value: this.withdraws.total_pending_withdraws / 100,
          icon: "Check",
        },
        {
          id: "saidas-processadas",
          title: "Saídas Processadas",
          tooltip:
            "Valor total de saídas que foram processadas e pagas com sucesso.",
          quantity: this.withdraws.paid_withdraws,
          value: this.withdraws.total_paid_withdraws / 100,
          icon: "BanknoteArrowUp",
        },
      ];

      return [
        allCards.slice(0, 3), // Primeira linha
        allCards.slice(3, 5), // Segunda linha
      ];
    },

    buildCardsRetention() {
      const allCards = [
        {
          id: "tempo-medio-retencao",
          title: "Tempo Médio de Retenção",
          tooltip:
            "Tempo médio entre a primeira transação do usuário e sua última transação.",
          value: this.retention.time,
          icon: "Hourglass",
        },
        {
          id: "ticket-medio-pos-ativacao",
          title: "Ticket Médio Pós-Ativação",
          tooltip:
            "Valor médio transacionado por usuários desde a primeira transação.",
          value: this.retention.ticket_avg / 100,
          icon: "ChartNoAxesColumn",
        },
      ];

      return [
        allCards, // Apenas uma linha com todos os cartões
      ];
    },

    buildCardsHistory() {
      const allCards = [
        {
          id: "hitorico-entrada",
          title: "Histórico de Entradas",
          tooltip:
            "Soma geral de todas as entradas financeiras geradas e confirmadas mês a mês.",
          value: 0,
          layout: "card",
        },
        {
          id: "ultimas-entradas",
          title: "Últimas Entradas",
          tooltip:
            "Lista com as últimas transações de entrada efetuadas pelos usuários.",
          value: 0,
          layout: "list",
        },
      ];
      return [allCards];
    },

    isToday() {
      return (
        this.selectedRange?.start.toString() == this.formatLocalDate(new Date())
      );
    },

    formatUpdatedAt(updatedAt) {
      if (!updatedAt) return "";
      return this.$moment(updatedAt).format("HH:mm[h]");
    },

    formatExecutionTime(seconds) {
      if (!seconds) return "";

      if (seconds < 1) {
        return "menos de 1s";
      } else if (seconds < 60) {
        return `${seconds}s`;
      } else {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (remainingSeconds === 0) {
          return `${minutes}min`;
        } else {
          return `${minutes}min ${remainingSeconds}s`;
        }
      }
    },

    async refreshMetrics() {
      if (this.isRefreshing) return;

      this.isRefreshing = true;

      try {
        if (!this.workspaceStore.activeGroupProject?.id) {
          toast({
            title: "Erro",
            description: "Selecione um projeto antes de atualizar.",
            variant: "destructive",
          });
          return;
        }

        if (!this.isToday()) {
          toast({
            title: "Aviso",
            description:
              "A atualização manual só está disponível para a data atual.",
            variant: "default",
          });
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const { response } = await Home.refresh({
          filter_id: this.workspaceStore.activeGroupProject.id,
        });

        toast({
          title: "Sucesso",
          description:
            "As métricas estão sendo atualizadas. Isso pode levar alguns minutos.",
          variant: "default",
        });

        setTimeout(() => {
          this.applyFilter();
        }, 5000);
      } catch (error) {
        toast({
          title: "Erro",
          description:
            error.response?.data?.message ||
            "Ocorreu um erro ao solicitar a atualização.",
          variant: "destructive",
        });
      } finally {
        this.isRefreshing = false;
      }
    },

    toggleValues() {
      this.isShowValues = !this.isShowValues;
    }
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
  }
};
</script>

<style scoped>
.card-animation-move {
  transition: transform 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.card-animation-enter-active,
.card-animation-leave-active {
  transition: all 0.4s ease;
}

.card-animation-enter-from,
.card-animation-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.card-animation-leave-active {
  position: absolute;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

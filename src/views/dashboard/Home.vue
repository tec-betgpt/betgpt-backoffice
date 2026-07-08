<template>
  <div class="view-home pb-16 w-full">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 w-full mt-5">
      <div>
        <div class="text-xl md:text-2xl lg:text-3xl font-semibold">
          {{ greeting() }} {{ user ? user.first_name : "" }}
        </div>
        <div
          class="text-xs md:text-sm"
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
      </div>
    </div>

    <div v-if="loading" class="pt-2">
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
          <div class="py-4 md:py-8 flex justify-between items-center">
            <div>
              <div class="text-md font-semibold md:text-xl">{{ item.title }}</div>
              <div class="text-xs md:text-sm text-muted-foreground">
                {{ item.subtitle }}
              </div>
            </div>
            <div class="sm:flex hidden cursor-pointer">
              <PencilRuler @click="editLayout(item.id)" v-if="item.edit" />
              <SquarePen @click="editLayout(item.id)" v-else />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <TransitionGroup
              v-for="(row, rowIndex) in item.content"
              :key="rowIndex"
              name="card-animation"
              tag="div"
            >
              <div
                class="flex gap-2 w-full"
                :key="rowIndex + 1"
                :ref="(el) => setRowRef(el, rowIndex)"
              >
                <Card
                  v-for="subItem in row"
                  :key="subItem.id"
                  :class="{
                    'card-animation-move': subItem.id === dragOverId,
                    hidden: subItem.isConditional,
                  }"
                  :draggable="item.edit"
                  class="flex-1 item shadow-lg"
                  @dragstart.stop="onDragStart($event, subItem)"
                  @dragover.prevent
                  @dragenter="onDragEnter(subItem)"
                  @dragleave="onDragLeave"
                  @drop="onDropSub($event, subItem, item.id)"
                >
                  <CardHeader class="p-2 md:p-6 pb-2 md:pb-4">
                    <CardTitle class="flex-row flex justify-between items-start gap-1">
                      <div class="flex justify-start w-full items-center">
                        <Avatar
                          v-if="subItem.icon"
                          class="mr-1.5 md:mr-3 bg-gradient-to-br from-[#F6CE4C] to-[#FF9F00] h-6 w-6 md:h-11 md:w-11 p-1 md:p-2"
                          shape="square"
                        >
                          <Component :is="resolveIcon(subItem.icon)" class="h-full w-full dark:text-black" />
                        </Avatar>

                        <div class="font-semibold text-xs md:text-md">
                          {{ subItem.title }}
                        </div>
                      </div>

                      <GlossaryTooltipComponent :description="subItem.tooltip" />
                    </CardTitle>
                    <CardDescription v-if="subItem.layout === 'list'">
                      <span v-if="isShowValues">
                        Tiveram {{ deposits.count30days }} entradas nos últimos 30 dias.
                      </span>
                      <skeleton-custom v-else />
                    </CardDescription>
                  </CardHeader>

                  <!-- LAYOUT TIPO GRÁFICO -->
                  <CardContent v-if="subItem.layout === 'card'" class="px-2 md:px-6 h-60 md:h-auto pb-12">
                    <BarChart
                      class="w-full"
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
                    <div class="space-y-8 w-full">
                      <div
                        v-for="deposit in sortedLastDeposits"
                        :key="deposit.id"
                        class="flex items-center w-full gap-2 min-w-0"
                      >
                        <div class="flex-1 min-w-0 space-y-1 overflow-hidden">
                          <template v-if="depositorNamePreview(deposit.player?.name).tooltip">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger as-child>
                                  <p class="text-sm font-medium leading-none cursor-default">
                                    {{ depositorNamePreview(deposit.player?.name).text }}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent class="max-w-[min(90vw,20rem)]">
                                  <p class="break-words text-sm">
                                    {{ deposit.player?.name }}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </template>
                          <p v-else class="text-sm font-medium leading-none truncate">
                            {{ depositorNamePreview(deposit.player?.name).text }}
                          </p>
                          <p class="text-xs text-muted-foreground truncate">
                            {{ deposit.player?.email }}
                          </p>
                        </div>

                        <div class="text-right" v-if="isShowValues">
                          <span class="font-medium">
                            +{{ $toCurrency(deposit.value / 100) }}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p class="text-xs text-muted-foreground text-right">
                                  {{ $moment(deposit.created_at).fromNow() }}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                {{ $moment(deposit.created_at).format("DD/MM/YYYY HH:mm:ss") }}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div class="text-right" v-else>
                          <SkeletonCustom class="h-6 w-6" />
                        </div>

                        <div class="flex-shrink-0" v-if="isShowValues">
                          <router-link
                            v-if="canAccess('access-to-client-management')"
                            :to="{
                              name: 'clients.show',
                              params: { id: deposit.player.id },
                            }"
                            target="_blank"
                            class="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                            title="Ver detalhes do cliente"
                          >
                            <Eye class="h-4 w-4" />
                          </router-link>
                        </div>
                        <div v-else class="flex-shrink-0">
                          <SkeletonCustom class="h-6 w-6" />
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <!-- LAYOUT TIPO QUANTIDADE -->
                  <CardContent v-else-if="subItem.quantity" class="flex-col p-2 md:p-6 pt-0 md:pt-0">
                    <div class="flex flex-col">
                      <div class="text-sm md:text-2xl font-semibold" v-if="isShowValues">
                        +{{ subItem.quantity }}
                      </div>
                      <SkeletonCustom v-else class="h-7 w-40" />
                      <div class="text-xs text-muted-foreground uppercase">Quantidade</div>
                    </div>

                    <div class="flex flex-col mt-1 md:mt-2">
                      <div class="text-sm md:text-2xl font-semibold" v-if="isShowValues">
                        {{ $toCurrency(subItem.value) }}
                      </div>
                      <SkeletonCustom v-else class="h-7 w-40" />
                      <div class="text-xs text-muted-foreground uppercase">Total</div>
                    </div>

                    <div v-if="isShowValues">
                      <div v-if="subItem.variation" class="inline-block flex text-xs">
                        <div
                          v-if="subItem.variation > 0"
                          class="flex align-baseline rounded-md p-1 text-xs mr-1 justify-start items-center bg-green-700 text-green-200"
                        >
                          <ArrowUp class="h-4 w-4 mr-1" />
                          {{ subItem.variation }}%
                        </div>
                        <div
                          v-else
                          class="flex align-baseline rounded-md p-1 text-xs mr-1 justify-start items-center bg-red-700 rounded-md text-red-200"
                        >
                          <ArrowDown class="h-4 w-4 mr-1" />
                          {{ subItem.variation }}%
                        </div>
                        desde a semana anterior
                      </div>
                    </div>
                  </CardContent>

                  <CardContent
                    v-else-if="subItem.count !== undefined && subItem.count !== null"
                    class="max-sm:flex max-sm:flex-col p-2 md:p-6 pt-0 md:pt-0"
                  >
                    <div class="text-sm md:text-2xl font-semibold" v-if="isShowValues">
                      {{ subItem.prefix }}{{ subItem.count }}{{ subItem.suffix }}
                    </div>

                    <SkeletonCustom v-else mt-5 class="h-6 w-40 mt-5" />

                    <div v-if="isShowValues">
                      <div v-if="subItem.variation" class="mt-3 flex text-xs">
                        <div
                          v-if="subItem.variation > 0"
                          class="flex align-baseline rounded-md p-1 text-xs mr-1 justify-start items-center bg-green-700 text-green-200"
                        >
                          <ArrowUp class="h-4 w-4 mr-1" />
                          {{ subItem.variation }}
                        </div>
                        <div
                          v-else
                          class="flex align-baseline rounded-md p-1 text-xs mr-1 justify-start items-center bg-red-700 text-red-300"
                        >
                          <ArrowDown class="h-4 w-4 mr-1" />
                          {{ subItem.variation }}
                        </div>
                        desde o dia anterior
                      </div>
                    </div>
                  </CardContent>

                  <!-- LAYOUT PADRÃO -->
                  <CardContent v-else class="max-sm:flex max-sm:flex-col p-2 md:p-6 pt-0 md:pt-0">
                    <div
                      v-if="isShowValues"
                      :title="subItem.value"
                      class="text-sm md:text-2xl font-semibold"
                    >
                      {{ subItem.prefix }}{{ subItem.suffix ? subItem.value : $toCurrency(subItem.value) }}{{ subItem.suffix }}
                    </div>
                    <SkeletonCustom v-else mt-5 class="h-7 w-40 mt-5" />

                    <div v-if="isShowValues">
                      <div v-if="subItem.variation" class="mt-3 flex items-center text-xs">
                        <div
                          v-if="subItem.variation > 0"
                          class="flex align-baseline rounded-md p-1 text-xs mr-1 justify-start items-center bg-green-700 text-green-200"
                        >
                          <ArrowUp class="h-4 w-4 mr-1" />
                          {{ subItem.variation }}%
                        </div>
                        <div
                          v-else
                          class="flex align-baseline rounded-md p-1 text-xs mr-1 justify-start items-center bg-red-700 text-red-200"
                        >
                          <ArrowDown class="h-4 w-4" /> {{ subItem.variation }}%
                        </div>
                        desde a semana anterior
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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

    <div
      v-if="user && !user.is_available"
      class="bg-gray-50/5 w-full h-full backdrop-blur-lg absolute top-0 left-0 z-20 flex flex-col items-center justify-start px-4 pt-64 text-center"
    >
      <LucideLockOpen />
      <div class="text-sm font-bold">Conta suspensa</div>
      <div class="text-xs">
        Por favor, efetue o pagamento das faturas pendentes.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Home from "@/services/home";
import type { DateRange } from "radix-vue";
import CustomChartTooltipRealPrice from "@/components/custom/CustomChartTooltipRealPrice.vue";
import moment from "moment";
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
  SquareActivity,
  ListCheck,
  LogIn,
  UserRound,
  UserRoundPlus,
  Users,
  Wallet,
  PencilRuler,
  SquarePen,
  RefreshCcw,
  Eye,
  EyeClosed,
  LucideLockOpen,
} from "lucide-vue-next";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";
import { useAuthStore } from "@/stores/auth";
import { Skeleton } from "@/components/ui/skeleton";
import SkeletonCustom from "@/components/custom/SkeletonCustom.vue";

const { toast } = useToast();
const props = defineProps({
  isShowValues: {
    type: Boolean,
    default: false,
  },
});

type DashboardCard = {
  id: string;
  title: string;
  tooltip: string | null;
  value: any;
  icon?: any;
  variation?: number;
  group?: string;
  isConditional?: boolean;
  suffix?: string;
  prefix?: string;
  showFull?: boolean;
  toggle?: boolean;
  quantity?: number;
  count?: number;
  layout?: string;
};

type DashboardGroup = {
  id: string;
  title: string;
  subtitle: string;
  content: DashboardCard[][];
  edit: boolean;
};

const workspaceStore = useWorkspaceStore();
const userStore = useAuthStore();

const executionInfo = ref<any>(null);
const isRefreshing = ref(false);
const players = ref({
      count: 0,
      percentage: 0,
      ftd_general_percent: 0,
      ftd_registered_users_count: 0,
      ftd_registered_users_amount: 0,
      ftd_registered_users_percent: 0,
      registered_users_day: 0,
      ftd_post_d0_count: 0,
      ftd_post_d0_amount: 0,
      ftd_post_d0_percent: 0,
      player_logins: 0,
    } as any);
const dragOverNewRow = ref<string | null>(null);
const activeNow = ref({ count: 0, change: 0 } as any);
const deposits = ref({
      total: 0,
      percentage: 0,
      lasts: [],
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
      performance_return_hidden: true,
      performance_return_total: null as number | null,
    } as any);
const withdraws = ref({
      total: 0,
      percentage: 0,
      average_ticket: 0,
      conversion_rate: 0,
      generated_withdraws: 0,
      paid_withdraws: 0,
      total_pending_withdraws: 0,
      total_paid_withdraws: 0,
    } as any);
const user = ref<any>(null);
const loading = ref(true);
const selectedRange = ref({} as DateRange);
const hideMetricsDaily = ref(false);
const retention = ref({
      time: "",
      ticket_avg: 0,
    });
const cards = ref<DashboardGroup[]>([]);
const dragOverId = ref<string | null>(null);
const windowWidth = ref(window.innerWidth);
const rowWidths = ref<Record<number, number>>({});
const resizeObservers = ref<Record<number, ResizeObserver>>({});
const debounceTimers = ref<Record<string, ReturnType<typeof setTimeout>>>({});

const iconRegistry: Record<string, any> = {
  Banknote,
  ChartCandlestick,
  CirclePercent,
  BanknoteArrowDown,
  DollarSign,
  CalendarArrowUp,
  ChartNoAxesColumn,
  BadgeCheck,
  Check,
  BanknoteArrowUp,
  Users,
  UserRound,
  UserRoundPlus,
  Wallet,
  ListCheck,
  Hourglass,
  CalendarCheck2,
  SquareActivity,
  LogIn,
};

const CustomChartTooltip = computed(() => CustomChartTooltipRealPrice);

const processedCards = computed(() => {
  const limits = { mobile: 2, tablet: 2, desktop: 5 };
  return cards.value.map((group, groupIndex) => {
    const rowWidth = rowWidths.value[groupIndex] || window.innerWidth;
    let limit;
    let isMobile = false;

    if (rowWidth < 500) {
      limit = limits.mobile;
      isMobile = true;
    } else if (rowWidth < 900) {
      limit = limits.tablet;
    } else {
      limit = limits.desktop;
    }

    const newContent: DashboardCard[][] = [];
    const visibleContent = group.content
      .map((row) => row.filter((card) => !card.isConditional))
      .filter((row) => row.length > 0);

    visibleContent.forEach((originalRow) => {
      let currentLimit = limit;
      if (isMobile) {
        const hasFullWidthItem = originalRow.some(
          (card) => card.layout === "card" || card.layout === "list",
        );
        if (hasFullWidthItem) {
          currentLimit = 1;
        }
      }

      if (originalRow.length > currentLimit) {
        for (let i = 0; i < originalRow.length; i += currentLimit) {
          newContent.push(originalRow.slice(i, i + currentLimit));
        }
      } else {
        newContent.push(originalRow);
      }
    });

    return { ...group, content: newContent };
  });
});

const sortedLastDeposits = computed(() => {
  const raw = deposits.value?.lasts;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [];
  }
  return [...raw].sort(
    (a: any, b: any) =>
      new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf(),
  );
});

const canAccess = (permissionName: string) => {
  const hasPermission = (userStore.user as any)?.roles?.some((role: any) =>
    role.permissions?.some((permission: any) => permission.name === permissionName),
  );
  return Boolean(hasPermission);
};

const debounce = (func: () => void, delay: number, key: string) => {
  if (debounceTimers.value[key]) {
    clearTimeout(debounceTimers.value[key]);
  }
  debounceTimers.value[key] = setTimeout(func, delay);
};

    /** Nome curto + reticências no mobile; tooltip com nome completo quando truncado. */
const depositorNamePreview = (name: string | null | undefined) => {
  const s = (name ?? "").trim();
  if (!s) {
    return { text: "—", tooltip: false };
  }
  const max = windowWidth.value < 640 ? 22 : 42;
  if (s.length <= max) {
    return { text: s, tooltip: false };
  }
  return { text: `${s.slice(0, max).trimEnd()}…`, tooltip: true };
};

const setRowRef = (el: any, index: number) => {
  if (!el) {
    if (resizeObservers.value[index]) {
      resizeObservers.value[index].disconnect();
      delete resizeObservers.value[index];
    }
    return;
  }

  if (resizeObservers.value[index]) return;

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      debounce(
        () => {
          rowWidths.value[index] = entry.contentRect.width;
        },
        150,
        `resize_${index}`,
      );
    }
  });

  observer.observe(el);
  resizeObservers.value[index] = observer;
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

const onDragStart = (event: DragEvent, item: any) => {
  event.dataTransfer!.effectAllowed = "move";
  event.dataTransfer!.setData("text/plain", item.id);
};

const onDragEnter = (item: any) => {
  dragOverId.value = item.id;
};

const onDragLeave = () => {
  dragOverId.value = null;
};

const onDrop = (event: DragEvent, targetItem: any) => {
  event.preventDefault();
  const draggedItemId = event.dataTransfer!.getData("text/plain");
  dragOverId.value = null;

  if (draggedItemId && draggedItemId !== targetItem.id) {
    const draggedItemIndex = cards.value.findIndex((i) => i.id === draggedItemId);
    const targetItemIndex = cards.value.findIndex((i) => i.id === targetItem.id);

    if (draggedItemIndex !== -1 && targetItemIndex !== -1) {
      [cards.value[draggedItemIndex], cards.value[targetItemIndex]] = [
        cards.value[targetItemIndex],
        cards.value[draggedItemIndex],
      ];
      saveLayout();
    }
  }
};

const onDropSub = (event: DragEvent, targetItem: any, parentId: string) => {
  event.preventDefault();
  const draggedItemId = event.dataTransfer?.getData("text/plain");
  dragOverId.value = null;

  if (!draggedItemId || draggedItemId === targetItem.id) return;

  const parentCard = cards.value.find((c) => c.id === parentId);
  if (!parentCard) return;

      let sourceLocation = null;
      let targetLocation = null;

      for (let i = 0; i < parentCard.content.length; i++) {
        const sourceIndex = parentCard.content[i].findIndex(
          (c) => c.id === draggedItemId,
        );
        if (sourceIndex !== -1) {
          sourceLocation = { rowIndex: i, itemIndex: sourceIndex };
        }
        const targetIndex = parentCard.content[i].findIndex(
          (c) => c.id === targetItem.id,
        );
        if (targetIndex !== -1) {
          targetLocation = { rowIndex: i, itemIndex: targetIndex };
        }
        if (sourceLocation && targetLocation) break;
      }

      if (!sourceLocation || !targetLocation) return;

      const [removedItem] = parentCard.content[sourceLocation.rowIndex].splice(
        sourceLocation.itemIndex,
        1,
      );

      parentCard.content[targetLocation.rowIndex].splice(
        targetLocation.itemIndex,
        0,
        removedItem,
      );

      parentCard.content = parentCard.content.filter((row) => row.length > 0);
  saveLayout();
};

const onDropNewRow = (event: DragEvent, parentId: string) => {
  event.preventDefault();
  const draggedItemId = event.dataTransfer?.getData("text/plain");
  dragOverNewRow.value = null;

  if (!draggedItemId) return;

  const parentCard = cards.value.find((c) => c.id === parentId);
  if (!parentCard) return;

      let draggedItem = null;

      for (let i = 0; i < parentCard.content.length; i++) {
        const itemIndex = parentCard.content[i].findIndex(
          (c) => c.id === draggedItemId,
        );
        if (itemIndex !== -1) {
          [draggedItem] = parentCard.content[i].splice(itemIndex, 1);
          break;
        }
      }

      if (!draggedItem) return;

      parentCard.content.push([draggedItem]);

      parentCard.content = parentCard.content.filter((row) => row.length > 0);
};

const saveLayout = () => {
  const layoutToSave = cards.value.map((group) => ({
    id: group.id,
    content: group.content.map((row) => row.map((card) => card.id)),
  }));
  Home.layout(layoutToSave);
};

const onDragEnterNewRow = (parentId: string) => {
  dragOverNewRow.value = parentId;
};

const onDragLeaveNewRow = () => {
  dragOverNewRow.value = null;
};

const _user = async () => {
  user.value = useAuthStore().user;
};

const greeting = () => {
  const hour = new Date().getHours();

      if (hour < 12) {
        return "Bom dia";
      } else if (hour < 18) {
        return "Boa tarde";
      }

  return "Boa noite";
};

const editLayout = (value: string) => {
  cards.value = cards.value.map((card) =>
        card.id === value ? { ...card, edit: !card.edit } : card,
      );
  const card = cards.value.find((groupCard) => groupCard.id === value);

      if (card) {
        toast({
          title: card.edit ? "Editando layout" : "Layout editado",
          description: `Editando layout de ${card.title}`,
          variant: "default",
          duration: 1000,
        });
      }
  if (card && !card.edit) {
    const save = cards.value.map((group) => {
          return {
            id: group.id,
            content: group.content.map((row) => {
              return row.map((card) => card.id);
            }),
          };
        });
    Home.layout(save);
  }
};

const formatLocalDate = (date: any) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const applyFilter = async () => {
  loading.value = true;

  if (!workspaceStore.activeGroupProject?.id) {
    toast({
      title: "Erro",
      description: "Selecione um grupo ou projeto antes de filtrar.",
      variant: "destructive",
    });
    loading.value = false;
    return;
  }

      try {
    hideMetricsDaily.value =
      selectedRange.value?.start === selectedRange.value?.end &&
      selectedRange.value?.start?.toString() === formatLocalDate(new Date());

    const { data } = await Home.index({
      filter_id: workspaceStore.activeGroupProject.id,
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
    });

    players.value = data.players;
    activeNow.value = data.active_now;
    deposits.value = data.deposits;
    withdraws.value = data.withdraws;
    retention.value = data.retention;
    executionInfo.value = data.execution_info;

    if (userStore.user.preferences.user_dashboard_layouts) {
      const savedOrder = userStore.user.preferences.user_dashboard_layouts;
      applySavedOrder(savedOrder);
    } else {
      cards.value = [
            {
              id: "depositors",
              title: "Visão Geral de Receita",
              subtitle: "Entradas, saídas e indicadores financeiros",
              content: buildCardsDeposits(),
              edit: false,
            },
            {
              id: "players",
              title: "Visão Geral dos Clientes",
              subtitle: "Confira os últimos indicadores",
              content: buildCardsPlayers(),
              edit: false,
            },
            {
              id: "retention",
              title: "Retenção",
              subtitle: " Veja os últimos indicadores e mais recentes",
              content: buildCardsRetention(),
              edit: false,
            },
            {
              id: "history",
              title: "Histórico e Últimas de Entradas",
              subtitle: " Veja o gráfico e informações mais recentes ",
              content: buildCardsHistory(),
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

  loading.value = false;
};

const applySavedOrder = (savedOrder: any[]) => {
      const withdrawsSaved = savedOrder.find((g: { id: string }) => g.id === "withdraws");
      let orderForLayout = savedOrder.filter((g: { id: string }) => g.id !== "withdraws");
      if (withdrawsSaved) {
        const dIx = orderForLayout.findIndex((g: { id: string }) => g.id === "depositors");
        if (dIx !== -1) {
          orderForLayout = orderForLayout.map((g: { id: string; content: string[][] }, i: number) =>
            i === dIx
              ? { ...g, content: [...g.content, ...withdrawsSaved.content] }
              : g,
          );
        } else {
          orderForLayout = [
            { id: "depositors", content: withdrawsSaved.content },
            ...orderForLayout,
          ];
        }
      }

      const allGroupsDefault = [
        {
          id: "depositors",
          title: "Visão Geral de Receita",
          subtitle: "Entradas, saídas e indicadores financeiros",
          content: buildCardsDeposits(),
          edit: false,
        },
        {
          id: "players",
          title: "Visão Geral dos Clientes",
          subtitle: "Confira os últimos indicadores",
          content: buildCardsPlayers(),
          edit: false,
        },
        {
          id: "retention",
          title: "Retenção",
          subtitle: " Veja os últimos indicadores e mais recentes",
          content: buildCardsRetention(),
          edit: false,
        },
        {
          id: "history",
          title: "Histórico e Últimas de Entradas",
          subtitle: " Veja o gráfico e informações mais recentes ",
          content: buildCardsHistory(),
          edit: false,
        },
      ];

      const allSubItemsMap = new Map();
      allGroupsDefault.forEach((group) => {
        group.content.forEach((row) => {
          row.forEach((subItem) => {
            allSubItemsMap.set(subItem.id, subItem);
          });
        });
      });
      const defaultGroupsMap = new Map(allGroupsDefault.map((g) => [g.id, g]));

  cards.value = orderForLayout
        .map((savedGroup: { id: string; content: string[][] }) => {
          const groupData = defaultGroupsMap.get(savedGroup.id);
          if (!groupData) return null;

          const newContent = savedGroup.content
            .map((savedRow) =>
              savedRow
                .map((cardId) => allSubItemsMap.get(cardId))
                .filter(Boolean),
            )
            .filter((row) => row.length > 0);
          return { ...groupData, content: newContent };
        })
        .filter(Boolean);

  mergeMissingDashboardCards();
};

const mergeMissingDashboardCards = () => {
      const specs = [
        { id: "depositors", build: () => buildCardsDeposits() },
        { id: "players", build: () => buildCardsPlayers() },
        { id: "retention", build: () => buildCardsRetention() },
        { id: "history", build: () => buildCardsHistory() },
      ];
      for (const { id, build } of specs) {
        const group = cards.value.find((g) => g.id === id);
        if (!group) continue;
        const defaultRows = build();
        const present = new Set(group.content.flat().map((c) => c.id));
        const missing = defaultRows.flat().filter((c) => !present.has(c.id));
        if (!missing.length) continue;
        if (!group.content.length) group.content = [[]];
        const last = group.content[group.content.length - 1];
        last.push(...missing);
      }
};

    /**
     * Margem bruta (%) = ((entradas − saídas) / entradas) × 100
     * (entradas/saídas = valores confirmados no período, mesma base do dashboard)
     */
const grossMarginPercentFormatted = () => {
  const entradas = Number(deposits.value.total_paid_deposits ?? 0);
  const saidas = Number(withdraws.value.total_paid_withdraws ?? 0);
  if (entradas <= 0) {
    return "0.00";
  }
  return (((entradas - saidas) / entradas) * 100).toFixed(2);
};

const revenueWithdrawCards = () => {
  return [
        {
          id: "saques-7d",
          title: "Saídas 7D",
          tooltip: null,
          value: withdraws.value.total / 100,
          variation: withdraws.value.percentage,
          icon: CalendarArrowUp,
          isConditional: !hideMetricsDaily.value,
        },
        {
          id: "ticket-medio-saida",
          title: "Ticket Médio de Saída",
          tooltip: "Valor médio por transação de saída confirmada.",
          value: withdraws.value.average_ticket / 100,
          icon: ChartNoAxesColumn,
        },
        {
          id: "taxa-aprovacao-saques",
          title: "Taxa de Aprovação (Saídas)",
          tooltip:
            "Taxa de aprovação de saídas solicitadas e saídas confirmadas",
          value: withdraws.value.conversion_rate,
          suffix: "%",
          icon: BadgeCheck,
        },
        {
          id: "saidas-solicitadas",
          title: "Saídas Solicitadas",
          tooltip:
            "Valor total de solicitações de retirada feitas pelos usuários.",
          quantity: withdraws.value.generated_withdraws,
          value: withdraws.value.total_pending_withdraws / 100,
          icon: Check,
        },
        {
          id: "saidas-processadas",
          title: "Saídas Confirmadas",
          tooltip:
            "Valor total de saídas confirmadas e pagas com sucesso.",
          quantity: withdraws.value.paid_withdraws,
          value: withdraws.value.total_paid_withdraws / 100,
          icon: BanknoteArrowUp,
        },
      ];
};

const buildCardsDeposits = () => {
      const depositCards = [
        {
          id: "volume-liquido-entradas",
          title: "Retorno Bruto",
          tooltip:
            "Valor total líquido de entradas financeiras na plataforma (ex: depósitos, pagamentos ou compras).",
          value: deposits.value.total_net_deposits / 100,
          icon: Banknote,
          isConditional: false,
        },
        {
          id: "retorno-performance",
          title: "Retorno de Performance",
          tooltip:
            "Receita total do relatório de conversões.",
          value: deposits.value.performance_return_total ?? 0,
          icon: ChartCandlestick,
          isConditional: deposits.value.performance_return_hidden,
        },
        {
          id: "margem-bruta",
          title: "Margem Bruta",
          tooltip:
            "Percentual de (entradas − saídas) sobre as entradas confirmadas no período.",
          value: grossMarginPercentFormatted(),
          suffix: "%",
          icon: CirclePercent,
          isConditional: false,
        },
        {
          id: "total-entradas-7d",
          title: "Total de Entradas 7D",
          tooltip: "Total de entradas dos últimos 7 dias.",
          value: deposits.value.total / 100,
          variation: deposits.value.percentage,
          icon: CalendarCheck2,
          isConditional: !hideMetricsDaily.value,
        },
        {
          id: "taxa-aprovacao-depositos",
          title: "Taxa de Aprovação",
          tooltip:
            "Taxa de aprovação de entradas geradas e entradas confirmadas",
          value: deposits.value.conversion_rate,
          suffix: "%",
          icon: CirclePercent,
          isConditional: false,
        },
        {
          id: "ticket-medio-entradas",
          title: "Ticket Médio de Entradas",
          tooltip:
            "Valor médio por transação de entrada confirmadas realizada pelos usuários",
          value: deposits.value.average_ticket / 100,
          icon: ChartCandlestick,
          isConditional: false,
        },
        {
          id: "entradas-geradas",
          title: "Entradas Geradas",
          tooltip:
            "Valor total de transações de entrada iniciadas, independentemente da confirmação.",
          quantity: deposits.value.generated_deposits,
          value: deposits.value.total_pending_deposits / 100,
          icon: BanknoteArrowDown,
          isConditional: false,
        },
        {
          id: "entradas-confirmadas",
          title: "Entradas Confirmadas",
          tooltip:
            "Valor total de transações de entrada confirmadas com sucesso.",
          quantity: deposits.value.paid_deposits,
          value: deposits.value.total_paid_deposits / 100,
          icon: DollarSign,
          isConditional: false,
        },
      ];

      const withdrawCards = revenueWithdrawCards();
      const firstRow = depositCards.slice(0, 3);
      const rest = [...depositCards.slice(3), ...withdrawCards];
      const rows = [firstRow];
      for (let i = 0; i < rest.length; i += 4) {
        rows.push(rest.slice(i, i + 4));
      }
      return rows;
};

const buildCardsPlayers = () => {
      const allCards = [
        {
          id: "total-registros",
          title: "Total de Cadastros",
          tooltip:
            "Total de cadastros vinculados ao(s) projeto(s) filtrado(s) (contagem distinta na base da Elevate).",
          count: players.value.count,
          variation: players.value.change,
          icon: Users,
          isConditional: !hideMetricsDaily.value,
        },
        {
          id: "usuarios-ativos",
          title: "Clientes Ativos",
          tooltip:
            "Total de clientes ativos com pelo menos um pagamento nos últimos 30 dias",
          count: activeNow.value.count,
          variation: activeNow.value.change,
          icon: UserRound,
          isConditional: !hideMetricsDaily.value,
        },
        {
          id: "novos-registros",
          title: "Novos Cadastros",
          tooltip:
            "Total de cadastros completos no sistema no período selecionado",
          value: players.value.registered_users_day,
          icon: UserRoundPlus,
        },
        {
          id: "quantidade-logins",
          title: "Quantidade de Logins",
          tooltip:
            "Total de logins de clientes no período selecionado",
          count: Number(players.value.player_logins ?? 0),
          icon: LogIn,
        },
        {
          id: "taxa-conversao-geral",
          title: "Taxa de Conversão Geral",
          tooltip:
            "Percentual de cadastros do período que realizaram uma primeira transação validada (FTD).",
          value: (players.value.ftd_general_percent / 100).toFixed(2),
          suffix: "%",
          icon: CirclePercent,
        },
        {
          id: "primeiros-depositantes",
          title: "Cadastros convertidos em Clientes em D0",
          tooltip:
            "Cadastros cuja primeira transação (FTD) ocorreu no mesmo dia do cadastro.",
          quantity: players.value.ftd_registered_users_count,
          value: players.value.ftd_registered_users_amount / 100,
          icon: Wallet,
        },
        {
          id: "taxa-conversao-d0",
          title: "Taxa de Conversão em D0",
          tooltip:
            "Percentual de cadastros do período que realizaram a primeira transação no mesmo dia do cadastro.",
          value: (players.value.ftd_registered_users_percent / 100).toFixed(2),
          suffix: "%",
          icon: CirclePercent,
        },
        {
          id: "convertidos-pos-d0",
          title: "Convertidos pós D0",
          tooltip:
            "Primeiras entradas no período menos conversões em D0 (FTD após o dia do cadastro).",
          quantity: players.value.ftd_post_d0_count,
          value: players.value.ftd_post_d0_amount / 100,
          icon: CalendarCheck2,
        },
        {
          id: "percentual-convertidos-pos-d0",
          title: "% Clientes Convertidos pós D0",
          tooltip:
            "(Primeiras entradas − convertidos em D0) ÷ primeiras entradas, no período.",
          value: Number(players.value.ftd_post_d0_percent ?? 0).toFixed(2),
          suffix: "%",
          icon: CirclePercent,
        },
        {
          id: "primeiras-entradas",
          title: "Cadastros Convertidos em Clientes",
          tooltip:
            "Total de primeiras entradas (FTD) no período — cadastros que se converteram em clientes pagantes.",
          quantity: deposits.value.total_ftd_count,
          value: deposits.value.total_ftd_amount / 100,
          icon: ListCheck,
        },
      ];

  return [
        allCards.slice(0, 4),
        allCards.slice(4, 8),
        allCards.slice(8, 10),
      ];
};

const buildCardsRetention = () => {
      const allCards = [
        {
          id: "tempo-medio-retencao",
          title: "Tempo Médio de Retenção",
          tooltip:
            "Tempo médio consolidada: dias entre primeira e última entrada, apenas perfis com FTD e última entrada.",
          value: retention.value.time,
          icon: Hourglass,
        },
        // {
        //   id: "frequencia-media-deposito",
        //   title: "Frequência Média de Entrada",
        //   tooltip: "Frequência média de entrada do usuário.",
        //   count: 0,
        //   icon: "SquareActivity",
        // },
        {
          id: "ticket-medio-pos-ativacao",
          title: "Ticket Médio Pós-Ativação",
          tooltip:
            "Média da taxa de retenção consolidada, entre perfis com valor calculado.",
          value: retention.value.ticket_avg / 100,
          icon: ChartNoAxesColumn,
        },
      ];

  return [allCards];
};

const buildCardsHistory = () => {
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
};

const isToday = () => {
  return selectedRange.value?.start?.toString() === formatLocalDate(new Date());
};

const formatUpdatedAt = (updatedAt: string) => {
  if (!updatedAt) return "";
  return moment(updatedAt).format("HH:mm[h]");
};

const formatExecutionTime = (seconds: number) => {
  if (!seconds) return "";

  if (seconds < 1) {
    return "menos de 1s";
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}min`;
  }

  return `${minutes}min ${remainingSeconds}s`;
};

const refreshMetrics = async () => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;

      try {
        if (!workspaceStore.activeGroupProject?.id) {
          toast({
            title: "Erro",
            description: "Selecione um projeto antes de atualizar.",
            variant: "destructive",
          });
          return;
        }

        if (!isToday()) {
          toast({
            title: "Aviso",
            description:
              "A atualização manual só está disponível para a data atual.",
            variant: "default",
          });
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));

        await Home.refresh({
          filter_id: workspaceStore.activeGroupProject.id,
        });

        toast({
          title: "Sucesso",
          description:
            "As métricas estão sendo atualizadas. Isso pode levar alguns minutos.",
          variant: "default",
        });

        setTimeout(() => {
          applyFilter();
        }, 5000);
      } catch (error) {
        const typedError = error as any;
        toast({
          title: "Erro",
          description:
            typedError.response?.data?.message ||
            "Ocorreu um erro ao solicitar a atualização.",
          variant: "destructive",
        });
      } finally {
        isRefreshing.value = false;
      }
};

const resolveIcon = (icon: any) => {
  if (typeof icon === "string") {
    return iconRegistry[icon] ?? icon;
  }
  return icon;
};

useScreenContext(
  "Home - Dashboard principal com métricas gerais de receita, clientes, retenção e histórico de entradas",
  () => ({
    filter_id: workspaceStore.activeGroupProject?.id ?? "",
    project_name: workspaceStore.activeGroupProject?.name ?? "",
    start_date: selectedRange.value.start?.toString(),
    end_date: selectedRange.value.end?.toString(),
    total_registros: players.value.count,
    clientes_ativos: activeNow.value.count,
    retorno_bruto: deposits.value.total_net_deposits / 100,
    margem_bruta: grossMarginPercentFormatted(),
    entradas_confirmadas: deposits.value.total_paid_deposits / 100,
    saidas_confirmadas: withdraws.value.total_paid_withdraws / 100,
    ticket_medio_entradas: deposits.value.average_ticket / 100,
    ticket_medio_saida: withdraws.value.average_ticket / 100,
    tempo_medio_retencao: retention.value.time,
  }),
  "/v1/home",
);

watch(
  () => workspaceStore.activeGroupProject?.id,
  () => {
    applyFilter();
  },
);

watch(
  selectedRange,
  () => {
    applyFilter();
  },
  { deep: true },
);

onMounted(() => {
  _user();
  window.addEventListener("resize", handleResize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  Object.values(resizeObservers.value).forEach((observer) => observer.disconnect());
  Object.values(debounceTimers.value).forEach((timerId) => clearTimeout(timerId));
});
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

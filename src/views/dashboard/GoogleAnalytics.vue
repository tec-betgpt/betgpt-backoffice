<template>
  <div class="google-analytics-page space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Tráfego</h2>
        <p class="text-muted-foreground">
          Relatórios de tráfego de um período específico.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CustomDatePicker v-model="selectedRange" />
      </div>
    </div>

    <div>
      <Card class="w-full">
        <CardHeader>
          <div class="flex justify-between items-center gap-4">
            <CardTitle>Aquisição de Tráfego</CardTitle>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" class="ml-auto">
                  Colunas <ChevronDown class="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  v-for="column in columnsList"
                  :key="column.id"
                  class="capitalize"
                  :checked="columnVisibility[column.id]"
                  @update:checked="(value) => columnVisibility[column.id] = value"
                >
                  {{ column.label }}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <Separator />

        <CardContent class="mt-5">
          <div class="flex flex-col justify-end sm:flex-row gap-2 mb-4">
            <div class="grid w-full max-w-sm md:max-w-64 items-center gap-1.5">
              <Label for="input-group_by">Grupo</Label>
              <Select v-model="searchValues['search[0][group_by]']">
                <SelectTrigger class="sm:max-w-sm md:max-w-64 w-full">
                  <SelectValue placeholder="Selecione o agrupamento..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sessionDefaultChannelGroup">
                    Grupo de canais padrão da sessão
                  </SelectItem>
                  <SelectItem value="sessionPrimaryChannelGroup">
                    Grupo principal de canais da sessão
                  </SelectItem>
                  <SelectItem value="sessionSourceMedium">
                    Origem / mídia da sessão
                  </SelectItem>
                  <SelectItem value="sessionMedium">
                    Sessão/média
                  </SelectItem>
                  <SelectItem value="sessionSource">
                    Origem da sessão
                  </SelectItem>
                  <SelectItem value="sessionTrafficOrigin">
                    Plataforma de origem da sessão
                  </SelectItem>
                  <SelectItem value="sessionCampaignName">
                    Campanha da sessão
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid w-full max-w-sm md:max-w-56 items-center gap-1.5">
              <Label for="input-channel">Canal</Label>
              <Input
                id="input-channel"
                class="sm:max-w-sm md:max-w-64 w-full"
                placeholder="Buscar por canal..."
                v-model="searchValues['search[1][channel]']"
              />
            </div>

            <Button class="mt-0 lg:mt-6" @click="applyFilter()" :disabled="loading">
              <Search />
            </Button>
          </div>

          <div class="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead v-if="columnVisibility.channel">
                    <Button
                      :variant="orderId === 'channel' ? 'default' : 'ghost'"
                      @click="() => { orderId = 'channel'; order = !order; applyFilter(1); }"
                      class="px-3 text-nowrap"
                      :title="columnsList.find(i => i.id === 'channel')?.tooltip"
                    >
                      Grupo
                      <component :is="orderId === 'channel' ? (order ? ArrowDown : ArrowUp) : ChevronsUpDown" />
                    </Button>
                  </TableHead>
                  <TableHead v-if="columnVisibility.sessions" class="text-right">
                    <Button
                      :variant="orderId === 'sessions' ? 'default' : 'ghost'"
                      @click="() => { orderId = 'sessions'; order = !order; applyFilter(1); }"
                      class="px-3 text-nowrap"
                      :title="columnsList.find(i => i.id === 'sessions')?.tooltip"
                    >
                      Sessões
                      <component :is="orderId === 'sessions' ? (order ? ArrowDown : ArrowUp) : ChevronsUpDown" />
                    </Button>
                  </TableHead>
                  <TableHead v-if="columnVisibility.engagedSessions" class="text-right">
                    <Button
                      :variant="orderId === 'engagedSessions' ? 'default' : 'ghost'"
                      @click="() => { orderId = 'engagedSessions'; order = !order; applyFilter(1); }"
                      class="px-3 text-nowrap"
                      :title="columnsList.find(i => i.id === 'engagedSessions')?.tooltip"
                    >
                      Sessões Engajadas
                      <component :is="orderId === 'engagedSessions' ? (order ? ArrowDown : ArrowUp) : ChevronsUpDown" />
                    </Button>
                  </TableHead>
                  <TableHead v-if="columnVisibility.engagementRate" class="text-right">
                    <Button
                      :variant="orderId === 'engagementRate' ? 'default' : 'ghost'"
                      @click="() => { orderId = 'engagementRate'; order = !order; applyFilter(1); }"
                      class="px-3 text-nowrap"
                      :title="columnsList.find(i => i.id === 'engagementRate')?.tooltip"
                    >
                      Engajamento
                      <component :is="orderId === 'engagementRate' ? (order ? ArrowDown : ArrowUp) : ChevronsUpDown" />
                    </Button>
                  </TableHead>
                  <TableHead v-if="columnVisibility.averageEngagementDuration" class="text-right">
                    <Button
                      :variant="orderId === 'averageEngagementDuration' ? 'default' : 'ghost'"
                      @click="() => { orderId = 'averageEngagementDuration'; order = !order; applyFilter(1); }"
                      class="px-3 text-right"
                      :title="columnsList.find(i => i.id === 'averageEngagementDuration')?.tooltip"
                    >
                      Tempo Médio <br> de Engajamento
                      <component :is="orderId === 'averageEngagementDuration' ? (order ? ArrowDown : ArrowUp) : ChevronsUpDown" />
                    </Button>
                  </TableHead>
                  <TableHead v-if="columnVisibility.eventsPerSession" class="text-right">
                    <Button
                      :variant="orderId === 'eventsPerSession' ? 'default' : 'ghost'"
                      @click="() => { orderId = 'eventsPerSession'; order = !order; applyFilter(1); }"
                      class="px-3 text-nowrap"
                      :title="columnsList.find(i => i.id === 'eventsPerSession')?.tooltip"
                    >
                      Eventos por Sessão
                      <component :is="orderId === 'eventsPerSession' ? (order ? ArrowDown : ArrowUp) : ChevronsUpDown" />
                    </Button>
                  </TableHead>
                  <TableHead v-if="columnVisibility.eventCount" class="text-right">
                    <Button
                      :variant="orderId === 'eventCount' ? 'default' : 'ghost'"
                      @click="() => { orderId = 'eventCount'; order = !order; applyFilter(1); }"
                      class="px-3 text-nowrap"
                      :title="columnsList.find(i => i.id === 'eventCount')?.tooltip"
                    >
                      Contagem de Eventos
                      <component :is="orderId === 'eventCount' ? (order ? ArrowDown : ArrowUp) : ChevronsUpDown" />
                    </Button>
                  </TableHead>
                  <TableHead v-if="columnVisibility.keyEvents" class="text-right">
                    <Button
                      :variant="orderId === 'keyEvents' ? 'default' : 'ghost'"
                      @click="() => { orderId = 'keyEvents'; order = !order; applyFilter(1); }"
                      class="px-3 text-nowrap"
                      :title="columnsList.find(i => i.id === 'keyEvents')?.tooltip"
                    >
                      Eventos Principais
                      <component :is="orderId === 'keyEvents' ? (order ? ArrowDown : ArrowUp) : ChevronsUpDown" />
                    </Button>
                  </TableHead>
                  <TableHead v-if="columnVisibility.sessionKeyEventRate" class="text-right">
                    <Button
                      :variant="orderId === 'sessionKeyEventRate' ? 'default' : 'ghost'"
                      @click="() => { orderId = 'sessionKeyEventRate'; order = !order; applyFilter(1); }"
                      class="px-3 text-nowrap"
                      :title="columnsList.find(i => i.id === 'sessionKeyEventRate')?.tooltip"
                    >
                      Taxa de Eventos Principais
                      <component :is="orderId === 'sessionKeyEventRate' ? (order ? ArrowDown : ArrowUp) : ChevronsUpDown" />
                    </Button>
                  </TableHead>
                  <TableHead v-if="columnVisibility.totalRevenue" class="text-right">
                    <Button
                      :variant="orderId === 'totalRevenue' ? 'default' : 'ghost'"
                      @click="() => { orderId = 'totalRevenue'; order = !order; applyFilter(1); }"
                      class="px-3 text-nowrap"
                      :title="columnsList.find(i => i.id === 'totalRevenue')?.tooltip"
                    >
                      Receita Total
                      <component :is="orderId === 'totalRevenue' ? (order ? ArrowDown : ArrowUp) : ChevronsUpDown" />
                    </Button>
                  </TableHead>
                </TableRow>
                <TableRow v-if="totalGroupSessions" class="bg-gray-50/10">
                  <TableHead v-if="columnVisibility.channel" class="text-left font-bold">
                    {{ totalGroupSessions.channel }}
                  </TableHead>
                  <TableHead v-if="columnVisibility.sessions" :title="numberLocale(totalGroupSessions.sessions)" class="text-right font-bold flex items-center justify-end">
                    <Badge v-if="totalGroupSessions.variation > 0" class="bg-green-200 text-green-600 h-4 px-1 mr-2">
                      <ArrowUp class="w-3 mr-2" /> {{ Math.abs(totalGroupSessions.variation || 0).toFixed(1) }}%
                    </Badge>
                    <Badge v-if="totalGroupSessions.variation < 0" class="bg-red-200 text-red-600 h-4 px-1 mr-2">
                      <ArrowDown class="w-3 mr-2" /> {{ Math.abs(totalGroupSessions.variation || 0).toFixed(1) }}%
                    </Badge>
                    {{ formatMinifiedNumber(totalGroupSessions.sessions) }}
                  </TableHead>
                  <TableHead v-if="columnVisibility.engagedSessions" :title="numberLocale(totalGroupSessions.engagedSessions)" class="text-right font-bold">
                    {{ formatMinifiedNumber(totalGroupSessions.engagedSessions) }}
                  </TableHead>
                  <TableHead v-if="columnVisibility.engagementRate" class="text-right font-bold">
                    {{ formatPercentage(totalGroupSessions.engagementRate) }}
                  </TableHead>
                  <TableHead v-if="columnVisibility.averageEngagementDuration" class="text-right font-bold">
                    {{ secondsToTime(totalGroupSessions.averageEngagementDuration) }}
                  </TableHead>
                  <TableHead v-if="columnVisibility.eventsPerSession" class="text-right font-bold">
                    {{ fractionDigits(totalGroupSessions.eventsPerSession) }}
                  </TableHead>
                  <TableHead v-if="columnVisibility.eventCount" :title="numberLocale(totalGroupSessions.eventCount)" class="text-right font-bold">
                    {{ formatMinifiedNumber(totalGroupSessions.eventCount) }}
                  </TableHead>
                  <TableHead v-if="columnVisibility.keyEvents" :title="numberLocale(totalGroupSessions.keyEvents)" class="text-right font-bold">
                    {{ formatMinifiedNumber(totalGroupSessions.keyEvents) }}
                  </TableHead>
                  <TableHead v-if="columnVisibility.sessionKeyEventRate" class="text-right font-bold">
                    {{ formatPercentage(totalGroupSessions.sessionKeyEventRate) }}
                  </TableHead>
                  <TableHead v-if="columnVisibility.totalRevenue" :title="currencyFilter(totalGroupSessions.totalRevenue)" class="text-right font-bold flex items-center justify-end">
                    <Badge v-if="totalGroupSessions.totalRevenueVariation > 0" class="bg-green-200 text-green-600 h-4 px-1 mr-2">
                      <ArrowUp class="w-3 mr-2" /> {{ Math.abs(totalGroupSessions.totalRevenueVariation || 0).toFixed(1) }}%
                    </Badge>
                    <Badge v-if="totalGroupSessions.totalRevenueVariation < 0" class="bg-red-200 text-red-600 h-4 px-1 mr-2">
                      <ArrowDown class="w-3 mr-2" /> {{ Math.abs(totalGroupSessions.totalRevenueVariation || 0).toFixed(1) }}%
                    </Badge>
                    R$ {{ formatMinifiedNumber(totalGroupSessions.totalRevenue) }}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="loading">
                  <TableRow v-for="i in 5" :key="i">
                    <TableCell v-for="key in Object.keys(columnVisibility).filter(k => columnVisibility[k])" :key="key">
                      <Skeleton class="h-4 w-full bg-gray-300" />
                    </TableCell>
                  </TableRow>
                </template>
                <template v-else-if="groupSessionsData.length">
                  <TableRow v-for="(row, index) in groupSessionsData" :key="index">
                    <TableCell v-if="columnVisibility.channel">
                      <div class="font-medium">{{ row.channel || "-" }}</div>
                    </TableCell>
                    <TableCell v-if="columnVisibility.sessions">
                      <div
                        :title="numberLocale(row.sessions || 0)"
                        class="text-right text-nowrap flex-nowrap flex items-center justify-end"
                      >
                        <Badge v-if="row.variation > 0" class="bg-green-200 text-green-600 h-4 px-1 mr-2">
                          <ArrowUp class="w-3 mr-2" /> {{ Math.abs(row.variation || 0).toFixed(1) }}%
                        </Badge>
                        <Badge v-if="row.variation < 0" class="bg-red-200 text-red-600 h-4 px-1 mr-2">
                          <ArrowDown class="w-3 mr-2" /> {{ Math.abs(row.variation || 0).toFixed(1) }}%
                        </Badge>

                        {{ formatMinifiedNumber(row.sessions || 0) }}
                      </div>
                    </TableCell>
                    <TableCell v-if="columnVisibility.engagedSessions">
                      <div class="text-right" :title="numberLocale(row.engagedSessions)">
                        {{ formatMinifiedNumber(row.engagedSessions || 0) }}
                      </div>
                    </TableCell>
                    <TableCell v-if="columnVisibility.engagementRate">
                      <div class="text-right">{{ formatPercentage(row.engagementRate) }}</div>
                    </TableCell>
                    <TableCell v-if="columnVisibility.averageEngagementDuration">
                      <div class="text-right">{{ secondsToTime(row.averageEngagementDuration) }}</div>
                    </TableCell>
                    <TableCell v-if="columnVisibility.eventsPerSession">
                      <div class="text-right">{{ fractionDigits(row.eventsPerSession) }}</div>
                    </TableCell>
                    <TableCell v-if="columnVisibility.eventCount" :title="numberLocale(row.eventCount)">
                      <div class="text-right">{{ formatMinifiedNumber(row.eventCount || 0) }}</div>
                    </TableCell>
                    <TableCell v-if="columnVisibility.keyEvents" :title="numberLocale(row.keyEvents)">
                      <div class="text-right">{{ formatMinifiedNumber(row.keyEvents || 0) }}</div>
                    </TableCell>
                    <TableCell v-if="columnVisibility.sessionKeyEventRate">
                      <div class="text-right">{{ formatPercentage(row.sessionKeyEventRate) }}</div>
                    </TableCell>
                    <TableCell v-if="columnVisibility.totalRevenue" :title="currencyFilter(row.totalRevenue)">
                      <div class="text-right flex items-center justify-end">
                        <Badge v-if="row.totalRevenueVariation > 0" class="bg-green-200 text-green-600 h-4 px-1 mr-2">
                          <ArrowUp class="w-3 mr-2" /> {{ Math.abs(row.totalRevenueVariation || 0).toFixed(1) }}%
                        </Badge>
                        <Badge v-if="row.totalRevenueVariation < 0" class="bg-red-200 text-red-600 h-4 px-1 mr-2">
                          <ArrowDown class="w-3 mr-2" /> {{ Math.abs(row.totalRevenueVariation || 0).toFixed(1) }}%
                        </Badge>
                        R$ {{ formatMinifiedNumber(row.totalRevenue) }}
                      </div>
                    </TableCell>
                  </TableRow>
                </template>
                <template v-else>
                  <TableRow>
                    <TableCell :colspan="Object.keys(columnVisibility).filter(k => columnVisibility[k]).length" class="h-24 text-center">
                      Sem resultados.
                    </TableCell>
                  </TableRow>
                </template>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell v-if="columnVisibility.channel" class="text-left font-bold">
                    {{ groupSessionsStats.channel }}
                  </TableCell>
                  <TableCell v-if="columnVisibility.sessions" :title="numberLocale(groupSessionsStats.sessions)" class="text-right font-bold">
                    {{ formatMinifiedNumber(groupSessionsStats.sessions) }}
                  </TableCell>
                  <TableCell v-if="columnVisibility.engagedSessions" :title="numberLocale(groupSessionsStats.engagedSessions)" class="text-right font-bold">
                    {{ formatMinifiedNumber(groupSessionsStats.engagedSessions) }}
                  </TableCell>
                  <TableCell v-if="columnVisibility.engagementRate" class="text-right font-bold">
                    {{ formatPercentage(groupSessionsStats.engagementRate) }}
                  </TableCell>
                  <TableCell v-if="columnVisibility.averageEngagementDuration" class="text-right font-bold">
                    {{ secondsToTime(groupSessionsStats.averageEngagementDuration) }}
                  </TableCell>
                  <TableCell v-if="columnVisibility.eventsPerSession" class="text-right font-bold">
                    {{ fractionDigits(groupSessionsStats.eventsPerSession) }}
                  </TableCell>
                  <TableCell v-if="columnVisibility.eventCount" class="text-right font-bold">
                    {{ formatMinifiedNumber(groupSessionsStats.eventCount) }}
                  </TableCell>
                  <TableCell v-if="columnVisibility.keyEvents" class="text-right font-bold">
                    {{ formatMinifiedNumber(groupSessionsStats.keyEvents) }}
                  </TableCell>
                  <TableCell v-if="columnVisibility.sessionKeyEventRate" class="text-right font-bold">
                    {{ formatPercentage(groupSessionsStats.sessionKeyEventRate) }}
                  </TableCell>
                  <TableCell v-if="columnVisibility.totalRevenue" :title="numberLocale(groupSessionsStats.totalRevenue)" class="text-right font-bold">
                    R$ {{ formatMinifiedNumber(groupSessionsStats.totalRevenue) }}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>

        <CardFooter class="py-4 w-full">
          <CustomPagination
            :pages="{
              current: pages.current,
              last: pages.last,
              total: pages.total,
            }"
            :select-page="applyFilter"
            @update:perPages="(value) => (perPages = value)"
            :per_pages="perPages"
          />
        </CardFooter>
      </Card>
    </div>

    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1">
      <SessionChannelPieChart :group-session-data="groupSessionsData" />

      <TotalRevenuePieChart :group-session-data="groupSessionsData" />

      <PeriodComponent
        :is-loading="loading"
        :period="usersPeriod"
        title="Usuários"
        glossary="Dados de Usuários novos e ativo"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="payingActivePeriod"
        title="Usuários Ativos Pagantes por período"
        glossary="Dados de Pagantes Ativos por período, com diferença de 7D, 14D e 28D"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="totalUsersPeriod"
        title="Total de Usuários"
        glossary="Dados de total de usuários"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="returningUsersPeriod"
        title="Usuários Recorrentes"
        glossary="Dados de Usuários Recorrentes por período"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="firstTimePurchasersPeriod"
        title="Total de Primeiros Compradores"
        glossary="Dados de Primeiros Compradores por período"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="engagementRatePeriod"
        title="Taxa de Engajamento por período"
        type="percent"
        glossary="Percentual de usuários engajados por período"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="bounceRatePeriod"
        title="Taxa de Rejeição"
        type="percent"
        glossary="Percentual de usuários que saíram do site sem interagir"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="arpuPeriod"
        title="ARPU"
        type="currency"
        glossary="Receita média por usuário ativo por período"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="arppuPeriod"
        title="ARPPU"
        type="currency"
        glossary="Receita média por usuário pagante por período"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import { getLocalTimeZone, today } from "@internationalized/date";
import { ChevronsUpDown, ArrowDown, ArrowUp, ChevronDown, Search } from "lucide-vue-next";
import { formatMinifiedNumber, formatPercentage, fractionDigits, numberLocale, secondsToTime } from "@/filters/formatNumbers";
import "moment/dist/locale/pt-br";
import GoogleAnalytics from "@/services/googleAnalytics";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import PeriodComponent from "@/components/google_analytics/PeriodComponent.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import SessionChannelPieChart from "@/components/google_analytics/SessionChannelPieChart.vue";
import TotalRevenuePieChart from "@/components/google_analytics/TotalRevenuePieChart.vue";
import currencyFilter from "@/filters/currencyFilter";

const workspaceStore = useWorkspaceStore();
const { toast } = useToast();

const currentDate = today(getLocalTimeZone());
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({
  start: startDate,
  end: currentDate,
});

const loading = ref(false);
const usersPeriod = ref<{ name: string; value: number[] }[]>([]);
const totalUsersPeriod = ref<{ name: string; value: number[] }[]>([]);
const returningUsersPeriod = ref<{ name: string; value: number[] }[]>([]);
const firstTimePurchasersPeriod = ref<{ name: string; value: number[] }[]>([]);
const payingActivePeriod = ref<{ name: string; value: number[] }[]>([]);
const engagementRatePeriod = ref<{ name: string; value: number[] }[]>([]);
const totalRevenuePeriod = ref<{ name: string; value: number[] }[]>([]);
const engagementDurationSessionPeriod = ref<{ name: string; value: number[] }[]>([]);
const arppuPeriod = ref<{ name: string; value: number[] }[]>([]);
const arpuPeriod = ref<{ name: string; value: number[] }[]>([]);
const bounceRatePeriod = ref<{ name: string; value: number[] }[]>([]);
const selectedGroupBy = ref("sessionDefaultChannelGroup");
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const perPages = ref(20);
const orderId = ref("sessions");
const order = ref(false);
const groupSessionsData = ref<GroupSession[]>([]);
const isFirstLoad = ref(true);
const searchValues = ref<Record<string, string>>({ "search[1][channel]": "" });
const backendTotals = ref();
const variationTotal = ref(0);

const totalGroupSessions = computed(() => {
  if (!backendTotals.value) return null;

  return {
    channel: "Total Geral",
    sessions: backendTotals.value.sessions || 0,
    engagedSessions: backendTotals.value.engagedSessions || 0,
    engagementRate: backendTotals.value.engagementRate || 0,
    averageEngagementDuration: backendTotals.value.averageEngagementDuration || 0,
    eventsPerSession: backendTotals.value.eventsPerSession || 0,
    eventCount: backendTotals.value.eventCount || 0,
    keyEvents: backendTotals.value.keyEvents || 0,
    sessionKeyEventRate: backendTotals.value.sessionKeyEventRate || 0,
    totalRevenue: backendTotals.value.totalRevenue || 0,
    variation: variationTotal.value,
    totalRevenueVariation: backendTotals.value.totalRevenueVariation || 0,
  };
});

const groupSessionsStats = computed(() => {
  if (!groupSessionsData.value.length) {
    return {
      channel: "Total da Página",
      sessions: 0,
      engagedSessions: 0,
      engagementRate: 0,
      averageEngagementDuration: 0,
      eventsPerSession: 0,
      eventCount: 0,
      keyEvents: 0,
      sessionKeyEventRate: 0,
      totalRevenue: 0,
      variation: 0,
      totalRevenueVariation: 0
    };
  }

  const totals = {
    channel: "Total da Página",
    sessions: 0,
    engagedSessions: 0,
    engagementRate: 0,
    averageEngagementDuration: 0,
    eventsPerSession: 0,
    eventCount: 0,
    keyEvents: 0,
    sessionKeyEventRate: 0,
    totalRevenue: 0,
    variation: 0,
    totalRevenueVariation: 0
  };

  groupSessionsData.value.forEach((item) => {
    totals.sessions += item.sessions || 0;
    totals.engagedSessions += item.engagedSessions || 0;
    totals.eventCount += item.eventCount || 0;
    totals.keyEvents += item.keyEvents || 0;
    totals.totalRevenue += item.totalRevenue || 0;
    totals.engagementRate += item.engagementRate || 0;
    totals.averageEngagementDuration += item.averageEngagementDuration || 0;
    totals.eventsPerSession += item.eventsPerSession || 0;
    totals.sessionKeyEventRate += item.sessionKeyEventRate || 0;
    totals.variation += item.variation || 0;
    totals.totalRevenueVariation += item.totalRevenueVariation || 0;
  });

  const count = groupSessionsData.value.length;
  totals.engagementRate = count > 0 ? totals.engagementRate / count : 0;
  totals.averageEngagementDuration =
    count > 0 ? totals.averageEngagementDuration / count : 0;
  totals.eventsPerSession = count > 0 ? totals.eventsPerSession / count : 0;
  totals.sessionKeyEventRate =
    count > 0 ? totals.sessionKeyEventRate / count : 0;

  return totals;
});

const formatDateForAPI = (date: any): string => {
  if (!date) return "";

  if (
    date &&
    typeof date === "object" &&
    "year" in date &&
    "month" in date &&
    "day" in date
  ) {
    return `${date.year}-${String(date.month).padStart(2, "0")}-${String(
      date.day
    ).padStart(2, "0")}`;
  }

  if (typeof date === "string") {
    return date;
  }

  return "";
};

const applyFilter = async (current = pages.value.current) => {
  if (loading.value) return;

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
    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      if (searchValues.value[key]) {
        acc[key] = searchValues.value[key];
      }
      return acc;
    }, {} as Record<string, string>);

    const channelSearch = searchValues.value["search[1][channel]"];
    const groupByValue = selectedGroupBy.value || "sessionDefaultChannelGroup";

    const startDateFormatted = formatDateForAPI(selectedRange.value.start);
    const endDateFormatted = formatDateForAPI(selectedRange.value.end);

    const params: any = {
      page: current,
      ...searchParams,
      start_date: startDateFormatted,
      end_date: endDateFormatted,
      filter_id: workspaceStore.activeGroupProject.id,
      order_by: orderId.value,
      type_order: order.value ? "asc" : "desc",
      per_pages: perPages.value,
      group_by: groupByValue,
    };

    if (channelSearch && channelSearch.trim() !== "") {
      params.search = channelSearch.trim();
    }

    const { data } = await GoogleAnalytics.index(params);

    groupSessionsData.value = data.group_sessions?.data || [];
    backendTotals.value = data.group_sessions?.total || {};
    variationTotal.value = data.group_sessions?.variation_total || 0;

    if (data.group_sessions?.pagination) {
      pages.value = {
        current: data.group_sessions.pagination.current_page || 1,
        total: data.group_sessions.pagination.total || 0,
        last: data.group_sessions.pagination.last_page || 1,
      };
    }

    usersPeriod.value = [
      { name: "Usuários Novos", value: data.users_period || [] },
      { name: "Usuários Ativos", value: data.users_period || [] },
    ];
    totalUsersPeriod.value = [
      { name: "Total de Usuários", value: data.total_users_period || [] },
    ];
    returningUsersPeriod.value = [
      {
        name: "Usuários Recorrentes",
        value: data.returning_users_period || [],
      },
    ];
    firstTimePurchasersPeriod.value = [
      {
        name: "Primeiros Compradores",
        value: data.first_time_purchasers_period || [],
      },
    ];
    payingActivePeriod.value = [
      { name: "7 Dias", value: data.paying_active_period || [] },
      { name: "14 Dias", value: data.paying_active_period || [] },
      { name: "28 Dias", value: data.paying_active_period || [] },
    ];
    engagementRatePeriod.value = [
      {
        name: "% Taxa de Engajamento",
        value: (data.engagement_rate_period ?? []).map((item) => ({
          ...item,
          "% Taxa de Engajamento": (item["% Taxa de Engajamento"] ?? 0) / 100,
        })),
      },
    ];
    bounceRatePeriod.value = [
      {
        name: "% Taxa de Rejeição",
        value: (data.bounce_rate_period ?? []).map((item) => ({
          ...item,
          "% Taxa de Rejeição": (item["% Taxa de Rejeição"] ?? 0) / 100,
        })),
      },
    ];
    totalRevenuePeriod.value = [
      { name: "Receita", value: data.total_revenue || [] },
    ];
    engagementDurationSessionPeriod.value = [
      {
        name: "Tempo médio",
        value: data.engagement_duration_per_sessions || [],
      },
    ];
    arppuPeriod.value = [{ name: "ARPPU", value: data.arppu || [] }];
    arpuPeriod.value = [{ name: "ARPU", value: data.arpu || [] }];
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
    isFirstLoad.value = false;
  }
};

type GroupSession = {
  channel: string;
  sessions: number;
  variation: number;
  engagedSessions: number;
  engagementRate: number;
  averageEngagementDuration: number;
  eventsPerSession: number;
  eventCount: number;
  keyEvents: number;
  sessionKeyEventRate: number;
  totalRevenue: number;
  totalRevenueVariation?: number;
};

const columnVisibility = ref<Record<string, boolean>>({
  channel: true,
  sessions: true,
  engagedSessions: true,
  engagementRate: true,
  averageEngagementDuration: false,
  eventsPerSession: false,
  eventCount: false,
  keyEvents: false,
  sessionKeyEventRate: false,
  totalRevenue: true,
});

const columnsList = [
  {
    id: 'channel',
    label: 'Grupo',
    tooltip: 'Canais de origem do tráfego agrupados por categorias (ex: Busca Orgânica, Social, Direto).'
  },
  {
    id: 'sessions',
    label: 'Sessões',
    tooltip: 'Número de visitas iniciadas no seu site ou aplicativo.'
  },
  {
    id: 'engagedSessions',
    label: 'Sessões Engajadas',
    tooltip: 'Sessões que duraram mais de 10s, tiveram um evento principal ou pelo menos 2 visualizações de página.'
  },
  {
    id: 'engagementRate',
    label: 'Engajamento',
    tooltip: 'Porcentagem de sessões que foram consideradas engajadas em relação ao total de sessões.'
  },
  {
    id: 'averageEngagementDuration',
    label: 'Tempo Médio de Engajamento',
    tooltip: 'Tempo médio que o site ou aplicativo ficou ativo em primeiro plano na tela do usuário.'
  },
  {
    id: 'eventsPerSession',
    label: 'Eventos por Sessão',
    tooltip: 'Média de eventos disparados por sessão.'
  },
  {
    id: 'eventCount',
    label: 'Contagem de Eventos',
    tooltip: 'Número total de eventos disparados pelos usuários.'
  },
  {
    id: 'keyEvents',
    label: 'Eventos Principais',
    tooltip: 'Número de eventos marcados como importantes para o negócio (antigas Conversões).'
  },
  {
    id: 'sessionKeyEventRate',
    label: 'Taxa de Eventos Principais',
    tooltip: 'Porcentagem de sessões que geraram pelo menos um evento principal.'
  },
  {
    id: 'totalRevenue',
    label: 'Receita Total',
    tooltip: 'Soma da receita proveniente de compras, assinaturas e publicidade.'
  },
];

watch(
  selectedRange,
  () => {
    if (!isFirstLoad.value) {
      applyFilter(1);
    }
  },
  { deep: true }
);

watch(perPages, (newPages) => {
  if (!isFirstLoad.value && newPages) {
    applyFilter(1);
  }
});

watch(
  () => searchValues.value["search[0][group_by]"],
  (newVal) => {
    if (newVal) selectedGroupBy.value = newVal;
  }
);

onMounted(() => {
  searchValues.value = {
    "search[0][group_by]": "sessionDefaultChannelGroup",
    "search[1][channel]": "",
  };

  setTimeout(() => {
    applyFilter(1);
  }, 100);
});
</script>

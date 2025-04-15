<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Tráfego</h2>
      <p class="text-muted-foreground">
        Relatórios de tráfego de um período específico.
      </p>
    </div>
    <div class="flex items-center justify-end mb-3">
      <div class="flex items-center max-[450px]:flex-col gap-2 w-full">
        <div class="flex flex-col sm:flex-row gap-2 w-full">
          <DateRangePicker v-model="selectedRange" class="max-[450px]:flex-2" />
          <Button class="max-[450px]:flex-1" @click="applyFilter"
            >Filtrar</Button
          >
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="usersPeriod"
              index="date"
              :categories="['Usuários Novos', 'Usuários Ativos']"
              :y-formatter="
                (tick, i) =>
                  typeof tick === 'number'
                    ? `${new Intl.NumberFormat('pt-BR')
                        .format(tick)
                        .toString()}`
                    : ''
              "
              :custom-tooltip="CustomChartTooltip"
            />
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-4 md:grid-cols-6 lg:grid-cols-6 mb-3">
        <Card class="col-span-3">
          <CardHeader class="pb-3">
            <Skeleton class="h-6 w-full" v-if="loading" />
            <CardTitle v-else>Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading">
              <Skeleton class="pl-5 h-80 w-full" />
            </div>
            <div v-else>
              <LineChart
                :data="totalUsersPeriod"
                index="date"
                :categories="['Total de Usuários']"
                :custom-tooltip="CustomChartTooltip"
              />
            </div>
          </CardContent>
        </Card>
        <Card class="col-span-3">
          <CardHeader class="pb-3">
            <Skeleton class="h-6 w-full" v-if="loading" />
            <CardTitle v-else>Usuários Recorrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading">
              <Skeleton class="pl-5 h-80 w-full" />
            </div>
            <div v-else>
              <LineChart
                :data="returningUsersPeriod"
                index="date"
                :categories="['Usuários Recorrentes']"
                :custom-tooltip="CustomChartTooltip"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-4 md:grid-cols-6 lg:grid-cols-6 mb-3">
        <Card class="col-span-3">
          <CardHeader class="pb-3">
            <Skeleton class="h-6 w-full" v-if="loading" />
            <CardTitle v-else>Total de Primeiros Compradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading">
              <Skeleton class="pl-5 h-80 w-full" />
            </div>
            <div v-else>
              <LineChart
                :data="firstTimePurchasersPeriod"
                index="date"
                :categories="['Primeiros Compradores']"
                :custom-tooltip="CustomChartTooltip"
              />
            </div>
          </CardContent>
        </Card>
        <Card class="col-span-3">
          <CardHeader class="pb-3">
            <Skeleton class="h-6 w-full" v-if="loading" />
            <CardTitle v-else>Taxa de Engajamento por período</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading">
              <Skeleton class="pl-5 h-80 w-full" />
            </div>
            <div v-else>
              <LineChart
                :data="engagementRatePeriod"
                index="date"
                :categories="['% Taxa de Engajamento']"
                :y-formatter="
                  (tick, i) =>
                    typeof tick === 'number'
                      ? `${(tick / 100).toFixed(2)}%`
                      : ''
                "
                :custom-tooltip="CustomChartTooltipPercent"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Usuários Ativos Pagantes por período</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="payingActivePeriod"
              index="date"
              :categories="[
                '7D Pagantes Ativos',
                '14D Pagantes Ativos',
                '28D Pagantes Ativos',
              ]"
              :custom-tooltip="CustomChartTooltip"
            />
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-4 md:grid-cols-6 lg:grid-cols-6 mb-3">
        <Card class="col-span-3">
          <CardHeader class="pb-3">
            <Skeleton class="h-6 w-full" v-if="loading" />
            <CardTitle v-else>Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading">
              <Skeleton class="pl-5 h-80 w-full" />
            </div>
            <div v-else>
              <LineChart
                :data="totalRevenuePeriod"
                index="date"
                :categories="['Receita']"
                :y-formatter="
                  (tick, i) =>
                    typeof tick === 'number'
                      ? `R$ ${new Intl.NumberFormat('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                          .format(tick / 100)
                          .toString()}`
                      : ''
                "
                :custom-tooltip="CustomChartTooltipPrice"
              />
            </div>
          </CardContent>
        </Card>
        <Card class="col-span-3">
          <CardHeader class="pb-3">
            <Skeleton class="h-6 w-full" v-if="loading" />
            <CardTitle v-else
              >Tempo médio de engajamento por sessão (segundos)</CardTitle
            >
          </CardHeader>
          <CardContent>
            <div v-if="loading">
              <Skeleton class="pl-5 h-80 w-full" />
            </div>
            <div v-else>
              <LineChart
                :data="engagementDurationSessionPeriod"
                index="date"
                :categories="['Tempo médio']"
                :custom-tooltip="CustomChartTooltip"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-6 lg:grid-cols-6 mb-3">
      <Card class="col-span-3">
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>ARPPU</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="arppuPeriod"
              index="date"
              :categories="['ARPPU']"
              :y-formatter="
                (tick, i) =>
                  typeof tick === 'number'
                    ? `R$ ${new Intl.NumberFormat('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                        .format(tick / 100)
                        .toString()}`
                    : ''
              "
              :custom-tooltip="CustomChartTooltipPrice"
            />
          </div>
        </CardContent>
      </Card>
      <Card class="col-span-3">
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>ARPU</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="arpuPeriod"
              index="date"
              :categories="['ARPU']"
              :y-formatter="
                (tick, i) =>
                  typeof tick === 'number'
                    ? `R$ ${new Intl.NumberFormat('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                        .format(tick / 100)
                        .toString()}`
                    : ''
              "
              :custom-tooltip="CustomChartTooltipPrice"
            />
          </div>
        </CardContent>
      </Card>
    </div>

    <div>
      <Card>
        <CardHeader>
          <CardTitle>Aquisição de Tráfego</CardTitle>
        </CardHeader>
        <CardContent>
          <Table class="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead>Sessões</TableHead>
                <TableHead>Sessões Engajadas</TableHead>
                <TableHead>Taxa de Engajamento</TableHead>
                <TableHead>Tempo Médio de Engajamento por Sessão</TableHead>
                <TableHead>Eventos por Sessão</TableHead>
                <TableHead>Contagem de Eventos</TableHead>
                <TableHead>Eventos Principais</TableHead>
                <TableHead>Taxa de Eventos Principais por Sessão</TableHead>
                <TableHead>Receita Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="loading">
                <TableRow v-for="n in 5" :key="`loading-${n}`">
                  <TableCell v-for="m in 10" :key="`loading-cell-${n}-${m}`">
                    <Skeleton class="h-4 w-full bg-gray-300" />
                  </TableCell>
                </TableRow>
              </template>
              <template v-else>
                <TableRow>
                  <TableCell><b>Total</b></TableCell>
                  <TableCell>{{ groupSessionsStats.totalSessions }}</TableCell>
                  <TableCell>{{
                    groupSessionsStats.totalEngagedSessions
                  }}</TableCell>
                  <TableCell
                    >{{
                      groupSessionsStats.averageEngagementRate.toFixed(2)
                    }}%</TableCell
                  >
                  <TableCell>{{
                    formatDuration(groupSessionsStats.averageEngagementDuration)
                  }}</TableCell>
                  <TableCell>{{
                    (groupSessionsStats.averageEventsPerSession / 100).toFixed(
                      2
                    )
                  }}</TableCell>
                  <TableCell>{{
                    groupSessionsStats.totalEventCount
                  }}</TableCell>
                  <TableCell>{{ groupSessionsStats.totalKeyEvents }}</TableCell>
                  <TableCell
                    >{{
                      (
                        groupSessionsStats.averageSessionKeyEventRate / 100
                      ).toFixed(2)
                    }}%</TableCell
                  >
                  <TableCell>{{
                    $toCurrency(groupSessionsStats.totalRevenue / 100)
                  }}</TableCell>
                </TableRow>
                <TableRow
                  v-for="(group_session, index) in groupSessions"
                  :key="index"
                >
                  <TableCell>{{ index }}</TableCell>
                  <TableCell>{{ group_session.sessions }}</TableCell>
                  <TableCell>{{ group_session.engagedSessions }}</TableCell>
                  <TableCell
                    >{{ group_session.engagementRate.toFixed(2) }}%</TableCell
                  >
                  <TableCell>{{
                    formatDuration(group_session.averageEngagementDuration)
                  }}</TableCell>
                  <TableCell>{{
                    (group_session.eventsPerSession / 100).toFixed(2)
                  }}</TableCell>
                  <TableCell>{{ group_session.eventCount }}</TableCell>
                  <TableCell>{{ group_session.keyEvents }}</TableCell>
                  <TableCell
                    >{{
                      (group_session.sessionKeyEventRate / 100).toFixed(2)
                    }}%</TableCell
                  >
                  <TableCell>{{
                    $toCurrency(group_session.totalRevenue / 100)
                  }}</TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import Utils from '@/services/utils'
import { getLocalTimeZone, today } from "@internationalized/date";
import moment from "moment";
import "moment/dist/locale/pt-br";
import { useToast } from "@/components/ui/toast/use-toast";
import CustomChartTooltipPrice from "@/components/custom/CustomChartTooltipPrice.vue";
import CustomChartTooltipPercent from "@/components/custom/CustomChartTooltipPercent.vue";
import CustomChartTooltip from "@/components/custom/CustomChartTooltip.vue";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";
import { useWorkspaceStore } from "@/stores/workspace";

const workspaceStore = useWorkspaceStore();
const currentDate = today(getLocalTimeZone()).subtract({ days: 0 });
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });
const { toast } = useToast();

const loading = ref(true);
const usersPeriod = ref([]);
const totalUsersPeriod = ref([]);
const returningUsersPeriod = ref([]);
const firstTimePurchasersPeriod = ref([]);
const payingActivePeriod = ref([]);
const engagementRatePeriod = ref([]);
const totalRevenuePeriod = ref([]);
const engagementDurationSessionPeriod = ref([]);
const arppuPeriod = ref([]);
const arpuPeriod = ref([]);
const groupSessions = ref([]);
const groupSessionsStats = computed(() => {
  const sessionsArray = Object.values(groupSessions.value);

  const totalSessions = sessionsArray.reduce(
    (acc, session) => acc + session.sessions,
    0
  );
  const totalEngagedSessions = sessionsArray.reduce(
    (acc, session) => acc + session.engagedSessions,
    0
  );
  const totalEventCount = sessionsArray.reduce(
    (acc, session) => acc + session.eventCount,
    0
  );
  const totalKeyEvents = sessionsArray.reduce(
    (acc, session) => acc + session.keyEvents,
    0
  );
  const totalRevenue = sessionsArray.reduce(
    (acc, session) => acc + session.totalRevenue,
    0
  );

  const count = sessionsArray.length;
  const averageEngagementRate =
    count > 0
      ? sessionsArray.reduce(
          (acc, session) => acc + session.engagementRate,
          0
        ) / count
      : 0;
  const averageEngagementDuration =
    count > 0
      ? sessionsArray.reduce(
          (acc, session) => acc + session.averageEngagementDuration,
          0
        ) / count
      : 0;
  const averageEventsPerSession =
    count > 0
      ? sessionsArray.reduce(
          (acc, session) => acc + session.eventsPerSession,
          0
        ) / count
      : 0;
  const averageSessionKeyEventRate =
    count > 0
      ? sessionsArray.reduce(
          (acc, session) => acc + session.sessionKeyEventRate,
          0
        ) / count
      : 0;

  return {
    totalSessions,
    totalEngagedSessions,
    averageEngagementRate,
    averageEngagementDuration,
    averageEventsPerSession,
    totalEventCount,
    totalKeyEvents,
    averageSessionKeyEventRate,
    totalRevenue,
  };
});

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
    const data = await Utils.getGoogleAnalytics({
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
      filter_id: workspaceStore.activeGroupProject.id,
    })

    usersPeriod.value = data.data.users_period;
    totalUsersPeriod.value = data.data.total_users_period;
    returningUsersPeriod.value = data.data.returning_users_period;
    firstTimePurchasersPeriod.value = data.data.first_time_purchasers_period;
    payingActivePeriod.value = data.data.paying_active_period;
    engagementRatePeriod.value = data.data.engagement_rate_period;
    totalRevenuePeriod.value = data.data.total_revenue;
    engagementDurationSessionPeriod.value = data.data.engagement_duration_per_sessions;
    arppuPeriod.value = data.data.arppu;
    arpuPeriod.value = data.data.arpu;
    groupSessions.value = data.data.group_sessions;
  } catch (error) {
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  }

  loading.value = false;
};

const formatDuration = (averageEngagementDuration) => {
  const duration = moment.duration(averageEngagementDuration, "seconds");
  if (duration.asMinutes() < 1) {
    return `${duration.seconds()}s`;
  }
  return `${duration.minutes()}min ${duration.seconds()}s`;
};

onMounted(async () => {
  await applyFilter();
});
</script>

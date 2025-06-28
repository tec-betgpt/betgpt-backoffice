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
        <CustomDatePicker v-model="selectedRange"/>
      </div>
    </div>

    <div v-if="loading" class="grid gap-4 md:grid-cols-2 sm:grid-cols-1">
      <Card v-for="n in 8" :key="n">
        <CardHeader>
          <Skeleton class="h-6 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton class="pl-5 h-80 w-full" />
        </CardContent>
      </Card>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 sm:grid-cols-1">
      <UsersComponent :users-period="usersPeriod" />

      <PayingActivePeriodComponent :payingActivePeriod="payingActivePeriod" />

      <TotalUsersComponent :total-users-period="totalUsersPeriod" />

      <ReturningUsersPeriodComponent :returning-users-period="returningUsersPeriod" />

      <FirstTimePurchasersPeriodComponent :firstTimePurchasersPeriod="firstTimePurchasersPeriod" />

      <EngagementRatePeriodComponent :engagementRatePeriod="engagementRatePeriod" />

      <TotalRevenuePeriodComponent :totalRevenuePeriod="totalRevenuePeriod" />

      <EngagementDurationSessionPeriodComponent :engagementDurationSessionPeriod="engagementDurationSessionPeriod" />

      <ArpuPeriodComponent :arpuPeriod="arpuPeriod" />

      <ArppuPeriodComponent :arppuPeriod="arppuPeriod" />
    </div>

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
</template>

<script setup lang="ts">
import {ref, onMounted, computed, watch} from "vue";
import GoogleAnalytics from '@/services/googleAnalytics'
import { getLocalTimeZone, today } from "@internationalized/date";
import moment from "moment";
import "moment/dist/locale/pt-br";
import { useToast } from "@/components/ui/toast/use-toast";
import CustomChartTooltipPrice from "@/components/custom/CustomChartTooltipPrice.vue";
import CustomChartTooltipPercent from "@/components/custom/CustomChartTooltipPercent.vue";
import CustomChartTooltip from "@/components/custom/CustomChartTooltip.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import UsersComponent from "@/components/google_analytics/UsersComponent.vue";
import TotalUsersComponent from "@/components/google_analytics/TotalUsersComponent.vue";
import ReturningUsersPeriodComponent from "@/components/google_analytics/ReturningUsersPeriodComponent.vue";
import ArppuPeriodComponent from "@/components/google_analytics/ArppuPeriodComponent.vue";
import ArpuPeriodComponent from "@/components/google_analytics/ArpuPeriodComponent.vue";
import PayingActivePeriodComponent from "@/components/google_analytics/PayingActivePeriodComponent.vue";
import EngagementRatePeriodComponent from "@/components/google_analytics/EngagementRatePeriodComponent.vue";
import FirstTimePurchasersPeriodComponent from "@/components/google_analytics/FirstTimePurchasersPeriodComponent.vue";

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
    const data = await GoogleAnalytics.index({
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
watch(selectedRange,()=>{
  applyFilter()
})
</script>

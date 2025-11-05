<template>
  <div
    class="google-analytics-page space-y-6 p-10 max-[450px]:p-2 pb-16 w-full"
  >
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
              <TableHead>Variação</TableHead>
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
                <TableCell v-for="m in 11" :key="`loading-cell-${n}-${m}`">
                  <Skeleton class="h-4 w-full bg-gray-300" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else>
              <TableRow>
                <TableCell><b>Total</b></TableCell>
                <TableCell>{{ groupSessionsStats.totalSessions }}</TableCell>
                <TableCell>
                  <div
                    v-if="variationTotal !== null"
                    class="flex items-center gap-1"
                  >
                    <span
                      :class="{
                        'text-green-600': variationTotal > 0,
                        'text-red-600': variationTotal < 0,
                        'text-gray-500': variationTotal === 0,
                      }"
                      class="flex items-center gap-1"
                    >
                      <span v-if="variationTotal > 0">▲</span>
                      <span v-else-if="variationTotal < 0">▼</span>
                      <span>{{ Math.abs(variationTotal).toFixed(2) }}%</span>
                    </span>
                  </div>
                  <div v-else>—</div>
                </TableCell>

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
                  (groupSessionsStats.averageEventsPerSession / 100).toFixed(2)
                }}</TableCell>
                <TableCell>{{ groupSessionsStats.totalEventCount }}</TableCell>
                <TableCell>{{ groupSessionsStats.totalKeyEvents }}</TableCell>
                <TableCell
                  >{{
                    groupSessionsStats.averageSessionKeyEventRate.toFixed(2)
                  }}%</TableCell
                >
                <TableCell>{{
                  $toCurrency(groupSessionsStats.totalRevenue)
                }}</TableCell>
              </TableRow>
              <TableRow
                v-for="(group_session, index) in groupSessions"
                :key="index"
              >
                <TableCell>{{ index }}</TableCell>
                <TableCell>{{ group_session.sessions }}</TableCell>
                <TableCell>
                  <div
                    v-if="
                      group_session && group_session.variation !== undefined
                    "
                    class="flex items-center gap-1"
                  >
                    <span
                      :class="{
                        'text-green-600': group_session.variation > 0,
                        'text-red-600': group_session.variation < 0,
                        'text-gray-500': group_session.variation === 0,
                      }"
                      class="flex items-center gap-1"
                    >
                      <span v-if="group_session.variation > 0">▲</span>
                      <span v-else-if="group_session.variation < 0">▼</span>
                      <span
                        >{{
                          Math.abs(group_session.variation).toFixed(2)
                        }}%</span
                      >
                    </span>
                  </div>
                  <div v-else>—</div>
                </TableCell>
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
                    group_session.sessionKeyEventRate.toFixed(2)
                  }}%</TableCell
                >
                <TableCell>{{
                  $toCurrency(group_session.totalRevenue)
                }}</TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1">
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
import { ref, computed, watch } from "vue";
import GoogleAnalytics from "@/services/googleAnalytics";
import { getLocalTimeZone, today } from "@internationalized/date";
import moment from "moment";
import "moment/dist/locale/pt-br";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import PeriodComponent from "@/components/google_analytics/PeriodComponent.vue";

const workspaceStore = useWorkspaceStore();
const currentDate = today(getLocalTimeZone()).subtract({ days: 0 });
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });
const { toast } = useToast();

const loading = ref(true);
const usersPeriod = ref<{ name: string; value: number[] }[]>([]);
const totalUsersPeriod = ref<{ name: string; value: number[] }[]>([]);
const returningUsersPeriod = ref<{ name: string; value: number[] }[]>([]);
const firstTimePurchasersPeriod = ref<{ name: string; value: number[] }[]>([]);
const payingActivePeriod = ref<{ name: string; value: number[] }[]>([]);
const engagementRatePeriod = ref<{ name: string; value: number[] }[]>([]);
const totalRevenuePeriod = ref<{ name: string; value: number[] }[]>([]);
const engagementDurationSessionPeriod = ref<
  { name: string; value: number[] }[]
>([]);
const arppuPeriod = ref<{ name: string; value: number[] }[]>([]);
const arpuPeriod = ref<{ name: string; value: number[] }[]>([]);
const variationTotal = ref(0);
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
    });

    usersPeriod.value = [
      { name: "Usuários Novos", value: data.data.users_period },
      { name: "Usuários Ativos", value: data.data.users_period },
    ];
    totalUsersPeriod.value = [
      { name: "Total de Usuários", value: data.data.total_users_period },
    ];
    returningUsersPeriod.value = [
      { name: "Usuários Recorrentes", value: data.data.returning_users_period },
    ];
    firstTimePurchasersPeriod.value = [
      {
        name: "Primeiros Compradores",
        value: data.data.first_time_purchasers_period,
      },
    ];
    payingActivePeriod.value = [
      { name: "7 Dias", value: data.data.paying_active_period },
      { name: "14 Dias", value: data.data.paying_active_period },
      { name: "28 Dias", value: data.data.paying_active_period },
    ];
    engagementRatePeriod.value = [
      {
        name: "% Taxa de Engajamento",
        value: data.data.engagement_rate_period,
      },
    ];
    totalRevenuePeriod.value = [
      { name: "Receita", value: data.data.total_revenue },
    ];
    engagementDurationSessionPeriod.value = [
      {
        name: "Tempo médio",
        value: data.data.engagement_duration_per_sessions,
      },
    ];
    arppuPeriod.value = [{ name: "ARPPU", value: data.data.arppu }];
    arpuPeriod.value = [{ name: "ARPU", value: data.data.arpu }];
    groupSessions.value = data.data.group_sessions.channels;
    variationTotal.value = data.data.group_sessions.variation_total ?? 0;
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

watch(selectedRange, () => {
  applyFilter();
});
</script>

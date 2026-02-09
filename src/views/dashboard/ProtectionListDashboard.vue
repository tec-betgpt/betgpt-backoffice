<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart } from '@/components/ui/chart-line';
import { DonutChart } from '@/components/ui/chart-donut';
import { BarChart } from '@/components/ui/chart-bar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, ExclamationTriangleIcon, InfoCircledIcon } from '@radix-icons/vue';
import ProtectionLists from "@/services/protectionLists";
import {useWorkspaceStore} from "@/stores/workspace";

const loading = ref(false);
const dashboardData = ref(null);
const alertsData = ref([]);
const workspaceStore = useWorkspaceStore();

const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const projectId = workspaceStore.activeGroupProject?.id;
    if (projectId) {
        const [dashboard, alerts] = await Promise.all([
            ProtectionLists.dashboard({ project_id: projectId }),
            ProtectionLists.alerts({ project_id: projectId })
        ]);
        dashboardData.value = dashboard;
        alertsData.value = alerts;
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});

const temporalDynamicsData = computed(() => {
  if (!dashboardData.value?.temporal_dynamics) return [];
  return dashboardData.value.temporal_dynamics.map(item => ({
    date: item.date,
    entries: item.entries.total,
    exits: item.exits.total,
    balance: item.balance
  }));
});

const lastTrend = computed(() => {
  if (!dashboardData.value?.temporal_dynamics?.length) return null;
  const last = dashboardData.value.temporal_dynamics[dashboardData.value.temporal_dynamics.length - 1];
  return {
    trend: last.trend,
    balance: last.balance
  };
});

const byTypeData = computed(() => {
  if (!dashboardData.value?.by_type) return [];
  return dashboardData.value.by_type;
});

const byOriginData = computed(() => {
  if (!dashboardData.value?.by_origin) return [];
  return dashboardData.value.by_origin;
});

const byChannelData = computed(() => {
  if (!dashboardData.value?.by_channel) return [];
  return dashboardData.value.by_channel;
});

const byScopeData = computed(() => {
  if (!dashboardData.value?.by_scope) return [];
  const scope = dashboardData.value.by_scope;
  return [
    { name: 'Elevate (Global)', value: scope.elevate_global },
    { name: 'Grupo', value: Array.isArray(scope.group) ? scope.group.reduce((acc, curr) => acc + (curr.count || 0), 0) : 0 },
    { name: 'Projeto', value: Array.isArray(scope.project) ? scope.project.reduce((acc, curr) => acc + (curr.count || 0), 0) : 0 },
    { name: 'Identidade', value: scope.identity },
    { name: 'Contato', value: scope.contact }
  ];
});

const getTrendIcon = (trend) => {
  if (trend === 'growth') return ArrowUpIcon;
  if (trend === 'reduction') return ArrowDownIcon;
  return MinusIcon;
};

const getTrendColor = (trend) => {
  if (trend === 'growth') return 'text-red-500';
  if (trend === 'reduction') return 'text-green-500';
  return 'text-gray-500';
};

const getTrendLabel = (trend) => {
    if (trend === 'growth') return 'Crescimento';
    if (trend === 'reduction') return 'Redução';
    return 'Estável';
}

const getAlertVariant = (type) => {
    if (type === 'critical') return 'destructive';
    return 'default';
}

const getAlertIcon = (type) => {
    if (type === 'critical') return ExclamationTriangleIcon;
    return InfoCircledIcon;
}

</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold tracking-tight">Dashboard de Proteção</h1>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <div v-else-if="dashboardData" class="space-y-6">

      <!-- Alertas -->
      <div v-if="alertsData.length > 0" class="space-y-4">
        <Alert v-for="(alert, index) in alertsData" :key="index" :variant="getAlertVariant(alert.type)">
          <component :is="getAlertIcon(alert.type)" class="h-4 w-4" />
          <AlertTitle>{{ alert.title }}</AlertTitle>
          <AlertDescription>
            {{ alert.message }}
          </AlertDescription>
        </Alert>
      </div>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Volume Total Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.total_active }}</div>
            <p class="text-xs text-muted-foreground">
              Histórico: D-1: {{ dashboardData.history.d_1 }} | D-7: {{ dashboardData.history.d_7 }} | D-30: {{ dashboardData.history.d_30 }}
            </p>
          </CardContent>
        </Card>

        <Card v-if="lastTrend">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">Tendência Atual</CardTitle>
                <component :is="getTrendIcon(lastTrend.trend)" :class="['h-4 w-4', getTrendColor(lastTrend.trend)]" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">{{ getTrendLabel(lastTrend.trend) }}</div>
                <p class="text-xs text-muted-foreground">
                    Saldo Diário: {{ lastTrend.balance > 0 ? '+' : ''}}{{ lastTrend.balance }}
                </p>
            </CardContent>
        </Card>
      </div>

      <Tabs default-value="overview" class="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="temporal">Dinâmica Temporal</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="scope">Escopo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card class="col-span-4">
              <CardHeader>
                <CardTitle>Classificação por Tipo</CardTitle>
                <CardDescription>Distribuição de exclusões por tipo.</CardDescription>
              </CardHeader>
              <CardContent>
                 <BarChart
                  :data="byTypeData"
                  index="label"
                  :categories="['count']"
                  :colors="['#808080']"
                  :y-formatter="(tick) => `${tick}`"
                  class="h-[300px]"
                />
                <div class="mt-14 grid grid-cols-3 gap-4">
                  <div v-for="item in byTypeData" :key="item.type" class="flex flex-col text-center justify-center items-center p-2 border rounded">
                    <span class="text-sm font-medium">{{ item.label }}</span>
                    <span class="text-xl font-bold">{{ item.count }}</span>
                    <span class="text-xs text-muted-foreground">{{ item.percentage }}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card class="col-span-3">
              <CardHeader>
                <CardTitle>Classificação por Origem</CardTitle>
                <CardDescription>Origem das ações de proteção.</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart
                  :data="byOriginData"
                  index="origin"
                  category="count"
                  :colors="['#0ea5e9', '#22c55e', '#eab308', '#ef4444']"
                  class="h-[300px]"
                />
                <div class="mt-4 space-y-2">
                    <div v-for="item in byOriginData" :key="item.origin" class="flex justify-between items-center text-sm">
                        <span>{{ item.origin }}</span>
                        <div class="flex items-center gap-2">
                            <span class="font-bold">{{ item.count }}</span>
                            <span class="text-muted-foreground">({{ item.percentage }}%)</span>
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="temporal" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entradas, Saídas e Saldo Diário</CardTitle>
              <CardDescription>Acompanhamento diário da evolução da lista de proteção.</CardDescription>
            </CardHeader>
            <CardContent class="pl-2">
              <LineChart
                :data="temporalDynamicsData"
                index="date"
                :categories="['entries', 'exits', 'balance']"
                :colors="['#ef4444', '#22c55e', '#3b82f6']"
                :y-formatter="(tick) => `${tick}`"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" class="space-y-4">
          <div v-if="byChannelData.length" class="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card v-for="channel in byChannelData" :key="channel.channel" class="flex flex-col">
              <CardHeader>
                <div class="flex justify-between items-start">
                  <div>
                    <CardTitle class="capitalize">{{ channel.channel }}</CardTitle>
                    <CardDescription>Total Ativo: {{ channel.total_active }} ({{ channel.percentage }}%)</CardDescription>
                  </div>
                  <Badge variant="outline">{{ channel.predominant_type_label }}</Badge>
                </div>
              </CardHeader>
              <CardContent class="flex-1">
                <div class="space-y-4">
                    <LineChart
                      :data="channel.daily_history"
                      index="date"
                      :categories="['entries', 'exits']"
                      :colors="['#ef4444', '#22c55e']"
                      :show-legend="true"
                      :show-y-axis="false"
                      :show-x-axis="false"
                      :show-grid-line="false"
                    />
                </div>
              </CardContent>
            </Card>
          </div>
          <div v-else>
            <p class="text-center text-muted-foreground py-10">
              Nenhum dado por canal disponível.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="scope" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exclusões por Escopo</CardTitle>
            </CardHeader>
            <CardContent>
               <BarChart
                  :data="byScopeData"
                  index="name"
                  :categories="['value']"
                  :colors="['#8b5cf6']"
                  :y-formatter="(tick) => `${tick}`"
                />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

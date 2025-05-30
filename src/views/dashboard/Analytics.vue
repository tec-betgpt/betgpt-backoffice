<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Performance</h2>
      <p class="text-muted-foreground">
        Relatórios de performance de um período específico.
      </p>
    </div>
    <div class="flex items-center justify-end mb-3">
      <div class="flex items-center max-[450px]:flex-col gap-2 w-full">
        <div class="flex flex-col sm:flex-row gap-2 w-full">
          <CustomDatePicker v-model="selectedRange"/>

        </div>
      </div>
    </div>

    <div class="space-y-4">
      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Depósitos por período</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="depositsPeriod"
              index="date"
              :categories="['7D Depósitos', '14D Depósitos', '28D Depósitos']"
              :y-formatter="
                (tick) => (typeof tick === 'number' ? $toK(tick) : '')
              "
              :custom-tooltip="CustomChartTooltipRealPrice"
            />
          </div>
        </CardContent>
      </Card>

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
              :categories="['Usuários Ativos', 'Usuários Registrados']"
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

      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Porcentagem Net Depósitos por período</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="percentNetDepositsPeriod"
              index="date"
              :categories="[
                '7D % Net Depósitos',
                '14D % Net Depósitos',
                '28D % Net Depósitos',
              ]"
              :y-formatter="
                (tick, i) =>
                  typeof tick === 'number' ? `${(tick / 100).toFixed(0)}%` : ''
              "
              :custom-tooltip="CustomChartTooltipPercent"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Net Depósitos por período</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="netDepositsPeriod"
              index="date"
              :categories="[
                '7D Net Depósitos',
                '14D Net Depósitos',
                '28D Net Depósitos',
              ]"
              :y-formatter="
                (tick) => (typeof tick === 'number' ? $toK(tick) : '')
              "
              :custom-tooltip="CustomChartTooltipRealPrice"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Usuários Ativos por período</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="activeUsersPeriod"
              index="date"
              :categories="[
                '7D Usuários Ativos',
                '14D Usuários Ativos',
                '28D Usuários Ativos',
              ]"
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

      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Porcentagem FTD/Dia por período</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="percentFtdDayPeriod"
              index="date"
              :categories="['% de FTD/Dia']"
              :y-formatter="
                (tick, i) =>
                  typeof tick === 'number' ? `${(tick / 100).toFixed(0)}%` : ''
              "
              :custom-tooltip="CustomChartTooltipPercent"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Valor Net Depósitos por período</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="valueNetDepositsPeriod"
              index="date"
              :categories="['Net Depósitos']"
              :y-formatter="
                (tick) => (typeof tick === 'number' ? $toK(tick) : '')
              "
              :custom-tooltip="CustomChartTooltipRealPrice"
            />
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-4 md:grid-cols-6 lg:grid-cols-6 mb-3">
        <Card class="col-span-3">
          <CardHeader class="pb-3">
            <Skeleton class="h-6 w-full" v-if="loading" />
            <CardTitle v-else>Valor Depósitos por período</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading">
              <Skeleton class="pl-5 h-80 w-full" />
            </div>
            <div v-else>
              <LineChart
                :data="valueDepositsPeriod"
                index="date"
                :categories="['Depósitos']"
                :y-formatter="
                  (tick) => (typeof tick === 'number' ? $toK(tick) : '')
                "
                :custom-tooltip="CustomChartTooltipRealPrice"
              />
            </div>
          </CardContent>
        </Card>
        <Card class="col-span-3">
          <CardHeader class="pb-3">
            <Skeleton class="h-6 w-full" v-if="loading" />
            <CardTitle v-else>Valor Saques por período</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading">
              <Skeleton class="pl-5 h-80 w-full" />
            </div>
            <div v-else>
              <LineChart
                :data="valueWithdrawsPeriod"
                index="date"
                :categories="['Saques']"
                :y-formatter="
                  (tick) => (typeof tick === 'number' ? $toK(tick) : '')
                "
                :custom-tooltip="CustomChartTooltipRealPrice"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else
            >Taxa % Cadastro Depósito do Dia por período</CardTitle
          >
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="registrationDepositRatePeriod"
              index="date"
              :categories="['% Cadastro Depósito']"
              :y-formatter="
                (tick, i) =>
                  typeof tick === 'number' ? `${(tick / 100).toFixed(2)}%` : ''
              "
              :custom-tooltip="CustomChartTooltipPercent"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else
            >Porcentagem Conversão Depósitos Pagos por período</CardTitle
          >
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="depositConversionRatePeriod"
              index="date"
              :categories="['% Conversão Depósitos Pagos']"
              :y-formatter="
                (tick, i) =>
                  typeof tick === 'number' ? `${(tick / 100).toFixed(2)}%` : ''
              "
              :custom-tooltip="CustomChartTooltipPercent"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, watch} from "vue";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { LineChart } from "@/components/ui/chart-line";
import { useToast } from "@/components/ui/toast/use-toast";
import CustomChartTooltipRealPrice from "@/components/custom/CustomChartTooltipRealPrice.vue";
import CustomChartTooltipPrice from "@/components/custom/CustomChartTooltipPrice.vue";
import CustomChartTooltipPercent from "@/components/custom/CustomChartTooltipPercent.vue";
import CustomChartTooltip from "@/components/custom/CustomChartTooltip.vue";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";
import Analytics from "@/services/analytics";
import { useWorkspaceStore } from "@/stores/workspace";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";

const workspaceStore = useWorkspaceStore();
const currentDate = today(getLocalTimeZone()).subtract({ days: 1 });
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });
const { toast } = useToast();

const loading = ref(true);
const projects = ref(null);
const depositsPeriod = ref([]);
const usersPeriod = ref([]);
const percentNetDepositsPeriod = ref([]);
const netDepositsPeriod = ref([]);
const activeUsersPeriod = ref([]);
const percentFtdDayPeriod = ref([]);
const valueNetDepositsPeriod = ref([]);
const valueDepositsPeriod = ref([]);
const valueWithdrawsPeriod = ref([]);
const registrationDepositRatePeriod = ref([]);
const depositConversionRatePeriod = ref([]);

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
    const { data } = await Analytics.index({
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
      filter_id: workspaceStore.activeGroupProject.id,
    })

    depositsPeriod.value = data.deposits_period;
    usersPeriod.value = data.users_period;
    percentNetDepositsPeriod.value = data.percent_net_deposits_period;
    netDepositsPeriod.value = data.net_deposits_period;
    activeUsersPeriod.value = data.active_users_period;
    percentFtdDayPeriod.value = data.percent_ftd_day_period;
    valueNetDepositsPeriod.value = data.value_net_deposits_period;
    valueDepositsPeriod.value = data.value_deposits_period;
    valueWithdrawsPeriod.value = data.value_withdraws_period;

    registrationDepositRatePeriod.value = data.registration_deposit_rate_period;
    depositConversionRatePeriod.value = data.deposit_conversion_rate_period;
  } catch (error) {
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  }

  loading.value = false;
};
watch(selectedRange,()=>{
  applyFilter()
})


onMounted(async () => {
  await applyFilter();
});
</script>

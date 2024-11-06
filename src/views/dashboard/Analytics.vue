<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-3xl font-bold tracking-tight">Relatórios</h2>
      <div class="flex items-center space-x-2">
        <Select v-if="houses && houses.length" v-model="selectedHouse">
          <SelectTrigger class="w-[200px]">
            <SelectValue placeholder="Selecione uma casa" />
          </SelectTrigger>
          <SelectContent>
            <template v-for="(item, index) in houses" :key="index">
              <SelectItem :value="item.id">{{ item.name }}</SelectItem>
            </template>
          </SelectContent>
        </Select>
        <DateRangePicker v-model="selectedRange" />
        <Button @click="applyFilter">Filtrar</Button>
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

      <div class="grid gap-4 md:grid-cols-6 lg:grid-cols-6">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "@/services/api";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/chart-line";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomChartTooltipPrice from "@/components/ui/chart-line/CustomChartTooltipPrice.vue";
import CustomChartTooltipPercent from "@/components/ui/chart-line/CustomChartTooltipPercent.vue";
import CustomChartTooltip from "@/components/ui/chart-line/CustomChartTooltip.vue";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";

const currentDate = today(getLocalTimeZone());
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });
const selectedHouse = ref();

const loading = ref(true);
const houses = ref(null);
const depositsPeriod = ref([]);
const usersPeriod = ref([]);
const percentNetDepositsPeriod = ref([]);
const netDepositsPeriod = ref([]);
const activeUsersPeriod = ref([]);
const percentFtdDayPeriod = ref([]);
const valueNetDepositsPeriod = ref([]);
const valueDepositsPeriod = ref([]);
const valueWithdrawsPeriod = ref([]);

const loadContent = async () => {
  loading.value = true;
  try {
    let paramsQuery: {
      start_date: string | undefined;
      end_date: string | undefined;
      house_id?: string;
    } = {
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
    };

    if (selectedHouse.value) {
      paramsQuery.house_id = selectedHouse.value;
    }

    const response = await api.get("/utils/analytics", {
      params: paramsQuery,
    });

    depositsPeriod.value = response.data.data.deposits_period;
    usersPeriod.value = response.data.data.users_period;
    percentNetDepositsPeriod.value =
      response.data.data.percent_net_deposits_period;
    netDepositsPeriod.value = response.data.data.net_deposits_period;
    activeUsersPeriod.value = response.data.data.active_users_period;
    percentFtdDayPeriod.value = response.data.data.percent_ftd_day_period;
    valueNetDepositsPeriod.value = response.data.data.value_net_deposits_period;
    valueDepositsPeriod.value = response.data.data.value_deposits_period;
    valueWithdrawsPeriod.value = response.data.data.value_withdraws_period;

    if (response.data.data.houses !== undefined) {
      houses.value = response.data.data.houses;

      if (!selectedHouse.value) {
        selectedHouse.value = 1;
      }
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  } finally {
    loading.value = false;
  }
};

const applyFilter = () => {
  loadContent();
};

onMounted(() => {
  loadContent();
});
</script>

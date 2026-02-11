<template>
  <div class="google-analytics-page p-10 max-[450px]:p-0 pb-16 w-full">
    <div class="grid min-[900px]:grid-cols-2 gap-4 pb-10">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Performance</h2>
        <p class="text-muted-foreground">
          Relatórios de performance de um período específico.
        </p>
      </div>
      <div class="flex items-center justify-start w-full">
        <div class="flex flex-col items-center justify-end sm:flex-row gap-2 w-full">
          <CustomDatePicker v-model="selectedRange" />
        </div>
      </div>
    </div>
    <div class="grid xl:grid-cols-2 grid-cols-1 gap-4" >
      <PeriodComponent :period="usersPeriod" title="Usuários" :isLoading="isLoading" :glossary="meta['users_period'] || 'Dados de Usuários registrados e ativos'"/>
      <PeriodComponent :period="loginsDays" title="Logins diários" :isLoading="isLoading" :glossary="meta['player_logins_period'] || 'Dados de Logins diários'"/>
      <PeriodComponent :period="uniquePlayerLoginsPeriod" title="Logins únicos" :isLoading="isLoading" :glossary="meta['unique_player_logins_period'] || 'Usuários únicos que entraram no sistema por dia'"/>
      <PeriodComponent :period="depositsPeriod" title="Entrada por periodo" :isLoading="isLoading" :glossary="meta['deposits_period'] || 'Dados de entrada por período, com diferença de 7D, 14D e 28D'"/>
      <PeriodComponent :period="percentNetDepositsPeriod" title="Percentual de entradas líquidas por período" type="percent" class="xl:col-span-2" :isLoading="isLoading" :glossary="meta['percent_net_deposits_period'] || 'Percentual de entradas líquidas em relação ao total por período'"/>
      <PeriodComponent :period="netDepositsPeriod" title="Entradas Líquidas por período" :isLoading="isLoading" :glossary="meta['net_deposits_period'] || 'Valor líquido das entradas realizadas em cada período'"/>
      <PeriodComponent :period="activeUsersPeriod" title="Usuários Ativos por período" :isLoading="isLoading" :glossary="meta['active_users_period'] || 'Quantidade de usuários ativos em cada período'"/>
      <PeriodComponent :period="percentFtdDayPeriod" title="Percentual FTD por dia" type="percent" :isLoading="isLoading" :glossary="meta['percent_ftd_day_period'] || 'Percentual de First Time Deposits (FTD) por dia'"/>
      <PeriodComponent :period="valueNetDepositsPeriod" title="Valor de Entradas Líquidas por período" :isLoading="isLoading" :glossary="meta['value_net_deposits_period'] || 'Valor total das entradas líquidas por período'"/>
      <PeriodComponent :period="valueDepositsPeriod" title="Valor de Entradas por período" :isLoading="isLoading" :glossary="meta['value_deposits_period'] || 'Valor total das entradas realizadas por período'"/>
      <PeriodComponent :period="valueWithdrawsPeriod" title="Valor de Saídas por período" :isLoading="isLoading" :glossary="meta['value_withdraws_period'] || 'Valor total das saídas realizadas por período'"/>
      <PeriodComponent :period="registrationDepositRatePeriod" title="Taxa de Registro/Entrada por período" type="percent" :isLoading="isLoading" :glossary="meta['registration_deposit_rate_period'] || 'Percentual de usuários registrados que realizaram entrada por período'"/>
      <PeriodComponent :period="depositConversionRatePeriod" title="Taxa de Conversão de Entrada por período" type="percent" :isLoading="isLoading" :glossary="meta['deposit_conversion_rate_period'] || 'Percentual de conversão de entradas pagas por período'"/>    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {  getLocalTimeZone, today } from "@internationalized/date";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import Analytics from "@/services/analytics";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import PeriodComponent from "@/components/google_analytics/PeriodComponent.vue";

const workspaceStore = useWorkspaceStore();
const { toast } = useToast();

const currentDate = today(getLocalTimeZone()).subtract({ days: 1 });
const startDate = currentDate.subtract({ days: 28 });
const uniquePlayerLoginsPeriod = ref<{ name: string; value: number[] }[]>([]);
const selectedRange = ref({ start: startDate, end: currentDate });
const depositsPeriod = ref<{ name: string; value: number[] }[]>([]);
const loginsDays = ref<{ name: string; value: number[] }[]>([]);
const usersPeriod = ref<{ name: string; value: number[] }[]>([]);
const percentNetDepositsPeriod = ref<{ name: string; value: number[];  }[]>([]);
const netDepositsPeriod = ref<{ name: string; value: number[];  }[]>([]);
const activeUsersPeriod = ref<{ name: string; value: number[]; }[]>([]);
const percentFtdDayPeriod = ref<{ name: string; value: number[]; }[]>([]);
const valueNetDepositsPeriod = ref<{ name: string; value: number[]; }[]>([]);
const valueDepositsPeriod = ref<{ name: string; value: number[]}[]>([]);
const valueWithdrawsPeriod = ref<{ name: string; value: number[]; }[]>([]);
const registrationDepositRatePeriod = ref<{ name: string; value: number[]; }[]>([]);
const depositConversionRatePeriod = ref<{ name: string; value: number[]; }[]>([]);
const isLoading = ref(true);
const meta = ref<Record<string, string>>({});

const applyFilter = async () => {
  isLoading.value = true;

  if (!workspaceStore.activeGroupProject?.id) {
    toast({
      title: "Erro",
      description: "Selecione um grupo ou projeto antes de filtrar.",
      variant: "destructive",
    });

    isLoading.value = false;
    return;
  }

  try {
    const { data } = await Analytics.index({
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
      filter_id: workspaceStore.activeGroupProject.id,
    })
    meta.value = data.meta || {};
    let percent_net = data.percent_net_deposits_period.map(deposit => {
      return {date:deposit.date,["7 Dias %"]:deposit["7 Dias %"]/100,["14 Dias %"]:deposit["14 Dias %"]/100,["28 Dias %"]:deposit["28 Dias %"]/100};
    })
    let registration_deposit = data.registration_deposit_rate_period.map(deposit => {
      return {date:deposit.date,["% Entrada"]:deposit["% Entrada"]/100}  })
    let deposit_conversion = data.deposit_conversion_rate_period.map(deposit => {
      return {date:deposit.date,["% Saída"]:deposit["% Saída"]/100}  })
    let ftd = data.percent_ftd_day_period.map(deposit => {
      return {date:deposit.date,["FTD/Dia"]:deposit["FTD/Dia"]/100}  })
    let unique_logins = data.unique_player_logins_period.map(login => {
      return {date:login.date,["Logins únicos"]:login["Logins"]}
    })
    depositsPeriod.value = [{name:"7 Dias",value:data.deposits_period},{name:"14 Dias",value:data.deposits_period}, {name:"28 Dias",value:data.deposits_period}];
    usersPeriod.value = [{name:"Registrados",value:data.users_period}, {name:"Ativos",value:data.users_period}];
    percentNetDepositsPeriod.value = [{name:"7 Dias %",value:percent_net},{name:"14 Dias %",value:percent_net}, {name:"28 Dias %",value:percent_net}];
    netDepositsPeriod.value = [{name:"7 Dias",value:data.net_deposits_period},{name:"14 Dias",value:data.net_deposits_period}, {name:"28 Dias",value:data.net_deposits_period}];
    activeUsersPeriod.value = [{name:"7 Dias",value:data.active_users_period},{name:"14 Dias",value:data.active_users_period}, {name:"28 Dias",value:data.active_users_period}];
    percentFtdDayPeriod.value = [{name:"FTD/Dia",value:ftd}];
    valueNetDepositsPeriod.value = [{name:"Entradas",value:data.value_net_deposits_period}];
    valueDepositsPeriod.value = [{name:"Entradas",value:data.value_deposits_period}];
    valueWithdrawsPeriod.value = [{name:"Saídas",value:data.value_withdraws_period}];
    registrationDepositRatePeriod.value = [{name:"% Entrada",value:registration_deposit}];
    depositConversionRatePeriod.value = [{name:"% Saída",value:deposit_conversion}];
    loginsDays.value = [{name:"Logins",value:data.player_logins_period}];
    uniquePlayerLoginsPeriod.value = [{name:"Logins únicos",value:unique_logins}];
  } catch (error) {
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  }

  isLoading.value = false;
};

watch(selectedRange,() => {
  applyFilter()
})

</script>

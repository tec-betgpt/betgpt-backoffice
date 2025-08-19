<template>
  <div class="google-analytics-page p-10 max-[450px]:p-2 pb-16 w-full">
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
      <PeriodComponent :period="usersPeriod" title="Usuários" :isLoading="isLoading" glossary="Dados de Usuários registrados e ativos"/>
      <PeriodComponent :period="depositsPeriod" title="Deposito por periodo" :isLoading="isLoading" glossary="Dados de depósito por período, com diferença de 7D, 14D e 28D"/>
      <PeriodComponent :period="percentNetDepositsPeriod" title="Percentual de depósitos líquidos por período" type="percent" class="xl:col-span-2" :isLoading="isLoading" glossary="Percentual de depósitos líquidos em relação ao total por período"/>
      <PeriodComponent :period="netDepositsPeriod" title="Depósitos Líquidos por período" :isLoading="isLoading" glossary="Valor líquido dos depósitos realizados em cada período"/>
      <PeriodComponent :period="activeUsersPeriod" title="Usuários Ativos por período" :isLoading="isLoading" glossary="Quantidade de usuários ativos em cada período"/>
      <PeriodComponent :period="percentFtdDayPeriod" title="Percentual FTD por dia" type="percent" :isLoading="isLoading" glossary="Percentual de First Time Deposits (FTD) por dia"/>
      <PeriodComponent :period="valueNetDepositsPeriod" title="Valor de Depósitos Líquidos por período" :isLoading="isLoading" glossary="Valor total dos depósitos líquidos por período"/>
      <PeriodComponent :period="valueDepositsPeriod" title="Valor de Depósitos por período" :isLoading="isLoading" glossary="Valor total dos depósitos realizados por período"/>
      <PeriodComponent :period="valueWithdrawsPeriod" title="Valor de Saques por período" :isLoading="isLoading" glossary="Valor total dos saques realizados por período"/>
      <PeriodComponent :period="registrationDepositRatePeriod" title="Taxa de Registro/Depósito por período" type="percent" :isLoading="isLoading" glossary="Percentual de usuários registrados que realizaram depósito por período"/>
      <PeriodComponent :period="depositConversionRatePeriod" title="Taxa de Conversão de Depósito por período" type="percent" :isLoading="isLoading" glossary="Percentual de conversão de depósitos pagos por período"/>    </div>
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
import PeriodComponent from "@/components/google_analytics/PeriodComponent.vue";

const workspaceStore = useWorkspaceStore();
const currentDate = today(getLocalTimeZone()).subtract({ days: 1 });
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });
const { toast } = useToast();

const loading = ref(true);
const projects = ref(null);
const depositsPeriod = ref<{ name: string; value: number[] }[]>([]);
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

    depositsPeriod.value = [{name:"7D Depósitos",value:data.deposits_period},{name:"14D Depósitos",value:data.deposits_period}, {name:"28D Depósitos",value:data.deposits_period}];
    usersPeriod.value = [{name:"Usuários Registrados",value:data.users_period}, {name:"Usuários Ativos",value:data.users_period}];
    percentNetDepositsPeriod.value = [{name:"7D % Net Depósitos",value:data.percent_net_deposits_period},{name:"14D % Net Depósitos",value:data.percent_net_deposits_period}, {name:"28D % Net Depósitos",value:data.percent_net_deposits_period}];
    netDepositsPeriod.value = [{name:"7D Net Depósitos",value:data.net_deposits_period},{name:"14D Net Depósitos",value:data.net_deposits_period}, {name:"28D Net Depósitos",value:data.net_deposits_period}];
    activeUsersPeriod.value = [{name:"7D Usuários Ativos",value:data.active_users_period},{name:"14D Usuários Ativos",value:data.active_users_period}, {name:"28D Usuários Ativos",value:data.active_users_period}];
    percentFtdDayPeriod.value = [{name:"% de FTD/Dia",value:data.percent_ftd_day_period}];
    valueNetDepositsPeriod.value = [{name:"Net Depósitos",value:data.value_net_deposits_period}];
    valueDepositsPeriod.value = [{name:"Depósitos",value:data.value_deposits_period}];
    valueWithdrawsPeriod.value = [{name:"Saques",value:data.value_withdraws_period}];
    registrationDepositRatePeriod.value = [{name:"% Cadastro Depósito",value:data.registration_deposit_rate_period}];
    depositConversionRatePeriod.value = [{name:"% Conversão Depósitos Pagos",value:data.deposit_conversion_rate_period}];
  } catch (error) {
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  }

  isLoading.value = false;
};
watch(selectedRange,()=>{
  applyFilter()
})

</script>

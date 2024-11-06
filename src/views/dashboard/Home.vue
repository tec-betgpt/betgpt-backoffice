<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div class="flex items-center space-x-2" v-if="houses && houses.length">
        <Select v-model="selectedHouse">
          <SelectTrigger class="w-[200px]">
            <SelectValue placeholder="Selecione uma casa" />
          </SelectTrigger>
          <SelectContent>
            <template v-for="(item, index) in houses" :key="index">
              <SelectItem :value="item.id">{{ item.name }}</SelectItem>
            </template>
          </SelectContent>
        </Select>
        <Button @click="applyFilter">Filtrar</Button>
      </div>
    </div>
    <div
      v-if="loading"
      class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4"
    >
      <div v-for="n in 4" :key="n" class="p-4 bg-white rounded shadow">
        <div class="flex justify-between items-center mb-2">
          <Skeleton class="h-4 w-1/3" />
          <Skeleton class="h-4 w-5" />
        </div>
        <Skeleton class="h-8 w-2/3 mb-2" />
        <Skeleton class="h-4 w-1/2" />
      </div>
    </div>
    <div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4" v-else>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Jogadores</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">+{{ players.count }}</div>
          <p class="text-xs text-muted-foreground">
            {{
              players.percentage > 0
                ? "+" + players.percentage
                : players.percentage
            }}% do último mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Jogadores Ativos</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            class="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">+{{ activeNow.count }}</div>
          <p class="text-xs text-muted-foreground">
            +{{ activeNow.change }} desde o último dia
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Depósitos 7D</CardTitle>
          <CreditCard class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ $toCurrency(deposits.total / 100) }}
          </div>
          <p class="text-xs text-muted-foreground">
            {{
              deposits.percentage > 0
                ? "+" + deposits.percentage
                : deposits.percentage
            }}% da última semana
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Saques 7D</CardTitle>
          <HandCoins class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ $toCurrency(withdraws.total / 100) }}
          </div>
          <p class="text-xs text-muted-foreground">
            {{
              withdraws.percentage > 0
                ? "+" + withdraws.percentage
                : withdraws.percentage
            }}% da última semana
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-3">
      <Card class="col-span-4">
        <CardHeader>
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Quantidade de Depósitos</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-72 w-full" />
          </div>
          <div v-else>
            <BarChart
              :data="deposits.monthly_counts"
              :categories="['Total']"
              :index="'name'"
              :rounded-corners="4"
              :y-formatter="
                (tick, i) => {
                  return typeof tick === 'number'
                    ? `${new Intl.NumberFormat('pt-BR')
                        .format(tick)
                        .toString()}`
                    : '';
                }
              "
              :custom-tooltip="CustomChartTooltip"
            />
          </div>
        </CardContent>
      </Card>

      <Card class="col-span-3">
        <CardHeader>
          <Skeleton class="h-5 w-full mb-1" v-if="loading" />
          <CardTitle v-else>Últimos Depósitos</CardTitle>
          <CardDescription>
            <Skeleton class="h-5 w-full" v-if="loading" />
            <span v-else>
              Tiveram {{ deposits.count30days }} depósitos nos últimos 30 dias.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-4">
            <div v-for="n in 6" :key="n" class="flex items-center space-x-4">
              <Skeleton class="h-9 w-9 rounded-full" />
              <div class="flex-1 space-y-1">
                <Skeleton class="h-4 w-1/2" />
                <Skeleton class="h-4 w-1/3" />
              </div>
              <Skeleton class="h-4 w-10" />
            </div>
          </div>
          <div v-else class="space-y-8">
            <div
              v-for="deposit in deposits.lasts"
              :key="deposit.id"
              class="flex items-center"
            >
              <Avatar class="h-9 w-9">
                <AvatarFallback
                  >{{ deposit.player.name.charAt(0)
                  }}{{ deposit.player.name.charAt(1) }}</AvatarFallback
                >
              </Avatar>
              <div class="ml-4 space-y-1">
                <p class="text-sm font-medium leading-none">
                  {{ deposit.player.name }}
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ deposit.player.email }}
                </p>
              </div>
              <div class="ml-auto font-medium">
                +{{ $toCurrency(deposit.value / 100) }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useHouseStore } from "@/stores/house";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart } from "@/components/ui/chart-bar";
import CustomChartTooltip from "@/components/ui/chart-line/CustomChartTooltip.vue";
import { Users, CreditCard, HandCoins } from "lucide-vue-next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const houseStore = useHouseStore();
const selectedHouse = ref(houseStore.selectedHouse);

const players = ref({ count: 0, percentage: 0 });
const activeNow = ref({ count: 0, change: 0 });
const deposits = ref({
  total: 0,
  percentage: 0,
  last6: [],
  monthly_counts: [],
});
const withdraws = ref({ total: 0, percentage: 0 });
const houses = ref(null);
const loading = ref(true);

const loadContent = async () => {
  try {
    loading.value = true;

    let response;

    const houseId = houseStore.selectedHouse;

    if (houseId) {
      response = await api.get("/utils/home?house_id=" + houseId);
    } else {
      response = await api.get("/utils/home");
    }

    players.value = response.data.data.players;
    activeNow.value = response.data.data.active_now;
    deposits.value = response.data.data.deposits;
    withdraws.value = response.data.data.withdraws;

    if (response.data.data.houses !== undefined) {
      houses.value = response.data.data.houses;

      if (!selectedHouse.value) {
        selectedHouse.value = response.data.data.houses[0].id;
      }
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  } finally {
    loading.value = false;
  }
};

const applyFilter = () => {
  houseStore.setSelectedHouse(selectedHouse.value);
  loadContent();
};

onMounted(() => {
  loadContent();
});
</script>

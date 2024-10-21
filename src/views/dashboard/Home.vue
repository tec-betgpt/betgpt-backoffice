<template>
  <div>
    <div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"> Clientes </CardTitle>
          <Building2 class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">+{{ houses }}</div>
          <p class="text-xs text-muted-foreground">+0.0% do último mês</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"> Jogadores </CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">+{{ players }}</div>
          <p class="text-xs text-muted-foreground">+0.0% do último mês</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"> Depósitos </CardTitle>
          <CreditCard class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ $toCurrency(deposits) }}</div>
          <p class="text-xs text-muted-foreground">+0.0% da última semana</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"> Saques </CardTitle>
          <HandCoins class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ $toCurrency(withdraws) }}</div>
          <p class="text-xs text-muted-foreground">+0.0% da última semana</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CreditCard, HandCoins } from "lucide-vue-next";

const houses = ref(0);
const players = ref(0);
const deposits = ref(0);
const withdraws = ref(0);

const loadContent = async () => {
  try {
    const response = await api.get("/utils/home");
    houses.value = response.data.data.houses;
    players.value = response.data.data.players;
    deposits.value = response.data.data.deposits;
    withdraws.value = response.data.data.withdraws;
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  }
};

onMounted(() => {
  loadContent();
});
</script>

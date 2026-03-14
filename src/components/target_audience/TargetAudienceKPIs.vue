<template>
  <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-muted-foreground">Total de Públicos (Elevate)</CardTitle>
        <UsersIcon class="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </CardHeader>
      <CardContent>
        <div class="text-3xl font-bold">{{ kpis.totalElevate }}</div>
      </CardContent>
    </Card>

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-muted-foreground">Públicos Sincronizados (Meta)</CardTitle>
        <RefreshCcwIcon class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
      </CardHeader>
      <CardContent>
        <div class="text-3xl font-bold">{{ kpis.activeSyncs }}</div>
      </CardContent>
    </Card>

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-muted-foreground">Alcance Estimado Total (Meta)</CardTitle>
        <TargetIcon class="h-4 w-4 text-violet-600 dark:text-violet-400" />
      </CardHeader>
      <CardContent>
        <div class="text-3xl font-bold">{{ kpis.metaReach }}</div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, RefreshCcwIcon, TargetIcon } from "lucide-vue-next";

defineProps<{
  kpis: {
    totalElevate: number;
    activeSyncs: number;
    metaReach: string | number;
  };
}>();
</script>

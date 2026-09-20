<template>
  <GroupAnalyticsTab :group="group" />
</template>

<script setup lang="ts">
import GroupAnalyticsTab from "@/components/groups/GroupAnalyticsTab.vue";
import type { Group } from "@/contracts/group";

defineProps<{ group: Group }>();
</script>

<template>
  <GroupConsolidatedTab :group="group" />
</template>

<script setup lang="ts">
import GroupConsolidatedTab from "@/components/groups/GroupConsolidatedTab.vue";
import type { Group } from "@/contracts/group";

defineProps<{ group: Group }>();
</script>

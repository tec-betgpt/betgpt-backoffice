<template>
  <GroupDreTab :group="group" />
</template>

<script setup lang="ts">
import GroupDreTab from "@/components/groups/GroupDreTab.vue";
import type { Group } from "@/contracts/group";

defineProps<{ group: Group }>();
</script>

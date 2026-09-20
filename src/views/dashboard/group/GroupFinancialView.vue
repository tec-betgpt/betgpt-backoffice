<template>
  <GroupFinancialTab :group="group" :permissions="permissions" />
</template>

<script setup lang="ts">
import GroupFinancialTab from "@/components/groups/GroupFinancialTab.vue";
import type { Group } from "@/contracts/group";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

defineProps<{ group: Group; permissions: GroupPermissions }>();
</script>

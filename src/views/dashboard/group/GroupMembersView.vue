<template>
  <MembersTab
    :group="group"
    :permissions="permissions"
    @invite="emit('invite')"
  />
</template>

<script setup lang="ts">
import MembersTab from "@/components/groups/MembersTab.vue";
import type { Group } from "@/contracts/group";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{ (event: "invite"): void }>();
</script>

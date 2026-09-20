<template>
  <InvitationsTab
    :group="group"
    :permissions="permissions"
    @changed="emit('changed')"
    @invite="emit('invite')"
  />
</template>

<script setup lang="ts">
import InvitationsTab from "@/components/groups/InvitationsTab.vue";
import type { Group } from "@/contracts/group";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{
  (event: "changed"): void;
  (event: "invite"): void;
}>();
</script>

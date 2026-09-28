<template>
  <div class="space-y-4">
    <GroupProjectsView
      :group="group"
      :permissions="permissions"
      @changed="emit('changed')"
    />
    <GroupMembersView
      :group="group"
      :permissions="permissions"
      @invite="emit('invite')"
    />
    <GroupInvitationsView
      :group="group"
      :permissions="permissions"
      @changed="emit('changed')"
      @invite="emit('invite')"
    />
  </div>
</template>

<script setup lang="ts">
import GroupProjectsView from "@/views/dashboard/group/GroupProjectsView.vue";
import GroupMembersView from "@/views/dashboard/group/GroupMembersView.vue";
import GroupInvitationsView from "@/views/dashboard/group/GroupInvitationsView.vue";
import type { Group } from "@/contracts/group";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{
  (event: "changed"): void;
  (event: "invite"): void;
}>();
</script>

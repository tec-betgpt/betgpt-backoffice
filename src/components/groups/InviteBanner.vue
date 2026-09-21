<template>
  <div
    v-if="invitations.length"
    class="fixed bottom-6 left-1/2 z-[150] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 space-y-2"
  >
    <div
      v-for="invitation in invitations"
      :key="invitation.uuid"
      class="flex flex-col gap-1 rounded-lg border bg-background p-4 shadow-lg"
    >
      <p class="text-sm">
        {{
          $t("groups_invite_banner", {
            name: invitation.group?.name ?? `#${invitation.group_id}`,
            role: $t(`groups_role_${invitation.role}`),
          })
        }}
      </p>
      <p class="text-xs text-muted-foreground">
        {{ $t("groups_invite_use_email_link") }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGroupsStore } from "@/stores/groups";

const groupsStore = useGroupsStore();

const invitations = computed(() => groupsStore.pendingInvitations);
</script>

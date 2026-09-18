<template>
  <div
    v-if="invitations.length"
    class="fixed bottom-6 left-1/2 z-[150] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 space-y-2"
  >
    <div
      v-for="invitation in invitations"
      :key="invitation.uuid"
      class="flex flex-col gap-3 rounded-lg border bg-background p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-sm">
        {{
          $t("groups_invite_banner", {
            name: invitation.group?.name ?? `#${invitation.group_id}`,
            role: $t(`groups_role_${invitation.role}`),
          })
        }}
      </p>
      <div class="flex shrink-0 gap-2">
        <Button size="sm" variant="ghost" @click="decline(invitation.uuid)">
          {{ $t("groups_decline") }}
        </Button>
        <Button size="sm" @click="accept(invitation.uuid)">
          {{ $t("groups_accept") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { useGroupsStore } from "@/stores/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import { normalizeApiError } from "@/lib/apiError";

const { t } = useI18n();
const groupsStore = useGroupsStore();

const invitations = computed(() => groupsStore.pendingInvitations);

async function accept(uuid: string) {
  try {
    await groupsStore.acceptInvitation(uuid);
    toast(t("groups_invite_accepted"));
  } catch (error) {
    if (normalizeApiError(error).status === 422) {
      toast.error(t("groups_wrong_email"));
      return;
    }
    showApiErrorToast(error);
  }
}

async function decline(uuid: string) {
  try {
    await groupsStore.declineInvitation(uuid);
    toast(t("groups_invite_declined"));
  } catch (error) {
    showApiErrorToast(error);
  }
}
</script>
